/**
 * @purpose This component displays a student's homework submissions for a specific subject,
 * organized by submission status ("Ongoing" and "Submitted/Graded").
 * Clicking a homework item navigates to its detail page.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import submissionService from "../../../services/submissionService.js";
import {
  formatCalendarDate,
  formatTimeToAmPm,
} from "../../../utils/formatters";

function StudentSubjectHomework({ user }) {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [selectedStatus, setSelectedStatus] = useState("ongoing");
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [submissionsError, setSubmissionsError] = useState(null);

  const fetchStudentSubmissions = useCallback(async () => {
    setLoadingSubmissions(true);
    setSubmissionsError(null);
    try {
      if (!subjectId) {
        setLoadingSubmissions(false);
        setSubmissionsError("Subject ID is not available.");
        return;
      }

      const submissionsData = await submissionService.getUserSubmissions(
        subjectId
      );

      if (!Array.isArray(submissionsData)) {
        const errorMessage = `Error: Unexpected submission data format returned from server. Received data: ${JSON.stringify(
          submissionsData
        )}`;
        setSubmissionsError(errorMessage);
        setAllSubmissions([]);
        return;
      }

      setAllSubmissions(submissionsData);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        `Failed to load homework. Please check the console for details.`;
      setSubmissionsError(errorMessage);
      setAllSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [subjectId, user]);

  useEffect(() => {
    if (subjectId && user && user.userId) {
      fetchStudentSubmissions();
    } else {
      setLoadingSubmissions(false);
      setAllSubmissions([]);
    }
  }, [subjectId, user, fetchStudentSubmissions]);

  const filteredSubmissions = useMemo(() => {
    if (!allSubmissions) return [];

    const filtered = allSubmissions.filter((submission) => {
      if (selectedStatus === "ongoing") {
        return submission.submissionStatus === "assigned";
      } else if (selectedStatus === "submitted") {
        return (
          submission.submissionStatus === "submitted" ||
          submission.submissionStatus === "graded"
        );
      }
      return false;
    });

    return filtered.sort((a, b) => {
      const dateA = a.homework?.dueDate
        ? new Date(a.homework.dueDate)
        : new Date(0);
      const dateB = b.homework?.dueDate
        ? new Date(b.homework.dueDate)
        : new Date(0);

      return dateB.getTime() - dateA.getTime();
    });
  }, [allSubmissions, selectedStatus]);

  const headerText = useMemo(() => {
    return selectedStatus === "ongoing"
      ? "Ongoing Homework"
      : "Submitted Homework";
  }, [selectedStatus]);

  const SubmissionItem = ({ submission }) => {
    let cardBorderColor = "border-gray1";
    let statusTag = null;

    const homeworkTitle = submission.homework?.title || "N/A";
    // const homeworkWeek = submission.homework?.week || "N/A";

    const dateToDisplay = useMemo(() => {
      if (selectedStatus === "ongoing") {
        const dueDate = submission.homework?.dueDate;
        if (dueDate) {
          const dateObj = new Date(dueDate);
          const formattedDate = formatCalendarDate(dateObj);
          const timeString24hr = dateObj.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          });
          const formattedTime = formatTimeToAmPm(timeString24hr);
          return `${formattedDate} at ${formattedTime}`;
        }
        return "Due: N/A";
      } else if (selectedStatus === "submitted") {
        return submission.submittedAt
          ? `Submitted on: ${formatCalendarDate(
              submission.submittedAt
            )} at ${formatTimeToAmPm(
              new Date(submission.submittedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
              })
            )}`
          : "Submitted: N/A";
      }
      return "";
    }, [selectedStatus, submission.homework?.dueDate, submission.submittedAt]);

    if (submission.submissionStatus === "assigned") {
      cardBorderColor = "border-gray1";
    } else if (
      submission.submissionStatus === "submitted" ||
      submission.submissionStatus === "graded"
    ) {
      cardBorderColor = "border-gray1";

      if (
        selectedStatus === "submitted" &&
        submission.submissionStatus === "graded"
      ) {
        statusTag = (
          <span className="ml-2 px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
            Graded
          </span>
        );
      }
    }

    const handleItemClick = () => {
      if (!submission.homework?._id) {
        return;
      }

      if (
        submission.submissionStatus === "submitted" ||
        submission.submissionStatus === "graded"
      ) {
        navigate(
          `/student/subject/${subjectId}/homework/${submission.homework._id}/submission/${submission._id}/evaluation`
        );
      } else {
        navigate(
          `/student/subject/${subjectId}/homework/${submission.homework._id}/detail`
        );
      }
    };

    return (
      <div
        className={`p-4 rounded-md shadow-md border ${cardBorderColor} mb-3 flex justify-between items-center cursor-pointer hover:shadow-lg transition-shadow duration-200${
          selectedStatus === "ongoing" ? "bg-white" : "bg-gray1"
        }`}
        onClick={handleItemClick}
      >
        <div className="flex-1 flex flex-col items-start">
          <h4 className="text-base font-semibold text-black">
            {homeworkTitle}
          </h4>
          {selectedStatus === "ongoing" && (
            <div className="flex items-center text-sm text-black mt-1 w-full">
              <img
                src="/icons/Clock.svg"
                alt="Clock icon"
                className="h-6 w-6 text-yellow-400 mr-1"
              />
              <p className="text-sm text-black">{dateToDisplay}</p>
            </div>
          )}
          {selectedStatus === "submitted" && (
            <div className="flex flex-row items-center justify-between text-sm text-black mt-1 w-full">
              <p className="flex-grow-0">{dateToDisplay}</p>
              {submission.submissionStatus === "graded" && submission.grade && (
                <p className="flex-shrink-0 text-black">
                  {" "}
                  {/* Grade: の文字を黒に */}
                  Grade:{" "}
                  <span
                    className={`px-2 py-1 leading-tight rounded-full font-semibold
                      ${
                        submission.grade.letterGrade === "Emerging"
                          ? "bg-grade-emerging-bg text-gray-800"
                          : ""
                      }
                      ${
                        submission.grade.letterGrade === "Developing"
                          ? "bg-grade-developing-bg text-gray-800"
                          : ""
                      }
                      ${
                        submission.grade.letterGrade === "Proficient"
                          ? "bg-grade-proficient-bg text-gray-800"
                          : ""
                      }
                      ${
                        submission.grade.letterGrade === "Extending"
                          ? "bg-grade-extending-bg text-white"
                          : ""
                      }
                      ${
                        !submission.grade.letterGrade ||
                        (typeof submission.grade.score === "number" &&
                          ![
                            "Emerging",
                            "Developing",
                            "Proficient",
                            "Extending",
                          ].includes(submission.grade.letterGrade))
                          ? "bg-gray-200 text-gray-800"
                          : ""
                      }
                    `}
                  >
                    {submission.grade.letterGrade ||
                      (typeof submission.grade.score === "number"
                        ? `${submission.grade.score}%`
                        : "N/A")}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!user || !user.userId) {
    return (
      <div className="p-4 text-center text-blue-600">Loading user info...</div>
    );
  }

  return (
    <div className="flex p-10 box-border">
      <div className="w-[146px] bg-gray1 rounded-md p-2">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setSelectedStatus("ongoing")}
              className={`block w-full text-left text-xs font-semibold px-2 py-2 h-[63px] rounded-md ${
                selectedStatus === "ongoing"
                  ? "bg-[#BDDFFF] border-2 border-transparent focus:outline-none hover:border-none"
                  : "bg-[#F3F3F3] hover:bg-gray3"
              }`}
            >
              Ongoing
            </button>
          </li>
          <li>
            <button
              onClick={() => setSelectedStatus("submitted")}
              className={`block w-full text-left text-xs font-semibold px-2 py-2 h-[63px] rounded-md ${
                selectedStatus === "submitted"
                  ? "bg-[#BDDFFF] border-2 border-transparent focus:outline-none hover:border-none"
                  : "bg-[#F3F3F3] hover:bg-gray3"
              }`}
            >
              Submitted
            </button>
          </li>
        </ul>
      </div>

      <div className="flex-1 ml-4">
        {loadingSubmissions ? (
          <div className="mb-4 bg-blue-100 text-blue-800 rounded">
            Loading homework...
          </div>
        ) : submissionsError ? (
          <p className="text-red-500 text-sm">{submissionsError}</p>
        ) : filteredSubmissions.length > 0 ? (
          <div>
            {filteredSubmissions.map((submission) => (
              <SubmissionItem
                key={submission._id}
                submission={submission}
                selectedStatus={selectedStatus}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-lg text-center shadow-sm">
            <p className="text-lg font-medium text-yellow-800">
              {selectedStatus === "ongoing"
                ? "No ongoing homework at the moment."
                : "You have not submitted any homework yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentSubjectHomework;
