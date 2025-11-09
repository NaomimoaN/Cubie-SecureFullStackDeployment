import React from "react";
import { useChat } from "../../hooks/useChat";

// This is a demo component showing how to use the notification system
// You can add this to any page to test notifications
const NotificationTester = () => {
  const { createNotification } = useChat();

  const handleSystemUpdate = () => {
    createNotification(
      "systemUpdate",
      "System Update",
      "The system will be down for maintenance from 2:00 AM to 4:00 AM."
    );
  };

  const handleSchoolUpdate = () => {
    createNotification(
      "schoolUpdate",
      "School Announcement",
      "School will be closed tomorrow due to weather conditions."
    );
  };

  const handleCalendarEvent = () => {
    createNotification(
      "calendar",
      "Calendar Reminder",
      "Parent-teacher conference scheduled for tomorrow at 3:00 PM."
    );
  };


  const handleGroupChatMessage = () => {
    createNotification(
      "message",
      "Group Chat Message",
      "You have a new message in Math Class Group.",
      {
        group: "Math Class",
        groupId: "test-group-id",
        sender: {
          _id: "test-sender-id",
          profile: {
            firstName: "Test",
            lastName: "Teacher"
          }
        }
      }
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Test Notifications</h3>
      <div className="space-y-3">
        <button
          onClick={handleSystemUpdate}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Test System Update
        </button>
        <button
          onClick={handleSchoolUpdate}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test School Update
        </button>
        <button
          onClick={handleCalendarEvent}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Calendar Event
        </button>
        <button
          onClick={handleGroupChatMessage}
          className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Test Group Chat
        </button>
      </div>
    </div>
  );
};

export default NotificationTester;