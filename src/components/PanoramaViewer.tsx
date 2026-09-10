import { useCallback, useEffect, useRef, useState } from 'react';
import type { Viewer } from '@photo-sphere-viewer/core';

export interface PanoramaSlide {
  src: string;
  label?: string;
  startLon?: number;
}

interface Props {
  slides: PanoramaSlide[];
  className?: string;
  autoRotateSpeed?: number;
  initialFov?: number;
  minFov?: number;
  maxFov?: number;
}

type RendererMode = 'fallback' | 'psv';
// Sumber panorama lokal yang sama dengan Hero; dipakai Canvas ketika PSV/WebGL gagal.
const PANORAMA_FALLBACK = '/assets/tugurejo.webp';

function supportsPhotoSphereViewer(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Lightweight interactive fallback for browsers without WebGL/Photo Sphere Viewer. */
function CanvasPanorama({
  slide,
  initialFov,
  minFov,
  maxFov,
  autoRotateSpeed,
  onReady,
}: {
  slide: PanoramaSlide;
  initialFov: number;
  minFov: number;
  maxFov: number;
  autoRotateSpeed: number;
  onReady: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const lonRef = useRef(slide.startLon ?? 0);
  const fovRef = useRef(initialFov);
  const dragRef = useRef<{ x: number; lon: number } | null>(null);

  useEffect(() => {
    lonRef.current = slide.startLon ?? 0;
    fovRef.current = initialFov;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => { imageRef.current = image; onReady(); };
    image.onerror = () => {
      // Jika URL dinamis rusak, Canvas tetap mencoba panorama lokal yang sama.
      if (image.src !== new URL(PANORAMA_FALLBACK, window.location.origin).href) {
        image.src = PANORAMA_FALLBACK;
      } else {
        // Pastikan state tidak menunggu selamanya meskipun aset lokal sedang bermasalah.
        onReady();
      }
    };
    image.src = slide.src;
    return () => { imageRef.current = null; };
  }, [initialFov, onReady, slide.src, slide.startLon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    let frame = 0;
    let visible = true;
    let lastFrame = performance.now();

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));
    };

    const draw = (now: number) => {
      const image = imageRef.current;
      const width = canvas.width;
      const height = canvas.height;
      // Selalu cat warna dasar sebelum foto siap agar Canvas tidak pernah transparan/blank.
      if (width && height) {
        context.fillStyle = '#064e3b';
        context.fillRect(0, 0, width, height);
      }
      if (image && width && height) {
        const elapsed = Math.min(now - lastFrame, 60);
        if (!dragRef.current) lonRef.current += autoRotateSpeed * elapsed * 0.055;
        lastFrame = now;

        const fov = Math.max(minFov, Math.min(maxFov, fovRef.current));
        const sourceWidth = image.naturalWidth * (fov / 360);
        const sourceHeight = Math.min(image.naturalHeight, sourceWidth * (height / width));
        const sourceY = (image.naturalHeight - sourceHeight) / 2;
        const sourceX = ((lonRef.current / 360) * image.naturalWidth - sourceWidth / 2) % image.naturalWidth;
        const normalizedX = sourceX < 0 ? sourceX + image.naturalWidth : sourceX;

        context.fillStyle = '#0f172a';
        if (normalizedX + sourceWidth <= image.naturalWidth) {
          context.drawImage(image, normalizedX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
        } else {
          const firstWidth = image.naturalWidth - normalizedX;
          const firstPart = firstWidth / sourceWidth;
          context.drawImage(image, normalizedX, sourceY, firstWidth, sourceHeight, 0, 0, width * firstPart, height);
          context.drawImage(image, 0, sourceY, sourceWidth - firstWidth, sourceHeight, width * firstPart, 0, width * (1 - firstPart), height);
        }
      }
      if (visible) frame = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { lastFrame = performance.now(); frame = requestAnimationFrame(draw); }
    }, { threshold: 0.01 });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    observer.observe(canvas);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [autoRotateSpeed, maxFov, minFov]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none cursor-grab active:cursor-grabbing"
      onPointerDown={(event) => {
        dragRef.current = { x: event.clientX, lon: lonRef.current };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!dragRef.current) return;
        lonRef.current = dragRef.current.lon - ((event.clientX - dragRef.current.x) / Math.max(event.currentTarget.clientWidth, 1)) * fovRef.current;
      }}
      onPointerUp={() => { dragRef.current = null; }}
      onPointerCancel={() => { dragRef.current = null; }}
      onWheel={(event) => {
        event.preventDefault();
        fovRef.current = Math.max(minFov, Math.min(maxFov, fovRef.current + event.deltaY * 0.045));
      }}
      aria-label="Panorama Desa Tugurejo. Geser untuk melihat sekeliling, gunakan roda mouse untuk memperbesar."
    />
  );
}

