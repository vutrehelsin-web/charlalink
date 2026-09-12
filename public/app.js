// Chat Privado - Cliente
const socket = io();

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const btnSend = document.getElementById('btn-send');
const btnRecord = document.getElementById('btn-record');
const btnAttach = document.getElementById('btn-attach');
const fileInput = document.getElementById('file-input');
const btnShareScreen = document.getElementById('btn-share-screen');
const btnStopShare = document.getElementById('btn-stop-share');
const screenShareContainer = document.getElementById('screen-share-container');
const sharedScreenVideo = document.getElementById('shared-screen-video');
const screenShareInfo = document.getElementById('screen-share-info');
const btnCloseScreen = document.getElementById('btn-close-screen');
const typingIndicator = document.getElementById('typing-indicator');
const typingText = document.getElementById('typing-text');
const usersList = document.getElementById('users-list');
const btnClearChat = document.getElementById('btn-clear-chat');
const recordingIndicator = document.getElementById('recording-indicator');
const recordingTime = document.getElementById('recording-time');
const btnCancelRecord = document.getElementById('btn-cancel-record');
const btnStopRecord = document.getElementById('btn-stop-record');
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const btnCloseModal = document.getElementById('btn-close-modal');
const notifications = document.getElementById('notifications');

// Elementos de sala
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const createRoomForm = document.getElementById('create-room-form');
const joinRoomForm = document.getElementById('join-room-form');
const createUsername = document.getElementById('create-username');
const joinUsername = document.getElementById('join-username');
const roomNameInput = document.getElementById('room-name');
const roomIdInput = document.getElementById('room-id');
const roomCodeEl = document.getElementById('room-code');
const roomTitleEl = document.getElementById('room-title');
const chatTitleEl = document.getElementById('chat-title');
const btnCopyLink = document.getElementById('btn-copy-link');
const btnLeaveRoom = document.getElementById('btn-leave-room');

// Estado
let currentUser = null;
let currentRoomId = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimer = null;
let localStream = null;
let peerConnections = new Map();
let typingTimeout = null;

// Verificar si hay un código de sala en la URL
const urlParams = new URLSearchParams(window.location.search);
const roomIdFromUrl = urlParams.get('room');

// Si hay un código de sala en la URL, cambiar a la pestaña "Unirse" y precargar el código
if (roomIdFromUrl) {
  const cleanRoomId = roomIdFromUrl.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
  if (cleanRoomId.length === 6) {
    // Cambiar a la pestaña de unirse
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    const joinTabBtn = document.querySelector('[data-tab="join"]');
    if (joinTabBtn) {
      joinTabBtn.classList.add('active');
      document.getElementById('tab-join').classList.add('active');
    }
    // Precargar el código de sala
    if (roomIdInput) {
      roomIdInput.value = cleanRoomId;
      // Enfocar el campo de username
      const joinUsernameEl = document.getElementById('join-username');
      if (joinUsernameEl) joinUsernameEl.focus();
    }
    // Mostrar notificación
    showNotification(`Invitación detectada a sala: ${cleanRoomId}`, 'info');
  }
}

// Tabs
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
  });
});

// Crear sala
createRoomForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = createUsername.value.trim();
  const roomName = roomNameInput.value.trim();
  if (username) {
    currentUser = username;
    socket.emit('create room', { username, roomName });
  }
});

// Unirse a sala
joinRoomForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = joinUsername.value.trim();
  const roomId = roomIdInput.value.trim().toUpperCase();
  if (username && roomId) {
    currentUser = username;
    saveProfile(username);
    socket.emit('join room', { username, roomId });
  }
});

// ==================== PERFILES ====================

function saveProfile(username) {
  const avatar = document.getElementById('profile-avatar')?.dataset.avatar || '😀';
  const bio = document.getElementById('profile-bio')?.value || '';
  socket.emit('update profile', { username, avatar, bio, status: 'online' });
}

function loadProfile(username) {
  socket.emit('get profile', { username });
}

socket.on('profile data', (profile) => {
  if (profile) {
    const avatarEl = document.getElementById('profile-avatar');
    const bioEl = document.getElementById('profile-bio');
    if (avatarEl) avatarEl.dataset.avatar = profile.avatar;
    if (avatarEl) avatarEl.textContent = profile.avatar;
    if (bioEl) bioEl.value = profile.bio || '';
  }
});

socket.on('profile updated', (profile) => {
  showNotification('Perfil guardado correctamente', 'success');
});

socket.on('avatars list', (avatars) => {
  renderAvatarPicker(avatars);
});

function renderAvatarPicker(avatars) {
  const container = document.getElementById('avatar-picker');
  if (!container) return;
  container.innerHTML = '';
  avatars.forEach(avatar => {
    const btn = document.createElement('button');
    btn.className = 'avatar-option';
    btn.textContent = avatar;
    btn.addEventListener('click', () => {
      document.getElementById('profile-avatar').textContent = avatar;
      document.getElementById('profile-avatar').dataset.avatar = avatar;
      container.classList.remove('active');
    });
    container.appendChild(btn);
  });
}

// ==================== FOROS ====================

// Elementos de foros
const forumTabBtns = document.querySelectorAll('.forum-tab-btn');
const forumTabContents = document.querySelectorAll('.forum-tab-content');
const createForumForm = document.getElementById('create-forum-form');
const forumCategorySelect = document.getElementById('forum-category');
const forumsListEl = document.getElementById('forums-list');

// Cargar categorías de foros al inicio
socket.emit('get forum categories');
socket.emit('get avatars');

socket.on('forum categories', (categories) => {
  if (forumCategorySelect) {
    forumCategorySelect.innerHTML = categories.map(c =>
      `<option value="${c.id}">${c.name}</option>`
    ).join('');
  }
  renderForumCategories(categories);
});

