import QRCode from 'qrcode';
import { readExif, fmtExifTime, ExifData } from './exif-parser';
import { reverseGeocodeForceStreet, AddrResult } from './geocoding';

export interface WatermarkMeta {
  kelompok: string;
  danpok?: string;
  danru?: string;
  poskamling?: string;
  customTime?: string;
  coords?: { lat: number; lng: number } | null;
}

export interface ProcessedPhoto {
  id: string;
  data: string; // Base64 data URL
  mime: string;
  sizeKB: number;
  lat: number | null;
  lng: number | null;
  address: string;
  timestamp: string;
  kelompok: string;
  danpok?: string;
  danru?: string;
  exif: ExifData | null;
}

function wrapTxt(ctx: CanvasRenderingContext2D, txt: string, maxW: number): string[] {
  if (!txt) return [];
  if (ctx.measureText(txt).width <= maxW) return [txt];
  const words = txt.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  words.forEach((w) => {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = t;
    }
  });
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

export async function makeQRCanvas(lat: number, lng: number, size: number): Promise<HTMLCanvasElement | null> {
  try {
    const url = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
    const cvs = document.createElement('canvas');
    cvs.width = size;
    cvs.height = size;
    await QRCode.toCanvas(cvs, url, {
      width: size,
      margin: 0,
      color: { dark: '#000000', light: '#ffffff' },
    });
    return cvs;
  } catch {
    return null;
  }
}

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: {
    kelompok: string;
    danpok?: string;
    danru?: string;
    poskamling: string;
    timeStr: string;
    addrFull: string;
    lat: number | null;
    lng: number | null;
    qrCvs: HTMLCanvasElement | null;
    logoImg: HTMLImageElement | null;
  }
) {
  const { kelompok, danpok, danru, poskamling, timeStr, addrFull, lat, lng, qrCvs, logoImg } = opts;
  const pDanpok = danpok || danru || '—';

  const coordStr =
    lat !== null && lng !== null
      ? `📡 Lat ${lat.toFixed(6)} , Long ${lng.toFixed(6)}`
      : '📡 Pos Ronda Desa Tugurejo, Slahung, Ponorogo';

  const BAR = Math.max(4, Math.round(w * 0.007));
  const PAD = Math.round(w * 0.022);
  const PADV = 8;
  const LOGO = Math.round(Math.min(w, h) * 0.10);
  const QR = qrCvs ? Math.max(75, Math.min(220, Math.round(Math.min(w, h) * 0.14))) : 0;
  const QR_PAD = qrCvs ? Math.round(PAD * 0.6) : 0;

  const fT = Math.max(12, Math.round(LOGO * 0.35));
  const fB = Math.max(10, Math.round(LOGO * 0.28));
  const fS = Math.max(8, Math.round(fB * 0.75));
  const LH = Math.round(fB * 1.45);
  const TX = BAR + Math.round(PAD * 0.35) + LOGO + Math.round(PAD * 0.45);
  const TW = w - TX - PAD - (qrCvs ? QR + QR_PAD * 2 : 0);

  ctx.font = `${fB}px Arial, -apple-system, BlinkMacSystemFont, sans-serif`;
  const addrLines = wrapTxt(ctx, addrFull, TW);
  const nLines = 1 + 1 + 1 + addrLines.length + 1;
  const CONTH = PADV + Math.round(fT * 1.45) + nLines * LH + PADV;
  const STRPH = Math.max(Math.round(h * 0.12), CONTH * 0.85, qrCvs ? QR + PADV * 2 + 10 : 0);
  const SY = h - STRPH;

  ctx.save();

  // Dark gradient bar at bottom
  const gr = ctx.createLinearGradient(0, SY, 0, h);
  gr.addColorStop(0, 'rgba(2, 6, 23, 0.55)');
  gr.addColorStop(0.4, 'rgba(2, 6, 23, 0.82)');
  gr.addColorStop(1, 'rgba(2, 6, 23, 0.94)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, SY, w, STRPH);

  // Left accent colored stripe (emerald to cyan)
  const bg = ctx.createLinearGradient(0, SY, 0, h);
  bg.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
  bg.addColorStop(1, 'rgba(6, 182, 212, 0.95)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, SY, BAR, STRPH);

  // Draw Logo
  const lx = BAR + Math.round(PAD * 0.35);
  const ly = SY + Math.round((STRPH - LOGO) / 2);

  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    try {
      ctx.drawImage(logoImg, lx, ly, LOGO, LOGO);
    } catch {}
  } else {
    // Shield placeholder if image not ready
    ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
    ctx.beginPath();
    ctx.arc(lx + LOGO / 2, ly + LOGO / 2, LOGO / 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw QR code on right
  if (qrCvs && QR > 0) {
    const qx = w - QR - QR_PAD;
    const qy = SY + Math.round((STRPH - QR) / 2) - 10;
    ctx.fillStyle = '#ffffff';
    const qPad = 4;
    ctx.fillRect(qx - qPad, qy - qPad, QR + qPad * 2, QR + qPad * 2);
    try {
      ctx.drawImage(qrCvs, qx, qy, QR, QR);
    } catch {}
    ctx.font = `bold ${Math.max(8, Math.round(fS * 0.7))}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('LIHAT LOKASI', qx + QR / 2, qy - 4);
  }

  // Text contents
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  let tx = TX;
  let ty = SY + PADV;

  // Title
  ctx.font = `900 ${fT}px Arial, sans-serif`;
  ctx.fillStyle = '#facc15'; // yellow-400
  ctx.fillText('RONDA POSKAMLING TUGUREJO', tx, ty, TW);
  ty += Math.round(fT * 1.4);

  // Kelompok & Danpok
  ctx.font = `700 ${fB}px Arial, sans-serif`;
  ctx.fillStyle = '#ffffff';
  const groupDanruText = `${kelompok ? kelompok + ' • ' : ''}Danpok: ${pDanpok}${poskamling ? ` (${poskamling})` : ''}`;
  ctx.fillText(groupDanruText, tx, ty, TW);
  ty += LH;

  // Time
  ctx.font = `500 ${fB}px Arial, sans-serif`;
  ctx.fillStyle = '#67e8f9'; // cyan-300
  ctx.fillText(timeStr, tx, ty, TW);
  ty += LH;

  // Address
  ctx.font = `400 ${fB}px Arial, sans-serif`;
  ctx.fillStyle = '#a7f3d0'; // emerald-200
  addrLines.forEach((ln) => {
    ctx.fillText(ln, tx, ty, TW);
    ty += LH;
  });

  // Coordinates
  ctx.font = `400 ${fS}px Arial, sans-serif`;
  ctx.fillStyle = '#94a3b8'; // slate-400
  ctx.fillText(coordStr, tx, ty, TW);

  // Watermark app tag
  const spF = Math.max(9, Math.round(w * 0.022));
  ctx.font = `900 ${spF}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(250, 204, 21, 0.6)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('TENTREM SISKAMLING', w - Math.round(PAD * 0.5), h - Math.round(PAD * 0.25), Math.round(w * 0.25));

  ctx.restore();
}

/**
 * Loads Tentrem logo image safely
 */
async function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = '/assets/linmas.svg';
  });
}

function b64SizeKB(b64: string): number {
  const headerIdx = b64.indexOf(',');
  const len = headerIdx >= 0 ? b64.length - headerIdx - 1 : b64.length;
  return Math.round((len * 0.75) / 1024);
}

/**
 * Processes camera snapshot: reads EXIF, queries geocode, draws watermark, and compresses.
 */
export async function processCameraSnapshot(
  file: File,
  meta: WatermarkMeta
): Promise<ProcessedPhoto> {
  // 1. Read EXIF
  const exif = await readExif(file);

  // 2. Geolocation coordinates (prioritize EXIF GPS, fallback to browser GPS meta.coords, fallback to Tugurejo)
  let lat: number | null = exif?.gps?.lat ?? meta.coords?.lat ?? null;
  let lng: number | null = exif?.gps?.lng ?? meta.coords?.lng ?? null;

  // 3. Reverse Geocode
  let address = 'Desa Tugurejo, Kec. Slahung, Kab. Ponorogo, Jawa Timur';
  if (lat !== null && lng !== null) {
    try {
      const geoRes: AddrResult = await reverseGeocodeForceStreet(lat, lng);
      if (geoRes?.full) address = geoRes.full;
    } catch {}
  }

  // 4. Time
  const timeStr = meta.customTime ? `${meta.customTime} WIB` : fmtExifTime(exif);

  // 5. Read image data to Image element
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const rdr = new FileReader();
    rdr.onload = (e) => resolve(e.target?.result as string);
    rdr.onerror = reject;
    rdr.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  // 6. Draw on Canvas with max bounds (e.g. 2000px)
  const maxDim = 2000;
  let w = img.naturalWidth || 1200;
  let h = img.naturalHeight || 900;
  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  const cvs = document.createElement('canvas');
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  ctx.drawImage(img, 0, 0, w, h);

  // 7. QR Canvas & Logo
  let qrCvs: HTMLCanvasElement | null = null;
  if (lat !== null && lng !== null) {
    const qrSize = Math.max(90, Math.min(220, Math.round(Math.min(w, h) * 0.15)));
    qrCvs = await makeQRCanvas(lat, lng, qrSize);
  }

  const logoImg = await loadLogo();

  // 8. Draw Watermark
  drawWatermark(ctx, w, h, {
    kelompok: meta.kelompok,
    danru: meta.danru,
    poskamling: meta.poskamling || '',
    timeStr,
    addrFull: address,
    lat,
    lng,
    qrCvs,
    logoImg,
  });

  // 9. Output compressed JPEG
  const outMime = 'image/jpeg';
  let quality = 0.9;
  let outData = cvs.toDataURL(outMime, quality);

  // Compress if > 500KB
  if (b64SizeKB(outData) > 500) {
    quality = 0.78;
    outData = cvs.toDataURL(outMime, quality);
  }

  const id = `photo-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  return {
    id,
    data: outData,
    mime: outMime,
    sizeKB: b64SizeKB(outData),
    lat,
    lng,
    address,
    timestamp: timeStr,
    kelompok: meta.kelompok,
    danru: meta.danru,
    exif,
  };
}
