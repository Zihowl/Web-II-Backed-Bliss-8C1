const db = require('../config/db');

// Estados del pago, detectados automáticamente desde el resultado de PayPal.
const ESTADOS = ['Pagado', 'Error de Pago', 'Cancelado'];

// Crea el pedido de forma atomica. Solo cuando el pago fue exitoso ('Pagado') se valida
// y decrementa el stock (con FOR UPDATE para evitar sobreventa, RNF-21); los intentos con
// pago fallido o cancelado se registran sin tocar el inventario. Devuelve el pedido creado
// junto con los productos que quedaron en stock bajo (vacío si no se descontó stock).
const createOrderWithStock = async ({ userId, items, orderXml, total, customer, paypalTxnId, paymentStatus = 'Pagado' }) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const descuentaStock = paymentStatus === 'Pagado';

    if (descuentaStock) {
      for (const item of items) {
        const { rows, rowCount } = await client.query(
          'SELECT name, stock FROM products WHERE id = $1 FOR UPDATE',
          [item.id]
        );
        if (rowCount === 0) {
          throw Object.assign(new Error(`Producto ${item.id} no existe`), { status: 400 });
        }
        const disponible = rows[0].stock;
        if (disponible < item.quantity) {
          throw Object.assign(
            new Error(`Stock insuficiente para "${rows[0].name}" (disponible: ${disponible})`),
            { status: 409 }
          );
        }
      }

      // Decrementamos despues de validar todos los items.
      for (const item of items) {
        await client.query(
          'UPDATE products SET stock = stock - $1, in_stock = ((stock - $1) > 0) WHERE id = $2',
          [item.quantity, item.id]
        );
      }
    }

    const c = customer || {};
    const order = await client.query(
      `INSERT INTO orders_history
         (user_id, order_data, status, customer_name, phone, address, delivery_type, payment_type, note, total, paypal_txn_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, status, total, created_at`,
      [userId, orderXml, paymentStatus, c.name || null, c.phone || null, c.address || null,
       c.deliveryType || null, c.paymentType || null, c.note || null, total, paypalTxnId || null]
    );

    const lowStock = descuentaStock
      ? (await client.query(
          `SELECT id, name, stock, low_stock_threshold AS "lowStockThreshold"
           FROM products
           WHERE id = ANY($1::int[]) AND stock <= low_stock_threshold`,
          [items.map((i) => i.id)]
        )).rows
      : [];

    await client.query('COMMIT');
    return { order: order.rows[0], lowStock };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Listado administrativo con filtros opcionales por fecha, estado, cliente y monto
// (RF-25, RNF-18).
const listOrders = async (filters = {}) => {
  const conditions = [];
  const params = [];
  let i = 1;

  if (filters.status) { conditions.push(`o.status = $${i++}`); params.push(filters.status); }
  if (filters.from) { conditions.push(`o.created_at >= $${i++}`); params.push(filters.from); }
  if (filters.to) { conditions.push(`o.created_at <= $${i++}`); params.push(filters.to); }
  if (filters.customer) { conditions.push(`o.customer_name ILIKE $${i++}`); params.push(`%${filters.customer}%`); }
  if (filters.minTotal) { conditions.push(`o.total >= $${i++}`); params.push(filters.minTotal); }
  if (filters.maxTotal) { conditions.push(`o.total <= $${i++}`); params.push(filters.maxTotal); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT o.id, o.status, o.total, o.customer_name AS "customerName", o.created_at,
            u.email AS "userEmail"
     FROM orders_history o
     JOIN users u ON u.id = o.user_id
     ${where}
     ORDER BY o.created_at DESC`,
    params
  );
  return result.rows;
};

module.exports = {
  ESTADOS,
  createOrderWithStock,
  listOrders,
};
