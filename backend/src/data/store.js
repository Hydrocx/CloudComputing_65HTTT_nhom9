import crypto from "crypto";

const USERS = new Map();
const COURSES = new Map();
const ACCESS_LOGS = [];

const seed = () => {
  const adminId = crypto.randomUUID();
  const teacherId = crypto.randomUUID();
  const studentId = crypto.randomUUID();
  const courseId = crypto.randomUUID();

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
};

seed();

export const getUsers = () => Array.from(USERS.values());

export const getUserById = (id) => USERS.get(id);

export const getUserByEmail = (email) =>
  Array.from(USERS.values()).find((user) => user.email === email);

export const addUser = (payload) => {
  const id = crypto.randomUUID();
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
  const id = crypto.randomUUID();
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
