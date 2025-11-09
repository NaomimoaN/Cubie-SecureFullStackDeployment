// src/utils/formatters.js

/**
 * Converts a 24-hour time string to AM/PM format.
 * @param {string} timeString - The time string in "HH:MM" format.
 * @returns {string} - The time string in "HH:MM AM/PM" format.
 */
export const formatTimeToAmPm = (timeString) => {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":").map(Number);

  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;

  const paddedHours = formattedHours.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");

  return `${paddedHours}:${paddedMinutes} ${ampm}`;
};

/**
 * Formats a Date object into a string like "Wed, August 20".
 * @param {Date | string | number} dateInput - The date to format. Can be a Date object, an ISO string, or a timestamp.
 * @returns {string} - The formatted date string (e.g., "Wed, August 20") or an empty string if invalid.
 */
export const formatCalendarDate = (dateInput) => {
  if (!dateInput) return "";

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.error(
      "Invalid date input provided to formatCalendarDate:",
      dateInput
    );
    return "";
  }

  const options = {
    weekday: "short",
    month: "long",
    day: "numeric",
  };

  return new Intl.DateTimeFormat("en-US", options).format(date);
};
