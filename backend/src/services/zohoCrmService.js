/**
 * Zoho CRM Service
 * Manage leads (potential students) lifecycle.
 */

import zohoConfig from "../config/zoho.js";
import { zohoFetch } from "./zohoAuth.js";

/**
 * Create a new lead in Zoho CRM.
 */
export const createLead = async ({ name, email, phone, courseInterest }) => {
  const url = `${zohoConfig.crm.apiBase}/Leads`;

  const payload = {
    data: [
      {
        Last_Name: name,
        Email: email,
        Phone: phone || "",
        Description: `Quan tâm khóa học: ${courseInterest || "Chưa xác định"}`,
        Lead_Source: "EduCloud Website",
        Company: "EduCloud Student",
      },
    ],
  };

  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Get leads from Zoho CRM.
 */
export const getLeads = async (page = 1, perPage = 20) => {
  const url = `${zohoConfig.crm.apiBase}/Leads?page=${page}&per_page=${perPage}&sort_by=Created_Time&sort_order=desc`;

  return zohoFetch(url);
};

/**
 * Get a single lead by ID.
 */
export const getLeadById = async (leadId) => {
  const url = `${zohoConfig.crm.apiBase}/Leads/${leadId}`;

  return zohoFetch(url);
};

/**
 * Convert a lead to a contact (student).
 */
export const convertLead = async (leadId) => {
  const url = `${zohoConfig.crm.apiBase}/Leads/${leadId}/actions/convert`;

  const payload = {
    data: [
      {
        overwrite: true,
        notify_lead_owner: true,
        notify_new_entity_owner: true,
      },
    ],
  };

  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
