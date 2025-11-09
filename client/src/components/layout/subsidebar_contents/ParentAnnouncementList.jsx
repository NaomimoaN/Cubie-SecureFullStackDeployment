// client/src/components/layout/subsidebar_contents/ParentAnnouncementList.jsx

/**
 * A sub-sidebar content component that renders the parent announcement list section.
 * Displays a list of announcements for parents.
 */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getParentsAnnouncements } from "../../../services/announcementService";
import { AnnouncementProvider } from "../../../context/ParentAnnouncementContext";
import { useSubSidebar } from "../../../context/SubSidebarContext"; // Import useSubSidebar
import ParentAnnouncement from "../../parent/announcement/ParentAnnouncement";

function ParentAnnouncementList() {
  const [parentsAnnouncements, setParentsAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  // Access setHideSubSidebar AND isMobileView from SubSidebarContext
  const { setHideSubSidebar, isMobileView } = useSubSidebar();
  // For the list styling
  const { announcementId } = useParams();

  const fetchParentsAnnouncements = async () => {
    try {
      const data = await getParentsAnnouncements();
      setParentsAnnouncements(data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortArrayByDate = (array) => {
    return array.sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date));
  }

  useEffect(() => {
    fetchParentsAnnouncements();
  }, []);

  useEffect(() => {
    fetchParentsAnnouncements();
    if (parentsAnnouncements.length > 0) {
      // Sort the announcements by creation date
      const sortedAnnouncements = sortArrayByDate(parentsAnnouncements);
      setParentsAnnouncements(sortedAnnouncements);
      setIsLoading(false);
    }
  }, [isLoading, parentsAnnouncements.length]);


  // Handler for announcement item click
  const handleAnnouncementClick = (announcementId) => {
    // Only hide the sub-sidebar if it's a mobile view
    if (isMobileView) {
      setHideSubSidebar(true);
    }
    // Navigate to the announcement detail page
    // Adjust this path based on your actual parent announcement routing
    navigate(`/parent/announcements/${announcementId}`);
  };

  if (isLoading) {
    return <h1 className="p-4">Loading...</h1>;
  }

  return (

    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Announcements
      </h3>

      <div>
        {parentsAnnouncements.map((announcement, index) => (
          <div
            key={index}
            // className="mb-10 cursor-pointer hover:bg-[#DAECFD] p-2 rounded"
            onClick={() => handleAnnouncementClick(announcement._id)}
            // style={{
            //   backgroundColor: announcement._id === announcementId ? "#DAECFD" : "transparent",
            // }}
            className={`mb-10 cursor-pointer hover:bg-[#DAECFD] p-2 rounded ${announcement._id === announcementId ? 'bg-[#DAECFD]' : 'bg-white'}`}
          >
            <div className="flex justify-between">
              <h2 className="font-bold text-lg">
                {announcement.title.length > 27
                  ? `${announcement.title.slice(0, 27)} ...`
                  : announcement.title}
              </h2>
              <p>{announcement.number_date}</p>
            </div>

            <p>
              {announcement.description.length > 100
                ? `${announcement.description.slice(0, 100)} ...`
                : announcement.description}
            </p>
          </div>
        ))}
      </div>
      <div style={{ display: "none" }} >
        {/* <ParentAnnouncement /> */}
      </div>
    </div>

  );
}

export default ParentAnnouncementList;
