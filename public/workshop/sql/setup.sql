\set ON_ERROR_STOP on
-- Run only against a disposable database selected explicitly with psql -d.
DROP SCHEMA IF EXISTS recall_workshop CASCADE;
CREATE SCHEMA recall_workshop;
SET search_path TO recall_workshop;
CREATE TABLE counters(id integer PRIMARY KEY,value integer NOT NULL);
INSERT INTO counters VALUES(1,0),(2,0);
CREATE TABLE usernames(name text UNIQUE NOT NULL);
CREATE TABLE doctors(id integer PRIMARY KEY,on_call boolean NOT NULL);
INSERT INTO doctors VALUES(1,true),(2,true);
CREATE TABLE roster(id integer PRIMARY KEY);
INSERT INTO roster VALUES(1);
CREATE TABLE notes(id bigint PRIMARY KEY,owner_id text NOT NULL,body text NOT NULL,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),archived boolean NOT NULL DEFAULT false,version integer NOT NULL DEFAULT 1);
INSERT INTO notes(id,owner_id,body,created_at) SELECT n,'alice','note '||n,'2026-01-01T00:00:00Z' FROM generate_series(1,5) n;
CREATE INDEX notes_cursor ON notes(owner_id,created_at,id);
