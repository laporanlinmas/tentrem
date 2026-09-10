'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, Search, Home, X, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, RotateCcw, Calendar, MapPin, Tag,
  ImageIcon, ShieldCheck,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export interface GaleriItem {
  id: string;
  judul: string;
  kategori: string;
  tanggal: string;
  lokasi: string;
  keterangan: string;
  urlFoto: string;
  createdAt?: any;
}

export const KATEGORI_GALERI = [
  'Semua', 'Patroli & Ronda', 'Pelatihan & Apel',
  'Kerja Bakti', 'Sosialisasi Warga', 'Posko Satkamling',
  'Kegiatan Desa', 'Lainnya',
];

const KATEGORI_COLOR: Record<string, string> = {
  'Patroli & Ronda':   'bg-emerald-500/80 text-white',
  'Pelatihan & Apel':  'bg-blue-500/80 text-white',
  'Kerja Bakti':       'bg-amber-500/80 text-white',
  'Sosialisasi Warga': 'bg-purple-500/80 text-white',
  'Posko Satkamling':  'bg-cyan-500/80 text-white',
  'Kegiatan Desa':     'bg-rose-500/80 text-white',
  'Lainnya':           'bg-slate-500/80 text-white',
};

interface GaleriPageProps { onBack: () => void; }

