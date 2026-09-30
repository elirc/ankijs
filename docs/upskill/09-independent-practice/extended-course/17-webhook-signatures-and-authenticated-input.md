# 17. Webhook signatures and authenticated input

Use workshop unit integration-signature and [its case](../../../../public/workshop/integration-signature.md). Read sign and verify in [reference.mjs](../../../../public/workshop/fixtures/reference.mjs), [fake-service.mjs](../../../../public/workshop/fixtures/fake-service.mjs), and [the HTTP integration check](../../../../public/workshop/checks/fake-service.test.mjs). This chapter separates message authentication, freshness, parsing, schema validation, and duplicate suppression. Each addresses a different failure mode.

## Start from the signed representation

The fixture signs timestamp, a literal period, and the raw body string using HMAC-SHA256. The receiver must reconstruct that same representation. Parsing JSON and stringifying the resulting object can change whitespace or property representation while preserving the apparent data. The signature authenticates the transmitted representation, not an abstract object that happens to mean the same thing to a reader.

The existing reference test signs a body with spaces and demonstrates that reserializing its parsed object does not verify against the original signature. A one-character whitespace change is sufficient. This is not a reason to remove whitespace from every request. It is a reason to agree on which exact representation the sender signs and preserve it until verification.

The teaching service accumulates chunks into a JavaScript string. That works for its text fixtures, but do not claim it is a complete arbitrary-byte streaming implementation. A production receiver intended to authenticate raw bytes should preserve the received bytes under its documented encoding and body-reading contract. In particular, a teaching test containing simple ASCII does not prove every multibyte chunk-boundary behavior.

## Worked trace through the receiver

A POST to the webhook path reads the body with a size bound. The service calls verify with the timestamp header, body string, signature, and injected current time. If verification fails, it returns an unauthorized response before parsing or applying the event. If authentication succeeds, it parses JSON, checks the event's required fields, and only then calls Inbox.receive.

That ordering produces distinct outcomes. Invalid authentication never reaches the event effect. Authenticated malformed JSON fails parsing. Authenticated valid JSON with a missing event ID or noninteger amount fails schema validation. A valid duplicate event reaches the inbox but is not applied twice. A single response code assertion cannot establish all four boundaries; inspect the resulting state as well.

The fake service exposes a state endpoint for this laboratory. Read balance and event count before and after the rejected request. The assertion should prove no effect, not merely that the response status looked like an error. A faulty service could mutate first and reject afterward.

## Freshness is not uniqueness

Verify accepts digit-only timestamps and requires the absolute difference from the supplied current seconds to be no more than three hundred. Exactly three hundred seconds away is inside the implemented window; three hundred one is outside. The use of absolute difference also constrains excessively future timestamps. Test both sides of the current time rather than treating freshness as only an old-message check.

A valid message can still be delivered twice within that window. Signature verification does not remember event identities. Inbox supplies that separate memory in the fixture. Conversely, an event ID in a seen set does not authenticate the sender. The receiver needs the checks in combination, with each test aimed at its own property.

The assignment mentions bounded secret-rotation overlap. The small verify helper accepts one secret and does not implement a key ring, key IDs, or expiration policy. Treat rotation as an extension exercise. A source-grounded handoff should say the single-key primitive is verified and the multi-key policy is still to be implemented or tested.

## Signature format before comparison

The helper validates a sixty-four-character hexadecimal signature before converting to buffers. It computes an expected digest and compares equal-length buffers with timingSafeEqual. The length and format checks prevent passing incompatible data to the comparison primitive. Do not describe the mere presence of timingSafeEqual as validation of every other input in the request.

The fixture accepts upper- or lowercase hexadecimal representation because the regular expression is case-insensitive and hex decoding yields the same bytes. A malformed length or a nonhex character is rejected. These are useful neighboring cases because they isolate syntax from message mismatch. An otherwise well-formed but wrong digest should also fail without effects.

Keep actual secrets out of the learner's evidence packet. Use the supplied local fixture secret or a disposable test value and record which key role was used, not a production credential. A debug log should identify the failed stage and a safe request correlation value rather than dump authorization material or entire private payloads.

## Laboratory: build an acceptance matrix

Create one valid event and its signed raw representation. Derive a changed-body case, a stale timestamp case, an excessively future case, a malformed-signature case, an authenticated malformed-JSON case, and a duplicate valid event. For the malformed JSON case, sign that malformed body correctly so parsing, rather than authentication, is the failure you exercise.

For each row, predict response class, whether parsing is reached, whether the inbox sees the event, and whether balance changes. Run the HTTP fixture on an ephemeral loopback port with an injected clock and close it in finally. No live provider or external account is needed. This makes the experiment reproducible and keeps timing independent of the real wall clock.

Add a boundary pair at plus and minus three hundred seconds, then move each one second farther away. The exact inequality matters. Avoid an example at four hundred seconds alone if the task is to prove the acceptance boundary rather than merely one obviously stale rejection.

## Debugging case: a correct signature with a wrong effect

A receiver verifies correctly but deduplicates by the body text instead of event ID. The same logical event represented with another signed body layout could be applied twice, while two legitimate distinct events with identical payloads might be collapsed. Authentication and operation identity have become entangled. Keep the sender's event identity explicit and define its scope.

## Graded exercises

**A17-A:** Explain raw representation versus parsed meaning using the existing whitespace test. Five points require identifying the exact signed concatenation and string-fixture limitation.

**A17-B:** Build the authentication, parsing, schema, and duplicate acceptance matrix. Five points require no-effect assertions for rejected cases.

**A17-C:** Test both freshness boundaries and malformed signature encodings. Five points require distinguishing freshness from uniqueness.

**A17-D:** Design a bounded rotation policy and safe diagnostic record without claiming the single-key helper already implements it. Four points require an explicit overlap end and an obsolete-key test.

## Hints and review

For A17-B, a parsing test needs a valid signature over invalid JSON. For A17-C, inspect the strict greater-than rejection. For A17-D, separate the primitive from key-selection policy. Read [the review](reviews/17-webhook-signatures-and-authenticated-input.md) after completing the state matrix.
