// /api/upload.js
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const busboy = await import('busboy');

  try {
    const { readable, filename } = await readFileFromRequest(req, busboy);

    const { url } = await put(`mozairt/midis/${filename}`, readable, {
      access: 'public',
    });

    return res.status(200).json({ url });
  } catch (err) {
    console.error('❌ Error en subida:', err);
    return res.status(500).json({ error: 'Falló la subida' });
  }
}

// Utilidad para manejar FormData (sin bodyParser)
async function readFileFromRequest(req, busboy) {
  return new Promise((resolve, reject) => {
    const bb = busboy.default({ headers: req.headers });
    let fileRead = false;

    bb.on('file', (_, file, info) => {
      fileRead = true;
      const { filename } = info;
      resolve({ readable: file, filename });
    });

    bb.on('error', reject);
    bb.on('finish', () => {
      if (!fileRead) reject(new Error('No se envió archivo'));
    });

    req.pipe(bb);
  });
}
