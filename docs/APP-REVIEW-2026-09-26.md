# Recall app review — 2026-09-26

Recall's strongest opportunity is to turn its substantial library into a more directed learning experience: choose a goal, recall a concept, apply it, and revisit the specific difficulty.

This review inspected the application routes and screens, study and dashboard data flows, content structure and samples, persistence and optional sync, styling, build configuration, and test setup. It is a source review with attempted automated verification, not a completed visual/accessibility audit or a semantic verification of every card. No application code was changed.

## What is already working well in the design

- Local-first study, FSRS scheduling, due-first queues, daily new-card limits, sibling spacing, undo, and offline persistence form a useful core.
- The current content report lists 3,103 active cards, 83 decks are documented, and the app includes 48 engineering missions. The guided library contains 356 lessons represented by 712 cards. Preserve the practical web-development focus.
- Guided answers offer explanations, worked examples, common mistakes, and practice prompts. Sampled scenarios ask concrete questions about realistic bugs and include verification tasks.
- Practice journals ask for a change, verification, and a tradeoff; completion is explicitly self-reviewed. That distinction is worth keeping.
- JSON backup/restore, editable cards, source credits, accessible modal mechanics, route-level lazy loading, and a CI workflow already exist. The old IMPROVEMENTS.md contains historical findings that should not all be treated as current defects.

## Product improvements, in priority order

| Priority | Improvement | Current evidence and proposed behavior |
|---|---|---|
| High | Remember the learner's path | Home's main study button opens `/study?minutes=...`, which uses the mixed library. Track-focused sessions already exist. Add a skippable goal choice and a persistent active path; make the main button resume that path and keep mixed study as an explicit choice. |
| High | Connect recall to implementation | Missions link to a deck search using a text query. Add stable concept/card/deck links in both directions. After repeatedly missing a concept, offer its lesson and a small related exercise; after an exercise, suggest the relevant review cards. |
| High | Improve practice feedback | `AnswerExplorer`'s “Check my answer” only reveals a stored solution. Rename it “Show sample solution” now. Add an optional written attempt and explicit comparison criteria; use executable checks only for bounded exercises whose behavior can be tested reliably. |
| High | Make data protection visible | Backup is a manual Settings action. Show last export time, changes since export, and clear distinctions between local save, sync, and backup. Request persistent storage where supported and show the actual result. Persistence is not a backup and does not prevent deliberate deletion. |
| Medium | Show actionable progress | Progress currently emphasizes review count, streak, daily non-Again ratings, and scheduling stages. Add difficult concepts, repeat lapses, upcoming workload, and a suggested next activity. Separate first-attempt recall from same-session retries; show sample counts and avoid calling self-ratings mastery. |
| Medium | Make all paths equally navigable | .NET has a dedicated ordered path page; other paths mainly use deck filters. Reuse a common path-page component with prerequisites, learning outcomes, current position, and a capstone. Keep skip-ahead available. |
| Medium | Improve library discovery | Deck search searches deck names/topics; question/answer search is within a deck. Add global card search, filters for suspended/personal/difficult cards, and saved decks. Offer safe bulk operations with previews. |
| Medium | Improve mobile reading | Mobile CSS includes several 9–11px navigation and metadata rules. Review them on an actual phone and with text enlargement; offer reading-size and code-wrap controls. Improve access to Practice and Inbox from mobile navigation without overcrowding the bottom bar. |
| Lower | Reading conveniences | Add code syntax highlighting and copy controls, a preferred explanation style, and an optional dark theme after the core learning and protection work. |

For storage behavior, see [MDN's StorageManager documentation](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager). For a future mobile audit, use [W3C's target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum); small text alone is not proof of a WCAG failure.

## Content to add

These are proposed extensions and richer exercise formats. APIs, SQL, security, testing, accessibility, retries, observability, and deployment already have coverage, so avoid presenting these as entirely missing subjects.

1. **A guided capstone with a supplied starting point.** Develop the existing CRUD/capstone material into a reproducible issue tracker or notes app: requirements, schema, validation, authentication, ownership checks, search, tests, deployment, and recovery. Provide starter files, checkpoints, a reference solution, and acceptance tests. Offer TypeScript/React and .NET versions sharing the same requirements.
2. **Debugging case files.** Extend the existing scenarios with actual request traces, console output, failing tests, and small code excerpts. Ask for a hypothesis before revealing the cause. Examples: an out-of-order response, duplicate save, stale edit, timezone boundary, and offline update failure.
3. **Code-review exercises with supplied diffs.** Existing review missions ask learners to find or use a project. Supply compact PRs containing realistic defects, require a precise review comment, then reveal annotated findings and a regression test. This lowers the setup cost substantially.
4. **SQL concurrency labs.** Two-session lost updates, unique-constraint races, isolation behavior, deadlock retries, cursor pagination during concurrent inserts, and expand/contract migrations. Include runnable fixtures and expected results for one explicitly named database/version.
5. **External integration labs.** Webhook signature verification, duplicate delivery, out-of-order events, durable processing, idempotency-key expiry, rate limiting, and retry exhaustion. Use a local fake service so the lessons do not require paid accounts or live credentials.
6. **Operational case studies.** Extend existing missions with a small prepared incident: slow query, failed migration, queue backlog, or bad rollout. Include logs, measurements, a recovery objective, and a sample incident review.
7. **A small AI-assisted engineering module.** Reviewing a generated diff, checking an API claim against documentation, writing tests that challenge generated code, controlling task scope, and handling untrusted repository text. Keep the exercises tool-independent and grounded in engineering judgment.

