 # External findings for commerce operations release

## Flutterwave v4 refund API
Source: https://flutterwaveinc.mintlify.app/v4-api-reference/refunds/create-a-refund

The v4 refund endpoint is `POST /refunds` on the configured Flutterwave API base URL. It uses bearer authentication, supports `X-Trace-Id` and optional `X-Idempotency-Key`, and requires a JSON body with `amount`, `charge_id`, and `reason`. Supported reasons include `duplicate`, `fraudulent`, `requested_by_customer`, and `expired_uncaptured_charge`. The response includes a refund object with an id, amount_refunded, charge_id, reason, and a refund status such as pending, succeeded, failed, cancelled, completed, or new.

## Flutterwave webhooks
Source: https://developer.flutterwave.com/docs/webhooks

Flutterwave webhooks support asynchronous payment events, including mobile-money payments and pending-to-successful transitions. The webhook request includes a data object, event type, webhook id, and timestamp. The `flutterwave-signature` header is an HMAC-SHA256 signature using the configured secret hash. The endpoint should acknowledge valid events with HTTP 200, respond within 60 seconds, be idempotent, and re-query Flutterwave to verify critical transaction fields before granting value.

## Legacy v3 refund behavior
Source: https://developer.flutterwave.com/v3.0/docs/refunds

The legacy v3 refund flow uses a transaction id and can support partial refunds, with refunds typically taking several business days depending on the payment rail. This project uses Flutterwave v4 direct charges, so the v4 `/refunds` contract should be preferred and any provider limitations should be surfaced as an admin-reviewed state rather than silently marking an order refunded.

Saved on 2026-08-27 for the role, logistics, payment, cancellation, refund, notification, and document implementation.

## Maps integration guidance
Source: project skill guidance, `/home/ubuntu/skills/webdev-maps-integration/SKILL.md`

The intended integration is the existing Google Maps proxy/SDK when available. Do not request a user-supplied Google Maps API key. If the project has no map component or dependency, a safe first release can use stored latitude/longitude plus an external Google Maps directions link, then add an interactive SDK map after the project’s map runtime is confirmed.
