# 21. Restoration and data-aware recovery

Use workshop units ops-restore, ops-bad-rollout, and ops-trace-failure. Read [the restore case](../../../../public/workshop/ops-restore.md), [rollback case](../../../../public/workshop/ops-bad-rollout.md), [trace case](../../../../public/workshop/ops-trace-failure.md), and restore in [reference.mjs](../../../../public/workshop/fixtures/reference.mjs). Compare the small notes model with Recall's [dataRepo.ts](../../../../src/db/repos/dataRepo.ts) and [practice backup tests](../../../../src/db/repos/practiceRepo.test.ts). Recovery claims need an independent destination, a known coverage boundary, and observable application behavior.

## A readable file is only the beginning

A JSON file can parse successfully while containing duplicate IDs, invalid ownership, incomplete relationships, or data from an incompatible schema. A checksum can establish that bytes match an expected artifact, but it does not establish that the artifact contains all required records or that the application can use them. Separate transport integrity, structural validity, relational consistency, and usable restoration.

The small restore helper checks nonempty IDs, duplicate IDs, a truthy owner, and string bodies, then creates a Map of copied row objects. It does not have a separate owner table against which to verify references. Therefore the workshop requirement to validate ownership relationships is broader than the helper's current checks. A test with owner missing exercises one boundary; a nonempty nonexistent owner would require an additional model and validator.

Likewise, a shallow copy of each simple row does not prove deep isolation for arbitrary nested values. Use the schema actually under test. Do not convert a minimal model into a claim about every future backup field by relying on the familiar name restore.

## Worked trace: independent restoration

Create a small source store with two owners and several notes, including distinct representative content. Export an artifact and record the newest included write identity and timestamp under your test contract. Restore into a separate empty destination. Compare IDs, counts, owners, and selected content, then perform a read and an authorized update through the destination's application interface.

Next attempt a denied cross-owner read and write. Counts alone can match while ownership isolation is broken. If the destination uses the local test header adapter, label that test as ownership behavior under the adapter rather than production session authentication. The capstone's later trusted-session checkpoint is additional work.

Keep the source intact throughout the drill. A failed restore should leave an independent failed destination for inspection, not replace the only working library. The workbook does not ask you to import experimental data into personal study storage or call eraseLocalData against it.

## Recovery point and recovery duration

Recovery point concerns which committed data is represented in the restored artifact. Recovery duration concerns the elapsed time to make the destination usable. A fast restore of an old backup can have a large missing-data window; a recent backup can still take too long to restore. Report both rather than using file creation time as a substitute for either.

For a reproducible exercise, record source writes before and after the export boundary. After restoration, identify the newest recovered write and the first intentionally absent later write. Measure the drill from a defined start event to a successful application journey. State whether dependency setup, credentials, and schema initialization are included in that duration.

Do not invent a precise recovery guarantee from one tiny fixture. The result is a measured sample under a specific dataset and environment. A larger deployment would need representative volume, dependencies, and operational procedures. The exercise teaches how to phrase evidence accurately, not how to extrapolate a universal service promise from milliseconds on a Map.

## Recall import is a merge-oriented recovery path

Recall import validates shape and rows, coordinates several local tables in a transaction, normalizes ownership, and merges competing records. An older backup can preserve a newer local card or journal. That behavior is valuable for bringing back missing material without blindly discarding current work, but it differs from resetting a destination to exactly the backup's historical bytes.

Use an empty destination when the goal is to measure what the artifact itself contains. Use a deliberately populated destination when the goal is to test merge policy. Label the two experiments separately. Otherwise preserved local data can make an incomplete backup look complete, or expected merge behavior can be mistaken for a failed exact restore.

The practice tests cover an older backup without practice entries, preservation of newer local journal edits, pending-save export sequencing, and late-write rollback. Together they show why optional fields and version history matter. Absence of an optional field does not automatically mean erase existing local data. A recovery plan must know that contract before interpreting its results.

## A rollback must account for committed new data

The workshop rollout case has release B write a new archived status, then release A fail because its parser knows only active and deleted. Switching executables back does not undo B's committed records. A binary rollback and a data rollback are separate actions with different risks and evidence requirements.

Build an old-reader/new-data compatibility fixture. Run the old parser against representative B records before calling the switch safe. A mitigation may disable the risky writer, use a compatible forward fix, or follow a rehearsed data-aware rollback. Do not silently discard the new status merely to make the old parser accept it; that can erase legitimate meaning.

The expand-contract lab from chapter twenty supplies a related strategy: introduce a compatible representation, transition writers and readers, verify coverage, then retire the old field. The recovery plan should state when rollback remains possible and which observation would make a forward fix preferable. A button labeled rollback is not the plan.

## Causal evidence across asynchronous work

The trace case connects request r17 to event e9, then to worker attempts one and two. A later request r18 at a nearby time is not evidence that it caused e9. Use stable event identity across the durable handoff and record safe correlation metadata. A timestamp alone is insufficient to connect unrelated operations.

For the recovery drill, carry an artifact ID, restore attempt ID, and destination identifier. These fields let another reviewer distinguish a failed attempt from a later successful one without copying private record bodies into every log. State unknowns explicitly when the evidence does not show whether an external write committed.

## Graded exercises

**A21-A:** Compare checksum, JSON parsing, structural checks, relationship checks, and application usability. Five points require one counterexample between adjacent levels.

**A21-B:** Design an empty-destination drill with two owners and a denied cross-owner journey. Five points require preserving the source and naming the identity adapter.

**A21-C:** Measure recovery point and duration with explicit boundaries, then contrast empty restore with merge import. Five points require a known newest recovered write.

**A21-D:** Build old-code/new-data and causal-timeline evidence for a rollback decision. Four points require no inference of causation from timestamp proximity alone.

Read [the review](reviews/21-restoration-and-data-aware-recovery.md) after writing the drill record. An unrun plan is still useful, but it must remain labeled a plan rather than a successful restoration.
