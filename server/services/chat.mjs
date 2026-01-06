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
 * Get all chats for a citizen (reports they created with message history)
 * @param {number} citizen_id - The citizen ID
 * @returns {array} List of chats with last message and unread count
 */
export const getChatsByCitizen = async (citizen_id) => {
  const sql = `
    SELECT 
      r.report_id,
      r.title,
      r.status_id,
      s.name as status_name,
      r.created_at as report_created_at,
      (
        SELECT json_build_object(
          'content', m.content,
          'sender_type', m.sender_type,
          'sent_at', m.sent_at
        )
        FROM messages m
        WHERE m.report_id = r.report_id
        ORDER BY m.sent_at DESC
        LIMIT 1
      ) as last_message,
      (
        SELECT COUNT(*)::int
        FROM messages m
        WHERE m.report_id = r.report_id
      ) as message_count,
      (
        SELECT MAX(m.sent_at)
        FROM messages m
        WHERE m.report_id = r.report_id
      ) as last_activity
    FROM reports r
    JOIN statuses s ON r.status_id = s.status_id
    WHERE r.citizen_id = $1
    AND r.status_id NOT IN (1, 5)
    ORDER BY 
      COALESCE(
        (SELECT MAX(m.sent_at) FROM messages m WHERE m.report_id = r.report_id),
        r.created_at
      ) DESC
  `;

  const result = await pool.query(sql, [citizen_id]);
  return result.rows.map((row) => ({
    report_id: row.report_id,
    title: row.title,
    status_id: row.status_id,
    status_name: row.status_name,
    report_created_at: row.report_created_at,
    last_message: row.last_message,
    message_count: row.message_count,
    last_activity: row.last_activity || row.report_created_at,
  }));
};

/**
 * Get all chats for an operator (reports assigned to them)
 * @param {number} operator_id - The operator ID
 * @param {string} role - The operator role
 * @returns {array} List of chats with last message
 */
export const getChatsByOperator = async (operator_id, role) => {
  let whereClause;
  
  if (role === "External maintainer") {
    whereClause = "r.assigned_to_external_id = $1";
  } else {
    whereClause = "r.assigned_to_operator_id = $1";
  }

  const sql = `
    SELECT 
      r.report_id,
      r.title,
      r.status_id,
      s.name as status_name,
      r.created_at as report_created_at,
      c.citizen_id,
      c.username as citizen_username,
      (
        SELECT json_build_object(
          'content', m.content,
          'sender_type', m.sender_type,
          'sent_at', m.sent_at
        )
        FROM messages m
        WHERE m.report_id = r.report_id
        ORDER BY m.sent_at DESC
        LIMIT 1
      ) as last_message,
      (
        SELECT COUNT(*)::int
        FROM messages m
        WHERE m.report_id = r.report_id
      ) as message_count,
      (
        SELECT MAX(m.sent_at)
        FROM messages m
        WHERE m.report_id = r.report_id
      ) as last_activity
    FROM reports r
    JOIN statuses s ON r.status_id = s.status_id
    LEFT JOIN citizens c ON r.citizen_id = c.citizen_id
    WHERE ${whereClause}
    AND r.status_id NOT IN (1, 5)
    ORDER BY 
      COALESCE(
        (SELECT MAX(m.sent_at) FROM messages m WHERE m.report_id = r.report_id),
        r.created_at
      ) DESC
  `;

  const result = await pool.query(sql, [operator_id]);
  return result.rows.map((row) => ({
    report_id: row.report_id,
    title: row.title,
    status_id: row.status_id,
    status_name: row.status_name,
    report_created_at: row.report_created_at,
    citizen: row.citizen_id ? {
      id: row.citizen_id,
      username: row.citizen_username,
    } : null,
    last_message: row.last_message,
    message_count: row.message_count,
    last_activity: row.last_activity || row.report_created_at,
  }));
};

/**
 * Get chat details by report ID
 * @param {number} report_id - The report ID
 * @returns {object} Chat details
 */
export const getChatDetails = async (report_id) => {
  const sql = `
    SELECT 
      r.report_id,
      r.title,
      r.description,
      r.status_id,
      s.name as status_name,
      r.created_at,
      r.citizen_id,
      c.username as citizen_username,
      r.assigned_to_operator_id,
      op.username as operator_username,
      r.assigned_to_external_id,
      ext.username as external_username
    FROM reports r
    JOIN statuses s ON r.status_id = s.status_id
    LEFT JOIN citizens c ON r.citizen_id = c.citizen_id
    LEFT JOIN operators op ON r.assigned_to_operator_id = op.operator_id
    LEFT JOIN operators ext ON r.assigned_to_external_id = ext.operator_id
    WHERE r.report_id = $1
  `;

  const result = await pool.query(sql, [report_id]);
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    report_id: row.report_id,
    title: row.title,
    description: row.description,
    status_id: row.status_id,
    status_name: row.status_name,
    created_at: row.created_at,
    citizen: row.citizen_id ? {
      id: row.citizen_id,
      username: row.citizen_username,
    } : null,
    operator: row.assigned_to_operator_id ? {
      id: row.assigned_to_operator_id,
      username: row.operator_username,
    } : null,
    external: row.assigned_to_external_id ? {
      id: row.assigned_to_external_id,
      username: row.external_username,
    } : null,
  };
};

