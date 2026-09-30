# 03 — Open risks, ranked

## 1. Install time and memory in the browser (highest)

v13 measured **98,330 ms** from navigation to first home screen and **6,686 ms** for an offline
return. v14 is **2.08x** the cards (43,887) and **93.5 MB** of pack JSON.

Compounding this: `src/data/section-expansion.ts::loadSectionExpansion()` does
`Promise.all(...)` over **every** chunk in the manifest, `JSON.parse`s each, and `.flat()`s them
into one array held in a module-level promise. At v14 that means ~93 MB of raw JSON strings plus
the parsed object graph resident simultaneously. That was survivable at 35 MB; at 93 MB it is a
plausible OOM on a mid-range phone.

**Decide between these before doing polish work:**
- **(a) Lower the multiple.** `RECALL_EXPANSION_MULTIPLE=4 npm run content:expand-all` (default is
  now 8). Halves everything. Cheapest fix; the check's upper bound at `baseline.cards * 8` already
  accommodates the range.
- **(b) Make loading incremental** — stream/batch chunks into IndexedDB instead of materializing
  all packs in memory, and release each pack after it is installed. Real fix, larger change,
  touches `section-expansion.ts` and the install path.
- **(c) Ship v14 as-is** only if the browser measurement comes back acceptable. Measure first.

## 2. `content:runtime` has no v13→v14 upgrade fixture

The harness covers v10/v12 upgrades. A user on the shipped v13 build with review history and
personal edits across 21,102 cards must upgrade cleanly to 43,887. Card identities are
source-derived (`a4000000-` prefix) and the baseline is unchanged, so the upgrade *should* be
purely additive — but that is a hypothesis, not a verified result.

## 3. A 90 MB service-worker precache

The v14 build **succeeds** (5m 35s) but generates a service worker with
**240 precache entries totalling 92,126 KiB**. No single file trips the 6 MB
`maximumFileSizeToCacheInBytes` limit (largest pack is 462 KB), so workbox is happy — but this
means the PWA install fetches and stores ~90 MB before it is usable offline. On a metered or slow
connection that is a poor first-run experience, and some browsers apply per-origin storage quotas
that this could approach.

Options: precache only the shell and let packs arrive through runtime caching as decks are opened;
or lower the expansion multiple (risk 1, option (a)). Confirm the offline-return path still works
either way.

## 4. Widened source scope = wider semantic surface

v14 admits MDN `glossary/`, `learn_web_development/`, `webassembly/` and .NET `azure/`,
`machine-learning/`, `orleans/`, `iot/`, `devops/`, `framework/`, `ai/`. Deck routing for these was
written fresh in this session and **has not been eyeballed against real output**. Sample cards from
each new area and check they land in sensible decks and read as teaching material — especially
`docs/framework/` (legacy .NET Framework), which v13 deliberately excluded and v14 now admits.
That reversal was not justified anywhere in the diff; confirm it is intentional.

## 5. Repo hygiene

- `artifacts/` holds ~700 MB, including three `.tar.gz` archives (274 MB + 158 MB + 56 MB), a
  167 MB `comprehensive-sources.json` and a 64 MB `comprehensive-parsed.json`. Confirm these are
  gitignored before committing anything (they appear to be, since they are not in `git status`).
- `tsconfig.tsbuildinfo` is untracked and **not** ignored — exclude it from the commit or add it
  to `.gitignore`.
- 174 changed/new paths in one commit. Consider splitting generator changes from generated data,
  though this repo's history keeps them together.
