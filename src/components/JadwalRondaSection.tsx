'use client';

import { useState, useEffect } from 'react';
import {
  User, Users,
  AlertTriangle,
  MapPin, Calendar, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';

/* ─────────────── Types ────────────────────────────── */
export interface KelompokRonda {
  id: string;
  nama: string;
  nomorUrut?: number;  // 1-14: posisi dalam siklus
  hari?: string;       // legacy, tidak dipakai untuk logika jadwal
  danpok?: string;
  anggota?: string[];
  aktif?: boolean;
  urutan?: number;     // sama dengan nomorUrut, dipakai untuk sort
}

/* ─────────────── Siklus helpers ─────────────────────── */
/** Kelompok bertugas hari ini: kecocokan hari (Senin–Minggu) atau index = (today - startDate) % total */
export function getTodayGroupBySiklus(list: KelompokRonda[], startDate: string): KelompokRonda | null {
  if (!list.length) return null;
  const sorted = [...list].filter(k => k.aktif !== false).sort((a, b) => (a.urutan ?? 99) - (b.urutan ?? 99));
  if (!sorted.length) return null;

  // 1. Coba cari berdasarkan nama hari saat ini (Senin, Selasa, dst)
  const currentDay = todayName().toLowerCase();
  const byDay = sorted.find(k => (k.hari || '').toLowerCase() === currentDay);
  if (byDay) return byDay;

  // 2. Fallback siklus jika tanggalMulaiSiklus tersedia
  if (startDate) {
    try {
      const total = sorted.length;
      const start = new Date(startDate + 'T00:00:00');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
      const idx = ((diffDays % total) + total) % total;
      return sorted[idx] ?? null;
    } catch { return sorted[0] ?? null; }
  }

  return sorted[0] ?? null;
}

/** Hari ke-N dalam siklus (1–total) */
export function getTodayCycleDay(startDate: string, total: number): number {
  if (total <= 0) return 0;
  const dayIdx = new Date().getDay(); // 0 = Minggu, 1 = Senin, ...
  const hariKe = dayIdx === 0 ? 7 : dayIdx;
  if (total === 7) return hariKe;

  if (!startDate) return hariKe;
  try {
    const start = new Date(startDate + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
    return ((diff % total) + total) % total + 1;
  } catch { return hariKe; }
}

/* ─────────────── Constants ────────────────────────── */
function todayName() {
  return ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date().getDay()];
}
function todayDate() {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ══════════════ Custom hook ════════════════════════ */
export function useJadwalRonda() {
  const [kelompokList, setKelompokList]             = useState<KelompokRonda[]>([]);
  const [tanggalMulaiSiklus, setTanggalMulaiSiklus] = useState<string>('');
  const [loading, setLoading]                       = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    let n = 0;
    const done = () => { if (++n >= 2) setLoading(false); };

    const u1 = onSnapshot(collection(db, 'kelompok_ronda'), snap => {
      const list: KelompokRonda[] = [];
      snap.forEach(d => {
        const data = d.data();
        const anggota: string[] = Array.isArray(data.anggota)
          ? data.anggota.map((s: string) => s.trim()).filter(Boolean)
          : String(data.anggota || '').split('\n').map(s => s.trim()).filter(Boolean);
        list.push({
          id: d.id,
          nama: data.nama || 'Kelompok Ronda',
          nomorUrut: typeof data.nomorUrut === 'number' ? data.nomorUrut : undefined,
          hari: data.hari || '',
          danpok: data.danpok || data.danru || '',
          anggota,
          aktif: data.aktif !== false,
          urutan: typeof data.urutan === 'number' ? data.urutan : 99 });
      });
      list.sort((a, b) => (a.urutan ?? 99) - (b.urutan ?? 99));
      setKelompokList(list);
      done();
    }, () => done());

    const u2 = onSnapshot(doc(db, 'settings', 'smart_poskamling'), snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.tanggalMulaiSiklus) setTanggalMulaiSiklus(d.tanggalMulaiSiklus);
      }
      done();
    }, () => done());

    return () => { u1(); u2(); };
  }, []);

  const today        = todayName();
  const activeCount  = kelompokList.filter(k => k.aktif !== false).length;
  const cycleDay     = getTodayCycleDay(tanggalMulaiSiklus, activeCount);
  const todayGroup   = getTodayGroupBySiklus(kelompokList, tanggalMulaiSiklus);

  return { kelompokList, todayGroup, today, cycleDay, activeCount, tanggalMulaiSiklus, loading };
}

