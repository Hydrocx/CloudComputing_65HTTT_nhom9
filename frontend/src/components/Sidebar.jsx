import { useState } from "react";
import { NavLink } from "react-router-dom";
import RoleBadge from "./RoleBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = [
  { path: "/", label: "Tổng quan" },
  { path: "/courses", label: "Khóa học" },
  { path: "/files", label: "Tệp GCS" },
  { path: "/signed-url", label: "Signed URL" },
  { path: "/versioning", label: "Phiên bản", roles: ["Admin", "Teacher"] },
  { path: "/iam", label: "IAM", roles: ["Admin"] },
];

const ZOHO_NAV_ITEMS = [
  { path: "/zoho", label: "Zoho Hub", icon: "🏠" },
  { path: "/zoho/mail", label: "Email", icon: "📧", roles: ["Admin"] },
  { path: "/zoho/crm", label: "CRM & Tư vấn", icon: "👥", roles: ["Admin"] },
  { path: "/zoho/crm/leads", label: "Danh sách Lead", icon: "📋", roles: ["Admin"] },
  { path: "/zoho/desk", label: "Hỗ trợ", icon: "🎫" },
  { path: "/zoho/invoice", label: "Hóa đơn", icon: "📄" },
  { path: "/zoho/sign", label: "Ký số", icon: "✍️", roles: ["Admin", "Teacher"] },
  { path: "/zoho/meeting", label: "Lớp học Live", icon: "📹" },
  { path: "/zoho/analytics", label: "Phân tích", icon: "📊", roles: ["Admin"] },
  { path: "/zoho/subscription", label: "Gói đăng ký", icon: "💳" },
  { path: "/zoho/cliq", label: "Thông báo", icon: "💬", roles: ["Admin"] },
  { path: "/zoho/creator", label: "Nội bộ", icon: "🔧", roles: ["Admin"] },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout, role } = useAuth();
  const [isZohoOpen, setIsZohoOpen] = useState(false);

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/70 transition md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r border-white/10 bg-slate-950/80 p-5 backdrop-blur transition-transform md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">EduCloud</p>
            <p className="text-xs text-slate-400">Bảng điều khiển GCS</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-400 md:hidden"
          >
            Đóng
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <p className="text-sm font-semibold text-slate-100">
            {currentUser?.name || "Người dùng"}
          </p>
          <p className="text-xs text-slate-400">{currentUser?.email || "-"}</p>
          <div className="mt-3">
            <RoleBadge role={role} />
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {/* Core navigation */}
          {NAV_ITEMS.filter((item) =>
            item.roles ? item.roles.includes(role) : true
          ).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center rounded-xl px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-sky-500/20 text-sky-100"
                    : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* Zoho Services Section */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => setIsZohoOpen(!isZohoOpen)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <span className="text-xs">⚡</span>
                <span className="font-medium">Zoho Services</span>
              </span>
              <span
                className={`text-xs transition-transform duration-200 ${
                  isZohoOpen ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>

            <div
              className={`space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${
                isZohoOpen ? "mt-1 max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {ZOHO_NAV_ITEMS.filter((item) =>
                item.roles ? item.roles.includes(role) : true
              ).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/zoho"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition ${
                      isActive
                        ? "bg-violet-500/20 text-violet-100"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`
                  }
                >
                  <span className="text-xs">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <button
          onClick={logout}
          className="mt-4 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
        >
          Đăng xuất
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
