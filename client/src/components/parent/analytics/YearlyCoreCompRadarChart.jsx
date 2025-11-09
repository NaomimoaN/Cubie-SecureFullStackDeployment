import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Paper,
  Button,
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
import { getYearlyCoreCompBySubject } from "../../../services/parentCoreCompService";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// CoreCompの色分け
const coreCompColors = {
  communication: "#8884d8",
  creativeThinking: "#82ca9d",
  criticalThinking: "#ffc658",
  identity: "#ff7300",
  responsibility: "#8dd1e1",
  socialResponsibility: "#ff6b6b",
};

// CoreComp名のマッピング
const coreCompNameMap = {
  communication: "Communication",
  creativeThinking: "Creative Thinking",
  criticalThinking: "Critical Thinking",
  identity: "Identity",
  responsibility: "Responsibility",
  socialResponsibility: "Social Responsibility",
};

// コメント生成関数
const generateComments = (data) => {
  if (!data || data.length === 0) {
    return {
      overall:
        "It is not possible to provide an overall evaluation because the data is insufficient.",
      strengths: [],
      improvements: [],
    };
  }

  // 全科目のCoreCompデータを統合
  const allCoreComps = {};
  const coreCompCounts = {};

  data.forEach((subject) => {
    Object.entries(subject.coreCompAverages).forEach(([comp, score]) => {
      if (score > 0) {
        if (!allCoreComps[comp]) {
          allCoreComps[comp] = 0;
          coreCompCounts[comp] = 0;
        }
        allCoreComps[comp] += score;
        coreCompCounts[comp] += 1;
      }
    });
  });

  // 各CoreCompの年間平均を計算
  const yearlyAverages = {};
  Object.keys(allCoreComps).forEach((comp) => {
    yearlyAverages[comp] =
      Math.round((allCoreComps[comp] / coreCompCounts[comp]) * 100) / 100;
  });

  // 全体の平均スコアを計算
  const validAverages = Object.values(yearlyAverages).filter(
    (score) => score > 0
  );
  const averageScore =
    validAverages.length > 0
      ? Math.round(
          (validAverages.reduce((sum, score) => sum + score, 0) /
            validAverages.length) *
            100
        ) / 100
      : 0;

  // 強みを特定（スコアが3.0以上のCoreComp）
  const strengths = Object.entries(yearlyAverages)
    .filter(([comp, score]) => score >= 3.0)
    .map(([comp]) => coreCompNameMap[comp]);

  // 改善点を特定（スコアが2.0未満のCoreComp）
  const improvements = Object.entries(yearlyAverages)
    .filter(([comp, score]) => score < 2.0 && score > 0)
    .map(([comp]) => coreCompNameMap[comp]);

  // 総合コメント
  let overallComment = "";
  if (averageScore >= 3.5) {
    overallComment =
      "Your child has demonstrated excellent Core Competencies throughout the year. They have shown high levels of ability in all areas, particularly in the Core Competencies area with outstanding growth.";
  } else if (averageScore >= 3) {
    overallComment =
      "Your child has maintained good Core Competencies throughout the year. They have reached appropriate levels in many areas and show continuous growth.";
  } else if (averageScore >= 2.5) {
    overallComment =
      "Your child has shown basic Core Competencies throughout the year. There are areas where further growth and support are needed.";
  } else if (averageScore > 0) {
    overallComment =
      "Your child has been working on Core Competencies throughout the year, but more support and guidance are needed. It is important to deepen the understanding of basic concepts.";
  } else {
    overallComment =
      "It is not possible to provide an overall evaluation because the data is insufficient. More assessment data and tasks are needed.";
  }

  return {
    overall: overallComment,
    strengths,
    improvements,
    averageScore,
    yearlyAverages,
  };
};

