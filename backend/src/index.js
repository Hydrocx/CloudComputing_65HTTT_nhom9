import "dotenv/config";
import express from "express";
import cors from "cors";
import filesRouter from "./routes/files.js";
import signedUrlRouter from "./routes/signedUrl.js";
import coursesRouter from "./routes/courses.js";
import usersRouter from "./routes/users.js";

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/files", filesRouter);
app.use("/api/signed-url", signedUrlRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/users", usersRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Khong tim thay duong dan." });
});

app.listen(PORT, () => {
  console.log(`EduCloud backend running on port ${PORT}`);
});
