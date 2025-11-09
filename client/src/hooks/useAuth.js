// client/src/hooks/useAuth.js

/**
 * A custom React hook that provides access to the authentication context.
 * It allows components to consume authentication state and functions (e.g., user data, login, logout, loading status)
 * from the nearest `AuthContext.Provider` in the component tree.
 */
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
