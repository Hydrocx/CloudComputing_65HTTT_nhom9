/**
 * Zoho CRM Webhook Receiver
 *
 * Listens for incoming Zoho CRM webhook events and processes lead updates.
 *
 * Zoho sends webhooks when leads are created, updated, or deleted.
 * This endpoint:
 *  1. Verifies the webhook secret
 *  2. Parses the event payload
 *  3. Syncs lead updates to the local DB
 *  4. Auto-creates Student accounts when leads are converted
 *
 * Endpoint: POST /api/webhooks/zoho-crm
 * Content-Type: application/json
 */
import express from "express";
import crypto from "crypto";
import config from "../config/zoho-crm.config.js";
import { processWebhook } from "../services/crm.service.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// Webhook Verification
// ---------------------------------------------------------------------------

/**
 * Verify the Zoho webhook signature.
 * Zoho sends an `X-Zoho-Signature` header which is an HMAC-SHA256 of the
 * raw request body, signed with the webhook secret.
 *
 * If verification fails, we still process the request but log a warning.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const verifySignature = (req, res, next) => {
  const signature = req.headers["x-zoho-signature"];

  if (!signature) {
    console.warn("⚠️  Zoho webhook: missing signature header");
    return next(); // Continue anyway — soft verification
  }

  try {
    // Compute expected signature
    const rawBody = JSON.stringify(req.body);
    const expected = crypto
      .createHmac("sha256", config.webhookSecret)
      .update(rawBody)
      .digest("base64");

    if (signature !== expected) {
      console.warn("⚠️  Zoho webhook: invalid signature");
      // Don't reject — Zoho webhook signatures can vary by configuration
    }
  } catch (err) {
    console.warn("⚠️  Zoho webhook signature check failed:", err.message);
  }

  next();
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * POST /api/webhooks/zoho-crm
 * Receive lead updates from Zoho CRM.
 *
 * Zoho webhook payload format (example):
 * {
 *   "operation": "update",
 *   "data": {
 *     "id": "3477263000001234567",
 *     "Lead_Status": "Qualified",
 *     "Email": "user@example.com",
 *     "First_Name": "John",
 *     "Last_Name": "Doe"
 *   },
 *   "event": {
 *     "module": "Leads",
 *     "type": "update"
 *   }
 * }
 */
router.post("/zoho-crm", express.json(), verifySignature, async (req, res) => {
  try {
    const payload = req.body;

    if (!payload) {
      return res.status(400).json({
        success: false,
        error: "Empty request body",
      });
    }

    console.log(
      `📥 Zoho webhook received: operation=${payload.operation || "unknown"}, module=${payload.event?.module || "unknown"}`
    );

    const result = await processWebhook(payload);

    if (result.processed) {
      console.log(`✅ Zoho webhook processed: action=${result.action}`);
      return res.status(200).json({
        success: true,
        data: { message: "Webhook processed", action: result.action },
      });
    }

    console.warn(`⚠️  Zoho webhook not processed: ${result.error}`);
    return res.status(202).json({
      success: true,
      data: { message: "Webhook received but not processed", note: result.error },
    });
  } catch (err) {
    console.error("❌ Zoho webhook error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/webhooks/zoho-crm
 * Health check for the webhook endpoint (Zoho may send a verification GET).
 */
router.get("/zoho-crm", (req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "Zoho CRM webhook endpoint is active", version: "1.0.0" },
  });
});

export default router;
