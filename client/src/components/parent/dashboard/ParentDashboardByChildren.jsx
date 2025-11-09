// client/src/components/content/ParentDashboardByChildren.jsx

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import ScoreBySubjectBarChart from "../analytics/ScoreBySubjectBarChart";
import LetterGradePieCharts from "../analytics/LetterGradePieCharts";
import CoreCompRadarCharts from "../analytics/CoreCompRadarCharts";
import AverageScoreBySubjectChart from "../analytics/AverageScoreBySubjectChart";
import SubjectLetterGradeComparison from "../analytics/SubjectLetterGradeComparison";
import YearlyCoreCompRadarChart from "../analytics/YearlyCoreCompRadarChart";
import { getCurrentTerm } from "../../../services/analyticsService";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Displays detailed information for a specific child for parent.
 * It ensures the sub-sidebar (children list) remains visible.
 */
function ParentDashboardByChildren({ user }) {
  const { childId } = useParams();
  const { setSubSidebarConfig } = useSubSidebar();
  const [childDetails, setChildDetails] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState("term3"); // デフォルト値
  const [showAverageScoreChart, setShowAverageScoreChart] = useState(false);
  const [showLetterGradeComparison, setShowLetterGradeComparison] =
    useState(false);
  const [showYearlyCoreComp, setShowYearlyCoreComp] = useState(false);
  const dashboardRef = useRef(null);

  // デバッグ用：状態の変化をログ出力
  useEffect(() => {
    console.log("showYearlyCoreComp state changed:", showYearlyCoreComp);
  }, [showYearlyCoreComp]);

  // PDFダウンロード機能
  const downloadPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        height: dashboardRef.current.scrollHeight,
        width: dashboardRef.current.scrollWidth,
        scrollX: 0,
        scrollY: 0,
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

      const fileName = `${
        childDetails.name
      }_Dashboard_Term${selectedTerm.replace("term", "")}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF generation failed:", error);
      // alert("PDFの生成に失敗しました。");
    }
  };

  useEffect(() => {
    if (
      !user ||
      user.role !== "parent" ||
      !Array.isArray(user.familyStudents) ||
      user.familyStudents.length === 0
    ) {
      setSubSidebarConfig(null);
      setChildDetails(null);
      return;
    }

    // Set up the sub-sidebar with the list of children
    setSubSidebarConfig({
      type: "parentChildrenSelection",
      data: {
        children: user.familyStudents,
        basePath: "/parent/dashboard",
      },
    });

    // Find the selected child based on childId from URL parameters
    const selectedChild = user.familyStudents.find(
      (child) => child?.userId === childId
    );

    if (selectedChild) {
      setChildDetails(selectedChild);
    } else {
      // If no matching child is found, ensure childDetails is null
      setChildDetails(null);
    }

    // Cleanup function to reset sidebar config when component unmounts or dependencies change
    return () => {
      setSubSidebarConfig(null);
    };
  }, [childId, user, setSubSidebarConfig]); // Dependencies for useEffect

  // 現在の学期を取得
  useEffect(() => {
    const fetchCurrentTerm = async () => {
      try {
        const response = await getCurrentTerm();
        if (response.success) {
          const term = response.data.term;
          setCurrentTerm(term);

          // 学期に基づいてデフォルト値を設定
          if (term === "Term 1") {
            setSelectedTerm("term1");
          } else if (term === "Term 2") {
            setSelectedTerm("term2");
          } else if (term === "Term 3") {
            setSelectedTerm("term3");
          }
        }
      } catch (error) {
        console.error("fail to fetch current term:", error);
        // エラーの場合はデフォルトでTerm 3を使用
        setSelectedTerm("term3");
      }
    };

    fetchCurrentTerm();
  }, []);

  // ScoreBySubjectBarChartのクリックハンドラー
  const handleScoreChartClick = () => {
    setShowAverageScoreChart(true);
  };

  // AverageScoreBySubjectChartを閉じるハンドラー
  const handleCloseAverageScoreChart = () => {
    setShowAverageScoreChart(false);
  };

  // LetterGradePieChartsのクリックハンドラー
  const handleLetterGradeChartClick = () => {
    setShowLetterGradeComparison(true);
  };

  // SubjectLetterGradeComparisonを閉じるハンドラー
  const handleCloseLetterGradeComparison = () => {
    setShowLetterGradeComparison(false);
  };

  // CoreCompRadarChartsのクリックハンドラー
  const handleCoreCompChartClick = () => {
    console.log(
      "CoreCompRadarCharts clicked, setting showYearlyCoreComp to true"
    );
    setShowYearlyCoreComp(true);
  };

  // YearlyCoreCompRadarChartを閉じるハンドラー
  const handleCloseYearlyCoreComp = () => {
    setShowYearlyCoreComp(false);
  };

  // Render logic: Display a message if childDetails are not available, otherwise show child's dashboard
  if (!childDetails) {
    return (
      <div className="p-4 text-center text-xl text-gray-600 h-full flex items-center justify-center">
        Child information not available or not found.
      </div>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        height: "100%",
        overflow: "auto",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        backgroundColor: "#f9fafb",
        paddingBottom: "3rem",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        fontSize={"26px"}
        fontWeight={"500"}
      >
        {showLetterGradeComparison || showAverageScoreChart
          ? "Score by subject"
          : showYearlyCoreComp
          ? "Strength and Weakness"
          : "Dashboard"}
        {/* Dashboard for {childDetails.name || "No Name"} */}
      </Typography>

      {/* term選択部分 - 詳細画面が表示されているときは非表示 */}
      {!showAverageScoreChart &&
        !showLetterGradeComparison &&
        !showYearlyCoreComp && (
          // <div className="flex justify-between items-center mb-4">
          //   <Button
          //     variant="contained"
          //     onClick={downloadPDF}
          //     sx={{
          //       backgroundColor: "#317CD8",
          //       "&:hover": {
          //         backgroundColor: "#2563eb",
          //       },
          //     }}
          //   >
          //     Download PDF
          //   </Button>
          <div className="flex items-center justify-end">
            <label htmlFor="options"></label>
            <div
              style={{ paddingRight: "1rem" }}
              className="border border-gray-300 rounded-md p-1 bg-white"
            >
              <select
                id="options"
                name="options"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                style={{
                  backgroundColor: "white",
                  paddingRight: "1rem",
                  paddingLeft: "1rem",
                }}
              >
                <option value="term1" style={{ backgroundColor: "white" }}>
                  Grade {childDetails?.profile?.grade} Term 1, 2024-2025
                </option>
                <option value="term2" style={{ backgroundColor: "white" }}>
                  Grade {childDetails?.profile?.grade} Term 2, 2024-2025
                </option>
                <option value="term3" style={{ backgroundColor: "white" }}>
                  Grade {childDetails?.profile?.grade} Term 3, 2024-2025
                </option>
              </select>
            </div>
          </div>
          // </div>
        )}

      <div ref={dashboardRef} className="flex-1" style={{ boxShadow: "none" }}>
        {showAverageScoreChart ? (
          <div className="relative">
            {/* <button
              onClick={handleCloseAverageScoreChart}
              className="absolute top-4 right-4 z-10 bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button> */}
            <AverageScoreBySubjectChart
              selectedStudentId={childDetails.userId}
            />
          </div>
        ) : showLetterGradeComparison ? (
          <div className="relative" style={{ boxShadow: "none" }}>
            {/* <button
              onClick={handleCloseLetterGradeComparison}
              className="absolute top-4 right-4 z-10 bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button> */}
            <SubjectLetterGradeComparison
              selectedStudentId={childDetails.userId}
            />
          </div>
        ) : showYearlyCoreComp ? (
          <div className="relative">
            {console.log(
              "Rendering YearlyCoreCompRadarChart, studentId:",
              childDetails.userId
            )}
            {/* <button
              onClick={handleCloseYearlyCoreComp}
              className="absolute top-4 right-4 z-10 bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button> */}
            <YearlyCoreCompRadarChart selectedStudentId={childDetails.userId} />
          </div>
        ) : (
          <>
            <div
              className="cursor-pointer"
              onClick={handleLetterGradeChartClick}
              style={{
                marginBottom: "1rem",
                transition: "transform 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <LetterGradePieCharts
                selectedChildId={childDetails.userId}
                selectedTerm={parseInt(selectedTerm.replace("term", ""))}
              />
            </div>

            <div className="flex items-stretch gap-4 ">
              <div
                className="flex-1 cursor-pointer"
                onClick={handleScoreChartClick}
                style={{
                  transition: "transform 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <ScoreBySubjectBarChart
                  selectedChildId={childDetails.userId}
                  selectedTerm={parseInt(selectedTerm.replace("term", ""))}
                />
              </div>

              <div
                className="flex-1 cursor-pointer"
                onClick={handleCoreCompChartClick}
                style={{
                  transition: "transform 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <CoreCompRadarCharts
                  selectedChildId={childDetails.userId}
                  selectedTerm={parseInt(selectedTerm.replace("term", ""))}
                />
              </div>
            </div>
            <div className="flex justify-end">
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
                  marginTop: "1rem",
                  marginBottom: "3rem",
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
          </>
        )}
      </div>
    </Box>
  );
}

export default ParentDashboardByChildren;
