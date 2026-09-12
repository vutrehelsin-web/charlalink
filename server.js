const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 4000;

// Verificar si Supabase está configurado correctamente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const isSupabaseEnabled = supabaseUrl && supabaseKey && 
  supabaseUrl.includes('supabase.co') && 
  !supabaseKey.includes('...') &&
  supabaseKey.length > 20;

// Supabase (opcional)
let supabase = null;
if (isSupabaseEnabled) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const ws = require('ws');
    supabase = createClient(supabaseUrl, supabaseKey, {
      realtime: {
        transport: ws
      }
    });
    console.log('☁️ Supabase conectado');
  } catch (err) {
    console.log('⚠️ Error conectando Supabase, modo local:', err.message);
  }
}

if (!isSupabaseEnabled) {
  console.log('ℹ️ Modo local (configura .env para Supabase)');
}

// Configurar multer
const storage = isSupabaseEnabled ? multer.memoryStorage() : multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|webm|mp3|wav|ogg|pdf|doc|docx|zip|rar/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) || allowed.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Tipo de archivo no permitido'));
  }
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

// Ruta para subir archivos
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  try {
    let fileUrl;
    
    if (isSupabaseEnabled && supabase) {
      const uniqueName = `${uuidv4()}-${req.file.originalname}`;
      const filePath = `uploads/${uniqueName}`;
      const { error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'chat-media')
        .upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

      if (error) throw error;
      const { data: urlData } = supabase.storage.from(process.env.SUPABASE_BUCKET || 'chat-media').getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    } else {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      fileUrl
    });
  } catch (err) {
    console.error('Error en upload:', err);
    res.status(500).json({ error: 'Error al procesar el archivo' });
  }
});

// ========================================
// VENICE.AI - GENERADOR DE IMÁGENES
// ========================================

