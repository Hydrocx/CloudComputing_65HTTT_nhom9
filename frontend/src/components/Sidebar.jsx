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
  { path: "/email", label: "📧 Email", roles: ["Admin"] },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout, role } = useAuth();

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

        <nav className="mt-6 flex-1 space-y-2">
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
