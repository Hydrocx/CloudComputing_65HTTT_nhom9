/**
 * Zoho CRM Service
 *
 * Handles OAuth 2.0 token management, Lead CRUD operations, status pipeline,
 * and student account creation on lead conversion.
 *
 * ─── Lead Status Pipeline ─────────────────
 *   Lead → Qualified → Converted → Student
 *                    ↘ Disqualified
 */
import crypto from "crypto";
import config, {
  validateConfig,
  isValidTransition,
  LEAD_STATUSES,
  getRefreshToken,
  getAccountsUrl,
  getClientId,
  getClientSecret,
  getEncryptionKey,
  getApiBaseUrl,
} from "../config/zoho-crm.config.js";
import { getDb } from "../database/db.js";
import { addUser, getUserByEmail, updateUser } from "../data/store.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 3_000, 5_000];
const REQUEST_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Token Management
// ---------------------------------------------------------------------------

/** In-memory token cache — refreshToken is read lazily via getter */
let _cachedRefreshToken = null;
const getCachedRefreshToken = () => {
  if (!_cachedRefreshToken) _cachedRefreshToken = getRefreshToken();
  return _cachedRefreshToken;
};

let tokenCache = {
  accessToken: null,
  get refreshToken() { return getCachedRefreshToken(); },
  set refreshToken(v) { _cachedRefreshToken = v; },
  expiresAt: null, // ISO string
};

/**
 * Refresh the Zoho OAuth access token using the refresh token.
 * Stores the result (encrypted) in the zoho_oauth table and in memory.
 */
