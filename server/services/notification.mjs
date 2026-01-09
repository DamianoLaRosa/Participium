import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

/**
 * Create a notification and optionally send via WebSocket
 * @param {number} citizen_id - The citizen to notify
 * @param {number} report_id - The related report
 * @param {string} message - Notification message
 * @param {number} new_status_id - The new status ID (optional)
 * @param {object} io - Socket.IO instance (optional)
 * @returns {object} The created notification
 */
export const createNotification = async (citizen_id, report_id, message, new_status_id = null, io = null) => {
  // First get the report title for the notification
  const reportSql = `SELECT title FROM reports WHERE report_id = $1`;
  const reportResult = await pool.query(reportSql, [report_id]);
  const reportTitle = reportResult.rows[0]?.title || 'Unknown Report';

  // Get the status name if new_status_id is provided
  let statusName = null;
  if (new_status_id) {
    const statusSql = `SELECT name FROM statuses WHERE status_id = $1`;
    const statusResult = await pool.query(statusSql, [new_status_id]);
    statusName = statusResult.rows[0]?.name || null;
  }

  const sql = `
    INSERT INTO notifications (citizen_id, report_id, message, new_status_id, sent_at, seen)
    VALUES ($1, $2, $3, $4, NOW(), FALSE)
    RETURNING notification_id, citizen_id, report_id, message, new_status_id, sent_at, seen
  `;

  const result = await pool.query(sql, [citizen_id, report_id, message, new_status_id]);
  const notification = result.rows[0];

  // Send via WebSocket if io instance is available
  if (io) {
    io.to(`citizen:${citizen_id}`).emit("new_notification", {
      id: notification.notification_id,
      report_id: notification.report_id,
      report_title: reportTitle,
      message: notification.message,
      new_status_id: notification.new_status_id,
      status_name: statusName,
      sent_at: notification.sent_at,
      seen: notification.seen,
    });
  }

  return notification;
};

/**
 * Get all notifications for a citizen
 * @param {number} citizen_id - The citizen ID
 * @param {number} limit - Maximum number of notifications to return (optional)
 * @returns {array} List of notifications
 */
export const getNotificationsByCitizen = async (citizen_id, limit = null) => {
  let sql = `
    SELECT 
      n.notification_id as id,
      n.report_id,
      n.message,
      n.new_status_id,
      n.sent_at,
      n.seen,
      r.title as report_title,
      r.latitude,
      r.longitude,
      s.name as status_name
    FROM notifications n
    LEFT JOIN reports r ON n.report_id = r.report_id
    LEFT JOIN statuses s ON n.new_status_id = s.status_id
    WHERE n.citizen_id = $1
    ORDER BY n.sent_at DESC
  `;
  
  if (limit) {
    sql += ` LIMIT ${parseInt(limit)}`;
  }

  const result = await pool.query(sql, [citizen_id]);
  return result.rows;
};

/**
 * Get count of unread notifications
 * @param {number} citizen_id - The citizen ID
 * @returns {number} Count of unread notifications
 */
export const getUnreadCount = async (citizen_id) => {
  const sql = `
    SELECT COUNT(*) as count
    FROM notifications
    WHERE citizen_id = $1 AND seen = FALSE
  `;

  const result = await pool.query(sql, [citizen_id]);
  return parseInt(result.rows[0].count);
};

/**
 * Mark a notification as seen
 * @param {number} notification_id - The notification ID
 * @param {number} citizen_id - The citizen ID (for security)
 * @returns {object} The updated notification
 */
export const markNotificationAsSeen = async (notification_id, citizen_id) => {
  const sql = `
    UPDATE notifications
    SET seen = TRUE
    WHERE notification_id = $1 AND citizen_id = $2
    RETURNING *
  `;

  const result = await pool.query(sql, [notification_id, citizen_id]);
  return result.rows[0];
};

/**
 * Mark all notifications as seen for a citizen
 * @param {number} citizen_id - The citizen ID
 * @returns {object} Success status
 */
export const markAllAsSeen = async (citizen_id) => {
  const sql = `
    UPDATE notifications
    SET seen = TRUE
    WHERE citizen_id = $1 AND seen = FALSE
  `;

  await pool.query(sql, [citizen_id]);
  return { success: true };
};
