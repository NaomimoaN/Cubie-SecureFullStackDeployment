import React, { useState, useEffect, useRef } from "react";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Letter Gradeの色分け
const gradeColors = {
  Emerging: "#BDDFFF",
  Developing: "#9ACEFF",
  Proficient: "#66A7F5",
  Extending: "#317CD8",
};

// Last Term用の色分け
const lastTermGradeColors = {
  Emerging: "#F3F3F3",
  Developing: "#A3DBC6",
  Proficient: "#7AD9B5",
  Extending: "#33BD88",
};

// Subject名のマッピング
const subjectNameMap = {
  Math: "Mathmatics",
  "Language Arts": "Language Arts",
  Science: "Science",
  ADST: "ADST",
  "Social Studies": "Social Studies",
};

const SubjectLetterGradeComparison = ({ selectedStudentId = null }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("Math");
  const [currentTerm, setCurrentTerm] = useState(3);
  const [lastTerm, setLastTerm] = useState(2);
  const dashboardRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [selectedStudentId, selectedSubject]);

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

      const fileName = `${selectedSubject}_LetterGradeComparison.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF generation failed:", error);
      // alert("PDFの生成に失敗しました。");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // This termとLast termのデータを並行して取得
      const [currentTermResponse, lastTermResponse] = await Promise.all([
        getLetterGradesBySubject(currentTerm),
        getLetterGradesBySubject(lastTerm),
      ]);

      if (currentTermResponse.success && lastTermResponse.success) {
        setData({
          currentTerm: currentTermResponse.data,
          lastTerm: lastTermResponse.data,
          currentTermNumber: currentTerm,
          lastTermNumber: lastTerm,
        });
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      setError("Error fetching data");
      console.error("Error fetching letter grade data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Pie chart用のデータを準備する関数
  const preparePieData = (gradeDistribution, isLastTerm = false) => {
    const colors = isLastTerm ? lastTermGradeColors : gradeColors;
    return Object.entries(gradeDistribution)
      .filter(([grade, count]) => count > 0)
      .map(([grade, count]) => ({
        name: grade,
        value: count,
        color: colors[grade],
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

  // カスタムLegend
  const CustomLegend = ({ payload }) => {
    if (!payload || payload.length === 0) return null;

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mt: 1,
        }}
      >
        {payload.map((entry, index) => (
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
              {entry.value}
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

  if (!data || !data.currentTerm || !data.lastTerm) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No data to display
      </Alert>
    );
  }

  // Filter students based on selectedStudentId
  const currentTermStudents = selectedStudentId
    ? data.currentTerm.filter(
        (student) =>
          student.studentId.toString() === selectedStudentId.toString()
      )
    : data.currentTerm;

  const lastTermStudents = selectedStudentId
    ? data.lastTerm.filter(
        (student) =>
          student.studentId.toString() === selectedStudentId.toString()
      )
    : data.lastTerm;

  if (currentTermStudents.length === 0 || lastTermStudents.length === 0) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        No data available for the selected child.
      </Alert>
    );
  }

  const currentTermStudent = currentTermStudents[0];
  const lastTermStudent = lastTermStudents[0];

  return (
    <div className="rounded-2xl pt-7 pl-10 pr-10 shadow-none">
      {/* 科目選択ドロップダウン */}
      <Box
        sx={{
          mb: 2,
          flex: 1,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div className="flex items-center gap-4">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="subject-select-label">Select Subject</InputLabel>
            <Select
              labelId="subject-select-label"
              value={selectedSubject}
              label="Select Subject"
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <MenuItem value="Math">Mathmatics</MenuItem>
              <MenuItem value="Language Arts">Language Arts</MenuItem>
              <MenuItem value="Science">Science</MenuItem>
              <MenuItem value="ADST">ADST</MenuItem>
              <MenuItem value="Social Studies">Social Studies</MenuItem>
            </Select>
          </FormControl>
        </div>
      </Box>

      <Box
        ref={dashboardRef}
        sx={{
          backgroundColor: "white",
          borderRadius: 5,
          border: "1px solid #E0E0E0",
          padding: "1rem 2rem",
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          fontSize={"1.25rem"}
          fontWeight={"500"}
          paddingBottom={"2rem"}
        >
          {subjectNameMap[selectedSubject]}
        </Typography>

        {currentTermStudent && lastTermStudent && (
          <Box>
            {/* 学生名タイトル */}
            {/* <Typography
            variant="h4"
            gutterBottom
            sx={{ color: "primary.main", fontWeight: "bold" }}
          >
            {currentTermStudent.studentName}
          </Typography> */}

            {/* 区切り線 */}
            {/* <Divider sx={{ mb: 3 }} /> */}

            {/* Last Term vs This Term 比較 */}
            <div className="flex gap-2 mt-0">
              {/* Last Term */}
              <div className="flex-1">
                <div
                  sx={{
                    backgroundColor: "white",
                    borderRadius: 5,
                    border: "1px solid #E0E0E0",
                    padding: "1rem 2rem",
                  }}
                >
                  {/* Pie Chart */}
                  {lastTermStudent.subjects[selectedSubject] ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={preparePieData(
                            lastTermStudent.subjects[selectedSubject]
                              .gradeDistribution,
                            true
                          )}
                          cx="50%"
                          cy="50%"
                          outerRadius={150}
                          dataKey="value"
                        >
                          {preparePieData(
                            lastTermStudent.subjects[selectedSubject]
                              .gradeDistribution,
                            true
                          ).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box
                      sx={{
                        height: 300,
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
                    Total Submissions:{" "}
                    {lastTermStudent.subjects[selectedSubject]
                      ?.totalSubmissions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valid Grades:{" "}
                    {lastTermStudent.subjects[selectedSubject]?.validGrades ||
                      0}
                  </Typography>
                </Box> */}

                  <Typography
                    variant="h6"
                    align="center"
                    fontSize={"1rem"}
                    sx={{ mt: 2 }}
                  >
                    Last Term
                  </Typography>
                </div>
              </div>

              {/* Last Term */}
              <div className="flex-1">
                <div
                  sx={{
                    backgroundColor: "white",
                    borderRadius: 5,
                    border: "1px solid #E0E0E0",
                    padding: "1rem 2rem",
                  }}
                >
                  {/* Pie Chart */}
                  {currentTermStudent.subjects[selectedSubject] ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={preparePieData(
                            currentTermStudent.subjects[selectedSubject]
                              .gradeDistribution
                          )}
                          cx="50%"
                          cy="50%"
                          outerRadius={150}
                          dataKey="value"
                        >
                          {preparePieData(
                            currentTermStudent.subjects[selectedSubject]
                              .gradeDistribution
                          ).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box
                      sx={{
                        height: 300,
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
                    Total Submissions:{" "}
                    {currentTermStudent.subjects[selectedSubject]
                      ?.totalSubmissions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valid Grades:{" "}
                    {currentTermStudent.subjects[selectedSubject]
                      ?.validGrades || 0}
                  </Typography>
                </Box> */}

                  <Typography
                    variant="h6"
                    align="center"
                    fontSize={"1rem"}
                    sx={{ mt: 2 }}
                  >
                    This Term
                  </Typography>
                </div>
              </div>
            </div>
          </Box>
        )}
      </Box>
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
    </div>
  );
};

export default SubjectLetterGradeComparison;
