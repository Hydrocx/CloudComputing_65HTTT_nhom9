import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { readFileSync } from "fs";
import { getDb } from "../database/db.js";
import { validateConfig, getTransporterConfig, getSender } from "../config/zoho-mail.config.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 3_000, 5_000]; // exponential-ish back-off
const ACTIVATION_TOKEN_TTL = "24h";

const BASE_URL = process.env.EMAIL_BASE_URL || process.env.CORS_ORIGIN?.split(",")[0] || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// ---------------------------------------------------------------------------
// Template loader (simple string-replace — no template engine dependency)
// ---------------------------------------------------------------------------

/** @type {Map<string, string>} */
const templateCache = new Map();

const TEMPLATES = {
  activation: "activation.html",
  enrollment: "enrollment.html",
  receipt: "receipt.html",
};

/**
 * Load and cache an HTML template.
 * @param {"activation" | "enrollment" | "receipt"} name
 * @returns {string}
 */
const loadTemplate = (name) => {
  if (templateCache.has(name)) return templateCache.get(name);

  const file = TEMPLATES[name];
  if (!file) throw new Error(`Unknown template: ${name}`);

  // Resolve path relative to this file
  const url = new URL(`../templates/${file}`, import.meta.url);
  const html = readFileSync(url, "utf-8");
  templateCache.set(name, html);
  return html;
};

/**
 * Simple mustache-style template interpolation.
 * Replaces {{key}} with the corresponding value from `vars`.
 */
const renderTemplate = (html, vars) => {
  let output = html;
  for (const [key, value] of Object.entries(vars)) {
    output = output.replaceAll(`{{${key}}}`, String(value ?? ""));
  }
  return output;
};

// ---------------------------------------------------------------------------
// Transport singleton
// ---------------------------------------------------------------------------

/** @type {import("nodemailer").Transporter | null} */
let _transporter = null;
/** @type {boolean} */
let _transportFailed = false;

/**
 * Get or create the Nodemailer transporter.
 * Caches the instance so we only connect once.
 */
const getTransporter = () => {
  if (_transporter) return _transporter;

  validateConfig();
  _transporter = nodemailer.createTransport(getTransporterConfig());
  return _transporter;
};

/**
 * For testing: inject a mock transporter.
 * @param {import("nodemailer").Transporter | null} mock
 */
export const setTestTransporter = (mock) => {
  _transporter = mock;
  _transportFailed = false;
};

/**
 * For testing: reset the transport singleton.
 */
export const resetTransporter = () => {
  if (_transporter && _transporter.close) {
    _transporter.close();
  }
  _transporter = null;
  _transportFailed = false;
};

// ---------------------------------------------------------------------------
// Invoice number generator
// ---------------------------------------------------------------------------

/**
 * Generate the next invoice number in the format INV-YYYYMMDD-XXX.
 * The counter resets daily based on the latest invoice in the database.
 *
 * @returns {string} e.g. "INV-20260601-001"
 */
const generateInvoiceNo = () => {
  const db = getDb();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const prefix = `INV-${yyyy}${mm}${dd}-`;

  // Get the highest invoice number for today
  const row = db
    .prepare(
      `SELECT invoice_no FROM email_logs
       WHERE type = 'receipt' AND invoice_no LIKE ?
       ORDER BY id DESC LIMIT 1`
    )
    .get(`${prefix}%`);

  let nextSeq = 1;
  if (row && row.invoice_no) {
    const parts = row.invoice_no.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
};

// ---------------------------------------------------------------------------
// Activation token helpers
// ---------------------------------------------------------------------------

/**
 * Generate a JWT activation token valid for 24 hours.
 * @param {object} user
 * @returns {string}
 */
export const generateActivationToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      purpose: "account-activation",
    },
    JWT_SECRET,
    { expiresIn: ACTIVATION_TOKEN_TTL }
  );
};

