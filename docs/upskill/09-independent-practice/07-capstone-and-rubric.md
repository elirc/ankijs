# 7. Capstone and independent evidence milestones

Choose the existing `capstone-typescript` workshop unit after completing at least two independent exercises. Its [case file](../../../public/workshop/capstone-typescript.md) and [workshop README](../../../public/workshop/README.md) define the supplied starter, reference, and contract checks. Work in your own copy; never replace the shared starter or your previous attempt to obtain a green result.

The product is a personal notes application with search, edit, archive, and recovery. Another user must not read or change your notes. A stale draft must not silently overwrite a newer revision. A failed save must preserve the draft. These requirements connect the diagnostic cases into one coherent work sample instead of an assortment of unrelated features.

## Evidence milestones

**M1: Contract before interface.** Write valid, blank, oversized, missing-identity, non-owner, and stale-version examples. Specify expected response and mutation behavior for each. Deliver a compact table before implementation. This is independent evidence because the choices are yours and can later be compared against results, rather than copied from a passing reference output.

**M2: Controlled concurrency.** Implement owner-scoped writes and revision checks at one atomic boundary. Schedule two writers from the same starting revision and show exactly one succeeds. Record the final persisted text and rejected draft. Extend the test to a direct request that bypasses the UI; button disabling is a usability measure, not authorization.

**M3: Usable failure recovery.** Demonstrate a keyboard journey through labeled list, editor, search, and archive controls. Inject a failed request and a version conflict. The user must understand what happened and retain recoverable text. Save a short transcript or screenshots with generated content, plus the actual assertions where automation exists. Do not fabricate a browser result from a unit test.

**M4: Production-boundary extension.** The supplied reference uses a header-based test identity and memory storage. Passing its local contract does not establish production authentication or persistence. Follow [production checkpoints](../../../public/workshop/capstone/production-checkpoints.md) to introduce verified sessions and persistent storage in your own project. Verify unauthorized direct requests and restart behavior before making stronger claims.

**M5: Independent restoration.** Export generated sample data, restore to an empty separate store, and compare record identities, owners, content, and an authenticated CRUD journey. Document migration assumptions and rollback compatibility. Record both recovery duration and newest recovered write. Keep the source environment intact so a failed experiment does not destroy your baseline.

**M6: Reviewable handoff.** Submit the requirement table, implementation location, exact commands, results, one failure trace, and limitations. Explicitly separate reference checks, independent implementation checks, and unperformed browser or deployment work. In the app, record evidence before checking a mission complete; the journal entry should describe observed behavior rather than repeat the acceptance labels.

## A rubric that rewards transferable evidence

Score each dimension from zero to two: zero means unsupported, one means happy-path or assisted evidence, and two means independent evidence including a counterexample. Dimensions are contract clarity, concurrency correctness, ownership enforcement, recoverable user experience, and reproduction quality. Aim for eight of ten with no zero in ownership or reproduction. This rubric helps plan practice; it is not a claim of certification or employment readiness.

A reviewer should be able to take one of your inputs, execute the documented command, and observe the same outcome without access to your chat history. If they cannot, improve the fixture and command description before adding another feature. For a final transfer challenge, change the retention or conflict policy and predict which tests, schema assumptions, and user decisions must change. That prediction reveals whether you understand the system you built.
