/**
 * @purpose 出席チェックリスト管理コンポーネント（MUIデザイン）
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
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Save, Refresh, People } from "@mui/icons-material";
import CheckIcon from "../../../public/icons/Check.svg";
import {
  getMyDivisionStudents,
  saveAttendanceRecords,
  getAttendanceByDate,
} from "../../services/attendanceService";
import useAuth from "../../hooks/useAuth";
import moment from "moment-timezone";

const AttendanceChecklist = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDivision, setSelectedDivision] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [attendanceCache, setAttendanceCache] = useState({});
  const [savedDates, setSavedDates] = useState(new Set());

  // ダイアログ状態管理
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const attendanceOptions = [
    { value: "", label: "Please select", color: "#9e9e9e" },
    { value: "present", label: "Present", color: "#62CEA5" },
    { value: "absent", label: "Absent", color: "#FF8F7C" },
    { value: "late", label: "Late", color: "#FFAF52" },
    { value: "early_leave", label: "Early Leave", color: "#F5C2E5" },
  ];

  // ObjectIdを短縮表示する関数
  const formatStudentId = (objectId) => {
    if (!objectId) return "N/A";
    // 最後の6文字を表示（例: ...7597e1）
    return `${objectId.slice(-6)}`;
  };

  // 出席状況に応じたChipのスタイル
  const getStatusChip = (status) => {
    const statusConfig = {
      present: { label: "Present", color: "success" },
      absent: { label: "Absent", color: "error" },
      late: { label: "Late", color: "warning" },
      early_leave: { label: "Early Leave", color: "info" },
      "": { label: "Please select", color: "default" },
    };

    // unknownやその他の無効な値を空文字列に変換
    const validStatus = statusConfig[status] ? status : "";
    const config = statusConfig[validStatus] || statusConfig[""];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  // コンポーネントマウント時に学生データを取得
  useEffect(() => {
    if (user && !authLoading) {
      fetchStudents();
    }
  }, [user, authLoading]);

  // 学生データを取得する関数（実際のAPI使用）
  const fetchStudents = async () => {
    // 認証チェック
    if (authLoading) {
      return;
    }

    if (!user) {
      setError("Authentication required. Please login.");
      return;
    }

    if (user.role !== "teacher") {
      setError("Only teachers can access this page.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getMyDivisionStudents();

      setStudents(result.data || []);
      setSelectedDivision(`Division ${result.division}`);
      setTeacherInfo(result.teacher);

      // 既存の出席記録を初期化（空の状態から開始）
      const initialAttendance = {};
      (result.data || []).forEach((student) => {
        initialAttendance[student._id] = {
          status: "",
          notes: "",
        };
      });
      setAttendance(initialAttendance);

      // 学生データ取得後、選択した日付の既存出席データを取得
      await fetchExistingAttendance(result.data || []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch student data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // 既存の出席データを取得する関数
  const fetchExistingAttendance = async (
    studentList = students,
    forceFetch = false
  ) => {
    if (studentList.length === 0) {
      return;
    }

    const dateKey = selectedDate.toISOString().split("T")[0];

    // キャッシュにデータがある場合、強制取得でない限りキャッシュを使用
    if (!forceFetch && attendanceCache[dateKey]) {
      setAttendance(attendanceCache[dateKey]);
      setHasUnsavedChanges(false);
      return;
    }

    setIsLoadingExistingData(true);
    try {
      const attendanceData = await getAttendanceByDate(selectedDate);

      // 既存のデータがある場合、出席状況を更新
      if (attendanceData.data && attendanceData.data.length > 0) {
        const updatedAttendance = {};

        // まず空の状態で初期化
        studentList.forEach((student) => {
          updatedAttendance[student._id] = {
            status: "",
            notes: "",
          };
        });

        // 既存のデータで上書き
        attendanceData.data.forEach((record) => {
          if (updatedAttendance[record.studentId]) {
            // 無効なstatus値をフィルタリング
            const validStatus = attendanceOptions.find(
              (opt) => opt.value === record.attendance.status
            )
              ? record.attendance.status
              : "";

            updatedAttendance[record.studentId] = {
              status: validStatus,
              notes: record.attendance.notes || "",
            };
          }
        });

        setAttendance(updatedAttendance);
        // キャッシュに保存
        setAttendanceCache((prev) => ({
          ...prev,
          [dateKey]: updatedAttendance,
        }));
        setHasUnsavedChanges(false);
      } else {
        // 既存データがない場合は空の状態に戻す
        const emptyAttendance = {};
        studentList.forEach((student) => {
          emptyAttendance[student._id] = {
            status: "",
            notes: "",
          };
        });
        setAttendance(emptyAttendance);
        // キャッシュに保存
        setAttendanceCache((prev) => ({
          ...prev,
          [dateKey]: emptyAttendance,
        }));
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("Failed to fetch existing attendance:", err);
      // エラーが発生してもユーザーには表示しない（新規作成として扱う）
    } finally {
      setIsLoadingExistingData(false);
    }
  };

  // 日付変更時の処理
  const handleDateChange = (newDate) => {
    if (newDate) {
      // 未保存の変更がある場合、確認ダイアログを表示
      if (hasUnsavedChanges) {
        setConfirmDialog({
          open: true,
          title: "Unsaved Changes",
          message:
            "There are unsaved changes. Do you want to discard the changes and move to a new date?",
          onConfirm: () => {
            setSelectedDate(newDate);
            if (students.length > 0) {
              fetchExistingAttendance();
            }
            setConfirmDialog({
              open: false,
              title: "",
              message: "",
              onConfirm: null,
            });
          },
        });
        return;
      }

      setSelectedDate(newDate);
      // 学生データが既にある場合、新しい日付の既存出席データを取得
      if (students.length > 0) {
        fetchExistingAttendance();
      }
    }
  };

  // 出席記録を保存する関数
  const saveAttendance = async () => {
    setSaving(true);
    setError("");

    try {
      // 記録データを整形（statusが設定されているもののみ）
      const recordsToSave = students
        .map((student) => {
          const studentAttendance = attendance[student._id];
          if (!studentAttendance?.status) return null;

          return {
            studentId: student._id,
            status: studentAttendance.status,
            notes: studentAttendance.notes || "",
          };
        })
        .filter(Boolean); // nullを除外

      if (recordsToSave.length === 0) {
        setError(
          "There are no attendance records to save. Please select at least one attendance status."
        );
        return;
      }

      // Vancouver時間で日付を処理
      const vancouverTime = moment(selectedDate)
        .tz("America/Vancouver")
        .format("YYYY-MM-DD");
      const dateStr = vancouverTime;

      // 実際のAPI呼び出し
      const result = await saveAttendanceRecords(
        recordsToSave,
        dateStr,
        "2024-2025"
      );

      // 成功メッセージを表示
      if (result.success) {
        // 保存成功時の処理を最適化
        const dateKey = selectedDate.toISOString().split("T")[0];

        // 状態更新を一括で行う
        setHasUnsavedChanges(false);
        setSavedDates((prev) => new Set([...prev, dateStr]));
        setAttendanceCache((prev) => ({
          ...prev,
          [dateKey]: { ...attendance },
        }));

        // シンプルな成功メッセージ
        setAlertDialog({
          open: true,
          message: "Saved",
        });

        // エラーがある場合は表示
        if (result.data.errors && result.data.errors.length > 0) {
          console.warn("Some records have errors:", result.data.errors);
          setAlertDialog({
            open: true,
            title: "Warning",
            message: `Some records have errors:\n${result.data.errors.join(
              "\n"
            )}`,
          });
        }
      } else {
        throw new Error(result.message || "Failed to save attendance.");
      }
    } catch (err) {
      console.error("Failed to save attendance:", err);
      setAlertDialog({
        open: true,
        title: "Error",
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to save attendance. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // 認証状態が変わった時に学生データを取得
  useEffect(() => {
    if (!authLoading) {
      fetchStudents();
    }
  }, [authLoading, user]);

  // 日付が変更されたときに既存の出席データを取得
  useEffect(() => {
    if (students.length > 0) {
      fetchExistingAttendance();
    }
  }, [selectedDate]);

  const handleStatusChange = (studentObjectId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentObjectId]: {
        ...prev[studentObjectId],
        status,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleNotesChange = (studentObjectId, notes) => {
    setAttendance((prev) => ({
      ...prev,
      [studentObjectId]: {
        ...prev[studentObjectId],
        notes,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // 出席統計を計算
  const getStats = () => {
    const stats = Object.values(attendance).reduce((acc, record) => {
      if (record?.status) {
        acc[record.status] = (acc[record.status] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      present: stats.present || 0,
      absent: stats.absent || 0,
      late: stats.late || 0,
      early_leave: stats.early_leave || 0,
      total: students.length,
      recorded: Object.values(stats).reduce((sum, count) => sum + count, 0),
    };
  };

  const stats = getStats();

  // 認証ローディング状態
  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* ヘッダーセクション */}
      <Card sx={{ boxShadow: "none", border: "none" }}>
        <CardContent>
          <Typography
            variant="h1"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: "500",
              fontSize: "26px",

              letterSpacing: "0.15px",
            }}
          >
            Attendance
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              pb: 2,
              pt: 2,
              // pl: 5, delr
              // pr: 5, delr
            }}
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, fontWeight: "500", fontSize: "18px" }}
              >
                {students.length > 0 && students[0].grade
                  ? `Grade ${students[0].grade} - `
                  : ""}
                {selectedDivision}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, fontWeight: "500", fontSize: "16px" }}
              >
                {students.length} students
              </Typography>
            </Box>

            {hasUnsavedChanges && (
              <Button
                variant="contained"
                onClick={saveAttendance}
                disabled={saving || loading || students.length === 0}
                sx={{
                  backgroundColor: "#F06C00",
                  "&:hover": {
                    backgroundColor: "#F06C00",
                  },
                  minWidth: "120px",
                  borderRadius: "25px",
                }}
              >
                {saving ? "Updating..." : "Save"}
              </Button>
            )}
          </Box>

          {/* 設定コントロール */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              // ml: 5, delr
              // mr: 5, delr
            }}
          >
            <Box sx={{ flex: 1, maxWidth: "300px" }}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={handleDateChange}
                disabled={loading}
                enableAccessibleFieldDOMStructure={false}
                slotProps={{
                  textField: {
                    variant: "outlined",
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Box>

            {/* 統計表示 */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                alignItems: "flex-end",
              }}
            >
              {isLoadingExistingData && (
                <Chip
                  label="Loading existing data..."
                  color="info"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
              {/* {hasUnsavedChanges && (
                <Chip
                  label="There are unsaved changes"
                  color="warning"
                  size="small"
                  sx={{ ml: 1, backgroundColor: "#33BD88" }}
                />
              )} */}

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  border: "1px solid rgba(25, 118, 210, 0.12)",
                  borderRadius: 1,
                  padding: "9px 8px",
                  width: "fit-content",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{
                    fontSize: "14px",
                    marginRight: "15px",
                    marginLeft: "15px",
                  }}
                >
                  {stats.present} Present
                </Typography>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ fontSize: "14px", marginRight: "15px" }}
                >
                  {stats.absent} Absent
                </Typography>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ fontSize: "14px", marginRight: "15px" }}
                >
                  {stats.late} Late
                </Typography>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ fontSize: "14px", marginRight: "15px" }}
                >
                  {stats.early_leave} Early Leave
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ローディング状態 */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading student data...
          </Typography>
        </Box>
      )}

      {/* 学生データがない場合の表示 */}
      {!loading && !error && students.length === 0 && (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <Alert severity="info">
            No students found for your division. Please contact the
            administrator.
          </Alert>
        </Box>
      )}

      {/* 出席チェックリストテーブル */}
      {!loading && !error && students.length > 0 && (
        <TableContainer
          component={Paper}
          sx={{
            boxShadow: "none",
            border: "none",
            pl: 5,
            pr: 5,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="center">Attendance Status</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatStudentId(student._id)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {`${student.lastName} ${student.firstName}`}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={
                          attendanceOptions.find(
                            (opt) =>
                              opt.value === attendance[student._id]?.status
                          )
                            ? attendance[student._id]?.status
                            : ""
                        }
                        onChange={(e) =>
                          handleStatusChange(student._id, e.target.value)
                        }
                        displayEmpty
                        disabled={isLoadingExistingData}
                        sx={{
                          "& .MuiSelect-select": {
                            backgroundColor: attendance[student._id]?.status
                              ? attendanceOptions.find(
                                  (opt) =>
                                    opt.value ===
                                    attendance[student._id]?.status
                                )?.color || "transparent"
                              : "transparent",
                            // fontWeight: attendance[student._id]?.status
                            //   ? "bold"
                            //   : "normal",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: attendance[student._id]?.status
                              ? attendanceOptions.find(
                                  (opt) =>
                                    opt.value ===
                                    attendance[student._id]?.status
                                )?.color || "#ccc"
                              : "#ccc",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: attendance[student._id]?.status
                              ? attendanceOptions.find(
                                  (opt) =>
                                    opt.value ===
                                    attendance[student._id]?.status
                                )?.color || "#ccc"
                              : "#ccc",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: attendance[student._id]?.status
                              ? attendanceOptions.find(
                                  (opt) =>
                                    opt.value ===
                                    attendance[student._id]?.status
                                )?.color || "#1976d2"
                              : "#1976d2",
                          },
                        }}
                      >
                        {attendanceOptions.map((option) => (
                          <MenuItem
                            key={option.value}
                            value={option.value}
                            sx={{
                              fontWeight:
                                option.value === attendance[student._id]?.status
                                  ? "bold"
                                  : "normal",
                            }}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Enter notes..."
                      value={attendance[student._id]?.notes || ""}
                      onChange={(e) =>
                        handleNotesChange(student._id, e.target.value)
                      }
                      variant="outlined"
                      disabled={isLoadingExistingData}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* データなしの状態 */}
      {!loading && students.length === 0 && !error && (
        <Card sx={{ boxShadow: "none", border: "none" }}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <People sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No student data found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No students found for your division. Please contact
                administrator.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* カスタム確認ダイアログ */}
      <Dialog
        open={confirmDialog.open}
        onClose={() =>
          setConfirmDialog({
            open: false,
            title: "",
            message: "",
            onConfirm: null,
          })
        }
        PaperProps={{
          sx: {
            backgroundColor: "#EDF6FE",
            border: "1px solid #317CD8",
            borderRadius: "5px",
            position: "fixed",
            top: "10%",
            margin: 0,
          },
        }}
      >
        <DialogTitle sx={{ color: "#317CD8", fontWeight: "bold" }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent sx={{ color: "#317CD8" }}>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDialog({
                open: false,
                title: "",
                message: "",
                onConfirm: null,
              })
            }
            sx={{ color: "#317CD8" }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDialog.onConfirm}
            variant="contained"
            sx={{
              backgroundColor: "#317CD8",
              "&:hover": { backgroundColor: "#317CD8" },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* カスタムアラートダイアログ */}
      <Dialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ open: false, title: "", message: "" })}
        PaperProps={{
          sx: {
            backgroundColor: "#EDF6FE",
            border: "1px solid #317CD8",
            borderRadius: "5px",
            position: "fixed",
            top: "10%",
            margin: 0,
            minWidth: "400px",
            maxWidth: "600px",
          },
        }}
      >
        <DialogTitle sx={{ color: "#317CD8", fontWeight: "bold" }}>
          {alertDialog.title}
        </DialogTitle>
        <DialogContent sx={{ color: "#317CD8" }}>
          <Box display="flex" alignItems="center" justifyContent="center">
            <img
              src={CheckIcon}
              alt="Check"
              style={{ width: 40, height: 40 }}
            />
            <Typography variant="h6" sx={{ ml: 2 }}>
              {alertDialog.message}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AttendanceChecklist;
