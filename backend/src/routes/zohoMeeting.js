/**
 * Zoho Meeting Routes
 */

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { createMeeting, getMeetings, getMeetingById, getMeetingJoinUrl, deleteMeeting } from "../services/zohoMeetingService.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

// Create a live class (Teacher/Admin)
router.post("/create", auth, requireRole("Admin", "Teacher"), async (req, res) => {
  try {
    const { topic, startTime, duration } = req.body;
    if (!topic || !startTime) {
      return sendError(res, "Thiếu thông tin: topic, startTime.");
    }

    const result = await createMeeting({
      topic,
      startTime,
      duration,
      presenter: req.user.email,
    });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi tạo lớp học: ${error.message}`, 500);
  }
});

// List all meetings
router.get("/list", auth, async (req, res) => {
  try {
    const result = await getMeetings();
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy danh sách: ${error.message}`, 500);
  }
});

// Get meeting details
router.get("/:id", auth, async (req, res) => {
  try {
    const result = await getMeetingById(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy chi tiết: ${error.message}`, 500);
  }
});

// Get join URL
router.get("/:id/join", auth, async (req, res) => {
  try {
    const result = await getMeetingJoinUrl(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, `Lỗi lấy link tham gia: ${error.message}`, 500);
  }
});

// Delete meeting (Teacher/Admin)
router.delete("/:id", auth, requireRole("Admin", "Teacher"), async (req, res) => {
  try {
    await deleteMeeting(req.params.id);
    return sendSuccess(res, { deleted: true });
  } catch (error) {
    return sendError(res, `Lỗi xóa lớp học: ${error.message}`, 500);
  }
});

export default router;
