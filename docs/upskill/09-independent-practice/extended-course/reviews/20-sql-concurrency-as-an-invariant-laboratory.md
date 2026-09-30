# Review 20. An interleaving is the evidence

Return to [the assignment](../20-sql-concurrency-as-an-invariant-laboratory.md). Do not accept a concurrency claim supported only by running all statements sequentially. The fixture comments describe where sessions must pause so competing decisions overlap.

## A20-A: lost update

Both sessions read zero, then write the absolute replacement one. The second writer may wait, but it still submits the stale replacement, so the final result can remain one. After reset, value=value+1 expresses an increment at the database update boundary and the two completed increments yield two under the fixture.

The explanation must not say transactions alone fixed the issue, because both schedules use transactions. Identify the changed operation semantics. A version-checked replacement would instead reject a stale assumption and ask the caller to reconsider; that is another valid contract with different behavior.

## A20-B: uniqueness and meaning

A preliminary absence check is advisory under concurrency. The unique constraint decides which conflicting insertion can commit. ON CONFLICT DO NOTHING RETURNING name can return zero rows, meaning this statement did not create the name. It does not prove the caller owns an existing account or may inspect its private fields.

State the intended name-equivalence policy before choosing an index or canonical representation. The supplied plain text example does not establish every case-insensitive or Unicode rule. A test for Ada and ada should be derived from the chosen contract, not from an assumption that all uniqueness constraints normalize text identically.

## A20-C: different concurrency failures

Write skew violates a cross-row roster invariant while each individual row update is valid. A shared roster lock works only if every relevant writer uses it, or the serializable approach needs whole-transaction retry under the fixture's intended protocol. Deadlock instead forms a cycle of lock dependencies. Consistent acquisition order addresses that cycle for the participating paths.

After a transaction failure, retry the complete operation with fresh reads and a bounded policy. Retrying only the last statement can preserve obsolete decisions or operate in a failed transaction context. Include an alternate writer and more than two doctors when testing the invariant's real scope. Do not promise which participant will lose every concurrent run.

## A20-D: live backfill

Transitional writers update body and content together. The backfill selects null content and rechecks that condition when updating, so a concurrently supplied value is not blindly overwritten. Test edits on both sides of the batch timing and compare actual newest text, not only the count of nonnull rows.

Old readers and writers must be retired before dropping the old field. A binary rollback cannot undo incompatible data already committed by a new writer. The recovery plan therefore includes old-code/new-data fixtures and an explicit point beyond which a forward-compatible fix may be preferable.

## Execution honesty

Setup drops the workshop schema and belongs only in an explicitly selected disposable database. The workbook's Node verification does not run these PostgreSQL schedules. The supplied verify.sql tests local fixture properties within a transaction that rolls back, but it does not create the paired-session races. Mark your own SQL transcripts as executed only when the independent sessions actually ran, and preserve the database identity and observed interleaving in the evidence record.
