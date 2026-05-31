import { useEffect, useState } from "react";
import client from "../api/client.js";
import RoleBadge from "../components/RoleBadge.jsx";
import toast from "react-hot-toast";

const ROLE_CHIPS = {
  Admin: ["Toàn quyền", "Quản lý IAM", "Xóa tệp"],
  Teacher: ["Tải tệp", "Xóa tệp của mình", "Tạo khóa học"],
  Student: ["Xem tài liệu", "Signed URL", "Đăng ký môn học"],
};

const PERMISSION_MATRIX = [
  { label: "Video", admin: "Toàn quyền", teacher: "Đọc/Ghi", student: "Đọc" },
  { label: "Tài liệu", admin: "Toàn quyền", teacher: "Đọc/Ghi", student: "Đọc" },
  { label: "Nhật ký", admin: "Toàn quyền", teacher: "-", student: "-" },
];

const IAM = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", role: "Student" });
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await client.get("/users");
      setUsers(response.data.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    try {
      setIsMutating(true);
      await client.post("/users", draft);
      toast.success("Đã tạo người dùng.");
      setIsModalOpen(false);
      setDraft({ name: "", email: "", role: "Student" });
      fetchUsers();
    } catch (error) {
      toast.error("Không thể tạo người dùng.");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">IAM</p>
          <h2 className="text-lg font-semibold text-white">Quản lý vai trò</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Thêm người dùng
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(ROLE_CHIPS).map(([role, chips]) => (
          <div
            key={role}
            className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
          >
            <RoleBadge role={role} />
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-slate-950/60 px-3 py-1 text-xs text-slate-300"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Người dùng</h3>
        <div className="mt-4 space-y-3 text-sm">
          {isLoading ? (
            <p className="text-xs text-slate-400">Đang tải...</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <RoleBadge role={user.role} />
                <div className="text-xs text-slate-400">
                  {ROLE_CHIPS[user.role]?.join(" • ")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Bảng phân quyền</h3>
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Bucket</th>
                <th className="px-3 py-2 text-left">Quản trị</th>
                <th className="px-3 py-2 text-left">Giảng viên</th>
                <th className="px-3 py-2 text-left">Sinh viên</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.label} className="border-t border-white/5">
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2">{row.admin}</td>
                  <td className="px-3 py-2">{row.teacher}</td>
                  <td className="px-3 py-2">{row.student}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h3 className="text-lg font-semibold text-white">Thêm người dùng</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-400">Họ tên</label>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Email</label>
                <input
                  value={draft.email}
                  onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
                  type="email"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Vai trò</label>
                <select
                  value={draft.role}
                  onChange={(event) => setDraft({ ...draft, role: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
                >
                  <option value="Admin">Quản trị</option>
                  <option value="Teacher">Giảng viên</option>
                  <option value="Student">Sinh viên</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
                disabled={isMutating}
              >
                {isMutating ? "Đang tạo" : "Tạo người dùng"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default IAM;
