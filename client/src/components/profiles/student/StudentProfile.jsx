import React, { useState, useContext, useEffect } from "react";
import ChangePasswordModal from "../common/ChangePasswordModal";
import authService from "../../../services/authService";
import { AuthContext } from "../../../context/AuthContext";
// Import student avatars
import avatar1 from "../../../assets/studentAvatars/1.png";
// import avatar2 from "../../../assets/studentAvatars/2.png"; // File not found
import avatar3 from "../../../assets/studentAvatars/3.png";
import avatar4 from "../../../assets/studentAvatars/4.png";
import avatar5 from "../../../assets/studentAvatars/5.png";
import avatar6 from "../../../assets/studentAvatars/6.png";
import avatar7 from "../../../assets/studentAvatars/7.png";

const StudentProfile = ({ user }) => {
  const { updateUserProfile, user: authUser, fetchUserProfile } = useContext(AuthContext);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  // Available student avatars
  const studentAvatars = [
    { id: 1, src: avatar1, alt: "Avatar 1" },
    // { id: 2, src: avatar2, alt: "Avatar 2" }, // Avatar 2 not available
    { id: 3, src: avatar3, alt: "Avatar 3" },
    { id: 4, src: avatar4, alt: "Avatar 4" },
    { id: 5, src: avatar5, alt: "Avatar 5" },
    { id: 6, src: avatar6, alt: "Avatar 6" },
    { id: 7, src: avatar7, alt: "Avatar 7" },
  ];

  // Use the most up-to-date user data from context
  const currentUser = authUser || user;

  // Notification settings state - initialize with user data if available
  const [notifications, setNotifications] = useState({
    systemUpdate: false,
    schoolUpdate: true,
    calendar: true,
    groupChat: true,
  });

  // Load user notification settings when component mounts
  useEffect(() => {
    if (currentUser && currentUser.notificationSettings) {
      setNotifications({
        systemUpdate: currentUser.notificationSettings.systemUpdate ?? false,
        schoolUpdate: currentUser.notificationSettings.schoolUpdate ?? true,
        calendar: currentUser.notificationSettings.calendar ?? true,
        groupChat: currentUser.notificationSettings.groupChat ?? true,
      });
    }
  }, [currentUser]);

  // Get data from user object - no dummy data
  
  const profile = currentUser?.profile || {};
  const studentId = currentUser?.userId || currentUser?._id || currentUser?.id || "1234567890";
  const firstName = profile.firstName || currentUser?.firstName || "";
  const lastName = profile.lastName || currentUser?.lastName || "";
  const name =
    `${firstName} ${lastName}`.trim() || currentUser?.name || "Charlie Brown";
  const email = currentUser?.email || "";
  const username = currentUser?.username || currentUser?.email || "cbrown7890@cubie.com";

  // Student specific data from backend
  const grade = profile.grade || currentUser?.grade || "Grade 6";
  const division = profile.division || currentUser?.division || "Division 2";
  const classInfo = `${grade} ${division}`;

  // Generate profile image - prioritize backend avatarUrl, then selected avatar, then profile pictures
  const profileImg =
    profile.avatarUrl ||
    currentUser?.profile?.avatarUrl ||
    selectedAvatar ||
    profile.profilePictureUrl ||
    currentUser?.profilePictureUrl;
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=e879f9&color=ffffff&size=300`;

  const handleAvatarSelect = async (avatarSrc) => {
    try {
      setSelectedAvatar(avatarSrc);
      
      // Save avatar to backend first
      await authService.updateAvatar(avatarSrc);
      
      // Update local user profile with selected avatar
      updateUserProfile({
        profile: {
          ...(currentUser?.profile || {}),
          avatarUrl: avatarSrc,
        },
      });

    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });

      setShowPasswordModal(false);
    } catch (error) {
      console.error("Error changing password:", error);

      // Handle specific API errors and show them in the modal
      if (error.response?.data) {
        const { field, message } = error.response.data;
        if (field && message) {
          setPasswordErrors({ [field]: message });
          return;
        }
      }

      // Generic error
      setPasswordErrors({
        currentPassword: "Failed to change password. Please try again.",
      });
    }
  };


  const handleNotificationToggle = async (setting) => {
    const newNotifications = {
      ...notifications,
      [setting]: !notifications[setting],
    };

    setNotifications(newNotifications);

    // Auto-save notification settings when toggled
    try {
      const result = await authService.updateNotificationSettings(
        newNotifications
      );

      // Update user context with new notification settings
      if (result.settings) {
        updateUserProfile({
          notificationSettings: result.settings,
        });
      }

    } catch (error) {
      console.error("Error saving notification setting:", error);
      // Revert the change on error
      setNotifications(notifications);
    }
  };

  const ToggleSwitch = ({ isOn, onToggle }) => (
    <button
      onClick={onToggle}
      className="relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      style={{
        backgroundColor: isOn ? "#317CD8" : "#E2E2E2"
      }}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full transition-all duration-300 shadow-lg ${
          isOn ? "translate-x-7" : "translate-x-1"
        }`}
        style={{
          backgroundColor: isOn ? "#F3F3F3" : "#317CD8"
        }}
      />
    </button>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <h1 className="text-2xl sm:text-3xl font-medium mb-8 lg:mb-12 text-gray-900 px-2">Profile Setting</h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Profile Card */}
          <div className="rounded-3xl p-6 sm:p-8 lg:p-12" style={{ backgroundColor: '#FAFDFF', boxShadow: '0px 1px 8px 0px rgba(0, 0, 0, 0.05)', border: '1px solid var(--bar-stroke, #E2E2E2)' }}>
            <div className="flex flex-col items-center">
              {/* Profile Image - Responsive sizing */}
              <div className="mb-6 lg:mb-8">
                <img
                  src={
                    profileImg ||
                    defaultAvatar
                  }
                  alt="Profile"
                  className="object-cover border-4 border-gray-100 w-48 h-48 sm:w-60 sm:h-60 lg:w-72 lg:h-72 xl:w-80 xl:h-80"
                  style={{ 
                    borderRadius: '7px'
                  }}
                  onError={(e) => {
                    e.target.src = defaultAvatar;
                  }}
                />
              </div>

            {/* Name and Email */}
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="text-xl sm:text-2xl font-medium text-gray-900 mb-2">{name}</h2>
              <p className="text-gray-500 text-sm">{email}</p>
            </div>

            {/* Profile Details */}
            <div className="w-full max-w-md space-y-4 lg:space-y-6 mb-8 lg:mb-16">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-bold text-sm sm:text-base">Student ID:</span>
                <span className="text-gray-900 text-sm sm:text-base">{studentId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-bold text-sm sm:text-base">Class:</span>
                <span className="text-gray-900 text-sm sm:text-base">{classInfo}</span>
              </div>
            </div>

            {/* Change Password Button */}
            <div className="w-full max-w-md flex justify-center sm:justify-end">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center justify-center text-gray-800 rounded-full font-medium hover:opacity-80 transition-opacity text-sm sm:text-base"
                style={{ 
                  backgroundColor: '#E2E2E2',
                  minWidth: '125px',
                  minHeight: '40px',
                  padding: '8px 20px',
                  gap: '8px'
                }}
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Change password
              </button>
            </div>
            </div>
          </div>

          {/* Avatar Selection Card */}
          <div className="rounded-3xl p-6 sm:p-8 lg:p-12" style={{ backgroundColor: '#FAFDFF', boxShadow: '0px 1px 8px 0px rgba(0, 0, 0, 0.05)', border: '1px solid var(--bar-stroke, #E2E2E2)' }}>
            <div className="flex flex-col">
              <h2 className="text-xl sm:text-2xl font-medium text-gray-900 mb-6 lg:mb-8 text-center lg:text-left lg:pl-8">Avatar Selection</h2>
              
              {/* Avatar Grid - Responsive grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 justify-items-center max-w-lg mx-auto">
                {studentAvatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar.src)}
                    className={`relative transition-all duration-200 hover:scale-105 bg-transparent overflow-hidden ${
                      (profile.avatarUrl === avatar.src || currentUser?.profile?.avatarUrl === avatar.src)
                        ? 'shadow-lg'
                        : ''
                    } w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32`}
                    style={{ 
                      borderRadius: '7px', 
                      backgroundColor: 'transparent',
                      border: (profile.avatarUrl === avatar.src || currentUser?.profile?.avatarUrl === avatar.src)
                        ? '1px solid #3B82F6'
                        : '1px solid var(--bar-stroke, #E2E2E2)',
                      padding: '0'
                    }}
                    title={`Select ${avatar.alt}`}
                  >
                    <img
                      src={avatar.src}
                      alt={avatar.alt}
                      className="object-cover bg-transparent w-full h-full"
                      style={{ 
                        borderRadius: '7px',
                        backgroundColor: 'transparent'
                      }}
                    />
                    {(profile.avatarUrl === avatar.src || currentUser?.profile?.avatarUrl === avatar.src) && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Password Change Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordErrors({});
          }}
          onSubmit={handlePasswordChange}
          errors={passwordErrors}
        />
      )}

    </div>
  );
};

export default StudentProfile;
