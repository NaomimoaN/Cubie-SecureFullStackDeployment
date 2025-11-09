import React from "react";

function ContentLoader() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[530px] h-[260px] flex flex-col justify-center items-center shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="ml-4 text-xl text-gray-700">Loading...</p>
      </div>
    </div>
  );
}

export default ContentLoader;
