# Review 14. Remember the complete ordering position

Return to [the assignment](../14-sync-pagination-and-resumable-cursors.md). The review should reward exact traversal reasoning and honest model limits. A passing fake-client test is powerful evidence for the modeled cursor behavior, not proof of all backend semantics.

## A14-A: page boundaries

With six hundred thirty-seven rows sharing one timestamp, the first page returns five hundred and the second returns one hundred thirty-seven. The second request uses the last ID from page one together with the timestamp. Because the second page is short, the loop ends without a third request for that table. With exactly five hundred total rows, an empty follow-up request is needed to discover there are no more.

A timestamp-only continuation skips the tied remainder. An ID-only continuation fails when timestamps change and IDs are not globally increasing across updates. Full credit requires the lexicographic pair predicate: later timestamp, or equal timestamp and later ID. The order clauses and saved cursor must describe the same ordering.

## A14-B: a useful but incomplete stand-in

The fake sorts data, filters according to the parsed continuation expression, and slices by the requested limit. It can therefore expose a faulty continuation expression rather than blindly handing back predetermined pages. This is why the tied-row test is more meaningful than a mock that ignores every query argument.

Its eq method does nothing. Thus it cannot demonstrate actual user filtering or backend authorization. The fake's order method also does not independently implement arbitrary requested order; its page helper has the intended sort built in. A careful report says which changes the fake would detect and which it would mask. The existence of one realistic behavior does not make every method faithful.

## A14-C: replay versus omission

The engine commits mergeRows before saving the cursor pair. A crash between those calls can replay a page, so merge behavior must tolerate receiving it again. Saving the cursor before applying rows would risk skipping unapplied data. The current ordering chooses the safer replay window, but the operations are not one atomic transaction.

For old cursor state without an ID component, the engine uses timestamp greater-than. The compatibility test accepts that state and advances through later timestamps. It does not recover tied rows that an older client might have omitted. A proposed repair would need a deliberate replay boundary and duplicate handling; it should not be presented as an existing guarantee.

## A14-D: account and dependency boundaries

Pause a response under one account, change the session, then release it. The post-response guard should prevent merging under the wrong context and prevent that response from advancing the cursor. This differs from an initial mismatch test, where the stronger expectation is no remote call at all. Draw both timelines before choosing assertions.

For a card whose deck is absent, mergeRows skips the card. Pull order normally brings decks first, but that ordering does not erase the skip branch or guarantee automatic later recovery. A useful test observes the skipped card and cursor outcome, then identifies the remote referential-integrity assumption. Do not manufacture an unseen retry loop to make the story more reassuring.

## Reviewer challenge

Give the learner a dataset with two timestamps and IDs whose numeric-looking suffixes are not zero-padded. Ask them to sort it using the actual comparison domain and derive two pages. This reveals whether they understand the ordered pair or merely memorized the original fixture. Then ask which assertion would fail if the backend returned rows in the wrong order. If the fake hardcodes ordering, a separate query-shape or integration check is needed for that claim.

An excellent submission includes the request predicate, expected page IDs, saved pair, crash window, and explicit fake limitations. That is enough to assess the traversal without mistaking it for a complete distributed snapshot protocol.
