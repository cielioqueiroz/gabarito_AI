// Flat config (ESLint 9). Substitui o .eslintrc.json: o Next 16 removeu o
// comando `next lint` e, com ele, o suporte ao formato antigo — `next lint`
// passou a ser lido como "rodar o Next na pasta ./lint", saindo com código 0
// sem lintar nada. O script "lint" chama o ESLint direto.
//
// O eslint-config-next desta versão já exporta flat config, então é importado
// direto, sem FlatCompat.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', '.vercel/**', 'public/**'],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
]

export default config
