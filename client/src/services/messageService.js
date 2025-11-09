import axios from 'axios';

// Chat server API instance
const chatApi = axios.create({
  baseURL: 'http://localhost:5051',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const MESSAGE_API_BASE = '/api/messages';

export const messageService = {
  // Get messages for a specific group with pagination
  getGroupMessages: async (groupId, page = 1, limit = 50) => {
    try {
      const response = await chatApi.get(`${MESSAGE_API_BASE}/group/${groupId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching group messages:', error);
      throw error;
    }
  },

  // Get recent messages for a group (last 20 messages)
  getRecentMessages: async (groupId) => {
    try {
      const response = await chatApi.get(`${MESSAGE_API_BASE}/group/${groupId}/recent`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      throw error;
    }
  }
};

export default messageService; 