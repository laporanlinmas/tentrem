'use client';

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Camera,
  Newspaper,
  GitBranch,
  Drum,
  Map,
  Megaphone,
  Play } from 'lucide-react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import RondaSection from '@/components/RondaSection';
import SmartPoskamlingSection from '@/components/SmartPoskamlingSection';
import Footer from '@/components/Footer';

// Lazy loaded page components
const ChatbotUnified = lazy(() => import('@/components/ChatbotUnified'));
const VisitorCounter  = lazy(() => import('@/components/VisitorCounter'));
const ProfilPage      = lazy(() => import('@/components/ProfilPage'));
const BeritaPage      = lazy(() => import('@/components/BeritaPage'));
const AduanPage       = lazy(() => import('@/components/AduanPage'));
const StrukturPage    = lazy(() => import('@/components/StrukturPage'));
const GaleriPage      = lazy(() => import('@/components/GaleriPage'));
const KentonganPage   = lazy(() => import('@/components/KentonganPage'));
const PetaPage        = lazy(() => import('@/components/PetaPage'));
const LaporRondaPage  = lazy(() => import('@/components/LaporRondaPage'));
const SurveyPage      = lazy(() => import('@/components/SurveyPage'));
const WeatherPage     = lazy(() => import('@/components/WeatherPage'));
const SmartPoskamlingPage = lazy(() => import('@/components/SmartPoskamlingPage'));
const TupoksiDetailPage   = lazy(() => import('@/components/TupoksiDetailPage'));
const InventarisPage      = lazy(() => import('@/components/InventarisPage'));

// ─── Route types ────────────────────────────────────────────────────────────
export type PageRoute =
  | 'home'
  | 'profil'
  | 'berita'
  | 'aduan'
  | 'struktur'
  | 'galeri'
  | 'kentongan'
  | 'peta'
  | 'ronda'
  | 'survei'
  | 'cuaca'
  | 'jadwal-ronda'
  | 'rincian-tugas'
  | 'inventaris';

// ─── Skeleton loaders ────────────────────────────────────────────────────────
function PageSkeleton({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Loading content */}
      <div className="flex-1 flex items-center justify-center pt-28 pb-12 px-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-t-emerald-400 border-r-teal-400 border-b-transparent border-l-transparent animate-spin" />
              <div
                className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-transparent border-b-cyan-400 border-l-sky-400 animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '600ms' }}
              />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">{label}</p>
              <p className="text-xs text-slate-400 text-center mt-0.5">Mohon tunggu sebentar…</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-8 w-2/3 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-full rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-5/6 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-4/6 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 animate-[progress_1.2s_ease-in-out_infinite]"
          style={{ width: '60%' }}
        />
      </div>
    </div>
  );
}

// ─── Transition durations ───────────────────────────────────────────────────
// Sinkron dengan CSS: page-fade-out = 180ms, page-fade-in = 260ms
const FADE_OUT_MS = 180;
const FADE_IN_DELAY_MS = 20; // gap minimal agar browser flush repaint sebelum enter

// ─── URL parsing & routing helpers ──────────────────────────────────────────
function parseLocation(): { page: PageRoute; slug: string } {
  if (typeof window === 'undefined') return { page: 'home', slug: '' };

  const p = window.location.pathname.toLowerCase();
  let pathSlug = '';
  if (p.startsWith('/berita/')) {
    try {
      pathSlug = decodeURIComponent(p.slice('/berita/'.length));
    } catch {
      pathSlug = p.slice('/berita/'.length);
    }
  }

  const slug =
    new URLSearchParams(window.location.search).get('id') ||
    new URLSearchParams(window.location.search).get('slug') ||
    pathSlug;

  if (p === '/profil' || p === '/profil-desa' || p === '/video') return { page: 'profil', slug: '' };
  if (p === '/berita' || p.startsWith('/berita/')) return { page: 'berita', slug };
  if (p === '/aduan' || p === '/pengaduan')         return { page: 'aduan', slug: '' };
  if (p === '/struktur' || p === '/struktur-organisasi') return { page: 'struktur', slug: '' };
  if (p === '/galeri' || p === '/galeri-kegiatan') return { page: 'galeri', slug: '' };
  if (p === '/kentongan' || p === '/isyarat-kentongan') return { page: 'kentongan', slug: '' };
  if (p === '/peta' || p === '/peta-wilayah')       return { page: 'peta', slug: '' };
  if (p === '/ronda' || p === '/lapor-ronda')       return { page: 'ronda', slug: '' };
  if (p === '/survei' || p === '/kritik-saran' || p === '/survey') return { page: 'survei', slug: '' };
  if (p === '/cuaca' || p === '/prakiraan-cuaca') return { page: 'cuaca', slug: '' };
  if (p === '/jadwal-ronda' || p === '/smart-poskamling') return { page: 'jadwal-ronda', slug: '' };
  if (p === '/rincian-tugas' || p === '/tupoksi') return { page: 'rincian-tugas', slug: '' };
  if (p === '/inventaris') return { page: 'inventaris', slug: '' };

  return { page: 'home', slug: '' };
}

