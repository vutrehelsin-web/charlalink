# 📖 INSTRUCTIVO DE USO - Chat Privado

## 🚀 Inicio Rápido

1. Ejecuta `iniciar.bat` (o `iniciar-publico.bat` para compartir por internet)
2. Abre tu navegador en **http://localhost:4000**
3. ¡Listo para chatear!

---

## 🏠 1. CREAR UNA SALA

Es el punto de partida para chatear con otras personas.

1. En la pantalla principal, pestaña **"Crear Sala"**:
   - Elige tu **avatar** haciendo clic en el emoji 😀
   - Escribe tu **nombre de usuario** (obligatorio, máx. 20 caracteres)
   - Opcional: escribe una **bio** y el **nombre de la sala**
2. Haz clic en **"Crear Sala"**
3. Se generará un **código de 6 letras** (ej: `ABC123`)
4. ¡Comparte ese código con quien quieras que se una!

> 💡 **Consejo:** El código distingue mayúsculas/minúsculas. Solo usa letras y números.

---

## 🔗 2. UNIRSE A UNA SALA (Invitación por Código)

Para entrar a una sala existente:

### Método 1: Por código
1. Pestaña **"Unirse"**
2. Escribe tu **nombre de usuario**
3. Ingresa el **código de sala** de 6 caracteres
4. Haz clic en **"Unirse"**

### Método 2: Por enlace directo
- Si te enviaron un enlace como `http://localhost:4000/?room=ABC123`
- Al abrirlo, el código se carga automáticamente
- Solo escribe tu nombre y haz clic en "Unirse"

---

## 💬 3. CHATO EN TIEMPO REAL

Una vez dentro de una sala:

- **Enviar mensaje:** Escribe en el campo de texto y presiona Enter o clic en ➤
- **Enviar archivo:** Clic en 📎 y selecciona un archivo (imagen, video, documento)
- **Mensaje de voz:** Clic en 🎙️ para grabar audio
- **Compartir pantalla:** Clic en 🖥️ para transmitir tu pantalla
- **Notificaciones:** Verás quién se une/sale del chat

---

## 🎬 4. REPRODUCTOR DE VIDEOS

El panel lateral derecho incluye un reproductor multimedia.

### Agregar videos:
1. Clic en **"Agregar Video"** (botón +)
2. Pega una URL de:
   - **YouTube** (youtube.com/watch?v=... o youtu.be/...)
   - **Vimeo** (vimeo.com/...)
   - **Dailymotion** (dailymotion.com/video/...)
   - **Twitch** (twitch.tv/videos/...)
   - **Enlaces directos** (.mp4, .webm, .ogg)
3. Presiona Enter o clic en "+"

### Controles del reproductor:
- **Play/Pause:** Clic en un video de la lista
- **Eliminar:** Clic en ✕ junto al video
- **Colapsar panel:** Clic en la flecha ▲/▼
- **Pantalla completa:** Clic en el botón expandir del video

### Compartir video en el chat:
- Escribe o pega una URL de video en el chat
- Se detecta automáticamente y se envía como mensaje especial
- Los demás pueden verlo directamente en el chat

---

## 📢 5. FOROS DE DEBATE

Espacios temáticos para discusiones grupales.

### Explorar foros:
1. Pestaña **"Foros"** → **"Explorar"**
2. Navega por categorías:
   - 💻 Tecnología
   - 🎮 Gaming
   - 🔬 Ciencia
   - 🎨 Arte y Diseño
   - 🎵 Música
   - 🎬 Cine y Series
   - ⚽ Deportes
   - 🍕 Gastronomía
   - ✈️ Viajes
   - 🎲 Random
3. Clic en un foro para unirte

### Crear un foro:
1. Pestaña **"Foros"** → **"Crear Foro"**
2. Completa:
   - **Nombre** del foro
   - **Descripción** (opcional)
   - **Categoría** (selecciona una)
3. Clic en **"Crear Foro"**
4. Se genera un código para compartir

### Chatear en un foro:
- Igual que una sala normal
- Los mensajes se guardan en el historial del foro
- Puedes ver los miembros del foro en la lista

---

## 🎨 6. GENERADOR DE IMÁGENES (Venice.ai)

Crea imágenes con inteligencia artificial.

