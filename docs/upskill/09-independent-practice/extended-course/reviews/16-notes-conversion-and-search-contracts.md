# Review 16. Follow the workflow across its real boundaries

Return to [the assignment](../16-notes-conversion-and-search-contracts.md). The important distinction is between one repository operation's atomicity and the whole conversion workflow. Both can be described accurately without pretending that a sequence of awaits creates a shared transaction.

## A16-A: stored state and visible lists

Archive changes status to archived. Conversion changes status to converted and merges card IDs. Delete sets deleted_at. ListInbox selects inbox status, excludes tombstones, and sorts by creation time. All three actions can remove a note from the visible inbox while leaving different stored records.

Assertions should inspect status, deletion, and card_ids as appropriate, alongside list results. Capture and body update trim text, but the repository does not itself reject every blank trimmed value. A claim about blank-input prevention must identify the caller's validation and consider other writers. Full credit requires locating the boundary rather than assuming all layers enforce the same rule.

## A16-B: the returned ID closes a render gap

CreateOne awaits card creation, stores the selected-deck preference, and schedules the createdIds state update. Finish receives the newly returned ID explicitly on the immediate Create path, so it can include that card without waiting for another render to update the closure's state array. This is a concrete example of why a setter call does not mutate the current render's local variable.

Card creation and note conversion occur in separate repository transactions. A failure between them can leave a card whose note_id refers to the source note while the source note still lacks the new reciprocal ID or converted status. Inspect both sides and the queue entries. Do not label the card's own transaction broken merely because the larger workflow is not one transaction.

A proposed recovery can reuse the already-created card ID when retrying the link. Creating a fresh card on every retry risks duplicates. The proposal needs tests and a clear user experience; the source trace alone does not establish that reconciliation already exists.

## A16-C: entity identity versus link identity

MarkConverted uses a Set to avoid duplicate IDs in the note's card_ids array. It cannot merge two different cards created with different IDs. A double-submit experiment should hold the create promise, issue another action, and count calls and resulting identities. CanCreate checks valid fields, not a busy state, so it is not equivalent to the synchronous guardedSave pattern.

If a scratch solution adds a busy guard, test release after failure and preservation of later input. An implementation that disables the action permanently avoids duplicate calls but fails recovery. Pair the overlap case with a successful later attempt. Separate a demonstrated failing experiment from a source-based risk assessment in the evidence report.

## A16-D: search as implemented

Search trims and locale-lowercases the query, reads live cards in the optional deck, and matches a substring in front or back. A blank query returns the listed cards. Suspended cards remain searchable because listCards filters deletion, not suspension. The inherited ordering is by creation time, not relevance.

A pagination proposal must filter the matching collection before selecting its page if it promises a page of matches. Limiting first can return no results even when later records match. Define the total-count contract separately from page length. Include a matching record beyond the proposed first raw page to expose the error, plus blank-query, deck-scope, suspended, and tombstoned fixtures.

## Review milestone

Require a diagram with note capture, card creation, preference update, note linking, and close as separate steps. Mark each transaction boundary and each possible failure observation. Then require a search contract table rather than the phrase case-insensitive search alone. These two artifacts make hidden assumptions reviewable and provide a disciplined starting point for future improvements without changing the current runtime in this workbook.
