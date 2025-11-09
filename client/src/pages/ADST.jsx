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

const ADSTPage = () => {
  return (
    <Container maxWidth={false} sx={{ px: 3 }}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ADST
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
            <SubjectBarChart subjectName="ADST" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <SubjectDonutPieChart subjectName="ADST" />
          </Box>
        </Box>
      </Box>
    </Container>
  );
};
export default ADSTPage;
