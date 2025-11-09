import React, { useState } from "react";

const ChangePasswordModal = ({
  onClose,
  onSubmit,
  errors: externalErrors = {},
}) => {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  // Merge external errors with internal errors
  const allErrors = { ...errors, ...externalErrors };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (allErrors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!passwords.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwords.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwords.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwords.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(passwords.currentPassword, passwords.newPassword);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Change Password
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                allErrors.currentPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Current password"
            />
            {allErrors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">
                {allErrors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                allErrors.newPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="New password"
            />
            {allErrors.newPassword && (
              <p className="text-red-500 text-sm mt-1">
                {allErrors.newPassword}
              </p>
            )}
          </div>

          <div>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                allErrors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Confirm new password"
            />
            {allErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {allErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex space-x-4 pt-4 justify-center">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200 font-medium"
              style={{
                minWidth: '84px',
                minHeight: '40px',
                padding: '8px 20px',
                gap: '10px',
                borderRadius: '50px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center justify-center text-white hover:opacity-80 transition-opacity duration-200 font-medium"
              style={{ 
                backgroundColor: '#F06C00',
                minWidth: '120px',
                minHeight: '40px',
                padding: '8px 20px',
                gap: '10px',
                borderRadius: '50px'
              }}
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
