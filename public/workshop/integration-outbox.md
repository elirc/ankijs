# Commit a change and deliver its event

Avoid a database/message double-write gap.

Prerequisites: Transactions, Workers.
Runtime: Node crash fixture; PostgreSQL extension
Reviewed: 2026-09-26

## Case evidence

The API commits an order, then publishes an event. A crash between them leaves an order with no event. Publishing first can create an event for a transaction that later fails.

## Assignment

Write the order and outbox entry atomically. Build a worker that claims pending entries, retries with a lease, and records delivery. Crash after send but before acknowledgment; prove the consumer handles the duplicate.

## Hints

- An outbox usually gives at-least-once delivery, not exactly-once effects.
- Lease expiry must allow another worker to recover abandoned work.

## Reference explanation

Commit the domain change and pending event in one database transaction. A worker sends committed events and marks progress using a recoverable claim/lease protocol. If it crashes after sending, it may resend, so the consumer must deduplicate the event identity. Bound poison-message retries and make exhausted items inspectable.

## Acceptance criteria

- [ ] A rolled-back order produces no deliverable event.
- [ ] A worker crash leaves recoverable pending work.
- [ ] Duplicate delivery produces one consumer effect.

## Further reading

- https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
- https://www.rfc-editor.org/rfc/rfc9110.html
