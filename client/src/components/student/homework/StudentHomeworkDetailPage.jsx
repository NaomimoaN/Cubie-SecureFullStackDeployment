// client/src/pages/StudentHomeworkDetailPage.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PdfViewer from "../../common/PdfViewer";
import { useHomeworkDetails } from "../../../hooks/useHomeworkDetails";
import { useFileUpload } from "../../../hooks/useFileUpload";
import { getS3KeyFromFileUrl } from "../../../utils/fileUtils";
import { formatCalendarDate } from "../../../utils/formatters.js";
import { ResponsiveLayout } from "../../common/ResponsiveLayout.jsx";
import submissionService from "../../../services/submissionService";
import homeworkService from "../../../services/homeworkService";
import RichTextEditor from "../../common/RichTextEditor";
import { DownloadIcon, UploadIcon, ClockIcon } from "../../../assets/Icons.jsx";

const PDF_VIEWER_FIXED_WIDTH = 500;
const MAIN_CONTENT_MIN_WIDTH = 348;

const PDF_VIEWER_HEADER_OFFSET = 70;
const DEFAULT_PDF_VIEWER_HEIGHT_FALLBACK = 700;

function StudentHomeworkDetailPage({ user }) {
  const { subjectId, homeworkId } = useParams();
  const navigate = useNavigate();
  const {
    homework,
    submission,
    loading,
    error,
    message,
    messageType,
    showTemporaryMessage,
    fetchData,
  } = useHomeworkDetails(subjectId, homeworkId, user?.userId);

  const internalPdfViewerContainerRef = useRef(null);

  const [pdfViewerActualWidth, setPdfViewerActualWidth] = useState(0);
  const [pdfViewerContainerRect, setPdfViewerContainerRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  const [isSubmittingAnnotations, setIsSubmittingAnnotations] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const handleUploadSuccess = useCallback(() => {
    setShowCompletionModal(true);
  }, []);

  const {
    selectedFile,
    uploading,
    uploadProgress,
    uploadError,
    successMessage,
    handleFileChange,
    handleSubmit: originalHandleFileUploadSubmit,
  } = useFileUpload(
    homeworkId && user?.userId ? homeworkId : null,
    homeworkId && user?.userId ? submission : null,
    fetchData,
    showTemporaryMessage,
    handleUploadSuccess
  );

  const handleFileUploadSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      showTemporaryMessage("Please select a file to submit.", "error");
      return;
    }

    if (!homeworkId || !user?.userId) {
      showTemporaryMessage("Homework ID or user ID is missing.", "error");
      return;
    }

    if (originalHandleFileUploadSubmit) {
      await originalHandleFileUploadSubmit(e, user.userId);
    } else {
      console.error(
        "originalHandleFileUploadSubmit is not defined. Missing homeworkId or userId?"
      );
      showTemporaryMessage("File upload processing is unavailable.", "error");
    }
  };

  const handleReturnToTodo = () => {
    setShowCompletionModal(false);
    navigate("/student/to-do");
  };

  useEffect(() => {
    const currentRef = internalPdfViewerContainerRef.current;
    if (!currentRef) {
      return;
    }

    const updateDimensions = () => {
      const rect = currentRef.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setPdfViewerActualWidth(rect.width);
        setPdfViewerContainerRect(rect);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === currentRef) {
          updateDimensions();
          break;
        }
      }
    });

    resizeObserver.observe(currentRef);

    return () => {
      if (resizeObserver) {
        resizeObserver.unobserve(currentRef);
        resizeObserver.disconnect();
      }
    };
  }, [internalPdfViewerContainerRef]);

  if (!user?.userId) {
    return (
      <div className="p-4 text-center text-blue-600">
        Loading user information...
      </div>
    );
  }

  if (loading) {
    return <div className="p-4 text-center">Loading homework details...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-700 bg-red-100 border border-red-400 rounded-md">
        Error: {error}
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="p-4 text-center text-gray-500">No homework found.</div>
    );
  }

  const handleDownload = async (file) => {
    try {
      await homeworkService.downloadHomeworkFile(homeworkId, file.s3Key);

      showTemporaryMessage(
        `Started downloading '${file.fileName}'.`,
        "success"
      );
    } catch (err) {
      console.error("File download error:", err);
      showTemporaryMessage(
        `Failed to download file: ${
          err.message || "An unknown error occurred."
        }`,
        "error"
      );
    }
  };

  const SuccessCompletionModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-[530px] h-[260px] text-center flex flex-col items-center justify-center">
          <h2 className="text-md font-bold text-primeblack mb-12">
            You did it! Submission complete!
          </h2>
          <button
            onClick={onConfirm}
            className="px-6 py-2 text-sm bg-orange1 text-white font-semibold rounded-full hover:bg-orange2 transition duration-150 ease-in-out"
          >
            Return to To-do
          </button>
        </div>
      </div>
    );
  };

  const homeworkDetailsContent = (
    <div className="p-6 ml-1 w-full bg-white h-full overflow-y-auto">
      {message && (
        <div
          className={`px-4 py-3 mb-6 rounded-md text-center text-lg font-medium ${
            messageType === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
          role="alert"
        >
          {message}
        </div>
      )}

      <h1 className="text-[20px] font-semibold text-primeblack mb-4">
        {homework.title}
      </h1>
      <div className="flex items-center">
        <ClockIcon className="h-5 w-5 mr-2" />
        <p className="text-secondblack2">
          {homework.dueDate ? formatCalendarDate(homework.dueDate) : "Not set"}
        </p>
      </div>

      <div>
        {homework.description ? (
          <RichTextEditor
            value={homework.description}
            readOnly={true}
            className="my-4 mx-0"
          />
        ) : (
          <p className="text-gray-500">No description available.</p>
        )}
      </div>

      {homework.files?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md my-4 font-semibold text-primeblack mb-2">
            Activity Files:
          </h3>
          <ul className="list-disc list-inside text-sm text-primeblack">
            {homework.files.map((file, index) => (
              <li
                key={file.s3Key || file.fileURL || `hw-file-${index}`}
                className="flex justify-between items-center py-1"
              >
                <div className="flex items-center border border-gray3 px-2 rounded-md">
                  <span className="text-sm font-normal text-primeblack">
                    {file.fileName}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDownload(file);
                    }}
                    className="ml-4 p-1 bg-white text-blue2 text-xs border-none flex items-center justify-center"
                    title="Download"
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t pt-6 mt-6 border-gray-200">
        {submission?.submittedFiles?.length > 0 && (
          <div className="mb-4">
            <p className="text-md font-medium text-primeblack mb-2">
              Submitted Files:
            </p>
            <ul className="list-disc list-inside text-sm text-primeblack">
              {submission.submittedFiles.map((file, index) => (
                <li
                  key={file._id || file.s3Key || `submission-file-${index}`}
                  className="flex justify-between items-center py-1"
                >
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDownload(file);
                    }}
                    className="font-semibold text-purple-600 hover:underline flex items-center"
                  >
                    {file.fileName} (
                    {new Date(file.uploadedAt).toLocaleDateString()})
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {submission?.submissionStatus === "graded" &&
          submission.grade?.score !== null && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <p className="text-lg font-bold text-purple-800">
                Grade: {submission.grade.score}
              </p>
              {submission.grade.feedback && (
                <p className="text-sm text-purple-700 mt-1">
                  Feedback: {submission.grade.feedback}
                </p>
              )}
            </div>
          )}

        {homeworkId && user?.userId ? (
          <>
            <div className="p-4 bg-grayblue1 rounded-lg">
              <form id="file-upload-form" onSubmit={handleFileUploadSubmit}>
                <div>
                  <label
                    htmlFor="file-upload"
                    className="block text-xl font-semibold text-primeblack mb-6"
                  >
                    Your Work
                  </label>
                  <div
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-1 bg-grayblue2 border-blue1 border-dashed rounded-md cursor-pointer hover:border-gray-400 transition duration-150 ease-in-out"
                    onClick={() =>
                      document.getElementById("file-upload").click()
                    }
                  >
                    <div className="flex flex-col gap-4 items-center space-y-1 text-center">
                      <UploadIcon />
                      <div className="flex text-sm text-gray-600">
                        <p className="pl-1">
                          Choose a file or drag and drop here
                        </p>
                      </div>
                      <div className="text-sm border w-[100px] rounded-full bg-gray1 hover:bg-gray text-primeblack py-1 px-2 mt-2">
                        Browse files
                      </div>
                    </div>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="sr-only"
                    disabled={uploading || isSubmittingAnnotations}
                  />
                  {selectedFile && (
                    <div className="mt-2 text-sm rounded-md bg-white w-[300px] border p-2 border-gray3 text-primeblack">
                      {selectedFile.name}
                    </div>
                  )}
                  {uploadError && (
                    <p className="mt-2 text-sm text-red-500">{uploadError}</p>
                  )}
                  {successMessage && (
                    <p className="mt-2 text-sm text-green-500">
                      {successMessage}
                    </p>
                  )}
                </div>

                {(uploading || isSubmittingAnnotations) && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-500 ml-2">
                      {uploadProgress}%
                    </span>
                  </div>
                )}
              </form>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                form="file-upload-form"
                disabled={uploading || isSubmittingAnnotations || !selectedFile}
                className="w-200 px-10 py-2 bg-orange1 text-white font-semibold rounded-full hover:bg-orange2 border-none disabled:opacity-80 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 text-yellow-700 bg-yellow-100 border border-yellow-400 rounded-md">
            To use the file upload feature, homework details and user
            information must be fully loaded.
          </div>
        )}
      </div>
    </div>
  );

  const LAYOUT_BREAKPOINT = MAIN_CONTENT_MIN_WIDTH + PDF_VIEWER_FIXED_WIDTH;

  const pdfViewerContent = null;

  return (
    <div className="h-full w-full">
      <ResponsiveLayout
        mainContent={homeworkDetailsContent}
        asideContent={pdfViewerContent}
        mainTabLabel="Homework Details"
        asideTabLabel="PDF Viewer"
        showAsideContentInDesktop={false}
        breakpoint={LAYOUT_BREAKPOINT}
        pdfViewerIdealWidth={PDF_VIEWER_FIXED_WIDTH}
        pdfViewerMinVisibleWidth={PDF_VIEWER_FIXED_WIDTH}
        minMainContentWidth={MAIN_CONTENT_MIN_WIDTH}
      />
      <SuccessCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onConfirm={handleReturnToTodo}
      />
    </div>
  );
}

export default StudentHomeworkDetailPage;
