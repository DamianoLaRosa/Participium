import axiosInstance from "./axiosInstance.js";

// Get all notifications for logged citizen
export const getNotifications = async () => {
  return await axiosInstance.get("/api/notifications");
};

// Get unread notification count
export const getUnreadNotificationCount = async () => {
  return await axiosInstance.get("/api/notifications/unread-count");
};

// Mark a notification as seen
export const markNotificationAsSeen = async (id) => {
  return await axiosInstance.put(`/api/notifications/${id}/seen`);
};

// Mark all notifications as seen
export const markAllNotificationsAsSeen = async () => {
  return await axiosInstance.put("/api/notifications/mark-all-seen");
};

// Get messages for a report
export const getReportMessages = async (reportId) => {
  return await axiosInstance.get(`/api/reports/${reportId}/messages`);
};

// Send a message to a report
export const sendReportMessage = async (reportId, content) => {
  return await axiosInstance.post(`/api/reports/${reportId}/messages`, {
    content,
  });
};
