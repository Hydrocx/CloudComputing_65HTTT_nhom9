/**
 * Zoho API Client
 * Centralized API calls for all Zoho services.
 */

import client from "./client.js";

// === 1. Zoho Mail ===
export const zohoMail = {
  send: (data) => client.post("/zoho/mail/send", data),
  test: () => client.post("/zoho/mail/test"),
};

// === 2. Zoho CRM ===
export const zohoCrm = {
  createLead: (data) => client.post("/zoho/crm/leads", data),
  getLeads: (page = 1) => client.get(`/zoho/crm/leads?page=${page}`),
  getLeadById: (id) => client.get(`/zoho/crm/leads/${id}`),
  convertLead: (id) => client.post(`/zoho/crm/leads/${id}/convert`),
};

// === 3. Zoho Desk ===
export const zohoDesk = {
  createTicket: (data) => client.post("/zoho/desk/tickets", data),
  getTickets: (page = 1) => client.get(`/zoho/desk/tickets?page=${page}`),
  getTicketById: (id) => client.get(`/zoho/desk/tickets/${id}`),
};

// === 4. Zoho Invoice ===
export const zohoInvoice = {
  create: (data) => client.post("/zoho/invoice/create", data),
  list: (page = 1) => client.get(`/zoho/invoice/list?page=${page}`),
  getPdf: (id) => client.get(`/zoho/invoice/${id}/pdf`, { responseType: "blob" }),
};

// === 5. Zoho Sign ===
export const zohoSign = {
  createRequest: (data) => client.post("/zoho/sign/request", data),
  getRequests: (page = 1) => client.get(`/zoho/sign/requests?page=${page}`),
  getStatus: (id) => client.get(`/zoho/sign/request/${id}`),
  download: (id) => client.get(`/zoho/sign/request/${id}/download`, { responseType: "blob" }),
};

// === 6. Zoho Meeting ===
export const zohoMeeting = {
  create: (data) => client.post("/zoho/meeting/create", data),
  list: () => client.get("/zoho/meeting/list"),
  getById: (id) => client.get(`/zoho/meeting/${id}`),
  getJoinUrl: (id) => client.get(`/zoho/meeting/${id}/join`),
  delete: (id) => client.delete(`/zoho/meeting/${id}`),
};

// === 7. Zoho Analytics ===
export const zohoAnalytics = {
  sync: () => client.post("/zoho/analytics/sync"),
  getEmbedUrl: (viewId) => client.get(`/zoho/analytics/embed/${viewId}`),
  getViews: () => client.get("/zoho/analytics/views"),
};

// === 8. Zoho Subscriptions ===
export const zohoSubscription = {
  getPlans: () => client.get("/zoho/subscription/plans"),
  create: (data) => client.post("/zoho/subscription/create", data),
  list: (page = 1) => client.get(`/zoho/subscription/list?page=${page}`),
  getById: (id) => client.get(`/zoho/subscription/${id}`),
  cancel: (id) => client.post(`/zoho/subscription/${id}/cancel`),
};

// === 9. Zoho Cliq ===
export const zohoCliq = {
  notify: (data) => client.post("/zoho/cliq/notify", data),
  test: () => client.post("/zoho/cliq/test"),
};

// === 10. Zoho Creator ===
export const zohoCreator = {
  getRecords: (app, form, page = 1) => client.get(`/zoho/creator/${app}/records?form=${form}&page=${page}`),
  addRecord: (app, data) => client.post(`/zoho/creator/${app}/records`, data),
  getEmbedUrl: (app) => client.get(`/zoho/creator/${app}/embed`),
};
