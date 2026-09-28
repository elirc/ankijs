# Challenge a generated happy-path test

Use adversarial cases to test the promised invariant.

Prerequisites: Unit tests, Boundary cases.
Runtime: Node test runner
Reviewed: 2026-09-26

## Case evidence

Generated function accepts quantities by Number(input), then checks 0 <= n <= 20. Generated tests cover only '1' and '20'. The requirement excludes blank input and fractions.

## Assignment

Add blank, whitespace, zero, fractions, negative, over-limit, NaN-like text and exponent-notation cases. Decide exponent notation explicitly. Mutate the validator and confirm the tests detect the defect.

## Hints

- Zero is valid, so truthiness is not validation.
- Examples copied from the implementation can repeat its blind spots.

## Reference explanation

Reject blank trimmed text before conversion, then require a finite integer in range. Apply a lexical format rule only if the contract disallows forms Number accepts. Tests must be derived from the requirement. A mutation such as deleting the blank check should fail the empty/whitespace cases.

## Acceptance criteria

- [ ] Valid zero is accepted.
- [ ] Blank, fractional and out-of-range values fail.
- [ ] A deliberate validator defect is detected.

## Further reading

- https://google.github.io/eng-practices/review/reviewer/