// Tabs de foros
forumTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    forumTabBtns.forEach(b => b.classList.remove('active'));
    forumTabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`forum-tab-${tab}`).classList.add('active');
    if (tab === 'browse') loadForums();
  });
});

function renderForumCategories(categories) {
  const container = document.getElementById('forum-categories');
  if (!container) return;
  container.innerHTML = categories.map(cat => `
    <button class="forum-category-btn" data-category="${cat.id}">
      <span class="category-icon">${cat.icon}</span>
      <span class="category-name">${cat.name.split(' ').slice(1).join(' ')}</span>
      <span class="category-desc">${cat.description}</span>
    </button>
  `).join('');

  container.querySelectorAll('.forum-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      loadForums(btn.dataset.category);
    });
  });
}

function loadForums(category) {
  socket.emit('get forums', { category });
}

socket.on('forums list', (forums) => {
  renderForumsList(forums);
});

function renderForumsList(forums) {
  if (!forumsListEl) return;
  if (forums.length === 0) {
    forumsListEl.innerHTML = '<div class="no-forums">No hay foros todavía. ¡Crea el primero!</div>';
    return;
  }
  forumsListEl.innerHTML = forums.map(f => `
    <div class="forum-card" data-forum-id="${f.id}">
      <div class="forum-card-header">
        <span class="forum-icon">${getForumIcon(f.category)}</span>
        <div class="forum-info">
          <h4>${escapeHtml(f.name)}</h4>
          <span class="forum-category-label">${getForumCategoryName(f.category)}</span>
        </div>
      </div>
      <p class="forum-desc">${escapeHtml(f.description || 'Sin descripción')}</p>
      <div class="forum-meta">
        <span class="forum-members">👥 ${f.members?.length || 0} miembros</span>
        <span class="forum-messages">💬 ${f.messageCount || 0} mensajes</span>
      </div>
      <button class="btn-join-forum" data-forum-id="${f.id}" data-forum-name="${escapeHtml(f.name)}">Unirse al foro</button>
    </div>
  `).join('');

  forumsListEl.querySelectorAll('.btn-join-forum').forEach(btn => {
    btn.addEventListener('click', () => {
      const forumId = btn.dataset.forumId;
      const forumName = btn.dataset.forumName;
      if (currentUser) {
        joinForum(forumId, currentUser);
      } else {
        showNotification('Ingresa tu nombre primero', 'error');
      }
    });
  });
}

function getForumIcon(category) {
  const icons = {
    tech: '💻', gaming: '🎮', science: '🔬', art: '🎨',
    music: '🎵', movies: '🎬', sports: '⚽', food: '🍕',
    travel: '✈️', random: '🎲'
  };
  return icons[category] || '💬';
}

function getForumCategoryName(category) {
  const names = {
    tech: 'Tecnología', gaming: 'Gaming', science: 'Ciencia', art: 'Arte',
    music: 'Música', movies: 'Cine y Series', sports: 'Deportes',
    food: 'Gastronomía', travel: 'Viajes', random: 'Random'
  };
  return names[category] || 'General';
}

// Crear foro
if (createForumForm) {
  createForumForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('forum-name').value.trim();
    const description = document.getElementById('forum-desc').value.trim();
    const category = document.getElementById('forum-category').value;
    if (name && category) {
      socket.emit('create forum', {
        name,
        description,
        category,
        createdBy: currentUser || 'Anónimo'
      });
      createForumForm.reset();
    }
  });
}

// Unirse a foro
function joinForum(forumId, username) {
  socket.emit('join forum', { forumId, username });
}

socket.on('forum joined', (data) => {
  currentRoomId = data.forumId;
  isForumRoom = true;
  roomCodeEl.textContent = data.forumId.toUpperCase();
  roomTitleEl.textContent = `📢 ${data.forumName}`;
  chatTitleEl.textContent = data.forumName;
  updateUrl(data.forumId);
  enterApp();
  showNotification(`Te uniste al foro "${data.forumName}"`, 'success');
});

socket.on('forum created', (data) => {
  showNotification(`Foro "${data.forum.name}" creado`, 'success');
  loadForums();
});

socket.on('forum message', (msg) => {
  displayMessage(msg);
});

// Cambiar entre chat normal y foro
let isForumRoom = false;

// Modificar el envío de mensajes para usar forum message cuando esté en un foro
const originalSendMessage = sendMessage;
sendMessage = function() {
  const message = messageInput.value.trim();
  if (message) {
    if (isForumRoom) {
      socket.emit('forum message', { message });
    } else {
      socket.emit('chat message', { message });
    }
    messageInput.value = '';
    socket.emit('typing', { isTyping: false });
  }
};

// Eventos de sala
socket.on('room created', (data) => {
  currentRoomId = data.roomId;
  roomCodeEl.textContent = data.roomId;
  roomTitleEl.textContent = `💬 ${data.roomName}`;
  chatTitleEl.textContent = data.roomName;
  updateUrl(data.roomId);
  enterApp();
  showNotification(`Sala "${data.roomName}" creada. ¡Comparte el código!`, 'success');
});

socket.on('room joined', (data) => {
  currentRoomId = data.roomId;
  roomCodeEl.textContent = data.roomId;
  roomTitleEl.textContent = `💬 ${data.roomName}`;
  chatTitleEl.textContent = data.roomName;
  updateUrl(data.roomId);
  enterApp();
  showNotification(`Te uniste a "${data.roomName}"`, 'success');
});

socket.on('room error', (data) => {
  showNotification(data.error, 'error');
});

// Actualizar URL con el código de sala
function updateUrl(roomId) {
  const newUrl = `${window.location.pathname}?room=${roomId}`;
  window.history.pushState({ roomId }, '', newUrl);
}

