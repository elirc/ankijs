# 4. Debugging laboratory: stale work and partial imports

The case files and executable references are already supplied. Read [debug-stale-search](../../../public/workshop/debug-stale-search.md) and [debug-partial-import](../../../public/workshop/debug-partial-import.md) before opening [reference.mjs](../../../public/workshop/fixtures/reference.mjs). The [debugging checks](../../../public/workshop/checks/debugging.test.mjs) validate these reference models, not arbitrary changes in your browser UI.

## L1: Establish who owns a completion

Draw a timeline: start A, start B, commit B's success, then receive A's success. A correct active view still represents B. Add an obsolete rejection from A and ask whether it can replace B with an error. This second case is often omitted when someone fixes only the happy response branch.

The reference uses a generation-like gate: `start` returns an identity, `commit` applies a callback only for the current identity, and `cancel` invalidates remaining work. Before executing the check, predict whether each callback runs. Keep a list of committed labels so you can distinguish "final view happened to be right" from "obsolete callbacks never committed."

Debounce controls how often work starts. Cancellation can reduce unnecessary work. The identity check controls which result may commit. These are related tools with different jobs. In your independent implementation, invalidate work during cleanup and check identity again after parsing or another awaited step. An aborted network request does not guarantee every subsequent continuation vanished.

Run the bounded reference check from the repository root: `node --test public/workshop/checks/debugging.test.mjs`. Record it as reference evidence. To establish your own implementation, import a scratch module into your own test with deliberately controlled completion order. Avoid timing sleeps as the sole control: explicit deferred promises make the schedule reproducible.

## L2: Locate the actual transaction

The partial-import case asks for all-or-nothing behavior across dependent records. Read the unit test asserting "mid-import failure leaves the original store intact." Its Map-based model illustrates staging and commit; it is not proof of IndexedDB's real transaction behavior.

Follow the idea into [dataRepo.test.ts](../../../src/db/repos/dataRepo.test.ts). The backup contains decks, cards, notes, and review logs. A malformed record must not leave earlier valid rows installed. A newer local card must not be clobbered by an older backup. Those are distinct invariants: atomicity concerns partial writes, while merge policy concerns which valid content wins.

In a disposable test store, save a complete before snapshot, inject a failure after one dependent write, and compare every affected table after rejection. Checking only the first table is insufficient. Await the rejected operation so the assertion participates in test completion. A catch handler that logs an error cannot itself roll back already committed transactions.

## L3: Write a useful failure report

Report symptom, controlled schedule or input, precondition, hypothesis, actual observation, and the boundary you changed. Include one adjacent behavior that must still hold: a new active request can succeed after cancellation, or a valid import survives reload. Avoid real personal backups in the report; generated sample records are enough to demonstrate the invariant.

Close with a limits statement. A passing reference fixture supports the model. A repository test supports its configured storage adapter. A browser reload check supports a particular runtime journey. These layers complement each other, but none should be silently renamed "all users' data is safe." That precision is part of the learning outcome.
