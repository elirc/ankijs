# Prove the backup actually restores

Measure recovery in an independent empty environment.

Prerequisites: JSON or SQL backups.
Runtime: Supplied notes backup fixture
Reviewed: 2026-09-26

## Case evidence

The team has daily backup files but has never restored one. The latest file parses successfully, yet some notes reference missing owners. A checksum proves file integrity, not relational consistency or a working application.

## Assignment

Restore the supplied fixture into a fresh store. Validate record counts, ownership references, representative content, and an authenticated CRUD journey. Record recovery time, newest recovered write and unresolved gaps.

## Hints

- Do not restore over the only working copy.
- Separate recovery point from recovery duration.

## Reference explanation

Validate the artifact, restore independently, verify relationships and application behavior, then document what data the backup covers. Recovery point concerns which committed data is recovered; recovery time concerns how long service takes to restore. Rehearse credentials, runtime configuration and schema versions as well as the data file.

## Acceptance criteria

- [ ] Restore uses an empty independent destination.
- [ ] Integrity checks and a user journey pass.
- [ ] Recovery time and data-loss window are measured.

## Further reading

- https://www.postgresql.org/docs/16/using-explain.html
