/**
 * Zoho CRM Routes
 */

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { createLead, getLeads, getLeadById, convertLead } from "../services/zohoCrmService.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// Create a new lead (public-facing — from consultation form)
router.post("/leads", async (req, res) => {
  try {
    const { name, email, phone, courseInterest } = req.body;
    if (!name || !email) {
      return sendError(res, "Thiếu thông tin: name, email.");
    }

    const result = await createLead({ name, email, phone, courseInterest });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi tạo lead: ${error.message}`, 500);
  }
});

// Get all leads (Admin only)
router.get("/leads", auth, requireRole("Admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await getLeads(page);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy leads: ${error.message}`, 500);
  }
});

// Get lead details
router.get("/leads/:id", auth, requireRole("Admin"), async (req, res) => {
  try {
    const result = await getLeadById(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy lead: ${error.message}`, 500);
  }
});

// Convert lead to contact
router.post("/leads/:id/convert", auth, requireRole("Admin"), async (req, res) => {
  try {
    const result = await convertLead(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi chuyển đổi lead: ${error.message}`, 500);
  }
});

export default router;
