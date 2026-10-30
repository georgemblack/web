-- Describe the desired serving behavior rather than whether an optimized copy exists.
ALTER TABLE files RENAME COLUMN optimized TO optimize;