function buildPageUrl(page: PageRoute, slug?: string): string {
  switch (page) {
    case 'profil':
      return '/profil';
    case 'berita':
      return slug ? `/berita/${encodeURIComponent(slug)}` : '/berita';
    case 'aduan':
      return '/aduan';
    case 'struktur':
      return '/struktur';
    case 'galeri':
      return '/galeri';
    case 'kentongan':
      return '/kentongan';
    case 'peta':
      return '/peta';
    case 'ronda':
      return '/ronda';
    case 'survei':
      return '/survei';
    case 'cuaca':
      return '/cuaca';
    case 'jadwal-ronda':
      return '/jadwal-ronda';
    case 'rincian-tugas':
      return '/rincian-tugas';
    case 'inventaris':
      return '/inventaris';
    case 'home':
    default:
      return '/';
  }
}

function setContentTransition(className: 'page-enter' | 'page-exit', enabled: boolean) {
  document.getElementById('page-content')?.classList.toggle(className, enabled);
}

export default function HomePage() {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [aduanTab, setAduanTab] = useState<'form' | 'track'>('form');
  const [selectedBeritaSlug, setSelectedBeritaSlug] = useState('');
  const navigationTimerRef = useRef<number | null>(null);
  const pageEnterTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  // Track jika sedang dalam proses navigasi untuk mencegah double-trigger
  const isNavigatingRef = useRef(false);

  // Current page state initialized from browser location
  const [page, setPage] = useState<PageRoute>(() => parseLocation().page);

  // Fade-in on mount — double rAF supaya browser sudah paint sebelum class enter ditambah
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('page-content')?.classList.add('page-enter');
      });
    });
  }, []);

  // Initialize selectedBeritaSlug on mount
  useEffect(() => {
    const { slug } = parseLocation();
    if (slug) setSelectedBeritaSlug(slug);
  }, []);

  // Popstate handler (browser back/forward)
  useEffect(() => {
    const onPopState = () => {
      if (navigationTimerRef.current !== null) window.clearTimeout(navigationTimerRef.current);
      if (pageEnterTimerRef.current !== null) window.clearTimeout(pageEnterTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

      const { page: nextPage, slug } = parseLocation();
      const el = document.getElementById('page-content');
      el?.classList.remove('page-enter');
      el?.classList.add('page-exit');

      navigationTimerRef.current = window.setTimeout(() => {
        window.scrollTo(0, 0);
        setPage(nextPage);
        if (nextPage === 'berita') setSelectedBeritaSlug(slug);

        el?.classList.remove('page-exit');
        pageEnterTimerRef.current = window.setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => el?.classList.add('page-enter'));
          });
        }, FADE_IN_DELAY_MS);
      }, FADE_OUT_MS);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => () => {
    if (navigationTimerRef.current !== null) window.clearTimeout(navigationTimerRef.current);
    if (pageEnterTimerRef.current !== null) window.clearTimeout(pageEnterTimerRef.current);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  // Navigate to a target page
  const navigateTo = useCallback((target: string, slug?: string) => {
    const targetRoute = target as PageRoute;

    if (targetRoute === page && (targetRoute !== 'berita' || slug === selectedBeritaSlug)) return;

    // Batalkan semua timer & rAF yang sedang pending
    if (navigationTimerRef.current !== null) window.clearTimeout(navigationTimerRef.current);
    if (pageEnterTimerRef.current !== null) window.clearTimeout(pageEnterTimerRef.current);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    isNavigatingRef.current = true;

    // 1. Mulai animasi exit
    const el = document.getElementById('page-content');
    el?.classList.remove('page-enter');
    el?.classList.add('page-exit');

    navigationTimerRef.current = window.setTimeout(() => {
      // 2. Swap konten — scroll DULU (instant, tanpa animasi scroll agar tidak double-glitch)
      window.scrollTo(0, 0);

      // 3. Update state & URL
      const url = buildPageUrl(targetRoute, slug);
      window.history.pushState({ page: targetRoute, slug: slug ?? '' }, '', url);
      setPage(targetRoute);
      if (targetRoute === 'berita') setSelectedBeritaSlug(slug ?? '');

      // 4. Hapus exit, beri 1 frame browser untuk flush layout, lalu masukkan enter
      el?.classList.remove('page-exit');

      pageEnterTimerRef.current = window.setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el?.classList.add('page-enter');
            isNavigatingRef.current = false;
          });
        });
      }, FADE_IN_DELAY_MS);
    }, FADE_OUT_MS);
  }, [page, selectedBeritaSlug]);

  // Sinkronisasi judul tab browser agar selalu stabil mengikuti index.html
  useEffect(() => {
    if (page === 'home') {
      document.title = 'Tentrem - Tugurejo Nyaman Tanggap Responsif Modern';
    }
  }, [page]);

  // Scroll reveal observer on home page — re-init setiap kali kembali ke home
  useEffect(() => {
    if (page !== 'home') return;

    // Reset semua reveal element dulu (kalau sudah pernah aktif sebelumnya)
    // agar kembali ke home terasa "fresh" dan animasi muncul lagi
    const resetAndObserve = () => {
      const els = document.querySelectorAll<HTMLElement>('.reveal');
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('active');
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.08 }
      );
      els.forEach((el) => {
        // Jika belum aktif, langsung observe
        // Jika sudah aktif (balik ke home setelah pindah halaman), biarkan tetap active
        if (!el.classList.contains('active')) {
          obs.observe(el);
        }
      });
      return obs;
    };

    // Sedikit delay agar DOM page-enter sudah selesai sebelum observer jalan
    const timer = window.setTimeout(() => {
      const obs = resetAndObserve();
      return () => obs.disconnect();
    }, 260); // sedikit lebih lama dari fade-in duration (240ms)

    return () => window.clearTimeout(timer);
  }, [page]);

  // ═══════════════════════════════════════════════════════
  // VIEW RENDERER PER PAGE ROUTE
  // ═══════════════════════════════════════════════════════
  const renderPageContent = () => {
    switch (page) {
      case 'profil':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Profil Desa & TENTREM…" />}>
            <ProfilPage
              onBack={() => navigateTo('home')}
              onNavigate={navigateTo}
            />
          </Suspense>
        );

      case 'berita':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Warta & Berita Desa…" />}>
            <BeritaPage
              onBack={() => navigateTo('home')}
              selectedSlugOrId={selectedBeritaSlug}
              onSelectArticle={(slug) => {
                setSelectedBeritaSlug(slug);
                const url = buildPageUrl('berita', slug);
                window.history.pushState({ page: 'berita', slug }, '', url);
              }}
            />
          </Suspense>
        );

      case 'aduan':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Halaman Pengaduan…" />}>
            <AduanPage
              onBack={() => navigateTo('home')}
              initialTab={aduanTab}
            />
          </Suspense>
        );

      case 'struktur':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Struktur Satkamling…" />}>
            <StrukturPage
              onBack={() => navigateTo('home')}
              onNavigate={navigateTo}
            />
          </Suspense>
        );

      case 'galeri':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Galeri Dokumentasi…" />}>
            <GaleriPage
              onBack={() => navigateTo('home')}
            />
          </Suspense>
        );

      case 'kentongan':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Tanda Kentongan…" />}>
            <KentonganPage
              onBack={() => navigateTo('home')}
              onNavigate={navigateTo}
            />
          </Suspense>
        );

      case 'peta':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Peta Wilayah…" />}>
            <PetaPage
              onBack={() => navigateTo('home')}
              onNavigate={navigateTo}
            />
          </Suspense>
        );

      case 'ronda':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Form Lapor Ronda…" />}>
            <LaporRondaPage
              onBack={() => navigateTo('home')}
            />
          </Suspense>
        );

      case 'survei':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Halaman Kritik & Saran…" />}>
            <SurveyPage
              onBack={() => navigateTo('home')}
            />
          </Suspense>
        );

      case 'cuaca':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Prakiraan Cuaca BMKG…" />}>
            <WeatherPage
              onBack={() => navigateTo('home')}
            />
          </Suspense>
        );

      case 'jadwal-ronda':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Jadwal Ronda…" />}>
            <SmartPoskamlingPage
              onBack={() => navigateTo('home')}
            />
          </Suspense>
        );

      case 'rincian-tugas':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Rincian Tugas…" />}>
            <TupoksiDetailPage
              onBack={() => navigateTo('home')}
              onNavigate={navigateTo}
            />
          </Suspense>
        );

      case 'inventaris':
        return (
          <Suspense fallback={<PageSkeleton label="Memuat Inventaris Aset Poskamling…" />}>
            <InventarisPage
              onBack={() => navigateTo('home')}
              onNavigate={navigateTo}
            />
          </Suspense>
        );

      case 'home':
      default:
        return (
          <div className="space-y-14">
            {/* ── HERO SECTION ── */}
            <Hero
              onScrollToSection={(sectionId) => {
                if (sectionId === 'ronda') navigateTo('ronda');
                else if (sectionId === 'peta') navigateTo('peta');
                else if (sectionId === 'pengaduan') navigateTo('aduan');
                else if (sectionId === 'cuaca') navigateTo('cuaca');
                else if (sectionId === 'berita') navigateTo('berita');
                else if (sectionId === 'galeri') navigateTo('galeri');
                else if (sectionId === 'struktur') navigateTo('struktur');
                else if (sectionId === 'kentongan') navigateTo('kentongan');
                else if (sectionId === 'video' || sectionId === 'profil') navigateTo('profil');
              }}
            />

            <main id="main-content" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-16">

              {/* ── JADWAL & STATUS RONDA SECTION ── */}
              <div id="ronda-section" className="reveal">
                <RondaSection />
              </div>

              {/* ── SMART POSKAMLING SECTION ── */}
              <div id="smart-poskamling-section" className="reveal">
                <SmartPoskamlingSection onNavigateDetail={() => navigateTo('jadwal-ronda')} />
              </div>

              {/* ── QUICK ACCESS PORTAL CARDS (BERANDA) ── */}
              <section className="reveal space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-extrabold uppercase tracking-wider mb-2">
                      <ShieldCheck className="w-3 h-3" />
                      Layanan &amp; Informasi Publik
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      Portal TENTREM Tugurejo
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Card Profil & Video */}
                  <div
                    onClick={() => navigateTo('profil')}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md hover:border-teal-400/60 dark:hover:border-teal-600/50 transition-all duration-200 cursor-pointer flex items-center gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                        Profil Desa &amp; Video
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">Gambaran wilayah &amp; profil TENTREM</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* Card Berita */}
                  <div
                    onClick={() => navigateTo('berita')}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md hover:border-emerald-400/60 dark:hover:border-emerald-600/50 transition-all duration-200 cursor-pointer flex items-center gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                      <Newspaper className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        Warta &amp; Berita Desa
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">Berita, pengumuman &amp; agenda desa</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* Card Pengaduan */}
                  <div
                    onClick={() => navigateTo('aduan')}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md hover:border-orange-400/60 dark:hover:border-orange-600/50 transition-all duration-200 cursor-pointer flex items-center gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-200">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                        Kanal Pengaduan Warga
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">Laporan &amp; pelacakan tiket 24 jam</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* Card Struktur */}
                  <div
                    onClick={() => navigateTo('struktur')}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md hover:border-blue-400/60 dark:hover:border-blue-600/50 transition-all duration-200 cursor-pointer flex items-center gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        Struktur Satkamling
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">Bagan komando &amp; tugas Satlinmas</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* Card Galeri */}
                  <div
                    onClick={() => navigateTo('galeri')}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md hover:border-cyan-400/60 dark:hover:border-cyan-600/50 transition-all duration-200 cursor-pointer flex items-center gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-200">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                        Galeri Dokumentasi
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">Arsip foto ronda &amp; kegiatan desa</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* Card Kentongan */}
                  <div
                    onClick={() => navigateTo('kentongan')}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md hover:border-amber-400/60 dark:hover:border-amber-600/50 transition-all duration-200 cursor-pointer flex items-center gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200">
                      <Drum className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                        Isyarat Kentongan
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">7 kode &amp; simulator bunyi akustik</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* Card Peta */}
                  <div
                    onClick={() => navigateTo('peta')}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md hover:border-indigo-400/60 dark:hover:border-indigo-600/50 transition-all duration-200 cursor-pointer flex items-center gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                      <Map className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        Peta Wilayah Digital
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">Peta interaktif &amp; pos ronda</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </div>
              </section>

            </main>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 overflow-x-hidden">
      {/* Background ambient light blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-400/[0.07] dark:bg-emerald-600/[0.06] blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-cyan-400/[0.07] dark:bg-cyan-600/[0.06] blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-teal-300/[0.07] dark:bg-teal-600/[0.05] blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Global Topbar Header */}
      <Header
        currentPage={page}
        onNavigate={navigateTo}
        onBack={() => navigateTo('home')}
      />

      {/* Dynamic Page Route View — hanya konten yang bertransisi; top bar tetap stabil. */}
      <div id="page-content">
        {renderPageContent()}
      </div>

      {/* Global Visitor Counter */}
      <Suspense fallback={null}>
        <VisitorCounter />
      </Suspense>

      {/* Global Footer */}
      <Footer />

      {/* Global AI Chatbot Assistant */}
      <Suspense fallback={null}>
        <ChatbotUnified
          opened={chatbotOpen}
          onToggle={(o: boolean) => setChatbotOpen(o)}
          onNavigate={(target) => navigateTo(target)}
        />
      </Suspense>
    </div>
  );
}
