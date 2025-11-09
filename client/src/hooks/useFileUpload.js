// client/src/hooks/useFileUpload.js

import { useState, useCallback } from "react";
import submissionService from "../services/submissionService";

export const useFileUpload = (
  homeworkId,
  submission,
  fetchData,
  showTemporaryMessage,
  onUploadSuccess
) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleFileChange = useCallback((event) => {
    setSelectedFile(event.target.files[0]);
    setUploadError(null);
    setSuccessMessage(null);
    setUploadProgress(0);
  }, []);

  const handleSubmit = useCallback(
    async (event, userId, annotationId = null) => {
      event.preventDefault();
      if (!selectedFile) {
        showTemporaryMessage("Select a file", "error");
        setUploadError("Please select a file.");
        return;
      }
      if (!homeworkId || !userId) {
        showTemporaryMessage("homework id or user id is missing。", "error");
        setUploadError("Homework or user information is missing.");
        return;
      }

      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setSuccessMessage(null);

      try {
        const formData = new FormData();
        formData.append("files", selectedFile);
        formData.append(
          "comment",
          submission
            ? "Updated submission with new file."
            : "Initial submission."
        );
        formData.append("isSubmitted", "true");

        if (annotationId) {
          formData.append("annotation", annotationId);
        }

        if (submission) {
          await submissionService.updateSubmission(submission._id, formData);
        } else {
          await submissionService.submitHomework(homeworkId, formData);
        }

        setUploadProgress(100);
        setSuccessMessage("Homework submitted successfully!");
        setSelectedFile(null);
        fetchData();
        showTemporaryMessage("Homework submitted successfully!", "success");

        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } catch (err) {
        console.error("File upload error:", err);
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Failed to submit homework. Please check file format or size.";
        setUploadError(msg);
        showTemporaryMessage(msg, "error");
      } finally {
        setUploading(false);
      }
    },

    [
      selectedFile,
      homeworkId,
      submission,
      fetchData,
      showTemporaryMessage,
      onUploadSuccess,
    ]
  );

  return {
    selectedFile,
    uploading,
    uploadProgress,
    uploadError,
    successMessage,
    handleFileChange,
    handleSubmit,
  };
};
