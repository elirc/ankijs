# 13. Curriculum migrations that preserve personal work

Read [retiredCurriculum.ts](../../../../src/db/retiredCurriculum.ts), [contentCorrections.ts](../../../../src/db/contentCorrections.ts), [retiredRetrieval.ts](../../../../src/db/retiredRetrieval.ts), [retiredLibrary.ts](../../../../src/db/retiredLibrary.ts), and [retirement tests](../../../../src/db/retiredCurriculum.test.ts). Curriculum maintenance is a data migration problem because shipped lessons and personal edits share a local database. A global text replacement would not know which wording belongs to the publisher and which belongs to the learner.

## Identity is the first boundary

The retirement process begins with explicit shipped identities and known prefix families. It does not classify every card as obsolete merely because its text resembles an old lesson. This matters when a user copies an example into a personal card, moves a shipped card to another deck, or writes a card containing the same vocabulary.

There are several retirement policies, and they should not be flattened into one. Explicit cardIds in the retirement manifest are selected by identity even if moved. The retrieval family uses known IDs plus content hashes to identify unchanged shipped text. The source-derived library families use installation timestamps and known revision wording to distinguish unedited material from personal rewrites. A correct audit names which family a fixture belongs to before predicting preservation.

The existing test for explicitly declared old cards intentionally verifies retirement even after a move. Therefore an unqualified claim that every personal edit to every retired identity is preserved would be too broad. Preserve the exact contract for each family rather than exporting the most generous policy to all identities.

## Worked trace: a correction without schedule loss

A content revision lists an ID, one or more exact previous front/back pairs, and the corrected pair. ReviewedContentUpdates fetches the corresponding card and applies a correction only if the live card exactly matches an expected previous pair. It skips absent and deleted cards. The returned object spreads the existing card, replaces front and back, and advances content_updated_at.

Scheduling fields and their clock remain from the existing card. That means correcting the instructional wording does not intentionally reset the learner's repetitions or due date. A test should assert both the new wording and representative preserved scheduling fields. Checking only front text could miss an implementation that rebuilds a new card and silently loses study history.

If the learner rewrote the back while leaving the front unchanged, the exact pair no longer matches. The correction should not overwrite that personal text under this rule. Use a one-character personal change as a fixture to show that similarity is not the predicate. Then use an exact previous pair as the positive neighboring case.

## Content hashes are classification evidence

UnchangedRetiredRetrievalCards selects live candidates from its ID prefix range and loads the known hash mapping. For each candidate with a known original ID, it hashes JSON.stringify of the front/back pair using SHA-256 and compares the result. The serialization format is part of the comparison. Concatenating the strings without the array encoding would be a different fingerprint and could introduce ambiguous boundaries.

This hash is not an authorization token and is not proof that a remote party is trusted. It is a compact way to compare content with a known shipped baseline. A learner should explain the input bytes and the identity lookup before using the word hash as though it guarantees every desirable property.

The work is batched, and external import and crypto promises are wrapped with Dexie.waitFor to preserve the caller's transaction. Batching limits how much work is queued at once; it does not split the overall migration into unrelated commits. Keep memory scheduling and atomic storage boundaries separate in the trace.

## Deck visibility has provenance too

After retiring cards, the migration examines each declared retired deck for remaining live cards. An empty live deck is tombstoned and receives a sync_meta marker storing the deletion timestamp. A deck with surviving cards remains visible; if it still has the old shipped name, it is renamed My saved cards. A custom deck name is preserved.

Later, an old backup may introduce personal cards into a deck that the migration previously hid. The migration can restore that deck only when its stored marker equals the deck's deletion timestamp. That equality identifies the deletion as the migration's own action. If a user subsequently deleted the deck with another timestamp, the migration should not reinterpret that deliberate action as its own empty-deck cleanup.

This is a provenance check, not merely a nonempty-deck check. Without the marker comparison, any imported card could resurrect a deck the user intentionally removed. Without restoration for the migration's own deletion, legitimate personal cards arriving later could become inaccessible behind a hidden deck. The two tests must coexist because each guards a different side of the policy.

## Laboratory: four cards and two deck histories

Prepare an isolated database with an explicit retired card, an unchanged retrieval-family card, a personally rewritten source-library card, and an unrelated personal ID using similar text. Predict which candidates each selector returns before running retirement. Then inspect tombstones, content clocks, scheduling values, and outbox identities after the migration.

For decks, create one migration-owned tombstone with a matching marker and one user-owned tombstone whose timestamp differs. Add a live personal card to each and run the migration. The former can become visible under the restoration rule; the latter remains deleted. Capture names too, because the migration only replaces known shipped labels rather than every label.

Use existing fixture patterns and known IDs from the manifest or tests. Do not invent a prefix-shaped UUID and assume it appears in the known hash map. Prefix membership alone is not enough for the retrieval-family comparison. Record the exact baseline chosen so another reader can reproduce the classification.

## Repetition and older devices

The migration remains callable after import and sync because an older backup or device can reintroduce retired material. A one-time startup flag alone would not cover those later arrivals. Existing tombstones are filtered out, and unchanged state should not create needless new work. A repeated run is therefore a useful test of convergence, but the precise return value should be derived from the changes detected on that run.

Retirement queues changed card and deck identities in batches while preserving existing queue entry fields where appropriate. This code path builds its own queue updates; do not assume every queue writer necessarily calls enqueueMany. Follow the actual path when assessing freshness markers or transaction scope. A helper's guarantees apply only where it is used.

## Graded exercises

**A13-A:** Compare explicit-ID, retrieval-hash, and source-library retirement policies. Five points require a fixture each policy treats differently.

**A13-B:** Demonstrate exact correction matching while preserving scheduling and personal rewrites. Five points require both a positive correction and a one-field personal modification.

**A13-C:** Trace migration-owned versus user-owned deck deletion and later imported personal cards. Five points require the marker/timestamp equality check.

**A13-D:** Design a repeated migration and older-backup test, inspecting queue and visibility effects. Four points require real manifest identities and no broad text-based classification.

## Hints and transfer

For A13-A, the selector is part of the contract. For A13-B, inspect the spread before replaced fields. For A13-C, ask who caused the deletion rather than only whether a deck is empty. Read [the review](reviews/13-curriculum-migrations-that-preserve-personal-work.md) before applying this reasoning to template upgrades or seeded configuration migrations.
