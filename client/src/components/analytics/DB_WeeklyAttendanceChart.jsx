/**
 * @purpose 今週（Week 39）の5日分の出席率を折れ線グラフで表示するコンポーネント
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getWeeklyAttendanceStats } from "../../services/analyticsService";
import useAuth from "../../hooks/useAuth";

const DB_WeeklyAttendanceChart = ({ height = 280, showTitle = true }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWeeklyStats();
  }, []);

  const fetchWeeklyStats = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getWeeklyAttendanceStats();
      setData(response.data);
    } catch (err) {
      console.error("Error fetching weekly attendance statistics:", err);
      setError(err.message || "Failed to fetch weekly attendance statistics.");
    } finally {
      setLoading(false);
    }
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            p: 2,
            boxShadow: 2,
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          <Typography variant="body2" color="primary">
            Attendance Rate: {payload[0].value}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Present: {data.presentStudents} / Total: {data.totalStudents}
          </Typography>
          <Typography variant="body2" color="error">
            Absent: {data.absentStudents}
          </Typography>
          <Typography variant="body2" color="warning.main">
            Late: {data.lateStudents}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading weekly attendance statistics...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, height: "100%", width: "100%" }}>
        <Box sx={{ p: 1 }}>
          {showTitle && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Attendance Summary
              </Typography>
            </Box>
          )}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="calc(100% - 60px)"
          >
            <Alert severity="info">No data yet for this division</Alert>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!data || !data.dailyStats || data.dailyStats.length === 0) {
    return (
      <Box sx={{ p: 2, height: "100%", width: "100%" }}>
        <Box sx={{ p: 1 }}>
          {showTitle && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Attendance Summary
              </Typography>
            </Box>
          )}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="calc(100% - 60px)"
          >
            <Alert severity="info">No attendance data this week.</Alert>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: "100%", width: "100%" }}>
      <Box sx={{ p: 1 }}>
        {/* タイトルの表示/非表示を制御 */}
        {showTitle && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Attendance Summary
            </Typography>
          </Box>
        )}

        {/* 折れ線グラフ */}
        <Box sx={{ width: "100%", height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.dailyStats}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                angle={0}
                textAnchor="middle"
                height={60}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{
                  value: "Attendance Rate",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Legendを削除してチャート下のラベルを非表示 */}
              <Line
                type="monotone"
                dataKey="attendanceRate"
                stroke="#33BD88"
                strokeWidth={3}
                dot={{
                  // fill: "#33BD88",
                  stroke: "#33BD88",
                  strokeWidth: 2,
                  r: 6,
                }}
                activeDot={{ r: 8, stroke: "#33BD88", strokeWidth: 2 }}
                name="Attendance Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default DB_WeeklyAttendanceChart;
