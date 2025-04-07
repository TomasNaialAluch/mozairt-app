class PianoRoll {
    constructor(containerId, options = {}) {
      // Configuración predeterminada (modificada para un tema oscuro similar a FL Studio)
      this.defaultOptions = {
        width: 800,
        height: 300,
        // Incluye las notas para dibujar teclas si decides implementarlas
        notes: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        octaves: 5,
        startOctave: 2,
        backgroundColor: '#2e2e2e',  // Fondo oscuro
        gridColor: '#555',           // Color de cuadrícula
        noteColor: '#ffb347',        // Color de las notas (puedes ajustar para que resalte)
        keyAreaWidth: 40             // Ancho para la zona de teclas (opcional)
      };
  
      // Combinar opciones personalizadas con las predeterminadas
      this.options = { ...this.defaultOptions, ...options };
  
      // Elemento contenedor
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error(`Contenedor con ID ${containerId} no encontrado`);
        return;
      }
  
      // Inicializar propiedades
      this.activeNotes = [];
      this.isPlaying = false;
  
      // Crear elementos
      this.createCanvas();
      this.drawGrid();
      this.drawKeyArea(); // Dibuja el teclado a la izquierda (opcional)
      this.setupEvents();
    }
  
    createCanvas() {
      // Crear elemento canvas
      this.canvas = document.createElement('canvas');
      // Se ajusta el ancho para incluir el área de teclas si se desea
      this.canvas.width = this.options.width + this.options.keyAreaWidth;
      this.canvas.height = this.options.height;
      this.canvas.style.backgroundColor = this.options.backgroundColor;
      this.canvas.style.borderRadius = '8px';
      this.canvas.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      this.container.appendChild(this.canvas);
  
      // Contexto de dibujo
      this.ctx = this.canvas.getContext('2d');
    }
  
    // Dibuja el área de teclas en el lado izquierdo
    drawKeyArea() {
      const { keyAreaWidth, notes, octaves, startOctave, height } = this.options;
      // Cada nota tendrá una altura proporcional
      const noteHeight = height / (notes.length * octaves);
  
      for (let i = 0; i < notes.length * octaves; i++) {
        const y = i * noteHeight;
        // Alternar tonos para distinguir teclas blancas y negras (simplificación)
        const octave = Math.floor(i / notes.length) + startOctave;
        const noteName = notes[i % notes.length];
        const isBlack = noteName.includes('#');
        this.ctx.fillStyle = isBlack ? '#444' : '#666';
        this.ctx.fillRect(0, y, keyAreaWidth, noteHeight);
  
        // Dibujar el nombre de la nota en teclas blancas
        if (!isBlack) {
          this.ctx.fillStyle = '#fff';
          this.ctx.font = '10px Arial';
          this.ctx.fillText(noteName + octave, 4, y + noteHeight - 4);
        }
      }
    }
  
    drawGrid() {
      const { width, height, keyAreaWidth, gridColor } = this.options;
      // Calcular dimensiones ajustando el área utilizable (excluyendo el área de teclas)
      this.noteHeight = height / ((this.options.notes.length) * this.options.octaves);
      this.beatWidth = (width) / 16;
  
      // Dibujar líneas horizontales para cada nota
      this.ctx.strokeStyle = gridColor;
      this.ctx.lineWidth = 1;
      for (let i = 0; i <= this.options.notes.length * this.options.octaves; i++) {
        const y = i * this.noteHeight;
        this.ctx.beginPath();
        // La línea inicia desde el borde de la zona de teclas
        this.ctx.moveTo(this.options.keyAreaWidth, y);
        this.ctx.lineTo(this.options.keyAreaWidth + this.options.width, y);
        this.ctx.stroke();
      }
  
      // Dibujar líneas verticales para la cuadrícula de beats
      for (let i = 0; i <= 16; i++) {
        const x = this.options.keyAreaWidth + (i * this.beatWidth);
        const lineWidth = i % 4 === 0 ? 2 : 1; // Líneas más gruesas cada 4 beats
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
      }
    }
  
    setupEvents() {
      // Evento para añadir notas al hacer clic (se descuenta el área de teclas)
      this.canvas.addEventListener('click', (e) => {
        if (this.isPlaying) return; // No permitir cambios durante la reproducción
  
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
  
        // Asegurarse de que se hizo clic fuera del área de teclas
        if (x < this.options.keyAreaWidth) return;
  
        // Ajustar la coordenada X restando el ancho del área de teclas
        const adjustedX = x - this.options.keyAreaWidth;
  
        const beat = Math.floor(adjustedX / this.beatWidth);
        const noteIndex = Math.floor(y / this.noteHeight);
        const note = this.getNoteFromIndex(noteIndex);
        
        this.addNote(note, beat, 1);
      });
    }
  
    addNote(note, time, duration) {
      const noteIndex = this.getNoteIndex(note);
      const y = noteIndex * this.noteHeight;
      const x = this.options.keyAreaWidth + (time * this.beatWidth);
  
      // Dibujar la nota con bordes redondeados y sombra para imitar el estilo moderno
      this.ctx.fillStyle = this.options.noteColor;
      this.ctx.beginPath();
      this.roundRect(x, y, duration * this.beatWidth, this.noteHeight, 4);
      this.ctx.fill();
  
      // Guardar referencia
      this.activeNotes.push({ 
        note, 
        time, 
        duration,
        velocity: 0.8
      });
    }
  
    // Función auxiliar para dibujar rectángulos con bordes redondeados
    roundRect(x, y, width, height, radius) {
      const ctx = this.ctx;
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }
  
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
  
    clear() {
      // Limpiar el canvas y redibujar la cuadrícula y el área de teclas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawGrid();
      this.drawKeyArea();
      this.activeNotes = [];
      this.stop();
    }
  
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
      // Implementación básica de exportación a formato simplificado
      return {
        header: {
          bpm: 120,
          timeSignature: [4, 4]
        },
        tracks: [{
          notes: this.activeNotes.map(n => ({
            midi: this.noteToMidiNumber(n.note),
            time: n.time * 0.5,
            duration: n.duration * 0.5,
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
  