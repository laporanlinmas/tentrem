'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Newspaper, Calendar, User, Tag, Clock, ArrowLeft, Eye,
  Search, Sparkles, ChevronRight, X, Share2, Check,
  ExternalLink, Layers, BookOpen, MessageCircle, Star,
  ArrowRight, Home, Flame, Bookmark
} from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection, onSnapshot, query, doc, updateDoc, increment
} from 'firebase/firestore';
import NewsImage from './NewsImage';

export interface BeritaItem {
  id: string;
  slug: string;
  judul: string;
  ringkasan: string;
  konten: string;
  kategori: string;
  gambarUtama: string;
  captionGambar?: string;
  galeri?: string[];
  penulis: string;
  status: 'published' | 'draft';
  isFeatured?: boolean;
  tags?: string[];
  views?: number;
  publishedAt: string;
  createdAt?: any;
}

export const KATEGORI_LIST = [
  'Semua',
  'Kegiatan Desa',
  'Ketertiban & Keamanan',
  'Pembangunan',
  'Pengumuman',
  'Sosial & Budaya',
  'Kesehatan & Lingkungan'
];

export const getKategoriBadgeTheme = (kategori: string) => {
  switch (kategori) {
    case 'Ketertiban & Keamanan':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500/30',
        dot: 'bg-rose-500',
      };
    case 'Pembangunan':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500',
      };
    case 'Pengumuman':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-500',
      };
    case 'Sosial & Budaya':
      return {
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/30',
        dot: 'bg-purple-500',
      };
    case 'Kesehatan & Lingkungan':
      return {
        bg: 'bg-teal-500/10 dark:bg-teal-500/20',
        text: 'text-teal-600 dark:text-teal-400',
        border: 'border-teal-500/30',
        dot: 'bg-teal-500',
      };
    case 'Kegiatan Desa':
    default:
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500',
      };
  }
};

// Safe Markdown Article Renderer for clean typography
const SafeArticleRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: string[] = [];
  let isOrdered = false;

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (isOrdered) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-6 space-y-2 text-slate-700 dark:text-slate-300 my-4 text-sm sm:text-base leading-relaxed">
            {listItems.map((item, i) => (
              <li key={i}>{renderInlineFormatted(item)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 my-4 text-sm sm:text-base leading-relaxed">
            {listItems.map((item, i) => (
              <li key={i}>{renderInlineFormatted(item)}</li>
            ))}
          </ul>
        );
      }
      inList = false;
      listItems = [];
    }
  };

  const renderInlineFormatted = (str: string) => {
    const cleanStr = str.replace(/<[^>]*>?/gm, '');
    const parts = cleanStr.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-slate-600 dark:text-slate-400">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();

    if (!rawLine) {
      flushList();
      continue;
    }

    // Heading 3: ### Title
    if (rawLine.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-8 mb-3 flex items-center gap-2.5">
          <span className="w-2 h-5 rounded-full bg-emerald-600 inline-block"></span>
          {renderInlineFormatted(rawLine.replace('### ', ''))}
        </h3>
      );
      continue;
    }

    // Heading 2: ## Title
    if (rawLine.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={i} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-10 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          {renderInlineFormatted(rawLine.replace('## ', ''))}
        </h2>
      );
      continue;
    }

    // Blockquote: > Quote
    if (rawLine.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={i} className="p-4 sm:p-5 my-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border-l-4 border-emerald-600 text-sm sm:text-base italic text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
          {renderInlineFormatted(rawLine.replace('> ', ''))}
        </blockquote>
      );
      continue;
    }

    // Divider: ---
    if (rawLine === '---' || rawLine === '***') {
      flushList();
      elements.push(<hr key={i} className="my-6 border-t border-slate-200 dark:border-slate-800" />);
      continue;
    }

    // Ordered list: 1. Item
    const numMatch = rawLine.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      if (!inList || !isOrdered) {
        flushList();
        inList = true;
        isOrdered = true;
      }
      listItems.push(numMatch[2]);
      continue;
    }

    // Unordered list: - Item or * Item
    if (rawLine.startsWith('- ') || rawLine.startsWith('* ')) {
      if (!inList || isOrdered) {
        flushList();
        inList = true;
        isOrdered = false;
      }
      listItems.push(rawLine.slice(2));
      continue;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={i} className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
        {renderInlineFormatted(rawLine)}
      </p>
    );
  }

  flushList();
  return <div>{elements}</div>;
};

