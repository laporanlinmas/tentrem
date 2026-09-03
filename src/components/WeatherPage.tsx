'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CloudSun, Cloud, CloudRain, CloudLightning, Sun, Wind,
  Droplets, Eye, Clock, MapPin, RefreshCw, AlertTriangle,
  Umbrella, CloudFog, ExternalLink, CheckCircle2, Home,
  ChevronRight, Thermometer, Navigation, BarChart3, Info,
} from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────────── */
interface LokasiBmkg {
  provinsi: string; kotkab: string; kecamatan: string; desa: string;
  lon: number; lat: number;
}
interface CuacaItem {
  datetime: string; local_datetime: string;
  t: number; hu: number; ws: number; wd: string; wd_deg: number;
  tcc: number; tp: number; weather: number;
  weather_desc: string; weather_desc_en: string;
  vs: number; vs_text: string; image: string;
}

/* ─────────────────────────── Constants ─────────────────────────── */
const CACHE_KEY = 'website_bmkg_cuaca_tugurejo';
const CACHE_TTL_MS = 10 * 60 * 1000;
const API_URL = 'https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=35.02.01.2001';

const WIND_MAP: Record<string, string> = {
  N:'Utara', NNE:'U-TL', NE:'Timur Laut', ENE:'T-TL',
  E:'Timur', ESE:'T-TG', SE:'Tenggara', SSE:'S-TG',
  S:'Selatan', SSW:'S-BD', SW:'Barat Daya', WSW:'B-BD',
  W:'Barat', WNW:'B-BL', NW:'Barat Laut', NNW:'U-BL',
};

/* ─────────────────────────── Helpers ────────────────────────────── */
function WeatherIcon({ desc, cls = 'w-5 h-5' }: { desc: string; cls?: string }) {
  const d = (desc || '').toLowerCase();
  if (d.includes('petir') || d.includes('badai')) return <CloudLightning className={`${cls} text-amber-500`} />;
  if (d.includes('hujan')) return <CloudRain className={`${cls} text-blue-500`} />;
  if (d.includes('kabut') || d.includes('asap')) return <CloudFog className={`${cls} text-slate-400`} />;
  if (d.includes('cerah berawan')) return <CloudSun className={`${cls} text-amber-500`} />;
  if (d.includes('berawan')) return <Cloud className={`${cls} text-sky-400`} />;
  if (d.includes('cerah')) return <Sun className={`${cls} text-amber-400`} />;
  return <CloudSun className={`${cls} text-sky-500`} />;
}

function fmtTime(s: string) {
  try { return (s.split(' ')[1] ?? '').substring(0, 5); } catch { return ''; }
}

function fmtDate(s: string, idx: number) {
  try {
    const dt = new Date(s.replace(' ', 'T') + (s.includes('Z') ? '' : '+07:00'));
    if (idx === 0) return { short: 'Hari Ini', long: dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) };
    if (idx === 1) return { short: 'Besok', long: dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) };
    return {
      short: dt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
      long: dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
    };
  } catch { return { short: `Hari ${idx + 1}`, long: '' }; }
}

function tempColor(t: number) {
  if (t >= 35) return 'text-red-500';
  if (t >= 32) return 'text-orange-500';
  if (t >= 28) return 'text-amber-500';
  if (t >= 24) return 'text-emerald-500';
  return 'text-blue-500';
}

/* ─────────────────────────── Props ─────────────────────────────── */
interface WeatherPageProps { onBack: () => void; }

