// client/src/context/AuthContext.jsx

/**
 * Provides global authentication state and functions (login, logout, session verification)
 * to the application via React Context.
 */

import React, { createContext, useState, useEffect, useCallback } from "react";
import authService from "../services/authService.js";

/**
 * Creates a React Context for authentication.
 * Components can subscribe to this context to access the authentication state and functions.
 */
export const AuthContext = createContext(undefined);

/**
 * A provider component that encapsulates the authentication logic and state.
 * It fetches the user profile on initial load, handles login and logout processes,
 * and exposes the user data, loading status, and authentication functions to its children.
 * @param {Object} { children } - The child components to be rendered within the provider.
 */
export const AuthProvider = ({ children }) => {
  // State to hold the authenticated user's data.
  const [user, setUser] = useState(null);
  // State to indicate if an authentication operation (login, logout, verification) is in progress.
  const [loading, setLoading] = useState(true);
  // State to track if the initial authentication check on app load has completed.
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  /**
   * Fetches the user profile from the backend to verify the current session.
   * Updates the user state and loading/initial load complete states.
   */
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await authService.verifySession();
      setUser(userData);
    } catch (error) {
      console.error("AuthContext.jsx: Failed to fetch user profile:", error);
      setUser(null);
    } finally {
      setLoading(false);
      setIsInitialLoadComplete(true);
    }
  }, []);

  /**
   * Effect hook that runs once on component mount to verify the user's authentication status.
   */
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  /**
   * Handles user login.
   * Attempts to authenticate with the provided credentials and updates the user profile on success.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {Object} - An object indicating success or failure.
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      await authService.login({ email, password });
      await fetchUserProfile();
      return { success: true, message: "Login successful" };
    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data?.message || error.message
      );
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles user logout.
   * Calls the logout service and clears the user state.
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error during client-side logout:", error);
    } finally {
      setUser(null);
    }
  };

  // The value provided to consumers of the AuthContext.
  // Update user profile data when profile picture or other details change
  const updateUserProfile = (newProfileData) => {
    if (!user) return;

    // Handle nested profile properties
    if (newProfileData.profile) {
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          ...newProfileData.profile,
        },
      };
      setUser(updatedUser);
    }
    // Handle notification settings
    else if (newProfileData.notificationSettings) {
      setUser({
        ...user,
        notificationSettings: {
          ...user.notificationSettings,
          ...newProfileData.notificationSettings,
        },
      });
    }
    // Handle top-level properties
    else {
      setUser({
        ...user,
        ...newProfileData,
      });
    }
  };
  const value = {
    user,
    loading,
    login,
    logout,
    isInitialLoadComplete,
    updateUserProfile,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
