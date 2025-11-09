// client/src/components/teacher/course-editor/TeacherHomeworkPreviewPage.jsx
/**
 * This component displays a preview of the homework assignment
 * based on the data provided from TeacherHomeworkInputForm.
 * It also allows the teacher to finalize the homework creation/update.
 */
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import homeworkService from "../../../services/homeworkService";
import { getWeeksBySubjectId } from "../../../services/weekService";
import { DownloadIcon } from "../../../assets/Icons";

function TeacherHomeworkPreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const {
    homeworkTitle,
    homeworkDescription,
    dueDate,
    selectedWeekId,
    newFiles,
    existingFiles,
    filesToDelete,
    rubricEmerging,
    rubricDeveloping,
    rubricProficient,
    rubricExtending,
    selectedCompetencies,
    currentSubjectId,
    homeworkId,
  } = location.state || {};

  const [weekName, setWeekName] = useState("Loading week...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const isEditMode = !!homeworkId;

  useEffect(() => {
    if (!location.state) {
      navigate(`/teacher/course-editor/${subjectId}/homework/create`);
      return;
    }

    const fetchWeekName = async () => {
      try {
        const weeks = await getWeeksBySubjectId(currentSubjectId || subjectId);
        const selectedWeek = weeks.find((week) => week._id === selectedWeekId);
        if (selectedWeek) {
          setWeekName(`Week ${selectedWeek.weekNumber}: ${selectedWeek.title}`);
        } else {
          setWeekName("Week not found");
        }
      } catch (err) {
        console.error("Failed to fetch week name:", err);
        setWeekName("Error loading week");
      }
    };

    if (selectedWeekId) {
      fetchWeekName();
    } else {
      setWeekName("No week selected");
    }
  }, [location.state, selectedWeekId, currentSubjectId, subjectId, navigate]);

  const handleCreateHomework = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowCreatedModal(false);

    try {
      const data = new FormData();
      data.append("title", homeworkTitle);
      data.append("description", homeworkDescription);
      data.append("dueDate", dueDate);
      data.append("week", selectedWeekId);
      data.append("rubricEmerging", rubricEmerging);
      data.append("rubricDeveloping", rubricDeveloping);
      data.append("rubricProficient", rubricProficient);
      data.append("rubricExtending", rubricExtending);
      data.append("coreCompetencies", JSON.stringify(selectedCompetencies));
      data.append("status", "published");
      data.append("subject", currentSubjectId || subjectId);

      newFiles.forEach((file) => {
        data.append("files", file);
      });

      if (filesToDelete && filesToDelete.length > 0) {
        data.append("s3KeysToDelete", JSON.stringify(filesToDelete));
      }

      if (isEditMode) {
        await homeworkService.updateHomework(homeworkId, data);
        setModalMessage("Updated");
      } else {
        await homeworkService.createHomework(data);
        setModalMessage("Created");
      }

      setShowCreatedModal(true);
      setTimeout(() => {
        setShowCreatedModal(false);
        navigate(`/teacher/course-editor/${subjectId}/homework`);
      }, 2000);
    } catch (err) {
      console.error("Error creating/updating homework:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create homework. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    homeworkTitle,
    homeworkDescription,
    dueDate,
    selectedWeekId,
    rubricEmerging,
    rubricDeveloping,
    rubricProficient,
    rubricExtending,
    selectedCompetencies,
    currentSubjectId,
    subjectId,
    newFiles,
    filesToDelete,
    isEditMode,
    homeworkId,
    navigate,
  ]);

  const handleBackToEdit = useCallback(() => {
    navigate(
      `/teacher/course-editor/${subjectId}/homework/${
        isEditMode ? homeworkId + "/edit" : "create"
      }`,
      {
        state: location.state,
      }
    );
  }, [navigate, subjectId, isEditMode, homeworkId, location.state]);

  const handleDownloadNewFile = useCallback((file) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // const handleDownloadExistingFile = useCallback((file) => {
  //   alert(
  //     `Downloading existing file: ${file.fileName}\n(This functionality requires a direct S3 URL, which is not available in preview state.)`
  //   );
  // }, []);

  if (!location.state) {
    return null;
  }

  return (
    <div className="container rounded-lg mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Preview as Student
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      <div className="bg-gray1 p-8 rounded-lg shadow-md">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {homeworkTitle || "No Title"}
          </h2>
        </div>

        {/* Due Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-gray-700">
              {dueDate
                ? format(new Date(dueDate), "MMMM dd, yyyy 'at' h:mm a")
                : "Not set"}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <div className="prose max-w-none text-gray-700">
            {homeworkDescription ? (
              <div dangerouslySetInnerHTML={{ __html: homeworkDescription }} />
            ) : (
              <p className="text-gray-500 italic">No description provided.</p>
            )}
          </div>
        </div>

        {/* Attachments */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Attachments
          </h3>
          {newFiles.length > 0 || existingFiles.length > 0 ? (
            <ul className="list-disc pl-5 text-gray-700">
              {existingFiles.map((file) => (
                <li
                  key={file.s3Key}
                  className="flex items-center justify-between"
                >
                  <span>{file.fileName}</span>
                  {/* Download button for existing files (commented out as S3 URL not available in preview) */}
                  {/* <button
                    type="button"
                    onClick={() => handleDownloadExistingFile(file)}
                    className="ml-2 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md cursor-not-allowed"
                    disabled={true}
                  >
                    Download (S3 URL not available)
                  </button> */}
                </li>
              ))}
              {newFiles.map((file, index) => (
                <li
                  key={file.name + index}
                  className="flex items-center justify-between"
                >
                  <span>{file.name} (New)</span>
                  <button
                    type="button"
                    onClick={() => handleDownloadNewFile(file)}
                    className="ml-2 px-3 py-1 text-sm bg-transparent text-blue-800 rounded-md border-none"
                  >
                    <DownloadIcon className="text-blue2 hover:text-orange2" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No attachments.</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleBackToEdit}
          className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-gray1 hover:bg-gray3 border-none"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCreateHomework}
          disabled={loading}
          className={`px-4 py-2 border border-transparent rounded-full text-sm font-medium text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange1 hover:bg-orange2 border-none"
          }`}
        >
          {isEditMode ? "Update" : "Create"}
        </button>
      </div>

      {/* Created/Updated Modal */}
      {showCreatedModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div
            className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center relative
                   w-[50vw] h-[40vh] mx-auto my-auto overflow-y-auto justify-center"
          >
            {/* Close button removed as per request */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-800">
              {modalMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherHomeworkPreviewPage;
