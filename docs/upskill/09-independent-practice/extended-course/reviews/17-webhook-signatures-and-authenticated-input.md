# Review 17. Authenticate before interpreting

Return to [the assignment](../17-webhook-signatures-and-authenticated-input.md). Grade the boundary matrix rather than accepting a broad statement that the request is secure. The fixture demonstrates several specific checks and leaves other production concerns outside its scope.

## A17-A: representation matters

The signed input is timestamp, a period, and the raw body string. Parsing and reserializing can change that string even when the apparent object is equivalent. The existing whitespace case proves this distinction. A correct answer also notes that the teaching service accumulates a string; simple text fixtures do not prove arbitrary-byte streaming behavior or every multibyte decoding boundary.

Do not reward a solution that normalizes the body only on the receiver. Sender and receiver must authenticate the same documented representation. If a protocol intentionally signs canonical data, both sides need the same canonicalization contract. That is a different design from the current raw-text fixture.

## A17-B: isolate each rejection stage

A changed body with the original signature fails authentication. Correctly signed malformed JSON reaches parsing and fails there. Correctly signed valid JSON with invalid event fields reaches schema validation. A duplicate valid event reaches the inbox and produces no second effect. Inspect balance and event count after each case.

The authenticated-malformed-JSON fixture is especially important. If the signature is also invalid, the test never exercises parsing and cannot establish its behavior. Full credit requires a valid neighboring event and a duplicate so an implementation that rejects everything cannot satisfy the whole matrix.

## A17-C: exact boundaries

The implemented freshness window accepts absolute skew of three hundred seconds and rejects three hundred one. Test both old and future timestamps. Signature syntax requires sixty-four hexadecimal characters and accepts case variations of hex representation. Malformed syntax and a well-formed wrong digest are separate negative cases.

Freshness does not make a message unique. The same valid signature can be replayed within the window, so event identity remains necessary. Conversely, remembering an event ID does not authenticate the sender. A good explanation keeps those responsibilities separate while showing how the receiver composes them.

## A17-D: rotation is an extension

The helper accepts one secret. A rotation design needs a bounded set of accepted key versions, an overlap end, and tests showing the retired key is rejected afterward. It also needs a way to avoid logging the secret while diagnosing which policy branch failed. The workbook's source check does not establish that rotation has already been implemented.

Use disposable fixture keys in evidence. Record stage, request correlation, and key role rather than production secret values or unnecessary private bodies. A rejected request's diagnostic message should help locate the failing boundary without turning the log into another sensitive-data store.

## Review challenge

Ask the learner why a valid signature over a duplicate event can still return an accepted response without changing balance. The answer should distinguish transport acknowledgment from a newly applied effect. Then ask which layer validates the event ID before Inbox receives it. This checks whether the learner follows the entire receiver path rather than assigning every responsibility to the cryptographic helper.
