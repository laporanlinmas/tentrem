'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield, Phone, User, Users, Clock,
  AlertTriangle,
  MapPin, ShieldCheck, Calendar, ArrowRight } from 'lucide-react';
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

export interface KontakDarurat {
  id: string;
  jabatan: string;
  nama: string;
  noHp: string;
  noWa?: string;
  keterangan?: string;
  prioritas: number;
}

/* ─────────────── Siklus helpers ─────────────────────── */
/** Kelompok bertugas hari ini: index = (today - startDate) % totalKelompokAktif */
export function getTodayGroupBySiklus(list: KelompokRonda[], startDate: string): KelompokRonda | null {
  if (!startDate || !list.length) return null;
  try {
    const sorted = [...list].filter(k => k.aktif !== false).sort((a, b) => (a.urutan ?? 99) - (b.urutan ?? 99));
    if (!sorted.length) return null;
    const total = sorted.length;
    const start = new Date(startDate + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
    const idx = ((diffDays % total) + total) % total; // 0 – (total-1)
    return sorted[idx] ?? null;
  } catch { return null; }
}

/** Hari ke-N dalam siklus (1–total) */
export function getTodayCycleDay(startDate: string, total: number): number {
  if (!startDate || total <= 0) return 0;
  try {
    const start = new Date(startDate + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
    return ((diff % total) + total) % total + 1;
  } catch { return 0; }
}

/* ─────────────── Constants ────────────────────────── */
const JAM_MULAI   = '21:30';
const JAM_SELESAI = '02:00';
const HARI_ORDER  = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

const JABATAN_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Babinsa':           { bg: 'bg-green-500/10',   text: 'text-green-700 dark:text-green-300',   border: 'border-green-500/20',   dot: 'bg-green-500'   },
  'Bhabinkamtibmas':   { bg: 'bg-blue-500/10',    text: 'text-blue-700 dark:text-blue-300',     border: 'border-blue-500/20',    dot: 'bg-blue-500'    },
  'Ketua RT':          { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  'Ketua RW':          { bg: 'bg-teal-500/10',    text: 'text-teal-700 dark:text-teal-300',     border: 'border-teal-500/20',    dot: 'bg-teal-500'    },
  'Koordinator Ronda': { bg: 'bg-indigo-500/10',  text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-500/20',  dot: 'bg-indigo-500'  },
  'Linmas':            { bg: 'bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-500/20',   dot: 'bg-amber-500'   } };
function jabatanStyle(j: string) {
  for (const k of Object.keys(JABATAN_STYLE))
    if (j.toLowerCase().includes(k.toLowerCase())) return JABATAN_STYLE[k];
  return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' };
}

function todayName() {
  return ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date().getDay()];
}
function todayDate() {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ══════════════ Custom hook ════════════════════════ */
export function useSmartPoskamling() {
  const [kelompokList, setKelompokList]             = useState<KelompokRonda[]>([]);
  const [kontakList,   setKontakList]               = useState<KontakDarurat[]>([]);
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
        if (Array.isArray(d.kontakDarurat)) setKontakList(d.kontakDarurat);
        if (d.tanggalMulaiSiklus)           setTanggalMulaiSiklus(d.tanggalMulaiSiklus);
      }
      done();
    }, () => done());

    return () => { u1(); u2(); };
  }, []);

  const today        = todayName();
  const activeCount  = kelompokList.filter(k => k.aktif !== false).length;
  const cycleDay     = getTodayCycleDay(tanggalMulaiSiklus, activeCount);
  const todayGroup   = getTodayGroupBySiklus(kelompokList, tanggalMulaiSiklus);
  const sortedKontak = [...kontakList].sort((a, b) => (a.prioritas || 99) - (b.prioritas || 99));

  return { kelompokList, sortedKontak, todayGroup, today, cycleDay, activeCount, tanggalMulaiSiklus, loading };
}

