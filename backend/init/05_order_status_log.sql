-- Log de auditoria por cada cambio de estado del pedido (RNF-17).

CREATE TABLE IF NOT EXISTS order_status_log (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders_history(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_status_log_order ON order_status_log(order_id);
