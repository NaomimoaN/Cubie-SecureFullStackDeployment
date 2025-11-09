import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getScoresBySubject } from "../../../services/parentAnalyticsService";

const ScoreBySubjectBarChart = ({
  selectedChildId = null,
  selectedTerm = 3,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const response = await getScoresBySubject(selectedTerm);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching subject scores:", err);

        let errorMessage = "Failed to fetch subject scores";
        if (err.response?.status === 401) {
          errorMessage = "Authentication required. Please login as a parent.";
        } else if (err.response?.status === 403) {
          errorMessage = "Access denied. Parent role required.";
        } else if (err.response?.status === 404) {
          errorMessage =
            "API endpoint not found. Please check server configuration.";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [selectedTerm]);

  // Transform data for individual student with color information
  const transformDataForStudent = (student) => {
    return student.subjectScores.map((score) => ({
      subject: score.subject,
      averageScore: score.averageScore,
      totalSubmissions: score.totalSubmissions,
      fill: getScoreColor(score.averageScore),
    }));
  };

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 90) return "#317CD8"; // Green (Excellent)
    if (score >= 80) return "#317CD8"; // Blue (Good)
    if (score >= 70) return "#317CD8"; // Orange (Average)
    if (score > 0) return "#317CD8"; // Red (Needs Improvement)
    return "#E0E0E0"; // Gray (No Submission)
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper
          sx={{
            p: 2,
            maxWidth: 300,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" color="primary">
            {label}
          </Typography>
          <Typography variant="body2">
            Average Score: {data.averageScore} points
          </Typography>
          <Typography variant="body2">
            Submissions: {data.totalSubmissions} items
          </Typography>
          {data.averageScore === 0 && (
            <Typography variant="body2" color="text.secondary">
              No Submissions
            </Typography>
          )}
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading scores...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!data || !data.students || data.students.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No data available for chart display.
      </Alert>
    );
  }

  // Filter students based on selectedChildId
  const studentsToDisplay = selectedChildId
    ? data.students.filter(
        (student) => student.studentId.toString() === selectedChildId.toString()
      )
    : data.students;

  if (studentsToDisplay.length === 0) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        No data available for the selected child.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        p: 0,
        backgroundColor: "white",
        borderRadius: 5,
        // border: "1px solid #E0E0E0",
      }}
    >
      {/* Family overview - only show if displaying all children */}
      {/* {!selectedChildId && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" color="primary">
                  Number of Children
                </Typography>
                <Typography variant="h4">
                  {data.totalStudents} students
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" color="primary">
                  Family Overall Average
                </Typography>
                <Chip
                  label={`${data.familyOverallAverage} points`}
                  color={
                    data.familyOverallAverage >= 80
                      ? "success"
                      : data.familyOverallAverage >= 70
                      ? "warning"
                      : "error"
                  }
                  size="large"
                  sx={{ fontSize: "1.1rem", height: "40px" }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" color="primary">
                  Target Subjects
                </Typography>
                <Typography variant="body1">
                  {data.allSubjects.length} subjects
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )} */}

      {/* Individual student bar charts */}
      {studentsToDisplay.map((student, index) => {
        const studentChartData = transformDataForStudent(student);

        return (
          <div key={index} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom fontSize={"1.25rem"}>
                {/* {student.studentName}'s   - Term {data.term}*/}
                Score by Subject
              </Typography>
              {/* <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Overall Average
                  </Typography>
                  <Chip
                    label={`${student.overallAverage} points`}
                    color={
                      student.overallAverage >= 80
                        ? "success"
                        : student.overallAverage >= 70
                        ? "warning"
                        : "error"
                    }
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Submitted Subjects
                  </Typography>
                  <Typography variant="body1">
                    {student.submittedSubjects}/{student.totalSubjects} subjects
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Submissions
                  </Typography>
                  <Typography variant="body1">
                    {student.subjectScores.reduce(
                      (sum, score) => sum + score.totalSubmissions,
                      0
                    )}
                    items
                  </Typography>
                </Grid>
              </Grid> */}
            </Box>

            <ResponsiveContainer width="100%" height={420}>
              <BarChart
                data={studentChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="subject"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={0}
                  textAnchor="middle"
                  height={80}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Average Score",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="averageScore"
                  name="Average Score"
                  radius={[4, 4, 4, 4]}
                  barSize={40}
                >
                  {studentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Color legend */}
            {/* <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                size="small"
                sx={{ backgroundColor: "#33C58D", color: "white" }}
                label="90+ points (Excellent)"
              />
              <Chip
                size="small"
                sx={{ backgroundColor: "#317CD8", color: "white" }}
                label="80-89 points (Good)"
              />
              <Chip
                size="small"
                sx={{ backgroundColor: "#FFA726", color: "white" }}
                label="70-79 points (Average)"
              />
              <Chip
                size="small"
                sx={{ backgroundColor: "#FF6B6B", color: "white" }}
                label="Below 70 (Needs Improvement)"
              />
              <Chip
                size="small"
                sx={{ backgroundColor: "#E0E0E0", color: "black" }}
                label="No Submissions"
              />
            </Box> */}
          </div>
        );
      })}
    </Box>
  );
};

export default ScoreBySubjectBarChart;
