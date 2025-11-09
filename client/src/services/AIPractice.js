// client/src/services/AIPractice.js

import { api } from "./api";

export const sendDataToAI = async (subjectName, grade) => {
  try {
    const response = await api.post("/api/ai-practice/send-data", { subjectName, grade });
    return response.data;
  } catch (error) {
    console.error("Error sending data to AI:", error);
    throw error.response?.data?.message || error.message;
  }
}

export const getAIQuestions = async (subjectName, grade, weekContentDescription) => {
  try {
    // axios has done everything for you, so you don't need to use the fetch API directly.
    // console.log("AIPractice Line18", weekContentDescription);
    const response = await api.post(`/api/ai-practice/questions`, {
      subjectName: subjectName,
      grade: grade,
      weekContentDescription: weekContentDescription
    });
    // console.log('AI practice questions response:', response);
    const data = response.data; // Backend sends the AI response in its body
    // console.log('AI practice questions data:', data);
    // The data is a string like this:
    //     ```json
    // {
    //   "question": "Which sentence uses correct punctuation?",
    //   "option1": "My dog loves to play fetch, he's so energetic.",
    //   "option2": "My dog loves to play fetch he's so energetic.",
    //   "option3": "My dog loves to play fetch. He's so energetic.",
    //   "option4": "My dog loves to play fetch; he's so energetic.",
    //   "correctAnswer": "option3",
    //   "explanation": "Sentences need to start with a capital letter and end with a period.  Option 3 correctly uses a period to separate the two independent clauses."
    // }
    // ```
    return data;

  } catch (error) {
    console.error("Error fetching AI practice questions:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const getWeekContent = async (week, subjectId) => {
  try {
    // the /api/ prefix is a common prefix for all API endpoints
    const response = await api.get(`/api/ai-practice/weekContent?week=${week}&subjectId=${subjectId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching AI practice week content:", error);
    throw error.response?.data?.message || error.message;
  }
};

export const getAICorrectAnswer = async () => {
  try {
    // the /api/ prefix is a common prefix for all API endpoints
    const response = await api.get("/api/ai-practice/rightAnswer");
    return response.data;
  } catch (error) {
    console.error("Error fetching AI practice right answer:", error);
    throw error.response?.data?.message || error.message;
  }
};

// Just backup; Dont use this function
export const getAIQuestionsVersion1 = async (subjectName, grade) => {
  try {
    // the /api/ prefix is a common prefix for all API endpoints
    // When you use get and try to pass data to backend, Use query parameters like this:
    // At the backend, you can access the query parameters using req.query.subjectName and req.query.grade
    const response = await api.get(`/api/ai-practice/questions?subjectName=${subjectName}&grade=${grade}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching AI practice questions:", error);
    throw error.response?.data?.message || error.message;
  }
};