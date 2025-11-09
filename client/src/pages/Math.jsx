import React from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import SubjectBarChart from "../components/analytics/SubjectBarChart";
import SubjectDonutPieChart from "../components/analytics/SubjectDonutPieChart";

const SubjectAnalyticsPage = () => {
  const { subjectName } = useParams();

  // URLパラメータから科目名を取得、デフォルトは "Math"
  const displaySubjectName = subjectName || "Math";

  // 科目名を適切な表示形式に変換
  const formatSubjectName = (name) => {
    const subjectMap = {
      math: "Math",
      "language-arts": "Language Arts",
      science: "Science",
      "social-studies": "Social Studies",
      adst: "ADST",
    };
    return subjectMap[name] || name;
  };

  const formattedSubjectName = formatSubjectName(displaySubjectName);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* ページタイトル */}
        <Typography variant="h4" component="h1" gutterBottom>
          {formattedSubjectName} Analytics Dashboard
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {formattedSubjectName}科目の学習進捗とパフォーマンスを分析
        </Typography>

        <Grid container spacing={3}>
          {/* Bar Chart */}
          <Grid item xs={12} lg={8}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 {formattedSubjectName} Submission Trends
                </Typography>
                <SubjectBarChart subjectName={formattedSubjectName} />
              </CardContent>
            </Card>
          </Grid>

          {/* Donut Chart */}
          <Grid item xs={12} lg={4}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🍩 {formattedSubjectName} Distribution
                </Typography>
                <SubjectDonutPieChart subjectName="Math" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default SubjectAnalyticsPage;
