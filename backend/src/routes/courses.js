import express from "express";
import { body, param, validationResult } from "express-validator";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import {
  addCourse,
  addUser,
  deleteCourse,
  getCourseById,
  getCourses,
  getUserByEmail,
  updateCourse,
  updateUser,
} from "../data/store.js";

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

router.get("/", auth, (req, res) => {
  const role = req.user.role;
  const email = req.user.email;
  const courses = getCourses();

  if (role === "Admin") {
    return sendSuccess(res, courses);
  }

  if (role === "Teacher") {
    return sendSuccess(
      res,
      courses.filter((course) => course.teacherEmail === email)
    );
  }

  return sendSuccess(res, courses);
});

router.post(
  "/",
  auth,
  requireRole("Teacher", "Admin"),
  body("title").isString().isLength({ min: 3 }).withMessage("Tieu de bat buoc."),
  body("description")
    .isString()
    .isLength({ min: 5 })
    .withMessage("Mo ta bat buoc."),
  body("teacherEmail").optional().isEmail(),
  validate,
  (req, res) => {
    const role = req.user.role;
    let teacherEmail = role === "Teacher" ? req.user.email : req.body.teacherEmail;

    if (!teacherEmail && role === "Admin") {
      teacherEmail = req.user.email;
    }

    if (!teacherEmail) {
      return sendError(res, "Can email giang vien.");
    }

    const course = addCourse({
      title: req.body.title,
      description: req.body.description,
      teacherEmail,
      studentEmails: [],
      createdAt: new Date().toISOString(),
    });

    const teacher = getUserByEmail(teacherEmail) ||
      addUser({
        email: teacherEmail,
        name: teacherEmail.split("@")[0],
        role: "Teacher",
        courseIds: [],
        enrolledCourseIds: [],
      });

    updateUser(teacher.id, {
      courseIds: Array.from(new Set([...(teacher.courseIds || []), course.id])),
    });

    return sendSuccess(res, course);
  }
);

router.patch(
  "/:id",
  auth,
  requireRole("Teacher", "Admin"),
  body("title").optional().isString().isLength({ min: 3 }),
  body("description").optional().isString().isLength({ min: 5 }),
  validate,
  (req, res) => {
    const course = getCourseById(req.params.id);
    if (!course) {
      return sendError(res, "Khong tim thay mon hoc.", 404);
    }

    if (req.user.role === "Teacher" && course.teacherEmail !== req.user.email) {
      return sendError(res, "Khong du quyen sua mon hoc.", 403);
    }

    const updated = updateCourse(req.params.id, req.body);
    return sendSuccess(res, updated);
  }
);

router.delete(
  "/:id",
  auth,
  requireRole("Teacher", "Admin"),
  (req, res) => {
    const course = getCourseById(req.params.id);
    if (!course) {
      return sendError(res, "Khong tim thay mon hoc.", 404);
    }

    if (req.user.role === "Teacher" && course.teacherEmail !== req.user.email) {
      return sendError(res, "Khong du quyen xoa mon hoc.", 403);
    }

    deleteCourse(req.params.id);
    return sendSuccess(res, { deleted: true });
  }
);

router.post(
  "/:id/enroll",
  auth,
  requireRole("Student"),
  param("id").isString().withMessage("ID mon hoc khong hop le."),
  validate,
  (req, res) => {
  const course = getCourseById(req.params.id);
  if (!course) {
    return sendError(res, "Khong tim thay mon hoc.", 404);
  }

  const email = req.user.email;
  if (!course.studentEmails.includes(email)) {
    course.studentEmails.push(email);
    updateCourse(course.id, { studentEmails: course.studentEmails });
  }

  const user = getUserByEmail(email);
  if (user && !user.enrolledCourseIds.includes(course.id)) {
    updateUser(user.id, {
      enrolledCourseIds: [...user.enrolledCourseIds, course.id],
    });
  }

  return sendSuccess(res, course);
  }
);

export default router;
