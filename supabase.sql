-- ============================================
-- Chat Privado - Esquema de Base de Datos
-- Ejecuta este SQL en el Editor SQL de Supabase
-- ============================================

-- Tabla de salas de chat
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Sala sin nombre',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes del chat
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL DEFAULT 'general',
    username TEXT NOT NULL,
    user_color TEXT DEFAULT '#e74c3c',
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'file', 'system')),
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    file_type TEXT,
    audio_duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de usuarios conectados (para presencia)
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    username TEXT NOT NULL,
    user_color TEXT DEFAULT '#e74c3c',
    socket_id TEXT UNIQUE,
    is_online BOOLEAN DEFAULT true,
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_presence_room_id ON user_presence(room_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en rooms
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad (RLS) - Acceso público para el chat
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Políticas para rooms
CREATE POLICY "Allow all access on rooms" ON rooms FOR ALL USING (true);

-- Políticas para messages
CREATE POLICY "Allow read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow insert messages" ON messages FOR INSERT WITH CHECK (true);

-- Políticas para user_presence
CREATE POLICY "Allow all access on user_presence" ON user_presence FOR ALL USING (true);
