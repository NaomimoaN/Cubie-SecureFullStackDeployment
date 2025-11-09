// client/src/components/common/Loader.jsx

/**
 * A simple, full-screen loading indicator component.
 * It displays a spinning animation and a "Loading..." message, typically used
 * to indicate data fetching or processing in the background.
 */

import React from "react";

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Spinning animation for visual loading feedback */}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      {/* Loading text to inform the user */}
      <p className="ml-4 text-xl text-gray-700">Loading...</p>
    </div>
  );
}

export default Loader;
