# 1. Placement by observable behavior

Set aside thirty-five minutes. Use generated sample data and an isolated scratch project or disposable browser profile; your only real study library is not a debugging fixture. Answer the diagnostic without opening the solution chapter. Each answer earns zero for an unsupported claim, one for a plausible explanation, and two for a concrete prediction plus a test or trace that could disprove it.

## Six diagnostic cases

**P1: Stale search.** Search for one term and immediately type another. The second response arrives first; the first arrives afterward. Predict what a component that commits every completion will display. A teammate suggests debounce. Explain whether this changes the correctness guarantee. Describe one additional failure involving an old rejection instead of an old success.

**P2: Conflicting edits.** Two editors load revision three. One commits revision four. The other submits its old draft. State what must be checked at the write boundary and what the UI should preserve after rejection. A separate read followed by an unconditional update is not enough: identify the interval in which another writer can act.

**P3: Backup import.** Six valid rows have been written when row seven fails. The UI catches the error and says import failed. State what the user can infer about stored data. Explain why waiting for several promises is different from committing a database transaction. Name two dependent tables that a Recall backup can contain by consulting its [backup tests](../../../src/db/repos/dataRepo.test.ts) only after your initial prediction.

**P4: Retry identity.** A request key is reused with a changed body. State whether the previous result should be returned, a new operation created, or the call rejected. Define the scope of the identity and how an expiration period limits the guarantee. "Exactly once" without a boundary or retention policy earns no points.

**P5: Independent clocks.** In [mergeCard](../../../src/db/sync/merge.ts), remote content is newer while local scheduling information is newer. Should one whole row win? Predict which fields should come from which side. Explain why this question is distinct from authorization: a merge policy does not establish who is permitted to supply a row.

**P6: Current versus historical learning material.** A document lists a large older inventory while the current catalog has different counts. Explain how you would determine which deck IDs are selectable now, which files are historical explanation, and whether missing archived cards should be recreated. Do not equate "file exists in the repository" with "currently installed curriculum."

## Route selection

At 0-4 points, begin with the foundations route in chapter 2 and complete one debugging case before attempting the capstone. At 5-8 points, choose the reliability route, spending two sessions on whichever diagnostic received zero. At 9-12 points, begin the ownership route, but still record a counterexample and independent implementation before marking a milestone complete. Scores guide practice; they do not establish professional seniority.

For every uncertain answer, write the observation that would change your mind. "Read more about async" is too broad; "resolve request A after B and observe whether the view regresses" is testable. Use the same structure when reviewing generated code: make the promised behavior concrete before trusting the explanation.

Retake two cases after a day with different names and timing. Separate recall before reveal from understanding after reveal. The app's card ratings concern what you remembered; an engineering milestone concerns what you implemented and verified. Neither should silently substitute for the other. Your placement deliverable is the scored sheet, selected route, and a next-session plan small enough to finish with evidence.
