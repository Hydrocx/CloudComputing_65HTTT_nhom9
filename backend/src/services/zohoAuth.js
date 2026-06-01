/**
 * Zoho OAuth2 Token Management
 * Handles automatic access token refresh with in-memory caching.
 */

import zohoConfig from "../config/zoho.js";

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Get a valid Zoho OAuth2 access token.
 * Automatically refreshes when expired (tokens last ~60 minutes).
 * @returns {Promise<string>} Access token
 */
export const getAccessToken = async () => {
  const now = Date.now();

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const { clientId, clientSecret, refreshToken, tokenUrl } = zohoConfig.oauth;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Zoho OAuth2 credentials missing. Please set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN in .env"
    );
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Zoho token refresh failed: ${response.status} — ${errorBody}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Zoho token error: ${data.error}`);
  }

  cachedToken = data.access_token;
  // Expire 5 minutes early to avoid edge cases
  tokenExpiry = now + (data.expires_in - 300) * 1000;

  return cachedToken;
};

/**
 * Helper: Make an authenticated request to any Zoho API.
 * @param {string} url - Full API URL
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<object>} Parsed JSON response
 */
export const zohoFetch = async (url, options = {}) => {
  const token = await getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Zoho API error [${response.status}]: ${errorBody}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  // For binary responses (PDF downloads, etc.)
  return response;
};
