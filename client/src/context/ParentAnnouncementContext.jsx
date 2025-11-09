//client/src/context/ParentAnnouncementContext.jsx

// To pass the _id from ParentAnnouncementList.jsx to ParentAnnouncement.jsx, I use context;
import React, { createContext, useContext } from "react";

const AnnouncementContext = createContext();

export const AnnouncementProvider = ({ value, children }) => {
  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncement = () => useContext(AnnouncementContext);