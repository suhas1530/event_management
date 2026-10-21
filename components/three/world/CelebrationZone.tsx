'use client'

import { useMemo, useRef } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { CELEBRATION_X } from './world-config'

interface CelebrationZoneProps {
  quality: 'high' | 'low'
  /** Highlights the zone while the camera is focused on it. */
  active?: boolean
}

/**
 * Zone 1 — the celebration space.
 *
 * A banquet hall set: a raised stage with ceremonial arches, a floral arch
 * arrangement, round banquet tables with seating, hanging warm bulbs and
 * champagne detailing. Everything is procedural geometry, instanced where it
 * repeats, so the zone costs a handful of draw calls.
 *
 * Deliberately restrained motion: the hanging bulbs sway very slightly and the
 * arch emissive breathes. Nothing spins, nothing orbits.
 */
export default function CelebrationZone({ quality, active = false }: CelebrationZoneProps) {
  const bulbs = useRef<Group>(null)
  const arch = useRef<Group>(null)

  const tablePositions = useMemo<[number, number, number][]>(
    () => [
      [-2.6, 0, 1.1],
      [0, 0, 1.9],
      [2.6, 0, 1.1],
      [-1.3, 0, 3.2],
      [1.3, 0, 3.2],
    ],
    [],
  )

  /** Chair seats + backrests around each banquet table. */
  const chairs = useMemo(() => {
    const list: {
      seat: [number, number, number]
      seatRotation: number
      back: [number, number, number]
      backRotation: number
    }[] = []
    const seats = quality === 'high' ? 6 : 4
    tablePositions.forEach(([tx, , tz]) => {
      for (let i = 0; i < seats; i += 1) {
        const angle = (i / seats) * Math.PI * 2
        const dx = Math.sin(angle)
        const dz = Math.cos(angle)
        list.push({
          seat: [tx + dx * 1.15, 0.45, tz + dz * 1.15],
          // Chairs face the table: rotate so the backrest sits away from centre.
          seatRotation: -angle,
          back: [tx + dx * 1.28, 0.73, tz + dz * 1.28],
          backRotation: -angle + Math.PI,
        })
      }
    })
    return list
  }, [quality, tablePositions])

  /** Floral clusters on the arch (two colour families). */
  const floralsPrimary = useMemo(
    () => [
      [-2.5, 2.1, -2.4],
      [-1.9, 2.55, -2.35],
      [-1.2, 2.85, -2.3],
      [-0.5, 2.95, -2.28],
      [0.2, 2.9, -2.28],
      [0.9, 2.7, -2.3],
      [1.6, 2.4, -2.33],
      [2.3, 2.05, -2.38],
    ] as [number, number, number][],
    [],
  )

  const floralsSecondary = useMemo(
    () =>
      [
        [-2.2, 1.75, -2.45],
        [-1.55, 2.3, -2.4],
        [-0.85, 2.65, -2.34],
        [-0.15, 2.7, -2.32],
        [0.55, 2.6, -2.33],
        [1.25, 2.3, -2.36],
        [1.95, 1.85, -2.42],
      ] as [number, number, number][],
    [],
  )

  const bulbCount = quality === 'high' ? 9 : 6

  useFrame(state => {
    const t = state.clock.elapsedTime
    if (bulbs.current) bulbs.current.rotation.z = Math.sin(t * 0.25) * 0.012
    if (arch.current) {
      const target = active ? 1 : 0.62
      const material = (arch.current.children[0] as { material?: { emissiveIntensity: number } })?.material
      if (material) material.emissiveIntensity += (target * 1.5 - material.emissiveIntensity) * 0.04
    }
  })

  return (
    <group position={[CELEBRATION_X, 0, 0]}>
      {/* Stage platform */}
      <mesh position={[0, 0.28, -1.2]}>
        <boxGeometry args={[9.2, 0.56, 4.2]} />
        <meshStandardMaterial color="#241f2e" metalness={0.45} roughness={0.5} />
      </mesh>

      {/* Champagne lip along the stage front */}
      <mesh position={[0, 0.575, 0.9]}>
        <boxGeometry args={[9.2, 0.03, 0.07]} />
        <meshBasicMaterial color="#d5ae79" transparent opacity={0.55} />
      </mesh>

      {/* Wide ceremonial arch behind the stage */}
      <group ref={arch} position={[0, 0.56, -2.4]}>
        <mesh>
          <torusGeometry args={[3.05, 0.08, 20, quality === 'high' ? 72 : 48, Math.PI]} />
          <meshStandardMaterial
            color="#d5ae79"
            emissive="#d5ae79"
            emissiveIntensity={0.9}
            metalness={0.5}
            roughness={0.35}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, 0.22]}>
          <torusGeometry args={[3.45, 0.045, 16, quality === 'high' ? 64 : 40, Math.PI]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#6d36d8"
            emissiveIntensity={0.9}
            metalness={0.5}
            roughness={0.35}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Floral arrangement over the arch (instanced spheres) */}
      <Instances limit={floralsPrimary.length}>
        <sphereGeometry args={[0.19, quality === 'high' ? 14 : 10, quality === 'high' ? 14 : 10]} />
        <meshStandardMaterial color="#e5c9d8" roughness={0.85} metalness={0} />
        {floralsPrimary.map((position, i) => (
          <Instance key={i} position={position} />
        ))}
      </Instances>
      <Instances limit={floralsSecondary.length}>
        <sphereGeometry args={[0.14, quality === 'high' ? 12 : 8, quality === 'high' ? 12 : 8]} />
        <meshStandardMaterial color="#f3ead9" roughness={0.9} metalness={0} />
        {floralsSecondary.map((position, i) => (
          <Instance key={i} position={position} />
        ))}
      </Instances>

      {/* Two floral pillars flanking the stage */}
      {[-3.9, 3.9].map(x => (
        <group key={x} position={[x, 0, -1.4]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.22, 0.26, 1.8, quality === 'high' ? 18 : 12]} />
            <meshStandardMaterial color="#2b2536" metalness={0.4} roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.95, 0]}>
            <sphereGeometry args={[0.42, quality === 'high' ? 18 : 12, quality === 'high' ? 18 : 12]} />
            <meshStandardMaterial color="#e8ccdc" roughness={0.9} />
          </mesh>
          <mesh position={[0.22, 2.2, 0.1]}>
            <sphereGeometry args={[0.26, 12, 12]} />
            <meshStandardMaterial color="#f3ead9" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Backdrop panel behind the arch */}
      <mesh position={[0, 2.6, -3.6]}>
        <planeGeometry args={[9.6, 4.4]} />
        <meshStandardMaterial color="#1a1622" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Banquet tables */}
      <Instances limit={tablePositions.length}>
        <cylinderGeometry args={[0.85, 0.85, 0.06, quality === 'high' ? 26 : 18]} />
        <meshStandardMaterial color="#f6f2ea" roughness={0.75} metalness={0.05} />
        {tablePositions.map(([x, , z], i) => (
          <Instance key={i} position={[x, 0.78, z]} />
        ))}
      </Instances>
      {/* Table pedestals */}
      <Instances limit={tablePositions.length}>
        <cylinderGeometry args={[0.12, 0.3, 0.76, 12]} />
        <meshStandardMaterial color="#2b2536" metalness={0.5} roughness={0.5} />
        {tablePositions.map(([x, , z], i) => (
          <Instance key={i} position={[x, 0.38, z]} />
        ))}
      </Instances>
      {/* Candle centrepieces */}
      <Instances limit={tablePositions.length}>
        <cylinderGeometry args={[0.05, 0.05, 0.18, 8]} />
        <meshStandardMaterial color="#d5ae79" emissive="#d5ae79" emissiveIntensity={0.7} toneMapped={false} />
        {tablePositions.map(([x, , z], i) => (
          <Instance key={i} position={[x, 0.9, z]} />
        ))}
      </Instances>

      {/* Chairs around the tables: seat + backrest share one transform list */}
      <Instances limit={chairs.length}>
        <boxGeometry args={[0.42, 0.45, 0.42]} />
        <meshStandardMaterial color="#3a3346" roughness={0.7} metalness={0.2} />
        {chairs.map((chair, i) => (
          <Instance key={i} position={chair.seat} rotation={[0, chair.seatRotation, 0]} />
        ))}
      </Instances>
      <Instances limit={chairs.length}>
        <boxGeometry args={[0.42, 0.5, 0.06]} />
        <meshStandardMaterial color="#463e54" roughness={0.7} metalness={0.2} />
        {chairs.map((chair, i) => (
          <Instance key={i} position={chair.back} rotation={[0, chair.backRotation, 0]} />
        ))}
      </Instances>

      {/* Hanging warm bulbs over the tables */}
      <group ref={bulbs} position={[0, 3.5, 1.4]}>
        {Array.from({ length: bulbCount }, (_, i) => {
          const x = -3.4 + (i / Math.max(1, bulbCount - 1)) * 6.8
          const y = 0.35 + Math.sin((i / Math.max(1, bulbCount - 1)) * Math.PI) * 0.45
          return (
            <group key={i} position={[x, -y, 0]}>
              <mesh>
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshStandardMaterial
                  color="#ffdca8"
                  emissive="#ffca7a"
                  emissiveIntensity={1.5}
                  toneMapped={false}
                />
              </mesh>
              <mesh position={[0, 0.22, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.42, 4]} />
                <meshBasicMaterial color="#6b5a44" transparent opacity={0.7} />
              </mesh>
            </group>
          )
        })}
      </group>

      {/* Aisle runner leading to the stage */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 3.4]}>
        <planeGeometry args={[1.8, 4.4]} />
        <meshStandardMaterial color="#efe6dc" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  )
}
