# Page through equal timestamps

Build a deterministic cursor with a tie-breaker.

Prerequisites: ORDER BY, Compound predicates.
Runtime: PostgreSQL 16+
Reviewed: 2026-09-26

## Case evidence

Five notes share created_at=2026-01-01T00:00:00Z. Page size is 3. The next query uses created_at > last_timestamp, so the remaining two notes disappear from traversal.

## Assignment

Use (created_at,id) as the ordered cursor, fetch one extra row to determine whether another page exists, and test inserts between page requests. State the consistency guarantee explicitly.

## Hints

- The WHERE comparison and ORDER BY must use the same direction and columns.
- A cursor is not a snapshot of the entire dataset.

## Reference explanation

For ascending order use WHERE (created_at,id) > ($time,$id) ORDER BY created_at,id LIMIT $size+1. Add the matching index and owner predicate. Equal timestamps are traversed deterministically. Rows inserted before an already-consumed cursor will not appear in that traversal; a fixed snapshot or bounded export contract requires additional design.

## Acceptance criteria

- [ ] Every fixture row appears exactly once with tied timestamps.
- [ ] The cursor cannot bypass owner scoping.
- [ ] Concurrent-insert behavior is stated, not assumed.

## Further reading

- https://www.postgresql.org/docs/16/transaction-iso.html
- https://www.postgresql.org/docs/16/explicit-locking.html
