# Loading performance

Recall keeps install data and lesson bodies out of the application shell. Browse screens use `curriculum-catalog.ts`; the original cards and workshop explanations load when installation or their learning screen needs them. Generated metadata is checked against its source with:

```sh
node --experimental-strip-types scripts/build-startup-data.mjs --check
```

After editing original decks, workshop units, or engineering checks, regenerate their catalogs with the same command without `--check`. The check also verifies that published starter cards do not still require a historical text correction.

The boot path reads only the curriculum version marker on returning visits. The installer is dynamically imported on first installation or upgrade. Requests within one tab share one installation promise; the complete library and its sync queue still commit atomically. An empty library skips archived retirement/correction work because it contains only current content. Existing decks or cards always keep the migration path, including edits, reviews, and intentional deletions.

The app shell shares a small in-flight save registry with the practice journal. Full mission validation loads when a journal is opened or merged, and `Dexie.waitFor` keeps a sync transaction alive during that import. The optional sync interface loads only when sync is configured. Background curriculum upgrades begin after the existing library can render.

Today uses the dashboard's existing global counts. It loads a separate study queue only when a focused path is selected, avoiding a second complete read of cards, decks, and review history on the default home screen.

When opening `/`, the Home module downloads concurrently with the storage check. Other routes keep Home deferred. A failed prefetch is handled separately from storage failures, and normal route error handling still applies when rendering.

Measure a production build with:

```sh
node scripts/measure-startup.mjs --check
node scripts/benchmark-startup.mjs --check
```

The byte check totals the entry script and `modulepreload` assets in `dist/index.html`. It excludes route-specific requests, CSS, first-install data, and service-worker cache traffic. Before this refactor the total was **642,267 bytes**, or **202,334 bytes gzipped**; the exact asset list is in `startup-performance-baseline.json`.

The browser script runs one fresh profile and three reloads against a local production server. It records time until the Today heading is visible, requested scripts, and transfer sizes. Service workers are blocked for this measurement so their background precache does not affect the comparison; the separate browser regression suite checks offline behavior. It asserts that a fresh installation does not request archived corrections and that repeat visits do not fetch the installer or full lesson bodies. It does not enforce a wall-clock threshold.

The recorded fresh-install time fell from **28,179 ms to 15,384 ms** in this sample. Repeat opens did **not** improve: the median changed from **1,312 ms to 1,451 ms**, with new samples of 1,451, 1,332, and 2,036 ms. This Windows host was under substantial memory pressure, so these timings do not establish a general latency improvement. `startup-timing-baseline.json` and `startup-timing-current.json` document the conditions and individual samples. The payload reductions below provide separate, reproducible evidence independent of that host load.

## Production payload results

| Entry script and preloads | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Uncompressed JavaScript | 642,267 bytes | 409,348 bytes | 36.3% |
| Gzipped JavaScript | 202,334 bytes | 123,863 bytes | 38.8% |

The exact new asset list is in `startup-performance-current.json`. This measures the initial shell; route-specific code and first-install data remain separate downloads.

The Effect section now has 1,002 activities across 23 projects, including nine new Fundamentals and System design labs. The [content report](effect-content-report.json) measures activity and prose growth separately. Its compact catalog loads with the section; worked examples, recall answers, and detailed project guides stay in separate per-project modules. Full-text search loads on the first query. Results render 24 activities per page; memoized journal summaries avoid repeated progress scans while typing. The service worker still precaches guide and search modules so unvisited activities remain available after offline installation completes. Those background cache downloads are excluded from the startup timing benchmark. The timing samples above were recorded during the startup refactor, before the nine reinforcement labs were added.
