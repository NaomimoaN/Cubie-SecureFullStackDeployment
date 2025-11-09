import React, { useState, useRef, useContext, useEffect } from "react";
import authService from "../../../services/authService";
import ChangePasswordModal from "../common/ChangePasswordModal";
import { AuthContext } from "../../../context/AuthContext";

const TeacherProfile = ({ user }) => {
  const { updateUserProfile, user: authUser, fetchUserProfile } = useContext(AuthContext);
  
  // Use the most up-to-date user data from context
  const currentUser = authUser || user;
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [passwordErrors, setPasswordErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Get data from user object - no dummy data
  const profile = currentUser?.profile || {};
  const employeeId = currentUser?.userId || currentUser?._id || currentUser?.id || "";
  const role = currentUser?.role || "";
  const joinedDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString()
    : "";
  const firstName = profile.firstName || currentUser?.firstName || "";
  const lastName = profile.lastName || currentUser?.lastName || "";
  const name = `${firstName} ${lastName}`.trim() || currentUser?.name || "User";
  const email = currentUser?.email || "";
  const profileImg =
    profilePicturePreview ||
    profile.profilePictureUrl ||
    profile.avatarUrl ||
    currentUser?.profilePictureUrl ||
    currentUser?.avatarUrl;

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
      className="relative inline-flex items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      style={{ 
        width: "50px", 
        height: "26px", 
        padding: "2px",
        backgroundColor: isOn ? "#317CD8" : "#E2E2E2"
      }}
      role="switch"
      aria-checked={isOn}
    >
      <span
        className={`inline-block transform rounded-full transition-transform duration-300 ease-in-out shadow-md ${isOn ? "translate-x-6" : "translate-x-0"
          }`}
        style={{ 
          width: "22px", 
          height: "22px",
          backgroundColor: isOn ? "#F3F3F3" : "#317CD8"
        }}
      />
    </button>
  );

  // Password form state and handlers removed as we're using ChangePasswordModal component

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const previewUrl = URL.createObjectURL(file);
      setProfilePicturePreview(previewUrl);
      setShowProfilePictureModal(true);
    }
  };

  const handleProfilePictureSave = async () => {
    if (!profilePictureFile) return;

    try {
      const result = await authService.updateProfilePicture(profilePictureFile);

      console.log("Profile picture updated successfully");

      // Update global user context with new profile picture URL
      if (result.profilePictureUrl) {
        console.log("Updating user profile with new URL:", result.profilePictureUrl);
        console.log("Current user profile before update:", currentUser?.profile);
        updateUserProfile({
          profile: {
            ...(currentUser?.profile || {}),
            profilePictureUrl: result.profilePictureUrl,
          },
        });
        console.log("AuthContext update called");
        
        // Also refresh the user profile to ensure we have the latest data
        setTimeout(() => {
          fetchUserProfile();
        }, 1000);
      } else {
        console.warn("No profilePictureUrl in response:", result);
      }

      setProfilePictureFile(null);
      setShowProfilePictureModal(false);

      // Show success message to user
      setSuccessMessage("Profile picture updated successfully");
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      // Show error message
      setSuccessMessage("Failed to update profile picture");
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    }
  };

  const handleProfilePictureCancel = () => {
    setProfilePicturePreview(null);
    setProfilePictureFile(null);
    setShowProfilePictureModal(false);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-6 sm:mb-8 text-black px-4 sm:px-6 mt-4 sm:mt-6">
          Profile Setting
        </h1>

        <div className="bg-[#EDF6FE] rounded-2xl p-4 sm:p-6 mx-4 sm:mx-6 lg:mx-12 mb-8 sm:mb-12" style={{minHeight: 'calc(100vh - 280px)'}}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm flex-1" style={{ minHeight: 'calc(100vh - 368px)' }}>
              <div className="flex flex-col items-center h-full justify-between">
                {/* Top Section - Profile Image and Info */}
                <div className="flex flex-col items-center">
                  {/* Profile Image */}
                  <div className="relative mb-3">
                  <img
                    src={
                      profileImg ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        name
                      )}&background=3b82f6&color=ffffff&size=170`
                    }
                    alt="Profile"
                    className="rounded-full object-cover border-4 border-gray-100 w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        name
                      )}&background=3b82f6&color=ffffff&size=170`;
                    }}
                  />
                  <button
                    onClick={handleProfilePictureClick}
                    className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 sm:p-2 shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                    title="Change profile photo"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                  {/* Profile Info */}
                  <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-semibold text-black mb-1">
                      {name}
                    </h2>
                    <p className="text-gray-500 text-sm">{email}</p>
                  </div>
                </div>

                {/* Middle Section - Profile Details */}
                <div className="w-full space-y-4 sm:space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">
                      Employee ID
                    </span>
                    <span className="text-sm text-gray-900">{employeeId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">
                      Role
                    </span>
                    <span className="text-sm text-gray-900">{role}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">
                      Joined date
                    </span>
                    <span className="text-sm text-gray-900">{joinedDate}</span>
                  </div>
                </div>

                {/* Change Password Button */}
                <div className="w-full flex justify-center sm:justify-end">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center justify-center text-gray-800 rounded-full font-medium hover:opacity-80 transition-opacity text-sm"
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

            {/* Notification Settings Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm flex-1" style={{ minHeight: 'calc(100vh - 368px)' }}>
              <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-black">
                Notification Settings
              </h3>

              <div className="space-y-5">
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-700 text-sm sm:text-base font-medium">
                    System update
                  </span>
                  <ToggleSwitch
                    isOn={notifications.systemUpdate}
                    onToggle={() => handleNotificationToggle("systemUpdate")}
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-700 text-sm sm:text-base font-medium">
                    School update
                  </span>
                  <ToggleSwitch
                    isOn={notifications.schoolUpdate}
                    onToggle={() => handleNotificationToggle("schoolUpdate")}
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-700 text-sm sm:text-base font-medium">
                    Calendar
                  </span>
                  <ToggleSwitch
                    isOn={notifications.calendar}
                    onToggle={() => handleNotificationToggle("calendar")}
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-700 text-sm sm:text-base font-medium">
                    Group chat
                  </span>
                  <ToggleSwitch
                    isOn={notifications.groupChat}
                    onToggle={() => handleNotificationToggle("groupChat")}
                  />
                </div>
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
          onSubmit={async (currentPassword, newPassword) => {
            try {
              await authService.changePassword({
                currentPassword,
                newPassword,
              });

              setShowPasswordModal(false);
              setSuccessMessage("Password changed successfully");
              setShowSuccessAlert(true);

              // Hide success message after 3 seconds
              setTimeout(() => {
                setShowSuccessAlert(false);
              }, 3000);
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
          }}
          errors={passwordErrors}
        />
      )}

      {/* Profile Picture Modal */}
      {showProfilePictureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Change Profile Picture
            </h3>

            <div className="flex justify-center mb-6">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-100 shadow-md">
                <img
                  src={profilePicturePreview}
                  alt="New profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleProfilePictureCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProfilePictureSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Alert */}
      {showSuccessAlert && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
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
            <span>{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfile;
