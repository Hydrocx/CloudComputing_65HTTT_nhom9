/**
 * Zoho Cliq Routes
 */

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { sendNotification, notifySystemAlert } from "../services/zohoCliqService.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// Send a notification (Admin only)
router.post("/notify", auth, requireRole("Admin"), async (req, res) => {
  try {
    const { message, card } = req.body;
    if (!message) {
      return sendError(res, "Thiếu thông tin: message.");
    }

    const result = await sendNotification({ message, card });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi gửi thông báo: ${error.message}`, 500);
  }
});

// Test webhook (Admin only)
router.post("/test", auth, requireRole("Admin"), async (req, res) => {
  try {
    const result = await notifySystemAlert("🧪 Test thông báo từ EduCloud Dashboard.");
    return sendSuccess(res, { message: "Test notification đã gửi.", result });
  } catch (error) {
    return sendError(res, `Lỗi test: ${error.message}`, 500);
  }
});

export default router;
