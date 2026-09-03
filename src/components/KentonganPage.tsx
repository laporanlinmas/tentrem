'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  PhoneCall,
  CheckCircle2,
  Radio,
  Home
} from 'lucide-react';

interface TandaKentongan {
  no: number;
  nama: string;
  pola: number[];
  singkat: string;
  tipe: 'darurat' | 'bencana' | 'informasi' | 'aman';
  warna: {
    badge: string;
    border: string;
    accent: string;
    dot: string;
  };
}

const TANDA_LIST: TandaKentongan[] = [
  {
    no: 1,
    nama: 'Berita Kematian',
    pola: [7],
    singkat: 'Ada warga yang meninggal dunia. Tunggu pengumuman dari masjid.',
    tipe: 'informasi',
    warna: {
      badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-400/30',
      border: 'border-slate-200 dark:border-slate-800',
      accent: 'from-slate-500 to-slate-700',
      dot: 'bg-slate-400',
    }
  },
  {
    no: 2,
    nama: 'Perampokan / Pencurian Berat',
    pola: [2, 2, 2, 2, 2],
    singkat: 'Kejahatan bersenjata di lingkungan. Kunci rumah, nyalakan lampu, kumpul di pos.',
    tipe: 'darurat',
    warna: {
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-400/30',
      border: 'border-rose-200 dark:border-rose-900/40',
      accent: 'from-rose-500 to-red-600',
      dot: 'bg-rose-500',
    }
  },
  {
    no: 3,
    nama: 'Bahaya Kebakaran',
    pola: [3, 3, 3],
    singkat: 'Terjadi kebakaran. Bawa ember/air, bantu padamkan, hubungi pemadam.',
    tipe: 'darurat',
    warna: {
      badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-400/30',
      border: 'border-orange-200 dark:border-orange-900/40',
      accent: 'from-orange-500 to-amber-600',
      dot: 'bg-orange-500',
    }
  },
  {
    no: 4,
    nama: 'Bencana Alam',
    pola: [4, 4, 4],
    singkat: 'Banjir / longsor / pohon tumbang. Amankan dokumen, matikan listrik, segera mengungsi.',
    tipe: 'bencana',
    warna: {
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-400/30',
      border: 'border-blue-200 dark:border-blue-900/40',
      accent: 'from-blue-500 to-cyan-600',
      dot: 'bg-blue-500',
    }
  },
  {
    no: 5,
    nama: 'Pencurian Ternak',
    pola: [5, 5],
    singkat: 'Hewan ternak hilang/dicuri. Petugas ronda blokir jalur keluar desa.',
    tipe: 'informasi',
    warna: {
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-400/30',
      border: 'border-amber-200 dark:border-amber-900/40',
      accent: 'from-amber-500 to-yellow-600',
      dot: 'bg-amber-500',
    }
  },
  {
    no: 6,
    nama: 'Keadaan Aman',
    pola: [6, 6],
    singkat: 'Situasi darurat telah teratasi. Kembali beraktivitas seperti biasa.',
    tipe: 'aman',
    warna: {
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/30',
      border: 'border-emerald-200 dark:border-emerald-900/40',
      accent: 'from-emerald-500 to-teal-600',
      dot: 'bg-emerald-500',
    }
  },
  {
    no: 7,
    nama: 'Titir — Bahaya Darurat Penuh',
    pola: [12],
    singkat: 'Bahaya tinggi. Seluruh warga laki-laki dewasa keluar rumah seketika menuju sumber suara.',
    tipe: 'darurat',
    warna: {
      badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-400/30',
      border: 'border-red-200 dark:border-red-900/40',
      accent: 'from-red-600 to-rose-700',
      dot: 'bg-red-500',
    }
  }
];

const EMERGENCY_CONTACTS = [
  { name: 'Polsek Slahung', phone: '(0352) 351110', label: 'Keamanan & Kriminalitas' },
  { name: 'Koramil 0802/10 Slahung', phone: '(0352) 351115', label: 'Pertahanan & Bencana' },
  { name: 'Puskesmas Slahung', phone: '(0352) 351234', label: 'Medis & Ambulans' },
  { name: 'Damkar Kab. Ponorogo', phone: '(0352) 481113', label: 'Pemadam Kebakaran' },
  { name: 'BPBD Kab. Ponorogo', phone: '(0352) 488113', label: 'Tanggap Bencana Alam' },
  { name: 'Posko TENTREM Linmas', phone: '0823-1382-3791', label: 'Posko Siaga Desa' },
];

