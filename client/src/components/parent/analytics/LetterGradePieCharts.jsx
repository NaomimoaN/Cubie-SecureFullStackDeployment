import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { getLetterGradesBySubject } from "../../../services/parentLetterGradeService";

// Letter Gradeの色分け
const gradeColors = {
  Emerging: "#BDDFFF", // 赤
  Developing: "#9ACEFF", // オレンジ
  Proficient: "#66A7F5", // 緑
  Extending: "#317CD8", // 青
};

// Subject名のマッピング（必要に応じて）
const subjectNameMap = {
  Math: "Mathematics",
  "Language Arts": "Language Arts",
  Science: "Science",
  ADST: "ADST",
  "Social Studies": "Social Studies",
};

const LetterGradePieCharts = ({ selectedChildId = null, selectedTerm = 3 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedChildId, selectedTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getLetterGradesBySubject(selectedTerm);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to fetch data");
      }
    } catch (err) {
      setError("Error fetching data");
      console.error("Error fetching letter grade data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Pie chart用のデータを準備する関数
  const preparePieData = (gradeDistribution) => {
    return Object.entries(gradeDistribution)
      .filter(([grade, count]) => count > 0)
      .map(([grade, count]) => ({
        name: grade,
        value: count,
        color: gradeColors[grade],
      }));
  };

  // カスタムtooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <Box
          sx={{
            bgcolor: "background.paper",
            p: 1,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Typography variant="body2">
            {data.name}: {data.value}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // 共通のLegendコンポーネント
  const CommonLegend = () => {
    const legendData = [
      { name: "Extending", color: gradeColors.Extending },
      { name: "Proficient", color: gradeColors.Proficient },
      { name: "Developing", color: gradeColors.Developing },
      { name: "Emerging", color: gradeColors.Emerging },
    ];

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mt: 2,
          pt: 2,
        }}
      >
        {legendData.map((entry, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: entry.color,
                borderRadius: "2px",
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: "0.75rem",
              }}
            >
              {entry.name}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // 平均Letter Gradeのチップ色を取得
  const getAverageGradeColor = (grade) => {
    switch (grade) {
      case "Extending":
        return "primary";
      case "Proficient":
        return "primary";
      case "Developing":
        return "primary";
      case "Emerging":
        return "primary";
      default:
        return "default";
    }
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
    <Box
      sx={{
        mt: 3,
        backgroundColor: "white",
        borderRadius: 5,
        pt: 3,
        pr: 3,
        // border: "1px solid #E0E0E0",
      }}
    >
      <Typography variant="h5" fontSize={"1.25rem"} pl={3} gutterBottom>
        {selectedChildId
          ? `Grade Distribution - Term ${selectedTerm}`
          : `Grade Distribution by Subject (All Children) - Term ${selectedTerm}`}
      </Typography>

      {studentsToDisplay.map((student, studentIndex) => (
        <Box key={student.studentId} sx={{ mb: 4 }}>
          {/* 生徒名タイトル */}
          {/* <Typography
              variant="h4"
              gutterBottom
              sx={{ color: "primary.main", fontWeight: "bold" }}
            >
              {student.studentName}
            </Typography> */}

          {/* 科目別のPie Chart */}
          <Card
            sx={{
              width: "100%",
              backgroundColor: "transparent",
              boxShadow: "none",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0px",
                }}
              >
                {Object.entries(student.subjects).map(
                  ([subjectName, subjectData]) => {
                    const pieData = preparePieData(
                      subjectData.gradeDistribution
                    );
                    const hasData = pieData.length > 0;

                    return (
                      <Box
                        key={subjectName}
                        sx={{
                          flex: "1 1 calc(20%)", // 5列表示、gap分を考慮
                          minWidth: "150px", // 最小幅を設定
                          maxWidth: "196px", // 最大幅を設定
                          px: 1, // 左右のpaddingをさらに減らす
                        }}
                      >
                        {/* 平均Letter Grade表示 */}
                        {/* <Box
                          sx={{
                            mb: 2,
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          {subjectData.averageLetterGrade ? (
                            <Chip
                              label={`Average: ${subjectData.averageLetterGrade}`}
                              color={getAverageGradeColor(
                                subjectData.averageLetterGrade
                              )}
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              label="No data"
                              color="default"
                              variant="outlined"
                            />
                          )}
                        </Box> */}

                        {/* Pie Chart */}
                        {hasData ? (
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                dataKey="value"
                                // label={({ name, value }) => `${name}: ${value}`}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box
                            sx={{
                              height: 180,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              No data to display
                            </Typography>
                          </Box>
                        )}

                        <Typography
                          variant="body2"
                          gutterBottom
                          align="center"
                          sx={{ fontSize: "0.875rem", fontWeight: "500" }}
                        >
                          {subjectNameMap[subjectName] || subjectName}
                        </Typography>

                        {/* 統計情報 */}
                        {/* <Box
                          sx={{
                            mt: 2,
                            pt: 2,
                            borderTop: 1,
                            borderColor: "divider",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Total Submissions: {subjectData.totalSubmissions}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Valid Grades: {subjectData.validGrades}
                          </Typography>
                        </Box> */}
                      </Box>
                    );
                  }
                )}
              </Box>

              {/* 共通のLegend */}
              <CommonLegend />
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
};

export default LetterGradePieCharts;
