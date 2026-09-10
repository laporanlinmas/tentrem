'use client';

import React from 'react';
import {
  Shield, User, Users, Clock,
  AlertTriangle, CheckCircle2, Home, ChevronRight,
  MapPin, Calendar, Star,
} from 'lucide-react';
import { useJadwalRonda, KelompokRonda, getTodayGroupBySiklus, getTodayCycleDay } from './JadwalRondaSection';

/* ─────────────── Constants ────────────────────────── */
const JAM_MULAI   = '21:30';
const JAM_SELESAI = '02:00';
const HARI_ORDER  = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

interface JadwalRondaPageProps { onBack: () => void; }

export default function JadwalRondaPage({ onBack }: JadwalRondaPageProps) {
  const { kelompokList, todayGroup, today, cycleDay, activeCount, tanggalMulaiSiklus, loading } = useJadwalRonda();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8" tabIndex={-1}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <button type="button" onClick={onBack} className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-white font-bold">Jadwal Ronda</span>
        </nav>

        {/* Header */}
        <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Jadwal Ronda TENTREM</h1>
          <p className="text-sm text-slate-400 mt-1.5">Sistem ronda cerdas berbasis digital — jadwal bergilir, laporan petugas, dan pemantauan keamanan lingkungan.</p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
          </div>
        ) : (
          <>
            {/* ── Kelompok Bertugas Hari Ini ── */}
            {todayGroup && (
              <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-emerald-100 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30">
                  <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Bertugas Malam Ini — {today}</span>
                  <span className="ml-auto flex h-2 w-2 relative">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    <div className="flex-1">
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">{todayGroup.nama}</p>
                      {todayGroup.danpok && (
                        <div className="flex items-center gap-2 mb-4">
                          <User className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Komandan: <strong className="text-slate-800 dark:text-slate-200">{todayGroup.danpok}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> {JAM_MULAI} – {JAM_SELESAI} WIB
                        </div>
                        <span className="text-xs text-slate-400">4,5 Jam</span>
                      </div>
                    </div>
                    {todayGroup.anggota && todayGroup.anggota.length > 0 && (
                      <div className="sm:w-80">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> {todayGroup.anggota.length} Anggota Bertugas
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {todayGroup.anggota.map((nama, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center justify-center shrink-0">{i+1}</span>
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{nama}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Jadwal Siklus 14 Hari ── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-400 to-emerald-500" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">Jadwal Siklus — {activeCount || 7} Kelompok Bergilir (Senin – Minggu)</span>
                <Calendar className="w-4 h-4 text-slate-400 ml-auto" />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.from({ length: activeCount || kelompokList.length }, (_, i) => i + 1).map(urutNo => {
                  const k = kelompokList.find(x => (x.urutan ?? 99) === urutNo && x.aktif !== false);
                  const isToday = cycleDay === urutNo;
                  return (
                    <div key={urutNo} className={`flex items-start gap-4 px-5 py-4 transition-colors ${isToday ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                      {/* Urutan pill */}
                      <div className={`shrink-0 w-24 text-center py-2 rounded-xl text-xs font-black ${isToday ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        <div>{k?.hari ? k.hari.toUpperCase() : `Hari ${urutNo}`}</div>
                        {isToday && <div className="text-[9px] font-bold opacity-90 mt-0.5">HARI INI</div>}
                      </div>

                      {k ? (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <p className={`text-base font-black ${isToday ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>{k.nama}</p>
                            {isToday && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                          {k.danpok && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                              <User className="w-3 h-3 text-emerald-500" /> Danpok: <strong className="text-slate-700 dark:text-slate-300 ml-0.5">{k.danpok}</strong>
                            </p>
                          )}
                          {k.anggota && k.anggota.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {k.anggota.map((nama, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                  <User className="w-2.5 h-2.5 text-emerald-500 shrink-0" />{nama}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center gap-2 text-slate-400">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span className="text-sm italic">Kelompok belum diatur</span>
                        </div>
                      )}

                      <div className="shrink-0 text-right">
                        <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">{JAM_MULAI}</div>
                        <div className="text-[10px] text-slate-400">s/d {JAM_SELESAI}</div>
                        {k?.anggota?.length && <div className="text-[10px] text-slate-400 mt-0.5">{k.anggota.length} org</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-teal-500" />
                <span>Setiap malam · {JAM_MULAI} – {JAM_SELESAI} WIB · 4,5 Jam · Siklus bergilir {activeCount || kelompokList.length} kelompok</span>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
