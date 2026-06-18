'use client'

import { useEffect, useRef } from 'react'

export default function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let animId: number
    const canvas = canvasRef.current
    if (!canvas) return

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

      const mat = new THREE.PointsMaterial({
        color: 0x2563eb,
        size: 0.04,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
      })

      const points = new THREE.Points(geo, mat)
      scene.add(points)

      // Ambient floating orbs
      const orbGeo = new THREE.SphereGeometry(1.4, 32, 32)
      const orbMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.04, wireframe: false })
      const orb1   = new THREE.Mesh(orbGeo, orbMat)
      orb1.position.set(-3, 1, -2)
      scene.add(orb1)

      const orb2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.05 })
      )
      orb2.position.set(3, -1.5, -1)
      scene.add(orb2)

      let t = 0
      function animate() {
        animId = requestAnimationFrame(animate)
        t += 0.003
        points.rotation.y = t * 0.08
        points.rotation.x = t * 0.04
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
        renderer.dispose()
        geo.dispose()
        mat.dispose()
        orbGeo.dispose()
        orbMat.dispose()
      }
    }

    let cleanup: (() => void) | undefined
    init().then(fn => { cleanup = fn })

    return () => {
      cancelAnimationFrame(animId)
      cleanup?.()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}
