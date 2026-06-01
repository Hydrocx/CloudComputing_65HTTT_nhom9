/**
 * Zoho Sign Routes
 */

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { createSignRequest, getSignStatus, getSignRequests, downloadSignedDocument } from "../services/zohoSignService.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// Create sign request (Admin/Teacher)
router.post("/request", auth, requireRole("Admin", "Teacher"), async (req, res) => {
  try {
    const { documentUrl, signerEmail, signerName, documentName } = req.body;
    if (!signerEmail || !signerName) {
      return sendError(res, "Thiếu thông tin: signerEmail, signerName.");
    }

    const result = await createSignRequest({ documentUrl, signerEmail, signerName, documentName });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi tạo yêu cầu ký: ${error.message}`, 500);
  }
});

// List sign requests
router.get("/requests", auth, requireRole("Admin", "Teacher"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await getSignRequests(page);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy danh sách: ${error.message}`, 500);
  }
});

// Get sign request status
router.get("/request/:id", auth, async (req, res) => {
  try {
    const result = await getSignStatus(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy trạng thái: ${error.message}`, 500);
  }
});

// Download signed document
router.get("/request/:id/download", auth, async (req, res) => {
  try {
    const pdfResponse = await downloadSignedDocument(req.params.id);

    if (pdfResponse?.body) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="signed-${req.params.id}.pdf"`);
      pdfResponse.body.pipe(res);
    } else {
      return sendSuccess(res, { message: "Tài liệu chưa sẵn sàng." });
    }
  } catch (error) {
    return sendError(res, `Lỗi tải tài liệu: ${error.message}`, 500);
  }
});

export default router;
