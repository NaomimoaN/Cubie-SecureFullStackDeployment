// client/src/components/common/WeekSelectDropdown.jsx

/**
 * A reusable dropdown component for selecting a week.
 * It displays a list of available weeks, manages the selected week, and provides a callback for changes.
 * It also handles the display of loading states and error messages.
 */

import React from "react";

/**
 * @param {Object} props - The properties for the component.
 * @param {Array<Object>} props.weeks - An array of week objects to display in the dropdown. Each object should have `_id`, `weekNumber`, and `title` properties.
 * @param {string} props.selectedWeekId - The ID of the currently selected week.
 * @param {function} props.onWeekChange - Callback function to be called when the selected week changes. It receives the event object.
 * @param {boolean} [props.disabled=false] - If true, the dropdown will be disabled.
 * @param {boolean} [props.loading=false] - If true, indicates that weeks are currently being loaded.
 * @param {string|null} [props.errorMessage=null] - An error message to display below the dropdown.
 * @returns {JSX.Element} The rendered week select dropdown component.
 */
const WeekSelectDropdown = ({
  weeks,
  selectedWeekId,
  onWeekChange,
  disabled,
  loading = false,
  errorMessage = null,
}) => {
  return (
    <div className="w-full sm:w-1/2">
      <label
        htmlFor="weekSelect"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Week:
      </label>
      {loading ? (
        <p className="mt-1 block w-full px-3 py-2 text-gray-500 bg-gray-100 rounded-md shadow-sm text-sm">
          Loading weeks...
        </p>
      ) : errorMessage ? (
        <p className="mt-1 block w-full px-3 py-2 text-red-500 bg-red-50 rounded-md shadow-sm text-sm">
          {errorMessage}
        </p>
      ) : (
        <select
          id="weekSelect"
          value={selectedWeekId}
          onChange={onWeekChange}
          required
          className="mt-1 block w-full px-3 py-2 text-base border-2 border-indigo-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm bg-white transition-all duration-200 focus:shadow-md
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          {!selectedWeekId && <option value="">Select Week</option>}
          {weeks.map((week) => (
            <option key={week._id} value={week._id}>
              Week {week.weekNumber}: {week.title}
            </option>
          ))}
        </select>
      )}
      {/* Display message if no weeks are available and not loading */}
      {!loading && weeks.length === 0 && !selectedWeekId && (
        <p className="text-gray-500 text-sm mt-1">
          No weeks found for this subject.
        </p>
      )}
      {/* Display error message if provided */}
      {errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default WeekSelectDropdown;