// ── Lightbox Modal Component ──────────────────────────────────────────────────
interface LightboxProps {
  items: GaleriItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  items,
  index,
  onClose,
  onPrev,
  onNext,
  onSelect,
}) => {
  const item = items[index];
  const [zoom, setZoom]         = useState(1);
  const [pan, setPan]           = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart  = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Reset zoom & posisi pan saat berganti foto
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [index]);

  // Freeze background page & sembunyikan topbar, footer, dan chatbot secara mutlak
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('lightbox-active');
    document.body.classList.add('lightbox-active');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // Inject stylesheet agar topbar, mobile navbar, footer, dan chatbot 100% lenyap di desktop maupun mobile
    const style = document.createElement('style');
    style.id = 'galeri-modal-freeze-hide';
    style.textContent = `
      html.lightbox-active,
      body.lightbox-active {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
        top: 0 !important;
        left: 0 !important;
        touch-action: none !important;
      }
      nav,
      header,
      aside,
      footer,
      #page-content,
      #tentrem-footer,
      .visitor-counter,
      [data-chatbot-container],
      button[aria-label*="Chatbot"],
      button[aria-label*="chatbot"],
      div[data-chatbot-scroll],
      div.fixed.bottom-5.right-5 {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.documentElement.classList.remove('lightbox-active');
      document.body.classList.remove('lightbox-active');
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevTouchAction;
      document.getElementById('galeri-modal-freeze-hide')?.remove();
    };
  }, []);

  // Navigasi keyboard (Escape, ArrowLeft, ArrowRight, Zoom +, -, 0)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && zoom === 1) {
        onPrev();
      } else if (e.key === 'ArrowRight' && zoom === 1) {
        onNext();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(z + 0.5, 4));
      } else if (e.key === '-') {
        setZoom((z) => {
          const nz = Math.max(z - 0.5, 1);
          if (nz === 1) setPan({ x: 0, y: 0 });
          return nz;
        });
      } else if (e.key === '0') {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoom, onClose, onPrev, onNext]);

  // Zoom dengan wheel mouse
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setZoom((z) => {
      const nz = Math.min(Math.max(z - e.deltaY * 0.002, 1), 4);
      if (nz === 1) setPan({ x: 0, y: 0 });
      return nz;
    });
  };

  // Drag foto saat mode zoom > 1
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    setPan({
      x: dragStart.current.px + e.clientX - dragStart.current.mx,
      y: dragStart.current.py + e.clientY - dragStart.current.my,
    });
  };

  const onMouseUp = () => {
    setDragging(false);
    dragStart.current = null;
  };

  // Swipe foto di mobile
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (zoom === 1 && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
      if (dx < 0) onNext();
      else onPrev();
    }
    touchStart.current = null;
  };

  // Klik area kosong backdrop untuk menutup
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col justify-between select-none animate-in fade-in duration-200"
      style={{ touchAction: 'none' }}
      role="dialog"
      aria-modal="true"
      aria-label="Tampilan Foto Dokumentasi"
      onClick={handleBackdropClick}
    >
      {/* ── HEADER MODAL (Tombol Kembali, Counter, Zoom & Tutup) ── */}
      <div
        className="shrink-0 flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/10 bg-slate-900/85 backdrop-blur-md z-30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Kembali ke Galeri */}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-bold border border-white/15 transition-all shadow-md cursor-pointer group"
          title="Kembali ke Galeri"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5 text-emerald-300 group-hover:text-white" />
          <span>Kembali</span>
          <span className="hidden sm:inline font-normal text-white/80">ke Galeri</span>
        </button>

        {/* Indikator Urutan Foto */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-200">
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span className="tabular-nums font-bold text-white">{index + 1}</span>
          <span className="text-white/40">/</span>
          <span className="tabular-nums text-white/70">{items.length} Foto</span>
        </div>

        {/* Kontrol Zoom & Tutup */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            title="Perbesar (+)"
            onClick={() => setZoom((z) => Math.min(z + 0.5, 4))}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer border border-white/10 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Perkecil (-)"
            disabled={zoom <= 1}
            onClick={() =>
              setZoom((z) => {
                const nz = Math.max(z - 0.5, 1);
                if (nz === 1) setPan({ x: 0, y: 0 });
                return nz;
              })
            }
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer border border-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {zoom > 1 && (
            <button
              type="button"
              title="Reset Zoom (0)"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 flex items-center justify-center cursor-pointer border border-emerald-500/30 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            title="Tutup (Esc)"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-rose-600/80 active:scale-95 text-white flex items-center justify-center cursor-pointer border border-white/10 transition-all ml-1"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ── AREA FOTO (Utuh, Pas di Frame, Berjarak Rapi Atas & Bawah) ── */}
      <div
        data-allow-zoom="true"
        className="photo-zoom-container relative flex-1 min-h-0 w-full flex items-center justify-center px-4 sm:px-14 md:px-20 py-4 sm:py-6 overflow-hidden cursor-default"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={handleBackdropClick}
        style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {/* Tombol Panah Kiri */}
        {items.length > 1 && zoom === 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer border border-white/20 shadow-xl transition-all active:scale-95 backdrop-blur-md group"
            title="Foto Sebelumnya (Panah Kiri)"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-x-0.5" />
          </button>
        )}

        {/* Bingkai Foto — Tidak menempel ke tepi layar, ada margin & jarak rapi */}
        <div
          className="relative max-w-5xl w-full h-full flex items-center justify-center pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={item.urlFoto}
            alt={item.judul}
            draggable={false}
            className="max-h-[calc(100dvh-230px)] sm:max-h-[calc(100dvh-210px)] max-w-full w-auto h-auto object-contain rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/15 bg-slate-900/40 pointer-events-auto"
            style={{
              transform: zoom > 1 ? `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` : 'none',
              transition: dragging ? 'none' : 'transform 0.15s ease',
              userSelect: 'none',
            }}
          />
        </div>

        {/* Tombol Panah Kanan */}
        {items.length > 1 && zoom === 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer border border-white/20 shadow-xl transition-all active:scale-95 backdrop-blur-md group"
            title="Foto Berikutnya (Panah Kanan)"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>

      {/* ── FOOTER INFO & THUMBNAILS (Terpisah rapi, tidak menutupi foto) ── */}
      <div
        className="shrink-0 w-full border-t border-white/10 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3 z-30 space-y-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
          <div className="space-y-1 min-w-0 text-left items-start flex-1 w-full">
            <div className="flex flex-wrap items-center justify-start gap-2 text-left">
              <span
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide text-left ${
                  KATEGORI_COLOR[item.kategori] || 'bg-slate-500/80 text-white'
                }`}
              >
                {item.kategori}
              </span>
              {item.tanggal && (
                <span className="flex items-center gap-1 text-[11px] text-white/70 text-left">
                  <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                  {item.tanggal}
                </span>
              )}
              {item.lokasi && (
                <span className="flex items-center gap-1 text-[11px] text-white/70 truncate max-w-[220px] sm:max-w-none text-left">
                  <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                  {item.lokasi}
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate text-left w-full">
              {item.judul}
            </h2>
            {item.keterangan && (
              <p className="text-[11px] sm:text-xs text-white/70 line-clamp-1 sm:line-clamp-2 leading-relaxed text-left w-full">
                {item.keterangan}
              </p>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0 text-[11px] text-white/50">
            <span>Gunakan panah keyboard ◄ ► untuk beralih foto</span>
          </div>
        </div>

        {/* Strip thumbnail foto jika lebih dari 1 foto */}
        {items.length > 1 && (
          <div className="flex justify-center pt-1">
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-black/40 border border-white/10"
              style={{ maxWidth: 'min(95vw, 600px)', overflowX: 'auto', scrollbarWidth: 'none' }}
            >
              {items.map((it, i) => (
                <button
                  key={it.id || i}
                  type="button"
                  onClick={() => onSelect(i)}
                  className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    i === index
                      ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-105 opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                  style={{ width: i === index ? 42 : 34, height: i === index ? 42 : 34 }}
                  title={it.judul}
                >
                  <img src={it.urlFoto} alt="" className="w-full h-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GaleriPage({ onBack }: GaleriPageProps) {
  const [items,           setItems]           = useState<GaleriItem[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [loadError,       setLoadError]       = useState(false);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [selectedKategori,setSelectedKategori]= useState('Semua');
  const [lightboxIndex,   setLightboxIndex]   = useState<number | null>(null);
  const [isMounted,       setIsMounted]       = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Firestore realtime
  useEffect(() => {
    if (!db) { setLoadError(true); setLoading(false); return; }
    try {
      const unsub = onSnapshot(
        collection(db, 'galeri_kegiatan'),
        (snap) => {
          const list: GaleriItem[] = snap.docs.map(d => ({
            id: d.id,
            judul:      d.data().judul      || 'Dokumentasi Kegiatan',
            kategori:   d.data().kategori   || 'Lainnya',
            tanggal:    d.data().tanggal    || '',
            lokasi:     d.data().lokasi     || '',
            keterangan: d.data().keterangan || '',
            urlFoto:    d.data().urlFoto    || d.data().foto || '',
            createdAt:  d.data().createdAt,
          }));
          list.sort((a, b) => new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime());
          setItems(list);
          setLoadError(false);
          setLoading(false);
        },
        () => { setLoadError(true); setLoading(false); }
      );
      return () => unsub();
    } catch { setLoadError(true); setLoading(false); }
  }, []);

  const filtered = useMemo(() => items.filter(it => {
    const matchK = selectedKategori === 'Semua' || it.kategori === selectedKategori;
    const q = searchQuery.toLowerCase().trim();
    const matchS = !q || it.judul.toLowerCase().includes(q) || it.keterangan.toLowerCase().includes(q) || it.lokasi.toLowerCase().includes(q);
    return matchK && matchS;
  }), [items, selectedKategori, searchQuery]);

  const prev = useCallback(() => setLightboxIndex(i => i !== null ? (i > 0 ? i - 1 : filtered.length - 1) : null), [filtered.length]);
  const next = useCallback(() => setLightboxIndex(i => i !== null ? (i < filtered.length - 1 ? i + 1 : 0) : null), [filtered.length]);

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300"
        style={{ overflowX: 'hidden' }}>

        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <button type="button" onClick={onBack}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer">
              <Home className="w-3.5 h-3.5" /> Beranda
            </button>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">Galeri Dokumentasi</span>
          </nav>

          {/* Header */}
          <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white">
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Galeri Kegiatan Desa Tugurejo</h1>
            <p className="text-sm text-slate-400 mt-1.5">Dokumentasi foto kegiatan Satkamling, Satlinmas, dan program kemasyarakatan Desa Tugurejo.</p>
          </div>

          {/* Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="text" placeholder="Cari foto berdasarkan judul, lokasi, atau agenda..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {KATEGORI_GALERI.map(kat => (
                <button key={kat} type="button" onClick={() => setSelectedKategori(kat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                    selectedKategori === kat
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}>
                  {kat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            /* Skeleton grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"
                  style={{ animationDelay: `${i * 40}ms` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8 text-emerald-500/50" />
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {loadError ? 'Galeri belum dapat dimuat.' : 'Tidak ada foto ditemukan.'}
              </p>
              {(searchQuery || selectedKategori !== 'Semua') && (
                <button type="button" onClick={() => { setSearchQuery(''); setSelectedKategori('Semua'); }}
                  className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                  Tampilkan Semua
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400 dark:text-slate-500 -mt-4">
                {filtered.length} foto {selectedKategori !== 'Semua' ? `· ${selectedKategori}` : ''}
              </p>
              {/* Masonry-style grid — penuh foto */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                {filtered.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                    aria-label={item.judul}
                  >
                    {/* Foto */}
                    {item.urlFoto ? (
                      <img
                        src={item.urlFoto}
                        alt={item.judul}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                        <ImageIcon className="w-7 h-7" />
                      </div>
                    )}

                    {/* Hover overlay — info rata kiri */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex flex-col justify-end items-start text-left p-3">
                      <span className={`self-start mb-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide text-left ${KATEGORI_COLOR[item.kategori] || 'bg-slate-500/80 text-white'}`}>
                        {item.kategori}
                      </span>
                      <p className="text-white font-bold text-xs leading-tight line-clamp-2 text-left w-full">{item.judul}</p>
                      {item.keterangan && (
                        <p className="text-white/60 text-[10px] mt-0.5 line-clamp-1 text-left w-full">{item.keterangan}</p>
                      )}
                      <div className="flex items-center justify-start gap-3 mt-1.5 text-[10px] text-white/55 text-left w-full">
                        {item.tanggal && <span className="flex items-center gap-0.5 text-left shrink-0"><Calendar className="w-2.5 h-2.5" />{item.tanggal}</span>}
                        {item.lokasi  && <span className="flex items-center gap-0.5 truncate text-left shrink-0"><MapPin className="w-2.5 h-2.5 shrink-0" />{item.lokasi}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

        </main>
      </div>

      {/* Lightbox Modal via Portal directly to document.body */}
      {isMounted && lightboxIndex !== null && typeof document !== 'undefined' && createPortal(
        <Lightbox
          items={filtered}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={prev}
          onNext={next}
          onSelect={(idx) => setLightboxIndex(idx)}
        />,
        document.body
      )}
    </>
  );
}
