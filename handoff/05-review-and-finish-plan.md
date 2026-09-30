# 05 — Review and finish plan

Written 2026-09-10. Read-only review of three uncommitted diffs plus the install-performance
problem, produced against `03-open-risks.md`, `content-sample-review.md`, and `docs-audit.md`.
No file was edited except this one.

---

## (a) Diff review

### `scripts/build-comprehensive-content.mjs` — implements actions 1–9 from
`content-sample-review.md` section 7. Verified against `git show HEAD:...` (the committed v13
generator) and against the actual glossary paths present in the regenerated packs
(`src/data/section-packs/reviewed-comprehensive-001.json` etc., e.g.
`mdn/content/files/en-us/glossary/domain_sharding`, `.../glossary/cache`).

**Bug — the glossary word-anchoring does not do what the comment claims.**
Lines 94–95:

```js
if (/http|rest|cors|cookie|tcp|dns|latency|proxy|cdn|(?:^|_)cache(?:$|_)/.test(path)) return deckIds(6,3003,5006,4010);
if (/secur|xss|csrf|encrypt|tls|https|(?:^|_)hash(?:$|_)|(?:^|_)auth/.test(path)) return deckIds(6,3004,5008);
```
and line 97's `(?:^|_)dom(?:$|_)`. The comment says this anchors "cache"/"hash"/"dom" on word
boundaries so `domain_sharding` and `registrable_domain` don't collide. It does stop those
collisions — but it also stops the *legitimate* matches, because glossary paths are delimited by
`/`, not only `_`/start-of-string/end-of-string:

```
files/en-us/glossary/dom/index.md            <- preceded by "/", not "^" or "_"
files/en-us/glossary/cache/index.md          <- same
files/en-us/glossary/browser_cache/index.md  <- followed by "/", not "$" or "_"
files/en-us/glossary/cache_control/index.md  <- same
```

Verified directly:
```
node -e '/(?:^|_)dom(?:$|_)/.test("files/en-us/glossary/dom/index.md")'            -> false
node -e '/(?:^|_)cache(?:$|_)/.test("files/en-us/glossary/browser_cache/index.md")' -> false
```
So `glossary/dom`, `glossary/cache`, `glossary/browser_cache`, `glossary/cache_control`,
`glossary/hash`, and every plain or compound glossary term now falls through to the generic
`return deckIds(8)` (Engineering craft) tail, same as `arpanet`/`sisd`. The collision the fix
targeted (`domain_sharding`, `registrable_domain` landing in DOM/HTML decks) is genuinely fixed,
but so is every correct match — the branch's first five conditions are close to dead code for
glossary paths. This is not a crash or a check failure (everything still routes somewhere valid,
just less precisely than intended, and the `return deckIds(8)` catch-all is itself one of this
diff's fixes), so it will not be caught by `check-comprehensive-content.mjs` or the build. It will
only show up if someone re-samples glossary routing the way `content-sample-review.md` did.
**Fix:** anchor on `/` as well, e.g. `(?:^|[/_])cache(?:$|[/_])`, or better, extract the actual
glossary slug once (`path.match(/\/glossary\/([^/]+)\//)?.[1]`) and split it on `_` for an exact
token match instead of a substring regex.

**Not a bug — the `docs/framework/` re-exclusion is correct and matches v13.**
`git show HEAD:scripts/build-comprehensive-content.mjs` shows v13 excluded `framework/` in *both*
the `decksFor` skip regex (its line 61) *and* the post-parse exclusion regex (its line 295). Your
edit restores `docs\/framework\/` to both places. Re-excluding it does not drop anything v13
shipped — it restores exactly v13's own scope. (Whatever the intermediate, pre-this-session
widening did to those two regexes isn't visible in a HEAD-diff, since `git diff` collapses all
uncommitted changes into one hunk regardless of how many sessions touched the line — but the
content-sample-review's claim that v13 excluded this area is independently confirmed from the
commit, and your fix reproduces it.)

