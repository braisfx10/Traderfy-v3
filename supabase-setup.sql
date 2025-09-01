-- Script de configuración para Supabase - Traderfy
-- Ejecutar este script en el SQL Editor de Supabase

-- Eliminar tablas existentes si es necesario (comentar si no quieres perder datos)
-- DROP TABLE IF EXISTS rules CASCADE;
-- DROP TABLE IF EXISTS trades CASCADE;  
-- DROP TABLE IF EXISTS accounts CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Trader' CHECK (role IN ('Admin', 'Mentor', 'Trader', 'Alumno')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de cuentas de trading
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Broker',
  tag TEXT DEFAULT 'Demo' CHECK (tag IN ('Live', 'Demo', 'Funded')),
  initial_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de operaciones
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('Buy', 'Sell')),
  entry_price DECIMAL(10,5),
  close_price DECIMAL(10,5),
  lots DECIMAL(8,2),
  pnl DECIMAL(12,2) NOT NULL,
  close_time TIMESTAMP WITH TIME ZONE NOT NULL,
  strategy TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de reglas de seguimiento
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  trading_days INTEGER,
  start_day DATE,
  end_day DATE,
  max_loss_trade DECIMAL(10,2),
  max_loss_day DECIMAL(10,2),
  max_drawdown DECIMAL(10,2),
  max_trades_day INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_close_time ON trades(close_time DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_rules_user_id ON rules(user_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tabla users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow signup" ON users
  FOR INSERT WITH CHECK (true);

-- Políticas RLS para tabla accounts
CREATE POLICY "Users can view own accounts" ON accounts
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Admin'
    )
  );

CREATE POLICY "Users can manage own accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para tabla trades
CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Admin'
    ) OR
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid() 
      AND u1.role = 'Mentor'
      AND u2.id = trades.user_id
      AND u2.role = 'Alumno'
    )
  );

CREATE POLICY "Users can manage own trades" ON trades
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para tabla rules
CREATE POLICY "Users can view own rules" ON rules
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Admin'
    )
  );

CREATE POLICY "Users can manage own rules" ON rules
  FOR ALL USING (auth.uid() = user_id);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo (opcional)
-- INSERT INTO users (id, email, role) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'admin@traderfy.com', 'Admin'),
-- ('00000000-0000-0000-0000-000000000002', 'trader@example.com', 'Trader');

-- Comentarios sobre las tablas
COMMENT ON TABLE users IS 'Tabla de usuarios con roles del sistema';
COMMENT ON TABLE accounts IS 'Cuentas de trading de los usuarios';
COMMENT ON TABLE trades IS 'Operaciones de trading procesadas desde reportes HTML o ingresadas manualmente';
COMMENT ON TABLE rules IS 'Reglas de seguimiento y límites por cuenta';

-- Verificar que todo se creó correctamente
SELECT 
  schemaname,
  tablename,
  tableowner,
  tablespace,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename IN ('users', 'accounts', 'trades', 'rules');