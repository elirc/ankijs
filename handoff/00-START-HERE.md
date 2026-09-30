> **Superseded (2026-09-24):** this handoff describes v14 and is out of date. Read `update.md` at the repo root instead.

# Handoff — Recall (ankijs), v14 comprehensive content expansion

**Written:** 2026-09-10 · **Branch:** `main` · **Last commit:** `38d8b59` (the shipped **v13** build)
**All work below is UNCOMMITTED in the working tree.**

## One-paragraph summary

The previous session was mid-way through a **v13 → v14 content expansion**: re-running the
generator over the pinned documentation archives with a widened source scope, which grew the
library from **21,102 cards / 552 new guided lessons / 62 packs** to
**43,887 cards / 1,717 new guided lessons / 165 packs**. The generator changes, the regenerated
packs, and the regenerated manifests are all on disk, and **all content checks, the typecheck, and
the production build pass** (re-verified 2026-09-10). What is *not* done: the browser and
IndexedDB runtime verification, the docs update, and the commit.

## Read these in order

1. `01-state-of-work.md` — exactly what changed and why
2. `02-verification-status.md` — what has been run and what has not (**start your work here**)
3. `03-open-risks.md` — the things most likely to bite you
4. `04-commands.md` — copy-pasteable commands and host quirks

## The single most important open question

v13 already took **98 seconds** from navigation to first home screen in the browser
(measured on this host, recorded in `docs/COMPREHENSIVE-EXPANSION.md`). v14 is **~2.1x** the
card count, **93.5 MB** of pack JSON, and the built service worker now precaches
**~90 MB across 240 entries**. Nobody has yet measured whether a fresh install of v14 is
tolerable in a real browser, or whether it OOMs on mobile. **Verify this before polishing
anything else** — if it is unacceptable, the right fix is to lower the expansion multiple
(see `03-open-risks.md`), and most of the remaining work changes shape.

## Suggested first moves for the new session

1. `git status --short | wc -l` → expect ~174 changed/new paths, all uncommitted. Do not
   `git stash` or `git checkout` anything; the regenerated packs are hours of build time.
2. Read `03-open-risks.md`, then **measure the real browser install**:
   `npm run preview`, then `RECALL_TEST_URL=http://127.0.0.1:5183 node scripts/check-comprehensive-ui.mjs`.
   `dist/` is already a fresh v14 build as of 2026-09-10 12:02, so no rebuild is needed first.
3. Take the size decision (ship v14 as-is / lower `RECALL_EXPANSION_MULTIPLE` / make loading
   incremental) based on that measurement, not on intuition.
4. Then `npm run content:runtime`, then update the docs with **real** v14 numbers, then commit.

## State of the tree when this handoff was written

- Uncommitted: 3 generator scripts, 5 regenerated data/manifest files, 62 modified packs,
  103 new packs, plus untracked `tsconfig.tsbuildinfo`.
- `dist/` was rebuilt at v14 on 2026-09-10 (gitignored).
- `artifacts/` (~700 MB of pinned archives and caches) is gitignored and must stay that way.
- No application source, test, or doc file has been modified.
