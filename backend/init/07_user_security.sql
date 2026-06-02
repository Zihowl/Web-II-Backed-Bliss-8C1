-- Seguridad de usuarios (Modulo 1): bloqueo por intentos fallidos (RNF-03).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
