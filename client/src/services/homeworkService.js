import { api } from "./api"; // Axios instance that automatically attaches authentication tokens

const HOMEWORK_API_URL = "/api/homeworks";

// Creates a new homework assignment. Primarily used by teachers or administrators.
const createHomework = async (homeworkData) => {
  try {
    const response = await api.post(HOMEWORK_API_URL, homeworkData);
    return response.data;
  } catch (error) {
    console.error("Error creating homework:", error);
    throw error.response?.data?.message || error.message;
  }
};

// Updates a specific homework assignment by ID. Primarily used by teachers or administrators.
const updateHomework = async (homeworkId, updateData) => {
  try {
    const response = await api.put(
      `${HOMEWORK_API_URL}/${homeworkId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating homework ID ${homeworkId}:`, error);
    throw error.response?.data?.message || error.message;
  }
};

// Fetches a specific homework assignment by ID.
const getHomeworkById = async (homeworkId) => {
  try {
    const response = await api.get(`${HOMEWORK_API_URL}/${homeworkId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching homework ID ${homeworkId}:`, error);
    throw error.response?.data?.message || error.message;
  }
};

// Deletes a specific homework assignment by ID. Primarily used by teachers or administrators.
const deleteHomework = async (homeworkId) => {
  try {
    const response = await api.delete(`${HOMEWORK_API_URL}/${homeworkId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting homework ID ${homeworkId}:`, error);
    throw error.response?.data?.message || error.message;
  }
};

// Fetches a list of homework assignments based on filter criteria.
// Example: Used to filter homeworks by subject, week, or status.
const getHomeworks = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.subjectId) {
      params.append("subjectId", filters.subjectId);
    }
    if (filters.weekId) {
      params.append("weekId", filters.weekId);
    }
    if (filters.status) {
      params.append("status", filters.status);
    }

    const url = `${HOMEWORK_API_URL}?${params.toString()}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching homeworks:", error);
    throw error.response?.data?.message || error.message;
  }
};

// Retrieves a signed URL for downloading a homework file.
// Used to securely download homework PDFs or associated materials.
const getSignedHomeworkDownloadUrl = async (homeworkId, s3Key) => {
  try {
    const encodedS3Key = encodeURIComponent(s3Key);
    const response = await api.get(
      `${HOMEWORK_API_URL}/${homeworkId}/download-url?s3Key=${encodedS3Key}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error getting signed download URL (HomeworkID: ${homeworkId}, S3Key: ${s3Key}):`,
      error
    );
    throw error.response?.data?.message || error.message;
  }
};

const downloadHomeworkFile = async (homeworkId, s3Key) => {
  try {
    const { signedUrl, fileName, fileType } =
      await getSignedHomeworkDownloadUrl(homeworkId, s3Key);

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
    console.error(
      `Error downloading homework file (HomeworkID: ${homeworkId}, S3Key: ${s3Key}):`,
      error
    );
    throw new Error(
      error.message || error.response?.data?.message || "Failed to download"
    );
  }
};

const homeworkService = {
  createHomework,
  updateHomework,
  getHomeworkById,
  deleteHomework,
  getHomeworks,
  getSignedHomeworkDownloadUrl,
  downloadHomeworkFile,
};

export default homeworkService;
