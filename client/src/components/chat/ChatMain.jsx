import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../../hooks/useChat";
import ChatIcon from "../../assets/Chat.svg";
import ProfileIcon from "../../assets/Profile.svg";
import CreateGroupModal from "./CreateGroupModal.jsx";

const ChatMain = () => {
  // Add CSS to hide scrollbar
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.append(style);
    return () => style.remove();
  }, []);
  const {
    selectedGroup,
    messages,
    sendMessage,
    user,
    loadMoreMessages,
    isLoadingMessages,
    hasMoreMessages,
    removeMemberFromGroup,
  } = useChat();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const membersButtonRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // Grup değiştiğinde scroll yap
  useEffect(() => {
    if (selectedGroup) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [selectedGroup]);

  // Mesajlar yüklendiğinde de scroll yap (sadece ilk yükleme için)
  useEffect(() => {
    if (selectedGroup && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [selectedGroup, messages.length > 0]);

  // Handle scroll to load more messages
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Sadece üste scroll edince eski mesajları yükle
    if (
      container.scrollTop < 100 &&
      hasMoreMessages &&
      !isLoadingMessages &&
      !isLoadingOlderMessages
    ) {
      setIsLoadingOlderMessages(true);

      const scrollHeight = container.scrollHeight;
      const scrollTop = container.scrollTop;

      loadMoreMessages()
        .then(() => {
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
    }
  };

  const handleKeyDown = (e) => {
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
      className="flex-1 flex flex-col bg-white p-6"
      style={{ height: "calc(100vh - 52px)", borderRadius: "15px" }}
    >
      <div
        className="text-gray-700 p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: "#EDF6FE",
          borderTopLeftRadius: "15px",
          borderTopRightRadius: "15px",
        }}
      >
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white text-gray-700 rounded-full flex items-center justify-center font-bold text-xl">
            {selectedGroup.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ marginLeft: "10px" }}>
            <div className="font-semibold text-lg">{selectedGroup.name}</div>
          </div>
        </div>
        <button
          ref={membersButtonRef}
          className="flex items-center justify-center gap-2 text-white text-sm font-medium hover:opacity-80 transition-opacity"
          style={{
            backgroundColor: "#317CD8",
            width: "76px",
            height: "36px",
            borderRadius: "15px",
          }}
          onClick={() => setShowMembersModal(!showMembersModal)}
        >
          <img
            src={ProfileIcon}
            alt="Members"
            className="w-6 h-6"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          {selectedGroup.members?.length || 0}
        </button>
      </div>
      <div
        className="flex-1 bg-gray-50 rounded-lg flex flex-col"
        style={{ height: 0 }}
      >
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 hide-scrollbar"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* Loading indicator for older messages */}
          {(isLoadingMessages || isLoadingOlderMessages) && hasMoreMessages && (
            <div className="flex justify-center py-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">
                  Loading messages...
                </span>
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

              // Check if we need to show a date separator
              const currentDate = new Date(msg.createdAt).toDateString();
              const previousDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
              const showDateSeparator = !previousDate || currentDate !== previousDate;

              // Format date for display (e.g., "June 19, 2025")
              const formatDate = (dateString) => {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              };

              return (
                <React.Fragment key={index}>
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <div
                        className="px-3 py-1 rounded-full text-xs font-medium text-gray-600"
                        style={{ backgroundColor: "#E2E2E2" }}
                      >
                        {formatDate(msg.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div
                    className={`flex ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                  {isOwnMessage ? (
                    // Current user's message (right side) - timestamp aligned with bottom edge
                    <div className="flex items-end space-x-2">
                      <div className="text-xs text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div
                        className="max-w-xs lg:max-w-md px-4 py-3 rounded-xl text-gray-700 border border-gray-200 shadow-sm"
                        style={{ backgroundColor: "#EDF6FE" }}
                      >
                        <div className="text-sm break-words">{msg.content}</div>
                      </div>
                    </div>
                  ) : (
                    // Other sender's message (left side) - timestamp aligned with bottom edge
                    <div className="flex space-x-3 max-w-xs lg:max-w-md">
                      {/* Profile Image */}
                      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {msg.sender?.profile?.avatarUrl ? (
                          <img
                            src={msg.sender.profile.avatarUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">
                            {msg.sender?.profile?.firstName?.charAt(0) || "U"}
                            {msg.sender?.profile?.lastName?.charAt(0) || ""}
                          </div>
                        )}
                      </div>
                      
                      {/* Message Content */}
                      <div className="flex-1">
                        {/* Sender Name - aligned with profile image */}
                        <div className="text-xs text-black font-semibold flex items-center h-9">
                          {`${msg.sender?.profile?.firstName || ""} ${
                            msg.sender?.profile?.lastName || ""
                          }`.trim() || "User"}
                        </div>
                        
                        {/* Message Container with aligned timestamp */}
                        <div className="flex items-end space-x-2 mt-1">
                          <div
                            className="px-4 py-3 rounded-xl text-gray-800 border border-gray-200 shadow-sm"
                            style={{ backgroundColor: "#F3F3F3" }}
                          >
                            <div className="text-sm break-words">{msg.content}</div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <form onSubmit={handleSendMessage} className="flex-shrink-0">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-300 bg-white text-gray-800 px-4 pr-24 focus:outline-none focus:ring-0 focus:border-gray-300 resize-none flex items-center"
              rows="1"
              style={{
                height: "78px",
                borderRadius: "15px",
                paddingTop: "25px",
                paddingBottom: "25px",
              }}
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="absolute top-1/2 transform -translate-y-1/2 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              style={{
                backgroundColor: "#317CD8",
                width: "75px",
                height: "52px",
                borderRadius: "15px",
                right: "13px",
              }}
            >
              <img
                src={ChatIcon}
                alt="Send"
                className="w-7 h-7"
                style={{
                  transform: "rotate(0deg)",
                  filter: "brightness(0) invert(1)",
                }}
              />
            </button>
          </div>
        </form>
      </div>

      {/* Members Popup */}
      {showMembersModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMembersModal(false)}
          />
          <div
            className="absolute bg-white shadow-lg border w-80 z-50 flex flex-col"
            style={{
              top:
                membersButtonRef.current?.offsetTop +
                membersButtonRef.current?.offsetHeight +
                8,
              right:
                membersButtonRef.current?.offsetParent?.offsetWidth -
                membersButtonRef.current?.offsetLeft -
                membersButtonRef.current?.offsetWidth,
              borderRadius: "15px",
              maxHeight: "384px",
            }}
          >
            <div
              className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-3"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {selectedGroup.members?.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                      {member.user?.profile?.avatarUrl ? (
                        <img
                          src={member.user.profile.avatarUrl}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          {member.user?.profile?.firstName?.charAt(0) || "U"}
                          {member.user?.profile?.lastName?.charAt(0) || ""}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.user?.profile?.firstName || "Unknown"}{" "}
                        {member.user?.profile?.lastName || "User"}
                      </p>
                    </div>
                  </div>

                  {user?.role === "teacher" && member.role !== "teacher" && (
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold hover:opacity-80 transition-opacity"
                      style={{ color: "#F06C00", backgroundColor: "transparent" }}
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Are you sure you want to remove ${member.user?.profile?.firstName} ${member.user?.profile?.lastName} from this group?`
                        );

                        if (confirmed) {
                          try {
                            await removeMemberFromGroup(
                              selectedGroup._id,
                              member.user._id
                            );
                          } catch (error) {
                            // alert("Failed to remove member. Please try again.");
                            console.error("Error removing member:", error);
                          }
                        }
                      }}
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
            </div>

            {user?.role === "teacher" && (
              <div
                className="border-t flex-shrink-0"
                style={{
                  borderColor: "#C7C7C7",
                }}
              >
                <button
                  className="w-full flex items-center justify-center py-4 text-gray-700 font-medium hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "0 0 15px 15px",
                  }}
                  onClick={() => {
                    setShowMembersModal(false);
                    setShowInviteModal(true);
                  }}
                >
                  <span
                    className="mr-3 text-2xl font-bold"
                    style={{ color: "#C7C7C7" }}
                  >
                    +
                  </span>
                  Invite students
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Invite Students Modal - reusing CreateGroupModal but with different behavior */}
      {showInviteModal && user?.role === "teacher" && (
        <CreateGroupModal
          onClose={() => setShowInviteModal(false)}
          isInviteMode={true}
          currentGroup={selectedGroup}
        />
      )}
    </div>
  );
};

export default ChatMain;
