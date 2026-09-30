# 02 — Verification status

Everything below was run **against the current working tree** on 2026-09-10 unless noted.

## Passing (re-verified this session)

| Check | Result |
|---|---|
| `npm run typecheck` | **PASS** (exit 0) |
| `node scripts/check-comprehensive-content.mjs` | **PASS** — "36853 new cards, 1717 distinct three-part guided lessons, 3-5x growth, source pins, credits, identities, and bounded packs" |
| `npm run content:check` (all four stages) | **PASS** (exit 0) — exports 2,799 baseline cards; 43,887 active cards; 4,163 source-backed library additions; comprehensive check as above |
| `npm run build` (tsc + vite + PWA) | **PASS** (exit 0) — built in **5m 35s**; `dist/` is now a v14 build (~91 MB, 220 asset files). Service worker generated: **240 precache entries, 92,126 KiB**. Warnings only: chunks over 500 kB (largest `expanded-cards-*.js` at 4,168 kB / 596 kB gzip) and a plugin-timing notice. No single file trips the 6 MB workbox limit. |

Note the comprehensive check takes **several minutes** and needs a raised heap
(`NODE_OPTIONS=--max-old-space-size=8192`). It exceeds a 2-minute tool timeout; run it in
the background.

## Not yet run — this is the remaining work

1. **`npm run content:runtime`** — the standalone IndexedDB harness (fresh install, v10/v12/v13
   upgrades, personal edits, deletion markers, review history, idempotent re-install, backup
   restore, atomic rollback). **This has never been run against v14.** A v13→v14 upgrade fixture
   probably needs to be added.
2. **`node scripts/check-comprehensive-ui.mjs`** — real-browser Playwright pass against the
   production preview (defaults to `http://127.0.0.1:5183`, override with `RECALL_TEST_URL`).
   Covers fresh install, offline study, mission search, persisted evidence, and desktop/390px/320px
   layouts. **Not run against v14.** This is where the install-time risk shows up.
3. **`npm run test` (Vitest)** — on the v13 pass this suite **could not start its worker on this
   host**, with both `threads` and `forks` attempted. Assume it is still broken here. Do **not**
   report it as passing. If you get it running, that is a genuine win worth noting.
4. **`npm run test:e2e`** (Playwright, `baseURL` 127.0.0.1:4173) — not run.
5. **Docs are stale.** `docs/COMPREHENSIVE-EXPANSION.md` still describes v13 throughout
   (21,102 cards, 62 packs, "threefold increase", a "Final verification (2026-09-08)" section, and
   the 98,330 ms / 6,686 ms browser timings). `README.md`, `docs/CURRICULUM.md`,
   `docs/RELEASE.md`, `docs/CONTENT-REVIEW.md`, and `public/content-credits.html` should all be
   checked for v13 numbers. Update these only **after** the runtime numbers are real — do not
   copy forward the v13 timings.
6. **Nothing is committed.** See `04-commands.md` for the commit shape.

## Honesty constraint carried over from the previous work

The project's docs are deliberately careful to distinguish structural checks from semantic review,
and to state that measured timings are measurements on this host rather than guarantees. Keep that
register. Do not write that the Vitest suite passed if it did not run.
