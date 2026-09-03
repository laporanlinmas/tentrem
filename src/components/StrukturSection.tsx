'use client';

import React, { useState } from 'react';
import { Shield, Users, Star, UserCheck, GitBranch, Link2, ChevronDown } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Level = 'pembina' | 'penanggungjawab' | 'pelaksana' | 'petugas';

interface OrgNode {
  level: Level;
  badge: string;
  jabatan: string;
  nama?: string;
  tugas: string;
}

// ─── Level config ─────────────────────────────────────────────────────────────
const CFG: Record<Level, { dot: string; badgeCls: string; textCls: string; borderCls: string; icon: React.ReactNode }> = {
  pembina: {
    dot: 'bg-blue-500',
    badgeCls: 'bg-blue-500/10 border-blue-400/30',
    textCls: 'text-blue-600 dark:text-blue-300',
    borderCls: 'border-blue-200 dark:border-blue-800/50',
    icon: <Star className="w-3 h-3" />,
  },
  penanggungjawab: {
    dot: 'bg-violet-500',
    badgeCls: 'bg-violet-500/10 border-violet-400/30',
    textCls: 'text-violet-600 dark:text-violet-300',
    borderCls: 'border-violet-200 dark:border-violet-800/50',
    icon: <UserCheck className="w-3 h-3" />,
  },
  pelaksana: {
    dot: 'bg-emerald-500',
    badgeCls: 'bg-emerald-500/10 border-emerald-400/30',
    textCls: 'text-emerald-600 dark:text-emerald-300',
    borderCls: 'border-emerald-200 dark:border-emerald-800/50',
    icon: <Shield className="w-3 h-3" />,
  },
  petugas: {
    dot: 'bg-amber-500',
    badgeCls: 'bg-amber-500/10 border-amber-400/30',
    textCls: 'text-amber-600 dark:text-amber-300',
    borderCls: 'border-amber-200 dark:border-amber-800/50',
    icon: <Users className="w-3 h-3" />,
  },
};

// ─── Card ─────────────────────────────────────────────────────────────────────
const Card: React.FC<{ node: OrgNode }> = ({ node }) => {
  const c = CFG[node.level];
  return (
    <div className={`relative min-h-[160px] bg-white dark:bg-slate-900 border ${c.borderCls} rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200 w-full`}>
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${c.dot}`} />
      <div className="p-4 sm:p-5">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wide mb-2 ${c.badgeCls} ${c.textCls}`}>
          {c.icon}{node.badge}
        </span>
        <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{node.jabatan}</p>
        {node.nama && <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">{node.nama}</p>}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-3">{node.tugas}</p>
      </div>
    </div>
  );
};

