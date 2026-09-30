# Review 06. Merging fields with independent histories

Return to [the assignment](../06-card-clocks-and-tombstones.md). The central evidence is a field-level result, not the assertion that the newest card wins. Recall deliberately allows the wording from one record and the schedule from the other to coexist.

## A06-A: the four combinations

When remote content is newer and remote scheduling is older, select remote front, back, deck, note, suspension, and content clock while retaining local scheduling fields and scheduling clock. Reverse those inequalities and the selected groups reverse. When both remote clocks are newer, both groups come from remote. When both are older, both groups remain local. Use visibly different due dates, repetition counts, and wording so a mistaken whole-record selection cannot accidentally satisfy the assertions.

A complete fixture includes the actual Card fields rather than casting an incomplete object and hoping missing values do not matter. The scheduling group includes learning_steps as well as the more familiar due, stability, difficulty, and repetitions fields. The field matrix should explicitly list the selected clocks. If the values are right but the selected clock is wrong, the next merge can make a different and incorrect decision.

## A06-B: ties and deletion

The comparisons use greater-than-or-equal, so a tie selects the remote group. With equal clocks and different values, swapping the local and remote arguments can change the result. This is directional tie behavior; do not claim unconditional commutativity. A learner can demonstrate it with two complete cards whose front fields differ while content clocks are equal.

Deletion has its own rule. If one side has a nonnull deletion timestamp, that timestamp survives even when the other side has later live content. If both sides have deletion timestamps, the later timestamp wins. This prevents a normal live-content update from implicitly clearing the tombstone. The earliest created_at is retained separately. These selections explain why a single maximum updated timestamp cannot describe the entire algorithm.

Use canonical ISO timestamps in the laboratory. The helper compares these fields as strings; its behavior depends on the representation supplied by the surrounding application. Replacing the example with arbitrary human-readable date strings changes the premise. A proposal to support such inputs needs validation or normalization evidence rather than an assumption that all date-like strings sort chronologically.

## A06-C: different record policies

Deck and note merges compare their row-level updated_at and select the winning row, with remote winning ties. Cards split content and scheduling and handle creation and deletion separately. Existing review logs retain the local record; absent logs accept the remote record after the server-only field is removed. An abstract helper that selects one whole record would erase these differences.

StripServerFields removes server_updated_at. It is not a general untrusted-input sanitizer and does not validate arbitrary ownership claims. Likewise, choosing a user_id in a merge result is a data-selection rule, not proof that the caller may access that account. Full credit requires keeping those responsibilities separate from conflict resolution.

## A06-D: inspect the writer

UpdateContent advances the content clock. Applying a review advances the scheduling clock and coordinates the review log with the card update. A regression test for the wrong-clock mutation should establish a card with known clocks, perform the repository operation, and assert that the intended group's clock advances while the other retains its prior meaning. A subsequent merge with competing content or scheduling can demonstrate the practical consequence.

Freeze time or provide controlled timestamps through the available test seam so the assertion is deterministic. Merely checking that two clock strings differ can pass for the wrong reason. The reviewer should ask which user action each clock records and which fields that action owns. Correct merge code cannot repair a writer that labels a content change as a scheduling change.
