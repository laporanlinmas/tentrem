'use client';

import React, { useState } from 'react';
import {
  UserCheck, Shield, Users, CheckCircle2,
  ChevronRight, Home, GitBranch,
  ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Data (sama dengan StrukturPage, di-share agar konsisten) ────────────────

interface OrgMember {
  role: string;
  badge: string;
  name: string;
  institution: string;
  tugas: string[];
  level: 'pembina' | 'penanggungjawab' | 'pelaksana' | 'regu';
}

const PEMBINA_MEMBERS: OrgMember[] = [
  {
    role: 'Pembina Utama Satlinmas',
    badge: 'Kepala Desa',
    name: 'Pemerintah Desa Tugurejo',
    institution: 'Pemerintah Desa Tugurejo, Kec. Slahung',
    tugas: [
      'Menetapkan kebijakan keamanan dan ketertiban desa',
      'Membina dan memfasilitasi sarana operasional Siskamling',
      'Mengkoordinasikan penanganan kondisi darurat tingkat desa',
    ],
    level: 'pembina',
  },
  {
    role: 'Pembina Kamtibmas Lingkungan',
    badge: 'Bhabinkamtibmas',
    name: 'Bhabinkamtibmas Polsek Slahung',
    institution: 'Kepolisian Sektor Slahung — Polres Ponorogo',
    tugas: [
      'Membimbing teknis pengamanan swakarsa dan patroli lingkungan',
      'Menerima eskalasi laporan tindak pidana atau gangguan ketertiban',
      'Mediasi dan penyelesaian masalah hukum ringan antar warga',
    ],
    level: 'pembina',
  },
  {
    role: 'Pembina Ketahanan & Bela Negara',
    badge: 'Babinsa',
    name: 'Babinsa Koramil 0802/10 Slahung',
    institution: 'Koramil 0802/10 Slahung — Kodim 0802 Ponorogo',
    tugas: [
      'Membina kesiapsiagaan bela negara dan mitigasi bencana desa',
      'Mendampingi pengamanan wilayah dan situasi rawan konflik',
      'Memperkuat koordinasi pertahanan sipil di pos-pos keamanan',
    ],
    level: 'pembina',
  },
  {
    role: 'Koordinator Trantibum Desa',
    badge: 'Sie. Trantib',
    name: 'Kasi Ketenteraman & Ketertiban',
    institution: 'Pemerintah Desa Tugurejo',
    tugas: [
      'Mengkoordinasikan administrasi dan operasional harian Satlinmas',
      'Menyusun jadwal apel kesiapsiagaan dan pembinaan pos kamling',
      'Memonitor laporan kejadian warga via sistem TENTREM',
    ],
    level: 'pembina',
  },
];

const PENANGGUNG_JAWAB: OrgMember[] = [
  {
    role: 'Penanggung Jawab / Ketua Poskamling',
    badge: 'Penanggung Jawab',
    name: 'Agus Widodo',
    institution: 'Pusat Komando Siskamling Desa Tugurejo',
    tugas: [
      'Memimpin operasional Siskamling dan mengkoordinasikan pengamanan swakarsa warga',
      'Mengatur rotasi regu jaga ronda malam dan kesiapsiagaan pos kamling',
      'Bertanggung jawab penuh atas ketertiban lingkungan dan pelaporan berkala ke Kades & Babinsa/Bhabinkamtibmas',
    ],
    level: 'penanggungjawab',
  },
];

const PELAKSANA_HARIAN: OrgMember[] = [
  {
    role: 'Sekretaris Poskamling',
    badge: 'Sekretariat',
    name: 'Paryanto',
    institution: 'Administrasi & Pembukuan Pos Ronda',
    tugas: [
      'Mengelola administrasi poskamling, buku mutasi jaga, absensi, dan arsip kejadian',
      'Mendokumentasikan laporan ronda harian ke dalam sistem TENTREM',
      'Menyusun jadwal piket berkala dan surat pemberitahuan warga',
    ],
    level: 'pelaksana',
  },
  {
    role: 'Bendahara Poskamling',
    badge: 'Keuangan',
    name: 'Joko Susilo',
    institution: 'Pengelolaan Kas & Logistik Swadaya',
    tugas: [
      'Mengelola kas operasional pos ronda dan dana jimpitan/swadaya warga',
      'Mengalokasikan anggaran logistik jaga malam dan kebutuhan operasional',
      'Menyusun laporan keuangan transparan untuk warga dan pengurus',
    ],
    level: 'pelaksana',
  },
  {
    role: 'Seksi Konsumsi',
    badge: 'Sie Konsumsi',
    name: 'Puji Rahayu',
    institution: 'Logistik Konsumsi Ronda Malam',
    tugas: [
      'Menyiapkan dan mengkoordinasikan konsumsi bagi petugas jaga ronda malam',
      'Mengelola perbekalan logistik dan dapur siaga saat ada kegiatan khusus warga',
      'Memastikan ketersediaan logistik pos kamling secara berkelanjutan',
    ],
    level: 'pelaksana',
  },
  {
    role: 'Seksi Perlengkapan',
    badge: 'Sie Perlengkapan',
    name: 'Haryono',
    institution: 'Sarana Prasarana Siskamling',
    tugas: [
      'Memelihara sarana prasarana pos (kentongan, senter, kotak P3K, rompi linmas, lonceng)',
      'Memeriksa kesiapan peralatan darurat, pemadam api portabel, dan senter cas',
      'Menginventarisasi aset perlengkapan pos ronda secara berkala',
    ],
    level: 'pelaksana',
  },
  {
    role: 'Seksi Hubungan Masyarakat (Humas)',
    badge: 'Sie Humas',
    name: 'Parsono',
    institution: 'Komunikasi Publik & Koordinasi Warga',
    tugas: [
      'Mensosialisasikan informasi kamtibmas dan jadwal ronda ke seluruh warga',
      'Menjadi jembatan aspirasi warga terkait ketertiban dan keamanan lingkungan',
      'Mengkoordinasikan informasi tanggap darurat antar RT, RW, dan Pos Induk',
    ],
    level: 'pelaksana',
  },
];

const REGU_RONDA = [
  {
    nama: 'Regu 1 — Dusun Krajan',
    cakupan: 'Pemukiman Krajan, Balai Desa, dan Jalur Poros Desa',
    tugas: 'Patroli tiap 2 jam, pengawasan titik rawan, dan pemantauan lampu jalan',
    status: 'Aktif Bergilir',
  },
  {
    nama: 'Regu 2 — Dusun Tugu',
    cakupan: 'Lingkungan Dusun Tugu, Area Pertanian, dan Perbatasan Desa',
    tugas: 'Patroli pemukiman barat, pengawasan keamanan ternak dan lahan',
    status: 'Aktif Bergilir',
  },
  {
    nama: 'Regu Siaga — Tanggap Cepat TENTREM',
    cakupan: 'Seluruh Wilayah Desa Tugurejo',
    tugas: 'Merespon aduan cepat warga via portal TENTREM dan WhatsApp darurat',
    status: 'Standby 24 Jam',
  },
];

const TUPOKSI_5 = [
  {
    no: 1,
    color: 'emerald',
    title: 'Membantu Penanggulangan Bencana',
    desc: 'Pencegahan, evakuasi warga, dan pemulihan sarana saat terjadi banjir, longsor, atau angin kencang.',
  },
  {
    no: 2,
    color: 'blue',
    title: 'Membantu Keamanan & Ketertiban',
    desc: 'Menjaga kondisi kondusif melalui ronda malam, pengawasan tamu asing, dan pencegahan tindak kriminal.',
  },
  {
    no: 3,
    color: 'purple',
    title: 'Membantu Kegiatan Sosial Kemasyarakatan',
    desc: 'Pengamanan dan pengaturan lalu lintas saat hajatan, keagamaan, hari besar nasional, dan kerja bakti.',
  },
  {
    no: 4,
    color: 'amber',
    title: 'Membantu Penyelenggaraan Pemilu / Pilkades',
    desc: 'Menjaga ketertiban TPS, mengawal distribusi logistik suara, dan memastikan pemilihan berjalan aman.',
  },
  {
    no: 5,
    color: 'teal',
    title: 'Membantu Upaya Pertahanan Negara',
    desc: 'Komponen cadangan perlawanan wilayah di bawah pembinaan Babinsa dalam menjaga keutuhan NKRI.',
  },
];

// ─── Colour config per level — satu warna saja (emerald brand) ──────────────
const LEVEL_CONFIG = {
  pembina:         { check: 'text-emerald-500', label: 'Tugas Utama' },
  penanggungjawab: { check: 'text-emerald-500', label: 'Tanggung Jawab' },
  pelaksana:       { check: 'text-emerald-500', label: 'Tugas Operasional' },
  regu:            { check: 'text-emerald-500', label: 'Tugas Regu' },
};

// ─── Collapsible section ─────────────────────────────────────────────────────
function CollapsibleSection({ id, title, subtitle, children }: {
  id: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section id={id} className="space-y-4 scroll-mt-28">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 text-left"
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && <div>{children}</div>}
    </section>
  );
}

