# Reuse a request key without changing its meaning

Separate operation identity from attempts.

Prerequisites: HTTP writes, Hashing.
Runtime: Node fixture
Reviewed: 2026-09-26

## Case evidence

A client sends key k1 with body {amount:10}. Its retry accidentally sends {amount:20} under k1. A simplistic cache returns the previous response without detecting that the caller changed the operation.

## Assignment

Store an operation key, canonical request fingerprint and result with a concurrency-safe claim. Test same-key/same-body, same-key/different-body, two concurrent attempts, and expiration.

## Hints

- Document the scope: account, endpoint and logical operation.
- Expiry defines how long the duplicate guarantee holds.

## Reference explanation

Scope the key to the authenticated actor and operation. Persist a fingerprint of the request under a defined canonicalization contract. The same key with a different fingerprint is a conflict. Concurrent callers need an atomic claim and an in-progress/result state. Retention must exceed the supported retry horizon; after expiry the client cannot assume the old key still prevents duplication.

## Acceptance criteria

- [ ] Same request returns the original committed result.
- [ ] Changed payload conflicts without a second write.
- [ ] Retention and concurrent in-progress behavior are documented.

## Further reading

- https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
- https://www.rfc-editor.org/rfc/rfc9110.html