/* ══════════════ WA Icon ════════════════════════════ */
function WaIcon({ cls = 'w-4 h-4' }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

/* ══════════════ Main Section (Beranda) ══════════════ */
interface SmartPoskamlingiSectionProps { onNavigateDetail: () => void; }

export default function SmartPoskamlingSection({ onNavigateDetail }: SmartPoskamlingiSectionProps) {
  const { kelompokList, sortedKontak, todayGroup, today, cycleDay, activeCount, tanggalMulaiSiklus, loading } = useSmartPoskamling();
  const dateStr = todayDate();

  if (loading) return (
    <section className="scroll-mt-32 reveal">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-56 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />)}
        </div>
      </div>
    </section>
  );

  if (!kelompokList.length && !sortedKontak.length) return null;

  return (
    <section id="smart-poskamling" className="scroll-mt-32 reveal">

      {/* ── Section Header ── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 tracking-widest uppercase">Smart Poskamling</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
      </div>

      <div className="mb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Jadwal &amp; Petugas Ronda</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelompok bertugas malam ini, anggota ronda, dan kontak darurat Poskamling.
        </p>
      </div>

      {/* ── 3-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ═══ COL 1: Tanggal & Waktu Jaga ═══ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/20 p-6 text-white shadow-xl flex flex-col justify-between min-h-[220px]">
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
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                  Siklus {cycleDay}/{activeCount}
                </span>
              )}
            </div>

            <div className="mb-5">
              <p className="text-3xl sm:text-4xl font-black text-white leading-none mb-1">{today}</p>
              <p className="text-sm text-white/60 font-medium">{dateStr.replace(today + ', ', '')}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Mulai Jaga</p>
                  <p className="text-xl font-black text-white font-mono">{JAM_MULAI} <span className="text-sm font-semibold text-white/60">WIB</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Selesai Jaga</p>
                  <p className="text-xl font-black text-white font-mono">{JAM_SELESAI} <span className="text-sm font-semibold text-white/60">WIB</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-white/40 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Durasi: 4,5 Jam
            </span>
            <span className="text-[11px] text-white/40">Bergilir {activeCount} kelompok</span>
          </div>
        </div>

        {/* ═══ COL 2: Kelompok & Anggota Bertugas ═══ */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Bertugas Malam Ini</p>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{today}</p>
              </div>
            </div>
            {todayGroup && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>

          <div className="flex-1 p-5 flex flex-col">
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
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
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
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-600 dark:text-slate-400">
                    {tanggalMulaiSiklus ? 'Kelompok belum diatur' : 'Tanggal mulai siklus belum diset'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Atur di menu admin → Smart Poskamling</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ COL 3: Kontak Darurat ═══ */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-red-50 dark:bg-red-950/20">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Phone className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">Hubungi Darurat</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Kontak Petugas &amp; Aparat</p>
            </div>
          </div>

          {sortedKontak.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
              <Phone className="w-8 h-8 opacity-20" />
              <p className="text-sm">Belum ada kontak darurat.</p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {sortedKontak.map(k => {
                const s = jabatanStyle(k.jabatan);
                const waNum = (k.noWa || k.noHp).replace(/\D/g,'').replace(/^0/,'62');
                return (
                  <div key={k.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${s.bg} ${s.border}`}>
                      <ShieldCheck className={`w-5 h-5 ${s.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${s.bg} ${s.text} ${s.border}`}>{k.jabatan}</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate mt-0.5">{k.nama}</p>
                      {k.keterangan && <p className="text-[10px] text-slate-400 truncate">{k.keterangan}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a href={`tel:${k.noHp.replace(/\D/g,'')}`} title="Telepon"
                        className="w-9 h-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white flex items-center justify-center transition-all">
                        <Phone className="w-4 h-4" />
                      </a>
                      <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                        className="w-9 h-9 rounded-xl bg-green-500/10 hover:bg-green-500 border border-green-500/20 hover:border-green-500 text-green-600 dark:text-green-400 hover:text-white flex items-center justify-center transition-all">
                        <WaIcon />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-1.5 text-[10px] text-slate-400">
            <MapPin className="w-3 h-3 text-emerald-500" />
            <span>Poskamling RT 01/RW 01 · Desa Tugurejo, Slahung</span>
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
