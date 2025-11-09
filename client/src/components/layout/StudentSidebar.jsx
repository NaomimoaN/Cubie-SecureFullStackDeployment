// client/src/components/layout/StudentSidebar.jsx

/**
 * A student-specific sidebar navigation component.
 * It displays a list of navigation items for students, with icons on the left side of text.
 */

import React from "react";
import { NavLink } from "react-router-dom";

import StudentBadgeDisplay from "../student/badge/StudentBadgeDisplay";

/**
 * @param {Object} props - The properties for the component.
 * @param {Array<Object|string>} props.sidebarItems - An array of navigation items.
 * Each item can be an object `{ name: string, path?: string, icon?: string }` for links,
 * or a `string` for non-clickable menu titles.
 * @param {string} [props.widthClass="w-[224px]"] - CSS class for the width of the sidebar.
 * @param {string} [props.bgColorClass="bg-white"] - CSS class for the background color of the sidebar.
 * @param {string} [props.textSizeClass="text-sm"] - CSS class for the text size of the sidebar items.
 * @param {string} [props.textColorClass="text-black"] - CSS class for the default text color of the sidebar items.
 * @param {string} [props.textAlignClass="text-center"] - CSS class for the text alignment of the sidebar items.
 * @returns {JSX.Element} The rendered StudentSidebar component.
 */
function StudentSidebar({
  sidebarItems,
  widthClass = "w-[224px]",
  bgColorClass = "bg-white",
  textSizeClass = "text-sm",
  textColorClass = "text-black",
  textAlignClass = "text-center",
  showStudentBadges = false,
}) {
  return (
    <div
      className={`${widthClass} ${bgColorClass} flex-shrink-0 flex flex-col`}
    >
      {/* Student Badges - show at top for students */}
      {showStudentBadges && <StudentBadgeDisplay />}

      <nav className="flex-1">
        <ul className="pt-0">
          {sidebarItems.map((item, index) => (
            <li
              key={item.name || index}
              className={`${
                index === 0 ? "mt-0" : "mt-0"
              } mb-0 ${textAlignClass}`}
            >
              {/* Renders NavLink if item has a 'path', otherwise a non-clickable span */}
              {item.path !== undefined ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block ${textSizeClass} flex flex-row items-center ${textColorClass} hover:no-underline focus:no-underline pl-8 pr-2 py-4 transition-colors duration-200 ${
                      isActive
                        ? "bg-[#BDDFFF]"
                        : "hover:bg-gray-300 hover:text-gray-700"
                    }`
                  }
                  end={item.path === "/student"} //
                >
                  {/* Icon */}
                  {item.icon && (
                    <img
                      src={`/sidebar-icons/${item.icon}.svg`}
                      alt={`${item.name} icon`}
                      className="w-6 h-6 mr-2"
                    />
                  )}
                  {/* Text */}
                  <span>{item.name}</span>
                </NavLink>
              ) : (
                // Non-clickable menu item (e.g., a section title)
                <span className="block text-lg font-medium text-gray-700">
                  {item.name || item}{" "}
                  {/* Use item.name or the item itself if it's a string */}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default StudentSidebar;
