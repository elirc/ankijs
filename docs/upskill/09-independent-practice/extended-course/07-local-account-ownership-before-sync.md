# 07. Local account ownership before remote synchronization

Read [ownership.ts](../../../../src/db/sync/ownership.ts), [ownership.test.ts](../../../../src/db/sync/ownership.test.ts), and the relevant entry points in [engine.ts](../../../../src/db/sync/engine.ts). Connect them with workshop unit review-owner-filter and [its case file](../../../../public/workshop/review-owner-filter.md). This chapter studies a local safety boundary around account-specific data. It does not claim that a browser-side check replaces verified server authorization.

## An unowned row can still belong to an account's device context

Recall can create local rows with user_id null before they are pushed. It would be unsafe to conclude that every such row is available for whichever account signs in next. The local_owner metadata records the account associated with the local database context, independently of whether every row already carries that ID.

AssertOwnership reads this marker and also searches core tables for nonempty user IDs different from the requested account. Either a mismatched marker or a foreign-owned row blocks the operation. The transaction covers decks, cards, notes, review logs, user state, and sync metadata. Only after these checks pass does it store the requested local owner and clear auth_blocked.

The marker and row scan address different histories. A device can have a marker for Alice while all recently created rows remain unowned. A legacy database can lack a marker yet contain a row explicitly owned by Alice. Bob must be blocked in both cases. Checking only one representation leaves the other history unprotected.

## Worked trace: changing accounts with a private draft

Begin by asserting Alice's ownership, which stores local_owner Alice. Capture a local draft whose row may still have a null user ID. Now attempt assertOwnership for Bob. The marker mismatch causes rejection before replacing the marker. The original Alice marker remains, and no permission to sync that draft as Bob is granted.

In the second trace, begin without a marker and place an Alice-owned row in a legacy database. Bob's attempt fails the foreign-row scan, and no Bob marker is written. The existing tests assert both outcomes. These are persistence observations, not merely checks that a method returned an error message.

The error directs the user toward the original account or a separate browser profile. The workbook should not solve the conflict by automatically erasing the local library or rewriting every owner field. That would turn a protective rejection into data loss or cross-account reassignment. Any migration between accounts needs its own explicit, reviewed workflow.

## Remote calls must follow the local check

The sync loop obtains the client and session and checks connectivity. When synchronization can proceed, it awaits assertOwnership before queuing existing learning state, pushing, or pulling. The ownership test replaces remote from and rpc methods with spies and verifies neither is called when the local account differs. This establishes the placement of the local gate on that tested path.

An error state is a UI observation; the no-remote-call assertions establish the stronger effect boundary. A test that only checks phase error could pass even if some data had already been sent before the error. Pair status assertions with the absence of the forbidden action.

The engine also rechecks session identity and local_owner during sync. AssertSyncSession compares the current session user with the run's captured UID and verifies that the local marker still matches. These checks address an account changing after the initial gate. They are local checks at particular boundaries, not a proof that identity can never change between any two machine instructions.

## Pull filtering and returned-row validation

Pull queries include an equality filter on user_id. After awaiting a page, the engine checks the session again and rejects any returned row whose user_id differs from the captured account. Query filtering and result validation are two distinct observations. The latter can catch a misbehaving test adapter or an unexpected response, while the former requests only the intended account's data.

Neither removes the need for server-side authorization. A malicious client can bypass local code and call a backend directly. A deployed service must derive permissions from verified identity and enforce them at the storage or API boundary. The local notes workshop's x-test-user adapter is intentionally not that production mechanism.

MergeCard's user_id selection is another separate concern. It chooses a value while combining fields; it is not the authorization gate. Placing trust in a merge helper simply because it contains an ownership field would confuse data transformation with permission checking. Trace who validates the source before the helper is called.

## Laboratory: outcomes and forbidden effects

Use the existing fake-indexeddb test setup and generated data only. Reproduce the marker-mismatch case with unowned rows and the legacy foreign-row case without a marker. After rejection, inspect local_owner and the affected row. Assert the data was not relabeled. These tests should remain isolated from any personal browser database.

For the sync entry point, inject a session for Bob and remote method spies while local ownership is Alice. Await syncNow, inspect the error phase, and assert no remote calls. Restore mocks afterward using the test environment's cleanup conventions. Avoid leaving a fake client installed across tests, because shared module state can make unrelated failures misleading.

Design a separate mid-sync account-change test. Hold a remote promise pending, change the mocked session, and release the response. Identify the next assertSyncSession boundary and the expected rejection before merging that page. State exactly which operations may already have occurred before the change; do not overstate a local check as retroactively undoing earlier remote effects.

## Debugging case: clearing the marker to make login work

A developer deletes local_owner whenever a new account signs in, assuming the row scan will be enough. The unowned-draft case now has no foreign row ID and no remembered owner, so a later account may claim data created under the previous context. The test with all rows unowned exists to reject this exact simplification. Metadata can carry security-relevant history even when row values look neutral.

A second shortcut catches ownership rejection and continues in a best-effort sync mode. The error is a stop condition, not an optional warning. A useful review names the first forbidden remote call and supplies the mismatched-account fixture that reaches it.

## Graded exercises

**A07-A:** Trace both marker and legacy-row cases and inspect state after rejection. Five points require no owner reassignment.

**A07-B:** Prove no remote from or rpc call occurs on the mismatched-account path. Five points require effect assertions as well as error state.

**A07-C:** Design a controlled account-change-during-pull test. Four points require identifying the next guard and the limits of earlier effects.

**A07-D:** Explain local ownership, row filtering, merge selection, and server authorization as four separate responsibilities. Four points require a bypass example showing why client checks alone cannot authorize a backend.

## Hints, before the review

For A07-A, null user IDs do not erase the marker's history. For A07-B, spy on the actual client seam used by the engine. For A07-C, locate checks on both sides of the await. Read [the review](reviews/07-local-account-ownership-before-sync.md) after drawing the account and data timeline.
