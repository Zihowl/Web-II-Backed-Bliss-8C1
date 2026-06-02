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
  // is_locked se calcula en la BD (NOW()) para evitar desfases de zona horaria entre
  // el TIMESTAMP de PostgreSQL y el reloj de Node (RNF-03).
  const result = await db.query(
    `SELECT *, (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked
     FROM users WHERE email = $1`,
    [email]
  );
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

const saveOrder = async (userId, orderXml) => {
  const result = await db.query(
    `INSERT INTO orders_history (user_id, order_data) VALUES ($1, $2) RETURNING *`,
    [userId, orderXml]
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

// --- Seguridad: bloqueo por intentos fallidos (RNF-03) ---

// Registra un intento fallido; al llegar a 5 bloquea la cuenta 1 minuto.
const registerFailedAttempt = async (id) => {
  const result = await db.query(
    `UPDATE users
       SET failed_attempts = failed_attempts + 1,
           locked_until = CASE WHEN failed_attempts + 1 >= 5
                               THEN CURRENT_TIMESTAMP + INTERVAL '1 minute'
                               ELSE locked_until END
     WHERE id = $1
     RETURNING failed_attempts, (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked`,
    [id]
  );
  return result.rows[0];
};

const resetFailedAttempts = async (id) => {
  await db.query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1', [id]);
};

// --- Administracion de usuarios (RF-05) ---

const listUsers = async () => {
  const result = await db.query(
    'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
};

const deleteUser = async (id) => {
  const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateProfile,
  saveOrder,
  getOrderHistory,
  registerFailedAttempt,
  resetFailedAttempts,
  listUsers,
  deleteUser
};
