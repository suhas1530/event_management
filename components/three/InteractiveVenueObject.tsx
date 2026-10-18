'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group } from 'three'

interface InteractiveVenueObjectProps {
  quality: 'high' | 'low'
  /** Called when the sculpture is activated (click / tap). */
  onSelect?: () => void
}

/**
 * The interactive centrepiece hovering above the stage — a slowly rotating
 * torus knot that lights up on hover and invites a click. Activating it takes
 * the visitor to the experiences section below the hero.
 */
export default function InteractiveVenueObject({ quality, onSelect }: InteractiveVenueObjectProps) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y = state.clock.elapsedTime * 0.25

    const target = hovered ? 1.08 : 1
    const next = THREE.MathUtils.damp(group.current.scale.x, target, 6, delta)
    group.current.scale.setScalar(next)
  })

  /* Never leave a stale cursor behind if the scene unmounts mid-hover. */
  useEffect(() => {
    return () => {
      document.body.style.cursor = ''
    }
  }, [])

  return (
    <group position={[0, 2.35, -1.2]}>
      <group ref={group}>
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
            onSelect?.()
          }}
        >
          <torusKnotGeometry args={[0.5, 0.16, quality === 'high' ? 220 : 120, quality === 'high' ? 32 : 20]} />
          <meshStandardMaterial
            color={hovered ? '#c4b5fd' : '#8b5cf6'}
            emissive={hovered ? '#a78bfa' : '#6d28d9'}
            emissiveIntensity={hovered ? 2.2 : 1.1}
            metalness={0.6}
            roughness={0.25}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}