**Not a miscount — the exclusion tally is not double-counted.**
`decksFor` returning `[]` is consumed at line 215 (`if (!eligibleDecks.length) continue;`), *before*
an article is ever constructed — it never touches `exclusions`. Only the later, already-built
`articles` array is filtered against the second (post-parse) regex, at line ~354, which *does*
increment `exclusions['outside engineering curriculum']`. Since `docs/framework/`,
`docs/machine-learning/`, `docs/iot/`, and the code-analysis paths are now all excluded at the
`decksFor` stage (they never reach `articles`), the corresponding terms in the post-parse regex
are simply unreachable/redundant for those paths, not double-counted — this mirrors v13's own
redundancy (framework was listed in both places there too). No `exclusions` total is inflated or
deflated by this. It is worth noting for its own sake that file-level rejects via `decksFor` have
*never* been tallied in `exclusions` (pre-existing behavior, not something this diff changed), so
the printed exclusion breakdown has always undercounted relative to files skipped outright — a
pre-existing cosmetic gap, not a regression.

**Sound but worth flagging — the `decksFor` fail-closed default and the new `articles.length = 0`
memory truncation.** The new `return []` default for unrouted `dotnet/docs` paths (line 90) only
matters for paths under the newly widened areas; v13's source-read scope never emitted paths
outside `csharp|core|standard|framework`, so this can't drop anything v13 shipped. The new
`glossary`/`learn_web_development`/`webassembly` branches (lines 92–116) are not gated on
`repo === 'mdn/content'`, but every other repo branch above them always returns before falling
through, so in practice only MDN paths reach them — fragile if a repo is ever added without an
explicit early return, but not a current bug. `articles.length = 0; lessonOrder.length = 0;` at
line 443 runs after every remaining read of `articles`/`lessonOrder` (confirmed by grep — nothing
below line 443 references either), so it's a safe memory-release, not a use-after-clear bug.

**Not tested here but worth a note:** the `guidesNeeded`/`target` multiple-driven logic (floor
`baseline.lessons*2`, cap `round(baseline.lessons*multiple)`, final `target =
min(candidates.length, round(baseline.cards*multiple))`) is internally consistent — the loop that
builds guided lessons is capped by `guidesNeeded`, the floor assertion only requires
`guided.length >= guidesFloor`, and nothing after downsizes `candidates`/`articles` before those
assertions run. No bug found there.

### `scripts/check-comprehensive-content.mjs` — trivial, correct. The literal string now matches
its own assertion (`baseline.cards*3` to `*8`), and the `[recall]` → `[recall](?!\()` change
correctly stops flagging a markdown link literally labelled "recall" while still catching a bare
unfilled `[recall]` placeholder token. No issue.

### `scripts/check-quality-runtime.ts` — the new v13→v14 fixture (lines 106–130) is sound, with one
piece of dead code.

The migration mechanism in `src/db/seed.ts::installStarterDecks` is content-agnostic: it computes
`existingCards` as a `Set` of primary keys currently in `db.cards`, then only inserts cards whose id
isn't already present, gated by whether `sync_meta` has the current `curriculumVersionKey`. It does
not branch on *which* ids are missing. That means an arbitrary 50/50 split of the real v14
`a4000000-` id space (your `priorSubset`/deleted-odd-half stand-in) exercises exactly the same code
path a real v13 subset would, because the mechanism only ever asks "is this id present, yes or no."
The concern in the handoff — that the exact v13 id subset couldn't be reconstructed — turns out not
to matter for what this test actually verifies (additive insert, no touch of existing rows, no
re-queuing of existing rows, review-log and outbox correctness). Verified by hand-tracing:
- `keptCard` (an even-index survivor) keeps its edited `front`, its post-review `due`, and its
  review log entry across the reinstall — because it's never deleted, so `existingCards` already
  contains it and `installStarterDecks` skips it.
- The odd-index half (deleted right before the fixture) is exactly what reappears; nothing else
  does — verified by the `v14Queue.filter(row => priorSubset.includes(row.row_id)).length === 0`
  assertion, checked against an `outbox` that was `clear()`-ed immediately beforehand.
