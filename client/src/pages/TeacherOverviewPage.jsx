import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Divider,
} from "@mui/material";
import CoreComAvarageRadarChart from "../components/analytics/CoreComAvarageRadarChart";
import SubjectDonutPieChart from "../components/analytics/SubjectDonutPieChart";
import DB_SubmissionStatsChart from "../components/analytics/DB_SubmissionStatsChart";
import DB_WeeklyAttendanceChart from "../components/analytics/DB_WeeklyAttendanceChart";

const TeacherOverviewPage = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* ページタイトル */}
        <Typography variant="h4" component="h1" gutterBottom>
          Teacher Dashboard Overview
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          あなたのクラスの学習状況を一目で確認できます
        </Typography>

        <Grid container spacing={3}>
          {/* Core Competencies レーダーチャート */}
          <Grid item xs={12} lg={8}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Core Competencies Analysis
                </Typography>
                <CoreComAvarageRadarChart />
              </CardContent>
            </Card>
          </Grid>

          {/* Social Studies ドーナツチャート */}
          <Grid item xs={12} lg={4}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Social Studies Analytics
                </Typography>
                <SubjectDonutPieChart subjectName="Social Studies" />
              </CardContent>
            </Card>
          </Grid>

          {/* 提出統計チャート */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📊 Submission Statistics
                </Typography>
                <DB_SubmissionStatsChart />
              </CardContent>
            </Card>
          </Grid>

          {/* 週間出席状況チャート */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📅 Weekly Attendance Summary
                </Typography>
                <DB_WeeklyAttendanceChart />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default TeacherOverviewPage;