// ─── Member card ─────────────────────────────────────────────────────────────
function MemberCard({ m, cfg }: { m: OrgMember; cfg: typeof LEVEL_CONFIG['pembina'] }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-[3px] border-l-emerald-500 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{m.badge}</span>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">{m.role}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.institution}</p>
      </div>
      <ul className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
        {m.tugas.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export default function TupoksiDetailPage({ onBack, onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-10">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <button type="button" onClick={onBack} className="hover:text-emerald-600 font-semibold flex items-center gap-1 cursor-pointer">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <ChevronRight className="w-3 h-3" />
          <button type="button" onClick={() => onNavigate?.('struktur')} className="hover:text-emerald-600 font-semibold flex items-center gap-1 cursor-pointer">
            Struktur Organisasi
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 dark:text-white font-bold">Rincian Tugas</span>
        </nav>

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Rincian Tugas Siskamling</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Berdasarkan Permendagri No. 26 Tahun 2020 · 4 Tingkat Komando · 5 Tugas Pokok</p>
        </div>

        {/* TINGKAT 1 */}
        <CollapsibleSection id="tingkat-1" title="Pembina & Pengarah Kebijakan" subtitle="Kepala Desa, Bhabinkamtibmas, Babinsa, dan Kasi Trantib">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PEMBINA_MEMBERS.map((m, i) => <MemberCard key={i} m={m} cfg={LEVEL_CONFIG.pembina} />)}
          </div>
        </CollapsibleSection>

        {/* TINGKAT 2 */}
        <CollapsibleSection id="tingkat-2" title="Penanggung Jawab Siskamling" subtitle="Ketua Poskamling sebagai penanggung jawab utama operasional keamanan lingkungan">
          <div className="max-w-xl mx-auto">
            {PENANGGUNG_JAWAB.map((m, i) => <MemberCard key={i} m={m} cfg={LEVEL_CONFIG.penanggungjawab} />)}
          </div>
        </CollapsibleSection>

        {/* TINGKAT 3 */}
        <CollapsibleSection id="tingkat-3" title="Pengurus Pelaksana Poskamling" subtitle="Ketua, Sekretaris, Bendahara, dan Seksi Operasional Siskamling">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PELAKSANA_HARIAN.map((m, i) => <MemberCard key={i} m={m} cfg={LEVEL_CONFIG.pelaksana} />)}
          </div>
        </CollapsibleSection>

        {/* TINGKAT 4 */}
        <CollapsibleSection id="tingkat-4" title="Anggota Satlinmas & Regu Ronda Bergilir" subtitle="55 Personel Anggota Satlinmas Desa Tugurejo aktif bertugas di wilayah dusun">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {REGU_RONDA.map((r, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-[3px] border-l-emerald-500 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 ${r.status === 'Standby 24 Jam' ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{r.status}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{r.nama}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{r.cakupan}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">{r.tugas}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* 5 TUPOKSI */}
        <section id="tupoksi-5" className="space-y-4 scroll-mt-28">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">5 Tugas Pokok Satlinmas</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permendagri No. 26 Tahun 2020</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TUPOKSI_5.map((t) => (
              <div key={t.no} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-[3px] border-l-emerald-500 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex gap-4">
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black text-sm shrink-0">{t.no}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Catatan */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-[3px] border-l-amber-400">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tanggap Cepat</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Dalam situasi darurat, petugas jaga dapat langsung menghubungi Polsek, Koramil, Damkar, atau BPBD secara simultan tanpa menunggu proses administrasi.
          </p>
        </div>

      </main>
    </div>
  );
}
