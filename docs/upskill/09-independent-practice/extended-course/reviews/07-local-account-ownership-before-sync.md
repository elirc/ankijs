# Review 07. Stop before the forbidden effect

Return to [the assignment](../07-local-account-ownership-before-sync.md). Ownership evidence must include what did not happen. An error message after sending private local data is not equivalent to rejecting the operation before the first remote call.

## A07-A: two independent memories of ownership

In the first case, local_owner identifies Alice while rows have null user IDs. Bob's attempt must reject and leave the marker identifying Alice. The marker carries history that the row values alone do not express. Removing it merely because the next session belongs to Bob discards the exact information the guard needs.

In the legacy case, there is no marker but a row identifies Alice. Bob's attempt must reject without creating a Bob marker. The scan of existing table rows prevents an uninitialized metadata record from being interpreted as permission to adopt foreign data. An acceptable answer covers both cases; either check alone misses one of them.

Inspect the marker after rejection and compare relevant rows with their before-state. A function that rejects only after reassignment would satisfy an error-only test while violating the ownership invariant. Do not repair the fixture by erasing the user's data. The exercise concerns recognizing and preserving the blocked state, not deciding an irreversible account-migration policy.

## A07-B: observe the actual client seam

The focused engine test supplies a client whose from and rpc methods can be observed, arranges the mismatched session and local owner, runs sync, and expects an error phase with no remote method calls. The ownership check occurs before queueing and pushing in the normal loop. A useful evidence record names the actual spies and their call counts rather than saying the network was probably unused.

Pair the blocked case with a valid ownership case when extending coverage. Otherwise a stub that always throws can satisfy the negative expectation. Keep the distinction between sync's exposed error state and a function that throws directly to its caller: report the behavior the tested entry point actually presents. Restore client and session test state afterward so another case does not accidentally inherit the blocked account.

## A07-C: account changes across an await

A controlled test starts a pull under Alice, pauses the remote response, changes the active session to Bob, and then releases the response. Inspect the session check after the response before allowing those rows to merge. A separate test can return a row whose user_id differs from the captured user, even when the session has not changed, to exercise the returned-row check.

The expectation is that the next guarded boundary rejects further application of data under the invalid context. It cannot retroactively cancel every request already completed before the switch. Draw that timeline explicitly. Assertions about no calls at all belong to the initial mismatch case; assertions about no additional merge after a switch belong to this in-flight case. Mixing them creates impossible or misleading requirements.

## A07-D: four responsibilities

Local ownership prevents one browser database from being silently adopted by the wrong account. Query filtering requests rows for the intended account. Merge selection resolves competing versions of data already supplied to it. Server authorization decides whether the authenticated caller may read or write the requested records. These mechanisms support one another but are not substitutes.

A modified client can omit its own filters and guards, so the backend must enforce authorization independently. Conversely, a correctly authorized backend cannot infer that a local unowned draft belonged to a previous browser user when the client discards that history. Full credit requires one concrete bypass example and one local-history example. This explains why both client isolation and server enforcement matter without claiming that either alone proves the whole system safe.

## Review milestone

Ask the learner to produce a two-column timeline of state and effects for both the initial mismatch and in-flight switch. Each claimed protection should point to a specific guard and an assertion. If the explanation contains only an error string, request the missing effect evidence before accepting the milestone.
