/**
 * Zoho Invoice Routes
 */

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { createInvoice, getInvoices, getAllInvoices, getInvoicePdf } from "../services/zohoInvoiceService.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// Create an invoice (Admin)
router.post("/create", auth, requireRole("Admin"), async (req, res) => {
  try {
    const { customerEmail, customerName, items, tax } = req.body;
    if (!customerEmail || !customerName || !items?.length) {
      return sendError(res, "Thiếu thông tin: customerEmail, customerName, items.");
    }

    const result = await createInvoice({ customerEmail, customerName, items, tax });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi tạo hóa đơn: ${error.message}`, 500);
  }
});

// Get invoices — Admin sees all, others see own
router.get("/list", auth, async (req, res) => {
  try {
    let result;

    if (req.user.role === "Admin") {
      const page = parseInt(req.query.page) || 1;
      result = await getAllInvoices(page);
    } else {
      result = await getInvoices(req.user.email);
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy hóa đơn: ${error.message}`, 500);
  }
});

// Get invoice PDF
router.get("/:id/pdf", auth, async (req, res) => {
  try {
    const pdfResponse = await getInvoicePdf(req.params.id);

    if (pdfResponse?.body) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="invoice-${req.params.id}.pdf"`);
      pdfResponse.body.pipe(res);
    } else {
      return sendSuccess(res, { message: "PDF URL sẽ được gửi qua email." });
    }
  } catch (error) {
    return sendError(res, `Lỗi tải PDF: ${error.message}`, 500);
  }
});

export default router;
