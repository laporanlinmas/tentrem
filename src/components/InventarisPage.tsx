'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Package,
  Search,
  Filter,
  Home,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Archive,
  CheckCircle2,
  ChevronDown,
  ImageOff,
  Loader2,
  LayoutGrid,
  Sparkles,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventarisItem {
  id: string;
  namaAset: string;
  jenis: string;
  jumlah: number;
  satuan: string;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Tidak Layak';
  keterangan?: string;
  foto?: string;
  tanggalMasuk?: string;
  ts?: string;
}

// ─── Date Helper ──────────────────────────────────────────────────────────────

function formatTanggalIndo(dStr?: string): string {
  if (!dStr) return '—';
  try {
    const clean = dStr.includes('T') ? dStr.split('T')[0] : dStr;
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {}
  return dStr || '—';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const JENIS_LIST = [
  'Semua',
  'Alat Keamanan',
  'Komunikasi',
  'Perlengkapan Patroli',
  'Peralatan P3K',
  'Alat Pemadam',
  'Perlengkapan Kantor',
  'Kendaraan',
  'Lainnya',
];

const KONDISI_LIST = ['Semua', 'Baik', 'Rusak Ringan', 'Rusak Berat', 'Tidak Layak'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Konversi Google Drive share URL ke thumbnail langsung via lh3.googleusercontent.com */
function toThumbnailUrl(url: string): string {
  if (!url) return '';

  // Format: https://drive.google.com/file/d/FILE_ID/view?...
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }

  // Format: https://drive.google.com/open?id=FILE_ID
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}`;
  }

  // Format: https://drive.google.com/uc?id=FILE_ID
  const driveUcMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveUcMatch) {
    return `https://lh3.googleusercontent.com/d/${driveUcMatch[1]}`;
  }

  // URL lain — kembalikan apa adanya
  return url;
}

interface KondisiConfig {
  badge: string;
  text: string;
  icon: React.ReactNode;
}

