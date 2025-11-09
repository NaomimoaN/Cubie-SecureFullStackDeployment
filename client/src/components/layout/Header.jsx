// client/src/components/layout/Header.jsx

/**
 * A header component that provides consistent top navigation and display for dashboard pages.
 * It shows the user's name, the application title, and a logout button for authentication management.
 */
import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { IoNotifications } from "react-icons/io5";
import NotificationDropdown from "../notifications/NotificationDropdown";
import { useChat } from "../../hooks/useChat";
import { AuthContext } from "../../context/AuthContext";

/**
 * @param {Object} props - The properties for the component.
 * @param {string} props.userName - The name of the currently logged-in user to display.
 * @param {function} props.onLogout - Callback function to handle the logout action.
 * @returns {JSX.Element} The rendered Header component.
 */
function Header({ user, userName, onLogout, showNotifications = false }) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const { notifications } = useChat();
  const { user: authUser } = useContext(AuthContext);

  // Use authUser from context to get the most up-to-date profile picture
  const currentUser = authUser || user;
  const profile = currentUser?.profile || {};

  // Use the same approach as profile settings page - prioritize avatarUrl for students
  const profileImg =
    profile.avatarUrl ||
    currentUser?.profile?.avatarUrl ||
    profile.profilePictureUrl ||
    currentUser?.profilePictureUrl;

  // Generate user name for fallback avatar
  const userDisplayName =
    userName ||
    currentUser?.name ||
    `${currentUser?.profile?.firstName || ""} ${
      currentUser?.profile?.lastName || ""
    }`.trim() ||
    currentUser?.email?.split("@")[0] ||
    "User";

  // Debug logging
  useEffect(() => {
    // console.log("Header - Current user changed:", currentUser);
    // console.log("Header - Profile picture URL:", profileImg);
    // console.log("Header - User display name:", userDisplayName);
    // console.log("Header - Full profile object:", currentUser?.profile);
    // console.log(
    //   "Header - Profile picture key:",
    //   currentUser?.profile?.profilePictureKey
    // );
  }, [currentUser, profileImg, userDisplayName]);
  // Count unread notifications
  const unreadCount = notifications
    ? notifications.filter((n) => !n.isRead).length
    : 0;

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Handles the logout process.
   * Calls the `onLogout` prop function and then navigates the user to the login page.
   */
  const handleLogout = () => {
    setShowProfileMenu(false);
    onLogout();
    navigate("/login");
  };

  const handleSettingsClick = () => {
    setShowProfileMenu(false);
    navigate(`/${currentUser?.role}/profile`);
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <header className="bg-[#DAECFD] px-[8px] pd-[10px] pt-[5px] py-[10px] h-[52px] py-text-center z-10 sticky top-0">
      <div className="flex items-center justify-between px-4">
        {/* Application title */}
        <div>
          <img
            src="/logo/cubie-logo-color.svg"
            alt="Cubie Logo"
            className="h-8 w-auto"
            style={{ maxHeight: "32px" }}
          />
        </div>
        {/* User info - display based on role */}
        <div className="flex items-center gap-4">
          {/* For students: notification bell, avatar, then name */}
          {currentUser?.role === "student" && (
            <>
              {/* Notifications bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 relative bg-transparent border-0 p-0"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    padding: "0",
                  }}
                  title="Notifications"
                  onClick={() => {
                    setShowNotificationDropdown(!showNotificationDropdown);
                  }}
                >
                  <IoNotifications className="w-5 h-5 text-gray-600" />
                  {/* Notification badge - shows when there are unread notifications */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? (
                        <span className="text-xs text-white font-bold">9+</span>
                      ) : (
                        <span className="text-xs text-white font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <NotificationDropdown
                  isOpen={showNotificationDropdown}
                  onClose={() => setShowNotificationDropdown(false)}
                  user={currentUser}
                />
              </div>

              {/* Profile button with dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={handleProfileClick}
                  className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title={`View profile - ${userDisplayName}`}
                >
                  <img
                    src={
                      profileImg ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userDisplayName
                      )}&background=e879f9&color=ffffff&size=40`
                    }
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                    style={{
                      display: "block",
                      width: "40px",
                      height: "40px",
                      minWidth: "40px",
                      minHeight: "40px",
                    }}
                    onError={(e) => {
                      console.error(
                        "Header - Profile image failed to load:",
                        e.target.src
                      );
                      // Fallback to ui-avatars.com
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userDisplayName
                      )}&background=e879f9&color=ffffff&size=40`;
                    }}
                    onLoad={(e) => {
                      // console.log(
                      //   "Header - Profile image loaded successfully:",
                      //   profileImg
                      // );
                      // console.log(
                      //   "Header - Image element dimensions:",
                      //   e.target.width,
                      //   "x",
                      //   e.target.height
                      // );
                    }}
                  />
                </button>

                {/* Profile dropdown menu */}
                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 flex py-2 flex-col items-start rounded-[15px] bg-white z-50"
                    style={{
                      width: "175px",
                      boxShadow: "1px 1px 6px 0px rgba(0, 0, 0, 0.25)",
                    }}
                  >
                    {/* Profile Picture and Name Section */}
                    <div className="flex flex-col items-center justify-center self-stretch px-4 py-3 mb-2">
                      <img
                        src={
                          profileImg ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            userDisplayName
                          )}&background=e879f9&color=ffffff&size=80`
                        }
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover mb-2"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            userDisplayName
                          )}&background=e879f9&color=ffffff&size=80`;
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 text-center">
                        {userDisplayName}
                      </span>
                    </div>

                    <hr className="my-1 border-gray-100 w-full" />

                    <button
                      onClick={handleSettingsClick}
                      className="flex items-center justify-start self-stretch px-4 py-3 text-left text-black bg-transparent hover:bg-gray-50 focus:bg-transparent gap-3 transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>Settings</span>
                    </button>

                    <hr className="my-1 border-gray-100 w-full" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-start self-stretch px-4 py-3 text-left text-black bg-transparent hover:bg-gray-50 focus:bg-transparent gap-3 transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Student name */}
              <h2 className="text-xl text-black font-bold">
                {userDisplayName}
              </h2>
            </>
          )}

          {/* For teachers: notification bell and avatar */}
          {currentUser?.role === "teacher" && (
            <>
              {/* Notifications bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 relative bg-transparent border-0 p-0"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    padding: "0",
                  }}
                  title="Notifications"
                  onClick={() => {
                    setShowNotificationDropdown(!showNotificationDropdown);
                  }}
                >
                  <IoNotifications className="w-5 h-5 text-gray-600" />
                  {/* Notification badge - shows when there are unread notifications */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? (
                        <span className="text-xs text-white font-bold">9+</span>
                      ) : (
                        <span className="text-xs text-white font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <NotificationDropdown
                  isOpen={showNotificationDropdown}
                  onClose={() => setShowNotificationDropdown(false)}
                  user={currentUser}
                />
              </div>

              {/* Profile avatar */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={handleProfileClick}
                  className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title={`View profile - ${userDisplayName}`}
                >
                  <img
                    src={
                      profileImg ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userDisplayName
                      )}&background=e879f9&color=ffffff&size=40`
                    }
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                    style={{
                      display: "block",
                      width: "40px",
                      height: "40px",
                      minWidth: "40px",
                      minHeight: "40px",
                    }}
                    onError={(e) => {
                      console.error(
                        "Header - Profile image failed to load:",
                        e.target.src
                      );
                      // Fallback to ui-avatars.com
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userDisplayName
                      )}&background=e879f9&color=ffffff&size=40`;
                    }}
                    onLoad={(e) => {
                      // console.log(
                      //   "Header - Profile image loaded successfully:",
                      //   profileImg
                      // );
                      // console.log(
                      //   "Header - Image element dimensions:",
                      //   e.target.width,
                      //   "x",
                      //   e.target.height
                      // );
                    }}
                  />
                </button>

                {/* Profile dropdown menu */}
                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 flex py-2 flex-col items-start rounded-[15px] bg-white z-50"
                    style={{
                      width: "175px",
                      boxShadow: "1px 1px 6px 0px rgba(0, 0, 0, 0.25)",
                    }}
                  >
                    {/* Profile Picture and Name Section */}
                    <div className="flex flex-col items-center justify-center self-stretch px-4 py-3 mb-2">
                      <img
                        src={
                          profileImg ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            userDisplayName
                          )}&background=e879f9&color=ffffff&size=80`
                        }
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover mb-2"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            userDisplayName
                          )}&background=e879f9&color=ffffff&size=80`;
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 text-center">
                        {userDisplayName}
                      </span>
                    </div>

                    <hr className="my-1 border-gray-100 w-full" />

                    <button
                      onClick={handleSettingsClick}
                      className="flex items-center justify-start self-stretch px-4 py-3 text-left text-black bg-transparent hover:bg-gray-50 focus:bg-transparent gap-3 transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>Settings</span>
                    </button>

                    <hr className="my-1 border-gray-100 w-full" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-start self-stretch px-4 py-3 text-left text-black bg-transparent hover:bg-gray-50 focus:bg-transparent gap-3 transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* For parents: notification bell and avatar */}
          {currentUser?.role === "parent" && (
            <>
              {/* Notifications bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  className="flex items-center bg-white justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 relative bg-transparent border-0 p-0"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    padding: "0",
                  }}
                  title="Notifications"
                  onClick={() => {
                    setShowNotificationDropdown(!showNotificationDropdown);
                  }}
                >
                  <IoNotifications className="w-5 h-5 text-gray-600" />
                  {/* Notification badge - shows when there are unread notifications */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? (
                        <span className="text-xs text-white font-bold">9+</span>
                      ) : (
                        <span className="text-xs text-white font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <NotificationDropdown
                  isOpen={showNotificationDropdown}
                  onClose={() => setShowNotificationDropdown(false)}
                  user={currentUser}
                />
              </div>

              {/* Profile avatar */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={handleProfileClick}
                  className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title={`View profile - ${userDisplayName}`}
                >
                  <img
                    src={
                      profileImg ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userDisplayName
                      )}&background=e879f9&color=ffffff&size=40`
                    }
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                    style={{
                      display: "block",
                      width: "40px",
                      height: "40px",
                      minWidth: "40px",
                      minHeight: "40px",
                    }}
                    onError={(e) => {
                      console.error(
                        "Header - Profile image failed to load:",
                        e.target.src
                      );
                      // Fallback to ui-avatars.com
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userDisplayName
                      )}&background=e879f9&color=ffffff&size=40`;
                    }}
                    onLoad={(e) => {
                      // console.log(
                      //   "Header - Profile image loaded successfully:",
                      //   profileImg
                      // );
                      // console.log(
                      //   "Header - Image element dimensions:",
                      //   e.target.width,
                      //   "x",
                      //   e.target.height
                      // );
                    }}
                  />
                </button>

                {/* Profile dropdown menu */}
                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 flex py-2 flex-col items-start rounded-[15px] bg-white z-50"
                    style={{
                      width: "175px",
                      boxShadow: "1px 1px 6px 0px rgba(0, 0, 0, 0.25)",
                    }}
                  >
                    {/* Profile Picture and Name Section */}
                    <div className="flex flex-col items-center justify-center self-stretch px-4 py-3 mb-2">
                      <img
                        src={
                          profileImg ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            userDisplayName
                          )}&background=e879f9&color=ffffff&size=80`
                        }
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover mb-2"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            userDisplayName
                          )}&background=e879f9&color=ffffff&size=80`;
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 text-center">
                        {userDisplayName}
                      </span>
                    </div>

                    <hr className="my-1 border-gray-100 w-full" />

                    <button
                      onClick={handleSettingsClick}
                      className="flex items-center justify-start self-stretch px-4 py-3 text-left text-black bg-transparent hover:bg-gray-50 focus:bg-transparent gap-3 transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>Settings</span>
                    </button>

                    <hr className="my-1 border-gray-100 w-full" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-start self-stretch px-4 py-3 text-left text-black bg-transparent hover:bg-gray-50 focus:bg-transparent gap-3 transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
