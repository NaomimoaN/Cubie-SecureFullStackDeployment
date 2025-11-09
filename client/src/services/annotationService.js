import { api } from "./api";

const ANNOTATION_API_URL = "/api/annotations";

// Creates a new annotation or updates an existing one for a given submission.
const createOrUpdateAnnotation = async (submissionId, annotationData) => {
  try {
    const response = await api.put(
      `${ANNOTATION_API_URL}/${submissionId}`,
      annotationData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetches a specific annotation by its unique ID.
const getAnnotationById = async (annotationId) => {
  try {
    const response = await api.get(`${ANNOTATION_API_URL}/${annotationId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Retrieves annotations for a specific submission, filtered by owner type (student/teacher) and optionally by owner ID.
const getAnnotationBySubmissionAndOwnerType = async (
  submissionId,
  ownerType,
  ownerId = null
) => {
  try {
    let url = `${ANNOTATION_API_URL}/${submissionId}?type=${ownerType}`;
    if (ownerId) {
      url += `&owner=${ownerId}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Deletes a specific annotation from the database.
const deleteAnnotation = async (annotationId) => {
  try {
    const response = await api.delete(`${ANNOTATION_API_URL}/${annotationId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const annotationService = {
  createOrUpdateAnnotation,
  getAnnotationById,
  getAnnotationBySubmissionAndOwnerType,
  deleteAnnotation,
};

export default annotationService;
