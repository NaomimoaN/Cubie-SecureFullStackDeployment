// client/src/services/contentService.js

/**
 * Manages all client-side API interactions for content.
 * This includes operations for fetching, downloading, deleting content files, and creating new content entries.
 */

import { api } from "./api";

export const getContentById = async (contentId) => {
  try {
    const response = await api.get(`/api/contents/${contentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

export const getContents = async (subjectId = null, weekId = null) => {
  try {
    const params = new URLSearchParams();
    if (subjectId) {
      params.append("subjectId", subjectId);
    }
    if (weekId) {
      params.append("weekId", weekId);
    }

    const url = `/api/contents?${params.toString()}`;
    const response = await api.get(url);
    return response.data.contents;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

export const getContentsForWeek = async (subjectId, weekId) => {
  try {
    if (!weekId || !subjectId) {
      throw new Error("Week ID and Subject ID are required to fetch contents.");
    }
    const response = await api.get(
      `/api/contents?subjectId=${subjectId}&weekId=${weekId}`
    );
    return response.data.contents || [];
  } catch (error) {
    console.error(
      `Error fetching contents for subject ID ${subjectId}, week ID ${weekId}:`,
      error
    );
    throw error.response?.data?.message || error.message;
  }
};

export const createContent = async (contentData) => {
  try {
    const response = await api.post("/api/contents", contentData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

export const updateContent = async (contentId, updateData) => {
  try {
    const response = await api.put(`/api/contents/${contentId}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

export const deleteContent = async (contentId) => {
  try {
    const response = await api.delete(`/api/contents/${contentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

export const getSignedContentUploadUrl = async (
  fileKey,
  contentType,
  contentId = null
) => {
  try {
    const response = await api.post("/api/contents/upload-url", {
      fileKey,
      contentType,
      contentId,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

export const getSignedContentDownloadUrl = async (contentId, s3Key) => {
  try {
    if (!contentId || !s3Key) {
      throw new Error("Content ID and S3 Key are required for download URL.");
    }
    const encodedS3Key = encodeURIComponent(s3Key);
    const response = await api.get(
      `/api/contents/${contentId}/download-url?s3Key=${encodedS3Key}`
    );
    return response.data;
  } catch (error) {
    console.error("Error in getSignedContentDownloadUrl:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const downloadContentFile = async (contentId, s3Key) => {
  try {
    if (!contentId || !s3Key) {
      throw new Error("Content ID and S3 Key are required for download.");
    }
    const { signedUrl, fileName, fileType } = await getSignedContentDownloadUrl(
      contentId,
      s3Key
    );

    if (!signedUrl) {
      throw new Error("Signed URL not received from the server.");
    }

    const link = document.createElement("a");
    link.href = signedUrl;
    link.setAttribute("download", fileName);
    link.setAttribute("target", "_blank");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: "File download initiated." };
  } catch (error) {
    console.error("Error in downloadContentFile:", error);
    throw new Error(
      error.message || error.response?.data?.message || "File download failed."
    );
  }
};

export const uploadFileToS3 = async (signedUrl, file) => {
  try {
    await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};
