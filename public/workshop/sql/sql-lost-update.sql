SET search_path TO recall_workshop;
-- Start A and B with BEGIN, then both run SELECT before either UPDATE.
BEGIN;
SELECT value FROM counters WHERE id=1; -- both see 0
UPDATE counters SET value=1 WHERE id=1; -- B waits if A has not committed
COMMIT;
-- After both commit: SELECT value FROM counters WHERE id=1; => 1
-- Reset once, outside both transactions: UPDATE counters SET value=0 WHERE id=1;
-- Now each session runs this instead, then commits:
BEGIN;
UPDATE counters SET value=value+1 WHERE id=1;
COMMIT;
-- After both atomic increments on the reset row: value=2.
