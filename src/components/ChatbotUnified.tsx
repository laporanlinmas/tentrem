'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  getTentremText,
  prefetchTentremText,
  askChatbot,
  resetMemory,
} from '@/lib/tentrem-knowledge';
import {
  Send, X, Camera, Image as ImageIcon, User, Bot,
  MessageCircle, Clock, ExternalLink, AlertCircle,
  CheckCircle2, Trash2, Phone, Globe, Map, Megaphone, Play,
  Shield, Newspaper, GitBranch, Drum, LayoutDashboard,
  CloudSun, Package, ClipboardList, ShieldCheck, Star,
} from 'lucide-react';
import { FacebookIcon, XIcon, InstagramIcon, WhatsAppIcon, TikTokIcon } from './BrandIcons';

// ── Types ─────────────────────────────────────────────────────────────────────

type MsgRole = 'user' | 'bot';

interface ChatPhoto {
  file: File;
  preview: string;
}

interface ChatAction {
  label: string;
  payload: string;
  type: 'text' | 'link';
  icon?: React.ReactNode;
}

interface TicketInfo {
  ticket: string;
  nama: string;
  kategori: string;
  lokasi: string;
  deskripsi: string;
  status: string;
  catatan: string;
  updatedAt: string;
}

interface ChatMsg {
  role: MsgRole;
  text: string;
  photos?: ChatPhoto[];
  actions?: ChatAction[];
  ticketCard?: TicketInfo;
  waCard?: WaCardProps;
  waUrl?: string;
  waLabel?: string;
  ts?: string;
}

type ComplaintStep = 'nama' | 'kategori' | 'lokasi' | 'deskripsi' | 'foto';

interface ComplaintDraft {
  step: ComplaintStep;
  nama?: string;
  kategori?: string;
  lokasi?: string;
  deskripsi?: string;
  photos: ChatPhoto[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV_GRADIENT = 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)';

const QUICK_ACTIONS: ChatAction[] = [
  { label: '📢 Lapor Aduan Warga',      payload: '__navigate:aduan',      type: 'text', icon: <Megaphone size={13} /> },
  { label: '🌙 Lapor Ronda Malam',      payload: '__navigate:ronda',      type: 'text', icon: <Shield size={13} /> },
  { label: '🔍 Cek Status Tiket',       payload: 'cek status tiket',      type: 'text', icon: <Clock size={13} /> },
  { label: '📰 Warta & Berita Desa',    payload: '__navigate:berita',     type: 'text', icon: <Newspaper size={13} /> },
  { label: '📞 Hubungi Petugas Linmas', payload: 'hubungi petugas',       type: 'text', icon: <Phone size={13} /> },
];

// Quick actions for second row — halaman informasi
const QUICK_ACTIONS_INFO: ChatAction[] = [
  { label: '🗺️ Peta Wilayah',          payload: '__navigate:peta',        type: 'text', icon: <Map size={13} /> },
  { label: '🌤️ Cuaca BMKG',            payload: '__navigate:cuaca',       type: 'text', icon: <CloudSun size={13} /> },
  { label: '📅 Jadwal Ronda',           payload: '__navigate:jadwal-ronda',type: 'text', icon: <ClipboardList size={13} /> },
  { label: '🥁 Isyarat Kentongan',      payload: '__navigate:kentongan',   type: 'text', icon: <Drum size={13} /> },
  { label: '📷 Galeri Dokumentasi',     payload: '__navigate:galeri',      type: 'text', icon: <Camera size={13} /> },
];

// Quick actions untuk admin & info lanjutan
const QUICK_ACTIONS_ADMIN: ChatAction[] = [
  { label: '📋 Survei Kepuasan',        payload: '__navigate:survei',      type: 'text', icon: <Star size={13} /> },
  { label: '🏛️ Struktur Satkamling',   payload: '__navigate:struktur',    type: 'text', icon: <GitBranch size={13} /> },
  { label: '📦 Inventaris Poskamling',  payload: '__navigate:inventaris',  type: 'text', icon: <Package size={13} /> },
  { label: '🎬 Profil Desa & Video',    payload: '__navigate:profil',      type: 'text', icon: <Play size={13} /> },
  { label: '⚙️ Dashboard Admin',        payload: 'admin dashboard',        type: 'text', icon: <LayoutDashboard size={13} /> },
];

const KATEGORI_LIST = [
  'Ketertiban Umum',
  'Kebersihan & Sampah',
  'Kerusakan Fasilitas Umum',
  'Parkir Liar',
  'PKL & Gangguan Usaha',
  'Keamanan Lingkungan',
  'Lainnya / Aspirasi',
];

const LOKASI_LIST = [
  'Dusun Krajan',
  'Dusun Tugu',
  'Balai Desa Tugurejo',
  'Jl. Raya Slahung - Pacitan',
  'Poskamling Dusun Krajan',
  'Poskamling Dusun Tugu',
  'Lokasi Lainnya di Desa Tugurejo',
];

const STATUS_STYLE: Record<string, { color: string; bg: string; Icon: React.ElementType }> = {
  'Baru':     { color: '#3b82f6', bg: '#eff6ff', Icon: AlertCircle },
  'Diproses': { color: '#f59e0b', bg: '#fffbeb', Icon: Clock },
  'Selesai':  { color: '#10b981', bg: '#ecfdf5', Icon: CheckCircle2 },
  'Ditolak':  { color: '#ef4444', bg: '#fef2f2', Icon: X },
};

// ── Utilities ─────────────────────────────────────────────────────────────────

function timeNow(): string {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload  = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
  });
}

