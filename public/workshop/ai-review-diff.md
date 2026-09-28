# Review a generated fix against the requirement

Judge generated changes by behavior and evidence.

Prerequisites: Reading diffs, Regression tests.
Runtime: Tool-independent code review
Reviewed: 2026-09-26

## Case evidence

Requirement: preserve unsaved form text after a network failure. Generated patch:

```diff
+ try { await save(draft); }
+ finally { setDraft(''); setBusy(false); }
```
The accompanying explanation claims the draft is safe because errors are caught elsewhere.

## Assignment

Write the acceptance test before accepting the patch. Inject a rejected save and compare the displayed draft. Require the smallest change that satisfies the behavior, then review all changed files for unrelated edits.

## Hints

- A fluent explanation is not runtime evidence.
- finally runs on both success and failure.

## Reference explanation

Move clearing into the successful path and clear only the saved snapshot if newer typing is possible. Keep releasing the busy flag in finally. The regression test holds/rejects the save promise, checks the original or newer draft remains, and proves a retry can start. Review generated code with the same ownership and validation standards as other contributions.

## Acceptance criteria

- [ ] The test fails on the proposed patch.
- [ ] The corrected patch preserves drafts on failure.
- [ ] The review ties each required change to the actual requirement.

## Further reading

- https://google.github.io/eng-practices/review/reviewer/
