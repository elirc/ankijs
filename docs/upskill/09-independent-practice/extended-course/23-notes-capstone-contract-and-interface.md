# 23. Notes capstone: contract, ownership, and interface evidence

Use workshop unit capstone-typescript, mission lab-capstone-typescript, and [the capstone brief](../../../../public/workshop/capstone-typescript.md). Inspect the [starter server](../../../../public/workshop/capstone/typescript/starter/server.ts), [reference server](../../../../public/workshop/capstone/typescript/reference/server.mjs), [reference interface](../../../../public/workshop/capstone/typescript/reference/App.tsx), and [shared contract](../../../../public/workshop/capstone/contract.mjs). Your independent implementation belongs in a separate workspace. The supplied starter intentionally returns an unimplemented response and must not be overwritten by this workbook.

## Read the brief as observable behavior

A learner creates, searches, edits, and archives personal notes. Another learner must not read or modify those records. Stale edits must conflict rather than silently overwrite. Failed saves must retain the draft. These are separate acceptance dimensions: a working create form does not establish ownership, and a passing API contract does not establish keyboard accessibility or persistence after restart.

The local reference uses x-test-user as a deliberately simple identity adapter. The selected value is trusted only for the controlled teaching environment. It is not a verified session and must not be presented as production authentication. The source itself calls out that replacement checkpoint. Your evidence should preserve that distinction even when all ownership cases under the adapter pass.

The reference stores notes in a Map created with the server. Restarting the process creates an empty store. The persistence checkpoint requires additional implementation and a restart test. Do not claim the reference's successful CRUD journey proves durable storage simply because the requests travel over HTTP.

## Worked trace through the shared contract

The contract first verifies missing identity returns unauthorized, blank and oversized bodies are rejected, and a valid create trims its text and returns a created response. It then attempts a foreign read and patch, expects not found, and confirms the owner's body remains unchanged. The no-mutation assertion is part of the ownership proof, not an optional embellishment.

Two concurrent PATCH requests then carry version one. The contract expects one success and one conflict and verifies the stored version is two. It searches for the saved editor text, checks another user's list is empty, archives at version two, and verifies the archived note leaves the list while remaining readable directly by its owner.

That last distinction matters: archive changes list visibility, not existence. An implementation that hard-deletes the note would fail the final direct-read assertion. A test that only checks list length would miss the difference. Trace every assertion to a requirement before copying the contract into your own project.

## Version checks have a precise scope

The reference requires an integer version on PATCH, returns a bad-request response when it is absent or invalid, and returns conflict when it differs from the current note. For a foreign or missing note, the ownership lookup returns not found before the version check. The response ordering avoids treating a foreign record's revision as something the caller may inspect.

Within the in-memory callback, no await separates the version comparison and Map replacement after the request body has been read. That supplies the local reference's atomic decision under its single-process model. Replacing Map with asynchronous storage requires a database operation that compares and updates under one atomic boundary. A read, await, and unconditional write would reintroduce the stale-write race.

A valid patch that changes no content can still increment the version in this implementation. Decide whether your independent contract preserves that behavior or intentionally changes it, then test the choice. Do not assume every API treats no-op updates identically. Similarly, repeated POST requests have no idempotency key in this reference and can create separate records.

## The interface protects different forms of state

The reference interface uses a request counter for loads, incrementing it for new requests and cleanup. Only the matching request updates notes or an error message. This applies the current-intent principle from chapter three to owner and query changes. A response can be valid HTTP yet obsolete for the currently selected scope.

Saving uses a synchronous ref guard in addition to rendered busy state. It captures the draft, checks response.ok after reading the response, and clears only when the current draft still equals the saved snapshot. Busy state is released in finally. A rejected save keeps draft content, while newer typing can survive success of an earlier snapshot.

These behaviors need UI-level evidence. The shared API contract never renders the React component. A complete capstone includes controlled delayed and rejected requests, a keyboard journey through labeled controls, and a conflict case where the draft remains available for comparison. A green server test cannot stand in for those observations.

## Separate core delivery from extension checkpoints

First implement the local contract and its focused tests. Then add a usable interface with explicit error states. After that, replace the test identity adapter with a verified session boundary and replace memory storage with persistent storage. Each replacement must preserve ownership and concurrency assertions while adding its own evidence.

The supplied reference package has development and build scripts for its small interface, while server.mjs and its contract test use Node built-ins. This workbook runs the dependency-free checks without installing the capstone's dependencies. If a learner chooses to build their own interface, they should inspect and use their isolated project's package setup rather than modifying the main Recall runtime to satisfy a separate exercise.

Deployment and restore are additional milestones. Record the environment, configuration, data schema, restart result, denied cross-user cases, and restoration comparison. A deployment plan is not evidence of a deployment; a local adapter is not a live authentication system. Keep the final claim aligned with the milestone actually completed.

## Graded exercises

**A23-A:** Map every shared-contract assertion to a requirement and add one missing boundary case. Five points require archive-versus-delete and no-mutation ownership evidence.

**A23-B:** Explain the in-memory version-check boundary and design its persistent replacement. Five points require an atomic conditional update and a real conflict outcome.

**A23-C:** Design UI tests for stale search, duplicate save, rejected save, and newer typing. Five points require state observations beyond HTTP status.

**A23-D:** Produce a checkpoint ledger separating local adapter, trusted sessions, persistence, interface, deployment, and restore. Four points require no completion claim for an unrun checkpoint.

## Independent delivery rubric

Award four points for a reproducible contract run against your own implementation, four for adversarial ownership and stale-write cases, four for accessible and recoverable interface behavior, four for durable restart and restore evidence, and four for a clear implementation handoff. A reference-only run can support study but does not earn independent implementation points. Read [the review](reviews/23-notes-capstone-contract-and-interface.md) after presenting your own contract trace.
