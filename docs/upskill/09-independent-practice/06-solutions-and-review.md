# 6. Separate solutions and review

Use this chapter to audit reasoning after an attempt. It does not grant a completion mark merely because your wording resembles the reference. Every claim should connect a requirement, an observed result, and a check that distinguishes correct behavior from a plausible shortcut.

## Placement answer criteria

P1 requires ownership of the current result; debounce alone cannot prevent out-of-order completions. P2 requires an atomic ownership-and-version decision at the write boundary and preservation of the rejected draft. P3 requires validation and an appropriate storage transaction; Promise.all only coordinates promises. P4 requires a scoped operation identity, payload fingerprint, concurrent-claim policy, and expiration limits. P5 requires independent content and scheduling comparisons, not a whole-row winner. P6 must separate current catalog authority from historical migration documentation.

Award partial credit when an answer identifies the concept but cannot produce an observable counterexample. Record which next experiment would close that gap. A learner who changes their explanation after a controlled observation is demonstrating useful engineering behavior, not failing the course.

## Exercise review

**E1:** The workshop unit ID is `debug-stale-search`, its mission is `lab-debug-stale-search`, and its deck is the Debugging Workshop deck ending `090002`. The two stable card IDs end `000030` and `000031`. Confirm the full identities in the source and route manifest. The fixture is the existing workshop case Markdown. A title may change while identity persists; changing identity can orphan or duplicate stored progress.

**E2:** A generation counter or equivalent ownership token works when every success and failure commit checks the current generation. Cancellation invalidates outstanding tokens. If parsing is asynchronous, a check before parsing is not enough: a newer request may start during the await. The useful negative test removes or bypasses the check and observes an obsolete callback commit.

**E3:** A conditional write must include record identity, permitted owner, and expected revision in one atomic operation. A zero affected-row outcome needs deliberate missing/inaccessible/conflict handling without disclosing another user's record. The UI should retain the unsaved draft and offer a comparison or reload choice. Blindly retrying the stale text with the latest revision recreates the lost-update problem.

**E4:** Same scoped key and same request can return the original committed result; changed meaning under that identity should conflict. A different authenticated actor has a different scope. Concurrent first attempts require an atomic claim, not two independent cache misses. After expiry, the prior duplication guarantee no longer necessarily applies. State these boundaries before using the phrase "exactly once."

**E5:** Restore into an empty independent destination and verify relationships as well as counts. Equal counts can hide swapped owners or corrupted text. Recovery point identifies which committed writes are present; recovery duration measures time to restore usable service. Successful parsing and checksums provide narrower evidence about the artifact, not a complete operational rehearsal.

**E6:** The route checker validates documentation identities. It cannot observe merge field selection, timestamp ties, or tombstones. The targeted merge suite exercises those behaviors. Likewise, running supplied workshop references is useful baseline evidence but does not execute a learner's independent implementation. The review should ask for the missing relevant evidence without demanding unrelated broad tests.

**E7:** Retirement classification compares a stored hash of original front/back content as well as candidate identity. An edited card should not be treated as an untouched bundled original. `Dexie.waitFor` bridges the external import/hash promises with the caller's IndexedDB transaction. Treat this as a concrete library-specific boundary verified by local source and tests, not a general instruction to put arbitrary network work in transactions.

Finish review by writing one changed assumption, one new discriminating case, and one remaining limit. Keep the earlier attempt; otherwise your evidence journal becomes a polished answer collection instead of a record of learning.
