import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  where,
} from 'firebase/firestore';

const HOME_META = {
  title: 'Tentrem - Tugurejo Nyaman Tanggap Responsif Modern',
  description: 'Sistem informasi Poskamling RT 01 RW 01 Desa Tugurejo untuk mendukung keamanan lingkungan, jadwal ronda, informasi kegiatan, pengaduan warga, dan koordinasi keamanan.',
};

const PUBLIC_ORIGIN = process.env.PUBLIC_SITE_URL || 'https://tentrem.ponorogo.go.id';

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/': HOME_META,
  '/profil': {
    title: 'Profil Poskamling | TENTREM',
    description: 'Profil Poskamling RT 01 RW 01 Desa Tugurejo, sejarah, lingkungan, kegiatan, dan informasi keamanan warga.',
  },
  '/berita': {
    title: 'Berita & Kegiatan | TENTREM',
    description: 'Berita, pengumuman, agenda, dan kegiatan keamanan lingkungan Poskamling RT 01 RW 01 Tugurejo.',
  },
  '/aduan': {
    title: 'Pengaduan Warga | TENTREM',
    description: 'Sampaikan dan lacak pengaduan atau laporan warga terkait keamanan dan ketertiban lingkungan RT 01 RW 01 Tugurejo.',
  },
  '/struktur': {
    title: 'Struktur Poskamling | TENTREM',
    description: 'Struktur organisasi, susunan pengurus, kelompok ronda, dan pembagian tugas Poskamling RT 01 RW 01 Tugurejo.',
  },
  '/galeri': {
    title: 'Galeri Kegiatan | TENTREM',
    description: 'Dokumentasi kegiatan ronda malam, gotong royong, keamanan lingkungan, dan kegiatan Poskamling RT 01 RW 01 Tugurejo.',
  },
  '/kentongan': {
    title: 'Isyarat Kentongan | TENTREM',
    description: 'Pelajari tanda dan kode isyarat kentongan untuk komunikasi keamanan lingkungan serta gunakan simulator bunyi kentongan interaktif.',
  },
  '/peta': {
    title: 'Peta Desa Tugurejo | TENTREM',
    description: 'Peta digital lingkungan RT 01 RW 01 Tugurejo, lokasi Poskamling, fasilitas lingkungan, dan titik penting di sekitar wilayah.',
  },
  '/survei': {
    title: 'Kritik dan Saran | TENTREM',
    description: 'Isi survei kepuasan (kritik dan saran) terhadap kegiatan dan pelayanan Poskamling RT 01 RW 01 Tugurejo untuk membantu meningkatkan keamanan lingkungan.',
  },
  '/cuaca': {
    title: 'Prakiraan Cuaca | TENTREM',
    description: 'Prakiraan cuaca terkini untuk mendukung kesiapsiagaan kegiatan ronda malam dan keamanan lingkungan RT 01 RW 01 Tugurejo.',
  },
  '/jadwal-ronda': {
    title: 'Jadwal Ronda | TENTREM',
    description: 'Jadwal ronda malam, kelompok bertugas, Danpok, dan anggota ronda Poskamling RT 01 RW 01 Tugurejo.',
  },
  '/rincian-tugas': {
    title: 'Rincian Tugas | TENTREM',
    description: 'Rincian tugas dan tanggung jawab pengurus, kelompok ronda, dan anggota Poskamling RT 01 RW 01 Tugurejo.',
  },
  '/inventaris': {
    title: 'Inventaris Poskamling | TENTREM',
    description: 'Daftar aset, sarana, prasarana, dan perlengkapan yang tersedia di Poskamling RT 01 RW 01 Tugurejo.',
  },
};

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
};

function getDb() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app);
}

function firstQueryValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replaceMeta(html: string, attribute: 'name' | 'property', key: string, value: string): string {
  const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tagPattern = new RegExp(`<meta\\b[^>]*\\b${attribute}=["']${safeKey}["'][^>]*>`, 'i');
  const safeValue = escapeHtml(value);

  return html.replace(tagPattern, (tag) => {
    const contentPattern = /\bcontent\s*=\s*(["'])[^"']*\1/i;
    return contentPattern.test(tag)
      ? tag.replace(contentPattern, `content="${safeValue}"`)
      : tag.replace(/\/?\s*>$/, ` content="${safeValue}">`);
  });
}

function replaceCanonical(html: string, url: string): string {
  return html.replace(
    /<link\b[^>]*\brel=["']canonical["'][^>]*>/i,
    (tag) => tag.replace(/\bhref\s*=\s*(["'])[^"']*\1/i, `href="${escapeHtml(url)}"`)
  );
}

async function findPublishedArticle(slug: string) {
  if (!slug) return null;

  try {
    const db = getDb();
    const byId = await getDoc(doc(db, 'berita', slug));
    if (byId.exists() && byId.data().status === 'published') {
      return { id: byId.id, ...byId.data() } as Record<string, any>;
    }

    const result = await getDocs(query(collection(db, 'berita'), where('slug', '==', slug), limit(1)));
    const match = result.docs[0];
    if (match && match.data().status === 'published') {
      return { id: match.id, ...match.data() } as Record<string, any>;
    }
  } catch (error) {
    console.warn('[share-page] Article lookup failed:', error);
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestedPath = firstQueryValue(req.query.path) || '/';
  const path = requestedPath.startsWith('/') ? requestedPath : `/${requestedPath}`;
  const slug = decodeURIComponent(firstQueryValue(req.query.slug));
  const host = req.headers.host || '';
  const forwardedProto = firstQueryValue(req.headers['x-forwarded-proto']);
  const protocol = forwardedProto || (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host) ? 'http' : 'https');
  const requestOrigin = `${protocol}://${host}`;
  const isLocalRequest = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
  const publicOrigin = isLocalRequest ? requestOrigin : PUBLIC_ORIGIN;
  const article = path === '/berita' ? await findPublishedArticle(slug) : null;
  const routeMeta = PAGE_META[path] || HOME_META;
  const title = article?.judul ? `${article.judul} | TENTREM` : routeMeta.title;
  const description = article?.ringkasan || routeMeta.description;
  const canonicalPath = article
    ? `/berita/${encodeURIComponent(article.slug || article.id)}`
    : path;
  const canonicalUrl = `${publicOrigin}${canonicalPath}`;
  const imageUrl = article?.gambarUtama
    ? new URL(article.gambarUtama, publicOrigin).href
    : `${publicOrigin}/assets/tugurejo.webp`;

  try {
    const indexUrl = `${requestOrigin}/index.html`;
    const indexResponse = await fetch(indexUrl);
    if (!indexResponse.ok) throw new Error(`Could not load index.html (${indexResponse.status})`);

    let html = await indexResponse.text();
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(routeMeta.title)}</title>`);
    html = replaceMeta(html, 'name', 'description', description);
    html = replaceMeta(html, 'property', 'og:title', title);
    html = replaceMeta(html, 'property', 'og:description', description);
    html = replaceMeta(html, 'property', 'og:url', canonicalUrl);
    html = replaceMeta(html, 'property', 'og:image', imageUrl);
    html = replaceMeta(html, 'property', 'og:image:alt', title);
    html = replaceMeta(html, 'property', 'og:type', article ? 'article' : 'website');
    html = replaceMeta(html, 'name', 'twitter:title', title);
    html = replaceMeta(html, 'name', 'twitter:description', description);
    html = replaceMeta(html, 'name', 'twitter:image', imageUrl);
    html = replaceCanonical(html, canonicalUrl);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(html);
  } catch (error) {
    console.error('[share-page] HTML fallback failed:', error);
    return res.redirect(307, '/index.html');
  }
}
