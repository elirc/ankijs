# An older event arrives last

Choose ordering rules from domain semantics.

Prerequisites: Versioned records.
Runtime: Node local event stream
Reviewed: 2026-09-26

## Case evidence

Invoice version 8 says paid. Version 7 arrives later and says pending. Arrival-time last-write-wins reopens the invoice. Another event type represents a distinct payment that must not be discarded merely because its timestamp is older.

## Assignment

Implement a monotonically versioned state projection for invoice updates. Then explain why the same rule cannot blindly apply to additive payment events. Test duplicate and equal-version conflicting payloads.

## Hints

- Provider event time may not be a reliable total order.
- State replacement and event accumulation are different operations.

## Reference explanation

For a versioned authoritative snapshot, conditionally apply only a newer version and investigate equal-version contradictions. For independent additive events, deduplicate by event identity and apply each valid effect according to the domain contract. Where versions are unavailable, fetch authoritative state or design reconciliation rather than trusting delivery order.

## Acceptance criteria

- [ ] Version 7 cannot replace version 8.
- [ ] Duplicate independent events are counted once.
- [ ] The chosen rule matches the provider’s documented contract.

## Further reading

- https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
- https://www.rfc-editor.org/rfc/rfc9110.html
