const InventoryModel = require('../models/inventory.model');
const emailService = require('../services/email.service');
const db = require('../config/db');

// Listado de inventario para el panel administrativo (IU-24).
const getInventory = async (req, res, next) => {
  try {
    const items = await InventoryModel.listInventory();
    res.json({ inventory: items });
  } catch (error) {
    next(error);
  }
};

// Productos en stock bajo (IU-25).
const getLowStock = async (req, res, next) => {
  try {
    const products = await InventoryModel.getLowStock();
    res.json({ products });
  } catch (error) {
    next(error);
  }
};

// Ajuste manual de inventario (RF-31, IU-26).
const adjustStock = async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const { newQty, reason } = req.body;

    if (!Number.isInteger(productId)) {
      return res.status(400).json({ mensaje: 'Producto invalido' });
    }
    if (!Number.isInteger(newQty) || newQty < 0) {
      return res.status(400).json({ mensaje: 'La cantidad nueva debe ser un entero >= 0' });
    }

    const product = await InventoryModel.adjustStock(productId, newQty, reason, req.user.id);

    // Si el ajuste deja el producto en stock bajo, avisamos al administrador (RNF-22).
    if (product.stock <= product.lowStockThreshold) {
      emailService.sendLowStockAlert([product]);
    }

    res.json({ mensaje: 'Inventario actualizado', product });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ mensaje: error.message });
    }
    next(error);
  }
};

// Validacion de disponibilidad al agregar al carrito / checkout (RNF-11, RNF-24).
// Recibe { items: [{ id, quantity }] } y devuelve disponibilidad por producto.
const checkAvailability = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ mensaje: 'No se enviaron productos' });
    }
    const ids = items.map((i) => Number(i.id));
    const { rows } = await db.query(
      'SELECT id, name, stock FROM products WHERE id = ANY($1::int[])',
      [ids]
    );
    const stockById = new Map(rows.map((r) => [r.id, r]));

    const results = items.map((i) => {
      const prod = stockById.get(Number(i.id));
      const available = prod ? prod.stock : 0;
      return {
        id: Number(i.id),
        requested: Number(i.quantity) || 0,
        available,
        ok: prod ? available >= (Number(i.quantity) || 0) : false,
        name: prod ? prod.name : null,
      };
    });

    res.json({ ok: results.every((r) => r.ok), results });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getLowStock,
  adjustStock,
  checkAvailability,
};
