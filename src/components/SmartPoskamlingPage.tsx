'use client';

import React from 'react';
import {
  Shield, Phone, User, Users, Clock,
  AlertTriangle, CheckCircle2, Home, ChevronRight,
  MapPin, ShieldCheck, Calendar, Star,
} from 'lucide-react';
import { useSmartPoskamling, KelompokRonda, KontakDarurat, getTodayGroupBySiklus, getTodayCycleDay } from './SmartPoskamlingSection';

/* ─────────────── WA Icon ────────────────────────── */
function WaIcon({ cls = 'w-4 h-4' }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

/* ─────────────── Constants ────────────────────────── */
const JAM_MULAI   = '21:30';
const JAM_SELESAI = '02:00';
const HARI_ORDER  = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

const JABATAN_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  'Babinsa':           { bg: 'bg-green-500/10',   text: 'text-green-700 dark:text-green-300',   border: 'border-green-500/20'   },
  'Bhabinkamtibmas':   { bg: 'bg-blue-500/10',    text: 'text-blue-700 dark:text-blue-300',     border: 'border-blue-500/20'    },
  'Ketua RT':          { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/20' },
  'Ketua RW':          { bg: 'bg-teal-500/10',    text: 'text-teal-700 dark:text-teal-300',     border: 'border-teal-500/20'    },
  'Koordinator Ronda': { bg: 'bg-indigo-500/10',  text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-500/20'  },
  'Linmas':            { bg: 'bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-500/20'   },
};
function jabatanStyle(j: string) {
  for (const k of Object.keys(JABATAN_STYLE))
    if (j.toLowerCase().includes(k.toLowerCase())) return JABATAN_STYLE[k];
  return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' };
}

interface SmartPoskamlingPageProps { onBack: () => void; }

export default function SmartPoskamlingPage({ onBack }: SmartPoskamlingPageProps) {
  const { kelompokList, sortedKontak, todayGroup, today, cycleDay, activeCount, tanggalMulaiSiklus, loading } = useSmartPoskamling();

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
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Smart Poskamling TENTREM</h1>
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
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">Jadwal Siklus — 14 Kelompok Bergilir</span>
                <Calendar className="w-4 h-4 text-slate-400 ml-auto" />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.from({ length: activeCount || kelompokList.length }, (_, i) => i + 1).map(urutNo => {
                  const k = kelompokList.find(x => (x.urutan ?? 99) === urutNo && x.aktif !== false);
                  const isToday = cycleDay === urutNo;
                  return (
                    <div key={urutNo} className={`flex items-start gap-4 px-5 py-4 transition-colors ${isToday ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                      {/* Urutan pill */}
                      <div className={`shrink-0 w-20 text-center py-2 rounded-xl text-xs font-black ${isToday ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        <div>Hari {urutNo}</div>
                        {isToday && <div className="text-[9px] font-bold opacity-80 mt-0.5">HARI INI</div>}
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

            {/* ── Kontak Darurat ── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-red-50 dark:bg-red-950/20">
                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-red-500 to-orange-500" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">Kontak Darurat &amp; Petugas</span>
                <Phone className="w-4 h-4 text-red-500 ml-auto" />
              </div>
              {sortedKontak.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <Phone className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Belum ada kontak darurat.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x-0 divide-slate-100 dark:divide-slate-800">
                  {sortedKontak.map(k => {
                    const s = jabatanStyle(k.jabatan);
                    const waNum = (k.noWa || k.noHp).replace(/\D/g,'').replace(/^0/,'62');
                    return (
                      <div key={k.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${s.bg} ${s.border}`}>
                          <ShieldCheck className={`w-6 h-6 ${s.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md border mb-1 ${s.bg} ${s.text} ${s.border}`}>{k.jabatan}</span>
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{k.nama}</p>
                          {k.keterangan && <p className="text-[11px] text-slate-400 truncate">{k.keterangan}</p>}
                        </div>
                        {/* Tombol ikon Telepon & WA */}
                        <div className="flex items-center gap-2 shrink-0">
                          <a href={`tel:${k.noHp.replace(/\D/g,'')}`} title={`Telepon ${k.nama}`}
                            className="w-10 h-10 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white flex items-center justify-center transition-all">
                            <Phone className="w-4 h-4" />
                          </a>
                          <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer" title={`WhatsApp ${k.nama}`}
                            className="w-10 h-10 rounded-xl bg-green-500/10 hover:bg-green-500 border border-green-500/20 hover:border-green-500 text-green-600 dark:text-green-400 hover:text-white flex items-center justify-center transition-all">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="px-5 py-3 border-t border-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-1.5 text-[11px] text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>Poskamling RT 01/RW 01 · Desa Tugurejo, Kecamatan Slahung, Kabupaten Ponorogo</span>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
