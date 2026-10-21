'use client'

import { Instance, Instances, MeshReflectorMaterial } from '@react-three/drei'
import { CELEBRATION_X, HOME_X } from './world-config'

interface SharedArchitectureProps {
  quality: 'high' | 'low'
}

/**
 * The architecture both zones share.
 *
 * Heptome serves special occasions and everyday home needs, and the 3D world
 * says that structurally: one building, two wings, joined by a colonnade the
 * camera travels through. The celebration wing keeps a polished dark stone
 * floor, the home wing a warm oak floor, and a champagne threshold strip marks
 * the point where the two meet.
 */
export default function SharedArchitecture({ quality }: SharedArchitectureProps) {
  const columns = quality === 'high' ? 4 : 3
  const beamPositions = [-6, -3, 0, 3, 6]

  return (
    <group>
      {/* ── Floors ──────────────────────────────────────────────────── */}
      {/* Celebration wing: polished dark stone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CELEBRATION_X, 0, -0.5]}>
        <planeGeometry args={[19, 22]} />
        {quality === 'high' ? (
          <MeshReflectorMaterial
            blur={[260, 80]}
            resolution={768}
            mixBlur={0.85}
            mixStrength={18}
            roughness={0.8}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#1a1721"
            metalness={0.5}
            mirror={0.45}
          />
        ) : (
          <meshStandardMaterial color="#1a1721" roughness={0.7} metalness={0.35} />
        )}
      </mesh>

      {/* Home wing: warm oak flooring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[HOME_X, 0, -0.5]}>
        <planeGeometry args={[19, 22]} />
        {quality === 'high' ? (
          <MeshReflectorMaterial
            blur={[280, 90]}
            resolution={640}
            mixBlur={0.9}
            mixStrength={9}
            roughness={0.9}
            depthScale={1}
            minDepthThreshold={0.5}
            maxDepthThreshold={1.4}
            color="#6b5238"
            metalness={0.15}
            mirror={0.22}
          />
        ) : (
          <meshStandardMaterial color="#6b5238" roughness={0.85} metalness={0.1} />
        )}
      </mesh>

      {/* Champagne threshold where the wings meet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -0.5]}>
        <planeGeometry args={[0.5, 22]} />
        <meshStandardMaterial color="#d5ae79" emissive="#d5ae79" emissiveIntensity={0.25} roughness={0.4} />
      </mesh>

      {/* ── Walls ───────────────────────────────────────────────────── */}
      {/* Celebration back wall */}
      <mesh position={[CELEBRATION_X, 4.2, -4.6]}>
        <planeGeometry args={[19, 8.4]} />
        <meshStandardMaterial color="#15121b" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Home back wall with the daylight window */}
      <mesh position={[HOME_X, 4.2, -4.6]}>
        <planeGeometry args={[19, 8.4]} />
        <meshStandardMaterial color="#e8e1d5" roughness={0.95} metalness={0.02} />
      </mesh>
      {/* Window frame + glazing (emissive so it reads as daylight, not a hole) */}
      <group position={[HOME_X - 1, 2.5, -4.5]}>
        <mesh>
          <planeGeometry args={[5.6, 3]} />
          <meshStandardMaterial color="#fdf6e6" emissive="#fff0cf" emissiveIntensity={0.65} roughness={0.6} />
        </mesh>
        <Instances limit={3}>
          <boxGeometry args={[5.8, 0.1, 0.14]} />
          <meshStandardMaterial color="#c8bfae" roughness={0.6} metalness={0.2} />
          <Instance position={[0, 1.55, 0.04]} />
          <Instance position={[0, -1.55, 0.04]} />
          <Instance position={[0, 0, 0.04]} />
        </Instances>
        <Instances limit={4}>
          <boxGeometry args={[0.1, 3.1, 0.14]} />
          <meshStandardMaterial color="#c8bfae" roughness={0.6} metalness={0.2} />
          <Instance position={[-2.9, 0, 0.04]} />
          <Instance position={[2.9, 0, 0.04]} />
          <Instance position={[-0.95, 0, 0.04]} />
          <Instance position={[0.95, 0, 0.04]} />
        </Instances>
      </group>

      {/* Side walls */}
      {[CELEBRATION_X - 9.4, HOME_X + 9.4].map(x => (
        <mesh key={x} position={[x, 4, -1]}>
          <boxGeometry args={[0.4, 8, 18]} />
          <meshStandardMaterial color="#1d1926" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}

      {/* ── Colonnade: the shared threshold between the two zones ────── */}
      <group position={[0, 0, -1]}>
        {Array.from({ length: columns }, (_, i) => {
          const z = -2.6 + (i / Math.max(1, columns - 1)) * 5.2
          return [-1.5, 1.5].map(x => (
            <mesh key={`${x}-${z}`} position={[x, 2.1, z]}>
              <cylinderGeometry args={[0.17, 0.2, 4.2, quality === 'high' ? 16 : 10]} />
              <meshStandardMaterial color="#3b3448" metalness={0.35} roughness={0.55} />
            </mesh>
          ))
        })}

        {/* Lintel beams */}
        <Instances limit={beamPositions.length}>
          <boxGeometry args={[4.2, 0.24, 0.3]} />
          <meshStandardMaterial color="#2a2534" metalness={0.3} roughness={0.6} />
          {beamPositions.map((z, i) => (
            <Instance key={i} position={[0, 4.3, z * 0.65 - 0.5]} />
          ))}
        </Instances>

        {/* Half arch crowning the threshold */}
        <mesh position={[0, 4.4, 0.3]}>
          <torusGeometry args={[1.85, 0.07, 14, quality === 'high' ? 48 : 32, Math.PI]} />
          <meshStandardMaterial
            color="#d5ae79"
            emissive="#d5ae79"
            emissiveIntensity={0.7}
            metalness={0.5}
            roughness={0.35}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Ceiling plane (keeps the scene enclosed and the light contained) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6.6, -1]}>
        <planeGeometry args={[40, 22]} />
        <meshStandardMaterial color="#141119" roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}
