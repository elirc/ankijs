# Two clicks create two notes

Locate the gap between starting a save and disabling its UI.

Prerequisites: Async functions, UI state.
Runtime: Browser JavaScript
Reviewed: 2026-09-26

## Case evidence

The trace shows click A at 0ms and click B at 4ms. Both call createNote before the render disables Save. Database IDs differ but bodies match.

```js
async function save() {
  setSaving(true);
  await createNote(body);
  setSaving(false);
}
```

## Assignment

Add a synchronous in-flight guard, release it in finally, retain the draft on failure, and test two calls while the first promise remains pending. Then explain why server idempotency is still needed for network retries.

## Hints

- A disabled button is useful feedback but not the only guard.
- A rejected first attempt must allow a deliberate retry.

## Reference explanation

Use a ref or closure boolean that changes synchronously before awaiting. Ignore the second invocation until the first settles. Clear only the draft snapshot that was saved so newer typing survives. At an HTTP boundary, pair this with an idempotency rule; a client guard cannot undo a timed-out write that already committed.

## Acceptance criteria

- [ ] Two pending invocations produce one write.
- [ ] Failure preserves text and releases the guard.
- [ ] Typing during a save is not erased by completion.

## Further reading

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
