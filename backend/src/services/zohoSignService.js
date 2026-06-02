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

  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));

  if (documentUrl) {
    const fileRes = await fetch(documentUrl);
    if (!fileRes.ok) throw new Error("Không thể tải tài liệu để đính kèm.");
    const fileBuffer = await fileRes.arrayBuffer();
    formData.append("file", new File([fileBuffer], "document.pdf", { type: "application/pdf" }));
  } else {
    // Generate an in-memory dummy PDF to avoid external URL blocking (e.g. from GCP IPs)
    const dummyPdfString = `%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]>> endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\ntrailer <</Size 4 /Root 1 0 R>>\nstartxref\n190\n%%EOF`;
    const fileBuffer = Buffer.from(dummyPdfString, "utf-8");
    formData.append("file", new File([fileBuffer], "document.pdf", { type: "application/pdf" }));
  }

  // First create the request, then upload document
  return zohoFetch(url, {
    method: "POST",
    body: formData,
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
  const dataParam = encodeURIComponent(
    JSON.stringify({
      page_context: { row_count: perPage, start_index: (page - 1) * perPage + 1 },
    })
  );
  const url = `${zohoConfig.sign.apiBase}/requests?data=${dataParam}`;

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
