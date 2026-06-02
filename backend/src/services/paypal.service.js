const { paypalConfig } = require('../config/paypal.config');

/**
 * Codifica las credenciales en formato Base64.
 * Combina el ID de cliente y la contraseña secreta.
 */
function getBasicAuth() {
  return Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString('base64');
}

/**
 * Obtiene el token de acceso temporal de PayPal.
 */
async function getAccessToken() {
  const response = await fetch(`${paypalConfig.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${getBasicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error obteniendo access token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

/**
 * Crea una orden de pago enviando los detalles del carrito.
 */
async function createPaypalOrder(orderData) {
  const accessToken = await getAccessToken();

  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'MXN',
          value: Number(orderData.total).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'MXN',
              value: Number(orderData.total).toFixed(2),
            },
          },
        },
        items: orderData.items.map((item) => ({
          name: item.nombre,
          quantity: String(item.cantidad),
          unit_amount: {
            currency_code: 'MXN',
            value: Number(item.precio).toFixed(2),
          },
        })),
      },
    ],
  };

  const response = await fetch(`${paypalConfig.baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error creando orden PayPal: ${JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Confirma y procesa el cobro final una vez que el usuario aprueba el pago.
 */
async function capturePaypalOrder(orderId) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${paypalConfig.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error capturando orden PayPal: ${JSON.stringify(data)}`);
  }

  return data;
}

module.exports = { getAccessToken, createPaypalOrder, capturePaypalOrder };
