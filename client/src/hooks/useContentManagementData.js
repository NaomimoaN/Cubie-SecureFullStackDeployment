// src/hooks/useContentManagementData.js

/**
 * A custom React hook for managing educational content.
 * It handles data fetching for subjects, weeks, and content items,
 * manages form states for creating/updating week details and uploading content files,
 * and provides all necessary data and handlers for content management UIs.
 */

import { useState, useEffect, useCallback } from "react";
import {
  downloadContentFile,
  deleteContentFile,
  createContent,
} from "../services/contentService";
import { getAllSubjects } from "../services/subjectService";
import { getTeacherSubjects } from "../services/userSubjectService";
import {
  getWeeksBySubjectId,
  getWeekById,
  updateWeek,
} from "../services/weekService";
import { getContents } from "../services/userContentService";
import useAuth from "./useAuth";

const useContentManagementData = (propSubjectId) => {
  const { user, loading: authLoading } = useAuth();
  const userRole = user?.role;
  const ALLOWED_ROLES = ["teacher", "admin"];

  // State variables for form inputs and data
  const [selectedFile, setSelectedFile] = useState(null);
  const [weekId, setWeekId] = useState("");
  const [weekTitle, setWeekTitle] = useState("");
  const [weekDescription, setWeekDescription] = useState("");
  const [subjectId, setSubjectId] = useState(propSubjectId || "");

  // State variables for original week data to track changes
  const [originalWeekTitle, setOriginalWeekTitle] = useState("");
  const [originalWeekDescription, setOriginalWeekDescription] = useState("");

  // State variables for messages, errors, and loading states
  const [responseMessage, setResponseMessage] = useState("");
  const [responseClass, setResponseClass] = useState("");
  const [error, setError] = useState("");

  // State variables for fetched data lists
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [contents, setContents] = useState([]);
  const [loadingContents, setLoadingContents] = useState(false);

  // State variables for input warnings
  const [showTitleWarning, setShowTitleWarning] = useState(false);
  const [showDescriptionWarning, setShowDescriptionWarning] = useState(false);

  /**
   * Clears response and error messages after a short delay.
   */
  const clearMessage = useCallback(() => {
    setTimeout(() => {
      setResponseMessage("");
      setResponseClass("");
      setError("");
    }, 3000);
  }, []);

  /**
   * Effect to synchronize subjectId with propSubjectId and reset related states.
   */
  useEffect(() => {
    if (propSubjectId && subjectId !== propSubjectId) {
      setSubjectId(propSubjectId);
      setWeekId("");
      setAvailableWeeks([]);
      setWeekTitle("");
      setWeekDescription("");
      setOriginalWeekTitle("");
      setOriginalWeekDescription("");
      setShowTitleWarning(false);
      setShowDescriptionWarning(false);
    } else if (!propSubjectId && subjectId !== "") {
      setSubjectId("");
      setWeekId("");
      setAvailableWeeks([]);
      setWeekTitle("");
      setWeekDescription("");
      setOriginalWeekTitle("");
      setOriginalWeekDescription("");
      setShowTitleWarning(false);
      setShowDescriptionWarning(false);
    }
  }, [propSubjectId, subjectId]);

  /**
   * Effect to fetch available subjects based on user role.
   */
  useEffect(() => {
    if (authLoading) return;
    if (!ALLOWED_ROLES.includes(userRole)) {
      setError(
        "Forbidden: Your role does not have permission to upload content."
      );
      setLoadingSubjects(false);
      return;
    }

    // If propSubjectId is provided, no need to fetch all subjects.
    if (propSubjectId) {
      setAvailableSubjects([]); // Clear any previous subjects if propSubjectId is used.
      setLoadingSubjects(false);
      return;
    }

    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      setError("");
      setResponseMessage("");

      try {
        let response;
        if (userRole === "teacher") {
          response = await getTeacherSubjects();
        } else if (userRole === "admin") {
          response = await getAllSubjects();
        } else {
          setError("Unauthorized role for fetching subjects.");
          setLoadingSubjects(false);
          return;
        }
        setAvailableSubjects(response);
      } catch (error) {
        console.error("Failed to load subjects:", error); // Consider using a more robust logging mechanism.
        setError(
          "Failed to load subjects. Please check your assignments or overall subject list."
        );
        setResponseClass("error");
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [userRole, authLoading, propSubjectId]);

  /**
   * Effect to fetch weeks for the selected subject and populate week details.
   */
  useEffect(() => {
    if (authLoading) return;
    if (!ALLOWED_ROLES.includes(userRole)) {
      setLoadingWeeks(false);
      return;
    }

    const fetchWeeksAndDetails = async () => {
      if (!subjectId) {
        // Clear week related states if no subject is selected.
        setAvailableWeeks([]);
        setWeekId("");
        setWeekTitle("");
        setWeekDescription("");
        setOriginalWeekTitle("");
        setOriginalWeekDescription("");
        setShowTitleWarning(false);
        setShowDescriptionWarning(false);
        return;
      }

      setLoadingWeeks(true);
      setError("");
      setResponseMessage("");

      try {
        const weeksResponse = await getWeeksBySubjectId(subjectId);
        const fetchedWeeks = weeksResponse;
        setAvailableWeeks(fetchedWeeks);

        let initialWeekId = "";
        // If a week is already selected, try to keep it if it's still valid for the new subject.
        if (fetchedWeeks.length > 0) {
          const isCurrentWeekValid = fetchedWeeks.some(
            (week) => week._id === weekId
          );
          initialWeekId = isCurrentWeekValid ? weekId : "";
        }
        setWeekId(initialWeekId);

        // Fetch details for the initially selected/set week.
        if (initialWeekId) {
          const weekDetails = await getWeekById(initialWeekId);
          setWeekTitle(weekDetails.title);
          setWeekDescription(weekDetails.description);
          setOriginalWeekTitle(weekDetails.title);
          setOriginalWeekDescription(weekDetails.description);
          setShowTitleWarning(!weekDetails.title); // Set warning if title is empty.
          setShowDescriptionWarning(!weekDetails.description); // Set warning if description is empty.
        } else {
          // Reset week details if no week is selected or found.
          setWeekTitle("");
          setWeekDescription("");
          setOriginalWeekTitle("");
          setOriginalWeekDescription("");
          setShowTitleWarning(false);
          setShowDescriptionWarning(false);
        }
      } catch (error) {
        console.error(
          `Failed to load weeks/week details for subject (Subject ID: ${subjectId}):`,
          error
        ); // Consider using a more robust logging mechanism.
        setError("Failed to load weeks for the selected subject.");
        // Reset all week-related states on error.
        setAvailableWeeks([]);
        setWeekId("");
        setWeekTitle("");
        setWeekDescription("");
        setOriginalWeekTitle("");
        setOriginalWeekDescription("");
        setShowTitleWarning(false);
        setShowDescriptionWarning(false);
      } finally {
        setLoadingWeeks(false);
      }
    };
    fetchWeeksAndDetails();
  }, [subjectId, userRole, authLoading, weekId]); // weekId is a dependency to re-fetch details when it changes internally.

  /**
   * Fetches content items for the currently selected subject and week.
   */
  const fetchContents = useCallback(async () => {
    if (authLoading || !userRole) {
      setLoadingContents(false);
      setContents([]);
      return;
    }

    const shouldFetchContents = subjectId && weekId;

    if (!shouldFetchContents) {
      setContents([]);
      return;
    }

    setLoadingContents(true);
    setError("");
    setResponseMessage("");

    try {
      const contentsResponse = await getContents(subjectId, weekId);
      setContents(contentsResponse);
    } catch (err) {
      console.error("Failed to fetch contents:", err); // Consider using a more robust logging mechanism.
      setError("Failed to load contents.");
      setContents([]);
    } finally {
      setLoadingContents(false);
    }
  }, [subjectId, weekId, userRole, authLoading]);

  // Effect to fetch contents whenever subjectId or weekId changes, or after a content modification.
  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  /**
   * Handles the download of a specific content file.
   * @param {string} contentId - The ID of the content item.
   * @param {string} s3Key - The S3 key of the file to download.
   */
  const handleDownload = useCallback(
    async (contentId, s3Key) => {
      try {
        const response = await downloadContentFile(contentId, s3Key);

        // Find the correct filename from the contents state if available.
        const contentItem = contents.find((c) => c._id === contentId);
        const fileToDownload = contentItem?.contents.find(
          (f) => f.s3Key === s3Key
        );
        const fileName = fileToDownload?.fileName || s3Key.split("/").pop(); // Fallback to S3 key if fileName is missing.

        // Create a blob URL and trigger download.
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url); // Clean up the blob URL.

        setResponseMessage("Download started!");
        setResponseClass("success");
        clearMessage();
      } catch (err) {
        console.error("Download failed:", err); // Consider using a more robust logging mechanism.
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to download content. You may not have permission.";
        setError(errorMessage);
        clearMessage();
      }
    },
    [contents, clearMessage]
  ); // Depends on 'contents' to find the filename and 'clearMessage' for feedback.

  /**
   * Handles the deletion of a specific content file.
   * @param {string} contentId - The ID of the content item.
   * @param {string} s3Key - The S3 key of the file to delete.
   */
  const handleDelete = useCallback(
    async (contentId, s3Key) => {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete this file (S3 Key: ${s3Key})? This action cannot be undone.`
      );
      if (!confirmDelete) return;

      setResponseMessage("Deleting...");
      setResponseClass("");
      setError("");

      try {
        await deleteContentFile(contentId, s3Key);

        // Update the local state to remove the deleted file.
        setContents(
          (prevContents) =>
            prevContents
              .map((content) => {
                if (content._id === contentId) {
                  const updatedFiles = content.contents.filter(
                    (file) => file.s3Key !== s3Key
                  );
                  return { ...content, contents: updatedFiles };
                }
                return content;
              })
              .filter((content) => content.contents.length > 0) // Remove content item if it has no files left.
        );
        setResponseMessage("File deleted successfully!");
        setResponseClass("success");
        clearMessage();
      } catch (err) {
        console.error("Delete failed:", err); // Consider using a more robust logging mechanism.
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to delete file. You may not have permission.";
        setError(errorMessage);
        clearMessage();
      }
    },
    [clearMessage]
  ); // Depends on 'clearMessage' for feedback.

  /**
   * Handles the file input change event, setting the selected file.
   * @param {Event} event - The file input change event.
   */
  const handleFileChange = useCallback((event) => {
    setSelectedFile(event.target.files[0]);
    setResponseMessage("");
    setError("");
  }, []);

  /**
   * Handles the change of the selected week ID, fetching its details.
   * @param {Event} e - The change event from the week select input.
   */
  const handleWeekIdChange = useCallback(
    async (e) => {
      const newWeekId = e.target.value;
      setWeekId(newWeekId);
      setError("");

      if (newWeekId) {
        setLoadingWeeks(true);
        try {
          const weekDetails = await getWeekById(newWeekId);
          setWeekTitle(weekDetails.title);
          setWeekDescription(weekDetails.description);
          setOriginalWeekTitle(weekDetails.title);
          setOriginalWeekDescription(weekDetails.description);
          setShowTitleWarning(!weekDetails.title);
          setShowDescriptionWarning(!weekDetails.description);
        } catch (err) {
          console.error(
            `Failed to load details for week ID ${newWeekId}:`,
            err
          ); // Consider using a more robust logging mechanism.
          setError("Failed to load week details.");
          // Reset states if week details loading fails.
          setWeekTitle("");
          setWeekDescription("");
          setOriginalWeekTitle("");
          setOriginalWeekDescription("");
          setShowTitleWarning(false);
          setShowDescriptionWarning(false);
        } finally {
          setLoadingWeeks(false);
        }
      } else {
        // Reset states if no week is selected.
        setWeekTitle("");
        setWeekDescription("");
        setOriginalWeekTitle("");
        setOriginalWeekDescription("");
        setShowTitleWarning(false);
        setShowDescriptionWarning(false);
      }
    },
    [] // No external dependencies here, but it uses clearMessage from outer scope, though not directly in this function.
  );

  /**
   * Handles changes to the week title input.
   * @param {Event} e - The change event from the title input.
   */
  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setWeekTitle(newTitle);
    setError("");
    setShowTitleWarning(!newTitle); // Show warning if title is empty.
  }, []);

  /**
   * Handles changes to the week description input.
   * @param {Event} e - The change event from the description input.
   */
  const handleDescriptionChange = useCallback((e) => {
    const newDescription = e.target.value;
    setWeekDescription(newDescription);
    setError("");
    setShowDescriptionWarning(!newDescription); // Show warning if description is empty.
  }, []);

  /**
   * Handles changes to the selected subject ID, resetting week-related states.
   * @param {Event} e - The change event from the subject select input.
   */
  const handleSubjectIdChange = useCallback((e) => {
    const newSubjectId = e.target.value;
    setSubjectId(newSubjectId);
    // Reset all week-related states when subject changes.
    setWeekId("");
    setAvailableWeeks([]);
    setWeekTitle("");
    setWeekDescription("");
    setOriginalWeekTitle("");
    setOriginalWeekDescription("");
    setShowTitleWarning(false);
    setShowDescriptionWarning(false);
    setError("");
  }, []);

  /**
   * Handles the form submission for updating week details and/or uploading content.
   * @param {Event} event - The form submission event.
   */
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!ALLOWED_ROLES.includes(userRole)) {
        setError(
          "Forbidden: Your role does not have permission to upload content."
        );
        clearMessage();
        return;
      }

      if (!weekId) {
        setResponseMessage(
          "Please select a Week to save changes or upload file."
        );
        setResponseClass("error");
        clearMessage();
        return;
      }

      const weekMetadataChanged =
        weekTitle !== originalWeekTitle ||
        weekDescription !== originalWeekDescription;
      const fileSelectedForUpload = selectedFile !== null;

      if (!weekMetadataChanged && !fileSelectedForUpload) {
        setResponseMessage("No changes to save or file to upload.");
        setResponseClass("error");
        clearMessage();
        return;
      }

      setResponseMessage("Sending...");
      setResponseClass("");

      let success = true;
      let finalMessage = [];

      try {
        // Attempt to update week metadata if changed.
        if (weekMetadataChanged) {
          const updateData = {
            title: weekTitle,
            description: weekDescription,
          };
          try {
            await updateWeek(weekId, updateData);
            finalMessage.push("Week details updated.");
            setOriginalWeekTitle(weekTitle);
            setOriginalWeekDescription(weekDescription);
            setShowTitleWarning(!weekTitle);
            setShowDescriptionWarning(!weekDescription);
          } catch (weekUpdateError) {
            console.error("Week update error:", weekUpdateError); // Consider using a more robust logging mechanism.
            finalMessage.push("Failed to update week details.");
            success = false;
          }
        }

        // Attempt to upload file if selected.
        if (fileSelectedForUpload) {
          const formData = new FormData();
          formData.append("contents", selectedFile);
          formData.append("week_id", weekId);
          formData.append("title", weekTitle); // Attach current week title with content for context if needed on backend.
          formData.append("subject_id", subjectId); // Attach subject ID for context.
          if (weekDescription) {
            formData.append("description", weekDescription);
          }

          try {
            await createContent(formData);
            finalMessage.push("File uploaded successfully.");
            setSelectedFile(null); // Clear selected file after upload.
            // Reset file input value
            if (document.getElementById("contentFile")) {
              document.getElementById("contentFile").value = "";
            }
          } catch (contentUploadError) {
            console.error("Content upload error:", contentUploadError); // Consider using a more robust logging mechanism.
            finalMessage.push("Failed to upload file.");
            success = false;
          }
        }

        // Re-fetch contents to reflect changes (updates/uploads/deletions).
        await fetchContents();

        setResponseMessage(finalMessage.join(" "));
        setResponseClass(success ? "success" : "error");
        clearMessage();
      } catch (overallError) {
        console.error("Submit operation failed:", overallError); // Consider using a more robust logging mechanism.
        setError("An unexpected error occurred during submission.");
        setResponseClass("error");
        clearMessage();
      }
    },
    [
      userRole,
      weekId,
      weekTitle,
      weekDescription,
      originalWeekTitle,
      originalWeekDescription,
      selectedFile,
      subjectId,
      clearMessage,
      fetchContents, // Callback dependency
    ]
  );

  return {
    // State variables returned by the hook
    selectedFile,
    weekId,
    weekTitle,
    weekDescription,
    subjectId,
    originalWeekTitle,
    originalWeekDescription,
    responseMessage,
    responseClass,
    error,
    availableSubjects,
    availableWeeks,
    loadingSubjects,
    loadingWeeks,
    contents,
    loadingContents,
    showTitleWarning,
    showDescriptionWarning,
    userRole,
    ALLOWED_ROLES,

    // Setters returned by the hook
    setSelectedFile,
    setWeekId,
    setWeekTitle,
    setWeekDescription,
    setSubjectId,

    // Handlers returned by the hook
    handleFileChange,
    handleWeekIdChange,
    handleTitleChange,
    handleDescriptionChange,
    handleSubjectIdChange,
    handleSubmit,
    handleDownload,
    handleDelete,

    // Actions/Functions returned by the hook
    fetchContents,
    clearMessage,
  };
};

export default useContentManagementData;
