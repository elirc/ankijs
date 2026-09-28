# Review a helpful log that leaks credentials

Keep diagnostic value without retaining secrets.

Prerequisites: HTTP headers, Structured logs.
Runtime: Node diff
Reviewed: 2026-09-26

## Case evidence

```diff
+ logger.error({ request, headers: request.headers, body: request.body }, 'failed');
```
The request contains Authorization, Cookie, an email and a password-reset token.

## Assignment

Replace the log with an allowlist of diagnostic fields. Write a test that captures the emitted object and proves forbidden values do not appear at any nesting level.

## Hints

- Redacting one header does not sanitize the full request object.
- Prefer a correlation ID over a request-body dump.

## Reference explanation

Log a generated request ID, route template, method, status, safe error code and duration. Never serialize the complete request by default. Apply explicit redaction where selected data must be logged, and test nested objects plus alternate casing. Keep access controls and retention policies for the remaining logs.

## Acceptance criteria

- [ ] Known secrets are absent from serialized output.
- [ ] The request can still be correlated across components.
- [ ] Only approved fields are included.

## Further reading

- https://google.github.io/eng-practices/review/reviewer/
