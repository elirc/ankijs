# Yesterday disappears from the streak

Separate local calendar days from UTC instants.

Prerequisites: Date basics.
Runtime: JavaScript; America/Los_Angeles test timezone
Reviewed: 2026-09-26

## Case evidence

At 17:30 local on September 25, a review's ISO timestamp is already September 26 UTC. The dashboard uses toISOString().slice(0,10) as the local-day key. Later the learner travels to another timezone.

## Assignment

Reproduce the off-by-one using a fixed instant and explicit timezone. Decide whether the product defines streaks in current local time or a fixed account timezone. Add a daylight-saving boundary case.

## Hints

- An ISO UTC date is not the calendar date in every timezone.
- Adding 86400000 milliseconds is not always the next local calendar day.

## Reference explanation

Document the product timezone policy. For an explicit account zone, derive year/month/day with Intl.DateTimeFormat formatToParts and that timeZone. For device-local behavior, use local calendar fields. Keep stored review instants in UTC. Calculate calendar-day adjacency using calendar components; do not infer it from an exact 24-hour duration.

## Acceptance criteria

- [ ] The fixed instant maps to the intended local day.
- [ ] A DST transition does not break adjacency.
- [ ] Travel behavior follows a documented policy.

## Further reading

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
