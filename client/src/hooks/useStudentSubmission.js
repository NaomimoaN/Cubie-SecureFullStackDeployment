// client/src/hooks/useStudentSubmission.js
/**
 * @purpose Manages a student's homework submission: fetching, file upload/update, and deletion of submission/files, including due date and lock status handling.
 */

import { useState, useEffect, useCallback } from "react";
import useAuth from "./useAuth";
import {
  createSubmission,
  updateSubmission,
  deleteSubmission,
} from "../services/submissionService";
import { deleteSubmittedFile } from "../services/submittedFileService";
import { getStudentSubmissionForHomework } from "../services/userSubmissinoService";

const useStudentSubmission = (homeworkId, dueDate) => {
  const { user } = useAuth();

  const [mySubmission, setMySubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isPastDueDate = new Date() > new Date(dueDate);
  const isSubmissionLocked = mySubmission?.isLocked;

  const clearMessage = useCallback(() => {
    setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 3000);
  }, []);

  const fetchMySubmission = useCallback(async () => {
    if (!user || !homeworkId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const submissionData = await getStudentSubmissionForHomework(homeworkId);
      setMySubmission(submissionData);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setMySubmission(null);
        console.info("No submission found or files cleared for this homework.");
      } else {
        console.error("Failed to fetch my submission:", err);
        setError(
          err.response?.data?.message || "Failed to load your submission."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user, homeworkId]);

  useEffect(() => {
    fetchMySubmission();
  }, [fetchMySubmission]);

  const handleFileChange = useCallback((e) => {
    setSelectedFiles(Array.from(e.target.files));
  }, []);

  const handleSubmitOrUpdate = useCallback(
    async (e) => {
      e.preventDefault();

      if (!selectedFiles.length) {
        setError("Please select files to upload.");
        clearMessage();
        return;
      }
      if (!homeworkId) {
        setError("Homework ID is missing. Cannot submit.");
        clearMessage();
        return;
      }

      setUploading(true);
      setError(null);
      setMessage(null);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("submittedFiles", file);
      });

      try {
        let returnedData;
        if (mySubmission) {
          returnedData = await updateSubmission(mySubmission._id, formData, {
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            },
          });
          setMessage("Submission updated successfully!");
        } else {
          returnedData = await createSubmission(homeworkId, formData, {
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            },
          });
          setMessage("Homework submitted successfully!");
        }

        setMySubmission(returnedData.submission);
        setSelectedFiles([]);
        setUploadProgress(0);

        if (e.target) e.target.reset();
      } catch (err) {
        console.error("Submission/Update failed:", err);
        setError(
          err.response?.data?.message ||
            "Failed to submit/update homework. Please try again."
        );
      } finally {
        setUploading(false);
        clearMessage();
      }
    },
    [selectedFiles, mySubmission, homeworkId, clearMessage]
  );

  const handleDeleteFile = useCallback(
    async (s3Key) => {
      if (!mySubmission || !user) return;

      setError(null);
      setMessage(null);
      try {
        const responseData = await deleteSubmittedFile(mySubmission._id, s3Key);

        if (responseData && responseData.deletedSubmissionId) {
          setMySubmission(null);
          setMessage("All submitted files deleted. Submission removed.");
        } else if (responseData && responseData.submission) {
          setMySubmission(responseData.submission);
          setMessage("File deleted successfully.");
        } else {
          const updatedFiles = mySubmission.submittedFiles.filter(
            (file) => file.s3Key !== s3Key
          );
          if (updatedFiles.length === 0) {
            setMySubmission(null);
            setMessage("All submitted files deleted. Submission removed.");
          } else {
            setMySubmission((prev) => ({
              ...prev,
              submittedFiles: updatedFiles,
            }));
            setMessage("File deleted successfully.");
          }
        }
      } catch (err) {
        console.error("Error deleting file:", err);
        setError(err.response?.data?.message || "Failed to delete file.");
      } finally {
        clearMessage();
      }
    },
    [mySubmission, user]
  );

  const handleDeleteSubmission = useCallback(async () => {
    if (!mySubmission || !user) return;

    setError(null);
    setMessage(null);
    try {
      await deleteSubmission(mySubmission._id);
      setMySubmission(null);
      setMessage("Entire submission deleted successfully.");
    } catch (err) {
      console.error("Error deleting submission:", err);
      setError(err.response?.data?.message || "Failed to delete submission.");
    } finally {
      clearMessage();
    }
  }, [mySubmission, user]);

  return {
    mySubmission,
    loading,
    error,
    message,
    selectedFiles,
    uploading,
    uploadProgress,
    isPastDueDate,
    isSubmissionLocked,
    user,
    fetchMySubmission,
    handleFileChange,
    handleSubmitOrUpdate,
    handleDeleteFile,
    handleDeleteSubmission,
  };
};

export default useStudentSubmission;
