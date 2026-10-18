'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { PointLight, SpotLight } from 'three'

interface LightingRigProps {
  quality: 'high' | 'low'
}

/**
 * Two rigged spotlights — electric violet and champagne — sweeping the stage
 * in slow, out-of-phase arcs, plus a breathing core light on the centrepiece.
 *
 * Shadows are intentionally disabled: real-time shadows are the most
 * expensive thing in the scene and the composition does not need them.
 */
export default function LightingRig({ quality }: LightingRigProps) {
  const violet = useRef<SpotLight>(null)
  const champagne = useRef<SpotLight>(null)
  const core = useRef<PointLight>(null)

  useFrame(state => {
    const t = state.clock.elapsedTime

    if (violet.current) {
      violet.current.position.x = -5.5 + Math.sin(t * 0.12) * 1.5
      violet.current.position.z = 3 + Math.cos(t * 0.12) * 1.3
      violet.current.intensity = (quality === 'high' ? 95 : 80) * (0.92 + Math.sin(t * 0.5) * 0.08)
    }

    if (champagne.current) {
      champagne.current.position.x = 5 + Math.cos(t * 0.1) * 1.3
      champagne.current.position.z = 2.4 + Math.sin(t * 0.1) * 1.2
      champagne.current.intensity = 70 * (0.9 + Math.cos(t * 0.4) * 0.1)
    }

    if (core.current) {
      core.current.intensity = 8 + Math.sin(t * 0.8) * 1.6
    }
  })

  return (
    <group>
      <ambientLight intensity={0.55} color="#2a2f45" />
      <hemisphereLight args={['#8b5cf6', '#08090d', 0.3]} />
      <directionalLight position={[6, 7, 6]} intensity={0.5} color="#c4b5fd" />

      <spotLight
        ref={violet}
        position={[-5.5, 7.5, 3]}
        angle={0.55}
        penumbra={0.85}
        distance={40}
        decay={1.6}
        intensity={95}
        color="#8b5cf6"
      />
      <spotLight
        ref={champagne}
        position={[5, 7, 2.4]}
        angle={0.5}
        penumbra={0.85}
        distance={40}
        decay={1.6}
        intensity={70}
        color="#f0b86e"
      />
      <pointLight ref={core} position={[0, 2.4, -1.2]} intensity={8} distance={14} decay={1.8} color="#8b5cf6" />
    </group>
  )
}
