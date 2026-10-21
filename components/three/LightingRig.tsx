'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { PointLight, SpotLight } from 'three'
import { CELEBRATION_X, HOME_X, type WorldZone } from './world/world-config'

interface LightingRigProps {
  quality: 'high' | 'low'
  /** Zone the camera is focused on: its lights lead, the other settles back. */
  focus?: WorldZone | 'auto'
}

/**
 * Two lighting moods in one rig.
 *
 * Celebration wing — sweeping violet and champagne stage spotlights plus warm
 * hanging bulbs. Home wing — soft daylight through the window, a floor-lamp
 * pool and a clean fill, so the same architecture reads as a hall and as a
 * living room without swapping the scene.
 *
 * Shadows stay off: they are the most expensive feature in a real-time scene and
 * this composition reads perfectly without them.
 */
export default function LightingRig({ quality, focus = 'auto' }: LightingRigProps) {
  const violet = useRef<SpotLight>(null)
  const champagne = useRef<SpotLight>(null)
  const bulbs = useRef<PointLight>(null)
  const daylight = useRef<PointLight>(null)
  const lamp = useRef<PointLight>(null)

  const high = quality === 'high'

  useFrame(state => {
    const t = state.clock.elapsedTime
    const celebrationLead = focus === 'celebration' ? 1 : focus === 'home' ? 0.42 : 0.85
    const homeLead = focus === 'home' ? 1 : focus === 'celebration' ? 0.5 : 0.8

    if (violet.current) {
      violet.current.position.x = CELEBRATION_X - 4.5 + Math.sin(t * 0.11) * 1.2
      violet.current.position.z = 3.4 + Math.cos(t * 0.11) * 1.1
      violet.current.intensity = (high ? 105 : 82) * celebrationLead * (0.94 + Math.sin(t * 0.45) * 0.06)
      // Stage is off-centre: aim the beam at the platform, not the world origin.
      violet.current.target.position.set(CELEBRATION_X, 0.9, -1.2)
      violet.current.target.updateMatrixWorld()
    }

    if (champagne.current) {
      champagne.current.position.x = CELEBRATION_X + 4.6 + Math.cos(t * 0.09) * 1.1
      champagne.current.position.z = 2.8 + Math.sin(t * 0.09) * 1
      champagne.current.intensity = 76 * celebrationLead * (0.92 + Math.cos(t * 0.37) * 0.08)
      champagne.current.target.position.set(CELEBRATION_X, 1.1, -0.8)
      champagne.current.target.updateMatrixWorld()
    }

    if (bulbs.current) {
      bulbs.current.intensity = 7.5 * celebrationLead + Math.sin(t * 0.7) * 0.9
    }

    if (daylight.current) {
      daylight.current.intensity = (high ? 16 : 13) * homeLead * (0.97 + Math.sin(t * 0.18) * 0.03)
    }

    if (lamp.current) {
      lamp.current.intensity = 5.4 * homeLead + Math.sin(t * 0.6) * 0.35
    }
  })

  return (
    <group>
      <ambientLight intensity={0.42} color="#2f2a3d" />
      <hemisphereLight args={['#cdbdf5', '#12100f', 0.34]} />
      <directionalLight position={[2, 6.5, 5]} intensity={0.32} color="#cfc6ff" />

      {/* ── Celebration wing ───────────────────────────────────────────── */}
      <spotLight
        ref={violet}
        position={[CELEBRATION_X - 4.5, 7.4, 3.4]}
        angle={0.6}
        penumbra={0.88}
        distance={40}
        decay={1.7}
        intensity={105}
        color="#8b5cf6"
      />
      <spotLight
        ref={champagne}
        position={[CELEBRATION_X + 4.6, 7, 2.8]}
        angle={0.52}
        penumbra={0.86}
        distance={40}
        decay={1.7}
        intensity={76}
        color="#e2c39a"
      />
      <pointLight
        ref={bulbs}
        position={[CELEBRATION_X, 3.3, 1.4]}
        intensity={7.5}
        distance={13}
        decay={1.9}
        color="#ffd79a"
      />

      {/* ── Home wing ──────────────────────────────────────────────────── */}
      {/* Daylight standing in the window bay (no shadow target needed) */}
      <pointLight
        ref={daylight}
        position={[HOME_X - 1, 3.1, -4]}
        intensity={16}
        distance={17}
        decay={1.5}
        color="#fff3d6"
      />
      {/* Floor-lamp pool */}
      <pointLight ref={lamp} position={[HOME_X + 0.75, 1.9, 2.35]} intensity={5.4} distance={8} decay={1.8} color="#ffdcb0" />
      {/* Clean fill so the kitchen run does not go black */}
      <pointLight position={[HOME_X - 3, 2.6, -1.6]} intensity={3.2} distance={9} decay={1.9} color="#f2e8ff" />
    </group>
  )
}
