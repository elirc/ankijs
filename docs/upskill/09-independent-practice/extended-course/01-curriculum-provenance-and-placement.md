# 01. Curriculum provenance and an evidence-based route

Recall contains learning content, runnable workshop fixtures, application code, and historical inventories. Those are related but different sources of truth. Begin with [the current catalog composition](../../../../src/data/curriculum-catalog.ts), [card construction](../../../../src/data/curriculum.ts), [workshop units](../../../../src/data/workshop-units.json), and [mission construction](../../../../src/data/workshop.ts). This chapter teaches you to trace a learning activity through its real identifiers before treating a route, count, or completion marker as evidence.

## Four identities describe one activity

The workshop unit debug-stale-search belongs to deck a0000000-0000-4000-8000-000000090002. Its two card IDs are f0000000-0000-4000-8000-000000000030 and f0000000-0000-4000-8000-000000000031. Its mission ID is lab-debug-stale-search because workshop.ts prefixes every unit ID with lab-. Its case file is /workshop/debug-stale-search.md, served from the public directory.

These are not interchangeable identifiers. A deck groups cards. A card is an individual study item whose stable identity matters to progress. A unit groups the workshop's question, evidence, task, solution, and rubric. A mission is the independent-work representation produced from that unit. A filename can help navigation without being the identity used by progress records.

Changing a label is therefore different from changing an ID. A renamed title can preserve the same learning item, while assigning a new card ID can make installed progress look like a different item. This workbook does not alter those identities. Your documentation exercises should reference them and verify their relationship rather than create replacement curriculum entries just to organize study.

## Worked trace from catalog to mission

Start with the workshop deck catalog. Curriculum-catalog.ts combines the original and expanded deck catalogs, adjusts their counts using the section expansion manifest, then appends workshop catalog entries. Its getDeckInfo lookup is built from this resulting current collection. A large older inventory table is not what this function reads to decide which decks exist.

Next inspect loadStarterCards. It constructs content from the original curriculum, expanded cards, section expansion, and workshop units. For each workshop unit, it adds two authored cards to the unit's deck using the unit's supplied card IDs. The first uses question and answer; the second presents evidence and asks what to change and how to verify it. That second card is not itself proof that the learner performed the experiment.

Finally inspect workshopMissions. Each unit becomes a mission with a derived ID, a stage, a task, checks from its rubric, and a reference review. The unit's group determines the broad stage: capstones build independently, operations and AI-assisted engineering own the outcome, and the remaining groups make it reliable. This is a routing choice in source, not a certification system.

## Current content and historical explanation

[CURRICULUM.md](../../../CURRICULUM.md) explicitly labels a historical v8 inventory and describes later retirement and correction passes. Read those sections as history. A file's continued existence does not prove its content is selected by the current catalog or installed on a particular device. Conversely, an installed device can contain user-created or older data whose presence differs from a fresh starter catalog.

Use three separate questions: what is authored in the current source; what does the installation or migration path select; and what is actually stored on this device? A source catalog check answers the first question. A migration test can address part of the second. Inspecting an isolated test database or a user-authorized browser state addresses the third. Do not collapse these into one count quoted from a README.

The existing [route manifest](../routes.json) pins four routes using real deck and workshop identities. Its [checker](../verify-routes.mjs) reads current catalogs and unit metadata. Running it establishes that the route references agree with those source files. It does not open the app, install decks, complete missions, or evaluate your independent solution.

## Placement through observable tasks

Before selecting a route, attempt four short tasks without opening solutions. First, explain why an older successful search and an older failed search can both be obsolete. Second, describe the atomic boundary needed when a backup imports several related tables. Third, predict how a card should combine newer content from one replica and newer scheduling from another. Fourth, explain why a successful remote push must not remove a newer local outbox entry captured under the same row ID.

Score each task from zero to three: zero for no model, one for a plausible slogan, two for a concrete trace, and three for a trace plus a test that would reject the wrong behavior. Low scores on the first task route you through the asynchronous chapters. Gaps on the second require transaction work. Gaps on the third or fourth require reading actual sync code rather than only workshop descriptions.

This placement is a planning aid, not a professional ranking. A learner who recognizes every term but cannot construct an adversarial trace should start with the corresponding lab. A learner who can independently produce and explain the trace can move ahead while retaining a small regression check for the concept.

## Laboratory: build a source provenance sheet

Choose debug-stale-search, debug-partial-import, and review-false-positive-test. For each, record unit ID, deck ID, both card IDs, derived mission ID, public fixture path, and the function that constructs its mission. Verify the referenced files exist. Keep this sheet in your own evidence directory, not in the application's curriculum tables.

Then choose one historical inventory row and explain why its presence alone cannot establish current availability. Trace the actual catalog import path instead. Do not delete historical files or reinstall retired content as part of this read-only investigation. The learning goal is source interpretation, not a curriculum migration.

Add a deliberately wrong route entry in a scratch copy and show that your checker rejects it. Test an unknown unit ID separately from a correct unit with the wrong card IDs. These are different failures: the former loses the activity entirely, while the latter associates the activity with the wrong stable study records.

## Debugging case: a green route check is misreported

A contributor changes mergeCard but reports that verify-routes passed. The command only validates curriculum references, so it cannot establish merge correctness. A reviewer should name the missing evidence and point to merge.test.ts or a focused independent trace. Avoid the vague response to add more tests; specify the behavior and implementation the current command never exercised.

## Graded exercises

**A01-A:** Produce the three-unit provenance sheet. Six points require exact identities and real file paths, not copied display labels alone.

**A01-B:** Trace current catalog composition and distinguish it from historical inventory. Four points require separating source, installation, and stored-device questions.

**A01-C:** Complete the four-task placement with one counterexample per weak area. Four points require observable outcomes rather than self-rated confidence.

**A01-D:** Demonstrate an invalid route reference being rejected in a scratch check. Four points require preserving all runtime catalogs and explaining the check's limits.

## Hints, before the review

For A01-A, follow unit metadata rather than guessing card IDs from a numeric suffix. For A01-B, imports reveal the current composition. For A01-C, draw two actors or two completions whenever order matters. Read [the review](reviews/01-curriculum-provenance-and-placement.md) after recording your initial route and evidence gaps.
