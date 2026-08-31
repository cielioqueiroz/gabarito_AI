// Torna o fundo branco dos logos transparente, preservando as cores originais.
// Só mexe no canal alpha de pixels quase-brancos; as cores da marca ficam intactas.
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const files = ['cebraspe', 'fgv', 'cesgranrio', 'ibfc'].map(n => `public/bancas/${n}.png`)

for (const file of files) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info // 4 (RGBA)
  let cleared = 0
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    if (a === 0) continue
    const min = Math.min(r, g, b)
    const max = Math.max(r, g, b)
    // Quase-branco (claro e sem saturação) → totalmente transparente.
    if (min >= 240 && max - min <= 12) { data[i + 3] = 0; cleared++; continue }
    // Faixa de transição (205–240): esmaece o alpha para não deixar halo branco.
    if (min >= 205 && max - min <= 16) {
      const factor = (240 - min) / 35 // 1→transparente perto de 205, 0 perto de 240
      data[i + 3] = Math.round(a * factor)
    }
  }
  const out = await sharp(data, { raw: { width, height, channels } }).png().toBuffer()
  writeFileSync(file, out)
  console.log(`${file}: ${width}x${height}, ${cleared} px branco→transparente`)
}
