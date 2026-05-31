import { useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client.js";
import useFiles from "../hooks/useFiles.js";
import { formatBytes } from "../utils/formatBytes.js";

const Versioning = () => {
  const { files, isLoading } = useFiles();
  const [versions, setVersions] = useState({});

  const grouped = files.reduce((acc, file) => {
    const key = `${file.bucket}::${file.name}`;
    acc[key] = file;
    return acc;
  }, {});

  const loadVersions = async (file) => {
    try {
      const response = await client.get("/files/versions", {
        params: { bucket: file.bucket, gcsPath: file.name },
      });
      setVersions((prev) => ({ ...prev, [file.name]: response.data.data }));
    } catch (error) {
      toast.error("Không thể tải danh sách phiên bản.");
    }
  };

  const handleRestore = async (file, version) => {
    const confirmed = window.confirm(
      `Khôi phục tệp ${file.name.split("/").pop()} về phiên bản ${version.generation}?`
    );
    if (!confirmed) return;

    try {
      await client.post("/files/restore", {
        bucket: file.bucket,
        gcsPath: file.name,
        generation: version.generation,
      });
      toast.success("Đã khôi phục phiên bản.");
      loadVersions(file);
    } catch (error) {
      toast.error("Không thể khôi phục phiên bản.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">PHIÊN BẢN</p>
        <h2 className="text-lg font-semibold text-white">Lịch sử tệp</h2>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Đang tải tệp...</p>
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).map((file) => (
            <div
              key={file.name}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {file.name.split("/").pop()}
                  </p>
                  <p className="text-xs text-slate-500">{file.bucket}</p>
                </div>
                <button
                  onClick={() => loadVersions(file)}
                  className="rounded-full border border-sky-500/40 px-3 py-1 text-xs text-sky-200"
                >
                  Xem phiên bản
                </button>
              </div>

              {versions[file.name] ? (
                <div className="mt-4 space-y-2">
                  {versions[file.name].map((version) => (
                    <div
                      key={version.generation}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2"
                    >
                      <div>
                        <p className="text-xs text-slate-400">Phiên bản {version.generation}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(version.timeCreated).toLocaleString("vi-VN")}
                        </p>
                        <p className="text-xs text-slate-500">
                          Người cập nhật: {version.uploaderEmail || "-"}
                        </p>
                      </div>
                      <p className="text-xs text-slate-300">
                        {formatBytes(version.size)}
                      </p>
                      <button
                        onClick={() => handleRestore(file, version)}
                        className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200"
                      >
                        Khôi phục
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Versioning;
