// client/src/context/SubSidebarContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";

// Create the context
const SubSidebarContext = createContext();

// Custom hook to use the SubSidebarContext
export const useSubSidebar = () => useContext(SubSidebarContext);

export const SubSidebarProvider = ({ children }) => {
  // Determine initial state based on window width
  const isInitialMobileView = window.innerWidth < 1024;
  const [hideSubSidebar, setHideSubSidebar] = useState(isInitialMobileView);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // New state to explicitly indicate if the view is considered mobile
  const [isMobileView, setIsMobileView] = useState(isInitialMobileView);

  // --- ADD THIS NEW STATE FOR HIDING COURSE EDITOR TABS ---
  const [hideCourseEditorTabs, setHideCourseEditorTabs] = useState(false);
  // --------------------------------------------------------

  useEffect(() => {
    // Handler for window resize event
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      setWindowWidth(currentWidth);
      // Update isMobileView based on the current breakpoint
      setIsMobileView(currentWidth < 1024);

      // If switching from desktop to mobile, hide sub-sidebar by default
      if (currentWidth < 1024) {
        setHideSubSidebar(true);
      } else {
        setHideSubSidebar(false); //0726 Added
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Empty dependency array means this runs once on mount

  // subSidebarConfig is set by individual page components
  const [subSidebarConfig, setSubSidebarConfig] = useState(null);

  // The value provided by the context
  const value = {
    hideSubSidebar,
    setHideSubSidebar,
    subSidebarConfig,
    setSubSidebarConfig,
    isMobileView,
    windowWidth,
    // --- ADD THE NEW STATE AND ITS SETTER TO THE CONTEXT VALUE ---
    hideCourseEditorTabs,
    setHideCourseEditorTabs,
    // -------------------------------------------------------------
  };

  return (
    <SubSidebarContext.Provider value={value}>
      {children}
    </SubSidebarContext.Provider>
  );
};
