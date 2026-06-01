/**
 * Zoho Mail SMTP Configuration
 *
 * Reads credentials from environment variables.
 * No hardcoded secrets — all values come from .env or process environment.
 */
const config = Object.freeze({
  host: process.env.ZOHO_SMTP_HOST || "smtp.zoho.com",
  port: parseInt(process.env.ZOHO_SMTP_PORT, 10) || 465,
  secure: (process.env.ZOHO_SMTP_PORT || "465") === "465", // true for 465, false for 587
  auth: {
    user: process.env.ZOHO_EMAIL_USER,
    pass: process.env.ZOHO_EMAIL_PASS,
  },
  fromName: process.env.ZOHO_FROM_NAME || "EduCloud Platform",
  fromAddress: process.env.ZOHO_EMAIL_USER || "noreply@educloud.vn",
});

/**
 * Validate that required Zoho config values are present.
 * Throws if SMTP credentials are missing.
 */
export const validateConfig = () => {
  const missing = [];
  if (!config.auth.user) missing.push("ZOHO_EMAIL_USER");
  if (!config.auth.pass) missing.push("ZOHO_EMAIL_PASS");

  if (missing.length > 0) {
    throw new Error(
      `Zoho Mail config missing required env vars: ${missing.join(", ")}`
    );
  }
};

export const getTransporterConfig = () => ({
  host: config.host,
  port: config.port,
  secure: config.secure,
  auth: {
    user: config.auth.user,
    pass: config.auth.pass,
  },
});

export const getSender = () => `"${config.fromName}" <${config.fromAddress}>`;

export default config;
