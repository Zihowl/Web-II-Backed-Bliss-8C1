const express = require('express');
const cors = require('cors');
const productsRoutes = require('./routes/products.routes');
const paypalRoutes = require('./routes/paypal.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Backend API en ejecucion',
    endpoints: ['/health', '/api/productos', '/api/products', '/api/paypal/create-order', '/api/paypal/capture-order/:orderId'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', productsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/paypal', paypalRoutes.paypalRouter);
app.use(errorHandler);

module.exports = app;
