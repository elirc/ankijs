# Review 15. Offline is a stateful lifecycle claim

Return to [the assignment](../15-offline-startup-and-update-notifications.md). A correct report names the starting installation state and the asset path tested. Avoid accepting a broad offline claim from a single warm-browser demonstration.

## A15-A: three library states

A current version marker lets preparation return. An empty library requires awaited initialization and displays progress before ordinary use. An existing older library schedules an optional upgrade, permits the installed library to render, and retries failed upgrade work after an online event. Network failure therefore has different implications in each state.

Full credit requires separating first installation from an existing-library upgrade. A user with installed data can retain useful study behavior even when optional new assets are unavailable. That does not establish that a brand-new browser with no cached resources can install the entire application offline. Record the database and cache before-state in the experiment.

## A15-B: configured versus observed assets

The PWA configuration includes precache patterns, size limits, and explicit install-only chunk exclusions. Supabase requests use NetworkOnly. These are source-level intentions that should be checked against emitted assets and the installed service worker when making a production claim. A pattern alone cannot prove that a file exists, fits the size limit, or belongs to the currently active worker version.

The ignore list does not mean a resource can never be fetched by any browser mechanism. It means the configured precache excludes that pattern. Likewise, NetworkOnly for the cloud service does not prevent local IndexedDB from supporting study while offline. Keep the storage systems and their responsibilities in separate columns.

## A15-C: remember an early event

NotifyAppUpdate sets state before dispatching its event. The toast initializes from that state and registers a listener, then rechecks availability. An update arriving before mount can therefore still be shown. The focused test verifies the early-notification case and the user's Reload action emitting recall:apply-update.

Main consumes that command event and calls updateSW(true). The component test does not activate a real worker or demonstrate successful download of a deployed build. Its claim is narrower and still valuable: notification timing and UI command dispatch work in the component environment. A real-browser update drill would add service-worker lifecycle evidence.

## A15-D: pending work and warm caches

The shell checks hasPendingPracticeWrites in beforeunload. It requests protection when a registered save is pending. It does not synchronously flush all data or persist every unsaved draft. A controlled test should hold a registered operation, inspect the handler behavior, release it, and verify the marker clears only after the latest operation settles.

For offline evidence, separate a warm installation where screens were already visited, an existing library facing an upgrade, and an empty profile. Use disposable storage rather than erasing personal study data. After reopening, inspect persisted content, not only a save notification. A successful warm test remains useful when accurately labeled; it simply does not cover every other lifecycle state.

## Error-classification review

Ask why a failed home-screen prefetch should not become a storage-permission message. The answer should trace the independent caught promise and the library-preparation chain. Ask what an online retry listener guarantees if the user remains offline. It registers a future opportunity; it does not make unavailable assets immediately appear.

A strong submission includes a startup dependency graph, cache configuration observations, an update event timeline, and a pending-save timeline. These artifacts support distinct claims. Combining them under a single success badge hides the conditions under which each was established. The goal is a user-facing promise that matches tested behavior, not a longer list of technologies named in the build configuration.
