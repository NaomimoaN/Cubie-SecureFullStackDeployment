// client/src/hooks/useHomeworkForm.js
/**
 * @purpose Manages the entire homework creation form: its input states (files, week, title, description, due date), dynamic fetching of subjects and weeks, auto-generation of homework title/description based on selections, and the submission process including validation, file uploads, and user feedback. */

import { useState, useEffect, useCallback } from "react";
import { createHomework } from "../services/homeworkService";
import * as subjectService from "../services/subjectService";
import * as userSubjectService from "../services/userSubjectService";
import { getWeeksBySubjectId, getWeekById } from "../services/weekService";

import useAuth from "./useAuth";

const useHomeworkForm = () => {
  const { user, loading: authLoading } = useAuth();
  const userRole = user?.role;
  const ALLOWED_ROLES = ["teacher", "admin"];

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [weekId, setWeekId] = useState("");
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [responseMessage, setResponseMessage] = useState("");
  const [responseClass, setResponseClass] = useState("");
  const [error, setError] = useState("");

  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingWeeks, setLoadingWeeks] = useState(false);

  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [selectedWeekNumber, setSelectedWeekNumber] = useState("");
  const [selectedWeekTitle, setSelectedWeekTitle] = useState("");
  const [selectedWeekDescription, setSelectedWeekDescription] = useState("");
  const [isHomeworkTitleManuallyEdited, setIsHomeworkTitleManuallyEdited] =
    useState(false);
  const [isDescriptionManuallyEdited, setIsDescriptionManuallyEdited] =
    useState(false);

  const clearMessage = useCallback(() => {
    setTimeout(() => {
      setResponseMessage("");
      setResponseClass("");
      setError("");
    }, 3000);
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!ALLOWED_ROLES.includes(userRole)) {
      setError(
        "Forbidden: Your role does not have permission to create homework."
      );
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
          response = await userSubjectService.getTeacherSubjects();
        } else if (userRole === "admin") {
          response = await subjectService.getAllSubjects();
        } else {
          setError("Unauthorized role for fetching subjects.");
          setLoadingSubjects(false);
          return;
        }

        setAvailableSubjects(response);
        setSubjectId("");
        setSelectedSubjectName("");
        setSelectedWeekNumber("");
        setSelectedWeekTitle("");
        setSelectedWeekDescription("");
        setIsHomeworkTitleManuallyEdited(false);
        setIsDescriptionManuallyEdited(false);
      } catch (error) {
        console.error("useHomeworkForm: Failed to load subjects:", error);
        setError(
          "Failed to load subjects. Please check your assignments or overall subject list."
        );
        setResponseClass("error");
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [userRole, authLoading]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!ALLOWED_ROLES.includes(userRole)) {
      setLoadingWeeks(false);
      return;
    }

    const fetchWeeksAndDetails = async () => {
      if (!subjectId) {
        setAvailableWeeks([]);
        setWeekId("");
        setSelectedWeekNumber("");
        setSelectedWeekTitle("");
        setSelectedWeekDescription("");
        setIsHomeworkTitleManuallyEdited(false);
        setIsDescriptionManuallyEdited(false);
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
        if (fetchedWeeks.length > 0) {
          const isCurrentWeekValid = fetchedWeeks.some(
            (week) => week._id === weekId
          );
          initialWeekId = isCurrentWeekValid ? weekId : "";
        }
        setWeekId(initialWeekId);

        if (initialWeekId) {
          const weekDetails = await getWeekById(initialWeekId);
          setSelectedWeekNumber(weekDetails.weekNumber);
          setSelectedWeekTitle(weekDetails.title);
          setSelectedWeekDescription(weekDetails.description);
        } else {
          setSelectedWeekNumber("");
          setSelectedWeekTitle("");
          setSelectedWeekDescription("");
        }
        setIsHomeworkTitleManuallyEdited(false);
        setIsDescriptionManuallyEdited(false);
      } catch (error) {
        console.error(
          `useHomeworkForm: Failed to load weeks/week details for subject (ID: ${subjectId}):`,
          error
        );
        setError("Failed to load weeks for the selected subject.");
        setAvailableWeeks([]);
        setWeekId("");
        setSelectedWeekNumber("");
        setSelectedWeekTitle("");
        setSelectedWeekDescription("");
        setIsHomeworkTitleManuallyEdited(false);
        setIsDescriptionManuallyEdited(false);
      } finally {
        setLoadingWeeks(false);
      }
    };
    fetchWeeksAndDetails();
  }, [subjectId, userRole, authLoading, weekId]);

  useEffect(() => {
    if (!isHomeworkTitleManuallyEdited) {
      let title = "";
      if (selectedSubjectName && selectedWeekTitle && selectedWeekNumber) {
        title = `${selectedSubjectName} - Week ${selectedWeekNumber}: ${selectedWeekTitle} Homework`;
      } else if (selectedSubjectName && selectedWeekNumber) {
        title = `${selectedSubjectName} - Week ${selectedWeekNumber} Homework`;
      } else if (selectedSubjectName) {
        title = `${selectedSubjectName} Homework`;
      }
      setHomeworkTitle(title);
    }
  }, [
    selectedSubjectName,
    selectedWeekNumber,
    selectedWeekTitle,
    isHomeworkTitleManuallyEdited,
  ]);

  useEffect(() => {
    if (!isDescriptionManuallyEdited) {
      setDescription(selectedWeekDescription || "");
    }
  }, [selectedWeekDescription, isDescriptionManuallyEdited]);

  const handleFileChange = useCallback((event) => {
    setSelectedFiles(Array.from(event.target.files));
    setResponseMessage("");
    setError("");
  }, []);

  const handleWeekIdChange = useCallback((e) => {
    const newWeekId = e.target.value;
    setWeekId(newWeekId);
    setError("");
    setIsHomeworkTitleManuallyEdited(false);
    setIsDescriptionManuallyEdited(false);
  }, []);

  const handleTitleChange = useCallback((e) => {
    setHomeworkTitle(e.target.value);
    setIsHomeworkTitleManuallyEdited(true);
    setError("");
  }, []);

  const handleSubjectIdChange = useCallback(
    (e) => {
      const newSubjectId = e.target.value;
      setSubjectId(newSubjectId);
      setWeekId("");
      setAvailableWeeks([]);
      setError("");
      setIsHomeworkTitleManuallyEdited(false);
      setIsDescriptionManuallyEdited(false);

      const selectedSub = availableSubjects.find(
        (sub) => sub._id === newSubjectId
      );
      setSelectedSubjectName(selectedSub ? selectedSub.name : "");
      setSelectedWeekNumber("");
      setSelectedWeekTitle("");
      setSelectedWeekDescription("");
    },
    [availableSubjects]
  );

  const handleDescriptionChange = useCallback((e) => {
    setDescription(e.target.value);
    setIsDescriptionManuallyEdited(true);
    setError("");
  }, []);

  const handleDueDateChange = useCallback((e) => {
    setDueDate(e.target.value);
    setError("");
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!ALLOWED_ROLES.includes(userRole)) {
        setError(
          "Forbidden: Your role does not have permission to create homework."
        );
        clearMessage();
        return;
      }

      if (selectedFiles.length === 0) {
        setResponseMessage("At least one file must be selected for homework.");
        setResponseClass("error");
        clearMessage();
        return;
      }

      if (!weekId || !homeworkTitle || !subjectId || !dueDate) {
        setResponseMessage(
          "Please fill in all required fields (including Due Date)."
        );
        setResponseClass("error");
        clearMessage();
        return;
      }

      setResponseMessage("Creating homework and uploading files...");
      setResponseClass("");

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      formData.append("week_id", weekId);
      formData.append("title", homeworkTitle);
      formData.append("description", description);
      formData.append("subject_id", subjectId);
      formData.append("dueDate", dueDate);

      try {
        const result = await createHomework(formData);

        setResponseMessage(
          "Homework created successfully: " +
            (result.message || JSON.stringify(result))
        );
        setResponseClass("success");
        setSelectedFiles([]);
        setHomeworkTitle("");
        setDescription("");
        setSubjectId("");
        setWeekId("");
        setDueDate("");
        if (document.getElementById("homeworkFile")) {
          document.getElementById("homeworkFile").value = "";
        }
        setIsHomeworkTitleManuallyEdited(false);
        setIsDescriptionManuallyEdited(false);
        setSelectedSubjectName("");
        setSelectedWeekNumber("");
        setSelectedWeekTitle("");
        setSelectedWeekDescription("");

        clearMessage();
      } catch (error) {
        console.error("useHomeworkForm: Homework creation error:", error);
        if (error.response) {
          const errorMessage =
            error.response.data.message || JSON.stringify(error.response.data);
          setResponseMessage(
            `Homework creation failed (${error.response.status}): ${errorMessage}`
          );
        } else {
          setResponseMessage("Connection error: " + error.message);
        }
        setResponseClass("error");
        clearMessage();
      }
    },
    [
      selectedFiles,
      weekId,
      homeworkTitle,
      subjectId,
      description,
      dueDate,
      userRole,
      ALLOWED_ROLES,
      clearMessage,
    ]
  );

  return {
    selectedFiles,
    weekId,
    homeworkTitle,
    subjectId,
    description,
    dueDate,
    responseMessage,
    responseClass,
    error,
    availableSubjects,
    availableWeeks,
    loadingSubjects,
    loadingWeeks,
    userRole,
    ALLOWED_ROLES,
    authLoading,

    handleFileChange,
    handleWeekIdChange,
    handleTitleChange,
    handleSubjectIdChange,
    handleDescriptionChange,
    handleDueDateChange,
    handleSubmit,

    setSelectedFiles,
    setWeekId,
    setHomeworkTitle,
    setSubjectId,
    setDescription,
    setDueDate,
  };
};

export default useHomeworkForm;
