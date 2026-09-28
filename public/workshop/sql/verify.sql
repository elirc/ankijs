\set ON_ERROR_STOP on
SET search_path TO recall_workshop;
BEGIN;
DO $$
DECLARE ids bigint[];
BEGIN
 SELECT array_agg(id ORDER BY id) INTO ids FROM notes WHERE owner_id='alice' AND (created_at,id)>('2026-01-01T00:00:00Z'::timestamptz,3);
 IF ids IS DISTINCT FROM ARRAY[4,5]::bigint[] THEN RAISE EXCEPTION 'Cursor fixture failed: %',ids; END IF;
 INSERT INTO usernames VALUES('verification-user');
 BEGIN INSERT INTO usernames VALUES('verification-user'); RAISE EXCEPTION 'Unique constraint missing'; EXCEPTION WHEN unique_violation THEN NULL; END;
 UPDATE counters SET value=0 WHERE id=1;
 UPDATE counters SET value=value+1 WHERE id=1;
 UPDATE counters SET value=value+1 WHERE id=1;
 IF (SELECT value FROM counters WHERE id=1)<>2 THEN RAISE EXCEPTION 'Increment failed'; END IF;
END $$;
ROLLBACK;
