# Review 18. One operation, several bounded attempts

Return to [the assignment](../18-operation-identity-and-retry-budgets.md). The two ledgers are the core deliverable. A learner who records only HTTP attempts cannot explain whether the underlying effect happened once, twice, or not at all.

## A18-A: exact fixture behavior

Same owner, key, and JSON.stringify fingerprint returns the stored result. A changed serialized payload under that key throws. The fixture does not implement canonical JSON, persistent concurrent claims, expiration, or restart recovery. Owner/key concatenation with a colon is ambiguous for unrestricted strings, so a production representation needs constrained components or an unambiguous composite encoding.

Use two objects with different insertion order to demonstrate the serialization limit, and the a:b/c versus a/b:c pair to demonstrate delimiter ambiguity. These are observations of the teaching model, not instructions to deploy it. A review that merely repeats owner scoped without checking representation misses an important boundary.

## A18-B: budget arithmetic

At zero with a three-thousand-millisecond deadline, a two-thousand delay permits the second attempt at two thousand. Another two-thousand delay does not fit, so the fixture exhausts after two calls. A delay equal to all remaining time is also rejected because no useful next attempt can begin before the deadline.

Assert calls, sleep values, and final clock. A final error alone could come from an implementation that never attempted the request. Include a transient-then-success case to establish useful progress within budget, and a permanent response case with one call and no sleep.

## A18-C: unsupported stronger claims

A returned 500 is not in the fixture's retry list and takes the permanent branch. A thrown send error propagates because the loop does not catch it. A send that begins before the deadline can finish later; the helper does not abort it or recheck the clock before returning a success. Retry-After parsing occurs nowhere in this helper because it receives retryAfterMs directly.

A production adapter may add transport classification, header parsing, and request cancellation. Those extensions need separate tests. Do not describe them as properties of the existing function merely because they are desirable. The scheduling budget and in-flight I/O budget are related but distinct.

## A18-D: durable identity design

Persist actor and operation scope, key, fingerprint, state, and result under an atomic claim. A second concurrent caller needs a defined response while the first operation is in progress. A lost response should lead to another attempt with the same logical key; a new intentional operation needs a new key even if its body is identical.

Retention must cover the supported retry horizon. Once the deduplication record expires, the service cannot promise that the old key still identifies a previously completed effect. A complete design states that limit and avoids claiming unlimited exactly-once behavior. Also define which request fields enter the fingerprint so harmless transport metadata does not accidentally change operation meaning.

## Reviewer challenge

Ask whether a bounded retry policy makes a charge safe to repeat. It does not without the operation's own duplicate contract. Ask whether idempotency justifies retrying forever. It does not. The learner should combine identity and time constraints while retaining separate evidence for each.
