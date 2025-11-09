import React from "react";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatMain from "../components/chat/ChatMain";

const ChatPage = () => {
  return (
    <div className="flex bg-gray-100" style={{ height: "calc(100vh - 52px)" }}>
      <ChatSidebar />
      <ChatMain />
    </div>
  );
};

export default ChatPage;
