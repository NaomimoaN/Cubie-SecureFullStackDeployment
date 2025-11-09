import { api } from "./api";

const SUBMISSION_API_URL = "/api/submissions";

// Submits homework files for a student, including flattening annotations into PDFs if applicable.
const submitHomework = async (homeworkId, formData) => {
  try {
    const response = await api.post(
      `${SUBMISSION_API_URL}/${homeworkId}/submit`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Required for file uploads
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetches a specific submission by its ID.
const getSubmissionById = async (submissionId) => {
  try {
    const response = await api.get(`${SUBMISSION_API_URL}/${submissionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Updates a submission (for students). This includes updating files and re-submitting annotated PDFs.
const updateSubmission = async (submissionId, formData) => {
  try {
    const response = await api.put(
      `${SUBMISSION_API_URL}/${submissionId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Required for file updates
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Deletes a submission (for students).
const deleteSubmission = async (submissionId) => {
  try {
    const response = await api.delete(`${SUBMISSION_API_URL}/${submissionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Updates the grade for a submission (for teachers/admins).
const updateSubmissionGrade = async (submissionId, gradeData) => {
  try {
    const response = await api.put(
      `${SUBMISSION_API_URL}/${submissionId}/grade`,
      gradeData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Retrieves a signed URL for downloading a submitted file.
const getSignedSubmissionDisplayUrl = async (submissionId, s3Key) => {
  try {
    const encodedS3Key = encodeURIComponent(s3Key);
    const response = await api.get(
      `${SUBMISSION_API_URL}/${submissionId}/display-url/${encodedS3Key}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getSignedSubmissionDownloadUrl = async (submissionId, s3Key) => {
  try {
    const encodedS3Key = encodeURIComponent(s3Key);
    const response = await api.get(
      `${SUBMISSION_API_URL}/${submissionId}/download-url/${encodedS3Key}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetches all submissions for the logged-in student, filtered by a specific subject.
const getUserSubmissions = async (subjectId) => {
  try {
    const response = await api.get(
      `${SUBMISSION_API_URL}/subject/${subjectId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetches all submissions related to a specific homework assignment (for teachers/admins).
const getSubmissionsByHomeworkId = async (homeworkId) => {
  try {
    const response = await api.get(
      `${SUBMISSION_API_URL}/homework/${homeworkId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetches all submissions for the logged-in student across all subjects.
const getAllUserSubmissions = async () => {
  try {
    const response = await api.get(`${SUBMISSION_API_URL}/user/all`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const submissionService = {
  submitHomework,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  updateSubmissionGrade,
  getSignedSubmissionDisplayUrl,
  getSignedSubmissionDownloadUrl,
  getUserSubmissions,
  getSubmissionsByHomeworkId,
  getAllUserSubmissions,
};

export default submissionService;
