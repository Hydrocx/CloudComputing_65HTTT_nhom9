import jwt from "jsonwebtoken";
import { getUserByEmail } from "../data/store.js";

const JWT_SECRET = process.env.JWT_SECRET;
const DEV_AUTH_BYPASS = process.env.DEV_AUTH_BYPASS === "true";

const decodeBase64Json = (value) => {
  const json = Buffer.from(value, "base64").toString("utf8");
  return JSON.parse(json);
};

export const auth = (req, res, next) => {
  try {
    if (DEV_AUTH_BYPASS) {
      const devUser = req.headers["x-dev-user"];
      if (!devUser) {
        return res.status(401).json({ success: false, error: "Thieu thong tin nguoi dung." });
      }
      const parsed = decodeBase64Json(devUser);
      const stored = parsed?.email ? getUserByEmail(parsed.email) : null;
      req.user = stored ? { ...stored, ...parsed } : parsed;
      return next();
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ success: false, error: "Chua dang nhap." });
    }

    if (!JWT_SECRET) {
      return res
        .status(500)
        .json({ success: false, error: "Thieu JWT_SECRET tren server." });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const stored = payload.email ? getUserByEmail(payload.email) : null;
    const baseUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      courseIds: payload.courseIds || [],
      enrolledCourseIds: payload.enrolledCourseIds || [],
    };
    req.user = stored ? { ...stored, ...baseUser } : baseUser;

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Token khong hop le." });
  }
};
