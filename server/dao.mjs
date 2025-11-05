import sqlite3 from 'sqlite3';
import {  } from './models.mjs';   
import crypto from 'crypto';

// Open the database -> temporary -> to be deleted
const db = new sqlite3.Database('db.sqlite', (err) => {
  if (err) throw err;
});

export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user WHERE mail = ?';
    db.get(sql, [username], (err, row) => {
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve(false); //gestito nella local strategy 
      }
      else {
        const user = {id: row.id, name: row.name};
        
        crypto.scrypt(password, row.salt, 32, function(err, hashedPassword) {
          if (err) reject(err);
          if(!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword)) 
            resolve(false); //non è lui
          else
            resolve(user); //restituisco oggetto user
        });
      }
    });
  });
};

//to be changed when db addedddddddddddddddddddddddddddddddddddddddddd
export const createUser = (name, email, password) => {
  return new Promise((resolve, reject) => {
    // salt generator
    const salt = crypto.randomBytes(16).toString('hex');
    
    // cryptography the password
    crypto.scrypt(password, salt, 32, function(err, hashedPassword) {
      if (err) reject(err);
      
      const sql = 'INSERT INTO user(name, mail, password, salt) VALUES(?, ?, ?, ?)';
      db.run(sql, [name, email, hashedPassword.toString('hex'), salt], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({id: this.lastID , name: name});
        }
      });
    });
  });
};

