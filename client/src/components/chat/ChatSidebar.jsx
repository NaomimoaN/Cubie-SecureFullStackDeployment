import React, { useState } from "react";
import { useChat } from "../../hooks/useChat";
import useAuth from "../../hooks/useAuth";
import CreateGroupModal from "./CreateGroupModal.jsx";
import ExpandableSearch from "./ExpandableSearch.jsx";

// Sub-component for each group item (kept within the same file for simplicity)
const GroupListItem = ({ group, onSelect, isSelected }) => {
  const bgColor = isSelected
    ? "text-gray-700"
    : "bg-transparent text-gray-700 hover:bg-gray-200";
  const selectedBgStyle = isSelected ? { backgroundColor: "#BDDFFF" } : {};

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // For older dates, show the actual date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div
      className={`flex items-center justify-between px-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 ${bgColor}`}
      style={{ ...selectedBgStyle, height: '74px' }}
      onClick={() => onSelect(group)}
    >
      <div className="flex items-center flex-grow min-w-0">
        <p className="font-semibold truncate">{group.name}</p>
        <span className="ml-2.5 text-sm text-white flex-shrink-0 rounded-full w-6 h-6 flex items-center justify-center" style={{ backgroundColor: '#F06C00' }}>
          {group.members?.length || 0}
        </span>
      </div>
      <div className="flex flex-col items-end text-xs ml-2 flex-shrink-0">
        <span className="whitespace-nowrap text-gray-500">
          {group.lastMessage?.createdAt ? formatTimestamp(group.lastMessage.createdAt) : ""}
        </span>
      </div>
    </div>
  );
};

// Main Sidebar Component
export default function ChatSidebar() {
  const { user } = useAuth();
  const { groups, selectedGroup, setSelectedGroup } = useChat();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    // TODO: When a group is selected, fetch its message history.
  };

  const filteredGroups = groups?.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.lastMessage?.content && group.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleSearchToggle = () => {
    setShowSearchInput(!showSearchInput);
    if (showSearchInput) {
      setSearchTerm("");
    }
  };

  const handleSearchChange = (searchValue) => {
    setSearchTerm(searchValue);
  };

  return (
    <>
      <div className="flex flex-col w-full md:w-1/3 lg:w-1/4 h-full bg-gray-50 border-r border-gray-200 p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Chats</h2>
          <div className="flex items-center space-x-2">
            <ExpandableSearch
              onSearch={handleSearchChange}
              onToggle={handleSearchToggle}
              isExpanded={showSearchInput}
              placeholder="Search groups..."
            />

            {/* Create Group Button (Teachers only) */}
            {user?.role === "teacher" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-transparent"
                aria-label="Create new group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>


        {/* Group List */}
        <div className="overflow-y-auto flex-grow">
          {showSearchInput && searchTerm && (
            <div className="mb-2 text-sm text-gray-600">
              {filteredGroups.length} result{filteredGroups.length !== 1 ? 's' : ''} found
            </div>
          )}
          {groups && groups.length > 0 ? (
            (showSearchInput ? filteredGroups : groups).map((group) => (
              <GroupListItem
                key={group._id}
                group={group}
                onSelect={handleSelectGroup}
                isSelected={selectedGroup?._id === group._id}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 mt-8">No groups found.</p>
          )}
          {showSearchInput && searchTerm && filteredGroups.length === 0 && groups.length > 0 && (
            <p className="text-center text-gray-500 mt-8">No groups match your search.</p>
          )}
        </div>
      </div>

      {/* When isModalOpen is true, render the CreateGroupModal component */}
      {isModalOpen && (
        <CreateGroupModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
