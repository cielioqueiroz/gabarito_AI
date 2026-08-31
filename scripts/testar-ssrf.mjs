import assert from 'node:assert/strict'
import { ipPublico } from '../lib/ssrf.ts'

for (const ip of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.1.1', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1']) {
  assert.equal(ipPublico(ip), false, `${ip} deveria ser bloqueado`)
}
for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) {
  assert.equal(ipPublico(ip), true, `${ip} deveria ser público`)
}

console.log('✓ classificação SSRF de endereços passou')
