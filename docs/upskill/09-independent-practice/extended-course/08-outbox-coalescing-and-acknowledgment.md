# 08. Outbox coalescing and acknowledgments that preserve newer work

Read [outbox.ts](../../../../src/db/sync/outbox.ts), [its tests](../../../../src/db/sync/outbox.test.ts), [card writes](../../../../src/db/repos/cardRepo.ts), and pushOutbox in [the sync engine](../../../../src/db/sync/engine.ts). Compare the architecture with workshop unit integration-outbox and [its case](../../../../public/workshop/integration-outbox.md). Recall's outbox records dirty row identities, not a permanent immutable event for every individual edit.

## Coalescing changes what a queue count means

An entry identifies table_name and row_id and carries queued_at plus a database entry ID. Re-enqueuing the same table and row refreshes the marker instead of adding one entry per edit. Five local changes to one card can therefore correspond to one pending outbox entry. PendingOutboxCount measures queued entries, not the number of historical edits or user actions.

The table name is part of identity. A card named a and a note named a are separate queued rows. EnqueueMany deduplicates requested row IDs within its target table, preserves an existing queue ID where possible, and leaves entries for other tables alone. A global row-ID-only map would accidentally combine unrelated records.

The outbox does not store the entire payload at enqueue time. PushOutbox captures queue entries, groups them by table, and fetches current rows later for sending. A row can change between those steps, so the sent payload is not necessarily a historical snapshot frozen when the queue entry was captured. The acknowledgment marker prevents loss even when newer work has appeared.

## Worked trace: an old acknowledgment meets a new edit

At time T1, enqueue card c1 and capture that outbox entry for a push. While the push is in flight, edit c1 again and refresh its queued_at to T2. The remote request succeeds. RemoveOutboxIfUnchanged reloads the current entry by its queue ID and compares its marker with the captured marker. They differ, so it leaves the entry pending for another push.

If cleanup instead deletes by row ID unconditionally, it erases the signal for the second edit. The UI can show no pending work while the remote side lacks the latest state. The defect occurs after a successful request, which is why testing only remote rejection misses it.

After a later push captures the T2 entry and no further edit occurs, cleanup sees the same marker and removes it. The acknowledgment means this captured generation has not been superseded locally. It does not mean no future edit can occur, and it does not create an exactly-once delivery guarantee.

## Equal wall-clock times still need distinct generations

Two writes can happen within the same millisecond. If both store the same timestamp string, stale cleanup cannot distinguish them. NextQueuedAt handles valid parsed timestamps by choosing the larger of the proposed time and one millisecond after the previous marker, then formatting it as ISO. A repeated or backward wall-clock proposal still advances this queue marker.

This is a logical freshness marker derived from time, not a trustworthy measurement of when the user acted. Do not use its artificial one-millisecond increments as an audit chronology. Its role is to differ when newer queued work supersedes an earlier capture.

The helper also supports the simple non-date strings used by tests. If the proposed marker exactly equals the previous unparsable marker, it appends :next; otherwise it uses the proposed string. That fallback establishes distinction for equal markers, not a universal chronological ordering of arbitrary strings. Keep the valid-date production path separate from this test-oriented observation.

## Domain write and queue write must commit together

CreateCard and updateContent declare transactions containing both cards and outbox, then perform the row write and enqueue within that boundary. ApplyReview includes cards, review logs, and outbox. This coordinates local state changes with their pending-sync signal. Writing the card successfully and crashing before enqueue would otherwise leave a local change that ordinary queue processing might never discover.

EnqueueOutbox itself performs reads and writes and does not establish a surrounding multi-table transaction for its caller. The repository operation supplies that boundary. EnqueueMany opens a transaction for its batch outbox updates, but that alone cannot make an unrelated caller's earlier domain write atomic. Always trace the outer operation that claims the business invariant.

The recall:outbox-enqueued event prompts scheduling. It is a notification, not a durable receipt proving the entire outer transaction has committed. A sync listener still needs to read actual persisted state under the repository's sequencing. Avoid equating dispatch of a browser event with successful remote delivery.

## Laboratory: three generations under one timestamp

Use the existing same-ms test as a starting point. Enqueue a card with a fixed ISO timestamp, capture it, enqueue again with the same timestamp through enqueueMany, and attempt cleanup with the first capture. The entry must remain. Capture the new entry, enqueue again with the same proposed timestamp through enqueueOutbox, and clean up with the second capture. It must remain again.

Finally capture the current marker without another write and remove it. The count should become zero. This last step proves the protection does not make entries impossible to acknowledge. Inspect marker values and queue IDs so you can distinguish generation advancement from accidental creation of duplicates.

Add a note with the same row ID and a batch containing duplicate card IDs. Verify the note marker stays unchanged, the existing card queue ID is preserved, and only the intended new card adds an entry. Snapshot counts before each operation rather than checking only the final total, which can hide one deletion combined with one accidental insertion.

## Remote success does not eliminate retry design

A crash after the remote write succeeds but before local cleanup leaves the entry queued and can cause another send. The backend operation must tolerate that retry under its own contract. The engine uses duplicate-ignoring upsert for review logs and named RPCs for other row types; understanding their server policies is separate work. Do not infer universal idempotency from the presence of a local outbox.

Similarly, clearing entries after a failed remote response would lose work. The engine throws on reported remote errors before unchanged-entry cleanup for that group. Partial remote progress across chunks can still lead to retries of already-sent rows, reinforcing why the remote operation's semantics matter.

## Graded exercises

**A08-A:** Trace old capture, new enqueue, stale cleanup, and current cleanup. Five points require preservation followed by eventual removal.

**A08-B:** Reproduce equal-timestamp generations through both enqueue functions. Five points require distinct markers without duplicate row entries.

**A08-C:** Verify compound identity and inspect the outer card/outbox transaction. Four points require explaining what enqueue alone does not guarantee.

**A08-D:** Analyze a crash after remote success but before cleanup. Four points require a retry-safe server requirement and no unsupported exactly-once claim.

## Hints, before the review

For A08-A, compare the captured queue generation with the current one. For A08-B, wall-clock equality is not logical-operation equality. For A08-C, follow the repository caller into its transaction declaration. Read [the review](reviews/08-outbox-coalescing-and-acknowledgment.md) after drawing both the local commit and remote acknowledgment boundaries.
