import crypto from "crypto";

const USERS = new Map();
const COURSES = new Map();
const COMMENTS = new Map();
const REVIEWS = new Map();
const ACCESS_LOGS = [];

const createObjectId = () => crypto.randomBytes(12).toString("hex");

const seed = () => {
  const adminId = createObjectId();
  const teacherId = createObjectId();
  const studentId = createObjectId();
  const courseId = createObjectId();

  const admin = {
    id: adminId,
    name: "Admin",
    email: "admin@educloud.vn",
    role: "Admin",
    courseIds: [],
    enrolledCourseIds: [],
  };

  const teacher = {
    id: teacherId,
    name: "Co giao Lan",
    email: "lan.giangvien@educloud.vn",
    role: "Teacher",
    courseIds: [courseId],
    enrolledCourseIds: [],
  };

  const student = {
    id: studentId,
    name: "Sinh vien Minh",
    email: "minh.sinhvien@educloud.vn",
    role: "Student",
    courseIds: [],
    enrolledCourseIds: [courseId],
  };

  const course = {
    id: courseId,
    title: "Kien truc GCS co ban",
    description: "Lop hoc demo ve bucket, signed URL va versioning.",
    teacherEmail: teacher.email,
    studentEmails: [student.email],
    createdAt: new Date().toISOString(),
  };

  USERS.set(adminId, admin);
  USERS.set(teacherId, teacher);
  USERS.set(studentId, student);
  COURSES.set(courseId, course);

  const firstCommentId = createObjectId();
  const secondCommentId = createObjectId();
  const replyCommentId = createObjectId();
  const now = Date.now();

  COMMENTS.set(firstCommentId, {
    id: firstCommentId,
    courseId,
    authorId: studentId,
    parentCommentId: null,
    content: "Bai hoc rat ro rang, minh muon xem them vi du.",
    createdAt: new Date(now - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60).toISOString(),
  });

  COMMENTS.set(secondCommentId, {
    id: secondCommentId,
    courseId,
    authorId: teacherId,
    parentCommentId: null,
    content: "Moi nguoi co the dat cau hoi tai day nhe.",
    createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 45).toISOString(),
  });

  COMMENTS.set(replyCommentId, {
    id: replyCommentId,
    courseId,
    authorId: adminId,
    parentCommentId: secondCommentId,
    content: "Minh se cap nhat them tai lieu mau vao tuan nay.",
    createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 30).toISOString(),
  });

  const teacherReviewId = createObjectId();
  const studentReviewId = createObjectId();

  REVIEWS.set(`${courseId}:${teacherId}`, {
    id: teacherReviewId,
    courseId,
    authorId: teacherId,
    rating: 5,
    content: "Noi dung duoi dang bai tap rat phu hop voi lop.",
    createdAt: new Date(now - 1000 * 60 * 80).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 80).toISOString(),
  });

  REVIEWS.set(`${courseId}:${studentId}`, {
    id: studentReviewId,
    courseId,
    authorId: studentId,
    rating: 4,
    content: "Bai hoc hay, minh muon them phan demo chi tiet.",
    createdAt: new Date(now - 1000 * 60 * 20).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 20).toISOString(),
  });
};

seed();

export const getUsers = () => Array.from(USERS.values());

export const getUserById = (id) => USERS.get(id);

export const getUserByEmail = (email) =>
  Array.from(USERS.values()).find((user) => user.email === email);

export const addUser = (payload) => {
  const id = createObjectId();
  const user = { id, ...payload };
  USERS.set(id, user);
  return user;
};

export const updateUser = (id, patch) => {
  const user = USERS.get(id);
  if (!user) return null;
  const updated = { ...user, ...patch };
  USERS.set(id, updated);
  return updated;
};

export const getCourses = () => Array.from(COURSES.values());

export const getCourseById = (id) => COURSES.get(id);

export const addCourse = (payload) => {
  const id = createObjectId();
  const course = { id, ...payload };
  COURSES.set(id, course);
  return course;
};

export const updateCourse = (id, patch) => {
  const course = COURSES.get(id);
  if (!course) return null;
  const updated = { ...course, ...patch };
  COURSES.set(id, updated);
  return updated;
};

export const deleteCourse = (id) => COURSES.delete(id);

export const addAccessLog = (log) => {
  ACCESS_LOGS.unshift(log);
  if (ACCESS_LOGS.length > 200) ACCESS_LOGS.pop();
};

export const getAccessLogs = () => ACCESS_LOGS.slice(0, 50);

export const getOrCreateUserByEmail = ({ email, name, role }) => {
  const existing = getUserByEmail(email);
  if (existing) return existing;

  return addUser({
    email,
    name: name || email.split("@")[0],
    role: role || "Student",
    courseIds: [],
    enrolledCourseIds: [],
  });
};

export const addComment = (payload) => {
  const id = createObjectId();
  const timestamp = new Date().toISOString();
  const comment = {
    id,
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  COMMENTS.set(id, comment);
  return comment;
};

export const getCommentById = (id) => COMMENTS.get(id);

export const getCommentsByCourse = (courseId) =>
  Array.from(COMMENTS.values())
    .filter((comment) => comment.courseId === courseId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export const upsertReview = (payload) => {
  const key = `${payload.courseId}:${payload.authorId}`;
  const existing = REVIEWS.get(key);
  const timestamp = new Date().toISOString();
  const review = {
    id: existing?.id || createObjectId(),
    ...payload,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  };
  REVIEWS.set(key, review);
  return review;
};

export const getReviewsByCourse = (courseId) =>
  Array.from(REVIEWS.values())
    .filter((review) => review.courseId === courseId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

export const getReviewStatsByCourse = (courseId) => {
  const reviews = getReviewsByCourse(courseId);
  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  return { courseId, averageRating, totalReviews };
};
