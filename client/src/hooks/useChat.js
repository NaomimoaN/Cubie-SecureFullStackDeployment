import { useContext } from "react";
import { ChatContext } from "../context/ChatContextInstance";

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    // Return empty values instead of throwing error
    return {
      notifications: [],
      markAllNotificationsAsRead: () => {},
      markNotificationAsRead: () => {},
      clearNotifications: () => {},
      groups: [],
      selectedGroup: null,
      setSelectedGroup: () => {},
      messages: [],
      setMessages: () => {},
      sendMessage: () => {},
      createGroup: () => {},
      loadMessages: () => {},
      user: null,
    };
  }
  return context;
};
