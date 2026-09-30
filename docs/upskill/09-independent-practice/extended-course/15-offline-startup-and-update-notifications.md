# 15. Offline startup, lazy assets, and update notifications

Read [main.tsx](../../../../src/main.tsx), [vite.config.ts](../../../../vite.config.ts), [appUpdate.ts](../../../../src/lib/appUpdate.ts), [UpdateToast.tsx](../../../../src/components/UpdateToast.tsx), and [the toast test](../../../../src/components/UpdateToast.test.tsx). Offline capability is a collection of concrete paths through startup, storage, asset availability, and optional services. A service-worker registration alone does not prove that every first visit and every upgrade works without a network.

## Start with the user's existing state

PrepareLibrary first checks the current curriculum version marker. If present, it returns without doing the installation work. If no decks exist, it loads the seed module and awaits initialization while rendering progress. A first installation needs the data required to create a useful local library before the normal interface becomes available.

If decks already exist but the version marker is absent, the function schedules an upgrade after a short delay and lets the existing library render. The upgrade catches failure and registers a one-time online listener to retry. This branch preserves use of the installed collection while optional new data is unavailable. It is a different promise from guaranteeing that a brand-new offline browser can install all content.

Build a state matrix with an empty database, an existing older library, and a current library. For each, record which imports and writes must finish before rendering. Then add network available and unavailable as another dimension. This matrix is more useful than a single checkbox called offline because it identifies the path on which a failure occurs.

## The boot graph determines what must download

Main defines routes using React.lazy and dynamic imports. The current route loads the relevant screen while other screens can remain deferred. On the home path, loadHomeScreen is started while IndexedDB opens, allowing independent work to overlap. Its prefetch failure is caught so it does not become a misleading storage error from the library-preparation chain.

This is an important error-classification boundary. A network failure while fetching a screen module is not the same as inability to open local storage. Combining both into one generic catch can tell a user to change storage settings when the actual problem is an unavailable asset. Trace which promise is allowed to reject which chain before proposing a more helpful message.

The main shell renders through an error boundary and route-level Suspense fallbacks. Those mechanisms handle rendering and loading states at their own layers. They do not certify that a lazy asset was cached during a previous session. Asset availability still depends on the generated build and service-worker lifecycle.

## What the cache configuration actually says

The PWA configuration uses prompt registration and precaches the configured asset patterns, including workshop files. It sets a maximum cacheable file size and explicitly ignores several install-only data chunk patterns, including expanded cards, retired retrieval hashes, and content corrections. These exclusions reduce mandatory precache work for data that can be installed into IndexedDB or loaded for migration.

Do not translate the ignore list into a claim that those resources can never be fetched or cached by any browser mechanism. It describes the configured precache behavior. Likewise, a glob pattern is not proof that the emitted build contains a matching file below the size threshold. A complete production audit inspects generated assets and the actual installed worker.

Supabase URL requests use NetworkOnly. The local database remains the offline study store; the configuration does not turn cloud API responses into a general offline cache. This separation helps avoid interpreting a stale cached authenticated response as fresh account data, but server authorization and local ownership still require their own controls.

## Worked trace: an update arrives before the interface

NotifyAppUpdate sets a module-level boolean and dispatches recall:update-available. If the event occurs before UpdateToast mounts, a listener-only component would miss it. The actual component initializes its visible state from hasAppUpdate and checks that state again after registering its listener. The boolean preserves the occurrence across that mount boundary.

The focused test renders and unmounts a toast, calls notifyAppUpdate, then renders again. It expects the update message to be visible and clicking Reload to emit recall:apply-update. Main listens for that event and calls updateSW(true). The test verifies the notification and command event; it does not install a real service worker or prove that the browser has activated a new deployment.

The two event names represent different directions. Update available announces information from the update mechanism. Apply update is a user-requested action sent back to it. Swapping or conflating them could produce a loop or an update that activates without the intended interaction. Document the producer and consumer of each event.

## In-flight practice data and reload

The application shell imports the small practiceWrites module to observe pending saves without eagerly loading mission catalogs. Its beforeunload handler prevents the default unload behavior and sets returnValue when a practice write is pending. This is a protective signal to the browser, not a synchronous flush of every future write.

The promise Map and its lifetime were studied in chapter eleven. Connect those facts to reload: a marker must remain until the latest registered save settles, even if an older save finishes first. Removing the marker too early can suppress the warning during exactly the window where data is still in flight. The shell's protection cannot make an unregistered mutable draft durable by itself.

A browser may govern how unload prompts are displayed. Therefore a unit test of the event handler is narrower than a real-browser test of user interaction and navigation. State which environment you used and whether you observed persisted data after reopening, not merely whether a mock preventDefault was called.

## Laboratory: four independent failure injections

First, simulate the update event before component mount and verify the stored flag makes it visible. Second, reject the home-screen prefetch and verify your reasoning keeps that rejection separate from the library-storage error chain. Third, prepare an existing library and reject optional upgrade loading, then inspect the retry registration and continued availability of existing data. Fourth, hold a practice save while requesting navigation and inspect the pending-work protection.

These are designs for focused tests or disposable browser sessions. Do not clear the user's only local database to create the empty-library case. Use an isolated profile or test storage. Keep a before-state and identify which part of the lifecycle each injection targets so a failure in one does not obscure another.

## Debugging case: an apparently complete offline demo

A developer opens every screen online, disconnects, and successfully revisits them. The result is useful evidence for a warm installation. It says little about a first visit, a newly deployed lazy chunk, or a migration chunk excluded from precache. Expand the report into cold, warm, and upgrade scenarios rather than discarding the successful observation or overgeneralizing it.

## Graded exercises

**A15-A:** Build the three-library-state startup matrix under available and unavailable network conditions. Five points require the actual awaited versus deferred upgrade behavior.

**A15-B:** Trace precache exclusions and NetworkOnly cloud requests. Five points require separating configuration intent from emitted-asset evidence.

**A15-C:** Reproduce an update arriving before mount and identify both event directions. Five points require stating what the focused component test does not prove.

**A15-D:** Design a pending-practice reload test and a warm-versus-upgrade offline experiment. Four points require isolated data and distinct lifecycle claims.

## Hints and transfer

For A15-A, inspect the deck count branch. For A15-B, read ignores as well as patterns. For A15-C, an event is not remembered unless state records it. Read [the review](reviews/15-offline-startup-and-update-notifications.md) before evaluating another progressive web application's offline promise.
