import React, { useEffect, useState } from 'react';
import { Megaphone, ShieldCheck, CloudSun, Cloud, CloudRain, Sun, CloudLightning, CloudFog, Wind, Droplets, ArrowRight } from 'lucide-react';
import PanoramaViewer from './PanoramaViewer';

/* ── Panorama ──────────────────────────────────────────────────────── */
const PANORAMAS = [{ src: '/assets/tugurejo.webp', startLon: 180 }];

/* ── Weather hook ──────────────────────────────────────────────────── */
interface WeatherSnap { temp: number; desc: string; humidity: number; wind: number; tcc?: number; }

function useWeatherSnap(): WeatherSnap | null {
  const [data, setData] = useState<WeatherSnap | null>(null);
  useEffect(() => {
    const KEY = 'tentrem_hero_weather';
    try { const c = sessionStorage.getItem(KEY); if (c) { setData(JSON.parse(c)); return; } } catch {}
    fetch('https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=35.02.01.2001')
      .then(r => r.json())
      .then(json => {
        const items: any[] = json?.data?.[0]?.cuaca?.flat() ?? [];
        const now = Date.now();
        const best = items.reduce<any>((b, it) => {
          const d = Math.abs(new Date(it.local_datetime).getTime() - now);
          return !b || d < Math.abs(new Date(b.local_datetime).getTime() - now) ? it : b;
        }, null);
        if (!best) return;
        const snap: WeatherSnap = { temp: best.t, desc: best.weather_desc, humidity: best.hu, wind: best.ws, tcc: best.tcc };
        try { sessionStorage.setItem(KEY, JSON.stringify(snap)); } catch {}
        setData(snap);
      }).catch(() => {});
  }, []);
  return data;
}

/* ── Weather icon ──────────────────────────────────────────────────── */
function WeatherIcon({ desc, cls = 'w-6 h-6' }: { desc: string; cls?: string }) {
  const d = (desc || '').toLowerCase();
  if (d.includes('petir') || d.includes('badai')) return <CloudLightning className={`${cls} text-amber-300`} />;
  if (d.includes('hujan')) return <CloudRain className={`${cls} text-blue-300`} />;
  if (d.includes('kabut') || d.includes('asap')) return <CloudFog className={`${cls} text-slate-300`} />;
  if (d.includes('cerah berawan')) return <CloudSun className={`${cls} text-amber-300`} />;
  if (d.includes('berawan')) return <Cloud className={`${cls} text-slate-300`} />;
  if (d.includes('cerah')) return <Sun className={`${cls} text-amber-300`} />;
  return <CloudSun className={`${cls} text-sky-300`} />;
}

interface HeroProps { onScrollToSection?: (id: string) => void; }

export default function Hero({ onScrollToSection }: HeroProps) {
  const weather = useWeatherSnap();
  const go = (id: string) => { if (onScrollToSection) onScrollToSection(id); };

  return (
    <header className="relative w-full min-h-[100vh] flex items-center overflow-hidden font-sans">

      {/* Panorama */}
      <div className="absolute inset-0 z-0">
        <PanoramaViewer slides={PANORAMAS} autoRotateSpeed={0.025} initialFov={110} minFov={60} maxFov={120} className="w-full h-full" />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none" aria-hidden
        style={{ background: 'linear-gradient(105deg, rgba(2,6,23,0.90) 0%, rgba(2,6,23,0.65) 45%, rgba(2,6,23,0.12) 75%, transparent 100%)' }} />
      <div className="absolute bottom-0 left-0 w-full h-40 z-[1] pointer-events-none bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 lg:pt-36 lg:pb-32">
        <div className="max-w-xl xl:max-w-2xl">

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm mb-6">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] sm:text-xs font-extrabold tracking-wider uppercase text-white/90">
              Portal Informasi Siskamling RT 01/RW 01 Desa Tugurejo
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>

          {/* Heading */}
          <h1 className="text-[3.2rem] sm:text-7xl md:text-8xl xl:text-[6rem] font-black tracking-tight leading-[0.88] text-white drop-shadow-2xl mb-4">
            POSKAMLING<br className="sm:hidden" /> TENTREM
          </h1>

          {/* Accent */}
          <div className="flex items-center gap-2 mb-5">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
            <div className="h-1 w-6 rounded-full bg-white/30" />
            <div className="h-1 w-3 rounded-full bg-white/15" />
          </div>

          {/* Acronym — kepanjangan TENTREM */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 mb-6">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white/90">
              <span className="text-emerald-400">T</span>ugur<span className="text-emerald-400">E</span>jo
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white/90">
              <span className="text-emerald-400">N</span>yaman
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white/90">
              <span className="text-emerald-400">T</span>anggap
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white/90">
              <span className="text-emerald-400">RE</span>sponsif
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white/90">
              <span className="text-emerald-400">M</span>odern
            </span>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base text-white/70 max-w-lg leading-relaxed mb-8">
            Sistem terpadu Poskamling Desa Tugurejo — siskamling, tanggap darurat, dan keterbukaan informasi warga.
          </p>

          {/* ── Bottom row: CTA + Weather (side by side, tidak bertumpuk) ── */}
          <div className="flex flex-wrap items-end gap-4">

            {/* Tombol Lapor Aduan */}
            <button
              onClick={() => go('pengaduan')}
              className="group inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold shadow-lg shadow-orange-500/30 hover:scale-[1.02] transition-all cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black leading-none">Lapor Aduan</div>
                <div className="text-[11px] text-white/70 font-medium mt-0.5">Sampaikan aduan</div>
              </div>
              <div className="flex flex-col items-center ml-1 shrink-0">
                <ArrowRight className="w-3.5 h-3.5 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                <span className="text-[9px] text-white/50 group-hover:text-white transition-colors font-semibold mt-0.5 whitespace-nowrap">Kirim</span>
              </div>
            </button>

            {/* ── Weather Card ── */}
            {weather ? (
              <button
                onClick={() => go('cuaca')}
                className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/35 hover:bg-black/50 backdrop-blur-md border border-white/15 hover:border-sky-400/40 transition-all cursor-pointer text-left shadow-lg"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <WeatherIcon desc={weather.desc} cls="w-6 h-6" />
                </div>

                {/* Temp + desc */}
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white font-mono leading-none">{weather.temp}°C</span>
                    <span className="text-xs text-white/50 font-semibold truncate max-w-[100px]">{weather.desc}</span>
                  </div>
                  {/* Mini stats */}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[11px] text-blue-300 font-semibold">
                      <Droplets className="w-3 h-3" />{weather.humidity}%
                    </span>
                    <span className="w-px h-3 bg-white/15" />
                    <span className="flex items-center gap-1 text-[11px] text-teal-300 font-semibold">
                      <Wind className="w-3 h-3" />{weather.wind} km/j
                    </span>
                  </div>
                </div>

                {/* Arrow hint */}
                <div className="flex flex-col items-center ml-1 shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                  <span className="text-[9px] text-white/30 group-hover:text-sky-400 transition-colors font-semibold mt-0.5 whitespace-nowrap">Detail</span>
                </div>
              </button>
            ) : (
              /* Skeleton */
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/25 backdrop-blur-md border border-white/10 min-w-[180px]">
                <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-16 rounded bg-white/10 animate-pulse" />
                  <div className="h-2.5 w-24 rounded bg-white/10 animate-pulse" />
                </div>
              </div>
            )}

          </div>{/* end bottom row */}

        </div>
      </div>

    </header>
  );
}
