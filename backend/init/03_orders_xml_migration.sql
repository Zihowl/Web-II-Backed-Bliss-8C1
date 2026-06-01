-- Migracion para BDs existentes: order_data pasa a almacenar un CFDI 4.0 (XML)
-- y se elimina la columna total (el monto vive dentro del atributo Total del XML).
--
-- NOTA: las filas previas con JSON no se convierten a CFDI automaticamente. En un
-- proyecto academico se asume tabla vacia. Si hay datos previos incompatibles con
-- el tipo XML, vaciar la tabla antes de migrar:
--   TRUNCATE TABLE orders_history;

ALTER TABLE orders_history DROP COLUMN IF EXISTS total;

ALTER TABLE orders_history
  ALTER COLUMN order_data TYPE XML USING order_data::text::xml;
