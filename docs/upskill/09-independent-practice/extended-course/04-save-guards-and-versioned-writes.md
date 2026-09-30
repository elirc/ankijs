# 04. Duplicate invocation, stale versions, and ambiguous delivery

Read workshop cases [duplicate save](../../../../public/workshop/debug-duplicate-save.md) and [stale edit](../../../../public/workshop/debug-stale-edit.md), guardedSave in [the fixture module](../../../../public/workshop/fixtures/reference.mjs), and [the local notes reference server](../../../../public/workshop/capstone/typescript/reference/server.mjs). These sources teach three separate boundaries: preventing simultaneous local invocation, rejecting stale edits, and recognizing retries of one remote operation.

## A rendered disabled button is not the whole guard

The duplicate-save case shows two clicks before the next render disables the button. Both handlers can begin a write if their only protection is visual state updated for a future render. A synchronous closure or ref guard changes before the first await, so the second invocation immediately observes that work is already active.

The supplied guardedSave returns false for an overlapping call, awaits the first write, returns true on its success, and resets its busy flag in finally. If the write rejects, the error propagates but the guard still releases, allowing a deliberate retry. Without finally, one failure can leave the form permanently blocked. Without a synchronous guard, two rapid invocations can both pass.

This helper does not manage the draft itself. The workshop assignment additionally asks you to preserve text on failure and avoid erasing typing that occurred during the save. Capture the submitted draft snapshot and compare it with the current draft before clearing. A successful save of yesterday's snapshot is not permission to erase today's additional typing.

## Worked trace: success arrives after more typing

At time zero, the draft is first and Save captures that string. The write remains pending. The user types first plus a note, changing the current draft. When the original write succeeds, clear the draft only if it still equals the submitted snapshot under your chosen draft identity policy. In this trace it differs, so retain the newer text while reporting that the earlier snapshot was saved.

Now let the first write fail. Preserve the current draft, release the guard, and show a recoverable error. A second intentional Save can capture the current text. Automatically retrying forever would require another policy about side effects and deadlines; it is not part of the simple in-flight guard.

## A second editor is outside that local guard

Two browser contexts can each have their own idle guard and load note version three. Editor A saves and produces version four. Editor B's old draft must not overwrite the new row silently. The stale-edit assignment proposes an expected-version condition checked together with the write, scoped to the owner and record identity.

The local TypeScript reference adapter names that request field version, even though the general assignment describes it as expectedVersion. Follow the actual adapter when testing it: PATCH requires an integer body.version, returns 409 when it differs from the stored note version, and increments the version for a successful patch. A missing integer version returns 400. Do not send an invented field name and call the resulting validation error a concurrency failure.

The adapter first checks whether the note exists and belongs to the test owner, returning 404 for a missing or foreign row. This prevents the version-conflict response from revealing another owner's note. Its x-test-user header is explicitly a local test identity adapter, not production authentication. The in-memory Map also does not establish persistence across restarts or a database transaction design.

## Compare and write must share a boundary

In a database implementation, selecting a version and later performing an unconditional update leaves a race between those operations. The case's conditional UPDATE includes ID, owner, and expected version in the write predicate and checks the affected result. That makes the decision about freshness part of the write itself.

A zero-row result may mean missing, inaccessible, or stale. Distinguish these according to the API's disclosure policy without exposing foreign data. Do not automatically replace the expected version with the latest one and retry the same stale draft: that converts a detected conflict into a lost update. Preserve the draft and offer an explicit reload, compare, or merge decision.

The reference server has no await between its in-memory version comparison and Map replacement, so its single-process request handler demonstrates the intended local check-and-update behavior. That is useful for a workshop but does not prove the same guarantee across multiple processes. A production database implementation needs its own concurrent request test at the actual persistence boundary.

## Lost response is a third problem

If a create request commits but its response is lost, the UI may release its guard after a network error and allow a retry. A new request can create a second row because the server has no stable operation identity linking the attempts. Expected versions on updates do not automatically solve duplicate creates. An idempotency key with a defined actor scope, request meaning, retention period, and atomic receipt boundary addresses that separate problem.

Do not claim the local notes adapter already implements that key protocol; inspect its routes and you will find no such receipt store. The workshop integration-idempotency unit is a separate model explored later in this workbook. Keeping the mechanisms distinct prevents a passing duplicate-click test from being advertised as end-to-end exactly-once behavior.

## Laboratory: three timelines, three assertions

For the local guard, hold the first write pending and invoke Save twice. Assert one underlying call and false for the overlapping invocation. Reject the first, then make a later call succeed. Assert the guard released and draft text survived according to your separate UI model.

For version conflict, use generated notes in the local test server or its existing server tests. Submit two patches with the same starting version and verify one accepted update and one conflict, then inspect the stored text. Also attempt access from another test owner and verify no mutation or leaked current row. Do not deploy the header-based adapter.

For lost response, draw a server-commit/client-error timeline and identify the missing operation identity. The deliverable can be a contract design rather than an unimplemented claim that the current adapter is idempotent. State which test would distinguish a true replay from a second create.

## Graded exercises

**A04-A:** Test pending duplicate invocation and failure release. Four points require a controlled promise and exact write count.

**A04-B:** Preserve newer typing across successful completion of an older draft. Five points require a snapshot comparison and failure case.

**A04-C:** Reproduce the version conflict with the adapter's actual version field. Five points require owner isolation and preserved stale draft.

**A04-D:** Explain the lost-response boundary and specify a separate idempotency contract. Four points require no false claim that a UI guard or version field already supplies it.

## Hints, before the review

For A04-A, set the guard before awaiting. For A04-B, completion belongs to the submitted snapshot. For A04-C, read the request parser and response branches. Read [the review](reviews/04-save-guards-and-versioned-writes.md) after labeling which state each of the three timelines protects.
