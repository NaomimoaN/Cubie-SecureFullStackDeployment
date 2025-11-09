import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import SubjectBarChart from "../components/analytics/SubjectBarChart";
import SubjectDonutPieChart from "../components/analytics/SubjectDonutPieChart";

const LanguageArtsPage = () => {
  return (
    <Container maxWidth={false} sx={{ px: 3 }}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Language Arts
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            width: "100%",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <SubjectBarChart subjectName="Language Arts" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <SubjectDonutPieChart subjectName="Language Arts" />
          </Box>
        </Box>
      </Box>
    </Container>
  );
};
export default LanguageArtsPage;
