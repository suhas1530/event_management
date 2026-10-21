'use client'

import { useMemo, useRef } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { MeshStandardMaterial, type Mesh } from 'three'
import { HOME_X } from './world-config'

interface HomeZoneProps {
  quality: 'high' | 'low'
  /** Highlights the zone while the camera is focused on it. */
  active?: boolean
}

/**
 * Zone 2 — the modern home.
 *
 * A contemporary living space with a kitchen run, warm daylight through a large
 * window, and the corner where a Heptome professional sets up (crate, ladder,
 * toolkit) — the everyday-care half of the brand, in the same architecture as
 * the celebration hall.
 *
 * Geometry is deliberately boxy and material-led: no textures, no external
 * assets, so it loads instantly and stays readable at every quality tier.
 */
export default function HomeZone({ quality, active = false }: HomeZoneProps) {
  const lampGlow = useRef<Mesh>(null)

  const cabinetDoors = useMemo(
    () => Array.from({ length: quality === 'high' ? 5 : 3 }, (_, i) => 0.85 + i * 0.62),
    [quality],
  )

  const books = useMemo(
    () =>
      [
        [0, 1.24, '#6d36d8'],
        [0.3, 1.2, '#d5ae79'],
        [0.58, 1.26, '#8b8b96'],
        [0.86, 1.22, '#4b4457'],
      ] as [number, number, string][],
    [],
  )

  useFrame(state => {
    if (!lampGlow.current) return
    const t = state.clock.elapsedTime
    const base = active ? 1.35 : 1.05
    const material = lampGlow.current.material
    if (!(material instanceof MeshStandardMaterial)) return
    material.emissiveIntensity = base + Math.sin(t * 0.6) * 0.06
  })

  return (
    <group position={[HOME_X, 0, 0]}>
      {/* ── Living area ─────────────────────────────────────────────── */}
      {/* Sofa: seat, back, arms, cushions */}
      <mesh position={[-1.1, 0.42, 1.5]}>
        <boxGeometry args={[3.1, 0.42, 1.1]} />
        <meshStandardMaterial color="#cdc4b6" roughness={0.85} metalness={0.02} />
      </mesh>
      <mesh position={[-1.1, 0.78, 1.98]}>
        <boxGeometry args={[3.1, 0.72, 0.26]} />
        <meshStandardMaterial color="#bdb3a3" roughness={0.85} metalness={0.02} />
      </mesh>
      {[-2.62, 0.42].map(x => (
        <mesh key={x} position={[x, 0.62, 1.5]}>
          <boxGeometry args={[0.28, 0.62, 1.1]} />
          <meshStandardMaterial color="#c4bbad" roughness={0.85} metalness={0.02} />
        </mesh>
      ))}
      <Instances limit={3}>
        <boxGeometry args={[0.72, 0.16, 0.78]} />
        <meshStandardMaterial color="#eee7dc" roughness={0.9} />
        <Instance position={[-1.95, 0.72, 1.45]} />
        <Instance position={[-1.1, 0.72, 1.45]} />
        <Instance position={[-0.25, 0.72, 1.45]} />
      </Instances>

      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.1, 0.012, 2.9]}>
        <planeGeometry args={[4.4, 2.4]} />
        <meshStandardMaterial color="#e7e0d4" roughness={0.95} />
      </mesh>

      {/* Coffee table */}
      <mesh position={[-1.1, 0.42, 2.7]}>
        <boxGeometry args={[1.5, 0.06, 0.8]} />
        <meshStandardMaterial color="#a8886a" roughness={0.55} metalness={0.05} />
      </mesh>
      <Instances limit={4}>
        <boxGeometry args={[0.06, 0.4, 0.06]} />
        <meshStandardMaterial color="#6f5741" roughness={0.6} metalness={0.1} />
        <Instance position={[-1.75, 0.2, 2.36]} />
        <Instance position={[-0.45, 0.2, 2.36]} />
        <Instance position={[-1.75, 0.2, 3.04]} />
        <Instance position={[-0.45, 0.2, 3.04]} />
      </Instances>

      {/* Floor lamp with a warm shade */}
      <group position={[0.75, 0, 2.35]}>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.035, 0.045, 1.8, 10]} />
          <meshStandardMaterial color="#2c2833" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.28, 0.3, 0.07, 18]} />
          <meshStandardMaterial color="#2c2833" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh ref={lampGlow} position={[0, 1.92, 0]}>
          <cylinderGeometry args={[0.24, 0.32, 0.36, quality === 'high' ? 22 : 14, 1, true]} />
          <meshStandardMaterial
            color="#f6ead3"
            emissive="#ffd9a0"
            emissiveIntensity={1.1}
            roughness={0.6}
            side={2}
          />
        </mesh>
      </group>

      {/* Media console + screen */}
      <group position={[-1.1, 0, -0.6]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[2.4, 0.6, 0.45]} />
          <meshStandardMaterial color="#b9ac97" roughness={0.6} metalness={0.08} />
        </mesh>
        <mesh position={[0, 1.5, -0.1]}>
          <boxGeometry args={[1.9, 1.05, 0.06]} />
          <meshStandardMaterial color="#1d1a24" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.5, -0.06]}>
          <planeGeometry args={[1.78, 0.94]} />
          <meshStandardMaterial color="#2b2740" emissive="#3c2f6d" emissiveIntensity={0.35} roughness={0.35} />
        </mesh>
      </group>

      {/* Bookshelf with a few spines */}
      <group position={[1.5, 0, -0.9]}>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[1.2, 1.8, 0.34]} />
          <meshStandardMaterial color="#a4917a" roughness={0.65} metalness={0.05} />
        </mesh>
        <Instances limit={books.length}>
          <boxGeometry args={[0.24, 1.0, 0.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
          {books.map(([x, y, color], i) => (
            <Instance key={i} position={[x - 0.3, y, 0.1]} color={color} />
          ))}
        </Instances>
      </group>

      {/* Potted plant */}
      <group position={[2.45, 0, 2.6]}>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.26, 0.2, 0.48, 16]} />
          <meshStandardMaterial color="#c8b49b" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#4c5a3a" roughness={0.9} />
        </mesh>
        {[
          [0, 1.25, 0.38],
          [0.2, 1.05, 0.28],
          [-0.2, 1.12, 0.3],
          [0.05, 1.42, 0.24],
        ].map(([x, y, r], i) => (
          <mesh key={i} position={[x, y, i % 2 === 0 ? 0.05 : -0.05]}>
            <sphereGeometry args={[r, 14, 14]} />
            <meshStandardMaterial color="#5c7a48" roughness={0.95} />
          </mesh>
        ))}
      </group>

      {/* ── Kitchen run ─────────────────────────────────────────────── */}
      <group position={[-3.6, 0, -2.2]} rotation={[0, Math.PI / 2, 0]}>
        {/* Base counter */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[3.4, 0.9, 0.66]} />
          <meshStandardMaterial color="#e6e0d6" roughness={0.55} metalness={0.05} />
        </mesh>
        {/* Worktop */}
        <mesh position={[0, 0.92, 0]}>
          <boxGeometry args={[3.5, 0.06, 0.72]} />
          <meshStandardMaterial color="#33302f" roughness={0.35} metalness={0.25} />
        </mesh>
        {/* Cabinet door reveals */}
        <Instances limit={cabinetDoors.length}>
          <boxGeometry args={[0.03, 0.72, 0.02]} />
          <meshStandardMaterial color="#bdb6aa" roughness={0.7} />
          {cabinetDoors.map((x, i) => (
            <Instance key={i} position={[x - 1.7, 0.44, 0.34]} />
          ))}
        </Instances>
        {/* Upper cabinets */}
        <mesh position={[0, 1.95, -0.16]}>
          <boxGeometry args={[3.4, 0.8, 0.42]} />
          <meshStandardMaterial color="#dcd5ca" roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Hob */}
        <mesh position={[-0.9, 0.96, 0]}>
          <boxGeometry args={[0.62, 0.035, 0.46]} />
          <meshStandardMaterial color="#15131a" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Sink block */}
        <mesh position={[0.95, 0.95, 0]}>
          <boxGeometry args={[0.66, 0.06, 0.44]} />
          <meshStandardMaterial color="#8e9298" roughness={0.25} metalness={0.7} />
        </mesh>
      </group>

      {/* Refrigerator */}
      <mesh position={[3.5, 0.85, -1.4]}>
        <boxGeometry args={[0.72, 1.7, 0.68]} />
        <meshStandardMaterial color="#9aa0a6" roughness={0.35} metalness={0.45} />
      </mesh>

      {/* ── Service corner: the Heptome professional's setup ────────── */}
      <group position={[2.8, 0, 0.6]}>
        {/* Tool crate */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.62, 0.38, 0.42]} />
          <meshStandardMaterial color="#6d36d8" roughness={0.6} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.44, 0]}>
          <boxGeometry args={[0.16, 0.06, 0.06]} />
          <meshStandardMaterial color="#d5ae79" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Step ladder */}
        <group position={[0.85, 0, -0.15]}>
          {[-0.18, 0.18].map(x => (
            <mesh key={x} position={[x, 0.55, 0]} rotation={[0, 0, x > 0 ? -0.08 : 0.08]}>
              <boxGeometry args={[0.06, 1.1, 0.06]} />
              <meshStandardMaterial color="#b7bcc2" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
          {[0.35, 0.75, 1.05].map(y => (
            <mesh key={y} position={[0, y, 0]}>
              <boxGeometry args={[0.46, 0.04, 0.16]} />
              <meshStandardMaterial color="#c9ced4" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
        </group>
        {/* Bucket */}
        <mesh position={[-0.7, 0.16, 0.22]}>
          <cylinderGeometry args={[0.19, 0.15, 0.32, 16]} />
          <meshStandardMaterial color="#7e4ae8" roughness={0.5} metalness={0.1} />
        </mesh>
      </group>

      {/* Wall art */}
      <mesh position={[-3.2, 1.75, -3.4]}>
        <boxGeometry args={[1.0, 1.3, 0.05]} />
        <meshStandardMaterial color="#cbbfa9" roughness={0.7} />
      </mesh>
    </group>
  )
}
