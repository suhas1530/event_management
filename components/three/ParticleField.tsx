'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleFieldProps {
  /** Number of floating dust particles. Scaled down on low-end devices. */
  count?: number
  /** Particle colour — champagne in the hall, soft white in daylight. */
  color?: string
  /** Horizontal centre of the field; spread is applied around it. */
  centerX?: number
  /** Size of each mote. */
  size?: number
  animated?: boolean
}

/**
 * Floating dust motes catching the light.
 *
 * One `THREE.Points` draw call for the whole field; the slow rotation and
 * vertical drift are applied to the parent group, never per particle.
 */
export default function ParticleField({
  count = 600,
  color = '#d5ae79',
  centerX = 0,
  size = 0.045,
  animated = true,
}: ParticleFieldProps) {
  const group = useRef<THREE.Group>(null)

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3
      array[i3] = centerX + (Math.random() - 0.5) * 15
      array[i3 + 1] = Math.random() * 6.5 + 0.4
      array[i3 + 2] = (Math.random() - 0.5) * 12 - 1.5
    }
    return array
  }, [count, centerX])

  useFrame(state => {
    if (!animated || !group.current) return
    const t = state.clock.elapsedTime
    group.current.position.y = Math.sin(t * 0.16) * 0.16
    group.current.rotation.y = t * 0.006
  })

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={size}
          color={color}
          transparent
          opacity={0.45}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
