'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  Star,
  UserCheck,
  GitBranch,
  Link2,
  Search,
  User,
  Sparkles,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';

// ─── Types ───────────────────────────────────────────────────────────────────
type Level = 'pembina' | 'penanggungjawab' | 'pelaksana' | 'seksi' | 'anggota';

interface AnggotaItem {
  id: string;
  nama: string;
  nomor: number;
  unit: string;
  jabatan?: string;
  wa?: string;
  aktif?: boolean;
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
    dot: 'bg-emerald-500',
    badgeCls: 'bg-emerald-500/10 border-emerald-400/30',
    textCls: 'text-emerald-600 dark:text-emerald-300',
    borderCls: 'border-emerald-300 dark:border-emerald-700/60',
    icon: <Shield className="w-3 h-3" />,
  },
  pelaksana: {
    dot: 'bg-teal-500',
    badgeCls: 'bg-teal-500/10 border-teal-400/30',
    textCls: 'text-teal-600 dark:text-teal-300',
    borderCls: 'border-teal-200 dark:border-teal-800/50',
    icon: <UserCheck className="w-3 h-3" />,
  },
  seksi: {
    dot: 'bg-indigo-500',
    badgeCls: 'bg-indigo-500/10 border-indigo-400/30',
    textCls: 'text-indigo-600 dark:text-indigo-300',
    borderCls: 'border-indigo-200 dark:border-indigo-800/50',
    icon: <Sparkles className="w-3 h-3" />,
  },
  anggota: {
    dot: 'bg-amber-500',
    badgeCls: 'bg-amber-500/10 border-amber-400/30',
    textCls: 'text-amber-600 dark:text-amber-300',
    borderCls: 'border-amber-200 dark:border-amber-800/50',
    icon: <Users className="w-3 h-3" />,
  },
};

// ─── Card Besar & Jelas (Font Lebih Besar & Lebih Terbaca) ────────────────────
const Card: React.FC<{
  badge: string;
  jabatan: string;
  nama?: string;
  level: Level;
  isCenter?: boolean;
}> = ({ badge, jabatan, nama, level, isCenter }) => {
  const c = CFG[level] || CFG.pelaksana;
  return (
    <div
      className={`relative h-[96px] bg-white dark:bg-slate-900 border ${
        isCenter
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
          : `${c.borderCls} shadow-xs`
      } rounded-2xl hover:shadow-lg transition-all duration-150 w-full flex flex-col justify-center px-4 py-2.5`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${c.dot}`} />
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-wide ${c.badgeCls} ${c.textCls}`}
        >
          {c.icon}
          {badge}
        </span>
      </div>
      <p className="text-xs sm:text-[14px] font-black text-slate-900 dark:text-white leading-tight truncate">
        {jabatan}
      </p>
      {nama && (
        <p
          className={`text-xs sm:text-[12.5px] font-bold ${
            isCenter
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-600 dark:text-slate-300'
          } truncate mt-1`}
        >
          {nama}
        </p>
      )}
    </div>
  );
};

// ─── Mobile Tree Card ─────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { border: string; strip: string; badge: string; text: string; ring?: string }> = {
  blue:    { border: 'border-blue-200 dark:border-blue-800/50',    strip: 'bg-blue-500',    badge: 'bg-blue-500/10 border-blue-400/30 text-blue-600 dark:text-blue-300',    text: 'text-slate-600 dark:text-slate-300' },
  emerald: { border: 'border-emerald-300 dark:border-emerald-700/60', strip: 'bg-emerald-500', badge: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-600 dark:text-emerald-300', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-2 ring-emerald-500/25' },
  teal:    { border: 'border-teal-200 dark:border-teal-800/50',    strip: 'bg-teal-500',    badge: 'bg-teal-500/10 border-teal-400/30 text-teal-600 dark:text-teal-300',    text: 'text-slate-600 dark:text-slate-300' },
  indigo:  { border: 'border-indigo-200 dark:border-indigo-800/50', strip: 'bg-indigo-500', badge: 'bg-indigo-500/10 border-indigo-400/30 text-indigo-600 dark:text-indigo-300', text: 'text-slate-600 dark:text-slate-300' },
  amber:   { border: 'border-amber-200 dark:border-amber-800/50',   strip: 'bg-amber-500',  badge: 'bg-amber-500/10 border-amber-400/30 text-amber-600 dark:text-amber-300',  text: 'text-slate-600 dark:text-slate-300' },
};