/* ═══════════════════════════ COMPONENT ══════════════════════════════ */
export default function WeatherPage({ onBack }: WeatherPageProps) {
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [lokasi, setLokasi]       = useState<LokasiBmkg | null>(null);
  const [cuacaDays, setCuacaDays] = useState<CuacaItem[][]>([]);
  const [dayIdx, setDayIdx]       = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');

  /* fetch */
  const fetchData = useCallback(async (force = false) => {
    if (force) setRefreshing(true); else setLoading(true);
    setError(null);
    if (!force) {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (p?.ts && Date.now() - p.ts < CACHE_TTL_MS && p.data) {
            setLokasi(p.data.lokasi); setCuacaDays(p.data.cuaca);
            setLastUpdated(new Date(p.ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
            setLoading(false); return;
          }
        }
      } catch { /* ignore */ }
    }
    try {
      const res = await fetch(API_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json?.data?.[0]) throw new Error('Format data tidak sesuai');
      const entry = json.data[0];
      setLokasi(entry.lokasi); setCuacaDays(entry.cuaca || []);
      const ts = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      setLastUpdated(ts);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: { lokasi: entry.lokasi, cuaca: entry.cuaca || [] } })); } catch { /* ignore */ }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke BMKG.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { window.scrollTo(0, 0); fetchData(); }, [fetchData]);

  /* nowItem */
  const nowItem = useMemo<CuacaItem | null>(() => {
    if (!cuacaDays.length) return null;
    const now = Date.now();
    let best: CuacaItem | null = null, minDiff = Infinity;
    for (const day of cuacaDays)
      for (const item of day) {
        try { const d = Math.abs(new Date(item.datetime).getTime() - now); if (d < minDiff) { minDiff = d; best = item; } } catch { /* ignore */ }
      }
    return best || cuacaDays[0]?.[0] || null;
  }, [cuacaDays]);

  /* stats for selected day */
  const dayStats = useMemo(() => {
    const items = cuacaDays[dayIdx] || [];
    if (!items.length) return null;
    let minT = Infinity, maxT = -Infinity, totalHu = 0, hasRain = false, maxTp = 0, maxWs = 0;
    items.forEach(it => {
      if (it.t < minT) minT = it.t;
      if (it.t > maxT) maxT = it.t;
      totalHu += it.hu;
      if ((it.tp && it.tp > 0) || (it.weather_desc || '').toLowerCase().includes('hujan')) hasRain = true;
      if (it.tp > maxTp) maxTp = it.tp;
      if (it.ws > maxWs) maxWs = it.ws;
    });
    return { minT, maxT, avgHu: Math.round(totalHu / items.length), hasRain, maxTp, maxWs };
  }, [cuacaDays, dayIdx]);

  const activeItems = cuacaDays[dayIdx] || [];

  /* ── render ── */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6" tabIndex={-1}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <button type="button" onClick={onBack} className="hover:text-sky-600 dark:hover:text-sky-400 font-semibold flex items-center gap-1 cursor-pointer">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-white font-bold">Prakiraan Cuaca</span>
        </nav>

        {/* Header */}
        <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Info Cuaca Desa Tugurejo</h1>
          <p className="text-sm text-slate-400 mt-1.5">Prakiraan cuaca real-time dari BMKG untuk wilayah Desa Tugurejo, Kecamatan Slahung.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Gagal memuat data BMKG: {error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !error && (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
            </div>
            <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        {!loading && nowItem && (
          <>
            {/* ── Cuaca Sekarang ── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-sky-400 to-blue-600" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">Kondisi Saat Ini</span>
                <span className="ml-1 flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative rounded-full h-1.5 w-1.5 bg-sky-500" />
                </span>
              </div>
              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Icon + Suhu Besar */}
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 flex items-center justify-center shrink-0 p-2">
                    {nowItem.image
                      ? <img src={nowItem.image} alt={nowItem.weather_desc} className="w-14 h-14 object-contain" onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
                      : <WeatherIcon desc={nowItem.weather_desc} cls="w-12 h-12" />
                    }
                  </div>
                  <div>
                    <div className={`text-5xl font-black font-mono leading-none ${tempColor(nowItem.t)}`}>{nowItem.t}°C</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-white mt-1">{nowItem.weather_desc}</div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />{fmtTime(nowItem.local_datetime)} WIB · Tugurejo, Slahung
                    </div>
                  </div>
                </div>

                {/* Stat grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                  {[
                    { icon: <Droplets className="w-4 h-4 text-blue-500" />, label: 'Kelembapan', value: `${nowItem.hu}%` },
                    { icon: <Wind className="w-4 h-4 text-teal-500" />, label: 'Kecepatan Angin', value: `${nowItem.ws} km/j` },
                    { icon: <Navigation className="w-4 h-4 text-indigo-500" />, label: 'Arah Angin', value: WIND_MAP[nowItem.wd?.toUpperCase()] || nowItem.wd },
                    { icon: <Eye className="w-4 h-4 text-purple-500" />, label: 'Jarak Pandang', value: nowItem.vs_text },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">{s.icon}<span className="text-[11px] text-slate-400 font-semibold">{s.label}</span></div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white font-mono">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Day Tabs + Stats ── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              {/* Tab header */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-teal-400 to-emerald-500" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">Prakiraan 3 Hari</span>
              </div>

              {/* Day selector pills */}
              <div className="flex gap-2 p-4 border-b border-slate-100 dark:border-slate-800">
                {cuacaDays.map((dayList, idx) => {
                  if (!dayList[0]) return null;
                  const { short, long } = fmtDate(dayList[0].local_datetime, idx);
                  let min = Infinity, max = -Infinity, rain = false;
                  dayList.forEach(it => {
                    if (it.t < min) min = it.t;
                    if (it.t > max) max = it.t;
                    if ((it.tp > 0) || (it.weather_desc || '').toLowerCase().includes('hujan')) rain = true;
                  });
                  const active = dayIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setDayIdx(idx)}
                      title={long}
                      className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border transition-all cursor-pointer ${
                        active
                          ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400/60'
                      }`}
                    >
                      <span className="text-xs font-extrabold">{short}</span>
                      <span className={`text-[10px] font-mono ${active ? 'text-white/80' : 'text-slate-400'}`}>{min}°–{max}°C</span>
                      {rain && <Umbrella className={`w-3 h-3 ${active ? 'text-white/70' : 'text-blue-400'}`} />}
                    </button>
                  );
                })}
              </div>

              {/* Day summary bar */}
              {dayStats && (
                <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 text-xs font-semibold border-b ${
                  dayStats.hasRain
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {dayStats.hasRain ? <Umbrella className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{dayStats.hasRain ? 'Berpotensi hujan' : 'Cuaca kondusif'}</span>
                  <span className="opacity-60">·</span>
                  <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" />{dayStats.minT}°–{dayStats.maxT}°C</span>
                  <span className="opacity-60">·</span>
                  <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5" />Rerata lembap {dayStats.avgHu}%</span>
                  <span className="opacity-60">·</span>
                  <span className="flex items-center gap-1"><Wind className="w-3.5 h-3.5" />Angin maks. {dayStats.maxWs} km/j</span>
                  {dayStats.maxTp > 0 && <>
                    <span className="opacity-60">·</span>
                    <span className="flex items-center gap-1"><CloudRain className="w-3.5 h-3.5" />Hujan {dayStats.maxTp} mm</span>
                  </>}
                </div>
              )}

              {/* Hourly cards */}
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
                  {activeItems.map((item, idx) => {
                    const isRain = (item.weather_desc || '').toLowerCase().includes('hujan') || (item.weather_desc || '').toLowerCase().includes('petir');
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border p-4 flex flex-col gap-2 transition-all hover:shadow-md ${
                          isRain
                            ? 'bg-blue-50 dark:bg-blue-950/25 border-blue-200 dark:border-blue-900/40'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/50'
                        }`}
                      >
                        {/* Time */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200 font-mono flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-sky-500" />{fmtTime(item.local_datetime)} WIB
                          </span>
                          {isRain && <Umbrella className="w-3 h-3 text-blue-500 shrink-0" />}
                        </div>

                        {/* Icon + Temp */}
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                            {item.image
                              ? <img src={item.image} alt={item.weather_desc} className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
                              : <WeatherIcon desc={item.weather_desc} cls="w-6 h-6" />
                            }
                          </div>
                          <div>
                            <div className={`text-xl font-black font-mono leading-none ${tempColor(item.t)}`}>{item.t}°C</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{item.weather_desc}</div>
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700/50 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Droplets className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-200">{item.hu}%</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Wind className="w-3 h-3 text-teal-500 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-200">{item.ws} km/j</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Cloud className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-200">{item.tcc}%</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Umbrella className="w-3 h-3 text-sky-500 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-200">{item.tp || 0} mm</span>
                          </div>
                        </div>

                        {/* Wind direction */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Navigation className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                          <span>{WIND_MAP[item.wd?.toUpperCase()] || item.wd} · Pandang: {item.vs_text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Info & Source ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <span>Data prakiraan cuaca bersumber dari <strong className="text-slate-700 dark:text-slate-300">BMKG</strong> (Badan Meteorologi, Klimatologi, dan Geofisika) melalui API publik resmi. Diperbarui setiap 10 menit secara otomatis.</span>
              </div>
              <a
                href="https://www.bmkg.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold hover:bg-sky-500/20 transition-colors shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> bmkg.go.id <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
