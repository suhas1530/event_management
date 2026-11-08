import { describe, expect, it } from 'vitest'
import { validateSubmittedEventRequest } from '../../backend/src/validators/eventRequest'

/**
 * A submitted event request must be complete even when it is created or edited
 * through the API rather than the wizard. Drafts remain allowed to be partial.
 */

const futureDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString()
}

const completeRequest = () => ({
  eventType: 'WEDDING',
  eventDate: futureDate(),
  guestCount: 120,
  city: 'Bengaluru',
})

describe('submitted event request completeness', () => {
  it('accepts a complete request with a future date', () => {
    expect(validateSubmittedEventRequest(completeRequest())).toBeNull()
  })

  it('rejects a submitted request with no date, guest count or city', () => {
    expect(
      validateSubmittedEventRequest({ eventType: 'WEDDING', eventDate: null, guestCount: null }),
    ).toMatch(/preferred event date/i)
    expect(
      validateSubmittedEventRequest({ ...completeRequest(), guestCount: 0 }),
    ).toMatch(/number of guests/i)
    expect(
      validateSubmittedEventRequest({ ...completeRequest(), city: ' ' }),
    ).toMatch(/event city/i)
  })

  it('rejects a date in the past and an unparseable date', () => {
    expect(
      validateSubmittedEventRequest({
        ...completeRequest(),
        eventDate: new Date(Date.now() - 86_400_000).toISOString(),
      }),
    ).toMatch(/must be in the future/i)
    expect(
      validateSubmittedEventRequest({ ...completeRequest(), eventDate: 'not-a-date' }),
    ).toMatch(/valid preferred event date/i)
  })

  it('accepts a Date instance as well as an ISO string', () => {
    expect(
      validateSubmittedEventRequest({ ...completeRequest(), eventDate: new Date(futureDate()) }),
    ).toBeNull()
  })
})
