'use client'

import dynamic from 'next/dynamic'

const ThreeBackground = dynamic(() => import('./ThreeBackground'), { ssr: false })

/* Camada de partículas Three.js da landing — client wrapper para
   permitir dynamic import (ssr: false) a partir de um Server Component. */
export default function LandingFx() {
  return <ThreeBackground pointOpacity={0.35} />
}
