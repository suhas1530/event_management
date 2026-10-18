'use client'

import { useMemo, useRef } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

interface StageGeometryProps {
  quality: 'high' | 'low'
}

/**
 * The sculptural centrepiece of the venue:
 *   - a raised stage platform with steps,
 *   - nested ceremonial arches (violet + champagne) behind it,
 *   - slowly rotating floating rings with a soft LED backdrop,
 *   - instanced pillar bars framing the stage.
 *
 * Emissive materials (`toneMapped={false}`) keep the silhouettes readable at
 * any lighting level while the spotlights sweep the scene.
 */
export default function StageGeometry({ quality }: StageGeometryProps) {
  const rings = useRef<Group>(null)

  const bars = useMemo(() => {
    const count = quality === 'high' ? 14 : 10
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      const radius = 4.6
      return [Math.sin(angle) * radius, 1.2, Math.cos(angle) * radius * 0.55 - 1.6] as [number, number, number]
    })
  }, [quality])

  useFrame(state => {
    if (rings.current) rings.current.rotation.y = state.clock.elapsedTime * 0.06
  })

  const ringSegments = quality === 'high' ? 96 : 64

  return (
    <group>
      {/* Stage platform */}
      <mesh position={[0, 0.3, -1.8]}>
        <boxGeometry args={[9.6, 0.6, 4.4]} />
        <meshStandardMaterial color="#151823" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Champagne lip along the stage front edge */}
      <mesh position={[0, 0.61, 0.4]}>
        <boxGeometry args={[9.6, 0.03, 0.08]} />
        <meshBasicMaterial color="#f0b86e" transparent opacity={0.5} />
      </mesh>

      {/* Steps down from the stage (instanced) */}
      <Instances limit={3}>
        <boxGeometry args={[3.6, 0.18, 0.42]} />
        <meshStandardMaterial color="#10121a" metalness={0.5} roughness={0.5} />
        <Instance position={[0, 0.45, 0.65]} />
        <Instance position={[0, 0.3, 1.05]} />
        <Instance position={[0, 0.15, 1.45]} />
      </Instances>

      {/* Pillar bars ringing the stage (instanced) */}
      <Instances limit={bars.length}>
        <boxGeometry args={[0.07, 2.6, 0.07]} />
        <meshStandardMaterial
          color="#1b1f2d"
          metalness={0.85}
          roughness={0.3}
          emissive="#8b5cf6"
          emissiveIntensity={0.08}
        />
        {bars.map((position, i) => (
          <Instance key={i} position={position} />
        ))}
      </Instances>

      {/* Nested arches behind the stage */}
      <group position={[0, 0.6, -3.4]}>
        <mesh>
          <torusGeometry args={[2.9, 0.055, 24, 64, Math.PI]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#8b5cf6"
            emissiveIntensity={1.4}
            metalness={0.4}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, 0.35]}>
          <torusGeometry args={[2.35, 0.035, 20, 56, Math.PI]} />
          <meshStandardMaterial
            color="#f0b86e"
            emissive="#f0b86e"
            emissiveIntensity={1.1}
            metalness={0.4}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Floating rings */}
      <group ref={rings} position={[0, 2.6, -1.4]}>
        <mesh rotation={[Math.PI / 2.6, 0.4, 0]}>
          <torusGeometry args={[3.3, 0.045, 16, ringSegments]} />
          <meshStandardMaterial
            color="#c4b5fd"
            emissive="#8b5cf6"
            emissiveIntensity={0.9}
            metalness={0.5}
            roughness={0.35}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, -0.5, 0.4]}>
          <torusGeometry args={[2.7, 0.03, 16, ringSegments]} />
          <meshStandardMaterial
            color="#f8d9a4"
            emissive="#f0b86e"
            emissiveIntensity={0.8}
            metalness={0.5}
            roughness={0.35}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Dark LED backdrop panel */}
      <mesh position={[0, 2.4, -4.6]}>
        <planeGeometry args={[8.4, 3.8]} />
        <meshBasicMaterial color="#0d0f1f" />
      </mesh>
    </group>
  )
}
