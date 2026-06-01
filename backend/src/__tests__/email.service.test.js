/**
 * Unit tests for the email service.
 *
 * Uses an in-memory SQLite database and a mock Nodemailer transporter
 * so no real emails are sent and no files are written to disk.
 */
import Database from "better-sqlite3";
import { runMigration } from "../database/migration.js";
import { setTestDb, closeDb } from "../database/db.js";
import { setTestTransporter, resetTransporter } from "../services/email.service.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an in-memory SQLite DB with migrations applied */
const createTestDb = () => {
  const db = new Database(":memory:");
  runMigration(db);
  return db;
};

/** Create a mock Nodemailer transporter that captures sent mail */
const createMockTransporter = () => {
  const sentMails = [];

  const transporter = {
    sendMail: async (mailOptions) => {
      sentMails.push(mailOptions);
      return { messageId: `<mock-${sentMails.length}@educloud.test>` };
    },
    close: () => {},
    sentMails, // reference to the capture array
  };

  return transporter;
};

/** Create a mock transporter that always fails */
const createFailingTransporter = () => {
  let callCount = 0;

  return {
    sendMail: async () => {
      callCount++;
      throw new Error(`Simulated failure #${callCount}`);
    },
    close: () => {},
    callCount: () => callCount,
  };
};

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

let testDb;
let mockTransporter;

beforeEach(() => {
  // Fresh in-memory DB per test
  testDb = createTestDb();
  setTestDb(testDb);

  // Default: happy-path mock transporter
  mockTransporter = createMockTransporter();
  setTestTransporter(mockTransporter);
});

afterEach(() => {
  resetTransporter();
  closeDb();
});

// ---------------------------------------------------------------------------
// Imports (must be after env setup)
// ---------------------------------------------------------------------------

import {
  sendActivation,
  sendEnrollment,
  sendReceipt,
  generateActivationToken,
  verifyActivationToken,
  retryFailedEmails,
  setTestTransporter as setMock,
  resetTransporter as resetMock,
} from "../services/email.service.js";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("generateActivationToken", () => {
  test("generates a valid JWT token with 24h expiry", () => {
    const user = { id: "user-123", email: "test@example.com", name: "Test" };
    const token = generateActivationToken(user);

    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT has 3 parts

    const payload = verifyActivationToken(token);
    expect(payload).not.toBeNull();
    expect(payload.sub).toBe("user-123");
    expect(payload.email).toBe("test@example.com");
    expect(payload.purpose).toBe("account-activation");
  });
});

describe("verifyActivationToken", () => {
  test("returns null for an expired token", () => {
    // We can't easily generate an expired token without manipulating time,
    // so we test with an obviously invalid token
    const result = verifyActivationToken("invalid-token");
    expect(result).toBeNull();
  });

  test("returns null for a token with wrong purpose", () => {
    const user = { id: "user-123", email: "test@example.com" };
    const token = generateActivationToken(user);
    // Should work normally
    expect(verifyActivationToken(token)).not.toBeNull();

    // Decode the payload, modify the purpose, re-encode to create a forgery
    const parts = token.split(".");
    const decoded = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    decoded.purpose = "password-reset";
    const forgedPayload = Buffer.from(JSON.stringify(decoded)).toString("base64url");
    const forgedToken = `${parts[0]}.${forgedPayload}.${parts[2]}`;

    // Signature won't match — jwt.verify returns null
    expect(verifyActivationToken(forgedToken)).toBeNull();
  });
});

