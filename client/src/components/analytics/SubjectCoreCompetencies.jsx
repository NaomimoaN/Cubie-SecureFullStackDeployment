import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Grid,
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
import { getCoreCompetenciesForChart } from "../../services/teacherDashboardService";
import { api } from "../../services/api";

const SubjectCoreCompetencies = ({ subjectName = "Math" }) => {
  // 科目ごとの色設定
  const getSubjectColor = (subject) => {
    const colorMap = {
      Math: "#E8DA53", // 赤系
      Mathematics: "#E8DA53", // 赤系
      Science: "#FE674D", // シアン系
      "Language Arts": "#BDDFFF", // 青系
      "Social Studies": "#FFA237", // 緑系
      ADST: "#EEACD9", // 黄色系
    };
    return colorMap[subject] || "#1976d2"; // デフォルト色
  };

  const subjectColor = getSubjectColor(subjectName);
  const [rubricData, setRubricData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);

  const fetchRubricData = useCallback(async () => {
    try {
      setLoading(true);

      // 現在の週を取得
      try {
        const currentWeekResponse = await api.get(
          "/api/analytics/current-week"
        );
        const weekNumber = currentWeekResponse.data.data.week;
        setCurrentWeek(weekNumber);
      } catch (error) {
        console.error("Failed to fetch current week:", error);
        setCurrentWeek(null);
      }

      const response = await getCoreCompetenciesForChart();

      if (response?.data?.subjects) {
        // 指定された科目を見つける
        const targetSubject = response.data.subjects.find(
          (subject) => subject.subjectName === subjectName
        );

        if (targetSubject?.averages) {
          const rubricScores = targetSubject.averages;

          // レーダーチャート用のデータ形式に変換
          const chartData = [
            {
              skill: "Communication",
              score: rubricScores.communication || 0,
              fullMark: 100,
            },
            {
              skill: "Creative Thinking",
              score: rubricScores.creativeThinking || 0,
              fullMark: 100,
            },
            {
              skill: "Critical Thinking",
              score: rubricScores.criticalThinking || 0,
              fullMark: 100,
            },
            {
              skill: "Identity",
              score: rubricScores.identity || 0,
              fullMark: 100,
            },
            {
              skill: "Responsibility",
              score: rubricScores.responsibility || 0,
              fullMark: 100,
            },
            {
              skill: "Social Responsibility",
              score: rubricScores.socialResponsibility || 0,
              fullMark: 100,
            },
          ];

          setRubricData({
            chartData,
            originalData: targetSubject.averages,
            totalStudents: 0, // 新しいAPIではこの情報がないため
            coverageRate: 0, // 新しいAPIではこの情報がないため
          });
        } else {
          setError(`Cannot find rubric scores for ${subjectName} subject`);
        }
      } else {
        setError("Cannot find statistics data");
      }
    } catch (err) {
      console.error(`${subjectName} rubric data fetch error:`, err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [subjectName]);

  useEffect(() => {
    fetchRubricData();
  }, [fetchRubricData]);

  // メモ化されたカスタムツールチップ
  const CustomTooltip = useCallback(
    ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        const data = payload[0];
        return (
          <Paper
            elevation={3}
            sx={{
              p: 2,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: `2px solid ${subjectColor}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: subjectColor }}>
              {label}
            </Typography>
            <Typography variant="body2">
              Average Score: <strong>{data.value.toFixed(2)}</strong>/100
            </Typography>
          </Paper>
        );
      }
      return null;
    },
    [subjectColor]
  );

  // メモ化されたスコアの色を決定する関数
  const getScoreColor = useCallback((score) => {
    if (score >= 80) return "#4caf50"; // Green
    if (score >= 60) return "#ff9800"; // Orange
    if (score >= 40) return "#f44336"; // Red
    return "#9e9e9e"; // Gray
  }, []);

  // メモ化された総合評価を計算
  const overallRating = useMemo(() => {
    if (!rubricData?.chartData) return { label: "No Data", color: "#9e9e9e" };

    const average =
      rubricData.chartData.reduce((sum, item) => sum + item.score, 0) /
      rubricData.chartData.length;

    if (average >= 80) return { label: "Excellent", color: "#4caf50" };
    if (average >= 70) return { label: "Good", color: "#8bc34a" };
    if (average >= 60) return { label: "Satisfactory", color: "#ff9800" };
    if (average >= 50) return { label: "Needs Improvement", color: "#f44336" };
    return { label: "Requires Attention", color: "#9e9e9e" };
  }, [rubricData]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={300}
          >
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading {subjectName} Core Competencies...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!rubricData) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            No rubric data available for {subjectName}.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div style={{ height: 400, width: "100%" }}>
      {/* <CardContent> */}
      {/* <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            {subjectName} - Core Competencies Radar Chart
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentWeek ? `Week ${currentWeek}` : "Current Week"} Average
            Scores for 6 Core Competency Areas
          </Typography>
        </Box> */}

      {/* 統計サマリー */}
      {/* <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" color="primary">
                {overallRating.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overall Rating
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" color="primary">
                {rubricData.totalStudents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Students Assessed
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6" color="primary">
                {rubricData.coverageRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Assessment Coverage
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: "center" }}>
              <Chip
                label={overallRating.label}
                sx={{
                  backgroundColor: overallRating.color,
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            </Paper>
          </Grid>
        </Grid> */}

      {/* レーダーチャート */}
      {/* <div style={{ height: 400, width: "100%" }}> */}
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={rubricData.chartData}
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
        >
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fontSize: 12, fill: "#666" }}
            className="radar-angle-axis"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#999" }}
            tickCount={5}
          />
          <Radar
            name={`${subjectName} Core Competencies`}
            dataKey="score"
            stroke={subjectColor}
            fill={subjectColor}
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{ fill: subjectColor, strokeWidth: 1, r: 4 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
        </RadarChart>
      </ResponsiveContainer>
      {/* </div> */}

      {/* 詳細スコア表 */}
      {/* <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detailed Scores
          </Typography>
          <Grid container spacing={1}>
            {rubricData.chartData.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderLeft: `4px solid ${getScoreColor(item.score)}`,
                  }}
                >
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {item.skill}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: getScoreColor(item.score),
                      fontWeight: "bold",
                      ml: 1,
                    }}
                  >
                    {item.score.toFixed(1)}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 2, display: "block" }}
        >
          * Scores range from 0-100. Green: Excellent (80+), Orange: Good
          (60-79), Red: Needs Improvement (40-59)
        </Typography> */}
      {/* </CardContent> */}
    </div>
  );
};

export default React.memo(SubjectCoreCompetencies);
