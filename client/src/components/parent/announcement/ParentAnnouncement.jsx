// client/src/components/parent/announcement/ParentAnnouncement.jsx

/**
 * Announcement component for parents, displaying announcements related to their children.
 * It sets up the sub-sidebar configuration for announcements and handles cleanup on unmount.
 * This is a temporary component; similar components can be created for other roles like teacher or student.
 */
// Can't get aID and parentAnnouncement at the same time. That's the problem.

import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import { getParentsAnnouncements } from "../../../services/announcementService";
import axios from "axios";

/**
 * @param {Object} props - The component properties.
 * @param {Object} props.user - The user object, typically from authentication context,
 * which might contain user role or other relevant data for announcements.
 * @returns {JSX.Element} The rendered Parent Announcement component.
 */
function ParentAnnouncement({ user }) {
  const { setSubSidebarConfig } = useSubSidebar();
  const { announcementId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [announcement, setAnnouncement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useParams(); //for subSidebar configuration
  const [fileKey, setFileKey] = useState(null);
  // const fileKey = announcement.fileUrl ? announcement.fileUrl.split("/").pop().split("?")[0] : null;

  /**
   * Effect hook to manage the sub-sidebar configuration based on the current route.
   * If the path includes "/announcements" or a relevant parameter, set the sub-sidebar type.
   * Cleans up the sub-sidebar configuration on component unmount or when dependencies change.
   */
  useEffect(() => {
    // Check if the current path or any URL parameter indicates an announcement page.
    if (
      location.pathname.includes("/announcements") ||
      Object.values(params).some((param) => param === "announcements") // Check if any param value is "announcements"
    ) {
      setSubSidebarConfig({
        type: "ParentAnnouncement", // Set the type for the SubSidebar to render specific content.
        data: {
          subjects: [{ _id: '/create-announcement', name: 'Create Announcement' }, { _id: '/inbox', name: 'Inbox' }],
          basePath: `/parent/announcements`,
        },
      });
    } else {
      // If not on an announcements page, clear the sub-sidebar configuration.
      setSubSidebarConfig(null);
    }

    // Cleanup function: This runs when the component unmounts or before the effect re-runs.
    return () => {
      setSubSidebarConfig(null); // Ensure sub-sidebar is cleared when component is no longer active.
    };
  }, [location.pathname, params, setSubSidebarConfig]); // Dependencies for the effect.

  // Fetch announcements and select the one matching announcementId
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getParentsAnnouncements();
        // Sort by creation_date (latest first)
        const sortedAnnouncements = data.sort(
          (a, b) => new Date(b.creation_date) - new Date(a.creation_date)
        );
        const selected = sortedAnnouncements.find(
          (ann) => ann._id === announcementId
        ) || sortedAnnouncements[0]; // Fallback to first announcement
        setAnnouncement(selected);
        setFileKey(selected.fileUrl ? selected.fileUrl.split("/").pop().split("?")[0] : null);
      } catch (err) {
        setError("Failed to load announcement. Please try again.");
        console.error("Error fetching parent announcements:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncements();
  }, [announcementId]);

  const getFileName = (fileKey) => {
    if (!fileKey) return "No attachment";
    const fileName = fileKey.split("/").pop().split("?")[0];// Get 1753203608990_Testing-propose.pdf
    const parts = fileName.split("_");
    // parts = ['1753203608990', 'Testing-propose.pdf'];
    // console.log("line93:", parts)
    return decodeURIComponent(parts.length > 1 ? parts.slice(1).join("_") : fileName);
  };

  // Handle file download with pre-signed URL
  const handleDownload = async (fileUrl, fileKey) => {
    try {
      // If the URL is expired, request a new one (optional)
      const response = await axios.get(`/api/announcements/signed-url?key=${encodeURIComponent(fileKey)}`);
      window.open(response.data.signedUrl, "_blank");
    } catch (err) {
      setError("Failed to download attachment. The link may have expired.");
      console.error("Download error:", err);
    }
  };


  if (isLoading) {
    return <h1 className="p-4">Loading...</h1>;
  }

  if (!announcement) {
    return (
      <div className="mx-10 my-10 text-center">
        <h1 className="text-2xl font-semibold text-gray-700">No announcement found</h1>
        <p className="text-gray-500">
          {announcementId ? `No announcement found for ID: ${announcementId}` : "No announcements available."}
        </p>
      </div>
    );
  }

  return (
    <div>

      <div className="mx-[5%] mt-10 p-[32px] bg-[#FFFFFF] border-[1px] border-[#c7c7c7] rounded-lg min-h-[50vh]">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}
        <div className="">
          <h2 className="mb-[5%] font-semibold text-lg text-[2.25rem]">{announcement.title}</h2>
          <div className="flex justify-between">
            <p>{announcement.creatorTitle}</p>
            <p>{new Date(announcement.creation_date).toLocaleDateString()}</p>
          </div>
          <p className="mt-[1%] bg-[#E2E2E2] h-[1px]"> </p>
        </div>

        <div className="mt-[2%]">
          <p style={{ whiteSpace: "pre-line" }} className="leading-9">{announcement.description}</p>
        </div>

        {/* Attachment */}
        <div className="mt-20 mb-6">
          {announcement.fileUrl ? (
            <button
              onClick={() => handleDownload(announcement.fileUrl, fileKey)}
              className="bg-white border-[#C7C7C7] flex items-center space-x-2 text-[#393939] hover:text-indigo-800"
            >
              <span className="underline">{getFileName(announcement.fileUrl)}</span>
              <img
                src="/teacher-announcement/blue-download.png"
                alt="Download Icon"
                className=""
              />
            </button>
          ) : (
            <p className="text-gray-500"></p>
          )}
        </div>

      </div>

    </div>
  );


}

export default ParentAnnouncement;
