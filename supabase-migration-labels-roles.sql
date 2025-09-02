-- =====================================================
-- TRADERFY - MIGRATION: LABELS & ROLES SYSTEM
-- Nuevas tablas y políticas RLS para etiquetas personalizadas y sistema de roles
-- =====================================================

-- 1. Actualizar tabla users existente para roles avanzados
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'Trader';
ALTER TABLE users ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger para actualizar updated_at en users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Crear tabla labels para etiquetas personalizadas
CREATE TABLE IF NOT EXISTS labels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name) -- Un usuario no puede tener etiquetas duplicadas
);

-- Trigger para updated_at en labels
CREATE TRIGGER update_labels_updated_at 
    BEFORE UPDATE ON labels 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Crear tabla account_labels para relación many-to-many
CREATE TABLE IF NOT EXISTS account_labels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, label_id) -- Una cuenta no puede tener la misma etiqueta duplicada
);

-- 4. Crear tabla mentorships para relaciones mentor-alumno
CREATE TABLE IF NOT EXISTS mentorships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alumno_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(alumno_id), -- Un alumno solo puede tener un mentor activo
    CONSTRAINT mentor_not_self CHECK (mentor_id != alumno_id)
);

-- Trigger para updated_at en mentorships
CREATE TRIGGER update_mentorships_updated_at 
    BEFORE UPDATE ON mentorships 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS en todas las nuevas tablas
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;

-- Políticas para tabla USERS (actualizar existentes)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Mentors can view their students" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON users FOR SELECT 
    USING (auth.uid() = id);

-- Mentors pueden ver perfiles de sus alumnos
CREATE POLICY "Mentors can view their students" ON users FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM mentorships 
            WHERE mentor_id = auth.uid() 
            AND alumno_id = users.id 
            AND status = 'active'
        )
    );

-- Admins pueden ver todos los usuarios
CREATE POLICY "Admins can view all users" ON users FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'Admin'
        )
    );

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON users FOR UPDATE 
    USING (auth.uid() = id);

-- Políticas para tabla LABELS
CREATE POLICY "Users can manage own labels" ON labels FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all labels" ON labels FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'Admin'
        )
    );

-- Políticas para tabla ACCOUNT_LABELS
CREATE POLICY "Users can manage own account labels" ON account_labels FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM accounts 
            WHERE accounts.id = account_labels.account_id 
            AND accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "Mentors can view student account labels" ON account_labels FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN mentorships m ON a.user_id = m.alumno_id
            WHERE a.id = account_labels.account_id 
            AND m.mentor_id = auth.uid() 
            AND m.status = 'active'
        )
    );

-- Políticas para tabla MENTORSHIPS
CREATE POLICY "Mentors can view their mentorships" ON mentorships FOR SELECT
    USING (auth.uid() = mentor_id);

CREATE POLICY "Students can view their mentorship" ON mentorships FOR SELECT
    USING (auth.uid() = alumno_id);

CREATE POLICY "Mentors can create mentorships" ON mentorships FOR INSERT
    WITH CHECK (
        auth.uid() = mentor_id 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('Mentor', 'Admin')
        )
    );

CREATE POLICY "Mentors can update their mentorships" ON mentorships FOR UPDATE
    USING (auth.uid() = mentor_id);

CREATE POLICY "Admins can manage all mentorships" ON mentorships FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'Admin'
        )
    );

-- Actualizar políticas existentes para ACCOUNTS
DROP POLICY IF EXISTS "Mentors can view student accounts" ON accounts;
CREATE POLICY "Mentors can view student accounts" ON accounts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM mentorships 
            WHERE mentor_id = auth.uid() 
            AND alumno_id = accounts.user_id 
            AND status = 'active'
        )
    );

-- Actualizar políticas existentes para TRADES
DROP POLICY IF EXISTS "Mentors can view student trades" ON trades;
CREATE POLICY "Mentors can view student trades" ON trades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM accounts a
            JOIN mentorships m ON a.user_id = m.alumno_id
            WHERE a.id = trades.account_id 
            AND m.mentor_id = auth.uid() 
            AND m.status = 'active'
        )
    );

-- =====================================================
-- DATOS INICIALES Y CONFIGURACIÓN
-- =====================================================

-- Insertar etiquetas predeterminadas para Admin (opcional)
INSERT INTO labels (user_id, name, color) 
SELECT id, 'Funded', '#A020F0' FROM users WHERE role = 'Admin' LIMIT 1
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO labels (user_id, name, color) 
SELECT id, 'Demo', '#6B7280' FROM users WHERE role = 'Admin' LIMIT 1
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO labels (user_id, name, color) 
SELECT id, 'Live', '#00FFFF' FROM users WHERE role = 'Admin' LIMIT 1
ON CONFLICT (user_id, name) DO NOTHING;

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id);
CREATE INDEX IF NOT EXISTS idx_account_labels_account_id ON account_labels(account_id);
CREATE INDEX IF NOT EXISTS idx_account_labels_label_id ON account_labels(label_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_mentor_id ON mentorships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_alumno_id ON mentorships(alumno_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para generar colores automáticos para etiquetas
CREATE OR REPLACE FUNCTION generate_label_color()
RETURNS VARCHAR(7) AS $$
DECLARE
    colors VARCHAR(7)[] := ARRAY['#A020F0', '#8A2BE2', '#9932CC', '#9400D3', '#7B68EE', '#6A5ACD', '#00FFFF', '#00CED1', '#20B2AA', '#48D1CC', '#40E0D0', '#00BFFF'];
BEGIN
    RETURN colors[floor(random() * array_length(colors, 1) + 1)];
END;
$$ LANGUAGE plpgsql;

-- Función para obtener métricas agregadas de un usuario (para mentores)
CREATE OR REPLACE FUNCTION get_user_metrics(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_accounts', COUNT(DISTINCT a.id),
        'total_trades', COUNT(DISTINCT t.id),
        'total_pnl', COALESCE(SUM(t.pnl), 0),
        'win_rate', CASE 
            WHEN COUNT(t.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN t.pnl > 0 THEN 1 END)::decimal / COUNT(t.id) * 100), 2)
            ELSE 0 
        END,
        'avg_win', COALESCE(AVG(CASE WHEN t.pnl > 0 THEN t.pnl END), 0),
        'avg_loss', COALESCE(AVG(CASE WHEN t.pnl < 0 THEN t.pnl END), 0)
    ) INTO result
    FROM accounts a
    LEFT JOIN trades t ON a.id = t.account_id
    WHERE a.user_id = target_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

-- Actualizar cualquier cuenta existente sin etiquetas para usar las predeterminadas
-- (Este script puede ejecutarse después de la migración)

COMMIT;