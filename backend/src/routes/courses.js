import express from "express";
import { body, param, validationResult } from "express-validator";
import { sendEnrollmentConfirmation } from "../services/zohoMailService.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleCheck.js";
import {
  addComment,
  addCourse,
  addUser,
  deleteCourse,
  getCommentById,
  getCommentsByCourse,
  getCourseById,
  getCourses,
  getOrCreateUserByEmail,
  getReviewStatsByCourse,
  getReviewsByCourse,
  getUserByEmail,
  getUserById,
  updateCourse,
  updateUser,
  upsertReview,
} from "../data/store.js";
import { validateCommentPayload } from "../validation/commentValidation.js";
import { validateReviewPayload } from "../validation/reviewValidation.js";

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

const resolveAuthor = (user) => {
  if (!user?.email) return null;

  return getOrCreateUserByEmail({
    email: user.email,
    name: user.name,
    role: user.role,
  });
};

const toAuthorPayload = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
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

    // Send enrollment confirmation email (non-blocking)
    sendEnrollmentConfirmation({ name: user?.name || email, email }, course).catch((err) =>
      console.warn("[Zoho Mail] Enrollment email failed:", err.message)
    );

    return sendSuccess(res, course);
  }
);

router.get("/:id/comments", auth, (req, res) => {
  const course = getCourseById(req.params.id);
  if (!course) {
    return sendError(res, "Khong tim thay mon hoc.", 404);
  }

  const comments = getCommentsByCourse(course.id).map((comment) => ({
    ...comment,
    author: toAuthorPayload(getUserById(comment.authorId)),
  }));

  return sendSuccess(res, comments);
});

router.post("/:id/comments", auth, (req, res) => {
  const course = getCourseById(req.params.id);
  if (!course) {
    return sendError(res, "Khong tim thay mon hoc.", 404);
  }

  const author = resolveAuthor(req.user);
  if (!author) {
    return sendError(res, "Khong tim thay nguoi dung.", 401);
  }

  let payload;
  try {
    payload = validateCommentPayload({
      courseId: course.id,
      authorId: author.id,
      parentCommentId: req.body.parentCommentId ?? null,
      content: req.body.content ?? "",
    });
  } catch (error) {
    return sendError(res, error?.errors?.[0]?.message || "Noi dung khong hop le.");
  }

  if (payload.parentCommentId) {
    const parent = getCommentById(payload.parentCommentId);
    if (!parent || parent.courseId !== course.id) {
      return sendError(res, "Khong tim thay binh luan cha.", 404);
    }
  }

  const comment = addComment(payload);
  return sendSuccess(res, { ...comment, author: toAuthorPayload(author) });
});

router.get("/:id/reviews", auth, (req, res) => {
  const course = getCourseById(req.params.id);
  if (!course) {
    return sendError(res, "Khong tim thay mon hoc.", 404);
  }

  const reviews = getReviewsByCourse(course.id).map((review) => ({
    ...review,
    author: toAuthorPayload(getUserById(review.authorId)),
  }));

  return sendSuccess(res, reviews);
});

router.get("/:id/reviews/stats", auth, (req, res) => {
  const course = getCourseById(req.params.id);
  if (!course) {
    return sendError(res, "Khong tim thay mon hoc.", 404);
  }

  return sendSuccess(res, getReviewStatsByCourse(course.id));
});

router.post("/:id/reviews", auth, (req, res) => {
  const course = getCourseById(req.params.id);
  if (!course) {
    return sendError(res, "Khong tim thay mon hoc.", 404);
  }

  const author = resolveAuthor(req.user);
  if (!author) {
    return sendError(res, "Khong tim thay nguoi dung.", 401);
  }

  let payload;
  try {
    payload = validateReviewPayload({
      courseId: course.id,
      authorId: author.id,
      rating: req.body.rating,
      content: req.body.content,
    });
  } catch (error) {
    return sendError(res, error?.errors?.[0]?.message || "Danh gia khong hop le.");
  }

  const review = upsertReview(payload);
  return sendSuccess(res, { ...review, author: toAuthorPayload(author) });
});

export default router;
