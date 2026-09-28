# Ship an ASP.NET Core notes app

Build the same notes contract using ASP.NET Core and defend the service lifecycle.

Prerequisites: C# records and async, HTTP endpoints, Basic SQL.
Runtime: .NET 10 SDK; supplied Minimal API starter, reference and contract runner
Reviewed: 2026-09-26

## Case evidence

Use the same product brief and JSON contract as the TypeScript capstone. Routes use /notes and /notes/{id}; PATCH includes an expected version. Invalid input returns 400, inaccessible IDs return 404, and stale revisions return 409. A trusted owner identity is mandatory.

The supplied local reference uses an explicit test header and a synchronized in-memory store. Neither is a production identity or persistence solution.

## Assignment

Start from capstone/dotnet/starter and implement the shared contract. Add eight checkpoints: DTO validation; owner-scoped reads; atomic versioned writes; async repository boundaries; a React or Razor UI with retained drafts; API contract tests; EF Core persistence plus a migration rehearsal; and deployment plus a clean-store restore. Run the Node contract runner against both implementations to find accidental contract differences.

## Hints

- Use distinct request DTOs rather than binding a stored entity directly.
- Use a conditional SQL update or concurrency token when replacing the reference store.
- Propagate cancellation to I/O while keeping transaction semantics explicit.

## Reference explanation

The reference Minimal API uses immutable records, validates trimmed text, obtains the owner at the boundary, and performs the revision comparison inside its store lock. The lock is sufficient only for this single-process memory fixture. EF Core/database concurrency must replace it for multiple instances. Return 409 with a useful conflict response and let the learner choose whether to reload or reconcile their draft.

Compare both language implementations using identical requests rather than expecting identical internal architecture.

## Acceptance criteria

- [ ] The shared contract passes for both authorized and denied requests.
- [ ] The UI handles a 409 without silently discarding the draft.
- [ ] EF Core migration, cancellation, deployment and restore evidence are recorded.

## Further reading

- https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis
- https://react.dev/learn
