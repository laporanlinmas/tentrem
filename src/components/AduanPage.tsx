'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Upload,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Phone,
  MapPin,
  Sparkles,
  Info,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  Camera,
  Image as GalleryIcon,
  Navigation,
  Loader2,
  Home } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

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
  'Lainnya / Aspirasi'
];

const STATUS_CFG: Record<string, { color: string; bg: string; Icon: typeof CheckCircle2 }> = {
  Baru:     { color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',     Icon: Clock },
  Diproses: { color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', Icon: AlertCircle },
  Selesai:  { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', Icon: CheckCircle2 },
  Ditolak:  { color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',         Icon: AlertCircle } };

function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthIdx = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)} ${months[monthIdx] || m} ${y}`;
}

function getTodayString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ═════════════════════════════════════════════════════════════
// 1. CUSTOM CALENDAR MODAL WITH CUSTOM MONTH & YEAR SELECTORS
// ═════════════════════════════════════════════════════════════
interface CalendarModalProps {
  currentValue: string;
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

const CustomCalendarModal: React.FC<CalendarModalProps> = ({ currentValue, onSelect, onClose }) => {
  const initialDate = currentValue ? new Date(currentValue) : new Date();
  const validInitial = !isNaN(initialDate.getTime());
  const initialYear = validInitial ? initialDate.getFullYear() : new Date().getFullYear();
  const initialMonth = validInitial ? initialDate.getMonth() : new Date().getMonth();
  const initialDay = validInitial ? initialDate.getDate() : new Date().getDate();

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(validInitial ? initialDay : null);

  // Custom sub-dropdown states (No native select boxes)
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y);
  }

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  const handleSelectDay = (d: number) => {
    setSelectedDay(d);
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onSelect(`${year}-${mm}-${dd}`);
    onClose();
  };

  const handleSetToday = () => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    onSelect(`${today.getFullYear()}-${mm}-${dd}`);
    onClose();
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-extrabold text-sm">
            <Calendar className="w-4 h-4" />
            <span>Pilih Tanggal Kejadian</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Custom Month & Year Interactive Selectors (No native select boxes) */}
        <div className="flex items-center justify-between gap-1.5 relative">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Custom Month Trigger Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowMonthPicker(!showMonthPicker);
                setShowYearPicker(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{months[month]}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showMonthPicker ? 'rotate-180 text-orange-500' : ''}`} />
            </button>

            {/* Custom Month Grid Popup */}
            {showMonthPicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 grid grid-cols-3 gap-1 w-56 animate-in fade-in zoom-in-95 duration-150">
                {months.map((mName, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMonth(idx);
                      setShowMonthPicker(false);
                    }}
                    className={`p-2 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                      month === idx
                        ? 'bg-orange-500 text-white font-extrabold shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {mName.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Year Trigger Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowYearPicker(!showYearPicker);
                setShowMonthPicker(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{year}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showYearPicker ? 'rotate-180 text-orange-500' : ''}`} />
            </button>

            {/* Custom Year List Popup */}
            {showYearPicker && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 w-28 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                {years.map(yVal => (
                  <button
                    key={yVal}
                    type="button"
                    onClick={() => {
                      setYear(yVal);
                      setShowYearPicker(false);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                      year === yVal
                        ? 'bg-orange-500 text-white font-extrabold shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {yVal}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <div className="text-red-500">Min</div>
          <div>Sen</div>
          <div>Sel</div>
          <div>Rab</div>
          <div>Kam</div>
          <div>Jum</div>
          <div className="text-blue-500">Sab</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysGrid.map((dayVal, idx) => {
            if (dayVal === null) {
              return <div key={`empty-${idx}`} />;
            }
            const isToday =
              dayVal === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            const isSelected =
              selectedDay === dayVal &&
              validInitial &&
              year === initialYear &&
              month === initialMonth;

            return (
              <button
                key={`day-${dayVal}`}
                type="button"
                onClick={() => handleSelectDay(dayVal)}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 scale-105'
                    : isToday
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black border border-orange-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {dayVal}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleSetToday}
            className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold transition-colors cursor-pointer"
          >
            Hari Ini
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
// 2. CLEAN CUSTOM CATEGORY DROPDOWN (NO EMOJIS/ICONS, CLEAN UI)
// ═════════════════════════════════════════════════════════════
interface CustomCleanCategorySelectProps {
  categories: string[];
  value: string;
  onChange: (val: string) => void;
}

const CustomCleanCategorySelect: React.FC<CustomCleanCategorySelectProps> = ({ categories, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-4 py-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
          open
            ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white dark:bg-slate-900 shadow-md'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <span className={`text-xs sm:text-sm font-semibold truncate ${value ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
          {value || '-- Pilih Kategori Pengaduan --'}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-orange-500' : ''
          }`}
        />
      </button>

      {/* Clean Options Menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 max-h-64 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
          {categories.map((catName) => {
            const isSelected = value === catName;
            return (
              <button
                key={catName}
                type="button"
                onClick={() => {
                  onChange(catName);
                  setOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium'
                }`}
              >
                <span>{catName}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
// 3. MAIN ADUAN PAGE COMPONENT
// ═════════════════════════════════════════════════════════════
export default function AduanPage({ onBack, initialTab = 'form' }: AduanPageProps) {
  const [tab, setTab] = useState<'form' | 'track' | 'success'>(initialTab);

  // Categories from Firestore (Synced with Admin)
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_KATEGORI);

  // Form State
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [kategori, setKategori] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [tanggalKejadian, setTanggalKejadian] = useState<string>(getTodayString());
  const [deskripsi, setDeskripsi] = useState('');
  const [tingkatKeparahan, setTingkatKeparahan] = useState<'ringan' | 'sedang' | 'tinggi' | 'kritis'>('ringan');
  const [photos, setPhotos] = useState<{ name: string; type: string; base64: string; preview: string }[]>([]);
  
  // GPS Geolocation state
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoAddress, setGeoAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketResult, setTicketResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Track State
  const [trackInput, setTrackInput] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState('');

  // Hidden File Inputs for Camera and Gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to Categories from Firestore (Settings collection)
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'settings', 'aduan_categories'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.list) && data.list.length > 0) {
          setCategoriesList(data.list);
        }
      }
    }, () => {});
    return () => unsub();
  }, []);

  // Get Live Geolocation (SIPEDAS Mechanism)
  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGeoCoords({ lat, lng });

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.display_name) {
            setGeoAddress(data.display_name);
            if (!lokasi) {
              setLokasi(data.display_name);
            }
          }
        } catch {
          if (!lokasi) {
            setLokasi(`Titik Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        console.warn('Geolocation warning:', err);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle Capture from Camera (Triggers GPS + Clean Image without watermark)
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    fetchCurrentLocation();
    if (e.target.files) {
      addPhotos(e.target.files);
    }
  };

  // Handle Select from Gallery (Clean Image without watermark)
  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addPhotos(e.target.files);
    }
  };

  const addPhotos = (files: FileList) => {
    Array.from(files).slice(0, 5 - photos.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Clean base64 image data without any watermark
        setPhotos(prev => [...prev, { name: file.name, type: file.type, base64: dataUrl.split(',')[1], preview: dataUrl }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !kategori || !lokasi.trim() || !deskripsi.trim()) {
      setError('Mohon pilih kategori dan lengkapi seluruh kolom wajib bertanda (*).');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const cleanKontak = kontak.replace(/[^0-9]/g, '').trim();

      const payloadDeskripsi = cleanKontak
        ? `${deskripsi.trim()}\n\n[Kontak Pelapor (WA): ${cleanKontak}]`
        : deskripsi.trim();

      const payload = {
        nama: nama.trim(),
        kontak: cleanKontak,
        kategori: kategori.trim(),
        lokasi: lokasi.trim(),
        tanggalKejadian: tanggalKejadian || getTodayString(),
        koordinat: geoCoords,
        mapUrl: geoCoords ? `https://maps.google.com/?q=${geoCoords.lat},${geoCoords.lng}` : '',
        deskripsi: payloadDeskripsi,
        tingkatKeparahan,
        source: 'Halaman Pengaduan Web',
        photos
      };

      const res = await fetch('/api/submit-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim aduan.');
      setTicketResult(data.ticketNumber);
      setTab('success');
    } catch (err: any) {
      // Fallback: kirim langsung ke Firestore tanpa foto (jika API tidak tersedia)
      if (db) {
        try {
          const d = new Date();
          const yy = d.getFullYear().toString().slice(-2);
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
          const fallbackTicket = `ADU-${yy}${mm}${dd}-${rand}`;

          const pad = (n: number) => String(n).padStart(2, '0');
          const ts = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

          const cleanKontakFb = kontak.replace(/[^0-9]/g, '').trim();
          const payloadDescrFb = cleanKontakFb
            ? `${deskripsi.trim()}\n\n[Kontak Pelapor (WA): ${cleanKontakFb}]`
            : deskripsi.trim();

          await setDoc(doc(db, 'aduan', fallbackTicket), {
            ticket:          fallbackTicket,
            timestamp:       ts,
            nama:            nama.trim(),
            kontak:          cleanKontakFb,
            kategori:        kategori.trim(),
            lokasi:          lokasi.trim(),
            tanggalKejadian: tanggalKejadian || getTodayString(),
            koordinat:       geoCoords || null,
            mapUrl:          geoCoords ? `https://maps.google.com/?q=${geoCoords.lat},${geoCoords.lng}` : '',
            deskripsi:       payloadDescrFb,
            tingkatKeparahan,
            fotos:           [],
            jumlahFoto:      0,
            status:          'Baru',
            catatan:         '',
            updatedAt:       ts,
            source:          'Halaman Pengaduan Web (Fallback)' });

          setTicketResult(fallbackTicket);
          // Tampilkan warning jika ada foto yang tidak terupload
          if (photos.length > 0) {
            setError(
              `⚠️ Laporan berhasil dikirim, namun ${photos.length} foto tidak dapat diupload karena server API tidak tersedia. ` +
              `Petugas mungkin menghubungi Anda untuk meminta foto melalui WhatsApp.`
            );
          }
          setTab('success');
          return;
        } catch (fbErr: any) {
          setError(fbErr.message || 'Terjadi kesalahan sistem.');
        }
      }
      setError(err.message || 'Terjadi kesalahan sistem saat mengirim laporan.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) return;
    setTrackLoading(true);
    setTrackResult(null);
    setTrackError('');
    try {
      const res = await fetch(`/api/complaint-status?ticket=${encodeURIComponent(trackInput.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok || !data.found) throw new Error(data.message || 'Nomor tiket tidak ditemukan. Periksa kembali penulisan nomor tiket Anda.');
      setTrackResult(data);
    } catch (err: any) {
      setTrackError(err.message);
    } finally {
      setTrackLoading(false);
    }
  };

  const copyTicket = () => {
    if (!ticketResult) return;
    navigator.clipboard.writeText(ticketResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = "w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs sm:text-sm";
  const labelCls = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">

      {/* Main Content Area */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8" tabIndex={-1}>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <button type="button" onClick={onBack} className="hover:text-orange-600 dark:hover:text-orange-400 font-semibold flex items-center gap-1 cursor-pointer">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-white font-bold">Pengaduan Warga</span>
        </nav>

        {/* Hero Header Banner */}
        <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Layanan Pengaduan Warga</h1>
          <p className="text-sm text-slate-400 mt-1.5">Sampaikan keluhan, laporan kejadian, atau masukan untuk lingkungan Desa Tugurejo secara cepat dan terarsip.</p>
        </div>

        {/* Tab Switcher + Content Wrapper */}
        <div className="space-y-6 sm:space-y-8">

        {/* Tab Switcher */}
        <div className="flex p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 max-w-md mx-auto shadow-inner">
          <button
            type="button"
            onClick={() => setTab('form')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'form' || tab === 'success'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" /> Buat Pengaduan
          </button>
          <button
            type="button"
            onClick={() => setTab('track')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'track'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" /> Lacak Status
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════
           TAB 1: FORM PENGADUAN BARU
           ═══════════════════════════════════════════════════════ */}
        {tab === 'form' && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500" />

            <form onSubmit={handleSubmit} className="space-y-7 sm:space-y-8">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </div>
              )}

              {/* ════════════════════════════════════════════
                  BAGIAN 1: INFORMASI DASAR KEJADIAN
                  ════════════════════════════════════════════ */}
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shrink-0">1</div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Informasi Dasar Kejadian</h3>
                </div>

                {/* Kategori & Tanggal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className={labelCls}>
                      Kategori Pengaduan <span className="text-red-500">*</span>
                    </label>
                    <CustomCleanCategorySelect
                      categories={categoriesList}
                      value={kategori}
                      onChange={setKategori}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Tanggal Kejadian <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCalendar(true)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex items-center justify-between text-xs sm:text-sm hover:border-orange-500 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                        <span className="font-bold">{formatIndoDate(tanggalKejadian) || 'Pilih Tanggal'}</span>
                      </div>
                      <span className="text-[11px] text-orange-600 dark:text-orange-400 font-extrabold uppercase">Ganti</span>
                    </button>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Waktu saat kejadian.</p>
                  </div>
                </div>

                {/* Lokasi */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls + ' mb-0'}>
                      Lokasi Kejadian <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={fetchCurrentLocation}
                      disabled={geoLoading}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {geoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                      <span>Ambil Lokasi GPS Saat Ini</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={lokasi}
                      onChange={e => setLokasi(e.target.value)}
                      placeholder="Contoh: Jl. Diponegoro RT 03 Dusun Krajan / Depan Balai Desa"
                      className={inputCls + ' pl-10'}
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {geoCoords && (
                    <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span className="truncate">Koordinat GPS Terdeteksi: {geoCoords.lat.toFixed(6)}, {geoCoords.lng.toFixed(6)}</span>
                    </div>
                  )}
                </div>

                {/* Deskripsi */}
                <div>
                  <label className={labelCls}>
                    Deskripsi &amp; Kronologi Kejadian <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={deskripsi}
                    onChange={e => setDeskripsi(e.target.value)}
                    placeholder="Jelaskan kronologi, rincian permasalahan, atau temuan yang ingin dilaporkan secara jelas..."
                    className={inputCls + ' resize-none leading-relaxed'}
                  />
                </div>

                {/* Foto Bukti */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls + ' mb-0'}>
                      Foto Bukti Kejadian <span className="text-slate-400 font-normal">(Maks. 5 foto)</span>
                    </label>
                    <span className="text-xs text-slate-400 font-mono">{photos.length} / 5</span>
                  </div>
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGallerySelect} />
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                      {photos.map((p, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                          <img src={p.preview} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {photos.length < 5 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button type="button" onClick={() => cameraInputRef.current?.click()}
                        className="py-3.5 px-4 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-900/50 hover:border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer group">
                        <Camera className="w-5 h-5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Ambil Foto Kamera</div>
                          <div className="text-[10px] text-slate-500">Foto langsung &amp; koordinat GPS</div>
                        </div>
                      </button>
                      <button type="button" onClick={() => galleryInputRef.current?.click()}
                        className="py-3.5 px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer group">
                        <GalleryIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Pilih dari Galeri</div>
                          <div className="text-[10px] text-slate-500">Upload file foto dari perangkat</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ════════════════════════════════════════════
                  BAGIAN 2: TINGKAT KEPARAHAN
                  ════════════════════════════════════════════ */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shrink-0">2</div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Tingkat Keparahan</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { value: 'ringan',  label: 'Ringan',  desc: 'Tidak mengancam jiwa, kerusakan minimal',    color: 'emerald', dot: 'bg-emerald-500' },
                    { value: 'sedang',  label: 'Sedang',  desc: 'Mengancam jiwa, kerusakan sedang',           color: 'amber',   dot: 'bg-amber-500'  },
                    { value: 'tinggi',  label: 'Tinggi',  desc: 'Situasi darurat, perlu tindakan segera',     color: 'orange',  dot: 'bg-orange-500' },
                    { value: 'kritis',  label: 'Kritis',  desc: 'Bahaya langsung, korban jiwa',               color: 'red',     dot: 'bg-red-600'    },
                  ] as const).map(opt => {
                    const isSelected = tingkatKeparahan === opt.value;
                    const borderMap = { emerald: 'border-emerald-500 ring-emerald-500/20', amber: 'border-amber-500 ring-amber-500/20', orange: 'border-orange-500 ring-orange-500/20', red: 'border-red-600 ring-red-600/20' };
                    const bgMap     = { emerald: 'bg-emerald-50 dark:bg-emerald-950/20', amber: 'bg-amber-50 dark:bg-amber-950/20', orange: 'bg-orange-50 dark:bg-orange-950/20', red: 'bg-red-50 dark:bg-red-950/20' };
                    const lblMap    = { emerald: 'text-emerald-700 dark:text-emerald-300', amber: 'text-amber-700 dark:text-amber-300', orange: 'text-orange-700 dark:text-orange-300', red: 'text-red-700 dark:text-red-300' };
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTingkatKeparahan(opt.value)}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          isSelected
                            ? `${borderMap[opt.color]} ring-2 ${bgMap[opt.color]}`
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <span className={`mt-0.5 w-3 h-3 rounded-full shrink-0 ${opt.dot} ${isSelected ? 'scale-125' : 'opacity-60'} transition-transform`} />
                        <div>
                          <div className={`text-xs font-extrabold ${isSelected ? lblMap[opt.color] : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{opt.desc}</div>
                        </div>
                        {isSelected && (
                          <Check className={`w-4 h-4 ml-auto shrink-0 ${lblMap[opt.color]}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ════════════════════════════════════════════
                  BAGIAN 3: INFORMASI PELAPOR
                  ════════════════════════════════════════════ */}
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shrink-0">3</div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Informasi Pelapor</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className={labelCls}>
                      Nama Pelapor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nama}
                      onChange={e => setNama(e.target.value)}
                      placeholder="Masukkan nama Anda"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Nomor WhatsApp / HP <span className="text-slate-400 font-normal">(Untuk konfirmasi)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="tel"
                        maxLength={14}
                        value={kontak}
                        onChange={e => setKontak(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="08xxxxxxxxxx"
                        className={inputCls + ' pl-10'}
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Format angka tanpa spasi (contoh: 081234567890).
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengirim Laporan Pengaduan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Kirim Laporan Pengaduan Sekarang</span>
                    </>
                  )}
                </button>

                {/* Info proses */}
                <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Laporan Anda akan segera diproses oleh tim keamanan.
                </p>
              </div>

              {/* Kontak Darurat */}
              <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-extrabold uppercase tracking-wide">Butuh Bantuan Segera?</span>
                </div>
                <p className="text-[11px] text-red-700 dark:text-red-300 leading-relaxed">
                  Jika kejadian ini mengancam jiwa atau situasi darurat, segera hubungi nomor darurat yang tersedia di halaman utama atau kontak berikut:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {[
                    { label: 'Polisi',                       no: '110'              },
                    { label: 'Polres Ponorogo',              no: '(0352) 481745'    },
                    { label: 'RSUD Dr. Harjono Ponorogo',    no: '(0352) 489262'    },
                    { label: 'Damkar Ponorogo',              no: '(0352) 461013'    },
                    { label: 'Kodim Ponorogo',      		 no: '(0352) 481634'	},
                    { label: 'PLN',                          no: '123'              },
                    { label: 'SAR Ponorogo',                 no: '+62 812-5975-2500'},
                    { label: 'BPBD Ponorogo',                no: '(0352) 463232'    },
                  ].map(({ label, no }) => (
                    <a key={label} href={`tel:${no.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-red-100 dark:border-red-900/40 hover:border-red-400 transition-colors group">
                      <span className="text-slate-600 dark:text-slate-400 truncate">{label}</span>
                      <span className="font-extrabold text-red-600 dark:text-red-400 shrink-0 group-hover:underline">{no}</span>
                    </a>
                  ))}
                </div>
              </div>

            </form>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB 2: SUCCESS SUBMITTED CONFIRMATION
           ═══════════════════════════════════════════════════════ */}
        {tab === 'success' && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-12 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Laporan Anda Berhasil Terkirim!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Terima kasih atas kepedulian Anda. Laporan ini telah masuk ke sistem komando Satlinmas Desa Tugurejo dan segera ditindaklanjuti oleh petugas.
              </p>
            </div>

            {/* Ticket Box */}
            <div className="p-5 rounded-2xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 max-w-sm mx-auto space-y-2">
              <div className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Nomor Tiket Resmi Aduan
              </div>
              <div className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-widest">
                {ticketResult}
              </div>
              <button
                type="button"
                onClick={copyTicket}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Nomor Tiket Tersalin' : 'Salin Nomor Tiket'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setTrackInput(ticketResult);
                  setTab('track');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" /> Lacak Tiket Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  setNama('');
                  setKontak('');
                  setLokasi('');
                  setDeskripsi('');
                  setPhotos([]);
                  setTicketResult('');
                  setGeoCoords(null);
                  setGeoAddress('');
                  setTingkatKeparahan('ringan');
                  setTab('form');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                Buat Laporan Lain
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB 3: TRACK TIKET PENGADUAN
           ═══════════════════════════════════════════════════════ */}
        {tab === 'track' && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-10 shadow-xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label className={labelCls}>Masukkan Nomor Tiket Pengaduan Anda</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={trackInput}
                      onChange={e => setTrackInput(e.target.value.toUpperCase())}
                      placeholder="Contoh: ADU-260821-0001"
                      className={inputCls + ' uppercase tracking-widest font-mono font-bold'}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="submit"
                    disabled={trackLoading}
                    className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {trackLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>Cari Tiket</span>
                  </button>
                </div>
              </div>
            </form>

            {trackError && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" /> {trackError}
              </div>
            )}

            {/* Track Result Card */}
            {trackResult && (
              <div className="p-5 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nomor Tiket</div>
                    <div className="text-lg sm:text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                      {trackResult.ticket || trackInput}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${STATUS_CFG[trackResult.status]?.bg || 'bg-slate-100 text-slate-700'} ${STATUS_CFG[trackResult.status]?.color || ''}`}>
                      {trackResult.status || 'Baru'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-bold">Kategori</span>
                    <span className="text-slate-900 dark:text-white font-bold">{trackResult.kategori || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Tanggal Kejadian</span>
                    <span className="text-slate-900 dark:text-white font-bold">{formatIndoDate(trackResult.tanggalKejadian) || trackResult.timestamp || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Lokasi</span>
                    <span className="text-slate-900 dark:text-white font-bold">{trackResult.lokasi || '-'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block font-bold mb-1">Rincian Pengaduan:</span>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {trackResult.deskripsi}
                  </div>
                </div>

                {trackResult.mapUrl && (
                  <div className="pt-2">
                    <a
                      href={trackResult.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Buka Titik Peta Lokasi di Google Maps
                    </a>
                  </div>
                )}

                {/* Foto Bukti Pengaduan */}
                {Array.isArray(trackResult.fotos) && trackResult.fotos.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs text-slate-400 block font-bold">
                      Foto Bukti ({trackResult.fotos.length} foto):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {trackResult.fotos.map((fotoUrl: string, fi: number) => (
                        <a
                          key={fi}
                          href={fotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={fotoUrl}
                            alt={`Foto bukti ${fi + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tindak Lanjut Petugas */}
                {trackResult.catatan && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 space-y-2">
                    <span className="font-extrabold block">Catatan Tindak Lanjut Petugas:</span>
                    <p className="leading-relaxed">{trackResult.catatan}</p>
                    {trackResult.fotoTindakLanjut && (
                      <a
                        href={trackResult.fotoTindakLanjut}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-24 h-24 rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-800 hover:opacity-80 transition-opacity mt-2"
                      >
                        <img
                          src={trackResult.fotoTindakLanjut}
                          alt="Foto Tindak Lanjut"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        </div>{/* end max-w-4xl wrapper */}

      </main>

      {/* Custom Calendar Modal */}
      {showCalendar && (
        <CustomCalendarModal
          currentValue={tanggalKejadian}
          onSelect={d => setTanggalKejadian(d)}
          onClose={() => setShowCalendar(false)}
        />
      )}

    </div>
  );
}
