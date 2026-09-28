SET search_path TO recall_workshop;
-- Session A: BEGIN; SELECT * FROM counters WHERE id=1 FOR UPDATE;
-- Session B: BEGIN; SELECT * FROM counters WHERE id=2 FOR UPDATE;
-- Session A: SELECT * FROM counters WHERE id=2 FOR UPDATE; -- waits
-- Session B: SELECT * FROM counters WHERE id=1 FOR UPDATE; -- cycle
-- PostgreSQL aborts one participant. ROLLBACK the failed transaction, COMMIT/ROLLBACK the other.
-- Fixed protocol, used by BOTH sessions:
BEGIN;
SELECT * FROM counters WHERE id IN(1,2) ORDER BY id FOR UPDATE;
UPDATE counters SET value=value+1 WHERE id IN(1,2);
COMMIT;
-- Test bounded whole-transaction retries in your application; do not retry just the last statement.
