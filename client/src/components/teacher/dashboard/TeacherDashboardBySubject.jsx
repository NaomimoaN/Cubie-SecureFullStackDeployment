// client/src/components/content/TeacherDashboardBySubject.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Grid, Card, CardContent, Typography } from "@mui/material";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import DB_SubmissionStatsChart from "../../analytics/DB_SubmissionStatsChart";
import SubjectBarChart from "../../analytics/SubjectBarChart";
import SubjectDonutPieChart from "../../analytics/SubjectDonutPieChart";
import SubjectCoreCompetencies from "../../analytics/SubjectCoreCompetencies";
import CoreComAvarageRadarChart from "../../analytics/CoreComAvarageRadarChart";
import DB_WeeklyAttendanceChart from "../../analytics/DB_WeeklyAttendanceChart";

/**
 * Displays detailed information for a specific subject for teachers.
 * It ensures the sub-sidebar (subject list) remains visible.
 */
function TeacherDashboardBySubject({ user }) {
  const { subjectId } = useParams();
  const { setSubSidebarConfig } = useSubSidebar();
  const [subjectDetails, setSubjectDetails] = useState(null);

  useEffect(() => {
    const actualSubjects = user.assignedSubjects;
    setSubSidebarConfig({
      type: "teacherDashboardSubjectList", // 正しいタイプに変更
      data: {
        subjects: actualSubjects,
        basePath: "/teacher/dashboard",
      },
    });

    // weekly-overviewの場合は特別処理
    if (subjectId === "weekly-overview") {
      setSubjectDetails({ name: "Weekly Overview", isWeeklyOverview: true });
      return;
    }

    // core-competencies-overviewの場合は特別処理
    if (subjectId === "core-competencies-overview") {
      // Core Competencies専用のサブサイドバー設定
      const coreCompetenciesSubjects = [
        { _id: "core-competencies-overview", name: "Overview" },
        { _id: "core-comp-math", name: "Mathematics" },
        { _id: "core-comp-science", name: "Science" },
        { _id: "core-comp-language-arts", name: "Language Arts" },
        { _id: "core-comp-social-studies", name: "Social Studies" },
        { _id: "core-comp-adst", name: "ADST" },
      ];

      setSubSidebarConfig({
        type: "coreCompetenciesSubjectList",
        data: {
          subjects: coreCompetenciesSubjects,
          basePath: "/teacher/dashboard",
        },
      });

      setSubjectDetails({
        name: "Core Competencies Overview",
        isCoreCompetenciesOverview: true,
      });
      return;
    }

    // weekly-attendance-overviewの場合は特別処理（サブサイドバー非表示）
    if (subjectId === "weekly-attendance-overview") {
      setSubSidebarConfig(null); // サブサイドバーを非表示
      setSubjectDetails({
        name: "Weekly Attendance Overview",
        isWeeklyAttendanceOverview: true,
      });
      return;
    }

    // Core Competencies科目別の場合は特別処理
    if (subjectId.startsWith("core-comp-")) {
      const subjectNameMapping = {
        "core-comp-math": "Math",
        "core-comp-science": "Science",
        "core-comp-language-arts": "Language Arts",
        "core-comp-social-studies": "Social Studies",
        "core-comp-adst": "ADST",
      };

      const subjectName = subjectNameMapping[subjectId];
      if (subjectName) {
        // Core Competencies専用のサブサイドバー設定を維持
        const coreCompetenciesSubjects = [
          { _id: "core-competencies-overview", name: "Overview" },
          { _id: "core-comp-math", name: "Mathematics" },
          { _id: "core-comp-science", name: "Science" },
          { _id: "core-comp-language-arts", name: "Language Arts" },
          { _id: "core-comp-social-studies", name: "Social Studies" },
          { _id: "core-comp-adst", name: "ADST" },
        ];

        setSubSidebarConfig({
          type: "coreCompetenciesSubjectList",
          data: {
            subjects: coreCompetenciesSubjects,
            basePath: "/teacher/dashboard",
          },
        });

        setSubjectDetails({
          name: subjectName,
          isCoreCompetenciesSubject: true,
        });
        return;
      }
    }

    const selectedSubject = actualSubjects.find((sub) => sub._id === subjectId);
    if (selectedSubject) {
      setSubjectDetails(selectedSubject);
    } else {
      setSubjectDetails(null);
      console.warn(
        "TeacherDashboardBySubject: Subject details not found for ID:",
        subjectId
      );
    }
  }, [subjectId, user, setSubSidebarConfig]);

  // Weekly Overviewの場合は統計チャートのみを表示
  if (subjectDetails?.isWeeklyOverview) {
    return (
      <div className="h-full flex-1 overflow-auto bg-gray-50">
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h1"
            fontSize={22}
            fontWeight={500}
            component="h4"
            mb={2}
            gutterBottom
          >
            Weekly Overview
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {/* <Grid item xs={12} md={8}>
              <Card elevation={3} sx={{ height: 600 }}>
                <CardContent sx={{ height: "100%", width: "100%" }}> */}
            <DB_SubmissionStatsChart showTitle={false} />
            {/* </CardContent>
              </Card>
            </Grid> */}
          </Grid>
        </Box>
      </div>
    );
  }

  // Core Competencies Overviewの場合はCore Competenciesチャートのみを表示
  if (subjectDetails?.isCoreCompetenciesOverview) {
    return (
      <div className="h-full flex-1 overflow-auto bg-gray-50">
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h1"
            fontSize={22}
            fontWeight={500}
            component="h4"
            mb={2}
            gutterBottom
          >
            Student Performance
          </Typography>

          <div>
            <Grid item xs={12} md={10}>
              <Card elevation={3} sx={{ height: 450 }}>
                <CardContent sx={{ height: "100%" }}>
                  {/* <Typography variant="h6" gutterBottom color="primary">
                    Core Competencies Analysis {">"}
                  </Typography> */}
                  <CoreComAvarageRadarChart showTitle={false} />
                </CardContent>
              </Card>
            </Grid>
          </div>
        </Box>
      </div>
    );
  }

  // Core Competencies科目別表示の場合
  if (subjectDetails?.isCoreCompetenciesSubject) {
    return (
      <div className="h-full flex-1 overflow-auto bg-gray-50">
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h1"
            fontSize={22}
            fontWeight={500}
            component="h4"
            mb={2}
            gutterBottom
          >
            {subjectDetails.name} - Core Competencies
          </Typography>

          <Card elevation={3} sx={{ height: 450 }}>
            <CardContent sx={{ height: "100%" }}>
              {/* <Typography variant="h6" gutterBottom color="primary">
                🎯 {subjectDetails.name} Core Competencies Analysis
              </Typography> */}
              <SubjectCoreCompetencies subjectName={subjectDetails.name} />
            </CardContent>
          </Card>
        </Box>
      </div>
    );
  }

  // Weekly Attendance Overviewの場合は出席チャートのみを表示（サブサイドバーなし）
  if (subjectDetails?.isWeeklyAttendanceOverview) {
    return (
      <div className="h-full flex-1 overflow-auto bg-gray-50">
        <Box sx={{ p: 3, height: "100%" }}>
          <Typography
            variant="h1"
            fontSize={22}
            fontWeight={500}
            component="h4"
            mb={2}
            gutterBottom
          >
            Attendance Summary
          </Typography>

          <Box sx={{ height: "calc(100vh - 150px)" }}>
            <DB_WeeklyAttendanceChart height={500} showTitle={false} />
          </Box>
        </Box>
      </div>
    );
  }

  // 通常の科目別ダッシュボード
  return (
    <div className="h-full flex-1 overflow-auto bg-gray-50">
      <Box sx={{ p: 3 }}>
        {/* ページタイトル */}
        <Typography
          variant="h1"
          fontSize={22}
          fontWeight={500}
          component="h4"
          mb={2}
          gutterBottom
        >
          {subjectDetails?.name || "Loading..."}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {/*  performance analysis for {subjectDetails?.name} */}
        </Typography>

        <Box sx={{ display: "flex", gap: 3, height: "100%" }}>
          {/* Bar Chart - 35% */}
          <Box sx={{ width: "39%", height: "100%" }}>
            <Card elevation={3} sx={{ height: "100%" }}>
              {/* <CardContent> */}
              {/* <Typography variant="h6" gutterBottom>
                  📊 {subjectDetails?.name} Submission Trends
                </Typography> */}
              <SubjectBarChart subjectName={subjectDetails?.name} />
              {/* </CardContent> */}
            </Card>
          </Box>

          {/* Donut Chart - 65% */}
          <Box sx={{ width: "61%", height: "100%" }}>
            <Card elevation={3} sx={{ height: "100%" }}>
              {/* <CardContent> */}
              {/* <Typography variant="h6" gutterBottom>
                  🍩 {subjectDetails?.name} Distribution
                </Typography> */}
              <SubjectDonutPieChart
                subjectName={subjectDetails?.name || "Math"}
              />
              {/* </CardContent> */}
            </Card>
          </Box>
        </Box>
      </Box>
    </div>
  );
}

export default TeacherDashboardBySubject;
