import React from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../hooks/useChat";
import useAuth from "../../hooks/useAuth";

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const { id, type, title, message, timestamp, isRead, groupId } = notification;
  const navigate = useNavigate();
  const { groups, setSelectedGroup } = useChat();
  const { user } = useAuth();

  const handleClick = () => {
    // Mark as read if unread
    if (!isRead) {
      onMarkAsRead(id);
    }

    // Navigate to chat page and select the group
    if (type === "message" && groupId) {
      // Find the group object
      const group = groups.find((g) => g._id === groupId);
      if (group) {
        // Set the selected group
        setSelectedGroup(group);
        // Navigate to role-based chat page
        const chatRoute =
          user?.role === "teacher" ? "/teacher/group-chat" : "/student/chat";
        navigate(chatRoute);
      }
    }
  };

  return (
    <div
      className={`px-4 py-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
        !isRead ? "bg-blue-50" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4
            className={`font-medium text-gray-900 mb-1 ${
              !isRead ? "font-semibold" : ""
            }`}
          >
            {title}
          </h4>
          <p className="text-gray-700 text-sm mb-2">{message}</p>
          <p className="text-gray-500 text-xs">{timestamp}</p>
        </div>

        {/* Unread indicator */}
        {!isRead && (
          <div className="ml-3 mt-1">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
