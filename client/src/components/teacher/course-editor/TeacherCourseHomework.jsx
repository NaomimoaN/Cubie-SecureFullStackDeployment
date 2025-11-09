// client/src/components/teacher/course-homework/TeacherCourseHomework.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import homeworkService from "../../../services/homeworkService";
import useAuth from "../../../hooks/useAuth";
import { PencilIcon, BinIcon } from "../../../assets/Icons";
import DeleteAlert from "../../common/DeleteAlert.jsx";

function TeacherCourseHomework() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [homeworkIdToDelete, setHomeworkIdToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const clearMessage = useCallback(() => {
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 3000);
  }, []);

  const fetchHomeworks = useCallback(async () => {
    if (authLoading || !user) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!subjectId) {
        setError("Subject ID is missing.");
        return;
      }
      const fetchedData = await homeworkService.getHomeworks({
        subjectId: subjectId,
      });

      // Sort in descending order by DueDate (newest dates first)
      const sortedHomeworks = (fetchedData.homeworks || []).sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate) : null;
        const dateB = b.dueDate ? new Date(b.dueDate) : null;

        // Null or invalid dueDates go to the end of the list
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        // Descending sort
        return dateB.getTime() - dateA.getTime();
      });

      setHomeworks(sortedHomeworks);
    } catch (err) {
      console.error("Failed to fetch homeworks:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load homeworks. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [subjectId, authLoading, user]);

  useEffect(() => {
    fetchHomeworks();
  }, [fetchHomeworks]);

  const getHomeworkStatus = useCallback((homework) => {
    if (homework.status === "draft") {
      return "Draft";
    }
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    if (now > dueDate) {
      return "Past Due";
    }
    return "Ongoing";
  }, []);

  const getSubmittedCount = useCallback((submissions) => {
    if (!submissions || submissions.length === 0) {
      return 0;
    }
    return submissions.filter(
      (submission) =>
        submission.submissionStatus === "submitted" ||
        submission.submissionStatus === "graded"
    ).length;
  }, []);

  const handleEditHomework = useCallback(
    (homeworkId) => {
      navigate(
        `/teacher/course-editor/${subjectId}/homework/${homeworkId}/edit`
      );
    },
    [navigate, subjectId]
  );

  const handleDeleteHomeworkClick = useCallback((homeworkId) => {
    setHomeworkIdToDelete(homeworkId);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setHomeworkIdToDelete(null);
    setDeleteError(null);
  }, []);

  const handleConfirmDeleteHomework = useCallback(async () => {
    setDeleteError(null);
    if (!homeworkIdToDelete) {
      console.error("Missing homework ID for deletion.");
      setDeleteError("Deletion failed: Missing homework information.");
      return;
    }

    setIsDeleteModalOpen(false);

    setLoading(true);
    try {
      await homeworkService.deleteHomework(homeworkIdToDelete);
      setMessage("Homework deleted successfully.");
      setMessageType("success");
      fetchHomeworks();
    } catch (err) {
      console.error("Failed to delete homework:", err);
      const msg =
        err.response?.data?.message ||
        "Failed to delete homework. Please try again.";
      setError(msg);
      setDeleteError(msg);
      setMessageType("error");
    } finally {
      setLoading(false);
      setHomeworkIdToDelete(null);
      clearMessage();
    }
  }, [homeworkIdToDelete, fetchHomeworks, clearMessage]);

  const handleViewSubmissions = useCallback(
    (homeworkId) => {
      navigate(
        `/teacher/course-editor/${subjectId}/homework/${homeworkId}/evaluate`
      );
    },
    [navigate, subjectId]
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-600 text-lg">Authenticating...</p>
      </div>
    );
  }

  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-red-500 text-lg">
          Forbidden: You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Homework Management
        </h1>
        <button
          onClick={() =>
            navigate(`/teacher/course-editor/${subjectId}/homework/create`)
          }
          className="px-6 py-2 bg-orange1 text-white rounded-full hover:bg-orange2 border-none"
        >
          Create Homework
        </button>
      </div>

      {/* Status Message */}
      {loading && (
        <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded">
          Loading homeworks...
        </div>
      )}
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">{error}</div>
      )}
      {message && (
        <div
          className={`mb-4 p-2 rounded ${
            messageType === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Homework list */}
      {!loading && (
        <div className="bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-1 sm:px-1 md:px-1 lg:px-2 py-3 text-left text-xs font-medium text-primeblack uppercase tracking-wider"
                >
                  Homework Name
                </th>
                <th
                  scope="col"
                  className="px-1 sm:px-1 md:px-1 lg:px-2 py-3 text-center text-xs font-medium text-primeblack uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-1 sm:px-1 md:px-1 lg:px-2 py-3 text-center text-xs font-medium text-primeblack uppercase tracking-wider md:hidden md-custom:table-cell lg:hidden xl-custom:table-cell"
                >
                  Due Date & Time
                </th>
                <th
                  scope="col"
                  className="px-1 sm:px-1 md:px-1 lg:px-2 py-3 text-center text-xs font-medium text-primeblack uppercase tracking-wider"
                >
                  No. of Submissions
                </th>
                <th
                  scope="col"
                  className="px-1 sm:px-1 md:px-1 lg:px-2 py-3 text-center text-xs font-medium text-primeblack uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {homeworks.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-2 py-4 whitespace-nowrap text-sm text-primeblack text-center"
                  >
                    No homeworks found for this subject.
                  </td>
                </tr>
              ) : (
                homeworks.map((homework) => (
                  <tr
                    key={homework._id}
                    className="bg-white hover:bg-[#EDF6FE]"
                  >
                    <td className="px-2 py-4 text-sm font-medium text-primeblack max-w-xs overflow-hidden text-ellipsis">
                      <span
                        onClick={() => handleViewSubmissions(homework._id)}
                        className="text-primeblack p-0 text-left block w-full focus:ring-0 focus:outline-none overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:text-[#F06C00]"
                        title="View Submissions"
                      >
                        {homework.title}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-center whitespace-nowrap text-sm text-primeblack">
                      <span
                        className={`inline-flex text-xss w-[80px] h-[27px] justify-center items-center font-semibold rounded-full ${
                          getHomeworkStatus(homework) === "Ongoing"
                            ? "bg-[#D8F0E7] text-[#07965F]"
                            : getHomeworkStatus(homework) === "Draft"
                            ? "bg-[#FCF5B7] text-[#A29302]"
                            : "bg-[#F6D8ED] text-[#C94AA0]"
                        }`}
                      >
                        {getHomeworkStatus(homework)}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-center whitespace-nowrap text-sm text-primeblack md:hidden md-custom:table-cell lg:hidden xl-custom:table-cell">
                      {homework.dueDate
                        ? format(
                            new Date(homework.dueDate),
                            "MMMM dd, yyyy 'at' h a"
                          )
                        : "N/A"}
                    </td>
                    <td className="px-2 py-4 text-center whitespace-nowrap text-sm text-primeblack">
                      {getSubmittedCount(homework.submissions)} /{" "}
                      {homework.submissions ? homework.submissions.length : 0}
                    </td>
                    <td className="px-1 py-4 text-center whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditHomework(homework._id)}
                          className="text-gray-700 px-2 hover:text-[#F06C00] bg-transparent border-none"
                          title="Edit Homework"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          // ★ 変更: クリックハンドラをモーダル表示用に変更
                          onClick={() =>
                            handleDeleteHomeworkClick(homework._id)
                          }
                          className="text-gray-700 px-2 hover:text-[#F06C00] bg-transparent border-none"
                          title="Delete Homework"
                        >
                          <BinIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <DeleteAlert
        isOpen={isDeleteModalOpen}
        message="Are you sure you want to delete this file?"
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteHomework}
        error={deleteError}
      />
    </div>
  );
}

export default TeacherCourseHomework;
