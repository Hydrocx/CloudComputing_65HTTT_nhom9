/**
 * Zoho Payment Webhook Route
 * Central handler for payment events — ties together Invoice, Mail, and Cliq.
 * Called by external payment gateways or Zoho Subscriptions webhook.
 */

import express from "express";
import { createInvoice } from "../services/zohoInvoiceService.js";
import { sendTuitionReceipt } from "../services/zohoMailService.js";
import { notifyHighValueTransaction } from "../services/zohoCliqService.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

/**
 * POST /api/zoho/payment/webhook
 * Receives payment confirmation and triggers:
 * 1. Invoice creation via Zoho Invoice
 * 2. Receipt email via Zoho Mail
 * 3. Notification via Zoho Cliq (if high-value)
 */
router.post("/webhook", async (req, res) => {
  try {
    const {
      customerEmail,
      customerName,
      courseName,
      amount,
      transactionId,
    } = req.body;

    if (!customerEmail || !customerName || !amount) {
      return sendError(res, "Thiếu thông tin thanh toán: customerEmail, customerName, amount.");
    }

    const results = { invoice: null, email: null, cliq: null };

    // 1. Create invoice via Zoho Invoice
    try {
      results.invoice = await createInvoice({
        customerEmail,
        customerName,
        items: [
          {
            name: courseName || "Khóa học EduCloud",
            description: `Transaction ID: ${transactionId || "N/A"}`,
            rate: parseFloat(amount),
            quantity: 1,
          },
        ],
      });
    } catch (err) {
      results.invoice = { error: err.message };
      console.warn("[Zoho Invoice] Auto-create failed:", err.message);
    }

    // 2. Send receipt email via Zoho Mail
    try {
      const invoiceId = results.invoice?.invoice?.invoice_id || transactionId || "N/A";
      results.email = await sendTuitionReceipt(
        { name: customerName, email: customerEmail },
        {
          invoiceId,
          total: `${parseFloat(amount).toLocaleString("vi-VN")}đ`,
          date: new Date().toLocaleDateString("vi-VN"),
        }
      );
    } catch (err) {
      results.email = { error: err.message };
      console.warn("[Zoho Mail] Receipt email failed:", err.message);
    }

    // 3. Notify admin via Zoho Cliq if high-value (>= 1,000,000đ)
    if (parseFloat(amount) >= 1000000) {
      try {
        results.cliq = await notifyHighValueTransaction({
          amount: `${parseFloat(amount).toLocaleString("vi-VN")}đ`,
          customerEmail,
          courseName: courseName || "N/A",
        });
      } catch (err) {
        results.cliq = { error: err.message };
        console.warn("[Zoho Cliq] High-value notification failed:", err.message);
      }
    }

    return sendSuccess(res, {
      message: "Webhook thanh toán đã xử lý.",
      transactionId: transactionId || null,
      results,
    });
  } catch (error) {
    return sendError(res, `Lỗi xử lý webhook: ${error.message}`, 500);
  }
});

export default router;
