// client/src/components/layout/Sidebar.jsx

/**
 * A reusable sidebar navigation component.
 * It displays a list of navigation items, allowing users to navigate through different sections of the dashboard.
 * It supports both clickable links and non-clickable menu items.
 */

import React from "react";
import { NavLink } from "react-router-dom";

import StudentBadgeDisplay from "../student/badge/StudentBadgeDisplay";

/**
 * @param {Object} props - The properties for the component.
 * @param {Array<Object|string>} props.sidebarItems - An array of navigation items.
 * Each item can be an object `{ name: string, path?: string, icon?: string }` for links,
 * or a `string` for non-clickable menu titles.
 * @param {string} [props.widthClass="w-[75px]"] - CSS class for the width of the sidebar.
 * @param {string} [props.bgColorClass="bg-white"] - CSS class for the background color of the sidebar.
 * @param {string} [props.textSizeClass="text-xxs"] - CSS class for the text size of the sidebar items.
 * @param {string} [props.textColorClass="text-black"] - CSS class for the default text color of the sidebar items.
 * @param {string} [props.textAlignClass="text-center"] - CSS class for the text alignment of the sidebar items.
 * @param {function} [props.onItemClick] - Callback function called when a navigation item is clicked. Receives the clicked item object.
 * @returns {JSX.Element} The rendered Sidebar component.
 */
function Sidebar({
  sidebarItems,
  widthClass = "w-[75px]",
  bgColorClass = "bg-white",
  textSizeClass = "text-xxs",
  textColorClass = "text-black",
  textAlignClass = "text-center",
  showStudentBadges = false,
  onItemClick, // Add onItemClick to props
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
                    `block ${textSizeClass} flex flex-col items-center ${textColorClass} hover:no-underline focus:no-underline px-2 py-4 transition-colors duration-200 ${
                      isActive
                        ? "bg-[#BDDFFF]"
                        : "hover:bg-gray-300 hover:text-gray-700"
                    }`
                  }
                  end={item.path === "/"}
                  onClick={() => {
                    // Add onClick handler
                    if (onItemClick) {
                      onItemClick(item); // Call onItemClick with the current item
                    }
                  }}
                >
                  {/* Icon */}
                  {item.icon && (
                    <img
                      src={`/sidebar-icons/${item.icon}.svg`}
                      alt={`${item.name} icon`}
                      className="w-6 h-6 mb-1"
                    />
                  )}
                  {/* Text */}
                  <span>{item.name}</span>
                </NavLink>
              ) : (
                // Non-clickable menu item (e.g., a section title)
                // If it's a non-clickable item, we might still want to trigger onItemClick if needed
                <span
                  className="block text-lg font-medium text-gray-700 cursor-default" // Added cursor-default
                  onClick={() => {
                    // Also add onClick for non-clickable items if behavior is desired
                    if (onItemClick) {
                      onItemClick(item);
                    }
                  }}
                >
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

export default Sidebar;
