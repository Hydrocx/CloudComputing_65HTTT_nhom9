import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import useCourses from "../hooks/useCourses.js";

const Courses = () => {
  const { role, currentUser } = useAuth();
  const {
    courses,
    isLoading,
    isMutating,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollCourse,
  } = useCourses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const [editingId, setEditingId] = useState(null);

  const openCreate = () => {
    setDraft({ title: "", description: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (course) => {
    setDraft({ title: course.title, description: course.description });
    setEditingId(course.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!draft.title || !draft.description) return;
    if (editingId) {
      await updateCourse(editingId, draft);
    } else {
      await createCourse(draft);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">KHÓA HỌC</p>
          <h2 className="text-lg font-semibold text-white">Danh sách môn học</h2>
        </div>
        {role !== "Student" ? (
          <button
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
            onClick={openCreate}
          >
            Tạo môn học
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Đang tải...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">{course.title}</h3>
                <span className="text-xs text-slate-400">
                  {course.studentEmails?.length || 0} sinh viên
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{course.description}</p>
              <p className="mt-3 text-xs text-slate-500">Giảng viên: {course.teacherEmail}</p>
              <div className="mt-4 flex items-center gap-2">
                {role === "Student" ? (
                  course.studentEmails?.includes(currentUser?.email) ? (
                    <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200">
                      Đã đăng ký
                    </span>
                  ) : (
                    <button
                      onClick={() => enrollCourse(course.id)}
                      className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200"
                      disabled={isMutating}
                    >
                      Đăng ký
                    </button>
                  )
                ) : (
                  <>
                    <button
                      onClick={() => openEdit(course)}
                      className="rounded-full border border-sky-500/40 px-3 py-1 text-xs text-sky-200"
                      disabled={isMutating}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteCourse(course.id)}
                      className="rounded-full border border-rose-500/40 px-3 py-1 text-xs text-rose-200"
                      disabled={isMutating}
                    >
                      {isMutating ? "Đang xử lý" : "Xóa"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? "Cập nhật môn học" : "Tạo môn học"}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-400">Tiêu đề</label>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Mô tả</label>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  className="mt-2 h-24 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
                />
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
                onClick={handleSave}
                className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
                disabled={isMutating}
              >
                {isMutating ? "Đang lưu" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Courses;
