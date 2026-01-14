import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import API from "../../../API/API.js";
import { STATUS_MAP } from "../../../constants/statusMap";
import styles from "./notificationsPage.module.css";

function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await API.getNotifications();
      setNotifications(data);
    } catch (err) {
      setError("Failed to load notifications");
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRowClick = async (notification) => {
    // Mark as seen if not already
    if (!notification.seen) {
      try {
        await API.markNotificationAsSeen(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, seen: true } : n))
        );
        // Dispatch event to sync header notification counter
        window.dispatchEvent(new CustomEvent('notification-read', { detail: { count: 1 } }));
      } catch (err) {
        console.error("Failed to mark notification as seen:", err);
      }
    }
    // Navigate to report on map
    navigate(`/map?reportId=${notification.report_id}`);
  };

  const handleMarkAllAsSeen = async () => {
    try {
      const unreadCount = notifications.filter((n) => !n.seen).length;
      await API.markAllNotificationsAsSeen();
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
      // Dispatch event to sync header notification counter
      if (unreadCount > 0) {
        window.dispatchEvent(new CustomEvent('notification-read', { detail: { count: unreadCount } }));
      }
    } catch (err) {
      console.error("Failed to mark all as seen:", err);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {error && (
          <div className={styles.alert}>
            {error}
            <button className={styles.alertClose} onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        <div className={styles.contentHeader}>
          <h1 className={styles.pageTitle}>Notifications</h1>
          <div className={styles.headerButtons}>
            <button className={styles.backButton} onClick={() => navigate(-1)}>
              Back
            </button>
            {notifications.some((n) => !n.seen) && (
              <button className={styles.markAllButton} onClick={handleMarkAllAsSeen}>
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Report</th>
                <th>Status</th>
                <th>Message</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.emptyRow}>
                    No notifications yet
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <tr
                    key={notification.id}
                    className={`${styles.row} ${!notification.seen ? styles.unreadRow : ""}`}
                    onClick={() => handleRowClick(notification)}
                  >
                    <td className={styles.reportTitle}>
                      {notification.report_title || "Unknown Report"}
                    </td>
                    <td>
                      {notification.new_status_id && (
                        <span
                          className={styles.statusPill}
                          style={{
                            backgroundColor:
                              STATUS_MAP[notification.new_status_id]?.color || "#667eea",
                          }}
                        >
                          {notification.status_name || 
                           STATUS_MAP[notification.new_status_id]?.label || 
                           "Updated"}
                        </span>
                      )}
                    </td>
                    <td className={styles.message}>{notification.message}</td>
                    <td className={styles.date}>{formatDate(notification.sent_at)}</td>
                    <td>
                      {(notification.new_status_id !== 1 && notification.new_status_id !== 5) && (
                        <button
                          className={styles.viewButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(notification);
                          }}
                        >
                          View on Map
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
