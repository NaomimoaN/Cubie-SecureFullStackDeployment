// client/src/pages/StudentHomePage.jsx

/**
 * Renders the main dashboard page for students.
 * This page provides access to academic resources, including subjects, homeworks,
 * timetables, badges, and announcements, through nested routes.
 */

import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import StudentSubjectCardList from "../components/student/subject/StudentSubjectCardList";
import StudentSubjectDetail from "../components/student/subject/StudentSubjectDetail";
import StudentTodoListPage from "../components/student/todo/StudentTodoListPage";
import StudentTimateble from "../components/student/timetable/StudentTimetable";
import StudentBadgeListPage from "../components/student/badge/StudentBadgeListPage";
import StudentBadgeDetailPage from "../components/student/badge/StudentBadgeDetail";
import StudentAnnouncement from "../components/student/announcement/StudentAnnouncement";

// Inside "Subjects"
import StudentSubjectContent from "../components/student/subject/StudentSubjectContent";
import StudentSubjectHomework from "../components/student/homework/StudentSubjectHomework";
import StudentHomeworkDetailPage from "../components/student/homework/StudentHomeworkDetailPage";
import StudentSubjectQuizzes from "../components/student/quiz/StudentSubjectQuizzes";
import StudentHomeworkEvaluationDisplay from "../components/student/homework/StudentHomeworkEvaluationDisplay";
import StudentQuiz from "../components/student/quiz/StudentQuiz";
import StudentQuizResult from "../components/student/quiz/StudentQuizResult";
import ChatPage from "./ChatPage";
import StudentProfile from "../components/profiles/student/StudentProfile";
import StudentClickedAnnouncement from "../components/student/announcement/studentClickedAnnouncement";

function StudentHomePage({ user, onLogout }) {
  const handleLogout = () => {
    onLogout();
  };

  const userName = user?.name || "Student";

  // Defines the sidebar navigation items for the student's dashboard.
  const sidebarItems = [
    { name: "Subjects", path: "/student", icon: "Book" },
    { name: "To do", path: "/student/to-do", icon: "Pencil" },
    { name: "Timetable", path: "/student/timetable", icon: "Timetable" },
    // { name: "Badges", path: "/student/badges", icon: "Badges" },
    {
      name: "Announcements",
      path: "/student/announcements",
      icon: "Megaphone",
    },
    { name: "Group Chat", path: "/student/chat", icon: "Chat" },
  ];

  return (
    <DashboardLayout
      user={user}
      userName={userName}
      onLogout={handleLogout}
      sidebarItems={sidebarItems}
      sidebarWidthClass="w-[224px]"
      sidebarBgColorClass="bg-white"
      sidebarShadowClass="shadow-md"
      sidebarTextSizeClass="text-sm"
      sidebarTextColorClass="text-black"
      showStudentBadges={user?.role === "student"}
    >
      {/* Add bg-white @0716 */}
      <div className="flex flex-col flex-1 h-full bg-gray3">
        {/* Defines the routes for various student functionalities within the dashboard. */}
        <Routes>
          <Route path="/" element={<StudentSubjectCardList />} />

          <Route
            path="subject/:subjectId"
            element={<StudentSubjectDetail user={user} />}
          >
            <Route
              index
              element={<StudentSubjectContent key="subject-content-index" />}
            />
            <Route
              path="content"
              element={<StudentSubjectContent key="subject-content-path" />}
            />
            <Route
              path="homework"
              element={<StudentSubjectHomework user={user} />}
            />
            {/* Move to without NAV */}
            {/* <Route
              path="homework/:homeworkId/detail"
              element={<StudentHomeworkDetailPage user={user} />}
            /> */}
            <Route
              path="homework/:homeworkId/submission/:submissionId/evaluation"
              element={<StudentHomeworkEvaluationDisplay user={user} />}
            />
            <Route
              path="quizzes"
              element={<StudentSubjectQuizzes user={user} />}
            >
              <Route path=":week" element={<StudentQuiz user={user} />}>
                <Route
                  path="result"
                  element={<StudentQuizResult user={user} />}
                />
              </Route>
            </Route>
          </Route>
          {/* Without NAV */}
          <Route
            path="subject/:subjectId/homework/:homeworkId/detail"
            element={<StudentHomeworkDetailPage user={user} />}
          />
          <Route path="to-do" element={<StudentTodoListPage user={user} />} />
          <Route path="timetable" element={<StudentTimateble user={user} />} />
          <Route path="badges" element={<StudentBadgeListPage user={user} />} />
          <Route
            path="badges/:badgeId"
            element={<StudentBadgeDetailPage user={user} />}
          />
          <Route
            path="announcements"
            element={<StudentAnnouncement user={user} />}
          />
          <Route
            path="/announcements/:announcementID"
            element={<StudentClickedAnnouncement />}
          />
          <Route path="chat" element={<ChatPage />} />
          <Route path="profile" element={<StudentProfile user={user} />} />
        </Routes>
      </div>
    </DashboardLayout>
  );
}

export default StudentHomePage;
