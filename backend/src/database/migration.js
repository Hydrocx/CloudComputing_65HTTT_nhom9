/**
 * Database migration — creates the email_logs table if it does not exist.
 *
 * email_logs schema:
 *  - id:          INTEGER PRIMARY KEY AUTOINCREMENT
 *  - user_id:     UUID of the target user (nullable for system emails)
 *  - type:        One of: 'activation', 'enrollment', 'receipt'
 *  - recipient:   Email address of the recipient
 *  - subject:     Email subject line
 *  - status:      'sent' | 'failed' | 'pending'
 *  - error:       Error message if failed (nullable)
 *  - invoice_no:  Auto-generated invoice number for receipts (nullable)
 *  - metadata:    JSON string for extra context (nullable)
 *  - created_at:  ISO-8601 timestamp of creation
 *  - sent_at:     ISO-8601 timestamp of successful send (nullable)
 */

const MIGRATION_SQL = `
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
`;

const MIGRATION_META_SQL = `
  CREATE TABLE IF NOT EXISTS _migrations (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL UNIQUE,
    applied_at TEXT   NOT NULL DEFAULT (datetime('now'))
  );
`;

const CURRENT_MIGRATION = "001_create_email_logs";

/**
 * Apply pending migrations to the database.
 * Uses a _migrations meta-table to track which have been applied.
 *
 * @param {import("better-sqlite3").Database} db
 */
export const runMigration = (db) => {
  // Create meta table
  db.exec(MIGRATION_META_SQL);

  // Check if already applied
  const row = db
    .prepare("SELECT id FROM _migrations WHERE name = ?")
    .get(CURRENT_MIGRATION);

  if (row) return; // already applied

  // Run the migration inside a transaction
  const apply = db.transaction(() => {
    db.exec(MIGRATION_SQL);
    db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(
      CURRENT_MIGRATION
    );
  });

  apply();
};

/**
 * Roll back the most recent migration (for testing / dev).
 * Drops the email_logs table and removes the migration record.
 */
export const rollbackMigration = (db) => {
  const row = db
    .prepare("SELECT id FROM _migrations WHERE name = ?")
    .get(CURRENT_MIGRATION);

  if (!row) return;

  const rollback = db.transaction(() => {
    db.exec("DROP TABLE IF EXISTS email_logs");
    db.prepare("DELETE FROM _migrations WHERE name = ?").run(CURRENT_MIGRATION);
  });

  rollback();
};

export default runMigration;
