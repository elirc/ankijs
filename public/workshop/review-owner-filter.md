# Review a missing ownership predicate

Write a precise authorization finding with a regression case.

Prerequisites: SQL WHERE, HTTP endpoints.
Runtime: TypeScript diff; PostgreSQL-style parameters
Reviewed: 2026-09-26

## Case evidence

```diff
- UPDATE notes SET body=$1 WHERE id=$2 AND owner_id=$3
+ UPDATE notes SET body=$1 WHERE id=$2
```
The author says the Edit button is hidden for non-owners.

## Assignment

Write one required review comment: trigger, consequence, location and minimal fix. Include a direct HTTP request from user B targeting user A’s note. Distinguish the missing predicate from a UI polish suggestion.

## Hints

- The browser is not an authorization boundary.
- A denied request must leave storage unchanged.

## Reference explanation

Required: the update now accepts any authenticated user who can provide an ID. Restore owner scoping using a server-verified identity, then test both read and write operations with another owner. The regression test must assert status and stored content; checking only the response can miss a mutation performed before denial.

## Acceptance criteria

- [ ] The comment names the direct-request trigger.
- [ ] The proposed fix uses trusted identity.
- [ ] The test checks denial and unchanged data.

## Further reading

- https://google.github.io/eng-practices/review/reviewer/