// Entrar a la aplicación
function enterApp() {
  loginScreen.classList.add('hidden');
  app.classList.remove('hidden');
  messageInput.focus();
}

// Copiar enlace
btnCopyLink.addEventListener('click', () => {
  const link = window.location.href;
  navigator.clipboard.writeText(link).then(() => {
    showNotification('¡Enlace copiado!', 'success');
  }).catch(() => {
    // Fallback para navegadores antiguos
    const input = document.createElement('input');
    input.value = link;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showNotification('¡Enlace copiado!', 'success');
  });
});

// Salir de la sala
btnLeaveRoom.addEventListener('click', () => {
  if (confirm('¿Seguro que quieres salir de la sala?')) {
    window.location.href = window.location.pathname;
  }
});

// Enviar mensaje de texto
btnSend.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  } else {
    handleTyping();
  }
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('chat message', { message });
    messageInput.value = '';
    socket.emit('typing', { isTyping: false });
  }
}

// Indicador de escritura
function handleTyping() {
  socket.emit('typing', { isTyping: true });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing', { isTyping: false });
  }, 2000);
}

// Grabar mensaje de voz
btnRecord.addEventListener('click', toggleRecording);
btnCancelRecord.addEventListener('click', cancelRecording);
btnStopRecord.addEventListener('click', stopRecording);

async function toggleRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
      sendVoiceMessage(audioBlob, duration);
    };

    mediaRecorder.start();
    recordingStartTime = Date.now();
    recordingIndicator.classList.remove('hidden');
    updateRecordingTime();
    recordingTimer = setInterval(updateRecordingTime, 1000);
  } catch (err) {
    showNotification('No se pudo acceder al micrófono', 'error');
  }
}

function updateRecordingTime() {
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  recordingTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  recordingIndicator.classList.add('hidden');
  clearInterval(recordingTimer);
}

function cancelRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  audioChunks = [];
  recordingIndicator.classList.add('hidden');
  clearInterval(recordingTimer);
}

function sendVoiceMessage(blob, duration) {
  const reader = new FileReader();
  reader.onload = () => {
    const audioUrl = reader.result;
    socket.emit('voice message', { audioUrl, duration });
  };
  reader.readAsDataURL(blob);
}

// Compartir archivos
btnAttach.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);

async function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length === 0) return;

  for (const file of files) {
    await uploadFile(file);
  }
  fileInput.value = '';
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    showNotification('Subiendo archivo...', 'info');
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (data.success) {
      const fileUrl = `/uploads/${data.filename}`;
      socket.emit('file shared', {
        fileUrl,
        fileName: data.originalName,
        fileSize: data.size,
        fileType: data.mimetype
      });
      showNotification('Archivo enviado', 'success');
    } else {
      showNotification('Error al subir el archivo', 'error');
    }
  } catch (err) {
    showNotification('Error al subir el archivo', 'error');
  }
}

// Compartir pantalla
btnShareScreen.addEventListener('click', startScreenShare);
btnStopShare.addEventListener('click', stopScreenShare);
btnCloseScreen.addEventListener('click', () => {
  screenShareContainer.classList.add('hidden');
  sharedScreenVideo.srcObject = null;
});

async function startScreenShare() {
  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });

    sharedScreenVideo.srcObject = localStream;
    screenShareContainer.classList.remove('hidden');
    btnShareScreen.classList.add('hidden');
    btnStopShare.classList.remove('hidden');

    socket.emit('screen share started');

    localStream.getVideoTracks()[0].onended = () => {
      stopScreenShare();
    };
  } catch (err) {
    showNotification('No se pudo compartir la pantalla', 'error');
  }
}

function stopScreenShare() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  sharedScreenVideo.srcObject = null;
  screenShareContainer.classList.add('hidden');
  btnShareScreen.classList.remove('hidden');
  btnStopShare.classList.add('hidden');
  socket.emit('screen share stopped');
}

// Limpiar chat
btnClearChat.addEventListener('click', () => {
  messagesContainer.innerHTML = '';
  showNotification('Chat limpiado', 'info');
});

// Modal de imagen
btnCloseModal.addEventListener('click', () => {
  imageModal.classList.add('hidden');
});

imageModal.addEventListener('click', (e) => {
  if (e.target === imageModal) {
    imageModal.classList.add('hidden');
  }
});

// Eventos de Socket
socket.on('chat message', (data) => {
  addMessage(data);
});

socket.on('voice message', (data) => {
  addVoiceMessage(data);
});

socket.on('file shared', (data) => {
  addFileMessage(data);
});

socket.on('user joined', (data) => {
  addSystemMessage(data.message);
  showNotification(data.message, 'info');
});

socket.on('user left', (data) => {
  addSystemMessage(data.message);
  showNotification(data.message, 'info');
});

socket.on('users update', (users) => {
  updateUsersList(users);
});

socket.on('typing', (data) => {
  showTypingIndicator(data);
});

socket.on('screen share started', (data) => {
  screenShareInfo.textContent = `${data.username} está compartiendo pantalla`;
  screenShareContainer.classList.remove('hidden');
});

socket.on('screen share stopped', () => {
  screenShareContainer.classList.add('hidden');
  sharedScreenVideo.srcObject = null;
});

