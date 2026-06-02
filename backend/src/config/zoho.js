/**
 * Zoho Configuration — Centralized environment variables for all Zoho services.
 * All values are read from process.env (loaded by dotenv in index.js).
 */

const zohoConfig = {
  // OAuth2 credentials (shared across all Zoho APIs)
  oauth: {
    clientId: process.env.ZOHO_CLIENT_ID || "",
    clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
    refreshToken: process.env.ZOHO_REFRESH_TOKEN || "",
    domain: process.env.ZOHO_DOMAIN || "zoho.com",
    get tokenUrl() {
      return `https://accounts.${this.domain}/oauth/v2/token`;
    },
  },

  // 1. Zoho Mail
  mail: {
    accountId: process.env.ZOHO_MAIL_ACCOUNT_ID || "",
    fromEmail: process.env.ZOHO_MAIL_FROM_EMAIL || "noreply@educloud.vn",
    get apiBase() {
      return `https://mail.${zohoConfig.oauth.domain}/api/accounts/${this.accountId}`;
    },
  },

  // 2. Zoho CRM
  crm: {
    orgId: process.env.ZOHO_CRM_ORG_ID || "",
    get apiBase() {
      const apiDomain = zohoConfig.oauth.domain.replace("zoho", "zohoapis");
      return `https://www.${apiDomain}/crm/v2`;
    },
  },

  // 3. Zoho Desk
  desk: {
    orgId: process.env.ZOHO_DESK_ORG_ID || "",
    departmentId: process.env.ZOHO_DESK_DEPARTMENT_ID || "",
    asapWidgetId: process.env.ZOHO_DESK_ASAP_WIDGET_ID || "",
    get apiBase() {
      return `https://desk.${zohoConfig.oauth.domain}/api/v1`;
    },
  },

  // 4. Zoho Invoice
  invoice: {
    orgId: process.env.ZOHO_INVOICE_ORG_ID || "",
    get apiBase() {
      return `https://invoice.${zohoConfig.oauth.domain}/api/v3`;
    },
  },

  // 5. Zoho Sign
  sign: {
    orgId: process.env.ZOHO_SIGN_ORG_ID || "",
    get apiBase() {
      return `https://sign.${zohoConfig.oauth.domain}/api/v1`;
    },
  },

  // 6. Zoho Meeting
  meeting: {
    zsoid: process.env.ZOHO_MEETING_ZSOID || "",
    get apiBase() {
      return `https://meeting.${zohoConfig.oauth.domain}/api/v2`;
    },
  },

  // 7. Zoho Analytics
  analytics: {
    orgId: process.env.ZOHO_ANALYTICS_ORG_ID || "",
    workspaceId: process.env.ZOHO_ANALYTICS_WORKSPACE_ID || "",
    get apiBase() {
      return `https://analyticsapi.${zohoConfig.oauth.domain}/restapi/v2`;
    },
  },

  // 8. Zoho Subscriptions
  subscriptions: {
    orgId: process.env.ZOHO_SUBSCRIPTIONS_ORG_ID || "",
    get apiBase() {
      return `https://subscriptions.${zohoConfig.oauth.domain}/api/v1`;
    },
  },

  // 9. Zoho Cliq
  cliq: {
    webhookUrl: process.env.ZOHO_CLIQ_WEBHOOK_URL || "",
  },

  // 10. Zoho Creator
  creator: {
    owner: process.env.ZOHO_CREATOR_OWNER || "",
    appName: process.env.ZOHO_CREATOR_APP_NAME || "",
    get apiBase() {
      return `https://creator.${zohoConfig.oauth.domain}/api/v2/${this.owner}`;
    },
  },
};

export default zohoConfig;
