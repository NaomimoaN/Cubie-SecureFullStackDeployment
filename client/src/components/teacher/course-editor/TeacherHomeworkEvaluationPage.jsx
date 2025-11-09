import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import homeworkService from "../../../services/homeworkService";
import submissionService from "../../../services/submissionService";
import SubmissionDetailsAndEvaluation from "./SubmissionDetailsAndEvaluation";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { DownloadIcon } from "../../../assets/Icons";

function TeacherHomeworkEvaluationPage({ user }) {
  const { homeworkId, submissionId: urlSubmissionId } = useParams();
  const navigate = useNavigate();
  const [homework, setHomework] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSubmissionId, setSelectedSubmissionId] = useState(
    urlSubmissionId || null
  );

  const { setHideSubSidebar, setHideCourseEditorTabs } = useSubSidebar();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    setSelectedSubmissionId(urlSubmissionId || null);
  }, [urlSubmissionId]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    if (selectedSubmissionId) {
      setHideSubSidebar(true);
      setHideCourseEditorTabs(true);
    } else {
      if (windowWidth <= 1023) {
        setHideSubSidebar(true);
        setHideCourseEditorTabs(true);
      } else {
        setHideSubSidebar(false);
        setHideCourseEditorTabs(false);
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      setHideSubSidebar(false);
      setHideCourseEditorTabs(false);
    };
  }, [
    selectedSubmissionId,
    setHideSubSidebar,
    setHideCourseEditorTabs,
    windowWidth,
  ]);

  const fetchHomeworkAndSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const homeworkData = await homeworkService.getHomeworkById(homeworkId);
      setHomework(homeworkData);

      const submissionsData =
        await submissionService.getSubmissionsByHomeworkId(homeworkId);

      const sortedSubmissions = [...submissionsData].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
        const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setSubmissions(sortedSubmissions);
    } catch (err) {
      console.error("Error fetching homework or submissions:", err);
      setError("Failed to load homework or submissions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [homeworkId]);

  useEffect(() => {
    if (homeworkId) {
      fetchHomeworkAndSubmissions();
    }
  }, [homeworkId, fetchHomeworkAndSubmissions]);

  const handleDownloadHomeworkAttachedFile = async (s3Key, fileName) => {
    try {
      await homeworkService.downloadHomeworkFile(homeworkId, s3Key);
    } catch (err) {
      console.error("Error downloading homework attached file:", err);
    }
  };

  const handleSelectSubmission = useCallback(
    (submissionId) => {
      if (homework?.subject?._id && homeworkId && submissionId) {
        navigate(
          `/teacher/course-editor/${homework.subject._id}/homework/${homeworkId}/evaluate/${submissionId}`
        );
      } else {
        console.error(
          "Cannot navigate: missing subject ID, homework ID, or submission ID."
        );
      }
    },
    [navigate, homework, homeworkId]
  );

  const handleBackToSubmissions = useCallback(() => {
    setSelectedSubmissionId(null);
    if (homework?.subject?._id && homeworkId) {
      navigate(
        `/teacher/course-editor/${homework.subject._id}/homework/${homeworkId}/evaluate`
      );
    } else {
      console.warn(
        "Homework subject ID or homeworkId not available for back navigation. Navigating back one step."
      );
      navigate(-1);
    }
    fetchHomeworkAndSubmissions();
  }, [fetchHomeworkAndSubmissions, navigate, homework, homeworkId]);

  const handleNavigateSubmission = useCallback(
    (newSubmissionId) => {
      if (newSubmissionId && homework?.subject?._id && homeworkId) {
        navigate(
          "/teacher/course-editor/" +
            homework.subject._id +
            "/homework/" +
            homeworkId +
            "/evaluate/" +
            newSubmissionId
        );
      } else {
        console.error(
          "Cannot navigate to next/previous submission: missing newSubmissionId, homework subject ID, or homeworkId."
        );
      }
    },
    [navigate, homework, homeworkId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-600 text-lg">Loading data...</p>
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

  if (!homework) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-600 text-lg">Homework not found.</p>
      </div>
    );
  }

  if (selectedSubmissionId) {
    return (
      <SubmissionDetailsAndEvaluation
        homework={homework}
        submissionId={selectedSubmissionId}
        submissions={submissions}
        onBack={handleBackToSubmissions}
        onNavigateSubmission={handleNavigateSubmission}
        user={user}
      />
    );
  }

  return (
    <div className="flex-grow bg-white min-h-screen">
      <div className="max-w-4xl mx-auto p-6 bg-[#EDF6FE] rounded-lg mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {homework?.title || "(No Title)"}
        </h2>

        <div className="mb-4">
          <div className="flex items-center text-lg text-gray-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              viewBox="0 0 24 25"
              className="w-6 h-6 mr-2"
            >
              <g>
                <g id="Layer_1">
                  <g id="Layer_1-2" data-name="Layer_1">
                    <path
                      fill="#787878"
                      d="M12.1,2.5C6.5,2.5,2,7,2,12.5s4.5,10,10.1,10,10-4.5,10-10S17.5,2.5,12.1,2.5ZM17.4,17l-.8.8c-.2.2-.4.2-.6,0l-4.7-4.7h0v-5.6c0-.3.2-.5.5-.5h1c.3,0,.5.2.5.5v4.7l4.3,4.3c.2.2.2.4,0,.6h-.2Z"
                    />
                  </g>
                </g>
              </g>
            </svg>
            {homework.dueDate
              ? new Date(homework.dueDate).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "(Not set)"}
          </div>
        </div>

        <div className="rounded-md whitespace-pre-wrap break-words">
          {homework.description ? (
            <div
              className="text-gray-800 prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(homework.description),
              }}
            />
          ) : (
            <p className="text-gray-500">(No description)</p>
          )}
        </div>

        <div className="mb-4">
          {homework.files && homework.files.length > 0 ? (
            <ul className="list-disc list-inside text-gray-800">
              {homework.files.map((file) => (
                <li
                  key={file.s3Key}
                  className="flex items-center justify-start space-x-2 py-1 px-4 mt-6 border-2 rounded-md w-[300px] bg-white"
                >
                  <span>{file.fileName}</span>
                  <button
                    onClick={() =>
                      handleDownloadHomeworkAttachedFile(
                        file.s3Key,
                        file.fileName
                      )
                    }
                    className="flex items-center px-2 py-1 bg-transparent text-blue2 hover:text-orange2 text-sm border-none focus:outline-none focus:ring-0"
                  >
                    <DownloadIcon />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-lg text-gray-800">(No files attached)</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg mt-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Submissions</h3>
        {submissions.length === 0 ? (
          <p className="text-gray-600">No submissions yet for this homework.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-4 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-900 uppercase tracking-wider rounded-tl-lg">
                    Name
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-900 uppercase tracking-wider hide-on-specific-breakpoint">
                    Work
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Submission Date
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-900 uppercase tracking-wider rounded-tr-lg">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm font-light text-[#393939]">
                {submissions.map((submission) => (
                  <tr
                    key={submission._id}
                    className="border-b h-[43px] border-gray-200 hover:bg-[#EDF6FE] cursor-pointer"
                    onClick={() => {
                      console.log("Clicked submission:", submission);
                      console.log(
                        "Submission ID passed to handleSelectSubmission:",
                        submission._id
                      );
                      handleSelectSubmission(String(submission._id));
                    }}
                  >
                    <td className=" py-4 whitespace-nowrap">
                      <span className="flex items-center hover:text-indigo-800">
                        <svg
                          width="24"
                          height="25"
                          viewBox="0 0 24 25"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 mr-2"
                        >
                          <g clipPath="url(#clip0_1_170)">
                            <path
                              d="M12 2.95996C6.48 2.95996 2 7.43996 2 12.96C2 18.48 6.48 22.96 12 22.96C17.52 22.96 22 18.48 22 12.96C22 7.43996 17.52 2.95996 12 2.95996ZM12 7.00996C13.8 7.00996 15.26 8.46996 15.26 10.27C15.26 12.07 13.8 13.53 12 13.53C10.2 13.53 8.74 12.07 8.74 10.27C8.74 8.46996 10.2 7.00996 12 7.00996ZM12.7 20.96H11.3C9.35 20.79 7.6 19.92 6.3 18.6C6.83 16.42 8.24 13.53 11.94 13.53C15.64 13.53 17.09 16.47 17.66 18.65C16.37 19.95 14.63 20.8 12.7 20.97V20.96Z"
                              fill="#393939"
                            />
                          </g>
                        </svg>
                        {submission.student
                          ? `${submission.student.profile.firstName || ""} ${
                              submission.student.profile.lastName || ""
                            }`
                          : "-"}
                      </span>
                    </td>
                    <td className=" py-4 whitespace-nowrap">
                      <span>
                        {submission.submissionStatus === "submitted"
                          ? "To Grade"
                          : submission.submissionStatus === "assigned"
                          ? "Not turned in"
                          : "Graded"}
                      </span>
                    </td>
                    <td className=" py-4 whitespace-nowrap hide-on-specific-breakpoint">
                      {submission.submittedFiles &&
                      submission.submittedFiles.length > 0
                        ? submission.submittedFiles.map((file) => (
                            <div key={file.s3Key}>{file.fileName}</div>
                          ))
                        : "-"}
                    </td>
                    <td className="py-3  whitespace-nowrap">
                      {submission.submittedAt
                        ? new Date(submission.submittedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                    <td className="py-3  whitespace-nowrap">
                      {submission.grade?.letterGrade ? (
                        <span
                          className={`px-2 py-1 leading-tight rounded-full
                            ${
                              submission.grade.letterGrade === "Emerging"
                                ? "bg-grade-emerging-bg"
                                : ""
                            }
                            ${
                              submission.grade.letterGrade === "Developing"
                                ? "bg-grade-developing-bg"
                                : ""
                            }
                            ${
                              submission.grade.letterGrade === "Proficient"
                                ? "bg-grade-proficient-bg"
                                : ""
                            }
                            ${
                              submission.grade.letterGrade === "Extending"
                                ? "bg-grade-extending-bg"
                                : ""
                            }
                          `}
                        >
                          {submission.grade.letterGrade}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherHomeworkEvaluationPage;
