// client/src/components/layout/SubSidebar.jsx

/**
 * A dynamic sub-sidebar component that renders different content based on the provided configuration.
 * It acts as a flexible secondary navigation or information panel within the main dashboard layout.
 * Its visibility can be controlled via SubSidebarContext.
 */

import React, { useState, useEffect } from "react"; // Added useState and useEffect
import { useSubSidebar } from "../../context/SubSidebarContext";
import ParentAnnouncementList from "./subsidebar_contents/ParentAnnouncementList";
import ParentChildrenSelection from "./subsidebar_contents/ParentChildrenSelection";
import TeacherAnnouncementList from "./subsidebar_contents/TeacherAnnouncementList";
import TeacherSubjectListContent from "./subsidebar_contents/TeacherSubjectListContent";

/**
 * @param {Object} props - The properties for the component.
 * @param {Object|null} props.config - The configuration object that determines the content and behavior of the sub-sidebar.
 * @returns {JSX.Element|null} The rendered SubSidebar component or `null` if no configuration is provided or type is "WithoutSubSidebar".
 */
function SubSidebar({ config }) {
  const { hideSubSidebar } = useSubSidebar();

  // 0719*Responsive-start
  // State to store the current window width
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Effect to update windowWidth on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount
  // 0719*Responsive-end
  // If hideSubSidebar is true, do not render the entire sub-sidebar.
  if (hideSubSidebar) {
    return null;
  }

  // Do not render if config is not provided.
  if (!config) {
    return null;
  }

  // 0719*Responsive-start
  // Determine commonClasses based on window width
  // Original commonClasses: "w-[301px] border-r bg-white p-4 flex-shrink-0 h-full"
  const commonClasses = `border-r bg-white p-4 flex-shrink-0 h-full ${
    windowWidth < 1024 ? "w-[calc(100vw-75px)]" : "w-[301px]"
  }`;
  // 0719*Responsive-end

  /**
   * Renders specific content components based on `config.type`.
   * @returns {JSX.Element|null} The content component to be rendered inside the sub-sidebar.
   */
  const renderContent = () => {
    switch (config.type) {
      case "teacherDashboardSubjectList":
        return (
          <TeacherSubjectListContent
            title={"Homework Progress"}
            subtitle={"Weekly Overview"}
            subjects={config.data.subjects}
            basePath={config.data.basePath}
          />
        );
      case "teacherContentEditorSubjectList":
        return (
          <TeacherSubjectListContent
            title={"Course Editor"}
            subtitle={null}
            subjects={config.data.subjects}
            basePath={config.data.basePath}
          />
        );
      case "coreCompetenciesSubjectList":
        return (
          <TeacherSubjectListContent
            title={"Student Performance"}
            subtitle={null}
            subjects={config.data.subjects}
            basePath={config.data.basePath}
            hideWeeklyOverview={true}
          />
        );
      case "parentChildrenSelection":
        return (
          <ParentChildrenSelection
            title={"Your Child"}
            subtitle={null}
            children={config.data.children}
            basePath={config.data.basePath}
          />
        );
      case "ParentAnnouncement":
        return <ParentAnnouncementList />;
      case "TeacherAnnouncement":
        return <TeacherAnnouncementList />;
      case "WithoutSubSidebar":
        return null;
      default:
        return null;
    }
  };

  const content = renderContent();
  if (content === null) {
    return null;
  }

  return <div className={commonClasses}>{content}</div>;
}

export default SubSidebar;
