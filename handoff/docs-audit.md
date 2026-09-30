# Docs audit — v13 → v14 stale content numbers

Audit only. **No files were edited.** Every number below was re-derived from the working tree
(`src/data/comprehensive-manifest.json`, `src/data/content-report.json`,
`src/data/content-quality-report.json`, `src/data/section-expansion-manifest.json`,
`src/data/section-packs/*`, `src/data/engineering-mission-expansion.ts`, `dist/sw.js`).

Date of audit: 2026-09-10.

---

## 0. Verified ground truth (v14, from generated data)

| Fact | Value | Source of truth |
|---|---|---|
| Manifest version | `14` | `comprehensive-manifest.json.version` |
| Total active cards | **43,887** | manifest `.totalCards`, quality report `.activeCards`, content report `.totalCards` |
| Cards added by comprehensive generator | **36,853** | manifest `.addedCards` (= 43,887 − 7,034) |
| New guided (three-part) lessons | **1,717** | manifest `.guidedLessons`, `.kinds["guided-source"]` |
| Total guided lessons | **1,993** | manifest `.totalGuidedLessons`, content report `.guidedLessons` |
| Source-reference cards | 35,136 | manifest `.kinds["source-reference"]` |
| Comprehensive packs (chunks) | **165** | manifest `.chunks.length`; 165 files match `reviewed-comprehensive-*.json` |
| All pack files on disk | 230 files | `src/data/section-packs/` |
| Section-expansion chunks (all packs) | 188 | `section-expansion-manifest.json.chunks.length` |
| Decks | 75 | manifest `.sections.length` |
| Baseline (v12, preserved) | 7,034 cards / 276 lessons / 16 missions | manifest `.baseline` |
| Authored scenarios | 72 | content report `.scenarioCards` |
| Base cards retained | 2,799 | content report `.baseCards` |
| Engineering missions | **48** (16 baseline + 32 in `engineering-mission-expansion.ts`: build 12, reliable 12, ownership 8) | verified by counting seeds |
| Card growth vs v12 | 43,887 / 7,034 = **6.24x** | derived |
| Guided-lesson growth vs v12 | 1,993 / 276 = **7.22x** | derived |
| Mission growth vs v12 | 48 / 16 = 3x (**unchanged from v13**) | derived |
| Largest comprehensive pack | 472,933 bytes (462 KiB) — `reviewed-comprehensive-098.json` | on disk; still under the documented 600 KB bound |
| All pack bytes | 98,060,243 B = **98.1 MB / 93.5 MiB** | on disk |
| Comprehensive pack bytes | 76,644,614 B = **76.6 MB / 73.1 MiB** | on disk |
| Service-worker precache entries | **240** | `dist/sw.js` (240 `url:`/`revision:` pairs) |

### Per-source card counts — TWO DIFFERENT SETS EXIST (see section 4 discrepancies)