// Historial de mensajes desde Supabase
socket.on('message history', (messages) => {
  messages.forEach(msg => {
    if (msg.message_type === 'text') {
      addMessage({
        id: msg.id,
        username: msg.username,
        color: msg.user_color,
        message: msg.content,
        timestamp: msg.created_at,
        type: 'text'
      });
    } else if (msg.message_type === 'voice') {
      addVoiceMessage({
        id: msg.id,
        username: msg.username,
        color: msg.user_color,
        audioUrl: msg.content,
        duration: msg.audio_duration,
        timestamp: msg.created_at,
        type: 'voice'
      });
    } else if (msg.message_type === 'file') {
      addFileMessage({
        id: msg.id,
        username: msg.username,
        color: msg.user_color,
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        fileSize: msg.file_size,
        fileType: msg.file_type,
        timestamp: msg.created_at,
        type: 'file'
      });
    }
  });
  showNotification(`Se cargaron ${messages.length} mensajes anteriores`, 'info');
});

// Renderizar mensajes
function addMessage(data) {
  const isOwn = data.username === currentUser;
  const messageEl = document.createElement('div');
  messageEl.className = `message ${isOwn ? 'own' : ''}`;

  const time = formatTime(data.timestamp);

  messageEl.innerHTML = `
    <div class="message-header">
      <span class="message-username" style="color: ${data.color}">${escapeHtml(data.username)}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="message-content">${escapeHtml(data.message)}</div>
  `;

  messagesContainer.appendChild(messageEl);
  scrollToBottom();
}

function addVoiceMessage(data) {
  const isOwn = data.username === currentUser;
  const messageEl = document.createElement('div');
  messageEl.className = `message ${isOwn ? 'own' : ''}`;

  const time = formatTime(data.timestamp);
  const duration = formatDuration(data.duration);

  messageEl.innerHTML = `
    <div class="message-header">
      <span class="message-username" style="color: ${data.color}">${escapeHtml(data.username)}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="voice-message">
      <button class="voice-btn" data-audio="${data.audioUrl}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </button>
      <div class="voice-waveform">
        ${Array(20).fill('<span></span>').join('')}
      </div>
      <span class="voice-duration">${duration}</span>
    </div>
  `;

  const voiceBtn = messageEl.querySelector('.voice-btn');
  const waveform = messageEl.querySelector('.voice-waveform');
  voiceBtn.addEventListener('click', () => {
    const audio = new Audio(data.audioUrl);
    audio.play();
    voiceBtn.classList.add('playing');
    waveform.classList.add('playing');
    audio.onended = () => {
      voiceBtn.classList.remove('playing');
      waveform.classList.remove('playing');
    };
  });

  messagesContainer.appendChild(messageEl);
  scrollToBottom();
}

function addFileMessage(data) {
  const isOwn = data.username === currentUser;
  const messageEl = document.createElement('div');
  messageEl.className = `message ${isOwn ? 'own' : ''}`;

  const time = formatTime(data.timestamp);
  const fileSize = formatFileSize(data.fileSize);
  const isImage = data.fileType.startsWith('image/');
  const isVideo = data.fileType.startsWith('video/');

  let fileContent = '';
  if (isImage) {
    fileContent = `<img src="${data.fileUrl}" class="file-image" alt="${escapeHtml(data.fileName)}" onclick="openImageModal('${data.fileUrl}')">`;
  } else if (isVideo) {
    fileContent = `<video src="${data.fileUrl}" class="file-video" controls></video>`;
  } else {
    const icon = getFileIcon(data.fileType);
    fileContent = `
      <a href="${data.fileUrl}" download="${escapeHtml(data.fileName)}" class="file-message" style="text-decoration: none; color: inherit;">
        <div class="file-icon">${icon}</div>
        <div class="file-info">
          <div class="file-name">${escapeHtml(data.fileName)}</div>
          <div class="file-size">${fileSize}</div>
        </div>
      </a>
    `;
  }

  messageEl.innerHTML = `
    <div class="message-header">
      <span class="message-username" style="color: ${data.color}">${escapeHtml(data.username)}</span>
      <span class="message-time">${time}</span>
    </div>
    ${fileContent}
  `;

  messagesContainer.appendChild(messageEl);
  scrollToBottom();
}

function addSystemMessage(text) {
  const messageEl = document.createElement('div');
  messageEl.className = 'message system';
  messageEl.textContent = text;
  messagesContainer.appendChild(messageEl);
  scrollToBottom();
}

// Actualizar lista de usuarios
function updateUsersList(users) {
  usersList.innerHTML = users.map(user => `
    <li>
      <div class="user-avatar" style="background: ${user.color}">${user.username.charAt(0).toUpperCase()}</div>
      <span class="user-name">${escapeHtml(user.username)}</span>
    </li>
  `).join('');
}

// Indicador de escritura
function showTypingIndicator(data) {
  if (data.isTyping) {
    typingText.textContent = `${data.username} está escribiendo...`;
    typingIndicator.classList.remove('hidden');
  } else {
    typingIndicator.classList.add('hidden');
  }
}

// Scroll automático
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Utilidades
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(mimetype) {
  if (mimetype.includes('pdf')) return '📄';
  if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
  if (mimetype.includes('zip') || mimetype.includes('rar')) return '📦';
  if (mimetype.includes('audio')) return '🎵';
  return '📎';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openImageModal(url) {
  modalImage.src = url;
  imageModal.classList.remove('hidden');
}

// Notificaciones
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notifications.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Atajos de teclado
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!imageModal.classList.contains('hidden')) {
      imageModal.classList.add('hidden');
    }
  }
});

// Si hay un código de sala en la URL, activar pestaña unirse
if (roomIdFromUrl) {
  document.querySelector('[data-tab="join"]').click();
  roomIdInput.value = roomIdFromUrl;
}

// ==================== REPRODUCTOR MULTIMEDIA ====================

// Elementos del reproductor
const playerPanel = document.querySelector('.player-panel');
const btnTogglePlayer = document.getElementById('btn-toggle-player');
const playerIframe = document.getElementById('player-iframe');
const playerPlaceholder = document.getElementById('player-placeholder');
const videoUrlInput = document.getElementById('video-url-input');
const btnAddVideo = document.getElementById('btn-add-video');
const playlist = document.getElementById('playlist');
const playlistCount = document.getElementById('playlist-count');

