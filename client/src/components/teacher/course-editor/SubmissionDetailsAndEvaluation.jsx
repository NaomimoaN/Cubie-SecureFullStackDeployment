// client/src/components/teacher/course-editor/SubmissionDetailsAndEvaluation.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import submissionService from "../../../services/submissionService";
import useAuth from "../../../hooks/useAuth";
import { Document, Page, pdfjs } from "react-pdf";
import {
  LeftIcon,
  RightIcon,
  AccountIcon,
  CloseIcon,
  RubricIcon,
  ZoomInIcon,
  ZoomOutIcon,
  DownloadIcon,
} from "../../../assets/Icons";
import { CORE_COMPETENCIES } from "../../../utils/coreCompetencies";
import RichTextEditor from "../../common/RichTextEditor";
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

//This is the flag for demo//////////////////////
const ENABLE_DEMO_FEATURE = true;
const DEMO_RICH_TEXT_CONTENT = `
<p><em>Aim for accuracy in your answers!</em><br></p><ol><li><p>Read the Clock! - Almost there. Try to read it a bit <u>more precisely.</u></p></li><li><p> Draw the Hands! -<u> This shows 3:00.</u></p></li><li><p>Solve the Equations! - Calculation error.</p></li><li><p>Compare the Numbers! - <strong>Correct!</strong></p></li></ol><p></p>
`;
///////////////////////////////////////////////

