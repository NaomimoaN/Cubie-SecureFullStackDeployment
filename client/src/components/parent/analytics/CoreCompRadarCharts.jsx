import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { getCoreCompetenciesBySubject } from "../../../services/parentCoreCompService";

// Core Competenciesのマッピング
const coreCompetencyMap = {
  communication: "Communication",
  creativeThinking: "Creative Thinking",
  criticalThinking: "Critical Thinking",
  identity: "Identity",
  responsibility: "Responsibility",
  socialResponsibility: "Social Responsibility",
};

// Subject名のマッピング
const subjectNameMap = {
  Math: "Mathematics",
  "Language Arts": "Language Arts",
  Science: "Science",
  ADST: "ADST",
  "Social Studies": "Social Studies",
};

// Core Competenciesの色分け
const coreCompColors = {
  communication: "#FF6B6B",
  creativeThinking: "#4ECDC4",
  criticalThinking: "#45B7D1",
  identity: "#96CEB4",
  responsibility: "#FFEAA7",
  socialResponsibility: "#DDA0DD",
};

const CoreCompRadarCharts = ({ selectedChildId = null, selectedTerm = 3 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedChildId, selectedTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getCoreCompetenciesBySubject(selectedTerm);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to fetch data");
      }
    } catch (err) {
      setError("Error fetching data");
      console.error("Error fetching core competencies data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Radar chart用のデータを準備する関数
  const prepareRadarData = (coreCompetencies) => {
    return Object.entries(coreCompetencies).map(([key, value]) => ({
      competency: coreCompetencyMap[key] || key,
      value: value,
      fullMark: 4, // 最大値を4と仮定
    }));
  };

  // スコアレベルの取得
  const getScoreLevel = (score) => {
    if (score >= 3.5) return { color: "primary" };
    if (score >= 2.5) return { color: "success" };
    if (score >= 1.5) return { color: "warning" };
    if (score > 0) return { lcolor: "error" };
    return { color: "default" };
  };

  // カスタムtooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const scoreInfo = getScoreLevel(data.value);
      return (
        <Box
          sx={{
            bgcolor: "background.paper",
            p: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {label}
          </Typography>
          <Typography variant="body2">
            Score: {data.value.toFixed(2)} / 100
          </Typography>
          {/* <Typography variant="body2" color={scoreInfo.color}>
            Level: {scoreInfo.level}
          </Typography> */}
        </Box>
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
        minHeight="200px"
      >
        <CircularProgress />
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

  if (!data || data.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No data to display
      </Alert>
    );
  }

  // Filter students based on selectedChildId
  const studentsToDisplay = selectedChildId
    ? data.filter(
        (student) => student.studentId.toString() === selectedChildId.toString()
      )
    : data;

  if (studentsToDisplay.length === 0) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        No data available for the selected child.
      </Alert>
    );
  }

  return (
    <div className=" rounded-2xl pt-7 pl-10 pb-4 bg-white">
      {/* // <Box sx={{ mt: 3 }}> */}
      <Typography variant="h5" gutterBottom fontSize={"1.25rem"}>
        {selectedChildId
          ? `Strength and Weakness `
          : `Strength and Weakness (All Children)
          `}
        {/* - Term ${selectedTerm} */}
      </Typography>

      {studentsToDisplay.map((student, studentIndex) => {
        const overallRadarData = prepareRadarData(
          student.overallCoreCompetencies
        );
        const overallAverage =
          Object.values(student.overallCoreCompetencies).reduce(
            (a, b) => a + b,
            0
          ) / Object.values(student.overallCoreCompetencies).length;

        return (
          <Box key={student.studentId} sx={{ mb: 4 }}>
            {/* 学生名タイトル */}
            {/* <Typography
              variant="h4"
              gutterBottom
              sx={{ color: "primary.main", fontWeight: "bold" }}
            >
              {student.studentName}
            </Typography> */}

            {/* 区切り線 */}
            {/* <Divider sx={{ mb: 3 }} /> */}

            {/* 総合レーダーチャート */}
            <div sx={{ mb: 4 }}>
              <CardContent>
                {/* <Typography variant="h5" gutterBottom align="center">
                  Strength and Weakness
                </Typography> */}

                {/* 総合評価チップ */}
                {/* <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <Chip
                    label={`Overall Average: ${overallAverage.toFixed(2)}`}
                    color={getScoreLevel(overallAverage).color}
                    variant="outlined"
                    size="large"
                  />
                  <Chip
                    label={`Level: ${getScoreLevel(overallAverage).level}`}
                    color={getScoreLevel(overallAverage).color}
                    size="large"
                  />
                </Box> */}

                {/* レーダーチャート */}
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={overallRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis
                      dataKey="competency"
                      tick={{ fontSize: 10 }}
                    />
                    <PolarRadiusAxis
                      angle={0}
                      domain={[0, 4]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Overall Score"
                      dataKey="value"
                      stroke="#BDDFFF"
                      fill="#BDDFFF"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* <Legend /> */}
                  </RadarChart>
                </ResponsiveContainer>

                {/* 統計テーブル */}
                {/* <TableContainer component={Paper} sx={{ mt: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Core Competency</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Score</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(student.overallCoreCompetencies).map(
                        ([key, value]) => {
                          const scoreInfo = getScoreLevel(value);
                          return (
                            <TableRow key={key}>
                              <TableCell>
                                {coreCompetencyMap[key] || key}
                              </TableCell>
                              <TableCell align="center">
                                {value.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )}
                    </TableBody>
                  </Table>
                </TableContainer> */}

                {/* メタ情報 */}
                {/* <Box
                  sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Total Submissions (All Subjects):{" "}
                    {student.totalSubmissionsAllSubjects}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on Term {selectedTerm} data from Mathematics, Language Arts,
                    Science, ADST, and Social Studies
                  </Typography>
                </Box> */}
              </CardContent>
            </div>

            {/* 科目別詳細（折りたたみ可能） */}
            {/* <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Subject Breakdown
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(student.subjects).map(
                    ([subjectName, subjectData]) => (
                      <Grid item xs={12} md={6} lg={4} key={subjectName}>
                        <Paper sx={{ p: 2, height: "100%" }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            gutterBottom
                          >
                            {subjectNameMap[subjectName] || subjectName}
                          </Typography>
                          <Box sx={{ mb: 1 }}>
                            {Object.entries(subjectData.coreCompetencies).map(
                              ([comp, score]) => (
                                <Box
                                  key={comp}
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 0.5,
                                  }}
                                >
                                  <Typography variant="body2">
                                    {coreCompetencyMap[comp]}:
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {score.toFixed(1)}
                                  </Typography>
                                </Box>
                              )
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Submissions: {subjectData.totalSubmissions} | Valid:{" "}
                            {subjectData.validSubmissions}
                          </Typography>
                        </Paper>
                      </Grid>
                    )
                  )}
                </Grid>
              </CardContent>
            </Card> */}
          </Box>
        );
      })}
      {/* </Box> */}
    </div>
  );
};

export default CoreCompRadarCharts;
