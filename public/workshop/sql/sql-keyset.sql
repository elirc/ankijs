SET search_path TO recall_workshop;
SELECT id,created_at FROM notes WHERE owner_id='alice' ORDER BY created_at,id LIMIT 3;
-- Last row is id=3 with timestamp 2026-01-01. A timestamp-only > query misses 4 and 5.
SELECT id,created_at FROM notes WHERE owner_id='alice' AND (created_at,id)>('2026-01-01T00:00:00Z'::timestamptz,3) ORDER BY created_at,id LIMIT 3;
-- Expected ids 4,5. LIMIT page_size+1 is useful for a has-next indicator.
-- Insert a newer row in B before rerunning the second page; then insert an older row.
-- Document that a keyset traversal is not a database-wide snapshot.
