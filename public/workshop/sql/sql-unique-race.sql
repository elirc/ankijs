SET search_path TO recall_workshop;
-- Session A:
BEGIN;
INSERT INTO usernames(name) VALUES('ada');
-- Pause. In session B run INSERT INTO usernames(name) VALUES('ada'); it waits.
COMMIT;
-- B receives a unique violation. ROLLBACK if B opened a transaction.
-- Alternative domain result:
INSERT INTO usernames(name) VALUES('ada') ON CONFLICT(name) DO NOTHING RETURNING name;
-- Zero rows means this statement did not create a user. Do not infer ownership.
