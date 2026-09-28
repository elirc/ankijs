# Opposite lock order deadlocks

Diagnose a deadlock and retry the whole transaction safely.

Prerequisites: Transactions, Row locks.
Runtime: PostgreSQL 16+
Reviewed: 2026-09-26

## Case evidence

Session A locks row 1, then requests row 2. Session B locks row 2, then requests row 1. Neither can proceed. PostgreSQL aborts one transaction to break the cycle.

## Assignment

Use the supplied paired scripts and record the deadlock report. Standardize lock order, then repeat. Add a bounded retry around the entire transaction, with no non-idempotent external effects inside it.

## Hints

- Retrying only the final statement does not reconstruct the aborted transaction.
- Consistent lock order reduces this cycle but is not a universal guarantee.

## Reference explanation

Acquire related rows in the same deterministic order. On a retryable transaction failure, roll back and restart the complete unit of work with a fresh snapshot and bounded retry budget. Keep outbound notifications outside the transaction or record an outbox event atomically, then deliver separately.

## Acceptance criteria

- [ ] The report identifies both conflicting lock orders.
- [ ] The revised operations use a consistent order.
- [ ] A retry does not duplicate external effects.

## Further reading

- https://www.postgresql.org/docs/16/transaction-iso.html
- https://www.postgresql.org/docs/16/explicit-locking.html
