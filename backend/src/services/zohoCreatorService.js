/**
 * Zoho Creator Service
 * Interact with low-code Creator apps for internal management.
 */

import zohoConfig from "../config/zoho.js";
import { zohoFetch } from "./zohoAuth.js";

/**
 * Get records from a Creator form/report.
 */
export const getRecords = async (appName, formName, page = 1, limit = 20) => {
  const owner = zohoConfig.creator.owner;
  const app = appName || zohoConfig.creator.appName;
  const url = `${zohoConfig.creator.apiBase}/${app}/report/${formName}?from=${(page - 1) * limit + 1}&limit=${limit}`;

  return zohoFetch(url);
};

/**
 * Add a record to a Creator form.
 */
export const addRecord = async (appName, formName, data) => {
  const owner = zohoConfig.creator.owner;
  const app = appName || zohoConfig.creator.appName;
  const url = `${zohoConfig.creator.apiBase}/${app}/form/${formName}`;

  const payload = { data };

  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Update a record in Creator.
 */
export const updateRecord = async (appName, formName, recordId, data) => {
  const app = appName || zohoConfig.creator.appName;
  const url = `${zohoConfig.creator.apiBase}/${app}/report/${formName}/${recordId}`;

  const payload = { data };

  return zohoFetch(url, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

/**
 * Get the embed URL for a Creator application.
 */
export const getEmbedUrl = (appName) => {
  const owner = zohoConfig.creator.owner;
  const app = appName || zohoConfig.creator.appName;
  const domain = zohoConfig.oauth.domain;

  return `https://creator.${domain}/${owner}/${app}`;
};
