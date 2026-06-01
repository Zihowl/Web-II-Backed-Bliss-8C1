-- Seguridad de usuarios (Modulo 1): bloqueo por intentos fallidos (RNF-03) y
-- recuperacion de contrasenia por token con expiracion (RF-03, RNF-04).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

CREATE TABLE IF NOT EXISTS password_reset_token (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_user ON password_reset_token(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash ON password_reset_token(token_hash);
