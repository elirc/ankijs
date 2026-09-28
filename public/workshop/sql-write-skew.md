# Two doctors both go off call

Recognize a cross-row invariant that row updates alone do not protect.

Prerequisites: Isolation levels, Transactions.
Runtime: PostgreSQL 16+
Reviewed: 2026-09-26

## Case evidence

Two doctors are on call. Each transaction checks that another doctor remains, then sets its own row to off-call. Under an unsuitable isolation/locking strategy, both can commit and leave nobody available.

## Assignment

Run the paired schedule and state the invariant. Compare serializable transactions with a shared roster-row lock. Handle transaction retry failures and test more than two doctors.

## Hints

- The invariant spans more than the row being changed.
- A read followed by a write can depend on a snapshot that becomes stale.

## Reference explanation

Serialize decisions through an agreed shared lock row, or use SERIALIZABLE and retry serialization failures for the complete transaction. The invariant is at least one active doctor per roster, not merely a valid boolean on each row. All code paths modifying membership must follow the same protocol.

## Acceptance criteria

- [ ] The unprotected schedule demonstrates the invariant failure.
- [ ] The chosen protocol leaves at least one doctor active.
- [ ] Retry and alternate write paths preserve the invariant.

## Further reading

- https://www.postgresql.org/docs/16/transaction-iso.html
- https://www.postgresql.org/docs/16/explicit-locking.html
