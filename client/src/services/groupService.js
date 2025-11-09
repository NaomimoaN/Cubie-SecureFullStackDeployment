import axios from 'axios';

const API_URL = `${import.meta.env.VITE_CHAT_SERVER_URL}/api/groups`;

// Create a new group
// groupData should be an object like { name, description, members }
const createGroup = async (groupData) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Important to send the httpOnly cookie
  };

  const response = await axios.post(API_URL, groupData, config);
  return response.data;
};

// Fetch all groups for the logged-in user
const getGroups = async () => {
  const config = {
    withCredentials: true, // Important to send the httpOnly cookie
  };

  const response = await axios.get(API_URL, config);
  return response.data;
};

// Add members to an existing group
const addMembersToGroup = async (groupId, members) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  };

  const response = await axios.post(`${API_URL}/${groupId}/members`, { members }, config);
  return response.data;
};

// Remove a member from an existing group
const removeMemberFromGroup = async (groupId, memberId) => {
  const config = {
    withCredentials: true,
  };

  const response = await axios.delete(`${API_URL}/${groupId}/members/${memberId}`, config);
  return response.data;
};

const groupService = {
  createGroup,
  getGroups,
  addMembersToGroup,
  removeMemberFromGroup,
};

export default groupService; 