interface BeritaPageProps {
  onBack: () => void;
  selectedSlugOrId?: string;
  onSelectArticle?: (slugOrId: string) => void;
}

export default function BeritaPage({
  onBack,
  selectedSlugOrId,
  onSelectArticle,
}: BeritaPageProps) {
  const [beritaList, setBeritaList] = useState<BeritaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<BeritaItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Firestore Real-time synchronization
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const colRef = collection(db, 'berita');
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: BeritaItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Omit<BeritaItem, 'id'>;
            if (data.status === 'published') {
              list.push({
                id: docSnap.id,
                ...data,
              });
            }
          });

          list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setBeritaList(list);
        setLoading(false);
      },
      (error) => {
        console.warn('Error fetching berita in BeritaPage:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Synchronize activeArticle from slug/id prop
  useEffect(() => {
    if (!selectedSlugOrId) {
      setActiveArticle(null);
      return;
    }

    const target = beritaList.find(
      (b) => b.slug === selectedSlugOrId || b.id === selectedSlugOrId
    );

    if (target) {
      setActiveArticle(target);
      trackRealView(target);
    }
  }, [selectedSlugOrId, beritaList]);

  // Keep browser/share metadata aligned with the article currently open (Maximum Google Search & News SEO)
  useEffect(() => {
    const isArticle = !!activeArticle;
    const title = activeArticle
      ? `${activeArticle.judul} — Warta & Berita Desa Tugurejo | Tentrem`
      : 'Warta & Berita Resmi Desa Tugurejo — Portal Tentrem Ponorogo';
    const description =
      activeArticle?.ringkasan ||
      'Pusat informasi, berita resmi, kegiatan masyarakat, pembangunan, siskamling, dan pengumuman Pemerintah Desa Tugurejo, Kecamatan Slahung, Kabupaten Ponorogo.';
    const slug = activeArticle?.slug || activeArticle?.id;
    const canonicalUrl = slug
      ? `${window.location.origin}/berita/${encodeURIComponent(slug)}`
      : `${window.location.origin}/berita`;
    const imageUrl =
      activeArticle?.gambarUtama || `${window.location.origin}/assets/tugurejo.webp`;

    document.title = title;

    // ISO dates for schema & meta
    let pubIso = new Date().toISOString();
    if (activeArticle?.createdAt?.seconds) {
      pubIso = new Date(activeArticle.createdAt.seconds * 1000).toISOString();
    } else if (activeArticle?.publishedAt) {
      const parsed = Date.parse(activeArticle.publishedAt);
      if (!isNaN(parsed)) pubIso = new Date(parsed).toISOString();
    }

    const keywords = activeArticle?.tags && activeArticle.tags.length > 0
      ? `${activeArticle.tags.join(', ')}, Berita Desa Tugurejo, Kabar Tugurejo, Slahung, Ponorogo, TENTREM`
      : 'Berita Desa Tugurejo, Tugurejo, Slahung, Ponorogo, Berita Terkini, Kabar Desa, Layanan Publik, TENTREM';

    const tags: Array<[string, string, string]> = [
      ['meta', 'name', 'description'],
      ['meta', 'name', 'keywords'],
      ['meta', 'name', 'news_keywords'],
      ['meta', 'name', 'author'],
      ['meta', 'name', 'robots'],
      ['meta', 'name', 'googlebot'],
      ['meta', 'name', 'googlebot-news'],
      ['meta', 'property', 'og:site_name'],
      ['meta', 'property', 'og:locale'],
      ['meta', 'property', 'og:title'],
      ['meta', 'property', 'og:description'],
      ['meta', 'property', 'og:url'],
      ['meta', 'property', 'og:image'],
      ['meta', 'property', 'og:type'],
      ['meta', 'property', 'article:published_time'],
      ['meta', 'property', 'article:modified_time'],
      ['meta', 'property', 'article:section'],
      ['meta', 'property', 'article:author'],
      ['meta', 'name', 'twitter:card'],
      ['meta', 'name', 'twitter:title'],
      ['meta', 'name', 'twitter:description'],
      ['meta', 'name', 'twitter:image'],
      ['meta', 'name', 'twitter:site'],
      ['meta', 'name', 'twitter:creator'],
    ];

    const values: Record<string, string> = {
      description,
      keywords,
      news_keywords: keywords,
      author: activeArticle?.penulis || 'Pemerintah Desa Tugurejo',
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      googlebot: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      'googlebot-news': 'index, follow',
      'og:site_name': 'TENTREM — Pemerintah Desa Tugurejo',
      'og:locale': 'id_ID',
      'og:title': title,
      'og:description': description,
      'og:url': canonicalUrl,
      'og:image': imageUrl,
      'og:type': isArticle ? 'article' : 'website',
      'article:published_time': pubIso,
      'article:modified_time': pubIso,
      'article:section': activeArticle?.kategori || 'Berita Desa',
      'article:author': activeArticle?.penulis || 'Pemerintah Desa Tugurejo',
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': imageUrl,
      'twitter:site': '@SatpolppPonoro1',
      'twitter:creator': '@SatpolppPonoro1',
    };

    tags.forEach(([tag, attribute, key]) => {
      let node = document.head.querySelector(`${tag}[${attribute}="${key}"]`) as HTMLMetaElement | null;
      if (!node) {
        node = document.createElement('meta');
        node.setAttribute(attribute, key);
        document.head.appendChild(node);
      }
      node.setAttribute('content', values[key]);
    });

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // ── INJECT GOOGLE NEWSARTICLE / ITEMLIST JSON-LD SCHEMA ──
    const SCRIPT_ID = 'seo-news-schema-jsonld';
    let scriptTag = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = SCRIPT_ID;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    if (activeArticle) {
      const cleanBody = (activeArticle.konten || '').replace(/<[^>]*>?/gm, '').slice(0, 5000);
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        headline: activeArticle.judul,
        description: activeArticle.ringkasan,
        image: [
          activeArticle.gambarUtama,
          ...(activeArticle.galeri || []),
        ].filter(Boolean),
        datePublished: pubIso,
        dateModified: pubIso,
        author: {
          '@type': 'Person',
          name: activeArticle.penulis || 'Pemerintah Desa Tugurejo',
          url: window.location.origin,
        },
        publisher: {
          '@type': 'GovernmentOrganization',
          name: 'Pemerintah Desa Tugurejo',
          url: window.location.origin,
          logo: {
            '@type': 'ImageObject',
            url: `${window.location.origin}/assets/icon-512.png`,
          },
        },
        articleSection: activeArticle.kategori,
        keywords: activeArticle.tags && activeArticle.tags.length > 0
          ? activeArticle.tags.join(', ')
          : 'Berita Desa Tugurejo, Slahung, Ponorogo',
        articleBody: cleanBody,
        inLanguage: 'id-ID',
      };
      scriptTag.textContent = JSON.stringify(articleSchema, null, 2);
    } else if (beritaList.length > 0) {
      const listSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Warta & Berita Resmi Desa Tugurejo',
        description: 'Kumpulan berita resmi, agenda kegiatan, pembangunan, dan ketertiban Desa Tugurejo.',
        itemListElement: beritaList.slice(0, 20).map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${window.location.origin}/berita/${encodeURIComponent(b.slug || b.id)}`,
          name: b.judul,
        })),
      };
      scriptTag.textContent = JSON.stringify(listSchema, null, 2);
    }
  }, [activeArticle, beritaList]);

  // Reset title ke Tentrem saat keluar dari halaman berita
  useEffect(() => {
    return () => {
      document.title = 'Tentrem - Tugurejo Nyaman Tanggap Responsif Modern';
    };
  }, []);

  // Real Visitor / Reader Counter increment in Firestore
  const trackRealView = (item: BeritaItem) => {
    if (!db || !item.id || item.id.startsWith('default-')) return;

    try {
      const sessionKey = `viewed_berita_${item.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1');
        const docRef = doc(db, 'berita', item.id);
        updateDoc(docRef, {
          views: increment(1),
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Error tracking view count:', e);
    }
  };

  const handleOpenArticle = (item: BeritaItem) => {
    setActiveArticle(item);
    trackRealView(item);
    if (onSelectArticle) {
      onSelectArticle(item.slug || item.id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setActiveArticle(null);
    if (onSelectArticle) {
      onSelectArticle('');
    }
    window.history.pushState({}, '', '/berita');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getArticleUrl = (item: BeritaItem) => {
    const slug = item.slug || item.id;
    return slug ? `${window.location.origin}/berita/${encodeURIComponent(slug)}` : `${window.location.origin}/berita`;
  };

  const handleShareWhatsApp = (item: BeritaItem) => {
    const url = getArticleUrl(item);
    const text = encodeURIComponent(
      `*${item.judul}*\n\n` +
      `${item.ringkasan}\n\n` +
      `Baca berita selengkapnya di Portal Resmi Desa Tugurejo:\n${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = (item?: BeritaItem) => {
    const target = item || activeArticle;
    const url = target ? getArticleUrl(target) : `${window.location.origin}/berita`;
    const copied = navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.resolve().then(() => {
      const area = document.createElement('textarea'); area.value = url; area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
    });
    copied.then(() => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }).catch(() => {});
  };

  const filteredBerita = useMemo(() => {
    return beritaList.filter((item) => {
      const matchCategory = selectedKategori === 'Semua' || item.kategori === selectedKategori;
      const matchSearch =
        (item.judul || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.ringkasan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.konten || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.penulis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [beritaList, selectedKategori, searchQuery]);

  const wordCount = useMemo(() => {
    return activeArticle?.konten ? activeArticle.konten.trim().split(/\s+/).length : 0;
  }, [activeArticle?.konten]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 180));
  }, [wordCount]);

  const relatedArticles = useMemo(() => {
    if (!activeArticle) return [];
    return beritaList
      .filter((b) => b.id !== activeArticle.id)
      .slice(0, 3);
  }, [activeArticle, beritaList]);

  // ═════════════════════════════════════════════════════════════
  // VIEW 1: FULL IMMERSIVE STANDALONE ARTICLE READER
  // ═════════════════════════════════════════════════════════════
  if (activeArticle) {
    const badgeTheme = getKategoriBadgeTheme(activeArticle.kategori);

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
        
        {/* Navigation Sticky Topbar */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Semua Berita</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Beranda</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleShareWhatsApp(activeArticle)}
                className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Bagikan ke WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Bagikan</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyLink(activeArticle)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Salin Tautan"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{copiedLink ? 'Tautan Tersalin' : 'Salin'}</span>
              </button>
            </div>

          </div>
        </header>

        {/* Article Body Container with Schema.org Semantic Microdata */}
        <main
          itemScope
          itemType="https://schema.org/NewsArticle"
          className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8"
        >
          {/* Hidden metadata for crawler indexing */}
          <meta itemProp="inLanguage" content="id-ID" />
          <meta itemProp="mainEntityOfPage" content={`${window.location.origin}/berita/${encodeURIComponent(activeArticle.slug || activeArticle.id)}`} />
          <meta itemProp="datePublished" content={activeArticle.publishedAt} />
          <meta itemProp="dateModified" content={activeArticle.publishedAt} />
          <meta itemProp="image" content={activeArticle.gambarUtama} />

          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto pb-1">
            <button onClick={onBack} className="hover:text-emerald-600 cursor-pointer">Beranda</button>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <button onClick={handleBackToList} className="hover:text-emerald-600 cursor-pointer">Warta Desa</button>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[200px] sm:max-w-xs">{activeArticle.judul}</span>
          </nav>

          {/* Article Header */}
          <header className="space-y-4">
            
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 ${badgeTheme.bg} ${badgeTheme.text} ${badgeTheme.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badgeTheme.dot}`}></span>
                <span itemProp="articleSection">{activeArticle.kategori}</span>
              </span>

              {activeArticle.isFeatured && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-slate-950" /> Berita Utama
                </span>
              )}

              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto">
                <Clock className="w-3.5 h-3.5" /> ±{readingTime} menit baca
              </span>
            </div>

            <h1 itemProp="headline" className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {activeArticle.judul}
            </h1>

            {/* Author & Published Info Row */}
            <div className="flex flex-wrap items-center gap-4 py-4 border-y border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <div itemProp="author" itemScope itemType="https://schema.org/Person" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  <User className="w-4 h-4" />
                </div>
                <span itemProp="name">{activeArticle.penulis}</span>
              </div>

              <span className="text-slate-300 dark:text-slate-700">•</span>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <time dateTime={activeArticle.publishedAt}>{activeArticle.publishedAt}</time>
              </div>

              <span className="text-slate-300 dark:text-slate-700">•</span>

              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>{activeArticle.views || 0} Pembaca</span>
              </div>
            </div>

          </header>

          {/* Hero Cover Image */}
          <figure className="space-y-2">
            <div className="w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 aspect-[16/9] bg-slate-950">
              <NewsImage
                src={activeArticle.gambarUtama}
                alt={activeArticle.judul}
                widthHint={1600}
                loading="eager"
                className="w-full h-full object-cover"
              />
            </div>
            {activeArticle.captionGambar && (
              <figcaption className="text-xs text-center text-slate-500 dark:text-slate-400 italic">
                {activeArticle.captionGambar}
              </figcaption>
            )}
          </figure>

          {/* Excerpt Lead Card */}
          {activeArticle.ringkasan && (
            <div itemProp="description" className="p-5 sm:p-6 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border-l-4 border-emerald-600 text-sm sm:text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-200 shadow-sm">
              {activeArticle.ringkasan}
            </div>
          )}

          {/* Main Formatted Article Content */}
          <div itemProp="articleBody" className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-sm sm:text-base">
            <SafeArticleRenderer text={activeArticle.konten} />
          </div>

          {/* Tags */}
          {activeArticle.tags && activeArticle.tags.length > 0 && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Topik &amp; Tagar Terkait:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {activeArticle.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-colors"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Sharing Footer Bar */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600/10 via-indigo-600/10 to-purple-600/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Bagikan Informasi Ini</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bantu sebarkan berita resmi Desa Tugurejo kepada warga lainnya.</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleShareWhatsApp(activeArticle)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button
                type="button"
                onClick={() => handleCopyLink(activeArticle)}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                {copiedLink ? 'Tersalin' : 'Salin Tautan'}
              </button>
            </div>
          </div>

          {/* Related Articles Section */}
          {relatedArticles.length > 0 && (
            <div className="pt-10 border-t border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500" /> Kabar Berita Terkait
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Informasi dan agenda desa lainnya yang menarik untuk dibaca</p>
                </div>
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {relatedArticles.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => handleOpenArticle(item)}
                    className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald-500/50 transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-slate-950">
                      <NewsImage
                        src={item.gambarUtama}
                        alt={item.judul}
                        widthHint={700}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{item.kategori}</span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                          {item.judul}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>{item.publishedAt}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.views || 0}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // VIEW 2: DEDICATED NEWS ARCHIVE & SEARCH LISTING (/berita)
  // ═════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-extrabold">
              <Newspaper className="w-4 h-4" />
              <span>Portal Warta Resmi Desa</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <button type="button" onClick={onBack} className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-white font-bold">Berita Desa</span>
        </nav>
        
        {/* Banner Title & Search Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Publikasi &amp; Transparansi Desa
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Warta &amp; Berita Desa Tugurejo
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Arsip lengkap kegiatan masyarakat, pelayanan publik, keamanan lingkungan, dan pembangunan desa.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari topik atau judul berita..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 shadow-sm transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {KATEGORI_LIST.map((kat) => {
            const isSel = selectedKategori === kat;
            return (
              <button
                key={kat}
                type="button"
                onClick={() => setSelectedKategori(kat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSel
                    ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {kat}
              </button>
            );
          })}
        </div>

        {/* News Grid */}
        {filteredBerita.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
              <Newspaper className="w-8 h-8 opacity-60" />
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">Tidak ada artikel berita yang ditemukan</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Silakan sesuaikan kata kunci pencarian atau pilih kategori berita lainnya.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBerita.map((item) => {
              const badgeTheme = getKategoriBadgeTheme(item.kategori);
              return (
                <article
                  key={item.id}
                  onClick={() => handleOpenArticle(item)}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                      <NewsImage
                        src={item.gambarUtama}
                        alt={item.judul}
                        widthHint={800}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                      
                      {/* Floating Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 shadow-sm truncate max-w-[65%]">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeTheme.dot}`}></span>
                          <span className="truncate">{item.kategori}</span>
                        </span>

                        {item.isFeatured && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                            <Star className="w-3 h-3 fill-slate-950" /> Utama
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item.publishedAt}</span>
                        <span>•</span>
                        <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[120px]">{item.penulis}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.judul}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.ringkasan}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Baca Lengkap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {item.views || 0}
                    </span>
                  </div>

                </article>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
