import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { getSubjectBarChartData } from "../../services/teacherDashboardService";
import { api } from "../../services/api";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
} from "@mui/material";

const SubjectBarChart = ({ subjectName = "Math" }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);

  // メモ化されたチャートの色設定
  const colors = useMemo(
    () => ({
      currentWeek: "#317CD8",
      lastWeek: "#33C58D",
      improvement: "#33C58D",
      decline: "#FF6B6B",
    }),
    []
  );

  const fetchSubmissionStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getSubjectBarChartData();
      setStatsData(data);

      // 現在の週を直接取得
      try {
        const currentWeekResponse = await api.get(
          "/api/analytics/current-week"
        );
        const weekNumber = currentWeekResponse.data.data.week;
        setCurrentWeek(`(W ${weekNumber})`);
      } catch (error) {
        console.error("Failed to fetch current week:", error);
        setCurrentWeek("");
      }
    } catch (err) {
      console.error(`${subjectName} submission statistics fetch failed:`, err);
      setError(err.message || "Submission statistics fetch failed.");
    } finally {
      setLoading(false);
    }
  }, [subjectName]);

  useEffect(() => {
    fetchSubmissionStats();
  }, [fetchSubmissionStats]);

  // メモ化されたデータ変換
  const chartData = useMemo(() => {
    if (!statsData?.data) return [];

    const currentWeekSubjects = statsData.data.currentWeek.stats || [];
    const lastWeekSubjects = statsData.data.lastWeek.stats || [];

    // 指定された科目のみを取得
    const subjectCurrentWeek = currentWeekSubjects.find(
      (s) => s.subjectName === subjectName
    );
    const subjectLastWeek = lastWeekSubjects.find(
      (s) => s.subjectName === subjectName
    );

    const currentRate = subjectCurrentWeek?.submissionRate || 0;
    const lastRate = subjectLastWeek?.submissionRate || 0;

    // 2本のバー用のデータ配列を作成
    return [
      {
        period: "Last Week",
        rate: Number(lastRate) || 0,
        homeworks: subjectLastWeek?.totalHomeworks || 0,
        color: colors.lastWeek,
      },
      {
        period: "This Week",
        rate: Number(currentRate) || 0,
        homeworks: subjectCurrentWeek?.totalHomeworks || 0,
        color: colors.currentWeek,
      },
    ];
  }, [statsData, subjectName, colors]);

  // メモ化されたカスタムツールチップ
  const CustomTooltip = useCallback(
    ({ active, payload, label }) => {
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
              {subjectName} - {label}
            </Typography>
            <Typography variant="body2">
              Submission Rate: {data.rate}% ({data.homeworks}HW)
              {data.rate === 0 && " - No data"}
            </Typography>
          </Paper>
        );
      }
      return null;
    },
    [subjectName]
  );

  // メモ化された改善/悪化の統計
  const improvementStats = useMemo(() => {
    if (!chartData.length) return { change: 0 };

    const thisWeek = chartData.find((item) => item.period === "This Week");
    const lastWeek = chartData.find((item) => item.period === "Last Week");

    if (thisWeek && lastWeek) {
      return { change: thisWeek.rate - lastWeek.rate };
    }
    return { change: 0 };
  }, [chartData]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading {subjectName} submission statistics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, height: 500, width: "100%" }}>
        <Typography variant="h3" fontSize={16} fontWeight={400} gutterBottom>
          Homework Submission Trend {currentWeek}
        </Typography>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="calc(100% - 60px)"
        >
          <Alert severity="info">No data yet for this division</Alert>
        </Box>
      </Paper>
    );
  }

  if (!chartData.length) {
    return (
      <Paper sx={{ p: 3, height: 500, width: "100%" }}>
        <Typography variant="h3" fontSize={16} fontWeight={400} gutterBottom>
          Homework Submission Trend {currentWeek}
        </Typography>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="calc(100% - 60px)"
        >
          <Alert severity="info">No {subjectName} submission statistics data found.</Alert>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 500, width: "100%" }}>
      <Typography variant="h3" fontSize={16} fontWeight={400} gutterBottom>
        Homework Submission Trend {currentWeek}
      </Typography>

      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={chartData}
          margin={{ top: 60, right: 30, left: 20, bottom: 0 }}
          barCategoryGap="20%"
          maxBarSize={100}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            angle={0}
            textAnchor="middle"
            height={80}
            fontSize={12}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            ticks={[0, 20, 40, 60, 80, 100]}
            allowDataOverflow={false}
            fontSize={14}
          />
          <Tooltip content={<CustomTooltip />} />

          <Bar
            dataKey="rate"
            name={`${subjectName} Submission Rate`}
            radius={[4, 4, 0, 0]}
            minPointSize={5}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* カスタム凡例 */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: colors.lastWeek,
              borderRadius: 1,
            }}
          />
          <Typography variant="body2">Last Week</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: colors.currentWeek,
              borderRadius: 1,
            }}
          />
          <Typography variant="body2">This Week</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default React.memo(SubjectBarChart);
