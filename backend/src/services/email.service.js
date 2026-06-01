const nodemailer = require('nodemailer');

// Proveedor SMTP recomendado: Brevo (300 correos/dia gratis, buena entregabilidad).
// nodemailer es la libreria de envio; Brevo es el servidor SMTP. Variables en .env:
//   BREVO_SMTP_HOST (default smtp-relay.brevo.com)
//   BREVO_SMTP_PORT (default 587)
//   BREVO_SMTP_USER, BREVO_SMTP_KEY
//   MAIL_FROM (remitente, ej. "Backed Bliss <no-reply@backedbliss.com>")
//   ADMIN_EMAIL (destinatario de alertas de stock bajo)
//   APP_URL (base del frontend para enlaces, ej. http://localhost:4200)
//
// Si faltan credenciales, el servicio queda deshabilitado: registra el correo en
// consola en vez de fallar (modo desarrollo/academico).

let transporter = null;
const isEnabled = Boolean(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_KEY);

if (isEnabled) {
  transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.BREVO_SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });
}

const FROM = process.env.MAIL_FROM || 'Backed Bliss <no-reply@backedbliss.com>';

const send = async ({ to, subject, html }) => {
  if (!isEnabled) {
    console.log(`[email:simulado] Para: ${to} | Asunto: ${subject}`);
    return { simulated: true };
  }
  try {
    return await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (error) {
    // No interrumpimos el flujo de negocio si el correo falla.
    console.error('[email] Error al enviar:', error.message);
    return { error: error.message };
  }
};

const layout = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333">
    <h2 style="color:#b5651d">Backed Bliss</h2>
    <h3>${title}</h3>
    ${body}
    <hr/>
    <p style="font-size:12px;color:#888">Este es un correo automatico, por favor no responda.</p>
  </div>`;

// IU-23: plantilla de recibo de compra (RF-27).
const sendReceipt = (to, { orderId, items, total }) => {
  const rows = items
    .map(
      (i) =>
        `<tr><td>${i.name}</td><td align="center">${i.quantity}</td><td align="right">$${Number(i.price).toFixed(2)}</td></tr>`
    )
    .join('');
  return send({
    to,
    subject: `Recibo de tu pedido #${orderId} - Backed Bliss`,
    html: layout(
      `Gracias por tu compra (Pedido #${orderId})`,
      `<table width="100%" cellpadding="6" style="border-collapse:collapse">
         <tr style="border-bottom:1px solid #ddd"><th align="left">Producto</th><th>Cant.</th><th align="right">Precio</th></tr>
         ${rows}
       </table>
       <p style="text-align:right"><strong>Total: $${Number(total).toFixed(2)} MXN</strong> (IVA incluido)</p>`
    ),
  });
};

// RF-28: notificacion por cada cambio de estado del pedido.
const sendStatusUpdate = (to, { orderId, status, userName }) =>
  send({
    to,
    subject: `Tu pedido #${orderId} ahora esta: ${status}`,
    html: layout(
      `Actualizacion de tu pedido #${orderId}`,
      `<p>Hola ${userName || ''},</p>
       <p>El estado de tu pedido cambio a: <strong>${status}</strong>.</p>`
    ),
  });

// RNF-04: correo de recuperacion de contrasenia con enlace.
const sendPasswordReset = (to, { token }) => {
  const url = `${process.env.APP_URL || 'http://localhost:4200'}/reset-password?token=${token}`;
  return send({
    to,
    subject: 'Recuperacion de contrasenia - Backed Bliss',
    html: layout(
      'Restablece tu contrasenia',
      `<p>Recibimos una solicitud para restablecer tu contrasenia.</p>
       <p><a href="${url}" style="background:#b5651d;color:#fff;padding:10px 16px;text-decoration:none;border-radius:4px">Cambiar contrasenia</a></p>
       <p>El enlace expira en 30 minutos. Si no lo solicitaste, ignora este correo.</p>`
    ),
  });
};

// RNF-22: alerta de stock bajo al administrador.
const sendLowStockAlert = (products) => {
  const to = process.env.ADMIN_EMAIL;
  if (!to || !products || products.length === 0) {
    return Promise.resolve({ skipped: true });
  }
  const rows = products
    .map((p) => `<tr><td>${p.name}</td><td align="center">${p.stock}</td></tr>`)
    .join('');
  return send({
    to,
    subject: 'Alerta de stock bajo - Backed Bliss',
    html: layout(
      'Productos con stock bajo',
      `<table width="100%" cellpadding="6" style="border-collapse:collapse">
         <tr style="border-bottom:1px solid #ddd"><th align="left">Producto</th><th>Stock</th></tr>
         ${rows}
       </table>`
    ),
  });
};

module.exports = {
  isEnabled,
  send,
  sendReceipt,
  sendStatusUpdate,
  sendPasswordReset,
  sendLowStockAlert,
};
