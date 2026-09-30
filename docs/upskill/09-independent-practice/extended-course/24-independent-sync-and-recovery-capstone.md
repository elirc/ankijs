# 24. Independent capstone: a defensible sync and recovery investigation

This final chapter combines the workbook's source traces into one bounded work sample. Use Recall's [card repository](../../../../src/db/repos/cardRepo.ts), [practice repository](../../../../src/db/repos/practiceRepo.ts), [sync engine](../../../../src/db/sync/engine.ts), [outbox](../../../../src/db/sync/outbox.ts), and [backup repository](../../../../src/db/repos/dataRepo.ts). Connect your report to workshop units integration-outbox, ops-restore, and ai-evidence-report. The goal is an independently reasoned investigation with reproducible evidence, not a claim that the entire application is production-certified.

## Choose one user story and its boundaries

Use this story: a learner edits a card, records engineering-practice evidence, works while a sync attempt is in flight, exports a backup, and later restores into an isolated destination. During the process, an old acknowledgment arrives and an account switch is attempted. You must explain which local work persists, which work remains queued, and which remote actions are blocked.

Limit the implementation exercise to a disposable test branch or separate harness. Keep the original application and personal study data intact. You may use existing repository entry points and controlled client seams, but do not fill learner starter files or replace source functions with mocks that make every desired result happen by construction. The harness should model external timing while exercising the actual decision boundaries you claim to test.

Before coding, draw a table of entities and identities: card ID, practice mission ID, outbox database ID and queued_at, local owner, remote account, and backup artifact identity. State which identity is stable across retries and which value changes when new work supersedes old work. This prevents the final explanation from treating every string called id as interchangeable.

## Milestone one: predict the local commit

Choose a card with visibly distinct content and scheduling clocks. Edit its wording and save a practice draft for a real mission. Predict the updated fields, the local mirror, the user-state envelope, and queued identities. Run the operations in an isolated database and compare the result with your prediction.

The content edit should not be described as a review event. The practice save should not create a card review log. Inspect those negative effects as well as the expected writes. A report that only says the database changed lacks enough detail to prove that the right subsystem owned the change.

Include a deliberate failure variant in your scratch harness. For example, omit the queue signal from a modeled edit and show the evidence check detects the discrepancy. Label this as a mutation of the experiment, not a change committed to the application's runtime. The purpose is to demonstrate that your assertions would fail for a meaningful defect.

## Milestone two: old acknowledgment, newer edit

Capture the first queued generation, then edit the same card again before acknowledging the earlier push. Call the actual unchanged-entry cleanup with the old capture and inspect the queue. The newer generation must remain. Capture the current generation and acknowledge it without another edit to show eventual progress.

Use the same proposed timestamp for consecutive enqueues in a separate variant so the freshness mechanism, rather than wall-clock luck, distinguishes the generations. Record queue ID and marker values, not just total count. A duplicate insertion and an accidental deletion can cancel numerically while still violating identity.

Explain that a resend may carry current row state and that remote success before local cleanup can lead to retry. Do not claim the dirty-row queue is an immutable history of every edit or a universal exactly-once protocol. Your report should cite the actual server operation only if you inspected and tested its policy; otherwise state that boundary as unverified.

## Milestone three: protect account context

Arrange local ownership for Alice and attempt sync as Bob. Observe the error state and assert that the client from and rpc seams are not called. Keep the local marker and records unchanged. Then design an in-flight account-switch case where a response is paused under Alice and released after the session changes.

The second case has a different claim: it prevents applying the response after the guarded context changes, not necessarily every request that was already sent. Put the check before and after the await on the timeline. This distinction is required for a passing explanation even if you choose to implement only one of the two cases in the first delivery.

Do not erase local data or overwrite its owner to make the sync call succeed. A blocked ownership state is useful evidence of the intended boundary. A migration or account-transfer feature would be a separate product decision with additional authorization and recovery requirements.

## Milestone four: export and restore with known coverage

Queue two practice snapshots and begin export while the later operation is registered. Confirm the export includes the latest snapshot under that sequence. Record that waitForPracticeWrites observes currently registered promises; it is not an infinite barrier against future edits.

Restore the artifact into a separate empty test destination and compare card IDs, wording, scheduling fields, mission evidence, and ownership normalization under the chosen session state. Then repeat with a deliberately newer local card or journal to demonstrate merge semantics. Keep the empty-restoration result separate from the populated-merge result so local data cannot conceal missing backup coverage.

Add a malformed or late-failure case and inspect protected state. The existing practice late-write test is a source reference for rollback injection. If your own test observes only preflight rejection, label it accurately. The final packet should include the artifact boundary and newest recovered write rather than merely a screenshot saying import complete.

## Milestone five: handoff and limitations

Write a short report with behavior, evidence, and unresolved limits. Include exact commands and completed results, the isolated environment, test fixture identities, and the observed state transitions. Separate reference checks from your independently authored assertions. State whether browser service-worker behavior, live backend authorization, real network interruption, or PostgreSQL concurrency was not exercised.

If a runner fails before assertions start, report infrastructure failure. If a test assertion fails, preserve the expected and observed result and explain the next investigation. If a proposed experiment was not run, mark it as a design. These categories are part of engineering quality, not admissions that invalidate all other completed work.

## Graded exercises and rubric

**A24-A:** Produce the identity and transaction map before running the harness. Five points require separate content, scheduling, journal, queue, and account responsibilities.

**A24-B:** Implement the old-acknowledgment experiment with a meaningful faulty variant. Five points require both preservation and eventual cleanup.

**A24-C:** Demonstrate an ownership boundary and an independent restore or merge journey. Five points require no-effect assertions and a preserved source.

**A24-D:** Deliver the evidence ledger and defend its limitations in a review conversation. Five points require every success claim to match a completed relevant result.

Use a twenty-point final rubric: four for source-grounded predictions, four for controlled timing and failure cases, four for state and no-effect assertions, four for reproducibility and data preservation, and four for an honest handoff. A score below three in any category identifies a concrete revision task before calling the work sample complete. Read [the separate review](reviews/24-independent-sync-and-recovery-capstone.md) only after writing your own predictions and first results.
