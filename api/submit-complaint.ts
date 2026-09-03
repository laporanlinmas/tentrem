import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { v2 as cloudinary } from 'cloudinary';

// ─── Firebase Init ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.FIREBASE_API_KEY     || process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         process.env.FIREBASE_PROJECT_ID  || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.FIREBASE_APP_ID      || process.env.VITE_FIREBASE_APP_ID,
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ─── Cloudinary Init (server-side — no VITE_ prefix needed) ──────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY   ,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const MAX_PHOTOS = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timestampWIB(): string {
  const d = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

function generateTicket(): string {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ADU-${yy}${mm}${dd}-${rand}`;
}

/**
 * Upload a single base64-encoded photo to Cloudinary.
 * Returns the secure_url on success, empty string on failure.
 */
async function uploadPhotoToCloudinary(
  base64Data: string,
  mimeType: string,
  folder = 'sapapedestrian_aduan'
): Promise<string> {
  try {
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url || '';
  } catch (err: any) {
    console.error('[Cloudinary upload error]', err?.message || err);
    return '';
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      nama, kontak, kategori, lokasi, deskripsi,
      tanggalKejadian, koordinat, mapUrl, source, photos, tingkatKeparahan,
    } = req.body;

    const trimmedNama       = (nama        ?? '').trim();
    const trimmedKontak     = (kontak      ?? '').trim();
    const trimmedKategori   = (kategori    ?? '').trim();
    const trimmedLokasi     = (lokasi      ?? '').trim();
    const trimmedDeskripsi  = (deskripsi   ?? '').trim();
    const trimmedTanggal    = (tanggalKejadian ?? '').trim();
    const cleanSource       = (source      ?? 'Form Web').trim();
    const cleanKeparahan    = ['ringan', 'sedang', 'tinggi', 'kritis'].includes(tingkatKeparahan)
      ? (tingkatKeparahan as string)
      : 'ringan';

    if (!trimmedNama || !trimmedKategori || !trimmedLokasi || !trimmedDeskripsi) {
      return res.status(400).json({ error: 'Semua field wajib diisi.' });
    }

    const ticket = generateTicket();

    // ── Upload semua foto ke Cloudinary secara parallel ────────────────────
    let uploadedPhotos: string[] = [];

    if (Array.isArray(photos) && photos.length > 0) {
      const photoSlice = photos.slice(0, MAX_PHOTOS) as Array<{
        name: string;
        type: string;
        base64: string;
      }>;

      // Promise.all returns results in the SAME order as input, guaranteed.
      const results = await Promise.all(
        photoSlice.map(async (photo) => {
          if (!photo?.base64 || !photo?.type) return '';
          return uploadPhotoToCloudinary(photo.base64, photo.type, 'sapapedestrian_aduan');
        })
      );

      // Filter out failed uploads (empty string)
      uploadedPhotos = results.filter(Boolean);
    }

    const ts = timestampWIB();

    await setDoc(doc(db, 'aduan', ticket), {
      ticket,
      timestamp:       ts,
      nama:            trimmedNama,
      kontak:          trimmedKontak,
      kategori:        trimmedKategori,
      lokasi:          trimmedLokasi,
      deskripsi:       trimmedDeskripsi,
      tanggalKejadian: trimmedTanggal || ts.split(' ')[0],
      koordinat:       koordinat || null,
      mapUrl:          mapUrl || (koordinat ? `https://maps.google.com/?q=${koordinat.lat},${koordinat.lng}` : ''),
      fotos:           uploadedPhotos,
      jumlahFoto:      uploadedPhotos.length,
      tingkatKeparahan: cleanKeparahan,
      status:          'Baru',
      catatan:         '',
      updatedAt:       ts,
      source:          cleanSource,
    });

    return res.status(200).json({
      success: true,
      ticketNumber: ticket,
      jumlahFoto: uploadedPhotos.length,
    });

  } catch (err: any) {
    console.error('[submit-complaint] Error:', err);
    return res.status(500).json({ error: 'Gagal mengirim laporan: ' + err.message });
  }
}
