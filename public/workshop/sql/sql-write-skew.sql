SET search_path TO recall_workshop;
-- First reset: UPDATE doctors SET on_call=true;
-- A: BEGIN ISOLATION LEVEL REPEATABLE READ;
-- B: BEGIN ISOLATION LEVEL REPEATABLE READ;
-- BOTH: SELECT count(*) FROM doctors WHERE on_call; => 2
-- A: UPDATE doctors SET on_call=false WHERE id=1; COMMIT;
-- B: UPDATE doctors SET on_call=false WHERE id=2; COMMIT;
-- Invariant lost: SELECT count(*) FROM doctors WHERE on_call; => 0
-- Reset and repeat at SERIALIZABLE: one transaction must be retried.
-- Alternative shared-lock protocol (all writers must use it):
BEGIN;
SELECT * FROM roster WHERE id=1 FOR UPDATE;
UPDATE doctors SET on_call=false WHERE id=1 AND (SELECT count(*) FROM doctors WHERE on_call)>1;
COMMIT;
