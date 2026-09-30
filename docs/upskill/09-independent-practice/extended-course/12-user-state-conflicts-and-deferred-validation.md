# 12. User-state conflicts, mirrors, and deferred validation

Read [userStateRepo.ts](../../../../src/db/repos/userStateRepo.ts), [its focused tests](../../../../src/db/repos/userStateRepo.test.ts), and [practiceRepo.ts](../../../../src/db/repos/practiceRepo.ts). User state is a compact envelope used for several learning concerns. Its common storage shape does not imply that every identity has the same merge policy. This chapter follows the branch conditions that make the difference.

## The envelope and the payload answer different questions

ValidateUserState checks the ID prefix or exact learning_settings identity, length limits, payload string type and size, and a parseable updated_at. It does not parse every payload during that initial envelope check. The merge function later decides which payload validation is relevant after considering identity and freshness.

For ordinary learning records, JSON parsing must yield a truthy object. Engineering-practice records then pass the specific practice validator and an identity check: the outer ID must equal engineering_practice followed by a colon and the payload's mission_id. A valid payload for mission A may not be stored under mission B's outer key. This is a relational check between representations, not merely a type check on either representation alone.

Learning settings take a different path and do not invoke the mission catalog validator. The shared helper should not be described as a universal schema validator for every nested settings field. To assess those fields, inspect their dedicated reader or writer. Naming the envelope generic does not make its validation infinitely comprehensive.

## Worked trace: local row and local mirror

Consider an incoming practice row at time T2. The user_state table has a local row at T3. Merge returns early because the local envelope is at least as new. It does not replace that row or mirror with T2. If the local envelope is absent but the sync_meta JSON mirror reports T4, that newer mirror can also block T2.

The comparisons are not identical at equality. A local user_state timestamp equal to the incoming timestamp blocks the incoming row. A mirror timestamp equal to the incoming timestamp does not by itself block it, because the mirror comparison is strictly greater. This distinction matters when designing fixtures that isolate one branch: remove the local row when testing mirror-only equality, or its earlier check will dominate the observation.

After acceptance and payload validation, the function puts the incoming envelope and mirrors its payload in sync_meta. The two representations allow sync-oriented storage and the existing local journal reader to stay aligned. Test both after a successful merge. A row present only in user_state can be invisible to a reader that lists practice entries from sync_meta.

## Earlier data can be ignored before deep parsing

An incoming row with an acceptable envelope but an older timestamp may return before JSON.parse of the payload. That is the implemented ordering. A test expecting every stale malformed payload to throw would describe a different contract. Conversely, an accepted fresh malformed payload must reach parsing and reject.

Use three fixtures with the same syntactically allowed ID: an older malformed payload, a newer malformed payload, and a newer valid payload. Predict which stages execute. This makes validation order observable without changing runtime code. It also prepares a review discussion: should ignored obsolete data require deep validation, or is skipping it an intentional efficiency and compatibility choice? Answer that policy question separately from tracing today's implementation.

The timestamp comparisons assume the storage format used by the application. They compare strings in mergeUserState, while some journal backup comparisons parse timestamps numerically. Do not assume arbitrary valid date strings have equivalent lexical ordering. A stronger accepted-format policy would need its own tests and migration consideration.

## Revocation is a special branch

Review_revoked records bypass the ordinary latest-row policy. After envelope validation, the function deletes the targeted review log and stores local-or-incoming revocation state. It does not allow a newer ordinary payload to cancel revocation. This is the durable undo mechanism from chapter nine.

Because that branch returns before ordinary payload parsing, a description saying every user-state payload must parse as a JSON object would be inaccurate. The current undo writer supplies an empty object string, but the merge branch's acceptance behavior is defined by its actual checks. Distinguish what a trusted writer produces from what a receiving function validates.

A pair of tests can show why the branch exists. First accept a revocation whose timestamp is older than another device's log history and verify the log is removed. Then replay the log through the engine and verify the stored revocation prevents reappearance. The rule is tied to the revocation identity, not a global deletion of all review history.

## Dynamic imports inside a transaction

Practice validation is loaded on demand. The merge function uses Dexie.waitFor around the dynamic import with a timeout, then obtains validatePracticeEntries. The purpose is to keep the caller's IndexedDB transaction alive while waiting on an external promise. A normal await of unrelated asynchronous work can cross a lifetime boundary that database transactions do not automatically extend.

The focused tests exercise this inside a declared transaction over user_state, sync_meta, and review_logs. One verifies a complete matching entry is committed and mirrored. Another writes a transaction-probe marker first, then attempts an invalid completed practice entry. Rejection must remove the probe as well as leave the user-state row absent. The probe proves that the assertion concerns rollback of earlier transactional work, not merely refusal to start.

Lazy loading has two independent motivations here: keeping heavy mission material out of paths that do not need it, and preserving correct transaction lifetime when validation is needed. A performance change that eagerly imports everything may avoid one timing issue while enlarging startup cost. A correctness change that drops waitFor may retain small startup bundles while breaking the transaction. Evaluate both properties explicitly.

## Debugging case: envelope and payload disagree

A developer validates a complete practice entry but never compares its mission_id to the outer row ID. A remote row stored under mission A can contain mission B's evidence. Both individual strings look valid, and the JSON parses. The bug is the missing relationship between them. Build a fixture with two real mission IDs and otherwise valid evidence so the failure cannot be attributed to malformed structure.

## Graded exercises

**A12-A:** Draw the branch order for envelope validation, revocation, local freshness, mirror freshness, payload parsing, and practice identity. Five points require the actual early returns.

**A12-B:** Test local-row equality and mirror-only equality separately. Five points require avoiding a dominating earlier guard.

**A12-C:** Design stale malformed, fresh malformed, and fresh valid payload cases. Five points require distinguishing acceptance policy from current execution order.

**A12-D:** Explain the dynamic-import transaction test and create a mission-identity mismatch fixture. Four points require a rollback probe and two actual mission identities.

## Hints and transfer

For A12-B, compare greater-than with greater-than-or-equal. For A12-C, locate JSON.parse after the early returns. For A12-D, validate the relationship between the envelope and payload. Read [the review](reviews/12-user-state-conflicts-and-deferred-validation.md) before generalizing this design to settings envelopes or queued document metadata.
