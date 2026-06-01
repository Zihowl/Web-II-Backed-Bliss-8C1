-- Inventario por cantidad y umbral de alerta de stock bajo (Modulo 7).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 5;

-- Backfill: damos existencias iniciales a los productos marcados como disponibles
-- que aun no tienen stock asignado.
UPDATE products
  SET stock = 20
  WHERE stock = 0 AND COALESCE(in_stock, TRUE) = TRUE;

-- Mantenemos in_stock coherente con la cantidad disponible.
UPDATE products SET in_stock = (stock > 0);

-- Bitacora de ajustes manuales de inventario (IU-26).
CREATE TABLE IF NOT EXISTS inventory_adjustment (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_qty INT NOT NULL,
  new_qty INT NOT NULL,
  reason TEXT,
  adjusted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustment_product ON inventory_adjustment(product_id);
