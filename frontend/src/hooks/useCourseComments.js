import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client.js";

const useCourseComments = (courseId, { enabled = true } = {}) => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!courseId || !enabled) return;
    setIsLoading(true);
    try {
      const response = await client.get(`/courses/${courseId}/comments`);
      setComments(response.data.data || []);
    } catch (error) {
      toast.error("Khong the tai binh luan.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, enabled]);

  useEffect(() => {
    if (enabled) fetchComments();
  }, [enabled, fetchComments]);

  const createComment = async (payload) => {
    if (!courseId) return null;
    setIsMutating(true);
    try {
      const response = await client.post(`/courses/${courseId}/comments`, payload);
      toast.success("Da gui binh luan.");
      await fetchComments();
      return response.data.data;
    } catch (error) {
      toast.error("Khong the gui binh luan.");
      return null;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    comments,
    isLoading,
    isMutating,
    createComment,
    refresh: fetchComments,
  };
};

export default useCourseComments;