// Estado del reproductor
let playlistItems = [];
let currentVideoIndex = -1;

// Toggle del panel del reproductor
btnTogglePlayer.addEventListener('click', () => {
  playerPanel.classList.toggle('collapsed');
  const isCollapsed = playerPanel.classList.contains('collapsed');
  btnTogglePlayer.innerHTML = isCollapsed 
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>';
});

// Agregar video a la lista
btnAddVideo.addEventListener('click', addVideo);
videoUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addVideo();
});

function addVideo() {
  const url = videoUrlInput.value.trim();
  if (!url) return;

  const embedUrl = getEmbedUrl(url);
  if (!embedUrl) {
    showNotification('URL no soportada. Usa YouTube, Vimeo o enlaces directos.', 'error');
    return;
  }

  const videoItem = {
    id: Date.now(),
    url: url,
    embedUrl: embedUrl,
    title: getVideoTitle(url),
    type: getVideoType(url)
  };

  playlistItems.push(videoItem);
  renderPlaylist();
  videoUrlInput.value = '';
  showNotification('Video agregado a la lista', 'success');

  // Si es el primer video, reproducirlo
  if (playlistItems.length === 1) {
    playVideo(0);
  }
}

// Obtener URL de embebido según la plataforma
function getEmbedUrl(url) {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=0`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Dailymotion
  const dailymotionMatch = url.match(/dailymotion\.com\/video\/([^&\s]+)/);
  if (dailymotionMatch) {
    return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`;
  }

  // Twitch
  const twitchMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
  if (twitchMatch) {
    return `https://player.twitch.tv/?video=${twitchMatch[1]}&parent=${window.location.hostname}`;
  }

  // Enlaces directos de video (.mp4, .webm, .ogg)
  if (/\.(mp4|webm|ogg|mov)$/i.test(url)) {
    return url;
  }

  return null;
}

// Obtener título del video (simplificado)
function getVideoTitle(url) {
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (youtubeMatch) {
    return `YouTube Video (${youtubeMatch[1].substring(0, 8)}...)`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `Vimeo Video (${vimeoMatch[1]})`;
  }

  if (url.includes('dailymotion')) return 'Dailymotion Video';
  if (url.includes('twitch')) return 'Twitch Video';
  if (/\.(mp4|webm|ogg)$/i.test(url)) {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  return 'Video sin título';
}

// Obtener tipo de video
function getVideoType(url) {
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo')) return 'vimeo';
  if (url.includes('dailymotion')) return 'dailymotion';
  if (url.includes('twitch')) return 'twitch';
  if (/\.(mp4|webm|ogg)$/i.test(url)) return 'direct';
  return 'unknown';
}

// Renderizar lista de reproducción
function renderPlaylist() {
  if (playlistItems.length === 0) {
    playlist.innerHTML = `
      <li class="playlist-empty">
        <span class="playlist-empty-icon">📋</span>
        <p>Lista vacía</p>
        <p style="font-size: 11px; margin-top: 5px;">Agrega enlaces de videos</p>
      </li>
    `;
    playlistCount.textContent = '0 videos';
    return;
  }

  playlist.innerHTML = playlistItems.map((item, index) => `
    <li class="playlist-item ${index === currentVideoIndex ? 'active' : ''}" data-index="${index}">
      <span class="playlist-item-number">${index + 1}</span>
      <div class="playlist-item-info">
        <div class="playlist-item-title">${escapeHtml(item.title)}</div>
        <div class="playlist-item-duration">${item.type.toUpperCase()}</div>
      </div>
      <button class="playlist-item-remove" data-index="${index}" title="Eliminar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </li>
  `).join('');

  playlistCount.textContent = `${playlistItems.length} video${playlistItems.length !== 1 ? 's' : ''}`;

  // Event listeners para los items
  playlist.querySelectorAll('.playlist-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.playlist-item-remove')) return;
      const index = parseInt(item.dataset.index);
      playVideo(index);
    });
  });

  playlist.querySelectorAll('.playlist-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      removeVideo(index);
    });
  });
}

// Reproducir video
function playVideo(index) {
  if (index < 0 || index >= playlistItems.length) return;

  currentVideoIndex = index;
  const item = playlistItems[index];

  // Si es un enlace directo de video, usar video tag
  if (item.type === 'direct') {
    playerIframe.src = '';
    playerIframe.style.display = 'none';
    // Crear elemento de video para enlaces directos
    let videoPlayer = document.getElementById('direct-video-player');
    if (!videoPlayer) {
      videoPlayer = document.createElement('video');
      videoPlayer.id = 'direct-video-player';
      videoPlayer.controls = true;
      videoPlayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
      document.querySelector('.player-video-container').appendChild(videoPlayer);
    }
    videoPlayer.src = item.url;
    videoPlayer.style.display = 'block';
    playerPlaceholder.classList.add('hidden');
  } else {
    // Para plataformas embebidas
    let videoPlayer = document.getElementById('direct-video-player');
    if (videoPlayer) {
      videoPlayer.style.display = 'none';
      videoPlayer.src = '';
    }
    playerIframe.style.display = 'block';
    playerIframe.src = item.embedUrl;
    playerPlaceholder.classList.add('hidden');
  }

  renderPlaylist();
}

// Eliminar video de la lista
function removeVideo(index) {
  playlistItems.splice(index, 1);
  
  if (currentVideoIndex === index) {
    // Si se eliminó el video actual, detener reproducción
    playerIframe.src = '';
    playerPlaceholder.classList.remove('hidden');
    currentVideoIndex = -1;
  } else if (currentVideoIndex > index) {
    currentVideoIndex--;
  }

  renderPlaylist();
  showNotification('Video eliminado', 'info');
}