A sensible first content release is one complete guided capstone, six debugging case files, and six supplied code-review exercises. Those quantities are a proposed editorial scope, not an estimate of effort. Validate the learning experience before adding another large card expansion.

For each new unit, define one outcome, prerequisites, runtime/version context, a realistic example, a failure case, a short retrieval prompt, an application task, and a solution rubric. Add source/review dates where technical behavior changes over time. Run executable examples in isolated fixtures when feasible. The current quality report explicitly says adapted examples were not all executed; structural validation should remain separate from semantic verification.

## Engineering findings

- **High: enforce account ownership in the sync loop.** `auth.ts:adoptLocalData` writes an `auth_blocked` marker and returns when it finds another account's records. The inspected sync loop does not consult that marker or independently reject foreign-owned outbox rows; `pushOutbox` rewrites each outgoing row's `user_id` to the current session's user. Consequently, a pending record created under account A that does not yet exist remotely could be uploaded under account B after an account switch and an ordinary sync trigger. Existing remote IDs may instead be rejected by row-level security, which does not prevent the new-record case. This is a source-derived failure path, not a live-backend reproduction. Reproduce with two test accounts and an unsynced note, then block sync before any push/pull when ownership differs, scope cursors/outboxes to the account, and test the transition. Do not rely on a warning marker alone.
- **Harden quick capture and preserve drafts.** `CaptureScreen.save` has no in-flight guard or error handler, and its Save button remains enabled until the first write finishes. Two quick submissions can each call `captureNote` with the same text; a rejected write has no inline recovery message. Reuse the card editor's guarded-save pattern, preserve the draft on failure, and consider draft persistence for both screens when navigating away. Verify duplicate-submission and storage-failure behavior with focused tests.
- **Test discovery includes scratch/archive material.** The default test attempt collected files from `artifacts/content-v17/backup-v16-data`, `artifacts/content-v17/scratch`, and `artifacts/content-v16/scratch`. `vite.config.ts` excludes e2e, node_modules, and dist, but does not bound unit-test discovery to `src`. Add an explicit source-test include pattern or exclude artifacts. The run failed while starting a worker, before assertions; the discovery issue is separate from that timeout.
- **Sync has important scope limits.** The journal lives in `sync_meta` and the sync engine transfers only decks, notes, cards, and review logs. Local undo deletes a review log, while remote logs are immutable, so an uploaded review cannot be undone consistently across devices. Make these limits visible in Settings and implement journal sync plus review-revocation semantics if reliable cross-device use becomes a primary feature.
- **Shared hosted service needs a data-model change.** Starter identities are shared and remote rows use `id` as the global primary key. The README correctly limits the current setup to a dedicated personal Supabase project. Before supporting multiple users in one deployment, introduce ownership-aware identities/keys or separate shared curriculum from user progress, with isolation tests.
- **Profile the study hot path before expanding content.** `loadStudy` loads all cards and all review logs and runs after a rating and on periodic refresh. `getDashboard` also reads full tables. Benchmark representative long histories on slower devices; use indexed daily-log queries and cached/derived aggregates where measured results justify them.
- **Add recoverable render/chunk-load failures.** Startup has a storage-error view and routes have Suspense fallbacks, but the inspected route tree has no React error boundary. Provide a retry screen that preserves local data when a lazy chunk or render fails.
- **Strengthen the development workflow selectively.** CI already runs typecheck, unit tests, build, and Playwright. Add linting for hooks and basic formatting, run content checks when content changes, and include real WebKit testing. The current “iPhone 13” project explicitly runs Chromium, so it does not verify Safari's engine or iOS storage behavior.

## Suggested implementation sequence

1. Enforce sync ownership; guard capture saves; fix test discovery; clarify solution-reveal wording and sync limits; add backup status and recoverable error screens.
2. Add saved learning goals, consistent path pages, and a focused Home study action.
3. Link concepts to missions and introduce the first supplied capstone/debugging/review exercises.
4. Add useful learning diagnostics, global card search, and measured performance improvements.
5. Expand content according to repeated learner difficulties and completion evidence.

Track whether a new learner can choose an appropriate path and complete a first useful session, whether they return to their chosen path, whether missed concepts lead to successful exercises, and whether a backup restores correctly. Keep any product analytics optional and compatible with the local-first promise.

## Verification limits

The default `npm test` attempt failed with a Vitest worker-start timeout and executed no tests. A source-only thread-pool retry and `npm run build` made no further visible progress and were interrupted; both exited with code 1 without additional diagnostics. Neither is reported as passing or as demonstrating an application defect. Browser control was unavailable, so no live visual inspection or new end-to-end run was completed. Optional remote sync was reviewed from source and was not exercised against a configured Supabase backend. The report is the only authored workspace change.
