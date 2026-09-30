# Review 03. Ownership of asynchronous publication

Return to [the assignment](../03-search-completion-and-current-intent.md). The gate decides whether a completion still has authority to update this view, independently of whether the underlying operation succeeded.

## A03-A: two obsolete outcomes

Start A with token one and B with token two. B's success commits because two is current. A's later success is ignored because one is obsolete. A's later failure must also be ignored under the same check. The accepted view remains B's result, without an obsolete error replacing it.

Log attempted callbacks separately from accepted updates. Otherwise a test might pass simply because it never exercised the stale branch. The existing reference gate compares an ID with its current token and invokes the supplied callback only on equality. Your independent implementation should expose equivalent observable behavior without relying solely on copied output.

## A03-B: the final boundary matters

Resolve A's fetch, hold its parse promise, then start B or cancel the owning view before releasing parsing. A checked before parsing may have been current then, but it is obsolete now. Place the identity check immediately before the state publication, after the last await that can allow ownership to change.

Cancel increments or otherwise invalidates the current generation. It should not publish a result itself unless the UI contract requests a separate cancellation state. Transport abort is optional resource control at another boundary; the commit check remains necessary for work that survives or follows the fetch.

## A03-C: all visible states participate

Guard result replacement, error assignment, and completion-driven loading changes. A stale finally block must not mark a newer request idle. A useful model stores result, error, and loading under the same current request ownership. Each completion path attempts a guarded transition rather than directly changing one field outside the gate.

For example, B begins while A is pending and sets loading true. A finishes first and reaches finally. If that callback clears loading unconditionally, the screen suggests no work is active even though B remains pending. An assertion on results alone would miss the regression. Keep the observable state set aligned with what the user sees.

## A03-D: evaluate the proposed fix precisely

Debounce reduces request frequency and may make the race harder to reproduce. It cannot prevent an older started request from completing after a newer one. Abort can reduce obsolete transport work but cannot guarantee every subsequent parse or callback disappears. Identity checks govern publication. A complete review separates these effects and presents a controlled reverse-completion test.

A concise finding names the missing check and its location after asynchronous processing. It includes obsolete rejection as well as success, because an error can overwrite current intent just as effectively as stale data. It also mentions cleanup invalidation for unmounted or replaced owners.

## Transfer boundaries

Do not share one global gate among unrelated components unless their work truly competes for the same state. Starting a search in one pane should not invalidate an independent operation elsewhere. Scope is part of identity: the counter represents a sequence within one owner, not a globally meaningful request number.

Likewise, a local generation does not provide database concurrency control or authorization. It prevents obsolete UI publication. A server write can still have committed after the view stopped caring about its response. Later chapters treat those persistent effects with expected versions, idempotency, and transaction boundaries.

## Independent follow-up

Add a transformation stage after parsing and construct a case where ownership changes during that stage. Explain why placing a check before each await is still weaker than checking before the final commit. Then implement one guarded publication helper so new success or error paths are less likely to bypass the rule accidentally. Verify the helper with your own event log, not only the provided reference test.
