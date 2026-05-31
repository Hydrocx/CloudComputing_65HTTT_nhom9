import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/educloud-nhom9ca3/",
  plugins: [react()],
  server: {
    port: 5173,
  },
});
