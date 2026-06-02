const UserModel = require('../models/user.model');
const OrderModel = require('../models/order.model');
const { buildCfdiXml, parseCfdiXml } = require('../services/cfdi.service');

const getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json({ profile: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const updatedUser = await UserModel.updateProfile(req.user.id, name, phone, address);
    
    if (!updatedUser) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    
    res.json({ mensaje: 'Perfil actualizado exitosamente', profile: updatedUser });
  } catch (error) {
    next(error);
  }
};

const getOrderHistory = async (req, res, next) => {
  try {
    const rows = await UserModel.getOrderHistory(req.user.id);
    // order_data es un CFDI (XML). Parseamos el total y los conceptos para que el
    // frontend pueda mostrarlos sin volver a parsear el XML.
    const orders = rows.map((row) => {
      const xml = row.order_data;
      const { total, items } = parseCfdiXml(xml);
      return {
        id: row.id,
        created_at: row.created_at,
        status: row.status,
        order_xml: xml,
        total,
        items,
      };
    });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

const saveOrder = async (req, res, next) => {
  try {
    const { order_data, customer, paypal_txn_id, payment_status } = req.body;

    if (!order_data || !Array.isArray(order_data) || order_data.length === 0) {
      return res.status(400).json({ mensaje: 'El pedido no contiene productos' });
    }

    // Estado del pago detectado por el cliente desde PayPal; default 'Pagado'.
    const paymentStatus = OrderModel.ESTADOS.includes(payment_status) ? payment_status : 'Pagado';

    // Normalizamos cantidades y calculamos el total (subtotal ya incluye IVA).
    const items = order_data.map((it) => ({
      id: it.id,
      name: it.name,
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
    }));
    const total = order_data.reduce(
      (acc, it) => acc + (Number(it.subtotal) || Number(it.price) * (Number(it.quantity) || 1)),
      0
    );

    // Generamos el CFDI 4.0 simulado (XML) a partir de los productos del pedido.
    const orderXml = buildCfdiXml(order_data);

    // Creacion atomica: valida y decrementa stock para evitar sobreventa (RNF-21).
    const { order } = await OrderModel.createOrderWithStock({
      userId: req.user.id,
      items,
      orderXml,
      total,
      customer,
      paypalTxnId: paypal_txn_id,
      paymentStatus,
    });

    res.status(201).json({ mensaje: 'Pedido guardado exitosamente', order });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ mensaje: error.message });
    }
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getOrderHistory,
  saveOrder
};