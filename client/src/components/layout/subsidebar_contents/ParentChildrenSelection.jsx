// client/src/components/layout/subsidebar_contents/ParentChildrenSelection.jsx

/**
 * A sub-sidebar content component that renders a list of children for a parent.
 * It allows parents to select a child to view more details.
 * If no children are available, it displays a message indicating that.
 * If the child data is incomplete, it shows a warning message.
 * @param {Object} props - The component props.
 * @param {Array} props.children - An array of child objects, each containing userId and name.
 * @param {string} props.basePath - The base path for the child links.
 * @param {string} [props.title] - The title for the selection section.
 * @param {string} [props.subtitle] - The subtitle for the selection section, typically an overview link.
 * @returns {JSX.Element}
 */

import React from "react";
import { NavLink } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext"; // Import useSubSidebar

function ParentChildrenSelection({ children, basePath, title, subtitle }) {
  // Access setHideSubSidebar AND isMobileView from SubSidebarContext
  const { setHideSubSidebar, isMobileView } = useSubSidebar();

  // Handler to hide the sub-sidebar when a link is clicked
  const handleLinkClick = () => {
    // Only hide the sub-sidebar if it's a mobile view
    if (isMobileView) {
      setHideSubSidebar(true);
    }
  };

  if (!children || children.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No children information available.
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {title || "Select Your Child"}
      </h3>
      <ul className="space-y-2">
        {subtitle && (
          <li>
            <NavLink
              to={`/`} // Assuming this navigates to a parent dashboard overview.
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700
                ${isActive ? "bg-blue-500 text-blue-700 font-medium" : ""}`
              }
              onClick={handleLinkClick} // Add onClick handler
            >
              {subtitle || "Overview"}
            </NavLink>
          </li>
        )}
        {children.map((child) => {
          if (!child || !child.userId || !child.name) {
            console.warn(
              "ParentChildrenSelection: Invalid child data detected.",
              child
            );
            return (
              <li
                key={`invalid-child-${Math.random()}`}
                className="text-sm text-red-500"
              >
                Some child data is incomplete.
              </li>
            );
          }

          return (
            <li key={child.userId}>
              <NavLink
                to={`${basePath}/${child.userId}`}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700
                  ${isActive ? "bg-blue-200 text-blue-700 font-medium" : ""}`
                }
                onClick={handleLinkClick} // Add onClick handler
              >
                {child.name}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ParentChildrenSelection;
