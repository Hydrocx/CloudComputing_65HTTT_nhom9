import { Link } from "react-router-dom";
import { formatBytes } from "../utils/formatBytes.js";

const FileTable = ({
  files,
  canDelete,
  onDelete,
  onSelectFile,
  isBusy,
}) => {
  if (!files.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
        Chưa có tệp nào.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/70 text-xs uppercase text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left">Tệp</th>
            <th className="px-4 py-3 text-left">Đường dẫn</th>
            <th className="px-4 py-3 text-left">Bucket</th>
            <th className="px-4 py-3 text-left">Dung lượng</th>
            <th className="px-4 py-3 text-left">Lớp lưu trữ</th>
            <th className="px-4 py-3 text-left">Ngày tải</th>
            <th className="px-4 py-3 text-right">Tác vụ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {files.map((file) => (
            <tr
              key={`${file.bucket}-${file.name}`}
              className="cursor-pointer hover:bg-slate-900/40"
              onClick={() => onSelectFile?.(file)}
            >
              <td className="px-4 py-3 font-semibold text-slate-200">
                {file.name.split("/").pop()}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-400">
                {file.name}
              </td>
              <td className="px-4 py-3 text-xs text-slate-300">{file.bucket}</td>
              <td className="px-4 py-3 text-xs text-slate-300">
                {formatBytes(file.size)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-300">
                {file.storageClass || "STANDARD"}
              </td>
              <td className="px-4 py-3 text-xs text-slate-300">
                {file.timeCreated
                  ? new Date(file.timeCreated).toLocaleString("vi-VN")
                  : "-"}
              </td>
              <td className="px-4 py-3 text-right text-xs">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    to={`/signed-url?bucket=${encodeURIComponent(
                      file.bucket
                    )}&gcsPath=${encodeURIComponent(file.name)}`}
                    className="rounded-full border border-sky-500/50 px-3 py-1 text-sky-200 transition hover:bg-sky-500/10"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Lấy URL
                  </Link>
                  {canDelete ? (
                    <button
                      className="rounded-full border border-rose-500/50 px-3 py-1 text-rose-200 transition hover:bg-rose-500/10"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete?.(file);
                      }}
                      disabled={isBusy}
                    >
                      {isBusy ? "Đang xử lý" : "Xóa"}
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;
