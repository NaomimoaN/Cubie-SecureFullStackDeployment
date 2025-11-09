// client/src/components/course-editor/TeacherHomeworkDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function TeacherHomeworkDetail({ user }) {
  const { subjectId, homeworkId } = useParams();
  const navigate = useNavigate();

  // Form state management
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Get user ID and role
  const userId = user?._id;
  const userRole = user?.role;

  // Fetch data when component mounts or homeworkId changes
  useEffect(() => {
    // If homeworkId exists (in edit mode), fetch existing homework data and set it to the form
    if (homeworkId) {
      const fetchHomework = async () => {
        setIsLoading(true);
        setError("");
        setMessage("");
        try {
          // API endpoint to get homework data
          const response = await fetch(
            `/api/teacher/subjects/${subjectId}/homeworks/${homeworkId}`
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch homework: ${response.statusText}`);
          }
          const data = await response.json();
          // Set fetched data to form state
          setTitle(data.title);
          setDescription(data.description);
          // Convert date format to 'YYYY-MM-DD' and set
          setDueDate(
            data.dueDate
              ? new Date(data.dueDate).toISOString().split("T")[0]
              : ""
          );
          setIsPublic(data.isPublic);
        } catch (err) {
          console.error("Error fetching homework:", err);
          setError(`Failed to retrieve homework: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchHomework();
    }
  }, [homeworkId, subjectId]); // Re-run if homeworkId or subjectId changes

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    if (!userId || userRole !== "teacher") {
      setError("Permission denied. Please log in as a teacher.");
      setIsLoading(false);
      return;
    }

    // Create form data
    const homeworkData = {
      title,
      description,
      dueDate,
      isPublic,
      teacherId: userId,
      subjectId: subjectId,
    };

    try {
      let response;
      let url;

      if (homeworkId) {
        // In edit mode (PUT request)
        url = `/api/teacher/subjects/${subjectId}/homeworks/${homeworkId}`;
        response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(homeworkData),
        });
      } else {
        // In new creation mode (POST request)
        url = `/api/teacher/subjects/${subjectId}/homeworks`;
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(homeworkData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit form");
      }

      const result = await response.json();
      setMessage(
        homeworkId
          ? "Homework updated successfully!"
          : "Homework created successfully!"
      );

      // After success, redirect to the detail page or original page
      // For new creation, redirect to the created homework's detail page
      // For editing, return to the original detail page
      if (!homeworkId) {
        // After new creation, redirect to the created homework's detail page
        navigate(
          `/teacher/course-editor/${subjectId}/homework/${result.homework._id}`
        );
      } else {
        // After editing, return to the original detail page (reload if necessary)
        navigate(`/teacher/course-editor/${subjectId}/homework/${homeworkId}`);
      }
    } catch (err) {
      console.error("Error submitting homework:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Display message while loading
  if (isLoading && homeworkId) {
    return (
      <div className="text-center p-4 text-lg">Loading homework data...</div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl bg-white shadow-lg rounded-xl mt-8">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
        {homeworkId ? "Edit Homework" : "Create New Homework"}
      </h2>

      {/* Error message display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-12a1 1 0 102 0V9a1 1 0 10-2 0V6zm0 6a1 1 0 102 0 1 1 0 00-2 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Success message display */}
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title input field */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter homework title"
          />
        </div>

        {/* Description input field */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="5"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter detailed homework description"
          ></textarea>
        </div>

        {/* Due Date input field */}
        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Public setting checkbox */}
        <div className="flex items-center">
          <input
            id="isPublic"
            name="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isPublic"
            className="ml-2 block text-sm text-gray-900"
          >
            Make Public (Students will be able to view it)
          </label>
        </div>

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            }`}
          >
            {isLoading
              ? homeworkId
                ? "Updating..."
                : "Creating..."
              : homeworkId
              ? "Update Homework"
              : "Create Homework"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TeacherHomeworkDetail;
