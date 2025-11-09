// client/src/components/subsidebar_content/TeacherSubjectListContent.jsx

/**
 * A sub-sidebar content component that displays a list of subjects assigned to a teacher.
 * It enables teachers to navigate to specific subject details or an overview.
 */
import React from "react";
import { NavLink } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";

/**
 * @param {Object} props - The component props.
 * @param {Array<Object>} props.subjects - An array of subject objects, each with at least an `_id` and `name`.
 * @param {string} props.basePath - The base URL path for subject navigation links (e.g., "/teacher/dashboard").
 * @param {string} [props.title] - The main title for this section (e.g., "Course Editor").
 * @param {string} [props.subtitle] - An optional subtitle that can act as a link to an overview page.
 * @param {boolean} [props.hideWeeklyOverview=false] - Whether to hide the weekly overview subtitle.
 * @returns {JSX.Element} The rendered list of teacher's subjects in the sub-sidebar.
 */
function TeacherSubjectListContent({
  subjects,
  basePath,
  title,
  subtitle,
  hideWeeklyOverview = false,
}) {
  // Access setHideSubSidebar AND isMobileView from SubSidebarContext
  const { setHideSubSidebar, isMobileView } = useSubSidebar();

  // Handler to hide the sub-sidebar when a link is clicked
  const handleLinkClick = () => {
    // Only hide the sub-sidebar if it's a mobile view
    if (isMobileView) {
      setHideSubSidebar(true);
    }
  };

  // Display a message if no subjects are assigned.
  if (!subjects || subjects.length === 0) {
    return <div className="p-4 text-sm text-gray-500">No Assigned Subject</div>;
  }

  return (
    <div className="p-4">
      {/* Main title for the section */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {title || "Default Title"}
      </h3>
      <ul className="space-y-2">
        {/* Optional subtitle that acts as a navigation link (e.g., to a weekly overview) */}
        {subtitle && !hideWeeklyOverview && (
          <li>
            <NavLink
              to={`${basePath}/weekly-overview`}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700
                ${isActive ? "bg-blue-200 text-blue-700 font-medium" : ""}`
              }
              onClick={handleLinkClick}
            >
              {subtitle || "Default Title"}
            </NavLink>
          </li>
        )}
        {/* Map through subjects to create navigation links for each */}
        {subjects.map((subject) => (
          <li key={subject._id}>
            <NavLink
              to={`${basePath}/${subject._id}`}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700
                ${isActive ? "bg-blue-200 text-blue-700 font-medium" : ""}`
              }
              onClick={handleLinkClick}
            >
              {subject.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TeacherSubjectListContent;
