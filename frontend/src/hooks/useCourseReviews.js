import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client.js";

const EMPTY_STATS = { averageRating: 0, totalReviews: 0 };

const useCourseReviews = (courseId, { enabled = true } = {}) => {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!courseId || !enabled) return;
    try {
      const response = await client.get(`/courses/${courseId}/reviews/stats`);
      setStats(response.data.data || EMPTY_STATS);
    } catch (error) {
      setStats(EMPTY_STATS);
    }
  }, [courseId, enabled]);

  const fetchReviews = useCallback(async () => {
    if (!courseId || !enabled) return;
    setIsLoading(true);
    try {
      const response = await client.get(`/courses/${courseId}/reviews`);
      setReviews(response.data.data || []);
    } catch (error) {
      toast.error("Khong the tai danh gia.");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, enabled]);

  useEffect(() => {
    if (enabled) {
      fetchStats();
      fetchReviews();
    }
  }, [enabled, fetchReviews, fetchStats]);

  const submitReview = async (payload) => {
    if (!courseId) return null;
    setIsMutating(true);
    try {
      const response = await client.post(`/courses/${courseId}/reviews`, payload);
      toast.success("Da cap nhat danh gia.");
      await Promise.all([fetchStats(), fetchReviews()]);
      return response.data.data;
    } catch (error) {
      toast.error("Khong the gui danh gia.");
      return null;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    stats,
    reviews,
    isLoading,
    isMutating,
    submitReview,
    refresh: () => Promise.all([fetchStats(), fetchReviews()]),
  };
};

export default useCourseReviews;
