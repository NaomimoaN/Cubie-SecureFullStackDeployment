import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Slide,
  Fade,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from "@mui/icons-material";

// カテゴリの色設定
const categoryColors = {
  homework: "#5EADF7",
  exam: "#EEACD9",
  event: "#33BD88",
  announcement: "#FE674D",
  meeting: "#E8DA53",
  other: "#FFA237",
};

const categoryLabels = {
  homework: "Homework",
  exam: "Exam",
  event: "Event",
  announcement: "Announcement",
  meeting: "Meeting",
  other: "Other",
};

// カスタムアイコンコンポーネント
const CustomIcon = ({ src, alt, ...props }) => (
  <img
    src={src}
    alt={alt}
    style={{
      width: "16px",
      height: "16px",
      filter: "invert(0.5)",
      ...props.style,
    }}
    {...props}
  />
);

//ADDR for DEMO////////////////////
const ENABLE_DEMO_AUTOFILL = true;

const demoData = {
  title: "Back-to-School Supply Swap",
  description: `Get ready for the new school year by exchanging unused school supplies and uniforms, and pick up what you need for free.
    ・Pencils, notebooks, erasers
    ・Backpacks, lunch boxes
    ・Uniforms, athletic wear (if applicable)
    ・etc.
  Let's make the most of our resources and help each other prepare for the new school year smoothly as a community.`,
};
///////////////////////////////////

