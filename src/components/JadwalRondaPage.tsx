'use client';

import {
  User, Users,
  AlertTriangle, CheckCircle2, Home, ChevronRight,
  Calendar, Star,
} from 'lucide-react';
import { useJadwalRonda } from './JadwalRondaSection';

/* ─────────────── Constants ────────────────────────── */
interface JadwalRondaPageProps { onBack: () => void; }

export default function JadwalRondaPage({ onBack }: JadwalRondaPageProps) {
  const { kelompokList, todayGroup, today, cycleDay, activeCount, loading } = useJadwalRonda();

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
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 px-6 py-7 sm:px-8 sm:py-8 text-white shadow-xl shadow-slate-900/10">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.12)]" />
              Poskamling Digital
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">Jadwal Ronda TENTREM</h1>
            <p className="text-sm leading-relaxed text-slate-400 mt-2">Jadwal bergilir dan susunan petugas ronda Desa Tugurejo dalam satu tampilan yang mudah dipantau.</p>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
          </div>
        ) : (
          <>
            {/* ── Kelompok Bertugas Hari Ini ── */}
            {todayGroup && (
              <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-800/50 dark:bg-slate-900">
                <div className="flex flex-wrap items-center gap-3 border-b border-emerald-100 bg-emerald-50/80 px-5 py-4 dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:px-7">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/25">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Bertugas malam ini</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-700 dark:text-slate-200">{today} · Petugas aktif</p>
                  </div>
                  <span className="ml-auto flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300">
                    <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative h-2 w-2 rounded-full bg-emerald-500" /></span>
                    Aktif
                  </span>
                </div>
                <div className="grid lg:grid-cols-[minmax(15rem,0.72fr)_minmax(0,1.28fr)]">
                  <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-7 lg:border-b-0 lg:border-r">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Kelompok jaga</p>
                    <p className="mt-2 text-2xl font-black leading-tight text-slate-950 dark:text-white sm:text-3xl">{todayGroup.nama}</p>
                    {todayGroup.danpok && (
                      <div className="mt-5 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><User className="h-4 w-4" /></div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Danpok</p>
                          <p className="break-words text-sm font-bold text-slate-800 dark:text-slate-200">{todayGroup.danpok}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50/70 p-5 dark:bg-slate-950/30 sm:p-7">
                    <div className="mb-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Regu bertugas</p>
                        <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{todayGroup.anggota?.length || 0} anggota aktif</p>
                      </div>
                      <Users className="h-5 w-5 text-emerald-500" />
                    </div>
                    {todayGroup.anggota && todayGroup.anggota.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                        {todayGroup.anggota.map((nama) => (
                          <div key={nama} className="flex min-h-[4.25rem] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <span className="break-words text-sm font-bold leading-snug text-slate-700 dark:text-slate-200">{nama}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm italic text-slate-400 dark:border-slate-700">Anggota belum diatur.</p>}
                  </div>
                </div>
              </section>
            )}

            {/* ── Jadwal Siklus 14 Hari ── */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-emerald-500"><Calendar className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Rotasi penjagaan</p>
                    <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Siklus {activeCount || kelompokList.length} kelompok</h2>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 bg-slate-50/70 p-4 dark:bg-slate-950/20 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
                {Array.from({ length: activeCount || kelompokList.length }, (_, i) => i + 1).map(urutNo => {
                  const k = kelompokList.find(x => (x.urutan ?? 99) === urutNo && x.aktif !== false);
                  const isToday = cycleDay === urutNo;
                  return (
                    <article key={urutNo} className={`flex min-h-[13rem] flex-col rounded-2xl border p-4 transition-all ${isToday ? 'border-emerald-300 bg-emerald-50/80 shadow-md shadow-emerald-500/10 dark:border-emerald-700 dark:bg-emerald-950/25' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className={`rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider ${isToday ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {k?.hari || `Hari ${urutNo}`}
                        </div>
                        {isToday ? <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Hari ini</span> : <span className="text-xs font-bold text-slate-400">#{String(urutNo).padStart(2, '0')}</span>}
                      </div>
                      {k ? <>
                        <p className={`mt-5 break-words text-lg font-black leading-tight ${isToday ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-900 dark:text-white'}`}>{k.nama}</p>
                        {k.danpok && <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400"><User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> <span className="break-words">Danpok: <strong className="text-slate-700 dark:text-slate-300">{k.danpok}</strong></span></p>}
                        {k.anggota && k.anggota.length > 0 ? (
                          <div className="mt-4 space-y-1.5">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Anggota</p>
                            <div className="grid grid-cols-1 gap-1.5">
                              {k.anggota.map((nama) => (
                                <p key={nama} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800/80 dark:text-slate-300">{nama}</p>
                              ))}
                            </div>
                          </div>
                        ) : <p className="mt-4 text-xs italic text-slate-400">Anggota belum diatur.</p>}
                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{k.anggota?.length || 0} anggota</span>
                        </div>
                      </> : <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-slate-400"><AlertTriangle className="h-6 w-6" /><span className="text-sm italic">Kelompok belum diatur</span></div>}
                      </article>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 bg-white px-5 py-3 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                <span>Siklus bergilir {activeCount || kelompokList.length} kelompok</span>
              </div>
            </section>
          </>
        )}

      </main>
    </div>
  );
}
