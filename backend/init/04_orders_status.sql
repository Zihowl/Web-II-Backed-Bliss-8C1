-- Agrega informacion logistica y de estado a los pedidos (Modulo 5).
-- order_data sigue almacenando el CFDI 4.0 (XML); estas columnas estructuran los
-- datos de entrega y permiten filtrar/seguir el pedido sin parsear el XML.

ALTER TABLE orders_history
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Recibido',
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS paypal_txn_id VARCHAR(100);

-- Estados validos: Recibido, En preparacion, En camino, Completado (RNF-16).
ALTER TABLE orders_history DROP CONSTRAINT IF EXISTS orders_history_status_check;
ALTER TABLE orders_history
  ADD CONSTRAINT orders_history_status_check
  CHECK (status IN ('Recibido', 'En preparación', 'En camino', 'Completado'));
