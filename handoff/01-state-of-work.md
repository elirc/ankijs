# 01 — State of the work

## Numbers: shipped v13 (commit 38d8b59) vs. working-tree v14

| | v13 (committed) | v14 (working tree) |
|---|---|---|
| `comprehensive-manifest.json` version | 13 | 14 |
| Total active cards | 21,102 | **43,887** |
| Cards added by this generator | 14,068 | **36,853** |
| New guided (three-part) lessons | 552 | **1,717** |
| Total guided lessons | — | 1,993 |
| `reviewed-comprehensive-*.json` packs | 62 | **165** |
| Pack bytes on disk (all packs) | ~35 MB | **93.5 MB** (73.1 MB of it comprehensive; largest single pack 462 KB) |
| Baseline (preserved, unchanged) | 7,034 cards / 276 lessons | same |
| Engineering missions | 48 | **48 — unchanged, no new missions in v14** |

Per-source card counts (v13 → v14):
`mdn/content` 8,246 → 18,310 · `dotnet/docs` 3,184 → 15,906 · `github/docs` 1,381 → 1,380 ·
`freeCodeCamp` 213 → 213 · `AspNetCore.Docs` 802 → 1,462 · `EntityFramework.Docs` 101 → 244 ·
`react.dev` 141 → 141.

The growth is concentrated in MDN and .NET because those are the two source scopes that were widened.

## What actually changed in code (3 files)

### `scripts/read-source-archives.py` — widened the archive read
- MDN: was only `files/en-us/web/`; now also `glossary/`, `learn_web_development/`, `webassembly/`.
- .NET: was only `docs/csharp|core|standard`; now also `fundamentals/`, `architecture/`, `ai/`,
  `azure/`, `machine-learning/`, `orleans/`, `iot/`, `devops/`, `framework/`; **plus** `samples/`
  and `includes/` code files, so whole-file snippet directives resolve.
  Visual Basic and F# are deliberately excluded (curriculum teaches C#).
- New output: `artifacts/comprehensive-sources-index.json` — a small provenance-only index
  (repo, revision, sha, sorted file list, **no file text**).

### `scripts/build-comprehensive-content.mjs` — memory + scope + multiple
- **Lazy archive loading.** The full archive text (`artifacts/comprehensive-sources.json`, 167 MB)
  is no longer loaded eagerly; the build reads the small index and only calls `loadArchives()` on a
  cold parse. `source.files` is released per-repo after parsing, and the parse cache array is
  emptied after reuse. This was a peak-memory fix — the eager load did not fit.
- **Parse-cache key narrowed.** The cache key now hashes only the parse-logic slice of the script,
  with `// parse-key:ignore-start/end` regions excluded, so editing the caching/loading plumbing
  no longer throws away a still-valid parse (`artifacts/comprehensive-parsed.json`, 64 MB).
- **New deck routing** for the newly-admitted MDN areas: `/glossary/`, `/learn_web_development/`,
  `/webassembly/`.
- `docs/framework/` no longer excluded from .NET (removed from both the deck-routing skip regex
  and the post-parse exclusion regex).
- **New expansion multiple.** `RECALL_EXPANSION_MULTIPLE` env var, **default 8**
  (was a hardcoded 2x). Guided lessons now assert a *floor* (`baseline.lessons * 2`) rather than an
  exact count, and card `target` is `min(candidates, baseline.cards * multiple)`.
  **This env var is the dial to turn if v14 is too big.**
- Two content-cleanliness fixes: reject any section containing `{%` even inside fenced code
  (site templates like `{%wasm-url%}` are not runnable), and normalize CRLF → LF in section bodies
  (a stray CR was hiding fence markers from line-based readers).
- Manifest version bumped 13 → 14.

### `scripts/check-comprehensive-content.mjs` — check relaxed to match
- Growth upper bound raised from `baseline.cards * 5` to `* 8`.
- The unfilled-placeholder guard `[recall]` became `[recall](?!\()` so a legitimate markdown link
  labelled "recall" is not flagged.

## What changed in data (generated, do not hand-edit)
- `src/data/section-packs/reviewed-comprehensive-001..062.json` — modified
- `src/data/section-packs/reviewed-comprehensive-063..165.json` — **new, untracked**
- `src/data/comprehensive-manifest.json`, `section-expansion-manifest.json`,
  `content-report.json`, `content-quality-report.json`, `source-guided-lessons.json` — regenerated
- `src/data/comprehensive-baseline.json` — **unchanged**, baseline correctly preserved
- `tsconfig.tsbuildinfo` — untracked build artifact; it is currently *not* gitignored. Either add it
  to `.gitignore` or leave it out of the commit.

## What did NOT change
No application source (`src/**/*.ts(x)` other than generated JSON), no tests, no docs, no
`package.json`. The loader `src/data/section-expansion.ts` is untouched and picks up the new
chunks automatically via `import.meta.glob` over the manifest's `chunks` list.
