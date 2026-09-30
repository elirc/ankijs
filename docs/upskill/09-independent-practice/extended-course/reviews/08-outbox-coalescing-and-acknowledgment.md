# Review 08. Acknowledging a captured generation

Return to [the assignment](../08-outbox-coalescing-and-acknowledgment.md). The crucial identity is the queue entry together with its captured freshness marker. A remote success acknowledges work observed earlier; it does not authorize unconditional deletion of everything currently queued for that row.

## A08-A: old and current cleanup

After the first enqueue, capture the entry's database ID and queued_at. Re-enqueue the same table and row, then run cleanup with the old capture. The queue still contains the row because the current marker differs. Capture that current entry and clean up without another intervening edit. Now the entry is removed. Both assertions are necessary: preserving every entry forever avoids data loss but prevents progress.

The payload sent by the engine is fetched from current rows after queue capture. Therefore the sent record might already contain the newer content. Keeping the newer queue marker is still conservative and correct; cleanup cannot assume that every later local change was represented by the earlier captured generation. State the ordering of capture, payload read, edit, remote response, and cleanup when explaining any particular experiment.

## A08-B: repeated milliseconds

For valid timestamps, the marker advances to at least one millisecond beyond the previous marker, even when the proposed wall-clock value is identical or earlier. Exercise enqueueOutbox and enqueueMany because both paths can refresh a queued row. Verify that the queue ID is preserved and the number of entries stays one for that compound identity.

The non-date fallback used by simple tests appends :next only when proposed and previous strings are equal. It does not promise a globally increasing lexical order for arbitrary strings. Do not use that fallback to justify a production chronology claim. The marker is designed for equality-based freshness checks, and its synthetic increments should not be presented as precise audit timestamps of user actions.

## A08-C: identity and atomicity

A card and a note with the same row ID remain distinct because table_name participates in identity. A batch with repeated IDs for one target table should update that table's existing entries without duplicating them or touching another table's entry. Check IDs and markers as well as count: one accidental deletion plus one accidental insertion can leave a misleadingly correct total.

The outer card repository transaction includes cards and outbox. That boundary ties a domain change to its durable pending-work signal. EnqueueOutbox does not independently wrap an arbitrary earlier domain write in a multi-table transaction. EnqueueMany's own outbox transaction protects its batch, not unrelated changes already committed by a caller. A reviewer should ask the learner to locate the outer transaction before accepting an atomicity claim.

The browser event is a scheduling notification. It does not prove that remote delivery occurred, and observing dispatch is not a substitute for reading persisted queue state. A test that listens for the event can verify notification behavior while leaving local commit and remote processing as separate claims.

## A08-D: success followed by a crash

If the server accepts a write and the client crashes before cleanup, the queue can cause a retry after restart. The server operation must tolerate duplicate delivery according to its own contract. For review logs the engine uses duplicate-ignoring upsert; other row types use named RPCs whose policies need separate inspection. The existence of an outbox alone proves neither universal idempotency nor exactly-once execution.

If a group fails after some chunks succeed, retries may include rows already accepted. Preserve the queued signal until the relevant successful boundary, and explain how the backend resolves repetition. A good answer separates durable local intent, remote acceptance, and local acknowledgment into three events. The crash window between the last two is the reason retry design remains necessary even when all ordinary responses report success.

## Independent evidence

Deliver the generation timeline, the compound-identity assertions, and the transaction trace together. They answer different questions: whether newer work survives, whether unrelated rows stay distinct, and whether a local edit can exist without its queue signal. Passing only one does not establish the others.
