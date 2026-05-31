import { useMemo, useState } from "react";
import { estimateUploadCost, estimateViewCost } from "../utils/gcsCost.js";
import { formatBytes } from "../utils/formatBytes.js";

const BUCKETS = {
  videos: import.meta.env.VITE_BUCKET_VIDEOS || "educloud-videos-bucket",
  docs: import.meta.env.VITE_BUCKET_DOCS || "educloud-docs-bucket",
  logs: import.meta.env.VITE_BUCKET_LOGS || "educloud-logs-bucket",
};

const detectBucketKey = (file) => {
  if (!file) return "docs";
  if (file.type.startsWith("video/")) return "videos";
  if (file.type === "application/pdf") return "docs";
  if (file.type.startsWith("text/")) return "docs";
  return "docs";
};

const UploadZone = ({ isOpen, onClose, courses, onUpload }) => {
  const [file, setFile] = useState(null);
  const [courseId, setCourseId] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const bucketKey = useMemo(() => detectBucketKey(file), [file]);

  const handleClose = () => {
    setFile(null);
    setCourseId("");
    setProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      await onUpload({
        file,
        courseId,
        onProgress: (value) => setProgress(value),
      });
      setFile(null);
      setCourseId("");
      setProgress(0);
      handleClose();
    } catch (error) {
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Tải tệp lên GCS</h3>
            <p className="mt-1 text-sm text-slate-400">
              Kéo thả tệp vào đây hoặc chọn từ máy của bạn.
            </p>
          </div>
          <button
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/10"
            onClick={handleClose}
          >
            Đóng
          </button>
        </div>

        <label
          className="mt-6 flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-600 bg-slate-950/30 text-sm text-slate-400 hover:border-sky-500/50"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) setFile(dropped);
          }}
        >
          <input
            type="file"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          <span className="text-slate-200">Kéo thả tệp tại đây</span>
          <span className="text-xs">Hoặc bấm để chọn tệp</span>
        </label>

        {file ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
              </div>
              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs text-sky-200">
                {file.type || "Không rõ định dạng"}
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Sẽ tải lên: <span className="text-slate-200">gs://{BUCKETS[bucketKey]}</span>
            </div>
            <div className="mt-2 text-xs text-emerald-200">
              Chi phí dự kiến: {estimateUploadCost(file.size)} (upload) | {estimateViewCost(file.size)} mỗi lượt xem
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <label className="text-xs text-slate-400">Chọn môn học</label>
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
          >
            <option value="">Chưa chọn môn học</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {isUploading ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>Đang tải lên...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-sky-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            onClick={handleClose}
          >
            Hủy
          </button>
          <button
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            Tải lên
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;
