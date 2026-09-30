# Review 02. Awaited assertions and real effects

Return to [the assignment](../02-tests-that-own-their-asynchronous-work.md). The strongest answer proves that the test both waits for the relevant operation and observes its forbidden side effects.

## A02-A: repair the lifecycle

Make the test async and await the rejection assertion, or return that assertion promise directly. In Node, await assert.rejects on the operation. In Vitest, await expect(operation).rejects with the required matcher. The returned promise must include the assertion's completion, not merely the initial function call.

A scratch mutation that resolves for invalid input must make the corrected test fail. Record the exact command and exit result. If it still passes, inspect whether the command imported the mutated function and whether the assertion is awaited. This provenance check prevents a reference fixture's green output from being mistaken for validation of a different local implementation.

## A02-B: validate behavior and storage

Inject a write dependency that records accepted values. For invalid input, assert rejection and an unchanged writes collection. A write-then-throw mutation should fail the storage assertion even though it satisfies the rejection assertion. Include a valid input whose expected write appears exactly once, rejecting an implementation that avoids all errors by rejecting every request.

The three observations jointly characterize the small contract: invalid values reject, invalid values do not write, and valid values can write. No one observation implies the other two. The spy or store must be the actual dependency used by the candidate. A disconnected spy always reporting zero calls is not evidence of preservation.

## A02-C: evidence layers

The Node workshop test checks a small reference model with built-in assertions. The Vitest repository test loads actual application code with happy-dom and fake-indexeddb. A browser journey can observe real rendering, IndexedDB integration, and user interaction under its tested conditions. These layers complement each other, but their conclusions should remain scoped.

For example, the Map atomicImport fixture proves its staging model leaves the original Map untouched on an injected staging failure. The dataRepo malformed-card test proves the repository rejects that invalid backup without adding the earlier valid deck. A browser import journey would need separate evidence for file selection, messages, and persisted data after reload. Do not rename any single layer complete production recovery.

## A02-D: a distinct missing boundary

A useful proposed test injects a failure after a participating database write but before the import transaction completes, then inspects all coordinated tables. This differs from corrupting a card's due date, which validation rejects before writes. Name the injection point and the before-state expected to survive.

Another useful test can target a caller that catches an error and nevertheless reports success. Its observation belongs to the orchestration or UI layer rather than the pure validator. Choose the boundary relevant to the changed code instead of mechanically adding every imaginable test.

## Debugging the test itself

A try/catch that only logs errors can pass on both success and failure. Add an explicit unexpected-success failure or use the runner's rejection assertion. Avoid broad catch blocks around assertions that swallow the assertion's own failure. The test must let the runner observe a rejected promise or thrown assertion.

Deferred promises make lifecycle errors reproducible. Start the operation, assert that its completion is still pending, then settle it under test control. This is more reliable than a guessed sleep and more explanatory than a flaky timeout. Use timers only when timer behavior itself is the contract under investigation.

## Independent follow-up

Write a short review comment containing the trigger, incorrect behavior, missing assertion, and one mutation that demonstrates the gap. Keep it about observed execution. A passing command is a result; understanding which code and effects that command observes is the evidence that makes the result useful.
