# Trace a request across a worker boundary

Build a causal timeline without dumping user payloads.

Prerequisites: Structured logging.
Runtime: Prepared correlated logs
Reviewed: 2026-09-26

## Case evidence

```text
12:01:00 api request=r17 event=e9 accepted duration_ms=12
12:01:02 worker event=e9 attempt=1 dependency_timeout
12:01:08 worker event=e9 attempt=2 delivered
12:01:09 api request=r18 status=200
```
An unrelated request r18 should not be blamed for e9.

## Assignment

Write the causal timeline, name what remains unknown, and define safe fields needed to connect the API handoff to worker attempts. Add an alert based on the user-visible delivery objective.

## Hints

- A timestamp match alone does not establish causation.
- Carry event/correlation identity through durable handoffs.

## Reference explanation

Use stable event identity to connect acceptance, attempts and completion, with request/trace context where appropriate. Log route template, status/error code, duration and safe identifiers. Track end-to-end age from accepted work to completion. State uncertainties rather than filling gaps with guesses; never include credentials or full bodies by default.

## Acceptance criteria

- [ ] The timeline cites concrete correlated events.
- [ ] Unrelated requests are excluded from causal claims.
- [ ] The alert measures the promised end-to-end outcome.

## Further reading

- https://www.postgresql.org/docs/16/using-explain.html
