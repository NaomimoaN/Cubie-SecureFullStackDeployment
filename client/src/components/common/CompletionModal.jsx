// client/src/components/common/CompletionModal.jsx

import React from "react";

const CompletionModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="p-6 w-[530px] h-[260px] bg-white rounded-2xl shadow-xl text-center relative flex flex-col items-center justify-center">
        {" "}
        <p className="text-gray-700 font-bold mb-16">
          Hooray! Download complete
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-orange1 text-white rounded-full hover:bg-orange2 border-none"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CompletionModal;
