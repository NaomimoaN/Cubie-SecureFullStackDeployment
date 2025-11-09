/**
 * @purpose 先生用の出欠管理ページ
 * ログインした先生のdivisionの生徒の出欠を記録するためのページ
 */

import React from "react";
import { Container, Typography, Box } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import AttendanceChecklist from "../../attendance/attendanceCheckList";

function TeacherAttendance({ user }) {
  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      backgroundColor="white"
      sx={{ padding: 0 }}
    >
      <Container maxWidth="lg">
        {/* <Box sx={{ py: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Daily Attendance Check
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 4 }}
          >
            Check the attendance of your students
          </Typography>
        </Box> */}
        {/* 週間出席率チャート */}
        <Box sx={{ mb: 4 }}>
          <AttendanceChecklist />
        </Box>
      </Container>
    </LocalizationProvider>
  );
}

export default TeacherAttendance;