`comprehensive-manifest.json.sources` (the comprehensive generator's own attribution):

| Repository | v14 cards |
|---|---|
| mdn/content | 18,310 |
| dotnet/docs | 15,906 |
| github/docs | 1,380 |
| freeCodeCamp/freeCodeCamp | 213 |
| dotnet/AspNetCore.Docs | **802** |
| dotnet/EntityFramework.Docs | **101** |
| reactjs/react.dev | 141 |

`content-report.json.librarySources` (whole library, all builders combined):

| Source | v14 cards |
|---|---|
| mdn/content | 19,873 |
| dotnet/docs | 16,743 |
| github/docs | 1,592 |
| freeCodeCamp/freeCodeCamp | 642 |
| dotnet/AspNetCore.Docs | **1,462** |
| dotnet/EntityFramework.Docs | **244** |
| reactjs/react.dev | 460 |

---

## 1. Files that need edits

Only **five** files contain stale v13 content numbers. A repo-wide grep (excluding
`node_modules`, `dist`, `artifacts`, `.git`, `src/data`, `handoff`) for
`21,?102`, `14,?068`, `552`, `828`, `98,?330`, `6,?686`, `35 MB`, `8,?246`, `3,?184`,
`1,?381`, `threefold`, `three-fold`, `three times`, `62 packs` found nothing else.

- `docs/COMPREHENSIVE-EXPANSION.md`
- `docs/CURRICULUM.md`
- `docs/RELEASE.md`
- `README.md`
- `public/content-credits.html`

`docs/CONTENT-REVIEW.md` (v10 pass) and `docs/LIBRARY-EXPANSION.md` (v12) are explicitly
historical and contain **no** v13 numbers. `IMPROVEMENTS.md`, `index.html`, `docs/upskill/**`,
and all `src/**` application source are clean. **No edits needed in those.**

---

## 2. DO NOT TOUCH — false-positive traps

A mechanical find-and-replace on `552` or `48` will corrupt correct text. These lines are
**correct as written** and must be left alone:

| File:line | Text | Why it must not change |
|---|---|---|
| `README.md:44` | "All **552** guided cards have five views: plain English, a worked example, an analogy, a common mistake, and a practice prompt…" | This 552 is the **retained authored** guided card count (276 authored lessons x 2 cards). It is unrelated to the v13 "552 new source-guided lessons" and is unchanged in v14. |
| `docs/CURRICULUM.md:93` (first half) | "the retained guided set contains 276 lessons and **552** cards" | Same authored 276x2 = 552. Only the *second* 552 on that line (`v13 adds 552 source-guided lessons`) is stale. |
| `README.md:64` | "The **48** missions cover feature delivery…" | Correct: v14 mission count is unchanged at 48. |
| `docs/COMPREHENSIVE-EXPANSION.md:15` | "New packs are bounded below **600 KB**" | Still true; largest v14 pack is 462 KiB. |
| `README.md:130`, `docs/LIBRARY-EXPANSION.md` (all) | v12 numbers (4,163 additions, 2.45x, 22 chunks) | Historical v12 sections, still accurate. |
| `docs/RELEASE.md:36–51` | v8 numbers (13,609 cards, 42 packs, 4.86x, 2026-09-06 / 2026-09-07 dates) | Explicitly labelled historical v8 verification; leave verbatim. |
| `docs/CURRICULUM.md:9–86` | "Historical v8 inventory" table | Explicitly historical. |
| `docs/CURRICULUM.md:87` | "808 cards are original Recall material" | Consistent with `content-report.originalCards = 880` (880 − 72 scenarios = 808). Not a defect. |

---

## 3. Per-file edit list

### 3.1 `docs/COMPREHENSIVE-EXPANSION.md`

#### Line 3 — STALE

Current:

```
This expansion starts from the shipped v12 library: 7,034 cards, 276 guided lessons, and 16 engineering missions. The v13 totals are 21,102 cards, 828 guided lessons, and 48 missions, a threefold increase in each overall count. The generated `comprehensive-manifest.json` records totals and per-deck additions. Topic availability determines distribution; individual decks do not all have the same multiplier.
```

Replace with:

```
This expansion starts from the shipped v12 library: 7,034 cards, 276 guided lessons, and 16 engineering missions. The v14 totals are 43,887 cards, 1,993 guided lessons, and 48 missions: 6.2 times the v12 card count and 7.2 times its guided-lesson count. The mission count is unchanged from v13 and remains three times the v12 total. The generated `comprehensive-manifest.json` records totals and per-deck additions. Topic availability determines distribution; individual decks do not all have the same multiplier.
```

#### Line 7 — STALE (misleading tense; no number change)

Current:

```
New reference cards use distinct, complete sections from pinned documentation. New guided cards combine explanations and worked examples from one source article. Their constituent sections are not also counted as separate new reference cards. The 32 new missions are original practical assignments with steps, evidence criteria, review questions, and stretch work.
```

Replace with:

```
New reference cards use distinct, complete sections from pinned documentation. New guided cards combine explanations and worked examples from one source article. Their constituent sections are not also counted as separate new reference cards. The 32 missions added in v13 are original practical assignments with steps, evidence criteria, review questions, and stretch work; v14 adds no new missions.
```

#### Line 9 — INCOMPLETE (recommended addition; no stale number)

Current:

```
The collection combines pinned MDN, .NET, and GitHub archives with the existing pinned freeCodeCamp, React, ASP.NET Core, and Entity Framework cache. Archives are read without extracting or executing their contents. License notices remain available offline; each adapted card identifies its source and applicable license.
```

Replace with (documents the v14 source-scope widening, which is the actual cause of the growth):

```
The collection combines pinned MDN, .NET, and GitHub archives with the existing pinned freeCodeCamp, React, ASP.NET Core, and Entity Framework cache. Version 14 widens the archive read rather than changing the selection rules: MDN now also admits `glossary/`, `learn_web_development/`, and `webassembly/`, and .NET now also admits `fundamentals/`, `architecture/`, `ai/`, `azure/`, `machine-learning/`, `orleans/`, `iot/`, `devops/`, and `framework/`, along with the `samples/` and `includes/` files needed to resolve whole-file snippet directives. Visual Basic and F# remain excluded because the curriculum teaches C#. Archives are read without extracting or executing their contents. License notices remain available offline; each adapted card identifies its source and applicable license.
```

#### Lines 26–36 — the "Final verification (2026-09-08)" block

This entire dated section describes **v13** and must not be renumbered in place, because most of
what it asserts has not been re-run against v14. Recommended shape: retitle the existing block as
historical and insert a new, honest v14 block above it.

Line 26 current:

```
## Final verification (2026-09-08)
```

Replace with:

```
## Verification against v14 (2026-09-10)

The complete content checks (`npm run content:check`, all four stages), the comprehensive content
check, TypeScript compilation, and the production/PWA build passed against the v14 working tree.
The build completed in 5m 35s on this host and the generated service worker precaches 240 entries.
The `npm run content:runtime` harness, the real-browser `scripts/check-comprehensive-ui.mjs` pass,
and the Vitest suite have **not** been run against v14; nothing below should be read as v14 browser
or runtime validation.

## Historical verification of v13 (2026-09-08)

The results in this section were measured against the v13 library and are retained for reference.
They are not claims about v14.
```

Line 28 — STALE (v13 counts) but **inside a now-historical section**. Under the new
"Historical verification of v13" heading, `21,102` and `62` are correct v13 statements.
**Do not renumber lines 28, 30, 32, or 34 to v14 values.** If the applier prefers to delete the v13
block outright rather than retitle it, delete lines 26–36 in full and keep only the new v14 block.

#### BLOCKED — awaiting measurement

| File:line | Text | Status |
|---|---|---|
| `docs/COMPREHENSIVE-EXPANSION.md:32` | "The last browser run measured **98,330 ms** from navigation to the initial home screen and **6,686 ms** for an offline return to the installed library." | **BLOCKED — awaiting measurement.** These are v13 Playwright timings. `scripts/check-comprehensive-ui.mjs` has not been run against v14 and the v14 library is ~2.1x larger, so install time is certainly different. Do not scale, estimate, or carry these forward. Leave them under the historical v13 heading, or delete and re-add after a real v14 browser run. |
| `docs/COMPREHENSIVE-EXPANSION.md:28` | "Playwright installed all 21,102 cards, verified all 62 new packs were cached…" | **BLOCKED — awaiting measurement.** The v14 equivalent (43,887 cards / 165 packs) has not been observed in a browser. Do not write it as if it had. |
| `docs/COMPREHENSIVE-EXPANSION.md:30` | "The standalone `npm run content:runtime` harness completed successfully…" | **BLOCKED — awaiting measurement.** Never run against v14; a v13→v14 upgrade fixture is likely still missing. |
| `docs/COMPREHENSIVE-EXPANSION.md:34` | "The production preview used `http://127.0.0.1:5184`…" | Tied to the v13 browser run. Leave under the historical heading. |
| `docs/COMPREHENSIVE-EXPANSION.md:36` | Vitest-worker paragraph | Still true (the suite still cannot start on this host). Safe to keep; do not upgrade it to a pass. |

---

### 3.2 `docs/CURRICULUM.md`

#### Line 3 — STALE

Current:

```
The current v13 library contains 21,102 cards across 75 decks, including 72 authored scenarios and 828 guided lessons, plus 48 hands-on engineering missions. It adds 14,068 cards to the retained v12 library. Overall card, lesson, and mission counts are each three times their v12 totals; growth varies by deck. See [the expansion and verification scope](COMPREHENSIVE-EXPANSION.md). The automatic retrieval layer remains retired; [the earlier quality review](CONTENT-REVIEW.md) documents that decision.
```

Replace with:

```
The current v14 library contains 43,887 cards across 75 decks, including 72 authored scenarios and 1,993 guided lessons, plus 48 hands-on engineering missions. It adds 36,853 cards to the retained v12 library. Overall cards are 6.2 times and guided lessons 7.2 times their v12 totals; the mission count is unchanged from v13 at three times the v12 total. Growth varies by deck. See [the expansion and verification scope](COMPREHENSIVE-EXPANSION.md). The automatic retrieval layer remains retired; [the earlier quality review](CONTENT-REVIEW.md) documents that decision.
```

#### Line 93 — STALE (partial: only the clause after the semicolon)

Current:

```
The authored C# & .NET path contains 96 lessons and 192 paired cards. Together with the earlier authored paths, the retained guided set contains 276 lessons and 552 cards; v13 adds 552 source-guided lessons. The dedicated `/dotnet` page groups its decks into C# fundamentals, web backend development, and completing a working app. Focused sessions keep due reviews first and introduce new cards in deck order while sharing the existing global daily allowance. The authored path uses .NET 10 as its baseline, with official Microsoft Learn links for further reading. Source references retain their documented platform context.
```

Replace with (the **first** `552` is unchanged; only `v13 adds 552 source-guided lessons` changes):

```
The authored C# & .NET path contains 96 lessons and 192 paired cards. Together with the earlier authored paths, the retained guided set contains 276 lessons and 552 cards; v14 adds 1,717 source-guided lessons, for 1,993 guided lessons in total. The dedicated `/dotnet` page groups its decks into C# fundamentals, web backend development, and completing a working app. Focused sessions keep due reviews first and introduce new cards in deck order while sharing the existing global daily allowance. The authored path uses .NET 10 as its baseline, with official Microsoft Learn links for further reading. Source references retain their documented platform context.
```

Minimal-diff alternative for a mechanical applier — replace the exact substring

```
; v13 adds 552 source-guided lessons.
```

with

```
; v14 adds 1,717 source-guided lessons, for 1,993 guided lessons in total.
```

(unique on line 93).

---

### 3.3 `docs/RELEASE.md`

#### Line 3 — STALE

Current:

```
The current v13 curriculum contains 21,102 cards, including 72 authored scenarios and 828 guided lessons, plus 48 engineering practice missions. These overall card, guided-lesson, and mission counts are each 3x their v12 totals. Existing identities and review progress remain intact. See [the comprehensive expansion review](COMPREHENSIVE-EXPANSION.md) for provenance, checks, and limitations. The v8 verification and packaging notes below are historical, not validation of v13.
```

Replace with:

```
The current v14 curriculum contains 43,887 cards, including 72 authored scenarios and 1,993 guided lessons, plus 48 engineering practice missions. Cards are 6.2x and guided lessons 7.2x their v12 totals; the mission count is unchanged from v13 at 3x. Existing identities and review progress remain intact. See [the comprehensive expansion review](COMPREHENSIVE-EXPANSION.md) for provenance, checks, and limitations. The v8 verification and packaging notes below are historical, not validation of v14.
```

No other line in this file needs a change. Lines 32–51 are the labelled v8 block.

---

### 3.4 `README.md`

#### Line 3 — STALE

Current:

```
A local-first spaced-repetition web app with **21,102 practical web development flashcards across 75 decks** and 48 hands-on engineering missions. The card library includes 72 authored debugging scenarios and 828 guided lessons. No API key or account is required. The library focuses on forms, APIs, SQL, authentication, validation, testing, and shipping CRUD apps. LeetCode and DSA exercises are excluded.
```

Replace with:

```
A local-first spaced-repetition web app with **43,887 practical web development flashcards across 75 decks** and 48 hands-on engineering missions. The card library includes 72 authored debugging scenarios and 1,993 guided lessons. No API key or account is required. The library focuses on forms, APIs, SQL, authentication, validation, testing, and shipping CRUD apps. LeetCode and DSA exercises are excluded.
```

#### Line 44 — DO NOT CHANGE (see section 2). The `552` here is the authored guided-card count.

#### Line 64 — DO NOT CHANGE. `48` missions is still correct.

#### Line 120 — STALE

Current:

```
### Current expansion (v13)
```

Replace with:

```
### Current expansion (v14)
```

#### Line 122 — STALE

Current:

```
Version 13 adds **14,068 distinct source-backed cards**, including **552 three-part guided lessons**, and **32 original engineering missions**. Overall cards, guided lessons, and missions are each three times their v12 totals; individual deck growth varies with topic coverage. New content ships in 62 lazy-loaded packs below 600 KB each. Existing card identities and saved progress remain intact.
```

Replace with:

```
Version 14 adds **36,853 distinct source-backed cards**, including **1,717 three-part guided lessons**. Overall cards are 6.2 times and guided lessons 7.2 times their v12 totals; individual deck growth varies with topic coverage. The 48 engineering missions are unchanged from version 13. New content ships in 165 lazy-loaded packs below 600 KB each. Existing card identities and saved progress remain intact.
```

#### Recommended (optional) — insert after line 126, before `### Earlier expansion (v12)` on line 128

The README documents each superseded expansion under its own heading. Version 13 loses its entry
once lines 120/122 are rewritten. Suggested insertion:

```
### Earlier expansion (v13)

Version 13 added 14,068 source-backed cards, including 552 three-part guided lessons, and the 32
original engineering missions that remain in the current library. It shipped in 62 lazy-loaded
packs. Version 14 supersedes it by widening the pinned MDN and .NET archive scope; the selection
rules are unchanged.
```

---

### 3.5 `public/content-credits.html`

#### Line 110 — STALE

Current:

```
      Version 13 adds 14,068 source-backed cards, including 552 three-part guided lessons.
```

Replace with:

```
      Version 14 adds 36,853 source-backed cards, including 1,717 three-part guided lessons.
```

#### Lines 112–114 — STALE (tense)

Current (lines 113–114 carry the mission sentence):

```
      is normalized, and selected wording is clarified. The 32 additional engineering
      missions are original assignments. Structural checks cover the complete library;
```

Replace with:

```
      is normalized, and selected wording is clarified. The 32 engineering missions
      added in version 13 are original assignments. Structural checks cover the complete library;
```

#### Lines 104 and 117–123 — DO NOT CHANGE

Line 104 is the labelled v12 statement (4,163 cards) and is historical. Lines 117–123 are the
license list and carry no counts.

---

## 4. Discrepancies between the numbers I was given and the actual data

| # | Claim in the task brief | What the data says | Verdict |
|---|---|---|---|
| 1 | per-source `AspNetCore 1,462` and `EntityFramework 244` | `comprehensive-manifest.json.sources` still shows **802** and **101** — unchanged from v13. The 1,462 / 244 figures come from a *different* file, `content-report.json.librarySources`, which counts the whole library across all builders. | **Mixed sources.** The brief's per-source list interleaves manifest figures (mdn 18,310; dotnet 15,906; github 1,380; freeCodeCamp 213; react.dev 141) with content-report figures (AspNetCore 1,462; EntityFramework 244). The two sets are not comparable. Moot in practice: **no per-source counts appear anywhere in `docs/`, `README.md`, or `public/`**, so no edit depends on resolving it. |
| 2 | `github 1,380` (v13 was 1,381) | Confirmed: manifest shows 1,380. A one-card *decrease*. | Confirmed — note the direction. Do not describe v14 as "growth in every source". |
| 3 | "93.5 MB pack JSON" | 98,060,243 bytes = 98.1 MB decimal, **93.5 MiB** binary. Comprehensive packs alone: 76,644,614 B = 76.6 MB / 73.1 MiB. | Unit slip. The handoff's "93.5 MB / 73.1 MB" figures are MiB. No doc currently states a pack size, so no edit is required; if one is added, state the unit. |
| 4 | "165 packs" | 165 `reviewed-comprehensive-*.json` files, `manifest.chunks.length = 165`. But `section-packs/` holds **230** files total and `section-expansion-manifest.chunks.length = 188`. | Confirmed for the comprehensive packs. Keep the README's "ships in 165 lazy-loaded packs" scoped to the *new* v14 content, exactly as the v13 text scoped 62. |
| 5 | "Service worker: 240 precache entries, 92,126 KiB" | `dist/sw.js` has exactly **240** entries — confirmed. Summing those 240 files on disk gives **92,157 KiB** (94,368,322 bytes), 31 KiB above the quoted figure. | Entry count confirmed; the KiB figure differs slightly from a direct file-size sum (workbox has its own accounting). No doc states a service-worker size today; if one is added, quote the build output's 92,126 KiB and attribute it to the build. |
| 6 | "Baseline unchanged at 7,034 cards / 276 lessons" | Confirmed. `manifest.baseline` = `{version: 12, cards: 7034, lessons: 276, missions: 16}`. | Confirmed. Note `baseline.missions` is **16**, not 48; the 48 total is 16 + 32 seeds in `src/data/engineering-mission-expansion.ts` (build 12 + reliable 12 + ownership 8 = 32, verified by counting). |
| 7 | "552 new guided lessons" as a v13 string to hunt | Correct as a v13 figure, **but** `552` also legitimately denotes the retained authored guided-card count (276 × 2) in `README.md:44` and the first half of `docs/CURRICULUM.md:93`. | Two distinct meanings. See section 2. A blind global replace of `552` introduces a factual error. |
| 8 | "62 packs", "21,102", "14,068", "828", "threefold" | All present exactly where expected; no additional occurrences anywhere in the repo outside `src/data/`, `dist/`, `artifacts/`, and `handoff/`. | Confirmed. |
| 9 | "35 MB pack size", "98 seconds", per-source counts in docs | **Not present anywhere.** No doc or static page states a pack size in MB, a seconds figure, or a per-source card count. | Zero hits. Nothing to edit for these. |
| 10 | "Build time 5m35s" | Not independently verifiable from the working tree (no build log checked in). Taken from `handoff/02-verification-status.md`. | Unverified by me; quote only as "the last local build on this host". |

### Related stale string outside docs (not in scope, but worth the same commit)

`scripts/check-comprehensive-content.mjs:72` prints:

```
console.log(`PASS: ${cards.length} new cards, ${lessons.length} distinct three-part guided lessons, 3-5x growth, source pins, credits, identities, and bounded packs.`);
```

The literal `3-5x growth` is stale. Line 30 now asserts
`manifest.totalCards >= manifest.baseline.cards * 3 && manifest.totalCards <= manifest.baseline.cards * 8`,
and the measured v14 growth is **6.2x** — outside the range the message advertises. Suggested
replacement for that literal: `3-8x growth`. Flagged because this string is quoted verbatim in
`handoff/02-verification-status.md` and would otherwise propagate into release notes.

---

## 5. Summary of edits by file

| File | Lines to edit | Lines blocked | Optional |
|---|---|---|---|
| `docs/COMPREHENSIVE-EXPANSION.md` | 3, 7, 9, 26 (heading restructure) | 28, 30, 32, 34 | — |
| `docs/CURRICULUM.md` | 3, 93 (partial) | — | — |
| `docs/RELEASE.md` | 3 | — | — |
| `README.md` | 3, 120, 122 | — | insert v13 history block after 126 |
| `public/content-credits.html` | 110, 113 | — | — |
| `scripts/check-comprehensive-content.mjs` | 72 (`3-5x` → `3-8x`) | — | outside docs scope |

Total: **10 required line edits** across 5 files, 1 heading restructure, 4 blocked lines,
2 optional additions.
