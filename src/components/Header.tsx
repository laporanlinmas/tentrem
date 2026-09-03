'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home, Map, Megaphone, Star, Sun, Moon, X, Menu,
  Newspaper, ShieldCheck, Lock, GitBranch, Drum,
  Camera, ChevronDown, Play, Package,
} from 'lucide-react';

const ADMIN_URL = import.meta.env.VITE_WEB_ADMIN || 'https://tentremadmin.vercel.app/login';

export interface HeaderProps {
  currentPage?: string;
  onNavigate?: (page: string, slug?: string) => void;
  onBack?: () => void;
  isSubPage?: boolean;
  isSurveyPage?: boolean;
}

export const NAV_ITEMS = [
  { id: 'home',      label: 'Beranda',       Icon: Home,      color: 'text-emerald-400' },
  { id: 'profil',    label: 'Profil',        Icon: Play,      color: 'text-teal-400' },
  { id: 'berita',    label: 'Berita',        Icon: Newspaper, color: 'text-sky-400' },
  { id: 'aduan',     label: 'Aduan',         Icon: Megaphone, color: 'text-orange-400' },
  { id: 'struktur',  label: 'Struktur',      Icon: GitBranch, color: 'text-blue-400' },
  { id: 'galeri',    label: 'Galeri',        Icon: Camera,    color: 'text-cyan-400' },
  { id: 'kentongan',  label: 'Kentongan',     Icon: Drum,    color: 'text-amber-400' },
  { id: 'inventaris', label: 'Inventaris',    Icon: Package, color: 'text-violet-400' },
  { id: 'peta',       label: 'Peta',          Icon: Map,     color: 'text-indigo-400' },
  { id: 'survei',     label: 'Kritik & Saran', Icon: Star,   color: 'text-yellow-400' },
] as const;

