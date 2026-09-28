# Receive the same event twice

Make event identity and business effects commit together.

Prerequisites: Transactions, Unique keys.
Runtime: Node fixture; production database extension
Reviewed: 2026-09-26

## Case evidence

A provider delivers event evt-42 twice after a response timeout. The receiver records the event ID after incrementing the account balance. A crash between those writes leaves a repeatable side effect.

## Assignment

Move deduplication and the durable effect into one transaction. Simulate a crash before commit and after commit-before-response. Distinguish delivery acknowledgment from asynchronous processing completion.

## Hints

- An in-memory Set does not survive restart.
- Marking an event done before its effect can lose work instead of duplicating it.

## Reference explanation

Use a unique inbox key for the provider/event identity. In one transaction either claim and apply the effect, or durably enqueue it for a worker with an explicit processing protocol. Return an acknowledgment only after the durable handoff. Duplicate deliveries should observe the existing committed state. A failed transaction must leave no completed marker.

## Acceptance criteria

- [ ] Concurrent duplicates create one committed effect.
- [ ] A pre-commit crash remains retryable.
- [ ] A post-commit response loss does not repeat the effect.

## Further reading

- https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
- https://www.rfc-editor.org/rfc/rfc9110.html
