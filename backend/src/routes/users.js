import express from "express";
import { body, validationResult } from "express-validator";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import { addUser, getUsers, updateUser } from "../data/store.js";

const router = express.Router();

const sendSuccess = (res, data) => res.json({ success: true, data });
const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, error: message });

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg);
  }
  return next();
};

router.get("/", auth, requireRole("Admin"), (req, res) => {
  return sendSuccess(res, getUsers());
});

router.post(
  "/",
  auth,
  requireRole("Admin"),
  body("email").isEmail().withMessage("Email khong hop le."),
  body("name").isString().isLength({ min: 2 }).withMessage("Ten bat buoc."),
  body("role")
    .isIn(["Admin", "Teacher", "Student"])
    .withMessage("Vai tro khong hop le."),
  validate,
  (req, res) => {
    const { email, name, role, courseIds = [], enrolledCourseIds = [] } = req.body;
    const user = addUser({ email, name, role, courseIds, enrolledCourseIds });
    return sendSuccess(res, user);
  }
);

router.patch(
  "/:id",
  auth,
  requireRole("Admin"),
  body("role")
    .optional()
    .isIn(["Admin", "Teacher", "Student"])
    .withMessage("Vai tro khong hop le."),
  body("name").optional().isString().isLength({ min: 2 }),
  validate,
  (req, res) => {
    const updated = updateUser(req.params.id, req.body);
    if (!updated) {
      return sendError(res, "Khong tim thay nguoi dung.", 404);
    }
    return sendSuccess(res, updated);
  }
);

export default router;
