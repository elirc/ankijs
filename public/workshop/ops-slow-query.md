# Investigate a slow notes search

Connect an observed query plan to a measured change.

Prerequisites: SQL indexes, Basic timing.
Runtime: PostgreSQL 16+ fixture
Reviewed: 2026-09-26

## Case evidence

Incident: p95 list latency rose from 80ms to 900ms after 200k archived notes were imported. Query filters owner_id and archived=false, sorts by updated_at,id and returns 30 rows. The current index covers only updated_at.

## Assignment

Load the supplied fixture, record EXPLAIN (ANALYZE, BUFFERS), then evaluate an owner-scoped partial index for active notes. Run repeated cold/warm measurements and compare writes and index size.

## Hints

- Do not infer usefulness from the index name alone.
- EXPLAIN ANALYZE executes the statement. Use a disposable fixture for writes.

## Reference explanation

Investigate selectivity, rows removed, sort work and buffers before choosing an index. An index on (owner_id,updated_at,id) WHERE archived=false may support this access pattern, but verify the actual plan and representative owner distributions. Record latency distribution and write/storage cost. A single fast warm query is insufficient evidence.

## Acceptance criteria

- [ ] Before/after plans and representative timings are saved.
- [ ] Results and ordering are unchanged.
- [ ] Write/storage cost and measurement conditions are recorded.

## Further reading

- https://www.postgresql.org/docs/16/using-explain.html
