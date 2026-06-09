-- Database schema. Edit this file, then run `pnpm db:reset` to rebuild
-- the SQLite database and regenerate db/types.d.ts.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
