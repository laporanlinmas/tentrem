'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Trash2, Search, CheckCircle2, Clock, AlertCircle,
  Copy, Check, ShieldCheck, Phone, MapPin, Calendar, ChevronDown,
  ChevronLeft, ChevronRight, Camera, Image as GalleryIcon, Navigation,
  Loader2, Home, Video, Play,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { sendPushToRole } from '@/lib/fcm';
import KontakDaruratSection, { KontakPiket, KontakDaruratItem } from './KontakDaruratSection';
export type { KontakPiket, KontakDaruratItem };

interface AduanPageProps {
  onBack: () => void;
  initialTab?: 'form' | 'track';
}

const DEFAULT_KATEGORI = [
  'Ketertiban Umum',
  'Kebersihan & Sampah',
  'Kerusakan Fasilitas Umum',
  'Parkir Liar',
  'PKL & Gangguan Usaha',
  'Keamanan Lingkungan',
  'Lainnya / Aspirasi',
];

const STATUS_CFG: Record<string, { color: string; bg: string; Icon: typeof CheckCircle2 }> = {
  Baru:     { color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',         Icon: Clock },
  Diproses: { color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',     Icon: AlertCircle },
  Selesai:  { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', Icon: CheckCircle2 },
  Ditolak:  { color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',             Icon: AlertCircle },
};

function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1] || m} ${y}`;
}

function getTodayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ═══════════════════════════════════════════════════════════════
// INLINE CALENDAR DROPDOWN — muncul tepat di bawah field tanggal
// ═══════════════════════════════════════════════════════════════
interface InlineCalendarProps {
  value: string;
  onChange: (dateStr: string) => void;
}

const InlineCalendarDropdown: React.FC<InlineCalendarProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [inlinePicker, setInlinePicker] = useState<'none' | 'month' | 'year'>('none');
  const wrapRef  = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const parsed = value ? new Date(value + 'T00:00:00') : new Date();
  const [year,  setYear]  = useState(parsed.getFullYear());
  const [month, setMonth] = useState(parsed.getMonth());

  // Sync ke value prop saat berubah dari luar
  useEffect(() => {
    if (!value) return;
    const d = new Date(value + 'T00:00:00');
    if (!isNaN(d.getTime())) { setYear(d.getFullYear()); setMonth(d.getMonth()); }
  }, [value]);

  // Saat dropdown terbuka: selalu di bawah, scroll agar panel tidak terpotong
  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const PANEL_H = 380; // tinggi panel kalender + margin
    setTimeout(() => {
      if (!wrapRef.current) return;
      const r          = wrapRef.current.getBoundingClientRect();
      const viewBottom = window.innerHeight;
      const panelBottom = r.bottom + PANEL_H;
      if (panelBottom > viewBottom) {
        // Scroll page ke bawah sebanyak yang dibutuhkan agar panel terlihat penuh
        const scrollNeeded = panelBottom - viewBottom + 24;
        window.scrollBy({ top: scrollNeeded, behavior: 'smooth' });
      }
    }, 50);
  }, [open]);

  // Tutup saat klik di luar
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setInlinePicker('none');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setInlinePicker('none'); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const currentYear = new Date().getFullYear();
  const YEARS: number[] = [];
  for (let y = currentYear; y >= currentYear - 5; y--) YEARS.push(y);

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstDayOfWk = new Date(year, month, 1).getDay();
  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWk; i++) daysGrid.push(null);
  for (let d = 1; d <= daysInMonth; d++) daysGrid.push(d);

  const selDay   = value ? parseInt(value.split('-')[2], 10) : null;
  const selMonth = value ? parseInt(value.split('-')[1], 10) - 1 : null;
  const selYear  = value ? parseInt(value.split('-')[0], 10) : null;

  const pick = (d: number) => {
    onChange(`${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    setOpen(false); setInlinePicker('none');
  };

  const pickToday = () => {
    const t = new Date();
    onChange(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`);
    setOpen(false); setInlinePicker('none');
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); setInlinePicker('none'); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); setInlinePicker('none'); };

  return (
    <div className="relative" ref={wrapRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setInlinePicker('none'); }}
        className={`w-full px-4 py-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
          open
            ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white dark:bg-slate-900 shadow-md'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-400 dark:hover:border-orange-600'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
            {value ? formatIndoDate(value) : 'Pilih Tanggal Kejadian'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      {/* Dropdown Panel — selalu muncul di bawah, scroll otomatis jika perlu */}
      {open && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 top-full mt-1.5 z-[300] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-black/10 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150"
        >

          {/* Nav bulan/tahun */}
          <div className="flex items-center justify-between gap-1.5">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setInlinePicker(p => p==='month' ? 'none' : 'month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${inlinePicker==='month' ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'}`}
            >
              {MONTHS[month]} <ChevronDown className={`w-3 h-3 transition-transform ${inlinePicker==='month' ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setInlinePicker(p => p==='year' ? 'none' : 'year')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${inlinePicker==='year' ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'}`}
            >
              {year} <ChevronDown className={`w-3 h-3 transition-transform ${inlinePicker==='year' ? 'rotate-180' : ''}`} />
            </button>
            <button type="button" onClick={nextMonth} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Pilih bulan */}
          {inlinePicker === 'month' && (
            <div className="grid grid-cols-3 gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-100">
              {MONTHS.map((m, i) => (
                <button key={i} type="button" onClick={() => { setMonth(i); setInlinePicker('none'); }}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${month===i ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}>
                  {m.slice(0,3)}
                </button>
              ))}
            </div>
          )}

          {/* Pilih tahun */}
          {inlinePicker === 'year' && (
            <div className="grid grid-cols-3 gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-100">
              {YEARS.map(y => (
                <button key={y} type="button" onClick={() => { setYear(y); setInlinePicker('none'); }}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${year===y ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}>
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Grid hari */}
          {inlinePicker === 'none' && (
            <>
              <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <div className="text-red-500">Min</div>
                <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div>
                <div className="text-blue-500">Sab</div>
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {daysGrid.map((dayVal, idx) => {
                  if (dayVal === null) return <div key={`e-${idx}`} />;
                  const isToday    = dayVal===new Date().getDate() && month===new Date().getMonth() && year===new Date().getFullYear();
                  const isSelected = dayVal===selDay && month===selMonth && year===selYear;
                  return (
                    <button key={`d-${dayVal}`} type="button" onClick={() => pick(dayVal)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected ? 'bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-md shadow-orange-400/30 scale-105'
                        : isToday  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-700'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}>
                      {dayVal}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={pickToday}
              className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold transition-colors cursor-pointer">
              Hari Ini
            </button>
            <button type="button" onClick={() => { setOpen(false); setInlinePicker('none'); }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// UPLOAD PROGRESS BAR
// ═══════════════════════════════════════════════════════════════
interface UploadProgressProps {
  phase: 'idle' | 'preparing' | 'uploading' | 'saving' | 'done';
  percent: number;
  label: string;
}

const UploadProgressBar: React.FC<UploadProgressProps> = ({ phase, percent, label }) => {
  if (phase === 'idle') return null;
  const isDone = phase === 'done';
  const gradients: Record<string, string> = {
    preparing: 'from-blue-500 to-cyan-400',
    uploading: 'from-orange-500 to-amber-400',
    saving:    'from-emerald-500 to-teal-400',
    done:      'from-emerald-500 to-emerald-400',
  };
  const phaseOrder: Record<string, number> = { preparing: 0, uploading: 1, saving: 2, done: 3 };
  const stepLabels = ['Persiapan', 'Unggah', 'Simpan', 'Selesai'];
  const cur = phaseOrder[phase] ?? 0;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-all ${
      isDone ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
             : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
    }`}>
      {/* Label & percent */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isDone
            ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            : <Loader2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 animate-spin" />
          }
          <span className={`text-xs font-bold ${isDone ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'}`}>
            {label}
          </span>
        </div>
        <span className={`text-xs font-black tabular-nums ${isDone ? 'text-emerald-600' : 'text-orange-600'}`}>
          {percent}%
        </span>
      </div>

      {/* Bar */}
      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradients[phase] || gradients.uploading} transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {(['preparing','uploading','saving','done'] as const).map((p, i) => {
          const stepIdx = phaseOrder[p];
          const isActive = stepIdx === cur;
          const isPast   = stepIdx < cur;
          return (
            <div key={p} className="flex items-center gap-1">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                isPast   ? 'bg-emerald-500 text-white'
                : isActive ? 'bg-orange-500 text-white scale-110 shadow-sm shadow-orange-400/40'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                {isPast ? '✓' : i + 1}
              </span>
              <span className={`text-[10px] font-semibold ${
                isActive ? 'text-orange-600 dark:text-orange-400 font-extrabold'
                : isPast  ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-500'
              }`}>
                {stepLabels[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CUSTOM CATEGORY DROPDOWN
// ═══════════════════════════════════════════════════════════════
interface CategorySelectProps {
  categories: string[];
  value: string;
  onChange: (val: string) => void;
}

const CustomCleanCategorySelect: React.FC<CategorySelectProps> = ({ categories, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full px-4 py-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
          open ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white dark:bg-slate-900 shadow-md'
               : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
        }`}>
        <span className={`text-xs sm:text-sm truncate ${value ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500 font-semibold'}`}>
          {value || '-- Pilih Kategori Pengaduan --'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-orange-500' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-[300] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 max-h-64 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
          {categories.map(cat => {
            const isSel = value === cat;
            return (
              <button key={cat} type="button" onClick={() => { onChange(cat); setOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer text-xs sm:text-sm ${
                  isSel ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                }`}>
                <span>{cat}</span>
                {isSel && <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function AduanPage({ onBack, initialTab = 'form' }: AduanPageProps) {
  const [tab, setTab] = useState<'form' | 'track' | 'success'>(initialTab);
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_KATEGORI);

  // Form
  const [nama,             setNama]             = useState('');
  const [kontak,           setKontak]           = useState('');
  const [kategori,         setKategori]         = useState('');
  const [lokasi,           setLokasi]           = useState('');
  const [tanggalKejadian,  setTanggalKejadian]  = useState<string>(getTodayString());
  const [deskripsi,        setDeskripsi]        = useState('');
  const [tingkatKeparahan, setTingkatKeparahan] = useState<'ringan'|'sedang'|'tinggi'|'kritis'>('ringan');
  const [photos,           setPhotos]           = useState<{ name: string; type: string; base64: string; preview: string }[]>([]);

  // GPS
  const [geoCoords,  setGeoCoords]  = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Submit
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [ticketResult, setTicketResult] = useState('');
  const [copied,       setCopied]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    phase: 'idle' | 'preparing' | 'uploading' | 'saving' | 'done';
    percent: number;
    label: string;
  }>({ phase: 'idle', percent: 0, label: '' });

  // Track
  const [trackInput,   setTrackInput]   = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult,  setTrackResult]  = useState<any>(null);
  const [trackError,   setTrackError]   = useState('');

  // File refs
  const cameraInputRef  = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Video
  const [video,      setVideo]      = useState<{ name: string; type: string; base64: string; preview: string; sizeMB: number } | null>(null);
  const [videoError, setVideoError] = useState('');

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  // Categories from Firestore
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'settings', 'aduan_categories'), snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (Array.isArray(d.list) && d.list.length > 0) setCategoriesList(d.list);
      }
    }, () => {});
    return () => unsub();
  }, []);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setGeoCoords({ lat, lng });
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data?.display_name && !lokasi) setLokasi(data.display_name);
        } catch {
          if (!lokasi) setLokasi(`Titik Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        } finally { setGeoLoading(false); }
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const compressImage = (file: File, maxSide: number, quality: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const sw = img.naturalWidth, sh = img.naturalHeight;
        const scale = Math.min(1, maxSide / Math.max(sw, sh));
        const w = Math.max(1, Math.round(sw * scale)), h = Math.max(1, Math.round(sh * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compression failed')), 'image/jpeg', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Load failed')); };
      img.src = url;
    });

  const addPhotos = (files: FileList) => {
    Array.from(files).slice(0, 5 - photos.length).forEach(async file => {
      try {
        const blob   = await compressImage(file, 1280, 0.80);
        const reader = new FileReader();
        reader.onload = e => {
          const dataUrl = e.target?.result as string;
          setPhotos(prev => [...prev, { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', base64: dataUrl.split(',')[1], preview: dataUrl }]);
        };
        reader.readAsDataURL(blob);
      } catch {
        const reader = new FileReader();
        reader.onload = e => {
          const dataUrl = e.target?.result as string;
          setPhotos(prev => [...prev, { name: file.name, type: file.type, base64: dataUrl.split(',')[1], preview: dataUrl }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => { fetchCurrentLocation(); if (e.target.files) addPhotos(e.target.files); };
  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    // Pisahkan foto dan video
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const videoFiles = files.filter(f => f.type.startsWith('video/'));
    if (imageFiles.length > 0) {
      const dt = new DataTransfer();
      imageFiles.forEach(f => dt.items.add(f));
      addPhotos(dt.files);
    }
    if (videoFiles.length > 0 && !video) {
      // Ambil video pertama
      const file   = videoFiles[0];
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 10) {
        setVideoError(`Video terlalu besar (${sizeMB.toFixed(1)} MB). Maks. 10 MB.`);
      } else {
        setVideoError('');
        const preview = URL.createObjectURL(file);
        const reader  = new FileReader();
        reader.onload = ev => {
          const dataUrl = ev.target?.result as string;
          setVideo({ name: file.name, type: file.type, base64: dataUrl.split(',')[1], preview, sizeMB: Math.round(sizeMB * 10) / 10 });
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !kategori || !lokasi.trim() || !deskripsi.trim()) {
      setError('Mohon pilih kategori dan lengkapi seluruh kolom wajib bertanda (*).'); return;
    }
    setLoading(true); setError('');
    const hasVideo = !!video;
    setUploadProgress({ phase: 'preparing', percent: 8, label: 'Mempersiapkan data laporan...' });

    try {
      const cleanKontak = kontak.replace(/[^0-9]/g, '').trim();
      const payload = {
        nama: nama.trim(), kontak: cleanKontak, kategori: kategori.trim(),
        lokasi: lokasi.trim(), tanggalKejadian: tanggalKejadian || getTodayString(),
        koordinat: geoCoords, mapUrl: geoCoords ? `https://maps.google.com/?q=${geoCoords.lat},${geoCoords.lng}` : '',
        deskripsi: cleanKontak ? `${deskripsi.trim()}\n\n[Kontak Pelapor (WA): ${cleanKontak}]` : deskripsi.trim(),
        tingkatKeparahan, source: 'Halaman Pengaduan Web', photos,
        videos: video ? [{ name: video.name, type: video.type, base64: video.base64 }] : [],
      };

      await new Promise(r => setTimeout(r, 150));
      setUploadProgress({
        phase: 'uploading', percent: 15,
        label: hasVideo ? `Mengunggah video (${video!.sizeMB} MB)${photos.length ? ` & ${photos.length} foto` : ''}...` : `Mengunggah ${photos.length} foto bukti...`,
      });

      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = ev => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 70) + 15;
            setUploadProgress({
              phase: 'uploading', percent: Math.min(pct, 85),
              label: hasVideo ? `Mengunggah video & foto... ${Math.min(pct,85)}%` : `Mengunggah foto... ${Math.min(pct,85)}%`,
            });
          }
        };
        xhr.onload = () => {
          setUploadProgress({ phase: 'saving', percent: 92, label: 'Menyimpan laporan ke sistem...' });
          try {
            const res = JSON.parse(xhr.responseText);
            if (xhr.status >= 400) reject(new Error(res.error || 'Gagal mengirim aduan.'));
            else resolve(res);
          } catch { reject(new Error('Respons tidak valid dari server.')); }
        };
        xhr.onerror   = () => reject(new Error('Koneksi gagal. Periksa jaringan Anda.'));
        xhr.ontimeout = () => reject(new Error('Upload terlalu lama. Coba lagi atau kurangi ukuran video.'));
        xhr.timeout   = 120000;
        xhr.open('POST', '/api/submit-complaint');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(payload));
      });

      setUploadProgress({ phase: 'done', percent: 100, label: 'Laporan berhasil dikirim! ✓' });
      setTicketResult(data.ticketNumber);
      await new Promise(r => setTimeout(r, 800));
      setTab('success');
      sendPushToRole('admin', {
        title: 'Aduan Warga Baru Masuk! 🚨',
        body: `${kategori.trim()}: ${lokasi.trim()} (Pelapor: ${nama.trim()})`,
        url: '/aduan', ticket: data.ticketNumber,
      }).catch(console.error);

    } catch (err: any) {
      if (db) {
        try {
          setUploadProgress({ phase: 'saving', percent: 60, label: 'Mode fallback: menyimpan langsung...' });
          const d = new Date();
          const fallbackTicket = `ADU-${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*10000)).padStart(4,'0')}`;
          const pad = (n: number) => String(n).padStart(2,'0');
          const ts  = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
          const ck  = kontak.replace(/[^0-9]/g,'').trim();
          await setDoc(doc(db, 'aduan', fallbackTicket), {
            ticket: fallbackTicket, timestamp: ts, nama: nama.trim(), kontak: ck,
            kategori: kategori.trim(), lokasi: lokasi.trim(), tanggalKejadian: tanggalKejadian || getTodayString(),
            koordinat: geoCoords || null, mapUrl: geoCoords ? `https://maps.google.com/?q=${geoCoords.lat},${geoCoords.lng}` : '',
            deskripsi: ck ? `${deskripsi.trim()}\n\n[Kontak: ${ck}]` : deskripsi.trim(),
            tingkatKeparahan, fotos: [], jumlahFoto: 0, videos: [], jumlahVideo: 0,
            status: 'Baru', catatan: '', updatedAt: ts, source: 'Halaman Pengaduan Web (Fallback)',
          });
          if (photos.length > 0) setError(`⚠️ Laporan terkirim, namun ${photos.length} foto tidak dapat diupload (server API tidak tersedia).`);
          setUploadProgress({ phase: 'done', percent: 100, label: 'Laporan tersimpan (fallback).' });
          setTicketResult(fallbackTicket);
          sendPushToRole('admin', { title: 'Aduan Warga Baru! 🚨', body: `${kategori}: ${lokasi} (${nama})`, url: '/aduan', ticket: fallbackTicket }).catch(console.error);
          await new Promise(r => setTimeout(r, 800));
          setTab('success'); return;
        } catch (fbErr: any) { setError(fbErr.message || 'Terjadi kesalahan sistem.'); }
      }
      setError(err.message || 'Terjadi kesalahan sistem saat mengirim laporan.');
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress({ phase: 'idle', percent: 0, label: '' }), 3000);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) return;
    setTrackLoading(true); setTrackResult(null); setTrackError('');
    try {
      const res  = await fetch(`/api/complaint-status?ticket=${encodeURIComponent(trackInput.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok || !data.found) throw new Error(data.message || 'Nomor tiket tidak ditemukan. Periksa kembali.');
      setTrackResult(data);
    } catch (err: any) { setTrackError(err.message); }
    finally { setTrackLoading(false); }
  };

  const copyTicket = () => {
    if (!ticketResult) return;
    navigator.clipboard.writeText(ticketResult);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = "w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs sm:text-sm";
  const labelCls = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8" tabIndex={-1}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <button type="button" onClick={onBack} className="hover:text-orange-600 dark:hover:text-orange-400 font-semibold flex items-center gap-1 cursor-pointer">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-white font-bold">Pengaduan Warga</span>
        </nav>

        {/* Hero */}
        <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Layanan Pengaduan Warga</h1>
            <p className="text-sm text-slate-400 mt-1.5">Sampaikan keluhan dan laporan kejadian untuk lingkungan RT 01 RW 01 secara efektif.</p>
          </div>
          <button type="button" onClick={() => document.getElementById('kontak-darurat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="group shrink-0 flex flex-col items-center gap-1 cursor-pointer self-start sm:self-auto" aria-label="Kontak Darurat">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-14 h-14 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
              <svg viewBox="0 0 56 56" className="w-14 h-14 drop-shadow-lg group-hover:scale-110 transition-transform duration-200" fill="none">
                <polygon points="28,5 53,50 3,50" fill="#dc2626" opacity="0.92" />
                <polygon points="28,5 53,50 3,50" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                <text x="28" y="39" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily="sans-serif">!</text>
              </svg>
            </div>
            <span className="text-[10px] font-black text-red-400 tracking-widest uppercase group-hover:text-red-300 whitespace-nowrap">Darurat</span>
          </button>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Tabs */}
          <div className="flex p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 max-w-md mx-auto shadow-inner">
            <button type="button" onClick={() => setTab('form')}
              className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tab==='form'||tab==='success' ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}>
              <Send className="w-4 h-4" /> Buat Pengaduan
            </button>
            <button type="button" onClick={() => setTab('track')}
              className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tab==='track' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}>
              <Search className="w-4 h-4" /> Lacak Status
            </button>
          </div>

          {/* ═══ FORM ═══ */}
          {tab === 'form' && (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-10 shadow-xl relative overflow-visible">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 rounded-t-3xl" />
              <form onSubmit={handleSubmit} className="space-y-7 sm:space-y-8">
                {error && (
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                  </div>
                )}

                {/* Bagian 1 */}
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shrink-0">1</div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Informasi Dasar Kejadian</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className={labelCls}>Kategori Pengaduan <span className="text-red-500">*</span></label>
                      <CustomCleanCategorySelect categories={categoriesList} value={kategori} onChange={setKategori} />
                    </div>
                    <div>
                      <label className={labelCls}>Tanggal Kejadian <span className="text-red-500">*</span></label>
                      <InlineCalendarDropdown value={tanggalKejadian} onChange={setTanggalKejadian} />
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Waktu saat kejadian terjadi.</p>
                    </div>
                  </div>

                  {/* Lokasi */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelCls + ' mb-0'}>Lokasi Kejadian <span className="text-red-500">*</span></label>
                      <button type="button" onClick={fetchCurrentLocation} disabled={geoLoading}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer">
                        {geoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                        Ambil GPS Saat Ini
                      </button>
                    </div>
                    <div className="relative">
                      <input type="text" required value={lokasi} onChange={e => setLokasi(e.target.value)}
                        placeholder="Contoh: RT 03 Dusun Krajan / Depan Balai Desa" className={inputCls + ' pl-10'} />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    {geoCoords && (
                      <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">GPS: {geoCoords.lat.toFixed(6)}, {geoCoords.lng.toFixed(6)}</span>
                      </div>
                    )}
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className={labelCls}>Deskripsi &amp; Kronologi <span className="text-red-500">*</span></label>
                    <textarea required rows={4} value={deskripsi} onChange={e => setDeskripsi(e.target.value)}
                      placeholder="Jelaskan kronologi dan rincian kejadian secara jelas..."
                      className={inputCls + ' resize-none leading-relaxed'} />
                  </div>

                  {/* Foto & Video — satu galeri */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={labelCls + ' mb-0'}>
                        Foto &amp; Video Bukti <span className="text-slate-400 font-normal">(Maks. 5 foto + 1 video, video maks. 10 MB)</span>
                      </label>
                      <span className="text-xs text-slate-400 font-mono">{photos.length} foto{video ? ' · 1 video' : ''}</span>
                    </div>

                    {/* Hidden inputs */}
                    <input ref={cameraInputRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />
                    <input ref={galleryInputRef} type="file" accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/*" multiple className="hidden" onChange={handleGallerySelect} />

                    {/* Error video */}
                    {videoError && (
                      <div className="mb-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {videoError}
                      </div>
                    )}

                    {/* Preview grid foto + video */}
                    {(photos.length > 0 || video) && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                        {/* Foto */}
                        {photos.map((p, idx) => (
                          <div key={`photo-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                            <img src={p.preview} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setPhotos(prev => prev.filter((_,i) => i!==idx))}
                              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {/* Video thumbnail */}
                        {video && (
                          <div className="relative col-span-2 sm:col-span-2 rounded-2xl overflow-hidden border border-purple-200 dark:border-purple-800 bg-slate-100 dark:bg-slate-800">
                            <video src={video.preview} className="w-full max-h-32 object-contain block" />
                            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Video className="w-3 h-3 text-purple-400" />
                                <span className="text-[10px] text-white truncate max-w-[80px]">{video.name}</span>
                                <span className="text-[10px] text-purple-300 font-bold">{video.sizeMB}MB</span>
                              </div>
                            </div>
                            <button type="button" onClick={() => { setVideo(null); setVideoError(''); }}
                              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tombol tambah */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Kamera */}
                      <button type="button" onClick={() => cameraInputRef.current?.click()}
                        className="py-3.5 px-4 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-900/50 hover:border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer group">
                        <Camera className="w-5 h-5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Ambil Foto Kamera</div>
                          <div className="text-[10px] text-slate-500">Foto langsung + koordinat GPS</div>
                        </div>
                      </button>
                      {/* Galeri — foto & video sekaligus */}
                      <button type="button" onClick={() => galleryInputRef.current?.click()}
                        className="py-3.5 px-4 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-900/50 hover:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer group">
                        <GalleryIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Pilih dari Galeri</div>
                          <div className="text-[10px] text-slate-500">Foto atau video dari perangkat</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Tingkat Keparahan */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shrink-0">2</div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Tingkat Keparahan</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      { value: 'ringan', label: 'Ringan', desc: 'Tidak mengancam jiwa, kerusakan minimal',  color: 'emerald', dot: 'bg-emerald-500' },
                      { value: 'sedang', label: 'Sedang', desc: 'Mengancam ketertiban, kerusakan sedang',   color: 'amber',   dot: 'bg-amber-500'  },
                      { value: 'tinggi', label: 'Tinggi', desc: 'Situasi darurat, perlu tindakan segera',   color: 'orange',  dot: 'bg-orange-500' },
                      { value: 'kritis', label: 'Kritis', desc: 'Bahaya langsung, potensi korban jiwa',     color: 'red',     dot: 'bg-red-600'    },
                    ] as const).map(opt => {
                      const isSel = tingkatKeparahan === opt.value;
                      const bord = { emerald: 'border-emerald-500 ring-emerald-500/20', amber: 'border-amber-500 ring-amber-500/20', orange: 'border-orange-500 ring-orange-500/20', red: 'border-red-600 ring-red-600/20' };
                      const bgs  = { emerald: 'bg-emerald-50 dark:bg-emerald-950/20', amber: 'bg-amber-50 dark:bg-amber-950/20', orange: 'bg-orange-50 dark:bg-orange-950/20', red: 'bg-red-50 dark:bg-red-950/20' };
                      const lbl  = { emerald: 'text-emerald-700 dark:text-emerald-300', amber: 'text-amber-700 dark:text-amber-300', orange: 'text-orange-700 dark:text-orange-300', red: 'text-red-700 dark:text-red-300' };
                      return (
                        <button key={opt.value} type="button" onClick={() => setTingkatKeparahan(opt.value)}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${isSel ? `${bord[opt.color]} ring-2 ${bgs[opt.color]}` : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'}`}>
                          <span className={`mt-0.5 w-3 h-3 rounded-full shrink-0 ${opt.dot} ${isSel ? 'scale-125' : 'opacity-60'} transition-transform`} />
                          <div>
                            <div className={`text-xs font-extrabold ${isSel ? lbl[opt.color] : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</div>
                            <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{opt.desc}</div>
                          </div>
                          {isSel && <Check className={`w-4 h-4 ml-auto shrink-0 ${lbl[opt.color]}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bagian 3: Pelapor */}
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shrink-0">3</div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Informasi Pelapor</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className={labelCls}>Nama Pelapor <span className="text-red-500">*</span></label>
                      <input type="text" required value={nama} onChange={e => setNama(e.target.value)} placeholder="Masukkan nama Anda" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Nomor WhatsApp / HP <span className="text-slate-400 font-normal">(Konfirmasi)</span></label>
                      <div className="relative">
                        <input type="tel" inputMode="numeric" pattern="[0-9]*" autoComplete="tel" maxLength={14}
                          value={kontak} onChange={e => setKontak(e.target.value.replace(/[^0-9]/g,''))}
                          placeholder="08xxxxxxxxxx" className={inputCls + ' pl-10'} />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Format angka tanpa spasi (contoh: 081234567890).</p>
                    </div>
                  </div>
                </div>

                {/* Submit area */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  {/* Progress Bar — hanya tampil saat loading */}
                  {loading && (
                    <UploadProgressBar
                      phase={uploadProgress.phase}
                      percent={uploadProgress.percent}
                      label={uploadProgress.label}
                    />
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>
                          {uploadProgress.phase === 'preparing' && 'Mempersiapkan...'}
                          {uploadProgress.phase === 'uploading' && `Mengunggah ${uploadProgress.percent}%...`}
                          {uploadProgress.phase === 'saving'    && 'Menyimpan laporan...'}
                          {uploadProgress.phase === 'done'      && 'Selesai!'}
                          {uploadProgress.phase === 'idle'      && 'Mengirim...'}
                        </span>
                      </>
                    ) : (
                      <><Send className="w-5 h-5" /> Kirim Laporan Pengaduan</>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Laporan Anda akan segera diproses oleh tim keamanan.
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ═══ SUCCESS ═══ */}
          {tab === 'success' && (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-12 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Laporan Berhasil Terkirim!</h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Terima kasih atas kepedulian Anda. Laporan telah masuk ke sistem komando Satlinmas Desa Tugurejo.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 max-w-sm mx-auto space-y-2">
                <div className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Nomor Tiket Resmi</div>
                <div className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-widest">{ticketResult}</div>
                <button type="button" onClick={copyTicket}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin!' : 'Salin Nomor Tiket'}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button type="button" onClick={() => { setTrackInput(ticketResult); setTab('track'); }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer">
                  <Search className="w-4 h-4" /> Lacak Tiket Ini
                </button>
                <button type="button" onClick={() => {
                    setNama(''); setKontak(''); setLokasi(''); setDeskripsi('');
                    setPhotos([]); setVideo(null); setTicketResult('');
                    setGeoCoords(null); setTingkatKeparahan('ringan'); setTab('form');
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer">
                  Buat Laporan Lain
                </button>
              </div>
            </div>
          )}

          {/* ═══ TRACK ═══ */}
          {tab === 'track' && (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-10 shadow-xl relative overflow-visible space-y-6">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-t-3xl" />

              <form onSubmit={handleTrack} className="space-y-4">
                <div>
                  <label className={labelCls}>Masukkan Nomor Tiket Pengaduan Anda</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input type="text" required value={trackInput} onChange={e => setTrackInput(e.target.value.toUpperCase())}
                        placeholder="Contoh: ADU-260821-0001"
                        className={inputCls + ' uppercase tracking-widest font-mono font-bold pl-10'} />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button type="submit" disabled={trackLoading}
                      className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 disabled:opacity-50">
                      {trackLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                      Cari Tiket
                    </button>
                  </div>
                </div>
              </form>

              {trackError && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {trackError}
                </div>
              )}

              {trackResult && (
                <div className="p-5 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nomor Tiket</div>
                      <div className="text-lg sm:text-xl font-black font-mono text-blue-600 dark:text-blue-400">{trackResult.ticket || trackInput}</div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${STATUS_CFG[trackResult.status]?.bg||'bg-slate-100'} ${STATUS_CFG[trackResult.status]?.color||''}`}>
                      {trackResult.status || 'Baru'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div><span className="text-slate-400 block font-bold">Kategori</span><span className="text-slate-900 dark:text-white font-bold">{trackResult.kategori||'-'}</span></div>
                    <div><span className="text-slate-400 block font-bold">Tanggal Kejadian</span><span className="text-slate-900 dark:text-white font-bold">{formatIndoDate(trackResult.tanggalKejadian)||trackResult.timestamp||'-'}</span></div>
                    <div><span className="text-slate-400 block font-bold">Lokasi</span><span className="text-slate-900 dark:text-white font-bold">{trackResult.lokasi||'-'}</span></div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block font-bold mb-1">Rincian Pengaduan:</span>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {trackResult.deskripsi}
                    </div>
                  </div>

                  {trackResult.mapUrl && (
                    <a href={trackResult.mapUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:underline">
                      <MapPin className="w-3.5 h-3.5" /> Buka Titik Lokasi di Google Maps
                    </a>
                  )}

                  {/* Foto & Video bukti — satu section */}
                  {((Array.isArray(trackResult.fotos) && trackResult.fotos.length > 0) ||
                    (Array.isArray(trackResult.videos) && trackResult.videos.length > 0)) && (
                    <div className="space-y-3">
                      <span className="text-xs text-slate-400 block font-bold">
                        Foto &amp; Video Bukti
                        {trackResult.fotos?.length ? ` (${trackResult.fotos.length} foto` : ' ('}
                        {trackResult.videos?.length ? `${trackResult.fotos?.length ? ', ' : ''}${trackResult.videos.length} video` : ''}):
                      </span>
                      {/* Grid foto */}
                      {Array.isArray(trackResult.fotos) && trackResult.fotos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {trackResult.fotos.map((url: string, fi: number) => (
                            <a key={fi} href={url} target="_blank" rel="noopener noreferrer"
                              className="block w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity">
                              <img src={url} alt={`Foto ${fi+1}`} className="w-full h-full object-cover" loading="lazy" />
                            </a>
                          ))}
                        </div>
                      )}
                      {/* Video player */}
                      {Array.isArray(trackResult.videos) && trackResult.videos.length > 0 && (
                        <div className="space-y-2">
                          {trackResult.videos.map((videoUrl: string, vi: number) => (
                            <div key={vi} className="rounded-2xl overflow-hidden border border-purple-200 dark:border-purple-800 bg-slate-100 dark:bg-slate-800">
                              <video src={videoUrl} controls preload="metadata" className="w-full max-h-64 object-contain block">
                                Browser Anda tidak mendukung pemutaran video.
                              </video>
                              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-purple-100 dark:border-purple-900">
                                <div className="flex items-center gap-1.5">
                                  <Play className="w-3.5 h-3.5 text-purple-500" />
                                  <span className="text-xs text-slate-500">Video Bukti {vi + 1}</span>
                                </div>
                                <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
                                  Buka di tab baru
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tindak lanjut */}
                  {trackResult.catatan && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 space-y-2">
                      <span className="font-extrabold block">Catatan Tindak Lanjut Petugas:</span>
                      <p className="leading-relaxed">{trackResult.catatan}</p>
                      {trackResult.fotoTindakLanjut && (
                        <a href={trackResult.fotoTindakLanjut} target="_blank" rel="noopener noreferrer"
                          className="block w-24 h-24 rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-800 hover:opacity-80 mt-2">
                          <img src={trackResult.fotoTindakLanjut} alt="Foto Tindak Lanjut" className="w-full h-full object-cover" loading="lazy" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Kontak Darurat */}
          <div id="kontak-darurat" className="mt-14 pt-10 border-t border-slate-200/80 dark:border-slate-800 scroll-mt-28">
            <KontakDaruratSection />
          </div>
        </div>
      </main>
    </div>
  );
}
