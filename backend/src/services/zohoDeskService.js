/**
 * Zoho Desk Service
 * Manage support tickets for students.
 */

import zohoConfig from "../config/zoho.js";
import { zohoFetch } from "./zohoAuth.js";
/**
 * Create a new support ticket.
 */
export const createTicket = async ({ subject, description, email, name, category }) => {
  const url = `${zohoConfig.desk.apiBase}/tickets`;

  const payload = {
    subject,
    description,
    departmentId: zohoConfig.desk.departmentId,
    contact: {
      lastName: name || email.split("@")[0],
      email: email
    },
    category: category || "General",
    priority: "Medium",
    channel: "Web",
    status: "Open",
  };

  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { orgId: zohoConfig.desk.orgId },
  });
};

/**
 * Get tickets filtered by email.
 */
export const getTickets = async (email, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const url = `${zohoConfig.desk.apiBase}/tickets?email=${encodeURIComponent(email)}&from=${from}&limit=${limit}&sortBy=createdTime`;

  return zohoFetch(url, {
    headers: { orgId: zohoConfig.desk.orgId },
  });
};

/**
 * Get all tickets (admin).
 */
export const getAllTickets = async (page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const url = `${zohoConfig.desk.apiBase}/tickets?from=${from}&limit=${limit}&sortBy=createdTime`;

  return zohoFetch(url, {
    headers: { orgId: zohoConfig.desk.orgId },
  });
};

/**
 * Get a single ticket by ID.
 */
export const getTicketById = async (ticketId) => {
  const url = `${zohoConfig.desk.apiBase}/tickets/${ticketId}`;

  return zohoFetch(url, {
    headers: { orgId: zohoConfig.desk.orgId },
  });
};