// Inicializar lista vacía
renderPlaylist();

// ==================== VIDEO PLAYER ====================

// Detectar URLs de video en mensajes
function isVideoUrl(url) {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|vimeo\.com\/|dailymotion\.com\/video\/|twitch\.tv\/videos\/|\.(mp4|webm|ogg|mov)(?:\?|$))/i.test(url);
}

// Obtener tipo de video
function getVideoSourceType(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  if (/dailymotion\.com/i.test(url)) return 'dailymotion';
  if (/twitch\.tv/i.test(url)) return 'twitch';
  if (/\.(mp4|webm|ogg|mov)/i.test(url)) return 'direct';
  return null;
}

// Obtener URL embebida
function getVideoEmbedUrl(url) {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  
  // Dailymotion
  const dmMatch = url.match(/dailymotion\.com\/video\/([^&\s]+)/);
  if (dmMatch) return `https://www.dailymotion.com/embed/video/${dmMatch[1]}`;
  
  // Twitch
  const twMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
  if (twMatch) return `https://player.twitch.tv/?video=${twMatch[1]}&parent=${window.location.hostname}`;
  
  // Directo
  if (/\.(mp4|webm|ogg|mov)/i.test(url)) return url;
  
  return null;
}

// Crear elemento de video para mensaje
function createVideoElement(url, embedUrl, type) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';
  
  if (type === 'direct') {
    const video = document.createElement('video');
    video.src = embedUrl;
    video.controls = true;
    video.style.width = '100%';
    video.style.maxHeight = '300px';
    
    const fsBtn = document.createElement('button');
    fsBtn.className = 'fullscreen-btn';
    fsBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>';
    fsBtn.onclick = () => openVideoModal(embedUrl, type);
    
    wrapper.appendChild(video);
    wrapper.appendChild(fsBtn);
  } else {
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.width = '100%';
    iframe.style.aspectRatio = '16/9';
    
    wrapper.appendChild(iframe);
  }
  
  return wrapper;
}

