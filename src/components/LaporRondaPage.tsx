'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShieldCheck,
  Camera,
  MapPin,
  Clock,
  Calendar,
  Users,
  User,
  AlertTriangle,
  FileText,
  Send,
  ArrowLeft,
  Trash2,
  Eye,
  CheckCircle2,
  Loader2,
  Navigation,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  Layers,
  Lock,
  ExternalLink,
  Home,
  ChevronRight,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, setDoc } from 'firebase/firestore';
import { subscribeKelompokRonda, KelompokRonda } from '@/lib/kelompok-ronda';
import { processCameraSnapshot, ProcessedPhoto } from '@/lib/watermark';
import RondaAuthGate from '@/components/RondaAuthGate';

interface LaporRondaPageProps {
  onBack: () => void;
}

const KONDISI_OPTIONS = [
  { value: 'Aman dan kondusif', label: 'Aman & Kondusif', color: 'emerald', desc: 'Situasi tertib, tidak ada hal mencurigakan' },
  { value: 'Perlu pemantauan', label: 'Perlu Pemantauan', color: 'amber', desc: 'Ada aktivitas warga / keramaian butuh pantauan' },
  { value: 'Ada gangguan', label: 'Ada Gangguan', color: 'orange', desc: 'Terjadi gangguan ketertiban ringan / indikasi' },
  { value: 'Darurat', label: 'Darurat / Bahaya', color: 'red', desc: 'Butuh bantuan segera / insiden darurat' },
];

