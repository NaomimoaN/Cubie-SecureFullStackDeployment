// client/src/components/common/SubjectSelectDropdown.jsx

/**
 * A reusable dropdown component for subject selection.
 * It receives a list of available subjects, manages the selected subject, and provides a callback for changes.
 * It also handles the display of loading states and error messages.
 */

import React from "react";

/**
 * @param {Object} props - The properties for the component.
 * @param {Array<Object>} props.subjects - An array of subject objects to display in the dropdown. Each object should have an `_id` and `name` property.
 * @param {string} props.selectedSubjectId - The ID of the currently selected subject.
 * @param {function} props.onSubjectChange - Callback function to be called when the selected subject changes. It receives the event object.
 * @param {boolean} [props.disabled=false] - If true, the dropdown will be disabled.
 * @param {boolean} [props.loading=false] - If true, indicates that subjects are currently being loaded.
 * @param {string|null} [props.errorMessage=null] - An error message to display below the dropdown.
 * @returns {JSX.Element} The rendered subject select dropdown component.
 */
const SubjectSelectDropdown = ({
  subjects,
  selectedSubjectId,
  onSubjectChange,
  disabled,
  loading = false,
  errorMessage = null,
}) => {
  return (
    <div className="w-full sm:w-1/2">
      <label
        htmlFor="subjectSelect"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Subject:
      </label>
      <select
        id="subjectSelect"
        value={selectedSubjectId}
        onChange={onSubjectChange}
        required
        className="mt-1 block w-full px-3 py-2 text-base border-2 border-indigo-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm bg-white transition-all duration-200 focus:shadow-md"
        disabled={disabled}
      >
        <option value="">Select Subject</option>
        {subjects.map((subject) => (
          <option key={subject._id} value={subject._id}>
            {subject.name}
          </option>
        ))}
      </select>
      {/* Display message if no subjects are available and not loading */}
      {!loading && subjects.length === 0 && !selectedSubjectId && (
        <p className="text-gray-500 text-sm mt-1">No subjects available.</p>
      )}
      {/* Display error message if provided */}
      {errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default SubjectSelectDropdown;
