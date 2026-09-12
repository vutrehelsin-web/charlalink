# 💬 Chat Privado con Supabase

Aplicación de chat privada local con tema oscuro/rojo, soporte para pantalla, audio, multimedia y almacenamiento en la nube con Supabase.

## 🚀 Inicio Rápido

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta/proyecto
2. Ve al **SQL Editor** y pega el contenido de `supabase.sql`
3. Ejecuta el SQL para crear las tablas

### 2. Crear Bucket de Storage

1. Ve a **Storage** → **New Bucket**
2. Nombre: `chat-media`
3. ✅ **Public**: Sí
4. File size limit: **100MB**
5. Allowed MIME types: `image/*, video/*, audio/*, application/pdf`

### 3. Configurar credenciales

1. Ve a **Project Settings** → **API**
2. Copia la **URL** y la **anon public key**
3. Crea un archivo `.env` basado en `.env.example`:

```env
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-aqui
PORT=4000
SUPABASE_BUCKET=chat-media
```

### 4. Instalar y ejecutar

```bash
npm install
npm start
```

### 5. Acceder al chat

- Local: `http://localhost:4000`
- Red local: `http://10.1.19.2:4000` (tu IP)

## ✨ Características

| Función | Descripción |
|---------|-------------|
| 💬 Chat en tiempo real | Mensajes instantáneos con Socket.io |
| 🏠 Salas privadas | Código único de 6 caracteres |
| ☁️ Archivos en la nube | Imágenes, videos, audios en Supabase Storage |
| 📜 Historial persistente | Mensajes guardados en PostgreSQL |
| 🖥️ Compartir pantalla | WebRTC para streaming |
| 🎙️ Mensajes de voz | Graba y envía audios |
| 📁 Compartir archivos | Imágenes, videos, documentos |
| 🎬 Reproductor | Panel derecho con lista de videos |
| 🎨 Tema oscuro/rojo | Diseño moderno |
| 📱 Responsive | Funciona en móvil y desktop |

## 🔧 Port Forwarding

Para acceso desde internet:

1. Configura tu router: puerto externo 4000 → IP local puerto 4000
2. Accede via: `http://<tu-ip-publica>:4000`

## 📁 Estructura del proyecto

```
chat-privado/
├── server.js          # Servidor Express + Socket.io + Supabase
├── package.json       # Dependencias
├── .env.example       # Plantilla de configuración
├── supabase.sql       # Esquema de base de datos
├── public/
│   ├── index.html     # Interfaz
│   ├── style.css      # Tema oscuro/rojo
│   └── app.js         # Lógica del cliente
└── uploads/           # (No se usa con Supabase)
```

## 🔐 Seguridad

- Las salas son privadas por código único
- Los archivos tienen URLs públicas de Supabase
- Las políticas RLS permiten acceso al chat
