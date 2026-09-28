# Review a test that passes before the work finishes

Make asynchronous assertions participate in test completion.

Prerequisites: Async tests.
Runtime: Node test runner / Vitest
Reviewed: 2026-09-26

## Case evidence

```diff
+ test('rejects invalid data', () => {
+   expect(save('')).rejects.toThrow('invalid');
+ });
```
The test body returns before the rejection assertion settles.

## Assignment

Write the corrected test and demonstrate that it fails if save resolves. Add a separate assertion that no write occurred; do not merely inspect an error string.

## Hints

- Return or await the assertion promise.
- A test should fail under the intended mutation.

## Reference explanation

Make the test async and await expect(save('')).rejects.toThrow(...), or return that promise. In Node’s runner use await assert.rejects. Confirm the persistence spy/store remains unchanged. Temporarily replace the rejection with success to establish that the assertion is connected to completion.

## Acceptance criteria

- [ ] The promise assertion is awaited.
- [ ] A deliberately broken implementation fails.
- [ ] Storage remains unchanged after rejection.

## Further reading

- https://google.github.io/eng-practices/review/reviewer/
