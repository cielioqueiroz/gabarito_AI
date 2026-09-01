import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000'
const EMAIL = process.env.SCREENSHOT_EMAIL
const PASSWORD = process.env.SCREENSHOT_PASSWORD
const PUBLIC_ONLY = process.env.SCREENSHOT_PUBLIC_ONLY === '1'
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUTPUT_DIR = resolve('.github/screenshots')
const PORT = 9333
const PROFILE_DIR = join(tmpdir(), `gabarito-screenshots-${process.pid}`)

if (!PUBLIC_ONLY && (!EMAIL || !PASSWORD)) {
  throw new Error('Defina SCREENSHOT_EMAIL e SCREENSHOT_PASSWORD para capturar as telas autenticadas.')
}

await mkdir(OUTPUT_DIR, { recursive: true })

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE_DIR}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore', windowsHide: true })

let socket
let nextId = 0
const pending = new Map()

function wait(ms) {
  return new Promise(resolvePromise => setTimeout(resolvePromise, ms))
}

async function waitForDebugger() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const pages = await response.json()
      const page = pages.find(item => item.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {}
    await wait(250)
  }
  throw new Error('Chrome não abriu a porta de depuração a tempo.')
}

function send(method, params = {}) {
  return new Promise((resolvePromise, reject) => {
    const id = ++nextId
    pending.set(id, { resolve: resolvePromise, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
  return response.result?.value
}

async function waitFor(check, label, timeout = 20_000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeout) {
    if (await check()) return
    await wait(250)
  }
  throw new Error(`Tempo esgotado esperando: ${label}`)
}

async function navigate(path) {
  await send('Page.navigate', { url: new URL(path, BASE_URL).href })
  await waitFor(
    () => evaluate("document.readyState === 'complete'"),
    `carregamento de ${path}`,
  )
  await wait(900)
}

async function viewport(width, height, mobile = false) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  })
}

async function screenshot(name) {
  await wait(500)
  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  const outputPath = join(OUTPUT_DIR, name)
  const image = Buffer.from(data, 'base64')
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await writeFile(outputPath, image)
      break
    } catch (error) {
      if (attempt === 4) throw error
      await wait(250 * (attempt + 1))
    }
  }
  process.stdout.write(`✓ ${name}\n`)
}

async function clickByText(text) {
  return evaluate(`(() => {
    const target = [...document.querySelectorAll('button, a')]
      .find(element => element.textContent?.trim().includes(${JSON.stringify(text)}))
    if (!target) return false
    target.click()
    return true
  })()`)
}

try {
  const debuggerUrl = await waitForDebugger()
  socket = new WebSocket(debuggerUrl)
  await new Promise((resolvePromise, reject) => {
    socket.addEventListener('open', resolvePromise, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (!message.id || !pending.has(message.id)) return
    const task = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) task.reject(new Error(message.error.message))
    else task.resolve(message.result)
  })

  await send('Page.enable')
  await send('Runtime.enable')
  await viewport(1440, 1000)

  await navigate('/login')
  await screenshot('login.png')

  await navigate('/sobre')
  await screenshot('landing-hero.png')

  if (!PUBLIC_ONLY) {
    await navigate('/login')
    await evaluate(`(() => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      const fill = (selector, value) => {
        const input = document.querySelector(selector)
        setValue.call(input, value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
      fill('input[type="email"]', ${JSON.stringify(EMAIL)})
      fill('input[type="password"]', ${JSON.stringify(PASSWORD)})
      document.querySelector('form button[type="submit"]').click()
    })()`)
    await waitFor(
      () => evaluate("location.pathname === '/'"),
      'autenticação da conta de demonstração',
      30_000,
    )
    await evaluate(`
      localStorage.setItem('gab:onboarding-done', '1')
      localStorage.setItem('gab:pwa-install-dismissed', '1')
      localStorage.setItem('gab:notif-asked', '1')
      location.reload()
    `)
    await waitFor(() => evaluate("document.readyState === 'complete'"), 'dashboard sem onboarding')
    await wait(1_200)
    await screenshot('dashboard.png')

    if (await clickByText('Novo concurso')) {
      await waitFor(
        () => evaluate("document.body.innerText.includes('Criar e gerar plano com IA') || document.body.innerText.includes('Criar concurso')"),
        'formulário de novo concurso',
      )
      await screenshot('novo-concurso.png')
    }

    await navigate('/')
    const concursoUrl = await evaluate("document.querySelector('a[href^=\"/concurso/\"]')?.href")
    if (!concursoUrl) throw new Error('A conta de demonstração não possui concurso para os prints.')

    await send('Page.navigate', { url: concursoUrl })
    await waitFor(() => evaluate("document.readyState === 'complete'"), 'página do concurso')
    await wait(1_000)
    await screenshot('plano.png')

    if (!(await clickByText('Questões'))) throw new Error('A aba Questões não foi encontrada.')
    await wait(900)
    await screenshot('questoes-da-prova.png')

    await navigate('/estatisticas')
    await screenshot('estatisticas.png')

    await viewport(390, 844, true)
    await navigate('/')
    await screenshot('mobile.png')
  }
} finally {
  socket?.close()
  chrome.kill()
  await Promise.race([
    new Promise(resolvePromise => chrome.once('exit', resolvePromise)),
    wait(3_000),
  ])
  await rm(PROFILE_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 })
}
