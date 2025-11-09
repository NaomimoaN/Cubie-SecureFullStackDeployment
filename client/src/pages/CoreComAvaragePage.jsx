import React from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import CoreComAvarageRadarChart from "../components/analytics/CoreComAvarageRadarChart";

const CoreComAvaragePage = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* ページヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold", color: "primary.main" }}
        >
          Core Competencies Analysis
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Week 39 - Core Competencies Average Score Analysis
        </Typography>
        <Divider />
      </Box>

      {/* Core Competencies説明 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📊 What is Core Competencies?
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Core Competencies are the six basic abilities that learners need
                to succeed in the 21st century.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      📢 Communication
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      The ability to effectively communicate information and
                      work with others.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      🎨 Creative Thinking
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      The ability to generate new ideas and solutions.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      🧠 Critical Thinking
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      The ability to analyze information and make logical
                      decisions.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      🎭 Identity
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      The ability to understand oneself and establish personal
                      values.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      💪 Responsibility
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      The ability to take responsibility for one's actions and
                      keep promises.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      🌍 Social Responsibility
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      The ability to take responsibility for one's actions and
                      keep promises.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* レーダーチャート */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <CoreComAvarageRadarChart />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 分析の説明 */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📈 How to read the chart
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • The radar chart shows the average score (0-100 points) for
                each Competency.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • The higher the score, the more the competency is strong.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • By hovering over each axis, you can view detailed data.
              </Typography>
              <Typography variant="body2">
                • The chart shows the highest, lowest, and overall average
                values at the bottom.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🎯 How to use the chart
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Visualize the strengths and weaknesses of each competency
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Use it as a guide for balanced competency development
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Use it as a reference for individual instruction and learning
                plans
              </Typography>
              <Typography variant="body2">
                • Check progress and identify improvement points weekly
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CoreComAvaragePage;
