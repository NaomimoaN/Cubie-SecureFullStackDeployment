/**
 * @purpose ログインした先生のdivisionの生徒の出欠状況を表示するテーブルコンポーネント
 */

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  Button,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { api } from "../../services/authService";
import useAuth from "../../hooks/useAuth";

const AttendanceTable = () => {
  const { user, loading: authLoading } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    unknown: 0,
    total: 0,
  });
  const [division, setDivision] = useState(null);

  // デバッグ情報を表示
  useEffect(() => {
    console.log("=== AttendanceTable Debug Info ===");
    console.log("Auth loading:", authLoading);
    console.log("Current user:", user);
    console.log("User role:", user?.role);
    console.log("User division:", user?.profile?.division);
    console.log("User email:", user?.email);
    console.log("=== End Debug Info ===");
  }, [user, authLoading]);

  // ObjectIdを短縮表示する関数
  const formatUserId = (userId) => {
    if (!userId) return "未設定";
    // ObjectIdの最初の4文字と最後の4文字を表示
    if (userId.length >= 8) {
      return `${userId.slice(0, 4)}...${userId.slice(-4)}`;
    }
    return userId;
  };

  // 出欠状況に応じたChipのスタイル
  const getStatusChip = (status) => {
    const statusConfig = {
      present: { label: "出席", color: "success" },
      absent: { label: "欠席", color: "error" },
      late: { label: "遅刻", color: "warning" },
      unknown: { label: "未記録", color: "default" },
    };

    const config = statusConfig[status] || statusConfig.unknown;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  // 出欠データを取得
  const fetchAttendanceData = async (date = selectedDate) => {
    // 認証が完了していない場合は待機
    if (authLoading) {
      console.log("Auth is still loading, waiting...");
      return;
    }

    // ユーザーが存在しない場合
    if (!user) {
      setError("ログインが必要です。");
      setLoading(false);
      return;
    }

    // 先生でない場合
    if (user.role !== "teacher") {
      setError("先生のみアクセス可能です。");
      setLoading(false);
      return;
    }

    // divisionが設定されていない場合
    if (!user.profile?.division) {
      setError("先生のdivision情報が設定されていません。");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const dateStr = date.toISOString().split("T")[0];
      console.log("Fetching attendance data for date:", dateStr);

      // authServiceのaxiosインスタンスを使用（Cookieベース認証）
      const url = `/api/attendance/my-division?date=${dateStr}`;
      console.log("Request URL:", url);

      const response = await api.get(url);

      console.log("Response:", response.data);
      setAttendanceData(response.data.data || []);
      setDivision(response.data.division);

      // 統計データを使用（サーバーから返される統計を利用）
      setStats(
        response.data.stats || {
          present: 0,
          absent: 0,
          late: 0,
          unknown: 0,
          total: 0,
        }
      );
    } catch (err) {
      console.error("Attendance data fetch error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setError(
        err.response?.data?.message ||
          "出席データの取得に失敗しました。ログインが必要です。"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchAttendanceData();
    }
  }, [authLoading, user]);

  const handleDateChange = (newDate) => {
    if (newDate) {
      setSelectedDate(newDate);
      fetchAttendanceData(newDate);
    }
  };

  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          {authLoading ? "認証情報を確認中..." : "出席データを読み込み中..."}
        </Typography>
      </Box>
    );
  }

  console.log("attendanceData", attendanceData);

  return (
    <Box>
      {/* ヘッダーセクション */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            {division ? `Division ${division} 出席状況` : "出席状況"}
          </Typography>

          {/* ユーザー情報表示 */}
          {user && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              ログイン中: {user.profile?.firstName} {user.profile?.lastName}{" "}
              (Division {user.profile?.division})
            </Typography>
          )}

          {/* 日付選択 */}
          <Box sx={{ mb: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="日付を選択"
                value={selectedDate}
                onChange={handleDateChange}
                enableAccessibleFieldDOMStructure={false}
                slotProps={{
                  textField: {
                    variant: "outlined",
                    size: "small",
                  },
                }}
              />
            </LocalizationProvider>
            <Button
              variant="outlined"
              onClick={() => fetchAttendanceData()}
              sx={{ ml: 2 }}
            >
              更新
            </Button>
          </Box>

          {/* 統計表示 */}
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              label={`出席: ${stats.present}人`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`欠席: ${stats.absent}人`}
              color="error"
              variant="outlined"
            />
            <Chip
              label={`遅刻: ${stats.late}人`}
              color="warning"
              variant="outlined"
            />
            <Chip
              label={`未記録: ${stats.unknown}人`}
              color="default"
              variant="outlined"
            />
            <Chip
              label={`合計: ${stats.total}人`}
              color="primary"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 出欠テーブル */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>学籍番号</TableCell>
              <TableCell>氏名</TableCell>
              <TableCell align="center">出席状況</TableCell>
              <TableCell align="center">週番号</TableCell>
              <TableCell>備考</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceData.length > 0 ? (
              attendanceData.map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell>
                    {formatUserId(student.studentInfo.userId)}
                  </TableCell>
                  <TableCell>
                    {`${student.studentInfo.lastName} ${student.studentInfo.firstName}`}
                  </TableCell>
                  <TableCell align="center">
                    {getStatusChip(student.attendance.status)}
                  </TableCell>
                  <TableCell align="center">
                    {student.attendance.week ? (
                      <Chip
                        label={`Week ${student.attendance.week}`}
                        color="info"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{student.attendance.notes || "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    出席データがありません
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AttendanceTable;
