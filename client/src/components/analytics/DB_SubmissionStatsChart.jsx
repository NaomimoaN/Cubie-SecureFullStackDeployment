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
import { getSubmissionStatsForChart } from "../../services/teacherDashboardService";
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

const DB_SubmissionStatsChart = ({ showTitle = true }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(null);

  // チャートの色設定
  const colors = useMemo(
    () => ({
      currentWeek: "#317CD8",
      lastWeek: "#33C58D",
      improvement: "#33C58D",
      decline: "#FF6B6B",
    }),
    []
  );

  useEffect(() => {
    fetchSubmissionStats();
  }, []);

  const fetchSubmissionStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getSubmissionStatsForChart();
      setStatsData(data);
    } catch (err) {
      console.error("Failed to fetch submission statistics:", err);
      setError(err.message || "Failed to fetch submission statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  // メモ化されたデータ変換
  const chartData = useMemo(() => {
    if (!statsData?.data) return [];

    const currentWeekSubjects = statsData.data.currentWeek.stats || [];
    const lastWeekSubjects = statsData.data.lastWeek.stats || [];

    // 科目名のリストを作成（両週のデータを統合）
    const allSubjects = new Set([
      ...currentWeekSubjects.map((s) => s.subjectName),
      ...lastWeekSubjects.map((s) => s.subjectName),
    ]);

    return Array.from(allSubjects)
      .map((subjectName) => {
        const currentWeekData = currentWeekSubjects.find(
          (s) => s.subjectName === subjectName
        );
        const lastWeekData = lastWeekSubjects.find(
          (s) => s.subjectName === subjectName
        );

        const currentRate = currentWeekData?.submissionRate || 0;
        const lastRate = lastWeekData?.submissionRate || 0;

        const change = currentRate - lastRate;

        return {
          subject: subjectName,
          currentWeek: Number(currentRate) || 0,
          lastWeek: Number(lastRate) || 0,
          change: change,
          changePercentage:
            lastRate > 0 ? ((change / lastRate) * 100).toFixed(1) : null,
          currentWeekHomeworks: currentWeekData?.totalHomeworks || 0,
          lastWeekHomeworks: lastWeekData?.totalHomeworks || 0,
        };
      })
      .sort((a, b) => b.currentWeek - a.currentWeek);
  }, [statsData]);

  // メモ化されたカスタムツールチップ
  const CustomTooltip = useCallback(({ active, payload, label }) => {
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
            This week: {data.currentWeek}% ({data.currentWeekHomeworks} HW)
            {data.currentWeek === 0 && " - No data"}
          </Typography>
          <Typography variant="body2">
            Last week: {data.lastWeek}% ({data.lastWeekHomeworks} HW)
            {data.lastWeek === 0 && " - No data"}
          </Typography>
          {data.change !== 0 && (
            <Typography
              variant="body2"
              color={data.change > 0 ? "success.main" : "error.main"}
            >
              Change: {data.change > 0 ? "+" : ""}
              {data.change.toFixed(1)}%
              {data.changePercentage &&
                ` (${data.change > 0 ? "+" : ""}${data.changePercentage}%)`}
            </Typography>
          )}
          {data.change === 0 && (
            <Typography variant="body2" color="text.secondary">
              Change: No change
            </Typography>
          )}
        </Paper>
      );
    }
    return null;
  }, []);

  // メモ化された改善統計
  const improvementStats = useMemo(() => {
    if (!chartData.length) return { improved: 0, declined: 0, unchanged: 0 };

    return chartData.reduce(
      (acc, item) => {
        if (item.change > 1) acc.improved++;
        else if (item.change < -1) acc.declined++;
        else acc.unchanged++;
        return acc;
      },
      { improved: 0, declined: 0, unchanged: 0 }
    );
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
          Loading submission statistics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, height: 600, width: "100%", boxShadow: 0 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          {showTitle && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Homework progress
              </Typography>
            </Box>
          )}
        </Box>
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
      <Paper sx={{ p: 3, height: 600, width: "100%", boxShadow: 0 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          {showTitle && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Homework progress
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="calc(100% - 60px)"
        >
          <Alert severity="info">No submission statistics data found.</Alert>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 600, width: "100%", boxShadow: 0 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {showTitle && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Homework progress
            </Typography>
          </Box>
        )}
        <Box sx={{ ml: "auto" }}>
          <Typography
            variant="body1"
            align="right"
            fontSize={22}
            color="primary.main"
            fontWeight={600}
            lineHeight="1"
            gutterBottom
          >
            {statsData.data.currentWeek.stats.length > 0
              ? `${Math.round(
                  statsData.data.currentWeek.stats.reduce(
                    (sum, s) => sum + s.submissionRate,
                    0
                  ) / statsData.data.currentWeek.stats.length
                )}%`
              : "0%"}
            <br />
            <span style={{ fontSize: 16, color: "#090909", fontWeight: 400 }}>
              Submitted this week
            </span>
          </Typography>
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={chartData}
          margin={{ top: 40, right: 30, left: 20, bottom: 20 }}
          barCategoryGap="20%"
          maxBarSize={100}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="subject"
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
          <Legend />

          <Bar
            dataKey="lastWeek"
            name="Last week"
            fill={colors.lastWeek}
            radius={[2, 2, 0, 0]}
            minPointSize={5}
          />
          <Bar
            dataKey="currentWeek"
            name="This week"
            fill={colors.currentWeek}
            radius={[2, 2, 0, 0]}
            minPointSize={5}
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default React.memo(DB_SubmissionStatsChart);
