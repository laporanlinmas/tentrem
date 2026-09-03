'use client';

import React, { useState } from 'react';
import { MapPin, Clock, ExternalLink, Heart, ShieldCheck, X } from 'lucide-react';
import { FacebookIcon, XIcon, InstagramIcon, WhatsAppIcon, TikTokIcon } from './BrandIcons';

const SOCIAL_LINKS = [
  { label: 'Facebook',   href: 'https://www.facebook.com/pemdes.tugurejo/', icon: <FacebookIcon />,  hoverBg: '#1877F2', hoverColor: '#fff' },
  { label: 'Instagram',  href: 'https://instagram.com/pemdestugurejoslahung', icon: <InstagramIcon />, hoverBg: '#E1306C', hoverColor: '#fff' },
  { label: 'WhatsApp',   href: 'https://wa.me/6282313823791', icon: <WhatsAppIcon />, hoverBg: '#25D366', hoverColor: '#fff' },
  { label: 'TikTok',     href: 'https://www.tiktok.com/@pemdes.tugurejo', icon: <TikTokIcon />, hoverBg: '#010101', hoverColor: '#fff' },
];

function DevModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          {/* Foto */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-lg shrink-0">
            <img
              src="/assets/basith.jpeg"
              alt="Ahmad Abdul Basith"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Ahmad Abdul Basith, S.Tr.I.P</h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">ASN Pemerintah Kabupaten Ponorogo</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Pengembang sistem informasi TENTREM — platform terpadu pelayanan publik, keamanan, dan keterbukaan informasi Desa Tugurejo.
            </p>
          </div>

          <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400">© 2026 · Desa Tugurejo, Slahung, Ponorogo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);

  return (
    <footer className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 text-slate-300">

      {showDevModal && <DevModal onClose={() => setShowDevModal(false)} />}

      {/* Accent stripe atas */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

      {/* Dekorasi blur */}
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute top-0 left-0 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-11">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

          {/* ── Brand ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-lg shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                  <picture>
                    <source srcSet="/assets/linmas.svg" type="image/svg+xml" />
                    <img src="/assets/icon-512.png" alt="TENTREM" width={28} height={28} className="object-contain" />
                  </picture>
                </div>
              </div>
              <div>
                <p className="text-xl font-black text-white leading-tight tracking-wider">POSKAMLING TENTREM</p>
                <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Tugurejo Nyaman Tanggap Responsif Modern
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Sistem informasi monitoring poskamling, keterbukaan warta, kanal aduan cepat, dan keamanan swakarsa warga Desa Tugurejo, Kecamatan Slahung, Kabupaten Ponorogo.
            </p>

            {/* Sosmed */}
            <div className="flex gap-2 pt-2">
              {SOCIAL_LINKS.map((s) => {
                const isHovered = hoveredSocial === s.label;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    onMouseEnter={() => setHoveredSocial(s.label)}
                    onMouseLeave={() => setHoveredSocial(null)}
                    style={{
                      backgroundColor: isHovered ? s.hoverBg : '',
                      color: isHovered ? s.hoverColor : '',
                      borderColor: isHovered ? s.hoverBg : '',
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-700 bg-slate-800 text-slate-400 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm"
                  >
                    {s.icon}
                  </a>
                );
              })}
            </div>
          </div>

          {/* ── Kontak & Instansi ── */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Pemerintah Desa Tugurejo
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Desa Tugurejo, Kecamatan Slahung, Kabupaten Ponorogo, Jawa Timur 63463</span>
              </li>
              <li className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-400">
                <Clock className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>Layanan Digital &amp; Pengamanan 24 Jam</span>
              </li>

              {/* Link Satpol PP */}
              <li className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400/90 uppercase tracking-wider block">
                  Kerjasama Pembinaan :
                </span>
                <a
                  href="https://satpolpp.ponorogo.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-600/50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm p-1">
                    <img src="/assets/satpol.svg" alt="Satpol PP Ponorogo" width={28} height={28} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-emerald-400 truncate transition-colors">
                      Satpol PP Kabupaten Ponorogo
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">satpolpp.ponorogo.go.id</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-500 transition-colors shrink-0" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-8 pt-5 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
          <span>
            &copy; 2026 Pemerintah Desa Tugurejo &amp; Satlinmas Kab. Ponorogo ·{' '}
            <span className="font-semibold text-slate-300">TENTREM</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-bold border border-slate-700">
              v1.0
            </span>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowDevModal(true)}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer select-none"
          >
            <Heart className="w-3 h-3 text-slate-500" aria-hidden="true" />
            Built by Ahmad Basith
          </button>
        </div>
      </div>
    </footer>
  );
}