const Calendar = ({
  events = [],
  onEventAdd,
  onEventEdit,
  onEventDelete,
  editable = false,
  loading = false,
  error = null,
  showAddDialog = false,
  onAddDialogClose = null,
  showAddButton = false,
  onAddButtonClick = null,
  userRole = null,
  onToggleEventVisibility = null,
}) => {
  const calendarRef = React.useRef(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000), // 1時間後
    allDay: false,
    repeat: "none",
    subject: null,
    targetAudience: "all",
    hiddenForParents: false,
  });

  // FullCalendar用のイベントデータに変換（親の場合は非表示のイベントを除外）
  const calendarEvents = events
    .filter((event) => {
      // 教師の場合は全てのイベントを表示
      if (userRole === "teacher") return true;
      // 親の場合は非表示設定されたイベントを除外
      if (userRole === "parent") {
        return !(event.hiddenForParents || false);
      }
      // その他の役割の場合は全て表示
      return true;
    })
    .map((event) => ({
      id: event._id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: "transparent",
      borderColor: categoryColors[event.category] || categoryColors.other,
      borderWidth: "2px",
      textColor: "#333333",
      className: `event-category-${event.category}`,
      extendedProps: {
        description: event.description,
        category: event.category,
        repeat: event.repeat,
      },
    }));

  const handleDateSelect = (selectInfo) => {
    if (!editable) return;

    setFormData({
      title: "",
      description: "",
      category: "other",
      start: selectInfo.start,
      end:
        selectInfo.end || new Date(selectInfo.start.getTime() + 60 * 60 * 1000), // 1時間後
      allDay: selectInfo.allDay,
      repeat: "none",
      subject: null,
      targetAudience: "all",
      hiddenForParents: false,
    });
    setSelectedEvent(null);
    setIsAddDialogOpen(true);
  };

  // 外部からダイアログを開く場合の処理
  useEffect(() => {
    if (showAddDialog && !isAddDialogOpen) {
      setFormData({
        title: "",
        description: "",
        category: "other",
        start: new Date(),
        end: new Date(new Date().getTime() + 60 * 60 * 1000), // 1時間後
        allDay: false,
        repeat: "none",
        subject: null,
        targetAudience: "all",
        hiddenForParents: false,
      });
      setSelectedEvent(null);
      setIsAddDialogOpen(true);
      if (onAddDialogClose) {
        onAddDialogClose();
      }
    }
  }, [showAddDialog, isAddDialogOpen, onAddDialogClose]);

  // eventsが更新された時に、イベント詳細表示のデータも同期
  useEffect(() => {
    if (selectedEventForDetail) {
      const updatedEvent = events.find(
        (e) => e._id === selectedEventForDetail._id
      );
      if (updatedEvent) {
        setSelectedEventForDetail(updatedEvent);
      }
    }
  }, [events, selectedEventForDetail?._id]);

  const handleEventClick = (clickInfo) => {
    const event = events.find((e) => e._id === clickInfo.event.id);
    if (!event) return;

    // 詳細表示を開く
    setSelectedEventForDetail(event);
    setIsEventDetailOpen(true);
  };

  const handleEventDrop = (dropInfo) => {
    if (!editable) return;

    const event = events.find((e) => e._id === dropInfo.event.id);
    if (!event) return;

    const updatedEvent = {
      ...event,
      start: dropInfo.event.start,
      end: dropInfo.event.end,
      allDay: dropInfo.event.allDay,
    };

    onEventEdit(updatedEvent);
  };

  const handleSubmit = () => {
    const eventData = {
      ...formData,
      start: formData.start.toISOString(),
      end: formData.end.toISOString(),
      hiddenForParents: formData.hiddenForParents || false,
    };

    console.log("Calendar - Submitting event data:", eventData);
    console.log(
      "Calendar - hiddenForParents value:",
      formData.hiddenForParents
    );

    if (selectedEvent) {
      onEventEdit({ ...selectedEvent, ...eventData });
    } else {
      onEventAdd(eventData);
    }

    setIsFormOpen(false);
    setIsAddDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleDelete = () => {
    if (selectedEvent) {
      onEventDelete(selectedEvent._id);
    }
    setDeleteDialogOpen(false);
    setIsFormOpen(false);
    setSelectedEvent(null);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setSelectedEvent(null);
  };

  const handleAddDialogClose = () => {
    setIsAddDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteFromList = (eventId) => {
    setEventToDelete(eventId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFromList = () => {
    if (eventToDelete) {
      onEventDelete(eventToDelete);
    }
    setDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  // 現在表示されている月のイベントをフィルタリング
  const getCurrentMonthEvents = () => {
    const currentYear = currentViewDate.getFullYear();
    const currentMonth = currentViewDate.getMonth();

    // console.log("getCurrentMonthEvents debug:", {
    //   currentViewDate: currentViewDate,
    //   currentYear: currentYear,
    //   currentMonth: currentMonth,
    //   currentMonthName: currentViewDate.toLocaleDateString("en-US", {
    //     month: "long",
    //   }),
    //   totalEvents: events.length,
    //   events: events.map((e) => ({
    //     title: e.title,
    //     start: e.start,
    //     year: new Date(e.start).getFullYear(),
    //     month: new Date(e.start).getMonth(),
    //     monthName: new Date(e.start).toLocaleDateString("en-US", {
    //       month: "long",
    //     }),
    //   })),
    // });

    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.start);
      const eventYear = eventDate.getFullYear();
      const eventMonth = eventDate.getMonth();

      // 完全一致のみ
      const exactMatch =
        eventYear === currentYear && eventMonth === currentMonth;

      // if (exactMatch) {
      //   console.log("Matching event:", event.title, eventDate);
      // }

      return exactMatch;
    });

    // console.log("Filtered events count:", filteredEvents.length);
    return filteredEvents;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  //ADDR for demo//////

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTextFieldClick = (fieldName) => {
    if (ENABLE_DEMO_AUTOFILL) {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: demoData[fieldName],
      }));
    }
  };

  /////////////////////

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="h-full w-full flex gap-2">
        {/* メインカレンダー（75%） */}
        <Box sx={{ flex: 1 }}>
          {/* Todayボタン */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 2,
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Button
                onClick={() => {
                  if (calendarRef.current) {
                    const calendarApi = calendarRef.current.getApi();
                    if (calendarApi) {
                      calendarApi.prev();
                    }
                  }
                }}
                sx={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#333333",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  padding: "8px",
                  borderRadius: "5px",
                  textTransform: "none",
                  minWidth: "auto",
                  "&:hover": {
                    backgroundColor: "#CFCECE",
                  },
                }}
              >
                ＜
              </Button>
              <Typography
                variant="h6"
                sx={{
                  color: "#333333",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
              >
                {currentViewDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </Typography>
              <Button
                onClick={() => {
                  if (calendarRef.current) {
                    const calendarApi = calendarRef.current.getApi();
                    if (calendarApi) {
                      calendarApi.next();
                    }
                  }
                }}
                sx={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#333333",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  padding: "8px",
                  borderRadius: "5px",
                  textTransform: "none",
                  minWidth: "auto",
                  "&:hover": {
                    backgroundColor: "#CFCECE",
                  },
                }}
              >
                ＞
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              "& .fc": {
                border: "none !important",
                boxShadow: "none !important",
                backgroundColor: "#E2E2E2",
                padding: "10px",
              },
              "& .fc *": {
                boxShadow: "none !important",
              },
              "& .fc-view-harness": {
                boxShadow: "none !important",
              },
              "& .fc-scrollgrid": {
                boxShadow: "none !important",
              },
              "& .fc-daygrid": {
                boxShadow: "none !important",
              },
              "& .fc-daygrid-day-frame": {
                boxShadow: "none !important",
              },
              "& .fc-daygrid-day": {
                boxShadow: "none !important",
              },
              "& .fc-daygrid-day-bg": {
                boxShadow: "none !important",
              },
              "& .fc-daygrid-day-events": {
                boxShadow: "none !important",
              },
              "& .fc-col-header": {
                boxShadow: "none !important",
              },
              "& .fc-col-header-cell": {
                boxShadow: "none !important",
              },
              "& .fc-scroller-harness": {
                backgroundColor: "#E2E2E2 !important",
                padding: "0 10px 0 0!important",
              },
              "& .fc-scroller": {
                backgroundColor: "#E2E2E2 !important",
                // margin: "0 10px !important",
              },
              // ヘッダー（月・年・ナビゲーションボタン）の色
              "& .fc-toolbar-title": {
                color: "#333333 !important",
                fontSize: "1.5rem !important",
                fontWeight: "bold !important",
              },
              "& .fc-button": {
                backgroundColor: "transparent !important",
                border: "none !important",
                color: "#333333 !important",
                "&:hover": {
                  backgroundColor: "#CFCECE !important",
                },
              },
              "& .fc-toolbar-chunk": {
                display: "flex !important",
                alignItems: "center !important",
                gap: "4px !important",
              },
              // 曜日ヘッダーの色と背景
              "& .fc-col-header-cell": {
                // border: "none !important",
                // backgroundColor: "transparent !important",
                borderRadius: "5px !important",
                padding: "0 2.5px !important",
                // width: "calc(100% - 10px) !important",
              },
              "& .fc-col-header-cell a": {
                color: "#333333 !important",
                fontWeight: "600 !important",
                fontSize: "0.9rem !important",
                display: "block !important",
                padding: "8px !important",
                borderRadius: "5px !important",
                width: "100% !important",
                boxSizing: "border-box !important",
              },
              // 日曜日の背景色
              "& .fc-col-header-cell:first-child": {
                backgroundColor: "#FE674D !important",
              },
              "& .fc-col-header-cell:first-child a": {
                color: "white !important",
              },
              // 月曜日から金曜日の背景色
              "& .fc-col-header-cell:nth-of-type(2)": {
                backgroundColor: "#EDF6FE !important",
              },
              "& .fc-col-header-cell:nth-of-type(3)": {
                backgroundColor: "#EDF6FE !important",
              },
              "& .fc-col-header-cell:nth-of-type(4)": {
                backgroundColor: "#EDF6FE !important",
              },
              "& .fc-col-header-cell:nth-of-type(5)": {
                backgroundColor: "#EDF6FE !important",
              },
              "& .fc-col-header-cell:nth-of-type(6)": {
                backgroundColor: "#EDF6FE !important",
              },
              // 土曜日の背景色
              "& .fc-col-header-cell:last-child": {
                backgroundColor: "#BDDFFF !important",
              },
              // 日付の色と位置
              "& .fc-daygrid-day-number": {
                color: "#333333 !important",
                fontWeight: "500 !important",
                fontSize: "0.9rem !important",
                position: "absolute !important",
                top: "8px !important",
                left: "8px !important",
                right: "auto !important",
                bottom: "auto !important",
                zIndex: "1 !important",
              },
              // 今日の日付の色（通常の日付と同じ）
              "& .fc-day-today .fc-daygrid-day-number": {
                color: "#333333 !important",
                fontWeight: "500 !important",
              },
              // 他の月の日付の色
              "& .fc-day-other .fc-daygrid-day-number": {
                color: "#cccccc !important",
              },
              // 土日の色
              "& .fc-day-sat .fc-daygrid-day-number": {
                color: "#2196f3 !important",
              },
              "& .fc-day-sun .fc-daygrid-day-number": {
                color: "#f44336 !important",
              },
              "& .fc-day-sat.fc-day-other .fc-daygrid-day-number": {
                color: "#e3f2fd !important",
              },
              "& .fc-day-sun.fc-day-other .fc-daygrid-day-number": {
                color: "#ffebee !important",
              },
              "& .fc-theme-standard td, & .fc-theme-standard th, & .fc-theme-standard .fc-scrollgrid":
                {
                  border: "none !important",
                },
              "& .fc-daygrid-day": {
                border: "none !important",
              },
              "& .fc-daygrid-day-frame": {
                border: "none !important",
                borderRadius: "10px !important",
                backgroundColor: "white",
                margin: "5px !important",
                minHeight: "80px !important",
                position: "relative !important",
              },
              "& .fc-scrollgrid-section-header": {
                border: "none !important",
              },
              "& .fc-col-header": {
                margin: "0 5px 0 0 !important",
                borderSpacing: "5px !important",
                borderCollapse: "separate !important",
              },
              "& .fc-scrollgrid-section-body": {
                border: "none !important",
              },
              "& .fc-daygrid-day-events": {
                border: "none !important",
              },
              "& .fc-daygrid-day-bg": {
                border: "none !important",
              },
              // 今日の日付のセル背景を通常と同じに
              "& .fc-day-today": {
                backgroundColor: "transparent !important",
              },
              // イベントの色と位置
              "& .fc-event": {
                borderRadius: "4px !important",
                border: "none !important",
                fontSize: "0.8rem !important",
                fontWeight: "500 !important",
                backgroundColor: "rgba(255, 255, 255, 0.9) !important",
                color: "#333333 !important",
                marginTop: "30px !important",
              },
              "& .fc-event-title": {
                color: "#333333 !important",
              },
              // カテゴリ別のボーダー色
              "& .event-category-homework": {
                borderColor: "#5EADF7 !important",
              },
              "& .event-category-exam": {
                borderColor: "#EEACD9 !important",
              },
              "& .event-category-event": {
                borderColor: "#33BD88 !important",
              },
              "& .event-category-announcement": {
                borderColor: "#FE674D !important",
              },
              "& .event-category-meeting": {
                borderColor: "#E8DA53 !important",
              },
              "& .event-category-other": {
                borderColor: "#FFA237 !important",
              },
              // ホバー効果
              "& .fc-daygrid-day:hover": {
                backgroundColor: "#f5f5f5 !important",
                borderRadius: "10px !important",
              },
            }}
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                listPlugin,
              ]}
              headerToolbar={{
                left: "",
                center: "",
                right: "",
              }}
              initialView="dayGridMonth"
              editable={editable}
              selectable={editable}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={calendarEvents}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              datesSet={(dateInfo) => {
                // カレンダーで表示されている月の最初の日を取得
                const firstDayOfMonth = new Date(dateInfo.start);

                // 前月の日付の場合は、翌月の1日を設定
                if (firstDayOfMonth.getDate() > 7) {
                  firstDayOfMonth.setMonth(firstDayOfMonth.getMonth() + 1, 1);
                } else {
                  firstDayOfMonth.setDate(1);
                }

                // console.log("Calendar view changed:", {
                //   start: dateInfo.start,
                //   end: dateInfo.end,
                //   firstDayOfMonth: firstDayOfMonth,
                //   month: firstDayOfMonth.toLocaleDateString("en-US", {
                //     month: "long",
                //     year: "numeric",
                //   }),
                // });
                setCurrentViewDate(firstDayOfMonth);
              }}
              height="auto"
            />
          </Box>
        </Box>

        {/* 右側の25%部分 */}
        <Box sx={{ width: "25%", minWidth: 280, position: "relative" }}>
          {/* オーバーレイ - スライドインボックスが開いている時のみ表示 */}
          {(isEventDetailOpen || isFormOpen) && (
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                zIndex: 20,
              }}
              onClick={() => {
                console.log("Overlay clicked");
                if (isEventDetailOpen) {
                  setIsEventDetailOpen(false);
                  setSelectedEventForDetail(null);
                }
                if (isFormOpen) {
                  handleClose();
                }
              }}
            />
          )}
          {/* イベント詳細表示（スライドイン） */}
          <Slide
            direction="left"
            in={isEventDetailOpen}
            mountOnEnter
            unmountOnExit
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "background.paper",
                borderRadius: 1,
                p: 2,
                height: "100%",
                overflowY: "auto",
                zIndex: 25,
                // boxShadow: 3,
              }}
              onClick={(e) => {
                // ボックス内のクリックは無視
                e.stopPropagation();
              }}
            >
              {selectedEventForDetail && (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 3,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      {/* 日付・時間 */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "500", fontSize: "22px" }}
                        >
                          {new Date(
                            selectedEventForDetail.start
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                          <div
                            style={{
                              fontWeight: "500",
                              fontSize: "14px",
                              color: "text.secondary",
                              marginTop: "5px",
                            }}
                          >
                            {new Date(
                              selectedEventForDetail.start
                            ).toLocaleDateString("en-US", {
                              weekday: "long",
                            })}
                          </div>
                          {/* 時間が設定されている場合は表示（allDayに関係なく） */}
                          {selectedEventForDetail.start &&
                            selectedEventForDetail.end &&
                            new Date(
                              selectedEventForDetail.start
                            ).getHours() !== 0 &&
                            new Date(selectedEventForDetail.end).getHours() !==
                              0 && (
                              <>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    color: "text.secondary",
                                    marginTop: "5px",
                                  }}
                                >
                                  {new Date(
                                    selectedEventForDetail.start
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  -{" "}
                                  {new Date(
                                    selectedEventForDetail.end
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Typography>
                              </>
                            )}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {editable && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setFormData({
                              title: selectedEventForDetail.title,
                              description:
                                selectedEventForDetail.description || "",
                              category: selectedEventForDetail.category,
                              start: new Date(selectedEventForDetail.start),
                              end: new Date(selectedEventForDetail.end),
                              allDay: selectedEventForDetail.allDay,
                              repeat: selectedEventForDetail.repeat || "none",
                              subject: selectedEventForDetail.subject || null,
                              targetAudience:
                                selectedEventForDetail.targetAudience || "all",
                            });
                            setSelectedEvent(selectedEventForDetail);
                            setIsEventDetailOpen(false);
                            setIsFormOpen(true);
                          }}
                          sx={{ color: "text.primary" }}
                        >
                          <CustomIcon
                            src="/icons/Pencil.svg"
                            alt="Edit"
                            style={{ width: "18px", height: "18px" }}
                          />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                      backgroundColor: selectedEventForDetail.hiddenForParents
                        ? "#EDF6FE"
                        : "#BDDFFF",
                      borderRadius: "5px",
                      padding: "8px",
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{
                        flex: 1,
                        fontSize: "16px",
                        fontWeight: "600",
                        padding: "5px",
                      }}
                    >
                      {selectedEventForDetail.title}
                    </Typography>
                    {userRole === "teacher" && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (onToggleEventVisibility) {
                            onToggleEventVisibility(selectedEventForDetail._id);
                            // 即座にローカル状態を更新
                            setSelectedEventForDetail((prev) => ({
                              ...prev,
                              hiddenForParents: !prev.hiddenForParents,
                            }));
                          }
                        }}
                        sx={{ color: "text.primary" }}
                      >
                        {selectedEventForDetail.hiddenForParents ? (
                          <CustomIcon src="/icons/EyeClose.svg" alt="Hide" />
                        ) : (
                          <CustomIcon src="/icons/Eye.svg" alt="Show" />
                        )}
                      </IconButton>
                    )}
                  </div>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {/* 詳細 */}
                    {selectedEventForDetail.description && (
                      <Box>
                        {/* <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          Description
                        </Typography> */}
                        <Typography variant="body2">
                          {selectedEventForDetail.description}
                        </Typography>
                      </Box>
                    )}

                    {/* カテゴリ */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Category
                      </Typography>
                      <Chip
                        label={
                          categoryLabels[selectedEventForDetail.category] ||
                          "Other"
                        }
                        size="small"
                        sx={{
                          bgcolor:
                            categoryColors[selectedEventForDetail.category] ||
                            categoryColors.other,
                          color: "white",
                        }}
                      />
                    </Box>

                    {/* 繰り返し */}
                    {/* {selectedEventForDetail.repeat &&
                      selectedEventForDetail.repeat !== "none" && (
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            Repeat
                          </Typography>
                          <Typography variant="body2">
                            {selectedEventForDetail.repeat}
                          </Typography>
                        </Box>
                      )} */}
                  </Box>

                  {/* 削除ボタン */}
                  {editable && (
                    <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={() => {
                          setEventToDelete(selectedEventForDetail._id);
                          setDeleteDialogOpen(true);
                          setIsEventDetailOpen(false);
                          setSelectedEventForDetail(null);
                        }}
                        sx={{
                          backgroundColor: "#E2E2E2",
                          color: "#333333",
                          border: "none",
                          fontSize: "12px",
                          width: "40%",
                          borderRadius: "25px",
                          textTransform: "none",
                          flex: 1,
                          display: "flex",
                          justifyContent: "center",
                          margin: "0 auto",

                          "&:hover": {
                            backgroundColor: "#CFCECE",
                          },
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Slide>

          {/* イベントフォーム（スライドイン） */}
          <Slide direction="left" in={isFormOpen} mountOnEnter unmountOnExit>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "background.paper",
                borderRadius: 1,
                p: 2,
                height: "100%",
                overflowY: "auto",
                zIndex: 25,
                // boxShadow: 3,
              }}
              onClick={(e) => {
                // ボックス内のクリックは無視
                e.stopPropagation();
              }}
            >
              {selectedEvent && (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 3,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      {/* 日付・時間 */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "500", fontSize: "22px" }}
                        >
                          {new Date(formData.start).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                          <div
                            style={{
                              fontWeight: "500",
                              fontSize: "14px",
                              color: "text.secondary",
                              marginTop: "5px",
                            }}
                          >
                            {new Date(formData.start).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                              }
                            )}
                          </div>

                          {/* 時間が設定されている場合は表示（allDayに関係なく） */}
                          {formData.start &&
                            formData.end &&
                            formData.start.getHours() !== 0 &&
                            formData.end.getHours() !== 0 && (
                              <>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    color: "text.secondary",
                                    marginTop: "5px",
                                  }}
                                >
                                  {new Date(formData.start).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}{" "}
                                  -{" "}
                                  {new Date(formData.end).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </Typography>
                              </>
                            )}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            marginTop: "8px",
                          }}
                        >
                          <CustomIcon
                            src="/icons/Pencil.svg"
                            alt="Edit"
                            style={{
                              width: "18px",
                              height: "18px",
                              filter:
                                "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(199deg) brightness(104%) contrast(97%)",
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "13px",
                              color: "#317CD8",
                              fontWeight: "500",
                            }}
                          >
                            Editing
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                  {!selectedEvent && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                        backgroundColor: "#BDDFFF",
                        borderRadius: "5px",
                        padding: "8px",
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ flex: 1 }}
                      >
                        Create Event
                      </Typography>
                    </div>
                  )}
                </>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* タイトル */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      backgroundColor: selectedEvent?.hiddenForParents
                        ? "#EDF6FE"
                        : "#BDDFFF",
                      borderRadius: "4px",
                      padding: "8px",
                    }}
                  >
                    <TextField
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      fullWidth
                      required
                      placeholder="Event Title"
                      border="none"
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "4px",
                          fontSize: "16px",
                          fontWeight: "600",
                          backgroundColor: selectedEvent?.hiddenForParents
                            ? "#EDF6FE !important"
                            : "#BDDFFF !important",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none",
                        },
                      }}
                    />
                    {userRole === "teacher" && selectedEvent && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (onToggleEventVisibility) {
                            onToggleEventVisibility(selectedEvent._id);
                            // 即座にローカル状態を更新
                            setSelectedEvent((prev) => ({
                              ...prev,
                              hiddenForParents: !prev.hiddenForParents,
                            }));
                          }
                        }}
                        sx={{ color: "text.primary" }}
                      >
                        {selectedEvent.hiddenForParents ? (
                          <CustomIcon src="/icons/EyeClose.svg" alt="Hide" />
                        ) : (
                          <CustomIcon src="/icons/Eye.svg" alt="Show" />
                        )}
                      </IconButton>
                    )}
                  </Box>
                </Box>

                {/* 説明 */}
                <Box>
                  {/* <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Description
                  </Typography> */}
                  <TextField
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: "14px",
                      },
                    }}
                  />
                </Box>

                {/* カテゴリ */}
                <Box>
                  {/* <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Category
                  </Typography> */}
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                        },
                        "& .MuiSelect-select": {
                          fontSize: "14px",
                        },
                      }}
                    >
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                backgroundColor: categoryColors[key],
                                borderRadius: "50%",
                              }}
                            />
                            {label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* 開始日時 */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1, fontSize: "12px" }}
                  >
                    Start
                  </Typography>
                  <DateTimePicker
                    value={formData.start}
                    onChange={(newValue) =>
                      setFormData({ ...formData, start: newValue })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                          },
                          "& .MuiInputBase-input": {
                            fontSize: "14px !important",
                          },
                          "& .MuiInputBase-root": {
                            fontSize: "14px !important",
                          },
                          "& input": {
                            fontSize: "14px !important",
                          },
                          "& .MuiInputBase-inputAdornedStart": {
                            fontSize: "14px !important",
                          },
                        }}
                      />
                    )}
                  />
                </Box>

                {/* 終了日時 */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1, fontSize: "12px" }}
                  >
                    End
                  </Typography>
                  <DateTimePicker
                    value={formData.end}
                    onChange={(newValue) =>
                      setFormData({ ...formData, end: newValue })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                          },
                          "& .MuiInputBase-input": {
                            fontSize: "14px !important",
                          },
                          "& .css-vycme6-MuiPickersInputBase-root-MuiPickersOutlinedInput-root":
                            {
                              fontSize: "14px !important",
                            },
                        }}
                      />
                    )}
                  />
                </Box>

                {/* 繰り返し */}
                {/* <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Repeat
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.repeat}
                      onChange={(e) =>
                        setFormData({ ...formData, repeat: e.target.value })
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                        },
                      }}
                    >
                      <MenuItem value="none">No Repeat</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                </Box> */}

                {/* ボタン */}
                {editable && (
                  <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {/* {selectedEvent && (
                        <Button
                          onClick={() => setDeleteDialogOpen(true)}
                          sx={{
                            backgroundColor: "#E2E2E2",
                            color: "#333333",
                            border: "none",
                            fontSize: "12px",
                            borderRadius: "25px",
                            textTransform: "none",
                            flex: 1,
                            "&:hover": {
                              backgroundColor: "#CFCECE",
                            },
                          }}
                        >
                          Delete
                        </Button>
                      )} */}
                      <Button
                        onClick={handleClose}
                        sx={{
                          backgroundColor: "#E2E2E2",
                          color: "#333333",
                          border: "none",
                          fontSize: "12px",
                          borderRadius: "25px",
                          textTransform: "none",
                          flex: 1,
                          "&:hover": {
                            backgroundColor: "#CFCECE",
                          },
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        sx={{
                          backgroundColor: "#F06C00",
                          color: "white",
                          border: "none",
                          fontSize: "12px",
                          borderRadius: "25px",
                          textTransform: "none",
                          flex: 1,
                          "&:hover": {
                            backgroundColor: "#D55A00",
                          },
                        }}
                      >
                        {selectedEvent ? "Update" : "Add"}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Slide>

          {/* 月のイベントリスト（通常表示） */}
          <Fade in={!isFormOpen && !isEventDetailOpen}>
            <Box
              sx={{
                borderRadius: 1,
                p: 2,
                height: "100%",
                overflowY: "auto",
              }}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                color="text.primary"
                sx={{
                  mb: 3,
                  mt: 2,
                  cursor: "pointer",
                  "&:hover": {
                    opacity: 0.7,
                  },
                }}
                onClick={() => {
                  if (calendarRef.current) {
                    const calendarApi = calendarRef.current.getApi();
                    if (calendarApi) {
                      calendarApi.today();
                    }
                  }
                }}
              >
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                <div
                  style={{
                    fontWeight: "500",
                    fontSize: "1.1rem",
                    marginTop: "10px",
                  }}
                >
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                  })}
                </div>
              </Typography>
              <hr />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  mt: 3,
                }}
              >
                <Typography fontSize={16} gutterBottom sx={{ mb: 0 }}>
                  This Month's Events
                </Typography>
                {showAddButton && onAddButtonClick && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={onAddButtonClick}
                    sx={{
                      minWidth: "auto",
                      pr: 0.2,
                      py: 1.0,
                      color: "text.primary",
                      bgcolor: "background.default",
                      borderRadius: "50%",
                      "&:hover": {
                        bgcolor: "action.hover",
                        opacity: 0.8,
                      },
                    }}
                  ></Button>
                )}
              </Box>

              {(() => {
                const currentMonthEvents = getCurrentMonthEvents();
                const filteredCurrentMonthEvents = currentMonthEvents
                  .filter((event) => {
                    // 教師の場合は全てのイベントを表示
                    if (userRole === "teacher") return true;
                    // 親の場合は非表示設定されたイベントを除外
                    if (userRole === "parent") {
                      return !(event.hiddenForParents || false);
                    }
                    // その他の役割の場合は全て表示
                    return true;
                  })
                  .map((event) => ({
                    id: event._id,
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    allDay: event.allDay,
                    backgroundColor:
                      categoryColors[event.category] || categoryColors.other,
                    borderColor:
                      categoryColors[event.category] || categoryColors.other,
                    extendedProps: {
                      description: event.description,
                      category: event.category,
                      repeat: event.repeat,
                    },
                  }));

                return filteredCurrentMonthEvents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No events this month
                  </Typography>
                ) : (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {filteredCurrentMonthEvents
                      .sort((a, b) => new Date(a.start) - new Date(b.start))
                      .map((event) => (
                        <Box
                          key={event.id}
                          sx={{
                            p: "5px 12px",
                            cursor: "pointer",
                            mb: 1,
                            "&:hover": {
                              bgcolor: "action.hover",
                              opacity: 0.8,
                            },
                          }}
                          onClick={() => {
                            const originalEvent = events.find(
                              (e) => e._id === event.id
                            );
                            if (originalEvent) {
                              // 最新のイベントデータを取得して設定
                              const updatedEvent = { ...originalEvent };
                              setSelectedEventForDetail(updatedEvent);
                              setIsEventDetailOpen(true);
                            }
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                backgroundColor: event.backgroundColor,
                                borderRadius: "50%",
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: "bold", flex: 1 }}
                            >
                              {event.title}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              {/* 教師の場合のみ目のアイコンを表示 */}
                              {userRole === "teacher" && (
                                <IconButton
                                  size="small"
                                  color="text.secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onToggleEventVisibility) {
                                      onToggleEventVisibility(event.id);
                                      // 即座にローカル状態を更新
                                      const originalEvent = events.find(
                                        (e) => e._id === event.id
                                      );
                                      if (originalEvent) {
                                        const updatedEvent = {
                                          ...originalEvent,
                                          hiddenForParents:
                                            !originalEvent.hiddenForParents,
                                        };
                                        // events配列を更新する代わりに、イベント詳細表示も更新
                                        if (
                                          selectedEventForDetail &&
                                          selectedEventForDetail._id ===
                                            event.id
                                        ) {
                                          setSelectedEventForDetail(
                                            updatedEvent
                                          );
                                        }
                                      }
                                    }
                                  }}
                                  sx={{ p: 0.3, color: "text.primary" }}
                                >
                                  {(() => {
                                    // 元のイベントデータからhiddenForParentsを取得
                                    const originalEvent = events.find(
                                      (e) => e._id === event.id
                                    );
                                    return originalEvent?.hiddenForParents ? (
                                      <CustomIcon
                                        src="/icons/EyeClose.svg"
                                        alt="Hide"
                                      />
                                    ) : (
                                      <CustomIcon
                                        src="/icons/Eye.svg"
                                        alt="Show"
                                      />
                                    );
                                  })()}
                                </IconButton>
                              )}
                              {/* 教師の場合のみゴミ箱アイコンを表示 */}
                              {userRole === "teacher" && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFromList(event.id);
                                  }}
                                  sx={{ p: 0.3, color: "text.primary" }}
                                >
                                  <CustomIcon
                                    src="/icons/Bin.svg"
                                    alt="Delete"
                                  />
                                </IconButton>
                              )}
                            </Box>
                          </Box>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {new Date(event.start).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                            <div style={{ marginTop: "2px" }}>
                              {new Date(event.start).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                }
                              )}
                            </div>
                            {/* 時間が設定されている場合は表示（allDayに関係なく） */}
                            {new Date(event.start).getHours() !== 0 && (
                              <div style={{ marginTop: "2px" }}>
                                {new Date(event.start).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                          </Typography>

                          <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                            <Chip
                              label={
                                categoryLabels[event.extendedProps.category] ||
                                "Other"
                              }
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                bgcolor: event.backgroundColor,
                                color: "white",
                              }}
                            />
                            {event.extendedProps.repeat !== "none" && (
                              <Chip
                                label={event.extendedProps.repeat}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.7rem" }}
                              />
                            )}
                          </Box>
                        </Box>
                      ))}
                  </div>
                );
              })()}
            </Box>
          </Fade>
        </Box>
      </div>

      {/* 新規イベント追加ダイアログ */}
      <Dialog
        open={isAddDialogOpen}
        onClose={handleAddDialogClose}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "10px",
            padding: "20px",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            Create Event
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* タイトル */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  name="title" //ADDR
                  value={formData.title}
                  onChange={handleChange} //ADDR
                  onClick={() => handleTextFieldClick("title")} //ADDR
                  // onChange={(e) =>
                  //   setFormData({ ...formData, title: e.target.value })
                  // }
                  fullWidth
                  required
                  placeholder="Event Title"
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "4px",
                      fontSize: "16px",
                      fontWeight: "600",
                    },
                  }}
                />
              </Box>
            </Box>
            {/* 開始・終了日時（左右配置） */}
            <Box sx={{ display: "flex", gap: 2 }}>
              {/* 開始日時 */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1, fontSize: "12px" }}
                >
                  Start
                </Typography>
                <DateTimePicker
                  value={formData.start}
                  onChange={(newValue) =>
                    setFormData({ ...formData, start: newValue })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                        },
                        "& .MuiInputBase-input": {
                          fontSize: "14px !important",
                        },
                      }}
                    />
                  )}
                />
              </Box>

              {/* 終了日時 */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1, fontSize: "12px" }}
                >
                  End
                </Typography>
                <DateTimePicker
                  value={formData.end}
                  onChange={(newValue) =>
                    setFormData({ ...formData, end: newValue })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                        },
                        "& .MuiInputBase-input": {
                          fontSize: "14px !important",
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Box>
            {/* 説明 */}
            <Box>
              <TextField
                name="description" //ADDR
                value={formData.description}
                onChange={handleChange} //ADDR
                onClick={() => handleTextFieldClick("description")} //ADDR
                // onChange={(e) =>
                //   setFormData({ ...formData, description: e.target.value })
                // }
                fullWidth
                multiline
                rows={5}
                size="small"
                placeholder="Event Description"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "14px",
                  },
                }}
              />
            </Box>

            {/* カテゴリ */}
            <Box>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                    },
                    "& .MuiSelect-select": {
                      fontSize: "14px",
                    },
                  }}
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: categoryColors[key],
                            borderRadius: "50%",
                          }}
                        />
                        {label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <div className="flex flex-row justify-end items-center mb-2 mr-10">
          <Typography variant="h6" sx={{ fontSize: "12px", mr: 1, mb: 0 }}>
            Visibility
          </Typography>
          {userRole === "teacher" && (
            <IconButton
              size="small"
              onClick={() => {
                const newHiddenForParents = !formData.hiddenForParents;
                console.log(
                  "Calendar - Toggling hiddenForParents from",
                  formData.hiddenForParents,
                  "to",
                  newHiddenForParents
                );
                setFormData({
                  ...formData,
                  hiddenForParents: newHiddenForParents,
                });
              }}
              sx={{ color: "text.primary" }}
            >
              {formData.hiddenForParents ? (
                <CustomIcon src="/icons/EyeClose.svg" alt="Hide" />
              ) : (
                <CustomIcon src="/icons/Eye.svg" alt="Show" />
              )}
            </IconButton>
          )}
        </div>
        {/* <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              backgroundColor: selectedEventForDetail.hiddenForParents
                ? "#EDF6FE"
                : "#BDDFFF",
              borderRadius: "5px",
              padding: "8px 12px",
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontSize: "12px", color: "text.secondary" }}
            >
              {selectedEventForDetail.hiddenForParents
                ? "Hidden from parents"
                : "Visible to parents"}
            </Typography>
          </div>
        </div> */}
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 1,
            pt: 2,
          }}
        >
          <Button
            onClick={handleAddDialogClose}
            sx={{
              backgroundColor: "#E2E2E2",
              color: "#333333",
              border: "none",
              fontSize: "12px",
              borderRadius: "25px",
              padding: "8px 20px",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#CFCECE",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            sx={{
              backgroundColor: "#F06C00",
              color: "white",
              border: "none",
              fontSize: "12px",
              borderRadius: "25px",
              padding: "8px 20px",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#D55A00",
              },
            }}
          >
            Create Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "5px",
            padding: "40px 40px 30px 40px",
          },
        }}
      >
        <DialogContent>
          <Typography>Are you sure you want to delete this event?</Typography>
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 0.5,
          }}
        >
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              backgroundColor: "#E2E2E2",
              color: "#333333",
              border: "none",
              fontSize: "12px",
              borderRadius: "25px",
              padding: "5px 20px",
              boxShadow: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteFromList}
            color="error"
            variant="contained"
            sx={{
              backgroundColor: "#F06C00",
              color: "white",
              border: "none",
              fontSize: "12px",
              borderRadius: "25px",
              padding: "5px 20px",
              boxShadow: "none",
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default Calendar;
