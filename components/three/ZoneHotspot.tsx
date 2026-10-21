'use client'

import { useState } from 'react'
import type { WorldZone } from './world/world-config'

interface ZoneHotspotProps {
  zone: WorldZone
  position: [number, number, number]
  /** Radius of the invisible click target. */
  radius?: number
  label: string
  active?: boolean
  onSelect?: (zone: WorldZone) => void
}

/**
 * An invisible, keyboard-independent hotspot inside the scene.
 *
 * Clicking the stage frames the celebration wing; clicking the sofa frames the
 * home wing. The ring only appears on hover, and the hit area never reaches
 * outside the canvas, so it can never cover the header, hero copy or CTAs.
 */
export default function ZoneHotspot({
  zone,
  position,
  radius = 1.6,
  label,
  active = false,
  onSelect,
}: ZoneHotspotProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position}>
      <mesh
        onPointerOver={event => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = ''
        }}
        onClick={event => {
          event.stopPropagation()
          onSelect?.(zone)
        }}
      >
        <cylinderGeometry args={[radius, radius, 0.02, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Hover / focus ring sits on the floor of the zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[radius * 0.7, radius * 0.76, 42]} />
        <meshBasicMaterial
          color={zone === 'celebration' ? '#d5ae79' : '#8b5cf6'}
          transparent
          opacity={hovered || active ? 0.5 : 0.12}
        />
      </mesh>

      <mesh position={[0, 3.4, 0]} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial />
      </mesh>

      {/* Accessible name for assistive tech inspecting the scene graph */}
      <group name={`zone-hotspot-${zone}`} userData={{ label }}>
        <mesh visible={false}>
          <boxGeometry args={[0.01, 0.01, 0.01]} />
          <meshBasicMaterial />
        </mesh>
      </group>
    </group>
  )
}
