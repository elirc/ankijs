# 05. Backup validation and the real import boundary

Use workshop unit debug-partial-import, then read [dataRepo.ts](../../../../src/db/repos/dataRepo.ts), [its tests](../../../../src/db/repos/dataRepo.test.ts), and atomicImport in [the workshop fixture module](../../../../public/workshop/fixtures/reference.mjs). The small fixture stages changes in a Map. The application imports several Dexie tables in a transaction. Understanding how the model connects to the application requires naming exactly which failure and state each check observes.

## A valid JSON file is not necessarily a Recall backup

The outer backup check requires version one and arrays for decks, cards, notes, and review logs. That establishes a container shape, not valid row contents. ValidateRows then checks IDs, duplicates within each core table, field types, dates, allowed states, and nonnegative numeric fields. It rejects tables larger than the implemented row limit. Optional practice and user-state records have their own validation paths.

A malformed date can therefore be rejected before any transaction writes begin. That is useful and efficient. It is not a demonstration of rollback after a partial write. The existing test that corrupts a card's due value and observes empty tables establishes preflight rejection without partial import. A later injected storage error inside the transaction would be a different experiment.

Reference integrity is also specific. Inside the transaction, import builds a set of deck IDs from existing and incoming decks and rejects incoming cards whose deck IDs are absent. Do not expand that observation into a claim that every possible relation has a complete foreign-key validator. Inspect each relation separately before making that stronger statement.

## Worked trace: validation before writes

Start with an empty isolated test database. Prepare a backup containing one valid deck and one card with an invalid due date. The outer shape passes. Row validation reaches the card and throws before the import transaction. Neither deck nor card appears afterward. If a faulty implementation writes decks before validating cards, the same fixture leaves an orphaned partial import even though the caller sees an error.

Now repair the date but reference a missing deck ID. Row type validation can pass because a nonempty deck ID is syntactically valid. The relationship check inside the transaction rejects it against the union of existing and incoming decks. This illustrates why structural validation and relational validation are separate phases. Both should have direct tests.

A third case imports an older backup over a locally newer card. The application does not blindly replace every row. It reads local records and invokes merge functions, preserving the newer content according to their clocks. Backup import is therefore a merge operation with specific conflict policies, not an unconditional restore-to-exact-snapshot command.

## One transaction covers the coordinated local changes

Import declares a read-write transaction over decks, cards, notes, review logs, outbox, sync metadata, and user state. Within that boundary it performs merges and bulk writes, queues imported identities, applies retirement logic, restores supported learning records, and processes relevant preferences. The transaction is the intended local all-or-nothing boundary for those coordinated table operations.

Calling several async writes and awaiting Promise.all is not equivalent to this database transaction. Awaiting establishes completion observation; a transaction establishes commit or rollback behavior for participating storage operations. The distinction matters when a later operation fails after an earlier write has succeeded internally.

The export path first waits for queued practice writes, then reads its declared tables within a read transaction and includes supported preferences and practice data. That sequencing reduces a race between a pending practice edit and the exported snapshot. It does not create a cross-device global snapshot or prove that a remote server has already received every local change.

## Account fields are not trusted backup authority

For imported core rows, the code derives user_id from an existing local row where present, otherwise from the current session or null. It does not accept a foreign account ID in the backup as permission to claim that account. The existing test imports foreign IDs while signed out and expects null ownership afterward, along with restoration of a valid daily goal.

This normalization is not a replacement for the separate sync ownership checks. Importing content locally and authorizing remote account access are different operations. A backup is data supplied by a caller; it is not an authenticated assertion about whose cloud records may be changed. Preserve that boundary in any extension.

Preferences also have selective rules. For example, the daily goal is stored only when it is an integer in the accepted positive range. Do not assume every arbitrary property in a backup's preferences object becomes effective app configuration. Read the specific merge and save helpers for the field you are investigating.

## Laboratory: three levels of atomicity evidence

First, run a scratch Map staging model based on the workshop idea. Inject failure after staging the first incoming row and verify the original Map remains unchanged. Explain why committing the draft only after all staging succeeds prevents partial model changes. This establishes a conceptual invariant, not IndexedDB behavior.

Second, inspect and run the focused dataRepo test file in the existing test environment when dependencies are available. Record that it uses fake-indexeddb and the actual repository function. Identify tests for round trip, local-newer preservation, invalid shape, invalid row, and imported ownership. Do not label every one a mid-transaction failure test when its trigger occurs earlier.

Third, design a focused failure injection after a database write but before the transaction completes. In your own scratch test branch, arrange a controlled storage helper failure, then assert all participating tables retain their before-state. Keep such experiments away from the only copy of a personal study library. The new workbook does not execute destructive user-data imports.

## Debugging case: catching and continuing inside the transaction

A developer catches a failed table write, records an error string, and continues to let the transaction resolve. The outer caller now receives a completed transaction containing only some intended changes. Catching an exception is not rollback. If the contract requires all-or-nothing behavior, the failure must abort the transaction or propagate through the mechanism the database uses to reject it. A report field saying failed cannot undo committed writes.

## Graded exercises

**A05-A:** Classify invalid shape, invalid row, missing deck, and older-valid-backup cases by their validation or merge boundary. Five points require different expected outcomes.

**A05-B:** Demonstrate failure after staging in a Map model and explain its limits. Four points require unchanged original content.

**A05-C:** Audit the actual transaction table list and existing test coverage. Five points require distinguishing preflight rejection from rollback after writes.

**A05-D:** Design an isolated mid-transaction failure test plus a source-preserving restore procedure. Four points require no experiment against irreplaceable study data and no invented rollback evidence.

## Hints, before the review

For A05-A, an ID can be well formed while referencing nothing. For A05-C, locate the throw relative to the first write. For A05-D, snapshot every table whose coordinated behavior you claim. Read [the review](reviews/05-backup-validation-and-atomic-import.md) after drawing the validation and commit sequence.
