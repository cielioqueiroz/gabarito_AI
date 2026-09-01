/* Campos de metadata compartilhados entre segmentos.

   O Next mescla `metadata` de forma *rasa*: uma página que declara `openGraph`
   (ou `twitter`) descarta o objeto inteiro do layout — inclusive o banner que o
   next/og gera a partir de app/opengraph-image.tsx. O resultado é um link que
   viaja sem imagem, e nada no build acusa isso.

   Toda página que sobrescrever esses campos precisa espalhar estas constantes
   de volta. Ver docs do Next: generate-metadata → "Overwriting fields".

   As URLs são relativas de propósito: o `metadataBase` do layout as resolve
   para o domínio de produção. */

export const ogImage = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'gabarito_AI — transforme o edital em plano de estudos',
}

export const twitterImage = {
  url: '/twitter-image',
  width: 1200,
  height: 630,
  alt: 'gabarito_AI — transforme o edital em plano de estudos',
}
