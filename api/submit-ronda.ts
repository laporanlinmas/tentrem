import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import crypto from 'crypto';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const AUTH_SECRET = process.env.JWT_SECRET;

function timestampWIB(): string {
  const d = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return `${d.toLocaleString('id-ID', options)} WIB`;
}

function generateRondaTicket(): string {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RND-${ym}-${rand}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Check Ronda Security Passcode protection
    const secDocRef = doc(db, 'settings', 'ronda_security');
    const secSnap = await getDoc(secDocRef);
    let isSecEnabled = true;
    let validPasscode = 'linmas123';

    if (secSnap.exists()) {
      const sData = secSnap.data();
      isSecEnabled = sData.enabled !== false;
      validPasscode = String(sData.passcode || 'linmas123').trim();
    }

    const {
      passcode,
      authToken,
      kelompokRonda,
      danpok,
      namaDanpok,
      namaDanru,
      danru,
      lokasi,
      tanggalKejadian,
      waktu,
      personil,
      kondisi,
      kejadian,
      tindakan,
      laporan,
      koordinat,
      mapUrl,
      photos,
    } = req.body || {};

    if (isSecEnabled) {
      const headerToken = (req.headers['x-ronda-token'] as string) || '';
      const providedToken = authToken || headerToken;
      const providedPasscode = String(passcode || '').trim();

      let isAuthorized = false;

      // Check 1: Direct passcode match
      if (providedPasscode && providedPasscode === validPasscode) {
        isAuthorized = true;
      }

      // Check 2: Signed token match
      if (!isAuthorized && providedToken && typeof providedToken === 'string' && providedToken.includes('.')) {
        const [tokenTsStr, tokenSig] = providedToken.split('.');
        const tokenTs = parseInt(tokenTsStr, 10);
        // Valid for up to 24 hours
        if (!isNaN(tokenTs) && Date.now() - tokenTs < 24 * 60 * 60 * 1000) {
          const expectedSig = crypto
            .createHmac('sha256', AUTH_SECRET)
            .update(`${validPasscode}:${tokenTs}`)
            .digest('hex');
          if (tokenSig === expectedSig) {
            isAuthorized = true;
          }
        }
      }

      if (!isAuthorized) {
        return res.status(401).json({
          error: 'Akses Ditolak: Sandi otentikasi ronda tidak valid atau sesi telah berakhir. Silakan masukkan sandi kembali.',
          requireAuth: true,
        });
      }
    }

    const trimmedKelompok = (kelompokRonda ?? '').trim();
    const trimmedDanpok = (namaDanpok ?? danpok ?? namaDanru ?? danru ?? '').trim();
    const trimmedLokasi = (lokasi ?? '').trim();
    const trimmedTanggal = (tanggalKejadian ?? '').trim();
    const trimmedWaktu = (waktu ?? '').trim();
    const trimmedPersonil = (personil ?? '').trim();
    const trimmedKondisi = (kondisi ?? 'Aman dan kondusif').trim();
    const trimmedKejadian = (kejadian ?? '').trim();
    const trimmedTindakan = (tindakan ?? '').trim();

    if (!trimmedKelompok || !trimmedDanpok || !trimmedLokasi) {
      return res.status(400).json({ error: 'Kelompok Ronda, Danpok, dan Lokasi wajib diisi.' });
    }

    // 2. Check 1 Day 1 Report Constraint
    const todayIsoDate = new Date().toISOString().split('T')[0];
    const rondaColRef = collection(db, 'ronda');
    const existingSnap = await getDocs(rondaColRef);
    let alreadySubmitted = false;
    existingSnap.forEach((d) => {
      const rd = d.data();
      if (
        rd.tanggalKejadian === trimmedTanggal ||
        rd.tanggalKejadian === todayIsoDate ||
        (rd.createdAt && rd.createdAt.startsWith(todayIsoDate)) ||
        (rd.timestamp && rd.timestamp.startsWith(todayIsoDate))
      ) {
        alreadySubmitted = true;
      }
    });

    if (alreadySubmitted) {
      return res.status(409).json({
        error: 'Laporan ronda untuk hari ini sudah terkirim. Batas sistem adalah 1 laporan per hari.',
        alreadySubmitted: true,
      });
    }

    // 3. Process Photos — upload ke Cloudinary, simpan URL bukan base64
    const validPhotoUrls: string[] = [];
    if (Array.isArray(photos) && photos.length > 0) {
      const cloudName  = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey     = process.env.CLOUDINARY_API_KEY;
      const apiSecret  = process.env.CLOUDINARY_API_SECRET;

      for (const p of photos.slice(0, 3)) {
        try {
          // Ambil base64 data
          let base64: string | null = null;
          let mime = 'image/jpeg';

          if (p.base64) {
            base64 = p.base64;
            mime   = p.mime || 'image/jpeg';
          } else if (typeof p === 'string' && p.startsWith('data:')) {
            const [header, data] = p.split(',');
            base64 = data;
            mime   = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
          }

          if (!base64) continue;

          // Jika Cloudinary credentials tersedia, upload ke Cloudinary
          if (cloudName && apiKey && apiSecret) {
            const timestamp = Math.round(Date.now() / 1000);
            const folder    = 'tentrem_tugurejo/ronda';
            const { createHash } = await import('crypto');
            const paramStr  = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
            const signature = createHash('sha1').update(paramStr).digest('hex');

            const formParts = [
              `file=data:${mime};base64,${base64}`,
              `folder=${encodeURIComponent(folder)}`,
              `timestamp=${timestamp}`,
              `api_key=${encodeURIComponent(apiKey)}`,
              `signature=${encodeURIComponent(signature)}`,
            ].join('&');

            const uploadRes = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
              {
                method:  'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body:    formParts,
              }
            );
            const uploadData = await uploadRes.json();
            if (uploadData?.secure_url) {
              validPhotoUrls.push(uploadData.secure_url);
              continue;
            }
            console.warn('[submit-ronda] Cloudinary upload failed:', uploadData?.error?.message);
          }

          // Fallback: simpan URL data URI (hanya jika Cloudinary tidak tersedia)
          // Ini sebisa mungkin dihindari karena besar, tapi lebih baik dari kehilangan foto
          validPhotoUrls.push(`data:${mime};base64,${base64}`);
        } catch (photoErr) {
          console.warn('[submit-ronda] Error processing photo:', photoErr);
        }
      }
    }

    // 4. Save to Firestore
    const now = new Date();
    const nowIso = now.toISOString();
    const ts = `${now.toLocaleDateString('id-ID')} ${trimmedWaktu || now.toLocaleTimeString('id-ID')} WIB`;

    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ticket = `RND-${ym}-${rand}`;

    const fullLaporanText =
      laporan ||
      [
        'LAPORAN RONDA POSKAMLING DESA TUGUREJO',
        `Kelompok: ${trimmedKelompok}`,
        `Tanggal: ${trimmedTanggal}`,
        `Waktu: ${trimmedWaktu} WIB`,
        `Lokasi / Poskamling: ${trimmedLokasi}`,
        `Danpok: ${trimmedDanpok}`,
        `Petugas Jaga: ${trimmedPersonil}`,
        `Kondisi Wilayah: ${trimmedKondisi}`,
        `Kejadian / Temuan: ${trimmedKejadian || 'Nihil / situasi terpantau tertib dan kondusif'}`,
        `Tindakan / Keterangan: ${trimmedTindakan || 'Tidak ada tindakan khusus.'}`,
      ].join('\n');

    await setDoc(doc(db, 'ronda', ticket), {
      ticket,
      timestamp: ts,
      kelompokRonda: trimmedKelompok,
      nama: trimmedDanpok,
      danpok: trimmedDanpok,
      namaDanpok: trimmedDanpok,
      danru: trimmedDanpok,
      namaDanru: trimmedDanpok,
      lokasi: trimmedLokasi,
      tanggalKejadian: trimmedTanggal,
      waktu: trimmedWaktu,
      personil: trimmedPersonil,
      kondisi: trimmedKondisi,
      identitas: trimmedKondisi,
      kejadian: trimmedKejadian || 'Patroli berkala dan pemantauan wilayah.',
      deskripsi: trimmedKejadian || 'Patroli berkala dan pemantauan wilayah.',
      tindakan: trimmedTindakan,
      laporanAsli: fullLaporanText,
      laporan: fullLaporanText,
      kategori: 'Laporan Ronda',
      koordinat: koordinat || null,
      mapUrl: mapUrl || (koordinat ? `https://maps.google.com/?q=${koordinat.lat},${koordinat.lng}` : ''),
      fotos: validPhotoUrls,
      jumlahFoto: validPhotoUrls.length,
      status: 'Baru',
      catatan: '',
      source: 'Lapor Ronda Web',
      createdAt: nowIso,
      updatedAt: ts,
    });

    return res.status(200).json({ success: true, ticketNumber: ticket, photosCount: validPhotoUrls.length });
  } catch (err: any) {
    console.error('[submit-ronda] Error:', err);
    return res.status(500).json({ error: 'Gagal mengirim laporan ronda: ' + err.message });
  }
}
