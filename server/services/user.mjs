import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

//given username (email) and password does the login -> searches in citizen and then operators tables
export const getUser = async (username, password) => {
  try {
    // First try to find in operators table
    const operatorSql = 'SELECT o.*, r.name as role_name FROM operators o JOIN roles r ON o.role_id = r.role_id WHERE o.email = $1';
    const operatorResult = await pool.query(operatorSql, [username]);

    if (operatorResult.rows.length > 0) {
      const row = operatorResult.rows[0];
      const user = {
        id: row.operator_id,
        username: row.username,
        role: row.role_name
      };

      return new Promise((resolve, reject) => {
        crypto.scrypt(password, row.salt, 32, (err, hashedPassword) => {
          if (err) return reject(err);

          const match = crypto.timingSafeEqual(
            Buffer.from(row.password_hash, 'hex'),
            hashedPassword
          );

          resolve(match ? user : false);
        });
      });
    }

    // If not found in operators, try citizens
    const citizenSql = 'SELECT * FROM citizens WHERE email = $1';
    const citizenResult = await pool.query(citizenSql, [username]);

    const row = citizenResult.rows[0];
    if (!row) return false;

    const user = { id: row.citizen_id, username: row.username, role: "user" };

    return new Promise((resolve, reject) => {
      crypto.scrypt(password, row.salt, 32, (err, hashedPassword) => {
        if (err) return reject(err);

        const match = crypto.timingSafeEqual(
          Buffer.from(row.password_hash, 'hex'),
          hashedPassword
        );

        resolve(match ? user : false);
      });
    });
  } catch (err) {
    throw err;
  }
};

//ginen user data creates a citizen
export const createUser = async (username, email, first_name, last_name, email_notifications, password) => {
  const salt = crypto.randomBytes(16).toString('hex');

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, async (err, hashedPassword) => {
      if (err) return reject(err);

      const sql = 'INSERT INTO citizens (username, email,first_name,last_name, password_hash,email_notifications, salt) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING citizen_id';
      const values = [username, email, first_name, last_name, hashedPassword.toString('hex'), email_notifications, salt];

      try {
        const result = await pool.query(sql, values);
        resolve({ id: result.rows[0].citizen_id, username: username, first_name: first_name });
      } catch (err) {
        reject(err);
      }
    });
  });
};

export const getUserInfoById = async (userId) => {
  try {
    const sql = 'SELECT email, username, first_name, last_name, profile_photo_url, telegram_username, email_notifications from citizens WHERE citizen_id = $1';
    const result = await pool.query(sql, [userId]);
    if (result.rows.length === 0) {
      return null;
    } 
    return result.rows[0];
  } catch (err) {
    throw err;
  } 
};

export const updateUserById = async (userId, updates) => {
  try {
    const keys = Object.keys(updates);
    if (keys.length === 0) return null;

    const setClause = keys
      .map((key, i) => `${key} = $${i + 1}`)
      .join(", ");

    const values = keys.map(key => updates[key]);

    const sql = `
      UPDATE citizens
      SET ${setClause}
      WHERE citizen_id = $${keys.length + 1}
      RETURNING *;
    `;

    values.push(userId);

    const result = await pool.query(sql, values);
    return result.rows[0];
  } catch (err) {
    throw err;
  }
};
