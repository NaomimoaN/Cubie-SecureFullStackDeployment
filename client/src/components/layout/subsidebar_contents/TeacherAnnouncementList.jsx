// client/src/components/layout/subsidebar_contents/TeacherAnnouncementList.jsx

/**
 * A sub-sidebar content component that renders the teacher announcement list section.
 * Currently displays a title for the announcement section.
 */

import React from "react";
import { Link } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext"; // Import useSubSidebar

function TeacherAnnouncementList() {
  // Access setHideSubSidebar AND isMobileView from SubSidebarContext
  const { setHideSubSidebar, isMobileView } = useSubSidebar();

  // Handler to hide the sub-sidebar when a link is clicked
  const handleLinkClick = () => {
    // Only hide the sub-sidebar if it's a mobile view
    if (isMobileView) {
      setHideSubSidebar(true);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-[2rem] font-semibold text-gray-800 mb-10">
        Announcement
      </h3>
      <ul>
        {/* flex content-center does not work, but grid content-center */}
        <li className="text-lg font-semibold text-gray-800 mb-4 hover:bg-[#BDDFFF] min-h-[50px] grid content-center rounded-[5px] pl-[1rem]">
          <Link
            to="/teacher/announcements/create-announcement" // Corrected path for clarity, assuming it leads to creation.
            className="text-[#393939]"
            onClick={handleLinkClick} // Add onClick handler
          >
            Create Announcement
          </Link>
        </li>

        <li className="text-lg font-semibold text-gray-800 mb-4 hover:bg-[#BDDFFF] min-h-[50px] grid content-center rounded-[5px] pl-[1rem]">
          <Link
            to="/teacher/announcements/inbox"
            className="text-[#393939]"
            onClick={handleLinkClick} // Add onClick handler
          >
            Inbox
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default TeacherAnnouncementList;
