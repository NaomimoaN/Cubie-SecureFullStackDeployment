// client/src/pages/TeacherHomePage.jsx

/**
 * Renders the main dashboard page for teachers.
 * This page provides navigation to various teacher-specific tools like homework management,
 * course content editing, announcements, calendar, and attendance.
 */

import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import TeacherDashboardMainPage from "../components/teacher/dashboard/TeacherDashboardMainPage";
import TeacherDashboardBySubject from "../components/teacher/dashboard/TeacherDashboardBySubject";
import TeacherCourseEditor from "../components/teacher/course-editor/TeacherCourseEditor";
import TeacherAnnouncement from "../components/teacher/announcement/TeacherAnnouncement";
import CreateAnnouncement from "../components/teacher/announcement/CreateAnnouncement";
import EditAnnouncement from "../components/teacher/announcement/EditAnnouncement";
import AnnouncementClicked from "../components/teacher/announcement/AnnouncementClicked";
import TeacherCalender from "../components/teacher/calender/TeacherCalender";
import TeacherAttendance from "../components/teacher/attendance/TeacherAttendance";
import ChatPage from "./ChatPage";
import TeacherProfile from "../components/profiles/teacher/TeacherProfile";

function TeacherHomePage({ user, onLogout }) {
  const handleLogout = () => {
    onLogout();
  };

  const userName = user?.name || "Teacher";
  const defaultSubjectId = user?.assignedSubjects?.[0]?._id || "default";

  // Defines the sidebar navigation items for the teacher's dashboard.
  // 0719:Add property "hasSubSidebar"
  const sidebarItems = [
    {
      name: "Dashboard",
      path: `/teacher/dashboard`,
      icon: "Dashboard",
      hasSubSidebar: true,
    },
    {
      name: "CourseEditor",
      path: `/teacher/course-editor/${defaultSubjectId}`,
      icon: "Notebook",
      hasSubSidebar: true,
    },
    {
      name: "Announcement",
      path: `/teacher/announcements`,
      icon: "Megaphone",
      hasSubSidebar: true,
    },
    {
      name: "Calender",
      path: `/teacher/calender`,
      icon: "Calender",
      hasSubSidebar: false,
    },
    {
      name: "Attendance",
      path: `/teacher/attendance`,
      icon: "Attendance",
      hasSubSidebar: false,
    },
    {
      name: "Group Chat",
      path: `/teacher/group-chat`,
      icon: "Chat",
      hasSubSidebar: false,
    },
  ];

  return (
    <DashboardLayout
      user={user}
      userName={userName}
      onLogout={handleLogout}
      sidebarItems={sidebarItems}
      sidebarWidthClass="w-[75px]"
      sidebarBgColorClass="bg-gray1"
      sidebarShadowClass="shadow-md"
      sidebarTextSizeClass="text-xss"
      sidebarTextColorClass="text-black"
      sidebarTextAlignClass="text-center"
    >
      {/* Added by Francisco 0717 bg-[#F3F3F3]*/}
      <div className="flex flex-col flex-1 h-full bg-gray3">
        {/* Defines the routes for various teacher functionalities within the dashboard. */}
        <Routes>
          <Route path="/" element={<TeacherDashboardMainPage user={user} />} />
          <Route
            path="dashboard"
            element={<TeacherDashboardMainPage user={user} />}
          />
          <Route
            path="dashboard/:subjectId"
            element={<TeacherDashboardBySubject user={user} />}
          />
          <Route
            path="course-editor/:subjectId/*"
            element={<TeacherCourseEditor user={user} />}
          />
          <Route
            path="announcements"
            element={<TeacherAnnouncement user={user} />}
          >
            <Route
              path=":announcementID"
              element={<AnnouncementClicked user={user} />}
            />
            <Route
              path="create-announcement"
              element={<CreateAnnouncement user={user} />}
            />
            <Route path="inbox" element={<CreateAnnouncement user={user} />} />
            <Route path="edit/:announcementId" element={<EditAnnouncement user={user} />} />
          </Route>

          <Route path="calender" element={<TeacherCalender user={user} />} />
          <Route
            path="attendance"
            element={<TeacherAttendance user={user} />}
          />
          <Route path="group-chat" element={<ChatPage />} />
          <Route path="profile" element={<TeacherProfile user={user} />} />
        </Routes>
      </div>
    </DashboardLayout>
  );
}

export default TeacherHomePage;
