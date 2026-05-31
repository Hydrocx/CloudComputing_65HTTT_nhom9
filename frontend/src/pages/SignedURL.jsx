import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CountdownBadge from "../components/CountdownBadge.jsx";
import toast from "react-hot-toast";
import useFiles from "../hooks/useFiles.js";
import useSignedUrl from "../hooks/useSignedUrl.js";

const SignedURL = () => {
  const { files } = useFiles();
  const { generate, signedUrl, expiresAt, secondsLeft, isExpired, isLoading } =
    useSignedUrl();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState("");
  const [expiresIn, setExpiresIn] = useState(300);
  const [history, setHistory] = useState([]);

  const fileOptions = useMemo(
    () =>
      files.map((file) => ({
        label: file.name.split("/").pop(),
        value: `${file.bucket}::${file.name}`,
      })),
    [files]
  );

  useEffect(() => {
    const bucket = searchParams.get("bucket");
    const gcsPath = searchParams.get("gcsPath");
    if (bucket && gcsPath) {
      setSelected(`${bucket}::${gcsPath}`);
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!selected) return;
    const [bucket, gcsPath] = selected.split("::");
    const result = await generate({ bucket, gcsPath, expiresIn });
    if (result) {
      setHistory((prev) => [
        {
          file: gcsPath.split("/").pop(),
          createdAt: new Date().toISOString(),
          expiresAt: result.expiresAt,
        },
        ...prev,
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Tạo Signed URL</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sinh URL tạm thời để chia sẻ tài nguyên cho người học.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs text-slate-400">Chọn tệp</label>
              <select
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
              >
                <option value="">Chọn tệp</option>
                {fileOptions.map((file) => (
                  <option key={file.value} value={file.value}>
                    {file.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Thời gian hết hạn (giây)</label>
              <input
                type="number"
                min={60}
                max={3600}
                value={expiresIn}
                onChange={(event) => setExpiresIn(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={!selected || isLoading}
              className="w-full rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {isLoading ? "Đang tạo..." : "Tạo Signed URL"}
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Kết quả</p>
              {expiresAt ? (
                <CountdownBadge secondsLeft={secondsLeft} isExpired={isExpired} />
              ) : (
                <span className="text-xs text-slate-500">Chưa tạo</span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <div className="max-w-[70%] truncate font-mono text-xs text-slate-200">
                {signedUrl || "Chưa có URL"}
              </div>
              <button
                onClick={async () => {
                  if (!signedUrl) return;
                  await navigator.clipboard.writeText(signedUrl);
                  toast.success("Đã sao chép URL.");
                }}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
              >
                Sao chép
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Hết hạn: {expiresAt ? new Date(expiresAt).toLocaleString("vi-VN") : "-"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="text-sm font-semibold text-slate-200">Lịch sử gần đây</h3>
          <div className="mt-4 space-y-3 text-xs text-slate-300">
            {history.length === 0 ? (
              <p className="text-slate-400">Chưa có lịch sử.</p>
            ) : (
              history.map((item) => (
                <div
                  key={`${item.file}-${item.createdAt}`}
                  className="rounded-xl border border-white/10 bg-slate-950/40 p-3"
                >
                  <p className="font-semibold text-slate-100">{item.file}</p>
                  <p className="text-slate-400">
                    Tạo: {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </p>
                  <p className="text-slate-400">
                    Hết hạn: {new Date(item.expiresAt).toLocaleString("vi-VN")}
                  </p>
                  <p className="text-slate-500">
                    Trạng thái: {new Date(item.expiresAt) > new Date() ? "Còn hiệu lực" : "Hết hạn"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h3 className="text-sm font-semibold text-slate-200">Quy trình Signed URL</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {[
            "Người dùng gửi yêu cầu",
            "Backend ký URL tạm thời",
            "GCS xác thực token",
            "Trả về nội dung an toàn",
          ].map((step, index) => (
            <div
              key={step}
              className="animate-float rounded-2xl border border-white/10 bg-slate-950/40 p-4"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <p className="text-xs text-slate-400">Bước {index + 1}</p>
              <p className="mt-2 text-sm text-slate-100">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignedURL;