// Generar imagen con Venice.ai
app.post('/generate-image', async (req, res) => {
  const { prompt, model, width, height, negativePrompt, style } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt requerido' });
  }

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey || apiKey === 'tu-api-key-aqui') {
    return res.status(400).json({ error: 'VENICE_API_KEY no configurada' });
  }

  try {
    const response = await fetch(`${process.env.VENICE_API_URL || 'https://api.venice.ai/api/v1'}/image/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'flux-dev',
        prompt: style ? `${prompt}, ${style}` : prompt,
        negative_prompt: negativePrompt || '',
        width: width || 1024,
        height: height || 1024,
        steps: 30,
        cfg_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error generando imagen');
    }

    const data = await response.json();
    res.json({
      success: true,
      imageUrl: data.image || data.url,
      prompt
    });
  } catch (err) {
    console.error('Error Venice.ai:', err);
    res.status(500).json({ error: err.message || 'Error generando imagen' });
  }
});

// Obtener modelos disponibles de Venice.ai
app.get('/venice-models', async (req, res) => {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey || apiKey === 'tu-api-key-aqui') {
    return res.json({
      models: [
        { id: 'flux-dev', name: 'Flux Dev (Rápido)' },
        { id: 'flux-dev-uncensored', name: 'Flux Dev Uncensored' },
        { id: 'qwen-turbo', name: 'Qwen Turbo' },
        { id: 'sd3.5', name: 'Stable Diffusion 3.5' }
      ]
    });
  }

  try {
    const response = await fetch(`${process.env.VENICE_API_URL || 'https://api.venice.ai/api/v1'}/models?type=image`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Error obteniendo modelos');
    }

    const data = await response.json();
    res.json({ models: data.data || [] });
  } catch (err) {
    res.json({
      models: [
        { id: 'flux-dev', name: 'Flux Dev (Rápido)' },
        { id: 'flux-dev-uncensored', name: 'Flux Dev Uncensored' },
        { id: 'qwen-turbo', name: 'Qwen Turbo' },
        { id: 'sd3.5', name: 'Stable Diffusion 3.5' }
      ]
    });
  }
});

// Estado
const users = new Map();
const rooms = new Map();
const messageHistory = new Map();
const userProfiles = new Map(); // Perfiles de usuarios persistentes
const forums = new Map(); // Foros de debate temáticos

// Avatares disponibles para perfiles
const availableAvatars = ['😀','😎','🤓','🥳','😈','👽','🤖','👻','🦊','🐱','🐶','🦁','🐸','🐵','🦄','🐲','🎃','👾','🤡','😺','🦉','🦋','🐢','🐙','🦑','🐳','🦈','🐘','🦒','🐧','🦩','🦚','🐬','🦔','🐿️','🌵','🍕','🍔','🌮','🍣','🍦','🎮','🎲','🎸','🎨','📚','💻','🔬','🚀','✈️','🏆','💎','🔥','⚡','🌟','🎯','🧠','💪','👑','🎭','🕶️','🧙','🧛','🧟','🧞','🧚','🦸','🥷','🧑‍🚀','👨‍🎤','👩‍🎨','🧑‍💻','👨‍🔬','🚴','🏄','🤸','⛷️','🏋️','🤺','🎣','🏊','🧗'];

// Categorías de foros
const forumCategories = [
  { id: 'tech', name: '💻 Tecnología', icon: '💻', description: 'Programación, IA, hardware, software' },
  { id: 'gaming', name: '🎮 Gaming', icon: '🎮', description: 'Videojuegos, esports, consolas' },
  { id: 'science', name: '🔬 Ciencia', icon: '🔬', description: 'Descubrimientos, física, biología' },
  { id: 'art', name: '🎨 Arte y Diseño', icon: '🎨', description: 'Dibujo, pintura, diseño gráfico' },
  { id: 'music', name: '🎵 Música', icon: '🎵', description: 'Géneros, instrumentos, producción' },
  { id: 'movies', name: '🎬 Cine y Series', icon: '🎬', description: 'Películas, series, documentales' },
  { id: 'sports', name: '⚽ Deportes', icon: '⚽', description: 'Fútbol, baloncesto, más deportes' },
  { id: 'food', name: '🍕 Gastronomía', icon: '🍕', description: 'Recetas, restaurantes, cocina' },
  { id: 'travel', name: '✈️ Viajes', icon: '✈️', description: 'Destinos, consejos, experiencias' },
  { id: 'random', name: '🎲 Random', icon: '🎲', description: 'Temas variados y libre debate' }
];

// Socket.io
io.on('connection', (socket) => {
  console.log(`✅ Usuario conectado: ${socket.id}`);
  let currentRoom = null;

  socket.on('create room', (data) => {
    const roomId = generateRoomId();
    const roomName = data.roomName || `Sala ${roomId.substr(0, 4)}`;
    
    rooms.set(roomId, { id: roomId, name: roomName, users: new Set(), createdAt: new Date().toISOString() });
    users.set(socket.id, { id: socket.id, username: data.username || `Usuario ${socket.id.substr(0, 4)}`, color: getRandomColor(), roomId });

    socket.join(roomId);
    rooms.get(roomId).users.add(socket.id);
    currentRoom = roomId;

    socket.emit('room created', { roomId, roomName, username: users.get(socket.id).username });
    updateRoomUsers(roomId);
    console.log(`🏠 Sala creada: ${roomId}`);
  });

  socket.on('join room', (data) => {
    const roomId = data.roomId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const room = rooms.get(roomId);

    if (!roomId || roomId.length !== 6) {
      socket.emit('room error', { error: 'Código de sala inválido. Debe tener 6 caracteres.' });
      return;
    }

    if (!room) {
      socket.emit('room error', { error: `La sala "${roomId}" no existe. Verifica el código o crea una nueva sala.` });
      return;
    }

    users.set(socket.id, { id: socket.id, username: data.username || `Usuario ${socket.id.substr(0, 4)}`, color: getRandomColor(), roomId });
    socket.join(roomId);
    room.users.add(socket.id);
    currentRoom = roomId;

    socket.emit('room joined', { roomId, roomName: room.name, username: users.get(socket.id).username });

    // Enviar historial
    const history = messageHistory.get(roomId) || [];
    if (history.length > 0) socket.emit('message history', history);

    socket.to(roomId).emit('user joined', { username: users.get(socket.id).username, message: `${users.get(socket.id).username} se unió al chat` });
    updateRoomUsers(roomId);
    console.log(`👤 ${users.get(socket.id).username} se unió a: ${roomId}`);
  });

  socket.on('chat message', (data) => {
    const user = users.get(socket.id);
    if (user && currentRoom) {
      const msg = { id: uuidv4(), username: user.username, color: user.color, message: data.message, timestamp: new Date().toISOString(), type: 'text' };
      if (!messageHistory.has(currentRoom)) messageHistory.set(currentRoom, []);
      messageHistory.get(currentRoom).push(msg);
      io.to(currentRoom).emit('chat message', msg);
    }
  });

  socket.on('voice message', (data) => {
    const user = users.get(socket.id);
    if (user && currentRoom) {
      const msg = { id: uuidv4(), username: user.username, color: user.color, audioUrl: data.audioUrl, duration: data.duration, timestamp: new Date().toISOString(), type: 'voice' };
      if (!messageHistory.has(currentRoom)) messageHistory.set(currentRoom, []);
      messageHistory.get(currentRoom).push(msg);
      io.to(currentRoom).emit('voice message', msg);
    }
  });

  socket.on('file shared', (data) => {
    const user = users.get(socket.id);
    if (user && currentRoom) {
      const msg = { id: uuidv4(), username: user.username, color: user.color, fileUrl: data.fileUrl, fileName: data.fileName, fileSize: data.fileSize, fileType: data.fileType, timestamp: new Date().toISOString(), type: 'file' };
      if (!messageHistory.has(currentRoom)) messageHistory.set(currentRoom, []);
      messageHistory.get(currentRoom).push(msg);
      io.to(currentRoom).emit('file shared', msg);
    }
  });

  socket.on('typing', (data) => {
    const user = users.get(socket.id);
    if (user && currentRoom) socket.to(currentRoom).emit('typing', { username: user.username, isTyping: data.isTyping });
  });

  socket.on('screen share started', () => {
    const user = users.get(socket.id);
    if (user && currentRoom) socket.to(currentRoom).emit('screen share started', { userId: socket.id, username: user.username });
  });

  socket.on('screen share stopped', () => {
    if (currentRoom) socket.to(currentRoom).emit('screen share stopped', { userId: socket.id });
  });

  socket.on('webrtc offer', (data) => socket.to(data.target).emit('webrtc offer', { sender: socket.id, offer: data.offer }));
  socket.on('webrtc answer', (data) => socket.to(data.target).emit('webrtc answer', { sender: socket.id, answer: data.answer }));
  socket.on('webrtc ice candidate', (data) => socket.to(data.target).emit('webrtc ice candidate', { sender: socket.id, candidate: data.candidate }));

  // Eventos de mute para llamadas
  socket.on('mute toggled', (data) => {
    const user = users.get(socket.id);
    if (user && currentRoom) {
      socket.to(currentRoom).emit('mute toggled', { username: user.username, isMuted: data.isMuted });
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user && currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.users.delete(socket.id);
        if (room.users.size === 0 && currentRoom !== 'general') {
          rooms.delete(currentRoom);
          messageHistory.delete(currentRoom);
        } else {
          socket.to(currentRoom).emit('user left', { username: user.username, message: `${user.username} salió del chat` });
          updateRoomUsers(currentRoom);
        }
      }
    }
    users.delete(socket.id);
    console.log(`❌ Usuario desconectado: ${socket.id}`);
  });

  // ========================================
  // EVENTOS DE PERFIL
  // ========================================

  socket.on('get profile', (data) => {
    const profile = userProfiles.get(data.username.toLowerCase());
    if (profile) {
      socket.emit('profile data', profile);
    } else {
      socket.emit('profile data', null);
    }
  });

  socket.on('update profile', (data) => {
    const { username, avatar, bio, status } = data;
    if (!username) return;

    const existingProfile = userProfiles.get(username.toLowerCase()) || {};
    const profile = {
      username: username,
      avatar: avatar || existingProfile.avatar || '😀',
      bio: bio || existingProfile.bio || '',
      status: status || existingProfile.status || 'online',
      createdAt: existingProfile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messagesSent: existingProfile.messagesSent || 0
    };

    userProfiles.set(username.toLowerCase(), profile);
    socket.emit('profile updated', profile);
    showNotification('Perfil actualizado', 'success');
  });

  socket.on('get avatars', () => {
    socket.emit('avatars list', availableAvatars);
  });

  // ========================================
  // EVENTOS DE FOROS
  // ========================================

  socket.on('get forum categories', () => {
    socket.emit('forum categories', forumCategories);
  });

  socket.on('get forums', (data) => {
    const { category } = data || {};
    let forumList = Array.from(forums.values());
    if (category) {
      forumList = forumList.filter(f => f.category === category);
    }
    // Convertir Sets a Arrays para enviar por socket
    const serialized = forumList.map(f => ({
      ...f,
      members: Array.from(f.members || [])
    }));
    socket.emit('forums list', serialized);
  });

  socket.on('get forum', (data) => {
    const forum = forums.get(data.forumId);
    if (forum) {
      socket.emit('forum data', {
        ...forum,
        members: Array.from(forum.members || [])
      });
    } else {
      socket.emit('room error', { error: 'Foro no encontrado' });
    }
  });

  socket.on('create forum', (data) => {
    const { name, description, category, createdBy } = data;
    if (!name || !category) {
      socket.emit('room error', { error: 'Nombre y categoría requeridos' });
      return;
    }

    if (!forumCategories.find(c => c.id === category)) {
      socket.emit('room error', { error: 'Categoría inválida' });
      return;
    }

    const forumId = generateRoomId().toLowerCase();
    const forum = {
      id: forumId,
      name,
      description: description || '',
      category,
      createdBy: createdBy || 'Anónimo',
      createdAt: new Date().toISOString(),
      members: new Set(),
      messageCount: 0
    };

    forums.set(forumId, forum);

    // Crear sala de chat asociada al foro
    rooms.set(forumId, {
      id: forumId,
      name: `[Foro] ${name}`,
      users: new Set(),
      createdAt: forum.createdAt,
      isForum: true
    });

    const serializedForum = { ...forum, members: [] };
    io.emit('forum created', { forum: serializedForum });
    socket.emit('forum joined', { forumId, forumName: name, category });
    console.log(`📢 Foro creado: ${forumId} - ${name}`);
  });

  socket.on('join forum', (data) => {
    const { forumId, username } = data;
    const forum = forums.get(forumId);
    const room = rooms.get(forumId);

    if (!forum || !room) {
      socket.emit('room error', { error: 'Foro no encontrado' });
      return;
    }

    // Agregar usuario al foro
    forum.members.add(username);

    // Agregar usuario a la sala de chat
    users.set(socket.id, {
      id: socket.id,
      username: username || `Usuario ${socket.id.substr(0, 4)}`,
      color: getRandomColor(),
      roomId: forumId
    });
    socket.join(forumId);
    room.users.add(socket.id);
    currentRoom = forumId;

    // Enviar historial de mensajes del foro
    const history = messageHistory.get(forumId) || [];
    if (history.length > 0) {
      socket.emit('message history', history);
    }

    socket.to(forumId).emit('user joined', {
      username: users.get(socket.id).username,
      message: `${users.get(socket.id).username} se unió al foro`
    });
    updateRoomUsers(forumId);

    const serializedForum = { ...forum, members: Array.from(forum.members) };
    socket.emit('forum joined', {
      forumId,
      forumName: forum.name,
      category: forum.category,
      forum: serializedForum
    });

    console.log(`👤 ${username} se unió al foro: ${forumId}`);
  });

  socket.on('forum message', (data) => {
    const user = users.get(socket.id);
    if (user && currentRoom) {
      const forum = forums.get(currentRoom);
      if (forum) {
        forum.messageCount = (forum.messageCount || 0) + 1;
      }

      const msg = {
        id: uuidv4(),
        username: user.username,
        color: user.color,
        message: data.message,
        timestamp: new Date().toISOString(),
        type: 'text',
        forumId: currentRoom
      };

      if (!messageHistory.has(currentRoom)) {
        messageHistory.set(currentRoom, []);
      }
      messageHistory.get(currentRoom).push(msg);
      io.to(currentRoom).emit('forum message', msg);
    }
  });
});

function updateRoomUsers(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    const roomUsers = Array.from(room.users).map(id => {
      const u = users.get(id);
      return u ? { id: u.id, username: u.username, color: u.color } : null;
    }).filter(Boolean);
    io.to(roomId).emit('users update', roomUsers);
  }
}

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = '';
  for (let i = 0; i < 6; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
  return r;
}

function getRandomColor() {
  const colors = ['#e74c3c','#c0392b','#e67e22','#d35400','#f39c12','#f1c40f','#2ecc71','#27ae60','#3498db','#2980b9','#9b59b6','#8e44ad','#1abc9c','#16a085','#e91e63','#ff5722'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

server.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log('\n🚀 Chat Privado iniciado\n');
  console.log(`📱 Accede localmente: http://localhost:${PORT}`);
  console.log(`🌐 Comparte este enlace: http://${localIP}:${PORT}`);
  console.log('\n✨ Características:');
  console.log('   💬 Chat en tiempo real');
  console.log('   🏠 Salas privadas con enlace único');
  console.log('   👤 Perfiles de usuario');
  console.log('   📢 Foros de debate temáticos');
  console.log('   🖥️ Compartir pantalla');
  console.log('   🎙️ Mensajes de voz');
  console.log('   📁 Compartir archivos');
  console.log('   🎨 Tema oscuro/rojo\n');
});

