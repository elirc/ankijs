# 09. Review application and undo that survives synchronization

Read [cardRepo.ts](../../../../src/db/repos/cardRepo.ts), [the card repository tests](../../../../src/db/repos/cardRepo.test.ts), [userStateRepo.ts](../../../../src/db/repos/userStateRepo.ts), and the review-log branch in [engine.ts](../../../../src/db/sync/engine.ts). This chapter connects an immediate user gesture to durable local state and later remote replay. A button labeled Undo is a product promise; implementing that promise requires more than restoring what the current screen displays.

## Separate calculation from persistence

The card test obtains a proposed card and log from the scheduler's rate function, then passes them to applyReview. The repository does not recalculate the entire scheduling decision. It stamps the resulting card with a fresh srs_updated_at, derives the log's user_id from the final card, and writes the card and log together. It also queues both identities for synchronization in the same transaction.

This separation creates useful test seams. A scheduler test can inspect a pure transition under a controlled date. A repository test can inspect storage and queue effects for a supplied transition. A screen test can inspect whether the right rating action reaches the repository. None automatically proves the others. When a regression changes a due date, first ask whether the calculation was wrong or the correct result was persisted incorrectly.

The transaction includes cards, review_logs, and outbox. That table list expresses the local invariant: the stored schedule and its review evidence should not disagree because only one write committed. Awaiting two unrelated writes would not establish this invariant. The queue signal is also part of the local change, so a successfully stored review is not silently omitted from ordinary synchronization because enqueue failed afterward.

## Worked trace: one rating and one undo

Start with a new card whose repetitions are zero and whose scheduling clock is T0. Rate it at a controlled instant. ApplyReview stores the proposed schedule with a new scheduling timestamp and stores the log with the card's owner. The local outbox contains a card identity and a review-log identity. At this point, the visible due date and the review history both describe the completed rating.

Now call undoReview with the earlier card snapshot and the log ID. Inside one transaction, the repository saves user state named review_revoked followed by a colon and that log ID, restores the supplied card snapshot with a fresh scheduling timestamp, deletes the local log, queues the card, and removes any queued review-log entry for that log. SaveUserState also queues the revocation record through the user_state path.

The fresh scheduling timestamp matters. Restoring the old field values with their old timestamp would make the undo look older than the already-synced rating. The operation restores prior scheduling values while announcing that this restoration is the latest scheduling decision. Values and their version evidence have different jobs. Do not equate undoing a value with moving the clock backward.

## Why deleting the log is insufficient

Suppose a remote service already accepted the review log before the user presses Undo. Removing only the local log and its pending queue entry cannot erase the remote copy. A later pull could reintroduce that record. The durable review_revoked identity records the decision that this log should no longer participate in local history.

When mergeUserState receives a revocation, it deletes the corresponding review log and preserves a revocation row. It treats the revocation as permanent independently of competing device clocks. When the engine merges a review log, it checks for that revocation identity before storing the log. These two branches handle different arrival orders: log then revocation, or revocation then log.

The source inspected here establishes client-side handling of that durable signal. It does not by itself prove every server-side retention or deletion policy. A careful submission can explain why a client needs the marker without claiming that the original event has vanished from all backups or audit systems. Cancellation of participation in study history and universal physical deletion are different contracts.

## Arrival order is an explicit laboratory dimension

Construct two isolated sequences. In the first, store a log, merge its revocation, then inspect both tables. In the second, store the revocation first and then exercise the engine's review-log merge path. Both sequences should leave the log absent under the intended policy. A direct call to mergeReviewLog alone is insufficient for the second sequence because that pure helper does not inspect user_state. The orchestration layer supplies the revocation check.

Include a neighboring unrevoked log. It should still be accepted. Without that case, a broken implementation that discards all review logs could satisfy the negative assertions. Also distinguish two logs for the same card: undoing one log should target its exact identity, not all historical reviews of that card. The ID in the revocation key carries that scope.

Record the ordering of local commit, remote push, undo, and pull. The most revealing sequence has the remote push succeed before undo. A test limited to an unsent local log exercises queue withdrawal but misses the reason a durable revocation is needed.

## A snapshot is also an assumption

UndoReview receives cardBefore from its caller and puts that supplied object back with a fresh scheduling clock. It does not reconstruct a prior schedule from the deleted log. Nor does it independently merge later content edits into that snapshot. If the application allowed unrelated edits between capture and undo, the caller and UI would need a clear policy for that interaction.

This is an investigation boundary, not an instruction to modify the runtime. Draw a scenario where the card's wording changes after the snapshot but before undo. Compare the fields written by the repository with the intended user experience. A proposal to restore only scheduling fields would need compatibility tests and a deliberate product decision. Do not silently describe the existing whole-snapshot write as a scheduling-only patch.

## Debugging case: an apparently successful undo

A defective implementation removes the local log and resets repetitions, so its immediate screen test passes. It omits the revocation record. After synchronization, the log appears again and study totals change. The failure is delayed because the first observation is narrower than the durable contract.

Improve the evidence in layers. Assert the card restoration, the absence of the local log, withdrawal of the log queue item, presence of the revocation user-state record, and a pending sync signal for that record. Then test replay. Each assertion corresponds to a distinct effect rather than repeating the same count under several names.

## Graded exercises

**A09-A:** Trace applyReview's calculation input, owner normalization, stored fields, and transaction tables. Five points require separate scheduler and repository claims.

**A09-B:** Explain why undo restores values but advances the scheduling clock. Five points require a concrete remote replay sequence and the exact revocation identity.

**A09-C:** Design both log/revocation arrival orders with an unrevoked neighboring log. Five points require testing the orchestration check rather than only the pure merge helper.

**A09-D:** Audit the cardBefore snapshot assumption and propose a test for intervening content edits. Four points require describing current behavior without pretending a proposed fix already exists.

## Hints and transfer

For A09-B, assume the first push succeeded before Undo. For A09-C, locate the code that can read user_state. For A09-D, enumerate every field in the supplied object. Read [the review](reviews/09-review-application-and-durable-undo.md) after drawing the complete timeline. Transfer the reasoning to retracting an already-delivered notification: withdrawing a local queue item alone cannot reverse an effect that has already crossed the boundary.
