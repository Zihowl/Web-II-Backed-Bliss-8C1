// Bus de eventos SSE (Server-Sent Events) ligero para empujar cambios de estado de
// pedidos al cliente sin polling (RF-26, RNF-19). Se eligio SSE sobre WebSocket por
// ser unidireccional, sin dependencias extra y mas economico en recursos.

// Map<orderId, Set<res>>: respuestas HTTP suscritas a cada pedido.
const subscribers = new Map();

// Registra una conexion SSE para un pedido y configura las cabeceras.
const subscribe = (orderId, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(': conectado\n\n');

  if (!subscribers.has(orderId)) {
    subscribers.set(orderId, new Set());
  }
  subscribers.get(orderId).add(res);

  // Heartbeat para mantener viva la conexion a traves de proxies.
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);

  const cleanup = () => {
    clearInterval(ping);
    const set = subscribers.get(orderId);
    if (set) {
      set.delete(res);
      if (set.size === 0) subscribers.delete(orderId);
    }
  };
  res.on('close', cleanup);
};

// Emite un evento a todos los suscriptores de un pedido.
const publish = (orderId, payload) => {
  const set = subscribers.get(Number(orderId));
  if (!set) return;
  const data = `event: status\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    res.write(data);
  }
};

module.exports = { subscribe, publish };
