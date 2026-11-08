# Razorpay payments — setup, deployment and rollback

Heptome uses Razorpay Standard Checkout for three payment targets:

| Target | When payment is allowed | What payment changes |
|---|---|---|
| `EVENT_BOOKING` | Booking is `PAYMENT_PENDING`, has an approved quote, and has a positive balance | Payment `COMPLETED`; booking becomes `CONFIRMED` only after the verified capture |
| `TECHNICIAN_BOOKING` | Home-service job is `SERVICE_COMPLETED` | Payment `COMPLETED`; job becomes `PAYMENT_COMPLETED` |
| `EVENT_REQUEST` | Inquiry is `ADVANCE_PAYMENT_PENDING` and has an approved proposal | Payment `COMPLETED`; inquiry becomes `ADVANCE_PAYMENT_RECEIVED`, **never** `EVENT_CONFIRMED` |

Payment state is stored separately from booking/inquiry state. A created order
never confirms a booking or an event. A failed or cancelled payment never marks
anything paid.

## Architecture

- `backend/src/payments/provider.ts` — provider-neutral interface.
- `backend/src/payments/razorpay.ts` — official `razorpay` Node SDK adapter and
  HMAC signature verification.
- `backend/src/payments/index.ts` — provider factory.
- `backend/src/services/payment.ts` — server-authoritative amount resolution,
  ownership checks, eligibility, finalization, reconciliation, refunds and
  webhook processing.
- `backend/src/routes/payments.ts` — authenticated create/verify/status/refund
  routes.
- `backend/src/routes/paymentsWebhook.ts` — raw-body webhook route.
- `components/payments/PaymentButton.tsx` — browser checkout, verification,
  polling, retry, cancellation and review states.

Adding another gateway means implementing `PaymentProvider` and returning it
from the factory. Booking and inquiry code does not import a gateway SDK.

## Environment variables

Set these in **`backend/.env`** (never in a `NEXT_PUBLIC_*` variable):

```dotenv
PAYMENT_PROVIDER=razorpay
PAYMENT_MODE=test
PAYMENT_CURRENCY=INR
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-test-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
BACKEND_PUBLIC_URL=https://api.example.com
```

- `RAZORPAY_KEY_ID` is the public key id. The backend returns it in the
  create-order response for Checkout. It is not a secret, but it is still not
  read from `NEXT_PUBLIC_*`.
- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` stay server-only.
- `PAYMENT_MODE=test` requires an `rzp_test_...` key. `PAYMENT_MODE=live`
  requires an `rzp_live_...` key. Startup fails in production when the mode and
  key prefix disagree.
- `PAYMENT_PROVIDER=disabled` turns online checkout off while leaving the rest
  of the application usable. Payment endpoints return `503`.

The frontend needs only:

```dotenv
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
NEXT_PUBLIC_APP_URL=https://www.example.com
```

## Database rollout

The schema change is additive. Do not run `prisma migrate reset` and do not
drop collections.

```powershell
cd backend
npx prisma generate
npx prisma db push
npm run db:backfill-payments
```

`prisma db push` creates the new payment collections, fields and indexes.
`db:backfill-payments`:

1. sets missing `appliedPaymentIds` arrays to `[]`;
2. sets existing inquiry `paymentStatus` to `PENDING` and
   `advancePaidAmount` to `0`;
3. sets existing payment `provider` to `razorpay` and `refundAmount` to `0`;
4. replaces the old optional-phone unique index with a partial unique index so
   MongoDB allows multiple users without a phone while still rejecting duplicate
   non-empty phone numbers.

The backfill is idempotent. It never deletes business data.

## Razorpay webhook

Configure this URL in the Razorpay Dashboard:

```text
https://api.example.com/api/v1/payments/webhook
```

Use the same value as `RAZORPAY_WEBHOOK_SECRET`. Subscribe to:

- `payment.authorized`
- `payment.captured`
- `payment.failed`
- `order.paid`
- `refund.processed`
- `refund.failed`

The route is mounted **before** `express.json()` and reads the exact raw body.
Do not move it below the JSON parser: re-serialising JSON changes whitespace and
invalidates the HMAC.

Replay protection hashes the signed raw body with SHA-256. The unsigned
`X-Razorpay-Event-Id` header is not trusted. A duplicate delivery is acknowledged
with `200` so Razorpay stops retrying. Failed deliveries are retried by the
provider.

For local sandbox testing, expose the backend with a tunnel:

```powershell
ngrok http 5000
# Set the HTTPS forwarding URL + /api/v1/payments/webhook in Razorpay.
```

## Sandbox verification checklist

Only claim a real sandbox payment after completing these steps with test keys:

1. `PAYMENT_MODE=test` and `rzp_test_...` keys are loaded by the backend.
2. The backend starts without the payment-configuration warning.
3. Create an event booking in `PAYMENT_PENDING` with an approved quote, or a
   home-service job in `SERVICE_COMPLETED`.
4. Click Pay and complete Checkout with Razorpay test credentials.
5. Confirm the backend response for `/payments/verify` is `COMPLETED`; the UI
   must show success only after that response.
6. Confirm the booking/inquiry transition happened once and the payment id is in
   `appliedPaymentIds`.
7. Replay the same webhook body and confirm `duplicate: true` and no second
   booking update.
8. Send an invalid `X-Razorpay-Signature` and confirm `400`.
9. Cancel Checkout and confirm no success state and no booking update.
10. Create a second order with the same idempotency key and confirm no duplicate
    chargeable order is created.
11. Refund a captured payment from the admin API and confirm the payment and
    target balances update.

Mocked tests are not a substitute for this checklist. No live-mode payment has
been claimed by this repository's automated tests.

## Refunds

Refunds are admin-only:

```http
POST /api/v1/payments/admin/refund
Authorization: <admin token>
Content-Type: application/json

{
  "targetType": "EVENT_BOOKING",
  "paymentId": "24-character-payment-id",
  "amount": 1000,
  "reason": "Customer request"
}
```

The amount is optional; without it the remaining refundable balance is used.
Refunds update the payment's refund fields and reduce the target's paid amount.
They do not cancel a booking or change an inquiry's event status. A pending
refund is completed by `refund.processed` / `refund.failed` webhooks.

## Deployment restart

After updating the backend environment and schema:

```powershell
cd backend
npm run build
pm2 restart heptome-backend --update-env
pm2 logs heptome-backend --lines 50
```

Restart the frontend too if `NEXT_PUBLIC_API_URL` changed. Never print the key
secret or webhook secret in logs or shell history.

## Rollback

1. Set `PAYMENT_PROVIDER=disabled` and restart the backend. Existing data is
   untouched; checkout endpoints return `503`.
2. Keep the webhook route deployed so in-flight provider events can still be
   acknowledged and recorded. If you must roll back the code, retain the
   additive database fields and the `PaymentWebhookEvent` collection.
3. Do not drop payment collections or reset the database. Refunds and
   reconciliation depend on the recorded provider ids.
4. If a deployment is rolled back before any real payment, the additive fields
   can remain; they are harmless and keep the next deployment forward-compatible.

## Security notes

- Browser requests send only `targetType`, `targetId` and an optional retry key.
  Amount, currency, customer identity and success flags are server-derived.
- Signature verification uses the key secret; webhook verification uses the
  webhook secret. Both use timing-safe comparison.
- Provider responses are reduced to safe fields before storage. Raw SDK errors
  are not returned to clients.
- Payment endpoints have a dedicated rate limit in addition to the global limit.
- Admin refunds use admin authentication, not customer JWT authentication.
- Do not add Razorpay secrets to `NEXT_PUBLIC_*`, client bundles, HTML, logs or
  analytics.
