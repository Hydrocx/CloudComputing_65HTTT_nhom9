import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client.js";

const useFiles = () => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await client.get("/files");
      setFiles(response.data.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách tệp.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async ({ file, courseId, onProgress }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (courseId) formData.append("courseId", courseId);
    formData.append("fileType", file.type);

    try {
      setIsMutating(true);
      await client.post("/files/upload", formData, {
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress?.(percent);
        },
      });
      toast.success("Tải tệp thành công.");
      fetchFiles();
    } catch (error) {
      toast.error("Tải tệp thất bại.");
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  const deleteFile = async (file) => {
    try {
      setIsMutating(true);
      await client.delete(`/files/${encodeURIComponent(file.name)}`, {
        params: { bucket: file.bucket },
      });
      toast.success("Đã xóa tệp.");
      fetchFiles();
    } catch (error) {
      toast.error("Không thể xóa tệp.");
    } finally {
      setIsMutating(false);
    }
  };

  return {
    files,
    isLoading,
    isMutating,
    uploadFile,
    deleteFile,
    refresh: fetchFiles,
  };
};

export default useFiles;
