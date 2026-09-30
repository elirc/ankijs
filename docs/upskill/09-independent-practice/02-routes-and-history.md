# 2. Current routes, stable identities, and historical material

The current browsing catalog is assembled by [curriculum-catalog.ts](../../../src/data/curriculum-catalog.ts). It combines original, expanded, and workshop catalogs, with section additions from the manifest. [curriculum.ts](../../../src/data/curriculum.ts) separately assembles card bodies and workshop questions. This split is a useful architectural distinction: browsing metadata need not load every lesson body, and a source inventory is not the same operation as installing cards.

## Guided routes

The following deck IDs are exact. Their names help navigation; the identity is what connects a route to source data. Workshop mission IDs add `lab-` to the unit ID in [workshop.ts](../../../src/data/workshop.ts). That prefix identifies the engineering mission, not a new flashcard deck.

| Route | Existing deck identities | Workshop order |
| --- | --- | --- |
| Foundations | JavaScript & TypeScript `a0000000-0000-4000-8000-000000000002`; Testing & debugging `a0000000-0000-4000-8000-000000000007` | `debug-stale-search`, then `debug-partial-import` |
| Reliability | Debugging Workshop `a0000000-0000-4000-8000-000000090002`; Integrations Workshop `a0000000-0000-4000-8000-000000090005` | `debug-stale-edit`, `integration-idempotency`, `integration-outbox` |
| Ownership | Operations Workshop `a0000000-0000-4000-8000-000000090006`; Capstones Workshop `a0000000-0000-4000-8000-000000090001` | `ops-restore`, `ops-bad-rollout`, `capstone-typescript` |
| Review practice | Code review Workshop `a0000000-0000-4000-8000-000000090003`; AI-assisted engineering Workshop `a0000000-0000-4000-8000-000000090007` | `review-false-positive-test`, `ai-challenge-tests`, `ai-evidence-report` |

Use the [machine-checked route manifest](routes.json) for the corresponding full mission IDs and fixture locations. Search the existing application by the case title in [WORKSHOP](../../WORKSHOP.md), rather than assuming a unit ID is a supported URL route. A documentation identifier and a browser route are different interfaces.

Each route follows the same rhythm: answer one related card before revealing it, inspect the supplied case, predict the failure, implement or investigate in your own scratch area, and record an independent verification result. The foundations route can take several short sessions. The capstone is intentionally longer and can span days; a forty-five-minute workshop estimate is not a promise that a new learner can finish every prerequisite within that time.

## Current navigation

Start with [current curriculum](../../CURRICULUM.md), the [workshop inventory](../../WORKSHOP.md), and the [Effect project guide](../../EFFECT-PROJECTS.md). The route manifest is a curated subset, not a duplicate full inventory. For current counts, reconcile the catalogs and section manifest; avoid adding the same workshop cards twice. [curriculum.test.ts](../../../src/data/curriculum.test.ts) explicitly accounts for two cards per workshop unit and checks stable, unique IDs.

## Historical navigation

Read the historical v8 section of CURRICULUM as a record of an earlier expansion. [CONTENT-REVIEW](../../CONTENT-REVIEW.md) and [RELEASE](../../RELEASE.md) explain retired material and migrations. They are not instructions to restore every retired generated card. [retiredRetrieval.ts](../../../src/db/retiredRetrieval.ts) checks both identity and content hashes before classifying unchanged retired content; this protects the distinction between bundled originals and personal edits.

An independent navigation exercise is to trace one current workshop unit from its catalog deck, through its two card IDs, to its mission and fixture. Then choose a historical inventory row and explain why its old count cannot establish today's installed count. Your output should name the current authority, historical context, and one uncertainty that requires runtime or migration evidence. This keeps learning navigation accurate without deleting useful history.
