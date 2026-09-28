# Two sessions increment one counter

Observe a lost update and replace it with an atomic operation.

Prerequisites: SELECT and UPDATE, Transactions.
Runtime: PostgreSQL 16+
Reviewed: 2026-09-26

## Case evidence

Fixture: counters(id PRIMARY KEY, value integer), row (1,0). Session A reads 0. Session B reads 0. Each computes 1 in application code and executes UPDATE ... SET value=1. The final count is 1.

## Assignment

Run the supplied two-session SQL script at READ COMMITTED. Record the interleaving. Replace the literal assignment with value=value+1 and repeat. Explain what happens if one transaction rolls back.

## Hints

- A transaction around each isolated read/write does not automatically eliminate stale calculations.
- Let the shared database apply a relative update.

## Reference explanation

An UPDATE counters SET value=value+1 WHERE id=1 statement takes the relevant row lock and evaluates against the row being updated. Both committed increments yield 2; a rolled-back increment contributes nothing. A versioned conditional update is another option when the change is a full replacement that cannot be expressed relatively.

## Acceptance criteria

- [ ] The original schedule reproduces 1.
- [ ] Two atomic increments finish at 2.
- [ ] Rollback behavior is verified.

## Further reading

- https://www.postgresql.org/docs/16/transaction-iso.html
- https://www.postgresql.org/docs/16/explicit-locking.html