const MobileOrgCard: React.FC<{
  color: keyof typeof COLOR_MAP;
  badge: string;
  jabatan: string;
  nama?: string;
  small?: boolean;
  isRoot?: boolean;
  isCenter?: boolean;
}> = ({ color, badge, jabatan, nama, small, isRoot, isCenter }) => {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border ${c.border} ${c.ring || ''} bg-white dark:bg-slate-900 overflow-hidden shadow-sm`}>
      <div className={`${isRoot || isCenter ? 'h-2' : 'h-1.5'} ${c.strip}`} />
      <div className={small ? 'p-2' : 'p-2.5'}>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${c.badge} ${small ? 'text-[8.5px]' : 'text-[9.5px]'} font-extrabold uppercase tracking-wide mb-1`}>
          {badge}
        </span>
        <p className={`${small ? 'text-[10px]' : 'text-[11px]'} font-black text-slate-900 dark:text-white leading-tight`}>{jabatan}</p>
        {nama && <p className={`${small ? 'text-[9px]' : 'text-[10px]'} font-bold ${c.text} truncate mt-0.5`}>{nama}</p>}
      </div>
    </div>
  );
};

// ─── Mobile Org Tree Node dengan Garis Struktur Presisi ─────────────────────
const MobileTreeNode: React.FC<{
  isFirst?: boolean;
  isLast?: boolean;
  dotColor?: string;
  badgeLabel?: string;
  badgeColor?: string;
  children: React.ReactNode;
}> = ({
  isFirst,
  isLast,
  dotColor = 'bg-emerald-500',
  badgeLabel,
  badgeColor = 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  children,
}) => {
  return (
    <div className="relative pl-6 pb-3.5 last:pb-1">
      {/* Garis vertikal kontinyu antar tingkat */}
      {!isLast && (
        <div
          className={`absolute left-[7px] w-[2px] bg-emerald-500/70 dark:bg-emerald-400/70 ${
            isFirst ? 'top-[18px]' : 'top-0'
          } -bottom-3.5 z-0`}
        />
      )}
      {isLast && (
        <div className="absolute left-[7px] top-0 h-[18px] w-[2px] bg-emerald-500/70 dark:bg-emerald-400/70 z-0" />
      )}

      {/* Titik Simpul (Junction Node) */}
      <div
        className={`absolute left-[3px] top-[14px] w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-white dark:ring-slate-900 shadow-xs z-10`}
      />

      {/* Garis Cabang Horizontal ke Kartu */}
      <div className="absolute left-[8px] top-[18px] w-4 h-[2px] bg-emerald-500/70 dark:bg-emerald-400/70 z-0" />

      {/* Konten Kartu */}
      <div className="w-full">
        {badgeLabel && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className={`text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeColor}`}
            >
              {badgeLabel}
            </span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

const DEFAULT_ANGGOTA_NAMES: string[] = [
  'NYADI', 'SETYAWAN', 'ANDI BASUKI', 'H. SUHARSONO', 'MISDIANTO',
  'SUKAMTO', 'SUNARYO', 'PURWANTO', 'WAHONO', 'RIYANTO',
  'SUPRAPTO', 'SUPENAN', 'SETYO LAWAN', 'SUKARDI', 'PUJIONO',
  'S. HERIYANTO', 'WINARNO', 'SUPRIYADI', 'SUHANDOYO', 'UNTUNG. S',
  'WISNU TRI. W', 'SUWITO', 'AGUS SUSANTO', 'TRI BAGUS. H', 'EKO WAHONO',
  'FAJAR PURNO', 'TRIYONO', 'PARNI', 'SUGIYANTO', 'KATIMIN',
  'TRIYONO', 'BASUKI', 'GESANG ARYA', 'SURIPTO', 'DWI SISMANTO',
  'WASONO', 'SISWANTO', 'DWI YUAN ELY', 'MAWAN ADI S', 'DIDIK KURNIAWAN',
  'PARDI', 'GUNTORO', 'SURITO', 'ALBERTH DWI', 'MUJIANTO',
  'PURWOTO', 'M. SABAR SUDNO', 'JOKO SUWITO', 'LAMIDJAN', 'JURI',
  'SUMADI', 'HARTANTO', 'NURDIANTO', 'ZAINUN RASYID', 'PURWO DINASTI',
];

export default function StrukturSection() {
  const [searchAnggota, setSearchAnggota] = useState('');

  // Nama Pengurus dari Firestore (default fallback)
  const [namaKades, setNamaKades] = useState('Heru Setiawan, S.Sos');
  const [namaBhabinkamtibmas, setNamaBhabinkamtibmas] = useState('Polsek Slahung');
  const [namaBabinsa, setNamaBabinsa] = useState('Koramil Slahung');
  const [namaTrantib, setNamaTrantib] = useState('Kasi Trantibum');
  const [namaKetua, setNamaKetua] = useState('Agus Widodo');
  const [namaSekretaris, setNamaSekretaris] = useState('Paryanto');
  const [namaBendahara, setNamaBendahara] = useState('Joko Susilo');
  const [namaKonsumsi, setNamaKonsumsi] = useState('Puji Rahayu');
  const [namaPerlengkapan, setNamaPerlengkapan] = useState('Haryono');
  const [namaHumas, setNamaHumas] = useState('Parsono');

  const [anggotaList, setAnggotaList] = useState<AnggotaItem[]>(() =>
    DEFAULT_ANGGOTA_NAMES.map((nama, idx) => ({
      id: `default_${idx + 1}`,
      nama,
      nomor: idx + 1,
      unit: 'Anggota Poskamling',
      jabatan: 'Anggota',
      aktif: true,
    }))
  );

  // 1. Sync real-time dari Firestore doc 'settings/struktur_poskamling'
  useEffect(() => {
    if (!db) return;

    try {
      const unsubStruktur = onSnapshot(
        doc(db, 'settings', 'struktur_poskamling'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.kades) setNamaKades(data.kades);
            if (data.bhabinkamtibmas) setNamaBhabinkamtibmas(data.bhabinkamtibmas);
            if (data.babinsa) setNamaBabinsa(data.babinsa);
            if (data.trantib) setNamaTrantib(data.trantib);
            if (data.ketua) setNamaKetua(data.ketua);
            if (data.sekretaris) setNamaSekretaris(data.sekretaris);
            if (data.bendahara) setNamaBendahara(data.bendahara);
            if (data.konsumsi) setNamaKonsumsi(data.konsumsi);
            if (data.perlengkapan) setNamaPerlengkapan(data.perlengkapan);
            if (data.humas) setNamaHumas(data.humas);
          }
        },
        (err) => {
          console.warn('[StrukturSection] Error onSnapshot settings/struktur_poskamling:', err);
        }
      );

      return () => unsubStruktur();
    } catch (err) {
      console.warn('[StrukturSection] Catch error settings listener:', err);
    }
  }, []);

  // 2. Sync real-time dari Firestore collection 'anggotaPoskamling' untuk personil anggota
  useEffect(() => {
    if (!db) return;

    try {
      const colRef = collection(db, 'anggotaPoskamling');
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const rawAnggota: AnggotaItem[] = [];

            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              const id = docSnap.id;
              const nama = (data.nama || '').trim();
              const kategori = (data.kategori || '').trim();
              const urutan = data.urutan || 999;

              // Hanya tampilkan yang berkategori Anggota (bukan pengurus)
              const isAnggota =
                !kategori ||
                kategori.toLowerCase() === 'anggota';

              if (isAnggota) {
                rawAnggota.push({
                  id,
                  nama,
                  nomor: data.nomorAnggota || urutan || rawAnggota.length + 1,
                  unit: 'Anggota Poskamling',
                  jabatan: 'Anggota',
                  wa: data.wa || '',
                  aktif: data.aktif !== false,
                });
              }
            });

            // Sorting anggota
            if (rawAnggota.length > 0) {
              rawAnggota.sort((a, b) => a.nomor - b.nomor);
              setAnggotaList(rawAnggota);
            }
          }
        },
        (err) => {
          console.warn('[StrukturSection] Error onSnapshot anggotaPoskamling:', err);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('[StrukturSection] Catch error listener:', err);
    }
  }, []);

  // Filter anggota berdasarkan input pencarian
  const filteredAnggota = useMemo(() => {
    if (!searchAnggota.trim()) return anggotaList;
    const q = searchAnggota.toLowerCase().trim();
    return anggotaList.filter((a) => a.nama.toLowerCase().includes(q));
  }, [anggotaList, searchAnggota]);

  return (
    <section id="struktur" className="scroll-mt-32">
      {/* Main Container Card */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 shadow-xl">
        {/* Topbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Struktur Siskamling Desa Tugurejo
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Garis komando Satuan Keamanan Lingkungan — Kec. Slahung, Kab. Ponorogo
              </p>
            </div>
          </div>
          <Link2 className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        </div>

        {/* ══════════ MOBILE: ORG TREE DENGAN GARIS PENGHUBUNG PRESISI ══════════ */}
        <div className="block md:hidden p-4 pb-3">
          {/* Tingkat 1: Kepala Desa */}
          <MobileTreeNode isFirst dotColor="bg-blue-500">
            <MobileOrgCard
              color="blue"
              badge="Pembina Utama"
              jabatan="Kepala Desa Tugurejo"
              nama={namaKades}
              isRoot
            />
          </MobileTreeNode>

          {/* Tingkat 2: 3 Unsur Pembina */}
          <MobileTreeNode
            dotColor="bg-blue-500"
            badgeLabel="3 Unsur Pembina Desa"
            badgeColor="text-blue-600 dark:text-blue-300 bg-blue-500/10 border-blue-400/30"
          >
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { badge: 'P-1', jabatan: 'Bhabinkamtibmas', nama: namaBhabinkamtibmas },
                { badge: 'P-2', jabatan: 'Babinsa', nama: namaBabinsa },
                { badge: 'P-3', jabatan: 'Sie. Trantib', nama: namaTrantib },
              ].map(({ badge, jabatan, nama }) => (
                <MobileOrgCard
                  key={badge}
                  color="blue"
                  badge={badge}
                  jabatan={jabatan}
                  nama={nama}
                  small
                />
              ))}
            </div>
          </MobileTreeNode>

          {/* Tingkat 3: Ketua Poskamling */}
          <MobileTreeNode dotColor="bg-emerald-500">
            <MobileOrgCard
              color="emerald"
              badge="Penanggung Jawab"
              jabatan="Ketua Poskamling"
              nama={namaKetua}
              isCenter
            />
          </MobileTreeNode>

          {/* Tingkat 4: Sekretariat & Keuangan */}
          <MobileTreeNode
            dotColor="bg-teal-500"
            badgeLabel="Sekretariat & Keuangan"
            badgeColor="text-teal-600 dark:text-teal-300 bg-teal-500/10 border-teal-400/30"
          >
            <div className="grid grid-cols-2 gap-1.5">
              <MobileOrgCard
                color="teal"
                badge="Sekretariat"
                jabatan="Sekretaris"
                nama={namaSekretaris}
                small
              />
              <MobileOrgCard
                color="teal"
                badge="Keuangan"
                jabatan="Bendahara"
                nama={namaBendahara}
                small
              />
            </div>
          </MobileTreeNode>

          {/* Tingkat 5: Seksi-Seksi */}
          <MobileTreeNode
            dotColor="bg-indigo-500"
            badgeLabel="Seksi Operasional"
            badgeColor="text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 border-indigo-400/30"
          >
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { jabatan: 'Konsumsi', nama: namaKonsumsi },
                { jabatan: 'Perlengkpn', nama: namaPerlengkapan },
                { jabatan: 'Humas', nama: namaHumas },
              ].map(({ jabatan, nama }) => (
                <MobileOrgCard
                  key={jabatan}
                  color="indigo"
                  badge="Seksi"
                  jabatan={jabatan}
                  nama={nama}
                  small
                />
              ))}
            </div>
          </MobileTreeNode>

          {/* Tingkat 6: Anggota Poskamling */}
          <MobileTreeNode isLast dotColor="bg-amber-500">
            <MobileOrgCard
              color="amber"
              badge="Pelaksana"
              jabatan="Anggota Poskamling"
              nama={`${anggotaList.length} Personel Aktif`}
            />
          </MobileTreeNode>
        </div>

        {/* ══════════ BAGAN STRUKTUR KOMANDO (KOTAK & FONT LEBIH BESAR, RAPI & PROPORSIONAL) ══════════ */}
        <div className="hidden md:flex p-4 sm:p-8 overflow-x-auto justify-center">
          <div className="relative w-[880px] shrink-0 h-[780px]">
            {/* SVG Kanvas Presisi: Garis tebal, tegak lurus, dan tidak ada yang saling tabrak */}
            <svg
              aria-hidden="true"
              viewBox="0 0 880 780"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full pointer-events-none"
            >
              <g
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-500/80 dark:text-emerald-400/80"
              >
                {/* 1. Dari Kepala Desa turun ke horizontal pembina */}
                <path d="M440 114 V136" />
                {/* Horizontal Pembina */}
                <path d="M108 136 H740" />
                {/* Drop ke masing-masing Pembina */}
                <path d="M108 136 V158" />
                <path d="M302 136 V158" />
                <path d="M740 136 V158" />

                {/* 2. Garis langsung lurus dari Kepala Desa ke Ketua */}
                <path d="M440 136 V275" />

                {/* 3. Dari Ketua turun ke horizontal pengurus & seksi */}
                <path d="M440 369 V394" />
                {/* Horizontal Pengurus & Seksi */}
                <path d="M140 394 H740" />

                {/* 4. Cabang Kiri: Menghubungkan Sekretaris & Bendahara */}
                <path d="M140 394 V416" />
                <path d="M140 510 V532" />

                {/* 5. Cabang Kanan: Menghubungkan Seksi Konsumsi, Perlengkapan, dan Humas */}
                <path d="M740 394 V416" />
                <path d="M740 510 V532" />
                <path d="M740 626 V648" />

                {/* 6. Garis langsung lurus dari horizontal atas Ketua ke 1 Anggota Pusat */}
                <path d="M440 394 V648" />

                {/* 7. Dari Anggota turun mengarah ke daftar 55 personil di bawah */}
                <path d="M440 742 V775" />
              </g>

              {/* Titik Junction Node untuk estetika diagram teknik */}
              <g className="fill-emerald-500 dark:fill-emerald-400">
                <circle cx="440" cy="136" r="3.5" />
                <circle cx="108" cy="136" r="3" />
                <circle cx="302" cy="136" r="3" />
                <circle cx="740" cy="136" r="3" />
                <circle cx="440" cy="275" r="3.5" />
                <circle cx="440" cy="394" r="3.5" />
                <circle cx="140" cy="394" r="3" />
                <circle cx="740" cy="394" r="3" />
                <circle cx="440" cy="648" r="3.5" />
                <circle cx="440" cy="775" r="3.5" />
              </g>
            </svg>

            {/* ── TINGKAT 1: KEPALA DESA (Pembina Utama) ── */}
            <div className="absolute top-[20px] left-[300px] w-[280px]">
              <Card
                badge="Pembina Utama"
                jabatan="Kepala Desa Tugurejo"
                nama={namaKades}
                level="pembina"
                isCenter={true}
              />
            </div>

            {/* ── TIGA UNSUR PEMBINA ── */}
            {/* Bhabinkamtibmas */}
            <div className="absolute top-[158px] left-[20px] w-[175px]">
              <Card
                badge="Pembina 1"
                jabatan="Bhabinkamtibmas"
                nama={namaBhabinkamtibmas}
                level="pembina"
              />
            </div>

            {/* Babinsa */}
            <div className="absolute top-[158px] left-[215px] w-[175px]">
              <Card
                badge="Pembina 2"
                jabatan="Babinsa"
                nama={namaBabinsa}
                level="pembina"
              />
            </div>

            {/* Sie Trantib Desa */}
            <div className="absolute top-[158px] left-[630px] w-[220px]">
              <Card
                badge="Pembina 3"
                jabatan="Sie. Trantib Desa"
                nama={namaTrantib}
                level="pembina"
              />
            </div>

            {/* ── TINGKAT 2: KETUA (Agus Widodo) Langsung Lurus dari Kepala Desa ── */}
            <div className="absolute top-[275px] left-[300px] w-[280px]">
              <Card
                badge="Penanggung Jawab"
                jabatan="Ketua Poskamling"
                nama={namaKetua}
                level="penanggungjawab"
                isCenter={true}
              />
            </div>

            {/* ── TINGKAT 3 (KIRI): STAF ADMINISTRASI & KEUANGAN ── */}
            {/* Sekretaris */}
            <div className="absolute top-[416px] left-[30px] w-[220px]">
              <Card
                badge="Sekretariat"
                jabatan="Sekretaris"
                nama={namaSekretaris}
                level="pelaksana"
              />
            </div>

            {/* Bendahara */}
            <div className="absolute top-[532px] left-[30px] w-[220px]">
              <Card
                badge="Keuangan"
                jabatan="Bendahara"
                nama={namaBendahara}
                level="pelaksana"
              />
            </div>

            {/* ── TINGKAT 3 (KANAN): SEKSI ── */}
            {/* Seksi Konsumsi */}
            <div className="absolute top-[416px] left-[630px] w-[220px]">
              <Card
                badge="Seksi"
                jabatan="Seksi Konsumsi"
                nama={namaKonsumsi}
                level="seksi"
              />
            </div>

            {/* Seksi Perlengkapan */}
            <div className="absolute top-[532px] left-[630px] w-[220px]">
              <Card
                badge="Seksi"
                jabatan="Seksi Perlengkapan"
                nama={namaPerlengkapan}
                level="seksi"
              />
            </div>

            {/* Seksi Humas */}
            <div className="absolute top-[648px] left-[630px] w-[220px]">
              <Card
                badge="Seksi"
                jabatan="Seksi Humas"
                nama={namaHumas}
                level="seksi"
              />
            </div>

            {/* ── TINGKAT 4 (TENGAH): ANGGOTA (Langsung dari Horizontal Atas Ketua) ── */}
            <div className="absolute top-[648px] left-[290px] w-[300px]">
              <Card
                badge="Pelaksana Lapangan"
                jabatan="Anggota Poskamling"
                nama={`${anggotaList.length} Personel Terdaftar (Aktif)`}
                level="anggota"
                isCenter={true}
              />
            </div>
          </div>
        </div>

        {/* ══════════ BAGIAN BAWAH: DAFTAR 55 ANGGOTA LENGKAP ══════════ */}
        <div className="p-5 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Daftar Anggota Poskamling
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personel pelaksana ronda malam warga di bawah koordinasi Ketua Poskamling Desa Tugurejo
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
                Total: {anggotaList.length} Anggota Terdaftar
              </span>

              {/* Input Pencarian Anggota */}
              <div className="relative w-full md:min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchAnggota}
                  onChange={(e) => setSearchAnggota(e.target.value)}
                  placeholder="Cari nama anggota..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchAnggota && (
                  <button
                    type="button"
                    onClick={() => setSearchAnggota('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Daftar Anggota: Tabel di Mobile, Grid di Desktop */}
          {filteredAnggota.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <User className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Tidak ada anggota dengan nama &quot;{searchAnggota}&quot;
              </p>
              <button
                type="button"
                onClick={() => setSearchAnggota('')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            <>
              {/* TAMPILAN MOBILE: Tabel ke bawah sederhana (No & Nama) */}
              <div className="block md:hidden overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <th className="py-2.5 px-3.5 w-14 text-center">No</th>
                      <th className="py-2.5 px-3.5">Nama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                    {filteredAnggota.map((m, idx) => (
                      <tr
                        key={m.id}
                        className="even:bg-slate-50/60 dark:even:bg-slate-800/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                      >
                        <td className="py-2.5 px-3.5 text-center font-mono font-bold text-xs text-slate-500 dark:text-slate-400">
                          {m.nomor || idx + 1}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white">
                          {m.nama}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TAMPILAN DESKTOP: Grid Kartu Anggota */}
              <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {filteredAnggota.map((m) => {
                  const initial = (m.nama || '?').charAt(0).toUpperCase();
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-sm transition-all duration-150"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {m.nama}
                          </p>
                          <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                            #{m.nomor}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {m.unit}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                            ● Aktif
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Mengacu pada Permendagri tentang Siskamling dan pedoman operasional keamanan lingkungan Kab. Ponorogo.
          </p>
        </div>
      </div>
    </section>
  );
}