const DAYS_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function getTodayFormatted(): string {
  const d = new Date();
  return `${d.getDate()} ${INDO_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getCurrentTimeWIB(): string {
  const d = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  return d.toLocaleTimeString('id-ID', options).replace('.', ':');
}

export default function LaporRondaPage({ onBack }: LaporRondaPageProps) {
  // Authentication Passcode Gate state (Always starts locked until PIN is entered)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string>('');
  const [authPasscode, setAuthPasscode] = useState<string>('');

  const now = new Date();
  const todayDayName = DAYS_INDO[now.getDay()];
  const todayDateStr = now.toISOString().split('T')[0];

  // Kelompok Ronda state from Firestore
  const [kelompokList, setKelompokList] = useState<KelompokRonda[]>([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState<string>('');

  // Existing report for today (1 Day 1 Report constraint)
  const [todayExistingReport, setTodayExistingReport] = useState<any | null>(null);
  const [checkingExisting, setCheckingExisting] = useState<boolean>(true);

  // Form fields
  const [kondisi, setKondisi] = useState<string>('Aman dan kondusif');
  const [kejadian, setKejadian] = useState<string>('');
  const [tindakan, setTindakan] = useState<string>('');

  // GPS / Geolocation state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsAddress, setGpsAddress] = useState<string>('');

  // Photos state (Processed with watermark - MAX 3 PHOTOS)
  const [photos, setPhotos] = useState<ProcessedPhoto[]>([]);
  const [processingPhoto, setProcessingPhoto] = useState<boolean>(false);
  const [photoProgressMsg, setPhotoProgressMsg] = useState<string>('');
  const [activeViewerIdx, setActiveViewerIdx] = useState<number | null>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitProgress, setSubmitProgress] = useState<number>(0);
  const [submitStep, setSubmitStep] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [successTicket, setSuccessTicket] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Subscribe to Kelompok Ronda
  useEffect(() => {
    const unsub = subscribeKelompokRonda((list) => {
      setKelompokList(list);
      if (list.length > 0 && !selectedKelompokId) {
        // Auto-select today's group if available, else first group
        const todayGroup = list.find((k) => (k.hari || '').toLowerCase() === todayDayName.toLowerCase() && k.aktif !== false);
        if (todayGroup) {
          setSelectedKelompokId(todayGroup.id);
        } else {
          setSelectedKelompokId(list[0].id);
        }
      }
    });
    return () => unsub();
  }, [todayDayName]);

  // 2. Check if today's report already exists in Firestore (1 Day 1 Report)
  useEffect(() => {
    if (!db) {
      setCheckingExisting(false);
      return;
    }
    try {
      const q = query(collection(db, 'ronda'));
      const unsub = onSnapshot(q, (snapshot) => {
        const found = snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .find(
            (r) =>
              r.tanggalKejadian === todayDateStr ||
              (r.createdAt && r.createdAt.startsWith(todayDateStr)) ||
              (r.timestamp && r.timestamp.startsWith(todayDateStr))
          );
        setTodayExistingReport(found || null);
        setCheckingExisting(false);
      });
      return () => unsub();
    } catch {
      setCheckingExisting(false);
    }
  }, [todayDateStr]);

  // 3. Fetch browser GPS
  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=id`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setGpsAddress(data.display_name);
          }
        } catch {
          setGpsAddress(`Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Desa Tugurejo, Slahung)`);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        console.warn('Geolocation warning:', err);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const selectedKelompok = useMemo(() => {
    return kelompokList.find((k) => k.id === selectedKelompokId) || kelompokList[0] || null;
  }, [kelompokList, selectedKelompokId]);

  // Handle Camera Capture (Camera ONLY - watermarked on the fly)
  const handleCaptureCamera = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 3) {
      alert('Maksimal 3 foto dokumentasi ronda.');
      return;
    }

    const file = files[0];
    setProcessingPhoto(true);
    setPhotoProgressMsg('Membaca GPS & membubuhkan watermark...');

    try {
      const pDanpok = selectedKelompok?.danpok || selectedKelompok?.danru || 'Petugas Linmas';
      const processed = await processCameraSnapshot(file, {
        kelompok: selectedKelompok?.nama || 'Kelompok Ronda',
        danpok: pDanpok,
        danru: pDanpok,
        poskamling: selectedKelompok?.poskamling || 'Poskamling Tugurejo',
        customTime: getCurrentTimeWIB(),
        coords,
      });

      setPhotos((prev) => [...prev, processed]);
    } catch (err: any) {
      console.error('[Watermark error]:', err);
      alert('Gagal memproses foto: ' + err.message);
    } finally {
      setProcessingPhoto(false);
      setPhotoProgressMsg('');
      if (e.target) e.target.value = '';
    }
  };

  // Delete a captured photo
  const handleDeletePhoto = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Report with real-time progress steps
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKelompok) {
      setSubmitError('Pilih kelompok ronda terlebih dahulu.');
      return;
    }
    if (photos.length === 0) {
      setSubmitError('Wajib melampirkan minimal 1 foto dokumentasi dari kamera.');
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress(20);
    setSubmitError('');
    setSubmitStep('Memvalidasi sandi & data poskamling...');

    const waktuSekarang = getCurrentTimeWIB();
    const pDanpok = selectedKelompok.danpok || selectedKelompok.danru || 'Petugas Linmas';
    const payload = {
      passcode: authPasscode,
      authToken: authToken,
      kelompokRonda: selectedKelompok.nama,
      danpok: pDanpok,
      namaDanpok: pDanpok,
      namaDanru: pDanpok,
      danru: pDanpok,
      lokasi: selectedKelompok.poskamling || 'Poskamling Tugurejo',
      tanggalKejadian: todayDateStr,
      waktu: waktuSekarang,
      personil: (selectedKelompok.anggota || []).join(', '),
      kondisi: kondisi,
      kejadian: kejadian.trim() || 'Situasi terpantau aman dan tertib selama kegiatan ronda malam.',
      tindakan: tindakan.trim() || 'Tidak ada tindakan khusus.',
      koordinat: coords,
      mapUrl: coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : '',
      photos: photos.map((p) => ({
        base64: p.data.replace(/^data:image\/[a-z]+;base64,/, ''),
        mime: p.mime,
      })),
    };

    try {
      setSubmitProgress(50);
      setSubmitStep('Mengunggah foto ber-watermark & menyimpan laporan...');
      const res = await fetch('/api/submit-ronda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim laporan');

      setSubmitProgress(100);
      setSubmitStep('Laporan berhasil dikirim!');
      setSuccessTicket(data.ticketNumber || 'Laporan Terkirim');
    } catch (err: any) {
      // Fallback direct Firestore if API route fails
      if (db) {
        try {
          setSubmitProgress(75);
          setSubmitStep('Menyimpan langsung ke database Firestore...');
          const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
          const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
          const fallbackTicket = `RND-${ym}-${rand}`;
          const ts = `${now.toLocaleDateString('id-ID')} ${waktuSekarang} WIB`;

          await setDoc(doc(db, 'ronda', fallbackTicket), {
            ticket: fallbackTicket,
            timestamp: ts,
            kelompokRonda: selectedKelompok.nama,
            nama: pDanpok,
            danpok: pDanpok,
            namaDanpok: pDanpok,
            danru: pDanpok,
            namaDanru: pDanpok,
            lokasi: selectedKelompok.poskamling || 'Poskamling Tugurejo',
            tanggalKejadian: todayDateStr,
            waktu: waktuSekarang,
            personil: (selectedKelompok.anggota || []).join(', '),
            kondisi: kondisi,
            identitas: kondisi,
            kejadian: kejadian.trim() || 'Situasi terpantau aman dan tertib selama kegiatan ronda malam.',
            deskripsi: kejadian.trim() || 'Situasi terpantau aman dan tertib selama kegiatan ronda malam.',
            tindakan: tindakan.trim(),
            laporan: `LAPORAN RONDA POSKAMLING DESA TUGUREJO\nKelompok: ${selectedKelompok.nama}\nDanpok: ${pDanpok}\nLokasi: ${selectedKelompok.poskamling}\nKondisi: ${kondisi}\nKejadian: ${kejadian}`,
            kategori: 'Laporan Ronda',
            koordinat: coords || null,
            mapUrl: coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : '',
            fotos: photos.map((p) => p.data),
            jumlahFoto: photos.length,
            status: 'Baru',
            catatan: '',
            source: 'Lapor Ronda Web',
            createdAt: now.toISOString(),
            updatedAt: ts,
          });

          setSubmitProgress(100);
          setSubmitStep('Laporan berhasil disimpan ke sistem!');
          setSuccessTicket(fallbackTicket);
          return;
        } catch (fbErr: any) {
          setSubmitError(fbErr.message || 'Gagal menyimpan laporan ke database.');
        }
      }
      setSubmitError(err.message || 'Terjadi kesalahan saat mengirim laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═════════════════════════════════════════════════════════════
  // 1. AUTHENTICATION GATE (Sandi Akses Ronda - Wajib Lolos Sandi)
  // ═════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <RondaAuthGate
        onSuccess={(tok, pass) => {
          setAuthToken(tok);
          setAuthPasscode(pass);
          setIsAuthenticated(true);
        }}
        onBack={onBack}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════
  // 2. SCREEN: SUBMIT BERHASIL (KONFIRMASI LAPORAN SUDAH TERSIMPAN)
  // ═════════════════════════════════════════════════════════════
  if (successTicket) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/30 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
              ● Laporan Berhasil Dikirim
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Laporan Ronda Telah Tersimpan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Dokumentasi foto ber-watermark dan catatan patroli poskamling telah berhasil tersimpan dan tersinkronisasi ke sistem Linmas Desa Tugurejo.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // 3. SCREEN: LAPORAN HARI INI SUDAH TERKIRIM (1 HARI 1 LAPORAN)
  // ═════════════════════════════════════════════════════════════
  if (todayExistingReport) {
    const rep = todayExistingReport;
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/30 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                ● Laporan Hari Ini Sudah Selesai
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Laporan Ronda Hari Ini Sudah Terkirim
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Sistem ronda malam Tugurejo dibatasi 1 laporan per hari. Laporan untuk jadwal hari ini (<strong>{todayDayName}, {getTodayFormatted()}</strong>) sudah tersimpan di sistem.
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                {rep.kelompokRonda || 'Kelompok Ronda'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Danpok / Petugas:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{rep.namaDanpok || rep.danpok || rep.namaDanru || rep.danru || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Waktu Lapor:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{rep.waktu ? `${rep.waktu} WIB` : 'Malam'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Lokasi Pos:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{rep.lokasi || 'Poskamling Tugurejo'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Status Keamanan:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{rep.kondisi || 'Aman & Kondusif'}</span>
              </div>
            </div>

            {rep.kejadian && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase mb-0.5">Catatan Pemantauan:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{rep.kejadian}"
                </p>
              </div>
            )}

            {/* Photos Preview */}
            {rep.fotos && rep.fotos.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Dokumentasi Kamera:</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {rep.fotos.map((photoUrl: string, pi: number) => (
                    <div key={pi} className="w-20 h-14 rounded-xl overflow-hidden bg-black shrink-0 border border-slate-300 dark:border-slate-700">
                      <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // MAIN FORM: 3 SIMPLE & CLEAN CARDS
  // ═════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 pt-20 pb-20 px-3 sm:px-6">
      
      {/* Top Floating Bar */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <button type="button" onClick={onBack} className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-white font-bold">Lapor Ronda</span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('tentrem_ronda_auth_token');
              sessionStorage.removeItem('tentrem_ronda_passcode');
              setIsAuthenticated(false);
            }}
            title="Kunci / Keluar Sandi Akses"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Kunci Akses</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Siskamling Tugurejo</span>
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">

        {/* Page Title Card */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-extrabold uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5" />
              <span>Dokumentasi Kamera Watermark</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Lapor Ronda Malam
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              Jadwal hari ini: <strong>{todayDayName}, {getTodayFormatted()}</strong>. Cukup pilih kelompok ronda, catat situasi, dan ambil foto kamera langsung ber-watermark resmi.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── CARD 1: PILIH KELOMPOK RONDA ── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    1. Pilih Kelompok Ronda <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih kelompok jaga yang bertugas malam ini (jadwal harian)
                  </p>
                </div>
              </div>
            </div>

            {/* Kelompok Ronda Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {kelompokList.map((item) => {
                const isSelected = selectedKelompokId === item.id;
                const isTodayGroup = (item.hari || '').toLowerCase() === todayDayName.toLowerCase();

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedKelompokId(item.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              isTodayGroup
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            🗓️ {item.hari || 'Jadwal'}
                          </span>
                          {isTodayGroup && (
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                              (Hari Ini)
                            </span>
                          )}
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {item.nama}
                      </h4>

                      <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                        {(item.danpok || item.danru) && (
                          <p>
                            Danpok: <strong className="text-slate-800 dark:text-slate-200">{item.danpok || item.danru}</strong>
                          </p>
                        )}
                        {item.poskamling && (
                          <p className="truncate">
                            📍 {item.poskamling}
                          </p>
                        )}
                      </div>

                      {/* Anggota List Chips */}
                      {item.anggota && item.anggota.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1">
                          {item.anggota.map((ang, ai) => (
                            <span
                              key={ai}
                              className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                            >
                              {ang}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CARD 2: KONDISI & CATATAN RONDA ── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    2. Kondisi &amp; Catatan Ronda
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Status keamanan lingkungan dan catatan temuan selama patroli
                  </p>
                </div>
              </div>
            </div>

            {/* Pilihan Kondisi */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Kondisi Keamanan Wilayah <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {KONDISI_OPTIONS.map((opt) => {
                  const isSelected = kondisi === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setKondisi(opt.value)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-extrabold">{opt.label}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{opt.desc}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kejadian / Temuan */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Catatan Temuan / Situasi Patroli
              </label>
              <textarea
                rows={3}
                value={kejadian}
                onChange={(e) => setKejadian(e.target.value)}
                placeholder="Uraikan situasi (misal: Patroli keliling RT 01-03 situasi kondusif, lampu penerangan jalan normal, tidak ada hal mencurigakan)."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            {/* Tindakan / Keterangan */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Tindakan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={tindakan}
                onChange={(e) => setTindakan(e.target.value)}
                placeholder="Contoh: Mengingatkan warga RT 02 agar mengunci gerbang pagar dan mematikan kompor."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          </div>

          {/* ── CARD 3: KAMERA DOKUMENTASI (KAMERA SAJA - WATERMARK) ── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    3. Ambil Foto Kamera (Watermark Otomatis) <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Khusus kamera langsung dengan cap stempel lokasi, GPS, QR Code &amp; Danpok (Maksimal 3 Foto)
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {photos.length} / 3 Foto
              </span>
            </div>

            {/* GPS Indicator & Live Maps Checker */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${coords ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                    {gpsLoading
                      ? 'Mencari sinyal satelit GPS presisi...'
                      : coords
                      ? `📡 GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
                      : 'GPS belum aktif (aktifkan izin lokasi)'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {coords && (
                    <a
                      href={`https://www.google.com/maps?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] transition-colors border border-emerald-500/20 shadow-sm"
                      title="Buka titik koordinat saat ini di Google Maps"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Cek Google Maps</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={fetchLocation}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                    <span>Perbarui GPS</span>
                  </button>
                </div>
              </div>

              {gpsAddress && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate pl-4.5">
                  📍 {gpsAddress}
                </p>
              )}
            </div>

            {/* Camera Capture Action Box */}
            <div className="text-center p-6 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleCaptureCamera}
                className="hidden"
                disabled={processingPhoto || photos.length >= 3}
              />

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                {processingPhoto ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Camera className="w-7 h-7" />
                )}
              </div>

              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {processingPhoto ? photoProgressMsg : photos.length >= 3 ? 'Batas Maksimal 3 Foto Tercapai' : 'Buka Kamera untuk Mengambil Foto'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Foto otomatis dibubuhi stempel resmi ronda TENTREM Desa Tugurejo (maksimal 3 foto)
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processingPhoto || photos.length >= 3}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>{photos.length >= 3 ? 'Foto Lengkap (3/3)' : photos.length > 0 ? '+ Ambil Foto Lagi' : 'Buka Kamera & Foto Ronda'}</span>
              </button>
            </div>

            {/* Photo Grid Preview */}
            {photos.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Hasil Foto dengan Watermark &amp; GPS ({photos.length} Foto):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {photos.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => setActiveViewerIdx(idx)}
                      className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <img
                        src={p.data}
                        alt={`Dokumentasi Ronda ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-white/10">
                        Foto {idx + 1}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleDeletePhoto(idx, e)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-red-600/90 text-white flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-105 shadow-md transition-all"
                        title="Hapus foto ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/50 to-transparent text-white text-[10px] flex items-center justify-between">
                        <span className="truncate max-w-[140px] font-semibold">{p.timestamp}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {p.lat && p.lng && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://www.google.com/maps?q=${p.lat},${p.lng}`, '_blank');
                              }}
                              className="px-1.5 py-0.5 rounded bg-emerald-500/80 hover:bg-emerald-500 text-white font-bold text-[9px] flex items-center gap-0.5"
                              title="Buka lokasi foto di Google Maps"
                            >
                              <MapPin className="w-2.5 h-2.5" />
                              <span>Maps</span>
                            </span>
                          )}
                          <Eye className="w-3 h-3 text-emerald-400 shrink-0" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {submitError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Button Bar */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-5 py-3.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || photos.length === 0}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{submitStep || 'Mengirim Laporan Ronda...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Laporan Ronda Poskamling</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── PHOTO FULLSCREEN VIEWER MODAL ── */}
      {activeViewerIdx !== null && photos[activeViewerIdx] && (
        <div
          className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setActiveViewerIdx(null)}
        >
          <div
            className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-white text-xs px-2">
              <span className="font-bold">
                Foto {activeViewerIdx + 1} dari {photos.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveViewerIdx(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="w-full max-h-[75vh] overflow-hidden rounded-2xl border border-white/10 flex items-center justify-center bg-black">
              <img
                src={photos[activeViewerIdx].data}
                alt="Foto Watermark"
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>

            <div className="text-white/80 text-[11px] text-center max-w-lg">
              {photos[activeViewerIdx].address} • {photos[activeViewerIdx].timestamp}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBMISSION PROGRESS OVERLAY MODAL ── */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200">
            {/* Pulsing Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                ● Proses Pengiriman
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Mengirim Laporan Ronda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {submitStep || 'Sedang memproses data...'}
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-300 shadow-sm"
                  style={{ width: `${submitProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>Progress Pengiriman</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">{submitProgress}%</span>
              </div>
            </div>

            {/* Checklist micro-steps */}
            <div className="space-y-2 text-left text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Verifikasi Sandi &amp; Kelompok Ronda</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Stempel Watermark &amp; Koordinat GPS</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                {submitProgress >= 50 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 text-cyan-500 animate-spin shrink-0" />
                )}
                <span>Pengunggahan Foto Dokumentasi</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                {submitProgress >= 100 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0" />
                )}
                <span>Pencatatan Sinkronisasi ke Web Admin</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mohon tunggu sejenak dan jangan menutup halaman ini hingga proses selesai.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
