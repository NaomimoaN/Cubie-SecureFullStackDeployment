import React, { useState, useContext, useRef, useEffect } from "react";
import ChangePasswordModal from "../common/ChangePasswordModal";
import authService from "../../../services/authService";
import { AuthContext } from "../../../context/AuthContext";
// Import student avatars for fallback
import avatar1 from "../../../assets/studentAvatars/1.png";
import avatar3 from "../../../assets/studentAvatars/3.png";
import avatar4 from "../../../assets/studentAvatars/4.png";
import avatar5 from "../../../assets/studentAvatars/5.png";
import avatar6 from "../../../assets/studentAvatars/6.png";
import avatar7 from "../../../assets/studentAvatars/7.png";

const ParentProfile = ({ user }) => {
  const { updateUserProfile, user: authUser, fetchUserProfile } = useContext(AuthContext);
  
  // Use the most up-to-date user data from context
  const currentUser = authUser || user;
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({});

  // Available student avatars for fallback
  const studentAvatars = [
    avatar1,
    avatar3,
    avatar4,
    avatar5,
    avatar6,
    avatar7,
  ];

  // Notification settings state - initialize with user data if available
  const [notifications, setNotifications] = useState({
    gradeUpdate: false,
    announcement: true,
    calendar: true,
  });

  // Load user notification settings when component mounts
  useEffect(() => {
    if (currentUser && currentUser.notificationSettings) {
      setNotifications({
        gradeUpdate: currentUser.notificationSettings.gradeUpdate ?? false,
        announcement: currentUser.notificationSettings.announcement ?? true,
        calendar: currentUser.notificationSettings.calendar ?? true,
      });
    }
  }, [currentUser]);

  // Get data from user object
  const profile = currentUser?.profile || {};
  const firstName = profile.firstName || currentUser?.firstName || "";
  const lastName = profile.lastName || currentUser?.lastName || "";
  const name = `${firstName} ${lastName}`.trim() || currentUser?.name || "Parent";
  const email = currentUser?.email || "";
  const familyStudents = currentUser?.familyStudents || [];

  // Generate profile image
  const profileImg =
    profilePicturePreview ||
    profile.profilePictureUrl ||
    profile.avatarUrl ||
    currentUser?.profilePictureUrl ||
    currentUser?.avatarUrl;

  // Child avatar colors
  const childAvatarColors = [
    { bg: "bg-pink-400", text: "text-white" },
    { bg: "bg-blue-400", text: "text-white" },
    { bg: "bg-green-400", text: "text-white" },
    { bg: "bg-purple-400", text: "text-white" },
    { bg: "bg-orange-400", text: "text-white" },
    { bg: "bg-teal-400", text: "text-white" },
  ];

  const handlePasswordChange = async (currentPassword, newPassword) => {
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
  };

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

      setSuccessMessage("Notification setting updated");
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 2000);
    } catch (error) {
      console.error("Error saving notification setting:", error);
      // Revert the change on error
      setNotifications(notifications);
      setSuccessMessage("Failed to update notification setting");
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    }
  };

  // Toggle component for notifications
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
        className={`inline-block transform rounded-full transition-transform duration-300 ease-in-out shadow-md ${
          isOn ? "translate-x-6" : "translate-x-0"
        }`}
        style={{ 
          width: "22px", 
          height: "22px",
          backgroundColor: isOn ? "#F3F3F3" : "#317CD8"
        }}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#fafbfc] p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-6 sm:mb-8 text-black px-4 sm:px-6 mt-4 sm:mt-6">
          Profile Setting
        </h1>

        <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 mx-4 sm:mx-6">
          {/* Left Section - Profile and Notification Cards */}
          <div className="flex-1 xl:w-2/3">
            <div className="bg-[#EDF6FE] rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col gap-6 sm:gap-8">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm" style={{ minHeight: '300px' }}>
                  {/* Profile Image and Info */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Profile Image */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          profileImg ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            name
                          )}&background=4f46e5&color=ffffff&size=128`
                        }
                        alt="Profile"
                        className="rounded-full object-cover border-4 border-gray-100"
                        style={{ width: "202px", height: "202px" }}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            name
                          )}&background=4f46e5&color=ffffff&size=128`;
                        }}
                      />
                      <button
                        onClick={handleProfilePictureClick}
                        className="absolute bottom-5 right-3 bg-white rounded-full p-1 sm:p-1.5 shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                        title="Change profile photo"
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{name}</h2>
                      <p className="text-gray-600 text-sm">{email}</p>
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

                {/* Notification Settings Card */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm" style={{ minHeight: '300px' }}>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-black">
                    Notification Setting
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-700 text-sm sm:text-base font-medium">
                        Grade update
                      </span>
                      <ToggleSwitch
                        isOn={notifications.gradeUpdate}
                        onToggle={() => handleNotificationToggle("gradeUpdate")}
                      />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-700 text-sm sm:text-base font-medium">
                        Announcement
                      </span>
                      <ToggleSwitch
                        isOn={notifications.announcement}
                        onToggle={() => handleNotificationToggle("announcement")}
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
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - My Children Card */}
          <div className="w-full xl:w-1/3">
            <div className="bg-[#EDF6FE] rounded-2xl shadow-sm h-full flex flex-col" style={{ padding: '16px' }}>
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-800">
                My Children
              </h2>
              <div className="space-y-4 mt-auto">
                {familyStudents.length > 0 ? (
                  familyStudents.map((child, index) => (
                    <div
                      key={child.userId}
                      className="relative p-3 sm:p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <img
                          src={(() => {
                            // Check all possible avatar sources
                            const avatarUrl = child.profile?.avatarUrl || 
                                            child.profile?.profilePictureUrl || 
                                            child.avatarUrl || 
                                            child.profilePictureUrl ||
                                            child.user?.profile?.avatarUrl ||
                                            child.user?.profile?.profilePictureUrl;
                            
                            if (avatarUrl) {
                              return avatarUrl;
                            }
                            
                            // Fallback to random student avatar
                            // Use child's userId to ensure consistent avatar per child
                            const childId = child.userId || child.id || child.name;
                            const hash = childId.split('').reduce((a, b) => {
                              a = ((a << 5) - a) + b.charCodeAt(0);
                              return a & a;
                            }, 0);
                            const avatarIndex = Math.abs(hash) % studentAvatars.length;
                            
                            return studentAvatars[avatarIndex];
                          })()}
                          alt={`${child.name} profile`}
                          className="rounded-full object-cover shadow-md flex-shrink-0 border-2 border-gray-100"
                          style={{ width: '100px', height: '100px' }}
                          onError={(e) => {
                            // Fallback to student avatar on error
                            const childId = child.userId || child.id || child.name;
                            const hash = childId.split('').reduce((a, b) => {
                              a = ((a << 5) - a) + b.charCodeAt(0);
                              return a & a;
                            }, 0);
                            const avatarIndex = Math.abs(hash) % studentAvatars.length;
                            e.target.src = studentAvatars[avatarIndex];
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm sm:text-lg truncate">
                            {child.name}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm">
                            Grade {child.profile?.grade || "N/A"} Division {child.profile?.division || "N/A"}
                          </p>
                        </div>
                      </div>
                      <button className="absolute bottom-3 right-3 p-2 bg-transparent hover:bg-transparent rounded-full transition-colors">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg
                        className="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-base sm:text-lg">No children found</p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-2">
                      Contact the school to add your children to your account
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}

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

      {/* Profile Picture Modal */}
      {showProfilePictureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-6">
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

            <div className="flex gap-4">
              <button
                onClick={handleProfilePictureCancel}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleProfilePictureSave}
                className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentProfile;
