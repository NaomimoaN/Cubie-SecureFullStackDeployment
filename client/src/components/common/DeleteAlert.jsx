// client/src/components/common/DeleteAlert.jsx

import React from "react";

function DeleteAlert({ isOpen, message, onClose, onConfirm, error }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[530px] h-[260px] flex justify-center items-center">
        <div>
          <p className="text-[14px] text-gray-700 mb-6 text-center">
            {message || "Are you sure you want to delete this item?"}{" "}
          </p>
          {error && (
            <p className="text-red-600 mb-4 text-center text-sm">{error}</p>
          )}
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-primeblack text-[13px] rounded-full hover:bg-gray3 border-none"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-orange1 text-white text-[13px] rounded-full hover:bg-orange2 border-none"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteAlert;
