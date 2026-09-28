# Write an honest implementation handoff

Separate verified results, assumptions and blocked checks.

Prerequisites: Test output, PR descriptions.
Runtime: Tool-independent work sample
Reviewed: 2026-09-26

## Case evidence

The unit runner exits before starting a worker. A build completes. Browser tests were not run. A generated summary says "all tests pass; ready for production."

## Assignment

Rewrite the summary using only available evidence. Include the behavior change, exact successful check, failed infrastructure check, unrun coverage and a next verification action. Avoid implying a deploy happened.

## Hints

- A runner crash is neither a passing suite nor proof of an application bug.
- An attempted command is not a completed result.

## Reference explanation

Report build success if its exit and output establish it. State that unit assertions did not execute because the worker failed to start, and browser behavior remains unverified. Describe the concrete next step to restore the test environment. Keep confidence proportional to evidence; do not hide uncertainty behind “should work.”

## Acceptance criteria

- [ ] Every success claim has a completed result.
- [ ] Infrastructure failure is distinguished from assertion failure.
- [ ] The handoff identifies the next verification step.

## Further reading

- https://google.github.io/eng-practices/review/reviewer/
