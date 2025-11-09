// client/src/components/content/TeacherDashboardMainPage.jsx

// This page is displayed after login directly
import React, { useEffect } from "react";
import { Box, Grid, Card, CardContent, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import CoreComAvarageRadarChart from "../../analytics/CoreComAvarageRadarChart";
import DB_SubmissionStatsChart from "../../analytics/DB_SubmissionStatsChart";
import DB_WeeklyAttendanceChart from "../../analytics/DB_WeeklyAttendanceChart";

/**
 * Displays the main dashboard content for teachers.
 * It sets the sub-sidebar to display a subject list overview using actual assigned subjects
 * and shows analytics charts for class overview.
 */

function TeacherDashboardMainPage({ user }) {
  const { setSubSidebarConfig } = useSubSidebar();
  const navigate = useNavigate();

  // カードクリック時のハンドラー
  const handleStatsCardClick = () => {
    navigate("/teacher/dashboard/weekly-overview");
  };

  const handleCoreCompetenciesCardClick = () => {
    navigate("/teacher/dashboard/core-competencies-overview");
  };

  const handleWeeklyAttendanceCardClick = () => {
    navigate("/teacher/dashboard/weekly-attendance-overview");
  };

  useEffect(() => {
    // メインダッシュボードではサブサイドバーを非表示にする
    setSubSidebarConfig(null);

    return () => {
      setSubSidebarConfig(null);
    };
  }, [setSubSidebarConfig]);

  return (
    <div className="h-full flex-1 overflow-auto bg-gray-50">
      <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
        {/* ページタイトル */}
        <Typography
          variant="h1"
          fontSize={26}
          fontWeight={500}
          component="h4"
          mb={2}
          gutterBottom
        >
          Dashboard
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            height: "calc(100vh - 100px)",
            minHeight: "700px",
            overflow: "auto",
          }}
        >
          {/* 左半分: 提出統計チャート */}
          <Box sx={{ flex: 1 }}>
            <Card
              sx={{
                height: "98.5%",
                cursor: "pointer",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: 3,
                },
                p: 0,
              }}
              onClick={handleStatsCardClick}
            >
              <DB_SubmissionStatsChart />
            </Card>
          </Box>

          {/* 右半分: 週間出席状況チャートとCore Competencies */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              overflow: "hidden",
            }}
          >
            {/* 週間出席状況チャート */}
            <Card
              elevation={2}
              sx={{
                height: "48%",
                minHeight: "320px",
                cursor: "pointer",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: 3,
                },
                p: 0,
              }}
              onClick={handleWeeklyAttendanceCardClick}
            >
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ flex: 1, minHeight: "280px" }}>
                  <DB_WeeklyAttendanceChart showTitle={true} />
                </Box>
              </Box>
            </Card>

            {/* Core Competencies レーダーチャート */}
            <Card
              elevation={3}
              sx={{
                height: "48%",
                minHeight: "320px",
                cursor: "pointer",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: 3,
                },
                p: 0,
              }}
              onClick={handleCoreCompetenciesCardClick}
            >
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ flex: 1, minHeight: "280px" }}>
                  <CoreComAvarageRadarChart />
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>
      </Box>
    </div>
  );
}

export default TeacherDashboardMainPage;
