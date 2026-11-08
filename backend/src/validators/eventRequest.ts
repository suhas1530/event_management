/**
 * Completeness rules for an event request that leaves DRAFT.
 *
 * Drafts may be partial so a customer can save and continue later. Once a
 * request is submitted (or is under review) it must retain the date, guest
 * count and city a planner needs, even when the customer edits it directly
 * through the API instead of the wizard.
 */

export interface SubmittedEventRequestInput {
  eventType?: string | null;
  eventDate?: string | Date | null;
  guestCount?: number | null;
  city?: string | null;
}

export function validateSubmittedEventRequest(
  input: SubmittedEventRequestInput,
): string | null {
  if (!input.eventType) return 'Choose an event type before submitting.';
  if (!input.eventDate) return 'Choose a preferred event date before submitting.';

  const eventDate = input.eventDate instanceof Date ? input.eventDate : new Date(input.eventDate);
  if (Number.isNaN(eventDate.getTime())) {
    return 'Choose a valid preferred event date before submitting.';
  }
  if (!input.guestCount || input.guestCount < 1) {
    return 'Enter the expected number of guests before submitting.';
  }
  if (!input.city || input.city.trim().length < 2) {
    return 'Enter the event city before submitting.';
  }
  if (eventDate.getTime() < Date.now()) {
    return 'The event date must be in the future. Update the request and try again.';
  }
  return null;
}
