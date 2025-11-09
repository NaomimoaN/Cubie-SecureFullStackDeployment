// client/src/AppContent.jsx

/**
 * @purpose Manages core application routing and authentication. It handles user authentication status,
 * displays a loader during loading, and dynamically renders the appropriate dashboard
 * based on the authenticated user's role (admin, teacher, student, parent).
 */

import React from "react";
import { Routes, Route, Navigate, useMatch } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import Loader from "./components/common/Loader";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminHomePage from "./pages/AdminHomePage";
import TeacherHomePage from "./pages/TeacherHomePage";
import StudentHomePage from "./pages/StudentHomePage";
import ParentHomePage from "./pages/ParentHomePage";
import SocialStudies from "./pages/SocialStudies";
import AttendanceChecklist from "./components/attendance/attendanceCheckList";
import SubjectAnalyticsPage from "./pages/Math";
import CoreComAvaragePage from "./pages/CoreComAvaragePage";
import TeacherAttendanceCheck from "./pages/TeacherAttendanceCheck";
import TeacherOverviewPage from "./pages/TeacherOverviewPage";
import CoreComMathPage from "./pages/CoreComMathPage";
import AverageScoreBySubjectPage from "./pages/AverageScoreBySubjectPage";

function AppContent() {
  const { user, loading, logout } = useAuth();

  // While Loading.
  if (loading) {
    return <Loader />;
  }

  // Integrate DashboardRouter logic into AppContent
  const renderDashboardComponent = (role) => {
    switch (role) {
      case "admin":
        return <AdminHomePage user={user} onLogout={logout} />;
      case "teacher":
        return <TeacherHomePage user={user} onLogout={logout} />;
      case "student":
        return <StudentHomePage user={user} onLogout={logout} />;
      case "parent":
        return <ParentHomePage user={user} onLogout={logout} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Access Denied or Unknown Role.
            </h2>
            <p className="text-gray-600 mb-6">
              You do not have permission to view this page or your role is not
              recognized.
            </p>
            <button
              onClick={() => {
                logout();
              }}
              className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Logout
            </button>
          </div>
        );
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        {/* Redirect to user's role-specific dashboard if logged in */}
        <Route path="/" element={<Navigate to={`/${user?.role}`} replace />} />

        {/* 開発用: 直接アクセス可能なページ */}
        <Route path="/social-studies" element={<SocialStudies />} />
        <Route path="/attendance" element={<AttendanceChecklist />} />
        <Route
          path="/teacher-attendance-check"
          element={<AttendanceChecklist />}
        />

        {/* 新しく追加されたページ */}
        <Route
          path="/subject-analytics/:subjectName"
          element={<SubjectAnalyticsPage />}
        />
        <Route path="/math" element={<SubjectAnalyticsPage />} />
        <Route path="/language-arts" element={<SubjectAnalyticsPage />} />
        <Route path="/science" element={<SubjectAnalyticsPage />} />
        <Route path="/social-studies" element={<SubjectAnalyticsPage />} />
        <Route path="/adst" element={<SubjectAnalyticsPage />} />
        <Route path="/core-com-radar-chart" element={<CoreComAvaragePage />} />
        <Route path="/teacher-overview" element={<TeacherOverviewPage />} />
        <Route path="/core-com-math" element={<CoreComMathPage />} />
        <Route
          path="/average-score-by-subject"
          element={<AverageScoreBySubjectPage />}
        />

        {/* Dynamically render dashboard component based on role in URL */}
        <Route
          path="/:role/*"
          element={
            <AppContentDashboardRenderer
              user={user}
              logout={logout}
              renderDashboardComponent={renderDashboardComponent}
            />
          }
        />
        {/* Catch-all for authenticated but unrecognized paths, redirect to user's dashboard */}
        <Route path="*" element={<Navigate to={`/${user?.role}`} replace />} />
      </Route>
      {/* Catch-all for unauthenticated users, redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// To dynamically render the correct dashboard component based on the user's role extracted from the URL path.
function AppContentDashboardRenderer({ renderDashboardComponent }) {
  const match = useMatch("/:role/*");
  const currentRole = match?.params?.role;
  return renderDashboardComponent(currentRole);
}

export default AppContent;
