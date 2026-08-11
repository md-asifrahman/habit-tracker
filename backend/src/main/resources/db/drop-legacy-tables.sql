-- Tables from the habit-centric model, before challenges became the only unit.
-- Hibernate's ddl-auto=update never drops anything, so a database created before that
-- change still carries these. Nothing in the codebase reads them.
--
--   psql "$DB_URL" -f src/main/resources/db/drop-legacy-tables.sql

DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS device_tokens CASCADE;
DROP TABLE IF EXISTS mind_map_nodes CASCADE;
DROP TABLE IF EXISTS mind_maps CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
