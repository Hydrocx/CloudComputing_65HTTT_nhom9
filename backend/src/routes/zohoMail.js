/**
 * Zoho Mail Routes
 */

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { sendEmail, sendActivationEmail } from "../services/zohoMailService.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// Send a custom email (Admin only)
router.post("/send", auth, requireRole("Admin"), async (req, res) => {
  try {
    const { to, subject, htmlBody } = req.body;
    if (!to || !subject || !htmlBody) {
      return sendError(res, "Thiếu thông tin: to, subject, htmlBody.");
    }

    const result = await sendEmail({ to, subject, htmlBody });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi gửi email: ${error.message}`, 500);
  }
});

// Send test email (Dev only)
router.post("/test", auth, requireRole("Admin"), async (req, res) => {
  try {
    const testUser = { name: "Test User", email: req.user.email };
    const result = await sendActivationEmail(testUser);
    return sendSuccess(res, { message: "Email test đã gửi.", result });
  } catch (error) {
    return sendError(res, `Lỗi gửi email test: ${error.message}`, 500);
  }
});

export default router;
