/**
 * Zoho Invoice Service
 * Automatic invoice generation and PDF retrieval.
 */

import zohoConfig from "../config/zoho.js";
import { zohoFetch } from "./zohoAuth.js";

/**
 * Create a new invoice.
 */
export const createInvoice = async ({ customerEmail, customerName, items, tax }) => {
  const url = `${zohoConfig.invoice.apiBase}/invoices?organization_id=${zohoConfig.invoice.orgId}`;

  const lineItems = items.map((item) => ({
    name: item.name,
    description: item.description || "",
    rate: item.rate,
    quantity: item.quantity || 1,
  }));

  const payload = {
    customer_name: customerName,
    customer_email: customerEmail,
    line_items: lineItems,
    is_inclusive_tax: false,
    tax_total: tax || 0,
    notes: "Hóa đơn học phí EduCloud — Cảm ơn bạn đã đăng ký!",
  };

  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Get invoices for a customer by email.
 */
export const getInvoices = async (customerEmail) => {
  const url = `${zohoConfig.invoice.apiBase}/invoices?organization_id=${zohoConfig.invoice.orgId}&email=${encodeURIComponent(customerEmail)}`;

  return zohoFetch(url);
};

/**
 * Get all invoices (admin).
 */
export const getAllInvoices = async (page = 1, perPage = 25) => {
  const url = `${zohoConfig.invoice.apiBase}/invoices?organization_id=${zohoConfig.invoice.orgId}&page=${page}&per_page=${perPage}`;

  return zohoFetch(url);
};

/**
 * Get invoice PDF.
 */
export const getInvoicePdf = async (invoiceId) => {
  const url = `${zohoConfig.invoice.apiBase}/invoices/${invoiceId}?organization_id=${zohoConfig.invoice.orgId}&accept=pdf`;

  return zohoFetch(url, {
    headers: { Accept: "application/pdf" },
  });
};
