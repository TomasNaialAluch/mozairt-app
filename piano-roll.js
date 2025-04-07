/**
 * PianoRoll Module - Versión mejorada para MozAIrt
 * Ubicación: /piano-roll.js (raíz del proyecto)
 */

class PianoRoll {
    constructor(containerId, options = {}) {
      // Configuración predeterminada
      this.defaultOptions = {
        width: 800,
        height: 300,
        notes: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        octaves: 3,
        startOctave: 3,
        noteColor: '#9662e4',
        gridColor: '#e0e0e0',
        backgroundColor: '#f8f9fa'
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
      this.setupEvents();
    }
  
    createCanvas() {
      // Crear elemento canvas
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.options.width;
      this.canvas.height = this.options.height;
      this.canvas.style.backgroundColor = this.options.backgroundColor;
      this.canvas.style.borderRadius = '8px';
      this.canvas.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      this.container.appendChild(this.canvas);
      
      // Contexto de dibujo
      this.ctx = this.canvas.getContext('2d');
    }
  
    drawGrid() {
      // Calcular dimensiones
      this.noteHeight = this.options.height / (this.options.notes.length * this.options.octaves);
      this.beatWidth = this.options.width / 16;
      
      // Configurar estilo
      this.ctx.strokeStyle = this.options.gridColor;
      this.ctx.lineWidth = 1;
      
      // Dibujar líneas horizontales (notas)
      for (let i = 0; i <= this.options.notes.length * this.options.octaves; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, i * this.noteHeight);
        this.ctx.lineTo(this.options.width, i * this.noteHeight);
        this.ctx.stroke();
      }
      
      // Dibujar líneas verticales (tiempo)
      for (let i = 0; i <= 16; i++) {
        const lineWidth = i % 4 === 0 ? 2 : 1; // Líneas más gruesas cada 4 beats
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(i * this.beatWidth, 0);
        this.ctx.lineTo(i * this.beatWidth, this.options.height);
        this.ctx.stroke();
      }
    }
  
    setupEvents() {
      // Evento para añadir notas al hacer clic
      this.canvas.addEventListener('click', (e) => {
        if (this.isPlaying) return; // No permitir cambios durante la reproducción
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const beat = Math.floor(x / this.beatWidth);
        const noteIndex = Math.floor(y / this.noteHeight);
        const note = this.getNoteFromIndex(noteIndex);
        
        this.addNote(note, beat, 1);
      });
    }
  
    addNote(note, time, duration) {
      const noteIndex = this.getNoteIndex(note);
      const y = noteIndex * this.noteHeight;
      
      // Dibujar nota
      this.ctx.fillStyle = this.options.noteColor;
      this.ctx.fillRect(
        time * this.beatWidth,
        y,
        duration * this.beatWidth,
        this.noteHeight
      );
      
      // Guardar referencia
      this.activeNotes.push({ 
        note, 
        time, 
        duration,
        velocity: 0.8 // Velocidad predeterminada
      });
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
      this.ctx.clearRect(0, 0, this.options.width, this.options.height);
      this.drawGrid();
      this.activeNotes = [];
      this.stop();
    }
  
    play() {
      if (this.activeNotes.length === 0) {
        console.warn('No hay notas para reproducir');
        return;
      }
  
      // Configurar Tone.js si no está inicializado
      if (!window.Tone) {
        console.error('Tone.js no está cargado');
        return;
      }
  
      this.isPlaying = true;
      Tone.Transport.cancel();
      Tone.Transport.bpm.value = 120;
      
      // Crear sintetizador si no existe
      if (!this.synth) {
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.synth.volume.value = -8;
      }
  
      // Programar notas
      this.activeNotes.forEach(noteObj => {
        Tone.Transport.schedule(time => {
          this.synth.triggerAttackRelease(
            noteObj.note, 
            noteObj.duration * 0.5 + "n", 
            time,
            noteObj.velocity
          );
        }, noteObj.time * 0.5); // 0.5 segundos por beat
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
      // Conversión básica de nota a número MIDI
      const noteName = note.replace(/\d+/g, '');
      const octave = parseInt(note.match(/\d+/)[0]);
      const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      return 12 + (octave * 12) + noteNames.indexOf(noteName);
    }
  }
  
  // Exportar la clase para poder importarla en otros archivos
  export default PianoRoll;