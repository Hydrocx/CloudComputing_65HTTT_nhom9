/**
 * Zoho Sign Service
 * Digital signing for certificates and contracts.
 */

import zohoConfig from "../config/zoho.js";
import { zohoFetch } from "./zohoAuth.js";

/**
 * Create a sign request for a document.
 */
export const createSignRequest = async ({ documentUrl, signerEmail, signerName, documentName }) => {
  const url = `${zohoConfig.sign.apiBase}/requests`;

  const payload = {
    requests: {
      request_name: documentName || "EduCloud Document",
      actions: [
        {
          recipient_name: signerName,
          recipient_email: signerEmail,
          action_type: "SIGN",
          signing_order: 1,
        },
      ],
      notes: "Vui lòng ký xác nhận tài liệu từ EduCloud.",
    },
  };

  // First create the request, then upload document
  return zohoFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Get sign request status.
 */
export const getSignStatus = async (requestId) => {
  const url = `${zohoConfig.sign.apiBase}/requests/${requestId}`;

  return zohoFetch(url);
};

/**
 * Get all sign requests.
 */
export const getSignRequests = async (page = 1, perPage = 20) => {
  const url = `${zohoConfig.sign.apiBase}/requests?page_context.row_count=${perPage}&page_context.start_index=${(page - 1) * perPage + 1}`;

  return zohoFetch(url);
};

/**
 * Download signed document.
 */
export const downloadSignedDocument = async (requestId) => {
  const url = `${zohoConfig.sign.apiBase}/requests/${requestId}/pdf`;

  return zohoFetch(url, {
    headers: { Accept: "application/pdf" },
  });
};