// Modal de video
function openVideoModal(url, type) {
  let modal = document.getElementById('video-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'video-modal';
    modal.className = 'video-modal';
    modal.innerHTML = `
      <div class="video-modal-content">
        <button class="video-modal-close">&times;</button>
        <div id="video-modal-player"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('.video-modal-close').onclick = () => closeVideoModal();
    modal.onclick = (e) => {
      if (e.target === modal) closeVideoModal();
    };
  }
  
  const player = document.getElementById('video-modal-player');
  player.innerHTML = '';
  
  if (type === 'direct') {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    player.appendChild(video);
  } else {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.width = '100%';
    iframe.style.aspectRatio = '16/9';
    player.appendChild(iframe);
  }
  
  modal.classList.add('active');
}

function closeVideoModal() {
  const modal = document.getElementById('video-modal');
  if (modal) {
    modal.classList.remove('active');
    document.getElementById('video-modal-player').innerHTML = '';
  }
}

// Detectar video en mensaje de texto
function detectVideoInMessage(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex);
  
  if (urls) {
    for (const url of urls) {
      if (isVideoUrl(url)) {
        return url;
      }
    }
  }
  return null;
}

// Modificar sendMessage para detectar videos
const originalSendMessage = sendMessage;
sendMessage = function() {
  const message = messageInput.value.trim();
  if (!message) return;
  
  const videoUrl = detectVideoInMessage(message);
  
  if (videoUrl && isVideoUrl(videoUrl)) {
    const embedUrl = getVideoEmbedUrl(videoUrl);
    const type = getVideoSourceType(videoUrl);
    
    if (embedUrl) {
      socket.emit('file shared', {
        fileUrl: embedUrl,
        fileName: type.toUpperCase(),
        fileSize: 0,
        fileType: 'video/' + type
      });
      messageInput.value = '';
      return;
    }
  }
  
  originalSendMessage();
};

// Drag & drop para videos
const dragOverlay = document.createElement('div');
dragOverlay.className = 'drag-overlay';
dragOverlay.innerHTML = `
  <div class="drag-overlay-content">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <p>Suelta el video aquí</p>
  </div>
`;
document.body.appendChild(dragOverlay);

let dragCounter = 0;

document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragCounter++;
  if (e.dataTransfer.types.includes('Files')) {
    dragOverlay.classList.add('active');
  }
});

document.addEventListener('dragover', (e) => e.preventDefault());

document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) dragOverlay.classList.remove('active');
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  dragCounter = 0;
  dragOverlay.classList.remove('active');
  
  const files = e.dataTransfer.files;
  for (const file of files) {
    if (file.type.startsWith('video/')) {
      uploadVideoWithProgress(file);
    }
  }
});

// Subir video con barra de progreso
function uploadVideoWithProgress(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const xhr = new XMLHttpRequest();
  
  const progressEl = document.createElement('div');
  progressEl.className = 'message system';
  progressEl.innerHTML = `
    <div style="padding:10px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2">
          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
        </svg>
        <span style="flex:1;font-size:13px;">${escapeHtml(file.name)}</span>
      </div>
      <div class="upload-progress-bar">
        <div class="upload-progress-fill" style="width:0%"></div>
      </div>
      <div class="upload-progress-text">0%</div>
    </div>
  `;
  messagesContainer.appendChild(progressEl);
  scrollToBottom();
  
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      const fill = progressEl.querySelector('.upload-progress-fill');
      const text = progressEl.querySelector('.upload-progress-text');
      if (fill) fill.style.width = percent + '%';
      if (text) text.textContent = percent + '%';
    }
  });
  
  xhr.addEventListener('load', () => {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      if (data.success) {
        progressEl.remove();
        socket.emit('file shared', {
          fileUrl: data.fileUrl,
          fileName: data.originalName,
          fileSize: data.size,
          fileType: data.mimetype
        });
        showNotification('Video enviado', 'success');
      } else {
        progressEl.innerHTML = '<p style="color:#e74c3c;">Error al subir</p>';
      }
    } else {
      progressEl.innerHTML = '<p style="color:#e74c3c;">Error al subir</p>';
    }
  });
  
  xhr.addEventListener('error', () => {
    progressEl.innerHTML = '<p style="color:#e74c3c;">Error de conexión</p>';
  });
  
  xhr.open('POST', '/upload');
  xhr.send(formData);
}

// Modificar handleFileSelect para videos
const originalHandleFileSelect = handleFileSelect;
handleFileSelect = async function(e) {
  const files = e.target.files;
  if (files.length === 0) return;

  for (const file of files) {
    if (file.type.startsWith('video/')) {
      uploadVideoWithProgress(file);
    } else {
      await uploadFile(file);
    }
  }
  fileInput.value = '';
};

// ==================== AUDIO CALL ====================

// Elementos de llamada
const callBar = document.getElementById('call-bar');
const callText = document.getElementById('call-text');
const callParticipants = document.getElementById('call-participants');
const btnMute = document.getElementById('btn-mute');
const btnHangup = document.getElementById('btn-hangup');

// Estado de la llamada
let isCallActive = false;
let isMuted = false;
let localAudioStream = null;
let peerConnectionsAudio = new Map();
let localScreenStream = null;

// Configuración ICE
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Iniciar pantalla compartida con audio
async function startScreenShareWithAudio() {
  try {
    localScreenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: true
    });

    try {
      localAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
    } catch (micErr) {
      console.log('Micrófono no disponible');
    }

    sharedScreenVideo.srcObject = localScreenStream;
    screenShareContainer.classList.remove('hidden');
    screenShareContainer.classList.add('with-audio');
    btnShareScreen.classList.add('hidden');
    btnStopShare.classList.remove('hidden');
    screenShareInfo.textContent = 'Compartiendo pantalla con audio';

    startCall();
    socket.emit('screen share started');

    localScreenStream.getVideoTracks()[0].onended = () => {
      stopScreenShareWithAudio();
    };

    showNotification('Compartiendo pantalla con audio', 'success');
  } catch (err) {
    console.error('Error:', err);
    showNotification('No se pudo compartir la pantalla', 'error');
  }
}

// Detener pantalla compartida con audio
function stopScreenShareWithAudio() {
  if (localScreenStream) {
    localScreenStream.getTracks().forEach(track => track.stop());
    localScreenStream = null;
  }
  if (localAudioStream) {
    localAudioStream.getTracks().forEach(track => track.stop());
    localAudioStream = null;
  }

  sharedScreenVideo.srcObject = null;
  screenShareContainer.classList.add('hidden');
  screenShareContainer.classList.remove('with-audio');
  btnShareScreen.classList.remove('hidden');
  btnStopShare.classList.add('hidden');

  endCall();
  socket.emit('screen share stopped');
}

// Iniciar llamada
function startCall() {
  isCallActive = true;
  callBar.classList.add('active');
  callText.textContent = 'En llamada';
}

// Terminar llamada
function endCall() {
  isCallActive = false;
  isMuted = false;
  callBar.classList.remove('active');
  callParticipants.innerHTML = '';
  btnMute.classList.remove('muted');

  peerConnectionsAudio.forEach(pc => pc.close());
  peerConnectionsAudio.clear();
}

// Silenciar/Activar micrófono
btnMute.addEventListener('click', () => {
  isMuted = !isMuted;
  btnMute.classList.toggle('muted', isMuted);
  
  if (localAudioStream) {
    localAudioStream.getAudioTracks().forEach(track => {
      track.enabled = !isMuted;
    });
  }
  
  socket.emit('mute toggled', { isMuted });
});

// Colgar
btnHangup.addEventListener('click', () => {
  stopScreenShareWithAudio();
});

// Modificar botones de compartir pantalla
btnShareScreen.addEventListener('click', startScreenShareWithAudio);
btnStopShare.addEventListener('click', stopScreenShareWithAudio);

// Eventos de Socket para llamadas
socket.on('mute toggled', (data) => {
  // Actualizar indicador en lista de usuarios
});

// WebRTC para audio - crear oferta
async function createAudioOffer(targetId) {
  const pc = new RTCPeerConnection(iceServers);
  peerConnectionsAudio.set(targetId, pc);

  if (localAudioStream) {
    localAudioStream.getTracks().forEach(track => {
      pc.addTrack(track, localAudioStream);
    });
  }

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc ice candidate', {
        target: targetId,
        candidate: event.candidate
      });
    }
  };

  pc.ontrack = (event) => {
    let remoteAudio = document.getElementById(`remote-audio-${targetId}`);
    if (!remoteAudio) {
      remoteAudio = document.createElement('audio');
      remoteAudio.id = `remote-audio-${targetId}`;
      remoteAudio.autoplay = true;
      remoteAudio.style.display = 'none';
      document.body.appendChild(remoteAudio);
    }
    remoteAudio.srcObject = event.streams[0];
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit('webrtc offer', {
    target: targetId,
    offer: offer
  });
}

// Manejar oferta WebRTC
socket.on('webrtc offer', async (data) => {
  const pc = new RTCPeerConnection(iceServers);
  peerConnectionsAudio.set(data.sender, pc);

  if (localAudioStream) {
    localAudioStream.getTracks().forEach(track => {
      pc.addTrack(track, localAudioStream);
    });
  }

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc ice candidate', {
        target: data.sender,
        candidate: event.candidate
      });
    }
  };

  pc.ontrack = (event) => {
    let remoteAudio = document.getElementById(`remote-audio-${data.sender}`);
    if (!remoteAudio) {
      remoteAudio = document.createElement('audio');
      remoteAudio.id = `remote-audio-${data.sender}`;
      remoteAudio.autoplay = true;
      remoteAudio.style.display = 'none';
      document.body.appendChild(remoteAudio);
    }
    remoteAudio.srcObject = event.streams[0];
  };

  await pc.setRemoteDescription(data.offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit('webrtc answer', {
    target: data.sender,
    answer: answer
  });
});

// Manejar respuesta WebRTC
socket.on('webrtc answer', async (data) => {
  const pc = peerConnectionsAudio.get(data.sender);
  if (pc) {
    await pc.setRemoteDescription(data.answer);
  }
});

// Manejar candidatos ICE
socket.on('webrtc ice candidate', async (data) => {
  const pc = peerConnectionsAudio.get(data.sender);
  if (pc) {
    await pc.addIceCandidate(data.candidate);
  }
});

// ==================== VENICE.AI - GENERADOR DE IMÁGENES ====================

// Elementos de Venice
const btnVenice = document.getElementById('btn-venice');
const veniceModal = document.getElementById('venice-modal');
const veniceModalClose = document.querySelector('.venice-modal-close');
const venicePrompt = document.getElementById('venice-prompt');
const veniceModel = document.getElementById('venice-model');
const veniceSize = document.getElementById('venice-size');
const veniceStyle = document.getElementById('venice-style');
const veniceNegative = document.getElementById('venice-negative');
const btnVeniceGenerate = document.getElementById('btn-venice-generate');
const veniceResult = document.getElementById('venice-result');
const veniceActions = document.getElementById('venice-actions');
const veniceRegenerate = document.getElementById('venice-regenerate');
const veniceSendChat = document.getElementById('venice-send-chat');
const veniceDownload = document.getElementById('venice-download');

// Estado de Venice
let currentImageUrl = null;
let currentPrompt = null;
let isGenerating = false;

// Abrir modal de Venice
btnVenice.addEventListener('click', () => {
  veniceModal.classList.add('active');
  venicePrompt.focus();
});

// Cerrar modal
veniceModalClose.addEventListener('click', () => {
  veniceModal.classList.remove('active');
});

veniceModal.addEventListener('click', (e) => {
  if (e.target === veniceModal) {
    veniceModal.classList.remove('active');
  }
});

// Generar imagen
btnVeniceGenerate.addEventListener('click', generateImage);
venicePrompt.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    generateImage();
  }
});

async function generateImage() {
  const prompt = venicePrompt.value.trim();
  if (!prompt || isGenerating) return;

  isGenerating = true;
  currentPrompt = prompt;

  // Mostrar loading
  btnVeniceGenerate.disabled = true;
  btnVeniceGenerate.innerHTML = '<span class="spinner"></span> Generando...';
  veniceResult.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Generando imagen...</p>
      <p style="font-size: 12px; margin-top: 8px;">Esto puede tomar unos segundos</p>
    </div>
  `;
  veniceActions.style.display = 'none';

  // Obtener valores
  const [width, height] = veniceSize.value.split('x').map(Number);
  const model = veniceModel.value;
  const style = veniceStyle.value;
  const negativePrompt = veniceNegative.value.trim();

  try {
    const response = await fetch('/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        model,
        width,
        height,
        negativePrompt,
        style
      })
    });

    const data = await response.json();

    if (data.success && data.imageUrl) {
      currentImageUrl = data.imageUrl;
      
      // Mostrar imagen
      veniceResult.innerHTML = `<img src="${data.imageUrl}" alt="Imagen generada">`;
      veniceActions.style.display = 'flex';
      
      showNotification('Imagen generada correctamente', 'success');
    } else {
      throw new Error(data.error || 'Error generando imagen');
    }
  } catch (err) {
    console.error('Error:', err);
    veniceResult.innerHTML = `
      <div class="venice-placeholder">
        <span class="placeholder-icon">❌</span>
        <p>Error: ${err.message}</p>
        <p style="font-size: 12px; margin-top: 8px;">Verifica tu API key de Venice.ai</p>
      </div>
    `;
    showNotification('Error generando imagen', 'error');
  } finally {
    isGenerating = false;
    btnVeniceGenerate.disabled = false;
    btnVeniceGenerate.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      Generar Imagen
    `;
  }
}

// Regenerar imagen
veniceRegenerate.addEventListener('click', () => {
  if (currentPrompt) {
    generateImage();
  }
});

// Enviar imagen al chat
veniceSendChat.addEventListener('click', () => {
  if (currentImageUrl) {
    socket.emit('file shared', {
      fileUrl: currentImageUrl,
      fileName: 'Imagen IA: ' + (currentPrompt?.substring(0, 50) || ''),
      fileSize: 0,
      fileType: 'image/venice'
    });
    veniceModal.classList.remove('active');
    showNotification('Imagen enviada al chat', 'success');
  }
});

// Descargar imagen
veniceDownload.addEventListener('click', () => {
  if (currentImageUrl) {
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `venice-${Date.now()}.png`;
    link.target = '_blank';
    link.click();
  }
});

// Comando rápido /imagen
const originalSendMessageVenice = sendMessage;
sendMessage = function() {
  const message = messageInput.value.trim();
  
  // Detectar comando /imagen
  if (message.startsWith('/imagen ')) {
    const prompt = message.substring(8);
    if (prompt) {
      veniceModal.classList.add('active');
      venicePrompt.value = prompt;
      messageInput.value = '';
      return;
    }
  }
  
  originalSendMessageVenice();
};
