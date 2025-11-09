//client/src/components/teacher/announcement/AnnouncementClicked.jsx

import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import { useNavigate, Outlet } from "react-router-dom";
import { getCreatedAnnouncements, getAllAnnouncements } from "../../../services/announcementService";
// import TeacherAnnouncement from "./TeacherAnnouncement";
import axios from "axios";

function AnnouncementClicked({ user }) {
  const { setSubSidebarConfig } = useSubSidebar();
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  // user.id can get the id;

  // Select the sub-sidebar configuration based on the current route
  // This useEffect is for sub-sidebar configuration, do NOT touch it;
  useEffect(() => {
    if (
      location.pathname.includes("/announcements") ||
      params.someParam === "announcements"
    ) {
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
    // location.pathname, params, 
  }, [setSubSidebarConfig]);

  //Fetch data from Database
  // Define state variables to hold announcements data
  //Fetch data from Database
  // Define state variables to hold announcements data
  const [createdAnnouncements, setCreatedAnnouncements] = useState([]);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [isLoading, setisLoading] = useState(true);
  const [theClickedCreatedObject, setTheClickedCreatedObject] = useState(null);
  const [theClickedAllObject, setTheClickedAllObject] = useState(null);
  const [error, setError] = useState("");
  // Fetching
  const fetchCreatedAnnouncements = async () => {
    try {
      const data = await getCreatedAnnouncements(user.id); // Fetch data from backend
      setCreatedAnnouncements(data); // Update state with fetched data
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const fetchAllAnnouncements = async () => {
    try {
      const data = await getAllAnnouncements(user.id); // Fetch data from backend
      setAllAnnouncements(data); // Update state with fetched data
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  useEffect(() => {
    // Fetch announcements data from the database here
    // This is a placeholder for the actual data fetching logic
    // Consider about the React's Rendering lifecycle;
    // React components re-render when state or props change. If you assign the data to a constant, React won't know when the data is available, and the component won't re-render to display the fetched data.
    // console.log("line74", user);
    fetchCreatedAnnouncements();
    fetchAllAnnouncements();
    // setisLoading(false);
  }, []);

  useEffect(() => {
    // console.log("line 80", createdAnnouncements);
    setTheClickedCreatedObject(createdAnnouncements.find(
      (objectInsideArray) => objectInsideArray._id == params.announcementID
    ));
    console.log("line 84", theClickedCreatedObject);
    // console.log("line 85", params);
    // The ClickedObject is the last thing to appear.
    // Always set the isLoading after checking the last thing.
    if (theClickedCreatedObject) {
      setisLoading(false);
    }
  }, [createdAnnouncements]);

  useEffect(() => {
    // console.log("line 93", allAnnouncements);//works at the very end;
    setTheClickedAllObject(allAnnouncements.find(
      (objectInsideArray) => objectInsideArray._id == params.announcementID
    ));
    // console.log("line 98", theClickedAllObject);
    if (theClickedAllObject) {
      setisLoading(false);
    }
  }, [allAnnouncements]);

  // To change the time format:
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Extract file name from fileKey
  const getFileName = (fileKey) => {
    if (!fileKey) return "No attachment";
    return decodeURIComponent(
      fileKey.split("/").pop().split("_").slice(1).join("_") || fileKey.split("/").pop()
    );
  };

  const handleEdit = (announcementID, theClickedCreatedObject) => {
    navigate(`/teacher/announcements/edit/${announcementID}`, {
      state: { announcement: theClickedCreatedObject },
    });
  };

  // Handle file download with pre-signed URL
  const handleDownload = async (fileUrl, fileKey) => {
    try {
      if (!fileKey) throw new Error("No file key available");
      const fullKey = fileKey.startsWith("announcements/") ? fileKey : `announcements/${fileKey}`;
      const response = await axios.get(`/api/announcements/signed-url?key=${encodeURIComponent(fileKey)}`);
      window.open(response.data.signedUrl, "_blank");
    } catch (err) {
      setError("Failed to download attachment. The file may not exist or the link has expired.");
      console.error("Download error:", err);
    }
  };

  // Output the layout
  if (isLoading) {
    // Render a loading indicator while data is being fetched
    return <h1>Loading...</h1>;
  } else {
    return (
      <div className="bg-white mx-[32px] rounded-[10px] min-h-[50%]">

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <div className="mt-[32px] p-[32px]">

          <div className="flex justify-between mb-[20px]">
            <h1 className="text-[2rem] font-semibold">{theClickedCreatedObject ? theClickedCreatedObject.title : theClickedAllObject.title}</h1>

            {theClickedCreatedObject && (
              <button className="bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(params.announcementID, theClickedCreatedObject);
                }}>
                <img
                  src="/teacher-announcement/icon-edit.png"
                  alt="Edit Icon"
                  className=""
                />
              </button>
            )}

          </div>

          <div className="mt-3 flex justify-between">
            <p>Recipient Group: {theClickedCreatedObject ? theClickedCreatedObject.recipient_group : theClickedAllObject.recipient_group}</p>
            <p>Date Created: {theClickedCreatedObject ? formatDate(theClickedCreatedObject.creation_date) : formatDate(theClickedAllObject.creation_date)}</p>
          </div>

          <div className="mt-5 mb-10 h-px w-100% bg-[#E2E2E2]"> </div>

          <div className="">
            {theClickedCreatedObject
              ? theClickedCreatedObject.description.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))
              : theClickedAllObject.description.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
          </div>

          {/* Attachement */}
          <div className="mt-20 mb-6">

            {(theClickedCreatedObject?.fileUrl && theClickedCreatedObject?.fileKey) ? (
              <button
                onClick={() =>
                  handleDownload(
                    theClickedCreatedObject?.fileUrl,
                    theClickedCreatedObject?.fileKey
                  )
                }
                className="bg-white border-[#C7C7C7] flex items-center space-x-2 text-[#393939] hover:text-indigo-800"
              >
                <span className="underline">
                  {getFileName(theClickedCreatedObject?.fileKey || theClickedAllObject?.fileKey)}
                </span>
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


}

export default AnnouncementClicked;