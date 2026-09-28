# Ship a TypeScript notes app

Deliver a usable React interface and a permission-checked notes API, then prove it can recover.

Prerequisites: JavaScript functions, React state, HTTP and basic SQL.
Runtime: Node 22+, TypeScript, React; supplied dependency-free API reference
Reviewed: 2026-09-26

## Case evidence

Product brief: a signed-in learner creates, searches, edits and archives personal notes. A second learner must never read or change the first learner's records. A stale edit must return a conflict rather than overwrite newer text. The UI must preserve the draft after a failed save.

The supplied starter and reference use a local header-based test identity to make ownership tests reproducible. This is a test adapter, not production authentication. Before deployment replace it with a verified server-side session; never trust a client-supplied user ID.

## Assignment

Download the workshop pack. Start in capstone/typescript/starter. Work through these checkpoints:
1. Write examples for valid, blank, oversized, and non-owner requests.
2. Implement GET/POST/PATCH routes and a version field.
3. Create a React list, labeled editor, search and archive controls.
4. Keep a draft on 400/409/500 and show an actionable message.
5. Wire a trusted session identity at the server boundary.
6. Run the shared contract checks against your API. Add an accessible keyboard journey.
7. Replace the in-memory repository with persistent storage and test restart.
8. Export notes, restore into a separate empty store, compare ownership and content, and document deployment/rollback.

## Hints

- Implement the contract before styling.
- The revision comparison and update must share one atomic boundary.
- Keep the local test-identity adapter visibly separate from session verification.

## Reference explanation

The reference server demonstrates validation, ownership, version checks, search and archive. The React reference separates editable draft state from saved server state and checks response.ok before success. Read its limitations: test identities, memory storage and no deployed session service. Production readiness requires the persistence/session checkpoints; a green local contract suite alone does not establish that.

A useful final work sample includes a schema diagram, the denied cross-user requests, a stale-save trace, a passing UI journey, and a backup/restore comparison.

## Acceptance criteria

- [ ] CRUD and search work through the UI with labeled controls and recoverable failures.
- [ ] Cross-user and stale-write contract cases fail safely without mutation.
- [ ] Persistent storage, session verification, deployment and restoration evidence are documented.

## Further reading

- https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis
- https://react.dev/learn
