import axiosInstance from "./axiosInstance.js";

// Add internal comment to a report
export const addInternalComment = async (reportId, content) => {
  return await axiosInstance.post(`/api/reports/${reportId}/internal-comments`, {
    content,
  });
};

// Get all internal comments for a report
export const getInternalComments = async (reportId) => {
  return await axiosInstance.get(`/api/reports/${reportId}/internal-comments`);
};

// Add message to a report
export const addMessage = async (reportId, content) => {
  return await axiosInstance.post(`/api/reports/${reportId}/messages`, {
    content,
  });
};

// Get all messages for a report
export const getMessages = async (reportId) => {
  return await axiosInstance.get(`/api/reports/${reportId}/messages`);
};