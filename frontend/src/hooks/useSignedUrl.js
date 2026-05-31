import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client.js";

const useSignedUrl = () => {
  const [signedUrl, setSignedUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startCountdown = (target) => {
    clearTimer();
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(target) - new Date()) / 1000));
      setSecondsLeft(diff);
    };
    update();
    intervalRef.current = setInterval(update, 1000);
  };

  const generate = async ({ bucket, gcsPath, expiresIn }) => {
    setIsLoading(true);
    try {
      const response = await client.post("/signed-url", {
        bucket,
        gcsPath,
        expiresIn,
      });

      const data = response.data.data;
      setSignedUrl(data.signedUrl);
      setExpiresAt(data.expiresAt);
      startCountdown(data.expiresAt);
      return data;
    } catch (error) {
      toast.error("Không thể tạo Signed URL.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => () => clearTimer(), []);

  return {
    generate,
    signedUrl,
    expiresAt,
    secondsLeft,
    isExpired: secondsLeft <= 0,
    isLoading,
  };
};

export default useSignedUrl;
