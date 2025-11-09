import React, { useState, useEffect } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { getCurrentWeekCoreCompetencies } from "../../services/coreCompetenciesService";
import { Box, Typography, Paper, CircularProgress, Alert } from "@mui/material";

const CoreComAvarageRadarChart = ({ showTitle = true }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radarData, setRadarData] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);

  useEffect(() => {
    fetchCoreCompetencies();
  }, []);

  const fetchCoreCompetencies = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getCurrentWeekCoreCompetencies();

      // デバッグ: APIレスポンスの内容を確認
      console.log("Core Competencies API Response:", response);
      console.log("Response data:", response.data);
      console.log(
        "Core competency averages:",
        response.data?.coreCompetencyAverages
      );

      // 現在の週を設定
      setCurrentWeek(response.data?.week);

      // レーダーチャート用にデータを変換
      const transformedData = transformDataForRadar(response.data || {});
      console.log("Transformed radar data:", transformedData);
      setRadarData(transformedData);
    } catch (err) {
      console.error("Core Competencies fetch failed:", err);

      // 認証エラーの場合の特別な処理
      if (err.response?.status === 401 || err.message?.includes("token")) {
        setError("Login is required. Please login and try again.");
      } else {
        setError(err.message || "Failed to fetch Core Competencies data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const transformDataForRadar = (data) => {
    console.log("transformDataForRadar input:", data);

    if (!data.coreCompetencyAverages) {
      console.log("No coreCompetencyAverages found, returning empty array");
      return [];
    }

    const averages = data.coreCompetencyAverages;
    console.log("Averages object:", averages);
    console.log("Averages keys:", Object.keys(averages));

    // データが空のオブジェクト{}の場合は空配列を返す
    if (Object.keys(averages).length === 0) {
      console.log("Averages object is empty, returning empty array");
      return [];
    }

    // Core Competenciesの日本語名マッピング
    const competencyNames = {
      communication: "Communication",
      creativeThinking: "Creative Thinking",
      criticalThinking: "Critical Thinking",
      identity: "Identity",
      responsibility: "Responsibility",
      socialResponsibility: "Social Responsibility",
    };

    // レーダーチャート用データ形式に変換
    const radarData = Object.keys(averages)
      .filter((key) => {
        const value = averages[key];
        const isValid =
          value !== null && value !== undefined && !isNaN(value) && value > 0;
        console.log(`Filtering ${key}: value=${value}, isValid=${isValid}`);
        return isValid;
      })
      .map((key) => {
        const mappedData = {
          competency: competencyNames[key] || key,
          englishName: key,
          average: Math.round(averages[key] * 10) / 10, // 小数点1桁まで
          fullMark: 100, // 最大値は100点
        };
        console.log(`Mapped data for ${key}:`, mappedData);
        return mappedData;
      });

    console.log("Final radar data:", radarData);

    // 有効なデータが1つもない場合は空配列を返す
    if (radarData.length === 0) {
      console.log("No valid data found after filtering, returning empty array");
      return [];
    }

    // 全ての値が0以下の場合も空配列を返す
    const allZeroOrNegative = radarData.every((item) => item.average <= 0);
    if (allZeroOrNegative) {
      console.log("All values are zero or negative, returning empty array");
      return [];
    }

    return radarData;
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
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
            {data.competency}
          </Typography>
          <Typography variant="body2">
            Average Score: {data.average} points
          </Typography>
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
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Core Competencies data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, height: 500, width: "100%" }}>
        {showTitle && (
          <Typography variant="h6" textAlign="left" sx={{ mb: 2 }}>
            Student Performance
          </Typography>
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
    );
  }

  if (!radarData || radarData.length === 0) {
    console.log("radarData is empty or null, showing no data message");
    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          height: "400px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8f9fa",
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {showTitle ? "Core Competencies" : "データなし"}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          現在の週のCore Competenciesデータがありません。
          <br />
          ホームワークの提出と採点が完了すると、ここにデータが表示されます。
        </Typography>
      </Paper>
    );
  }

  console.log("Rendering radar chart with data length:", radarData.length);

  return (
    <Box sx={{ p: 3, height: 500, width: "100%" }}>
      {console.log("Rendering chart container with data:", radarData)}
      {showTitle && (
        <Typography variant="h6" textAlign="left" sx={{ mb: -5 }}>
          Student Performance
          {/* {currentWeek && `(Week ${currentWeek})`} */}
        </Typography>
      )}

      <ResponsiveContainer width="100%" height="75%">
        <RadarChart
          data={radarData}
          margin={{ top: 0, right: 80, bottom: 20, left: 80 }}
        >
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis
            dataKey="competency"
            tick={{ fontSize: 12, fill: "#666" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#999" }}
          />
          <Radar
            name="Average Score"
            dataKey="average"
            stroke="#317CD8"
            fill="#317CD8"
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{ fill: "#317CD8", strokeWidth: 2, r: 4 }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* 統計情報 */}
      {/* <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Highest: {Math.max(...radarData.map((d) => d.average)).toFixed(1)}{" "}
          points
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Lowest: {Math.min(...radarData.map((d) => d.average)).toFixed(1)}{" "}
          points
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overall Average:{" "}
          {(
            radarData.reduce((sum, d) => sum + d.average, 0) / radarData.length
          ).toFixed(1)}
          points
        </Typography>
      </Box> */}
    </Box>
  );
};

export default CoreComAvarageRadarChart;