/** Prefer Photo Sphere Viewer; use a smooth interactive canvas panorama only when unavailable. */
const PanoramaViewer = function PanoramaViewer({
  slides,
  className = '',
  autoRotateSpeed = 0.025,
  initialFov = 100,
  minFov = 60,
  maxFov = 120,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const activeSlide = slides[0];
  const [mode, setMode] = useState<RendererMode>('fallback');
  const [isReady, setIsReady] = useState(false);
  const markFallbackReady = useCallback(() => setIsReady(true), []);

  useEffect(() => {
    setMode('fallback');
    setIsReady(false);
  }, [activeSlide?.src]);

  useEffect(() => {
    if (!supportsPhotoSphereViewer()) return;
    setMode('fallback');
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !activeSlide || !supportsPhotoSphereViewer()) return;
    let cancelled = false;
    let instance: Viewer | null = null;

    void Promise.all([
      import('@photo-sphere-viewer/core'),
      import('@photo-sphere-viewer/autorotate-plugin'),
      import('@photo-sphere-viewer/core/index.css'),
    ]).then(([core, autorotate]) => {
      if (cancelled) return;
      const initialZoom = Math.max(0, Math.min(100, ((maxFov - initialFov) / (maxFov - minFov)) * 100));
      const rpm = Math.max(0.1, autoRotateSpeed * 10);
      instance = new core.Viewer({
        container,
        panorama: activeSlide.src,
        adapter: core.EquirectangularAdapter.withConfig({ resolution: 64, shader: true }),
        defaultYaw: `${activeSlide.startLon ?? 0}deg`,
        defaultZoomLvl: initialZoom,
        minFov,
        maxFov,
        moveInertia: true,
        mousewheelCtrlKey: false,
        touchmoveTwoFingers: false,
        navbar: false,
        canvasBackground: 'transparent',
        plugins: [autorotate.AutorotatePlugin.withConfig({
          autostartDelay: 1200,
          autostartOnIdle: true,
          autorotateSpeed: `-${rpm}rpm`,
        })],
      });
      const markReady = () => {
        setMode('psv');
        setIsReady(true);
      };
      const markLoading = () => setIsReady(false);
      instance.addEventListener('panorama-loaded', markReady);
      instance.addEventListener('panorama-load', markLoading);
      viewerRef.current = instance;
    }).catch(() => {
      if (!cancelled) {
        setMode('fallback');
        setIsReady(true);
      }
    });

    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setMode('fallback');
        setIsReady(true);
      }
    }, 12_000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      instance?.destroy();
      viewerRef.current = null;
    };
  }, [activeSlide, autoRotateSpeed, initialFov, maxFov, minFov]);

  if (!activeSlide) {
    return <div className={`relative overflow-hidden bg-slate-900 ${className}`} style={{ backgroundImage: 'linear-gradient(135deg, #064e3b, #0f172a)' }} />;
  }

  return (
    <div className={`relative overflow-hidden bg-slate-800 ${className}`}>
      <CanvasPanorama
        slide={{ ...activeSlide, src: activeSlide.src || PANORAMA_FALLBACK }}
        initialFov={initialFov}
        minFov={minFov}
        maxFov={maxFov}
        autoRotateSpeed={autoRotateSpeed}
        onReady={markFallbackReady}
      />
      <div ref={containerRef} className={`absolute inset-0 z-[2] transition-opacity duration-500 ${mode === 'psv' && isReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
    </div>
  );
};

export default PanoramaViewer;