export default function Header({
  currentPage = 'home',
  onNavigate,
}: HeaderProps) {
  const [scrolled,      setScrolled]      = useState(false);
  const [atTop,         setAtTop]         = useState(true);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [dark,          setDark]          = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  // ── Scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setAtTop(y < 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Close sidebar on ≥xl ─────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1280) {
        setSidebarOpen(false);
        setAdminMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Close admin dropdown on outside click ────────────────────────────────
  useEffect(() => {
    if (!adminMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setAdminMenuOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [adminMenuOpen]);

  // ── Close on Escape ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSidebarOpen(false); setAdminMenuOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Body scroll lock — pakai fixed position agar tidak ada layout shift ──
  useEffect(() => {
    if (sidebarOpen) {
      // Simpan posisi scroll sebelum lock
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      // Kembalikan scroll ke posisi semula
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    return () => {
      // Cleanup safety — pastikan body kembali normal saat unmount
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    };
  }, [sidebarOpen]);

  // ── Theme ────────────────────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }, [dark]);

  // ── Nav click ────────────────────────────────────────────────────────────
  const handleNavClick = (id: string) => {
    setSidebarOpen(false);
    setAdminMenuOpen(false);
    if (onNavigate) {
      onNavigate(id);
    } else {
      const item = NAV_ITEMS.find(n => n.id === id);
      if (item) window.location.href = `/${id === 'home' ? '' : id}`;
    }
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
         TOP NAVBAR
      ══════════════════════════════════════════════════════════ */}
      <nav
        aria-label="Navigasi utama"
        className={`fixed w-full top-0 z-[1002] transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'} px-3 sm:px-6`}
      >
        {/* Backdrop blur strip */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 transition-all duration-300 ${
            scrolled ? 'opacity-100 h-[calc(100%+8px)] bg-slate-950/70 backdrop-blur-xl' : 'opacity-0 h-full'
          }`}
          style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Pill */}
          <div className={`
            flex items-center justify-between h-14 px-3 sm:px-5 rounded-2xl transition-all duration-300
            ${atTop && !scrolled
              ? 'bg-slate-900/85 dark:bg-slate-950/90 border border-white/15 backdrop-blur-xl shadow-xl shadow-black/10'
              : 'bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/60 backdrop-blur-xl shadow-2xl shadow-black/25'
            }
          `}>

            {/* Logo — hanya desktop (xl+), di mobile logo dirender di dalam mobile controls */}
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className="hidden xl:flex items-center gap-2.5 group focus:outline-none py-1 cursor-pointer"
              aria-label="Beranda TENTREM"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-all shrink-0 shadow-sm shadow-emerald-500/30 p-0.5">
                <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
                  <picture>
                    <source srcSet="/assets/linmas.svg" type="image/svg+xml" />
                    <img src="/assets/icon-512.png" alt="TENTREM" width={22} height={22} className="object-contain" />
                  </picture>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-black text-white tracking-[0.2em] uppercase whitespace-nowrap drop-shadow-sm">
                  TENTREM
                </span>
                <span className="w-px h-3.5 bg-white/25 rounded-full" />
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-300 tracking-wider uppercase whitespace-nowrap hidden xs:inline">
                  TUGUREJO
                </span>
              </div>
            </button>

            {/* Desktop nav */}
            <div className="hidden xl:flex items-center gap-0.5">
              {NAV_ITEMS.map(({ id, label, Icon }) => {
                const isActive = currentPage === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleNavClick(id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative px-2.5 py-1.5 rounded-xl text-[11px] xl:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'text-white bg-white/20 shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-3 h-3 shrink-0 ${isActive ? 'text-emerald-300' : 'text-white/70'}`} />
                    <span>{label}</span>
                  </button>
                );
              })}

              <div className="w-px h-4 bg-white/20 mx-1" />

              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white cursor-pointer"
                title={dark ? 'Mode Terang' : 'Mode Gelap'}
              >
                {dark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
              </button>

              {/* Admin dropdown */}
              <div className="relative ml-1" ref={adminRef}>
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen(v => !v)}
                  aria-expanded={adminMenuOpen}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 hover:text-white text-xs font-bold transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {adminMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => handleNavClick('ronda')}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/15 hover:text-white transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Lapor Ronda
                    </button>
                    <a
                      href={ADMIN_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Lock className="w-4 h-4 text-slate-400" /> Login Admin Dashboard
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile controls — hamburger KIRI, theme KANAN */}
            <div className="xl:hidden flex items-center justify-between w-full">
              {/* Kiri: hamburger */}
              <button
                type="button"
                onClick={() => setSidebarOpen(v => !v)}
                className={`p-2 rounded-xl transition-colors text-white cursor-pointer ${
                  sidebarOpen ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/10 hover:bg-white/20'
                }`}
                aria-label={sidebarOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Tengah: Logo */}
              <button
                type="button"
                onClick={() => handleNavClick('home')}
                className="flex items-center gap-2 group focus:outline-none cursor-pointer"
                aria-label="Beranda TENTREM"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-all shrink-0 shadow-sm shadow-emerald-500/30 p-0.5">
                  <div className="w-full h-full bg-slate-900 rounded-[9px] flex items-center justify-center">
                    <picture>
                      <source srcSet="/assets/linmas.svg" type="image/svg+xml" />
                      <img src="/assets/icon-512.png" alt="TENTREM" width={18} height={18} className="object-contain" />
                    </picture>
                  </div>
                </div>
                <span className="text-[13px] font-black text-white tracking-[0.2em] uppercase whitespace-nowrap drop-shadow-sm">
                  TENTREM
                </span>
              </button>

              {/* Kanan: Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
                aria-label="Toggle tema"
              >
                {dark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
         MOBILE SIDEBAR OVERLAY
      ══════════════════════════════════════════════════════════ */}

      {/* Backdrop */}
      <div
        aria-hidden
        onClick={() => setSidebarOpen(false)}
        className={`xl:hidden fixed inset-0 z-[1003] transition-all duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } bg-black/60 backdrop-blur-[2px]`}
      />

      {/* Sidebar panel */}
      <aside
        aria-label="Menu navigasi"
        className={`xl:hidden fixed top-0 left-0 h-[100dvh] z-[1004] flex flex-col transition-transform duration-300 ease-[cubic-bezier(.32,0,.67,0)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 260 }}
        // Cegah touch event di sidebar menyebar ke halaman di belakangnya
        onTouchMove={e => e.stopPropagation()}
      >
        {/* Background layer — absolute agar tidak mempengaruhi flex layout */}
        <div className="absolute inset-0 bg-slate-950 backdrop-blur-2xl border-r border-slate-800/80 pointer-events-none" aria-hidden />

        {/* ── HEADER sidebar — STICKY top, tidak ikut scroll ── */}
        <div className="relative shrink-0 flex items-center justify-between px-4 pt-5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center overflow-hidden shrink-0 shadow-sm shadow-emerald-500/30 p-0.5">
              <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
                <picture>
                  <source srcSet="/assets/linmas.svg" type="image/svg+xml" />
                  <img src="/assets/icon-512.png" alt="TENTREM" width={20} height={20} className="object-contain" />
                </picture>
              </div>
            </div>
            <div>
              <div className="text-[12px] font-black text-white tracking-[0.18em] uppercase leading-none">TENTREM</div>
              <div className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase mt-0.5">Desa Tugurejo</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Tutup menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SCROLLABLE nav area — flex-1, overflow-y-auto, touch isolated ── */}
        <nav
          className="relative flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-0.5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-500 px-2 mb-2">Menu Utama</p>

          {NAV_ITEMS.map(({ id, label, Icon, color }, i) => {
            const isActive = currentPage === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavClick(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer text-left
                  ${isActive
                    ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }
                `}
                style={{
                  transitionDelay: sidebarOpen ? `${i * 18}ms` : '0ms',
                  transform: sidebarOpen ? 'translateX(0)' : 'translateX(-8px)',
                  opacity: sidebarOpen ? 1 : 0,
                  transition: `background-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 260ms cubic-bezier(.32,0,.67,0) ${i * 18}ms, opacity 240ms ease ${i * 18}ms`,
                }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'bg-white/20' : 'bg-slate-800'
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : color}`} />
                </div>
                <span className="flex-1 truncate">{label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* ── FOOTER sidebar — STICKY bottom, tidak ikut scroll ── */}
        <div className="relative shrink-0 px-3 py-4 border-t border-slate-800/80 space-y-1.5">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-500 px-2 mb-2">Akses Khusus</p>

          <button
            type="button"
            onClick={() => handleNavClick('ronda')}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer text-left
              ${currentPage === 'ronda'
                ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }
            `}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              currentPage === 'ronda' ? 'bg-white/20' : 'bg-slate-800'
            }`}>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="flex-1 truncate">Lapor Ronda</span>
            {currentPage === 'ronda' && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
          </button>

          <a
            href={ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <span className="flex-1 truncate">Login Admin</span>
          </a>

          <p className="text-center text-[9px] text-slate-600 pt-2 pb-safe">
            TENTREM © 2025 · Desa Tugurejo, Slahung
          </p>
        </div>

      </aside>
    </>
  );
}
