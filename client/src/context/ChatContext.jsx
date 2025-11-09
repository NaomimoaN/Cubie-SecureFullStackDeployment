import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import useAuth from "../hooks/useAuth";
import groupService from "../services/groupService";
import messageService from "../services/messageService";
import { ChatContext } from "./ChatContextInstance";

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Clear selectedGroup when not on chat page
  useEffect(() => {
    const isChatPage =
      location.pathname === "/chat" ||
      location.pathname.includes("/chat") ||
      location.pathname.includes("/group-chat");
    if (!isChatPage) {
      setSelectedGroup(null);
    }
  }, [location.pathname]);

  // Effect to establish socket connection
  useEffect(() => {
    if (user) {
      const newSocket = io(import.meta.env.VITE_CHAT_SERVER_URL, {
        query: { userId: user.userId },
        withCredentials: true,
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      // Listen for notifications from the backend
      newSocket.on(`notification-${user.userId}`, (notification) => {
        console.log("Received notification from backend:", notification);
        setNotifications((prev) => [notification, ...prev]);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  // Effect to join groups when socket is ready and groups are loaded
  useEffect(() => {
    if (socket && socket.connected && groups.length > 0 && user) {
      groups.forEach((group) => {
        socket.emit("join-group", { groupId: group._id, userId: user.userId });
      });
    }
  }, [socket, groups, user]);

  // Effect to handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // Update the groups list with the new message as lastMessage
      setGroups((prevGroups) => 
        prevGroups.map((group) => 
          group._id === newMessage.group 
            ? { ...group, lastMessage: newMessage }
            : group
        )
      );

      // Refresh groups to get latest lastMessage data from backend
      fetchGroups();

      // Add message only if it belongs to the currently selected group
      if (selectedGroup && newMessage.group === selectedGroup._id) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        // Don't change pagination state for new messages, only for loading older ones
      } else {
        // Don't create notification for own messages
        if (newMessage.sender._id === user.userId) {
          return;
        }

        // Add notification for messages in other groups
        const groupName =
          groups.find((g) => g._id === newMessage.group)?.name ||
          "Unknown Group";
        
        createNotification(
          "message",
          "You got a new message",
          `New message in ${groupName}`,
          {
            group: groupName,
            groupId: newMessage.group,
            sender: newMessage.sender,
          }
        );
      }
    };

    socket.on("receive-message", handleNewMessage);

    return () => {
      socket.off("receive-message", handleNewMessage);
    };
  }, [socket, selectedGroup, groups, user]);

  // Function to fetch groups
  const fetchGroups = useCallback(async () => {
    if (user) {
      try {
        const fetchedGroups = await groupService.getGroups();
        setGroups(fetchedGroups);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      }
    }
  }, [user]);

  // Function to load messages for a group
  const loadMessages = useCallback(async (groupId, reset = true) => {
    if (!groupId) return;

    setIsLoadingMessages(true);
    try {
      const page = reset ? 1 : currentPage;
      const response = await messageService.getGroupMessages(groupId, page, 20);

      if (reset) {
        setMessages(response.messages || []);
        setCurrentPage(1);
        setHasMoreMessages(
          response.pagination?.hasNextPage &&
            (response.messages?.length || 0) > 0
        );
      } else {
        // For older messages, prepend to the beginning of the array
        setMessages((prev) => [...(response.messages || []), ...prev]);
        setHasMoreMessages(
          response.pagination?.hasNextPage &&
            (response.messages?.length || 0) > 0
        );
      }

      if (!reset) {
        setCurrentPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      if (reset) {
        setMessages([]);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Function to load more messages (older messages)
  const loadMoreMessages = useCallback(async () => {
    if (!selectedGroup || isLoadingMessages || !hasMoreMessages) return;

    await loadMessages(selectedGroup._id, false);
  }, [selectedGroup, isLoadingMessages, hasMoreMessages, loadMessages]);

  // Function to create different types of notifications
  const createNotification = useCallback((type, title, message, metadata = {}) => {
    // Check if user wants to receive this type of notification
    if (user?.notificationSettings) {
      switch (type) {
        case "message":
          if (!user.notificationSettings.groupChat) return;
          break;
        case "announcement":
        case "schoolUpdate":
        case "gradeUpdate":
          if (!user.notificationSettings.schoolUpdate) return;
          break;
        case "calendar":
          if (!user.notificationSettings.calendar) return;
          break;
        case "systemUpdate":
          if (!user.notificationSettings.systemUpdate) return;
          break;
        default:
          // Unknown notification type, allow by default
          break;
      }
    }

    const notification = {
      id: Date.now() + Math.random(), // Ensure unique ID
      type,
      title,
      message,
      timestamp: new Date().toLocaleString(),
      isRead: false,
      ...metadata,
    };

    setNotifications((prev) => [notification, ...prev]);
  }, [user]);

  // Initial fetch of groups
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Load messages when selected group changes
  useEffect(() => {
    if (selectedGroup) {
      setCurrentPage(1);
      setHasMoreMessages(true);
      loadMessages(selectedGroup._id, true);
    } else {
      setMessages([]);
      setCurrentPage(1);
      setHasMoreMessages(true);
    }
  }, [selectedGroup, loadMessages]);

  // Function to send a message
  const sendMessage = (content) => {
    if (socket && selectedGroup) {
      const messageData = {
        sender: user.userId,
        content,
        group: selectedGroup._id,
      };
      socket.emit("send-message", messageData);
    }
  };

  // Function to create a group
  const createGroup = async (groupData) => {
    if (user) {
      try {
        await groupService.createGroup(groupData);
        // After creating, refresh the group list
        await fetchGroups();
      } catch (error) {
        console.error("Failed to create group:", error);
        throw error;
      }
    } else {
      throw new Error("No user available. Please log in again.");
    }
  };

  // Function to add members to a group
  const addMembersToGroup = async (groupId, members) => {
    if (user) {
      try {
        const updatedGroup = await groupService.addMembersToGroup(groupId, members);
        
        // Update the selected group immediately if it's the one being modified
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(updatedGroup);
        }
        
        // After adding members, refresh the group list
        await fetchGroups();
      } catch (error) {
        console.error("Failed to add members to group:", error);
        throw error;
      }
    } else {
      throw new Error("No user available. Please log in again.");
    }
  };

  // Function to remove a member from a group
  const removeMemberFromGroup = async (groupId, memberId) => {
    if (user) {
      try {
        const updatedGroup = await groupService.removeMemberFromGroup(groupId, memberId);
        
        // Update the selected group immediately if it's the one being modified
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(updatedGroup);
        }
        
        // After removing member, refresh the group list
        await fetchGroups();
      } catch (error) {
        console.error("Failed to remove member from group:", error);
        throw error;
      }
    } else {
      throw new Error("No user available. Please log in again.");
    }
  };

  // Function to mark notification as read
  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  // Function to mark all notifications as read
  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  }, []);

  // Function to clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    user,
    groups,
    selectedGroup,
    setSelectedGroup,
    messages,
    setMessages,
    sendMessage,
    createGroup,
    addMembersToGroup,
    removeMemberFromGroup,
    loadMessages,
    loadMoreMessages,
    isLoadingMessages,
    hasMoreMessages,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    createNotification,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
