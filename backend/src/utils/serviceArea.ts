/**
 * Server-side doorstep coverage.
 *
 * This mirrors `lib/service-area.ts` on the frontend. The client copy powers
 * immediate feedback while typing a pincode; this copy is the one that decides
 * whether a booking may be stored. They are intentionally duplicated because
 * the Express app and the Next app are built separately, so keep the pincode
 * table in sync when coverage changes.
 */

export const SUPPORTED_CITY = 'Bengaluru';

const SERVED_PINCODES = new Set([
  '560001', '560002', '560009', '560025', '560027',
  '560034', '560095', '560047',
  '560038', '560008', '560017',
  '560066', '560048', '560067', '560087',
  '560100', '560099', '560068',
  '560102', '560076',
  '560037', '560103',
  '560041', '560011', '560069', '560070',
  '560010', '560021', '560086',
  '560064', '560063', '560065',
  '560024', '560032', '560092',
  '560085', '560061', '560050',
  '560029',
  '560060', '560059', '560074',
]);

const EXPLICITLY_UNSERVED: Record<string, string> = {
  '562110': 'Devanahalli is outside the current doorstep-service zone.',
  '562125': 'Sarjapur is outside the current doorstep-service zone.',
  '562123': 'Nelamangala is outside the current doorstep-service zone.',
};

export interface CoverageDecision {
  supported: boolean;
  reason?: string;
}

/**
 * Decide whether an address is inside the area Heptome can actually serve.
 * Only the pincode decides coverage; the city is checked as a second guard so
 * a valid Bengaluru pincode cannot be paired with another city.
 */
export function checkServiceCoverage(input: { city?: string; pincode?: string }): CoverageDecision {
  const pincode = (input.pincode ?? '').trim();
  const city = (input.city ?? '').trim();

  if (!/^[0-9]{6}$/.test(pincode)) {
    return { supported: false, reason: 'Enter a valid 6-digit pincode.' };
  }

  if (EXPLICITLY_UNSERVED[pincode]) {
    return { supported: false, reason: EXPLICITLY_UNSERVED[pincode] };
  }

  if (city && city.toLowerCase() !== SUPPORTED_CITY.toLowerCase()) {
    return {
      supported: false,
      reason: `Heptome doorstep services currently run only in ${SUPPORTED_CITY}.`,
    };
  }

  if (!SERVED_PINCODES.has(pincode)) {
    return {
      supported: false,
      reason: `We do not have service partners covering ${pincode} yet.`,
    };
  }

  return { supported: true };
}
