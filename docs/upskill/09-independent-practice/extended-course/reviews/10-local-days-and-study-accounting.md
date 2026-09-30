# Review 10. Calendar boundaries before counting

Return to [the assignment](../10-local-days-and-study-accounting.md). The key grading distinction is whether the learner consistently separates an instant from a local calendar label. Several plausible-looking implementations agree at noon and disagree at the exact moment the user cares about.

## A10-A: half-open membership

A review one millisecond before the start is excluded. A review exactly at the start is included. A review one millisecond before the next midnight is included. A review exactly at that next midnight is excluded from this day and belongs to the following day. The between call's true, false flags express those endpoints.

EndOfLocalDay returns the next local midnight, not the last representable millisecond of the current day. That representation composes cleanly with a half-open interval. Full credit requires reading the helper and query together; merely remembering a conventional definition of end-of-day is insufficient. Use a neighboring-day query to demonstrate that the boundary event is counted once rather than only asserting its absence from one range.

## A10-B: timezone reproducibility

The app helpers use the runtime's local timezone. The workshop localDay function takes an explicit timezone. A correct experiment records which interface it uses and which zone controls the result. For application helpers, run a disposable test process with a controlled timezone rather than changing the user's machine settings. For the workshop model, pass the explicit zone and inspect dates around a transition.

A spring transition can shorten the interval between local midnights and an autumn transition can lengthen it. The point is not to memorize a duration for every date, but to reject the assumption that adding twenty-four hours always reaches the next local midnight. Include a normal day as a neighboring positive case so the explanation shows why the shortcut often appears to work.

## A10-C: count the actual intermediate array

The repository filters logs by day and state_before, bulk-fetches their cards, and counts matches to the current deck ID. It does not construct a Set of card IDs. Two qualifying logs for the same card can therefore produce two fetched entries. A moved card is associated with its current deck at this lookup. Missing cards do not satisfy the deck comparison.

These are implementation observations, not automatic bug verdicts. The surrounding scheduler may constrain ordinary histories, and the product may intentionally use current deck membership. A high-quality review states the current behavior, identifies the assumption, and proposes a policy question with a concrete fixture. Award no credit for silently describing a distinct historical-card count that the code does not implement.

## A10-D: presentation is approximate

RelativeAge clamps future differences to zero and uses coarse elapsed units. HumanIntervalFromMs rounds and uses approximate months. Those labels can help a person scan an interface but cannot decide exact membership in the daily query. FormatDue uses an instant comparison before formatting future dates, so the Due boundary should be tested as an exact comparison rather than inferred from a label like one day.

A suitable counterexample is an event shortly after UTC midnight that still belongs to the previous local date. Its ISO date prefix and local date stamp disagree without either representation being intrinsically wrong. The product's contract determines which one the count needs. Another counterexample is a rounded display interval that says one minute while the exact deadline has not yet passed.

## Transfer milestone

Require the learner to provide a table with instant, timezone, local date, start boundary, end boundary, and membership. If any column is missing, it becomes easy to switch definitions mid-explanation. Apply the same table to a recurring reminder or attendance window and ask which parts remain local-calendar rules and which are elapsed-time rules. This demonstrates transfer without pretending the Recall helpers implement every scheduling policy.
