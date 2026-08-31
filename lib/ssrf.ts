import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

function ipv4Mapeado(address: string): string | null {
  const sufixo = address.toLowerCase().slice(7)
  if (sufixo.includes('.')) return sufixo
  const partes = sufixo.split(':')
  if (partes.length !== 2) return null
  const alto = Number.parseInt(partes[0], 16)
  const baixo = Number.parseInt(partes[1], 16)
  if (!Number.isFinite(alto) || !Number.isFinite(baixo)) return null
  return `${alto >> 8}.${alto & 255}.${baixo >> 8}.${baixo & 255}`
}

export function ipPublico(address: string): boolean {
  const versao = isIP(address)
  if (versao === 4) {
    const [a, b, c] = address.split('.').map(Number)
    return !(
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    )
  }
  if (versao !== 6) return false

  const normalizado = address.toLowerCase()
  if (normalizado.startsWith('::ffff:')) {
    const mapeado = ipv4Mapeado(normalizado)
    return mapeado ? ipPublico(mapeado) : false
  }
  return normalizado !== '::' && normalizado !== '::1' &&
    !normalizado.startsWith('fc') && !normalizado.startsWith('fd') &&
    !/^fe[89ab]/.test(normalizado)
}

export async function validarUrlPublica(raw: string): Promise<URL> {
  const url = new URL(raw)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Só http(s).')
  const host = url.hostname.toLowerCase()
  const hostSemColchetes = host.replace(/^\[|\]$/g, '')
  if (isIP(hostSemColchetes) || /^[0-9x.]+$/.test(host)) throw new Error('Use um domínio, não um IP.')
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Endereço interno não permitido.')
  }

  const enderecos = await lookup(host, { all: true, verbatim: true })
  if (!enderecos.length || enderecos.some(({ address }) => !ipPublico(address))) {
    throw new Error('O domínio resolve para um endereço não público.')
  }
  return url
}
