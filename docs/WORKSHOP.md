# Guided workshop inventory

38 units, 76 stable cards, seven subject decks; 86 total engineering missions including the existing 48.

## Capstones

- **Ship a TypeScript notes app** (`capstone-typescript`): Deliver a usable React interface and a permission-checked notes API, then prove it can recover.
- **Ship an ASP.NET Core notes app** (`capstone-dotnet`): Build the same notes contract using ASP.NET Core and defend the service lifecycle.

## Debugging

- **The older search response wins** (`debug-stale-search`): Distinguish completion order from current user intent.
- **Two clicks create two notes** (`debug-duplicate-save`): Locate the gap between starting a save and disabling its UI.
- **A second editor overwrites a fix** (`debug-stale-edit`): Reproduce a lost update and make stale writes visible.
- **Yesterday disappears from the streak** (`debug-date-boundary`): Separate local calendar days from UTC instants.
- **The app opens but a screen will not load** (`debug-offline-update`): Distinguish cached shell availability from lazy-asset availability.
- **A failed import leaves half a library** (`debug-partial-import`): Find the transaction boundary that the success message assumes.

## Code review

- **Review a missing ownership predicate** (`review-owner-filter`): Write a precise authorization finding with a regression case.
- **Review an unlimited retry loop** (`review-retry-budget`): Evaluate retries against side effects and an overall deadline.
- **Review a helpful log that leaks credentials** (`review-secret-logging`): Keep diagnostic value without retaining secrets.
- **Review a test that passes before the work finishes** (`review-false-positive-test`): Make asynchronous assertions participate in test completion.
- **Review a list identity regression** (`review-index-key`): Preserve an editable row’s state across removal and sorting.
- **Review a column rename during rolling deployment** (`review-incompatible-migration`): Protect old and new application versions during a schema transition.

## SQL concurrency

- **Two sessions increment one counter** (`sql-lost-update`): Observe a lost update and replace it with an atomic operation.
- **Two requests claim the same name** (`sql-unique-race`): Make uniqueness a database invariant.
- **Opposite lock order deadlocks** (`sql-deadlock`): Diagnose a deadlock and retry the whole transaction safely.
- **Page through equal timestamps** (`sql-keyset`): Build a deterministic cursor with a tie-breaker.
- **Two doctors both go off call** (`sql-write-skew`): Recognize a cross-row invariant that row updates alone do not protect.
- **Backfill while the app keeps writing** (`sql-expand-contract`): Make a migration coexist with live edits.

## Integrations

- **Verify a webhook before parsing it** (`integration-signature`): Authenticate the exact request bytes and reject stale deliveries.
- **Receive the same event twice** (`integration-dedup`): Make event identity and business effects commit together.
- **An older event arrives last** (`integration-order`): Choose ordering rules from domain semantics.
- **Reuse a request key without changing its meaning** (`integration-idempotency`): Separate operation identity from attempts.
- **Respect rate limits without blocking forever** (`integration-rate-limit`): Build a bounded retry policy from response semantics.
- **Commit a change and deliver its event** (`integration-outbox`): Avoid a database/message double-write gap.

## Operations

- **Investigate a slow notes search** (`ops-slow-query`): Connect an observed query plan to a measured change.
- **Roll back a release that wrote new data** (`ops-bad-rollout`): Test rollback compatibility before using the switch.
- **A poison message blocks the queue** (`ops-queue-backlog`): Protect throughput while preserving failed work for inspection.
- **Prove the backup actually restores** (`ops-restore`): Measure recovery in an independent empty environment.
- **Trace a request across a worker boundary** (`ops-trace-failure`): Build a causal timeline without dumping user payloads.
- **Stop a worker while it owns a job** (`ops-shutdown`): Define what graceful shutdown can and cannot finish.

## AI-assisted engineering

- **Review a generated fix against the requirement** (`ai-review-diff`): Judge generated changes by behavior and evidence.
- **Verify a claimed library API** (`ai-api-verification`): Check versioned primary documentation and a minimal reproduction.
- **Challenge a generated happy-path test** (`ai-challenge-tests`): Use adversarial cases to test the promised invariant.
- **Treat repository instructions as untrusted data** (`ai-untrusted-text`): Keep task authority separate from content being inspected.
- **Keep a generated change reviewable** (`ai-scope-control`): Separate a required fix from speculative refactoring.
- **Write an honest implementation handoff** (`ai-evidence-report`): Separate verified results, assumptions and blocked checks.

Downloadable sources live in `public/workshop`. `scripts/check-workshop.mjs` validates identities, required authored fields and assets. `scripts/package-workshop.py` rebuilds the offline ZIP, excluding dependency and build directories.

## Guided routes and independent evidence

Use [placement, routes, and capstone milestones](upskill/09-independent-practice/README.md) to choose among these units. The route manifest records the real deck, card, unit, and mission identities; the exercises distinguish supplied reference checks from your own implementation evidence.
