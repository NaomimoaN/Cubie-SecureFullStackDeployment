// client/src/components/content/ParentDashboardMainPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import { Box, Typography } from "@mui/material";
import ScoreBySubjectBarChart from "../analytics/ScoreBySubjectBarChart";
import LetterGradePieCharts from "../analytics/LetterGradePieCharts";
import CoreCompRadarCharts from "../analytics/CoreCompRadarCharts";
import { getCurrentTerm } from "../../../services/analyticsService";

/**
 * Displays the main dashboard content for parents.
 * It sets the sub-sidebar to display a children list overview using actual user's childrens.
 * Shows the first child's subject scores by default.
 */
function ParentDashboardMainPage({ user }) {
  const { setSubSidebarConfig } = useSubSidebar();
  const [currentTerm, setCurrentTerm] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState("term3"); // デフォルト値
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === "parent" && user.familyStudents) {
      const childrenForSidebar = user.familyStudents;

      // 最初の子供が存在する場合、その子供のページに自動リダイレクト
      if (childrenForSidebar.length > 0 && childrenForSidebar[0]?.userId) {
        const firstChildId = childrenForSidebar[0].userId;
        navigate(`/parent/dashboard/${firstChildId}`, { replace: true });
        return; // リダイレクト後は以下を実行しない
      }

      // Set up the sub-sidebar with the list of children
      setSubSidebarConfig({
        type: "parentChildrenSelection",
        data: {
          children: childrenForSidebar,
          basePath: "/parent/dashboard",
        },
      });
    }

    return () => {
      setSubSidebarConfig(null);
    };
  }, [user, setSubSidebarConfig, navigate]);

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
        console.error("現在の学期の取得に失敗:", error);
        // エラーの場合はデフォルトでTerm 3を使用
        setSelectedTerm("term3");
      }
    };

    fetchCurrentTerm();
  }, []);

  // Get the first child's ID for default display
  const firstChildId = user?.familyStudents?.[0]?.userId || null;

  // デバッグ用: familyStudentsの構造を確認
  console.log("User object:", user);
  console.log("Family students:", user?.familyStudents);
  console.log("First child grade:", user?.familyStudents?.[0]?.profile?.grade);
  console.log("Current term:", currentTerm);
  console.log("Selected term:", selectedTerm);

  // 子供が存在しない場合の表示
  if (!user?.familyStudents || user.familyStudents.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          No Children Found
        </Typography>
        <Typography variant="body1">
          No children are associated with this account.
        </Typography>
      </Box>
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
        Dashboard
        {/* Dashboard for {user?.familyStudents?.[0]?.name || "No Name"} */}
      </Typography>
      <label htmlFor="options"></label>
      <select
        id="options"
        name="options"
        value={selectedTerm}
        onChange={(e) => setSelectedTerm(e.target.value)}
        className="border border-gray-300 rounded-md p-2 bg-white"
        style={{
          backgroundColor: "white",
        }}
      >
        <option value="term1" style={{ backgroundColor: "white" }}>
          Grade {user?.familyStudents?.[0]?.profile?.grade} Term 1
        </option>
        <option value="term2" style={{ backgroundColor: "white" }}>
          Grade {user?.familyStudents?.[0]?.profile?.grade} Term 2
        </option>
        <option value="term3" style={{ backgroundColor: "white" }}>
          G{user?.familyStudents?.[0]?.profile?.grade} Term 3
        </option>
      </select>

      <div className="flex-1" style={{ height: "calc(100vh - 200px)" }}>
        <div
          className="cursor-pointer"
          style={{
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
            selectedChildId={firstChildId}
            selectedTerm={parseInt(selectedTerm.replace("term", ""))}
          />
        </div>
        <div className="flex gap-4">
          <div
            className="flex-1 cursor-pointer"
            style={{
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
            <ScoreBySubjectBarChart
              selectedChildId={firstChildId}
              selectedTerm={parseInt(selectedTerm.replace("term", ""))}
            />
          </div>
          <div
            className="flex-1 cursor-pointer"
            style={{
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
            <CoreCompRadarCharts
              selectedChildId={firstChildId}
              selectedTerm={parseInt(selectedTerm.replace("term", ""))}
            />
          </div>
        </div>
      </div>
    </Box>
  );
}

export default ParentDashboardMainPage;
