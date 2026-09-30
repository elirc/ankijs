# Effect & agentic CRUD

Open `/effect-lab` from the desktop sidebar, the home page, or **More** on mobile.

The dedicated learning section contains **23 guided projects and 1,002 learning activities**: 138 build milestones plus 864 scenario-specific practice drills, with 3,006 acceptance checks. The original 14 projects keep their six-step build paths and nine drills per milestone:

1. Project tracker: validated create/list, editing/search/archive, replaceable repository Layers.
2. Milestones & evidence: related tasks, evidence-driven completion, atomic multi-record changes.
3. Import preview: schema decoding, transactional merges, export/restore verification.
4. Shared projects: verified identity, roles/comments, stale edits and compatible migrations.
5. Reliable background sync: bounded retry, idempotent outbox delivery, worker lifecycle and diagnostics.
6. Support-ticket app: browser/API/PostgreSQL CRUD, assignments/audit history, search/deploy/restore.
7. Inventory & reservations: catalog/ledger, concurrent stock reservation, retry/release/expiry.
8. Customer CRM: related CRUD, deal workflows, deliberate deduplication, search, activities, and portability.
9. Booking & availability: local calendar rules, time zones, overlap prevention, holds, rescheduling, and reminders.
10. Requests & approvals: immutable submissions, reviewer policy, decisions, delegation, history, and release recovery.
11. Team file library: folder trees, upload intents, resumable transfers, verified versions, downloads, and retention.
12. Notification center: inbox state, preferences, fan-out, provider adapters, callbacks, and daily digests.
13. Webhook operations console: durable receipt, signatures, deduplication, event ordering, replay, and operations.
14. Agent-assisted delivery lab: specification, version-grounded Effect code, regression diagnosis, review, incremental refactoring, and release evidence.

The original seven projects now also cover accessible forms, bulk operations, local migrations, dependency graphs, aggregate queries, learning-to-card workflows, CSV parsing, large imports, format compatibility, invitations, row-level security, access audits, caching, bounded workers, reconciliation, ticket attachments, response deadlines, API contracts, stock transfers, physical counts, and contention experiments.

The Fundamentals and System design topics add nine labs, each with six build milestones and twelve reinforcement drills. Their **162 new activities include 162 solved examples and 324 recall question/answer pairs**, adding 58,485 instructional words (195,957 across the section):

15. JavaScript foundations: values and references, transformations, equality, asynchronous work, closures, and pure logic.
16. TypeScript domain modeling: unknown inputs, unions, narrowing, optional values, generics, and boundary contracts.
17. Effect runtime fundamentals: execution, typed failures, dependency injection, resource lifecycles, cancellation, and testing.
18. Relational foundations: keys, constraints, joins, transactions, indexes, pagination, and migrations.
19. HTTP and interface fundamentals: resource contracts, requests, accessible forms, state, cache validators, and integration tests.
20. Secure CRUD: identity, sessions, authorization, tenant boundaries, injection prevention, and safe input handling.
21. System design foundations: requirements, workload estimates, boundaries, asynchronous jobs, caching, and tradeoffs.
22. Distributed reliability: consistency, idempotency, delivery, retry budgets, observability, and recovery.
23. Architecture studio: multi-tenant design, read models, media storage, regions, safe evolution, and evidence-based review.

Start with the concept explanation and solved trace. Answer both recall questions from memory before revealing their explanations, then build the activity and run its failure experiment. Revisit the questions later with a different input or feature. Recall cards are self-study prompts within the guide; they do not create scheduled flashcards or mark a journal complete. Agent briefs include the questions and ask for the learner's reasoning before implementation. Each lab links its primary technical references.

The [tenfold baseline](effect-tenfold-baseline.json) records the earlier 84-activity library. The [reinforcement baseline](effect-reinforcement-baseline.json) preserves all 840 activity/checklist identities present before these nine labs were added. The [current report](effect-content-report.json) records activity counts, instructional words, retrieval questions, worked examples, and payload sizes. Activity growth and prose growth are separate measures. Existing mission and acceptance-check IDs remain unchanged, including all earlier drills.

These are implementation assignments to perform in a development environment. The section provides the learning material, project navigation, progress, and evidence journal; it does not run hosted ticket or inventory applications.

Every project includes prerequisites, data-model guidance, service boundaries, and ordered milestones. Every build milestone and drill includes a concept explanation, three implementation steps, three acceptance checks, a failure experiment, an agent prompt, review guidance, and a stretch exercise. Drills cover concrete edge cases such as ambiguous writes, authorization changes, concurrency, imports, accessibility, worker recovery, and agent review. Reference links distinguish Effect majors; use examples matching the installed version.

Evidence uses stable `effect-*` mission IDs in the existing practice journal. It saves in IndexedDB, participates in normal Recall JSON backup/import and optional configured user-state sync, and does not affect flashcard review ratings. Completion requires all acceptance checks and all three evidence notes. Completed work can be reopened.

Project evidence and full project guides can be exported as Markdown; new guides include solved examples, expandable recall answers, and primary references. Switch between project cards and individual activities, filter build milestones versus drills, and browse 24 results per page; search covers explanations, examples, recall answers, steps, and failure experiments. Learning topic, project type, activity type, learning stage, progress, search, result page, and browse layout persist in the URL. Topic shortcuts open the corresponding project collection. Stage summaries link into filtered results. Activity pages provide a jump menu and previous/next links that do not mark work complete. Each drill links back to its build milestone. Project pages group drills in expandable panels. The guides, recall answers, and journal work offline after the production PWA is installed; external reference links require a connection.

The catalog, full-text search, and detailed guides are separate assets. Browsing loads compact activity metadata. The full search index loads when a query is entered; opening a project downloads only that project's guide. The evidence workspace is also lazy-loaded. Production service-worker caching retains offline access after installation.

Implementation entry points:

- `src/data/effect-projects.ts` and `effect-project-expansion.ts`: the original 84 build milestones.
- `src/data/effect-drills/*.json`: 756 authored case-specific drills, nine per parent milestone.
- `src/data/effect-reinforcement/*.json`: nine source bundles and their ordered topic manifest; six build milestones and twelve drills per bundle.
- `scripts/build-effect-library.mjs`: validates count, depth, uniqueness, parent relationships, and legacy identity; generates runtime packs, catalog, search, check manifest, and report.
- `src/data/effect-packs/*.json`: generated per-project detail bundles. `effect-catalog.json` and `effect-search.json` keep browsing and full-text indexing separate.
- `src/features/effect-lab/effect-library.ts`: cached, retryable project and search loaders.
- `src/features/effect-lab/EffectLabScreen.tsx`: catalog, pagination, project detail, activity workspace, and exports.
- `src/db/repos/practiceRepo.ts`: validation and persistence through the existing journal/backup/sync system.

After an intentional content edit, run `npm run effect:build`, then `npm run effect:check`. Do not edit generated packs independently.
Focused verification:

```sh
npm run typecheck
npm run effect:check
npm test -- src/features/effect-lab/EffectLabScreen.test.tsx src/features/practice/PracticeScreen.test.tsx src/db/repos/practiceRepo.test.ts
npm run build
npx playwright test e2e/effect-lab.spec.ts e2e/effect-loading.spec.ts e2e/effect-reinforcement.spec.ts --project=desktop --project=mobile
```
