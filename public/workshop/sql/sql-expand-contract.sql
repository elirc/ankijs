SET search_path TO recall_workshop;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS content text;
-- Transitional application writes BOTH fields atomically:
UPDATE notes SET body='new edit',content='new edit',version=version+1 WHERE id=1;
-- Backfill only rows without content; do not overwrite the transitional writer.
WITH batch AS (SELECT id FROM notes WHERE content IS NULL ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED)
UPDATE notes n SET content=n.body FROM batch WHERE n.id=batch.id AND n.content IS NULL;
SELECT count(*) AS remaining FROM notes WHERE content IS NULL;
-- Concurrent-writer test: edit body+content in B before/after a batch. The newest content must survive.
-- Switch readers only after coverage checks. Do NOT drop body until every old writer/reader is retired.
