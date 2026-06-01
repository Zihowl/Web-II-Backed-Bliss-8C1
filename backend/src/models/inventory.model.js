const db = require('../config/db');

// Lista el inventario con su estado de stock para el panel administrativo.
const listInventory = async () => {
  const result = await db.query(
    `SELECT id, name, category, price, stock, low_stock_threshold AS "lowStockThreshold",
            in_stock AS "inStock", (stock <= low_stock_threshold) AS "isLow"
     FROM products
     ORDER BY id`
  );
  return result.rows;
};

// Productos cuyo stock cayo en o por debajo del umbral configurado (RNF-22).
const getLowStock = async () => {
  const result = await db.query(
    `SELECT id, name, stock, low_stock_threshold AS "lowStockThreshold"
     FROM products
     WHERE stock <= low_stock_threshold
     ORDER BY stock ASC`
  );
  return result.rows;
};

// Ajuste manual de inventario (RF-31, IU-26). Registra el cambio en la bitacora y
// mantiene in_stock coherente con la nueva cantidad. Transaccional.
const adjustStock = async (productId, newQty, reason, adjustedBy) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      'SELECT stock FROM products WHERE id = $1 FOR UPDATE',
      [productId]
    );
    if (current.rowCount === 0) {
      throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
    }
    const oldQty = current.rows[0].stock;

    const updated = await client.query(
      `UPDATE products SET stock = $1, in_stock = ($1 > 0) WHERE id = $2
       RETURNING id, name, stock, low_stock_threshold AS "lowStockThreshold", in_stock AS "inStock"`,
      [newQty, productId]
    );

    await client.query(
      `INSERT INTO inventory_adjustment (product_id, old_qty, new_qty, reason, adjusted_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [productId, oldQty, newQty, reason || null, adjustedBy || null]
    );

    await client.query('COMMIT');
    return updated.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  listInventory,
  getLowStock,
  adjustStock,
};
