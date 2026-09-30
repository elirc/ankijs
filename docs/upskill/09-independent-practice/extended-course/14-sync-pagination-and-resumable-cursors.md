# 14. Sync pagination with exact resumable cursors

Read pullRemote and mergeRows in [engine.ts](../../../../src/db/sync/engine.ts), then study the data-driven stand-in in [engine.test.ts](../../../../src/db/sync/engine.test.ts). The engine reads pages of five hundred rows ordered by server_updated_at and id. This chapter explains why both ordering fields must be represented in the cursor and what the resulting protocol still assumes.

## A timestamp alone is not an exact position

A batched server write can assign the same server timestamp to hundreds of rows. Suppose six hundred thirty-seven review logs share T. The first page contains IDs zero through four hundred ninety-nine. If the next query asks only for server_updated_at greater than T, the remaining one hundred thirty-seven rows disappear from the traversal. They are neither older nor newer; they are tied on the only remembered field.

The engine instead remembers the ordered pair of timestamp and ID. Its continuation predicate means timestamp greater than T, or timestamp equal to T and ID greater than the last ID. It orders by timestamp first and ID second before applying the page limit. The cursor represents a position in that exact ordering, not an approximate recent time.

The fixture IDs are zero-padded so lexical order matches the intended numeric sequence. Do not use log-2 and log-10 while assuming ordinary string comparison orders them numerically. For a production UUID ordering, reason in the server's actual ordering domain rather than borrowing numeric intuition from a teaching example.

## Worked trace: six hundred thirty-seven tied rows

Start with the epoch cursor and no ID component. The first request takes five hundred rows. MergeRows applies the page locally. The engine then saves the last row's timestamp and ID as two sync_meta entries. Because the page was full, it requests another page using the pair predicate.

The next request returns one hundred thirty-seven rows. After merging and advancing the cursor, the loop stops because the result is shorter than the page size. It does not need an additional empty request for that table. For exactly five hundred rows, the first result cannot reveal whether more rows exist, so a subsequent empty page is necessary. Page fullness controls continuation; it is not a count of total remote rows.

The existing test's actual expected request array contains two review-log requests for the six-hundred-thirty-seven case. A nearby explanatory comment mentions three requests but the assertions and loop establish the behavior. When comments and executable expectations disagree, report the concrete source evidence rather than repeating the comment.

## Filter, order, then limit

The query includes the intended user filter, the continuation predicate, both ascending order clauses, and the limit. Their conceptual relationship is important. Limiting a global unfiltered collection and then removing another user's rows locally would produce short pages and missing data. Ordering only after limiting would also fail to select the correct next segment.

The test stand-in sorts its stored data, applies the continuation predicate, and then slices to the requested limit. This is more informative than returning two hand-written pages regardless of the query. A mutation to the cursor predicate changes which rows the stand-in returns, so the test can detect a real traversal error.

The fake builder's eq method is a no-op. Therefore these pagination tests do not prove that a real backend enforces account filtering. Ownership and authorization need separate evidence. A realistic stand-in can model one important property while deliberately omitting another; the report must state that boundary instead of calling the entire fake equivalent to the server.

## Cursor ownership and compatibility

Cursor keys include the user ID and table name. One account's progress through cards should not become another account's progress through review logs. The ID component lives in a parallel cursor_id key. Inspect both keys when diagnosing a resume failure; a timestamp value alone does not reveal whether the current exact-pair protocol is active.

An older build may have saved only a timestamp. When cursorId is absent, the engine uses a strict timestamp-greater-than query. The compatibility test verifies that behavior. It does not recover rows tied at the old timestamp that an earlier timestamp-only client might already have skipped. Compatibility with old state is not the same as retroactive repair of all historical omissions.

A migration that intentionally replays an older boundary could address a different recovery goal, but it would need a deliberate duplicate-handling and performance analysis. Do not silently describe such a recovery algorithm as already present. The workbook's task is to identify the current protocol and design evidence for proposed extensions.

## Merge before advancing, with a crash window

The engine awaits mergeRows before saving the page cursor. If merging rejects, the cursor does not advance past that failed page. This ordering favors replay over omission. If the process stops after the merge commits but before cursor persistence, a later run can receive the page again. The row merge policies must tolerate that repetition.

The page merge transaction and the later cursor bulkPut are separate calls. Do not claim they form one atomic transaction merely because both are awaited. The useful guarantee is the ordering, with its explicit replay window. A design that persisted the cursor first would create the opposite danger: a crash could skip rows never applied locally.

MergeRows can intentionally skip a card whose referenced deck is absent. The pull order brings decks before cards, but the skip branch still exists. A page cursor can advance after processing such a page. That observation raises a dependency-recovery question; it is not proof that every skipped card will automatically be retried. A source-grounded audit should flag the assumption about remote referential integrity rather than invent a retry path.

## Session changes are checked around the await

The engine checks the captured account before issuing a request and again after the response. It also rejects returned rows whose user_id differs. Those guards supplement the request filter and prevent applying a response after the local account context changed. They do not replace server authorization or retroactively cancel an already completed remote read.

In a controlled test, pause a response, switch the session, release it, and assert that the merge and cursor do not advance under the wrong context. Use a separate initial-mismatch case for the stronger no-request claim. These timelines test different boundaries.

## Graded exercises

**A14-A:** Trace six hundred thirty-seven tied rows and exactly five hundred rows. Five points require correct continuation requests and final cursor pairs.

**A14-B:** Explain why the stand-in detects a timestamp-only regression and what its no-op eq cannot prove. Five points require a precise model limitation.

**A14-C:** Analyze a crash after merge but before cursor persistence and an old timestamp-only cursor. Five points require replay and compatibility limits.

**A14-D:** Design tests for an account switch and a missing-deck card without inventing recovery guarantees. Four points require observing merge and cursor effects separately.

## Hints and transfer

For A14-A, a full page is ambiguous. For A14-B, inspect the fake instead of trusting its name. For A14-C, find the transaction boundary rather than counting awaits. Read [the review](reviews/14-sync-pagination-and-resumable-cursors.md) before applying pair cursors to feeds, audit exports, or incremental search indexing.
