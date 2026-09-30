# Review 11. A journal save is both data and evidence

Return to [the assignment](../11-practice-journals-and-pending-writes.md). Grade persistence guarantees separately from the credibility of the learner's written claim. The program can enforce required fields and check identities; it cannot infer that a described experiment was honestly executed.

## A11-A: known and unknown missions

Known completed missions require the evidence fields and every configured check. Incomplete drafts can be saved without claiming completion, provided their structure remains valid. Unknown but syntactically valid mission IDs can appear in imported records; a completed unknown record still needs nonblank evidence but has no current known rubric against which to require checks. Malformed IDs, duplicate missions, duplicate check IDs, oversized text, and invalid timestamps fail structural validation.

Full credit requires resisting two overstatements: that every unknown mission is rejected, and that accepted completion proves external achievement. The evidence record should retain the mission identity and the source of its review criteria. A future curriculum change can alter what is known without changing what a learner actually did earlier.

## A11-B: promise identity protects newer work

The second save chains after the first and replaces the Map value immediately. When the first settles, its cleanup compares the Map's current value with its own operation. Because the second is now registered, the first must not remove the marker. Waiting for the second promise waits through the earlier operation in its chain.

The export test begins export while both saves are pending and expects the second outcome. Awaiting both saves before starting export would avoid the race and weaken the evidence. Also explain failure recovery: the chain catches a previous rejection so a later save can proceed, while the original operation still rejects for its own caller. Keeping the queue alive is not the same as reporting a failed save as successful.

## A11-C: reference versus snapshot

The closure retains draft by reference. A learner should not claim the repository deeply copies it when no such copy occurs. Hold an earlier save, enqueue a distinct second draft, mutate that second object's field or checked array, and predict what writePracticeEntry reads when it eventually executes. Record the actual result in a scratch experiment before proposing a change.

A caller-side immutable snapshot can satisfy a clear contract, but copying only the outer object leaves nested checked arrays shared. A repository-side copy also needs an explicit depth and accepted shape. The most useful solution is a precise ownership statement about the draft after submission, supported by a mutation test, rather than the vague instruction to use immutability everywhere.

## A11-D: transaction and rollback evidence

WritePracticeEntry coordinates sync_meta, user_state, and outbox. It advances the journal timestamp, validates, writes the local mirror, and saves the sync envelope. It does not create a flashcard review log. The existing test's zero-log assertion is meaningful because journal completion and card review are different events.

The late import failure test throws at daily_goal storage after earlier transactional import work. It then checks the practice journal, cards, decks, and outbox are empty in the reset test database. That is a concrete rollback demonstration for the inspected tables. Do not replace the actual asserted list with a claim about every possible browser state or remote service.

## Review conversation

Ask whether waitForPracticeWrites waits for a save that begins after it snapshots the Map. The answer must distinguish already registered promises from future work. Then ask why a stale comment about a merge helper cannot establish that practice data is never synced. The answer should point to saveUserState and the outbox assertion. Together these questions test whether the learner follows executable relationships rather than reading names and comments as complete contracts.
