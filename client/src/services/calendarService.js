import { api } from "./api";

// カレンダーイベントの取得
export const getCalendarEvents = async () => {
  try {
    const response = await api.get("/api/calendar/events");
    return response.data;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
};

// カレンダーイベントの追加
export const addCalendarEvent = async (eventData) => {
  try {
    const response = await api.post("/api/calendar/events", eventData);
    return response.data;
  } catch (error) {
    console.error("Error adding calendar event:", error);
    throw error;
  }
};

// カレンダーイベントの更新
export const updateCalendarEvent = async (eventId, eventData) => {
  try {
    const response = await api.put(
      `/api/calendar/events/${eventId}`,
      eventData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating calendar event:", error);
    throw error;
  }
};

// カレンダーイベントの削除
export const deleteCalendarEvent = async (eventId) => {
  try {
    const response = await api.delete(`/api/calendar/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    throw error;
  }
};

// 特定の日付範囲のイベントを取得
export const getCalendarEventsByDateRange = async (startDate, endDate) => {
  try {
    const response = await api.get("/api/calendar/events/range", {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching calendar events by date range:", error);
    throw error;
  }
};

// 特定のカテゴリのイベントを取得
export const getCalendarEventsByCategory = async (category) => {
  try {
    const response = await api.get("/api/calendar/events/category", {
      params: { category },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching calendar events by category:", error);
    throw error;
  }
};

// 親向けの非表示設定を切り替え
export const toggleEventVisibilityForParents = async (eventId) => {
  try {
    const response = await api.patch(
      `/api/calendar/events/${eventId}/toggle-visibility`
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling event visibility:", error);
    throw error;
  }
};