const YearlyCoreCompRadarChart = ({ selectedStudentId = null }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState(null);
  const dashboardRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [selectedStudentId]);

  // PDFダウンロード機能
  const downloadPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `YearlyCoreCompRadarChart.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF generation failed:", error);
      // alert("PDFの生成に失敗しました。");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log(
        "Fetching yearly core comp data for student:",
        selectedStudentId
      );
      const response = await getYearlyCoreCompBySubject(selectedStudentId);
      console.log("Yearly core comp response:", response);

      if (response.success) {
        setData(response.data);
        setComments(generateComments(response.data));
        console.log("Data set successfully:", response.data);
      } else {
        setError("Failed to fetch data");
        console.error("API returned error:", response);
      }
    } catch (err) {
      setError("Error fetching data");
      console.error("Error fetching yearly core comp data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Radar chart用のデータを準備する関数
  const prepareRadarData = () => {
    try {
      if (!comments || !comments.yearlyAverages) {
        console.log("No comments or yearlyAverages available");
        return [];
      }

      const radarData = Object.entries(comments.yearlyAverages).map(
        ([comp, score]) => ({
          competency: coreCompNameMap[comp],
          score: score,
          fullMark: 4,
        })
      );

      console.log("Prepared radar data:", radarData);
      return radarData;
    } catch (error) {
      console.error("Error preparing radar data:", error);
      return [];
    }
  };

  // カスタムtooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      // 4を基準とした値を100を基準としたパーセンテージに変換
      const percentageValue = Math.round((data.value / 4) * 100);
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
            {label}: {percentageValue} / 100
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // 平均Letter Gradeのチップ色を取得
  const getAverageGradeColor = (grade) => {
    switch (grade) {
      case "Extending":
        return "success";
      case "Proficient":
        return "primary";
      case "Developing":
        return "warning";
      case "Emerging":
        return "error";
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

  const radarData = prepareRadarData();

  // デバッグ用：radarDataの内容を確認
  console.log("Radar data:", radarData);
  console.log("Comments:", comments);
  console.log("Yearly averages:", comments?.yearlyAverages);

  return (
    <Box sx={{ mt: 1, p: 1 }}>
      <Box
        ref={dashboardRef}
        sx={{
          backgroundColor: "white",
          borderRadius: 5,
          border: "1px solid #E0E0E0",
          padding: "1rem 2rem",
        }}
      >
        {/* 総合評価コメント */}
        {comments && (
          <Card sx={{ mb: 3, boxShadow: "none", border: "none" }}>
            {/* <CardContent> */}
            {/* <Typography variant="h6" gutterBottom>
              Overall Assessment
            </Typography>
            <Typography variant="body1" paragraph>
              {comments.overall}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Average Score:{" "}
                <Chip
                  label={`${comments.averageScore}/4.0`}
                  color="primary"
                  variant="outlined"
                />
              </Typography>
            </Box> */}

            {/* 強み */}
            {/* {comments.strengths && comments.strengths.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Strong Core Competencies:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {comments.strengths.map((strength, index) => (
                    <Chip
                      key={index}
                      label={strength}
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )} */}

            {/* 改善点 */}
            {/* {comments.improvements && comments.improvements.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Core Competencies Needing Improvement:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {comments.improvements.map((improvement, index) => (
                    <Chip
                      key={index}
                      label={improvement}
                      color="warning"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )} */}
            {/* </CardContent> */}
          </Card>
        )}

        {/* Radar Chart */}
        <Card sx={{ boxShadow: "none", border: "none" }}>
          <CardContent>
            {/* <Typography variant="h6" gutterBottom align="center">
            Annual Core Competencies Average Scores
          </Typography> */}

            <ResponsiveContainer width="100%" height={400}>
              {radarData && radarData.length > 0 ? (
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="competency" />
                  <PolarRadiusAxis angle={90} domain={[0, 4]} tick={false} />
                  <Radar
                    name="Core Comp Score"
                    dataKey="score"
                    stroke="#BDDFFF"
                    fill="#BDDFFF"
                    fillOpacity={0.6}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* <Legend /> */}
                </RadarChart>
              ) : (
                <Box
                  sx={{
                    height: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No radar data available
                  </Typography>
                </Box>
              )}
            </ResponsiveContainer>

            {/* 詳細統計 */}
            {/* <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Core Competencies Details
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 2,
              }}
            >
              {comments &&
                comments.yearlyAverages &&
                Object.entries(comments.yearlyAverages).map(
                  ([comp, score], index) => {
                    try {
                      return (
                        <Paper key={index} sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {coreCompNameMap[comp] || comp}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Typography variant="body2">
                              Score: {score}/4.0
                            </Typography>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                backgroundColor: coreCompColors[comp] || "#ccc",
                                borderRadius: "2px",
                              }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Annual Average
                          </Typography>
                        </Paper>
                      );
                    } catch (error) {
                      console.error("Error rendering core comp card:", error, {
                        comp,
                        score,
                      });
                      return null;
                    }
                  }
                )}
            </Box>
          </Box> */}
          </CardContent>

          <div className="flex flex-col" style={{ padding: "1rem 5rem" }}>
            <Typography
              gutterBottom
              fontSize={"1rem"}
              fontWeight={"600"}
              paddingBottom={"1rem"}
              paddingTop={"1rem"}
            >
              Teacher's Reflection
            </Typography>
            <Typography variant="body1" paragraph>
              {comments.overall}
            </Typography>
          </div>
        </Card>
      </Box>
      {/* ダウンロードボタン */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={downloadPDF}
          sx={{
            backgroundColor: "#F3F3F3",
            "&:hover": {
              backgroundColor: "#DAECFD",
            },
            color: "black",
            borderRadius: "50px",
            padding: "10px 30px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          <img
            src="/icons/Download arrow.svg"
            alt="Download"
            style={{ width: "23px", height: "23px" }}
          />
          Download
        </Button>
      </div>
    </Box>
  );
};

export default YearlyCoreCompRadarChart;
