# Review 09. Undo is a new durable decision

Return to [the assignment](../09-review-application-and-durable-undo.md). A strong submission separates calculation, local persistence, queue withdrawal, and remote replay. An immediate screenshot of the old due date is useful but cannot establish the entire undo contract.

## A09-A: calculation and commit

The scheduler supplies the proposed card and review log. ApplyReview assigns a fresh scheduling timestamp, aligns the log owner with the card owner, and stores card, log, and queue effects inside the declared transaction. Full credit requires identifying cards, review_logs, and outbox as participating tables. It also requires explaining that the repository does not independently recompute the rating algorithm.

Use a controlled before card and distinguish the proposed schedule from the persisted scheduling clock. Assertions about the scheduler's due date belong to a scheduler test; assertions about storage and queue membership belong to the repository test. A test can cover both by calling both layers, but the report should still state which assertion establishes which behavior.

## A09-B: why time moves forward

Undo writes the earlier card values with a fresh srs_updated_at. It records review_revoked:logId, deletes the local log, removes the pending review-log queue entry if present, and queues the restored card and revocation state. A clock that moved backward could cause another device's already-applied review to win the next merge. The restoration is itself a later scheduling decision even though its values resemble an earlier state.

The decisive scenario has remote acceptance before undo. Removing an unsent queue entry alone cannot affect a record already delivered. The revocation identity persists the decision to exclude that log when it is encountered again. Avoid claims about universal physical deletion: the inspected client policy concerns how the record participates in local history and sync merging.

## A09-C: both arrival orders

For log then revocation, begin with the log stored, merge the revocation in its proper transactional context, and assert the log is gone while revocation remains. For revocation then log, exercise the engine branch that checks user_state before accepting a review log. Calling only mergeReviewLog misses that check because the pure function receives rows and has no database lookup.

Add an unrevoked log with a different ID and verify it survives or is accepted. Prefer another log for the same card so the test rejects an overly broad implementation that deletes all of the card's history. The identity being revoked is a review event, not the card itself. Observe queue state separately when testing a local undo, since remote merge and local queue withdrawal are different entry points.

## A09-D: whole-object restoration

The current repository puts the supplied cardBefore object with a new scheduling timestamp. A correct source description acknowledges that this includes more than scheduling fields. An intervening wording edit could be affected if the caller supplies an old whole-card snapshot. The assignment asks for an investigation and proposed test, not an unsupported declaration that the current UI necessarily permits this race.

A useful test arrangement captures a card, changes content, then invokes undo with the captured object and compares front, back, content clock, and scheduling fields. Label the observed behavior as the current contract. If proposing a scheduling-only restoration, explain which field group would be restored and how deleted or moved cards should behave. Those are product choices requiring review, not incidental refactoring details.

## Review questions

Ask the learner why the local review-log count can be correct immediately after undo while the durable behavior is still wrong. The answer should identify replay and the missing marker. Then ask why the revocation timestamp does not use the ordinary latest-row rule. The answer should connect permanent revocation with arrival order rather than assuming every record type must share one merge algorithm.
