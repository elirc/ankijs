# The app opens but a screen will not load

Distinguish cached shell availability from lazy-asset availability.

Prerequisites: HTTP caching, Browser DevTools.
Runtime: Production PWA build
Reviewed: 2026-09-26

## Case evidence

The home page is cached. A deployment removes an old hashed chunk. An already-open tab navigates to a lazy screen while offline: Failed to fetch dynamically imported module. Local cards still exist in IndexedDB.

## Assignment

Record the failing chunk URL, installed service worker version and cache contents. Add a recoverable error screen. Test both warm offline navigation and an old open tab after deployment.

## Hints

- A reload can recover online; it cannot fetch a missing asset offline.
- Do not clear IndexedDB to fix an asset failure.

## Reference explanation

Precache required lazy assets, keep old assets available during rollout where the host permits, and prompt before replacing an active app. Catch chunk/render failures with a boundary that explains retry behavior and preserves data. Verify production builds; a dev server is not evidence of service-worker behavior.

## Acceptance criteria

- [ ] All core routes open after a completed offline install.
- [ ] The error screen preserves user data.
- [ ] An old-tab deployment case has an explicit recovery path.

## Further reading

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
