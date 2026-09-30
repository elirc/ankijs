# Recall extended engineering workbook

This course turns Recall's current source into a sequence of independent engineering investigations. Start with the placement and provenance chapter. Then work through asynchronous behavior before import, merging, ownership, and synchronization. The completed workbook contains twenty-four chapters, ninety-six graded exercises, and twenty-four separate review guides. Its final sequence connects integration boundaries, concurrency, recovery, independent review, and two capstone investigations.

## Delivered sequence

- [01. Curriculum provenance and an evidence-based route](01-curriculum-provenance-and-placement.md) | [Separate review](reviews/01-curriculum-provenance-and-placement.md)
- [02. Tests that own their asynchronous work](02-tests-that-own-their-asynchronous-work.md) | [Separate review](reviews/02-tests-that-own-their-asynchronous-work.md)
- [03. Search completion belongs to the current intent](03-search-completion-and-current-intent.md) | [Separate review](reviews/03-search-completion-and-current-intent.md)
- [04. Duplicate invocation, stale versions, and ambiguous delivery](04-save-guards-and-versioned-writes.md) | [Separate review](reviews/04-save-guards-and-versioned-writes.md)
- [05. Backup validation and the real import boundary](05-backup-validation-and-atomic-import.md) | [Separate review](reviews/05-backup-validation-and-atomic-import.md)
- [06. Card merge uses separate clocks and a deletion policy](06-card-clocks-and-tombstones.md) | [Separate review](reviews/06-card-clocks-and-tombstones.md)
- [07. Local account ownership before remote synchronization](07-local-account-ownership-before-sync.md) | [Separate review](reviews/07-local-account-ownership-before-sync.md)
- [08. Outbox coalescing and acknowledgments that preserve newer work](08-outbox-coalescing-and-acknowledgment.md) | [Separate review](reviews/08-outbox-coalescing-and-acknowledgment.md)

- [09. Review application and undo that survives synchronization](09-review-application-and-durable-undo.md) | [Separate review](reviews/09-review-application-and-durable-undo.md)
- [10. Local calendar days and study accounting](10-local-days-and-study-accounting.md) | [Separate review](reviews/10-local-days-and-study-accounting.md)
- [11. Practice journals, completion evidence, and pending writes](11-practice-journals-and-pending-writes.md) | [Separate review](reviews/11-practice-journals-and-pending-writes.md)
- [12. User-state conflicts, mirrors, and deferred validation](12-user-state-conflicts-and-deferred-validation.md) | [Separate review](reviews/12-user-state-conflicts-and-deferred-validation.md)
- [13. Curriculum migrations that preserve personal work](13-curriculum-migrations-that-preserve-personal-work.md) | [Separate review](reviews/13-curriculum-migrations-that-preserve-personal-work.md)
- [14. Sync pagination with exact resumable cursors](14-sync-pagination-and-resumable-cursors.md) | [Separate review](reviews/14-sync-pagination-and-resumable-cursors.md)
- [15. Offline startup, lazy assets, and update notifications](15-offline-startup-and-update-notifications.md) | [Separate review](reviews/15-offline-startup-and-update-notifications.md)
- [16. Notes, conversion, and precise search contracts](16-notes-conversion-and-search-contracts.md) | [Separate review](reviews/16-notes-conversion-and-search-contracts.md)

- [17. Webhook signatures and authenticated input](17-webhook-signatures-and-authenticated-input.md) | [Separate review](reviews/17-webhook-signatures-and-authenticated-input.md)
- [18. Operation identity and bounded retry budgets](18-operation-identity-and-retry-budgets.md) | [Separate review](reviews/18-operation-identity-and-retry-budgets.md)
- [19. Event delivery, projection order, and recoverable workers](19-event-delivery-order-and-recoverable-workers.md) | [Separate review](reviews/19-event-delivery-order-and-recoverable-workers.md)
- [20. SQL concurrency as an invariant laboratory](20-sql-concurrency-as-an-invariant-laboratory.md) | [Separate review](reviews/20-sql-concurrency-as-an-invariant-laboratory.md)
- [21. Restoration and data-aware recovery](21-restoration-and-data-aware-recovery.md) | [Separate review](reviews/21-restoration-and-data-aware-recovery.md)
- [22. AI-assisted review with independent evidence](22-ai-assisted-review-with-independent-evidence.md) | [Separate review](reviews/22-ai-assisted-review-with-independent-evidence.md)
- [23. Notes capstone: contract, ownership, and interface evidence](23-notes-capstone-contract-and-interface.md) | [Separate review](reviews/23-notes-capstone-contract-and-interface.md)
- [24. Independent capstone: a defensible sync and recovery investigation](24-independent-sync-and-recovery-capstone.md) | [Separate review](reviews/24-independent-sync-and-recovery-capstone.md)

## Prerequisites and route selection

Use the [existing route manifest](../routes.json) and [placement pack](../01-placement.md) to identify the relevant JavaScript, testing, and database prerequisites. You should be able to trace a promise, read a typed object, distinguish mutation from copying, and run a focused test command. If a chapter exposes a gap, return to the relevant current deck before repeating the exercise. Recognizing an answer on a card is preparation; the evidence milestone requires producing and explaining a result independently.

