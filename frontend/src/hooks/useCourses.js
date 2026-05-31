import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client.js";

const useCourses = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await client.get("/courses");
      setCourses(response.data.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách khóa học.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const createCourse = async (payload) => {
    try {
      setIsMutating(true);
      await client.post("/courses", payload);
      toast.success("Đã tạo khóa học.");
      fetchCourses();
    } catch (error) {
      toast.error("Không thể tạo khóa học.");
    } finally {
      setIsMutating(false);
    }
  };

  const updateCourse = async (id, payload) => {
    try {
      setIsMutating(true);
      await client.patch(`/courses/${id}`, payload);
      toast.success("Đã cập nhật khóa học.");
      fetchCourses();
    } catch (error) {
      toast.error("Không thể cập nhật khóa học.");
    } finally {
      setIsMutating(false);
    }
  };

  const deleteCourse = async (id) => {
    try {
      setIsMutating(true);
      await client.delete(`/courses/${id}`);
      toast.success("Đã xóa khóa học.");
      fetchCourses();
    } catch (error) {
      toast.error("Không thể xóa khóa học.");
    } finally {
      setIsMutating(false);
    }
  };

  const enrollCourse = async (id) => {
    try {
      setIsMutating(true);
      await client.post(`/courses/${id}/enroll`);
      toast.success("Đã đăng ký khóa học.");
      fetchCourses();
    } catch (error) {
      toast.error("Không thể đăng ký khóa học.");
    } finally {
      setIsMutating(false);
    }
  };

  return {
    courses,
    isLoading,
    isMutating,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollCourse,
    refresh: fetchCourses,
  };
};

export default useCourses;
