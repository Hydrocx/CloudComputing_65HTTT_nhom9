import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const DEMO_USERS = [
  {
    role: "Admin",
    label: "Quản trị",
    name: "Admin",
    email: "admin@educloud.vn",
  },
  {
    role: "Teacher",
    label: "Giảng viên",
    name: "Cô giáo Lan",
    email: "lan.giangvien@educloud.vn",
  },
  {
    role: "Student",
    label: "Sinh viên",
    name: "Sinh viên Minh",
    email: "minh.sinhvien@educloud.vn",
  },
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Student");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email || !name) return;
    login({ name, email, role });
    navigate("/");
  };

  const handleDemo = (user) => {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
  };

  return (
    <div className="min-h-screen bg-educloud text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">EduCloud</p>
            <h1 className="text-2xl font-semibold text-white">Đăng nhập hệ thống</h1>
            <p className="mt-2 text-sm text-slate-400">
              Sử dụng tài khoản demo hoặc nhập thông tin để vào bảng điều khiển.
            </p>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-3">
            {DEMO_USERS.map((user) => (
              <button
                key={user.role}
                onClick={() => handleDemo(user)}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3 text-left text-xs text-slate-300 transition hover:border-sky-500/40"
              >
                <p className="text-sm font-semibold text-slate-100">{user.label}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400">Họ và tên</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
                placeholder="Nhập họ tên"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
                placeholder="Nhập email"
                type="email"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Vai trò</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
              >
                <option value="Admin">Quản trị</option>
                <option value="Teacher">Giảng viên</option>
                <option value="Student">Sinh viên</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Vào bảng điều khiển
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
