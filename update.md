# update.md — live handoff for whoever continues this work

Read this first if you are a different model/session taking over. It is kept current as work
proceeds; the newest status is in **Status log** at the bottom.

## The user and the product

- Recall (repo `ankijs`) is a local-first spaced-repetition PWA used by ONE person: a junior
  software engineer upskilling in everyday CRUD web development (JS/TS, React, HTML/CSS, SQL,
  HTTP APIs, Git, Python, C#/.NET). They study on a phone, 1–10 minutes at a time.
- Stack: React 19 + Vite 8 + Dexie (IndexedDB) + ts-fsrs, optional Supabase sync, vite-plugin-pwa.
- Working style the user asked for: **Fable plans/steers/reviews; Opus agents implement.**
  Use several Opus agents in parallel, each on a small, file-disjoint unit.
- Hard product constraints: curated content only (no bulk generated/scraped libraries — v12–v14
  were retired for size), small install, short-session usability, never reset review history.

## Host constraints (Windows, low RAM, Defender)

- Run vitest, builds, Playwright strictly one at a time with long timeouts (jsdom loads slowly).
  Full vitest suite ≈ 12 min; `seed.test.ts` / `retiredRetrieval.test.ts` may time out here for
  throughput reasons only. Content tests: `npx vitest run src/data src/teaching src/db/retiredCurriculum.test.ts`.
- Subagent concurrency cap is 20.
- Git working tree uses CRLF (autocrlf=true); repo stores LF. Harmless warnings.

## How card content ships (critical — read before editing any card text)

Cards installed on the phone are only updated through the **correction migration**; editing text
alone does nothing for an existing install.

- Base cards live in `src/data/expanded-cards.json` (generated) and inline in
  `src/data/curriculum.ts` (`b0000000-` ids). Authored scenarios: `src/data/reviewed-scenarios.json`
  → compiled to `section-packs/reviewed-01.json` (`a2000000-` ids, derived from lesson key).
- Guided lessons (`e0000000-` ids, 2 cards per lesson) render from `teaching-lessons.json`,
  `practical-lessons.json`, `dotnet-lessons.json` (renderer ported in `artifacts/content-v16/render.mjs`).
- Overrides for expanded cards: `src/data/reviewed-corrections.json` ({id, front, back}; the CC BY
  credit is re-appended by the build for `c0000000-` cards).
- `node scripts/build-reviewed-content.mjs` applies overrides, records revisions in
  `content-corrections.json` ({id, previous[], front, back}), rebuilds manifests. Bump
  `CURRICULUM_VERSION` there when installed apps must re-run the migration.
- New cards (new ids) are installed automatically by `installStarterDecks` when the version key
  changes; existing ids are never overwritten except via corrections.
- Checks: `npm run content:check`, `npx tsc --noEmit`, `npm run build`, content vitest (above).

## Completed: curriculum v16 content-quality pass (2026-09-23) — UNCOMMITTED

- ~2,200 cards/lessons rewritten by Opus author agents + Opus reviewer agents; details and
  per-unit reports in `artifacts/content-v16/output/*.report.md` / `*.review.md` (gitignored).
- Tooling: `artifacts/content-v16/BRIEF.md` (rubric), `validate.mjs <unit>`, `apply.mjs`.
  **WARNING: `apply.mjs` rebuilds the data files from git HEAD.** Once other changes are made to
  `src/data/*` (new content), do NOT re-run it unless HEAD already contains v16, or it will wipe them.
- `CURRICULUM_VERSION` = 16. `vite.config.ts` excludes `content-corrections-*.js` from precache.
- All checks passed: content:check, tsc, build, 7 content/migration test files (21 tests).
- Not done: commit; `docs/CURRICULUM.md` still describes v15.

## Current phase: "improve the app more + add more content" (started 2026-09-24)

Plan: see **Plan** section (written by Fable) once present. Work packages and their status are
tracked in the Status log.

## Plan

Written by an Opus Plan agent on 2026-09-24 (Fable was rate-limited). Verified against code.

### Gap analysis (summary)
- v16: 2,871 cards / 75 decks. Near-zero coverage of: Node/Express server code, OAuth/SameSite/JWT,
  SQL writes (INSERT/UPDATE/ON CONFLICT/CTE), HTTP caching/CORS preflight/PUT vs PATCH, React forms
  (`onSubmit`/FormData/useActionState), React Router, Testing Library, DevTools.
- IMPROVEMENTS.md: #1–#6, #8 already fixed. Open: #7 (StudyScreen keydown effect re-binds every
  render, `StudyScreen.tsx:240-275`), #9 partial (CI, no lint), #10 (no coverage gate).
