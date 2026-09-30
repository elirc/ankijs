# 11. Practice journals, completion evidence, and pending writes

Read [practiceRepo.ts](../../../../src/db/repos/practiceRepo.ts), [practiceWrites.ts](../../../../src/db/repos/practiceWrites.ts), [the practice tests](../../../../src/db/repos/practiceRepo.test.ts), and the unload protection in [App.tsx](../../../../src/App.tsx). This chapter studies a form whose data has meaning beyond a transient screen: it records what the learner did, how they checked it, and which tradeoff they understood. Reliable persistence and credible evidence are separate requirements.

## Completion is a structured claim

A PracticeEntry contains mission_id, outcome, verification, tradeoff, checked, completed, and updated_at. CanCompleteMission looks up the mission's known completion checks, requires nonblank evidence fields, and requires every expected check ID to be present. It does not run the learner's program or independently verify the truth of their prose. A completed journal entry is a structured self-report under the application contract, not an external certification.

ValidatePracticeEntries checks array size, mission-ID syntax, duplicate missions, text lengths, check-ID syntax and uniqueness, boolean completion state, and parseable timestamps. For known missions marked complete, the required checks must be present. For unknown but syntactically valid missions, completed entries still need evidence text, but cannot be checked against a missing current mission definition. This supports reading records whose curriculum may differ while keeping structural limits.

Do not collapse these rules into either all unknown missions are rejected or every imported completed mission satisfies today's rubric. Both claims are stronger than the code. A provenance-aware evidence report records the mission identity and the curriculum/check definition used at the time of assessment.

## A queue per mission preserves local order

SavePracticeEntry reads the previous pending promise for the mission, waits for it while recovering from its rejection, then calls writePracticeEntry for the new draft. It immediately registers the new operation in a shared Map. Two calls for the same mission therefore execute their writes in call order even when the screen rerenders or unmounts.

The recovery catch belongs to sequencing: a failed earlier save should not permanently poison every later save for that mission. It does not convert the earlier caller's rejected promise into a successful result. Each caller still receives its own operation promise and can report failure. Distinguish keeping the queue usable from hiding errors from the interface.

The settled callback removes the Map entry only if it still refers to that exact operation. If an earlier operation settles while a later one is registered, it must not delete the later marker. This identity comparison is the same general pattern seen in latest-result gates and unchanged-outbox cleanup: completion of old work may not clear ownership of newer work.

## Worked trace: two drafts and an export

Submit draft A and then draft B for the same mission without awaiting A first. The Map initially contains A's operation and is then replaced by B's operation, whose chain includes A. ExportData calls waitForPracticeWrites before reading the backup. The helper snapshots the Map's current promise values and awaits them. Waiting for B also waits for the earlier same-mission operation in its chain.

After both writes, the stored entry describes B. The existing practice test starts two saves and immediately starts export; it expects the final snapshot in the exported practice array. This is stronger than awaiting both saves before beginning export, because the latter would avoid the race under investigation.

The helper waits for operations registered when it collects the Map values. It is not a perpetual global barrier preventing all future edits. A new save initiated after that snapshot needs its own sequencing analysis. State the laboratory's order precisely rather than claiming no concurrent activity can ever happen during export.

## Snapshots require caller discipline

The queued closure retains the supplied draft object. The repository does not deep-clone arbitrary caller state at registration. In ordinary immutable UI code, each save can receive a distinct draft value, which gives the intended snapshot behavior. A caller that mutates the same object or checked array after enqueueing can undermine that assumption before the delayed write reads it.

Design a scratch experiment with a held first operation, a second draft, and an intentional mutation of that second object. Predict which value the write will observe from the actual code. Then propose either caller-side immutable snapshots or explicit copying at the boundary, with tests for nested arrays. This exercise is a contract investigation, not permission to change application behavior without reviewing its callers.

## One journal exists in coordinated representations

WritePracticeEntry opens a transaction over sync_meta, user_state, and outbox. It reads the previous local journal, chooses a timestamp at least one millisecond newer than the prior timestamp, validates the new entry, stores the JSON mirror, and calls saveUserState with the same logical journal identity. The user-state path makes the journal eligible for synchronization.

The source includes an older comment describing the backup merge helper as local/backup-only. Read behavior as well as comments: savePracticeEntry calls saveUserState, and the tests explicitly assert a synced journal entry with a coalesced outbox row. A good source review identifies the narrow role of mergePracticeEntries without generalizing an old comment into a claim that all practice data is never synced.

The journal operation does not create a card review log. Completing an engineering mission and answering a flashcard are different learning events with different schemas. The existing test verifies zero review logs after saving drafts and completion. This matters when interpreting progress: one metric cannot be silently substituted for the other.

## Rollback evidence beyond validation

The practice suite contains a late-write backup failure test. It prepares a backup, resets the isolated database, spies on sync_meta.put, and throws when the daily_goal preference is written. Earlier import work has already occurred within the transaction. The test then expects no practice entries, cards, decks, or outbox rows. This is actual late-failure rollback evidence for those asserted tables, unlike a malformed row rejected before writes.

Do not inflate the assertion list into every possible state in the application. The test establishes what it observes under fake-indexeddb. It is valuable precisely because its failure point and before/after checks are concrete. A browser-storage test would add another environment, not erase the value of this focused repository test.

## Graded exercises

**A11-A:** Classify known, unknown, incomplete, and malformed mission entries. Five points require separating structural acceptance from verified achievement.

**A11-B:** Trace two queued saves and export, including the Map identity check when the first save settles. Five points require preserving the later pending operation.

**A11-C:** Investigate mutable draft aliasing with a controlled delayed write and propose a precise snapshot contract. Five points require distinguishing current behavior from a proposed copy.

**A11-D:** Explain the journal's three-table transaction and the existing late-write rollback test. Four points require naming the injected failure and actual asserted tables.

## Hints and transfer

For A11-A, inspect the known variable rather than assuming an ID lookup always rejects. For A11-B, a promise chain can represent several saves even when the Map has one entry. For A11-C, a closure preserves a reference unless something copies the value. Read [the review](reviews/11-practice-journals-and-pending-writes.md) after recording the operation timeline. Transfer the same analysis to autosaved documents with per-document queues.
