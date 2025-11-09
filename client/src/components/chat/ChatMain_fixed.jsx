import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../../hooks/useChat";

const ChatMain = () => {
  const {
    selectedGroup,
    messages,
    sendMessage,
    user,
    loadMoreMessages,
    isLoadingMessages,
    hasMoreMessages,
  } = useChat();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if user is near bottom of messages
  const checkIfNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
  };

  // Only scroll to bottom if user is near bottom (for new messages)
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, isNearBottom]);

  // Reset to bottom when group changes
  useEffect(() => {
    if (selectedGroup) {
      setIsNearBottom(true);
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [selectedGroup]);

  // Handle scroll to load more messages and track position
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Update near bottom status
    setIsNearBottom(checkIfNearBottom());

    // Check if scrolled to top to load more messages
    if (
      container.scrollTop < 100 &&
      hasMoreMessages &&
      !isLoadingMessages &&
      !isLoadingOlderMessages
    ) {
      setIsLoadingOlderMessages(true);

      // Store current scroll position relative to bottom
      const scrollHeight = container.scrollHeight;
      const scrollTop = container.scrollTop;

      loadMoreMessages()
        .then(() => {
          // Restore scroll position after loading older messages
          setTimeout(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              const scrollDiff = newScrollHeight - scrollHeight;
              container.scrollTop = scrollTop + scrollDiff;
              setIsLoadingOlderMessages(false);
            }
          }, 50);
        })
        .catch(() => {
          setIsLoadingOlderMessages(false);
        });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && selectedGroup) {
      sendMessage(message);
      setMessage("");
      setIsNearBottom(true); // Force scroll to bottom after sending
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">
            Welcome to Cubie Chat!
          </h3>
          <p className="text-gray-500 text-lg">
            Select a group from the left to start messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col bg-white"
      style={{ height: "calc(100vh - 52px)" }}
    >
      <div
        className="text-gray-700 p-4 border-b border-gray-200 flex items-center flex-shrink-0"
        style={{ backgroundColor: "#EDF6FE" }}
      >
        <div className="w-10 h-10 bg-white text-gray-700 rounded-full flex items-center justify-center font-bold text-xl">
          {selectedGroup.name.charAt(0).toUpperCase()}
        </div>
        <div className="ml-3">
          <div className="font-semibold text-lg">{selectedGroup.name}</div>
          <div className="text-gray-300 text-sm">
            {selectedGroup.members?.length || 0} members
          </div>
        </div>
      </div>
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 bg-gray-50"
        style={{ height: 0 }}
      >
        {/* Loading indicator for older messages */}
        {(isLoadingMessages || isLoadingOlderMessages) && hasMoreMessages && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500">Loading messages...</span>
            </div>
          </div>
        )}

        {/* No more messages indicator */}
        {!hasMoreMessages && messages.length > 0 && (
          <div className="flex justify-center py-4">
            <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
              No more messages
            </span>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, index) => {
            const isOwnMessage =
              msg.sender &&
              (msg.sender._id === user.userId || msg.sender === user.userId);

            return (
              <div
                key={index}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                    isOwnMessage
                      ? "text-gray-700 border border-gray-200 shadow-sm"
                      : "bg-white text-gray-800 border border-gray-200 shadow-sm"
                  }`}
                  style={isOwnMessage ? { backgroundColor: "#EDF6FE" } : {}}
                >
                  {!isOwnMessage && (
                    <div className="text-xs text-blue-600 mb-1 font-semibold">
                      {`${msg.sender?.profile?.firstName || ""} ${
                        msg.sender?.profile?.lastName || ""
                      }`.trim() || "User"}
                    </div>
                  )}
                  <div className="text-sm break-words">{msg.content}</div>
                  <div
                    className={`text-xs mt-2 text-right ${
                      isOwnMessage ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form
        onSubmit={handleSendMessage}
        className="bg-white border-t border-gray-200 p-4 flex-shrink-0"
      >
        <div className="flex items-center space-x-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="w-full border border-gray-300 bg-gray-100 text-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows="1"
            style={{ minHeight: "44px" }}
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-6 py-2 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            style={{ backgroundColor: "#EDF6FE" }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatMain;