function getKondisiConfig(kondisi: string): KondisiConfig {
  switch (kondisi) {
    case 'Baik':
      return {
        badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    case 'Rusak Ringan':
      return {
        badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        text: 'text-amber-700 dark:text-amber-300',
        icon: <AlertTriangle className="w-3 h-3" />,
      };
    case 'Rusak Berat':
      return {
        badge: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
        text: 'text-red-700 dark:text-red-300',
        icon: <XCircle className="w-3 h-3" />,
      };
    case 'Tidak Layak':
      return {
        badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        text: 'text-slate-600 dark:text-slate-400',
        icon: <Archive className="w-3 h-3" />,
      };
    default:
      return {
        badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        text: 'text-slate-600 dark:text-slate-400',
        icon: <Archive className="w-3 h-3" />,
      };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}> = ({ label, value, icon, colorClass }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3 shadow-sm">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  </div>
);

// ─── FilterSelect ─────────────────────────────────────────────────────────────

const FilterSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}> = ({ value, onChange, options, label }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="appearance-none w-full pl-3.5 pr-8 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt === 'Semua' ? `${label}: Semua` : opt}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
  </div>
);

const TableRow: React.FC<{
  item: InventarisItem;
  idx: number;
  kondisiCfg: KondisiConfig;
  thumbUrl: string;
  onPhotoClick?: (item: InventarisItem) => void;
}> = ({ item, idx, kondisiCfg, thumbUrl, onPhotoClick }) => {
  const [imgErr, setImgErr] = useState(false);
  const hasPhoto = !!thumbUrl && !imgErr;

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      {/* No */}
      <td className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-600 tabular-nums">{idx + 1}</td>
      {/* Foto */}
      <td className="px-3 py-3">
        {hasPhoto ? (
          <button
            type="button"
            onClick={() => onPhotoClick?.(item)}
            className="group relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 cursor-pointer shadow-sm hover:ring-2 hover:ring-emerald-500 transition-all block focus:outline-none"
            title="Klik untuk melihat foto aset utuh"
          >
            <img
              src={thumbUrl}
              alt={item.namaAset}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={() => setImgErr(true)}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Eye className="w-4 h-4" />
            </div>
          </button>
        ) : (
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <ImageOff className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          </div>
        )}
      </td>
      {/* Nama */}
      <td className="px-4 py-3">
        <span className="font-bold text-slate-900 dark:text-white text-sm">{item.namaAset}</span>
      </td>
      {/* Jenis */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {item.jenis}
        </span>
      </td>
      {/* Jumlah */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <span className="font-black text-slate-900 dark:text-white text-sm">{item.jumlah}</span>
        <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">{item.satuan}</span>
      </td>
      {/* Kondisi */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${kondisiCfg.badge}`}>
          {kondisiCfg.icon}
          {item.kondisi}
        </span>
      </td>
      {/* Tanggal Ditambahkan */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          {formatTanggalIndo(item.tanggalMasuk || item.ts)}
        </span>
      </td>
      {/* Keterangan — hidden di mobile */}
      <td className="px-4 py-3 hidden md:table-cell max-w-xs">
        <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {item.keterangan || <span className="italic text-slate-300 dark:text-slate-600">—</span>}
        </span>
      </td>
    </tr>
  );
};

// ─── Inventaris Photo Modal Component ─────────────────────────────────────────

interface InventarisPhotoModalProps {
  items: InventarisItem[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}

const InventarisPhotoModal: React.FC<InventarisPhotoModalProps> = ({
  items,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onSelect,
}) => {
  const item = items[currentIndex];
  const [zoom, setZoom]         = useState(1);
  const [pan, setPan]           = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart  = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Reset zoom & pan saat foto berganti
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentIndex]);

  // Freeze background page & sembunyikan topbar, footer, dan chatbot secara mutlak
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.documentElement.classList.add('lightbox-active');
    document.body.classList.add('lightbox-active');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const style = document.createElement('style');
    style.id = 'inventaris-modal-freeze-hide';
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
      document.getElementById('inventaris-modal-freeze-hide')?.remove();
    };
  }, []);

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight, Zoom +, -, 0)
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

  // Drag saat zoom > 1
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

  // Touch swipe di mobile
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!item) return null;

  const kondisiCfg = getKondisiConfig(item.kondisi);
  const photoUrl = toThumbnailUrl(item.foto || '');

  return (
    <div
      className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col justify-between select-none animate-in fade-in duration-200"
      style={{ touchAction: 'none' }}
      role="dialog"
      aria-modal="true"
      aria-label="Tampilan Foto Inventaris"
      onClick={handleBackdropClick}
    >
      {/* ── HEADER MODAL ── */}
      <div
        className="shrink-0 flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/10 bg-slate-900/85 backdrop-blur-md z-30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Kembali ke Inventaris */}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-bold border border-white/15 transition-all shadow-md cursor-pointer group"
          title="Kembali ke Inventaris"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5 text-emerald-300 group-hover:text-white" />
          <span>Kembali</span>
          <span className="hidden sm:inline font-normal text-white/80">ke Inventaris</span>
        </button>

        {/* Indikator Urutan Foto */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-200">
          <Package className="w-3.5 h-3.5 text-emerald-400" />
          <span className="tabular-nums font-bold text-white">{currentIndex + 1}</span>
          <span className="text-white/40">/</span>
          <span className="tabular-nums text-white/70">{items.length} Foto Aset</span>
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

      {/* ── AREA FOTO UTUH & BERJARAK RAPI ── */}
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

        {/* Container Foto — Pas, utuh, ada jarak atas bawah */}
        <div
          className="relative max-w-5xl w-full h-full flex items-center justify-center pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={item.namaAset}
              draggable={false}
              className="max-h-[calc(100dvh-230px)] sm:max-h-[calc(100dvh-210px)] max-w-full w-auto h-auto object-contain rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/15 bg-slate-900/40 pointer-events-auto"
              style={{
                transform: zoom > 1 ? `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` : 'none',
                transition: dragging ? 'none' : 'transform 0.15s ease',
                userSelect: 'none',
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3 pointer-events-auto">
              <ImageOff className="w-16 h-16 opacity-40" />
              <p className="text-sm font-semibold">Foto aset belum tersedia</p>
            </div>
          )}
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

      {/* ── FOOTER INFO & THUMBNAILS (Rata Kiri, Rapi, Terpisah dari foto) ── */}
      <div
        className="shrink-0 w-full border-t border-white/10 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3 z-30 space-y-2.5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
          <div className="space-y-1 min-w-0 text-left items-start flex-1 w-full">
            <div className="flex flex-wrap items-center justify-start gap-2 text-left">
              {/* Badge Jenis */}
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide bg-slate-800 text-slate-200 border border-slate-700 text-left">
                {item.jenis}
              </span>

              {/* Badge Kondisi */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border text-left ${kondisiCfg.badge}`}>
                {kondisiCfg.icon}
                {item.kondisi}
              </span>

              {/* Badge Jumlah */}
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-left">
                {item.jumlah} {item.satuan}
              </span>

              {/* Tanggal Ditambahkan */}
              <span className="inline-flex items-center gap-1 text-[11px] text-white/70 text-left">
                <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Ditambahkan: {formatTanggalIndo(item.tanggalMasuk || item.ts)}</span>
              </span>
            </div>

            <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate text-left w-full">
              {item.namaAset}
            </h2>

            {item.keterangan && (
              <p className="text-[11px] sm:text-xs text-white/70 line-clamp-1 sm:line-clamp-2 leading-relaxed text-left w-full">
                {item.keterangan}
              </p>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0 text-[11px] text-white/50 text-right">
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
              {items.map((it, i) => {
                const thumb = toThumbnailUrl(it.foto || '');
                return (
                  <button
                    key={it.id || i}
                    type="button"
                    onClick={() => onSelect(i)}
                    className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      i === currentIndex
                        ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-105 opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                    style={{ width: i === currentIndex ? 42 : 34, height: i === currentIndex ? 42 : 34 }}
                    title={it.namaAset}
                  >
                    <img src={thumb} alt="" className="w-full h-full object-cover" draggable={false} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface InventarisPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export default function InventarisPage({ onBack, onNavigate: _onNavigate }: InventarisPageProps) {
  const [items, setItems] = useState<InventarisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('Semua');
  const [selectedKondisi, setSelectedKondisi] = useState('Semua');

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // ── Firestore realtime sync ──────────────────────────────────────────────
  useEffect(() => {
    if (!db) {
      // Firestore tidak tersedia, langsung fallback ke API proxy
      fetchFromProxy();
      return;
    }

    let unsubscribe: (() => void) | undefined;

    try {
      const colRef = collection(db, 'inventaris');
      const q = query(colRef, orderBy('namaAset', 'asc'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: InventarisItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              namaAset: data.namaAset || 'Aset Tidak Dikenal',
              jenis: data.jenis || 'Lainnya',
              jumlah: typeof data.jumlah === 'number' ? data.jumlah : Number(data.jumlah) || 0,
              satuan: data.satuan || 'unit',
              kondisi: data.kondisi || 'Baik',
              keterangan: data.keterangan || '',
              foto: data.foto || '',
              tanggalMasuk: data.tanggalMasuk || data.tanggal || (data.ts ? data.ts.split('T')[0] : ''),
              ts: data.ts || '',
            });
          });
          setItems(list);
          setLoadError(false);
          setLoading(false);
        },
        (error) => {
          console.warn('[InventarisPage] Firestore error, fallback ke proxy:', error);
          setLoadError(true);
          fetchFromProxy();
        }
      );
    } catch (e) {
      console.warn('[InventarisPage] Firestore init error, fallback ke proxy:', e);
      setLoadError(true);
      fetchFromProxy();
    }

    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fallback: API Proxy ──────────────────────────────────────────────────
  function fetchFromProxy() {
    const apiKey = (import.meta as any).env?.VITE_API_KEY || '';
    fetch('/api/proxy?action=getInventaris', {
      headers: { 'x-api-key': apiKey },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const raw: any[] = data?.data?.items ?? data?.items ?? [];
        const list: InventarisItem[] = raw.map((d: any) => ({
          id: d.id || String(Math.random()),
          namaAset: d.namaAset || 'Aset Tidak Dikenal',
          jenis: d.jenis || 'Lainnya',
          jumlah: typeof d.jumlah === 'number' ? d.jumlah : Number(d.jumlah) || 0,
          satuan: d.satuan || 'unit',
          kondisi: d.kondisi || 'Baik',
          keterangan: d.keterangan || '',
          foto: d.foto || '',
          tanggalMasuk: d.tanggalMasuk || d.tanggal || (d.ts ? d.ts.split('T')[0] : ''),
          ts: d.ts || '',
        }));
        list.sort((a, b) => a.namaAset.localeCompare(b.namaAset));
        setItems(list);
        setLoadError(false);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[InventarisPage] Proxy fetch error:', err);
        setItems([]);
        setLoadError(true);
        setLoading(false);
      });
  }

  // ── Statistics ───────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: items.length,
      baik: items.filter((i) => i.kondisi === 'Baik').length,
      rusak: items.filter((i) => i.kondisi === 'Rusak Ringan' || i.kondisi === 'Rusak Berat').length,
      tidakLayak: items.filter((i) => i.kondisi === 'Tidak Layak').length,
    }),
    [items]
  );

  // ── Filtered items ───────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchJenis = selectedJenis === 'Semua' || item.jenis === selectedJenis;
      const matchKondisi = selectedKondisi === 'Semua' || item.kondisi === selectedKondisi;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.namaAset.toLowerCase().includes(q) ||
        item.jenis.toLowerCase().includes(q) ||
        (item.keterangan || '').toLowerCase().includes(q);
      return matchJenis && matchKondisi && matchSearch;
    });
  }, [items, selectedJenis, selectedKondisi, searchQuery]);

  const hasFilters =
    searchQuery.trim() !== '' || selectedJenis !== 'Semua' || selectedKondisi !== 'Semua';

  const itemsWithPhotos = useMemo(() => {
    return filteredItems.filter((it) => !!it.foto);
  }, [filteredItems]);

  const handlePhotoClick = (item: InventarisItem) => {
    const idx = itemsWithPhotos.findIndex((it) => it.id === item.id);
    if (idx !== -1) {
      setSelectedPhotoIndex(idx);
    }
  };

  const prevPhoto = useCallback(() => {
    setSelectedPhotoIndex((i) =>
      i !== null ? (i > 0 ? i - 1 : itemsWithPhotos.length - 1) : null
    );
  }, [itemsWithPhotos.length]);

  const nextPhoto = useCallback(() => {
    setSelectedPhotoIndex((i) =>
      i !== null ? (i < itemsWithPhotos.length - 1 ? i + 1 : 0) : null
    );
  }, [itemsWithPhotos.length]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400"
        >
          <button
            type="button"
            onClick={onBack}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Beranda
          </button>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold">Inventaris Aset</span>
        </nav>

        {/* ── Hero Header ───────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Inventaris Satkamling &amp; Satlinmas</h1>
          <p className="text-sm text-slate-400 mt-1.5">Pencatatan aset, sarana prasarana, dan perlengkapan operasional keamanan Desa Tugurejo.</p>
        </div>

        {/* ── Error Banner ───────────────────────────────────────────────── */}
        {loadError && !loading && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Gagal memuat data secara realtime. Menampilkan data dari cache atau proxy.
            </span>
          </div>
        )}

        {/* ── Statistik ─────────────────────────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Total Aset"
              value={stats.total}
              icon={<LayoutGrid className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
              colorClass="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            />
            <StatCard
              label="Kondisi Baik"
              value={stats.baik}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              colorClass="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Rusak"
              value={stats.rusak}
              icon={<AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              colorClass="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
            />
            <StatCard
              label="Tidak Layak"
              value={stats.tidakLayak}
              icon={<Archive className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
              colorClass="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            />
          </div>
        )}

        {/* ── Filter Bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama aset, jenis, atau keterangan…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Jenis */}
          <div className="flex items-center gap-2 sm:w-48">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <FilterSelect
              value={selectedJenis}
              onChange={setSelectedJenis}
              options={JENIS_LIST}
              label="Jenis"
            />
          </div>

          {/* Filter Kondisi */}
          <div className="sm:w-44">
            <FilterSelect
              value={selectedKondisi}
              onChange={setSelectedKondisi}
              options={KONDISI_LIST}
              label="Kondisi"
            />
          </div>
        </div>

        {/* ── Tabel Aset / Loading / Empty ─────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memuat data inventaris…</span>
            </div>
            {/* Skeleton tabel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="h-10 bg-slate-100 dark:bg-slate-800 animate-pulse" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-t border-slate-100 dark:border-slate-800 animate-pulse"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  </div>
                  <div className="w-16 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="w-20 h-5 bg-slate-200 dark:bg-slate-700 rounded-full hidden sm:block" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <Package className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300">
                {hasFilters ? 'Tidak ada aset yang cocok' : 'Belum ada data inventaris'}
              </h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
                {hasFilters
                  ? 'Coba ubah kata kunci pencarian atau filter yang digunakan.'
                  : 'Data inventaris aset Poskamling belum tersedia atau sedang diperbarui.'}
              </p>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedJenis('Semua'); setSelectedKondisi('Semua'); }}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-sm"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Jumlah hasil */}
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Menampilkan{' '}
              <span className="font-bold text-slate-700 dark:text-slate-300">{filteredItems.length}</span>{' '}
              dari {items.length} aset
            </p>

            {/* Tabel wrapper — scroll horizontal di mobile */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-4 py-3 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-12">#</th>
                      <th className="text-left px-3 py-3 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-12">Foto</th>
                      <th className="text-left px-4 py-3 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Aset</th>
                      <th className="text-left px-4 py-3 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Jenis</th>
                      <th className="text-center px-4 py-3 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Jumlah</th>
                      <th className="text-left px-4 py-3 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Kondisi</th>
                      <th className="text-left px-4 py-3 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          Tgl Ditambahkan
                        </span>
                      </th>
                      <th className="text-left px-4 py-3 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredItems.map((item, idx) => {
                      const kondisiCfg = getKondisiConfig(item.kondisi);
                      const thumbUrl = toThumbnailUrl(item.foto || '');
                      return (
                        <TableRow
                          key={item.id}
                          item={item}
                          idx={idx}
                          kondisiCfg={kondisiCfg}
                          thumbUrl={thumbUrl}
                          onPhotoClick={handlePhotoClick}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}



      </main>

      {/* Inventaris Photo Modal via Portal directly to document.body */}
      {isMounted && selectedPhotoIndex !== null && typeof document !== 'undefined' && itemsWithPhotos[selectedPhotoIndex] && createPortal(
        <InventarisPhotoModal
          items={itemsWithPhotos}
          currentIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
          onPrev={prevPhoto}
          onNext={nextPhoto}
          onSelect={(idx) => setSelectedPhotoIndex(idx)}
        />,
        document.body
      )}
    </div>
  );
}
