'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PhoneCall,
  ShieldCheck,
  Search,
  Phone,
  Clock,
  User,
  Shield,
  HeartPulse,
  Flame,
  CloudLightning,
  Zap,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { WhatsAppIcon } from './BrandIcons';

export interface KontakPiket {
  aktif: boolean;
  judul: string;
  namaPetugas: string;
  noHp: string;
  noWa: string;
  jamOperasional: string;
  keterangan: string;
  pesanWaTemplate: string;
}

export interface KontakDaruratItem {
  id: string;
  nama: string;
  kategori?: string;
  jabatan?: string;
  noHp: string;
  noWa?: string;
  keterangan?: string;
  prioritas: number;
  aktif: boolean;
}

export const DEFAULT_PIKET_WEBSITE: KontakPiket = {
  aktif: true,
  judul: 'Posko Siaga Satlinmas Desa Tugurejo',
  namaPetugas: 'Regu Piket Linmas Tugurejo',
  noHp: '082313823791',
  noWa: '082313823791',
  jamOperasional: '24 Jam Nonstop',
  keterangan: 'Siaga cepat respon darurat kamtibmas, medis awal, dan tanggap bencana di wilayah warga.',
  pesanWaTemplate: 'Halo Petugas Piket Linmas Desa Tugurejo, saya warga butuh bantuan darurat di lokasi: ',
};

export const DEFAULT_KONTAK_LIST_WEBSITE: KontakDaruratItem[] = [
  {
    id: 'kontak_kantor_desa',
    nama: 'Kantor Desa Tugurejo',
    noHp: '082298110101',
    noWa: '082298110101',
    prioritas: 1,
    aktif: true,
  },
  {
    id: 'kontak_bhabinkamtibmas',
    nama: 'Babinkamtibmas',
    noHp: '082332805352',
    noWa: '082332805352',
    prioritas: 2,
    aktif: true,
  },
  {
    id: 'kontak_babinsa',
    nama: 'Babinsa',
    noHp: '081330501888',
    noWa: '081330501888',
    prioritas: 3,
    aktif: true,
  },
  {
    id: 'kontak_damkar',
    nama: 'Pemadam Kebakaran',
    noHp: '082160063113',
    noWa: '082160063113',
    prioritas: 4,
    aktif: true,
  },
  {
    id: 'kontak_psc',
    nama: 'Call Center PSC',
    noHp: '119',
    noWa: '',
    prioritas: 5,
    aktif: true,
  },
  {
    id: 'kontak_bpbd',
    nama: 'Pusdalops BPBD',
    noHp: '081259752500',
    noWa: '081259752500',
    prioritas: 6,
    aktif: true,
  },
  {
    id: 'kontak_ketua_rt',
    nama: 'Ketua RT 01 RW 01',
    noHp: '082228362232',
    noWa: '082228362232',
    prioritas: 7,
    aktif: true,
  },
];

interface KontakDaruratSectionProps {
  title?: string;
  description?: string;
  showPiketBanner?: boolean;
  className?: string;
}

export default function KontakDaruratSection({
  title = 'Kontak Petugas Poskamling',
  description = 'Jika lingkungan sekitar menghadapi kondisi mendesak yang butuh penanganan instan, hubungi langsung petugas poskamling atau instansi terkait di bawah ini.',
  showPiketBanner = true,
  className = '',
}: KontakDaruratSectionProps) {
  const [piketConfig, setPiketConfig] = useState<KontakPiket>(DEFAULT_PIKET_WEBSITE);
  const [kontakDaruratList, setKontakDaruratList] = useState<KontakDaruratItem[]>(DEFAULT_KONTAK_LIST_WEBSITE);
  const [kontakSearchQuery, setKontakSearchQuery] = useState<string>('');

  // Sync Real-time with Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'kontak_darurat'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.piket) {
          setPiketConfig({
            aktif: data.piket.aktif !== false,
            judul: data.piket.judul || 'Posko Siaga Linmas',
            namaPetugas: data.piket.namaPetugas || 'Regu Linmas',
            noHp: data.piket.noHp || '',
            noWa: data.piket.noWa || '',
            jamOperasional: data.piket.jamOperasional || '24 Jam Nonstop',
            keterangan: data.piket.keterangan || '',
            pesanWaTemplate: data.piket.pesanWaTemplate || 'Halo Petugas Piket Linmas, saya warga membutuhkan bantuan darurat di lokasi: ',
          });
        }
        if (Array.isArray(data.kontakList) && data.kontakList.length > 0) {
          setKontakDaruratList(data.kontakList);
        }
      }
    }, () => {});
    return () => unsub();
  }, []);

  const filteredKontakDarurat = useMemo(() => {
    return kontakDaruratList
      .filter((k) => k.aktif !== false)
      .filter((k) => {
        const q = kontakSearchQuery.toLowerCase().trim();
        return q === '' ||
          (k.nama && k.nama.toLowerCase().includes(q)) ||
          (k.noHp && k.noHp.toLowerCase().includes(q)) ||
          (k.noWa && k.noWa.toLowerCase().includes(q));
      })
      .sort((a, b) => (a.prioritas || 99) - (b.prioritas || 99));
  }, [kontakDaruratList, kontakSearchQuery]);

  return (
    <section className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-red-500 shrink-0" />
          <span>{title}</span>
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* ── BANNER UTAMA: HUBUNGI PIKET (JIKA DIAKTIFKAN DI ADMIN) ── */}
      {showPiketBanner && piketConfig.aktif && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-700 to-red-900 text-white p-6 sm:p-8 shadow-xl shadow-red-500/20 border border-red-400/30">
          {/* Background ambient pattern */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-black/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-lg">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  HOTLINE SIAGA
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/25 text-xs font-semibold text-rose-100">
                  <Clock className="w-3 h-3" /> {piketConfig.jamOperasional || '24 Jam'}
                </span>
              </div>

              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {piketConfig.judul || 'Posko Satlinmas'}
              </h4>

              <p className="text-xs sm:text-sm text-rose-100 leading-relaxed">
                {piketConfig.keterangan || 'Petugas poskamling siaga merespon situasi darurat, keamanan, dan ketertiban warga.'}
              </p>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white">
                <User className="w-3.5 h-3.5 text-rose-200" />
                <span>Petugas: <strong className="text-white">{piketConfig.namaPetugas || 'Regu Linmas'}</strong></span>
              </div>
            </div>

            {/* Call to action buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[200px]">
              {piketConfig.noHp && (
                <a
                  href={`tel:${piketConfig.noHp}`}
                  className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-white text-red-700 hover:bg-rose-50 text-sm font-black shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <PhoneCall className="w-4 h-4 text-red-600 animate-bounce" />
                  <span>Panggil Telepon</span>
                </a>
              )}

              {piketConfig.noWa && (
                <a
                  href={`https://wa.me/${piketConfig.noWa.replace(/\D/g, '')}?text=${encodeURIComponent(piketConfig.pesanWaTemplate || 'Halo Petugas Piket, saya butuh bantuan di: ')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <WhatsAppIcon size={18} />
                  <span>Hubungi WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DIREKTORI KONTAK DARURAT LAINNYA ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              Direktori Instansi &amp; Layanan Publik
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daftar nomor kontak instansi resmi yang dapat dihubungi
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari instansi, no darurat..."
              value={kontakSearchQuery}
              onChange={(e) => setKontakSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Contacts Grid */}
        {filteredKontakDarurat.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <Phone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Tidak ada kontak darurat yang cocok dengan pencarian.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredKontakDarurat.map((k, idx) => {
              // Tentukan warna & icon berdasarkan nama instansi
              const nm = k.nama.toLowerCase();
              const jb = (k.jabatan || '').toLowerCase();
              let accent = 'border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20';
              let iconBg  = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
              let badgeBg = 'bg-blue-500 text-white';
              let InstIcon: React.ElementType = Phone;

              if (nm.includes('kantor desa') || nm.includes('balai desa') || jb.includes('pemerintah desa')) {
                accent  = 'border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20';
                iconBg  = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
                badgeBg = 'bg-amber-500 text-white';
                InstIcon = Building2;
              } else if (nm.includes('ketua rt') || nm.includes('ketua rw') || nm.includes('rt ') || nm.includes('rw ')) {
                accent  = 'border-teal-200 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20';
                iconBg  = 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
                badgeBg = 'bg-teal-500 text-white';
                InstIcon = User;
              } else if (nm.includes('polsek') || nm.includes('polres') || nm.includes('polisi') || nm.includes('babinkamtibmas') || nm.includes('bhabinkamtibmas')) {
                accent  = 'border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20';
                iconBg  = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
                badgeBg = 'bg-indigo-500 text-white';
                InstIcon = ShieldCheck;
              } else if (nm.includes('koramil') || nm.includes('babinsa') || nm.includes('tni') || jb.includes('kodim') || jb.includes('koramil')) {
                accent  = 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20';
                iconBg  = 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
                badgeBg = 'bg-slate-600 text-white';
                InstIcon = Shield;
              } else if (nm.includes('puskesmas') || nm.includes('ambulans') || nm.includes('rsud') || nm.includes('spgdt') || nm.includes('119') || nm.includes('psc') || nm.includes('call center') || jb.includes('kesehatan')) {
                accent  = 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20';
                iconBg  = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                badgeBg = 'bg-emerald-500 text-white';
                InstIcon = HeartPulse;
              } else if (nm.includes('damkar') || nm.includes('kebakaran') || nm.includes('pemadam')) {
                accent  = 'border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20';
                iconBg  = 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
                badgeBg = 'bg-orange-500 text-white';
                InstIcon = Flame;
              } else if (nm.includes('bpbd') || nm.includes('bencana') || nm.includes('banjir') || nm.includes('pusdalops')) {
                accent  = 'border-cyan-200 dark:border-cyan-900/40 bg-cyan-50/50 dark:bg-cyan-950/20';
                iconBg  = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
                badgeBg = 'bg-cyan-500 text-white';
                InstIcon = CloudLightning;
              } else if (nm.includes('pln') || nm.includes('listrik') || jb.includes('listrik')) {
                accent  = 'border-yellow-200 dark:border-yellow-900/40 bg-yellow-50/50 dark:bg-yellow-950/20';
                iconBg  = 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
                badgeBg = 'bg-yellow-500 text-white';
                InstIcon = Zap;
              } else if (nm.includes('satpol') || nm.includes('satlinmas') || nm.includes('linmas')) {
                accent  = 'border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20';
                iconBg  = 'bg-red-500/10 text-red-600 dark:text-red-400';
                badgeBg = 'bg-red-500 text-white';
                InstIcon = ShieldAlert;
              }

              // Tentukan logo path berdasarkan nama/id instansi
              let logoPath: string | null = null;
              if (nm.includes('kantor desa') || nm.includes('balai desa')) {
                logoPath = '/assets/logo/desa.png';
              } else if (nm.includes('babinkamtibmas') || nm.includes('bhabinkamtibmas') || nm.includes('polsek') || nm.includes('polres') || nm.includes('polisi')) {
                logoPath = '/assets/logo/polres.png';
              } else if (nm.includes('babinsa') || nm.includes('koramil') || nm.includes('tni') || jb.includes('kodim')) {
                logoPath = '/assets/logo/kodim.png';
              } else if (nm.includes('pemadam') || nm.includes('damkar') || nm.includes('kebakaran')) {
                logoPath = '/assets/logo/damkar.png';
              } else if (nm.includes('psc') || nm.includes('call center') || nm.includes('119') || nm.includes('spgdt')) {
                logoPath = '/assets/logo/psc.png';
              } else if (nm.includes('pusdalops') || nm.includes('bpbd') || nm.includes('bencana')) {
                logoPath = '/assets/logo/pusdalops.png';
              } else if (nm.includes('ketua rt') || nm.includes('ketua rw') || nm.includes('rukun tetangga')) {
                logoPath = '/assets/logo/rt.png';
              }

              return (
                <div
                  key={k.id}
                  className={`group flex flex-col rounded-2xl border ${accent} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
                >
                  {/* Header card */}
                  <div className="p-4 space-y-2.5">
                    {/* Baris atas: badge nomor + logo/icon + nama */}
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-full ${badgeBg} flex items-center justify-center text-[10px] font-black shrink-0`}>
                        {idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-white/80 dark:bg-white/10">
                        {logoPath ? (
                          <img
                            src={logoPath}
                            alt={k.nama}
                            className="w-8 h-8 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                            <InstIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <h5 className="text-sm font-black text-slate-900 dark:text-white leading-snug flex-1 min-w-0">
                        {k.nama}
                      </h5>
                    </div>

                    {/* Nomor — icon telepon sejajar vertikal dengan icon instansi di atas */}
                    {/* badge w-6(24px) + gap-2.5(10px) = 34px → sejajar kiri icon instansi */}
                    <div className="pl-[42px] space-y-0.5">
                      {k.noHp && (
                        <a
                          href={`tel:${k.noHp}`}
                          className="flex items-center gap-1.5 text-sm font-black text-slate-800 dark:text-slate-100 hover:text-red-600 dark:hover:text-red-400 transition-colors font-mono"
                        >
                          <Phone className="w-4 h-4 shrink-0 text-red-500" />
                          <span className="tracking-wider">{k.noHp}</span>
                        </a>
                      )}
                      {k.noWa && k.noWa !== k.noHp && (
                        <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-black font-mono">
                          <span className="w-4 h-4 shrink-0 flex items-center justify-center"><WhatsAppIcon size={14} /></span>
                          <span className="tracking-wider">{k.noWa}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-4 pb-4 flex items-center gap-2 mt-auto">
                    {k.noHp && (
                      <a
                        href={`tel:${k.noHp}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black transition-colors shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Telepon
                      </a>
                    )}
                    {k.noWa && (
                      <a
                        href={`https://wa.me/${k.noWa.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-colors shadow-sm"
                      >
                        <WhatsAppIcon size={13} />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
