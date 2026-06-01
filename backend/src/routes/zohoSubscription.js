/**
 * Zoho Subscriptions Routes
 */

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import {
  createSubscription,
  getSubscription,
  getSubscriptions,
  cancelSubscription,
  getPlans,
  handleWebhook,
} from "../services/zohoSubscriptionService.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// Get available plans
router.get("/plans", auth, async (req, res) => {
  try {
    const result = await getPlans();
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy gói: ${error.message}`, 500);
  }
});

// Create subscription
router.post("/create", auth, async (req, res) => {
  try {
    const { planCode } = req.body;
    if (!planCode) {
      return sendError(res, "Thiếu thông tin: planCode.");
    }

    const result = await createSubscription({
      customerEmail: req.user.email,
      customerName: req.user.name,
      planCode,
    });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi đăng ký gói: ${error.message}`, 500);
  }
});

// Get all subscriptions (Admin)
router.get("/list", auth, requireRole("Admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await getSubscriptions(page);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy danh sách: ${error.message}`, 500);
  }
});

// Get subscription details
router.get("/:id", auth, async (req, res) => {
  try {
    const result = await getSubscription(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy chi tiết: ${error.message}`, 500);
  }
});

// Cancel subscription
router.post("/:id/cancel", auth, async (req, res) => {
  try {
    const result = await cancelSubscription(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi hủy gói: ${error.message}`, 500);
  }
});

// Webhook endpoint (no auth — Zoho calls this)
router.post("/webhook", (req, res) => {
  try {
    const result = handleWebhook(req.body);
    console.log("[Zoho Subscription Webhook]", result);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi webhook: ${error.message}`, 500);
  }
});

export default router;
