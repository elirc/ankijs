# Review a column rename during rolling deployment

Protect old and new application versions during a schema transition.

Prerequisites: SQL migrations, Deployment basics.
Runtime: PostgreSQL 16+
Reviewed: 2026-09-26

## Case evidence

```diff
+ ALTER TABLE notes RENAME COLUMN body TO content;
```
The deployment keeps old API instances serving traffic for five minutes. They still select body.

## Assignment

Propose an expand/contract sequence including read/write compatibility, backfill, observability and a removal criterion. Specify the rollback behavior after new data has been written.

## Hints

- A database transaction cannot update already-running application code.
- Rollback must account for the shape of new writes.

## Reference explanation

First add a compatible column or adapter. Deploy code that maintains the agreed compatibility contract, backfill safely, then switch reads after measuring coverage. Drain old instances and verify no old readers/writers remain before removing the old field. Define how concurrent edits are reconciled during backfill. Test both application versions against each transitional schema.

## Acceptance criteria

- [ ] Old and new versions work during the transition.
- [ ] Backfill does not overwrite concurrent newer edits.
- [ ] Removal and rollback criteria are explicit.

## Further reading

- https://google.github.io/eng-practices/review/reviewer/
