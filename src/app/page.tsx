'use client';

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import JadwalRondaSection from '@/components/JadwalRondaSection';
import KontakDaruratSection from '@/components/KontakDaruratSection';
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
const SurveyPage      = lazy(() => import('@/components/SurveyPage'));
const WeatherPage     = lazy(() => import('@/components/WeatherPage'));
const JadwalRondaPage = lazy(() => import('@/components/JadwalRondaPage'));
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
// Keep the route swap short so navigation feels immediate without flashing.
const FADE_OUT_MS = 140;
const FADE_IN_DELAY_MS = 0;

const PAGE_META: Record<PageRoute, { title: string; description: string }> = {
  home: { title: 'TENTREM | Portal Layanan Publik', description: 'Portal layanan publik Desa Tugurejo, Ponorogo: informasi desa, keamanan lingkungan, jadwal ronda, cuaca BMKG, peta wilayah, dan pengaduan warga.' },
  profil: { title: 'Profil & Video | TENTREM', description: 'Profil, sejarah, wilayah, dan video Desa Tugurejo, Kecamatan Slahung, Kabupaten Ponorogo.' },
  berita: { title: 'Berita | TENTREM', description: 'Berita, pengumuman, agenda, dan kegiatan terbaru Desa Tugurejo, Ponorogo.' },
  aduan: { title: 'Pengaduan Warga | TENTREM', description: 'Sampaikan dan lacak pengaduan warga Desa Tugurejo secara mudah melalui portal TENTREM.' },
  struktur: { title: 'Struktur Satkamling | TENTREM', description: 'Struktur organisasi dan susunan tugas Satkamling Desa Tugurejo.' },
  galeri: { title: 'Galeri Kegiatan | TENTREM', description: 'Dokumentasi kegiatan warga, ronda, gotong royong, dan Satlinmas Desa Tugurejo.' },
  kentongan: { title: 'Isyarat Kentongan | TENTREM', description: 'Pelajari kode isyarat kentongan dan gunakan simulator bunyi interaktif TENTREM.' },
  peta: { title: 'Peta Wilayah | TENTREM', description: 'Peta digital wilayah, poskamling, fasilitas umum, dan zona kerawanan Desa Tugurejo.' },
  survei: { title: 'Survei Kepuasan Masyarakat | TENTREM', description: 'Isi survei kepuasan layanan publik Desa Tugurejo untuk membantu peningkatan pelayanan.' },
  cuaca: { title: 'Prakiraan Cuaca | TENTREM', description: 'Prakiraan cuaca BMKG terkini untuk Desa Tugurejo, Kecamatan Slahung, Ponorogo.' },
  'jadwal-ronda': { title: 'Jadwal Ronda | TENTREM', description: 'Jadwal ronda malam, kelompok bertugas, Danpok, dan anggota aktif Poskamling Desa Tugurejo.' },
  'rincian-tugas': { title: 'Rincian Tugas Satlinmas | TENTREM', description: 'Rincian tugas dan fungsi setiap jabatan dalam struktur Satlinmas Desa Tugurejo.' },
  inventaris: { title: 'Inventaris Poskamling | TENTREM', description: 'Daftar aset dan perlengkapan Poskamling Satlinmas Desa Tugurejo.' },
};

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
  if (p === '/survei' || p === '/kritik-saran' || p === '/survey') return { page: 'survei', slug: '' };
  if (p === '/cuaca' || p === '/prakiraan-cuaca') return { page: 'cuaca', slug: '' };
  if (p === '/jadwal-ronda') return { page: 'jadwal-ronda', slug: '' };
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

export default function HomePage() {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [selectedBeritaSlug, setSelectedBeritaSlug] = useState('');
  const navigationTimerRef = useRef<number | null>(null);
  const pageEnterTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  // Current page state initialized from browser location
  const [page, setPage] = useState<PageRoute>(() => parseLocation().page);

  // Fade-in on mount — double rAF supaya browser sudah paint sebelum class enter ditambah
  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
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
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = requestAnimationFrame(() => el?.classList.add('page-enter'));
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
          });
        });
      }, FADE_IN_DELAY_MS);
    }, FADE_OUT_MS);
  }, [page, selectedBeritaSlug]);

  // Keep browser and social metadata aligned with the client-side route.
  useEffect(() => {
    const meta = PAGE_META[page];
    const canonicalUrl = new URL(buildPageUrl(page, page === 'berita' ? selectedBeritaSlug : undefined), window.location.origin).href;
    document.title = meta.title;

    const setMeta = (selector: string, attribute: 'name' | 'property', value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, selector.split('"')[1]);
        document.head.appendChild(element);
      }
      element.content = value;
    };

    setMeta('meta[name="description"]', 'name', meta.description);
    setMeta('meta[property="og:title"]', 'property', meta.title);
    setMeta('meta[property="og:description"]', 'property', meta.description);
    setMeta('meta[property="og:url"]', 'property', canonicalUrl);
    setMeta('meta[name="twitter:title"]', 'name', meta.title);
    setMeta('meta[name="twitter:description"]', 'name', meta.description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [page, selectedBeritaSlug]);

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
    let obs: IntersectionObserver | null = null;
    const timer = window.setTimeout(() => {
      obs = resetAndObserve();
    }, 220);

    return () => {
      window.clearTimeout(timer);
      obs?.disconnect();
    };
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
            <JadwalRondaPage
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
          <div className="flex flex-col">
            {/* ── HERO SECTION ── */}
            <Hero
              onScrollToSection={(sectionId) => {
                if (sectionId === 'peta') navigateTo('peta');
                else if (sectionId === 'pengaduan') navigateTo('aduan');
                else if (sectionId === 'cuaca') navigateTo('cuaca');
                else if (sectionId === 'berita') navigateTo('berita');
                else if (sectionId === 'galeri') navigateTo('galeri');
                else if (sectionId === 'struktur') navigateTo('struktur');
                else if (sectionId === 'kentongan') navigateTo('kentongan');
                else if (sectionId === 'video' || sectionId === 'profil') navigateTo('profil');
                else if (sectionId === 'kontak-darurat') {
                  const el = document.getElementById('kontak-darurat-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />

            <main id="main-content" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-16 pt-10 sm:pt-14">

              {/* ── JADWAL & STATUS RONDA SECTION ── */}
              <div id="jadwal-ronda-section" className="reveal">
                <JadwalRondaSection onNavigateDetail={() => navigateTo('jadwal-ronda')} />
              </div>

              {/* ── KONTAK DARURAT SECTION ── */}
              <div id="kontak-darurat-section" className="reveal">
                <KontakDaruratSection />
              </div>

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
