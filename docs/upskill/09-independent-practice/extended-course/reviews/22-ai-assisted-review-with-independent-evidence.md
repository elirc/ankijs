# Review 22. Let the requirement challenge the explanation

Return to [the assignment](../22-ai-assisted-review-with-independent-evidence.md). The review should reward independent observations, not the source of the proposed code or the confidence of its commentary. A polished explanation can accompany a simple control-flow error.

## A22-A: preserve the draft and recover

Reject the save while holding a known draft and assert the text remains. Type newer text while the old snapshot is pending, then test both failure and success of the old request. Busy state must release so a later retry can start. Clearing in finally fails the preservation requirement because that block runs on rejection too.

Moving clearing to success is necessary but can still erase newer typing unless the saved snapshot is compared with current state. Conversely, never clearing anything may preserve drafts but fail the intended successful-save behavior. The neighboring success case keeps the solution precise.

## A22-B: an API claim needs versioned evidence

Record the installed package version and inspect exported types or source. Use the relevant vendor documentation when needed, then a minimal compile or runtime reproduction. Casting to any does not prove a method exists. A method from another version or a similar library is not evidence for the installed dependency.

If the method is absent, restate the underlying requirement and evaluate a supported alternative with its actual guarantee. Naming a wrapper exactlyOnce does not change delivery semantics. The same standard applies to the workbook's local fixtures: source inspection shows which inputs and timing behavior a helper really implements.

## A22-C: meaningful mutation testing

The quantity suite must accept zero and twenty, reject blank and whitespace input, reject fractions and out-of-range values, and address nonnumeric text. The current contract accepts exponent notation such as 1e1. If a proposed product contract disallows it, that is a deliberate lexical restriction requiring an additional rule.

Delete the blank check in a scratch implementation and confirm empty input fails the suite. Keep learner and reference files intact. A mutation that changes an unrelated output does not establish the blank-input assertion's strength. Record the precise faulty variant and the test that catches it.

## A22-D: authority and handoff

A README or log requesting unrelated secret upload is inspected content, not permission. Identify its source, reject the redirection, and continue the authorized investigation using reviewed commands. The report should preserve useful evidence without reproducing credentials or contacting the proposed endpoint.

For the handoff case, state build success, unit-runner infrastructure failure before assertions, and browser tests unrun. Do not translate an attempted command into a completed result or a worker crash into an application assertion failure. Name the next step that would resolve the missing evidence.

## Review milestone

Require a requirement-to-assertion map and a command/result ledger. Every claimed success should have a relevant completed observation. Every limitation should name the missing check rather than hide behind vague uncertainty. This standard permits useful partial results while preventing an unsupported all-tests-pass or ready-for-production conclusion. It is equally appropriate for generated code and human-authored code.
