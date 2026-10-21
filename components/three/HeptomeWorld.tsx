'use client'

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerformanceMonitor } from '@react-three/drei'
import SharedArchitecture from './world/SharedArchitecture'
import CelebrationZone from './world/CelebrationZone'
import HomeZone from './world/HomeZone'
import LightingRig from './LightingRig'
import ParticleField from './ParticleField'
import WorldCameraRig from './WorldCameraRig'
import ZoneHotspot from './ZoneHotspot'
import { CELEBRATION_X, HOME_X, type WorldZone } from './world/world-config'

export type { WorldZone }

interface HeptomeWorldProps {
  /** 0..1 hero scroll progress; when present the camera follows the scroll. */
  scrollProgress?: { current: number }
  /** Cursor parallax on desktop; off for touch. */
  interactive?: boolean
  quality?: 'high' | 'low'
  /** Preview mode: orbit controls instead of the journey camera. */
  controls?: boolean
  /** 'celebration' | 'home' focuses a wing, 'auto' follows scroll / idle drift. */
  zone?: WorldZone | 'auto'
  /** Fired when a visitor activates a zone hotspot. */
  onZoneSelect?: (zone: WorldZone) => void
  /** Fired when the camera settles on a wing (drives the hero's zone label). */
  onZoneSettled?: (zone: WorldZone) => void
}

/**
 * The Heptome Living World — the 3D experience behind the hero and the world
 * preview.
 *
 * One building, two wings: a celebration hall (stage, arches, banquet tables,
 * warm bulbs) and a modern home (living space, kitchen run, daylight window,
 * a professional's service corner), joined by a colonnade the camera travels
 * through. It is the product's promise in 3D: everything for your moments and
 * your home.
 *
 * Mounting strategy: always loaded through `next/dynamic` with `ssr: false`, so
 * no part of three/R3F reaches the server bundle or the first paint. Device
 * pixel ratio adapts to measured performance through drei's PerformanceMonitor
 * and is capped at 1.6.
 */
export default function HeptomeWorld({
  scrollProgress,
  interactive = true,
  quality = 'high',
  controls = false,
  zone = 'auto',
  onZoneSelect,
  onZoneSettled,
}: HeptomeWorldProps) {
  const [dpr, setDpr] = useState(quality === 'high' ? 1.5 : 1)

  const focus: WorldZone | 'auto' = zone
  const orbitTarget: [number, number, number] =
    zone === 'celebration' ? [CELEBRATION_X, 1.7, -1.2] : zone === 'home' ? [HOME_X, 1.4, -1] : [0, 1.6, -1.2]

  return (
    <Canvas
      dpr={dpr}
      camera={{
        position: controls ? [CELEBRATION_X, 2.6, 8.4] : [-7, 2.3, 7.6],
        fov: 44,
        near: 0.1,
        far: 90,
      }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0f0d14']} />
      <fog attach="fog" args={['#0f0d14', 18, 46]} />

      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(quality === 'high' ? 1.6 : 1)}
      >
        <Suspense fallback={null}>
          <SharedArchitecture quality={quality} />
          <CelebrationZone quality={quality} active={focus === 'celebration'} />
          <HomeZone quality={quality} active={focus === 'home'} />
          <LightingRig quality={quality} focus={focus} />

          <ParticleField
            count={quality === 'high' ? 520 : 180}
            color="#e6c692"
            centerX={CELEBRATION_X}
            size={0.05}
          />
          <ParticleField
            count={quality === 'high' ? 320 : 120}
            color="#fff4dd"
            centerX={HOME_X}
            size={0.035}
          />

          {onZoneSelect && (
            <>
              <ZoneHotspot
                zone="celebration"
                position={[CELEBRATION_X, 0, -0.6]}
                radius={2.6}
                label="Celebration hall"
                active={focus === 'celebration'}
                onSelect={onZoneSelect}
              />
              <ZoneHotspot
                zone="home"
                position={[HOME_X - 1.1, 0, 1.6]}
                radius={2.2}
                label="Home services"
                active={focus === 'home'}
                onSelect={onZoneSelect}
              />
            </>
          )}

          {controls ? (
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 3.6}
              maxPolarAngle={Math.PI / 2.05}
              minAzimuthAngle={-Math.PI / 4}
              maxAzimuthAngle={Math.PI / 4}
              autoRotate
              autoRotateSpeed={0.35}
              target={orbitTarget}
            />
          ) : (
            <WorldCameraRig
              zone={zone}
              scrollProgress={scrollProgress}
              interactive={interactive}
              onZoneSettled={onZoneSettled}
            />
          )}
        </Suspense>
      </PerformanceMonitor>
    </Canvas>
  )
}
