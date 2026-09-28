\set ON_ERROR_STOP on
SET search_path TO recall_workshop;
-- Run after setup in the disposable fixture. This grows sample data deliberately.
INSERT INTO notes(id,owner_id,body,created_at,updated_at,archived)
SELECT 100+n,'owner-'||(n%100),'sample '||n,now()-n*interval '1 second',now()-n*interval '1 second',n%7<>0 FROM generate_series(1,200000) n;
ANALYZE notes;
EXPLAIN (ANALYZE,BUFFERS) SELECT * FROM notes WHERE owner_id='owner-1' AND archived=false ORDER BY updated_at,id LIMIT 30;
CREATE INDEX notes_active_owner ON notes(owner_id,updated_at,id) WHERE archived=false;
ANALYZE notes;
EXPLAIN (ANALYZE,BUFFERS) SELECT * FROM notes WHERE owner_id='owner-1' AND archived=false ORDER BY updated_at,id LIMIT 30;
-- Repeat with several owners; save plans, timings and index size. Compare writes too.
