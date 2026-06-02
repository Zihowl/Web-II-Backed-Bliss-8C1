-- Reemplaza el estado logístico del pedido por el estado del pago (Modulo 5 - revisión).
-- El estado del pago se detecta automáticamente desde el resultado de PayPal y ya no se
-- cambia manualmente, por lo que se elimina la bitácora de cambios de estado.

-- Quitamos el CHECK anterior (Recibido/En preparación/En camino/Completado).
ALTER TABLE orders_history DROP CONSTRAINT IF EXISTS orders_history_status_check;

-- Los pedidos previos eran compras completadas: los marcamos como Pagado.
UPDATE orders_history
  SET status = 'Pagado'
  WHERE status NOT IN ('Pagado', 'Error de Pago', 'Cancelado');

-- Nuevo default y estados válidos de pago.
ALTER TABLE orders_history ALTER COLUMN status SET DEFAULT 'Pagado';
ALTER TABLE orders_history
  ADD CONSTRAINT orders_history_status_check
  CHECK (status IN ('Pagado', 'Error de Pago', 'Cancelado'));

-- Ya no hay cambios manuales de estado que auditar.
DROP TABLE IF EXISTS order_status_log CASCADE;
