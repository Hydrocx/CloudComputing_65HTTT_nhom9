/**
 * Database migration runner.
 *
 * Supports multiple named migrations tracked in a `_migrations` meta-table.
 * Each migration is applied only once, inside a transaction.
 *
 * To add a new migration, push an entry to the MIGRATIONS array with
 * a unique `name` and the `sql` to execute.
 */

// ── Migration 001: email_logs ─────────────────────────────────────────

const MIGRATION_001 = {
  name: "001_create_email_logs",
  sql: `
    CREATE TABLE IF NOT EXISTS email_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT,
      type        TEXT    NOT NULL CHECK (type IN ('activation', 'enrollment', 'receipt')),
      recipient   TEXT    NOT NULL,
      subject     TEXT    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
      error       TEXT,
      invoice_no  TEXT,
      metadata    TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      sent_at     TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_email_logs_type      ON email_logs(type);
    CREATE INDEX IF NOT EXISTS idx_email_logs_recipient  ON email_logs(recipient);
    CREATE INDEX IF NOT EXISTS idx_email_logs_status     ON email_logs(status);
    CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
  `,
};

// ── Migration 002: lead_sync ──────────────────────────────────────────

const MIGRATION_002 = {
  name: "002_create_lead_sync",
  sql: `
    CREATE TABLE IF NOT EXISTS lead_sync (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      zoho_lead_id    TEXT,
      user_id         TEXT,
      email           TEXT    NOT NULL,
      name            TEXT    NOT NULL,
      phone           TEXT,
      course_interest TEXT,
      status          TEXT    NOT NULL DEFAULT 'Lead'
                          CHECK (status IN ('Lead','Qualified','Converted','Student','Disqualified')),
      form_data       TEXT,
      zoho_data       TEXT,
      last_sync       TEXT,
      error_count     INTEGER NOT NULL DEFAULT 0,
      last_error      TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_lead_sync_zoho_id  ON lead_sync(zoho_lead_id);
    CREATE INDEX IF NOT EXISTS idx_lead_sync_email    ON lead_sync(email);
    CREATE INDEX IF NOT EXISTS idx_lead_sync_status   ON lead_sync(status);
  `,
};

// ── Migration 003: zoho_oauth (encrypted token storage) ───────────────

const MIGRATION_003 = {
  name: "003_create_zoho_oauth",
  sql: `
    CREATE TABLE IF NOT EXISTS zoho_oauth (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      access_token    TEXT,
      refresh_token   TEXT,
      expires_at      TEXT,
      scope           TEXT,
      api_domain      TEXT,
      token_type      TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
};

// ── All migrations, ordered ──────────────────────────────────────────

const MIGRATIONS = [MIGRATION_001, MIGRATION_002, MIGRATION_003];

const MIGRATION_META_SQL = `
  CREATE TABLE IF NOT EXISTS _migrations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE,
    applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`;

// ── Public API ────────────────────────────────────────────────────────

/**
 * Apply all pending migrations.
 * Safe to call multiple times — already-applied migrations are skipped.
 *
 * @param {import("better-sqlite3").Database} db
 */
export const runMigration = (db) => {
  db.exec(MIGRATION_META_SQL);

  for (const migration of MIGRATIONS) {
    const row = db
      .prepare("SELECT id FROM _migrations WHERE name = ?")
      .get(migration.name);

    if (row) continue; // already applied

    const apply = db.transaction(() => {
      db.exec(migration.sql);
      db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, datetime('now'))").run(
        migration.name
      );
    });

    apply();
  }
};

/**
 * Roll back a specific migration by name.
 * Drops any tables created by that migration.
 *
 * @param {import("better-sqlite3").Database} db
 * @param {string} migrationName
 */
export const rollbackMigration = (db, migrationName) => {
  const migration = MIGRATIONS.find((m) => m.name === migrationName);
  if (!migration) throw new Error(`Unknown migration: ${migrationName}`);

  const row = db
    .prepare("SELECT id FROM _migrations WHERE name = ?")
    .get(migrationName);
  if (!row) return;

  // Extract table names from CREATE TABLE statements
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
  const tables = [];
  let match;
  while ((match = tableRegex.exec(migration.sql)) !== null) {
    tables.push(match[1]);
  }

  const rollback = db.transaction(() => {
    for (const table of tables) {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    }
    db.prepare("DELETE FROM _migrations WHERE name = ?").run(migrationName);
  });

  rollback();
};

/**
 * Get the list of applied migrations.
 *
 * @param {import("better-sqlite3").Database} db
 * @returns {Array<{id: number, name: string, applied_at: string}>}
 */
export const getAppliedMigrations = (db) => {
  return db.prepare("SELECT * FROM _migrations ORDER BY id").all();
};

export default runMigration;
