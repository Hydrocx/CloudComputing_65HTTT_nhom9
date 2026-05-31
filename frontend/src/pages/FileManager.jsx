import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import UploadZone from "../components/UploadZone.jsx";
import FileTable from "../components/FileTable.jsx";
import useFiles from "../hooks/useFiles.js";
import useCourses from "../hooks/useCourses.js";
import { formatBytes } from "../utils/formatBytes.js";
import {
  estimateStorageCostPerMonth,
  estimateViewCost,
} from "../utils/gcsCost.js";

const BUCKETS = [
  import.meta.env.VITE_BUCKET_VIDEOS || "educloud-videos-bucket",
  import.meta.env.VITE_BUCKET_DOCS || "educloud-docs-bucket",
  import.meta.env.VITE_BUCKET_LOGS || "educloud-logs-bucket",
];

const FileManager = () => {
  const { role } = useAuth();
  const { files, isLoading, isMutating, deleteFile, uploadFile } = useFiles();
  const { courses } = useCourses();
  const [filters, setFilters] = useState({
    type: "all",
    courseId: "",
    startDate: "",
    endDate: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const bucketSummary = useMemo(() => {
    const summary = Object.fromEntries(
      BUCKETS.map((bucket) => [bucket, { count: 0, size: 0 }])
    );
    files.forEach((file) => {
      if (!summary[file.bucket]) {
        summary[file.bucket] = { count: 0, size: 0 };
      }
      summary[file.bucket].count += 1;
      summary[file.bucket].size += file.size || 0;
    });
    return summary;
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      if (filters.type === "video" && !file.contentType?.startsWith("video/")) {
        return false;
      }
      if (filters.type === "document" && file.contentType !== "application/pdf") {
        return false;
      }
      if (filters.type === "log" && !file.contentType?.startsWith("text/")) {
        return false;
      }
      if (filters.courseId && file.metadata?.courseId !== filters.courseId) {
        return false;
      }
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        if (new Date(file.timeCreated) < start) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        if (new Date(file.timeCreated) > end) return false;
      }
      return true;
    });
  }, [files, filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">QUẢN LÝ TỆP</p>
          <h2 className="text-lg font-semibold text-white">Quản lý bucket GCS</h2>
        </div>
        {role !== "Student" ? (
          <button
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => setIsUploadOpen(true)}
          >
            Tải tệp
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(bucketSummary).map(([bucket, data]) => (
          <div
            key={bucket}
            className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
          >
            <p className="text-xs text-slate-400">{bucket}</p>
            <p className="mt-2 text-xl font-semibold text-white">{data.count} tệp</p>
            <p className="text-xs text-slate-400">{formatBytes(data.size)}</p>
            <span className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              STANDARD
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <select
          value={filters.type}
          onChange={(event) => setFilters({ ...filters, type: event.target.value })}
          className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
        >
          <option value="all">Tất cả loại</option>
          <option value="video">Video</option>
          <option value="document">Tài liệu</option>
          <option value="log">Log</option>
        </select>
        <select
          value={filters.courseId}
          onChange={(event) => setFilters({ ...filters, courseId: event.target.value })}
          className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">Tất cả môn học</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(event) => setFilters({ ...filters, startDate: event.target.value })}
          className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(event) => setFilters({ ...filters, endDate: event.target.value })}
          className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Đang tải danh sách...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <FileTable
            files={filteredFiles}
            canDelete={role !== "Student"}
            onDelete={deleteFile}
            onSelectFile={setSelectedFile}
            isBusy={isMutating}
          />
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-slate-200">Chi tiết tệp</h3>
            {selectedFile ? (
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div>
                  <p className="text-xs text-slate-500">Tên tệp</p>
                  <p className="font-semibold text-white">
                    {selectedFile.name.split("/").pop()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Bucket</p>
                  <p>{selectedFile.bucket}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Dung lượng</p>
                  <p>{formatBytes(selectedFile.size)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Chi phí lưu trữ</p>
                  <p>
                    {estimateStorageCostPerMonth(
                      selectedFile.size,
                      selectedFile.storageClass
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Chi phí mỗi lượt xem</p>
                  <p>{estimateViewCost(selectedFile.size)}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400">
                Chọn một tệp để xem chi tiết.
              </p>
            )}
          </div>
        </div>
      )}

      <UploadZone
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        courses={courses}
        onUpload={uploadFile}
      />
    </div>
  );
};

export default FileManager;
