import Database from "better-sqlite3";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { runMigration } from "./migration.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.EMAIL_DB_PATH || path.join(__dirname, "..", "..", "data", "email.db");

/** @type {import("better-sqlite3").Database | null} */
let db = null;

/**
 * Get or initialise the SQLite database connection.
 * Creates the data directory if it does not exist and runs migrations.
 */
export const getDb = () => {
  if (db) return db;

  // Ensure the directory exists
  const dir = path.dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigration(db);

  return db;
};

/**
 * Close the database connection gracefully.
 */
export const closeDb = () => {
  if (db) {
    db.close();
    db = null;
  }
};

/**
 * For testing: inject a fresh in-memory database.
 */
export const setTestDb = (testDb) => {
  db = testDb;
  runMigration(db);
};

export default getDb;