// Realistic Wooden Acoustic Tone Synthesizer
function playAcousticKentongan(audioCtx: AudioContext): void {
  const now = audioCtx.currentTime;

  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(240, now);
  osc1.frequency.exponentialRampToValueAtTime(160, now + 0.16);
  gain1.gain.setValueAtTime(1.0, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.start(now);
  osc1.stop(now + 0.38);

  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(780, now);
  osc2.frequency.exponentialRampToValueAtTime(320, now + 0.05);
  gain2.gain.setValueAtTime(0.5, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(now);
  osc2.stop(now + 0.09);

  const osc3 = audioCtx.createOscillator();
  const gain3 = audioCtx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(480, now);
  gain3.gain.setValueAtTime(0.3, now);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc3.connect(gain3);
  gain3.connect(audioCtx.destination);
  osc3.start(now);
  osc3.stop(now + 0.22);
}

const KentonganCardItem: React.FC<{ item: TandaKentongan }> = ({ item }) => {
  const [playing, setPlaying] = useState(false);
  const [activeGroup, setActiveGroup] = useState(-1);
  const [activeIdx, setActiveIdx] = useState(-1);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const handlePlaySequence = useCallback(() => {
    if (playing) {
      clearAll();
      setPlaying(false);
      setActiveGroup(-1);
      setActiveIdx(-1);
      return;
    }

    setPlaying(true);

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const HIT_MS = 180;
    const GAP_MS = 80;
    const JEDA_MS = 450;

    let cursor = 0;
    const jobs: Array<{ t: number; g: number; i: number }> = [];

    item.pola.forEach((count, gi) => {
      for (let di = 0; di < count; di++) {
        jobs.push({ t: cursor, g: gi, i: di });
        cursor += HIT_MS + GAP_MS;
      }
      cursor += JEDA_MS;
    });

    const totalMs = cursor;

    jobs.forEach(({ t, g, i }) => {
      const tid = setTimeout(() => {
        setActiveGroup(g);
        setActiveIdx(i);
        if (audioCtxRef.current) playAcousticKentongan(audioCtxRef.current);
        const resetId = setTimeout(() => {
          setActiveGroup(-1);
          setActiveIdx(-1);
        }, HIT_MS - 20);
        timeoutsRef.current.push(resetId);
      }, t);
      timeoutsRef.current.push(tid);
    });

    const endId = setTimeout(() => {
      setPlaying(false);
      setActiveGroup(-1);
      setActiveIdx(-1);
    }, totalMs);
    timeoutsRef.current.push(endId);
  }, [playing, item.pola, clearAll]);

  return (
    <div className={`bg-white dark:bg-slate-900 border ${item.warna.border} rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 relative overflow-hidden`}>
      {/* top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.warna.accent}`} />

      {/* Header: nomor + nama + tombol tes */}
      <div className="flex items-start justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-black text-xs shrink-0">
            {item.no}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{item.nama}</span>
        </div>
        <button
          type="button"
          onClick={handlePlaySequence}
          title={playing ? 'Stop' : 'Tes Bunyi'}
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            playing
              ? 'bg-slate-900 dark:bg-slate-700 text-white'
              : `bg-gradient-to-br ${item.warna.accent} text-white hover:scale-105 shadow-sm`
          }`}
        >
          {playing
            ? <VolumeX className="w-4 h-4" />
            : <Volume2 className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Pola ketukan: label + visual dots */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {item.pola.join(' – ')} ketukan
          </span>
          {playing && (
            <span className="text-[10px] font-bold text-emerald-500 animate-pulse">▶ memutar…</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.pola.map((count, gi) => (
            <React.Fragment key={gi}>
              <div className="flex items-center gap-1">
                {Array.from({ length: count }).map((_, di) => {
                  const isHit = playing && gi === activeGroup && di === activeIdx;
                  return (
                    <span
                      key={di}
                      className={`inline-block rounded-full transition-all duration-75 ${
                        isHit
                          ? `w-3.5 h-3.5 ${item.warna.dot} scale-125 shadow-md`
                          : 'w-2.5 h-2.5 bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
              {gi < item.pola.length - 1 && (
                <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">·</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Deskripsi singkat */}
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {item.singkat}
      </p>
    </div>
  );
};

interface KentonganPageProps {
  onBack: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

export default function KentonganPage({ onBack, onNavigate }: KentonganPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">

      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-amber-400/10 dark:bg-amber-600/[0.06] blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-red-400/10 dark:bg-red-600/[0.06] blur-3xl" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <button type="button" onClick={onBack} className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold">Kode Kentongan</span>
        </nav>

        {/* Header */}
        <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Kode Isyarat Kentongan Satkamling</h1>
          <p className="text-sm text-slate-400 mt-1.5">7 kode pukulan resmi Satpol PP Jawa Timur · Klik ikon suara pada tiap kode untuk mendengar simulasi bunyi.</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {TANDA_LIST.map((item) => (
            <KentonganCardItem key={item.no} item={item} />
          ))}
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-500" />
              Kontak Darurat
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hubungi segera saat terjadi situasi darurat di lingkungan desa.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EMERGENCY_CONTACTS.map((c, idx) => (
              <a
                key={idx}
                href={`tel:${c.phone.replace(/[^0-9]/g, '')}`}
                className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 block">{c.label}</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors truncate">{c.name}</h4>
                  <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{c.phone}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
              </a>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
