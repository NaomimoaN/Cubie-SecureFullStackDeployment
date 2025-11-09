import React from "react";
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Chip,
} from "@mui/material";
import { School, Assessment } from "@mui/icons-material";
import SubjectCoreCompetencies from "../components/analytics/SubjectCoreCompetencies";

const CoreComMathPage = () => {
  return (
    <Container maxWidth={false} sx={{ px: 3 }}>
      <Box sx={{ py: 3 }}>
        {/* ブレッドクラム */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="#"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <School sx={{ mr: 0.5 }} fontSize="inherit" />
            Analytics
          </Link>
          <Link
            color="inherit"
            href="#"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Assessment sx={{ mr: 0.5 }} fontSize="inherit" />
            Core Competencies
          </Link>
          <Typography
            color="text.primary"
            sx={{ display: "flex", alignItems: "center" }}
          >
            Math
          </Typography>
        </Breadcrumbs>

        {/* ページヘッダー */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h4" component="h1" sx={{ mr: 2 }}>
              Core Competencies - Math
            </Typography>
            <Chip
              label="Week 39"
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            Comprehensive analysis of Math core competency performance across 6
            key areas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View detailed rubric scores, performance trends, and competency
            assessments for your division's Math students
          </Typography>
        </Box>

        {/* Core Competencies Math コンポーネント */}
        <Box sx={{ mb: 3 }}>
          <SubjectCoreCompetencies subjectName="Math" />
        </Box>

        {/* フッター情報 */}
        <Box
          sx={{
            mt: 4,
            p: 2,
            backgroundColor: "background.paper",
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            💡 <strong>Note:</strong> Core Competencies assessment includes
            Communication, Creative Thinking, Critical Thinking, Identity,
            Responsibility, and Social Responsibility. Scores are based on
            rubric evaluations from Week 39 assignments.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default CoreComMathPage;
