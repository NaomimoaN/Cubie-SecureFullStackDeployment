// client/src/routes/ProtectedRoute.jsx

/**
 * Protects routes by ensuring a user is authenticated and the authentication state is fully loaded.
 * It displays loading indicators while checking authentication and redirects unauthenticated users to the login page.
 */

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
// Navigate: redirect app user to another page;
// Outlet: Outlet will render the protected route’s content if the user is authenticated.
// Outlet is a component acts like a placeholder for rendering child routes in a nested route configuration
import useAuth from "../hooks/useAuth";

// check users authentication and protect certain routes
const ProtectedRoute = () => {
  const { user, loading, isInitialLoadComplete } = useAuth();

  // Displays a loading indicator until the initial authentication state is known.
  if (!isInitialLoadComplete) {
    console.log(
      "ProtectedRoute: Waiting for initial authentication load to complete."
    );
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">
          Loading initial authentication...
        </p>
      </div>
    );
  }

  // Displays a loading indicator for ongoing authentication processes (e.g., login/logout).
  if (loading) {
    console.log(
      "ProtectedRoute: Ongoing authentication process (e.g., login/logout)."
    );
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Loading authentication...</p>
      </div>
    );
  }

  // if user exists, the protected content is rendered;
  // If user is falsy, the user is redirected to the login page.
  // Outlet means if the user is authenticated, the route inside this Outlet will be rendered.
  // 3. Render child routes if user is authenticated, otherwise redirect to login.
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
