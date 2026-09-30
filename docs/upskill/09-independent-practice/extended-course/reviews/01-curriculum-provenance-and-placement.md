# Review 01. Provenance and placement

Return to [the assignment](../01-curriculum-provenance-and-placement.md). A complete provenance sheet follows source relationships rather than guessing that a display title, route label, and progress identity are the same thing.

## A01-A: three activity traces

Debug-stale-search belongs to deck a0000000-0000-4000-8000-000000090002 and uses cards f0000000-0000-4000-8000-000000000030 and f0000000-0000-4000-8000-000000000031. Debug-partial-import uses the same deck and cards ending 000080 and 000081 within the same f0000000-0000-4000-8000 prefix. Review-false-positive-test belongs to deck a0000000-0000-4000-8000-000000090003 and cards ending 000120 and 000121 under that prefix. Write the complete IDs in your own sheet rather than relying on abbreviated suffixes as database keys.

Each mission ID is lab- followed by its exact unit ID. Each fixture path is /workshop/ followed by that unit's filename and the .md extension for these three cases. The source of this mapping is workshop-units.json plus workshop.ts, not an assumption that every future unit must follow the same filename convention. Read the actual fixture field when building a checker.

The first workshop card teaches the question and answer; the second presents evidence and a practice prompt. Completing a study review of either is not equivalent to carrying out the mission. The mission steps ask for an attempt and observed checks, which are separate evidence artifacts.

## A01-B: current versus historical

Curriculum-catalog.ts combines original and expanded catalog entries, incorporates section additions, and appends workshop catalog entries. Curriculum.ts constructs starter cards and adds two cards per workshop unit. Historical v8 tables document a superseded inventory; their presence is useful context but does not override those imports.

An installed database can include user-created material or older records subject to migration policies. Therefore a source total, an installation expectation, and a device count answer different questions. A good report identifies which one was measured. Reinstalling or deleting content to make the numbers match would be an unauthorized and conceptually wrong substitute for understanding the difference.

## A01-C: placement evidence

For stale search, a strong answer rejects both obsolete success and obsolete error publication. For import, it names validation before writes and a database transaction for coordinated writes. For card merge, it chooses content and scheduling groups independently. For outbox cleanup, it compares the captured marker with the current entry and preserves newer work.

A slogan such as use async correctly earns less evidence than a two-operation trace. A trace becomes stronger when paired with a test that would fail under a plausible mutation. Choose the next chapter based on the missing reasoning, not on how familiar the vocabulary feels. Repeat a changed case after a delay to test reconstruction.

## A01-D: reference validation

A route checker should reject an unknown unit and a known unit paired with the wrong card identities. It should verify deck membership, derived mission identity, and the fixture's existence. Keep the modified route in a scratch copy so runtime catalogs remain unchanged. A passing route check establishes consistency of references only.

If mergeCard changes, use its focused tests and a source trace. The route checker never evaluates its field-selection logic. Naming this mismatch is a precise review finding: the supplied evidence does not execute the changed behavior. It is more useful than asking for a larger quantity of unspecified tests.

## Independent follow-up

Choose a workshop activity outside the three examples and reconstruct its entire mapping without this guide. Then describe how a title-only edit differs from a card-ID change for existing progress. You do not need to mutate the app to answer; a source-backed explanation and a read-only identity check are sufficient for this investigation.
