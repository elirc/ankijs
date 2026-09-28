# Respect rate limits without blocking forever

Build a bounded retry policy from response semantics.

Prerequisites: HTTP status codes.
Runtime: Node fake clock and service
Reviewed: 2026-09-26

## Case evidence

Responses: 429 Retry-After:2; then 503; then 200. The client has a three-second overall budget. A per-attempt timeout of three seconds incorrectly permits several attempts to exceed it.

## Assignment

Implement the deterministic fixture using an injected clock and sleep. Parse supported Retry-After forms, cap delays to the remaining budget, and abort when no useful attempt fits. Do not wait in real time in tests.

## Hints

- Server guidance does not extend your own deadline.
- Jitter should be injected or seeded for deterministic tests.

## Reference explanation

Track an absolute deadline. Before each attempt and delay compute remaining time, cap per-attempt timeouts, and stop on exhaustion. Honor valid Retry-After where it fits, otherwise surface a retryable outcome for later. Retry only safe/idempotent operations under the relevant policy; 400 and 401 need different remediation.

## Acceptance criteria

- [ ] No attempt starts after the deadline.
- [ ] Permanent failures are not retried unchanged.
- [ ] Rate-limit guidance is honored within the budget.

## Further reading

- https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
- https://www.rfc-editor.org/rfc/rfc9110.html
