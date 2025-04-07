class PianoRoll {
  constructor(containerId, options = {}) {
    // Configuración predeterminada para un estilo tipo FL Studio
    this.defaultOptions = {
      width: 800,
      height: 300,
      notes: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
      octaves: 5,
      startOctave: 2,
      backgroundColor: '#2e2e2e',  // Fondo oscuro
      gridColor: '#555',           // Cuadrícula oscura
      noteColor: '#ffb347',        // Color de las notas
      keyAreaWidth: 40,            // Área para teclas laterales
      timelineHeight: 20,          // Altura para la línea de tiempo
      zoom: 1,                     // Factor de zoom inicial
      offsetX: 0,                  // Desplazamiento horizontal (scroll)
      gridDivision: 16,            // Resolución: subdivisiones por compás
      ghostNotes: []               // Opcional: array de notas "fantasma" (por ejemplo, de otro canal)
    };
    this.options = { ...this.defaultOptions, ...options };

    // Propiedades para suavizado (interpolación de zoom y scroll)
    this.targetZoom = this.options.zoom;
    this.targetOffsetX = this.options.offsetX;

    // Modo de agregar notas (si true, al hacer clic se añade una nota sin intentar seleccionar)
    this.noteMode = false;

    // Elemento contenedor
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Contenedor con ID ${containerId} no encontrado`);
      return;
    }

    // Estado de notas y edición
    this.activeNotes = [];
    this.isPlaying = false;
    this.selectedNote = null;
    this.dragOffset = { x: 0, y: 0 };
    this.isDragging = false;
    this.isScrolling = false;
    this.scrollStart = { x: 0, offsetX: 0 };

    this.createCanvas();
    this.setupEvents();
    this.animateProperties(); // Inicia el suavizado (si es necesario)
    this.draw();
  }

  createCanvas() {
    // El canvas incluye la línea de tiempo en la altura total
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width + this.options.keyAreaWidth;
    this.canvas.height = this.options.height + this.options.timelineHeight;
    this.canvas.style.backgroundColor = this.options.backgroundColor;
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  // Función principal de dibujo
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawTimeline();
    this.drawKeyArea();
    this.drawGrid();
    this.drawGhostNotes(); // Dibujar ghost notes (si existen)
    this.drawNotes();
  }

  // Dibujar la línea de tiempo
  drawTimeline() {
    const { timelineHeight, keyAreaWidth, width, zoom, offsetX, gridDivision } = this.options;
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(keyAreaWidth, 0, width, timelineHeight);
    this.ctx.fillStyle = '#fff';
    const beatWidth = (width / gridDivision) * zoom;
    for (let i = 0; i <= gridDivision; i++) {
      let x = keyAreaWidth + i * beatWidth - offsetX;
      if (x < keyAreaWidth) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, timelineHeight);
      this.ctx.strokeStyle = (i % 4 === 0) ? '#fff' : '#aaa';
      this.ctx.lineWidth = (i % 4 === 0) ? 2 : 1;
      this.ctx.stroke();
      this.ctx.font = '10px Arial';
      this.ctx.fillText(i, x + 2, 12);
    }
  }

  // Dibujar el área de teclas
  drawKeyArea() {
    const { keyAreaWidth, notes, octaves, startOctave, height, timelineHeight } = this.options;
    const noteHeight = height / (notes.length * octaves);
    for (let i = 0; i < notes.length * octaves; i++) {
      const y = timelineHeight + i * noteHeight;
      const octave = Math.floor(i / notes.length) + startOctave;
      const noteName = notes[i % notes.length];
      const isBlack = noteName.includes('#');
      this.ctx.fillStyle = isBlack ? '#444' : '#666';
      this.ctx.fillRect(0, y, keyAreaWidth, noteHeight);
      if (!isBlack) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(noteName + octave, 4, y + noteHeight - 4);
      }
    }
  }

  // Dibujar la cuadrícula
  drawGrid() {
    const { keyAreaWidth, width, height, notes, octaves, timelineHeight, gridColor, zoom, offsetX, gridDivision } = this.options;
    const noteHeight = height / (notes.length * octaves);
    const beatWidth = (width / gridDivision) * zoom;
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;
    // Líneas horizontales
    for (let i = 0; i <= notes.length * octaves; i++) {
      const y = timelineHeight + i * noteHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(keyAreaWidth, y);
      this.ctx.lineTo(keyAreaWidth + width, y);
      this.ctx.stroke();
    }
    // Líneas verticales
    for (let i = 0; i <= gridDivision; i++) {
      const x = keyAreaWidth + i * beatWidth - offsetX;
      if (x < keyAreaWidth) continue;
      this.ctx.lineWidth = (i % 4 === 0) ? 2 : 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x, timelineHeight);
      this.ctx.lineTo(x, timelineHeight + height);
      this.ctx.stroke();
    }
  }

  // Dibujar ghost notes (notas de referencia de otros canales)
  drawGhostNotes() {
    if (!this.options.ghostNotes || !this.options.ghostNotes.length) return;
    const { keyAreaWidth, timelineHeight, width, zoom, offsetX } = this.options;
    const noteHeight = this.options.height / (this.options.notes.length * this.options.octaves);
    this.options.ghostNotes.forEach(noteObj => {
      const noteIndex = this.getNoteIndex(noteObj.note);
      const x = keyAreaWidth + (noteObj.time * (this.options.width / this.options.gridDivision) * zoom) - offsetX;
      const y = timelineHeight + noteIndex * noteHeight;
      const noteWidth = noteObj.duration * (this.options.width / this.options.gridDivision) * zoom;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Color translúcido para ghost notes
      this.roundRect(x, y, noteWidth, noteHeight, 4);
      this.ctx.fill();
    });
  }

  // Dibujar las notas activas
  drawNotes() {
    const { keyAreaWidth, timelineHeight, width, zoom, offsetX } = this.options;
    const noteHeight = this.options.height / (this.options.notes.length * this.options.octaves);
    this.activeNotes.forEach(noteObj => {
      const noteIndex = this.getNoteIndex(noteObj.note);
      const x = keyAreaWidth + (noteObj.time * (this.options.width / this.options.gridDivision) * zoom) - offsetX;
      const y = timelineHeight + noteIndex * noteHeight;
      const noteWidth = noteObj.duration * (this.options.width / this.options.gridDivision) * zoom;
      // Crear degradado para la nota
      const gradient = this.ctx.createLinearGradient(x, y, x + noteWidth, y);
      gradient.addColorStop(0, this.options.noteColor);
      gradient.addColorStop(1, '#fff');
      this.ctx.fillStyle = gradient;
      this.roundRect(x, y, noteWidth, noteHeight, 4);
      this.ctx.fill();
      // Indicador de velocidad (barra lateral)
      const velocityWidth = 4 * noteObj.velocity;
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(x, y, velocityWidth, noteHeight);
    });
  }

  // Función auxiliar para dibujar rectángulos con bordes redondeados
  roundRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Obtener el índice de la nota basado en su nombre y octava
  getNoteIndex(note) {
    const noteName = note.replace(/\d+/g, '');
    const octave = parseInt(note.match(/\d+/)[0]) - this.options.startOctave;
    return (octave * this.options.notes.length) + this.options.notes.indexOf(noteName);
  }

  getNoteFromIndex(index) {
    const octave = Math.floor(index / this.options.notes.length) + this.options.startOctave;
    const noteName = this.options.notes[index % this.options.notes.length];
    return noteName + octave;
  }

  // Agregar una nota (con velocidad opcional)
  addNote(note, time, duration, velocity = 0.8) {
    const newNote = { note, time, duration, velocity };
    this.activeNotes.push(newNote);
    this.draw();
  }

  // Métodos de la barra de herramientas
  setZoomLevel(newZoom) {
    this.targetZoom = newZoom;
    this.animateProperties();
  }

  setGridDivision(newDivision) {
    this.options.gridDivision = newDivision;
    this.draw();
  }

  toggleNoteMode() {
    this.noteMode = !this.noteMode;
    console.log("Modo agregar nota:", this.noteMode);
  }

  // Suavizado (interpolación) para zoom y scroll
  animateProperties() {
    const lerp = (start, end, t) => start + (end - start) * t;
    const smoothing = 0.1;
    let updated = false;
    if (Math.abs(this.options.zoom - this.targetZoom) > 0.001) {
      this.options.zoom = lerp(this.options.zoom, this.targetZoom, smoothing);
      updated = true;
    }
    if (Math.abs(this.options.offsetX - this.targetOffsetX) > 0.1) {
      this.options.offsetX = lerp(this.options.offsetX, this.targetOffsetX, smoothing);
      updated = true;
    }
    if (updated) {
      this.draw();
      requestAnimationFrame(this.animateProperties.bind(this));
    }
  }

  // Configurar eventos: zoom, scroll y edición (drag & drop) de notas
  setupEvents() {
    // Zoom con la rueda del ratón (actualiza targetZoom)
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY;
      if (delta < 0) {
        this.targetZoom = this.options.zoom * 1.1;
      } else {
        this.targetZoom = this.options.zoom / 1.1;
      }
      this.animateProperties();
    });

    // Mouse down: verificar si se hace clic en una nota o se inicia scroll / agregar nota
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Búsqueda de nota (hit detection)
      const hitNote = this.activeNotes.find(noteObj => {
        const noteIndex = this.getNoteIndex(noteObj.note);
        const noteHeight = this.options.height / (this.options.notes.length * this.options.octaves);
        const noteX = this.options.keyAreaWidth + (noteObj.time * (this.options.width / this.options.gridDivision) * this.options.zoom) - this.options.offsetX;
        const noteY = this.options.timelineHeight + noteIndex * noteHeight;
        const noteWidth = noteObj.duration * (this.options.width / this.options.gridDivision) * this.options.zoom;
        return x >= noteX && x <= noteX + noteWidth && y >= noteY && y <= noteY + noteHeight;
      });
      if (hitNote) {
        this.selectedNote = hitNote;
        this.isDragging = true;
        const noteIndex = this.getNoteIndex(hitNote.note);
        const noteHeight = this.options.height / (this.options.notes.length * this.options.octaves);
        const noteX = this.options.keyAreaWidth + (hitNote.time * (this.options.width / this.options.gridDivision) * this.options.zoom) - this.options.offsetX;
        const noteY = this.options.timelineHeight + noteIndex * noteHeight;
        this.dragOffset.x = x - noteX;
        this.dragOffset.y = y - noteY;
      } else {
        // Si está en modo agregar nota y el clic está fuera del área de teclas
        if (this.noteMode && x > this.options.keyAreaWidth) {
          const adjustedX = x - this.options.keyAreaWidth + this.options.offsetX;
          const beatWidth = (this.options.width / this.options.gridDivision) * this.options.zoom;
          const beat = Math.floor(adjustedX / beatWidth);
          const noteHeight = this.options.height / (this.options.notes.length * this.options.octaves);
          const noteIndex = Math.floor((y - this.options.timelineHeight) / noteHeight);
          const note = this.getNoteFromIndex(noteIndex);
          this.addNote(note, beat, 1);
          return;
        }
        // Si no, iniciar scroll (si está fuera del área de teclas)
        if (x > this.options.keyAreaWidth) {
          this.isScrolling = true;
          this.scrollStart.x = x;
          this.scrollStart.offsetX = this.options.offsetX;
          this.targetOffsetX = this.options.offsetX;
        }
      }
    });

    // Mouse move: actualizar posición de la nota o del scroll
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (this.isDragging && this.selectedNote) {
        const newX = x - this.dragOffset.x + this.options.offsetX - this.options.keyAreaWidth;
        const beatWidth = (this.options.width / this.options.gridDivision) * this.options.zoom;
        const newTime = newX / beatWidth;
        this.selectedNote.time = Math.max(0, newTime);
        this.draw();
      } else if (this.isScrolling) {
        const deltaX = this.scrollStart.x - x;
        this.targetOffsetX = Math.max(0, this.scrollStart.offsetX + deltaX);
        this.animateProperties();
      }
    });

    // Finalizar drag o scroll
    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.isScrolling = false;
      this.selectedNote = null;
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
      this.isScrolling = false;
      this.selectedNote = null;
    });
  }

  // Reproducción y exportación
  play() {
    if (this.activeNotes.length === 0) {
      console.warn('No hay notas para reproducir');
      return;
    }
    if (!window.Tone) {
      console.error('Tone.js no está cargado');
      return;
    }
    this.isPlaying = true;
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = 120;
    if (!this.synth) {
      this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
      this.synth.volume.value = -8;
    }
    this.activeNotes.forEach(noteObj => {
      Tone.Transport.schedule(time => {
        this.synth.triggerAttackRelease(
          noteObj.note,
          noteObj.duration * 0.5 + "n",
          time,
          noteObj.velocity
        );
      }, noteObj.time * 0.5);
    });
    Tone.Transport.start();
  }

  stop() {
    if (window.Tone && Tone.Transport) {
      Tone.Transport.stop();
    }
    this.isPlaying = false;
  }

  getNotes() {
    return [...this.activeNotes];
  }

  exportMIDI() {
    return {
      header: {
        bpm: 120,
        timeSignature: [4, 4]
      },
      tracks: [{
        notes: this.activeNotes.map(n => ({
          note: n.note,
          time: n.time,
          duration: n.duration,
          velocity: n.velocity
        }))
      }]
    };
  }

  noteToMidiNumber(note) {
    const noteName = note.replace(/\d+/g, '');
    const octave = parseInt(note.match(/\d+/)[0]);
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return 12 + (octave * 12) + noteNames.indexOf(noteName);
  }
}

export default PianoRoll;
