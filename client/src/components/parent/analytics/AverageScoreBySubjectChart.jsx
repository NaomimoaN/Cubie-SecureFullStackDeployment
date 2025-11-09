import React, { useState, useEffect, useRef } from "react";
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
import {
  Typography,
  Box,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
} from "@mui/material";
import { getAverageScoresBySubject } from "../../../services/parentAverageScoreService.js";
import Loader from "../../common/Loader.jsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const AverageScoreBySubjectChart = ({ selectedStudentId = null }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("Math");
  const dashboardRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

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

      const fileName = `${selectedSubject}_AverageScoreChart.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF generation failed:", error);
      // alert("Failed to generate PDF.");
    }
  };

  useEffect(() => {
    if (data && selectedStudentId) {
      const student = data.students.find(
        (s) => s.studentId === selectedStudentId
      );
      setSelectedStudent(student);
    } else if (data && data.students && data.students.length > 0) {
      setSelectedStudent(data.students[0]);
    }
  }, [data, selectedStudentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getAverageScoresBySubject();
      setData(response.data);
    } catch (err) {
      setError(err.message || "Fail to fetch the data");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (studentId) => {
    const student = data.students.find((s) => s.studentId === studentId);
    setSelectedStudent(student);
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!data || !data.students || data.students.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-600">No data found</p>
      </div>
    );
  }

  // recharts用のデータ変換（選択された科目のみ）
  const transformDataForRecharts = (student, subject) => {
    if (!student || !student.termData) return [];

    const terms = ["1", "2", "3"];

    // 選択された科目のterm別データのみを返す
    const data = { subject };
    terms.forEach((term) => {
      const termKey = `term${term}`;
      const subjectData = student.termData[termKey]?.subjectScores?.find(
        (score) => score.subject === subject
      );
      data[`term${term}`] = subjectData ? subjectData.averageScore : 0;
    });

    return [data]; // 配列として返す（rechartsの形式）
  };

  const chartData = selectedStudent
    ? transformDataForRecharts(selectedStudent, selectedSubject)
    : [];

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Box sx={{ mt: 1, p: 1 }}>
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
              <MenuItem value="Math">Math</MenuItem>
              <MenuItem value="Language Arts">Language Arts</MenuItem>
              <MenuItem value="Science">Science</MenuItem>
              <MenuItem value="ADST">ADST</MenuItem>
              <MenuItem value="Social Studies">Social Studies</MenuItem>
            </Select>
          </FormControl>
        </div>
      </Box>
      <div className="flex justify-end mt-4"></div>

      <Box
        ref={dashboardRef}
        sx={{
          backgroundColor: "white",
          borderRadius: 5,
          border: "1px solid #E0E0E0",
          padding: "1rem 2rem 0rem 2rem",
          pb: 0,
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          fontSize={"1.25rem"}
          fontWeight={"500"}
          paddingBottom={"1rem"}
        >
          {selectedSubject}
        </Typography>

        {/* 全体統計 */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-800 font-bold">
              Overall Term 1 Average
            </h3>
            <p className="text-xl font-bold text-gray-800">
              {selectedStudent?.overallAverages?.term1 || 0}%
            </p>
            <p className="text-xs text-gray-500">All subjects combined</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-800 font-bold">
              Overall Term 2 Average
            </h3>
            <p className="text-xl font-bold text-gray-800">
              {selectedStudent?.overallAverages?.term2 || 0}%
            </p>
            <p className="text-xs text-gray-500">All subjects combined</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-800 font-bold">
              Overall Term 3 Average
            </h3>
            <p className="text-xl font-bold text-gray-800">
              {selectedStudent?.overallAverages?.term3 || 0}%
            </p>
            <p className="text-xs text-gray-500">All subjects combined</p>
          </div>
        </div> */}

        {/* チャート */}
        {chartData.length > 0 ? (
          <div className="h-96 mb-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                barGap={30}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="subject"
                  angle={0}
                  textAnchor="middle"
                  height={60}
                  fontSize={12}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Average Score (%)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="term1"
                  name="Term 1"
                  fill="#33BD88"
                  radius={[4, 4, 4, 4]}
                />
                <Bar
                  dataKey="term2"
                  name="Term 2"
                  fill="#DAECFD"
                  radius={[4, 4, 4, 4]}
                />
                <Bar
                  dataKey="term3"
                  name="Term 3"
                  fill="#317CD8"
                  radius={[4, 4, 4, 4]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No chart data available
          </div>
        )}

        {/* 年間平均スコア表示 */}
        {chartData.length > 0 && (
          <Box
            sx={{
              mb: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "flex-end",
              gap: 1,
              mt: -8,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              fontSize={"14px"}
              fontWeight={"500"}
            >
              Yealy avarage percentage
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#317CD8",
              }}
            >
              {(() => {
                const data = chartData[0];
                if (!data) return "0.0";

                const term1Score = data.term1 || 0;
                const term2Score = data.term2 || 0;
                const term3Score = data.term3 || 0;

                // 年間平均を計算（3タームの平均）
                const annualAverage =
                  (term1Score + term2Score + term3Score) / 3;

                return annualAverage.toFixed(2);
              })()}
              %
            </Typography>
          </Box>
        )}

        {/* 詳細データテーブル */}
        {/* {selectedStudent && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {selectedSubject} Detailed Data
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Term
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Submissions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {["1", "2", "3"].map((term) => {
                    const termKey = `term${term}`;
                    const subjectData = selectedStudent.termData[
                      termKey
                    ]?.subjectScores?.find(
                      (score) => score.subject === selectedSubject
                    );
                    return (
                      <tr key={term}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Term {term}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subjectData ? `${subjectData.averageScore}%` : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subjectData ? subjectData.totalSubmissions : "0"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )} */}
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
    </Box>
  );
};

export default AverageScoreBySubjectChart;
