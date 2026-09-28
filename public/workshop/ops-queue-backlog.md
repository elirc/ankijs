# A poison message blocks the queue

Protect throughput while preserving failed work for inspection.

Prerequisites: Workers, Retries.
Runtime: Prepared queue metrics and Node fixture
Reviewed: 2026-09-26

## Case evidence

Queue depth: 20→5000. Oldest age: 1m→70m. Worker CPU: low. One malformed message retries forever at the head. Successful-message latency is hidden by an average duration metric.

## Assignment

Identify the blocking mechanism from the evidence. Add bounded attempts, a retry schedule and an exhausted/dead-letter state. Define how to repair and replay an item without duplicating its effect.

## Hints

- Queue depth alone does not show age or failure concentration.
- Dropping the item without an audit trail loses work.

## Reference explanation

Classify the malformed message as permanent or exhausted, retain its safe diagnostic metadata, and allow unrelated work to progress. Monitor oldest age, attempts, failure type and processing throughput. Replay after repair using the original operation identity or a documented new identity with duplicate protection.

## Acceptance criteria

- [ ] A poison item cannot block all healthy work.
- [ ] Exhausted work remains inspectable and replayable.
- [ ] Replay does not duplicate a committed effect.

## Further reading

- https://www.postgresql.org/docs/16/using-explain.html
