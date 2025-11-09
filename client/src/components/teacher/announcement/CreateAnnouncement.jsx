import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { postAnnouncement } from "../../../services/announcementService";

function CreateAnnouncement({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [recipientGroup, setRecipientGroup] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  // const { user } = location.state || {};

  const handleFileSelect = (selectedFile) => {
    if (selectedFile) {
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Please upload a JPEG, PNG, or PDF file.");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB.");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setError("");
      setFile(selectedFile);
    }
  };

  const handleFileChange = (e) => {
    handleFileSelect(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("line59", user);
    console.log("handleSubmit called", {
      title,
      recipientGroup,
      description,
      file: file?.name,
      userId: user?.id,
    });

    if (!title || !recipientGroup || !description) {
      setError(
        "Please fill in all required fields (Title, Recipient Group, Description)."
      );
      console.log("Validation failed: Missing required fields");
      return;
    }

    if (!user?.id) {
      setError("User information is missing. Please log in again.");
      console.log("Validation failed: Missing user.id");
      return;
    }

    // Derive number_date from current date
    const today = new Date();
    const numberDate = `${today.getMonth() + 1}/${today.getDate()}`;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("recipientGroup", recipientGroup);
    formData.append("description", description);
    formData.append("created_by", user.id);
    formData.append("creatorTitle", user.name || "Unknown");
    formData.append("number_date", numberDate);
    if (file) {
      formData.append("file", file);
    }

    // Log FormData contents
    for (let [key, value] of formData.entries()) {
      console.log(`FormData ${key}:`, value);
    }

    try {
      const response = await postAnnouncement(formData);
      console.log("Announcement created:", response);
      // alert("Announcement created successfully!");
      // Reset the fields
      setTitle("");
      setRecipientGroup("");
      setDescription("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      navigate("/teacher/announcements");
    } catch (err) {
      console.error("Error posting announcement:", err);
      setError(
        err.message || "Failed to create announcement. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full bg-white mx-auto p-6 border border-gray-300 rounded-lg shadow-lg">
      <h1 className="text-2xl font-semibold mb-6">Create Announcement</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Title Input */}
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            placeholder="Add title"
            disabled={loading}
          />
        </div>

        {/* Recipient Group Dropdown */}
        <div className="mb-4">
          <label
            htmlFor="recipientGroup"
            className="block text-sm font-medium text-gray-700"
          >
            Recipient Group
          </label>
          <select
            id="recipientGroup"
            value={recipientGroup}
            onChange={(e) => setRecipientGroup(e.target.value)}
            className="mt-1 block w-[30%] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white"
            disabled={loading}
          >
            <option value="" disabled>
              Select Recipient Group
            </option>
            <option value="All">All</option>
            <option value="Students">Students</option>
            <option value="Parents">Parents</option>
          </select>
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <label
            htmlFor="fileUpload"
            className="block text-sm font-medium text-gray-700"
          >
            Attachments (Optional, JPEG/PNG/PDF, Max 5MB)
          </label>
          <div
            className={`
              mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md
              ${isDragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 bg-gray-50"
              }
              transition-colors duration-200 ease-in-out
              ${loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={loading ? undefined : handleDrop}
            onClick={loading ? undefined : () => fileInputRef.current.click()}
          >
            {file ? (
              <div className="flex items-center space-x-2">
                <div className="flex justify-center">
                  <img
                    src="/teacher-announcement/Upload-arrow.png"
                    alt="Upload icon"
                    className=""
                  />
                </div>
                <span className="text-gray-900 font-medium">{file.name}</span>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex justify-center">
                  <img
                    src="/teacher-announcement/Upload-arrow.png"
                    alt="Upload icon"
                    className=""
                  />
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Choose a file
                  </span>
                  {" or drag and drop here"}
                </p>
                <p className="text-xs text-gray-500">
                  JPEG, PNG, PDF up to 5MB
                </p>
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
              disabled={loading}
            />
          </div>
        </div>

        {/* Description Input */}
        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 bg-white block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            placeholder="Write some announcement details"
            rows="4"
            disabled={loading}
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className={`w-20 py-2 px-4 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-orange-500 ${loading
              ? "bg-orange-300 cursor-not-allowed w-50"
              : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            disabled={loading}
          >
            {loading ? "Creating" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateAnnouncement;
