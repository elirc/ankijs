# Review 04. Three different write hazards

Return to [the assignment](../04-save-guards-and-versioned-writes.md). Duplicate invocation, stale modification, and retry after a lost response need different identities and boundaries.

## A04-A: synchronous in-flight state

Check the busy flag, set it before awaiting the write, and reset it in finally. An overlapping call returns false without invoking the write again. The first successful call returns true; a failed call propagates its error but still releases the guard. Test with a pending deferred promise so the second invocation occurs while the first is genuinely active.

A visual disabled state remains useful feedback, but it is not the only defense against two handlers entering before a render. The synchronous guard closes that local interval. It does not coordinate different tabs, devices, or server retries.

## A04-B: preserve the right draft

Capture the submitted text or a draft revision when Save begins. On success, clear only if the current draft still represents that submitted snapshot. If the user typed more meanwhile, retain the newer draft. On failure, preserve the draft and report the error while releasing the in-flight guard.

A text equality comparison can be sufficient for a simple string draft, but a richer editor may need an explicit draft generation to distinguish edits that return to the same text. Define the policy you implement. The supplied guardedSave fixture does not manage text itself, so a passing fixture check is not proof that your UI preserves newer typing.

## A04-C: actual adapter semantics

The local notes adapter accepts PATCH body.version as the expected integer version. Missing or noninteger version yields 400; a mismatch on an accessible note yields 409 and the current note. Missing or foreign-owned notes yield 404 before that conflict response. A valid successful patch increments the stored version.

Two requests starting with the same version should not both overwrite the same current state in this single-process model. In a database implementation, put the expected version and owner condition in the atomic update and inspect its affected result. A separate read followed by an unconditional update does not establish the same guarantee across concurrent writers.

Preserve B's stale draft when A succeeds. Automatically copying the new version into B's request and retrying its unchanged stale text defeats the conflict protection. Reload, compare, or explicit merge must be a user-understandable decision rather than a hidden overwrite.

## A04-D: delivery identity

When a create commits but its response is lost, the client cannot infer from a network error whether no row exists. Retrying under a new identity can duplicate the create even though the local guard worked perfectly. A server idempotency protocol needs a stable operation key scoped to the verified actor, a definition of identical request meaning, and atomic recording of the result with the effect.

The current local notes adapter does not implement that protocol, and its x-test-user header is not production authentication. The workshop's separate idempotency model will help reason about retries later. State which mechanism was tested instead of using exactly once as a blanket description.

## Independent follow-up

Write a three-column evidence table: local overlapping calls, two stale writers, and one operation with a lost response. For each, name the identity, authoritative state, rejected counterexample, and remaining limitation. If one proposed fix appears in every column, examine whether it truly enforces all three boundaries or merely reduces the likelihood of failure in one of them.
