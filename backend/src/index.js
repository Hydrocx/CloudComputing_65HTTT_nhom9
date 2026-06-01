import "dotenv/config";
import express from "express";
import cors from "cors";
import filesRouter from "./routes/files.js";
import signedUrlRouter from "./routes/signedUrl.js";
import coursesRouter from "./routes/courses.js";
import usersRouter from "./routes/users.js";

// Zoho service routes
import zohoMailRouter from "./routes/zohoMail.js";
import zohoCrmRouter from "./routes/zohoCrm.js";
import zohoDeskRouter from "./routes/zohoDesk.js";
import zohoInvoiceRouter from "./routes/zohoInvoice.js";
import zohoSignRouter from "./routes/zohoSign.js";
import zohoMeetingRouter from "./routes/zohoMeeting.js";
import zohoAnalyticsRouter from "./routes/zohoAnalytics.js";
import zohoSubscriptionRouter from "./routes/zohoSubscription.js";
import zohoCliqRouter from "./routes/zohoCliq.js";
import zohoCreatorRouter from "./routes/zohoCreator.js";

const app = express();
const PORT = process.env.PORT || 3001;
const rawOrigins = process.env.CORS_ORIGIN || "*";
const allowedOrigins = rawOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

// Core routes
app.use("/api/files", filesRouter);
app.use("/api/signed-url", signedUrlRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/users", usersRouter);

// Zoho integration routes
app.use("/api/zoho/mail", zohoMailRouter);
app.use("/api/zoho/crm", zohoCrmRouter);
app.use("/api/zoho/desk", zohoDeskRouter);
app.use("/api/zoho/invoice", zohoInvoiceRouter);
app.use("/api/zoho/sign", zohoSignRouter);
app.use("/api/zoho/meeting", zohoMeetingRouter);
app.use("/api/zoho/analytics", zohoAnalyticsRouter);
app.use("/api/zoho/subscription", zohoSubscriptionRouter);
app.use("/api/zoho/cliq", zohoCliqRouter);
app.use("/api/zoho/creator", zohoCreatorRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Khong tim thay duong dan." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`EduCloud backend running on port ${PORT}`);
});
