// client/src/pages/AdminDashboard.jsx

/**
 * Renders the administrator's dashboard page.
 * This page provides an interface for system oversight, user management,
 * and importing user data via CSV, displaying system-related information and admin-level tasks.
 */

import React, { useState } from "react";
import Papa from "papaparse";
import DashboardLayout from "../components/layout/DashboardLayout";
import adminService from "../services/adminService";

function AdminHomePage({ user, onLogout }) {
  const [parsedCsvData, setParsedCsvData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Handles the selection of a CSV file for user data import.
   * Parses the selected file and updates state with parsed data and file status.
   * @param {Event} event - The file input change event.
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      setImportStatus("loading file...");
      setParsedCsvData(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          const usersData = results.data;
          console.log("Parsed Data:", usersData); // Consider removing console.log for production code.
          setParsedCsvData(usersData);
          setImportStatus(`File name "${file.name}" was read correctly.`);
        },
        error: function (err) {
          console.error("CSV parse error:", err); // Consider removing console.error for production code or using a logging service.
          setImportStatus(`CSV parse error: ${err.message}`);
          setParsedCsvData(null);
        },
      });
    } else {
      setFileName("");
      setParsedCsvData(null);
      setImportStatus("No file chosen");
    }
  };

  /**
   * Initiates the import of parsed user data to the system.
   * Displays status messages and handles potential errors during the import process.
   */
  const handleImportUsers = async () => {
    if (!parsedCsvData || parsedCsvData.length === 0) {
      setImportStatus("No importing file");
      return;
    }

    setIsImporting(true);
    setImportStatus("start importing file");

    try {
      const response = await adminService.importUsers(parsedCsvData);
      console.log("import success responce:", response); // Consider removing console.log for production code.
      setImportStatus(`Completed import: ${response.message || "Success"}.`);
      setParsedCsvData(null);
      setFileName("");
    } catch (error) {
      console.error("Error:", error); // Consider removing console.error for production code or using a logging service.
      setImportStatus(
        `Error: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  const userName = user?.name || "Admin";

  // Defines the sidebar navigation items for the admin dashboard.
  const sidebarItems = [
    "Dashboard",
    "User Management",
    "Course Management",
    "System Settings",
  ];

  return (
    <DashboardLayout
      user={user}
      onLogout={handleLogout}
      sidebarItems={sidebarItems}
      dashboardTitle={`Hello! ${userName}!`}
      dashboardSubtitle="This is the Admin Dashboard"
    >
      {/* Placeholder content for admin functionalities. */}
      <p className="text-red-600 text-lg font-bold text-center p-8">
        Ryo set the function of adding user to DB with hashed password by using
        csv. Maybe we need to put more function as Admin, like assigning subject
        to teacher and student, and settting the number of weeks of subjects.
        Teacher will set the contents inside the weeks of subjects.
      </p>
      <section className="bg-white rounded-lg p-6 shadow-md transition-transform duration-300 hover:translate-y-[-5px] text-center font-bold text-gray-700 text-lg">
        <h3>User Data Import</h3>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mb-2"
          disabled={isImporting}
        />
        {fileName && (
          <p className="font-normal text-base text-gray-600">
            File name is: {fileName}
          </p>
        )}
        {parsedCsvData && parsedCsvData.length > 0 && (
          <p className="font-normal text-base text-gray-600">
            Finished to read: {parsedCsvData.length}
          </p>
        )}
        {importStatus && (
          <p className="font-normal text-base text-gray-600 mt-2">
            Status: {importStatus}
          </p>
        )}
        <button
          onClick={handleImportUsers}
          disabled={!parsedCsvData || parsedCsvData.length === 0 || isImporting}
          className={`mt-4 px-6 py-2 rounded-md text-white font-semibold transition-colors duration-200
            ${
              !parsedCsvData || parsedCsvData.length === 0 || isImporting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          {isImporting ? "Importing..." : "Import Users"}
        </button>
      </section>
      <section className="bg-white rounded-lg p-6 shadow-md transition-transform duration-300 hover:translate-y-[-5px] text-center font-bold text-gray-700 text-lg">
        <h3>Course Registration</h3>
        <p className="font-normal text-base text-gray-600">
          Administrator assigns the subject to teacher, registers it to student,
          and set the number of weeks of each subjects.
        </p>
      </section>
    </DashboardLayout>
  );
}

export default AdminHomePage;