/**
 * Verify an activation token and return the payload.
 * Returns null if invalid or expired.
 * @param {string} token
 * @returns {object | null}
 */
export const verifyActivationToken = (token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.purpose !== "account-activation") return null;
    return payload;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// DB log helpers
// ---------------------------------------------------------------------------

/**
 * Insert an email_log row.
 * @returns {number} inserted row id
 */
const insertLog = ({ userId, type, recipient, subject, status, error, invoiceNo, metadata }) => {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO email_logs (user_id, type, recipient, subject, status, error, invoice_no, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      userId ?? null,
      type,
      recipient,
      subject,
      status,
      error ?? null,
      invoiceNo ?? null,
      metadata ? JSON.stringify(metadata) : null
    );
  return result.lastInsertRowid;
};

/**
 * Update the status of an email_log row.
 */
const updateLogStatus = (id, status, error = null) => {
  const db = getDb();
  db.prepare(
    `UPDATE email_logs SET status = ?, error = ?, sent_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE sent_at END, retry_count = retry_count + 1 WHERE id = ?`
  ).run(status, error, status, id);
};

// ---------------------------------------------------------------------------
// Core send function with retry
// ---------------------------------------------------------------------------

/**
 * Send an email with retry logic.
 *
 * Attempts to send up to MAX_RETRIES times with exponential back-off.
 * Each attempt increments retry_count in the database.
 *
 * @param {object} options
 * @param {string}  options.to         Recipient email
 * @param {string}  options.subject    Email subject
 * @param {string}  options.html       HTML body
 * @param {string}  options.type       Email type ('activation'|'enrollment'|'receipt')
 * @param {string}  [options.userId]   User ID
 * @param {string}  [options.invoiceNo] Invoice number (receipts only)
 * @param {object}  [options.metadata] Extra context
 * @returns {Promise<{ success: boolean, logId: number, error?: string }>}
 */
const sendWithRetry = async ({ to, subject, html, type, userId, invoiceNo, metadata }) => {
  // Insert pending log
  const logId = insertLog({
    userId,
    type,
    recipient: to,
    subject,
    status: "pending",
    invoiceNo,
    metadata,
  });

  const db = getDb();
  let lastError = "";

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const transporter = getTransporter();
      const sender = getSender();

      await transporter.sendMail({
        from: sender,
        to,
        subject,
        html,
      });

      // Success — update log: status=sent, increment retry_count, record sent_at
      db.prepare(
        `UPDATE email_logs SET status = 'sent', sent_at = datetime('now'), error = NULL, retry_count = retry_count + 1 WHERE id = ?`
      ).run(logId);
      return { success: true, logId };
    } catch (err) {
      lastError = err.message || String(err);
      // Increment retry_count for this attempt
      db.prepare(
        `UPDATE email_logs SET retry_count = retry_count + 1 WHERE id = ?`
      ).run(logId);

      if (attempt < MAX_RETRIES - 1) {
        // Wait before retrying (exponential back-off)
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
      }
    }
  }

  // All attempts exhausted — mark as failed
  db.prepare(
    `UPDATE email_logs SET status = 'failed', error = ? WHERE id = ?`
  ).run(lastError, logId);
  return { success: false, logId, error: lastError };
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send an account activation email.
 *
 * Generates a JWT activation token with 24h expiry, embeds it in an activation
 * URL, and sends the activation template.
 *
 * @param {object} user  - { id, email, name }
 * @returns {Promise<{ success: boolean, logId: number, error?: string }>}
 */
export const sendActivation = async (user) => {
  const token = generateActivationToken(user);
  const activationUrl = `${BASE_URL}/activate?token=${encodeURIComponent(token)}`;
  const year = new Date().getFullYear();

  const html = renderTemplate(loadTemplate("activation"), {
    name: user.name || "User",
    activationUrl,
    year,
  });

  return sendWithRetry({
    to: user.email,
    subject: "Activate Your EduCloud Account",
    html,
    type: "activation",
    userId: user.id,
    metadata: { tokenExpiry: "24h", activationUrl },
  });
};

