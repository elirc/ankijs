# Stop a worker while it owns a job

Define what graceful shutdown can and cannot finish.

Prerequisites: Workers, Cancellation.
Runtime: Node lifecycle fixture; .NET extension
Reviewed: 2026-09-26

## Case evidence

A deployment sends a stop signal while a worker owns a leased job. The process exits immediately; the job remains in-progress forever because its lease has no expiration. Another deployment waits indefinitely for a stuck dependency.

## Assignment

Stop claiming new jobs, bound the drain period, propagate cancellation to supported I/O, and allow uncompleted leases to expire. Test both successful drain and forced termination after the deadline.

## Hints

- Cancellation is a request, not proof that an external write did not commit.
- Recovery must also handle an ungraceful kill.

## Reference explanation

Use a shutdown deadline and stop intake first. Let safe work finish within budget; preserve/checkpoint only under a documented consistency contract. Expiring leases recover abandoned work after forced termination. A retry may follow a committed-but-unacknowledged effect, so downstream operations still need idempotency.

## Acceptance criteria

- [ ] No new job is claimed after shutdown starts.
- [ ] A stuck job cannot prevent termination forever.
- [ ] Expired work can resume without duplicating effects.

## Further reading

- https://www.postgresql.org/docs/16/using-explain.html
