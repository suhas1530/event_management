'use client'

import { MeshReflectorMaterial } from '@react-three/drei'

interface VenueEnvironmentProps {
  quality: 'high' | 'low'
}

/**
 * The room itself: a polished, softly reflecting floor, a distant back wall
 * and two side columns that frame the stage and add atmospheric depth.
 *
 * The floor uses drei's `MeshReflectorMaterial` with a blurred, low-resolution
 * reflection — a fraction of the cost of real planar reflections.
 */
export default function VenueEnvironment({ quality }: VenueEnvironmentProps) {
  return (
    <group>
      {/* Polished floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]}>
        <planeGeometry args={[46, 34]} />
        <MeshReflectorMaterial
          blur={[280, 90]}
          resolution={quality === 'high' ? 1024 : 512}
          mixBlur={0.9}
          mixStrength={26}
          roughness={0.85}
          depthScale={1.1}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.3}
          color="#0a0b12"
          metalness={0.55}
          mirror={0.55}
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 6, -13]}>
        <planeGeometry args={[70, 22]} />
        <meshStandardMaterial color="#0a0b11" roughness={0.95} metalness={0.1} />
      </mesh>

      {/* Side columns */}
      {[-8.5, 8.5].map(x => (
        <mesh key={x} position={[x, 4, -4]}>
          <boxGeometry args={[0.9, 9, 0.9]} />
          <meshStandardMaterial color="#10121a" metalness={0.7} roughness={0.45} />
        </mesh>
      ))}
    </group>
  )
}
