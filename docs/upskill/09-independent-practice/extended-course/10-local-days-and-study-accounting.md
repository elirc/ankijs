# 10. Local calendar days and study accounting

Read [dates.ts](../../../../src/lib/dates.ts), [its tests](../../../../src/lib/dates.test.ts), and [reviewRepo.ts](../../../../src/db/repos/reviewRepo.ts). Compare the explicit-zone localDay fixture in [reference.mjs](../../../../public/workshop/fixtures/reference.mjs). The challenge is to identify which kind of time each operation needs: an instant, a calendar label, an elapsed duration, or a database range. They are related representations, not interchangeable values.

## A local day is bounded by calendar construction

StartOfLocalDay constructs a new Date from the input's local year, month, and date at midnight. EndOfLocalDay constructs midnight of the following local date. It does not add a fixed number of milliseconds to the start. Calendar construction lets the runtime's local timezone rules determine the corresponding instants.

The resulting interval is naturally half open: include the starting midnight and exclude the following midnight. ReviewRepo serializes those boundaries to ISO and queries reviewed_at with between(start, end, true, false). A review exactly at the next midnight belongs to the next day. If both neighboring queries included their end, that review could be counted twice.

The function name endOfLocalDay might tempt a reader to imagine 23:59:59.999. The implementation instead returns the next midnight as an exclusive boundary. Always inspect the comparison flags with the boundary helper. A function name without its consumer does not fully specify the accounting rule.

## Worked trace across midnight

Choose a controlled local date and construct four review instants: one millisecond before the starting midnight, exactly at the start, one millisecond before the next midnight, and exactly at the next midnight. The day's range includes the middle two and excludes the outer two. Save all four as canonical ISO strings so the database comparison matches the stored representation.

Now label the same instants with a UTC date string and with localDateStamp. Near midnight, those labels can differ because they answer different questions. The UTC representation identifies the instant globally; the local date identifies the calendar day experienced in the runtime's timezone. Slicing the first ten characters of toISOString is therefore not a substitute for localDateStamp when the product promises local-day accounting.

The workshop fixture localDay takes an explicit IANA timezone and uses Intl.DateTimeFormat parts. The app helper uses the runtime's local timezone. These are different interfaces. A fixture result for America/New_York does not prove the app is configured to use that zone on a machine located elsewhere. State the timezone assumption in the evidence record.

## Daylight-saving boundaries expose duration shortcuts

In a timezone with a spring clock change, the interval between consecutive local midnights can contain twenty-three hours. At an autumn clock change it can contain twenty-five. A fixed twenty-four-hour addition can therefore land at the wrong local boundary. The relevant fact is the calendar date, not a universal duration for all days.

For a laboratory, use an explicit-zone fixture to classify instants around a known transition, and separately run application date helpers in a test process whose timezone is controlled. Do not change the user's operating-system timezone as part of an ordinary unit test. Keep the environment setting local to the process and record it with the command. A test run in a UTC-only environment cannot demonstrate a daylight-saving edge it never encounters.

Month and year rollover are another boundary. EndOfLocalDay constructs date plus one, so the Date constructor handles the transition into the next month or year. The existing date tests exercise a month boundary. Add a year-boundary prediction in your scratch work and explain why no special December branch is required by this implementation.

## What newCardsStudiedToday actually counts

The repository selects review logs in the day range, filters to state_before equal to new, fetches the referenced cards, and counts cards whose current deck_id equals the requested deck. Read that sequence literally. It is not a distinct-card aggregation over log IDs, and the deck association is read from the current card record rather than stored in the log query.

This creates useful policy questions. If malformed or duplicated history contained two qualifying logs for the same card, the code's mapping can count that card twice. If a card moved decks after the review, the current deck association influences the result. These observations describe the implementation; whether they are acceptable depends on the surrounding scheduler and product contract. Do not silently replace the count with a stronger unique-historical-card claim.

A missing card produces an undefined result from bulkGet and does not match the requested deck. The function returns zero early when no new-state logs exist. A full experiment should distinguish no logs, non-new logs, qualifying logs for another deck, and qualifying logs whose cards are missing. Those cases exercise different filters even when several produce the same final number.

## Display durations are a separate approximation

RelativeAge clamps a negative elapsed difference to zero, displays minutes and hours, and uses thirty-day months for longer labels. HumanIntervalFromMs rounds and clamps short intervals to at least one minute. These are presentation helpers. Their month labels are not a calendar-month arithmetic engine, and their rounding is not appropriate for deciding whether a review falls before a precise deadline.

FormatDue compares actual milliseconds for the Due label, then uses local calendar formatting for future labels. A displayed string can change with locale and timezone while the underlying instant stays the same. Tests should assert the stable contract at the right level. Exact locale-dependent text needs a controlled locale; merely asserting that a future date is not labeled Due checks a narrower but stable boundary.

## Debugging case: a count that passes at noon

A developer changes the daily range to UTC midnight because every test fixture is created at noon UTC. The count tests still pass. A user west of UTC studies in the evening and sees the review assigned to tomorrow. The missing test was not a larger random dataset; it was a fixture near the representation boundary where UTC and local dates disagree.

Repair the evidence by stating the intended day system, constructing its two boundaries, and testing exact inclusivity. Then test a transition day under a controlled timezone. Keep the scheduling instant and displayed calendar label in separate columns so the explanation does not accidentally switch meanings halfway through.

## Graded exercises

**A10-A:** Predict the four midnight boundary cases and justify the database inclusion flags. Five points require the next midnight to belong only to the following day.

**A10-B:** Compare explicit-zone localDay with runtime-local helpers and design a daylight-saving test. Five points require a reproducible timezone assumption.

**A10-C:** Audit the exact counting behavior for duplicate qualifying logs, moved cards, and missing cards. Five points require distinguishing current implementation from a proposed product policy.

**A10-D:** Explain why approximate age labels cannot decide daily membership or precise due status. Four points require one boundary counterexample and an appropriate assertion.

## Hints and transfer

For A10-A, read the final two between arguments. For A10-C, count the array returned by bulkGet, not an imagined Set. For A10-D, compare a display approximation with the instant used by the query. Read [the review](reviews/10-local-days-and-study-accounting.md) before applying the same reasoning to billing days, attendance windows, or recurring reminders.
