# 06. Card merge uses separate clocks and a deletion policy

Read [merge.ts](../../../../src/db/sync/merge.ts), [merge.test.ts](../../../../src/db/sync/merge.test.ts), and [the Card schema](../../../../src/db/schema.ts). Recall's card merge does not choose one whole replica as the winner. It independently chooses content fields and spaced-repetition fields, preserves the earliest creation timestamp, and combines deletion markers under another rule. Each field group has a specific purpose.

## Content and study progress can advance independently

A card's front, back, deck association, note association, and suspension state follow content_updated_at. Due date, stability, difficulty, elapsed and scheduled days, learning steps, repetitions, lapses, state, and last review follow srs_updated_at. An edit to wording and a study review can happen on different devices without requiring one entire row to defeat the other.

The helper compares timestamp strings with greater-than-or-equal, so remote wins a tie for each group. The fixtures use normalized ISO timestamps, whose ordering is suitable for these comparisons. Do not claim arbitrary parseable date strings will always compare chronologically as strings. The merge relies on its timestamp representation; normalization and validation at other boundaries deserve separate scrutiny.

Grouping fields preserves coherent related state. Selecting a remote due date while keeping local stability from an older scheduling state would mix parts of one scheduling calculation. The implementation chooses the scheduling group together. This is more precise than a generic last-write-wins label because the unit of comparison is a field group rather than the whole card.

## Worked trace: newer wording, newer local schedule

The local card has content time ten o'clock, scheduling time noon, and a due date in August. The remote card has content time thirteen o'clock, scheduling time nine o'clock, and a nearer due date in July. The merge chooses remote front and back because its content clock is newer, while retaining the local August due date and corresponding scheduling fields because the local scheduling clock is newer.

This is the scenario named combines remote-newer content with local-newer SRS in the existing test file. Reverse the clock relationships and the selected groups reverse independently. The merged row can legitimately contain values from both inputs. A spread that simply replaces local with remote would lose newer local study progress.

On equal content timestamps with different front text, remote text wins under the explicit tie rule. Swapping the local and remote arguments can therefore change the result on ties. Do not call this function a commutative conflict-free merge without proving stronger assumptions. Its directional tie policy is observable and tested.

## Deletion is not just another content value

NewestTombstone keeps a non-null deletion timestamp when only one side has one, regardless of the other side's null marker. When both have deletion timestamps, it keeps the later string. A newer live content edit does not automatically resurrect a card whose other replica carries a deletion marker.

That policy prevents a simple stale live row from undoing deletion. An explicit restore feature would need a designed rule and perhaps another state representation; setting deleted_at to null in an ordinary merge input is not enough under the current helper. Explain the policy before attempting to repair what looks like a stubborn deletion.

Creation time uses the earlier timestamp across the two card replicas. User ID uses remote when non-nullish, otherwise local. Neither rule authorizes a remote actor. MergeCard assumes its callers have established the appropriate ownership boundary. A data-selection function cannot determine whether an incoming account is permitted merely by comparing fields.

## Other row types deliberately differ

MergeDeck and mergeNote choose a whole row by updated_at, with remote winning ties. They do not use the card's separate content and scheduling clocks. MergeReviewLog keeps an existing local log unchanged because logs are treated as append-only; it adopts remote only when no local log exists. If logs became editable, that policy would need reconsideration.

StripServerFields removes server_updated_at before local use. It is not a general schema sanitizer that strips every unexpected property or foreign owner. The function name can tempt a broader inference than the code supports. Read the exact destructuring and caller validation before claiming all server-only metadata is removed.

These differences are useful teaching evidence: one sync subsystem can contain several legitimate merge policies because its row types have different semantics. Replacing all helpers with one generic newest-row utility could silently break card scheduling or append-only log behavior.

## Laboratory: a field-group matrix

Use complete Card fixtures modeled after makeCard in the test file. Do not omit required fields and then treat an incomplete object cast as proof of a valid application row. Construct four clock combinations: local newer in both groups, remote newer in both, remote content with local scheduling, and local content with remote scheduling. Assert at least two representative fields and the chosen timestamp from each group.

Add equal-clock cases with different values to expose the tie policy. Add one-null and two-non-null tombstone cases, and a creation-time case where the remote row is older. Freeze input objects to observe nonmutation during the call. The resulting card's fields are mostly scalar references, so avoid claiming a universal deep-clone guarantee beyond what the helper constructs.

For append-only logs, create local and remote rows with the same ID but different ratings. The existing local rating remains. Explain why this is not the same rule as remote-on-tie for notes. The lab should teach field semantics, not memorize a single winner slogan.

## Debugging case: advancing the wrong clock

Suppose a content edit updates srs_updated_at instead of content_updated_at. A later merge can treat stale scheduling fields as new while refusing the actual wording change. Even a correct merge helper cannot recover intent that the writer encoded under the wrong clock. Trace [cardRepo's content and review writes](../../../../src/db/repos/cardRepo.ts): content updates advance the content clock, while review application advances the scheduling clock. Writers and mergers must agree on what each timestamp means.

## Graded exercises

**A06-A:** Complete the four-combination field matrix using valid Card fixtures. Five points require representative values and selected clocks.

**A06-B:** Demonstrate directional tie behavior and the tombstone rule. Five points require a case where newer live content does not clear deletion.

**A06-C:** Compare card, note, deck, and review-log policies. Four points require identifying why a generic row winner is insufficient.

**A06-D:** Audit one write path for the clock it advances and propose a regression test for advancing the wrong clock. Four points require connecting producer semantics to merge behavior.

## Hints, before the review

For A06-A, choose different values on both sides so a wrong field selection is visible. For A06-B, null deletion is not a universal undo instruction. For A06-D, inspect the repository write, not only the merge test. Read [the review](reviews/06-card-clocks-and-tombstones.md) after drawing the two independent timelines.
