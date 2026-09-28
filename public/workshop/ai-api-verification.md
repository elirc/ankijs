# Verify a claimed library API

Check versioned primary documentation and a minimal reproduction.

Prerequisites: Package manifests, Reading docs.
Runtime: Any installed library
Reviewed: 2026-09-26

## Case evidence

A generated answer proposes client.enableExactlyOnceDelivery(), but the installed client’s types contain no such method. A blog refers to a different SDK version.

## Assignment

Record the installed version, search its official API/types, and write the smallest compile/runtime check. If the method does not exist, explain the underlying requirement and evaluate supported alternatives.

## Hints

- Match documentation to the installed version.
- A successful type assertion does not prove a runtime method exists.

## Reference explanation

Inspect the lockfile and exported types/source, then consult the vendor’s versioned documentation. Reproduce the behavior in an isolated minimal program. Avoid casting to any to silence a missing member. Document the alternative’s guarantee and limits; an at-least-once client does not become exactly-once through naming.

## Acceptance criteria

- [ ] The installed version and primary reference are recorded.
- [ ] The minimal check confirms the actual API.
- [ ] The replacement states its real delivery semantics.

## Further reading

- https://google.github.io/eng-practices/review/reviewer/
