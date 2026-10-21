/**
 * Shared types for the Heptome Living World hero scene.
 *
 * The world is one architectural set with two lit zones — a celebration space
 * and a modern home — so the 3D experience communicates both halves of the
 * business instead of an abstract sculpture.
 */

export type WorldZone = 'celebration' | 'home'

/** Zone focus points used by the camera rig and the zone hotspots. */
export const ZONE_FOCUS: Record<WorldZone, { position: [number, number, number]; lookAt: [number, number, number] }> = {
  celebration: { position: [-7, 2.3, 7.6], lookAt: [-7, 1.7, -1.2] },
  home: { position: [7, 2.1, 7.2], lookAt: [7.2, 1.45, -1] },
}

/** The colonnade between the two zones — the camera sweeps through it. */
export const THRESHOLD_FOCUS = {
  position: [0, 2.7, 9.2] as [number, number, number],
  lookAt: [0, 1.5, -1.4] as [number, number, number],
}

export const CELEBRATION_X = -7
export const HOME_X = 7