- Reusing `v13Logs` (captured *after* `keptCard`'s review is applied) rather than the older
  `savedLogs` in the subsequent v12-block assertion (line 141) is correct, not a mistake: by that
  point `review_logs` contains both the original v10 fixture's log and `keptCard`'s new log, and
  nothing between line 115 and line 141 touches `review_logs` (`installStarterDecks`'s transaction
  only touches `decks`/`cards`/`outbox`/`sync_meta`), so `v13Logs` is still the exact expected value.
  Reusing `savedLogs` there instead would now fail, since it predates `keptCard`'s log.

**Dead code, not a bug:** `await db.cards.update(keptCard.id, { front: keptCard.front });` at line
130 has no effect on anything downstream. The very next statements (line 132) delete every
`a4000000-` card including `keptCard`, and every block after line 142 starts with
`resetDatabaseForTests()`, which wipes the whole database. No assertion anywhere after line 130
reads `keptCard`'s front. It's harmless — just an unnecessary write that doesn't "restore state for
later blocks" because there is no later block that depends on that state. Safe to delete for
clarity; not worth blocking the commit over.

One assumption this fixture (like the pre-existing v10/v12 fixtures) leans on and does not itself
verify: that a real user's actual installed `a4000000-` ids are a *subset* of the final v14 id
space (i.e., no v13 card's `sourceKey` identity hash ever changes meaning under the widened
generator). That's a property of `identity()` being a pure hash of `sourceKey`, and of the retained
old-section dedup logic (`oldSections`/`seenBodies`) not being touched by this diff's routing
changes — plausible, but genuinely untested by anything running today. Not a blocker, just the one
place where "additive" is still closer to a design invariant than a measured fact.

---

## (b) Predicted card count and expansion multiple

Actions 1, 2, 3, 5, and 7 (all present in the diff) remove, by `content-sample-review.md`'s own
counts: `docs/framework/` −8,163, `docs/fundamentals/code-analysis/*-rules/` ≈ −1,105,
`webassembly/reference/` −438, `machine-learning/` + `iot/` −326, `learn_web_development`'s
`soft_skills` + `django` −154. That's ≈ −10,186, close to the review's own "roughly 10,500 (~29%)"
estimate (which additionally folds in a bit of `blazor-for-web-forms-developers` from action 9, not
separately sized in the samples). Actions 4, 6, 8, and 9 are routing/heading fixes with no material
effect on the total candidate count (action 6's fix is also the one with the glossary bug above,
which changes *where* ~600 glossary cards land, not *how many* survive).

Starting from the pre-review-fix total of 36,853 added cards, ≈ −10,200 gives a predicted
**≈ 26,650 added cards**, **≈ 33,700 total cards** (baseline 7,034 + 26,650) — call it
**33,000–34,500** to allow for the fact that these are estimates from a sampled review, not an
exact recount, and that the glossary bug redistributes rather than removes cards. That is **≈ 4.7–4.9x**
the v12 baseline, comfortably inside the check's `3x`–`8x` bound, and it is *not* clamped by
`RECALL_EXPANSION_MULTIPLE` at its current default of 8 (`round(7034*8) = 56,272`, well above the
predicted pool) — the actual constraint is how many candidates survive the content filters, not the
multiple. This also isn't clamped at multiple=4 (`round(7034*4)=28,136` is just above the estimate),
so most of the content-quality trims already did the "lower the multiple" job risk #1 asked for,
without touching curriculum breadth as bluntly as a flat multiplier would.

**Recommended `RECALL_EXPANSION_MULTIPLE=4`.** Reasoning: at the predicted post-trim pool size
(~26,650–28,000 added candidates), a cap of `4x` (28,136) sits right at the edge of the natural
pool and acts as a documented, intentional ceiling rather than a silent side effect of whatever the
content filters happen to produce — if a future source-scope widening grows the pool again, `4x`
keeps the install-size decision explicit instead of drifting back up toward `8x`/43,887. It is not
expected to cut anything on *this* regeneration (the pool should already be under it), so it costs
nothing today and protects the next change. If the clean re-measurement in the finish plan below
still shows an unacceptable install time at ~33,000 cards, the next lever to pull is dropping the
multiple further (to 3, ≈21,100 total — deliberately close to v13's already-measured-acceptable
98s number) rather than re-opening the content-quality question, since the quality trims are
already applied and further-cutting would then be a size decision, not a quality one.

Whether ~33,000–34,500 cards is an *acceptable* install time cannot be answered by arithmetic alone
— see (c) and (d). Directionally: v13 (21,102 cards) reached the home screen in 98s cleanly; v14
(43,887, 2.08x) had written only 42,000 of 43,887 cards after 1,108s and was still saving at
1,505s. If write cost scaled purely linearly with card count, ~33,700 cards (0.77x of v14's count)
would land around 850–1,150s — still unacceptable. But the measured v14 profile was *not* linear
(rate degraded from card 0 to card 42,000, consistent with per-insert cost growing with store size,
e.g. B-tree index maintenance), which means a meaningfully smaller store could do noticeably better
than a linear scaling would predict — and the measurement itself was taken under acknowledged CPU
contention from unrelated processes. **Content trimming alone is very unlikely to be sufficient;**
it needs to be paired with the install-path work in (c), and the real number needs a clean
re-measurement (d) rather than an extrapolation from a contended one.

---

## (c) Install-performance assessment

Read `src/db/seed.ts`, `src/db/retiredCurriculum.ts`, `src/data/section-expansion.ts`.

### Cost drivers, concretely

1. **Two full row-writes per card, not one.** `installStarterDecks` (`src/db/seed.ts:62-92`) builds
   `cardsToAdd` and, for every added card, a matching `outbox` entry (`additions.push(...)`,
   lines 86–92). At ~26,000–44,000 added cards that's 52,000–88,000 total row writes for what a
   user experiences as "one card." The outbox row is a sync-queue record (`outbox: "++id,
   [table_name+row_id]"`, `src/db/schema.ts`), needed only if/when a server sync happens — it is
   not needed for the card to be usable in-app immediately.

2. **Seven index structures touched per card insert, not one.** `cards: "id, deck_id, due, state,
   note_id, deleted_at, [deck_id+state]"` (`src/db/schema.ts`) is one primary key plus *six*
   maintained indexes (5 single-column + 1 compound). Every `bulkAdd` of a card batch is really six
   B-tree updates per row under the hood, on top of the row write itself. `outbox` adds two more
   structures (`++id` auto-increment + `[table_name+row_id]` compound) per queued row. This is the
   most plausible explanation for the *degrading* rate observed (23ms/card average, but not flat) —
   B-tree maintenance cost on a growing index is not constant-time, and this schema maintains six of
   them simultaneously for the largest table in the database.

3. **One transaction spans the entire install.** `db.transaction("rw", db.decks, db.cards,
   db.outbox, db.sync_meta, async () => { ... })` (`src/db/seed.ts:19-121`) wraps every batch —
   correct for atomicity, but it means the browser holds one very long-lived read-write transaction
   across tens of thousands of writes. `bulkAdd` uses `add()` semantics (uniqueness-checked)
   even though the code has already computed `existingCards` in JS and filtered to genuinely-new
   rows (`cardsToAdd` never contains an id already in `existingCards`) — the extra uniqueness check
   inside `add()` is redundant work given that pre-filter.

4. **~93 MB of pack JSON is parsed into memory before the transaction starts.**
   `src/data/section-expansion.ts::loadSectionExpansion()` does `Promise.all` over every chunk,
   `JSON.parse`s each, and `.flat()`s them into one array held by a module-level `loading` promise
   that is never released. `loadStarterCards()` (called at `src/db/seed.ts:18`, *before* the
   transaction opens, specifically to avoid a network wait closing an IDB transaction) then
   flattens further. This front-loads latency and peak memory (previously measured at 368 MB, well
   under the 3,586 MB limit, so not itself the observed failure) but is real dead time before the
   card-writing phase even begins, and it holds the entire parsed graph resident for the rest of
   the session.

### Ranked optimizations

1. **Switch `bulkAdd` to `bulkPut` for the pre-filtered `cardsToAdd`/`decksToAdd`/queued outbox
   rows** (`src/db/seed.ts:94, 98, 115`; `src/db/retiredCurriculum.ts:24, 57, 70`). Since the code
   already guarantees these rows are new (or, for outbox, deliberately upserted via `pending` map
   merge), the engine-level uniqueness check `add()` performs is pure overhead. **Preserves
   atomicity and idempotence exactly** — it's the same rows, same transaction, same content;
   `bulkPut` is if anything *more* forgiving on a partial-idempotence edge case, not less. Lowest
   risk, do first, cheap to test.

2. **Tune the batch size.** 500 was chosen to "bound the browser's request backlog"
   (`src/db/seed.ts:95` comment) but was never necessarily profiled at v14 scale. Try 1,000–2,000
   and measure; if throughput improves, adopt. **Preserves every guarantee** — same one transaction,
   same content, only the JS-side chunking of calls into it changes. Safe, cheap to test, do
   second.

3. **Stop writing an `outbox` row per card at initial-install time; write one compact "bulk range"
   marker instead, and only emit itemized rows for edits/deletions that happen after install.**
   This halves total row writes at exactly the scale where it hurts most (a 43,887-card fresh
   install). **This is a behavior change, not a safe optimization** — it changes what the sync
   protocol receives for a fresh install (a marker instead of 43,887 individually-identified rows),
   which `check-quality-runtime.ts`'s outbox assertions (e.g. line 80: `assert.equal(await
   db.outbox.count(), starterCardCount + curriculum.length)`, and the new v13→v14 fixture's
   `v14Queue.filter(...)` check) currently assume is itemized. It also has a real semantic
   consequence for any server-side sync consumer that expects to reconstruct row-level history from
   the outbox. **Flag to the user before doing this** — it's the single biggest write-count
   reduction available, but it is a protocol decision, not a performance-neutral rewrite.

4. **Audit whether all six `cards` indexes are load-bearing, and drop what isn't queried
   standalone.** E.g., if every `deck_id` query in the app is already accompanied by a `state`
   filter (making the compound `[deck_id+state]` sufficient), the standalone `deck_id` index is
   redundant maintenance cost on every insert. This requires grepping every `db.cards.where(...)`
   call site in `src/` to confirm no query relies on the single-column index alone, then a Dexie
   schema version bump (`this.version(2).stores({...})`) with a migration. **Behavior-neutral if
   the audit is done correctly, but it is a schema migration** — get it right or a dropped index
   silently turns a fast indexed query into a full collection scan elsewhere in the app. Worth
   doing, but it's the kind of change that wants its own PR and its own test pass, not a "safe
   default" to fold into this one.

5. **Split the single atomic transaction into N smaller committed transactions (e.g., per-pack or
   per-2,000-cards), each committing independently.** This is very likely where a chunky, real
   speedup lives — IndexedDB engines commonly perform worse on transaction size in a
   worse-than-linear way, which lines up with the observed rate degradation. **This is explicitly
   not safe without a design decision**: `check-quality-runtime.ts:210-217` tests that a mid-install
   failure (an injected `outbox.bulkPut` rejection) rolls back *everything* — new cards, retirement,
   and the version marker — atomically, in one shot. Splitting into multiple committed transactions
   means a failure partway through leaves real, committed partial state, and the recovery story
   changes from "retry from empty" to "resume from where it stopped" (which needs its own
   idempotence design: a partially-installed library re-running `initializeStudyData()` must not
   re-add what already committed, must not re-queue it, and must decide what "install is complete"
   means when `curriculumVersionKey` can no longer be written in the same transaction as the last
   card). **This must go to the user as a decision**, not something to implement unilaterally,
   because it changes the failure-recovery contract the whole test file is built around.

6. **Make the initial pack materialization lazy per-deck instead of `Promise.all` over every chunk
   up front** (`src/data/section-expansion.ts:28-38`). Load and flatten only the packs needed for
   the decks about to be installed, rather than all 165+ at once, and release each chunk's raw JSON
   string after parsing. This reduces peak memory and front-loaded latency but, per the actual
   measurement, memory was not the bottleneck (368 MB peak against 3,586 MB available) — this is a
   secondary win, not the fix for the observed 25-minute stall. **Behavior-neutral** if
   `loadSectionExpansion()`'s external contract (returns the full flattened array) is preserved for
   existing non-install callers; check whether anything besides `installStarterDecks` calls it
   before changing its return shape.

7. **Incremental/background install (option (b) in `03-open-risks.md`)** — reach the home screen
   after the baseline + first few decks are written, then stream the rest of the comprehensive
   library into IndexedDB in the background while the app is usable. This is the real fix for "25
   minutes and never sees a home screen," and it's explicitly called out already as the larger,
   architecture-level alternative to just shrinking the multiple. **User decision required**: it
   changes what "installed" means (a user could open a deck before all its cards exist), touches
   `section-expansion.ts` and the whole install path, and interacts with every atomicity assumption
   in `check-quality-runtime.ts`. Don't start this without the user explicitly choosing it over
   "ship a smaller v14."

**Bottom line for (c):** #1 and #2 are safe, cheap, and worth doing regardless of what else happens.
#4 is safe if audited properly but is real, separate work. #3, #5, and #7 are the changes with real
leverage on the actual bottleneck (double writes, transaction size, install shape) and all three
are behavior/contract changes that the user needs to explicitly choose, not defaults to apply.

---

## (d) Ordered, dependency-aware finish plan

Host constraint carried through every step: 15.8 GB RAM, ~0.6 GB free, `NODE_OPTIONS=--max-old-space-size=8192`
needed for content scripts, background jobs get killed under memory pressure — run one heavy job at
a time, not in parallel, unless a step is explicitly marked parallel-safe.

1. **Fix the glossary anchoring bug** (change `(?:^|_)` to `(?:^|[/_])` and `(?:$|_)` to
   `(?:$|[/_])` in the three glossary regexes, `scripts/build-comprehensive-content.mjs` lines
   94–98). Trivial edit, no dependency, do first so the cold parse in step 3 doesn't need to be
   redone. **Depends on:** nothing. **Time:** minutes. **Pass criteria:** the four
   `node -e` checks above (`dom`, `cache`, `browser_cache`, `cache_control`) return `true` for the
   intended matches and `false` only for the real collisions (`domain_sharding`,
   `registrable_domain`).

2. **Delete the stale parse cache before regenerating**, since the fix in step 1 changes parse
   logic (inside the cache-key-covered region) and the cache would otherwise be reused unchanged.
   `rm artifacts/comprehensive-parsed.json` (or just let the key mismatch invalidate it — either
   way, verify with the "Reusing verified source parse cache" log line *not* appearing).
   **Depends on:** step 1 committed to disk. **Time:** seconds.

3. **Regenerate content**: `NODE_OPTIONS=--max-old-space-size=8192 RECALL_EXPANSION_MULTIPLE=4
   npm run content:expand-all`, run in the background (exceeds the 2-minute tool timeout; the cold
   parse alone reads 167 MB of source text). **Depends on:** 1, 2. **Time:** likely 15–40 minutes
   for a cold parse at this host's current memory pressure — budget generously and check on it
   rather than assuming a fixed number. **Pass criteria:** exits 0; `src/data/comprehensive-manifest.json`
   shows `version: 14`, `totalCards` in the predicted ~33,000–34,500 range (investigate if it's
   far outside that band — either the trims didn't take effect or the estimate was off), and the
   console's `guided.length`/`candidates.length` diagnostics look sane.

4. **Run structural checks**: `NODE_OPTIONS=--max-old-space-size=8192 npm run content:check` (all
   four stages) and `node scripts/check-comprehensive-content.mjs` directly if you want the PASS
   line in isolation. **Depends on:** 3. **Time:** several minutes; background it. **Pass
   criteria:** exit 0, and the printed PASS line's card/lesson counts match step 3's manifest.

5. **`npm run typecheck`.** **Depends on:** nothing from 1–4 (no `.ts`/`.tsx` app source changed),
   but cheap enough to just re-run after the data regenerates in case a generated JSON's shape
   changed in a way TypeScript's `resolveJsonModule` inference notices. **Can run in parallel with
   step 4** if the host can spare the memory for two node processes at once — given ~0.6 GB free,
   it probably can't; run it right after step 4 finishes instead. **Time:** well under a minute.
   **Pass criteria:** exit 0.

6. **`npm run build`** (tsc + vite + PWA). **Depends on:** 3 (needs the regenerated packs/manifest
   on disk), independent of 4/5's outcome but don't bother if either failed. **Time:** ~5–6 minutes
   based on the last v14 build. **Pass criteria:** exit 0; note the new service-worker precache
   entry count and total KiB (expect meaningfully under the old 240 entries / 92,126 KiB given the
   smaller pack set) — this number belongs in the docs update (step 9).

7. **Run the runtime harness against the corrected v13→v14 fixture**: `npm run content:runtime`
   (vite build + node, per `04-commands.md`). **Depends on:** 6 (needs a build) and the fixture
   already being in the tree (it is — reviewed in section (a), sound as-is; optionally delete the
   dead `db.cards.update(keptCard.id, { front: keptCard.front })` line first for clarity, though it
   changes nothing). **Time:** a few minutes. **Pass criteria:** every `console.log('PASS: ...')`
   line prints, including the new "the shipped v13 library upgrades to v14 additively" line; no
   assertion throws.

8. **Take a clean real-browser measurement** — this is the step that actually answers "is this
   install time acceptable," and it should be taken *without* the CPU contention that caveated the
   first one. Confirm no other heavy job (another agent, another `npm run build`/`content:check`)
   is running concurrently, then: `npm run preview`, then in another shell
   `RECALL_TEST_URL=http://127.0.0.1:5183 node scripts/check-comprehensive-ui.mjs`. **Depends on:**
   6 (needs a fresh v14 build in `dist/`); should run alone, not parallel with anything else on this
   host. **Time:** the harness itself will take as long as the install takes to observe — could be
   anywhere from ~1–10+ minutes depending on whether the optimizations in (c) were also applied.
   **Pass criteria:** reaches the home screen; record the actual navigation-to-home-screen and
   offline-return timings **as measured**, and compare against v13's clean 98,330 ms / 6,686 ms —
   do not round or estimate. If this is still unacceptable, that's the signal to apply the (c)#1/#2
   optimizations (safe, no user decision needed) and re-measure before escalating to the
   user-decision items (#3/#5/#7 in (c)).
   - **Decision gate:** if step 8's numbers are still bad after #1/#2 from (c), stop here and take
     the size/architecture decision to the user (lower the multiple further, or commit to the
     incremental-install rework) before doing docs or the commit — don't write down numbers that
     will be wrong in an hour.

9. **Update the docs with the real v14 numbers** — apply the `docs-audit.md` edit list (files:
   `docs/COMPREHENSIVE-EXPANSION.md`, `docs/CURRICULUM.md`, `docs/RELEASE.md`, `README.md`,
   `public/content-credits.html`), but substitute this session's *actual* regenerated totals (from
   step 3's manifest) and the *actual* step-8 browser timings everywhere `docs-audit.md` marked
   something "BLOCKED — awaiting measurement." Also update the source-scope description to mention
   the re-exclusions (framework, machine-learning, iot, code-analysis rules, wasm reference,
   soft_skills, django) alongside the widenings, since "widened scope" alone is no longer the whole
   story. **Depends on:** 3 (real counts) and 8 (real timings) — do not do this before either is
   final, and do not carry forward any v13 timing number as if it were v14's. **Time:** ~20–30
   minutes of careful editing (multiple `552`/`48`-shaped false-positive traps documented in
   `docs-audit.md` section 2 — re-check those don't get clobbered). **Pass criteria:** grep for the
   stale-number patterns `docs-audit.md` used (`21,?102`, `14,?068`, `828`, `98,?330`, `6,?686`,
   `threefold`, `62 packs`) and confirm zero hits outside `handoff/`.

10. **Vitest / Playwright e2e** — attempt `npm run test` and `npm run test:e2e` once, mainly to
    check whether the previously-broken Vitest worker issue still reproduces on this host.
    **Depends on:** nothing blocking, can happen any time after step 6, low priority. **Time:**
    unknown (it never started in the last pass). **Pass criteria:** if Vitest still can't start its
    worker, say so plainly in the docs/commit message — don't claim it passed.

11. **Commit.** `git add scripts/ src/data/` (per `04-commands.md`; explicitly do **not** add
    `tsconfig.tsbuildinfo` — either delete it or add it to `.gitignore` first), plus the docs files
    touched in step 9. **Depends on:** 3–9 all green, and the size/timing decision from step 8's
    gate being resolved one way or the other (ship as measured, or ship smaller). **Time:**
    minutes. **Pass criteria:** `git status --short` shows only the intended files; the commit
    message states the real card count and the real measured install time, with the same honesty
    register `02-verification-status.md` used (measurements on this host, not guarantees; Vitest
    reported accurately either way).

### Summary of what can run in parallel
Given ~0.6 GB free RAM, **prefer strictly sequential** execution of anything that spawns Node with
a raised heap (steps 3, 4, 6, 7, 8) or a browser (step 8). Step 5 (typecheck) is the only genuinely
cheap step and can trail immediately behind step 4 without needing to be truly concurrent. Steps 9
and 10 have no data dependency on each other and could be done in either order, but step 9 needs
steps 3 and 8's numbers first regardless.
