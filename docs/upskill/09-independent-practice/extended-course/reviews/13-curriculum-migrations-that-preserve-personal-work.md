# Review 13. Preserve work through explicit provenance

Return to [the assignment](../13-curriculum-migrations-that-preserve-personal-work.md). A strong migration explanation starts by identifying the policy family for each card. The source intentionally uses several predicates; a single slogan about preserving edits cannot replace them.

## A13-A: three selectors

Explicit retirement IDs are selected by identity, including when a card was moved. Retrieval-family candidates require an ID in the known baseline and a matching hash of the serialized front/back pair. Source-library candidates use known prefixes, the installation content timestamp, and matching known revision text to classify unchanged shipped material. Unrelated personal IDs are not retired merely because they resemble old lessons.

Choose fixtures from actual manifests or existing tests. A made-up ID sharing a prefix may never appear in the hash map and therefore cannot establish the intended unchanged-card case. Full credit requires one counterexample to an overbroad policy, such as personal text under an unrelated ID or a changed retrieval card whose hash no longer matches.

## A13-B: exact correction and preserved scheduling

A correction applies to a live card whose front/back pair exactly equals one of the listed previous pairs. The result spreads the existing card and replaces the content fields and content clock. Assert due, repetitions, and scheduling clock remain unchanged. Then change only one of the prior text fields and verify that personal rewrite is not overwritten under the correction predicate.

Do not conflate content correction with explicit-ID retirement. A card can be subject to a different policy through its identity family. The review should explain which function made the decision rather than infer all behavior from the final tombstone alone. When several migration helpers run in one transaction, inspect the candidate list for each stage.

## A13-C: who deleted the deck

For a migration-hidden empty deck, the marker stores the deletion timestamp. If later personal cards arrive and the marker still equals the deck's tombstone, the migration can restore visibility and remove its marker. A deck intentionally deleted later has a different timestamp, so the equality check fails and the user's deletion remains authoritative.

The fixture must distinguish those histories, not merely create two deleted decks with different names. Assert visibility, marker handling, and naming. The shipped old name may become My saved cards when personal cards remain, while a custom name is preserved. Names are user data too; a migration that retains cards while overwriting deliberate labels has only partially preserved personal work.

## A13-D: repeated and late arrivals

Run a migration on a controlled old library, inspect changes, then run it again without adding data. Record whether new changes are found and whether existing tombstones stay intact. Next import an older backup that introduces a relevant record and run the migration again. This exercises why retirement is invoked beyond first installation.

Queue inspection should follow the actual retirement path, which builds batched outbox updates directly. Do not claim it inherits every behavior of enqueueMany when that helper is not called. Distinguish preserved queue identity from the exact freshness-marker policy. The exercise is an audit of the code that runs, not a test of a preferred abstraction.

## Hash and transaction review

Ask what bytes are hashed. The expected answer is the JSON serialization of the front/back pair, encoded before SHA-256. Ask what keeps the database transaction alive while hashes and lazy imports are awaited. The expected answer identifies Dexie.waitFor and its bounded wait. Neither a hash name nor the presence of await alone proves the required property.

The final evidence packet should show a classification table, before/after content and scheduling fields, deck provenance, and a repeated-run trace. That packet supports a precise migration claim. A screenshot of a smaller library does not demonstrate preservation of edits, histories, or intentional deletion.
