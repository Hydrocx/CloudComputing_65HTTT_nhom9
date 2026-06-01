/**
 * Unit tests for the Zoho CRM service.
 *
 * Uses in-memory SQLite and mocks global fetch so no real API calls are made.
 *
 * NOTE: We use manual fetch mocks instead of jest.fn() because Jest's ESM
 * support has limitations with mock function chaining (.mockResolvedValueOnce).
 */

// ── Env setup (must be before CRM module imports due to ESM hoisting) ──
process.env.ZOHO_CRM_CLIENT_ID = "test-client-id";
process.env.ZOHO_CRM_CLIENT_SECRET = "test-client-secret";
process.env.ZOHO_CRM_REFRESH_TOKEN = "test-refresh-token";
process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key-32bytes!!!!!!!";

import Database from "better-sqlite3";
import { runMigration } from "../database/migration.js";
import { setTestDb, closeDb } from "../database/db.js";

// ── Setup / Teardown ──
let testDb;
let fetchCalls = [];

const mockFetchSequence = (responses) => {
  let idx = 0;
  fetchCalls = [];
  global.fetch = async (url, opts = {}) => {
    fetchCalls.push({ url, method: opts.method || "GET" });
    const [body, status = 200] = responses[idx] || [{ message: "unexpected call" }, 404];
    idx++;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    };
  };
};

beforeEach(() => {
  testDb = new Database(":memory:");
  runMigration(testDb);
  setTestDb(testDb);
  resetTokenCache();
  fetchCalls = [];
  delete global.fetch;
});

afterEach(() => {
  delete global.fetch;
  closeDb();
});

// ── Module imports (after env setup) ──
import { validateConfig, isValidTransition, LEAD_STATUSES } from "../config/zoho-crm.config.js";
import {
  encryptToken,
  decryptToken,
  resetTokenCache,
  createLead,
  updateLeadStatus,
  convertLead,
  processWebhook,
  refreshAccessToken,
  retryFailedCrmCalls,
} from "../services/crm.service.js";

// ════════════════════════════════════════════════════════════
// Config Tests
// ════════════════════════════════════════════════════════════

describe("validateConfig", () => {
  test("passes when all env vars are set", () => {
    expect(() => validateConfig()).not.toThrow();
  });

  test("throws when client_id is missing", () => {
    const orig = process.env.ZOHO_CRM_CLIENT_ID;
    delete process.env.ZOHO_CRM_CLIENT_ID;
    expect(() => validateConfig()).toThrow("ZOHO_CRM_CLIENT_ID");
    process.env.ZOHO_CRM_CLIENT_ID = orig;
  });
});

