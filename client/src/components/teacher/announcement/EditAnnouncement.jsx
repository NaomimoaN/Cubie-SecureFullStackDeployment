import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../../services/api";

function EditAnnouncement({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const announcement = location.state?.announcement || {};
  const [formData, setFormData] = useState({
    title: announcement.title || "",
    description: announcement.description || "",
    recipient_group: announcement.recipient_group || "All",
    file: null,
  });
  const [existingFile, setExistingFile] = useState(
    announcement.fileKey
      ? decodeURIComponent(announcement.fileKey.split("/").pop().split("_").slice(1).join("_"))
      : null
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSubmitting) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isSubmitting) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(droppedFile.type)) {
        setError("Please upload a JPEG, PNG, or PDF file.");
        return;
      }
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError("File size must not exceed 5MB.");
        return;
      }
      setFormData((prev) => ({ ...prev, file: droppedFile }));
      setExistingFile(null);
      setError("");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(selectedFile.type)) {
        setError("Please upload a JPEG, PNG, or PDF file.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must not exceed 5MB.");
        return;
      }
      setFormData((prev) => ({ ...prev, file: selectedFile }));
      setExistingFile(null);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("recipient_group", formData.recipient_group);
      if (formData.file) {
        data.append("file", formData.file);
      }

      await api.put(`/api/announcements/${announcement._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/teacher/announcements");
    } catch (error) {
      console.error("Error updating announcement:", error);
      setError("Failed to update announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/teacher/announcements");
  };

  return (
    <div className="bg-white mx-5 my-10 p-6 rounded-lg">
      <h1 className="text-2xl font-semibold mb-6">Edit Announcement</h1>
      {error && (
        <p className="text-red-600 mb-4">{error}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="bg-white mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            rows="5"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="recipient_group" className="block text-sm font-medium text-gray-700">
            Recipient Group
          </label>
          <select
            id="recipient_group"
            name="recipient_group"
            value={formData.recipient_group}
            onChange={handleInputChange}
            className="bg-white mt-1 w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="All">All</option>
            <option value="Parents">Parents</option>
            <option value="Students">Students</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700">
            Attachments (Optional, JPEG/PNG/PDF, Max 5MB) {existingFile && `(Current: ${existingFile})`}
          </label>
          <div
            className={`
              mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md
              ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-gray-50"}
              transition-colors duration-200 ease-in-out
              ${isSubmitting ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={isSubmitting ? undefined : handleDrop}
            onClick={isSubmitting ? undefined : () => fileInputRef.current.click()}
          >
            {formData.file || existingFile ? (
              <div className="flex items-center space-x-2">
                <div className="flex justify-center">
                  <img src="/teacher-announcement/Upload-arrow.png" alt="Upload icon" className="w-6 h-6" />
                </div>
                <span className="text-gray-900 font-medium">
                  {formData.file ? formData.file.name : existingFile}
                </span>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex justify-center">
                  <img src="/teacher-announcement/Upload-arrow.png" alt="Upload icon" className="w-6 h-6" />
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Choose a file
                  </span>
                  {" or drag and drop here"}
                </p>
                <p className="text-xs text-gray-500">JPEG, PNG, PDF up to 5MB</p>
              </div>
            )}
            <input
              id="fileUpload"
              name="fileUpload"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-orange-300"
          >
            {isSubmitting ? "Updating..." : "Update Announcement"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditAnnouncement;