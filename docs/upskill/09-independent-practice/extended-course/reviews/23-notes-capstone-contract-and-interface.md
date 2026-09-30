# Review 23. A local contract is a milestone, not every milestone

Return to [the assignment](../23-notes-capstone-contract-and-interface.md). The reference server and shared contract are study tools. Independent implementation credit requires running the contract against the learner's own work and explaining the boundaries it covers.

## A23-A: map the assertions

The contract covers identity presence, text validation and trimming, owner-scoped reads and writes, no mutation on denied access, a concurrent version conflict, owner-filtered search, and archive visibility. The archived note remains directly readable by its owner, so archive is not deletion. A useful added boundary might test missing version, malformed JSON, or a valid no-op patch, with expected behavior derived from the reference contract.

The test adapter accepts a client-provided header in the controlled environment. Passing its owner cases does not establish production authentication. The Map store also does not survive restart. Keep these facts in the checkpoint ledger instead of allowing the word server to imply durability and verified identity.

## A23-B: conditional write boundary

The reference reads the request body asynchronously, then compares version and replaces the Map entry without an await between those steps. Its single-process behavior supports the paired stale-write test. A persistent replacement needs an atomic conditional update scoped to owner, ID, and expected revision, with a result that distinguishes conflict from successful mutation under the chosen API contract.

Do not implement a database read followed by an unconditional write and assume separate awaits preserve the same guarantee. Pair the concurrency case with foreign-owner and missing-record cases. Ownership and version checks protect different invariants, and response ordering should not disclose another owner's record details.

## A23-C: interface evidence

The API test cannot prove React draft preservation, labels, keyboard access, or stale-response handling. Hold requests to exercise old load completion, overlapping save attempts, rejected save, and newer typing while a saved snapshot is pending. Assert displayed text, list state, messages, and ability to retry, not only fetch counts.

The reference uses a synchronous saving ref and clears the draft only if it still equals the submitted snapshot. Its load token gates stale completions. These patterns give concrete behaviors to investigate, but a learner's interface must produce its own evidence. A screenshot after a happy-path save is insufficient for the asynchronous cases.

## A23-D: checkpoint honesty

Separate local API behavior, trusted sessions, persistent storage, UI accessibility, deployment, and restore. Each needs its own completed check. A plan to replace the adapter is not an implemented session boundary. A build is not a restart test. A server contract run is not an accessible browser journey. A local URL is not evidence that a deployment occurred.

The final twenty-point rubric awards independent work, adversarial behavior, interface recovery, durability and restore, and reproducible handoff. A reference-only run can support learning but cannot earn points for implementing the feature. Review the learner's failed first attempts and corrections as useful evidence of reasoning rather than asking for a falsely perfect development story.

## Transfer question

Ask what changes when the store moves from one Map to several application processes sharing a database. The answer should identify the atomic conditional-write boundary, durable identity, and test environment changes. It should not assume that a concurrency test against one process automatically proves a distributed deployment's behavior.
