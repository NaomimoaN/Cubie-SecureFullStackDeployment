// client/src/components/student/announcement/StudentAnnouncement.jsx

// This is temporary component.
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import { getStudentsAnnouncements } from "../../../services/announcementService";

function StudentAnnouncement({ user }) {
  const navigate = useNavigate();
  const [studentsAnnouncements, setStudentsAnnouncements] = useState([]);

  const fetchStudentsAnnouncements = async () => {
    try {
      const data = await getStudentsAnnouncements(user.id);
      // Sort by creation_date (latest first)
      const sortedData = data.sort(
        (a, b) => new Date(b.creation_date) - new Date(a.creation_date)
      );
      setStudentsAnnouncements(sortedData);
      console.log("Sorted studentsAnnouncements:", sortedData);
    } catch (error) {
      console.error("Error fetching student announcements:", error);
    }
  };

  useEffect(() => {
    // Fetch announcements data from the database here
    // This is a placeholder for the actual data fetching logic
    // Consider about the React's Rendering lifecycle;
    // React components re-render when state or props change. If you assign the data to a constant, React won't know when the data is available, and the component won't re-render to display the fetched data.
    fetchStudentsAnnouncements();
    if (studentsAnnouncements.length > 0) {
      // Sort the announcements by creation date
      const sortedAnnouncements = sortArrayByDate(studentsAnnouncements);
      setStudentsAnnouncements(sortedAnnouncements);
    }
  }, [user.id]);

  return (
    <>
      <div className="ml-1 px-10 bg-white h-full">
        <h1 className="my-10 font-bold">Announcements</h1>
        {studentsAnnouncements.map((announcement, index) => (
          <div
            key={index}
            className={`mb-5 min-h-32 px-10 py-5 rounded-[1rem] ${
              index % 2 == 0 ? "bg-[#F3F3F3]" : "bg-[#DAECFD]"
            }`}
            // Use state to pass the data to the next page
            // State is a bulit-in feature in navigation library.
            // Then use useLocation to get the data in the next page.
            onClick={() =>
              navigate(`${announcement._id}`, { state: { announcement } })
            }
          >
            <div className="">
              <div className="flex justify-between mb-2">
                <h2 className="font-bold text-lg">{announcement.title}</h2>
                <p>{announcement.number_date}</p>
              </div>
            </div>

            <p>{announcement.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default StudentAnnouncement;
