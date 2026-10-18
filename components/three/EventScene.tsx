'use client'

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerformanceMonitor } from '@react-three/drei'
import VenueEnvironment from './VenueEnvironment'
import StageGeometry from './StageGeometry'
import LightingRig from './LightingRig'
import ParticleField from './ParticleField'
import CameraController from './CameraController'
import InteractiveVenueObject from './InteractiveVenueObject'

interface EventSceneProps {
  /** 0..1 hero scroll progress; linked camera movement is disabled when absent. */
  scrollProgress?: { current: number }
  /** Cursor parallax on desktop; off for touch. */
  interactive?: boolean
  quality?: 'high' | 'low'
  /** Venue-preview mode: orbit controls instead of the scroll-driven camera. */
  controls?: boolean
  /** Fired when the central sculpture is activated. */
  onSculptureSelect?: () => void
}

/**
 * The reusable stage scene used by both the hero and the venue preview.
 *
 * Mounting strategy: this module is always loaded through `next/dynamic` with
 * `ssr: false`, so none of `three` / R3F reaches the server bundle or the
 * homepage's initial JS. Device pixel ratio adapts to real performance through
 * drei's PerformanceMonitor and is capped at 1.6.
 */
export default function EventScene({
  scrollProgress,
  interactive = true,
  quality = 'high',
  controls = false,
  onSculptureSelect,
}: EventSceneProps) {
  const [dpr, setDpr] = useState(quality === 'high' ? 1.5 : 1)

  return (
    <Canvas
      dpr={dpr}
      camera={{
        position: controls ? [4.8, 2.6, 7] : [0, 1.65, 9],
        fov: 42,
        near: 0.1,
        far: 80,
      }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#08090d']} />
      <fog attach="fog" args={['#08090d', 16, 40]} />

      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(quality === 'high' ? 1.6 : 1)}
      >
        <Suspense fallback={null}>
          <VenueEnvironment quality={quality} />
          <StageGeometry quality={quality} />
          <LightingRig quality={quality} />
          <ParticleField count={quality === 'high' ? 800 : 260} />
          <InteractiveVenueObject quality={quality} onSelect={onSculptureSelect} />

          {controls ? (
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 3.4}
              maxPolarAngle={Math.PI / 2.05}
              minAzimuthAngle={-Math.PI / 2.4}
              maxAzimuthAngle={Math.PI / 2.4}
              autoRotate
              autoRotateSpeed={0.45}
              target={[0, 1.6, -1.6]}
            />
          ) : (
            <CameraController scrollProgress={scrollProgress} interactive={interactive} />
          )}
        </Suspense>
      </PerformanceMonitor>
    </Canvas>
  )
}
