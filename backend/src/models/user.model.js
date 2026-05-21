const db = require('../config/db');

const createUser = async (name, phone, address, email, hashedPassword) => {
  const result = await db.query(
    `INSERT INTO users (name, phone, address, email, password) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
    [name, phone, address, email, hashedPassword]
  );
  return result.rows[0];
};

const findByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const findById = async (id) => {
  const result = await db.query('SELECT id, name, phone, address, email, role, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

const updateProfile = async (id, name, phone, address) => {
  const result = await db.query(
    `UPDATE users SET name = $1, phone = $2, address = $3 WHERE id = $4 RETURNING id, name, phone, address, email, role`,
    [name, phone, address, id]
  );
  return result.rows[0];
};

const saveOrder = async (userId, orderData, total) => {
  const result = await db.query(
    `INSERT INTO orders_history (user_id, order_data, total) VALUES ($1, $2, $3) RETURNING *`,
    [userId, orderData, total]
  );
  return result.rows[0];
};

const getOrderHistory = async (userId) => {
  const result = await db.query(
    'SELECT * FROM orders_history WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateProfile,
  saveOrder,
  getOrderHistory
};
