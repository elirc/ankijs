# 16. Notes, conversion, and precise search contracts

Read [noteRepo.ts](../../../../src/db/repos/noteRepo.ts), [its tests](../../../../src/db/repos/noteRepo.test.ts), [ConvertNoteDialog.tsx](../../../../src/features/inbox/ConvertNoteDialog.tsx), [InboxScreen.tsx](../../../../src/features/inbox/InboxScreen.tsx), and [cardRepo.ts](../../../../src/db/repos/cardRepo.ts). This chapter traces a small workflow across UI state, repository operations, and derived lists. The goal is to describe exactly what the current code guarantees before proposing stronger behavior.

## A note's state is more than its body

CaptureNote creates an ID, trims the body, sets status to inbox, initializes card_ids to an empty array, and records timestamps and null deletion. The note and its outbox identity are written together. UpdateNoteBody also trims and advances updated_at. Archive changes status; delete sets a tombstone. These operations affect different fields and imply different recovery or visibility semantics.

ListInbox queries status equal to inbox, filters out tombstoned notes, and sorts by creation time ascending. An archived note and a deleted inbox note both disappear from that list, but they remain distinguishable in storage. A test that observes only list length cannot tell whether the correct state transition happened. Inspect the stored status or tombstone as well.

The repository does not enforce every UI constraint. CaptureNote trims but does not itself reject an empty resulting string. A form may impose an additional rule before calling it. If you claim blank notes are impossible, trace every writer and validation boundary rather than inferring a repository guarantee from one disabled button.

## Worked trace: one note becomes several cards

The conversion dialog starts front with the note body, back empty, and a selected deck when available. CanCreate requires a deck and nonblank front and back. CreateOne calls createCard with note_id, saves the selected deck preference, and appends the created card ID to component state. Create and add another then clears the front and back so another card can be authored from the same note.

Finish combines any newly returned ID with the existing createdIds array, calls markConverted when there are IDs, and closes the dialog. Passing the returned ID directly matters because React state updates are not synchronously reflected in the current closure. If the Create handler waited only for setCreatedIds to appear in the old closure, it could omit the just-created card from the note's recorded links.

MarkConverted reads the note, combines existing card_ids with incoming IDs through a Set, sets status converted, and queues the note. Repeating an ID does not duplicate it in that array. A missing note returns without an update. The existing tests cover merging a,b with b,c into a,b,c and verify the converted note leaves the inbox.

## Two repositories do not create one workflow transaction

CreateCard has its own cards/outbox transaction. MarkConverted has its own notes/outbox transaction. The dialog awaits them in sequence, with preference storage and UI state between parts of the workflow. There is no surrounding single transaction in the inspected dialog that commits card creation and note conversion together.

A failure after card creation but before markConverted can therefore leave a real card while the note remains in the inbox or lacks the reciprocal card_ids update. This observation is a recovery design question, not proof that the card write itself was non-atomic. Local transaction scope and multi-step workflow scope are different levels.

Design an isolated failure injection after createCard returns. Inspect the card's note_id, the note's status and card_ids, and both queue identities. Then describe a recovery policy: preserve the created card, retry linking with its existing ID, and avoid creating a duplicate merely because the final step failed. That is a proposed policy requiring implementation and tests, not a claim that the current dialog already performs automatic reconciliation.

## Duplicate submission and state identity

CanCreate reflects field validity. It is not a synchronous busy guard. The inspected Create handlers do not set a dedicated in-flight flag before awaiting createOne. A learner should recognize the difference from the guardedSave fixture in chapter four. Valid input can remain valid while a request is in progress.

Propose a controlled double-click test with a held repository promise. Count actual createCard calls and inspect created IDs. Do not claim an observed duplicate without executing the fixture, but identify the unguarded path from source. If adding protection in a scratch solution, preserve failure recovery and newer user input rather than leaving the interface permanently disabled after a rejection.

Stable IDs also matter during retry. Deduplicating the note's card_ids array cannot deduplicate two separately created cards with different IDs. Set-based link cleanup solves repeated references, not repeated entity creation. This distinction is a useful test of whether the learner understands the layer at which an identity is applied.

## Deleting a note does not delete its cards

The inbox confirmation explicitly says cards already made from the note are kept. DeleteNote only updates the note tombstone and its updated_at, then queues the note. It does not iterate through card_ids or tombstone cards. A source trace should connect that product text with the repository effect.

A regression test can create a linked card, delete the note, and assert the note leaves the inbox while the card remains readable. Also inspect card.note_id: retaining the card does not necessarily mean clearing its provenance reference. Decide whether a proposed cleanup changes that history before adding it under the label of deletion consistency.

## Card search is a defined local filter

SearchCards trims the query, converts it with toLocaleLowerCase, obtains listCards for the optional deck, and returns all listed cards for a blank normalized query. Otherwise it tests substring inclusion in front or back after the same case conversion. ListCards has already excluded tombstones and sorted by created_at.

This is not fuzzy ranking, full-text tokenization, or a server-side paginated search. A prefix, a middle substring, and text in the back can match. A deleted card does not reappear merely because its text matches. Suspended cards are not filtered by listCards here, so search visibility and study eligibility are separate concerns.

The implementation reads and filters the selected local collection. A proposed large-library optimization must preserve the blank-query contract, deck scope, deletion handling, and ordering. Adding a page limit before filtering can hide matches located later in the collection. If pagination is introduced, define whether count means all matching rows or just the current page and test that meaning explicitly.

## Laboratory: a contract table

Create fixtures for an inbox note, an archived note, a tombstoned inbox note, a converted note, a live card with a matching back, a suspended matching card, and a deleted matching card. Predict each relevant list result before running focused repository tests. Then add a blank query and a deck-limited query. This small matrix reveals more contract boundaries than a large collection of identical happy-path records.

## Graded exercises

**A16-A:** Distinguish archive, conversion, and deletion through stored fields and list behavior. Five points require more than a final length assertion.

**A16-B:** Trace createOne and finish, including the direct returned ID and separate transaction boundaries. Five points require a concrete partial-workflow failure state.

**A16-C:** Design a double-submit and retry experiment that separates duplicate links from duplicate entities. Five points require stable identity reasoning and failure recovery.

**A16-D:** Specify current search behavior and a pagination-preserving extension test. Four points require blank queries, deck scope, suspended cards, and tombstones.

## Hints and transfer

For A16-B, distinguish the current closure from the next render. For A16-C, two UUIDs remain two entities even when each appears once. For A16-D, follow listCards before analyzing includes. Read [the review](reviews/16-notes-conversion-and-search-contracts.md) before generalizing this workflow to converting drafts into published records.
