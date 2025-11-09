import { useState, useEffect, useCallback, useRef } from "react";
import homeworkService from "../services/homeworkService"; // ★ Changed import
import submissionService from "../services/submissionService"; // ★ Changed import

export const useHomeworkDetails = (subjectId, homeworkId, userId) => {
  const [homework, setHomework] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  const messageTimerRef = useRef(null);

  const showTemporaryMessage = useCallback((text, type, duration = 5000) => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }

    setMessage(text);
    setMessageType(type);

    const timerId = setTimeout(() => {
      setMessage(null);
      setMessageType(null);
      messageTimerRef.current = null;
    }, duration);

    messageTimerRef.current = timerId;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!homeworkId || !userId) {
        throw new Error("Homework ID or user ID is missing.");
      }
      // ★ Changed to use homeworkService object
      const homeworkData = await homeworkService.getHomeworkById(homeworkId);
      setHomework(homeworkData);

      // ★ Changed to use submissionService object
      const studentSubmissions = await submissionService.getUserSubmissions(
        subjectId
      );
      const existingSubmission = studentSubmissions.find(
        (sub) => sub.homework?._id === homeworkId && sub.student?._id === userId
      );
      setSubmission(existingSubmission || null);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load homework details.";
      setError(errorMessage);
      showTemporaryMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [homeworkId, userId, subjectId, showTemporaryMessage]);

  useEffect(() => {
    if (subjectId && userId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [subjectId, userId, fetchData]);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  return {
    homework,
    submission,
    loading,
    error,
    message,
    messageType,
    showTemporaryMessage,
    fetchData,
  };
};
