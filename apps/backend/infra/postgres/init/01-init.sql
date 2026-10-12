-- Isolation by design: the Flowable engine and the application domain each own a
-- schema and a database role. Neither role is granted access to the other's schema,
-- so the workflow engine physically cannot read or write business data.

-- Application domain role (used by the Spring Boot backend). CREATEDB lets
-- Hibernate validate/update its own schema objects.
CREATE ROLE app WITH LOGIN PASSWORD 'app' CREATEDB;

-- Workflow engine role (kept for parity with the reference template; the
-- single backend connects as `app` and Flowable is fenced to its own schema
-- via flowable.database-schema).
CREATE ROLE flowable WITH LOGIN PASSWORD 'flowable';

-- Each schema is owned by exactly one role.
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION app;
CREATE SCHEMA IF NOT EXISTS flowable AUTHORIZATION flowable;

-- Default search_path so each role resolves its own objects without qualification.
ALTER ROLE app SET search_path TO app;
ALTER ROLE flowable SET search_path TO flowable;

-- Keep the shared public schema locked down.
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO app;
GRANT USAGE ON SCHEMA public TO flowable;

-- The owner of a schema already has full rights on it. Explicitly ensure the
-- opposite role has NONE by not granting anything cross-schema.
GRANT ALL ON SCHEMA app TO app;
GRANT ALL ON SCHEMA flowable TO flowable;