// ========================================
// PERFILES DE USUARIO - API
// ========================================

// Obtener perfil de usuario
app.get('/api/profile/:username', (req, res) => {
  const { username } = req.params;
  const profile = userProfiles.get(username.toLowerCase());
  if (profile) {
    res.json({ success: true, profile });
  } else {
    res.json({ success: false, error: 'Perfil no encontrado' });
  }
});

// Crear/Actualizar perfil
app.post('/api/profile', express.json(), (req, res) => {
  const { username, avatar, bio, status } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Nombre de usuario requerido' });
  }

  const existingProfile = userProfiles.get(username.toLowerCase()) || {};
  const profile = {
    username: username,
    avatar: avatar || existingProfile.avatar || '😀',
    bio: bio || existingProfile.bio || '',
    status: status || existingProfile.status || 'online',
    createdAt: existingProfile.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messagesSent: existingProfile.messagesSent || 0
  };

  userProfiles.set(username.toLowerCase(), profile);
  res.json({ success: true, profile });
});

// Obtener todos los perfiles
app.get('/api/profiles', (req, res) => {
  const profiles = Array.from(userProfiles.values());
  res.json({ success: true, profiles });
});

// Obtener avatares disponibles
app.get('/api/avatars', (req, res) => {
  res.json({ success: true, avatars: availableAvatars });
});

