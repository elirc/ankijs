# Review 05. Evidence for an import boundary

Return to [the assignment](../05-backup-validation-and-atomic-import.md). Grade the sequence of operations and observed state, not merely the presence of the word atomic in a description. A rejected promise can accompany either a completely untouched database or an accidentally partial import. The state assertions distinguish them.

## A05-A: classify the four cases

An invalid outer shape fails before row validation. An invalid card date passes the container check but fails row validation before transaction writes. A syntactically valid card referring to a missing deck reaches the relational check within the transaction. An older valid backup reaches merging and can succeed while preserving newer local content. Four inputs that look like problematic imports therefore exercise four distinct boundaries.

Full credit requires the learner to state what remains afterward. For the first three cases, the intended existing library remains intact. For the fourth, the result is the policy-defined merge, not necessarily a byte-for-byte copy of the backup. An answer saying that every imported row always replaces its local counterpart contradicts the repository implementation. An answer saying every reference is validated overstates the inspected checks.

## A05-B: staging before commit

A sound Map demonstration copies the starting entries into a draft, stages the first incoming row, injects a failure, and proves the original entries and values remain unchanged. Verify the injected failure actually executes after staging. A malformed first row rejected before staging does not demonstrate the requested failure point. Also test a successful import so an implementation that never commits cannot pass.

The supplied fixture copies row objects when staging incoming records. A learner should still distinguish copying a Map from recursively cloning arbitrary nested objects. The model's proof depends on the mutations performed by that model. Do not claim deep isolation for data structures it never processes. Its main transfer lesson is that the irreversible replacement of live state occurs after successful preparation.

## A05-C: actual database coverage

The application declares decks, cards, notes, review logs, outbox, sync metadata, and user state in the import transaction. A good audit records that table list and then follows the helper calls that operate within it. Listing the tables without following the writes leaves open whether important effects occur elsewhere.

The existing malformed-card test is useful preflight evidence. It is not a demonstrated failure after a successful database write because row validation rejects the malformed date earlier. Round-trip and local-newer tests add positive merge evidence. Imported-owner normalization is another separate contract. Give full credit only when the report labels these claims individually rather than calling the entire test file a rollback proof.

## A05-D: a focused rollback experiment

Use an isolated fake-indexeddb database or disposable scratch environment with a complete before-state. Inject a controlled rejection after at least one intended write has executed within the transaction. Await the repository call and assert rejection, then compare all relevant tables with the before-state. Restore mocks in cleanup so later tests do not inherit the failure. Add a nearby successful case to show the injector is responsible for the rejection.

A strong design explains why the failure is inside the transaction rather than after commit. It also identifies any effects outside the database boundary that would require independent assertions. A rejected notification or logging operation after commit would not establish database rollback. Do not award experimental credit for an unexecuted design; label it a proposed test until the command and results exist.

## Transfer and review conversation

Ask the learner to explain why an older backup can be accepted without becoming the authoritative current state. The answer should connect merge clocks with import semantics. Then ask whether restoring a signed-out backup containing another user's ID authorizes a cloud write. It does not: import normalizes ownership, and later sync has separate ownership and server authorization responsibilities. These questions test whether the learner can carry the boundary beyond the happy-path test.
