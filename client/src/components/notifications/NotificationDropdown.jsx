import React, { useState, useEffect, useRef } from "react";
import NotificationItem from "./NotificationItem";
import { useChat } from "../../hooks/useChat";

const NotificationDropdown = ({ isOpen, onClose, user }) => {
  const dropdownRef = useRef(null);
  const { notifications, markAllNotificationsAsRead } = useChat();

  // Use real notifications from ChatContext
  const allNotifications = notifications || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Mark all notifications as read when dropdown opens
  useEffect(() => {
    if (isOpen && markAllNotificationsAsRead) {
      markAllNotificationsAsRead();
    }
  }, [isOpen, markAllNotificationsAsRead]);

  // Filter notifications based on user's notification settings
  const filteredNotifications = allNotifications.filter((notification) => {
    if (!user?.notificationSettings) return true;

    switch (notification.type) {
      case "message":
        return user.notificationSettings.groupChat;
      case "announcement":
      case "schoolUpdate":
      case "gradeUpdate":
        return user.notificationSettings.schoolUpdate;
      case "calendar":
        return user.notificationSettings.calendar;
      case "systemUpdate":
        return user.notificationSettings.systemUpdate;
      default:
        return true;
    }
  });

  // Mark notification as read (not needed anymore since we mark all as read on open)
  const markAsRead = (notificationId) => {
    // This function can be removed or kept for individual marking if needed
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      style={{ top: "100%" }}
    >
      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto scrollbar-hide">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            <p>No notifications to show</p>
            <p className="text-sm mt-1">
              Check your notification settings in profile
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
