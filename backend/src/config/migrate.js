const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

// Directorio donde viven los archivos .sql de migracion (backend/init).
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'init');

// Crea la tabla de control si no existe. Registra que migraciones ya se aplicaron
// para no volver a ejecutarlas en BDs existentes.
const ensureMigrationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getApplied = async (client) => {
  const { rows } = await client.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r) => r.filename));
};

const listMigrationFiles = () => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // orden lexicografico: 01_, 02_, 03_, ...
};

// Aplica, en orden, las migraciones aun no registradas. Cada archivo corre dentro de
// su propia transaccion; si falla, se revierte y se aborta el arranque.
const runMigrations = async () => {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);
    const files = listMigrationFiles();
    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('Migraciones: sin pendientes');
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`Migraciones: aplicando ${file}...`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Fallo al aplicar la migracion ${file}: ${error.message}`);
      }
    }

    console.log(`Migraciones: ${pending.length} aplicada(s)`);
  } finally {
    client.release();
  }
};

module.exports = { runMigrations };