/**
 * Send a course enrollment confirmation email.
 *
 * @param {object} user   - { id, email, name }
 * @param {object} course - { id, title, description }
 * @returns {Promise<{ success: boolean, logId: number, error?: string }>}
 */
export const sendEnrollment = async (user, course) => {
  const dashboardUrl = `${BASE_URL}/courses`;
  const year = new Date().getFullYear();

  const html = renderTemplate(loadTemplate("enrollment"), {
    name: user.name || "User",
    courseName: course.title || "Course",
    courseDescription: course.description || "",
    dashboardUrl,
    year,
  });

  return sendWithRetry({
    to: user.email,
    subject: `Enrolled: ${course.title || "Course"}`,
    html,
    type: "enrollment",
    userId: user.id,
    metadata: { courseId: course.id, courseTitle: course.title },
  });
};

/**
 * Send a payment receipt email.
 *
 * Auto-generates an invoice number in the format INV-YYYYMMDD-XXX.
 *
 * @param {object}   user          - { id, email, name }
 * @param {object}   course        - { id, title }
 * @param {object}   payment       - { amount, method, transactionId }
 * @param {string}   payment.amount  Formatted amount string, e.g. "500,000 VND"
 * @param {string}   [payment.method] Payment method, e.g. "Credit Card"
 * @param {string}   [payment.transactionId] Transaction reference
 * @returns {Promise<{ success: boolean, logId: number, invoiceNo?: string, error?: string }>}
 */
export const sendReceipt = async (user, course, payment = {}) => {
  const invoiceNo = generateInvoiceNo();
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const year = today.getFullYear();

  const html = renderTemplate(loadTemplate("receipt"), {
    invoiceNo,
    date: dateStr,
    name: user.name || "User",
    courseName: course.title || "Course",
    amount: payment.amount || "0 VND",
    paymentMethod: payment.method || "Unknown",
    transactionId: payment.transactionId || "N/A",
    year,
  });

  const result = await sendWithRetry({
    to: user.email,
    subject: `Receipt: ${course.title || "Course"} — ${invoiceNo}`,
    html,
    type: "receipt",
    userId: user.id,
    invoiceNo,
    metadata: {
      courseId: course.id,
      courseTitle: course.title,
      amount: payment.amount,
      paymentMethod: payment.method,
      transactionId: payment.transactionId,
    },
  });

  return { ...result, invoiceNo: result.success ? invoiceNo : undefined };
};

// ---------------------------------------------------------------------------
// Retry queue for failed emails
// ---------------------------------------------------------------------------

/**
 * Retry all failed emails in the database.
 * Useful for a cron / recurring job to re-process failures.
 *
 * @returns {Promise<{ retried: number, succeeded: number, failed: number }>}
 */
export const retryFailedEmails = async () => {
  const db = getDb();
  const failed = db
    .prepare("SELECT * FROM email_logs WHERE status = 'failed' AND retry_count < ?")
    .all(MAX_RETRIES);

  let succeeded = 0;
  let failedCount = 0;

  for (const log of failed) {
    try {
      const transporter = getTransporter();
      const sender = getSender();

      await transporter.sendMail({
        from: sender,
        to: log.recipient,
        subject: log.subject,
        html: log.metadata ? JSON.parse(log.metadata).html || "" : "",
      });

      updateLogStatus(log.id, "sent");
      succeeded++;
    } catch {
      // Increment the retry count and leave status as failed
      db.prepare("UPDATE email_logs SET retry_count = retry_count + 1 WHERE id = ?").run(log.id);
      failedCount++;
    }
  }

  return { retried: failed.length, succeeded, failed: failedCount };
};

export default {
  sendActivation,
  sendEnrollment,
  sendReceipt,
  generateActivationToken,
  verifyActivationToken,
  retryFailedEmails,
  setTestTransporter,
  resetTransporter,
};