export const refreshAccessToken = async () => {
  const url = `${config.accountsUrl}/oauth/v2/token`;
  const params = new URLSearchParams({
    refresh_token: tokenCache.refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zoho OAuth refresh failed (${response.status}): ${text}`);
  }

  const data = await response.json();

  // Zoho may return a new refresh token
  const newRefreshToken = data.refresh_token || tokenCache.refreshToken;

  tokenCache = {
    accessToken: data.access_token,
    refreshToken: newRefreshToken,
    expiresAt: new Date(
      Date.now() + (data.expires_in - config.tokenExpiryBufferSec) * 1000
    ).toISOString(),
  };

  // Persist encrypted tokens
  persistTokens(tokenCache.accessToken, newRefreshToken, tokenCache.expiresAt);

  return tokenCache.accessToken;
};

/**
 * Persist OAuth tokens to the database (encrypted at rest).
 */
const persistTokens = (accessToken, refreshToken, expiresAt) => {
  try {
    const db = getDb();
    const encrypted = encryptToken(
      JSON.stringify({ accessToken, refreshToken, expiresAt })
    );

    // Upsert: always use row id=1 as the single token row
    const existing = db.prepare("SELECT id FROM zoho_oauth LIMIT 1").get();
    if (existing) {
      db.prepare(
        "UPDATE zoho_oauth SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(encrypted, encrypted, expiresAt, existing.id);
    } else {
      db.prepare(
        "INSERT INTO zoho_oauth (access_token, refresh_token, expires_at) VALUES (?, ?, ?)"
      ).run(encrypted, encrypted, expiresAt);
    }
  } catch (err) {
    console.warn("⚠️  Failed to persist Zoho tokens:", err.message);
  }
};

/**
 * Load tokens from the database (decrypt).
 */
const loadTokensFromDb = () => {
  try {
    const db = getDb();
    const row = db.prepare("SELECT * FROM zoho_oauth LIMIT 1").get();
    if (!row || !row.access_token) return false;

    const decrypted = decryptToken(row.access_token);
    if (!decrypted) return false;

    const data = JSON.parse(decrypted);
    tokenCache = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || config.refreshToken,
      expiresAt: data.expiresAt,
    };
    return true;
  } catch {
    return false;
  }
};

/**
 * Get a valid access token, refreshing if necessary.
 */
export const getAccessToken = async () => {
  // Try loading from DB first if cache is empty
  if (!tokenCache.accessToken) {
    loadTokensFromDb();
  }

  // If still no token, or it's expired or about to expire, refresh
  if (
    !tokenCache.accessToken ||
    !tokenCache.expiresAt ||
    new Date(tokenCache.expiresAt) <= new Date()
  ) {
    return refreshAccessToken();
  }

  return tokenCache.accessToken;
};

// ---------------------------------------------------------------------------
// Encryption / Decryption helpers
// ---------------------------------------------------------------------------

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 256-bit key from the encryption key env var using SHA-256.
 */
const deriveKey = () => {
  return crypto.createHash("sha256").update(config.encryptionKey).digest();
};

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns base64( iv + authTag + ciphertext ).
 */
export const encryptToken = (plaintext) => {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  // Prepend iv + authTag to ciphertext
  return Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]).toString("base64");
};

/**
 * Decrypt a string encrypted with encryptToken.
 * Returns the original plaintext, or null on failure.
 */
export const decryptToken = (encryptedBase64) => {
  try {
    const key = deriveKey();
    const raw = Buffer.from(encryptedBase64, "base64");
    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH).toString("hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let plain = decipher.update(ciphertext, "hex", "utf8");
    plain += decipher.final("utf8");
    return plain;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Zoho CRM API helpers
// ---------------------------------------------------------------------------

/**
 * Make an authenticated request to the Zoho CRM API.
 * Automatically retries on 401 by refreshing the token.
 *
 * @param {"GET"|"POST"|"PUT"} method
 * @param {string} path  — e.g., "/Leads" or "/Leads/{id}"
 * @param {object} [body]
 * @returns {Promise<object>} Zoho API response data
 */
const crmRequest = async (method, path, body = undefined) => {
  validateConfig();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const token = await getAccessToken();
    const url = `${config.apiBaseUrl}${path}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const fetchOpts = {
      method,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };

    if (body !== undefined) {
      fetchOpts.body = JSON.stringify({ data: [body] });
    }

    const response = await fetch(url, fetchOpts);
    const responseData = await response.json();

    // Token expired — refresh and retry
    if (response.status === 401 && attempt < MAX_RETRIES - 1) {
      tokenCache.accessToken = null; // force refresh
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      continue;
    }

    if (!response.ok) {
      const errMsg =
        responseData?.message ||
        JSON.stringify(responseData) ||
        `HTTP ${response.status}`;
      throw new Error(`Zoho CRM ${method} ${path} failed: ${errMsg}`);
    }

    return responseData;
  }

  throw new Error(`Zoho CRM ${method} ${path} exhausted retries`);
};

// ---------------------------------------------------------------------------
// Lead Sync DB helpers
// ---------------------------------------------------------------------------

/**
 * Insert or update a lead_sync row.
 */
const upsertLeadSync = (zohoLeadId, data) => {
  const db = getDb();

  // Check for existing by zoho_lead_id OR by email
  let existing;
  if (zohoLeadId) {
    existing = db
      .prepare("SELECT id FROM lead_sync WHERE zoho_lead_id = ?")
      .get(zohoLeadId);
  }
  if (!existing && data.email) {
    existing = db
      .prepare("SELECT id FROM lead_sync WHERE email = ? AND zoho_lead_id IS NOT NULL")
      .get(data.email);
  }

  const now = new Date().toISOString();

  if (existing) {
    const updates = [];
    const params = [];
    for (const [key, value] of Object.entries(data)) {
      if (key === "zoho_lead_id" && !value) continue;
      updates.push(`${key} = ?`);
      // Stringify objects for SQLite (better-sqlite3 does not accept raw objects)
      if (value !== null && typeof value === "object") {
        params.push(JSON.stringify(value));
      } else {
        params.push(value ?? null);
      }
    }
    updates.push("updated_at = ?");
    params.push(now);
    params.push(existing.id);

    db.prepare(
      `UPDATE lead_sync SET ${updates.join(", ")} WHERE id = ?`
    ).run(...params);

    return existing.id;
  }

  // Insert
  const insertData = {
    zoho_lead_id: zohoLeadId || null,
    email: data.email || "",
    name: data.name || "",
    phone: data.phone || null,
    course_interest: data.course_interest || null,
    status: data.status || LEAD_STATUSES.LEAD,
    form_data: data.form_data ? JSON.stringify(data.form_data) : null,
    zoho_data: data.zoho_data ? JSON.stringify(data.zoho_data) : null,
    last_sync: now,
    created_at: now,
    updated_at: now,
  };

  const result = db
    .prepare(
      `INSERT INTO lead_sync (zoho_lead_id, user_id, email, name, phone, course_interest, status, form_data, zoho_data, last_sync, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      insertData.zoho_lead_id,
      data.user_id || null,
      insertData.email,
      insertData.name,
      insertData.phone,
      insertData.course_interest,
      insertData.status,
      insertData.form_data,
      insertData.zoho_data,
      insertData.last_sync,
      insertData.created_at,
      insertData.updated_at
    );

  return result.lastInsertRowid;
};

/**
 * Update the error state of a lead_sync row.
 */
const updateLeadError = (localId, error) => {
  const db = getDb();
  db.prepare(
    "UPDATE lead_sync SET error_count = error_count + 1, last_error = ?, last_sync = datetime('now'), updated_at = datetime('now') WHERE id = ?"
  ).run(error, localId);
};

/**
 * Log a Zoho API request/response pair for audit.
 */
const logZohoRequest = (action, requestData, responseData, error = null) => {
  const db = getDb();
  db.prepare(
    `INSERT INTO email_logs (user_id, type, recipient, subject, status, error, metadata)
     VALUES (NULL, 'activation', 'zoho-crm', ?, ?, ?, ?)`
  ).run(
    `Zoho CRM ${action}`,
    error ? "failed" : "sent",
    error || null,
    JSON.stringify({ request: requestData, response: responseData })
  );
};

// ---------------------------------------------------------------------------
// CRM: Create Lead
// ---------------------------------------------------------------------------

/**
 * Create a Lead in Zoho CRM and sync to local DB.
 *
 * @param {object} leadData
 * @param {string} leadData.Last_Name   — required by Zoho
 * @param {string} leadData.First_Name
 * @param {string} leadData.Email
 * @param {string} leadData.Phone
 * @param {string} leadData.Company     — required by Zoho (defaults to course interest)
 * @param {string} leadData.Lead_Status — defaults to "Lead"
 * @param {string} leadData.Description
 * @returns {Promise<{ success: boolean, zohoLeadId?: string, localId?: number, error?: string }>}
 */
export const createLead = async (leadData) => {
  try {
    validateConfig();

    const zohoBody = {
      Last_Name: leadData.Last_Name || leadData.name || "Unknown",
      First_Name: leadData.First_Name || leadData.name?.split(" ")[0] || "",
      Email: leadData.Email || leadData.email || "",
      Phone: leadData.Phone || leadData.phone || "",
      Company: leadData.Company || leadData.course_interest || "EduCloud Inquiry",
      Lead_Status: leadData.Lead_Status || LEAD_STATUSES.LEAD,
      Description:
        leadData.Description ||
        `Lead from EduCloud. Interest: ${leadData.course_interest || "Not specified"}`,
    };

    const response = await crmRequest("POST", "/Leads", zohoBody);
    const details = response?.data?.[0] || {};
    const zohoLeadId = details.details?.id || details.id;

    if (!zohoLeadId) {
      throw new Error(
        `Zoho did not return a lead ID: ${JSON.stringify(response)}`
      );
    }

    // Sync to local DB
    const localId = upsertLeadSync(zohoLeadId, {
      email: zohoBody.Email,
      name: `${zohoBody.First_Name} ${zohoBody.Last_Name}`.trim(),
      phone: zohoBody.Phone,
      course_interest: leadData.course_interest || "",
      status: LEAD_STATUSES.LEAD,
      form_data: leadData,
      zoho_data: response,
    });

    logZohoRequest("CreateLead", zohoBody, response);

    return { success: true, zohoLeadId, localId };
  } catch (err) {
    // Log failure
    logZohoRequest("CreateLead", leadData, null, err.message);
    return { success: false, error: err.message };
  }
};

// ---------------------------------------------------------------------------
// CRM: Update Lead Status
// ---------------------------------------------------------------------------

/**
 * Update a Lead's status in Zoho CRM and local DB.
 * Validates the status transition before sending.
 *
 * @param {string} zohoLeadId
 * @param {string} newStatus  — one of LEAD_STATUSES values
 * @param {object} [options]
 * @param {string} [options.userId]  — local user ID to associate
 * @returns {Promise<{ success: boolean, localId?: number, error?: string }>}
 */
export const updateLeadStatus = async (zohoLeadId, newStatus, options = {}) => {
  try {
    validateConfig();

    if (!zohoLeadId) {
      return { success: false, error: "zohoLeadId is required" };
    }

    // Validate status
    if (!Object.values(LEAD_STATUSES).includes(newStatus)) {
      return { success: false, error: `Invalid status: ${newStatus}` };
    }

    // Check transition validity from current DB state
    const db = getDb();
    const localLead = db
      .prepare("SELECT * FROM lead_sync WHERE zoho_lead_id = ?")
      .get(zohoLeadId);

    if (localLead && !isValidTransition(localLead.status, newStatus)) {
      return {
        success: false,
        error: `Invalid transition: ${localLead.status} → ${newStatus}`,
      };
    }

    // Update in Zoho CRM
    const zohoBody = {
      Lead_Status: newStatus,
      id: zohoLeadId,
    };

    const response = await crmRequest("PUT", `/Leads/${zohoLeadId}`, zohoBody);

    // Sync to local DB
    const localId = upsertLeadSync(zohoLeadId, {
      status: newStatus,
      user_id: options.userId || localLead?.user_id || null,
      zoho_data: response,
    });

    logZohoRequest("UpdateLeadStatus", zohoBody, response);

    // Auto-convert if moving to Converted
    if (newStatus === LEAD_STATUSES.CONVERTED) {
      // Fire-and-forget: don't block on conversion
      convertLead(zohoLeadId, { localId }).catch((err) =>
        console.error("⚠️  Auto-convert failed:", err.message)
      );
    }

    return { success: true, localId };
  } catch (err) {
    logZohoRequest("UpdateLeadStatus", { zohoLeadId, newStatus }, null, err.message);
    return { success: false, error: err.message };
  }
};

// ---------------------------------------------------------------------------
// CRM: Convert Lead → Student
// ---------------------------------------------------------------------------

/**
 * Convert a Zoho Lead to a Contact/Account/Deal, then create a local Student account.
 *
 * @param {string} zohoLeadId
 * @param {object} [options]
 * @param {number} [options.localId]  — lead_sync row id for direct update
 * @returns {Promise<{ success: boolean, userId?: string, error?: string }>}
 */
export const convertLead = async (zohoLeadId, options = {}) => {
  try {
    validateConfig();

    if (!zohoLeadId) {
      return { success: false, error: "zohoLeadId is required" };
    }

    // 1. Convert in Zoho CRM (creates Contact, Account, Deal)
    const response = await crmRequest(
      "POST",
      `/Leads/${zohoLeadId}/actions/convert`,
      {}
    );

    // 2. Look up the local lead record
    const db = getDb();
    const localLead = options.localId
      ? db.prepare("SELECT * FROM lead_sync WHERE id = ?").get(options.localId)
      : db.prepare("SELECT * FROM lead_sync WHERE zoho_lead_id = ?").get(zohoLeadId);

    if (!localLead) {
      return { success: false, error: "Lead not found in local DB" };
    }

    // 3. Create or update local Student account
    const existingUser = getUserByEmail(localLead.email);
    let userId;

    if (existingUser) {
      // Upgrade existing user to Student if they have a lesser role
      if (existingUser.role !== "Student" && existingUser.role !== "Admin") {
        updateUser(existingUser.id, { role: "Student" });
      }
      userId = existingUser.id;
    } else {
      // Create new student
      const student = addUser({
        email: localLead.email,
        name: localLead.name,
        role: "Student",
        phone: localLead.phone || "",
        courseIds: [],
        enrolledCourseIds: localLead.course_interest
          ? getCourseIdsByInterest(localLead.course_interest)
          : [],
        source: "zoho-lead-conversion",
        convertedAt: new Date().toISOString(),
      });
      userId = student.id;
    }

    // 4. Update lead_sync with user_id and status
    upsertLeadSync(zohoLeadId, {
      user_id: userId,
      status: LEAD_STATUSES.STUDENT,
      zoho_data: response,
    });

    logZohoRequest("ConvertLead", { zohoLeadId }, response);

    return { success: true, userId };
  } catch (err) {
    logZohoRequest("ConvertLead", { zohoLeadId }, null, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Simple helper to find course IDs matching a course interest keyword.
 * Searches the in-memory course store.
 */
const getCourseIdsByInterest = (interest) => {
  try {
    const { getCourses } = require("../data/store.js");
    const courses = getCourses();
    const lower = (interest || "").toLowerCase();
    return courses
      .filter(
        (c) =>
          c.title?.toLowerCase().includes(lower) ||
          c.description?.toLowerCase().includes(lower)
      )
      .map((c) => c.id);
  } catch {
    return [];
  }
};

// ---------------------------------------------------------------------------
// Webhook Processing
// ---------------------------------------------------------------------------

/**
 * Process an incoming Zoho CRM webhook event.
 *
 * Expected payload shape (Zoho webhook format):
 * {
 *   "operation": "update" | "create" | "delete",
 *   "data": { ... },
 *   "event": { "module": "Leads", ... }
 * }
 *
 * @param {object} payload  — parsed JSON body from Zoho webhook
 * @returns {Promise<{ processed: boolean, action?: string, error?: string }>}
 */
export const processWebhook = async (payload) => {
  try {
    if (!payload) {
      return { processed: false, error: "Empty payload" };
    }

    // Extract lead info from Zoho webhook format
    const operation = payload.operation || "unknown";
    const leadData = payload.data || payload;
    const leadId = leadData.id || leadData.zoho_lead_id;

    if (!leadId && operation !== "delete") {
      return { processed: false, error: "No lead ID in webhook payload" };
    }

    // Handle different operations
    switch (operation) {
      case "create": {
        // A lead was created in Zoho — sync to local DB
        upsertLeadSync(leadId, {
          email: leadData.Email || leadData.email || "",
          name:
            leadData.First_Name || leadData.name
              ? `${leadData.First_Name || ""} ${leadData.Last_Name || leadData.name || ""}`.trim()
              : "Unknown",
          phone: leadData.Phone || leadData.phone || "",
          course_interest: leadData.Company || leadData.course_interest || "",
          status: leadData.Lead_Status || leadData.status || LEAD_STATUSES.LEAD,
          zoho_data: leadData,
        });
        return { processed: true, action: "created" };
      }

      case "update": {
        const newStatus =
          leadData.Lead_Status || leadData.status;
        const currentStatus = leadData.Lead_Status;

        upsertLeadSync(leadId, {
          status: newStatus || currentStatus || LEAD_STATUSES.LEAD,
          zoho_data: leadData,
        });

        // If status is now Converted, auto-create student
        if (newStatus === LEAD_STATUSES.CONVERTED) {
          convertLead(leadId).catch((err) =>
            console.error("⚠️  Webhook convert failed:", err.message)
          );
        }

        return { processed: true, action: "updated" };
      }

      case "delete": {
        // Mark as disqualified but don't delete — retain for audit
        const db = getDb();
        db.prepare(
          "UPDATE lead_sync SET status = ?, updated_at = datetime('now') WHERE zoho_lead_id = ?"
        ).run(LEAD_STATUSES.DISQUALIFIED, leadId);
        return { processed: true, action: "deleted" };
      }

      default:
        return { processed: false, error: `Unknown operation: ${operation}` };
    }
  } catch (err) {
    return { processed: false, error: err.message };
  }
};

// ---------------------------------------------------------------------------
// Retry failed CRM calls
// ---------------------------------------------------------------------------

/**
 * Retry any CRM API calls that have error_count > 0 and haven't exceeded
 * the max retry threshold.
 *
 * @returns {Promise<{ retried: number, succeeded: number, failed: number }>}
 */
export const retryFailedCrmCalls = async () => {
  const db = getDb();
  const failedLeads = db
    .prepare(
      "SELECT * FROM lead_sync WHERE error_count > 0 AND error_count < ? AND status != ?"
    )
    .all(MAX_RETRIES, LEAD_STATUSES.STUDENT);

  let succeeded = 0;
  let failed = 0;

  for (const lead of failedLeads) {
    try {
      // Attempt to re-sync with Zoho
      const token = await getAccessToken();
      const url = `${config.apiBaseUrl}/Leads/${lead.zoho_lead_id}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) {
        const data = await response.json();
        upsertLeadSync(lead.zoho_lead_id, {
          status: data.data?.[0]?.Lead_Status || lead.status,
          zoho_data: data,
          error_count: 0,
          last_error: null,
        });
        succeeded++;
      } else {
        updateLeadError(lead.id, `Retry failed: HTTP ${response.status}`);
        failed++;
      }
    } catch (err) {
      updateLeadError(lead.id, err.message);
      failed++;
    }
  }

  return { retried: failedLeads.length, succeeded, failed };
};

/**
 * Reset the in-memory token cache.
 * Used in tests to ensure a clean state between test cases.
 */
export const resetTokenCache = () => {
  _cachedRefreshToken = null;
  tokenCache = {
    accessToken: null,
    get refreshToken() { return getCachedRefreshToken(); },
    set refreshToken(v) { _cachedRefreshToken = v; },
    expiresAt: null,
  };
};

export default {
  createLead,
  updateLeadStatus,
  convertLead,
  processWebhook,
  refreshAccessToken,
  getAccessToken,
  retryFailedCrmCalls,
  encryptToken,
  decryptToken,
  resetTokenCache,
  LEAD_STATUSES,
};
