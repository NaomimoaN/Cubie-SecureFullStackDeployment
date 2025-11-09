import React, { useState, useEffect } from "react";
import chatUserService from "../../services/chatUserService.js";
import { useChat } from "../../hooks/useChat";

export default function CreateGroupModal({
  onClose,
  isInviteMode = false,
  currentGroup = null,
}) {
  const { createGroup, addMembersToGroup } = useChat();

  // State'ler
  const [step, setStep] = useState(isInviteMode ? 1 : 1); // For invite mode, skip to user selection
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [groupName, setGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Component yüklendiğinde kullanıcı listesini çek
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const users = await chatUserService.getUsersForGroupCreation();

        // If in invite mode, filter out users who are already in the group
        let filteredUsers = users;
        if (isInviteMode && currentGroup?.members) {
          const currentMemberIds = currentGroup.members.map(
            (member) => member.user._id || member.user
          );
          filteredUsers = users.filter(
            (user) => !currentMemberIds.includes(user._id)
          );
        }

        setAllUsers(filteredUsers);
        setError(null);
      } catch (err) {
        setError("Failed to load users. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [isInviteMode, currentGroup]);

  // Handler'lar
  const handleUserSelect = (userId) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Modal: handleSubmit triggered.");

    if (isInviteMode) {
      // Invite mode: just need selected users
      if (selectedUsers.size === 0) {
        // alert("Please select at least one user to invite.");
        return;
      }

      try {
        setIsLoading(true);
        const membersToAdd = Array.from(selectedUsers).map((userId) => ({
          user: userId,
        }));

        await addMembersToGroup(currentGroup._id, membersToAdd);
        console.log("Successfully invited users to group:", currentGroup._id);
        onClose();
      } catch (err) {
        setError("Failed to invite users. Please try again.");
        console.error("Error inviting users to group:", err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Create mode: need group name and members
    if (!groupName.trim() || selectedUsers.size === 0) {
      // alert("Group name and at least one member are required.");
      return;
    }

    // Backend'in beklediği formata dönüştür
    const members = Array.from(selectedUsers).map((userId) => ({
      user: userId,
    }));
    const groupData = { name: groupName, members };
    console.log("Modal: Creating group with data:", groupData);

    try {
      setIsLoading(true);
      await createGroup(groupData);
      console.log("Modal: createGroup call finished successfully.");
      onClose(); // Başarılı olunca modal'ı kapat
    } catch (err) {
      setError("Failed to create group. Please try again.");
      console.error("Modal: Error creating group:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render Fonksiyonları
  const renderStepOne = () => (
    <div>
      <h2 className="text-xl font-bold text-center mb-4">
        {isInviteMode ? "Invite Students" : "Choose Students"}
      </h2>
      {/* TODO: Arama fonksiyonelliği eklenecek */}
      <input
        type="search"
        placeholder="Search"
        className="w-full p-2 border rounded-lg mb-4"
      />

      <div className="max-h-60 overflow-y-auto">
        {isLoading && <p>Loading users...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading &&
          allUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-2 my-1 hover:bg-gray-100 rounded-lg"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {user.profile.firstName} {user.profile.lastName}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {user.role}
                </span>
              </div>
              <div className="relative w-5 h-5">
                <input
                  type="checkbox"
                  className={`w-full h-full rounded-full border-2 appearance-none focus:outline-none cursor-pointer ${
                    selectedUsers.has(user._id) 
                      ? 'border-black bg-white' 
                      : 'border-gray-400 bg-transparent'
                  }`}
                  checked={selectedUsers.has(user._id)}
                  onChange={() => handleUserSelect(user._id)}
                  style={{
                    borderRadius: '50%'
                  }}
                />
                {selectedUsers.has(user._id) && (
                  <div 
                    className="absolute top-1/2 left-1/2 w-3 h-3 bg-black rounded-full pointer-events-none"
                    style={{
                      transform: 'translate(-50%, -50%)'
                    }}
                  ></div>
                )}
              </div>
            </div>
          ))}
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-black hover:opacity-80"
          style={{ borderRadius: "50px", backgroundColor: "#E2E2E2" }}
        >
          Cancel
        </button>
        <button
          onClick={isInviteMode ? handleSubmit : () => setStep(2)}
          disabled={selectedUsers.size === 0}
          className="px-4 py-2 text-white disabled:bg-gray-400 hover:opacity-80"
          style={{ borderRadius: "50px", backgroundColor: selectedUsers.size === 0 ? "#gray-400" : "#F06C00" }}
        >
          {isInviteMode ? "Invite" : "Next"}
        </button>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-center mb-4">
        Set Group Chat Information
      </h2>
      {/* TODO: Avatar yükleme eklenecek */}
      <div className="w-24 h-24 bg-blue-500 rounded-lg mx-auto mb-4"></div>

      <input
        type="text"
        placeholder="Enter group name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        className="w-full p-2 border rounded-lg bg-white text-primeblack placeholder-gray-400"
        maxLength="50"
        required
      />
      <p className="text-right text-xs text-gray-400 mt-1">
        {groupName.length}/50
      </p>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-4 py-2 text-black hover:opacity-80"
          style={{ borderRadius: "50px", backgroundColor: "#E2E2E2" }}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-white disabled:bg-gray-400 hover:opacity-80"
          style={{ borderRadius: "50px", backgroundColor: isLoading ? "#gray-400" : "#F06C00" }}
        >
          {isLoading ? "Creating..." : "OK"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        {step === 1 || isInviteMode ? renderStepOne() : renderStepTwo()}
      </div>
    </div>
  );
}
