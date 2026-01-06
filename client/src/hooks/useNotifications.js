import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import API from "../API/API.js";

export const useNotifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [notifs, countData] = await Promise.all([
          API.getNotifications(),
          API.getUnreadNotificationCount(),
        ]);
        setNotifications(notifs);
        setUnreadCount(countData.count);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Listen for new notifications via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket]);

  // Mark single notification as seen
  const markAsSeen = useCallback(async (notificationId) => {
    try {
      await API.markNotificationAsSeen(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, seen: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as seen:", error);
    }
  }, []);

  // Mark all notifications as seen
  const markAllAsSeen = useCallback(async () => {
    try {
      await API.markAllNotificationsAsSeen();
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as seen:", error);
    }
  }, []);

  // Refresh notifications
  const refresh = useCallback(async () => {
    try {
      const [notifs, countData] = await Promise.all([
        API.getNotifications(),
        API.getUnreadNotificationCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(countData.count);
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsSeen,
    markAllAsSeen,
    refresh,
  };
};
