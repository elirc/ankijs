# 20. SQL concurrency as an invariant laboratory

Use the real workshop units sql-lost-update, sql-unique-race, sql-deadlock, sql-write-skew, and sql-expand-contract. Start with [setup.sql](../../../../public/workshop/sql/setup.sql), then read the [lost-update schedule](../../../../public/workshop/sql/sql-lost-update.sql), [unique race](../../../../public/workshop/sql/sql-unique-race.sql), [deadlock schedule](../../../../public/workshop/sql/sql-deadlock.sql), [write skew](../../../../public/workshop/sql/sql-write-skew.sql), and [expand-contract example](../../../../public/workshop/sql/sql-expand-contract.sql). These are paired-session experiments, not one magical script that proves all concurrency behavior when run once.

## Establish the disposable boundary

Setup drops and recreates the recall_workshop schema. Its own comment requires an explicitly selected disposable database. Do not run it against the only working application database. The course's verification does not execute these destructive setup statements or claim a live PostgreSQL concurrency run. A learner conducting the experiment must first create and identify an isolated destination under their own authorized workflow.

The schema includes two counters, a unique username table, two on-call doctors, a shared roster row, and notes with owner, body, timestamps, archive state, and version. Each fixture represents a different invariant. Reset the relevant fixture between experiments so a previous run's state does not determine the next result accidentally.

Keep separate session transcripts labeled A and B. A concurrency claim needs an interleaving: which statement read which state, which statement waited, and which commit happened first. Sequentially pasting both transactions into one terminal may demonstrate SQL syntax while avoiding the race entirely.

## Lost update: stale absolute assignment

In the broken schedule, both sessions read counter value zero and later write the absolute value one. The second update may wait for the first transaction, but after both commit the final value is still one. Waiting for a row lock does not make the application recompute an absolute value it derived from an earlier read.

The alternative statement sets value to value plus one inside the update. Each operation expresses the increment to be applied to the row rather than submitting an already-computed replacement. After the fixture is reset and both atomic increments complete, the expected value is two. Explain the changed expression, not merely that a transaction was added, because both demonstrations already use transactions.

A version-check alternative would treat a stale replacement as a conflict and require the caller to reconsider it. That resembles the notes capstone. Atomic arithmetic and optimistic version checks solve different operation contracts: one means increment the current value; the other means replace the value only if the observed revision still holds.

## Uniqueness belongs at the committing boundary

The usernames table has a unique constraint. Two preliminary SELECT checks can both observe absence, so they cannot alone guarantee uniqueness. The fixture pauses after A's insert while B attempts the same value. After the winning transaction commits, the competing insertion receives the database conflict under the supplied schedule.

The ON CONFLICT alternative returns no row when that statement did not create a username. It does not establish that the caller owns an existing account. A convenient lookup of the conflicting row must not be confused with authorization to return private data. The domain response should distinguish unavailable name from successful account creation.

Define canonical name rules separately. Plain text uniqueness does not automatically implement every desired case or Unicode equivalence. In the lab, state whether Ada and ada should be the same and identify what stored representation or index would enforce that rule. Do not change normalization silently while claiming only to fix a race.

## Cross-row decisions need a shared protocol

The write-skew schedule begins with two doctors on call. Each transaction sees another doctor and turns off its own row. Because the decisions concern a shared roster invariant, individually valid row updates can leave zero active doctors. The invariant is at least one active member, not merely a boolean column with valid values.

The fixture proposes serializable transactions with whole-transaction retry, or a shared roster-row lock used by every writer. Under the shared-lock approach, the decision and update occur while holding the agreed common lock. A second writer makes its decision after the first has completed, so it cannot rely on the same obsolete count.

All paths modifying roster membership must participate. A carefully locked screen handler does not protect an administrator endpoint that bypasses the protocol. Extend the fixture to three doctors and an alternate write path to test the scope of the invariant. Record observed outcomes rather than promising a particular victim transaction in every run.

## Deadlock and retry scope

The deadlock example has A lock counter one while B locks counter two, then each requests the other's lock. The dependency cycle differs from ordinary waiting on one resource. The corrected protocol acquires both rows in a consistent ordered query before updates. The fixture then asks for bounded retries of the whole transaction in application code.

Retrying only the last statement can reuse decisions made in a transaction that has already failed. A new attempt needs the complete operation's reads and writes under a fresh transaction. Combine this with the retry-budget lesson: retryable concurrency failure does not authorize an unlimited loop or repetition of unrelated external side effects inside the transaction body.

## Migration while writers remain active

The expand-contract example adds content beside body, has transitional writers update both, and backfills only rows whose content remains null. It rechecks the null predicate in the update, protecting a value already supplied by a concurrent transitional writer. Readers should switch only after coverage checks, and the old field should remain until old readers and writers are retired.

A rollback plan must consider data written by the new version. Reverting application code while dropping fields or changing semantics can strand that data. The laboratory asks you to interleave a transitional edit before and after a backfill batch and verify the newest content survives. A row count alone cannot prove the values were preserved.

## Graded exercises

**A20-A:** Produce a two-session lost-update transcript and compare absolute replacement with atomic increment. Five points require the actual read/write order.

**A20-B:** Demonstrate the unique race and explain the zero-row ON CONFLICT result without implying ownership. Five points require a declared name-equivalence policy.

**A20-C:** Compare write skew and deadlock, including full-transaction retry and alternate writers. Five points require the shared invariant rather than only individual row validity.

**A20-D:** Design a concurrent backfill test and reversible reader/writer transition. Four points require inspecting newest values and stating which live database experiments were actually run.

Read [the review](reviews/20-sql-concurrency-as-an-invariant-laboratory.md) after writing your proposed interleavings. The supplied [verify.sql](../../../../public/workshop/sql/verify.sql) checks several local fixture properties within a rolled-back transaction; it is not a substitute for the paired-session schedules.
