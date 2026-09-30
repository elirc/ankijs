# 3. Worked trace: preserve content and scheduling independently

Read [merge.ts](../../../src/db/sync/merge.ts) beside [merge.test.ts](../../../src/db/sync/merge.test.ts). This is a pure merge boundary, not a complete account-authorization or transport implementation. The useful question is which decision governs each output field, not whether "remote always wins."

A card separates `content_updated_at` from `srs_updated_at`. The first governs editable content such as front, back, deck, note link, and suspension. The second governs due date, stability, difficulty, counters, scheduling state, and last review. Mixing these groups under one timestamp would allow an ordinary text edit to discard a more recent review or vice versa.

## A concrete trace

Use the existing test named "combines remote-newer content with local-newer SRS." Local scheduling time is noon and its due date is later. Remote content time is 13:00, but its scheduling time is 09:00. The fixture's other values come from `makeCard`; do not omit required schema fields when translating the example into an executable test.

| Decision | Comparison | Source selected | Observable result |
| --- | --- | --- | --- |
| Content | Remote 13:00 versus local 10:00 | Remote | Remote front text |
| Scheduling | Remote 09:00 versus local 12:00 | Local | Local later due date |
| Creation | Earlier creation timestamp | Earliest | Original creation preserved |
| Deletion | Non-null tombstones, then newest | Policy-specific merge | Deletion is not simply cleared by an active row |
| Server metadata | Destructure `server_updated_at` away | Neither | Transport-only field omitted |

First predict the resulting `front` and `due` without running the test. Then reverse which side has the newer scheduling timestamp. Finally set both content timestamps equal. The comparison uses `>=`, so the remote content group wins a tie. A strict greater-than mutation would change tie behavior and should be caught by the existing tie test.

## Boundaries the trace does not settle

String timestamp comparison assumes compatible sortable timestamp representations. The function does not parse every possible human-readable date. Confirm normalization at the system boundary before extending the accepted format. The unit test establishes the supplied canonical representations; it does not prove wall clocks on different devices are perfectly synchronized.

Deletion is another separate policy. `newestTombstone` retains a non-null deletion timestamp even if the other row has none. That is useful protection against accidentally resurrecting a deleted card, but an explicit restoration feature would need a designed contract. Do not "fix" tombstone behavior based solely on what seems newest in one content field.

`mergeReviewLog` keeps an existing local log because logs are append-only here. A future editable-review feature would change that premise. The comment in source makes the assumption visible; your review should name it rather than treating the implementation as universally appropriate for all records.

## Your trace artifact

Create a two-row fixture table with local and remote values for content time, scheduling time, front text, due date, and deletion. Add the expected winner for each field group. Cite the exact helper or branch responsible. Run only the merge test file when checking this trace: `npm test -- src/db/sync/merge.test.ts` with existing dependencies installed.

Then propose a whole-row-wins mutant in a scratch copy and state which existing test would reject it. You do not need to modify the application's real merge policy to demonstrate the reasoning. The result is a source-linked argument: a concrete behavior, the code responsible, a discriminating test, and an explicit limitation.
