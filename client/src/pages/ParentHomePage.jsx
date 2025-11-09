// client/src/pages/ParentHomePage.jsx

/**
 * Renders the main dashboard page for parents.
 * This page provides an overview of their child's academic information and school communications,
 * with navigation to announcements, timetables, and teacher contact sections.
 */

import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import ParentDashboardMainPage from "../components/parent/dashboard/ParentDashboardMainPage";
import ParentDashboardByChildren from "../components/parent/dashboard/ParentDashboardByChildren";
import ParentAnnouncement from "../components/parent/announcement/ParentAnnouncement";
import ParentCalender from "../components/parent/calender/ParentCalender";
import ParentTimetable from "../components/parent/timetable/ParentTimetable";
import ParentContactTeacher from "../components/parent/contact-teacher/ParentContactTeacher";
import ScoreBySubjectBarChart from "../components/parent/analytics/ScoreBySubjectBarChart";
import ParentProfile from "../components/profiles/parent/ParentProfile";

function ParentHomePage({ user, onLogout }) {
  const handleLogout = () => {
    onLogout();
  };

  const userName = user?.name || "Parent";

  // Defines the sidebar navigation items for the parent's dashboard.
  // Added 'hasSubSidebar' property to control sub-sidebar visibility on click.
  const sidebarItems = [
    {
      name: "Dashboard",
      path: `/parent/dashboard`,
      icon: "Dashboard",
      hasSubSidebar: true, // This item is expected to have a sub-sidebar (for child selection)
    },
    // { name: "Analytics", path: `/parent/analytics` }, // If uncommented, assess hasSubSidebar
    {
      name: "Announcement",
      path: `/parent/announcements`,
      icon: "Megaphone",
      hasSubSidebar: true, // This item is expected to have a sub-sidebar (for announcement list)
    },
    {
      name: "Calender",
      path: `/parent/calender`,
      icon: "Calender",
      hasSubSidebar: true, // This item should have a sub-sidebar for child selection
    },
    {
      name: "Timetable",
      path: `/parent/timetable`,
      icon: "Notebook",
      hasSubSidebar: true, // This item is not expected to have a sub-sidebar
    },
    {
      name: "Contact Teacher",
      path: `/parent/contact-teacher`,
      icon: "Chat",
      hasSubSidebar: true, // This item is not expected to have a sub-sidebar
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
    >
      {/* modified by Francisco 0717: Added bg-[#F3F3F3] */}
      <div className="flex flex-col flex-1 h-full bg-gray3">
        {/* Defines the routes for various parent functionalities within the dashboard. */}
        <Routes>
          <Route path="/" element={<ParentDashboardMainPage user={user} />} />
          <Route
            path="dashboard"
            element={<ParentDashboardMainPage user={user} />}
          />
          <Route
            path="dashboard/:childId"
            element={<ParentDashboardByChildren user={user} />}
          />
          {/* <Route path="analytics" element={<ScoreBySubjectBarChart />} /> */}
          <Route
            path="announcements/"
            element={<ParentAnnouncement user={user} />}
          >
            <Route
              path=":announcementId"
              element={<ParentAnnouncement user={user} />}
            />
          </Route>
          <Route
            path="calender/:childId?"
            element={<ParentCalender user={user} />}
          />
          <Route
            path="timetable/:childId?"
            element={<ParentTimetable user={user} />}
          />
          <Route
            path="contact-teacher/:childId?"
            element={<ParentContactTeacher user={user} />}
          />
          <Route path="profile" element={<ParentProfile user={user} />} />
        </Routes>
      </div>
    </DashboardLayout>
  );
}

export default ParentHomePage;
