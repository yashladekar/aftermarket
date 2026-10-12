-- Create application schema (app)
CREATE SCHEMA IF NOT EXISTS app;

-- Create flowable schema
CREATE SCHEMA IF NOT EXISTS flowable;

-- Create app user with permissions (for local development, using root)
-- In production, create separate users with limited permissions
-- For now, root user has access to all schemas

-- Set default schema for app user operations
-- Note: MySQL doesn't have search_path like PostgreSQL, 
-- so schema names must be qualified in queries or connection parameters