Chapters one and two are common foundations. Chapters three and four form the interaction route: observe stale completions, prevent duplicate local writes, and distinguish server version checks. Chapters five and six form the data route: locate the import boundary and reason about independent record clocks. Chapters seven and eight form the isolation and synchronization route. Their prerequisites include understanding the earlier distinction between an observed rejection and a prevented effect.

## How to work without overwriting learner answers

Keep predictions, scratch implementations, and experimental mutations in your own disposable workspace or branch. This book adds documentation and bounded reference checks; it does not replace application code, modify study progress, or fill learner starters. Read hints before opening the separate review. Save the first prediction even when it is wrong, then explain which observation changed your conclusion.

For each exercise, retain the input fixture, expected state, executed command, observed state, and a short claim with its limits. When using an existing reference, label the result reference verification. When proposing an unexecuted regression test, label it a design. Neither is evidence that you independently implemented the behavior. A strong submission includes one controlled faulty variant that the test rejects and one valid neighboring case it accepts.

## Bounded commands

Run these from the repository root. The two Node course checks use built-ins and read source references. The focused Vitest command uses already installed project dependencies and an isolated test database; it is not a browser or production-service test.

```sh
node docs/upskill/09-independent-practice/extended-course/verify-course.mjs
node --test docs/upskill/09-independent-practice/extended-course/reference-boundaries.test.mjs
node docs/upskill/09-independent-practice/verify-routes.mjs
npx --no-install vitest run src/db/sync/merge.test.ts src/db/repos/dataRepo.test.ts src/db/sync/ownership.test.ts src/db/sync/outbox.test.ts
```

The [course manifest](course-map.json) pins real workshop unit, deck, card, mission, and fixture identities. Its verifier catches drift in those links. It does not infer semantic correctness of every prose claim. The reference-boundary tests demonstrate selected workshop behavior, while the existing repository tests exercise actual merge, import, ownership, and queue functions under the project's test environment.

## Evidence gates and completion

After chapter four, explain a stale response, an overlapping save, and a stale server version using three different timelines. After chapter eight, explain an import failure, a two-clock merge, a blocked account switch, and an old queue acknowledgment. For each, identify the boundary where an effect is permitted and the assertion that catches the forbidden alternative. Revisit any claim supported only by a function name or a passing unrelated test.

Chapters nine through sixteen now cover durable review undo, calendar accounting, journal queues, user-state merges, curriculum migrations, pair cursors, offline startup, and note conversion. After chapter sixteen, present a complete state-and-effect timeline for one cross-layer operation, explicitly marking its transaction and asynchronous boundaries.

Chapters seventeen through twenty-four complete the sequence with authenticated integration input, operation identity, retry budgets, recoverable workers, SQL invariant laboratories, restoration, AI-assisted review, and independent capstones. The documentation and reference checks are complete; the learner exercises remain independent work, with no starter answers overwritten.

Choose the notes application capstone for a full API and interface work sample. Choose the sync-and-recovery capstone for a deeper investigation of Recall itself. Both require a requirement-to-assertion map, controlled failures, and an evidence ledger. Completion of supplied reference tests does not automatically complete either capstone.

## Focused checks for chapters nine through sixteen

These existing tests cover the repository and component contracts traced in the second installment. Use the installed project dependencies. They exercise fake-indexeddb and the configured component environment, not a production service-worker deployment or live cloud authorization.

```sh
npx --no-install vitest run src/db/repos/cardRepo.test.ts src/lib/dates.test.ts src/db/repos/reviewRepo.test.ts src/db/repos/practiceRepo.test.ts src/db/repos/userStateRepo.test.ts src/db/retiredCurriculum.test.ts src/db/sync/engine.test.ts src/components/UpdateToast.test.tsx src/db/repos/noteRepo.test.ts
```

For independent work, select the relevant test file and add your own controlled failure case in a disposable branch. Do not use a reset helper against personal study storage. A green existing suite is source-reference evidence; your milestone also needs a prediction, an observed boundary case, and an explanation of what the test environment leaves unproven.

## Integration checks and model limits

The additional course test file exercises exact freshness boundaries, an equal-delay retry budget, and limitations of the small idempotency, inbox, projection, and restore models. Tests that expose a limitation are descriptions of the reference fixture, not endorsements of that design for production. Keep those results beside the stronger extension requirements in the assignments.

```sh
node --test docs/upskill/09-independent-practice/extended-course/integration-boundaries.test.mjs
node --test public/workshop/checks/debugging.test.mjs public/workshop/checks/integrations.test.mjs public/workshop/checks/review-and-operations.test.mjs public/workshop/checks/fake-service.test.mjs public/workshop/capstone/typescript/reference/server.test.mjs
```

The HTTP reference tests bind ephemeral loopback ports and close their servers afterward. The SQL chapter provides source-grounded paired-session designs; this workbook's verification does not run PostgreSQL setup or concurrency sessions. Browser service-worker activation, deployed authentication, and independent learner implementations also remain separate verification tasks. Record those limits when presenting your own evidence.
