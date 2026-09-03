import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// ─── Firebase Init (server-side: gunakan FIREBASE_ tanpa VITE_ prefix) ────────
const firebaseConfig = {
  apiKey:            process.env.FIREBASE_API_KEY            || process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN        || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       process.env.FIREBASE_DATABASE_URL       || process.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         process.env.FIREBASE_PROJECT_ID         || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.FIREBASE_APP_ID             || process.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ticket = ((req.query.ticket as string) ?? '').trim().toUpperCase();
  if (!ticket) return res.status(400).json({ error: 'ticket wajib diisi' });

  try {
    const snap = await getDoc(doc(db, 'aduan', ticket));

    if (!snap.exists()) {
      return res.status(404).json({
        found: false,
        ticket,
        message: 'Nomor tiket tidak ditemukan. Periksa kembali penulisan nomor tiket Anda.',
      });
    }

    const d = snap.data();
    const koordinat = d.koordinat || null;

    // Bangun mapUrl: prioritaskan data tersimpan, fallback dari koordinat
    const mapUrl = d.mapUrl ||
      (koordinat?.lat && koordinat?.lng
        ? `https://maps.google.com/?q=${koordinat.lat},${koordinat.lng}`
        : '');

    return res.status(200).json({
      found:           true,
      ticket:          d.ticket    || ticket,
      timestamp:       d.timestamp || '',
      tanggalKejadian: d.tanggalKejadian || (d.timestamp ? d.timestamp.split(' ')[0] : ''),
      nama:            d.nama      || '',
      kontak:          d.kontak    || '',
      kategori:        d.kategori  || '',
      lokasi:          d.lokasi    || '',
      koordinat,
      mapUrl,
      deskripsi:       d.deskripsi || '',
      fotos:           Array.isArray(d.fotos) ? d.fotos : [],
      jumlahFoto:      d.jumlahFoto ?? (Array.isArray(d.fotos) ? d.fotos.length : 0),
      tingkatKeparahan: d.tingkatKeparahan || 'ringan',
      status:          d.status    || 'Baru',
      catatan:         d.catatan   || '',
      fotoTindakLanjut: d.fotoTindakLanjut || '',
      updatedAt:       d.updatedAt || '',
      source:          d.source    || '',
    });

  } catch (err: any) {
    console.error('[complaint-status] Error:', err);
    return res.status(500).json({ error: 'Gagal mengambil status tiket: ' + err.message });
  }
}