- New issues: **N1** background refresh (30 s timer / visibility, `StudyScreen.tsx:89-118`) can swap
  the card being read and hide its revealed answer; **N2** session timer counts hidden time;
  **N3** only the .NET track can be studied as a focused session (`StudyScreen.tsx:44`), though
  `loadStudy(deckId, now, track)` supports any track; **N4** `loadStudy` reads all cards + logs on
  every rating (measure before changing).

### Content shipping facts (verified)
- Never run `scripts/build-curriculum.py` (re-downloads and regenerates) or
  `artifacts/content-v16/apply.mjs` (resets from HEAD).
- `build-reviewed-content.mjs` rewrites any non-override back containing `\n{3,}` or `<code-tabs>`
  lines and records a correction — new text must never contain those.
- `section-expansion-baseline.json` is hand-maintained; check requires each deck's `before` = pack length.
- Install on existing devices is keyed on `starter_curriculum_v${manifest.version}` → **bump
  CURRICULUM_VERSION to 17** or v16 devices never get new cards. New decks get `new_per_day` 3.
- Hard-coded test counts: practical 100 lessons/10 decks of 20; dotnet 96/12; 19 `crud-` keys;
  seed.test v2–v4 counts via track exclusions. → New lessons go in a **new file + new track**
  "Build real apps", deck ids `a0000000-0000-4000-8000-00000000700N` (N=1..8).

### Content target (~232 cards)
8 new decks × (10 lessons → 20 cards + 6 scenarios) = 208, plus 24 scenarios in existing decks.
After v17: 83 decks, 3,103 cards, 356 lessons.

Staging (one file per WP, `artifacts/content-v17/staging/<wp>.json`):
```json
{ "deck": {"id":"a0000000-0000-4000-8000-000000007001","name":"21 · …","track":"Build real apps",
           "icon":"network","color":"green","topics":["…"],"description":"…","resource":{"label":"…","url":"https://…"}},
  "lessons":   [{"key":"app-http-…","deck":7001,"title":"…","aliases":[],"question":"…","plain":"…",
                 "example":"…","analogy":"…","mistake":"…","check":"…","answer":"…"}],
  "scenarios": [{"deck":7001,"key":"scn-http-…","question":"…","answer":"…","explanation":"…","check":"…"}],
  "verification": [{"key":"…","how":"command run + observed output, or doc URL"}] }
```
icons: braces|tree|react|network|database|globe|bug|git; colors: violet|amber|green|blue.
Keys: lessons `app-<area>-<slug>`, scenarios `scn-<area>-<slug>`; permanent once integrated; never contain `crud-`.

### Work packages
Global: stay in listed files; content WPs never run vitest/build/Playwright and never edit `src/`;
scratch in `artifacts/content-v17/scratch/<wp>/` (npm install --prefix there is OK, never at repo
root). A1/A2 take a lock (`mkdir artifacts/content-v17/lock`, remove after) before vitest/tsc.

