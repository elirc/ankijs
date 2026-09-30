# 03. Search completion belongs to the current intent

Use unit debug-stale-search and read [its case](../../../../public/workshop/debug-stale-search.md), latestCommit in [the reference fixtures](../../../../public/workshop/fixtures/reference.mjs), and [the debugging checks](../../../../public/workshop/checks/debugging.test.mjs). The fixture is a small ownership gate for callbacks. It models a principle relevant to a React search screen without claiming that every Recall screen imports that exact helper.

## The last completion is not necessarily the current request

The case begins request 17 for cat, then request 18 for car. Response 18 arrives first and renders car. Response 17 arrives later and overwrites the view with cat. The network fulfilled both requests correctly; the UI accepted an obsolete completion. Correctness depends on current user intent, not whichever response happens to finish last.

Debouncing reduces how often requests begin. It does not establish which already-started request may publish. Even with a debounce, a slow older request can finish after a faster newer request. Use a separate identity or lifetime rule for committing results. Performance controls and ownership controls solve different problems.

The fixture keeps a monotonically increasing token. Start increments it and returns the new identity. Commit runs a callback only when its supplied identity still equals the current token. Cancel increments the token, invalidating earlier identities. The callback carries the actual state update, making the ownership decision separate from the data it would publish.

## Worked trace across success and error

Start A and receive identity one. Start B and receive identity two. B succeeds, and commit with two updates the view to car. A succeeds later, but commit with one does nothing. If A instead rejects, its error callback must pass through the same identity check and likewise do nothing. A stale error is as obsolete as a stale success.

Now cancel while B is parsing its response. The token advances to three. When parsing finishes, B's identity two cannot commit. Checking identity only before an awaited parse would be insufficient: ownership can change during that await. The final check belongs immediately before the publication it protects.

Loading indicators have the same issue. An obsolete request's finally block can clear a newer request's loading state if it publishes unconditionally. Treat loading completion, error display, empty-state messages, and result replacement as state commits governed by the current identity. Protecting only the main result array leaves other obsolete callbacks able to distort the interface.

## Cancellation has two meanings

Aborting an obsolete fetch can save work and avoid unnecessary network activity where supported. Invalidating its right to publish is a separate guarantee. Parsing, transformation, cached work, or another promise may already be in progress after transport cancellation. Retain the identity check even when you also use AbortController.

Cancellation on component cleanup or route change says that the old owner no longer exists. It should invalidate every callback associated with that lifetime. A fresh mounted component can have its own gate rather than sharing a global token with unrelated searches. Scope the gate to the view or operation whose state it governs.

The fixture does not authenticate users, version database rows, or cancel a server-side write. Its token is a local ownership marker. Calling it a security token would suggest guarantees it does not provide. Precise vocabulary makes it easier to compose this helper with real authorization or optimistic concurrency later.

## Laboratory: control the timeline directly

Create two deferred promises in a scratch test, each with explicit resolve and reject functions. Start A, then B. Resolve B first and A second, then assert the visible result remains B's. Repeat with A rejecting after B succeeds. Record every attempted commit as well as accepted commits, so the test distinguishes an obsolete callback being ignored from it never running.

Add a two-stage request: a network promise followed by a parsing promise. Resolve the network stage, cancel before parsing completes, then resolve parsing. No result, error, or loading completion from that request should publish. This is a stronger case than cancelling before any work starts because it places the lifetime change between two asynchronous stages.

Use an explicit event log rather than sleeping for guessed milliseconds. A log entry can contain operation name, captured identity, and accepted or rejected publication. You are testing order constraints, not the machine's timer precision. Keep the fixture independent of real endpoints and personal search data.

For a React transfer, sketch an effect that captures its request identity and invalidates it during cleanup. State which values belong in the effect's dependency list based on the actual query inputs. Do not paste an effect with an empty dependency list merely to avoid reruns; that can make the closure hold an obsolete query. The code you write should explain how current intent is represented across renders.

## Failure report with a causal claim

A useful report says that an obsolete completion can publish because the code lacks a current-identity check at the final state update. Its reproduction includes two query values, their start order, controlled completion order, and expected final view. Its proposed change names both success and error paths and cleanup invalidation. This is more actionable than saying async is flaky.

When reviewing a proposed debounce-only fix, acknowledge what it changes: fewer requests can make the race less frequent. Then explain the remaining counterexample. A lower observed failure frequency does not establish the missing invariant. Keep the discussion about reproducible behavior rather than arguing over preferred helper names.

## Debugging case: checking too early

A candidate checks its token immediately after fetch, then awaits JSON parsing, then updates results without another check. Start B during that parsing interval. A still publishes afterward because its earlier check was true at the wrong time. Move the check to the actual publication boundary or wrap the final callback in the gate. The defect is a time-of-check gap within the UI lifetime, not a database transaction problem.

## Graded exercises

**A03-A:** Produce logs for stale success and stale failure after newer success. Five points require proving that both obsolete paths attempted but failed to publish.

**A03-B:** Cancel between fetch and parsing completion. Five points require protecting final state and explaining why a pre-parse check is insufficient.

**A03-C:** Add guarded loading and error state to a scratch search model. Four points require an obsolete finally callback case.

**A03-D:** Write a review of a debounce-only repair and propose a bounded regression test. Four points require separating request frequency, transport cancellation, and publication ownership.

## Hints, before the review

For A03-A, the gate should make the decision when the callback is about to commit. For A03-B, give parsing its own deferred promise. For A03-C, results are not the only visible state. Read [the review](reviews/03-search-completion-and-current-intent.md) after drawing a timeline with at least one ownership change during an await.
