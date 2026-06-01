const db = require('../config/db');

const PRODUCTS_QUERY = `
  SELECT
    id,
    name,
    price,
    image_url AS "imageUrl",
    category,
    description,
    COALESCE(stock, 0) AS stock,
    COALESCE(in_stock, true) AS "inStock"
  FROM products
  ORDER BY id;
`;

const LEGACY_PRODUCTS_QUERY = `
  SELECT
    id,
    nombre AS name,
    precio AS price,
    imagen AS "imageUrl",
    categoria AS category,
    descripcion AS description,
    COALESCE(disponible, true) AS "inStock"
  FROM productos
  ORDER BY id;
`;

const findAllProducts = async () => {
  try {
    const result = await db.query(PRODUCTS_QUERY);
    return result.rows;
  } catch (error) {
    // Fallback para bases de datos con esquema legado en espanol.
    if (error.code !== '42P01') {
      throw error;
    }

    const legacyResult = await db.query(LEGACY_PRODUCTS_QUERY);
    return legacyResult.rows;
  }
};

// --- CRUD administrativo de productos (RF-07, RF-08) ---

const createProduct = async ({ name, price, imageUrl, category, description, stock }) => {
  const result = await db.query(
    `INSERT INTO products (name, price, image_url, category, description, stock, in_stock)
     VALUES ($1, $2, $3, $4, $5, $6, $6 > 0)
     RETURNING id, name, price, image_url AS "imageUrl", category, description, stock, in_stock AS "inStock"`,
    [name, price, imageUrl, category, description, stock ?? 0]
  );
  return result.rows[0];
};

const updateProduct = async (id, { name, price, imageUrl, category, description, stock }) => {
  const result = await db.query(
    `UPDATE products
       SET name = $1, price = $2, image_url = $3, category = $4, description = $5,
           stock = $6, in_stock = ($6 > 0)
     WHERE id = $7
     RETURNING id, name, price, image_url AS "imageUrl", category, description, stock, in_stock AS "inStock"`,
    [name, price, imageUrl, category, description, stock ?? 0, id]
  );
  return result.rows[0];
};

const deleteProduct = async (id) => {
  const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
};

module.exports = {
  findAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
