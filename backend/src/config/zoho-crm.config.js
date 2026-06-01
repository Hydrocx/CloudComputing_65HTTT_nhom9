/**
 * Zoho CRM OAuth 2.0 Configuration
 *
 * All values are read lazily from process.env so that test files
 * can set env vars before calling any CRM functions, regardless
 * of ESM import hoisting.
 *
 * Required env vars:
 *   ZOHO_CRM_CLIENT_ID       — OAuth client ID from Zoho API Console
 *   ZOHO_CRM_CLIENT_SECRET   — OAuth client secret
 *   ZOHO_CRM_REFRESH_TOKEN   — Refresh token for long-lived access
 *
 * Optional env vars:
 *   ZOHO_CRM_API_URL         — default https://www.zohoapis.com/crm/v2
 *   ZOHO_ACCOUNTS_URL        — default https://accounts.zoho.com
 *   ZOHO_CRM_WEBHOOK_SECRET  — shared secret for webhook verification
 *   TOKEN_ENCRYPTION_KEY     — AES-256 key for encrypting stored tokens (default: JWT_SECRET)
 */

const env = (key, fallback = "") => process.env[key] || fallback;

/** OAuth endpoints */
export const getAccountsUrl = () => env("ZOHO_ACCOUNTS_URL", "https://accounts.zoho.com");
export const getApiBaseUrl = () => env("ZOHO_CRM_API_URL", "https://www.zohoapis.com/crm/v2");

/** OAuth credentials */
export const getClientId = () => env("ZOHO_CRM_CLIENT_ID");
export const getClientSecret = () => env("ZOHO_CRM_CLIENT_SECRET");
export const getRefreshToken = () => env("ZOHO_CRM_REFRESH_TOKEN");

/** Webhook shared secret */
export const getWebhookSecret = () => env("ZOHO_CRM_WEBHOOK_SECRET", "zoho-crm-webhook-secret");

/** Encryption key (uses JWT_SECRET as fallback) */
export const getEncryptionKey = () =>
  env("TOKEN_ENCRYPTION_KEY") || env("JWT_SECRET") || "change-me-token-encryption-key-32!";

/** Default Zoho CRM owner (user ID in Zoho). Uses first user if empty. */
export const getDefaultOwnerId = () => env("ZOHO_CRM_OWNER_ID", "");

/** Refresh access token 5 minutes before actual expiry */
export const TOKEN_EXPIRY_BUFFER_SEC = 300;

/** Lead status pipeline values */
export const LEAD_STATUSES = Object.freeze({
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
  STUDENT: "Student",
  DISQUALIFIED: "Disqualified",
});

/** Valid transitions in the status pipeline */
export const VALID_TRANSITIONS = Object.freeze({
  [LEAD_STATUSES.LEAD]: [LEAD_STATUSES.QUALIFIED, LEAD_STATUSES.DISQUALIFIED],
  [LEAD_STATUSES.QUALIFIED]: [LEAD_STATUSES.CONVERTED, LEAD_STATUSES.DISQUALIFIED],
  [LEAD_STATUSES.CONVERTED]: [LEAD_STATUSES.STUDENT],
  [LEAD_STATUSES.STUDENT]: [],
  [LEAD_STATUSES.DISQUALIFIED]: [],
});

/**
 * Validate that required Zoho CRM config values are present.
 * @throws {Error} if any required env vars are missing
 */
export const validateConfig = () => {
  const missing = [];
  if (!getClientId()) missing.push("ZOHO_CRM_CLIENT_ID");
  if (!getClientSecret()) missing.push("ZOHO_CRM_CLIENT_SECRET");
  if (!getRefreshToken()) missing.push("ZOHO_CRM_REFRESH_TOKEN");

  if (missing.length > 0) {
    throw new Error(
      `Zoho CRM config missing required env vars: ${missing.join(", ")}`
    );
  }
};

/**
 * Check if a status transition is valid.
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export const isValidTransition = (from, to) => {
  const allowed = VALID_TRANSITIONS[from];
  return Boolean(allowed && allowed.includes(to));
};

/**
 * Backward-compatible default config object (lazy getters).
 * Importers can use `config.clientId` or `getClientId()` interchangeably.
 */
const config = new Proxy(
  {},
  {
    get(_, prop) {
      switch (prop) {
        case "accountsUrl": return getAccountsUrl();
        case "apiBaseUrl": return getApiBaseUrl();
        case "clientId": return getClientId();
        case "clientSecret": return getClientSecret();
        case "refreshToken": return getRefreshToken();
        case "webhookSecret": return getWebhookSecret();
        case "encryptionKey": return getEncryptionKey();
        case "defaultOwnerId": return getDefaultOwnerId();
        case "tokenExpiryBufferSec": return TOKEN_EXPIRY_BUFFER_SEC;
        default: return undefined;
      }
    },
  }
);

export default config;
