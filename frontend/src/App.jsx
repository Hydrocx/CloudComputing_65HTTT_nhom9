import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar.jsx";

const PAGE_TITLES = {
  "/": "Tổng quan hệ thống",
  "/courses": "Quản lý khóa học",
  "/files": "Quản lý tệp GCS",
  "/signed-url": "Trình diễn Signed URL",
  "/iam": "Quản trị IAM",
  "/versioning": "Lịch sử phiên bản",
  "/leads": "🎯 Zoho CRM — Lead Pipeline",
  "/email": "📧 Hệ thống Email",
};

const App = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const title = useMemo(
    () => PAGE_TITLES[location.pathname] || "EduCloud",
    [location.pathname]
  );

  return (
    <div className="min-h-screen bg-educloud text-slate-100">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              EDUCLOUD
            </p>
            <h1 className="text-xl font-semibold text-white">{title}</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 md:hidden"
          >
            Danh mục
          </button>
        </header>

        <main className="animate-fadeUp px-6 py-8">
          <Outlet />
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#e2e8f0",
            border: "1px solid rgba(148,163,184,0.2)",
          },
        }}
      />
    </div>
  );
};

export default App;
