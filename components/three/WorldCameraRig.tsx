'use client'

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { THRESHOLD_FOCUS, ZONE_FOCUS, type WorldZone } from './world/world-config'

interface WorldCameraRigProps {
  /** Explicit zone focus, or 'auto' to follow scroll / a slow idle cycle. */
  zone: WorldZone | 'auto'
  /** 0..1 hero scroll progress written by the homepage's ScrollTrigger. */
  scrollProgress?: { current: number }
  /** Cursor parallax — off on touch devices. */
  interactive?: boolean
  /** Emits the zone the camera has settled on (used for the hero's zone label). */
  onZoneSettled?: (zone: WorldZone) => void
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

const IDLE_CYCLE_SECONDS = 34

/**
 * Drives the world camera through refs and per-frame maths, so no React state
 * updates happen inside the render loop.
 *
 * The camera moves along one path with three stops — celebration hall, the
 * colonnade threshold, and the home wing — and eases between them. Movement is
 * always slow and damped: no snapping, no orbiting, no camera that fights the
 * reader.
 */
export default function WorldCameraRig({
  zone,
  scrollProgress,
  interactive = true,
  onZoneSettled,
}: WorldCameraRigProps) {
  const { camera } = useThree()
  const blend = useRef(0)
  const settled = useRef<WorldZone>('celebration')

  const stops = useMemo(
    () => ({
      celebration: {
        position: new THREE.Vector3(...ZONE_FOCUS.celebration.position),
        lookAt: new THREE.Vector3(...ZONE_FOCUS.celebration.lookAt),
      },
      threshold: {
        position: new THREE.Vector3(...THRESHOLD_FOCUS.position),
        lookAt: new THREE.Vector3(...THRESHOLD_FOCUS.lookAt),
      },
      home: {
        position: new THREE.Vector3(...ZONE_FOCUS.home.position),
        lookAt: new THREE.Vector3(...ZONE_FOCUS.home.lookAt),
      },
      goalPosition: new THREE.Vector3(),
      goalLookAt: new THREE.Vector3(),
      smoothLookAt: new THREE.Vector3(...ZONE_FOCUS.celebration.lookAt),
    }),
    [],
  )

  /* Never leave the pointer-parallax state pointing at a dead camera. */
  useEffect(() => {
    return () => {
      camera.position.set(...ZONE_FOCUS.celebration.position)
    }
  }, [camera])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const damp = 1 - Math.exp(-delta * 2.4)

    const scroll = scrollProgress ? Math.min(1, Math.max(0, scrollProgress.current)) : 0

    // Where the camera wants to be: an explicit zone, or the automatic path.
    let target: number
    if (zone === 'celebration') target = 0
    else if (zone === 'home') target = 1
    else if (scrollProgress) target = Math.min(1, scroll * 1.7)
    else target = (Math.sin((t / IDLE_CYCLE_SECONDS) * Math.PI * 2) + 1) / 2

    blend.current += (target - blend.current) * damp
    const b = Math.min(1, Math.max(0, blend.current))

    if (b <= 0.5) {
      const local = smoothstep(b * 2)
      stops.goalPosition.lerpVectors(stops.celebration.position, stops.threshold.position, local)
      stops.goalLookAt.lerpVectors(stops.celebration.lookAt, stops.threshold.lookAt, local)
    } else {
      const local = smoothstep((b - 0.5) * 2)
      stops.goalPosition.lerpVectors(stops.threshold.position, stops.home.position, local)
      stops.goalLookAt.lerpVectors(stops.threshold.lookAt, stops.home.lookAt, local)
    }

    const px = interactive ? state.pointer.x : 0
    const py = interactive ? state.pointer.y : 0

    camera.position.x += (stops.goalPosition.x + px * 0.75 - camera.position.x) * damp
    camera.position.y += (stops.goalPosition.y + py * 0.35 - camera.position.y) * damp
    camera.position.z += (stops.goalPosition.z - camera.position.z) * damp

    stops.smoothLookAt.lerp(stops.goalLookAt, damp)
    camera.lookAt(stops.smoothLookAt)

    // Report the settled zone only on the transition, never per frame.
    const current: WorldZone = b < 0.5 ? 'celebration' : 'home'
    if (current !== settled.current && Math.abs(b - target) < 0.06) {
      settled.current = current
      onZoneSettled?.(current)
    }
  })

  return null
}
