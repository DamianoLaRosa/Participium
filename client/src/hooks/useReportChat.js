import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import API from "../API/API.js";

export const useReportChat = (reportId) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load messages on mount
  useEffect(() => {
    if (!reportId) return;

    const loadMessages = async () => {
      try {
        const msgs = await API.getReportMessages(reportId);
        setMessages(msgs);
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [reportId]);

  // Join report room and listen for new messages
  useEffect(() => {
    if (!socket || !reportId) return;

    socket.emit("join_report", reportId);

    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.emit("leave_report", reportId);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, reportId]);

  // Send a message
  const sendMessage = useCallback(
    async (content) => {
      try {
        await API.sendReportMessage(reportId, content);
        // Message will arrive via WebSocket, no need to add manually
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      }
    },
    [reportId]
  );

  // Refresh messages
  const refresh = useCallback(async () => {
    if (!reportId) return;
    try {
      const msgs = await API.getReportMessages(reportId);
      setMessages(msgs);
    } catch (error) {
      console.error("Failed to refresh messages:", error);
    }
  }, [reportId]);

  return {
    messages,
    isLoading,
    sendMessage,
    refresh,
  };
};
