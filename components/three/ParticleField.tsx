'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleFieldProps {
  /** Number of floating dust particles. Scaled down on low-end devices. */
  count?: number
  animated?: boolean
}

/**
 * Floating dust motes catching the stage light.
 *
 * One `THREE.Points` draw call for the whole field; the slow rotation and
 * vertical drift are applied to the parent group, not per particle.
 */
export default function ParticleField({ count = 800, animated = true }: ParticleFieldProps) {
  const group = useRef<THREE.Group>(null)

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3
      array[i3] = (Math.random() - 0.5) * 24
      array[i3 + 1] = Math.random() * 8 + 0.4
      array[i3 + 2] = (Math.random() - 0.5) * 16 - 2
    }
    return array
  }, [count])

  useFrame(state => {
    if (!animated || !group.current) return
    const t = state.clock.elapsedTime
    group.current.rotation.y = t * 0.012
    group.current.position.y = Math.sin(t * 0.18) * 0.18
  })

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#c4b5fd"
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
