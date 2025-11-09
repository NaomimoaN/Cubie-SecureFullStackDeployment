import React, { useEffect, useMemo, useState } from "react";
// @mui/material からのインポートを削除
// import { Box, Typography, Paper, CircularProgress, Alert } from "@mui/material";

import { getStudentSubjects } from "../../../services/userSubjectService";

const DISPLAY_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const SHORT_DAYS_MAP = {
  Monday: "MON",
  Tuesday: "TUE",
  Wednesday: "WED",
  Thursday: "THU",
  Friday: "FRI",
};

const TIME_PERIODS = [
  { label: "1st Period", start: "09:20", end: "10:00" },
  { label: "2nd Period", start: "10:00", end: "10:40" },
  { label: "3rd Period", start: "11:00", end: "11:40" },
  { label: "4th Period", start: "11:40", end: "12:20" },
  { label: "5th Period", start: "13:30", end: "14:10" },
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

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
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

const SUBJECT_COLOR_MAP = {
  Math: "#B9DDFF",
  "Language Arts": "#FCF181",
  Science: "#FF8F7B",
  "Social Studies": "#FFC37F",
  ADST: "#FFCEF0",
};

const getSubjectDisplayName = (dbSubjectName) => {
  return SUBJECT_DISPLAY_NAME_MAP[dbSubjectName] || dbSubjectName;
};

const getSubjectColor = (dbSubjectName) => {
  if (SUBJECT_COLOR_MAP[dbSubjectName]) {
    return SUBJECT_COLOR_MAP[dbSubjectName];
  }
  console.warn(
    `Undefined subject name: "${dbSubjectName}" has no color assigned. Default color (#CCCCCC) will be applied.`
  );
  return "#CCCCCC";
};

function StudentTimetable({ user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentSubjects, setStudentSubjects] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const subjects = await getStudentSubjects();
        setStudentSubjects(subjects);
      } catch (err) {
        console.error("Failed to fetch timetable data:", err);
        setError("Error loading timetable.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "student") {
      fetchSubjects();
    } else {
      setLoading(false);
      setError("Not logged in as a student user.");
    }
  }, [user]);

  const timetableGrid = useMemo(() => {
    const grid = {};
    DISPLAY_DAYS.forEach((day) => {
      grid[day] = TIME_PERIODS.map((period) => ({
        lessons: [],
        startTime: period.start,
        endTime: period.end,
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
          if (periodSlot.lessons.length > 0) return true;
        }
      }
    }
    return false;
  }, [timetableGrid, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        {/* CircularProgress の代替 */}
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>

        <p className="text-xl font-semibold ml-2 text-gray-700">
          Loading timetable...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-2 p-4 rounded-md bg-red-100 border border-red-400 text-red-700">
        <p className="text-lg font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!hasLessons) {
    return (
      <div className="m-2 p-4 rounded-md bg-blue-100 border border-blue-400 text-blue-700">
        <p className="text-lg font-bold">No Timetable Data</p>
        <p>No registered subjects or no schedule found.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white p-6 ml-1">
      <h2 className="text-[26px] text-primeblack font-bold mb-4">Timetable</h2>
      <div className="p-2 overflow-x-auto text-primeblack bg-white">
        <div className="flex flex-nowrap min-w-[500px]">
          {/* <div className="w-[80px] p-2 bg-white font-bold text-center flex-shrink-0"></div> */}
          {DISPLAY_DAYS.map((day) => (
            <div
              key={day}
              className="flex-grow basis-1/5 p-2 bg-white font-bold text-center"
            >
              <p className="text-sm">
                {SHORT_DAYS_MAP[day] || day.toUpperCase()}
              </p>
            </div>
          ))}
        </div>

        {TIME_PERIODS.map((period, periodIndex) => (
          <div key={period.label} className="flex flex-nowrap">
            {/* <div className="w-[80px] h-[100px] p-2 flex-shrink-0 flex flex-col justify-center items-center bg-white text-primeblack text-center">
              <span className="text-xs">
                {formatTime(period.start)} - {formatTime(period.end)}
              </span>
            </div> */}

            {DISPLAY_DAYS.map((day, dayIndex) => {
              const periodSlot = timetableGrid[day]?.[periodIndex];
              const hasLessonInSlot = periodSlot?.lessons.length > 0;

              return (
                <div
                  key={`${day}-${periodIndex}`}
                  className={`flex-grow basis-1/5 flex flex-col justify-center items-center h-[100px]
                              ${hasLessonInSlot ? "bg-white" : "bg-white"}`}
                >
                  {hasLessonInSlot &&
                    periodSlot.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={`${day}-${periodIndex}-${lessonIndex}`}
                        className="rounded-xl p-3 w-[90%] h-[100px] mb-3 text-center shadow-lg font-normal leading-tight
                                 transition-transform duration-200 ease-in-out hover:-translate-y-1 flex flex-col justify-center items-center text-primeblack"
                        style={{
                          backgroundColor: getSubjectColor(
                            lesson.dbSubjectName
                          ),
                        }}
                      >
                        <span className="font-semibold leading-tight text-xs md:text-xs lg:text-lg">
                          {lesson.displaySubjectName}
                        </span>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentTimetable;
