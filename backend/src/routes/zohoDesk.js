/**
 * Zoho Desk Routes
 */

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { createTicket, getTickets, getAllTickets, getTicketById } from "../services/zohoDeskService.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// Create a support ticket
router.post("/tickets", auth, async (req, res) => {
  try {
    const { subject, description, category } = req.body;
    if (!subject || !description) {
      return sendError(res, "Thiếu thông tin: subject, description.");
    }

    const result = await createTicket({
      subject,
      description,
      email: req.user.email,
      name: req.user.name || req.user.email.split('@')[0],
      category,
    });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi tạo ticket: ${error.message}`, 500);
  }
});

// Get tickets — Admin sees all, others see own
router.get("/tickets", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let result;

    if (req.user.role === "Admin") {
      result = await getAllTickets(page);
    } else {
      result = await getTickets(req.user.email, page);
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy tickets: ${error.message}`, 500);
  }
});

// Get ticket details
router.get("/tickets/:id", auth, async (req, res) => {
  try {
    const result = await getTicketById(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy ticket: ${error.message}`, 500);
  }
});

export default router;