interface WaInfo { number: string; name: string; day: string; jadwal: string; }

/** Simulasi delay "mengetik" bot — proporsional dengan panjang jawaban */
function typingDelay(text: string): Promise<void> {
  const ms = Math.min(400 + text.length * 12, 2200);
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWa(): Promise<WaInfo | null> {
  try {
    const res = await fetch('/api/wa-number');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!d?.number) throw new Error('no number in response');
    return {
      number: d.number,
      name:   d.name   || 'Piket Satlinmas',
      day:    d.day    || '',
      jadwal: d.jadwal || '',
    };
  } catch (err) {
    console.error('[fetchWa]', err);
    return null;
  }
}

async function fetchTicket(ticket: string): Promise<TicketInfo | null> {
  try {
    const r  = await fetch(`/api/complaint-status?ticket=${encodeURIComponent(ticket)}`);
    const d  = await r.json();
    return d.found ? d : null;
  } catch { return null; }
}

// ── Sub-Components ────────────────────────────────────────────────────────────

function BubbleText({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n').filter(l => l.trim());
  return (
    <div className="space-y-1 leading-relaxed">
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) => {
              const b = part.match(/^\*\*(.+)\*\*$/);
              if (b) return <strong key={j} className="font-bold">{b[1]}</strong>;
              const it = part.match(/^\*(.+)\*$/);
              if (it) return <em key={j}>{it[1]}</em>;
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

function TicketCard({ info }: { info: TicketInfo }) {
  const cfg = STATUS_STYLE[info.status] ?? STATUS_STYLE['Baru'];
  const Icon = cfg.Icon;
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
        <span className="font-mono text-[11px] font-bold text-slate-500">{info.ticket}</span>
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: cfg.bg, color: cfg.color }}>
          <Icon size={11} />{info.status}
        </span>
      </div>
      <div className="p-3 space-y-1.5 text-xs text-slate-600">
        <div className="flex gap-2"><span className="text-slate-400 w-14 shrink-0">Pelapor</span><span className="font-medium">{info.nama}</span></div>
        <div className="flex gap-2"><span className="text-slate-400 w-14 shrink-0">Lokasi</span><span className="font-medium">{info.lokasi}</span></div>
        <div className="flex gap-2"><span className="text-slate-400 w-14 shrink-0">Hal</span><span className="font-medium italic">"{info.deskripsi}"</span></div>
        {info.catatan && (
          <div className="mt-1.5 p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-[11px]">
            <span className="font-bold">Respons petugas:</span> {info.catatan}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButtons({ actions, onAction }: { actions: ChatAction[]; onAction: (a: ChatAction) => void }) {
  return (
    <div className="mt-2.5 grid grid-cols-2 gap-1.5">
      {actions.map((act, i) => (
        <button key={i} onClick={() => onAction(act)}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-400 hover:text-blue-600 active:scale-95 truncate">
          <span className="shrink-0">{act.icon}</span>
          <span className="truncate">{act.label}</span>
          {act.type === 'link' && <ExternalLink size={10} className="shrink-0 ml-auto" />}
        </button>
      ))}
    </div>
  );
}

interface WaCardProps {
  name: string;
  day?: string;
  jadwal?: string;
  waUrl: string;
  label?: string;
  number?: string;
}
function WaCard({ name, waUrl, day, jadwal }: WaCardProps) {
  return (
    <div className="mt-3 rounded-xl border border-green-200 bg-green-50 overflow-hidden shadow-sm">
      <div className="px-3 py-2 border-b border-green-100 flex items-center gap-2">
        <Phone size={13} className="text-green-600 shrink-0" />
        <span className="text-[11px] font-bold text-green-800">Petugas Piket Siaga</span>
      </div>
      <div className="p-3 text-xs text-slate-700 space-y-1">
        <div className="flex gap-2"><span className="text-slate-400 w-14 shrink-0">Nama</span><span className="font-semibold">{name}</span></div>
        {day && <div className="flex gap-2"><span className="text-slate-400 w-14 shrink-0">Jadwal</span><span>{day} {jadwal ? `(${jadwal})` : ''}</span></div>}
      </div>
      <div className="px-3 pb-3">
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2 text-xs font-bold text-white hover:bg-[#1ebe5d] transition-colors">
          <Phone size={13} />Chat via WhatsApp
        </a>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Bot size={15} />
      </div>
      <div className="rounded-2xl rounded-tl-none bg-white border border-slate-100 px-4 py-3 shadow-sm">
        <div className="flex gap-1.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}


// ── Main Component ────────────────────────────────────────────────────────────

export default function ChatbotUnified({
  opened,
  onToggle,
  onNavigate,
}: {
  opened?: boolean;
  onToggle?: (v: boolean) => void;
  onNavigate?: (v: string) => void;
}) {
  const [messages, setMessages]         = useState<ChatMsg[]>([]);
  const [input, setInput]               = useState('');
  const [isBusy, setIsBusy]             = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<ChatPhoto[]>([]);
  const [activeStep, setActiveStep]     = useState<ComplaintStep | null>(null);

  const listRef    = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const draftRef   = useRef<ComplaintDraft | null>(null);
  const prevOpened = useRef(false);

  const isOpen = opened === true;

  // ── helpers ──────────────────────────────────────────────────────────────
  const addMsg = useCallback((role: MsgRole, text: string, extra?: Partial<ChatMsg>) => {
    setMessages(prev => [...prev, { role, text, ts: timeNow(), ...extra }]);
  }, []);

  const clearPhotos = useCallback(() => {
    setPendingPhotos(prev => { prev.forEach(p => URL.revokeObjectURL(p.preview)); return []; });
  }, []);

  // ── open / close lifecycle + scroll lock ────────────────────────────────
  useEffect(() => {
    if (isOpen && !prevOpened.current) {
      setMessages([{
        role: 'bot',
        text: 'Halo! Saya **Asisten Virtual TENTREM** — *Tugurejo Nyaman Tanggap Responsif Modern*. 👋\n\nAda yang bisa saya bantu?',
        actions: [
          ...QUICK_ACTIONS,
          { label: '📋 Semua Layanan', payload: 'semua menu', type: 'text', icon: <ShieldCheck size={13} /> },
        ],
        ts: timeNow(),
      }]);
      prefetchTentremText();
      resetMemory();
    }

    if (!isOpen && prevOpened.current) {
      draftRef.current = null;
      setActiveStep(null);
      clearPhotos();
      resetMemory();
    }
    prevOpened.current = isOpen;
  }, [isOpen, clearPhotos]);

  // ── Block scroll di background saat chatbot terbuka (mobile) ─────────────
  useEffect(() => {
    if (!isOpen) return;

    const prevent = (e: TouchEvent) => {
      // Izinkan scroll di dalam chat window sendiri
      const chatEl = document.querySelector('[data-chatbot-scroll]');
      if (chatEl && chatEl.contains(e.target as Node)) return;
      e.preventDefault();
    };

    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, [isOpen]);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isBusy, isOpen]);

  // Auto-focus input saat chat dibuka di desktop
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePhotoSelect = (files: FileList | null) => {
    if (!files) return;
    const remaining = 3 - pendingPhotos.length;
    Array.from(files).slice(0, remaining).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const preview = URL.createObjectURL(file);
      setPendingPhotos(prev => [...prev, { file, preview }]);
    });
  };

  const removePhoto = (idx: number) => {
    setPendingPhotos(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const cancelComplaint = () => {
    draftRef.current = null;
    setActiveStep(null);
    clearPhotos();
    addMsg('bot', 'Pengisian laporan pengaduan dibatalkan. Ada hal lain yang bisa saya bantu?', {
      actions: QUICK_ACTIONS,
    });
  };

  // ── Submit final complaint ke API ─────────────────────────────────────────
  const finalizeComplaint = async (draft: ComplaintDraft) => {
    setIsBusy(true);
    addMsg('bot', 'Sedang mengirim laporan pengaduan Anda ke sistem TENTREM...');

    try {
      const photosBase64 = await Promise.all(
        draft.photos.map(async p => ({
          base64: await fileToBase64(p.file),
          mime: p.file.type,
        }))
      );

      const res = await fetch('/api/submit-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama:      draft.nama,
          kategori:  draft.kategori,
          lokasi:    draft.lokasi,
          deskripsi: draft.deskripsi,
          photos:    photosBase64,
          source:    'Chatbot',
        }),
      });

      const data = await res.json();

      if (res.ok && data.ticketNumber) {
        draftRef.current = null;
        setActiveStep(null);
        clearPhotos();

        addMsg('bot', `Laporan Anda berhasil dikirim dengan Nomor Tiket Resmi:\n\n**${data.ticketNumber}**\n\nSimpan nomor tiket ini untuk memantau proses tindak lanjut oleh petugas Satlinmas Desa Tugurejo.`, {
          actions: [
            { label: 'Cek Status Tiket', payload: `cek tiket ${data.ticketNumber}`, type: 'text', icon: <Clock size={13} /> },
            { label: 'Buat Aduan Baru', payload: 'lapor', type: 'text', icon: <AlertCircle size={13} /> },
          ],
        });
      } else {
        throw new Error(data.error || 'Gagal mengirim laporan.');
      }
    } catch (err: any) {
      addMsg('bot', `Terjadi kesalahan saat mengirim laporan: ${err.message}. Silakan coba lagi.`);
    } finally {
      setIsBusy(false);
    }
  };

  // ── Step-by-step Complaint wizard ─────────────────────────────────────────
  const processComplaintStep = async (userText: string) => {
    const draft = draftRef.current;
    if (!draft) return;

    if (/^batal\b/i.test(userText.trim())) {
      cancelComplaint();
      return;
    }

    switch (draft.step) {
      case 'nama': {
        const trimmed = userText.trim();
        if (trimmed.length < 2) {
          addMsg('bot', 'Mohon masukkan nama lengkap yang valid:');
          return;
        }
        draft.nama = trimmed;
        draft.step = 'kategori';
        setActiveStep('kategori');
        addMsg('bot', `Terima kasih, Pak/Bu **${trimmed}**.\n\nPilih kategori pengaduan di bawah ini:`, {
          actions: KATEGORI_LIST.map(k => ({ label: k, payload: k, type: 'text' })),
        });
        break;
      }

      case 'kategori': {
        draft.kategori = userText.trim();
        draft.step = 'lokasi';
        setActiveStep('lokasi');
        addMsg('bot', `Kategori: **${draft.kategori}**\n\nDi mana lokasi kejadiannya? Anda dapat memilih atau mengetikkan alamat detail:`, {
          actions: LOKASI_LIST.map(l => ({ label: l, payload: l, type: 'text' })),
        });
        break;
      }

      case 'lokasi': {
        draft.lokasi = userText.trim();
        draft.step = 'deskripsi';
        setActiveStep('deskripsi');
        addMsg('bot', `Lokasi: **${draft.lokasi}**\n\nSilakan ceritakan permasalahan/kejadian yang ingin dilaporkan secara jelas:`);
        break;
      }

      case 'deskripsi': {
        const desc = userText.trim();
        if (desc.length < 10) {
          addMsg('bot', 'Mohon berikan uraian kejadian yang lebih jelas (minimal 10 karakter):');
          return;
        }
        draft.deskripsi = desc;
        draft.step = 'foto';
        setActiveStep('foto');
        addMsg('bot', 'Uraian kejadian dicatat.\n\nApakah ada foto bukti yang ingin dilampirkan? (Maksimal 3 foto)\n\nGunakan tombol kamera/galeri di bawah, atau ketik **"Lewati"** jika tidak ada foto.', {
          actions: [
            { label: 'Lewati Foto & Kirim', payload: 'lewati', type: 'text', icon: <CheckCircle2 size={13} /> },
            { label: 'Batalkan Laporan', payload: 'batal', type: 'text', icon: <X size={13} /> },
          ],
        });
        break;
      }

      case 'foto': {
        if (/^lewati\b|^kirim\b|^tanpa foto\b|^tidak ada\b/i.test(userText.trim())) {
          await finalizeComplaint(draft);
        } else {
          addMsg('bot', 'Silakan lampirkan foto menggunakan ikon kamera di bawah, atau klik **"Lewati Foto & Kirim"** untuk langsung mengirim laporan.', {
            actions: [
              { label: 'Lewati Foto & Kirim', payload: 'lewati', type: 'text', icon: <CheckCircle2 size={13} /> },
              { label: 'Batalkan Laporan', payload: 'batal', type: 'text', icon: <X size={13} /> },
            ],
          });
        }
        break;
      }
    }
  };

  // ── Message send dispatcher ───────────────────────────────────────────────
  const onSend = async (overrideText?: string) => {
    const raw = overrideText !== undefined ? overrideText : input;
    const text = raw.trim();
    if (!text && pendingPhotos.length === 0) return;
    if (isBusy) return;

    if (overrideText === undefined) setInput('');

    // If there are pending photos attached to current draft
    const photosToSend = [...pendingPhotos];
    clearPhotos();

    if (overrideText === undefined) {
      addMsg('user', text || '(Mengunggah foto...)', {
        photos: photosToSend.length > 0 ? photosToSend : undefined,
      });
    }

    // ── If in Complaint Wizard mode ──
    if (draftRef.current) {
      if (draftRef.current.step === 'foto' && photosToSend.length > 0) {
        draftRef.current.photos.push(...photosToSend);
        await finalizeComplaint(draftRef.current);
        return;
      }
      await processComplaintStep(text);
      return;
    }

    // ── Normal Q&A / Routing Mode ──
    setIsBusy(true);

    try {
      // Direct ticket check
      const ticketMatch = text.match(/ADU-\d{6}-\d{4}/i);
      if (ticketMatch) {
        const ticketId = ticketMatch[0].toUpperCase();
        addMsg('bot', `🔍 Mencari status laporan untuk tiket **${ticketId}**...`);
        const info = await fetchTicket(ticketId);
        if (info) {
          addMsg('bot', `✅ Berikut rincian laporan pengaduan Anda:`, { ticketCard: info });
        } else {
          addMsg('bot', `❌ Laporan dengan tiket **${ticketId}** tidak ditemukan. Pastikan format nomor tiket sudah benar (contoh: ADU-260821-0001).`);
        }
        return;
      }

      // Cek tiket tanpa nomor
      if (/cek tiket|cek status|lacak tiket|lacak laporan|status laporan/i.test(text) && !ticketMatch) {
        addMsg('bot', '🔍 Silakan masukkan **Nomor Tiket** Anda untuk cek status laporan.\n\nFormat nomor tiket: `ADU-YYMMDD-XXXX`\nContoh: `ADU-260821-0001`\n\nAtau buka halaman Pengaduan tab **Lacak Status** untuk melacak laporan:', {
          actions: [
            { label: 'Buka Lacak Status', payload: '__navigate:aduan', type: 'text', icon: <Clock size={13} /> },
          ],
        });
        return;
      }

      // Start complaint wizard
      if (/^(lapor|buat laporan|buat aduan|laporkan|aduan baru|laporan baru)$/i.test(text)) {
        draftRef.current = { step: 'nama', photos: [] };
        setActiveStep('nama');
        addMsg('bot', '📝 Baik, mari kita buat **laporan pengaduan baru** melalui chatbot.\n\nSilakan masukkan **Nama Lengkap** Anda:');
        return;
      }

      // Contact officer
      if (/hubungi|petugas|kontak|piket|telepon|wa linmas|whatsapp petugas|nomor linmas/i.test(text) && !/apa itu|tentang/i.test(text)) {
        addMsg('bot', '📞 Menghubungkan dengan kontak Petugas Piket Satlinmas...');
        const wa = await fetchWa();
        if (wa) {
          const waMsg = encodeURIComponent('Halo Petugas Satlinmas Desa Tugurejo, saya ingin meminta bantuan / informasi.');
          addMsg(
            'bot',
            `✅ Petugas Piket Siaga:\n**${wa.name}**\n${wa.day ? `Jadwal: ${wa.day} (${wa.jadwal})` : ''}\n\nSilakan klik tombol di bawah untuk chat langsung via WhatsApp:`,
            {
              waCard: {
                name: wa.name,
                number: wa.number,
                jadwal: wa.day ? `${wa.day} · ${wa.jadwal}` : 'Siaga 24 Jam',
                waUrl: `https://wa.me/${wa.number}?text=${waMsg}`,
                label: `Chat via WhatsApp`,
              },
            }
          );
        } else {
          addMsg('bot', '⚠️ Gagal mengambil data petugas dari server. Pastikan koneksi internet aktif, lalu coba lagi.');
        }
        return;
      }

      // ── Smart routing with Direct Actions ────────────────────────────────

      // 1. Ronda Malam & Poskamling
      if (/ronda|siskamling|poskamling|patroli|danpok|jadwal ronda|kelompok ronda|lapor ronda|ronda malam/i.test(text)) {
        addMsg('bot', '🌙 Layanan **Laporan Ronda Malam Poskamling** TENTREM:\n• Verifikasi sandi Danpok (Komandan Kelompok) wajib\n• Foto otomatis distempel watermark GPS + nama Danpok + waktu\n• 1 hari 1 laporan per poskamling\n• Tersinkron real-time ke Web Admin', {
          actions: [
            { label: 'Buka Halaman Lapor Ronda', payload: '__navigate:ronda', type: 'text', icon: <Shield size={13} /> },
            { label: 'Jadwal & Status Ronda', payload: '__navigate:jadwal-ronda', type: 'text', icon: <ClipboardList size={13} /> },
          ],
        });
        return;
      }

      // 2. Pengaduan / Aduan Masyarakat
      if (/pengaduan|aduan|lapor|laporkan|komplain|keluhan|buat laporan/i.test(text) && !/ronda|malam/i.test(text)) {
        addMsg('bot', '📢 Layanan **Kanal Pengaduan Warga** TENTREM tersedia 24 jam. Anda bisa buat laporan langsung via form atau dipandu chatbot ini:', {
          actions: [
            { label: 'Buka Halaman Pengaduan', payload: '__navigate:aduan', type: 'text', icon: <Megaphone size={13} /> },
            { label: 'Lapor via Chatbot', payload: 'lapor', type: 'text', icon: <AlertCircle size={13} /> },
            { label: 'Cek Status Tiket', payload: 'cek status tiket', type: 'text', icon: <Clock size={13} /> },
          ],
        });
        return;
      }

      // 3. Warta & Berita Desa
      if (/berita|warta|kabar|pengumuman|agenda|artikel desa/i.test(text)) {
        addMsg('bot', '📰 **Warta & Berita Desa Tugurejo** — publikasi resmi agenda desa, gotong royong, kegiatan Satlinmas, dan transparansi pembangunan yang terindeks Google News.', {
          actions: [
            { label: 'Lihat Semua Berita', payload: '__navigate:berita', type: 'text', icon: <Newspaper size={13} /> },
          ],
        });
        return;
      }

      // 4. Peta Wilayah
      if (/peta|map|batas dusun|wilayah desa|zona kerawanan|titik poskamling|peta digital/i.test(text)) {
        addMsg('bot', '🗺️ **Peta Wilayah Digital** Desa Tugurejo — batas dusun Krajan & Tugu, titik poskamling, sarana umum, dan zona mitigasi bencana.', {
          actions: [{ label: 'Buka Peta Wilayah', payload: '__navigate:peta', type: 'text', icon: <Map size={13} /> }],
        });
        return;
      }

      // 5. Cuaca BMKG
      if (/cuaca|bmkg|hujan|suhu|prakiraan|panas|angin|kelembaban|cuaca ekstrem/i.test(text)) {
        addMsg('bot', '🌤️ **Prakiraan Cuaca BMKG** real-time untuk wilayah Tugurejo Slahung: suhu, kelembaban, kecepatan angin, kondisi langit, dan peringatan dini cuaca ekstrem.', {
          actions: [{ label: 'Cek Cuaca BMKG', payload: '__navigate:cuaca', type: 'text', icon: <CloudSun size={13} /> }],
        });
        return;
      }

      // 6. Kentongan
      if (/kentongan|isyarat kentongan|kode kentongan|bunyi kentongan|pukulan/i.test(text)) {
        addMsg('bot', '🥁 **Isyarat Kentongan** Desa Tugurejo — 7 kode bunyi kentongan tradisional beserta simulator akustik interaktif yang bisa dimainkan langsung.', {
          actions: [{ label: 'Lihat Isyarat Kentongan', payload: '__navigate:kentongan', type: 'text', icon: <Drum size={13} /> }],
        });
        return;
      }

      // 7. Galeri
      if (/galeri|foto ronda|dokumentasi|album|arsip foto|gambar kegiatan/i.test(text)) {
        addMsg('bot', '📷 **Galeri Dokumentasi** Desa Tugurejo — arsip foto ronda malam, gotong royong, kegiatan Satlinmas, dan momen kemasyarakatan desa.', {
          actions: [{ label: 'Lihat Galeri', payload: '__navigate:galeri', type: 'text', icon: <Camera size={13} /> }],
        });
        return;
      }

      // 8. Struktur Organisasi
      if (/struktur|bagan|organisasi|komando|jabatan satlinmas|hierarki|susunan/i.test(text)) {
        addMsg('bot', '🏛️ **Struktur Satkamling** Desa Tugurejo — bagan komando lengkap, nama, jabatan, foto, dan uraian tugas seluruh anggota Satlinmas.', {
          actions: [{ label: 'Lihat Struktur', payload: '__navigate:struktur', type: 'text', icon: <GitBranch size={13} /> }],
        });
        return;
      }

      // 9. Profil Desa & Video
      if (/profil|video profil|sejarah desa|tentang desa|gambaran desa/i.test(text)) {
        addMsg('bot', '🎬 **Profil Desa & Video** TENTREM — gambaran lengkap Desa Tugurejo, sejarah, visi-misi, profil Ahmad Basith (inovator), dan video profil desa.', {
          actions: [{ label: 'Lihat Profil Desa', payload: '__navigate:profil', type: 'text', icon: <Play size={13} /> }],
        });
        return;
      }

      // 10. Survei / IKM
      if (/survei|ikm|kepuasan|evaluasi|kuesioner|kritik saran|penilaian layanan/i.test(text)) {
        addMsg('bot', '📋 **Survei Kepuasan Masyarakat (IKM)** — isi formulir digital untuk menilai mutu layanan desa dalam 5 indikator: Kemudahan, Kemanfaatan, Kecepatan, Keakuratan, dan Rekomendasi.', {
          actions: [{ label: 'Isi Survei IKM', payload: '__navigate:survei', type: 'text', icon: <Star size={13} /> }],
        });
        return;
      }

      // 11. Inventaris
      if (/inventaris|aset poskamling|peralatan|perlengkapan ronda|fasilitas poskamling/i.test(text)) {
        addMsg('bot', '📦 **Inventaris Aset Poskamling** — catatan dan manajemen aset peralatan Satlinmas Desa Tugurejo: tongkat, senter, kentongan, P3K, dan perlengkapan patroli.', {
          actions: [{ label: 'Lihat Inventaris', payload: '__navigate:inventaris', type: 'text', icon: <Package size={13} /> }],
        });
        return;
      }

      // 12. Jadwal Ronda / Smart Poskamling
      if (/jadwal|smart poskamling|giliran|shift piket|jadwal piket/i.test(text) && !/lapor ronda/i.test(text)) {
        addMsg('bot', '📅 **Jadwal Ronda (Smart Poskamling)** — jadwal ronda malam harian digital, kelompok bertugas, nama Danpok aktif, dan status kehadiran ronda terkini.', {
          actions: [{ label: 'Lihat Jadwal Ronda', payload: '__navigate:jadwal-ronda', type: 'text', icon: <ClipboardList size={13} /> }],
        });
        return;
      }

      // 13. Rincian Tugas / Tupoksi
      if (/tupoksi|rincian tugas|tugas pokok|fungsi jabatan|uraian tugas/i.test(text)) {
        addMsg('bot', '📌 **Rincian Tugas (Tupoksi)** — detail tugas pokok dan fungsi setiap jabatan dalam struktur Satlinmas Desa Tugurejo, dari komandan hingga anggota.', {
          actions: [{ label: 'Lihat Rincian Tugas', payload: '__navigate:rincian-tugas', type: 'text', icon: <ClipboardList size={13} /> }],
        });
        return;
      }

      // 14. Admin Dashboard
      if (/admin|dashboard|web admin|login admin|panel admin|administrator/i.test(text)) {
        addMsg('bot', '⚙️ **Dashboard Web Admin TENTREM** adalah panel kontrol terpusat untuk Petugas Satlinmas & Admin Desa.\n\nFitur: verifikasi aduan, monitoring ronda, manajemen personil, berita, survei, inventaris, dan laporan resmi (PDF/Excel/DOCX).\n\n*Login menggunakan akun resmi dari Administrator Sistem.*', {
          actions: [
            { label: 'Buka Dashboard Admin', payload: 'https://tentrem.vercel.app', type: 'link', icon: <LayoutDashboard size={13} /> },
          ],
        });
        return;
      }

      // 15. Video profil
      if (/video|youtube|tonton/i.test(text) && !/galeri/i.test(text)) {
        addMsg('bot', '🎬 Video profil dan dokumentasi visual Desa Tugurejo tersedia di halaman Profil Desa.', {
          actions: [{ label: 'Tonton Video Profil', payload: '__navigate:profil', type: 'text', icon: <Play size={13} /> }],
        });
        return;
      }

      // 16. Semua Layanan / Menu
      if (/semua menu|semua layanan|apa saja|daftar layanan|fitur apa|menu apa/i.test(text)) {
        addMsg('bot', '📋 Semua layanan **TENTREM** (*Tugurejo Nyaman Tanggap Responsif Modern*) Desa Tugurejo:', {
          actions: [
            { label: '📢 Kanal Pengaduan', payload: '__navigate:aduan', type: 'text', icon: <Megaphone size={13} /> },
            { label: '🌙 Lapor Ronda', payload: '__navigate:ronda', type: 'text', icon: <Shield size={13} /> },
            { label: '📰 Berita Desa', payload: '__navigate:berita', type: 'text', icon: <Newspaper size={13} /> },
            { label: '🗺️ Peta Wilayah', payload: '__navigate:peta', type: 'text', icon: <Map size={13} /> },
            { label: '🌤️ Cuaca BMKG', payload: '__navigate:cuaca', type: 'text', icon: <CloudSun size={13} /> },
            { label: '🥁 Kentongan', payload: '__navigate:kentongan', type: 'text', icon: <Drum size={13} /> },
            { label: '📷 Galeri', payload: '__navigate:galeri', type: 'text', icon: <Camera size={13} /> },
            { label: '🏛️ Struktur', payload: '__navigate:struktur', type: 'text', icon: <GitBranch size={13} /> },
            { label: '📦 Inventaris', payload: '__navigate:inventaris', type: 'text', icon: <Package size={13} /> },
            { label: '📋 Survei IKM', payload: '__navigate:survei', type: 'text', icon: <Star size={13} /> },
            { label: '📅 Jadwal Ronda', payload: '__navigate:jadwal-ronda', type: 'text', icon: <ClipboardList size={13} /> },
            { label: '🎬 Profil Desa', payload: '__navigate:profil', type: 'text', icon: <Play size={13} /> },
          ],
        });
        return;
      }

      // 17. Media Sosial & Kontak Resmi
      if (/instagram|ig\b/i.test(text)) {
        addMsg('bot', '📸 Instagram resmi Satlinmas Ponorogo:', {
          actions: [{ label: '@satlinmas_ponorogo', payload: 'https://instagram.com/satlinmas_ponorogo', type: 'link', icon: <InstagramIcon size={13} /> }],
        });
        return;
      }

      if (/facebook|fb\b/i.test(text)) {
        addMsg('bot', '👍 Facebook resmi Satpol PP Ponorogo:', {
          actions: [{ label: 'Facebook Satpol PP Ponorogo', payload: 'https://www.facebook.com/people/Satpol-PP-Kabupaten-Ponorogo/100067181276904/#', type: 'link', icon: <FacebookIcon size={13} /> }],
        });
        return;
      }

      if (/tiktok|tik tok/i.test(text)) {
        addMsg('bot', '🎵 TikTok resmi Satpol PP Ponorogo:', {
          actions: [{ label: '@satpol.pp.ponorogo', payload: 'https://www.tiktok.com/@satpol.pp.ponorogo', type: 'link', icon: <TikTokIcon size={13} /> }],
        });
        return;
      }

      if (/twitter|x\.com|\btweet/i.test(text)) {
        addMsg('bot', '𝕏 X/Twitter resmi Satpol PP Ponorogo:', {
          actions: [{ label: '@SatpolppPonoro1', payload: 'https://x.com/SatpolppPonoro1', type: 'link', icon: <XIcon size={13} /> }],
        });
        return;
      }

      if (/whatsapp|wa\b|nomor wa|kontak wa/i.test(text) && !/hubungi|petugas/i.test(text)) {
        addMsg('bot', '💬 WhatsApp resmi Satpol PP Kabupaten Ponorogo:', {
          actions: [{ label: 'WhatsApp Satpol PP Ponorogo', payload: 'https://wa.me/6282337017307', type: 'link', icon: <WhatsAppIcon size={13} /> }],
        });
        return;
      }

      if (/sosmed|sosial media|media sosial|socmed|semua medsos/i.test(text)) {
        addMsg('bot', '🌐 Media sosial resmi Satpol PP & Satlinmas Ponorogo:', {
          actions: [
            { label: 'Instagram', payload: 'https://instagram.com/satlinmas_ponorogo', type: 'link', icon: <InstagramIcon size={13} /> },
            { label: 'Facebook', payload: 'https://www.facebook.com/people/Satpol-PP-Kabupaten-Ponorogo/100067181276904/#', type: 'link', icon: <FacebookIcon size={13} /> },
            { label: 'TikTok', payload: 'https://www.tiktok.com/@satpol.pp.ponorogo', type: 'link', icon: <TikTokIcon size={13} /> },
            { label: 'X / Twitter', payload: 'https://x.com/SatpolppPonoro1', type: 'link', icon: <XIcon size={13} /> },
          ],
        });
        return;
      }

      if (/satpol pp|satpolpp|website resmi|web resmi satpol/i.test(text)) {
        addMsg('bot', '🏛️ Website resmi Satpol PP Kabupaten Ponorogo:', {
          actions: [{ label: 'satpolpp.ponorogo.go.id', payload: 'https://satpolpp.ponorogo.go.id', type: 'link', icon: <Globe size={13} /> }],
        });
        return;
      }

      // Fallback: Knowledge Base
      const answer = await askChatbot(text);
      await typingDelay(answer);
      // Tambahkan quick actions pada fallback agar tetap interaktif
      addMsg('bot', answer, {
        actions: answer.includes('Maaf') ? QUICK_ACTIONS : undefined,
      });

    } finally {
      setIsBusy(false);
      if (!draftRef.current) clearPhotos();
    }
  };

  const handleAction = (act: ChatAction) => {
    if (act.type === 'link') {
      window.open(act.payload, '_blank', 'noopener,noreferrer');
      return;
    }
    if (act.payload.startsWith('__scroll:')) {
      const id = act.payload.replace('__scroll:', '');
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      // Tutup chatbot agar pengguna bisa melihat konten yang di-scroll
      setTimeout(() => onToggle?.(false), 300);
      return;
    }
    if (act.payload.startsWith('__navigate:')) {
      const route = act.payload.replace('__navigate:', '');
      if (onNavigate) {
        onNavigate(route);
      } else {
        window.location.href = `/${route}`;
      }
      setTimeout(() => onToggle?.(false), 300);
      return;
    }
    addMsg('user', act.label, { ts: timeNow() });
    onSend(act.payload);
  };


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Mobile backdrop — tanpa backdrop-filter agar tidak ada compositing artifact ── */}
      <div
        className={`sm:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 999,
          background: 'rgba(0,0,0,0.5)',
          willChange: 'opacity',
        }}
        onClick={() => onToggle?.(false)}
        aria-hidden
      />

      {/* ── Trigger button ── */}
      <button
        onClick={() => onToggle?.(true)}
        aria-label="Buka Chatbot TENTREM"
        className={`fixed bottom-5 right-5 z-[1000] flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl transition-all duration-500 hover:scale-110 active:scale-95 ${
          isOpen ? 'pointer-events-none scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{ background: NAV_GRADIENT }}
      >
        <MessageCircle size={22} />
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold shadow-sm">1</span>
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-20 pointer-events-none" />
      </button>

      {/* ── Chat window ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[1001] flex flex-col overflow-hidden bg-white
          rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.18)]
          sm:bottom-5 sm:left-auto sm:right-5 sm:w-[400px] sm:h-[680px] sm:max-h-[92vh] sm:rounded-3xl sm:shadow-[0_20px_60px_rgba(0,0,0,0.25)]
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{
          height: '85dvh',
          willChange: 'transform',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: isOpen
            ? 'opacity 250ms ease, transform 300ms cubic-bezier(0.22,1,0.36,1)'
            : 'opacity 200ms ease, transform 250ms ease-in',
        }}
      >

        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 bg-white shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <header className="relative flex shrink-0 items-center gap-3 px-5 py-4 text-white shadow-md sm:rounded-t-3xl" style={{ background: NAV_GRADIENT }}>
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20">
              <Bot size={22} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1e3a8a] bg-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold leading-tight tracking-tight">Asisten Virtual TENTREM</h2>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-blue-200 mt-0.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shrink-0" />
              Desa Tugurejo · Satlinmas Siaga 24 Jam
            </p>
          </div>
          <button
            onClick={() => onToggle?.(false)}
            className="rounded-lg bg-white/10 p-1.5 transition-colors hover:bg-white/20"
            aria-label="Tutup chatbot"
          >
            <X size={18} />
          </button>
        </header>

        {/* Message area */}
        <div
          ref={listRef}
          data-chatbot-scroll
          className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 space-y-5 custom-scrollbar"
          style={{ backgroundImage: 'radial-gradient(#e2e8f0 0.5px, transparent 0.5px)', backgroundSize: '14px 14px' }}
        >
          {messages.map((m, i) => (
            <div key={i}
              className={`flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>

              {/* Avatar */}
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                m.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-blue-600'
              }`}>
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[84%] space-y-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  m.role === 'user'
                    ? 'rounded-tr-none bg-blue-600 text-white'
                    : 'rounded-tl-none bg-white border border-slate-100 text-slate-800'
                }`}>

                  {m.photos && m.photos.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {m.photos.map((p, pi) => (
                        <img key={pi} src={p.preview} alt="" className="h-20 w-20 rounded-lg object-cover border border-black/5" />
                      ))}
                    </div>
                  )}

                  <BubbleText text={m.text} />

                  {m.ticketCard && <TicketCard info={m.ticketCard} />}

                  {m.waCard && (
                    <WaCard
                      name={m.waCard.name}
                      day={m.waCard.day}
                      jadwal={m.waCard.jadwal}
                      waUrl={m.waCard.waUrl}
                      label={m.waCard.label}
                    />
                  )}
                </div>

                {m.actions && !isBusy && <ActionButtons actions={m.actions} onAction={handleAction} />}

                <span className="px-1 text-[10px] text-slate-400">{m.ts}</span>
              </div>
            </div>
          ))}

          {/* Kategori chips */}
          {!isBusy && activeStep === 'kategori' && (
            <div className="ml-9 flex flex-wrap gap-1.5">
              {KATEGORI_LIST.map(k => (
                <button key={k} onClick={() => onSend(k)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600">
                  {k}
                </button>
              ))}
            </div>
          )}

          {/* Lokasi chips */}
          {!isBusy && activeStep === 'lokasi' && (
            <div className="ml-9 flex flex-wrap gap-1.5">
              {LOKASI_LIST.map(l => (
                <button key={l} onClick={() => onSend(l)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600">
                  📍 {l}
                </button>
              ))}
            </div>
          )}

          {isBusy && <TypingIndicator />}
        </div>


        {/* Input area */}
        <footer
          className="shrink-0 border-t border-slate-100 bg-white px-4 pt-3 pb-3 sm:pb-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        >

          {/* Preview foto pending */}
          {pendingPhotos.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-0.5">
              {pendingPhotos.map((p, i) => (
                <div key={i} className="relative group shrink-0">
                  <img src={p.preview} alt="" className="h-14 w-14 rounded-xl object-cover border border-slate-200" />
                  <button onClick={() => removePhoto(i)}
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow transition-transform group-hover:scale-110">
                    <Trash2 size={9} />
                  </button>
                </div>
              ))}
              {pendingPhotos.length < 3 && (
                <button onClick={() => cameraRef.current?.click()}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
                  <Camera size={18} />
                </button>
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Attachment */}
            <div className="flex gap-1 pb-0.5">
              <button title="Pilih gambar" disabled={isBusy || pendingPhotos.length >= 3}
                onClick={() => galleryRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30">
                <ImageIcon size={18} />
              </button>
              <button title="Ambil foto" disabled={isBusy || pendingPhotos.length >= 3}
                onClick={() => cameraRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30">
                <Camera size={18} />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              placeholder={activeStep === 'foto' ? 'Ketik "lanjut" atau kirim foto…' : 'Tulis pesan…'}
              className="flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              style={{ maxHeight: '100px' }}
            />

            {/* Send */}
            <button onClick={() => onSend()}
              disabled={isBusy || (!input.trim() && pendingPhotos.length === 0)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100"
              style={{ background: NAV_GRADIENT }}>
              <Send size={16} />
            </button>
          </div>
        </footer>

        {/* Hidden file inputs */}
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => handlePhotoSelect(e.target.files)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => handlePhotoSelect(e.target.files)} />

      </div>
    </>
  );
}
