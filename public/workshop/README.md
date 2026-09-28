# Recall guided workshop

38 authored units: two capstones, six debugging cases, six code-review exercises, six SQL concurrency labs, six integration labs, six operations cases, and six AI-assisted engineering exercises. Each case file includes prerequisites, runtime, evidence, assignment, hints, reference reasoning and acceptance criteria.

## Start

Node 22.13+:

    node --test checks/*.test.mjs capstone/typescript/reference/server.test.mjs

These tests verify supplied reference fixtures. They do not grade your free-form journal or establish production readiness.

Open the relevant case Markdown file before its reference. Write a hypothesis, run a discriminating experiment, then compare the reference and record your evidence in Recall. Starter code intentionally contains TODOs and does not pass its final contract yet.

## TypeScript / React capstone

In capstone/typescript/starter (or reference):

    npm install
    npm run api
    npm run dev

Use separate terminals for the API and frontend. The reference API starts on 127.0.0.1:4000. Run the shared contract from this pack's root:

    node capstone/contract.mjs http://127.0.0.1:4000

## .NET capstone

Install the .NET 10 SDK. From capstone/dotnet/starter (or reference):

    dotnet run --urls http://127.0.0.1:4000

Use the same contract runner above. The supplied React reference can also call this API through its Vite proxy. Stop one API before starting the other on the same port.

## Capstone checkpoints

1. Define validation and owner-scoped CRUD examples.
2. Pass the shared API contract, including 400, 401, 404 and 409 cases.
3. Implement labeled search/list/editor/archive controls; verify keyboard operation.
4. Preserve the draft after errors and reject stale writes atomically.
5. Replace the explicit x-test-user adapter with a verified session. Test cookie/session expiry and unauthorized direct requests.
6. Replace memory storage with a persistent database. Use an owner predicate and revision comparison in the database write. Re-run contract checks after restart.
7. Rehearse migration, deployment, monitoring and data-compatible rollback.
8. Export and restore into an independent empty store; compare records and a full user journey.

The runnable reference covers the local UI/API contract. It intentionally uses memory storage and test identities. Checkpoints 5–8 are guided extensions: see capstone/production-checkpoints.md for schemas, session boundary design, recovery and acceptance procedures. Do not deploy the test-identity adapter publicly.

## SQL concurrency labs

Use a disposable PostgreSQL 16+ database. Run sql/setup.sql first with psql, then open two psql sessions and follow each case's A/B schedule. Run sql/verify.sql afterward for deterministic constraints and cursor checks. Read each file: setup drops only the recall_workshop schema in the database you explicitly selected. No script connects to a database automatically.

## Files

- checks/: executable reference behavior for debugging, integrations, recovery and validator exercises.
- fixtures/: local fake service, event/inbox/outbox model and input data.
- sql/: runnable schema, concurrency schedules and verification.
- reviews/: supplied PR diffs, also shown in the case files.
- capstone/: starter and reference implementations plus shared contract.

Use one test account and generated sample records. Reference material is original Recall content; external reading links are sources for deeper study, not copied course text.

## Local integration service

Run `node fixtures/fake-service.mjs`, then in another terminal run `node fixtures/send-webhook.mjs evt-42` twice. The second delivery is acknowledged without another balance change. Inspect `http://127.0.0.1:4500/state`. The `/flaky` endpoint returns 429, then 503, then 200 for deterministic retry exercises. Its embedded secret is a public teaching value, never a real credential.