1. Clic en el botón **"🎨 Generar Imagen"** (barra lateral)
2. En el modal:
   - Escribe un **prompt** descriptivo
   - Elige un **modelo**:
     - Flux Dev (rápido)
     - Flux Dev Uncensored
     - Qwen Turbo
     - Stable Diffusion 3.5
   - Selecciona **tamaño** (512x512 a 1536x1024)
   - Elige un **estilo** (fotorealista, anime, cyberpunk, etc.)
   - Opcional: escribe un **prompt negativo**
3. Clic en **"Generar Imagen"**
4. Espera unos segundos
5. Puedes:
   - **Regenerar** otra imagen
   - **Enviar al chat** para compartir
   - **Descargar** la imagen

### Comando rápido:
- Escribe `/imagen tu descripción aquí` en el chat
- Se abre el generador con el prompt precargado

---

## 👤 7. PERFIL DE USUARIO

Personaliza tu identidad en el chat.

### Configurar perfil:
1. En la pantalla de login:
   - Clic en el **avatar** para elegir entre 80 emojis
   - Escribe una **bio** (máx. 100 caracteres)
2. El perfil se guarda automáticamente

### Ver perfiles:
- Clic en el nombre de un usuario en la lista
- Se muestra su avatar, bio y estado

---

## 🖥️ 8. COMPARTIR PANTALLA

Para mostrar tu pantalla a otros en la sala:

1. Clic en el botón **"🖥️ Compartir Pantalla"** (barra de herramientas)
2. Elige qué compartir:
   - Pantalla completa
   - Ventana específica
   - Pestaña del navegador
3. Activa **"Compartir audio"** si quieres incluir sonido
4. Clic en **"Compartir"**
5. Para detener: clic en **"⏹️ Detener"**

> ⚠️ **Nota:** Requiere HTTPS para funcionar en producción.

---

## 🎙️ 9. MENSAJES DE VOZ

Envía notas de audio rápidas:

1. Mantén presionado el botón **"🎙️"** (micrófono)
2. Habla mientras grabas
3. Suelta para enviar
4. Para **cancelar:** desliza hacia arriba antes de soltar

---

## 📁 10. COMPARTIR ARCHIVOS

Envía documentos, imágenes y más:

1. Clic en **"📎"** (clip) en la barra de entrada
2. Selecciona un archivo (máx. 100 MB)
3. Formatos permitidos:
   - **Imágenes:** JPG, PNG, GIF
   - **Videos:** MP4, WebM
   - **Audio:** MP3, WAV, OGG
   - **Documentos:** PDF, DOC, DOCX
   - **Comprimidos:** ZIP, RAR
4. El archivo se sube y se comparte en el chat

### Drag & Drop:
- Arrastra un archivo directamente sobre el chat
- Suelta para subir automáticamente

---

## 🔔 11. NOTIFICACIONES

El sistema muestra avisos para:
- ✅ Acciones exitosas (verde)
- ❌ Errores (rojo)
- ℹ️ Información (azul)
- ⚠️ Advertencias (amarillo)

Aparecen en la esquina superior derecha y desaparecen solas.

---

## ⌨️ 12. ATAJOS Y COMANDOS

| Acción | Cómo |
|---|---|
| Enviar mensaje | `Enter` |
| Nueva línea | `Shift + Enter` |
| Generar imagen | `/imagen descripción` |
| Grabar audio | Mantener `🎙️` |
| Dejar sala | Clic en `🚪 Salir` |
| Copiar código | Clic en `📋 Copiar` |

---

## 🌐 13. COMPARTIR POR INTERNET (Opcional)

Para que otros se conecten desde fuera de tu red:

1. Ejecuta **`iniciar-publico.bat`**
2. Se abre el servidor + un túnel con LocalTunnel
3. Te dará una URL pública tipo `https://nombre.loca.lt`
4. Comparte esa URL con quien quieras

> ⚠️ El túnel puede tardar unos segundos en estar listo.

---

## ❓ SOLUCIÓN DE PROBLEMAS

| Problema | Solución |
|---|---|
| "Código inválido" | Verifica que el código tenga 6 caracteres |
| No carga el video | Comprueba que la URL sea válida |
| No puedo grabar audio | Revisa los permisos del micrófono |
| La pantalla no se comparte | Requiere HTTPS o localhost |
| Error de conexión | Reinicia el servidor con `iniciar.bat` |

---

## 📱 14. DISPOSITIVOS MÓVILES

La página es responsive y funciona en móviles:
- Menú lateral colapsable
- Reproductor adaptable
- Teclado optimizado para chat

---

**¡Disfruta tu Chat Privado! 🎉**
