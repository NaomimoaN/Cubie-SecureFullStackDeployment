// client/src/components/teacher/TeacherAnnouncement.jsx
/**
 * Announcement component for parents, displaying announcements related to their children.
 * It sets up the sub-sidebar configuration for announcements and handles cleanup on unmount.
 * This temporary component, you can recreate this for all roles like teacher, student, etc.
 */

import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import { useNavigate, Outlet } from "react-router-dom";
// module imports no {}, function imports with {}
import { getCreatedAnnouncements, getAllAnnouncements } from "../../../services/announcementService";
import { api } from "../../../services/api"; //api.js file for axios instance

function TeacherAnnouncement({ user }) {
  const { setSubSidebarConfig } = useSubSidebar();
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  // For delete purpose
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    try {
      await api.delete(`/api/announcements/${announcementToDelete}`);
      // Refresh the announcement list after delete the announcement
      await fetchCreatedAnnouncements();
      setIsModalOpen(false);
      setAnnouncementToDelete(null);
      setError("");
      navigate("/teacher/announcements");
    } catch (error) {
      console.error("Error deleting announcement:", error);
      setError("Failed to delete announcement. Please try again.");
    }
  };

  const openDeleteModal = (announcementId) => {
    setAnnouncementToDelete(announcementId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAnnouncementToDelete(null);
    setError("");
  };

  // For edit purpose
  const handleEdit = (announcement) => {
    navigate(`edit/${announcement._id}`, { state: { announcement } });
  };

  // user.id can get the id;

  // Select the sub-sidebar configuration based on the current route
  // This useEffect is for sub-sidebar configuration, do NOT touch it;
  useEffect(() => {
    if (
      location.pathname.includes("/announcements") ||
      params.someParam === "announcements"
    ) {
      // The type will be used to determine which sub-sidebar content to render in SubSidebar.jsx
      setSubSidebarConfig({
        type: "TeacherAnnouncement",
        data: {
          subjects: [{ _id: '/create-announcement', name: 'Create Announcement' }, { _id: '/inbox', name: 'Inbox' }],
          basePath: `/teacher/announcements`,
        },
      });
    } else {
      setSubSidebarConfig(null);
    }

    // Cleanup function to reset sidebar config when component unmounts or dependencies change
    return () => {
      setSubSidebarConfig(null);
    };
  }, [location.pathname, params, setSubSidebarConfig]);

  //Fetch data from Database
  // Define state variables to hold announcements data
  const [createdAnnouncements, setCreatedAnnouncements] = useState([]);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  // Fetching
  const fetchCreatedAnnouncements = async () => {
    try {
      const data = await getCreatedAnnouncements(user.id);
      // Sort by creation_date (latest first)
      const sortedData = data.sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date));
      setCreatedAnnouncements(sortedData);
      // console.log("Sorted createdAnnouncements:", sortedData);
    } catch (error) {
      console.error("Error fetching created announcements:", error);
    }
  };

  const fetchAllAnnouncements = async () => {
    try {
      const data = await getAllAnnouncements();
      // Sort by creation_date (latest first)
      const sortedData = data.sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date));
      setAllAnnouncements(sortedData);
      // console.log("Sorted allAnnouncements:", sortedData);
    } catch (error) {
      console.error("Error fetching all announcements:", error);
    }
  };

  const sortArrayByDate = (array) => {
    return array.sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date));
  }

  useEffect(() => {
    // Fetch announcements data from the database here
    // This is a placeholder for the actual data fetching logic
    // Consider about the React's Rendering lifecycle;
    // React components re-render when state or props change. If you assign the data to a constant, React won't know when the data is available, and the component won't re-render to display the fetched data.
    fetchCreatedAnnouncements();
    if (createdAnnouncements.length > 0) {
      // Sort the announcements by creation date
      const sortedAnnouncements = sortArrayByDate(createdAnnouncements);
      setCreatedAnnouncements(sortedAnnouncements);
    }
  }, [user.id]);

  useEffect(() => {
    fetchAllAnnouncements();
    if (allAnnouncements.length > 0) {
      // Sort the announcements by creation date
      const sortedAnnouncements = sortArrayByDate(allAnnouncements);
      setAllAnnouncements(sortedAnnouncements);
    }
  }, []);

  // To change the time format:
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };


  // Check if the current route is a child route for creating an announcement
  const isChildRoute = location.pathname !== "/teacher/announcements";
  // console.log("Line 78: ", createdAnnouncements); //working

  if (
    location.pathname.includes("inbox")
  ) {
    return (
      <div className="bg-white size-full">
        <div className="mx-5 my-10">
          <h1 className="text-[2.5rem] mb-[3%]">Inbox</h1>

          <div className="px-5">
            <table className="table-auto border-collapse w-full mt-4">
              <thead>
                <tr>
                  <th className="border-b-4 border-[#C7C7C7] px-4 py-5 text-left text-[1.25rem]">Title</th>
                  <th className="border-b-4 border-[#C7C7C7] px-4 py-5 text-left text-[1.25rem]">Date</th>
                </tr>
              </thead>
              <tbody>
                {allAnnouncements.map((announcement, index) => (
                  <tr key={index}
                    onClick={() => navigate(`${announcement._id}`)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <td className="border-b border-[#C7C7C7] px-4 py-5">{announcement.title}</td>
                    <td className="border-b border-[#C7C7C7] px-4 py-5">{formatDate(announcement.creation_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    ); //work on else if
  } else {
    return (
      <div className="size-full">
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6  w-[530px] h-[260px] flex justify-center items-center"
            >
              <div>
                <h2 className="text-[16px] font-semibold text-gray-800 mb-4 text-center">
                  Are you sure you want to delete this?
                </h2>
                {error && (
                  <p className="text-red-600 mb-4">{error}</p>
                )}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-primeblack text-[13px] rounded-full hover:bg-gray3 border-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-orange1 text-white text-[13px] rounded-full hover:bg-orange2 border-none"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {!isChildRoute && (
          <>
            <div className="px-5 py-10 bg-white size-full">
              <div className="flex justify-between mb-[3%]">
                <h1 className="text-[2.5rem]">Created by You</h1>
                <button className="bg-orange-500 text-white rounded-[50px] px-4 py-2"
                  onClick={() => navigate("create-announcement", { state: { user } })}
                >Create Announcement</button>
              </div>

              <div className="mb-20">
                <table className="table-auto border-collapse w-full mt-4">
                  <thead>
                    <tr>
                      <th className="border-b-4 border-[#C7C7C7] px-4 py-2 text-left">Title</th>
                      <th className="border-b-4 border-[#C7C7C7] px-4 py-2 text-left">Recipient Group</th>
                      <th className="border-b-4 border-[#C7C7C7] px-4 py-2 text-left">Creation Date</th>
                      <th className="border-b-4 border-[#C7C7C7] px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createdAnnouncements.map((announcement, index) => (
                      <tr key={index}
                        onClick={() => navigate(`${announcement._id}`)}
                        // discarded design; hover:bg-gray-100
                        className="cursor-pointer " >

                        <td className="border-b border-[#C7C7C7] px-4 py-2">{announcement.title}</td>
                        <td className="border-b border-[#C7C7C7] px-4 py-2">{announcement.recipient_group}</td>
                        <td className="border-b border-[#C7C7C7] px-4 py-2">{formatDate(announcement.creation_date)}</td>
                        <td className="border-b border-[#C7C7C7] px-4 py-2 flex justify-center gap-4">
                          {/* Pencil Icon */}
                          <button className="bg-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(announcement);
                            }}>
                            <img
                              src="/teacher-announcement/icon-edit.png"
                              alt="Edit"
                              className="w-6 h-6"
                            />
                          </button>
                          {/* Garbage Can Icon */}
                          <button className="bg-white"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click navigation
                              openDeleteModal(announcement._id);
                            }}>
                            <img
                              src="/teacher-announcement/icon-delete.png"
                              alt="Delete"
                              className="w-6 h-6"
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {/* Render the Outlet for child routes */}
        <Outlet />
      </div>
    );
  }

}

export default TeacherAnnouncement;

