'use client'

import { useEffect, useRef } from 'react'

interface Props {
  /** Cor dos pontos (hex numérico). Padrão: marca-texto. */
  pointColor?: number
  /** Cores dos orbes ambientes. */
  orbColorA?: number
  orbColorB?: number
  /** Opacidade dos pontos (0–1). */
  pointOpacity?: number
  className?: string
}

export default function ThreeBackground({
  pointColor  = 0x4a72e8,
  orbColorA   = 0x34343f,
  orbColorB   = 0x4a72e8,
  pointOpacity = 0.5,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let animId: number
    const canvas = canvasRef.current
    if (!canvas) return
    // Sem animação para quem pediu para reduzir movimento.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let THREE: typeof import('three')

    async function init() {
      THREE = await import('three')

      const renderer = new THREE.WebGLRenderer({ canvas: canvas!, antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x000000, 0)

      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
      camera.position.z = 5

      // Particle system
      const count = 900
      const positions = new Float32Array(count * 3)
      const sizes = new Float32Array(count)
      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 22
        positions[i * 3 + 1] = (Math.random() - 0.5) * 22
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10
        sizes[i] = Math.random() * 2 + 0.5
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      // Sprite circular com borda suave — sem ele os pontos rendem
      // como quadrados, que viram blocos ao chegar perto da câmera.
      const spriteCanvas = document.createElement('canvas')
      spriteCanvas.width = spriteCanvas.height = 64
      const ctx = spriteCanvas.getContext('2d')!
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      grad.addColorStop(0, 'rgba(255,255,255,1)')
      grad.addColorStop(0.4, 'rgba(255,255,255,0.8)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 64, 64)
      const sprite = new THREE.CanvasTexture(spriteCanvas)

      const mat = new THREE.PointsMaterial({
        color: pointColor,
        size: 0.05,
        map: sprite,
        transparent: true,
        opacity: pointOpacity,
        sizeAttenuation: true,
        depthWrite: false,
      })

      const points = new THREE.Points(geo, mat)
      scene.add(points)

      // Ambient floating orbs
      const orbGeo = new THREE.SphereGeometry(1.4, 32, 32)
      const orbMat = new THREE.MeshBasicMaterial({ color: orbColorA, transparent: true, opacity: 0.05 })
      const orb1   = new THREE.Mesh(orbGeo, orbMat)
      orb1.position.set(-3, 1, -2)
      scene.add(orb1)

      const orb2Geo = new THREE.SphereGeometry(0.9, 32, 32)
      const orb2Mat = new THREE.MeshBasicMaterial({ color: orbColorB, transparent: true, opacity: 0.04 })
      const orb2 = new THREE.Mesh(orb2Geo, orb2Mat)
      orb2.position.set(3, -1.5, -1)
      scene.add(orb2)

      // Parallax suave com o mouse
      let targetX = 0
      let targetY = 0
      function onPointer(e: PointerEvent) {
        targetX = (e.clientX / window.innerWidth - 0.5) * 0.4
        targetY = (e.clientY / window.innerHeight - 0.5) * 0.3
      }
      window.addEventListener('pointermove', onPointer, { passive: true })

      let t = 0
      function animate() {
        animId = requestAnimationFrame(animate)
        t += 0.003
        points.rotation.y = t * 0.08 + targetX * 0.15
        points.rotation.x = t * 0.04 + targetY * 0.15
        camera.position.x += (targetX - camera.position.x) * 0.03
        camera.position.y += (-targetY - camera.position.y) * 0.03
        orb1.position.y = 1 + Math.sin(t * 0.8) * 0.3
        orb2.position.y = -1.5 + Math.cos(t * 0.6) * 0.25
        renderer.render(scene, camera)
      }
      animate()

      function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', onResize)

      return () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', onResize)
        window.removeEventListener('pointermove', onPointer)
        renderer.dispose()
        geo.dispose()
        mat.dispose()
        sprite.dispose()
        orbGeo.dispose()
        orbMat.dispose()
        orb2Geo.dispose()
        orb2Mat.dispose()
      }
    }

    let cleanup: (() => void) | undefined
    init().then(fn => { cleanup = fn })

    return () => {
      cancelAnimationFrame(animId)
      cleanup?.()
    }
  }, [pointColor, orbColorA, orbColorB, pointOpacity])

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'fixed inset-0 w-full h-full pointer-events-none z-0'}
    />
  )
}
