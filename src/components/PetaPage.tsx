'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Home,
  Shield,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ChevronLeft,
  Map,
} from 'lucide-react';
import MapSection from './MapSection';

interface PetaPageProps {
  onBack: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

// ─── Full-screen Photo Viewer (gaya Inventaris) ───────────────────────────────

interface PetaKerawananViewerProps {
  onClose: () => void;
}

const PetaKerawananViewer: React.FC<PetaKerawananViewerProps> = ({ onClose }) => {
  const [zoom, setZoom]         = useState(1);
  const [pan, setPan]           = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart  = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Freeze scroll background + sembunyikan elemen lain (seperti di Inventaris)
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction  = document.body.style.touchAction;

    document.documentElement.classList.add('lightbox-active');
    document.body.classList.add('lightbox-active');
    document.body.style.overflow      = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction   = 'none';

    const style = document.createElement('style');
    style.id = 'peta-kerawanan-freeze';
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
      nav, header, aside, footer,
      #page-content, #tentrem-footer,
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
      document.body.style.overflow            = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction         = prevTouchAction;
      document.getElementById('peta-kerawanan-freeze')?.remove();
    };
  }, []);

  // Keyboard: Esc, +, -, 0
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [onClose]);

  // Zoom dengan scroll wheel
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

  // Touch — tidak ada swipe next/prev (hanya 1 foto)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = () => {
    touchStart.current = null;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col justify-between select-none animate-in fade-in duration-200"
      style={{ touchAction: 'none' }}
      role="dialog"
      aria-modal="true"
      aria-label="Peta Kerawanan Wilayah"
      onClick={handleBackdropClick}
    >
      {/* ── HEADER ── */}
      <div
        className="shrink-0 flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/10 bg-slate-900/85 backdrop-blur-md z-30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Kembali */}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-bold border border-white/15 transition-all shadow-md cursor-pointer group"
          title="Kembali ke Peta"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5 text-emerald-300 group-hover:text-white" />
          <span>Kembali</span>
          <span className="hidden sm:inline font-normal text-white/80">ke Peta</span>
        </button>

        {/* Label tengah */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-200">
          <Shield className="w-3.5 h-3.5 text-red-400" />
          <span className="font-bold text-white">Peta Kerawanan</span>
        </div>

        {/* Kontrol Zoom + Tutup */}
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
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
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

      {/* ── AREA FOTO ── */}
      <div
        className="relative flex-1 min-h-0 w-full flex items-center justify-center px-4 sm:px-14 md:px-20 py-4 sm:py-6 overflow-hidden"
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
        <div
          className="relative max-w-5xl w-full h-full flex items-center justify-center pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src="/assets/peta.jpg"
            alt="Peta Kerawanan Wilayah Desa Tugurejo"
            draggable={false}
            className="max-h-[calc(100dvh-200px)] sm:max-h-[calc(100dvh-180px)] max-w-full w-auto h-auto object-contain rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/15 bg-slate-900/40 pointer-events-auto"
            style={{
              transform: zoom > 1
                ? `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
                : 'none',
              transition: dragging ? 'none' : 'transform 0.15s ease',
              userSelect: 'none',
            }}
          />
        </div>
      </div>

      {/* ── FOOTER INFO ── */}
      <div
        className="shrink-0 w-full border-t border-white/10 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3 z-30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide bg-red-500/20 text-red-300 border border-red-500/30">
                Peta Kerawanan
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-slate-800 text-slate-200 border border-slate-700">
                Desa Tugurejo
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
              Peta Zona Kerawanan &amp; Potensi Gangguan Keamanan
            </h2>
            <p className="text-[11px] text-white/60 leading-relaxed">
              Digunakan sebagai acuan patroli dan penempatan pos ronda Satkamling Desa Tugurejo.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0 text-[11px] text-white/40">
            <span>Scroll untuk zoom · Klik &amp; drag saat diperbesar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PetaPage({ onBack }: PetaPageProps) {
  const [showPetaKerawanan, setShowPetaKerawanan] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">

      {/* Background ambient decorative shapes */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-cyan-400/10 dark:bg-cyan-600/[0.06] blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-600/[0.06] blur-3xl" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold">Peta Wilayah</span>
        </nav>

        {/* Header */}
        <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Peta Wilayah Desa Tugurejo</h1>
          <p className="text-sm text-slate-400 mt-1.5">Batas desa berbasis KML, titik pos ronda, dan informasi geospasial lingkungan Desa Tugurejo.</p>
        </div>

        {/* Map Interactive Section */}
        <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 dark:border-slate-800">
          <MapSection />
        </div>

        {/* Peta Kerawanan Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 px-6 py-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Peta Kerawanan
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Zona kerawanan dan potensi gangguan keamanan di wilayah Desa Tugurejo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPetaKerawanan(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-semibold shadow-md transition-all duration-150 whitespace-nowrap cursor-pointer"
            >
              <Map className="w-4 h-4" />
              Lihat Peta Kerawanan
            </button>
          </div>
        </div>

      </main>

      {/* Full-screen viewer via Portal */}
      {isMounted && showPetaKerawanan && typeof document !== 'undefined' &&
        createPortal(
          <PetaKerawananViewer onClose={() => setShowPetaKerawanan(false)} />,
          document.body
        )
      }

    </div>
  );
}