// Helper function to convert competency strings to rubricScores keys
const getRubricKey = (competencyName) => {
  const key = competencyName
    .toLowerCase()
    .replace(/\s(.)/g, (match, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
  const mappings = {
    personalresponsibility: "responsibility",
    communication: "communication",
    criticalthinking: "criticalThinking",
    creativethinking: "creativeThinking",
    identity: "identity",
    socialresponsibility: "socialResponsibility",
  };
  return mappings[key] || key;
};

// Define overall grade levels
const gradeLevels = {
  Emerging: 1,
  Developing: 2,
  Proficient: 3,
  Extending: 4,
};

// Helper function to infer MIME type from file name
const getFileTypeFromFileName = (fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case "png":
    case "jpg":
    case "jpeg":
      return "image/" + ext;
    case "pdf":
      return "application/pdf";
    case "txt":
    case "doc":
    case "docx":
    case "xls":
    case "xlsx":
    case "ppt":
    case "pptx":
      return "application/octet-stream";
    default:
      return "application/octet-stream";
  }
};

const calculateLetterGrade = (score) => {
  if (score === null || isNaN(score)) {
    return "";
  }
  if (score >= 90) {
    return "Extending";
  } else if (score >= 80) {
    return "Proficient";
  } else if (score >= 65) {
    return "Developing";
  } else {
    return "Emerging";
  }
};

// Rubric Modal Component
const RubricModal = ({ rubricData, onClose }) => {
  const rubricLevels = [
    { title: "Emerging", key: "emerging", range: "<65%" },
    { title: "Developing", key: "developing", range: "65% - 79%" },
    { title: "Proficient", key: "proficient", range: "80% - 89%" },
    { title: "Extending", key: "extending", range: "> 90%" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white border-none"
          aria-label="Close rubric details"
        >
          <CloseIcon className="text-primeblack hover:text-orange2" />
        </button>
        <h3 className="text-xl font-semibold text-primeblack mb-4">Rubric</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-grayblue1 p-2 h-[50vh] lg:h-[40vh] overflow-y-auto">
          {rubricLevels.map((level) => (
            <div key={level.key}>
              <div className="block text-center bg-blue1 text-sm font-medium text-primeblack mb-2 py-2">
                {level.title}
              </div>
              <div className="bg-white p-3 h-[15vh] lg:h-[33vh] overflow-auto flex flex-col justify-between">
                <p className="text-primeblack text-sm">
                  {rubricData[level.key] || "No description provided."}
                </p>
                <p className="text-gray-600 text-xs mt-2">{level.range}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function SubmissionDetailsAndEvaluation({
  homework,
  submissionId,
  onBack,
  submissions,
  onNavigateSubmission,
}) {
  const { user } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isEditMode = !!submissionId;
  const handleFeedbackChange = useCallback((htmlContent) => {
    setGradeData((prev) => ({ ...prev, feedback: htmlContent }));
  }, []);
  // Integrated state for the evaluation form
  const [gradeData, setGradeData] = useState({
    score: null,
    letterGrade: "",
    rubricScores: {},
    feedback: "",
    gradedBy: user?._id || null,
    gradedAt: null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [inputErrors, setInputErrors] = useState({});
  const [showRubricModal, setShowRubricModal] = useState(false);

  // State related to file display
  const [displayedFileUrl, setDisplayedFileUrl] = useState(null);
  const [selectedFileForDisplay, setSelectedFileForDisplay] = useState(null);
  const [isFileLoading, setIsFileLoading] = useState(false);

  // Multiple pdf
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfScale, setPdfScale] = useState(0.4);

  const currentIndex = Array.isArray(submissions)
    ? submissions.findIndex((sub) => sub._id === submissionId)
    : -1;
  const previousSubmission =
    currentIndex > 0 ? submissions[currentIndex - 1] : null;
  const nextSubmission =
    currentIndex !== -1 && currentIndex < submissions.length - 1
      ? submissions[currentIndex + 1]
      : null;

  const handleFileDisplay = useCallback(
    async (file) => {
      setDisplayedFileUrl(null);
      setSelectedFileForDisplay(null);
      setIsFileLoading(true);
      setNumPages(null);
      setPageNumber(1);
      setPdfScale(1.0);

      if (!file || !file.s3Key || !file.fileName) {
        setIsFileLoading(false);
        return;
      }

      try {
        const responseData =
          await submissionService.getSignedSubmissionDisplayUrl(
            submissionId,
            file.s3Key
          );

        let finalSignedUrl = null;
        if (typeof responseData === "string") {
          finalSignedUrl = responseData;
        } else if (
          responseData &&
          typeof responseData === "object" &&
          responseData.signedUrl
        ) {
          finalSignedUrl = responseData.signedUrl;
        } else if (
          responseData &&
          typeof responseData === "object" &&
          responseData.data &&
          typeof responseData.data === "string"
        ) {
          finalSignedUrl = responseData.data;
        } else {
          console.error("Unexpected API response structure:", responseData);
        }

        if (finalSignedUrl) {
          setDisplayedFileUrl(finalSignedUrl);
        } else {
          console.error(
            "Could not extract signed URL from API response.",
            responseData
          );
          setDisplayedFileUrl(null);
        }

        const inferredFileType = getFileTypeFromFileName(file.fileName);

        setSelectedFileForDisplay({ ...file, fileType: inferredFileType });
      } catch (err) {
        console.error("Error displaying submitted file:", err);
      } finally {
        setIsFileLoading(false);
      }
    },
    [submissionId]
  );

  const handleDownloadSubmittedFile = async (
    fileS3Key,
    currentSubmissionId,
    fileName
  ) => {
    try {
      const { signedUrl, fileName: downloadedFileName } =
        await submissionService.getSignedSubmissionDownloadUrl(
          currentSubmissionId,
          fileS3Key
        );

      if (!signedUrl) {
        throw new Error("Signed URL not received from the server.");
      }

      const link = document.createElement("a");
      link.href = signedUrl;
      link.setAttribute("download", downloadedFileName || "download");
      link.setAttribute("target", "_blank");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download file:", error);
      // alert(
      //   `Failed to download file: ${
      //     error.message || "An unknown error occurred."
      //   }`
      // );
    }
  };

  const fetchSubmissionDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await submissionService.getSubmissionById(submissionId);
      setSubmission(data);

      const initialGradeData = {
        score:
          data.grade?.score !== undefined && data.grade?.score !== null
            ? data.grade.score
            : null,
        letterGrade: "",
        feedback: data.grade?.feedback || "",
        gradedBy: data.grade?.gradedBy || user?._id || null,
        gradedAt: data.grade?.gradedAt || null,
        rubricScores: {},
      };

      if (initialGradeData.score !== null) {
        initialGradeData.letterGrade = calculateLetterGrade(
          initialGradeData.score
        );
      } else {
        initialGradeData.letterGrade = data.grade?.letterGrade || "";
      }

      if (homework?.coreCompetencies) {
        homework.coreCompetencies.forEach((comp) => {
          const key = getRubricKey(comp);
          if (
            data.grade?.rubricScores &&
            data.grade.rubricScores.hasOwnProperty(key)
          ) {
            initialGradeData.rubricScores[key] =
              data.grade.rubricScores[key] !== undefined &&
              data.grade.rubricScores[key] !== null
                ? data.grade.rubricScores[key]
                : null;
          } else {
            initialGradeData.rubricScores[key] = null;
          }
        });
      }
      setGradeData(initialGradeData);

      const initialInputErrors = {};
      if (
        initialGradeData.score !== null &&
        (!Number.isInteger(initialGradeData.score) ||
          initialGradeData.score < 0 ||
          initialGradeData.score > 100)
      ) {
        initialInputErrors.score =
          "Score must be an integer between 0 and 100.";
      }
      for (const key in initialGradeData.rubricScores) {
        const value = initialGradeData.rubricScores[key];
        if (
          value !== null &&
          (!Number.isInteger(value) || value < 0 || value > 100)
        ) {
          initialInputErrors[key] =
            "Score must be an integer between 0 and 100.";
        }
      }
      setInputErrors(initialInputErrors);

      if (data.submittedFiles && data.submittedFiles.length > 0) {
        const firstPdfFile = data.submittedFiles.find(
          (file) => getFileTypeFromFileName(file.fileName) === "application/pdf"
        );
        if (firstPdfFile) {
          handleFileDisplay(firstPdfFile);
        } else {
          handleFileDisplay(data.submittedFiles[0]);
        }
      } else {
        setDisplayedFileUrl(null);
        setSelectedFileForDisplay(null);
      }
    } catch (err) {
      console.error("Error fetching submission details:", err);
      setError("Failed to load submission details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [submissionId, homework, user?._id, handleFileDisplay]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...inputErrors };
    let processedValue = value === "" ? null : Number(value);

    const errorKey = name.startsWith("rubricScores.")
      ? name.split(".")[1]
      : name;

    if (name.startsWith("rubricScores.") || name === "score") {
      if (value === "") {
        newErrors[errorKey] = null;
      } else if (isNaN(processedValue)) {
        newErrors[errorKey] = "Please enter an integer between 0 and 100.";
      } else if (
        !Number.isInteger(processedValue) ||
        processedValue < 0 ||
        processedValue > 100
      ) {
        newErrors[errorKey] = "Scores must be integers between 0 and 100.";
      } else {
        newErrors[errorKey] = null;
      }
    }

    setInputErrors(newErrors);

    if (name.startsWith("rubricScores.")) {
      const rubricKey = name.split(".")[1];
      setGradeData((prev) => ({
        ...prev,
        rubricScores: {
          ...prev.rubricScores,
          [rubricKey]: processedValue,
        },
      }));
    } else if (name === "score") {
      const newLetterGrade = calculateLetterGrade(processedValue);
      setGradeData((prev) => ({
        ...prev,
        score: processedValue,
        letterGrade: newLetterGrade,
      }));
    } else {
      setGradeData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const hasAnyInputError = Object.values(inputErrors).some(
    (error) => error !== null
  );

  // Delete due to change of LetterGrade setting
  // const handleLetterGradeButtonClick = (grade) => {
  //   if (gradeData.score === null || gradeData.score === "") {
  //     setGradeData((prev) => ({
  //       ...prev,
  //       letterGrade: grade,
  //     }));
  //   }
  // };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();

    if (hasAnyInputError) {
      setSaveMessage("Please correct the input errors before saving.");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage("");
    setError(null);

    const parsedRubricScores = {};
    for (const key in gradeData.rubricScores) {
      const value = gradeData.rubricScores[key];

      parsedRubricScores[key] = value === "" ? null : Number(value);
    }

    const payloadScore =
      gradeData.score === "" ? null : Number(gradeData.score);

    try {
      const payload = {
        score: payloadScore,
        rubricScores: parsedRubricScores,
        letterGrade:
          gradeData.letterGrade === "" ? null : gradeData.letterGrade,
        feedback: gradeData.feedback,
        gradedBy: user?._id,
        gradedAt: new Date().toISOString(),
        submissionStatus: "graded",
      };

      const updatedSubmission = await submissionService.updateSubmissionGrade(
        submissionId,
        payload
      );
      setSubmission(updatedSubmission);
      setSaveMessage("Evaluation saved successfully!");

      // Update gradeData with the latest saved values
      const newGradeDataAfterSave = {
        score: updatedSubmission.grade?.score ?? null,
        letterGrade: updatedSubmission.grade?.letterGrade || "",
        feedback: updatedSubmission.grade?.feedback || "",
        gradedBy: updatedSubmission.grade?.gradedBy || user?._id || null,
        gradedAt: updatedSubmission.grade?.gradedAt || null,
        rubricScores: (() => {
          const updatedRubricScores = {};
          if (homework?.coreCompetencies) {
            homework.coreCompetencies.forEach((comp) => {
              const key = getRubricKey(comp);
              updatedRubricScores[key] =
                updatedSubmission.grade?.rubricScores?.[key] ?? null;
            });
          }
          return updatedRubricScores;
        })(),
      };
      setGradeData(newGradeDataAfterSave);
      setInputErrors({});
      onBack();
    } catch (err) {
      console.error("Error saving evaluation:", err);
      setError("Failed to save evaluation. Please try again.");
      setSaveMessage("");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleFeedbackEditorInteraction = useCallback(() => {
    if (ENABLE_DEMO_FEATURE && gradeData.feedback === "") {
      setGradeData((prev) => ({
        ...prev,
        feedback: DEMO_RICH_TEXT_CONTENT,
      }));
    }
  }, [ENABLE_DEMO_FEATURE, submissionId, gradeData.feedback]);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [fetchSubmissionDetails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-600 text-lg">Loading submission...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!submission || !homework) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-600 text-lg">
          Submission or homework details not found.
        </p>
      </div>
    );
  }

  const studentName = submission.student
    ? `${submission.student.profile.firstName || ""} ${
        submission.student.profile.lastName || ""
      }`
    : "Unknown Student";

  const currentSelectedLevel = gradeLevels[gradeData.letterGrade] || 0;

  return (
    <div className="bg-white min-h-screen">
      {/* Inner header */}
      <div className="flex flex-col lg:flex-row justify-between items-center">
        <div className="flex items-center mb-4 lg:mb-0">
          <button
            onClick={onBack}
            className="group flex justify-center bg-transparent text-primeblack rounded-full focus:outline-none focus:ring-0 mr-2 !outline-none !ring-0 !border-none"
          >
            <LeftIcon />
          </button>
          <AccountIcon className="mr-1" />
          <h2 className="text-lg font-semibold text-primeblack">
            {studentName}
          </h2>
        </div>

        <div className="flex flex-col items-end mt-4 lg:mt-0">
          <div className="flex space-x-2 p-2">
            {previousSubmission && (
              <button
                type="button"
                onClick={() => onNavigateSubmission(previousSubmission?._id)}
                className="group flex items-center justify-center p-2 rounded-md text-md font-semibold bg-transparent text-primeblack hover:text-orange2 focus:outline-none focus:ring-0 !outline-none !ring-0 !border-none"
              >
                <LeftIcon className="group-hover:text-orange2" />
                Previous work
              </button>
            )}
            {nextSubmission && (
              <button
                type="button"
                onClick={() => onNavigateSubmission(nextSubmission?._id)}
                className="group flex items-center justify-center p-2 rounded-md text-md font-semibold bg-transparent text-primeblack hover:text-orange2 focus:outline-none focus:ring-0 !outline-none !ring-0 !border-none"
              >
                Next work
                <RightIcon className="group-hover:text-orange2" />
              </button>
            )}
          </div>
          {Array.isArray(submissions) && submissions.length <= 1 && (
            <p className="text-right text-sm text-gray-500 mt-2">
              {submissions.length === 0
                ? "No submissions found."
                : "Single submission."}
            </p>
          )}
        </div>
      </div>
      {/* border between Inner header and Main wrapper */}
      <div className="border-b-2 border-gray-200 mx-[-1rem] lg:mx-[-1.5rem] mb-6 lg:mb-8"></div>
      {/*  Main wrapper */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[600px]">
        <div className="lg:w-1/2 bg-white flex flex-col flex-grow min-h-0 relative">
          {submission.submittedFiles && submission.submittedFiles.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {submission.submittedFiles.map((file) => {
                  if (
                    selectedFileForDisplay?.fileType === "application/pdf" &&
                    selectedFileForDisplay?.s3Key === file.s3Key
                  ) {
                    return null;
                  }
                  return (
                    <div
                      key={file.s3Key}
                      className={`p-2 border rounded-lg text-sm cursor-pointer flex items-center gap-2 ${
                        selectedFileForDisplay?.s3Key === file.s3Key
                          ? "bg-blue-200 border-blue-500"
                          : "bg-white border-gray-300 hover:bg-gray-100"
                      }`}
                      onClick={() => handleFileDisplay(file)}
                    >
                      <span className="flex-1">{file.fileName}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex-grow flex flex-col border border-gray-300 rounded-md p-2">
                {isFileLoading ? (
                  <p className="text-gray-600">Loading file...</p>
                ) : displayedFileUrl && selectedFileForDisplay ? (
                  selectedFileForDisplay.fileType.startsWith("image/") ? (
                    <img
                      src={displayedFileUrl}
                      alt={selectedFileForDisplay.fileName}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : selectedFileForDisplay.fileType === "application/pdf" ? (
                    <>
                      {numPages && (
                        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4 p-2 bg-white flex-shrink-0 border-b border-gray-200">
                          <span className="text-primeblack text-sm font-medium flex-1 text-center sm:text-left">
                            {selectedFileForDisplay.fileName}
                          </span>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                disabled={pageNumber <= 1}
                                onClick={() =>
                                  setPageNumber((prev) => Math.max(1, prev - 1))
                                }
                                className="px-2 py-1 bg-transparent border-none text-sm font-semibold disabled:text-gray3 disabled:cursor-not-allowed"
                              >
                                <LeftIcon className="w-4 h-4 text-primeblack hover:text-orange2" />
                              </button>
                              <span className="text-primeblack text-sm font-medium">
                                {pageNumber} / {numPages}
                              </span>
                              <button
                                type="button"
                                disabled={pageNumber >= numPages}
                                onClick={() =>
                                  setPageNumber((prev) =>
                                    Math.min(numPages, prev + 1)
                                  )
                                }
                                className="px-2 py-1 bg-transparent border-none text-sm font-semibold disabled:text-gray3 disabled:cursor-not-allowed"
                              >
                                <RightIcon className="w-4 h-4 text-primeblack hover:text-orange2" />
                              </button>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPdfScale((prev) =>
                                    Math.max(0.5, prev - 0.25)
                                  )
                                }
                                className="px-2 py-1 bg-transparent border-none text-sm font-semibold disabled:text-gray3 disabled:cursor-not-allowed"
                              >
                                <ZoomOutIcon className="w-5 h-5 text-primeblack hover:text-orange2" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPdfScale((prev) =>
                                    Math.min(3.0, prev + 0.25)
                                  )
                                }
                                className="px-2 py-1 bg-transparent border-none text-sm font-semibold disabled:text-gray3 disabled:cursor-not-allowed"
                              >
                                <ZoomInIcon className="w-5 h-5 text-primeblack hover:text-orange2" />
                              </button>
                            </div>

                            <button
                              onClick={() =>
                                handleDownloadSubmittedFile(
                                  selectedFileForDisplay.s3Key,
                                  submission._id,
                                  selectedFileForDisplay.fileName
                                )
                              }
                              className="p-2 rounded-full bg-white border-none"
                              title={`Download ${selectedFileForDisplay.fileName}`}
                            >
                              <DownloadIcon className="w-5 h-5 text-primeblack hover:text-orange2" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div
                        className="flex-grow w-full overflow-y-auto flex flex-col items-center justify-center"
                        style={{ maxHeight: "calc(100% - 100px)" }}
                      >
                        <Document
                          file={displayedFileUrl}
                          onLoadSuccess={({ numPages }) =>
                            setNumPages(numPages)
                          }
                          onLoadError={(error) =>
                            console.error("Error loading PDF:", error)
                          }
                          className="w-full flex items-center justify-center"
                        >
                          <Page
                            pageNumber={pageNumber}
                            scale={pdfScale}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            className="shadow-md"
                          />
                        </Document>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-gray-600 mb-4">
                        This file type cannot be displayed directly.
                        <br />
                        Please download to view content.
                      </p>
                      <button
                        onClick={() =>
                          handleDownloadSubmittedFile(
                            selectedFileForDisplay.s3Key,
                            submission._id,
                            selectedFileForDisplay.fileName
                          )
                        }
                        className="p-2 rounded-full hover:bg-blue-300 bg-blue-100 text-primeblack"
                        title={`Download ${selectedFileForDisplay.fileName}`}
                      >
                        <DownloadIcon className="w-5 h-5 inline-block mr-2" />{" "}
                        Download File
                      </button>
                    </div>
                  )
                ) : (
                  <p className="text-gray-600">Select a file to display.</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-lg text-gray-600">(No files submitted)</p>
            </div>
          )}
        </div>

        <div className="lg:w-1/2 bg-white">
          <form onSubmit={handleSubmitEvaluation}>
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-primeblack mb-3">
                Competency
              </h4>
              {homework.coreCompetencies &&
              homework.coreCompetencies.length > 0 ? (
                homework.coreCompetencies.map((competencyString) => {
                  const key = getRubricKey(competencyString);
                  const fullCompetency = CORE_COMPETENCIES.find(
                    (comp) => comp.id === key
                  );
                  const displayName = fullCompetency
                    ? fullCompetency.name
                    : competencyString;
                  const errorMessage = inputErrors[key];

                  return (
                    <div key={key} className="flex flex-col mb-3">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`rubricScores.${key}`}
                          className="w-1/2 text-primeblack font-medium"
                        >
                          {displayName}
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            id={`rubricScores.${key}`}
                            name={`rubricScores.${key}`}
                            value={
                              gradeData.rubricScores[key] === null
                                ? ""
                                : gradeData.rubricScores[key]
                            }
                            onChange={handleChange}
                            min="0"
                            max="100"
                            step="1"
                            className={`shadow bg-white appearance-none border rounded-md w-[100px] py-2 px-3 text-primeblack leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              errorMessage
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="0-100"
                          />
                          <span className="text-primeblack font-medium">%</span>
                        </div>
                      </div>
                      {errorMessage && (
                        <p className="text-red-500 text-xs mt-1 self-end pr-1 w-full text-right">
                          {errorMessage}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-600">
                  No competencies set for this homework.
                </p>
              )}
            </div>

            <div className="mb-6 border-y-2 py-2">
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="score"
                    className="w-1/2 text-primeblack font-semibold text-lg my-8"
                  >
                    Assignment Score
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      id="score"
                      name="score"
                      value={gradeData.score === null ? "" : gradeData.score}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="1"
                      className={`shadow bg-white appearance-none border rounded-md w-[100px] py-2 px-3 text-primeblack leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        inputErrors.score ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="0-100"
                    />
                    <span className="text-primeblack font-medium">%</span>
                  </div>
                </div>
                {inputErrors.score && (
                  <p className="text-red-500 text-xs mt-1 self-end pr-1 w-full text-right">
                    {inputErrors.score}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-lg font-semibold text-primeblack mb-0">
                  Overall Grade
                </label>
                <button
                  type="button"
                  onClick={() => setShowRubricModal(true)}
                  className="px-4 py-2 bg-white text-primeblack hover:text-orange2 border-none text-sm font-medium flex items-center space-x-2"
                >
                  <RubricIcon />
                  <span>Rubric</span>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-x-2">
                {["Emerging", "Developing", "Proficient", "Extending"].map(
                  (gradeOption) => {
                    const buttonLevel = gradeLevels[gradeOption];
                    const isSelectedOrBelow =
                      currentSelectedLevel >= buttonLevel;

                    let buttonBgClass = "bg-gray1 hover:bg-gray2 text-white";
                    if (isSelectedOrBelow) {
                      switch (gradeOption) {
                        case "Emerging":
                          buttonBgClass =
                            "bg-grade-emerging-bg hover:bg-grade-emerging-bg/80 text-primeblack";
                          break;
                        case "Developing":
                          buttonBgClass =
                            "bg-grade-developing-bg hover:bg-grade-developing-bg/80 text-primeblack";
                          break;
                        case "Proficient":
                          buttonBgClass =
                            "bg-grade-proficient-bg hover:bg-grade-proficient-bg/80 text-primeblack";
                          break;
                        case "Extending":
                          buttonBgClass =
                            "bg-grade-extending-bg hover:bg-grade-extending-bg/80 text-primeblack";
                          break;
                        default:
                          buttonBgClass = "bg-gray2 text-white";
                      }
                    }

                    return (
                      <div
                        key={gradeOption}
                        className="flex flex-col items-center"
                      >
                        <div
                          // type="button"
                          // onClick={() =>
                          //   handleLetterGradeButtonClick(gradeOption)
                          // }
                          className={`py-3 px-4 rounded-lg font-bold shadow-md transition duration-200 ease-in-out w-full
                            ${buttonBgClass} focus:outline-none border-none`}
                        ></div>
                        <p className="text-sm mt-1 text-center">
                          <span className="font-semibold text-primeblack">
                            {gradeOption}
                          </span>
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="feedback"
                className="block text-primeblack text-lg font-semibold mb-2"
              >
                Feedback
              </label>
              <div
                onClick={handleFeedbackEditorInteraction}
                onFocus={handleFeedbackEditorInteraction}
                tabIndex={0}
              >
                <RichTextEditor
                  value={gradeData.feedback}
                  onChange={handleFeedbackChange}
                  placeholder="Enter detailed feedback for the student..."
                  className="w-full"
                  enableDemoFeature={ENABLE_DEMO_FEATURE}
                  demoContent={DEMO_RICH_TEXT_CONTENT}
                  isEditMode={isEditMode}
                />
              </div>
            </div>

            <div className="flex justify-end items-center mt-6">
              <button
                type="submit"
                className={`px-10 py-2 text-right rounded-full font-semibold text-white transition duration-200 ease-in-out
          ${
            isSaving || hasAnyInputError
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange1 hover:bg-orange2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          }`}
                disabled={isSaving || hasAnyInputError}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
            {saveMessage && (
              <p
                className={`mt-3 text-center text-sm font-medium ${
                  saveMessage.includes("Failed")
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {saveMessage}
              </p>
            )}
            {error && (
              <p className="mt-3 text-center text-sm font-medium text-red-600">
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
      {showRubricModal && (
        <RubricModal
          rubricData={{
            emerging: homework.rubricEmerging,
            developing: homework.rubricDeveloping,
            proficient: homework.rubricProficient,
            extending: homework.rubricExtending,
          }}
          onClose={() => setShowRubricModal(false)}
        />
      )}
    </div>
  );
}

export default SubmissionDetailsAndEvaluation;