describe("isValidTransition", () => {
  test("allows Lead → Qualified", () => {
    expect(isValidTransition("Lead", "Qualified")).toBe(true);
  });

  test("allows Qualified → Converted", () => {
    expect(isValidTransition("Qualified", "Converted")).toBe(true);
  });

  test("allows Converted → Student", () => {
    expect(isValidTransition("Converted", "Student")).toBe(true);
  });

  test("disallows Lead → Student (skip)", () => {
    expect(isValidTransition("Lead", "Student")).toBe(false);
  });

  test("disallows Student → anything", () => {
    expect(isValidTransition("Student", "Lead")).toBe(false);
    expect(isValidTransition("Student", "Qualified")).toBe(false);
  });

  test("allows any status → Disqualified", () => {
    expect(isValidTransition("Lead", "Disqualified")).toBe(true);
    expect(isValidTransition("Qualified", "Disqualified")).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// Token Encryption Tests
// ════════════════════════════════════════════════════════════

describe("encryptToken / decryptToken", () => {
  test("encrypts and decrypts a token string", () => {
    const original = "my-access-token-12345";
    const encrypted = encryptToken(original);
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toBe(original);

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(original);
  });

  test("returns null for invalid encrypted data", () => {
    expect(decryptToken("invalid-base64!!!")).toBeNull();
  });

  test("produces different ciphertexts for same plaintext (random IV)", () => {
    const plain = "same-token";
    const e1 = encryptToken(plain);
    const e2 = encryptToken(plain);
    expect(e1).not.toBe(e2);
  });
});

// ════════════════════════════════════════════════════════════
// refreshAccessToken Tests
// ════════════════════════════════════════════════════════════

describe("refreshAccessToken", () => {
  test("refreshes token and caches the result", async () => {
    mockFetchSequence([
      [{ access_token: "new-access-token", expires_in: 3600, refresh_token: "new-refresh-token" }],
    ]);

    const token = await refreshAccessToken();

    expect(token).toBe("new-access-token");
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toContain("accounts.zoho.com/oauth/v2/token");
  });

  test("throws on failed token refresh", async () => {
    mockFetchSequence([
      [{ error: "invalid_client" }, 400],
    ]);

    await expect(refreshAccessToken()).rejects.toThrow();
  });

  test("persists encrypted tokens to DB", async () => {
    mockFetchSequence([
      [{ access_token: "persist-test-token", expires_in: 3600 }],
    ]);

    await refreshAccessToken();

    const row = testDb.prepare("SELECT * FROM zoho_oauth LIMIT 1").get();
    expect(row).toBeTruthy();

    // Token should be stored encrypted (not plaintext)
    expect(row.access_token).not.toContain("persist-test-token");
    expect(row.refresh_token).not.toContain("test-refresh-token");
  });
});

// ════════════════════════════════════════════════════════════
// createLead Tests
// ════════════════════════════════════════════════════════════

describe("createLead", () => {
  test("creates a lead in Zoho CRM and syncs to local DB", async () => {
    mockFetchSequence([
      [{ access_token: "test-token", expires_in: 3600 }],
      [{ data: [{ code: "SUCCESS", details: { id: "zoho-lead-001" } }] }],
    ]);

    const leadData = {
      First_Name: "John",
      Last_Name: "Doe",
      Email: "john@example.com",
      Phone: "+84123456789",
      course_interest: "Cloud Storage",
    };

    const result = await createLead(leadData);

    if (!result.success) console.error("  ⚠️  createLead error:", result.error);
    expect(result.success).toBe(true);
    expect(result.zohoLeadId).toBe("zoho-lead-001");

    // Check local DB
    const lead = testDb
      .prepare("SELECT * FROM lead_sync WHERE zoho_lead_id = ?")
      .get("zoho-lead-001");
    expect(lead).toBeTruthy();
    expect(lead.email).toBe("john@example.com");
    expect(lead.status).toBe("Lead");
  });

  test("returns error when Zoho does not return a lead ID", async () => {
    mockFetchSequence([
      [{ access_token: "test-token", expires_in: 3600 }],
      [{ data: [{ code: "ERROR", details: {} }] }],
    ]);

    const result = await createLead({
      First_Name: "Jane",
      Email: "jane@test.com",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("did not return a lead ID");
  });
});

// ════════════════════════════════════════════════════════════
// updateLeadStatus Tests
// ════════════════════════════════════════════════════════════

describe("updateLeadStatus", () => {
  test("updates lead status in Zoho and local DB", async () => {
    // Insert a lead in local DB first
    testDb
      .prepare(
        `INSERT INTO lead_sync (zoho_lead_id, email, name, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .run("zoho-lead-002", "test@example.com", "Test User", "Lead");

    mockFetchSequence([
      [{ access_token: "test-token", expires_in: 3600 }],
      [{ data: [{ code: "SUCCESS" }] }],
    ]);

    const result = await updateLeadStatus("zoho-lead-002", "Qualified");

    if (!result.success) console.error("  ⚠️  updateLeadStatus error:", result.error);

    expect(result.success).toBe(true);

    const lead = testDb
      .prepare("SELECT * FROM lead_sync WHERE zoho_lead_id = ?")
      .get("zoho-lead-002");
    expect(lead.status).toBe("Qualified");
  });

  test("rejects invalid status transition", async () => {
    testDb
      .prepare(
        `INSERT INTO lead_sync (zoho_lead_id, email, name, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .run("zoho-lead-003", "test@example.com", "Test", "Student");

    const result = await updateLeadStatus("zoho-lead-003", "Lead");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid transition");
  });
});

// ════════════════════════════════════════════════════════════
// convertLead Tests
// ════════════════════════════════════════════════════════════

describe("convertLead", () => {
  test("converts lead and creates student account", async () => {
    testDb
      .prepare(
        `INSERT INTO lead_sync (zoho_lead_id, email, name, phone, course_interest, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .run(
        "zoho-lead-convert-1",
        "student@example.com",
        "New Student",
        "+84",
        "GCS",
        "Converted"
      );

    mockFetchSequence([
      [{ access_token: "test-token", expires_in: 3600 }],
      [{ data: [{ code: "SUCCESS", details: { Contact: { id: "contact-1" } } }] }],
    ]);

    const result = await convertLead("zoho-lead-convert-1");

    if (!result.success) console.error("  ⚠️  convertLead error:", result.error);

    expect(result.success).toBe(true);
    expect(result.userId).toBeTruthy();

    // Lead should now be Student
    const lead = testDb
      .prepare("SELECT * FROM lead_sync WHERE zoho_lead_id = ?")
      .get("zoho-lead-convert-1");
    expect(lead.status).toBe("Student");
    expect(lead.user_id).toBe(result.userId);
  });
});

// ════════════════════════════════════════════════════════════
// Webhook Tests
// ════════════════════════════════════════════════════════════

describe("processWebhook", () => {
  test("processes a webhook create event", async () => {
    const payload = {
      operation: "create",
      data: {
        id: "webhook-lead-1",
        Email: "webhook@test.com",
        First_Name: "Webhook",
        Last_Name: "User",
        Lead_Status: "Lead",
      },
    };

    const result = await processWebhook(payload);
    expect(result.processed).toBe(true);
    expect(result.action).toBe("created");

    const lead = testDb
      .prepare("SELECT * FROM lead_sync WHERE zoho_lead_id = ?")
      .get("webhook-lead-1");
    expect(lead).toBeTruthy();
    expect(lead.email).toBe("webhook@test.com");
  });

  test("processes a webhook update event", async () => {
    testDb
      .prepare(
        `INSERT INTO lead_sync (zoho_lead_id, email, name, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .run("webhook-lead-2", "update@test.com", "Update User", "Lead");

    const payload = {
      operation: "update",
      data: {
        id: "webhook-lead-2",
        Email: "update@test.com",
        Lead_Status: "Qualified",
      },
    };

    const result = await processWebhook(payload);
    if (!result.processed) console.error("  ⚠️  webhook update error:", result.error);
    expect(result.processed).toBe(true);
    expect(result.action).toBe("updated");

    const lead = testDb
      .prepare("SELECT * FROM lead_sync WHERE zoho_lead_id = ?")
      .get("webhook-lead-2");
    expect(lead.status).toBe("Qualified");
  });

  test("handles empty payload gracefully", async () => {
    const result = await processWebhook(null);
    expect(result.processed).toBe(false);
    expect(result.error).toContain("Empty");
  });
});

// ════════════════════════════════════════════════════════════
// retryFailedCrmCalls Tests
// ════════════════════════════════════════════════════════════

describe("retryFailedCrmCalls", () => {
  test("retries leads with errors", async () => {
    testDb
      .prepare(
        `INSERT INTO lead_sync (zoho_lead_id, email, name, status, error_count, last_error, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .run("retry-lead-1", "retry@test.com", "Retry User", "Lead", 1, "Previous error");

    mockFetchSequence([
      [{ access_token: "test-token", expires_in: 3600 }],
      [{ data: [{ Lead_Status: "Lead", Email: "retry@test.com" }] }],
    ]);

    const result = await retryFailedCrmCalls();

    expect(result.retried).toBe(1);
    expect(result.succeeded).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════
// DB Migration Tests
// ════════════════════════════════════════════════════════════

describe("DB migrations", () => {
  test("lead_sync table has correct schema", () => {
    const columns = testDb.prepare("PRAGMA table_info(lead_sync)").all();
    const names = columns.map((c) => c.name);
    expect(names).toContain("id");
    expect(names).toContain("zoho_lead_id");
    expect(names).toContain("user_id");
    expect(names).toContain("email");
    expect(names).toContain("name");
    expect(names).toContain("phone");
    expect(names).toContain("course_interest");
    expect(names).toContain("status");
    expect(names).toContain("form_data");
    expect(names).toContain("zoho_data");
    expect(names).toContain("last_sync");
    expect(names).toContain("error_count");
    expect(names).toContain("last_error");
    expect(names).toContain("created_at");
    expect(names).toContain("updated_at");
  });

  test("zoho_oauth table has correct schema", () => {
    const columns = testDb.prepare("PRAGMA table_info(zoho_oauth)").all();
    const names = columns.map((c) => c.name);
    expect(names).toContain("access_token");
    expect(names).toContain("refresh_token");
    expect(names).toContain("expires_at");
  });

  test("status column rejects invalid values", () => {
    expect(() => {
      testDb
        .prepare(
          `INSERT INTO lead_sync (email, name, status)
           VALUES ('test@test.com', 'Test', 'InvalidStatus')`
        )
        .run();
    }).toThrow();
  });

  test("migration is idempotent", () => {
    expect(() => runMigration(testDb)).not.toThrow();
    expect(() => runMigration(testDb)).not.toThrow();

    const migrations = testDb
      .prepare("SELECT name FROM _migrations ORDER BY id")
      .all();
    const names = migrations.map((m) => m.name);
    expect(names.filter((n) => n.includes("lead_sync"))).toHaveLength(1);
    expect(names.filter((n) => n.includes("zoho_oauth"))).toHaveLength(1);
  });
});