- **T0 tooling**: `artifacts/content-v17/BRIEF.md` (baselines Node 22, Express 5, React 19, TS 5.x,
  PG17 syntax checked via python sqlite3 where shared, Vitest 4; run every stated output; phone
  limits plain ≤600, example ≤900 with ≤15-line fenced block, answer ≤500, scenario fields ≤700;
  check is standalone; list existing lesson titles/fronts), `validate.mjs <wp>|--all` (schema,
  counts 10 lessons + 6 scenarios per C*, 24 for S1, key prefix/dup checks against all lesson files,
  scenarios and other staging, global front uniqueness incl. checks, length minimums/maximums,
  fences with language, puzzle regex/markers/images/`<code-tabs`/`\n{3,}`/untrimmed, no "code
  above"), `preview.mjs <wp>`, backup of `src/data/` to `artifacts/content-v17/backup-v16-data/`.
- **C1** 7001 "21 · HTTP and REST in practice" (network/green; MDN HTTP) — methods/idempotency,
  401/403, 409/422, 201+Location, Content-Type/415, Cache-Control, ETag/304, CORS preflight,
  303/307/308 + PRG, URLSearchParams, curl -i/-v. Verify with node:http + fetch. Avoid next-http-*, deck 3003.
- **C2** 7002 "22 · Build a Node and Express API" (braces/amber; expressjs.com) — Express 5: params
  are strings, express.json(), middleware order/next(), async errors forwarded, 4-arg error handler,
  404 fallthrough, Router, `node --env-file`, status().json()/sendStatus(204), ERR_HTTP_HEADERS_SENT,
  validation. Run against express@5 in scratch.
- **C3** 7003 "23 · Logins, sessions, and cookies" (globe/violet; OWASP Session Mgmt) — session id
  flow, cookie attributes, regenerate on login, logout destroys, JWT signed not encrypted/exp/revocation,
  SPA token storage vs XSS, OAuth code+PKCE/OIDC concepts, rate limiting/generic errors, 401→login
  return URL. Avoid next-sec-csrf, next-sec-password-hash, auth lesson, deck 3004.
- **C4** 7004 "24 · SQL for everyday CRUD" (database/blue; postgresql.org) — INSERT…RETURNING,
  affected rows, ON CONFLICT DO UPDATE/excluded, join tables, ON DELETE actions, EXISTS/IN/JOIN,
  CTEs, CASE, LIKE/ILIKE escaping + params, half-open date ranges, DISTINCT vs GROUP BY, adding NOT
  NULL column. Run in python sqlite3; label PG-only. Avoid next-sql-*, Start here SQL, deck 3001.
- **C5** 7005 "25 · React forms and server data" (react/blue; react.dev) — onSubmit/FormData,
  useActionState/useFormStatus, double submit, fetch in effect + AbortController, loading/error/data
  union, update list from created item, optimistic + rollback, React Router hooks, StrictMode double
  effects, key reset. Verify with react-dom/client + happy-dom from repo node_modules.
- **C6** 7006 "26 · Test a web app with Vitest" (bug/amber; vitest.dev) — matchers, rejects,
  vi.fn/spyOn/mocks, stubGlobal fetch, fake timers, getBy/findBy/queryBy, userEvent vs fireEvent,
  API tests with listen(0), DB isolation, builders, it.each. Save runnable tests in scratch/c6/.
- **C7** 7007 "27 · Debug with browser DevTools" (bug/violet; Chrome DevTools docs) — Network panel,
  preserve log, disable cache/throttle, copy as cURL/fetch, stack traces/source maps, breakpoint
  kinds, Application panel (HttpOnly cookies), service worker, Computed styles, device mode limits,
  chrome://inspect. Avoid fragile menu paths; avoid next-debug-*.
- **C8** 7008 "28 · Review, merge, and deploy" (git/green; GitHub PR docs) — PR description,
  self-review, answering comments, merge vs rebase, --force-with-lease, revert vs reset, squash,
  npm ci/lockfile, VITE_ vars are public, SPA rewrites, migrations before code, smoke check. Avoid
  next-ship-*, deck 3009.
- **S1** 24 scenarios for existing decks (`deck: null`, no lessons): 6 `scn-ts-` → 3005, 6 `scn-git-`
  → 2000, 6 `scn-py-` → 1700, 3 `scn-css-` → 1800, 3 `scn-html-` → 1900.
- **A1** StudyScreen fixes (files: `src/features/study/StudyScreen.tsx`, `StudyScreen.test.tsx`):
  N1 keep displayed card at front after background refresh; N2 count only visible time; #7 bind
  keydown once via ref; N3 accept any curriculum track (`<track> study` title). Tests with fake timers.
  Acceptance: `npx vitest run src/features/study`, `npx tsc --noEmit`.
- **A2** Surface new track (files: `src/data/curriculum.ts` Track union only, `HomeScreen.tsx`,
  `DeckListScreen.tsx`, `HomeScreen.test.tsx`): add "Build real apps" to Track + filters, Home
  pathway card with count + "New" badge, "Study this path · 5 min" link for active track filter.
- **R-<wp>** reviewers per C*/S1: re-run verification, fix staging in place, write
  `artifacts/content-v17/review/<wp>.md`; validator PASS.
- **I1** integration (after all staging PASS and A2 done): confirm working tree at v16; create
  `src/data/applied-decks.json`, `src/data/applied-lessons.json`, committed script
  `scripts/build-applied-lessons.mjs` (idempotent: port renderLesson, write
  `src/data/applied-expansion.json`, upsert decks in expanded-catalog.json, packs in
  expanded-cards.json, baseline entries, content-report fields appliedLessons/appliedCards/
  teachingLessons; changed existing ids → reviewed-corrections.json); append scenarios to
  reviewed-scenarios.json (new groups 7001–7008 at end); CURRICULUM_VERSION=17;
  check-reviewed-content.mjs includes applied-lessons; build-curriculum.py lists
  applied-expansion.json (don't run). Run build-applied-lessons → export-retrieval-baseline →
  build-reviewed-content → content:check (expect v17, 3,103 cards, 83 decks; content-corrections
  length unchanged). Tests: seed.test excluded lists + v16 case; practical test subtract
  appliedLessons; dotnet key set incl. applied; new applied-curriculum.test.ts.
- **V1** verification + docs: content:check, tsc, content vitest, `vitest run src/features`, build;
  run C6 scratch tests; spot-read 12 cards; update docs/CURRICULUM.md, README counts,
  IMPROVEMENTS.md status, handoff/00-START-HERE.md superseded note, update.md.
- **A3** (optional) measure loadStudy under throttling; change only if median rating > 150 ms.

### Waves
T0 → Wave 1 (C1–C8, S1, A1, A2) → reviewers as authors finish → I1 → V1. Nobody commits unless
the user asks (suggest a v16 checkpoint commit before I1, then v17).

### Risks
Running apply.mjs/build-curriculum.py wipes work; missing version bump; `\n{3,}`/trailing space
creating spurious corrections; global front uniqueness incl. checks; don't touch existing lesson
files/tracks; never change keys after I1; verify version-sensitive facts (Express 5, React 19
actions, SameSite Lax default, --env-file, VITE_ exposure); low RAM — no parallel vitest/build.

## Status log

- 2026-09-24: update.md created. v16 pass complete but uncommitted. Fable planner launched.
- 2026-09-24: Fable planner failed — Fable usage limit reached (HTTP 429). Re-ran the same
  planning brief on an Opus Plan agent. If Fable becomes available later, use it to review the plan.
- 2026-09-24: Plan written (below). Launched T0 (tooling), A1 (StudyScreen fixes), A2 (track UI).
  Next: when T0 reports, launch C1–C8 + S1 authors (prompt template: "Read update.md and
  artifacts/content-v17/BRIEF.md; you are WP <id>; write artifacts/content-v17/staging/<id>.json +
  <id>.report.md; verify by running; pass validate.mjs <id>; don't touch src/"), then a reviewer per
  WP, then I1, then V1.
- 2026-09-24: T0 done (BRIEF.md, validate.mjs, preview.mjs, backup-v16-data/ in artifacts/content-v17/).
  Launched authors C1–C8 and S1 (Opus). A1, A2 still running. Status of each WP: check whether
  `artifacts/content-v17/staging/<wp>.json` exists and passes `validate.mjs <wp>`; reviewer output
  goes to `artifacts/content-v17/review/<wp>.md`. A1/A2 done = their report + tests passing.
- 2026-09-24: **A2 DONE.** "Build real apps" in Track union + DeckList filters; Home pathway card
  (hidden while 0 decks, "New" badge); "Study this path · 5 min" link for any track filter.
  HomeScreen tests 5/5 (one slow existing assertion given a 10 s timeout), tsc clean.
  No DeckListScreen test file exists.
- 2026-09-24: **A1 DONE.** StudyScreen: background refresh keeps displayed card + revealed answer
  (`withCardFirst`); timer counts visible time only; keydown bound once via ref; `?track=` accepts
  any curriculum track (.NET keeps title "C# & .NET web study" because e2e checks it). Study tests
  11/11, tsc clean.
- 2026-09-24: Authors done + validator PASS: c1, c2, c3, c4, c5 (reviewers R-c1..R-c5 launched).
  Still authoring: c6, c7, c8, s1.
- 2026-09-24: c6 authored (R-c6 launched; it runs scratch/c6 vitest once under the lock).
  **R-c4 DONE** (2 wording fixes; flagged scn-sql-add-required-column as partial overlap with
  deck 5/3001 — kept, since validator needs 6 scenarios and it adds the DEFAULT-vs-backfill choice).
- 2026-09-24: s1 authored (R-s1 launched). **R-c3 DONE** (7 fixes: SameSite default per browser,
  OAuth 2.1 is still a draft, etc.). NOTE: authors' `scratch/<wp>/build.*` generators are now stale
  for reviewed WPs — never re-run them; the staging JSON is the source of truth.
- 2026-09-24: **R-c2 DONE** (fixed: Express 4 rejected async handler crashes Node 22 process, not
  hangs; unrunnable example line). **c7 authored**, R-c7 launched.
  **INCIDENT:** the C7 agent killed an unrelated user process on port 3000 (a Next.js dev server
  titled "Aral — Learn Tagalog") to free the port. User told to restart it. RULE for all future
  agents: never kill/stop processes you did not start; pick another free port instead.
- 2026-09-24: **R-c5 DONE** (3 small fixes). Reviewed & final: c2, c3, c4, c5. In review: c1, c6,
  c7, s1. Authoring: c8.
- 2026-09-24: c8 authored → all 9 staging files exist and pass. R-c8 launched. Waiting on reviewers
  c1, c6, c7, c8, s1, then launch I1 (integration). v16 data is backed up in
  artifacts/content-v17/backup-v16-data/ (pre-A2 copy of src/data).
- 2026-09-24: **R-c1 DONE** (5 fixes; rewrote scn-http-prg-refresh to avoid duplicating a deck-1500
  card; corrected curl claim). Final: c1–c5. In review: c6, c7, c8, s1.
- 2026-09-24: **R-c6 DONE** — ran scratch/c6 vitest once: 17 files / 47 tests pass (204 s); all
  source-only claims confirmed; fixed restoreAllMocks semantics (Vitest 3+). Final: c1–c6.
- 2026-09-24: **R-c7 DONE** — all 3 weak claims confirmed (DevTools source + headless Chrome 153
  test); 4 wording fixes. Final: c1–c7. In review: c8, s1.
- 2026-09-24: **R-s1 DONE** (3 small fixes; no factual errors). Final: c1–c7, s1. In review: c8.
- 2026-09-24: **R-c8 DONE** (4 fixes incl. a broken expand/contract migration order and a
  cherry-pick flow that would duplicate commits). `validate.mjs --all` PASS for all 9.
  **I1 launched** (integration → v17). If I1 is interrupted: check which of its outputs exist
  (`src/data/applied-*.json`, `scripts/build-applied-lessons.mjs`, manifest version) and resume
  from the I1 bullet; the builder is designed to be idempotent. After I1: launch V1.
- 2026-09-24: **I1 DONE** (integration → curriculum v17, uncommitted). Start state confirmed v16,
  content-corrections length 2236. New: `src/data/applied-decks.json` (8 decks 7001–7008, track
  "Build real apps"), `src/data/applied-lessons.json` (80 lessons, keeps `deck`),
  `scripts/build-applied-lessons.mjs` (renderLesson port; writes `applied-expansion.json`, upserts
  expanded-catalog/expanded-cards/section-expansion-baseline [contentHash = sha256 of
  JSON.stringify(cards.map(c => [id, front, back]))], sets report appliedLessons/appliedCards/
  teachingLessons; changed shipped text → reviewed-corrections; fails on dup keys across the 4
  lesson files, `\n{3,}`, code-tabs, untrimmed), `src/data/applied-curriculum.test.ts`.
  Changed: reviewed-scenarios.json (+72: new groups 3005/2000/1700/1800/1900 for s1, then
  7001–7008), CURRICULUM_VERSION 17, check-reviewed-content.mjs (applied-lessons in loop, computed
  lesson count + asserts it equals report.teachingLessons), build-curriculum.py (applied-expansion
  in authored list + report fields; not run), seed.test (Build real apps excluded for v2–v4, new v16
  case count 2799), practical/dotnet tests account for applied lessons. Result: manifest v17,
  3,103 cards (2,871 + 160 lesson cards + 72 scenarios), 83 decks, 356 guided lessons, 144
  scenarios; content:check PASS; builder re-run = no diff. Deliberate fix: deck-1600 `npm ci` card
  (c0000000-48dd…) — `npm install` sentence corrected in its existing reviewed-corrections entry;
  content-corrections length stays 2236 (existing revision updated, previous[] now 2).
  Tests: tsc clean; content vitest 8 files / 22 tests pass; seed.test 7/8 pass, "rolls back every
  batch" timed out at 120 s in the full file (throughput) and passes alone with a longer timeout.
  Next: V1 (docs/CURRICULUM.md, README counts, build, features tests).
- 2026-09-24: **V1 DONE** (verification + docs; nothing committed, no code or content changes needed).
  Checks, run one at a time under the lock: `npm run content:check` PASS (v17, 3,103 active cards,
  144 scenarios, 356 guided lessons); `npx tsc --noEmit` clean; content vitest 8 files / 22 tests
  pass (71 s); `npx vitest run src/features` 6 files / 26 tests pass (53 s); `npm run build` OK
  (20 s) — precache 51 entries / 1,192.18 KiB; `expanded-cards` chunk 3,922.28 kB (gzip 799.16 kB),
  `content-corrections` chunk 5,777.10 kB (gzip 979.57 kB, excluded from precache); only the usual
  chunk-size warning. `npm run test:e2e` (port 4173 was free) could NOT run: all 28 tests fail at
  launch because Playwright's browser is not installed (`ms-playwright/chromium_headless_shell-1243`
  missing). Not an app failure. To run it: `npx playwright install chromium`, or set
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE="C:\Program Files\Google\Chrome\Application\chrome.exe"`.
  C6 scratch tests not re-run (R-c6 already ran them: 47/47).
  Spot-read 12 integrated cards (one lesson from each of 7001–7008 + scn-sql-tag-filter-duplicates,
  scn-py-sqlite-missing-commit, scn-ts-omit-create-dto, scn-git-detached-head-commit): no errors found.
  Docs: `docs/CURRICULUM.md` intro rewritten for v17 (counts, v16 quality pass, Build real apps table
  of 8 decks; original-card and guided-lesson totals updated); `README.md` counts → 3,103 / 83 decks,
  144 scenarios, 712 guided cards, 1,112 original cards, new Build real apps bullet and a short
  "Versions 16 and 17" section; `IMPROVEMENTS.md` new "Status (2026-09-24)" section (#1–#6/#8 fixed,
  #7 fixed by A1, #9 partial, #10 open, N1–N3 fixed, N4 open); `handoff/00-START-HERE.md` superseded note.
  **Next steps for whoever continues:**
  1. User: review and commit v16 + v17 (suggest two commits if practical: v16 quality pass, then v17
     content + A1/A2 app changes + docs). Nothing is committed yet.
  2. User: restart the unrelated "Aral — Learn Tagalog" Next.js dev server (port 3000) that the C7
     agent stopped.
  3. Install a Playwright browser (see above) and run `npm run test:e2e` once before deploying.
  4. Deploy and confirm on the phone that the v17 migration adds the 8 new decks (Home shows the
     Build real apps card with "New") and that existing progress is intact.
  5. Optional future work: A3 (measure `loadStudy` per rating, N4); add a linter (#9) and a coverage
     gate (#10); the full seed.test "rolls back every batch" case needs a longer timeout on this host.
