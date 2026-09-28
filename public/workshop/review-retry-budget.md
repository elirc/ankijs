# Review an unlimited retry loop

Evaluate retries against side effects and an overall deadline.

Prerequisites: Promises, HTTP failures.
Runtime: JavaScript diff
Reviewed: 2026-09-26

## Case evidence

```diff
- return await sendOrder(order);
+ while (true) {
+   try { return await sendOrder(order); }
+   catch { await sleep(1000); }
+ }
```
A 400 validation error and a response timeout take the same path.

## Assignment

Write two findings: one for duplicate effects and one for unbounded work. Provide a bounded policy table for validation, authentication, rate limiting and transient transport failure.

## Hints

- A timeout does not prove the server rolled back.
- A per-attempt timeout is not an overall deadline.

## Reference explanation

Reuse a stable idempotency key for the same logical operation; reject reuse with a different payload. Retry only classified transient failures, honor applicable server delay guidance, add backoff/jitter, and cap attempts plus total elapsed time. Surface exhaustion and preserve the operation state for an intentional retry. Do not retry validation errors unchanged.

## Acceptance criteria

- [ ] Permanent failures terminate immediately.
- [ ] Retries reuse the same operation identity.
- [ ] Deadline and exhaustion are tested.

## Further reading

- https://google.github.io/eng-practices/review/reviewer/