/* ══════════════ WA Icon ════════════════════════════ */
/* ══════════════ Main Section (Beranda) ══════════════ */
interface JadwalRondaSectionProps { onNavigateDetail: () => void; }

export default function JadwalRondaSection({ onNavigateDetail }: JadwalRondaSectionProps) {
  const { kelompokList, todayGroup, today, cycleDay, activeCount, tanggalMulaiSiklus, loading } = useJadwalRonda();
  const dateStr = todayDate();

  if (loading) return (
    <section className="scroll-mt-32 reveal">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-56 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1,2].map(i => <div key={i} className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />)}
        </div>
      </div>
    </section>
  );

  if (!kelompokList.length) return null;

  return (
    <section id="jadwal-ronda" className="scroll-mt-32 reveal">
     
      <div className="mb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Jadwal &amp; Petugas Ronda</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelompok bertugas malam ini dan jadwal ronda Poskamling bergilir.
        </p>
      </div>

      {/* ── 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ═══ COL 1: Tanggal, Waktu Jaga & Siklus ═══ */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/20 p-6 sm:p-7 text-white shadow-xl flex flex-col justify-between min-h-[280px]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Ronda Aktif</span>
              {cycleDay > 0 && activeCount > 0 && (
                <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                  Siklus {cycleDay}/{activeCount}
                </span>
              )}
            </div>

            <div className="mb-6">
              <p className="text-3xl sm:text-4xl font-black text-white leading-none mb-1">{today}</p>
              <p className="text-sm text-white/60 font-medium">{dateStr.replace(today + ', ', '')}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Rotasi kelompok</p>
              <p className="mt-1 text-lg font-black text-white">{activeCount} kelompok bergilir</p>
            </div>
          </div>

          <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/60">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Poskamling RT 01/RW 01 · Desa Tugurejo
            </span>
            <span className="text-emerald-300 font-semibold">Siklus bergilir · {activeCount} kelompok</span>
          </div>
        </div>

        {/* ═══ COL 2: Kelompok & Anggota Bertugas ═══ */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Bertugas Malam Ini</p>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{today}</p>
              </div>
            </div>
            {todayGroup && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
          </div>

          <div className="flex-1 p-6 flex flex-col">
            {todayGroup ? (
              <>
                <div className="mb-4">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">{todayGroup.nama}</p>
                  {todayGroup.danpok && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Danpok: <span className="font-bold text-slate-800 dark:text-slate-200">{todayGroup.danpok}</span></span>
                    </div>
                  )}
                </div>

                {todayGroup.anggota && todayGroup.anggota.length > 0 ? (
                  <div className="flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> {todayGroup.anggota.length} Anggota Bertugas
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {todayGroup.anggota.map((nama, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-black">{i+1}</div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{nama}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Anggota belum diatur.</p>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-600 dark:text-slate-400">
                    {tanggalMulaiSiklus ? 'Kelompok belum diatur' : 'Tanggal mulai siklus belum diset'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Atur di menu admin → Jadwal Ronda</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── CTA Lihat Jadwal Lengkap ── */}
      <div className="mt-5">
        <button
          onClick={onNavigateDetail}
          className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-600/50 hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Lihat Jadwal Ronda Lengkap</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Jadwal {activeCount} kelompok bergilir · siklus {activeCount} hari</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

    </section>
  );
}
