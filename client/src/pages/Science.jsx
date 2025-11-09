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

const MathPage = () => {
  return (
    <Container maxWidth={false} sx={{ px: 3 }}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Science
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
            <SubjectBarChart subjectName="Science" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <SubjectDonutPieChart subjectName="Science" />
          </Box>
        </Box>
      </Box>
    </Container>
  );
};
export default MathPage;
