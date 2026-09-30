# 18. Operation identity and bounded retry budgets

Use workshop units integration-idempotency, integration-rate-limit, and review-retry-budget. Read [the idempotency case](../../../../public/workshop/integration-idempotency.md), [the rate-limit case](../../../../public/workshop/integration-rate-limit.md), and IdempotentStore and boundedRetry in [reference.mjs](../../../../public/workshop/fixtures/reference.mjs). The central distinction is between a logical operation and the attempts used to deliver it. A retry should repeat the same intended operation under a bounded policy.

## Identity needs a scope and a meaning

IdempotentStore combines owner and key into a map key, computes JSON.stringify(body) as a fingerprint, and stores the resulting object. A later call with the same composite key and matching fingerprint returns the original result object. A different fingerprint under that key throws a conflict. Another owner can use the same key independently in the ordinary fixture examples.

That behavior is more specific than saying all repeated writes are safe. The helper's string concatenation uses a colon delimiter. Arbitrary owner and key strings containing that delimiter can produce the same composite string. For example, owner a:b with key c and owner a with key b:c collide. A production identity representation needs unambiguous encoding or separate constrained columns. The teaching fixture's simple names do not prove collision freedom for arbitrary input.

The fingerprint is also not canonical JSON. Object property insertion order can change JSON.stringify output for otherwise similar objects, and unsupported values have their own serialization behavior. The assignment asks for a defined canonicalization contract; the reference model demonstrates exact serialized-payload equality. Do not silently advertise a canonicalizer that is not implemented.

## Worked trace: a lost response

Alice sends key k1 with amount ten. The operation commits and the response is lost. Alice retries k1 with the same serialized body. The store returns its original result rather than creating another operation. If the retry accidentally changes amount to twenty, it conflicts. Generating a new key merely because the response was lost would discard the mechanism that ties attempts to the original operation.

Now consider a new intentional transfer of ten. It needs a different logical operation identity even though its body matches the earlier one. Payload equality alone is not sufficient to decide whether two user actions are the same. This is why deduplication should not use only a body hash while ignoring the caller's operation key and scope.

The helper is synchronous and in memory. It has no persistent in-progress state, expiration, crash recovery, or multi-process claim. A single JavaScript call completing before another call starts does not prove a database-backed concurrent claim. Those are extension requirements in the workshop case and must be labeled accordingly.

## A deadline constrains the whole retry sequence

BoundedRetry accepts injected now and sleep functions, an absolute deadline, and a maximum attempt count. Before each attempt it checks that attempts remain and the clock is before the deadline. It returns a response whose status is below four hundred, rejects unlisted failure statuses as permanent, and retries the listed transient statuses while budget permits.

The listed retry statuses are 429, 502, 503, and 504. The helper does not retry every server error; for example, a returned 500 follows its permanent branch. A thrown transport error is not caught by the loop. Describe the fixture's exact policy before proposing a broader production classifier. A general phrase like retry network failures would overstate this implementation.

For a retryable response, the helper uses retryAfterMs when present, otherwise capped exponential delay. If the delay is greater than or equal to remaining time, it stops instead of sleeping to a moment when no attempt can start. The fake clock advances only when the injected sleep does so, making attempt and delay traces deterministic.

## Worked trace: three seconds of budget

Start at zero with deadline three thousand milliseconds. The first response requests a two-thousand-millisecond delay, which fits. After sleeping, the second attempt begins at two thousand. Another two-thousand delay cannot fit in the remaining one thousand, so the helper rejects as exhausted after two calls. It does not start a third attempt merely because the configured maximum allows one.

Test a delay exactly equal to the remaining budget. The strict stop rule rejects that delay too. Test a permanent response on the first call and assert one attempt and no sleep. Then test a success after one transient response to show the implementation is capable of eventual success rather than always exhausting.

The helper checks the clock before starting send but does not itself abort a send that hangs or completes after the deadline. It also receives a parsed retryAfterMs value; it does not parse HTTP Retry-After header formats. These are deliberate model limitations. A production adapter needs bounded in-flight I/O and header validation in addition to this scheduling loop.

## Retry safety and retry timing are separate

A perfectly bounded retry can still duplicate a non-idempotent effect. A perfectly idempotent operation can still consume resources forever if the retry policy is unbounded. Combine an operation identity contract with a timing contract, but test them independently before testing their composition.

For a capstone extension, persist an operation key, fingerprint, state, and result under a concurrency-safe claim. Define how long results remain available relative to the supported retry horizon. Once retention expires, the old key may no longer prevent another effect. The interface should not promise unlimited duplicate suppression while the storage policy deletes evidence after a short interval.

## Laboratory: two ledgers

Maintain an operation ledger and an attempt ledger. The operation ledger contains actor, operation key, defined fingerprint, state, and committed result identity. The attempt ledger contains start time, response classification, proposed delay, remaining budget, and next decision. A lost response changes the attempt history without necessarily changing the committed operation.

Use this separation to explain a timeout after commit. The client may not know whether the effect occurred. Retrying with the same operation identity can resolve that uncertainty under the server's contract. Declaring failure and blindly creating a new operation cannot.

## Graded exercises

**A18-A:** Demonstrate same-key matching-body reuse and changed-body conflict, then identify delimiter and serialization limits. Five points require distinguishing the fixture from canonical production identity.

**A18-B:** Trace the three-second budget and exact-delay boundary. Five points require attempt count and sleep assertions.

**A18-C:** Audit returned 500, thrown transport error, late success, and unparsed Retry-After behavior. Five points require exact current behavior rather than generic retry advice.

**A18-D:** Design persistent claim and retention rules for a lost-response write. Four points require a logical operation ID independent of attempt count.

## Hints and review

For A18-A, compare composite strings and serialized bytes. For A18-C, inspect what surrounds await send. Read [the review](reviews/18-operation-identity-and-retry-budgets.md) after completing both ledgers.
