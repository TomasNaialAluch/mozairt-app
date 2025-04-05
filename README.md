# 🎹 MozAIrt – Generador Musical con Inteligencia Artificial

MozAIrt es una herramienta web para productores de música electrónica que combina **inteligencia artificial**, **Spotify** y **Magenta.js** para crear archivos **MIDI personalizados** a partir de géneros o canciones reales.

---

## 🚀 Funcionalidades principales

- 🔍 **Búsqueda real en Spotify** (OAuth 2.0)
- 🎧 **Selección de tracks o géneros musicales**
- 🧠 **Asistente interactivo con mensajes enriquecidos**
- 🎼 **Generación de archivos MIDI desde cero o inspirados en referencias**
- 💾 **Descarga directa del archivo generado**
- 🎛️ **Visualización y personalización en desarrollo**

---

## 🖥️ Cómo correr el proyecto localmente

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/TomasNaialAluch/mozairt-app.git
   cd mozairt-app
   ```

2. Instalar extensiones recomendadas si usás VS Code (Live Server, Prettier).

3. Lanzar con Live Server desde la carpeta `public`.

4. Para conexión Spotify:

   - Crear una app en [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Agregar como redirect URI:  
     `http://localhost:5500`

   - Copiar tu `Client ID` y reemplazar en el HTML:

     ```js
     const SPOTIFY_CLIENT_ID = "TU_CLIENT_ID";
     ```

---

## 📁 Estructura de carpetas

```
mozairt-app/
├── Documentos/
│   └── Mejoras/
├── public/
│   ├── seleccion-referencias.html
│   ├── personalizacion-midi.html
│   └── ...
├── frases.json
├── README.md
```

---

## ✨ Tecnologías utilizadas

- [Magenta.js](https://magenta.tensorflow.org/js)  
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- HTML5, CSS3, JavaScript
- Bootstrap 5

---

## 🧩 En desarrollo

- 🎛️ Personalización avanzada de parámetros MIDI
- 🎹 Visualización de MIDI en tiempo real
- 🎵 Modo chat real con OpenAI
- 🎶 Análisis de tracks reales
- 📦 Versión escritorio (Electron.js)

---

## 📸 Vista previa

*(Podés incluir capturas o un GIF mostrando la app en acción)*

---

## 📄 Licencia

MIT © [Naial](https://github.com/TomasNaialAluch)
