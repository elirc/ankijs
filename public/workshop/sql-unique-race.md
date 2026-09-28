# Two requests claim the same name

Make uniqueness a database invariant.

Prerequisites: Unique constraints, INSERT.
Runtime: PostgreSQL 16+
Reviewed: 2026-09-26

## Case evidence

Both sessions run SELECT for username='ada' and find no row. Both then INSERT. Without a constraint, duplicates are possible. With UNIQUE(username), the second statement may wait and then conflict.

## Assignment

Run the competing inserts with and without the fixture’s unique constraint in a disposable database. Handle the conflict as a domain outcome. Test case-normalization rules separately.

## Hints

- A preliminary SELECT is advisory.
- Define whether Ada and ada are the same name before choosing the index.

## Reference explanation

Enforce the chosen canonical name with a unique constraint/index. Use INSERT ... ON CONFLICT when its result matches the API contract, or translate the unique violation. Do not return another user’s private row as a convenience. A case-insensitive rule needs a deliberate canonicalization/collation strategy; plain text uniqueness does not establish every Unicode equivalence.

## Acceptance criteria

- [ ] Only one canonical name can commit.
- [ ] The loser receives a useful conflict outcome.
- [ ] Case/normalization behavior is documented and tested.

## Further reading

- https://www.postgresql.org/docs/16/transaction-iso.html
- https://www.postgresql.org/docs/16/explicit-locking.html
