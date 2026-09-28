# Review a list identity regression

Preserve an editable row’s state across removal and sorting.

Prerequisites: React lists and state.
Runtime: React diff
Reviewed: 2026-09-26

## Case evidence

```diff
- notes.map(note => <Editor key={note.id} note={note} />)
+ notes.map((note, i) => <Editor key={i} note={note} />)
```
An editor owns an unsaved textarea draft.

## Assignment

Describe a three-step reproduction that moves a draft to the wrong record. Fix identity and design a user-facing regression test rather than asserting the JSX text.

## Hints

- Keys identify component instances among siblings.
- Random keys created during rendering also lose identity.

## Reference explanation

Edit row B, remove row A, then verify B’s draft still belongs to B. Use the stable record ID as the key, including after sorting/filtering. The test should type into a labeled row editor and assert the resulting draft by record identity. Avoid a test that only checks whether the source contains key={note.id}.

## Acceptance criteria

- [ ] Drafts remain attached after removing an earlier row.
- [ ] Sorting does not lose focus/draft identity unexpectedly.
- [ ] The regression test exercises behavior.

## Further reading

- https://google.github.io/eng-practices/review/reviewer/
