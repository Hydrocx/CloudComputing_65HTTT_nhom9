import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import zohoConfig from "./src/config/zoho.js";
import { pushData } from "./src/services/zohoAnalyticsService.js";

async function test() {
  try {
    console.log("Config:", zohoConfig.analytics.apiBase);
    const res = await pushData("EduCloud_Users", [{
      user_id: "test1",
      name: "Test User",
      email: "test@example.com",
      role: "Student",
      courses_count: 1,
      enrolled_count: 1
    }]);
    console.log("Result:", res);
  } catch(e) {
    console.error("Error:", e);
  }
}

test();
