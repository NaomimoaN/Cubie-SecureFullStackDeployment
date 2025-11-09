// client/src/components/parent/contact-teacher/ParentContactTeacher.jsx

/**
 * A component for parents to contact teachers.
 * It manages the sub-sidebar to allow selecting a child and displays contact information for that child's teachers.
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSubSidebar } from "../../../context/SubSidebarContext";
import fetchUserData from "../../../services/userService";

function ParentContactTeacher({ user }) {
  // Ask Binazir why it does not work.
  useEffect(() => {
    console.log("Inside useEffect");
  }, []);

  const { childId } = useParams();
  const navigate = useNavigate();
  const { setSubSidebarConfig } = useSubSidebar();
  //set the default value to be user 684cb84a93eb635ad4c7599c
  const [childDetails, setChildDetails] = useState({
    userId: "684cb84a93eb635ad4c7599c",
    name: "Brown Jackson",
    role: "student",
  });
  // 0628-F
  const [teacherId, setTeacherId] = useState(null);
  const [teacherData, setTeacherData] = useState(
    {
      "_id": { "$oid": "6870486ff0dd64ffd02e1d3c" },
      "email": "test-teacher001@aaa.com",
      "password": "$2b$10$N6yEnQt27THdvnDjrt4CEu8XgmpzNTE2obYvob2G2plclPRILWoku",
      "role": "teacher",
      "profile": { "firstName": "Carmen", "lastName": "Hwong", "grade": null, "profilePictureUrl": "https://cubie2025.s3.ca-central-1.amazonaws.com/profile-pictures/684cb70993eb635ad4c75928/1752132721033-profilePicture.jpg", "avatarUrl": null, "division": { "$numberInt": "14" }, "schoolYear": "2024-2025" },
      "assignedSubjects": [{ "$oid": "684335929fe8420b417cc914" }, { "$oid": "684335929fe8420b417cc915" }, { "$oid": "684335929fe8420b417cc916" }, { "$oid": "684335929fe8420b417cc917" }, { "$oid": "685478aa045d59fcaed47a30" }],
      "createdAt": { "$date": { "$numberLong": "1749858057574" } }, "updatedAt": { "$date": { "$numberLong": "1752132834214" } }, "__v": { "$numberInt": "1" }, "assignedStudents": [{ "$oid": "684cb84393eb635ad4c75936" }, { "$oid": "684cb84393eb635ad4c75939" }, { "$oid": "684cb84393eb635ad4c7593c" }, { "$oid": "684cb84493eb635ad4c7593f" }, { "$oid": "684cb84493eb635ad4c75942" }, { "$oid": "684cb84493eb635ad4c75945" }, { "$oid": "684cb84493eb635ad4c75948" }, { "$oid": "684cb84493eb635ad4c7594b" }, { "$oid": "684cb84593eb635ad4c7594e" }, { "$oid": "684cb84593eb635ad4c75951" }, { "$oid": "684cb84593eb635ad4c75954" }, { "$oid": "684cb84593eb635ad4c75957" }, { "$oid": "684cb84593eb635ad4c7595a" }, { "$oid": "684cb84693eb635ad4c7595d" }, { "$oid": "684cb84693eb635ad4c75960" }, { "$oid": "684cb84693eb635ad4c75963" }, { "$oid": "684cb84693eb635ad4c75966" }, { "$oid": "684cb84693eb635ad4c75969" }, { "$oid": "684cb84793eb635ad4c7596c" }, { "$oid": "684cb84793eb635ad4c7596f" }, { "$oid": "684cb84793eb635ad4c75972" }, { "$oid": "684cb84793eb635ad4c75975" }, { "$oid": "684cb84793eb635ad4c75978" }, { "$oid": "684cb84893eb635ad4c7597b" }, { "$oid": "684cb84893eb635ad4c7597e" }, { "$oid": "684cb84893eb635ad4c75981" }, { "$oid": "684cb84893eb635ad4c75984" }, { "$oid": "684cb84893eb635ad4c75987" }, { "$oid": "684cb84993eb635ad4c7598a" }, { "$oid": "684cb84993eb635ad4c7598d" }], "familyStudents": [], "notificationSettings": { "calendar": true, "groupChat": true, "schoolUpdate": true, "systemUpdate": false }, "registeredSubjects": []
    });

  console.log("user", user);
  /**
   * Manages sub-sidebar configuration and selected child based on URL and user data.
   * Sets up the sub-sidebar for child selection and handles cleanup.
   */



  useEffect(() => {
    // console.log("line31");
    // Validate user and child data; if invalid, clear sub-sidebar and child details.
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

    // Configure sub - sidebar with the list of children for selection.
    setSubSidebarConfig({
      type: "parentChildrenSelection",
      data: {
        children: user.familyStudents,
        basePath: "/parent/contact-teacher",
      },
    });

    // Determine the selected child from URL or default to the first child.
    let selectedChild = null;
    if (childId) {
      selectedChild = user.familyStudents.find(
        (child) => child?.userId === childId
      );
    }
    if (!selectedChild && user.familyStudents.length > 0) {
      selectedChild = user.familyStudents[0];
      if (selectedChild && childId !== selectedChild.userId) {
        navigate(`/parent/contact-teacher/${selectedChild.userId}`, {
          replace: true,
        });
      }
    }
    // console.log("selectedChild", selectedChild); //testing
    setChildDetails(selectedChild || null);

    //0628-F Get student information from student userId;
    console.log("line67", childDetails); //testing
    if (childDetails?.userId) {
      fetchUserData(childDetails.userId)
        .then((data) => {
          // console.log("line 71", data);
          console.log("line 72", data.data.profile.teacher);
          setTeacherId(data.data.profile.teacher);
          // console.log("line 74", teacherId);
        })
        .catch((error) => {
          console.error("Error fetching child data:", error);
        });
    }
    console.log("line 83", teacherId); //working
    // Get Teacher information with teacherId;
    if (teacherId) {
      fetchUserData(teacherId)
        .then((data) => {
          console.log("line 88", data.data);
          setTeacherData(data.data);
          console.log("line 90", teacherData);
        })
        .catch((error) => {
          console.error("Error fetching child data:", error);
        });
    }
    // Cleanup: Reset sub-sidebar config when component unmounts.
    return () => {
      setSubSidebarConfig(null);
    };
    // childId, user, setSubSidebarConfig, navigate
  }, [childId]);


  // console.log("line 87", childDetails); //Null
  // Display message if child details are not available.
  if (!childDetails) {
    return (
      <div className="p-4 text-center text-xl text-gray-600 h-full flex items-center justify-center">
        Child information not available or not found.
      </div>
    );
  }

  // Render the contact teacher interface for the selected child.
  return (

    <div className="p-4 text-2xl font-semibold bg-white rounded-lg shadow-md h-full flex-1 overflow-y-auto">
      <div className="px-[2%] py-[2%]">
        <h2 className="text-3xl font-bold text-gray-800 mb-20">
          Teacher Info
        </h2>
        <div className="border-2 border-[#e2e2e2] pl-5 pr-10 py-10 min-h-[20vh] rounded-lg text-lg text-gray-700 ">

          <div className="flex gap-10">
            <div className="flex justify-center items-center">
              <img src={`/parent-contact-teacher/${teacherData?.profile.firstName}.jpg`} alt="Teacher Profile Picture"
                className="w-40 h-40 object-cover" />
            </div>

            <div className="grow grid content-center gap-2">
              <h2 className="text-2xl font-bold">
                {teacherData?.profile.firstName} {teacherData?.profile.lastName}
              </h2>
              <h3>Homeroom Teacher</h3>
              {/* To use icon of email, you need to install the font awesome */}
              <div className="mt-2 flex gap-2">
                {/* The public folder is served as the root of your application. Files inside the public folder can be accessed directly using an absolute path starting with /.*/}
                <img src="/parent-contact-teacher/Mail.png" alt="email-icon" className="w-auto h-auto" style={{ objectFit: "contain" }} />
                <p>{teacherData?.profile.firstName}_{teacherData?.profile.lastName}@cubie.com</p>
              </div>
            </div>

            <div className="flex justify-center items-end gap-2">
              <img src="/parent-contact-teacher/Phone.png" alt="phone-icon" className="w-auto h-auto" style={{ objectFit: "contain" }} />
              <p>666-777-8888</p>
            </div>

          </div>
        </div>
      </div>
    </div>

  );
}

export default ParentContactTeacher;
