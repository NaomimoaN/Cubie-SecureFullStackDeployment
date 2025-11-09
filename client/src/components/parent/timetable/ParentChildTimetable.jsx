// client/src/components/parent/timetable/ParentChildTimetable.jsx
// Fetches and renders the detailed academic timetable for a specific child.

import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";

import { getStudentSubjects } from "../../../services/userSubjectService";

const DISPLAY_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_PERIODS = [
  { label: "1st Period", start: "09:20", end: "10:00", height: "h-[72px]" },
  { label: "2nd Period", start: "10:00", end: "10:40", height: "h-[72px]" },
  { label: "Recess", start: "10:40", end: "11:00", height: "h-[36px]" },
  { label: "3rd Period", start: "11:00", end: "11:40", height: "h-[72px]" },
  { label: "4th Period", start: "11:40", end: "12:20", height: "h-[72px]" },
  { label: "Lunch Time", start: "12:20", end: "13:30", height: "h-[48px]" },
  { label: "5th Period", start: "13:30", end: "14:10", height: "h-[72px]" },
];

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatTime = (time24hr) => {
  try {
    const [hours, minutes] = time24hr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Time formatting error:", time24hr, error);
    return time24hr;
  }
};

const SUBJECT_DISPLAY_NAME_MAP = {
  Math: "Mathematics",
  "Language Arts": "Language Arts",
  Science: "Science",
  "Social Studies": "Social Studies",
  ADST: "ADST",
};

const getSubjectDisplayName = (dbSubjectName) => {
  return SUBJECT_DISPLAY_NAME_MAP[dbSubjectName] || dbSubjectName;
};

function ParentChildTimetable({ childId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentSubjects, setStudentSubjects] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);
      if (!childId) {
        setError("No child selected to display timetable.");
        setLoading(false);
        return;
      }
      try {
        const subjects = await getStudentSubjects(childId);
        setStudentSubjects(subjects);
      } catch (err) {
        console.error("Failed to fetch timetable data:", err);
        setError("Error loading timetable for the child.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [childId]);

  const timetableGrid = useMemo(() => {
    const grid = {};
    DISPLAY_DAYS.forEach((day) => {
      grid[day] = TIME_PERIODS.map((period) => ({
        lessons: [],
        startTime: period.start,
        endTime: period.end,
        label: period.label,
        height: period.height,
      }));
    });

    studentSubjects.forEach((subject) => {
      if (subject.schedule && Array.isArray(subject.schedule)) {
        subject.schedule.forEach((scheduleItem) => {
          const { dayOfWeek, startTime } = scheduleItem;

          if (!DISPLAY_DAYS.includes(dayOfWeek)) return;

          const lessonStartMinutes = timeToMinutes(startTime);

          TIME_PERIODS.forEach((period, periodIndex) => {
            const periodStartMinutes = timeToMinutes(period.start);
            const periodEndMinutes = timeToMinutes(period.end);

            if (
              lessonStartMinutes >= periodStartMinutes &&
              lessonStartMinutes < periodEndMinutes
            ) {
              const currentLessonsInSlot = grid[dayOfWeek][periodIndex].lessons;
              const isAlreadyAdded = currentLessonsInSlot.some(
                (lesson) => lesson.dbSubjectName === subject.name
              );

              if (!isAlreadyAdded) {
                currentLessonsInSlot.push({
                  dbSubjectName: subject.name,
                  displaySubjectName: getSubjectDisplayName(subject.name),
                });
              }
            }
          });
        });
      }
    });
    return grid;
  }, [studentSubjects]);

  const hasLessons = useMemo(() => {
    if (loading) return false;
    for (const day of DISPLAY_DAYS) {
      if (timetableGrid[day]) {
        for (const periodSlot of timetableGrid[day]) {
          if (
            periodSlot.lessons.length > 0 ||
            periodSlot.label === "Recess" ||
            periodSlot.label === "Lunch Time"
          )
            return true;
        }
      }
    }
    return false;
  }, [timetableGrid, loading]);

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-[400px]">
        <CircularProgress size={40} />
        <Typography variant="h6" className="ml-2">
          Loading timetable...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" className="m-2">
        <Typography variant="h6">Error</Typography>
        <Typography>{error}</Typography>
      </Alert>
    );
  }

  if (!hasLessons) {
    return (
      <Alert severity="info" className="m-2">
        <Typography variant="h6">No Timetable Data</Typography>
        <Typography>
          No registered subjects or no schedule found for this child.
        </Typography>
      </Alert>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border-b border-gray-200">
          <thead className="bg-grayblue1">
            <tr>
              <th className="w-[80px] px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider bg-white"></th>
              {DISPLAY_DAYS.map((day) => (
                <th
                  key={day}
                  className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {TIME_PERIODS.map((period, periodIndex) => (
              <tr key={period.label}>
                <td
                  className={`w-[80px] px-2 py-1 whitespace-nowrap text-center text-xs font-normal text-primeblack border-r border-gray2 bg-blue1
                          ${period.height || "h-[72px]"}`}
                >
                  {" "}
                  {formatTime(period.start)} - {formatTime(period.end)}
                </td>

                {DISPLAY_DAYS.map((day, dayIndex) => {
                  const periodSlot = timetableGrid[day]?.[periodIndex];
                  const hasLessonInSlot = periodSlot?.lessons.length > 0;
                  if (
                    periodSlot.label === "Recess" ||
                    periodSlot.label === "Lunch Time"
                  ) {
                    if (dayIndex === 0) {
                      return (
                        <td
                          key={`${day}-${periodIndex}`}
                          colSpan={DISPLAY_DAYS.length}
                          className={`px-2 py-1 text-center bg-gray1 text-primeblack font-semibold align-middle border-r border-gray2
                          ${periodSlot.height || "h-[72px]"}`}
                        >
                          {periodSlot.label}{" "}
                        </td>
                      );
                    }
                    return null;
                  }

                  return (
                    <td
                      key={`${day}-${periodIndex}`}
                      className={`px-2 py-1 text-center align-middle
                      ${periodSlot.height || "h-[72px]"}
                      ${
                        hasLessonInSlot ? "bg-white" : "bg-white"
                      } border-r border-gray-200`}
                    >
                      {hasLessonInSlot &&
                        periodSlot.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={`${day}-${periodIndex}-${lessonIndex}`}
                            className="rounded-md p-1.5 text-center text-xs font-semibold leading-tight mb-1 bg-white text-primeblack"
                          >
                            {lesson.displaySubjectName}
                          </div>
                        ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ParentChildTimetable;
