// client/src/components/layout/DashboardLayout.jsx

/**
 * This component provides the core layout for all dashboard pages.
 * It includes a Header, a main Sidebar, and a dynamic SubSidebar,
 * ensuring consistent navigation and structure across the application's main sections.
 */

import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import StudentSidebar from "./StudentSidebar";
import SubSidebar from "./SubSidebar";
import {
  SubSidebarProvider,
  useSubSidebar,
} from "../../context/SubSidebarContext";

/**
 * Main Dashboard Layout component.
 * It wraps the application content with a SubSidebarProvider to enable sub-sidebar functionality
 * and passes layout-related props to the inner LayoutContent component.
 *
 * @param {Object} props - The properties for the component.
 * @param {React.ReactNode} props.children - The child components to be rendered within the main content area.
 * @param {string} props.userName - The name of the currently logged-in user.
 * @param {function} props.onLogout - Callback function to handle user logout.
 * @param {Array<Object>} props.sidebarItems - An array of objects defining the main sidebar navigation items.
 * @param {string} props.sidebarWidthClass - CSS class for the width of the main sidebar.
 * @param {string} props.sidebarBgColorClass - CSS class for the background color of the main sidebar.
 * @param {string} props.sidebarShadowClass - CSS class for the shadow of the main sidebar.
 * @param {string} props.sidebarTextColorClass - CSS class for the text color of the main sidebar.
 * @param {string} props.sidebarTextSizeClass - CSS class for the text size of the main sidebar.
 * @param {string} props.sidebarTextAlignClass - CSS class for the text alignment of the main sidebar.
 * @param {string} props.user - The user information for the header.
 * @param {boolean} [props.showStudentBadges=false] - Whether to show student badges in the sidebar.
 * @param {boolean} [props.showNotifications=false] - Whether to show notifications in the header (students only).
 * @returns {JSX.Element} The rendered DashboardLayout component.
 */
function DashboardLayout({
  children,
  userName,
  onLogout,
  sidebarItems,
  sidebarWidthClass,
  sidebarBgColorClass,
  sidebarShadowClass,
  sidebarTextColorClass,
  sidebarTextSizeClass,
  sidebarTextAlignClass,
  showStudentBadges = false,
  user,
  showNotifications = false, // New prop for notifications (students only)
}) {
  return (
    <SubSidebarProvider>
      <LayoutContent
        userName={userName}
        onLogout={onLogout}
        sidebarItems={sidebarItems}
        sidebarWidthClass={sidebarWidthClass}
        sidebarBgColorClass={sidebarBgColorClass}
        sidebarShadowClass={sidebarShadowClass}
        sidebarTextColorClass={sidebarTextColorClass}
        sidebarTextSizeClass={sidebarTextSizeClass}
        sidebarTextAlignClass={sidebarTextAlignClass}
        showStudentBadges={showStudentBadges}
        user={user}
        showNotifications={showNotifications}
      >
        {children}
      </LayoutContent>
    </SubSidebarProvider>
  );
}

/**
 * Inner component responsible for rendering the actual layout structure.
 * It consumes the SubSidebarContext to dynamically display the SubSidebar based on its configuration.
 * @param {Object} props - The properties for the component, same as DashboardLayout's props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the main content area.
 * @param {string} props.userName - The name of the currently logged-in user.
 * @param {function} props.onLogout - Callback function to handle user logout.
 * @param {Array<Object>} props.sidebarItems - An array of objects defining the main sidebar navigation items.
 * @param {string} props.sidebarWidthClass - CSS class for the width of the main sidebar.
 * @param {string} props.sidebarBgColorClass - CSS class for the background color of the main sidebar. <-- ここを修正
 * @param {string} props.sidebarShadowClass - CSS class for the shadow of the main sidebar.
 * @param {string} props.sidebarTextColorClass - CSS class for the text color of the main sidebar.
 * @param {string} props.sidebarTextSizeClass - CSS class for the text size of the main sidebar.
 * @param {string} props.sidebarTextAlignClass - CSS class for the text alignment of the main sidebar.
 * @param {string} props.user - The user information for the header.
 * @param {boolean} [props.showStudentBadges] - Whether to show student badges in the sidebar.
 * @param {boolean} [props.showNotifications] - Whether to show notifications in the header (students only).
 * @returns {JSX.Element} The rendered LayoutContent component.
 */
function LayoutContent({
  children,
  userName,
  onLogout,
  sidebarItems,
  sidebarWidthClass,
  sidebarBgColorClass,
  sidebarShadowClass,
  sidebarTextColorClass,
  sidebarTextSizeClass,
  sidebarTextAlignClass,
  showStudentBadges,
  user,
  showNotifications,
}) {
  // Access the sub-sidebar configuration and its setter from the context.
  const { subSidebarConfig, setHideSubSidebar } = useSubSidebar();

  // Handler for sidebar item clicks
  const handleSidebarItemClick = (item) => {
    // For parent pages, let the individual components handle their own sub-sidebar configuration
    // The components will use setSubSidebarConfig to set up their specific sub-sidebar content
    if (item.hasSubSidebar) {
      setHideSubSidebar(false); // Show the sub-sidebar area
    } else {
      setHideSubSidebar(true); // Hide the sub-sidebar for items that don't have one
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidde min-w-[768px]">
      {/* Header component */}
      <Header
        userName={userName}
        onLogout={onLogout}
        user={user}
        showNotifications={showNotifications}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Main Sidebar component */}
        {user?.role === "student" ? (
          <StudentSidebar
            sidebarItems={sidebarItems}
            widthClass={sidebarWidthClass}
            bgColorClass={sidebarBgColorClass}
            textSizeClass={sidebarTextSizeClass}
            textColorClass={sidebarTextColorClass}
            textAlignClass={sidebarTextAlignClass}
            showStudentBadges={showStudentBadges}
            onItemClick={handleSidebarItemClick}
          />
        ) : (
          <Sidebar
            sidebarItems={sidebarItems}
            widthClass={sidebarWidthClass}
            bgColorClass={sidebarBgColorClass}
            shadowClass={sidebarShadowClass}
            textSizeClass={sidebarTextSizeClass}
            textColorClass={sidebarTextColorClass}
            textAlignClass={sidebarTextAlignClass}
            showStudentBadges={showStudentBadges}
            onItemClick={handleSidebarItemClick}
          />
        )}
        {/* Conditionally render SubSidebar if configuration exists */}
        {subSidebarConfig && (
          <div className="flex-shrink-0 h-full border-r-4 border-gray3">
            <SubSidebar config={subSidebarConfig} />{" "}
          </div>
        )}
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-0">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
