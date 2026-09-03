'use client';

import React from 'react';
import { MapPin, Map, Home, Shield, Layers, Navigation, Crosshair, Sparkles } from 'lucide-react';
import MapSection from './MapSection';

interface PetaPageProps {
  onBack: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

export default function PetaPage({ onBack, onNavigate }: PetaPageProps) {
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

      </main>

    </div>
  );
}
