# Review 24. Defend the evidence boundary

Return to [the assignment](../24-independent-sync-and-recovery-capstone.md). This guide supplies review criteria rather than a completed learner harness. The final milestone is an independently produced trace whose claims another engineer can reproduce.

## A24-A: identity and ownership map

The card's content and scheduling clocks represent different changes. A practice mission has its own stable identity and mirrored user-state representation. An outbox entry combines a database identity with a freshness marker. A local owner marker carries account history beyond null row ownership. The backup artifact identifies a particular coverage boundary. Full credit requires these distinctions before the timing experiment begins.

Mark the transaction tables for each operation and the awaits that cross into other work. Adjacent repository calls do not automatically form one transaction. The map should identify where the application can commit one step before the next step fails, rather than drawing a single reassuring box around the whole user story.

## A24-B: old acknowledgment

Capture generation one, enqueue a newer generation, and clean up using the old capture. The queue remains. Capture the current generation and clean up without another edit; it disappears. Same-timestamp proposals should still produce distinguishable freshness under the helper's valid-date rule. Assert identity and marker as well as count.

A meaningful faulty variant deletes unconditionally or reuses the old marker, and the learner's assertion must reject it. This demonstrates that the test observes newer-work preservation. Keep the mutation in the scratch harness and label it clearly. It is not a runtime change to Recall or a replacement of a supplied learner answer.

## A24-C: account and restoration evidence

For an initial Alice/Bob mismatch, expect blocked sync and no client from or rpc calls, with local ownership unchanged. An in-flight switch has a narrower post-response application claim. Do not reuse the no-request assertion after a request was intentionally sent before the switch.

An empty restoration compares artifact-derived data independently. A populated merge test demonstrates preservation of newer local records. Keep them separate. Include representative content, scheduling, mission evidence, and ownership normalization, and retain the source. A rejected malformed artifact should leave the relevant before-state intact; identify whether rejection occurred before writes or during the transaction.

## A24-D: handoff quality

List commands and completed outcomes, fixture identities, environment, and limitations. Reference checks, independently authored assertions, browser observations, and live-service tests are different evidence categories. A runner failure before assertions is infrastructure evidence, not a passing suite. An unrun test design remains a design even when its reasoning is sound.

The final rubric requires at least three points in every category before treating the work sample as complete. A strong total cannot compensate for missing reproducibility or unsafe data handling. The purpose is to identify a concrete revision task, such as adding a no-effect assertion or clarifying a transaction boundary, rather than awarding a vague impression of competence.

## Closing review conversation

Ask the learner to explain one surprising result, one faulty variant their tests caught, one assumption they corrected after reading source, and one meaningful behavior they did not verify. Then ask another reviewer to reproduce one command from the packet without verbal help. These observations show whether the work sample communicates a defensible engineering conclusion rather than merely collecting green output.

Completing this workbook's documentation and reference checks does not complete these independent learner exercises automatically. The learner's own implementation, predictions, and evidence remain theirs to produce and preserve.
