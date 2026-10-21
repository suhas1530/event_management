/**
 * Service coverage for doorstep (home) services.
 *
 * Coverage is data, not prose: both the booking wizard and the location
 * selector read from this one table, so an address can only be accepted when
 * the platform actually operates there.
 *
 * ⚠ Coverage table — configure before launch.
 * The localities below are the areas Heptome currently advertises. Editing this
 * list is the only change needed to open or close an area; nothing else in the
 * booking flow hard-codes a locality.
 *
 * Server-side note: the technician booking API does not yet validate coverage
 * (it stores whatever address the customer submits). Until a coverage table
 * exists server-side this check runs in the client, and every booking created
 * from an unsupported area is surfaced to the admin dashboard for review.
 */

export interface ServiceArea {
  /** Locality label shown in the location selector. */
  name: string
  city: string
  /** Pincode prefixes served by this locality. */
  pincodePrefixes: string[]
}

export const SUPPORTED_CITY = 'Bengaluru'

export const SERVICE_AREAS: ServiceArea[] = [
  { name: 'Central Bengaluru', city: 'Bengaluru', pincodePrefixes: ['560001', '560002', '560009', '560025', '560027'] },
  { name: 'Koramangala', city: 'Bengaluru', pincodePrefixes: ['560034', '560095', '560047'] },
  { name: 'Indiranagar', city: 'Bengaluru', pincodePrefixes: ['560038', '560008', '560017'] },
  { name: 'Whitefield', city: 'Bengaluru', pincodePrefixes: ['560066', '560048', '560067', '560087'] },
  { name: 'Electronic City', city: 'Bengaluru', pincodePrefixes: ['560100', '560099', '560068'] },
  { name: 'HSR Layout', city: 'Bengaluru', pincodePrefixes: ['560102', '560068', '560076'] },
  { name: 'Marathahalli', city: 'Bengaluru', pincodePrefixes: ['560037', '560103'] },
  { name: 'Jayanagar', city: 'Bengaluru', pincodePrefixes: ['560041', '560011', '560069', '560070'] },
  { name: 'Rajajinagar', city: 'Bengaluru', pincodePrefixes: ['560010', '560021', '560086'] },
  { name: 'Yelahanka', city: 'Bengaluru', pincodePrefixes: ['560064', '560063', '560065'] },
  { name: 'Hebbal', city: 'Bengaluru', pincodePrefixes: ['560024', '560032', '560092'] },
  { name: 'Banashankari', city: 'Bengaluru', pincodePrefixes: ['560085', '560061', '560050'] },
  { name: 'Hosur Road', city: 'Bengaluru', pincodePrefixes: ['560068', '560076', '560029'] },
  { name: 'Kengeri', city: 'Bengaluru', pincodePrefixes: ['560060', '560059', '560074'] },
]

/** Pincodes Heptome explicitly does not serve yet, with the reason shown to the customer. */
export const UNSUPPORTED_PINCODES: Record<string, string> = {
  '562110': 'Devanahalli is outside the current doorstep-service zone.',
  '562125': 'Sarjapur is outside the current doorstep-service zone.',
  '562123': 'Nelamangala is outside the current doorstep-service zone.',
}

export interface CoverageResult {
  supported: boolean
  /** Human-readable reason when `supported` is false. */
  reason?: string
  /** Matched locality, when the address is inside a supported area. */
  area?: ServiceArea
}

/**
 * Check whether a doorstep-service address is inside the supported coverage.
 *
 * Only the pincode decides coverage: a customer may type a locality name
 * inconsistently, but a 6-digit pincode maps to exactly one postal area.
 */
export function checkCoverage(input: { city?: string; pincode?: string }): CoverageResult {
  const pincode = (input.pincode ?? '').trim()
  const city = (input.city ?? '').trim()

  if (!/^[0-9]{6}$/.test(pincode)) {
    return { supported: false, reason: 'Enter a valid 6-digit pincode so we can check coverage.' }
  }

  if (UNSUPPORTED_PINCODES[pincode]) {
    return { supported: false, reason: UNSUPPORTED_PINCODES[pincode] }
  }

  if (city && city.toLowerCase() !== SUPPORTED_CITY.toLowerCase()) {
    return {
      supported: false,
      reason: `Heptome doorstep services currently run only in ${SUPPORTED_CITY}. You can change your location to ${SUPPORTED_CITY} or contact us about other cities.`,
    }
  }

  const area = SERVICE_AREAS.find(candidate => candidate.pincodePrefixes.includes(pincode))
  if (!area) {
    return {
      supported: false,
      reason: `We do not have service partners covering ${pincode} yet. Pick a different location or tell us where to expand next.`,
    }
  }

  return { supported: true, area }
}

/** Ordered locality names, for selectors. */
export const SERVICE_AREA_NAMES: string[] = SERVICE_AREAS.map(area => area.name)
