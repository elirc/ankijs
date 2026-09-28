# Keep a generated change reviewable

Separate a required fix from speculative refactoring.

Prerequisites: Git diffs, Requirements.
Runtime: Tool-independent change planning
Reviewed: 2026-09-26

## Case evidence

Task: add a search clear button. Proposed patch also changes the router, upgrades dependencies and rewrites authentication. No failing test links those changes to clearing search.

## Assignment

Define the acceptance behavior, list necessary files, and remove unrelated changes from the proposal. If a genuine prerequisite appears, document its dependency and verify it separately before continuing.

## Hints

- Smaller is not automatically correct; necessary cross-layer work still belongs.
- Judge scope by the requirement, not a fixed line count.

## Reference explanation

Keep the clear button, URL/filter reset behavior, focus behavior and relevant regression coverage together. Defer independent upgrades and auth rewrites. Explain any required shared-component change through a concrete caller. Review the final diff and report what was tested and what remains unverified.

## Acceptance criteria

- [ ] Every changed file has a requirement-related purpose.
- [ ] Clearing search updates the intended state and URL.
- [ ] Unrelated upgrades/refactors are absent or separately justified.

## Further reading

- https://google.github.io/eng-practices/review/reviewer/
