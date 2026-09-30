# 02. Tests that own their asynchronous work

Use workshop unit review-false-positive-test and its [case file](../../../../public/workshop/review-false-positive-test.md). Then read [the runnable reference check](../../../../public/workshop/checks/review-and-operations.test.mjs), [test setup](../../../../src/test/setup.ts), and [Vite's test configuration](../../../../vite.config.ts). The central question is whether the test runner waits for the behavior being asserted. A green result is weak evidence if the relevant promise outlives the test body.

## A promise assertion is work that must be awaited

The supplied case calls a rejection matcher without returning or awaiting its promise. The test body can finish before the matcher completes. Different runners or configurations may surface later failures differently, but the robust contract is straightforward: the test must return a promise representing all required work or await that work inside an async test.

In Node's runner, await assert.rejects for an expected rejection. In Vitest, await the rejects assertion or return it. The exact error text is only one observation. A rejected save should also leave persistent state unchanged when that is the required behavior. An implementation that writes first and then throws can satisfy an error assertion while violating the application's guarantee.

The reference review check validates a quantity before appending to a writes array. It awaits rejection for blank input and then checks that the array is empty. That is a small model of validation-before-mutation. It does not by itself prove that Recall's IndexedDB import transaction or a deployed API has the same property.

## Worked trace: a test that finishes too early

Imagine a save function that returns a pending promise. The test calls a rejection assertion and immediately returns undefined. The runner sees a synchronous test body with no outstanding returned work. Later the save resolves unexpectedly, and the assertion discovers that rejection never occurred. The timing of that discovery is disconnected from the intended test lifecycle.

Now make the test async and await the assertion. The test cannot finish successfully until the promise rejects in the expected way. If save resolves, the assertion rejects and the runner records a failure. Add a writes snapshot before the call and compare afterward so the test rejects write-then-fail as well as resolve-instead-of-reject.

A mutation experiment establishes this connection. Temporarily replace validation with a successful return in a scratch implementation and run the corrected test. It must fail. Then use a second broken implementation that mutates storage before rejecting. The no-write assertion must reject that one. Two mutations prove two different parts of the contract are observed.

## Distinguish the three test environments

The workshop checks import small Node reference fixtures. They are fast conceptual models and use built-in assertions. The application tests run under Vitest with happy-dom and fake-indexeddb loaded in setup. Those tests exercise repository code against an IndexedDB-compatible test implementation. Browser end-to-end tests exercise an actual browser journey with another set of operational assumptions.

Passing one layer does not silently establish the others. A Map-based import fixture demonstrates staging and commit logic, while a Dexie repository test can exercise actual transaction calls. Neither alone proves a user's browser recovers from a service-worker update. State the layer and the implementation path in every evidence record.

The package scripts also have different side effects. Workshop checks execute reference tests. Content build and content check commands may generate or export artifacts. Do not run a broad build script merely to verify a scratch asynchronous assertion. Choose a bounded command whose inputs and outputs you understand, and report it accurately.

## Test doubles should expose the intended boundary

A persistence spy can count calls, but count zero is meaningful only if the candidate actually uses that spy. If the code writes through another imported instance, the spy may remain untouched while the real effect occurs. A test needs a clear seam: an injected write function, a controlled repository module, or a test database whose state is inspected directly.

Likewise, a mock that resolves immediately can hide races requiring a pending operation. Use deferred promises when you need to hold work open. Control completion explicitly rather than relying on arbitrary sleeps. Record when a call started, when the test allowed it to settle, and what state changed afterward.

An expected rejection should preserve the reason's semantics. Some APIs reject with an Error, others can use a string or object. Test identity when the contract requires forwarding an exact reason, and test a message only when message content is part of the requirement. Rewrapping every failure in a new Error can destroy useful identity or metadata.

## Laboratory: an evidence triangle

Create a scratch save function accepting a write dependency. Its valid-input rule should be small and explicit, such as the workshop quantity range, so the experiment focuses on lifecycle rather than validation complexity. Write three candidate behaviors: validate then write; return success for invalid input; and write then reject. Keep them clearly labeled as experiments.

For each candidate, run an awaited rejection assertion and a storage-preservation assertion. Record which observation rejects which candidate. Add a successful valid-input case to ensure the test has not merely built a function that rejects everything. This triangle checks rejection behavior, mutation behavior, and the accepted path.

Next, inspect an existing application test such as [dataRepo.test.ts](../../../../src/db/repos/dataRepo.test.ts). Identify the exact awaited call, the database reset setup, and the state inspected afterward. Explain what it proves and which failure injection it does not perform. A malformed-record test that rejects before entering the transaction is useful, but it is not the same experiment as a write failure halfway through a transaction.

## Debugging case: catching the failure inside the test

A learner wraps the expected failure in try/catch, logs any caught error, and never asserts that an error occurred. If the operation unexpectedly resolves, the test still passes. Use assert.rejects, a rejection matcher, or an explicit failure after an unexpected success. A catch block is control flow, not an assertion of the promised outcome.

## Graded exercises

**A02-A:** Repair the supplied unawaited assertion and demonstrate the resolve mutation fails. Four points require a reproducible command and nonzero failure outcome.

**A02-B:** Reject write-then-fail and include a valid write case. Five points require inspecting the actual storage seam.

**A02-C:** Compare workshop, fake-indexeddb, and browser evidence for one behavior. Five points require accurate limits for each layer.

**A02-D:** Review an existing test and propose one distinct missing failure boundary. Four points require a precise scenario rather than an instruction to increase coverage generally.

## Hints, before the review

For A02-A, the test's returned promise must include the assertion. For A02-B, an error is compatible with an earlier side effect unless checked. For A02-D, identify where the failure occurs relative to validation and commit. Read [the review](reviews/02-tests-that-own-their-asynchronous-work.md) after saving your intentionally failing mutation results.