// ─── Connector primitives ─────────────────────────────────────────────────────
const VLine = ({ h = 'h-4' }: { h?: string }) => (
  <div className={`w-px ${h} bg-slate-300 dark:bg-slate-700 mx-auto`} />
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const pembina1: OrgNode = { level: 'pembina', badge: 'Pembina Utama', jabatan: 'Kepala Desa Tugurejo', tugas: 'Mengawasi, membina, dan memberikan arahan strategis kegiatan Siskamling' };
const pembinaList: OrgNode[] = [
  { level: 'pembina', badge: 'Pembina 1', jabatan: 'Bhabinkamtibmas', tugas: 'Pembinaan kamtibmas, mengkoordinasikan kegiatan keamanan' },
  { level: 'pembina', badge: 'Pembina 2', jabatan: 'Babinsa', tugas: 'Pembinaan pertahanan sipil, mengkoordinasikan bela negara' },
  { level: 'pembina', badge: 'Pembina 3', jabatan: 'Sie. Trantib Desa', tugas: 'Mengkoordinasikan kegiatan trantibum dan keamanan' },
];
const pj: OrgNode = { level: 'penanggungjawab', badge: 'Penanggung Jawab', jabatan: 'Ketua RW / Kepala Dusun', tugas: 'Bertanggung jawab atas operasional wilayah, mengkoordinasikan warga' };
const pelaksanaList: OrgNode[] = [
  { level: 'pelaksana', badge: 'Pelaksana', jabatan: 'Sie. Keamanan', tugas: 'Mengelola administrasi keamanan, mendata dan melaporkan kejadian' },
  { level: 'pelaksana', badge: 'Ketua Poskamling', jabatan: 'Ketua Satlinmas / Danpok', tugas: 'Memimpin Siskamling, mengatur jadwal ronda, mengkoordinasikan petugas' },
];
const petugasList: OrgNode[] = [
  { level: 'petugas', badge: 'Petugas Siskamling', jabatan: 'Anggota Satlinmas', nama: 'Regu Dusun Krajan', tugas: 'Ronda keamanan, memantau lingkungan, melaporkan kejadian' },
  { level: 'petugas', badge: 'Petugas Siskamling', jabatan: 'Anggota Satlinmas', nama: 'Regu Dusun Tugu', tugas: 'Ronda keamanan, memantau lingkungan, melaporkan kejadian' },
];

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function StrukturSection() {
  const [showAlur, setShowAlur] = useState(false);

  return (
    <section id="struktur" className="scroll-mt-32">


      {/* Main card */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 shadow-xl">

        {/* Topbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Struktur Siskamling Desa Tugurejo</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Garis komando Satuan Keamanan Lingkungan — Kec. Slahung, Kab. Ponorogo</p>
            </div>
          </div>
          <Link2 className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        </div>

        {/* Legenda */}
        <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
          {([['pembina','Pembina'],['penanggungjawab','Penanggung Jawab'],['pelaksana','Pelaksana'],['petugas','Petugas']] as [Level, string][]).map(([lvl, lbl]) => (
            <span key={lvl} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${CFG[lvl].badgeCls} ${CFG[lvl].textCls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${CFG[lvl].dot}`} />{lbl}
            </span>
          ))}
        </div>

        {/* ══════════ ORG CHART — HORIZONTAL LAYOUT ══════════ */}
        <div className="p-5 sm:p-8 overflow-x-auto">
          <div className="relative min-w-[1000px] h-[1050px]">
            {/* Semua garis digambar dalam satu kanvas agar titik sambung selalu presisi. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 1000 1050"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <g fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-700">
                {/* Kepala Desa → tiga unsur pembina */}
                <path d="M500 160 V190 M180 190 H820 M180 190 V210 M500 190 V210 M820 190 V210" />
                {/* Jalur pembina → Ketua RW / Kepala Dusun, turun dari garis percabangan lewat celah Babinsa dan Sie. Trantib */}
                <path d="M660 190 V410 H500 V440" />
                {/* Penanggung jawab → pelaksana */}
                <path d="M500 600 V620 M330 620 H670 M330 620 V640 M670 620 V640" />
                {/* Ketua Poskamling / Danpok → anggota Siskamling */}
                <path d="M670 800 V830 M330 830 H670 M330 830 V860 M670 830 V860" />
              </g>
            </svg>

            {/* Tingkat 1 */}
            <div className="absolute top-0 left-1/2 w-[280px] -translate-x-1/2 min-h-[160px]">
              <Card node={pembina1} />
            </div>

            {/* Tiga unsur pembina */}
            {pembinaList.map((node, index) => (
              <div
                key={node.jabatan}
                className="absolute top-[210px] w-[260px] min-h-[165px]"
                style={{ left: `${[5, 37, 69][index]}%` }}
              >
                <Card node={node} />
              </div>
            ))}

            {/* Jalur komando operasional */}
            <div className="absolute top-[440px] left-1/2 w-[280px] -translate-x-1/2 min-h-[160px]">
              <Card node={pj} />
            </div>

            {pelaksanaList.map((node, index) => (
              <div
                key={node.jabatan}
                className="absolute top-[640px] w-[280px] min-h-[165px]"
                style={{ left: `${[19, 53][index]}%` }}
              >
                <Card node={node} />
              </div>
            ))}

            {petugasList.map((node, index) => (
              <div
                key={node.nama}
                className="absolute top-[860px] w-[280px] min-h-[165px]"
                style={{ left: `${[19, 53][index]}%` }}
              >
                <Card node={node} />
              </div>
            ))}
          </div>
        </div>

        {/* Alur Pelaporan (collapsible) */}
        <div className="mx-4 sm:mx-6 mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAlur(v => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Alur Pelaporan Kejadian</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showAlur ? 'rotate-180' : ''}`} />
          </button>
          {showAlur && (
            <div className="px-4 pb-4 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs">
              {[
                { label: 'Petugas', dot: 'bg-amber-500' },
                { label: 'Ketua Poskamling', dot: 'bg-emerald-500' },
                { label: 'Sie. Keamanan', dot: 'bg-emerald-500' },
                { label: 'Ketua RW', dot: 'bg-violet-500' },
                { label: 'Sie. Trantib', dot: 'bg-blue-500' },
                { label: 'Bhabinkamtibmas / Babinsa', dot: 'bg-blue-500' },
                { label: 'Kepala Desa', dot: 'bg-blue-500' },
              ].map((s, i, arr) => (
                <React.Fragment key={i}>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                  </span>
                  {i < arr.length - 1 && <span className="text-slate-400 font-bold">→</span>}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Mengacu pada Permendagri tentang Satlinmas dan pedoman operasional Satpol PP Kab. Ponorogo.
          </p>
        </div>
      </div>

    </section>
  );
}
