# Review 19. Recovery does not remove duplicate delivery

Return to [the assignment](../19-event-delivery-order-and-recoverable-workers.md). The best answers name the meaning of the payload before choosing a queue or projection policy. A current-state snapshot and an increment event cannot always share the same coalescing rule.

## A19-A: row state versus events

Recall's outbox identifies dirty rows and later fetches current payloads. Multiple edits can coalesce. Two separate balance-increment events represent two effects and need distinct identities unless another explicitly defined aggregate state preserves their combined meaning. The queue count therefore means different things in the two models.

Full credit requires describing what information would be lost by replacing two increments with one arbitrary event. It also requires acknowledging that the current Recall queue is not an immutable audit history of every edit. Neither model is universally better; the required semantics determine the choice.

## A19-B: both crash windows

Before-commit injection leaves balance and seen unchanged, allowing a later retry to apply once. After-effect-before-acknowledgment leaves the publisher's pending item while the consumer already remembers the event; resending must not increment again. Inspect both consumer fields and the pending item rather than relying on a response code.

The fixture is in memory, and its pending array is not a durable leased queue. The test establishes the modeled duplicate behavior. A process restart test requires persisted state or a separate implementation. A good report preserves the value of the small test while stating that limit.

## A19-C: projection scope

Projection accepts strictly greater versions. Equal or older versions do not replace its status. The single instance has one global version, so a multi-entity system needs per-entity state. Otherwise a high version for one order could block a legitimate update for another.

The discard rule fits versioned snapshots. It does not justify dropping an older delta whose effect has never been applied. Use one replacement-state example and one increment example to prove the distinction. Also note that Inbox ignores repeated IDs without fingerprint comparison; changed content under the same ID is not reported as a conflict by this helper.

## A19-D: worker state and shutdown

A recoverable design stops claiming work when shutdown begins, drains within a deadline, and permits abandoned leases to expire. Forced termination after send still permits duplicate delivery, so downstream idempotency or deduplication remains necessary. Cancellation does not prove that an external write failed to commit.

Poison work should become inspectable after bounded attempts rather than blocking healthy items forever or disappearing silently. Replay after repair needs a documented identity policy. If the original effect may already have committed, inventing a new event ID can duplicate it. Safe diagnostics record attempt and failure metadata without unnecessarily exposing payloads.

## Review milestone

Require a state-transition table covering claim, send, consumer effect, acknowledgment, lease expiration, and exhaustion. Mark the crash point in each experiment. Then ask which transitions are atomic in the learner's implementation and which are merely adjacent awaits. An answer based only on the word outbox is insufficient; the actual storage and claim protocol must carry the guarantee.
