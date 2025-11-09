// src/hooks/useHomeworkData.js
/**
 * @purpose A custom React hook for managing homework data.
 * It handles fetching and filtering homework based on selected subject and week,
 * manages loading and error states, and provides homework file download
 * and deletion functionalities with role-based access control.
 */

import { useState, useEffect, useCallback } from "react";
import { getAllSubjects } from "../services/subjectService";
import {
  getTeacherSubjects,
  getStudentSubjects,
} from "../services/userSubjectService";
import { getWeeksBySubjectId } from "../services/weekService";
import { getHomeworks } from "../services/userHomeworkService";
import useAuth from "./useAuth";
import {
  downloadHomeworkFile,
  deleteHomeworkFile,
} from "../services/homeworkService";

const ALLOWED_ROLES_FOR_MANAGE = ["teacher", "admin"];

const useHomeworkData = (initialSubjectIdFromProps, isTeacherManaged) => {
  const { user, loading: authLoading } = useAuth();
  const userRole = user?.role;

  const [selectedSubjectId, setSelectedSubjectId] = useState(
    initialSubjectIdFromProps || ""
  );
  const [selectedWeekId, setSelectedWeekId] = useState("");

  const [homeworks, setHomeworks] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableWeeks, setAvailableWeeks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleApiError = useCallback((err, defaultMessage, context) => {
    console.error(`${context || "API call"} failed:`, err);
    const message =
      err.response?.data?.message || err.message || defaultMessage;
    setErrorMessage(message);
  }, []);

  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setStatusMessage("");
      setErrorMessage("");
    }, 3000);
  }, []);

  useEffect(() => {
    if (
      initialSubjectIdFromProps &&
      selectedSubjectId !== initialSubjectIdFromProps
    ) {
      setSelectedSubjectId(initialSubjectIdFromProps);
      setSelectedWeekId("");
    }
  }, [initialSubjectIdFromProps, selectedSubjectId]);

  useEffect(() => {
    if (authLoading) return;
    if (isTeacherManaged && !ALLOWED_ROLES_FOR_MANAGE.includes(userRole)) {
      setErrorMessage(
        "Forbidden: Your role does not have permission to view this content."
      );
      setLoading(false);
      return;
    }

    if (initialSubjectIdFromProps) {
      setAvailableSubjects([]);
      setLoading(false);
      return;
    }

    const fetchSubjects = async () => {
      setLoading(true);
      setErrorMessage("");
      setStatusMessage("");

      try {
        let response;
        if (userRole === "teacher") {
          response = await getTeacherSubjects();
        } else if (userRole === "admin") {
          response = await getAllSubjects();
        } else if (userRole === "student") {
          response = await getStudentSubjects();
        } else {
          handleApiError(
            { message: "Unauthorized role for fetching subjects." },
            "Unauthorized Role",
            "Fetching Subjects"
          );
          setLoading(false);
          return;
        }
        setAvailableSubjects(response);
      } catch (error) {
        handleApiError(error, "Failed to load subjects.", "Fetching Subjects");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [
    userRole,
    authLoading,
    isTeacherManaged,
    initialSubjectIdFromProps,
    handleApiError,
  ]);

  useEffect(() => {
    if (authLoading) return;
    if (isTeacherManaged && !ALLOWED_ROLES_FOR_MANAGE.includes(userRole)) {
      setLoading(false);
      return;
    }

    if (!selectedSubjectId) {
      setAvailableWeeks([]);
      setSelectedWeekId("");
      setLoading(false);
      return;
    }

    const fetchWeeks = async () => {
      setLoading(true);
      setErrorMessage("");
      setStatusMessage("");

      try {
        const response = await getWeeksBySubjectId(selectedSubjectId);
        const fetchedWeeks = response;
        setAvailableWeeks(fetchedWeeks);

        const isCurrentWeekValid = fetchedWeeks.some(
          (week) => week._id === selectedWeekId
        );
        if (!isCurrentWeekValid) {
          setSelectedWeekId("");
        }
      } catch (error) {
        handleApiError(
          error,
          "Failed to load weeks for the selected subject.",
          `Fetching Weeks for Subject ID: ${selectedSubjectId}`
        );
        setAvailableWeeks([]);
        setSelectedWeekId("");
      } finally {
        setLoading(false);
      }
    };
    fetchWeeks();
  }, [
    selectedSubjectId,
    userRole,
    authLoading,
    isTeacherManaged,
    handleApiError,
    selectedWeekId, // Added selectedWeekId to dependency array
  ]);

  const fetchHomeworks = useCallback(async () => {
    if (authLoading || !userRole) {
      setLoading(false);
      setHomeworks([]);
      return;
    }

    const shouldFetchHomeworks = selectedSubjectId && selectedWeekId;

    if (!shouldFetchHomeworks) {
      setHomeworks([]);
      setErrorMessage("");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const homeworksResponse = await getHomeworks(
        selectedSubjectId,
        selectedWeekId
      );
      setHomeworks(homeworksResponse);
      if (homeworksResponse.length === 0) {
        setStatusMessage("No homeworks found for the selected criteria.");
      }
    } catch (err) {
      handleApiError(err, "Failed to load homeworks.", "Fetching Homeworks");
      setHomeworks([]);
    } finally {
      setLoading(false);
    }
  }, [
    selectedSubjectId,
    selectedWeekId,
    userRole,
    authLoading,
    handleApiError,
  ]);

  useEffect(() => {
    if (initialSubjectIdFromProps || (selectedSubjectId && selectedWeekId)) {
      fetchHomeworks();
    }
  }, [
    fetchHomeworks,
    initialSubjectIdFromProps,
    selectedSubjectId,
    selectedWeekId,
  ]);

  const handleDownload = useCallback(
    async (homeworkId, fileS3Key, isTeacherFile) => {
      setLoading(true);
      setErrorMessage("");
      setStatusMessage("");
      try {
        const response = await downloadHomeworkFile(homeworkId, fileS3Key);

        let fileName = fileS3Key.split("/").pop();

        if (isTeacherFile) {
          const homeworkItem = homeworks.find((h) => h._id === homeworkId);
          const fileInHomework = homeworkItem?.files.find(
            (f) => f.s3Key === fileS3Key
          );
          fileName = fileInHomework?.fileName || fileName;
        }

        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setStatusMessage("Download started!");
        clearMessages();
      } catch (err) {
        handleApiError(
          err,
          "Failed to download file. You might not have permission.",
          "File Download"
        );
        clearMessages();
      } finally {
        setLoading(false);
      }
    },
    [
      homeworks,
      setLoading,
      setErrorMessage,
      setStatusMessage,
      clearMessages,
      handleApiError,
    ]
  );

  const handleDelete = useCallback(
    async (homeworkId, fileS3Key) => {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete this file (S3 Key: ${fileS3Key})? This action cannot be undone.`
      );
      if (!confirmDelete) return;

      setLoading(true);
      setErrorMessage("");
      setStatusMessage("");
      try {
        await deleteHomeworkFile(homeworkId, fileS3Key);

        setHomeworks((prevHomeworks) =>
          prevHomeworks
            .map((homework) => {
              if (homework._id === homeworkId) {
                const updatedFiles = homework.files.filter(
                  (file) => file.s3Key !== fileS3Key
                );
                return { ...homework, files: updatedFiles };
              }
              return homework;
            })
            .filter((homework) => homework.files.length > 0)
        );
        setStatusMessage("File deleted successfully!");
        clearMessages();
      } catch (err) {
        handleApiError(
          err,
          "Failed to delete file. You might not have permission.",
          "File Deletion"
        );
        clearMessages();
      } finally {
        setLoading(false);
      }
    },
    [
      setHomeworks,
      setLoading,
      setErrorMessage,
      setStatusMessage,
      clearMessages,
      handleApiError,
    ]
  );

  return {
    selectedSubjectId,
    setSelectedSubjectId,
    selectedWeekId,
    setSelectedWeekId,
    homeworks,
    setHomeworks,
    availableSubjects,
    availableWeeks,
    loading,
    setLoading,
    errorMessage,
    setErrorMessage,
    statusMessage,
    setStatusMessage,
    clearMessages,
    handleApiError,
    ALLOWED_ROLES_FOR_MANAGE,
    isTeacherManaged,
    userRole,
    handleDownload,
    handleDelete,
  };
};

export default useHomeworkData;
