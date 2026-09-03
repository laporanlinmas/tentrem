'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Camera,
  MapPin,
  Calendar,
  Clock,
  User,
  Users,
  Eye,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export interface RondaItem {
  id: string;
  ticket?: string;
  kelompokRonda?: string;
  nama?: string;
  danpok?: string;
  namaDanpok?: string;
  danru?: string;
  namaDanru?: string;
  lokasi?: string;
  tanggalKejadian?: string;
  waktu?: string;
  personil?: string;
  kondisi?: string;
  kejadian?: string;
  deskripsi?: string;
  tindakan?: string;
  laporan?: string;
  laporanAsli?: string;
  fotos?: string[];
  koordinat?: { lat: number; lng: number } | null;
  mapUrl?: string;
  status?: string;
  timestamp?: string;
  createdAt?: string;
}

export interface KelompokRondaItem {
  id: string;
  nama: string;
  hari?: string;
  danpok?: string;
  danru?: string;
  poskamling?: string;
  anggota?: string[];
  jadwal?: string;
  aktif?: boolean;
}

export default function RondaSection() {
  const [rondaList, setRondaList] = useState<RondaItem[]>([]);
  const [kelompokList, setKelompokList] = useState<KelompokRondaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<RondaItem | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [mounted, setMounted] = useState<boolean>(false);

  const DAYS_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const now = new Date();
  const todayDayName = DAYS_INDO[now.getDay()];
  const todayDateStr = now.toISOString().split('T')[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Firestore real-time listener for ronda & kelompok_ronda
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const colRonda = collection(db, 'ronda');
      const unsubRonda = onSnapshot(colRonda, (snapshot) => {
        const list: RondaItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        list.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        setRondaList(list);
        setLoading(false);
      });

      const colKelompok = collection(db, 'kelompok_ronda');
      const unsubKelompok = onSnapshot(colKelompok, (snapshot) => {
        const list: KelompokRondaItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setKelompokList(list);
      });

      return () => {
        unsubRonda();
        unsubKelompok();
      };
    } catch {
      setLoading(false);
    }
  }, []);

  // Body scroll lock & Escape key listener when detail modal is open (Glitch-free & Layout-Shift free)
  useEffect(() => {
    if (selectedItem) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedItem(null);
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, scrollY);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedItem]);

  const getKondisiBadge = (kondisiStr?: string) => {
    const k = (kondisiStr || '').toLowerCase();
    if (k.includes('darurat') || k.includes('bahaya')) {
      return {
        bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
        text: kondisiStr || 'Darurat',
      };
    }
    if (k.includes('gangguan') || k.includes('indikasi')) {
      return {
        bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
        text: kondisiStr || 'Ada Gangguan',
      };
    }
    if (k.includes('pantau') || k.includes('waspada')) {
      return {
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        text: kondisiStr || 'Perlu Pantauan',
      };
    }
    return {
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      text: kondisiStr || 'Aman & Kondusif',
    };
  };

  const handleOpenDetail = (item: RondaItem) => {
    setSelectedItem(item);
    setActivePhotoIdx(0);
  };

  // Find today's group & report
  const todayKelompok = kelompokList.find(
    (k) => (k.hari || '').toLowerCase() === todayDayName.toLowerCase() && k.aktif !== false
  );

  const todayReport = rondaList.find(
    (r) =>
      r.tanggalKejadian === todayDateStr ||
      (r.createdAt && r.createdAt.startsWith(todayDateStr)) ||
      (r.timestamp && r.timestamp.startsWith(todayDateStr))
  );

  const latestPreviousReport = todayReport
    ? rondaList.find((r) => r.id !== todayReport.id)
    : rondaList[0];

  return (
    <section id="ronda" className="scroll-mt-32 pt-8 sm:pt-12 reveal">
      {/* ── Section Header Divider ── */}
      <div className="flex items-center gap-4 mb-8 sm:mb-10">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 tracking-widest uppercase">
            Siskamling &amp; Patroli Desa
          </span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Title ── */}
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Laporan Ronda Malam
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed mt-1">
            Dokumentasi foto dan situasi keamanan ronda Poskamling Desa Tugurejo.
          </p>
        </div>

        {/* ── Main Display: Today's Report OR Notice + Previous Report ── */}
        {todayReport ? (
          /* CASE 1: Laporan Ronda Hari Ini Aktif */
          <div
            onClick={() => handleOpenDetail(todayReport)}
            className="group relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl hover:border-emerald-500 transition-all cursor-pointer p-6 sm:p-8"
          >
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
              {/* Photo Showcase */}
              <div className="w-full lg:w-1/2 aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 relative border border-slate-200 dark:border-slate-800 shrink-0">
                {todayReport.fotos && todayReport.fotos.length > 0 ? (
                  <img
                    src={todayReport.fotos[0]}
                    alt="Foto Ronda Hari Ini"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Camera className="w-10 h-10 opacity-30" />
                    <span className="text-xs">Foto dokumentasi aktif</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-md">
                  ● Ronda Hari Ini ({todayDayName})
                </span>
                {todayReport.fotos && todayReport.fotos.length > 1 && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-black bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-emerald-400" />
                    <span>{todayReport.fotos.length} Foto</span>
                  </span>
                )}
                <span className={`absolute bottom-3 left-3 px-3 py-1 rounded-lg text-xs font-black border backdrop-blur-md ${getKondisiBadge(todayReport.kondisi).bg}`}>
                  {getKondisiBadge(todayReport.kondisi).text}
                </span>
              </div>

              {/* Info Content */}
              <div className="w-full lg:w-1/2 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{todayReport.tanggalKejadian || todayDateStr}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{todayReport.waktu ? `${todayReport.waktu} WIB` : 'Malam'}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {todayReport.kelompokRonda || 'Kelompok Ronda Tugurejo'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-300 font-semibold pt-1">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Danpok: <strong className="text-slate-900 dark:text-white">{todayReport.namaDanpok || todayReport.danpok || todayReport.namaDanru || todayReport.danru || 'Danpok'}</strong></span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{todayReport.lokasi || 'Poskamling Desa Tugurejo'}</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed pt-2">
                    {todayReport.kejadian || todayReport.deskripsi || 'Kegiatan ronda malam berjalan lancar dan kondusif.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    <span>Buka Rincian &amp; Foto Lengkap</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CASE 2: Belum Ada Laporan Hari Ini -> Notice + Laporan Terakhir */
          <div className="space-y-6">
            {/* Notice Card: Belum Ada Laporan Hari Ini */}
            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-dashed border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Clock className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-[11px] uppercase">
                      Jadwal Malam Ini: {todayDayName}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Belum Ada Laporan Ronda Malam Ini
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Jadwal bertugas: <strong>{todayKelompok ? todayKelompok.nama : `Kelompok ${todayDayName}`}</strong>
                    {(todayKelompok?.danpok || todayKelompok?.danru) ? ` (Danpok: ${todayKelompok.danpok || todayKelompok.danru})` : ''}
                  </p>
                </div>
              </div>

            </div>

            {/* Laporan Ronda Terakhir yang Tersedia */}
            {latestPreviousReport && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Laporan Ronda Terakhir Sebelumnya</span>
                  </span>
                </div>

                <div
                  onClick={() => {
                    setActivePhotoIdx(0);
                    setSelectedItem(latestPreviousReport);
                  }}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    {/* Thumbnail preview */}
                    {latestPreviousReport.fotos && latestPreviousReport.fotos.length > 0 ? (
                      <div className="w-full sm:w-44 aspect-[4/3] rounded-2xl overflow-hidden bg-black shrink-0 relative">
                        <img
                          src={latestPreviousReport.fotos[0]}
                          alt="Foto Ronda"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black text-emerald-400">
                          {latestPreviousReport.fotos.length} Foto
                        </span>
                      </div>
                    ) : (
                      <div className="w-full sm:w-44 aspect-[4/3] rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs shrink-0">
                        Tanpa Foto
                      </div>
                    )}

                    {/* Report Information */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{latestPreviousReport.tanggalKejadian || latestPreviousReport.timestamp?.split(' ')[0] || '—'}</span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{latestPreviousReport.waktu ? `${latestPreviousReport.waktu} WIB` : 'Malam'}</span>
                      </div>

                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                        {latestPreviousReport.kelompokRonda || 'Laporan Ronda'}
                      </h4>

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                        <span>Danpok: <strong className="text-slate-800 dark:text-slate-200">{latestPreviousReport.namaDanpok || latestPreviousReport.danpok || latestPreviousReport.namaDanru || latestPreviousReport.danru || 'Danpok'}</strong></span>
                        <span>•</span>
                        <span>{latestPreviousReport.lokasi || 'Poskamling Tugurejo'}</span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {latestPreviousReport.kejadian || latestPreviousReport.deskripsi || 'Kegiatan patroli lingkungan terpantau tertib.'}
                      </p>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Lihat Rincian</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL (PORTAL TO DOCUMENT.BODY FOR 100% FULL-VIEWPORT OVERLAY) ── */}
      {mounted &&
        selectedItem &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-200 overflow-y-auto"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl my-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] uppercase">
                        {selectedItem.kelompokRonda || 'Laporan Ronda'}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                      {selectedItem.lokasi || 'Poskamling Desa Tugurejo'}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
                    title="Tutup (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1 custom-scrollbar">
                {/* Photo Showcase & Watermark Preview */}
                {selectedItem.fotos && selectedItem.fotos.length > 0 && (
                  <div className="space-y-3">
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-inner group">
                      <img
                        src={selectedItem.fotos[activePhotoIdx] || selectedItem.fotos[0]}
                        alt="Foto Dokumentasi Watermark"
                        className="w-full h-full object-contain"
                      />

                      {/* Watermark badge on photo */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-black text-emerald-400 border border-white/10 flex items-center gap-1.5">
                        <Camera className="w-3 h-3" />
                        <span>Cap Watermark Resmi Siskamling</span>
                      </span>

                      <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[11px] font-bold">
                        Foto {activePhotoIdx + 1} dari {selectedItem.fotos.length}
                      </span>
                    </div>

                    {/* Thumbnail strip */}
                    {selectedItem.fotos.length > 1 && (
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                        {selectedItem.fotos.map((photoUrl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActivePhotoIdx(i)}
                            className={`w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                              activePhotoIdx === i
                                ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/20'
                                : 'border-transparent opacity-60 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4-Grid Key Information */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Danpok Ronda</span>
                    <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                      {selectedItem.namaDanpok || selectedItem.danpok || selectedItem.namaDanru || selectedItem.danru || selectedItem.nama || '—'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Waktu Patroli</span>
                    <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                      {selectedItem.waktu ? `${selectedItem.waktu} WIB` : 'Malam'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Tanggal</span>
                    <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                      {selectedItem.tanggalKejadian || selectedItem.timestamp?.split(' ')[0] || '—'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Status Wilayah</span>
                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm truncate">
                      {selectedItem.kondisi || 'Aman & Kondusif'}
                    </p>
                  </div>
                </div>

                {/* Personil / Anggota Hadir Chips */}
                {selectedItem.personil && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Users className="w-3.5 h-3.5 text-teal-500" />
                      <span>Petugas / Anggota Ronda Hadir:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.personil.split(',').map((pName, pi) => (
                        <span
                          key={pi}
                          className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          👤 {pName.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Findings / Kejadian */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                    Catatan Temuan &amp; Situasi Ronda
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line italic">
                    "{selectedItem.kejadian || selectedItem.deskripsi || selectedItem.laporan || 'Situasi terpantau aman dan tertib selama kegiatan ronda berlangsung.'}"
                  </p>
                </div>

                {/* Tindakan Khusus */}
                {selectedItem.tindakan && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                      Tindakan Khusus Petugas
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedItem.tindakan}
                    </p>
                  </div>
                )}

                {/* GPS Coordinates & Google Maps Button */}
                {selectedItem.koordinat && (
                  <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold truncate">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">
                        Titik Koordinat: {selectedItem.koordinat.lat.toFixed(5)}, {selectedItem.koordinat.lng.toFixed(5)}
                      </span>
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${selectedItem.koordinat.lat},${selectedItem.koordinat.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm shadow-emerald-500/20"
                    >
                      <span>Buka di Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
