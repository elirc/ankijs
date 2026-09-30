# 04 — Commands and host quirks

## Environment
- Windows 11, PowerShell primary; a Bash (Git Bash) tool is also available.
- Repo: `C:\Users\Owner\Desktop\ankijs`. Node/npm via `npm run <script>`.
- **Vercel CLI is not installed.** Deploy targets configured: `vercel.json` and `netlify.toml`.

## Heap and timeouts

Content scripts need a raised heap and exceed a 2-minute tool timeout. Run them in the background:

```bash
NODE_OPTIONS=--max-old-space-size=8192 npm run content:check   # several minutes
NODE_OPTIONS=--max-old-space-size=8192 npm run build
```

## Regenerating content

```bash
# Full regeneration from the pinned local archives (reads tar.gz in artifacts/, no network):
npm run content:expand-all
#   = python scripts/read-source-archives.py
#   → node scripts/build-comprehensive-content.mjs
#   → node scripts/build-reviewed-content.mjs

# Change the size of the expansion (default 8):
RECALL_EXPANSION_MULTIPLE=4 npm run content:expand-all
```

The parse cache lives at `artifacts/comprehensive-parsed.json` and is keyed on parse logic +
source revisions + retained baseline. Editing the caching/archive-loading plumbing no longer
invalidates it (the `// parse-key:ignore-start/end` regions). Editing actual parse rules does.
If you suspect a stale cache, delete that file and accept a slow cold parse.

`read-source-archives.py` also writes `artifacts/comprehensive-sources-index.json` (small,
provenance only). The build reads the index; only a cold parse reads the 167 MB
`comprehensive-sources.json`.

## Verification

```bash
npm run typecheck
npm run content:check                       # four structural stages
npm run build                               # tsc + vite + PWA
npm run content:runtime                     # standalone IndexedDB harness (vite build + node)
npm run test                                # Vitest — known not to start its worker on this host
npm run test:e2e                            # Playwright, expects 127.0.0.1:4173

# Real-browser comprehensive UI pass — needs a production preview running first:
npm run preview                             # then, in another shell:
RECALL_TEST_URL=http://127.0.0.1:5183 node scripts/check-comprehensive-ui.mjs
```

Ports used by prior runs: dev `5182`, production preview `5184` (v13 run) / `5183` (harness
default), Playwright `4173`. Browser storage is per-origin, so a port change means a fresh install.

Browser results land in `artifacts/comprehensive-ui-results.json`; screenshots use the
`artifacts/comprehensive-*.png` prefix.

## Committing

Nothing is committed. When the work is verified:

```bash
git add scripts/ src/data/
# do NOT add tsconfig.tsbuildinfo
git status --short | wc -l    # expect ~174
```

Commit messages in this repo end with:

```
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: <session url>
```

Recent history for tone: `38d8b59 Expand reviewed curriculum and improve offline study loading`.
