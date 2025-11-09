import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getUsersForGroupCreation = async () => {
  const config = {
    withCredentials: true, // Ensures the auth cookie is sent
  };

  try {
    const response = await axios.get(`${API_BASE_URL}/api/group-creation/users`, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching users for group creation:', error.response?.data?.message || error.message);
    throw error;
  }
};

const chatUserService = {
  getUsersForGroupCreation,
};

export default chatUserService;