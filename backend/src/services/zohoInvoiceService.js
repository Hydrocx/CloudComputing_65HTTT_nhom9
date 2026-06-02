/**
 * Zoho Invoice Service
 * Automatic invoice generation and PDF retrieval.
 */

import zohoConfig from "../config/zoho.js";
import { zohoFetch } from "./zohoAuth.js";

/**
 * Get or create a customer in Zoho Invoice by email.
 */
const getOrCreateCustomer = async (email, name) => {
  try {
    const searchUrl = `${zohoConfig.invoice.apiBase}/contacts?organization_id=${zohoConfig.invoice.orgId}&email_contains=${encodeURIComponent(email)}`;
    const searchRes = await zohoFetch(searchUrl);

    if (searchRes && searchRes.contacts && searchRes.contacts.length > 0) {
      return searchRes.contacts[0].contact_id;
    }

    const createUrl = `${zohoConfig.invoice.apiBase}/contacts?organization_id=${zohoConfig.invoice.orgId}`;
    const createRes = await zohoFetch(createUrl, {
      method: "POST",
      body: JSON.stringify({
        contact_name: name || email.split("@")[0],
        contact_persons: [{
          first_name: name || email.split("@")[0],
          email: email
        }]
      })
    });

    return createRes.contact.contact_id;
  } catch (err) {
    console.warn("Lỗi lấy/tạo customer trong Invoice:", err.message);
    return null;
  }
};

/**
 * Create a new invoice.
 */
export const createInvoice = async ({ customerEmail, customerName, items, tax }) => {
  const url = `${zohoConfig.invoice.apiBase}/invoices?organization_id=${zohoConfig.invoice.orgId}`;
  
  const customerId = await getOrCreateCustomer(customerEmail, customerName);


  const lineItems = items.map((item) => ({
    name: item.name,
    description: item.description || "",
    rate: item.rate,
    quantity: item.quantity || 1,
  }));

  const payload = {
    customer_id: customerId,
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
