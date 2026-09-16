'use client';

import { useState } from 'react';
import {
  Video,
  Home,
  Compass,
  Shield,
  Users,
  Flame,
  Bell,
  Leaf,
  Moon,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

const VIDEO_URL = import.meta.env.VITE_VIDEO_URL;

interface ProfilPageProps {
  onBack: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

export default function ProfilPage({ onBack }: ProfilPageProps) {
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
          <span className="text-slate-900 dark:text-white font-bold">Profil TENTREM</span>
        </nav>

        {/* Hero Banner */}
        <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Profil Desa Tugurejo &amp; TENTREM</h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Platform terpadu kamtibmas, pelayanan publik, dan keterbukaan informasi · Kec. Slahung, Kab. Ponorogo
          </p>
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
                  Dalam falsafah budaya Jawa, kata <strong className="text-slate-800 dark:text-slate-100">"Tentrem"</strong> mengandung makna keadaan hidup yang damai, tenteram, ayem, aman, dan sejahtera — tanpa rasa was-was atau ketakutan bagi seluruh warga masyarakat.
                </p>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Nilai luhur ini diwujudkan menjadi sebuah platform digital terpadu yang menggabungkan kearifan lokal Siskamling dengan teknologi informasi modern.
                </p>
              </div>

              {/* Akronim TENTREM */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Makna Akronim</p>
                  <div className="flex gap-0.5">
                    {'TENTREM'.split('').map((l, i) => (
                      <span key={i} className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center border border-emerald-500/20">{l}</span>
                    ))}
                  </div>
                </div>
                {[
                  { letters: 'T·E', word: 'Tugurejo',  color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', desc: 'Identitas Desa Tugurejo sebagai pelopor inovasi siskamling berbasis digital.' },
                  { letters: 'N',   word: 'Nyaman',    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',           desc: 'Mewujudkan lingkungan pemukiman yang tenteram, damai, tertib, dan kondusif.' },
                  { letters: 'T',   word: 'Tanggap',   color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',           desc: 'Kesiapsiagaan cepat dalam penanganan kedaruratan, kamtibmas, dan mitigasi bencana.' },
                  { letters: 'R·E', word: 'Responsif', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',           desc: 'Layanan pengaduan masyarakat yang cepat ditindaklanjuti dan komunikasi dua arah real-time.' },
                  { letters: 'M',   word: 'Modern',    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',   desc: 'Transformasi digital menuju Smart Poskamling' },
                ].map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${a.color}`}>
                    <span className={`min-w-[2.25rem] h-7 rounded-lg px-1.5 flex items-center justify-center font-black text-xs shrink-0 ${a.color}`}>{a.letters}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{a.word}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Video Player — Landscape 16:9 */}
            <div className="flex flex-col justify-center items-stretch gap-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-slate-950 flex flex-col">
                {/* Player header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-white/10">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                    Video Profil Siskamling Terpadu Desa Tugurejo
                  </span>
                </div>

                {/* 16:9 Landscape Frame */}
                <div className="relative w-full bg-slate-950" style={{ paddingBottom: '56.25%' }}>
                  {!videoLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 z-10 text-white">
                      <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                      <span className="text-xs text-slate-400">Memuat video...</span>
                    </div>
                  )}
                  <iframe
                    src={VIDEO_URL}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    title="Video Profil Siskamling Terpadu TENTREM Desa Tugurejo"
                    onLoad={() => setVideoLoaded(true)}
                  />
                </div>

                {/* Player footer */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-t border-white/10 text-xs text-slate-400">
                  <span>Desa Tugurejo, Slahung · Kab. Ponorogo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: FITUR PLATFORM TENTREM ── */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Fitur Platform TENTREM</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Layanan digital yang dapat diakses warga kapan saja dan di mana saja</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Jadwal Ronda',        desc: 'Jadwal ronda bergilir, laporan petugas digital, dan absensi jaga malam.',          icon: Moon    },
              { label: 'Aduan Real-time',     desc: 'Pelaporan kejadian, pengaduan warga 24 jam dengan notifikasi push instan.',         icon: Bell    },
              { label: 'Chatbot AI 24 Jam',   desc: 'Asisten berbasis AI untuk informasi dan komunikasi dua arah kapan saja.',           icon: Smartphone },
              { label: 'Transparansi Warta',  desc: 'Berita, pengumuman, dan galeri dokumentasi kegiatan Pemerintah Desa.',              icon: ChevronRight },
              { label: 'Peta Geospasial',     desc: 'Peta batas desa, pos ronda, dan titik penting berbasis KML interaktif.',            icon: Compass },
              { label: 'Inventaris Desa',     desc: 'Pencatatan aset, sarana, dan prasarana keamanan lingkungan secara digital.',        icon: Shield  },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{f.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3: SISKAMLING TERPADU ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Siskamling Terpadu Desa Tugurejo
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Sistem keamanan lingkungan yang tumbuh dari kepedulian, kesiapsiagaan, dan sinergi seluruh unsur masyarakat
              </p>
            </div>
          </div>

          {/* Pilar Siskamling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Users,
                color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                title: 'Kebersamaan & Gotong Royong',
                desc: 'Warga, Pemdes, Babinsa, Bhabinkamtibmas, Satgas Linmas, Satlinmas, TNI/Polri, tokoh masyarakat, tokoh agama, perguruan, dan karang taruna bersinergi menjaga keamanan lingkungan.',
              },
              {
                icon: Shield,
                color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
                title: 'Pelatihan & Kesiapsiagaan',
                desc: 'Pembinaan Satlinmas & Tagana oleh Babinsa, Bhabinkamtibmas, Damkar, BPBD, dan Satgas Linmas. Meliputi baris-berbaris, teknik pengamanan pelaku, penanganan kebakaran, dan ronda malam.',
              },
              {
                icon: Smartphone,
                color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                title: 'Teknologi Aplikasi TENTREM',
                desc: 'Portal pelaporan real-time yang memungkinkan warga melaporkan kejadian darurat seketika. Notifikasi langsung diterima admin posko, respons cepat, dan penugasan tim dapat dilakukan dalam hitungan detik.',
              },
              {
                icon: Leaf,
                color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
                title: 'Lingkungan & Produktivitas',
                desc: 'Pos Kamling sebagai ruang produktif: program SAJADAH (Sampah Jadi Sedekah) pengelolaan botol plastik, penanaman TOGA (Tanaman Obat Keluarga), dan Gerakan Aksi Indonesia ASRI.',
              },
            ].map((p, i) => (
              <div key={i} className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm space-y-3 ${p.color}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${p.color}`}>
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{p.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 4: ALUR RESPONS SISKAMLING ── */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Alur Respons Siskamling</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Dari laporan warga hingga penanganan — sistem respons cepat berbasis aplikasi dan kentongan
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-emerald-500/40 via-teal-500/40 to-blue-500/40 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
              {[
                { step: '1', icon: Bell,        color: 'bg-emerald-500', label: 'Laporan Warga',    desc: 'Warga melaporkan kejadian (kebakaran, pencurian, dll.) melalui Aplikasi TENTREM beserta bukti kejadian.' },
                { step: '2', icon: Smartphone,  color: 'bg-teal-500',    label: 'Notifikasi Posko', desc: 'Notifikasi berbunyi seketika di Posko Satlinmas. Admin siaga merespons dan menelaah laporan.' },
                { step: '3', icon: Users,        color: 'bg-cyan-500',    label: 'Penugasan Tim',    desc: 'Admin menugaskan tim bergerak menuju titik kejadian. Kentongan dibunyikan sebagai sinyal tanda siaga.' },
                { step: '4', icon: Shield,       color: 'bg-blue-500',    label: 'Penanganan',       desc: 'Tim menangani kejadian dengan teknik yang telah dilatihkan — humanis, selamat, dan sesuai prosedur.' },
                { step: '5', icon: ChevronRight, color: 'bg-indigo-500',  label: 'Tindak Lanjut',   desc: 'Pelaku/situasi diserahkan ke Babinsa, Bhabinkamtibmas, atau Kepolisian untuk proses lebih lanjut.' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl ${s.color} text-white flex items-center justify-center shadow-lg shrink-0`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Langkah {s.step}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{s.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CLOSING QUOTE ── */}
        <section className="rounded-3xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-8 sm:px-10 text-center space-y-3">
          <p className="text-base sm:text-lg font-black text-white leading-snug">
            "Dari Poskamling, tumbuh kebersamaan.<br />
            Dari pelatihan dan pembinaan, lahir kesiapsiagaan.<br />
            Dari kepedulian, tumbuh lingkungan yang terjaga."
          </p>
          <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mt-4">
            Poskamling Tentrem · Jogo Jawa Timur
          </p>
        </section>

      </main>

    </div>
  );
}
