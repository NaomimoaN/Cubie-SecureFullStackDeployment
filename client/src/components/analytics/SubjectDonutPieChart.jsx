import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { getSubjectDonutChartData } from "../../services/teacherDashboardService";
import { api } from "../../services/api";
import { Box, Typography, Paper, CircularProgress, Alert } from "@mui/material";

const SubjectDonutPieChart = ({ subjectName = "Math" }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);

  // メモ化されたドーナツチャートの色設定
  const colors = useMemo(
    () => ({
      Emerging: "#BDDFFF",
      Developing: "#9ACEFF",
      Proficient: "#66A7F5",
      Extending: "#317CD8",
    }),
    []
  );

  // メモ化された色の配列
  const COLORS = useMemo(
    () => [
      colors.Emerging,
      colors.Developing,
      colors.Proficient,
      colors.Extending,
    ],
    [colors]
  );

  const fetchSubmissionStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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

      const data = await getSubjectDonutChartData();
      setStatsData(data);
    } catch (err) {
      console.error(`${subjectName} grade data fetch failed:`, err);
      setError(err.message || `${subjectName} grade data fetch failed.`);
    } finally {
      setLoading(false);
    }
  }, [subjectName]);

  useEffect(() => {
    fetchSubmissionStats();
  }, [fetchSubmissionStats]);

  // メモ化されたデータ変換
  const chartData = useMemo(() => {
    if (!statsData?.data || !currentWeek) {
      return [];
    }

    // 今週の指定科目データを取得
    const currentWeekSubjects = statsData.data.subjects || [];

    const subjectData = currentWeekSubjects.find(
      (s) => s.subjectName === subjectName
    );

    if (!subjectData) {
      return [];
    }

    // 新しいAPIでは成績評価レベルデータを直接取得
    const gradeStats = {
      Emerging: subjectData.Emerging || 0,
      Developing: subjectData.Developing || 0,
      Proficient: subjectData.Proficient || 0,
      Extending: subjectData.Extending || 0,
    };

    // チャートデータに変換（件数が0でないもののみ）
    const result = Object.keys(gradeStats)
      .map((level) => ({
        name: level,
        value: gradeStats[level],
        color: colors[level] || "#8884d8",
      }))
      .filter((item) => item.value > 0); // データがある評価レベルのみ

    return result;
  }, [statsData, currentWeek, subjectName, colors]);

  // メモ化されたカスタムツールチップ
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper
          sx={{
            p: 2,
            maxWidth: 250,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" color="primary">
            {data.name}
          </Typography>
          <Typography variant="body2">Students: {data.value}</Typography>
        </Paper>
      );
    }
    return null;
  }, []);

  // メモ化されたカスタムラベル
  const renderCustomLabel = useCallback(
    ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
          fontSize={12}
          fontWeight="bold"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    },
    []
  );

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
          Loading {subjectName} grade statistics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, height: 500, width: "100%" }}>
        <Typography
          variant="h3"
          fontSize={16}
          fontWeight={400}
          textAlign="center"
          gutterBottom
        >
          Grade Distribution {currentWeek && `(W ${currentWeek})`}
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
        <Typography
          variant="h3"
          fontSize={16}
          fontWeight={400}
          textAlign="center"
          gutterBottom
        >
          Grade Distribution {currentWeek && `(W ${currentWeek})`}
        </Typography>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="calc(100% - 60px)"
        >
          <Alert severity="info">
            No {subjectName} grade data found for{" "}
            {currentWeek ? `W ${currentWeek}` : "current week"}.
          </Alert>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 500, width: "100%" }}>
      <Typography
        variant="h3"
        fontSize={16}
        fontWeight={400}
        textAlign="center"
        gutterBottom
      >
        Grade Distribution {currentWeek && `(W ${currentWeek})`}
      </Typography>

      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={60}
            fill="#317CD8"
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* カスタム凡例 */}
      <div className="flex justify-center gap-2 flex-wrap">
        {chartData.map((entry, index) => (
          <div
            key={index}
            style={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: entry.color,
                borderRadius: 1,
              }}
            />
            <Typography variant="body2">
              {entry.name} ({entry.value})
            </Typography>
          </div>
        ))}
      </div>
    </Paper>
  );
};

export default React.memo(SubjectDonutPieChart);
