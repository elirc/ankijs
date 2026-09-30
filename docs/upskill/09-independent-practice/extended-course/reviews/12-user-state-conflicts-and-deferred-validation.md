# Review 12. Branch order is part of the merge contract

Return to [the assignment](../12-user-state-conflicts-and-deferred-validation.md). A complete answer describes when the merge returns early as well as when it writes. Validation is not one undifferentiated step, and the special revocation branch deliberately differs from ordinary learning records.

## A12-A: the sequence

The envelope is validated first. Revocation identities then delete the targeted log, preserve local-or-incoming revocation state, and return. Ordinary records inspect the local user_state timestamp and the sync_meta mirror timestamp. If either freshness rule blocks the incoming row, merging stops before ordinary payload parsing. Otherwise the payload is parsed, practice-specific validation and identity matching occur where applicable, and the envelope and mirror are written.

A correct diagram puts JSON parsing after the freshness returns and outside the revocation branch. An answer saying every accepted envelope must contain a parsed object payload misses the special branch. Also distinguish a writer convention from a receiving validator: the local undo writer uses an empty object string, but that does not add an absent JSON-parse check to the revocation receiver.

## A12-B: equality fixtures

With a local user_state row at exactly the incoming timestamp, the incoming row is ignored because the comparison is greater-than-or-equal. With no local row and a mirror at exactly the incoming timestamp, the mirror alone does not block it because its comparison is strictly greater. The second fixture must remove the local row or the first guard will decide the result before the mirror condition matters.

Use visibly different payloads and inspect both stored representations. A test that only checks row existence cannot distinguish acceptance from preserving an existing row. Record which predicate the fixture reaches, and include a strictly newer mirror case to verify the neighboring blocking behavior.

## A12-C: malformed but obsolete

An older malformed JSON payload can be ignored after envelope validation without reaching JSON.parse. A newer malformed payload reaches parsing and rejects. A newer valid payload reaches the identity-specific checks and can be accepted. The envelope itself must remain valid in all three cases or its earlier rejection hides the ordering under investigation.

This is a description of current execution, not a universal recommendation to ignore malformed data. If proposing eager deep validation, explain the compatibility, cost, and error-reporting change. The course rewards separating the current contract from the desired one. It does not reward silently rewriting the expected behavior while claiming to test existing code.

## A12-D: transaction lifetime and identity

The positive focused test merges a valid complete practice payload inside a transaction and checks the envelope and mirror. The negative test writes a transaction-probe first, then supplies a completed entry missing required checks. Rejection must leave the probe absent. This proves rollback of earlier transaction work under the test environment rather than only preflight refusal.

Dexie.waitFor keeps the transaction active while deferred validation code is imported. The dynamic import is an external promise, so merely using await does not explain transaction lifetime. Full credit requires identifying both the loading boundary and the rollback assertion.

For identity mismatch, use two actual mission IDs and valid evidence for the payload mission. Place that payload under the other mission's outer engineering_practice key. The mismatch should be the reason for rejection; invalid check IDs or incomplete evidence would produce a less focused test. Assert no envelope or mirror replacement so error observation is paired with protected state.

## Transfer milestone

Ask the learner to apply the envelope/payload distinction to a document whose outer key names one account and whose body names another. They should identify the relationship that must be checked without assuming that two individually valid strings form a valid pair. Then ask which early return could prevent the proposed validator from executing. This connects data modeling with control-flow evidence.
