'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  BookOpen,
  ChevronRight,
  Home,
} from 'lucide-react';
import StrukturSection from '@/components/StrukturSection';

interface StrukturPageProps {
  onBack: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

export default function StrukturPage({ onBack, onNavigate }: StrukturPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold">Struktur Organisasi</span>
        </nav>

        <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Struktur Siskamling RT 01 RW 01 Desa Tugurejo</h1>
          <p className="text-sm text-slate-400 mt-1.5">Susunan organisasi dan garis komando pengamanan swakarsa · Permendagri No. 26 Th 2020</p>
        </div>

        {/* Bagan komando */}
        <StrukturSection />

        {/* Divider + tombol rincian tugas — simpel */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <button
            type="button"
            onClick={() => onNavigate?.('rincian-tugas')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Rincian Tugas Setiap Tingkat
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

      </main>
    </div>
  );
}
