# Verify a webhook before parsing it

Authenticate the exact request bytes and reject stale deliveries.

Prerequisites: HTTP headers, HMAC basics.
Runtime: Node 22 crypto; local fake sender
Reviewed: 2026-09-26

## Case evidence

The sender signs timestamp + '.' + rawBody with HMAC-SHA256. The receiver parses JSON and signs JSON.stringify(parsed), changing whitespace and sometimes property representation. Legitimate requests fail, and the timestamp is never checked.

## Assignment

Use the supplied sender/receiver fixture. Verify the raw bytes with a constant-time comparison of equal-length digests. Reject malformed signatures and timestamps outside a documented window before processing. Rotate between current and previous secrets during a bounded overlap.

## Hints

- Parsing and reserializing changes the signed message.
- A valid signature alone does not establish freshness or uniqueness.

## Reference explanation

Read a bounded raw body, parse the signature format strictly, check timestamp skew, and compare a computed digest with timingSafeEqual after checking lengths. Parse the authenticated JSON afterward. Persist the event identity for deduplication. Keep secrets out of logs and distinguish malformed input from a signature mismatch without disclosing secret material.

## Acceptance criteria

- [ ] Changing one body byte invalidates the signature.
- [ ] Malformed or stale signatures fail without effects.
- [ ] A duplicate valid event produces no second effect.

## Further reading

- https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
- https://www.rfc-editor.org/rfc/rfc9110.html