// ========================================
// FOROS DE DEBATE - API
// ========================================

// Obtener categorías de foros
app.get('/api/forums/categories', (req, res) => {
  res.json({ success: true, categories: forumCategories });
});

// Obtener foros por categoría
app.get('/api/forums/category/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const categoryForums = Array.from(forums.values()).filter(f => f.category === categoryId);
  res.json({ success: true, forums: categoryForums });
});

// Obtener todos los foros
app.get('/api/forums', (req, res) => {
  const allForums = Array.from(forums.values());
  res.json({ success: true, forums: allForums });
});

// Obtener un foro específico
app.get('/api/forums/:forumId', (req, res) => {
  const { forumId } = req.params;
  const forum = forums.get(forumId);
  if (forum) {
    res.json({ success: true, forum });
  } else {
    res.status(404).json({ error: 'Foro no encontrado' });
  }
});

// Crear foro
app.post('/api/forums', express.json(), (req, res) => {
  const { name, description, category, createdBy } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Nombre y categoría requeridos' });
  }

  if (!forumCategories.find(c => c.id === category)) {
    return res.status(400).json({ error: 'Categoría inválida' });
  }

  const forumId = generateRoomId().toLowerCase();
  const forum = {
    id: forumId,
    name,
    description: description || '',
    category,
    createdBy: createdBy || 'Anónimo',
    createdAt: new Date().toISOString(),
    members: new Set(),
    messageCount: 0
  };

  forums.set(forumId, forum);
  
  // Crear sala de chat asociada al foro
  rooms.set(forumId, { 
    id: forumId, 
    name: `[Foro] ${name}`, 
    users: new Set(), 
    createdAt: forum.createdAt,
    isForum: true 
  });

  io.emit('forum created', { forum: { ...forum, members: [] } });
  res.json({ success: true, forum: { ...forum, members: [] } });
});

// Unirse a un foro
app.post('/api/forums/:forumId/join', express.json(), (req, res) => {
  const { forumId } = req.params;
  const { username } = req.body;
  
  const forum = forums.get(forumId);
  if (!forum) {
    return res.status(404).json({ error: 'Foro no encontrado' });
  }

  forum.members.add(username);
  res.json({ success: true, forum: { ...forum, members: Array.from(forum.members) } });
});

// Obtener mensajes del foro
app.get('/api/forums/:forumId/messages', (req, res) => {
  const { forumId } = req.params;
  const history = messageHistory.get(forumId) || [];
  res.json({ success: true, messages: history });
});