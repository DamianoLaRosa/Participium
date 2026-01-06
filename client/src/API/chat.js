import axiosInstance from "./axiosInstance.js";

// Get all chats for logged user
export const getChats = async () => {
  return await axiosInstance.get("/api/chats");
};

// Get chat details by report ID
export const getChatDetails = async (reportId) => {
  return await axiosInstance.get(`/api/chats/${reportId}`);
};

