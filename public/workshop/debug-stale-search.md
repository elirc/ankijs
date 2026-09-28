# The older search response wins

Distinguish completion order from current user intent.

Prerequisites: Promises, React effects.
Runtime: Browser JavaScript
Reviewed: 2026-09-26

## Case evidence

Timeline:

```text
0ms request 17: /search?q=cat
20ms request 18: /search?q=car
60ms response 18: car results rendered
110ms response 17: cat results rendered
```

The code sets results after every awaited fetch. A teammate proposes a 300ms debounce.

## Assignment

Write your hypothesis before the solution. Change the supplied stale-response fixture so obsolete success and failure callbacks cannot update the active result. Resolve the requests in both orders and cancel during parsing.

## Hints

- Debounce reduces frequency; it does not establish ownership of a result.
- Use a monotonically increasing request identity or effect cleanup flag.

## Reference explanation

Only the current request may commit. Capture its identity when starting, compare before setting results or errors, and invalidate it on cleanup. Abort obsolete fetches where possible, but retain the identity check because parsing or other asynchronous work can outlive the request. Verify that an obsolete error cannot replace a newer success.

## Acceptance criteria

- [ ] Reverse response order still shows the newest query.
- [ ] An obsolete rejection leaves the active result intact.
- [ ] Unmount/cancel prevents subsequent commits.

## Further reading

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
