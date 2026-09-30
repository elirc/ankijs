# 22. AI-assisted review with independent evidence

Use workshop units ai-review-diff, ai-api-verification, ai-challenge-tests, ai-untrusted-text, ai-scope-control, and ai-evidence-report. Read [the diff review](../../../../public/workshop/ai-review-diff.md), [API verification](../../../../public/workshop/ai-api-verification.md), [test challenge](../../../../public/workshop/ai-challenge-tests.md), [untrusted text](../../../../public/workshop/ai-untrusted-text.md), and [handoff case](../../../../public/workshop/ai-evidence-report.md). The same standards apply whether a proposed change came from a model, a teammate, or your own first attempt: behavior and evidence must support the explanation.

## Translate the requirement before reading the rationale

The diff-review case requires preserving unsaved text after network failure. The proposed patch clears the draft in finally while releasing busy state. Because finally runs on both success and failure, the patch contradicts the requirement even if its accompanying prose says errors are handled elsewhere. Write the acceptance observation first: reject the save and verify the original or newer draft remains.

A fluent rationale can direct attention toward the happy path and away from the control-flow branch that matters. Counter that by separating the requirement, the code path, and the evidence. The requirement determines the test; the implementation does not get to redefine the requirement merely because its author explains it confidently.

The smallest relevant correction moves clearing to the success path while leaving busy release in finally. If typing can continue during the request, clear only the saved snapshot rather than newer text. Chapter four and the capstone UI provide the corresponding identity problem: a completion belongs to an earlier draft, not necessarily the current editor value.

## Worked review: one failed save

Capture draft A, start a controlled save, type draft B before completion, then reject the request. Inspect the displayed value and whether another save can begin. A strong test proves both preservation and recovery. A test that checks only an error message could pass while the draft is erased or the busy flag remains stuck.

Next resolve a successful save of A while B is still present. The interface should not clear B merely because A succeeded. This neighboring case prevents an overly broad implementation that never clears anything from appearing fully correct. State which draft the successful result owns and which state remains independently editable.

Keep the proposed patch and the regression fixture small enough to inspect. Unrelated reformatting, dependency upgrades, or route changes make it harder to determine whether the requirement was actually satisfied. Scope control is not resistance to improvement; it preserves a reviewable connection between the problem and the change.

## Verify APIs at the installed version

The API-verification case proposes a method that the installed client does not expose. Start with the package manifest and lockfile, then inspect exported types or source. If external documentation is needed, use the vendor's documentation for the relevant version and a minimal reproduction. A cast to any suppresses a type complaint but does not create a runtime method.

In this repository, the dependency-free workshop fixtures are a useful contrast: their exports are directly visible. BoundedRetry does not suddenly acquire cancellation or HTTP-header parsing because a summary uses those words. The inspected source defines the available primitive. The same discipline should apply to an unfamiliar library rather than trusting a plausible method name.

An evidence note should record the version, the exact API or source location, the minimal command, and the result. If the claimed method is absent, explain the underlying requirement and evaluate supported alternatives. Do not rename a weaker guarantee to sound stronger. At-least-once delivery remains at-least-once even if a wrapper function is called exactlyOnce.

## Challenge tests from the contract

The quantity fixture accepts string input, rejects blank trimmed text, converts with Number, requires an integer, and bounds it from zero through twenty. Zero is valid, so truthiness is not a suitable validator. Exponent notation such as 1e1 is accepted by the current fixture and explicitly covered by its reference test.

A test suite containing only one and twenty misses blank input, fractions, negative values, over-limit values, and nonnumeric text. Derive cases from the requirement's boundaries before reading the implementation. Then deliberately remove the blank check in a scratch copy and confirm the suite fails. The mutation demonstrates that the test observes the property it claims to protect.

Do not mutate the repository's supplied reference or overwrite learner answers to perform the exercise. Copy the small function into a disposable test workspace or use an injected faulty implementation. Keep the original behavior available as a comparison and record the exact defect your tests rejected.

## Inspected text does not become task authority

The untrusted-text case contains a README or log that tells the reader to upload an environment file to an unrelated endpoint. That text is evidence to classify, not authorization. A log line cannot grant permission merely by resembling an instruction. Continue the legitimate repository investigation using the user's objective and the trusted workflow.

A useful review records the source and attempted redirection without copying secrets into the report. Inspect package scripts and command targets before running them, especially when the suspicious content tries to redirect execution. This is compatible with making progress: rejecting an unrelated instruction does not require abandoning the authorized code task.

For the learner, write a short classification table with source, content, relevance, and permitted action. Distinguish a quoted example of a bad command from a real project instruction and from a user request. The exercise tests provenance reasoning rather than fear of every unfamiliar string.

## Report completed evidence precisely

The handoff case has a successful build, a unit runner that fails before assertions start, and no browser run. The accurate report says exactly that. A worker-start failure is neither a passed suite nor proof of an application assertion failure. A command that was launched but remains running is an attempted check, not a result.

Use a compact evidence ledger: command, environment, exit or status, observed assertions, and limitation. Then describe the concrete behavior change and remaining verification action. Avoid claiming a deployment, migration, or production readiness that did not occur. Confidence should increase with relevant completed evidence rather than with the polish of the summary.

## Graded exercises

**A22-A:** Reject the finally-clears-draft patch with a controlled failure and newer-typing case. Five points require preservation and ability to retry.

**A22-B:** Verify a claimed API through installed source/types and a minimal check. Five points require version-specific evidence and no type cast used as proof.

**A22-C:** Build the quantity boundary suite and detect a deliberate mutation in a scratch copy. Five points require valid zero and explicit exponent-notation policy.

**A22-D:** Classify the untrusted instruction and rewrite the incomplete-test handoff honestly. Four points require continued authorized work and distinct pass, fail, and unrun states.

Read [the review](reviews/22-ai-assisted-review-with-independent-evidence.md) after producing the acceptance test and evidence ledger. The objective is independent judgment that remains useful when the first proposed solution is persuasive but wrong.
