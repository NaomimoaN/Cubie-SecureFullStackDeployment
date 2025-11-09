// client/src/components/student/todo/StudentTodoListPage.jsx
/**
 * This component displays a student's To-Do list, categorized by
 * "Today" (due today) and "Upcoming" (due tomorrow or later) homeworks.
 * Each item shows Subject, Title, and Due Date.
 * Clicking an item navigates to the homework detail page.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import submissionService from "../../../services/submissionService";
import useAuth from "../../../hooks/useAuth";
import { ClockIcon } from "../../../assets/Icons";

// Subject-specific colors
const SUBJECT_COLORS = {
  Math: "#BDDFFF",
  Science: "#FE674D",
  "Language Arts": "#E8DA53",
  "Social Studies": "#FFA237",
  ADST: "#EEACD9",
};

function StudentTodoListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllStudentSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user || !user.userId) {
        setError("User information is not available.");
        setLoading(false);
        return;
      }
      const submissionsData = await submissionService.getAllUserSubmissions(
        user.userId
      );

      setAllSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
    } catch (err) {
      console.error("Error fetching To-Do list:", err);
      setError("Failed to load To-Do list.");
      setAllSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllStudentSubmissions();
  }, [fetchAllStudentSubmissions]);

  const { todayHomeworks, upcomingHomeworks } = useMemo(() => {
    if (!Array.isArray(allSubmissions) || allSubmissions.length === 0) {
      return { todayHomeworks: [], upcomingHomeworks: [] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const todayList = [];
    const upcomingList = [];

    allSubmissions.forEach((submission) => {
      const homework = submission.homework;

      if (!homework || submission.submissionStatus !== "assigned") {
        return;
      }

      if (!homework.dueDate || !homework.subject || !homework.subject.name) {
        console.warn(
          "Skipping submission due to missing homework/subject data (after initial filter):",
          submission
        );
        return;
      }

      const dueDate = new Date(homework.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate.getTime() === today.getTime()) {
        todayList.push(submission);
      } else if (dueDate.getTime() > today.getTime()) {
        upcomingList.push(submission);
      }
    });

    const sortHomeworks = (list) => {
      return list.sort((a, b) => {
        const subjectA = a.homework?.subject?.name || "";
        const subjectB = b.homework?.subject?.name || "";
        const titleA = a.homework?.title || "";
        const titleB = b.homework?.title || "";
        const dateA = a.homework?.dueDate
          ? new Date(a.homework.dueDate)
          : new Date(0);
        const dateB = b.homework?.dueDate
          ? new Date(b.homework.dueDate)
          : new Date(0);

        // 1. Sort by Subject Name
        if (subjectA < subjectB) return -1;
        if (subjectA > subjectB) return 1;

        // 2. If Subjects are the same, sort by Title
        if (titleA < titleB) return -1;
        if (titleA > titleB) return 1;

        // 3. If Subjects and Titles are the same, sort by Due Date (ascending)
        return dateA.getTime() - dateB.getTime();
      });
    };

    return {
      todayHomeworks: sortHomeworks(todayList),
      upcomingHomeworks: sortHomeworks(upcomingList),
    };
  }, [allSubmissions]);

  const handleHomeworkClick = (homeworkId, subjectId) => {
    navigate(`/student/subject/${subjectId}/homework/${homeworkId}/detail`);
  };

  const HomeworkItem = ({ homework, submission, type }) => {
    const homeworkTitle = homework?.title || "N/A";
    const subjectName = homework?.subject?.name || "N/A";

    const homeworkDueDate = homework?.dueDate
      ? new Date(homework.dueDate).toLocaleString("en-US", {
          weekday: "short",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A";

    const subjectBgColor = SUBJECT_COLORS[subjectName] || "#E2E8F0";

    return (
      <div
        className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={() =>
          handleHomeworkClick(homework?._id, homework?.subject?._id)
        }
      >
        <p
          className={`text-sm font-semibold inline-block px-2 py-1 rounded-full`}
          style={{ backgroundColor: subjectBgColor }}
        >
          {subjectName}
        </p>
        <h4 className="text-lg font-semibold text-gray-900 mt-2">
          {homeworkTitle}
        </h4>
        <p className="text-sm text-gray-800 flex items-center">
          <ClockIcon className="h-4 w-4 mr-1 text-gray-600" /> {homeworkDueDate}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-600 text-lg">Loading To-Do list...</p>
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

  return (
    <div className="ml-1 p-6 w-full h-full bg-white">
      <h1 className="text-[26px] font-medium text-primeblack mb-6">To-do</h1>

      {/* Today Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-primeblack mb-4">Today</h2>
        {todayHomeworks.length > 0 ? (
          <div>
            {todayHomeworks.map((submission) => (
              <HomeworkItem
                key={submission._id}
                homework={submission.homework}
                submission={submission}
                type="today"
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No homework due today.</p>
        )}
      </div>

      {/* Upcoming Section */}
      <div>
        <h2 className="text-[26px] font-medium text-primeblack mb-6">
          Upcoming
        </h2>
        {upcomingHomeworks.length > 0 ? (
          <div>
            {upcomingHomeworks.map((submission) => (
              <HomeworkItem
                key={submission._id}
                homework={submission.homework}
                submission={submission}
                type="upcoming"
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No upcoming homework.</p>
        )}
      </div>
    </div>
  );
}

export default StudentTodoListPage;
