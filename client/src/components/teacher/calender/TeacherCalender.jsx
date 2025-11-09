// client/src/components/parent/ParentAnnouncement.jsx.jsx
/**
 * Announcement component for parents, displaying announcements related to their children.
 * It sets up the sub-sidebar configuration for announcements and handles cleanup on unmount.
 * This temporary component, you can recreate this for all roles like teacher, student, etc.
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Button,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import Calendar from "../../common/Calendar";
import {
  getCalendarEvents,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  toggleEventVisibilityForParents,
} from "../../../services/calendarService";

const TeacherCalender = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getCalendarEvents();
      if (response.success) {
        setEvents(response.data);
      } else {
        setError("Failed to fetch events");
      }
    } catch (err) {
      setError("Error fetching events");
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventAdd = async (eventData) => {
    try {
      const response = await addCalendarEvent(eventData);
      if (response.success) {
        setEvents((prev) => [...prev, response.data]);
      } else {
        setError("Failed to add event");
      }
    } catch (err) {
      setError("Error adding event");
      console.error("Error adding event:", err);
    }
  };

  const handleEventEdit = async (eventData) => {
    try {
      const response = await updateCalendarEvent(eventData._id, eventData);
      if (response.success) {
        setEvents((prev) =>
          prev.map((event) =>
            event._id === eventData._id ? response.data : event
          )
        );
      } else {
        setError("Failed to update event");
      }
    } catch (err) {
      setError("Error updating event");
      console.error("Error updating event:", err);
    }
  };

  const handleEventDelete = async (eventId) => {
    try {
      const response = await deleteCalendarEvent(eventId);
      if (response.success) {
        setEvents((prev) => prev.filter((event) => event._id !== eventId));
      } else {
        setError("Failed to delete event");
      }
    } catch (err) {
      setError("Error deleting event");
      console.error("Error deleting event:", err);
    }
  };

  const handleAddButtonClick = () => {
    setShowAddDialog(true);
  };

  // イベントの表示/非表示を切り替え（親向けの設定）
  const handleToggleEventVisibility = async (eventId) => {
    try {
      const response = await toggleEventVisibilityForParents(eventId);
      if (response.success) {
        // イベントリストを更新
        setEvents((prev) =>
          prev.map((event) => (event._id === eventId ? response.data : event))
        );
      } else {
        setError("Failed to toggle event visibility");
      }
    } catch (err) {
      setError("Error toggling event visibility");
      console.error("Error toggling event visibility:", err);
    }
  };

  return (
    <div className="p-4 bg-white box-shadow-none h-full">
      {/* AddR h-full */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1" fontSize={26} fontWeight={500} component="h1">
          Calendar
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Card elevation={0}>
        {/* AddR elevation={0}*/}
        <CardContent sx={{ p: 0 }}>
          <Calendar
            events={events}
            onEventAdd={handleEventAdd}
            onEventEdit={handleEventEdit}
            onEventDelete={handleEventDelete}
            editable={true}
            loading={loading}
            error={error}
            showAddDialog={showAddDialog}
            onAddDialogClose={() => setShowAddDialog(false)}
            showAddButton={true}
            onAddButtonClick={handleAddButtonClick}
            userRole="teacher"
            onToggleEventVisibility={handleToggleEventVisibility}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherCalender;
