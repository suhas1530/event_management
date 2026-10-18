'use client'

import { useFrame, useThree } from '@react-three/fiber'

interface CameraControllerProps {
  /** 0..1 hero scroll progress written by the homepage's ScrollTrigger. */
  scrollProgress?: { current: number }
  /** Cursor parallax — disabled on touch devices. */
  interactive?: boolean
}

/**
 * Drives the hero camera entirely through refs and per-frame math so no React
 * state updates happen inside the render loop.
 *
 * Composition: a base framing shot of the stage, pointer parallax on desktop,
 * and a dolly-in as the visitor scrolls the hero away.
 */
export default function CameraController({ scrollProgress, interactive = true }: CameraControllerProps) {
  const { camera } = useThree()

  useFrame((state, delta) => {
    const damp = 1 - Math.exp(-delta * 3)

    const progress = scrollProgress ? Math.min(1, Math.max(0, scrollProgress.current)) : 0
    const px = interactive ? state.pointer.x : 0
    const py = interactive ? state.pointer.y : 0

    const targetX = px * 0.8
    const targetY = 1.65 + py * 0.4 + progress * 1.5
    const targetZ = 9 - progress * 3.6

    camera.position.x += (targetX - camera.position.x) * damp
    camera.position.y += (targetY - camera.position.y) * damp
    camera.position.z += (targetZ - camera.position.z) * damp

    camera.lookAt(0, 1.15 - progress * 0.15, -1.6)
  })

  return null
}