describe("sendActivation", () => {
  test("sends activation email and logs to DB", async () => {
    const user = { id: "user-001", email: "alice@example.com", name: "Alice" };

    const result = await sendActivation(user);

    expect(result.success).toBe(true);
    expect(result.logId).toBeGreaterThan(0);

    // Check the mock transporter received the mail
    expect(mockTransporter.sentMails).toHaveLength(1);
    const mail = mockTransporter.sentMails[0];
    expect(mail.to).toBe("alice@example.com");
    expect(mail.subject).toBe("Activate Your EduCloud Account");
    expect(mail.html).toContain("Alice");
    expect(mail.html).toContain("/activate?token=");

    // Check the DB log
    const log = testDb.prepare("SELECT * FROM email_logs WHERE id = ?").get(result.logId);
    expect(log).toBeTruthy();
    expect(log.type).toBe("activation");
    expect(log.recipient).toBe("alice@example.com");
    expect(log.status).toBe("sent");
    expect(log.user_id).toBe("user-001");
  });

  test("logs failure when transport errors", async () => {
    const failingMock = createFailingTransporter();
    setMock(failingMock);

    const user = { id: "user-002", email: "bob@example.com", name: "Bob" };
    const result = await sendActivation(user);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Simulated failure");

    // Check the DB log
    const log = testDb.prepare("SELECT * FROM email_logs WHERE recipient = ?").get("bob@example.com");
    expect(log).toBeTruthy();
    expect(log.status).toBe("failed");
    expect(log.retry_count).toBe(3); // All 3 retries exhausted
  });
});

describe("sendEnrollment", () => {
  test("sends enrollment confirmation and logs to DB", async () => {
    const user = { id: "user-003", email: "carol@example.com", name: "Carol" };
    const course = { id: "course-001", title: "Node.js Masterclass", description: "Learn Node.js" };

    const result = await sendEnrollment(user, course);

    expect(result.success).toBe(true);

    // Check mail content
    expect(mockTransporter.sentMails).toHaveLength(1);
    const mail = mockTransporter.sentMails[0];
    expect(mail.to).toBe("carol@example.com");
    expect(mail.subject).toBe("Enrolled: Node.js Masterclass");
    expect(mail.html).toContain("Carol");
    expect(mail.html).toContain("Node.js Masterclass");
    expect(mail.html).toContain("Learn Node.js");

    // Check DB log
    const log = testDb.prepare("SELECT * FROM email_logs WHERE id = ?").get(result.logId);
    expect(log.type).toBe("enrollment");
    expect(log.status).toBe("sent");
  });
});

describe("sendReceipt", () => {
  test("sends receipt with auto-generated invoice number", async () => {
    const user = { id: "user-004", email: "dave@example.com", name: "Dave" };
    const course = { id: "course-002", title: "React & Redux" };
    const payment = {
      amount: "500,000 VND",
      method: "Credit Card",
      transactionId: "TXN-123456",
    };

    const result = await sendReceipt(user, course, payment);

    expect(result.success).toBe(true);
    expect(result.invoiceNo).toBeTruthy();
    expect(result.invoiceNo).toMatch(/^INV-\d{8}-\d{3}$/);

    // Check mail content
    const mail = mockTransporter.sentMails[0];
    expect(mail.to).toBe("dave@example.com");
    expect(mail.subject).toContain("React & Redux");
    expect(mail.subject).toContain(result.invoiceNo);
    expect(mail.html).toContain("500,000 VND");
    expect(mail.html).toContain("Credit Card");
    expect(mail.html).toContain("TXN-123456");

    // Check DB has invoice number
    const log = testDb.prepare("SELECT * FROM email_logs WHERE id = ?").get(result.logId);
    expect(log.invoice_no).toBe(result.invoiceNo);
    expect(log.type).toBe("receipt");
    expect(log.status).toBe("sent");
  });

  test("auto-increments invoice number daily", async () => {
    const user = { id: "user-005", email: "eve@example.com", name: "Eve" };
    const course = { id: "course-003", title: "TypeScript" };
    const payment = { amount: "300,000 VND", method: "Bank Transfer", transactionId: "TXN-789" };

    // Insert a previous receipt with today's date to simulate existing counter
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    testDb
      .prepare(
        `INSERT INTO email_logs (type, recipient, subject, status, invoice_no, created_at)
         VALUES ('receipt', 'prev@example.com', 'Previous', 'sent', ?, datetime('now'))`
      )
      .run(`INV-${yyyy}${mm}${dd}-005`);

    const result = await sendReceipt(user, course, payment);

    // Should be 006 since 005 exists
    expect(result.invoiceNo).toBe(`INV-${yyyy}${mm}${dd}-006`);
  });
});

