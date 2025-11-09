/**
 * @purpose　A component for students to view a list of their assigned subjects.
 * It fetches and displays each subject as a clickable card, showing the subject's name and a brief description, and handles loading and error states.
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStudentSubjects } from "../../../services/userSubjectService";
import useAuth from "../../../hooks/useAuth";

const SUBJECT_COLORS = {
  Math: "#BDDFFF",
  Science: "#FE674D",
  "Language Arts": "#E8DA53",
  "Social Studies": "#FFA237",
  ADST: "#EEACD9",
};

const MATHS_DISPLAY_NAME = "Maths";
const ADST_DISPLAY_NAME = "Applied Design, Skills, and Technologies(ADST)";

const StudentSubjectCardList = () => {
  const { user, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await getStudentSubjects();
        setSubjects(data);
      } catch (err) {
        console.error("Failed to fetch student subjects:", err);
        setError("Failed to load your subjects. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-500">
        Loading authentication data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md my-2">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Subjects</h2>
        <p className="text-red-500 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="ml-1 w-full h-full p-8 bg-white">
      <h2 className="text-3xl text-gray-800 mt-2 mb-14 ">Subjects</h2>

      {loading ? (
        <p className="text-gray-500">Loading subjects...</p>
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {subjects.map((subject) => {
            const backgroundColor = SUBJECT_COLORS[subject.name] || "#FFFFFF";
            const displayName =
              subject.name === "ADST"
                ? ADST_DISPLAY_NAME
                : subject.name === "Math"
                ? MATHS_DISPLAY_NAME
                : subject.name;

            return (
              <div
                key={subject._id}
                className="rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 relative pb-[95%]"
                style={{ backgroundColor: backgroundColor }}
              >
                <Link
                  to={`/student/subject/${subject._id}`}
                  className="absolute inset-0 flex flex-col px-6 py-10"
                >
                  <h3 className="text-black mb-2 text-base sm:text-[10px] md:text-[clamp(10px,calc(-5px_+_1.953125vw),20px)] lg:text-[20px]">
                    {displayName}
                  </h3>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">No subjects currently registered.</p>
      )}
    </div>
  );
};

export default StudentSubjectCardList;
