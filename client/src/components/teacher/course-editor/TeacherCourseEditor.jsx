// client/src/components/teacher/course-editor/TeacherCourseEditor.jsx

import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Outlet,
  Link,
  useParams,
  useLocation,
} from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import TeacherCourseContent from "./TeacherCourseContent";
import TeacherCourseHomework from "./TeacherCourseHomework";
import TeacherHomeworkInputForm from "./TeacherHomeworkInputForm";
import TeacherHomeworkDetail from "./TeacherHomeworkDetail";
import TeacherHomeworkPreviewPage from "./TeacherHomeworkPreviewPage";
import TeacherHomeworkEvaluationPage from "./TeacherHomeworkEvaluationPage";

// CourseEditorLayout is a layout with Content, Homework, and AI Practice tabs.
// Modified to accept hideCourseEditorTabs prop.
function CourseEditorLayout({ subjectId, hideCourseEditorTabs }) {
  const location = useLocation();
  const teacherCourseEditorBasePath = `/teacher/course-editor/${subjectId}`;

  // Helper function: Determines the class for the active tab.
  const getTabClasses = (pathEnd) => {
    const currentPath = location.pathname;
    let isActive = false;
    if (pathEnd === "content") {
      isActive =
        currentPath === teacherCourseEditorBasePath ||
        currentPath === `${teacherCourseEditorBasePath}/` ||
        currentPath === `${teacherCourseEditorBasePath}/content`;
    } else {
      isActive = currentPath.startsWith(
        `${teacherCourseEditorBasePath}/${pathEnd}`
      );
    }
    return isActive
      ? "text-sm text-blue2 h-[49px] border-b-4 border-blue2 font-semibold hover:bg-gray1"
      : "text-sm text-black h-[49px] hover:text-indigo-800 font-semibold hover:bg-gray1";
  };

  return (
    <div className="bg-white flex flex-col">
      {!hideCourseEditorTabs && (
        <nav className="flex-1 bg-white h-full w-full flex flex-col">
          <ul className="flex border-b-2">
            <li>
              <Link
                to={`${teacherCourseEditorBasePath}/content`}
                className={`${getTabClasses(
                  "content"
                )} w-[180px] h-[51px] flex items-center justify-center`}
              >
                Content
              </Link>
            </li>
            <li>
              <Link
                to={`${teacherCourseEditorBasePath}/homework`}
                className={`${getTabClasses(
                  "homework"
                )} w-[180px] h-[51px] flex items-center justify-center`}
              >
                Homework
              </Link>
            </li>
          </ul>
        </nav>
      )}
      <div className="p-6 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

function TeacherCourseEditor({ user }) {
  const { subjectId } = useParams();
  const { setSubSidebarConfig, hideSubSidebar, hideCourseEditorTabs } =
    useSubSidebar();
  const location = useLocation();

  useEffect(() => {
    if (hideSubSidebar) {
      setSubSidebarConfig(null);
    } else if (
      subjectId &&
      user &&
      user.assignedSubjects &&
      user.assignedSubjects.length > 0
    ) {
      const actualSubjects = user.assignedSubjects;
      setSubSidebarConfig({
        type: "teacherContentEditorSubjectList",
        data: {
          subjects: actualSubjects,
          basePath: `/teacher/course-editor`,
        },
      });
    }
    return () => {
      if (!hideSubSidebar) {
        setSubSidebarConfig(null);
      }
    };
  }, [subjectId, user, setSubSidebarConfig, hideSubSidebar]);

  return (
    <div className="main-area-layout bg-white h-full">
      <Routes>
        <Route
          path=""
          element={
            <CourseEditorLayout
              subjectId={subjectId}
              hideCourseEditorTabs={hideCourseEditorTabs}
            />
          }
        >
          <Route index element={<TeacherCourseContent user={user} />} />
          <Route
            path="content/*"
            element={<TeacherCourseContent user={user} />}
          />
          <Route path="homework/*">
            <Route index element={<TeacherCourseHomework user={user} />} />
            <Route
              path="create"
              element={<TeacherHomeworkInputForm user={user} />}
            />
            <Route
              path=":homeworkId"
              element={<TeacherHomeworkDetail user={user} />}
            />
            <Route
              path=":homeworkId/edit"
              element={<TeacherHomeworkInputForm user={user} />}
            />
            <Route
              path="preview"
              element={<TeacherHomeworkPreviewPage user={user} />}
            />
            <Route
              path=":homeworkId/evaluate/:submissionId?"
              element={<TeacherHomeworkEvaluationPage user={user} />}
            />
          </Route>
          <Route path="ai-practice/*">AI Practice</Route>
        </Route>
      </Routes>
    </div>
  );
}

export default TeacherCourseEditor;
