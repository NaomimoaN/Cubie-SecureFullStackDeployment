// client/src/components/parent/ParentTimetable.jsx
// Manages the selection of a child and serves as the main page for displaying their timetable.

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import ParentChildTimetable from "./ParentChildTimetable";

function ParentTimetable({ user }) {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { setSubSidebarConfig } = useSubSidebar();
  const [childDetails, setChildDetails] = useState(null);

  useEffect(() => {
    if (
      !user ||
      user.role !== "parent" ||
      !Array.isArray(user.familyStudents) ||
      user.familyStudents.length === 0
    ) {
      setSubSidebarConfig(null);
      setChildDetails(null);
      return;
    }

    setSubSidebarConfig({
      type: "parentChildrenSelection",
      data: {
        children: user.familyStudents,
        basePath: "/parent/timetable",
      },
    });

    let selectedChild = null;
    if (childId) {
      selectedChild = user.familyStudents.find(
        (child) => child?.userId === childId
      );
    }
    if (!selectedChild && user.familyStudents.length > 0) {
      selectedChild = user.familyStudents[0];
      if (selectedChild && childId !== selectedChild.userId) {
        navigate(`/parent/timetable/${selectedChild.userId}`, {
          replace: true,
        });
      }
    }

    if (selectedChild) {
      setChildDetails(selectedChild);
    } else {
      setChildDetails(null);
    }

    return () => {
      setSubSidebarConfig(null);
    };
  }, [childId, user, setSubSidebarConfig, navigate]);

  if (!childDetails) {
    return (
      <div className="p-4 text-center text-xl text-gray-600 h-full flex items-center justify-center">
        Child information not available or not found.
      </div>
    );
  }

  return (
    <div className="p-8 bg-white h-full flex-1 overflow-y-auto">
      <h2 className="text-[26px] font-semibold text-primeblack mb-4">
        {childDetails.name}'s Timetable
      </h2>
      <ParentChildTimetable childId={childDetails.userId} />
    </div>
  );
}

export default ParentTimetable;
