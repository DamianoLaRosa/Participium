import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

//get all technical officers by relation officer's office_id
export const getTechnicalOfficersByOffice = async (officerId, officeId) => {
  let resultOfficers;
  try {
    if (officerId && !officeId) {
      const sqlGetOfficer = 'SELECT * FROM operators WHERE operator_id = $1';
      const result = await pool.query(sqlGetOfficer, [officerId]);
      if(result.rows.length === 0) {
        throw new Error('Either valid officer_id or office_id must be provided');
      }
      console.log(result.rows[0]);
      const operatorRoleSql = 'SELECT role_id FROM roles WHERE name = \'Municipal public relations officer\'  AND role_id = $1';
      const operatorRoleResult = await pool.query(operatorRoleSql, [result.rows[0].role_id]);
      if(operatorRoleResult.rows.length === 0) {
        throw new Error('Operatot not allowed, he is not a Municipal public relations officer');
      }
      const sqlGetTechnicalOfficers = 'SELECT * FROM operators WHERE office_id = $1 AND role_id = (SELECT role_id FROM roles WHERE name = \'Technical office staff member\')';
      resultOfficers = await pool.query(sqlGetTechnicalOfficers, [result.rows[0].office_id]);
    } else if ((!officerId && officeId) || (officerId && officeId)) {
      const sqlGetTechnicalOfficers = 'SELECT * FROM operators WHERE office_id = $1 AND role_id = (SELECT role_id FROM roles WHERE name = \'Technical office staff member\')';
      resultOfficers = await pool.query(sqlGetTechnicalOfficers, [officeId]);
    } else {
      throw new Error('officer_id or office_id must be provided');
    }
  } catch (err) {
    console.error('Error fetching technical officers:', err);
    throw err;
  }
  return resultOfficers.rows
    .map((e) => ({
      id: e.operator_id,
      email: e.email,
      username: e.username,
      office_id: e.office_id
      }));
}

