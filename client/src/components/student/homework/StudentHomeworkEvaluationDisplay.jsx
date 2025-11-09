// client/src/components/student/homework/StudentHomeworkEvaluationDisplay.jsx
/**
 * This component displays the detailed evaluation of a student's submitted homework.
 * It shows the homework title, submitted files, teacher's feedback,
 * competency scores, and overall letter grade.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import submissionService from "../../../services/submissionService";
import homeworkService from "../../../services/homeworkService";
import useAuth from "../../../hooks/useAuth";
import { CORE_COMPETENCIES } from "../../../utils/coreCompetencies";
import RichTextEditor from "../../common/RichTextEditor";
import { DownloadIcon } from "../../../assets/Icons.jsx";

// Helper function to convert competency strings to rubricScores keys (shared with Teacher side)
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

// Function to get grade color class based on letterGrade
const getGradeColorClass = (letterGrade) => {
  switch (letterGrade?.toUpperCase()) {
    case "EMERGING":
      return "bg-grade-emerging-bg";
    case "DEVELOPING":
      return "bg-grade-developing-bg";
    case "PROFICIENT":
      return "bg-grade-proficient-bg";
    case "EXTENDING":
      return "bg-grade-extending-bg";
    default:
      return "bg-gray-300";
  }
};

function StudentHomeworkEvaluationDisplay() {
  const { subjectId, homeworkId, submissionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submission, setSubmission] = useState(null);
  const [homework, setHomework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!submissionId || !homeworkId) {
        setError("Submission ID or Homework ID is missing.");
        setLoading(false);
        return;
      }

      const submissionData = await submissionService.getSubmissionById(
        submissionId
      );
      setSubmission(submissionData);

      const homeworkData = await homeworkService.getHomeworkById(homeworkId);
      setHomework(homeworkData);
      console.log(homeworkData);
    } catch (err) {
      console.error("Data fetching error:", err);
      setError("Failed to load evaluation data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [submissionId, homeworkId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownload = async (file) => {
    try {
      const { signedUrl, fileName: downloadedFileName } =
        await submissionService.getSignedSubmissionDownloadUrl(
          submissionId,
          file.s3Key
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-600 text-lg">Loading evaluation data...</p>
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

  const grade = submission.grade;
  const homeworkTitle = homework.title || "N/A";
  const gradeBgClass = getGradeColorClass(grade?.letterGrade);

  return (
    <div className="flex h-full p-10 box-border bg-white max-h-screen overflow-y-auto">
      <div>
        <h2 className="text-3xl text-gray-800 mb-4">{homeworkTitle}</h2>

        <div className="flex flex-col md:flex-row gap-8 min-h-[600px]">
          <div className="md:w-full bg-white">
            <h3 className="text-xl font-semibold my-8">Your Work</h3>

            {submission.submittedFiles &&
            submission.submittedFiles.length > 0 ? (
              <div className="mb-6">
                <ul className="list-none text-gray-800">
                  {submission.submittedFiles.map((file, index) => (
                    <li
                      key={file._id || file.s3Key || `submission-file-${index}`}
                      className="flex justify-between border text-sm rounded-md w-[350px] p-4 items-center"
                    >
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownload(file);
                        }}
                        className="font-normal text-primeblack flex items-center"
                        title={`Download ${file.fileName}`}
                      >
                        {file.fileName}
                        <DownloadIcon className="h-5 w-5 ml-2 text-blue2" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-gray-600">(No files submitted)</p>
              </div>
            )}

            <div className="my-12">
              <h4 className="text-lg font-semibold">Feedback</h4>
              <div className="bg-white rounded-md whitespace-pre-wrap break-words ">
                <RichTextEditor
                  value={grade?.feedback || "---"}
                  readOnly={true}
                  className="p-0 border-none text-md"
                />
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-lg font-semibold my-4">Competencies:</h4>
              {homework.coreCompetencies &&
              homework.coreCompetencies.length > 0 ? (
                <ul className="list-none text-primeblack">
                  {homework.coreCompetencies.map((competencyString) => {
                    const key = getRubricKey(competencyString);
                    const score = grade?.rubricScores?.[key];
                    const fullCompetency = CORE_COMPETENCIES.find(
                      (comp) => comp.id === key
                    );
                    const displayName = fullCompetency
                      ? fullCompetency.name
                      : competencyString;

                    return (
                      <li
                        key={key}
                        className="mb-1 flex justify-between items-center"
                      >
                        <span className="font-medium mr-2">{displayName}:</span>{" "}
                        <div className="text-right flex-shrink-0">
                          {typeof score === "number" ? `${score}%` : "---%"}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-600">
                  No competencies set for this homework.
                </p>
              )}
            </div>
            <div className="mb-8 bg-white flex justify-between items-center">
              <p className="text-lg font-semibold my-4">Overall Grade</p>
              <span
                className={`w-[93px] h-[39px] text-base rounded-full p-3 ${gradeBgClass} flex items-center justify-center`}
              >
                {grade?.letterGrade || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentHomeworkEvaluationDisplay;
