'use client';

import React, { useState } from 'react';
import {
  Video,
  Home,
  Compass,
} from 'lucide-react';

const VIDEO_URL = import.meta.env.VITE_VIDEO_URL || 'https://player.cloudinary.com/embed/?cloud_name=dym9koebf&public_id=profil_pedestrian_qq1i9h';

interface ProfilPageProps {
  onBack: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

export default function ProfilPage({ onBack, onNavigate }: ProfilPageProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-12">
        
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
          <span className="text-slate-900 dark:text-white font-bold">Profil Desa &amp; TENTREM</span>
        </nav>

        {/* Hero Banner */}
        <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Profil Desa Tugurejo &amp; TENTREM</h1>
          <p className="text-sm text-slate-400 mt-1.5">Platform terpadu keamanan, pelayanan publik, dan keterbukaan informasi · Kec. Slahung, Kab. Ponorogo</p>
        </div>

        {/* ── SECTION 1: VIDEO PROFIL & DESKRIPSI INOVASI ── */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 lg:items-stretch">
            
            {/* Left Content */}
            <div className="flex flex-col gap-5 justify-between">
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  Mengenal Sistem TENTREM
                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>TENTREM</strong> (<em>Tugurejo Nyaman Tanggap Responsif Modern</em>) adalah platform terpadu pelayanan publik dan keamanan lingkungan Desa Tugurejo — menggabungkan kearifan lokal Satkamling dengan teknologi informasi modern.
                </p>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Warga dapat memantau jadwal ronda, melaporkan pengaduan, mengakses cuaca BMKG real-time, membaca berita Pemdes, hingga berinteraksi dengan petugas kapan saja melalui chatbot 24 jam.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Smart Poskamling',  desc: 'Jadwal ronda bergilir dan laporan petugas digital.' },
                  { label: 'Transparansi Warta', desc: 'Berita, pengumuman, dan galeri dokumentasi Pemdes.' },
                  { label: 'Peta Geospasial',    desc: 'Peta batas desa, pos ronda, dan titik penting KML.' },
                  { label: 'Aduan & Chatbot',    desc: 'Pengaduan warga 24 jam dengan asisten berbasis AI.' },
                  { label: 'Info Cuaca BMKG',    desc: 'Prakiraan cuaca Tugurejo dari API BMKG, real-time.' },
                  { label: 'Inventaris Desa',    desc: 'Pencatatan aset dan sarana prasarana keamanan.' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{f.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Video Player */}
            <div className="flex justify-center lg:justify-center items-start">
              <div className="relative w-full max-w-[300px] sm:max-w-[320px]">
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-slate-950 flex flex-col">
                  {/* Player header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-white/10">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-emerald-400" />
                      Video Profil Desa Tugurejo
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                      HD
                    </span>
                  </div>

                  {/* 9:16 Frame */}
                  <div className="relative w-full bg-slate-950" style={{ paddingBottom: '177.78%' }}>
                    {!videoLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 z-10 text-white">
                        <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                        <span className="text-xs text-slate-400">Memuat video...</span>
                      </div>
                    )}
                    <iframe
                      src={VIDEO_URL}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      title="Video Profil TENTREM Desa Tugurejo"
                      onLoad={() => setVideoLoaded(true)}
                    />
                  </div>

                  {/* Player footer */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-t border-white/10 text-xs text-slate-400">
                    <span>Desa Tugurejo, Slahung</span>
                    <span>&copy; 2026</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── SECTION 2: PROFIL WILAYAH & DEMOGRAFI ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Gambaran Umum &amp; Wilayah Desa
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Kondisi geografis, kewilayahan dusun, dan posko keamanan Desa Tugurejo
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dusun Krajan */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Wilayah Dusun Krajan
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Pusat pemukiman warga bagian timur, Balai Desa Tugurejo, pusat perniagaan mikro, dan Pos Kamling RT 01/RW 01 sebagai pos koordinasi utama.
              </p>
            </div>

            {/* Dusun Tugu */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Wilayah Dusun Tugu
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Kawasan pemukiman perbukitan dan pertanian bagian barat, jalur lintasan antar desa, dan Posko Terpadu pengamanan perbatasan.
              </p>
            </div>

            {/* Posko Terpadu TENTREM */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Pusat Komando Satkamling
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Jaringan komunikasi kentongan isyarat berjenjang, senter patroli, kotak P3K darurat, dan koordinasi dengan Polsek &amp; Koramil Slahung.
              </p>
            </div>
          </div>
        </section>

      </main>

    </div>
  );
}
