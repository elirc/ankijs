# 19. Event delivery, projection order, and recoverable workers

Use workshop units integration-dedup, integration-order, integration-outbox, ops-queue-backlog, and ops-shutdown. Read [the outbox case](../../../../public/workshop/integration-outbox.md), [queue backlog](../../../../public/workshop/ops-queue-backlog.md), [shutdown](../../../../public/workshop/ops-shutdown.md), and Inbox and Projection in [reference.mjs](../../../../public/workshop/fixtures/reference.mjs). Compare this event-delivery model with Recall's dirty-row queue from chapter eight. The word outbox can describe related architectures with materially different payload and history contracts.

## Event identity is not row freshness

Recall's local queue coalesces changes to the same table and row, then sends current row state. The workshop event model represents an event such as incrementing a balance by a particular amount. Two distinct increments should both apply even if they concern the same account. Coalescing them into one dirty identity without preserving the accumulated state or event meaning would lose information.

Conversely, sending every intermediate card edit as an immutable event is not what Recall's current queue implements. Choose the model from the required semantics. A replicated current snapshot and a ledger of domain events answer different questions about history, replay, and conflict resolution.

The workshop Inbox remembers event IDs and maintains a balance. Receiving a new integer amount computes a proposed next balance, optionally injects a crash before commit, then updates the balance and seen set. Receiving an already-seen ID returns false without another increment. This is an in-memory model of coupled effect and deduplication, not a durable database transaction implementation.

## Worked trace: send, effect, lost acknowledgment

A worker holds pending event e9 for amount seven. It sends the event, and the inbox applies seven. The worker crashes before removing the pending item. Another attempt sends e9 again. The inbox sees the same identity, returns false, and leaves the balance at seven. The worker can now acknowledge the pending entry.

The existing integration test demonstrates this sequence by retaining an item in a local pending array between two receives. It proves one effect for that repeated ID under the model. It does not implement a durable publisher lease, process restart storage, or database atomicity. A report should label those as extension requirements rather than treating the array as a production queue.

The before-commit crash injection is another sequence. Inbox.receive computes the next value but throws before updating either balance or seen. A subsequent retry can apply the event once. The seen marker must not be written before an effect that might fail, or the retry could be discarded despite the missing effect. The effect must not commit without its dedup marker, or replay could apply it again.

## Duplicate detection is not payload conflict detection

Inbox checks seen before validating a new amount. A repeated ID with changed content is ignored as a duplicate; the helper does not compare fingerprints. That differs from IdempotentStore, which rejects changed serialized payload under the same operation key. Decide whether an event protocol should reject identity reuse with different content, retain a fingerprint for diagnostics, or trust an upstream invariant.

The model also relies on callers to validate event identity; the HTTP service checks for a nonempty string ID before calling it. A direct test of Inbox with arbitrary malformed events should not be mistaken for the complete HTTP contract. Validation responsibilities can be split across layers, but the split must be visible in the explanation.

## Projection versions solve a different ordering problem

Projection holds one version and status. It accepts an event only if event.version is greater than the current version. An older snapshot arriving after a newer one cannot overwrite the current status. Equal versions are also ignored, so conflicting values at the same version have a first-accepted policy in this small model.

This works for versioned snapshots of the modeled entity. It does not mean that any event stream can discard older deliveries. A debit delta is not an obsolete snapshot merely because another delta arrived later. If every delta matters, skipping one loses an effect. The learner must identify whether the payload is a replacement state, an increment, or a command before choosing an ordering rule.

The fixture has one global Projection instance, not a map keyed by entity. A production stream covering several orders would need per-entity version state. Applying a high version from one order to block another order's lower version would conflate their histories. Use a two-entity extension exercise to expose that missing scope.

## A recoverable worker needs more state

The workshop assignment asks for claiming pending entries, leases, retries, and delivery records. A useful design distinguishes pending, leased, delivered, and exhausted states, with an owner token and expiration for an active lease. A process that dies must not leave work permanently in progress. A later worker needs a defined way to reclaim expired work.

A lease is not proof that an external effect did not happen. If the first worker sent before dying, reclamation can repeat the send. The consumer's duplicate policy remains necessary. Likewise, cancellation during shutdown is a request to stop local work; it does not undo a remote commit that already occurred.

Stop accepting new jobs when shutdown begins, permit a bounded drain, then leave unfinished work recoverable. A stuck dependency must not make shutdown wait forever. The corresponding experiment needs both a successful drain and forced termination before acknowledgment, followed by recovery using the same event identity.

## Poison work and useful observability

The queue-backlog case supplies rising depth and oldest age with low worker CPU and one endlessly retried malformed item. The problem is not necessarily insufficient compute. A permanent failure at the head can block healthy work. Bound attempts, retain an inspectable exhausted state, and define a repair/replay path rather than silently deleting the item.

Measure oldest pending age, attempt counts, failure classes, and successful throughput. An average duration over successful jobs can look healthy while one item has been stuck for an hour. A safe diagnostic record identifies event and attempt metadata without copying secrets or unnecessary private payloads into logs.

## Laboratory and graded exercises

**A19-A:** Contrast a coalesced card-row update with two distinct balance events. Five points require explaining which history each model preserves.

**A19-B:** Trace crash before effect and crash after effect before acknowledgment. Five points require balance and seen-state assertions in both sequences.

**A19-C:** Demonstrate equal-version and two-entity projection limitations, then distinguish snapshots from deltas. Five points require a scope-aware extension design.

**A19-D:** Design a leased worker with bounded shutdown and poison-item recovery. Four points require an explicit replay identity and no exactly-once claim unsupported by storage evidence.

For the laboratory, use the supplied reference tests first, then implement your own small worker state machine in a scratch file. Inject time and send outcomes. Record transitions rather than waiting in real time. Read [the review](reviews/19-event-delivery-order-and-recoverable-workers.md) after showing which effects survive each crash window.
