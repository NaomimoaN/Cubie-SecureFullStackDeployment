// client/src/components/parent/calender/ParentCalender.jsx

/**
 * Calendar component for parents, displaying calendars related to their children.
 * It sets up the sub-sidebar configuration for child selection and handles cleanup on unmount.
 * This is a temporary component; similar components can be created for other roles like teacher.
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import { Box, Typography, Card, CardContent, Alert } from "@mui/material";
import Calendar from "../../common/Calendar";
import { getCalendarEvents } from "../../../services/calendarService";

/**
 * @param {Object} props - The component properties.
 * @param {Object} props.user - The user object from the authentication context, containing user role and familyStudents.
 * @returns {JSX.Element} The rendered Parent Calendar component or a message if child information is unavailable.
 */
function ParentCalender({ user }) {
  const { childId } = useParams(); // Get childId from URL parameters.
  const navigate = useNavigate(); // Hook for navigation.
  const { setSubSidebarConfig } = useSubSidebar(); // Access sub-sidebar context.
  const [childDetails, setChildDetails] = useState(null); // State to store details of the selected child.
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Effect hook to manage the sub-sidebar configuration and selected child details.
   * It runs on component mount and whenever `childId`, `user`, or `setSubSidebarConfig` changes.
   */
  useEffect(() => {
    // Validate user role and familyStudents data. If invalid, clear sub-sidebar and child details.
    if (
      !user ||
      user.role !== "parent" ||
      !Array.isArray(user.familyStudents) ||
      user.familyStudents.length === 0
    ) {
      setSubSidebarConfig(null);
      setChildDetails(null);
      return;
    }

    // Configure the sub-sidebar to display a list of the parent's children for selection.
    setSubSidebarConfig({
      type: "parentChildrenSelection",
      data: {
        children: user.familyStudents,
        basePath: "/parent/calender", // Base path for child-specific calendar URLs.
      },
    });

    let selectedChild = null;
    // If a childId is present in the URL, try to find that child.
    if (childId) {
      selectedChild = user.familyStudents.find(
        (child) => child?.userId === childId
      );
    }
    // If no child is selected or the URL childId is invalid, default to the first child.
    if (!selectedChild && user.familyStudents.length > 0) {
      selectedChild = user.familyStudents[0];
      // If a default child is selected and it's not the one in the URL, navigate to its URL.
      if (selectedChild && childId !== selectedChild.userId) {
        navigate(`/parent/calender/${selectedChild.userId}`, {
          replace: true,
        }); // Use replace to avoid creating extra history entries.
      }
    }

    // Set the childDetails state based on the determined selectedChild.
    if (selectedChild) {
      setChildDetails(selectedChild);
    } else {
      setChildDetails(null);
    }

    // Cleanup function: Resets the sub-sidebar configuration when the component unmounts or dependencies change.
    return () => {
      setSubSidebarConfig(null);
    };
  }, [childId, user, setSubSidebarConfig, navigate]); // Add navigate to dependencies as it's used in the effect.

  useEffect(() => {
    fetchEvents();

    // 定期的にイベントを再取得（1分ごと）
    const interval = setInterval(() => {
      fetchEvents();
    }, 60 * 1000);

    // ページがフォーカスされた時にイベントを再取得
    const handleFocus = () => {
      fetchEvents();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getCalendarEvents();
      if (response.success) {
        console.log("Parent Calendar - Fetched events:", response.data);
        console.log(
          "Parent Calendar - Events with hiddenForParents:",
          response.data.map((event) => ({
            title: event.title,
            hiddenForParents: event.hiddenForParents,
          }))
        );
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

  // Parent用は編集機能を無効化
  const handleEventAdd = () => {};
  const handleEventEdit = () => {};
  const handleEventDelete = () => {};

  // Conditional rendering based on whether child details are available.
  if (!childDetails) {
    return (
      <div className="p-4 text-center text-xl text-gray-600 h-full flex items-center justify-center">
        Child information not available or not found.
      </div>
    );
  }

  // Main component rendering for the selected child's calendar.
  return (
    <Box sx={{ p: 3, backgroundColor: "white" }}>
      <Typography
        variant="h4"
        fontSize={26}
        fontWeight={500}
        sx={{ mb: 3 }}
        align="left"
      >
        Calendar
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Calendar
            events={events}
            onEventAdd={handleEventAdd}
            onEventEdit={handleEventEdit}
            onEventDelete={handleEventDelete}
            editable={false}
            loading={loading}
            error={error}
            userRole="parent"
          />
        </CardContent>
      </Card>
    </Box>
  );
}

export default ParentCalender;
