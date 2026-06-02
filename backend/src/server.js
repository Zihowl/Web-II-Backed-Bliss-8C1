require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { runMigrations } = require('./config/migrate');
const { validatePaypalConfig } = require('./config/paypal.config');

const PORT = Number(process.env.PORT || 3000);

const startServer = async () => {
  try {
    // Validar que las credenciales de PayPal estén definidas antes de iniciar
    validatePaypalConfig();
    await connectDB();
    await runMigrations();

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
