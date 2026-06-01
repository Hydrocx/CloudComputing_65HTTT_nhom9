/**
 * Zoho Creator Routes
 */

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { getRecords, addRecord, getEmbedUrl } from "../services/zohoCreatorService.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// Get records from a Creator app (Admin)
router.get("/:app/records", auth, requireRole("Admin"), async (req, res) => {
  try {
    const formName = req.query.form;
    if (!formName) {
      return sendError(res, "Thiếu tham số: form.");
    }

    const page = parseInt(req.query.page) || 1;
    const result = await getRecords(req.params.app, formName, page);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy records: ${error.message}`, 500);
  }
});

// Add a record to Creator (Admin)
router.post("/:app/records", auth, requireRole("Admin"), async (req, res) => {
  try {
    const { form, data } = req.body;
    if (!form || !data) {
      return sendError(res, "Thiếu thông tin: form, data.");
    }

    const result = await addRecord(req.params.app, form, data);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi tạo record: ${error.message}`, 500);
  }
});

// Get embed URL for a Creator app (Admin)
router.get("/:app/embed", auth, requireRole("Admin"), (req, res) => {
  try {
    const embedUrl = getEmbedUrl(req.params.app);
    return sendSuccess(res, { embedUrl });
  } catch (error) {
    return sendError(res, `Lỗi lấy embed URL: ${error.message}`, 500);
  }
});

export default router;
