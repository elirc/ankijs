# Roll back a release that wrote new data

Test rollback compatibility before using the switch.

Prerequisites: Deployments, Schema compatibility.
Runtime: Prepared incident timeline
Reviewed: 2026-09-26

## Case evidence

10:00 release B starts writing status='archived'. 10:04 error rate rises. 10:05 rollback to A, whose parser only accepts active/deleted. The old release now fails on data already written by B.

## Assignment

Draft a recovery plan that addresses both executable version and persisted data. Define the feature-flag default, an observation window and the exact signal that permits rollback. Test old code against new data fixtures.

## Hints

- Rolling back binaries does not roll back committed writes.
- A destructive data rewrite may have a larger blast radius than a forward fix.

## Reference explanation

Stop or disable the risky write path, preserve evidence, and choose a compatible forward fix or a rehearsed data-aware rollback. Expand/contract schemas and tolerant readers can make rollback safer. The plan must account for all records B already wrote and avoid silently discarding information.

## Acceptance criteria

- [ ] Old code/new data compatibility is tested.
- [ ] The mitigation preserves valid committed data.
- [ ] Recovery and re-enable signals are measurable.

## Further reading

- https://www.postgresql.org/docs/16/using-explain.html
