// client/src/services/announcementService.js

import { api } from "./api";

export const postAnnouncement = async (announcementData) => {
  try {
    const response = await api.post("/api/announcements/postNewAnnouncement", announcementData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    // console.log(response.data); //response.data will return 
    return response.data;
  } catch (error) {
    console.error("Error creating announcement:", error);
    throw error.response?.data?.message || error.message;
  }
}

export const getCreatedAnnouncements = async (userId) => {
  // To pass your parameter to backend, you can use 1. query string, 2. URL parameter, or 3. request body;
  try {
    // console.log("announcementService-L018:", userId);//working
    const response = await api.get(`/api/announcements/created?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching announcements:", error);
    throw error.response?.data?.message || error.message;
  }
}

export const getAllAnnouncements = async () => {
  try {
    const response = await api.get("/api/announcements/all");
    return response.data;
  } catch (error) {
    console.error("Error fetching announcements:", error);
    throw error.response?.data?.message || error.message;
  }
}

export const getStudentsAnnouncements = async () => {
  try {
    const response = await api.get("/api/announcements/students");
    return response.data;
  } catch (error) {
    console.error("Error fetching announcements:", error);
    throw error.response?.data?.message || error.message;
  }
}

export const getParentsAnnouncements = async () => {
  try {
    const response = await api.get("/api/announcements/parents");
    return response.data;
  } catch (error) {
    console.error("Error fetching announcements:", error);
    throw error.response?.data?.message || error.message;
  }
}

export const deleteAnnouncement = async (announcementId) => {
  try {
    const response = await api.delete(`/api/announcements/${announcementId}`);
    return response.data;
  } catch (error) {
    console.error("deleteAnnouncement error:", error);
    throw error;
  }
};

export const updateAnnouncement = async (announcementId, formData) => {
  try {
    const response = await api.put(`/api/announcements/${announcementId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("updateAnnouncement error:", error);
    throw error;
  }
};