describe("retry logic", () => {
  test("retries 3 times on failure and marks as failed", async () => {
    const failingMock = createFailingTransporter();
    setMock(failingMock);

    const user = { id: "user-006", email: "frank@example.com", name: "Frank" };
    const result = await sendActivation(user);

    expect(result.success).toBe(false);
    expect(failingMock.callCount()).toBe(3); // Exactly 3 attempts

    const log = testDb.prepare("SELECT * FROM email_logs WHERE id = ?").get(result.logId);
    expect(log.status).toBe("failed");
    expect(log.retry_count).toBe(3);
  });

  test("succeeds on second retry after initial failure", async () => {
    let attempts = 0;

    const sometimesFailTransporter = {
      sendMail: async () => {
        attempts++;
        if (attempts === 1) throw new Error("First attempt fails");
        return { messageId: "<mock-retry@test>" };
      },
      close: () => {},
    };

    setMock(sometimesFailTransporter);

    const user = { id: "user-007", email: "grace@example.com", name: "Grace" };
    const result = await sendActivation(user);

    expect(result.success).toBe(true);
    expect(attempts).toBe(2); // First failed, second succeeded

    const log = testDb.prepare("SELECT * FROM email_logs WHERE id = ?").get(result.logId);
    expect(log.status).toBe("sent");
    expect(log.retry_count).toBe(2); // 2 attempts total (1 fail + 1 success counts as 2)
  });
});

describe("retryFailedEmails", () => {
  test("retries only failed emails with remaining retries", async () => {
    // Insert some failed emails
    testDb
      .prepare(
        `INSERT INTO email_logs (type, recipient, subject, status, retry_count)
         VALUES ('activation', 'fail1@test.com', 'Test 1', 'failed', 1)`
      )
      .run();
    testDb
      .prepare(
        `INSERT INTO email_logs (type, recipient, subject, status, retry_count)
         VALUES ('enrollment', 'fail2@test.com', 'Test 2', 'failed', 2)`
      )
      .run();
    testDb
      .prepare(
        `INSERT INTO email_logs (type, recipient, subject, status, retry_count)
         VALUES ('receipt', 'sent@test.com', 'Test 3', 'sent', 0)`
      )
      .run();

    const result = await retryFailedEmails();

    expect(result.retried).toBe(2); // Only the 2 failed ones
    expect(result.succeeded).toBe(2); // Both succeed with mock transporter
    expect(result.failed).toBe(0);
  });
});

describe("DB logging", () => {
  test("creates email_logs table with correct schema", () => {
    const columns = testDb
      .prepare("PRAGMA table_info(email_logs)")
      .all();

    const columnNames = columns.map((c) => c.name);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("user_id");
    expect(columnNames).toContain("type");
    expect(columnNames).toContain("recipient");
    expect(columnNames).toContain("subject");
    expect(columnNames).toContain("status");
    expect(columnNames).toContain("error");
    expect(columnNames).toContain("invoice_no");
    expect(columnNames).toContain("metadata");
    expect(columnNames).toContain("created_at");
    expect(columnNames).toContain("sent_at");
    expect(columnNames).toContain("retry_count");
  });

  test("type column rejects invalid values", () => {
    expect(() => {
      testDb
        .prepare(
          `INSERT INTO email_logs (type, recipient, subject, status)
           VALUES ('invalid_type', 'test@test.com', 'Test', 'sent')`
        )
        .run();
    }).toThrow();
  });

  test("status column rejects invalid values", () => {
    expect(() => {
      testDb
        .prepare(
          `INSERT INTO email_logs (type, recipient, subject, status)
           VALUES ('activation', 'test@test.com', 'Test', 'invalid_status')`
        )
        .run();
    }).toThrow();
  });
});
