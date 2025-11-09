// client/src/components/attendance/studentClickedAnnouncement.jsx

// Use s3Service.js to handle file uploads and downloads from S3
import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";

function StudentClickedAnnouncement({ user }) {

  const location = useLocation();
  const announcement = location.state?.announcement;
  // console.log("Announcement data:", announcement.description);
  const [error, setError] = useState("");

  // Modify the date format to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Extract the file name from the file key
  // fileKey is somthing like "1753203608990_Testing-propose.pdf?AWSAccessKeyId=AKIA...&Expires=1753203609&Signature=..."
  const getOriginalFileName = (fileKey) => {
    if (!fileKey) return "No attachment";
    const fileName = fileKey.split("/").pop().split("?")[0]; // Get 1753203608990_Testing-propose.pdf
    const parts = fileName.split("_");
    return decodeURIComponent(parts.length > 1 ? parts.slice(1).join("_") : fileName);
  };

  // Extract file key for refreshing pre-signed URL
  const fileKey = announcement.fileUrl ? announcement.fileUrl.split("/").pop().split("?")[0] : null;

  // Fetch the signed URL for downloading the attachment
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

  if (!announcement) {
    return (
      <div className="mx-10 my-10 text-center">
        <h1 className="text-2xl font-semibold text-gray-700">No announcement data available.</h1>
      </div>
    );
  }

  return (
    <>
      <div className="mx-10 my-10 border-2 border-[#C7C7C7] border-solid min-h-[80%] rounded-[2rem] px-10 py-[2%] bg-white">
        <div className="mb-10 flex justify-between">
          <h1>{announcement.title}</h1>
          {/* <button className="min-w-[15%] bg-[#E2E2E2] text-[#393939]">Edit</button> */}
        </div>

        <div className="mt-3 flex justify-between">
          <p className="font-bold">{announcement.creatorTitle}</p>
          <p>{formatDate(announcement.creation_date)}</p>
        </div>

        <div className="mt-5 mb-10 h-px w-100% bg-[#393939]"> </div>

        <div className="whitespace-pre-line">
          <p className="max-w-[80%]">{announcement.description}</p>
        </div>

        {/* Styling and access deny to be fixed */}
        {/* Attachement part */}
        <div className="mt-20 mb-6">
          {announcement.fileUrl ? (
            <button
              onClick={() => handleDownload(announcement.fileUrl, fileKey)}
              className="bg-white border-[#C7C7C7] flex items-center space-x-2 text-[#393939] hover:text-indigo-800"
            >
              <span className="underline">{getOriginalFileName(fileKey)}</span>
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
    </>
  );
}

export default StudentClickedAnnouncement;