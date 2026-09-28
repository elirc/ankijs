# A second editor overwrites a fix

Reproduce a lost update and make stale writes visible.

Prerequisites: CRUD, HTTP status codes.
Runtime: Node fixture; later PostgreSQL
Reviewed: 2026-09-26

## Case evidence

A and B load note version 3. A saves version 4. B sends its old text; the endpoint blindly updates by ID and reports 200. The database now contains B's stale draft.

## Assignment

Add expectedVersion to the request. Test two writers with the same expected version and prove exactly one succeeds. Show the stale user a reload/compare choice with their draft preserved.

## Hints

- A separate SELECT then UPDATE leaves a race.
- Check the affected-row count of a conditional write.

## Reference explanation

Use UPDATE notes SET body=$1, version=version+1 WHERE id=$2 AND owner_id=$3 AND version=$4 RETURNING *. No matching row requires distinguishing inaccessible/missing from a version conflict without exposing another owner. Keep the comparison and write atomic. Do not automatically retry a stale draft over the new version.

## Acceptance criteria

- [ ] One of two competing writes conflicts.
- [ ] A denied owner cannot modify the row.
- [ ] The conflict UI retains the unsaved draft.

## Further reading

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
