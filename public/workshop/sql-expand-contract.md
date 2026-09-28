# Backfill while the app keeps writing

Make a migration coexist with live edits.

Prerequisites: SQL updates, Versioned writes.
Runtime: PostgreSQL 16+
Reviewed: 2026-09-26

## Case evidence

notes.body is moving to notes.content. A backfill reads old body values and later writes content, while users continue editing. A naive bulk copy can overwrite newer content or leave new rows missing.

## Assignment

Implement the supplied staged schema in a disposable database. Define the temporary dual-write/read contract, run bounded backfill batches, and test an edit between read and write. Record the removal gate.

## Hints

- Use database predicates/revisions to avoid stale backfill writes.
- A completed row count does not prove every writer uses the new contract.

## Reference explanation

Add content compatibly, deploy transitional writers, backfill only eligible rows with a concurrency-aware predicate, and monitor remaining gaps. Switch reads only after validation. Remove body after every old reader/writer has been retired and rollback requirements are met. Include newly inserted rows and partial-batch retries in verification.

## Acceptance criteria

- [ ] Old and new versions both handle the transitional schema.
- [ ] A concurrent edit survives the backfill.
- [ ] The contract/removal gate includes every writer.

## Further reading

- https://www.postgresql.org/docs/16/transaction-iso.html
- https://www.postgresql.org/docs/16/explicit-locking.html
