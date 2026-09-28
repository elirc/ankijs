# A failed import leaves half a library

Find the transaction boundary that the success message assumes.

Prerequisites: Promises, Database transactions.
Runtime: Node fixture; IndexedDB extension
Reviewed: 2026-09-26

## Case evidence

An import loops over rows and commits each write independently. Row 7 fails validation. The UI says import failed, but rows 1–6 remain. The catch handler cannot roll them back.

## Assignment

Validate the complete payload before writes, then apply dependent changes in one storage transaction. Inject a failure between cards and review-history writes and compare the full before/after state.

## Hints

- Promise.all is a waiting mechanism, not a transaction.
- Network waits inside an IndexedDB transaction can close it.

## Reference explanation

Separate file reading and validation from the database transaction. Include every dependent table in the transaction and let errors propagate so the database aborts. Report success only after commit. A deliberately partial importer is a different product contract and must expose per-row outcomes.

## Acceptance criteria

- [ ] Invalid input makes no writes.
- [ ] An injected mid-write failure rolls back every dependent table.
- [ ] A valid import survives reload with consistent references.

## Further reading

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
