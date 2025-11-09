// client/src/components/student/subject/StudentSubjectDetail.jsx
/**
 * @purpose A component that displays detailed information for a specific subject, including its name, description, and class schedule.
 * It also serves as a layout for nested routes, allowing users to navigate between content, homeworks, and quizzes related to that subject.
 */

import React, { useState, useEffect } from "react";
import { useParams, Link, Outlet, useLocation } from "react-router-dom";
import { getSubjectById } from "../../../services/userSubjectService";
import useAuth from "../../../hooks/useAuth";

const StudentSubjectDetail = () => {
  const { user, loading: authLoading } = useAuth();
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();

  useEffect(() => {
    const fetchSubject = async () => {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await getSubjectById(subjectId);
        setSubject(data);
      } catch (err) {
        console.error(`Failed to fetch subject ${subjectId}:`, err);
        setError(
          "Failed to load subject details. It might not exist or you don't have access."
        );
      } finally {
        setLoading(false);
      }
    };

    if (subjectId) {
      fetchSubject();
    }
  }, [subjectId, authLoading, user]);

  const getTabClasses = (pathEnd) => {
    const currentPath = location.pathname;
    const subjectBasePath = `/student/subject/${subjectId}`;

    let isActive = false;
    if (pathEnd === "content") {
      isActive =
        currentPath === subjectBasePath ||
        currentPath === `${subjectBasePath}/` ||
        currentPath.startsWith(`${subjectBasePath}/content`);
    } else if (pathEnd === "homework") {
      isActive = currentPath.startsWith(`${subjectBasePath}/homework`);
    } else if (pathEnd === "quizzes") {
      isActive = currentPath.startsWith(`${subjectBasePath}/quizzes`);
    }

    return isActive
      ? "text-indigo-600 border-b-2 border-indigo-600 font-semibold pb-2"
      : "text-gray-600 hover:text-indigo-800 font-semibold pb-2";
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-500">
        Loading subject details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md my-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Subject Details
        </h2>
        <p className="text-red-500 mb-4">{error}</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-500">
        Subject not found.
      </div>
    );
  }
  return (
    // MARK: Adjusted for full height and proper content distribution
    // Changed from ml-1 to flex-1 and added flex-col to make it fill available height
    <div className="flex-1 bg-white h-full w-full flex flex-col">
      {/* Navigation */}
      <nav>
        <ul className="flex border-b-2">
          <li>
            <Link
              to="content"
              className={`${getTabClasses(
                "content"
              )} w-[180px] h-[51px] flex items-center justify-center`}
            >
              Content
            </Link>
          </li>
          <li>
            <Link
              to="homework"
              className={`${getTabClasses(
                "homework"
              )} w-[180px] h-[51px] flex items-center justify-center`}
            >
              Homeworks
            </Link>
          </li>
          <li>
            <Link
              to="quizzes"
              className={`${getTabClasses(
                "quizzes"
              )} w-[180px] h-[51px] flex items-center justify-center`}
            >
              AI Practice
            </Link>
          </li>
        </ul>
      </nav>
      {/* This Area shows content/homework/quizzes - MARK: Added flex-grow and overflow-hidden */}
      <div className="flex-grow overflow-hidden">
        <Outlet context={{ subjectId: subject._id }} />
      </div>
    </div>
  );
};

export default StudentSubjectDetail;
