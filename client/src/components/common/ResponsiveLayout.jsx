// ResponsiveLayout.jsx
import React, { useState, useEffect } from "react";

export const ResponsiveLayout = ({
  mainContent,
  asideContent,
  showAsideContentInDesktop = true,
  breakpoint = 768,
  pdfViewerIdealWidth = 794,
  pdfViewerMinVisibleWidth = 400,
  minMainContentWidth = 348,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint]);

  const mainPaneStyle = {};
  const asidePaneStyle = {};

  if (!isMobile) {
    if (showAsideContentInDesktop && asideContent) {
      asidePaneStyle.flex = `0 0 ${pdfViewerIdealWidth}px`;
      asidePaneStyle.minWidth = `${pdfViewerMinVisibleWidth}px`;
      asidePaneStyle.maxWidth = `${pdfViewerIdealWidth}px`;

      mainPaneStyle.flex = "1 1 auto";
      mainPaneStyle.minWidth = `${minMainContentWidth}px`;
    } else {
      mainPaneStyle.flex = "1 1 100%";
      mainPaneStyle.minWidth = `${minMainContentWidth}px`;
    }
  } else {
    if (asideContent) {
      asidePaneStyle.width = `${pdfViewerIdealWidth}px`;
      asidePaneStyle.maxWidth = `${pdfViewerIdealWidth}px`;
      asidePaneStyle.minWidth = `${pdfViewerIdealWidth}px`;
      asidePaneStyle.margin = "0 auto";
      asidePaneStyle.flex = "none";
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div
        className={`flex-1 flex ${
          isMobile ? "flex-col" : "flex-row"
        } overflow-hidden justify-center items-stretch`}
      >
        {(!isMobile || !asideContent) && (
          <div
            style={
              !isMobile
                ? mainPaneStyle
                : { flex: "1 1 100%", minWidth: `${minMainContentWidth}px` }
            }
            className="overflow-auto"
          >
            {mainContent}
          </div>
        )}

        {asideContent &&
          ((!isMobile && showAsideContentInDesktop) || isMobile) && (
            <div
              style={asidePaneStyle}
              className="overflow-auto h-full flex flex-col"
            >
              {asideContent}
            </div>
          )}
      </div>
    </div>
  );
};
