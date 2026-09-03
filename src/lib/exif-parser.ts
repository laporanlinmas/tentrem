export interface GPSData {
  lat: number;
  lng: number;
}

export interface ExifData {
  gps?: GPSData;
  dto?: string;
  dtd?: string;
  dateTime?: string;
  tzOff?: number;
}

/**
 * Reads EXIF metadata directly from a File object without heavy external libraries.
 */
export function readExif(file: File): Promise<ExifData | null> {
  return new Promise((resolve) => {
    const rdr = new FileReader();
    rdr.onload = function (e) {
      try {
        if (e.target && e.target.result) {
          resolve(parseExif(new DataView(e.target.result as ArrayBuffer)));
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    rdr.onerror = function () {
      resolve(null);
    };
    rdr.readAsArrayBuffer(file);
  });
}

function parseExif(dv: DataView): ExifData | null {
  if (dv.byteLength < 4 || dv.getUint16(0) !== 0xffd8) return null;
  let off = 2;
  const len = dv.byteLength;
  while (off < len - 4) {
    if (dv.getUint8(off) !== 0xff) break;
    const mk = dv.getUint16(off);
    const sl = dv.getUint16(off + 2);
    if (
      mk === 0xffe1 &&
      dv.getUint32(off + 4) === 0x45786966 &&
      dv.getUint16(off + 8) === 0x0000
    ) {
      return parseTiff(dv, off + 10);
    }
    off += 2 + sl;
  }
  return null;
}

function parseTiff(dv: DataView, base: number): ExifData | null {
  if (base + 8 > dv.byteLength) return null;
  const le = dv.getUint16(base) === 0x4949;
  const r16 = (o: number) => (le ? dv.getUint16(o, true) : dv.getUint16(o, false));
  const r32 = (o: number) => (le ? dv.getUint32(o, true) : dv.getUint32(o, false));
  const rStr = (o: number, l: number) => {
    let s = '';
    for (let i = 0; i < l; i++) {
      if (o + i >= dv.byteLength) break;
      const c = dv.getUint8(o + i);
      if (!c) break;
      s += String.fromCharCode(c);
    }
    return s.trim();
  };
  const rRat = (o: number) => {
    if (o + 8 > dv.byteLength) return 0;
    const n = r32(o),
      d = r32(o + 4);
    return d ? n / d : 0;
  };

  const res: ExifData = {};
  const ifd0 = r32(base + 4);
  if (base + ifd0 + 2 > dv.byteLength) return null;
  const nE = r16(base + ifd0);
  let exifOff: number | null = null;
  let gpsOff: number | null = null;

  for (let i = 0; i < nE; i++) {
    const ep = base + ifd0 + 2 + i * 12;
    if (ep + 12 > dv.byteLength) break;
    const tag = r16(ep);
    const cnt = r32(ep + 4);
    const vp = ep + 8;
    if (tag === 0x8769) exifOff = r32(vp);
    if (tag === 0x8825) gpsOff = r32(vp);
    if (tag === 0x0132) res.dateTime = rStr(base + r32(vp), cnt);
  }

  if (exifOff && base + exifOff + 2 <= dv.byteLength) {
    const eb = base + exifOff;
    const en = r16(eb);
    for (let j = 0; j < en; j++) {
      const ep2 = eb + 2 + j * 12;
      if (ep2 + 12 > dv.byteLength) break;
      const t2 = r16(ep2);
      const c2 = r32(ep2 + 4);
      const v2 = ep2 + 8;
      if (t2 === 0x9003) res.dto = rStr(base + r32(v2), c2);
      if (t2 === 0x9004) res.dtd = rStr(base + r32(v2), c2);
      if (t2 === 0x882a) res.tzOff = dv.getInt16(v2, le);
    }
  }

  if (gpsOff && base + gpsOff + 2 <= dv.byteLength) {
    const gb = base + gpsOff;
    const gn = r16(gb);
    const gps: any = {};
    for (let k = 0; k < gn; k++) {
      const gp = gb + 2 + k * 12;
      if (gp + 12 > dv.byteLength) break;
      const gt = r16(gp);
      const gv = gp + 8;
      if (gt === 1) gps.latRef = String.fromCharCode(dv.getUint8(gv));
      if (gt === 2) {
        const lo = base + r32(gv);
        gps.latD = rRat(lo);
        gps.latM = rRat(lo + 8);
        gps.latS = rRat(lo + 16);
      }
      if (gt === 3) gps.lngRef = String.fromCharCode(dv.getUint8(gv));
      if (gt === 4) {
        const lo2 = base + r32(gv);
        gps.lngD = rRat(lo2);
        gps.lngM = rRat(lo2 + 8);
        gps.lngS = rRat(lo2 + 16);
      }
    }
    if (gps.latD !== undefined && gps.lngD !== undefined) {
      let lat = gps.latD + gps.latM / 60 + gps.latS / 3600;
      let lng = gps.lngD + gps.lngM / 60 + gps.lngS / 3600;
      if (gps.latRef === 'S') lat = -lat;
      if (gps.lngRef === 'W') lng = -lng;
      res.gps = { lat, lng };
    }
  }
  return Object.keys(res).length ? res : null;
}

export function nowFull(): string {
  const t = new Date();
  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  return (
    pad(t.getDate()) +
    '/' +
    pad(t.getMonth() + 1) +
    '/' +
    t.getFullYear() +
    ' ' +
    pad(t.getHours()) +
    ':' +
    pad(t.getMinutes()) +
    ':' +
    pad(t.getSeconds())
  );
}

export function fmtExifTime(exif: ExifData | null): string {
  if (!exif) return nowFull() + ' WIB';
  const raw = exif.dto || exif.dtd || exif.dateTime;
  if (!raw) return nowFull() + ' WIB';
  const m = /(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if (!m) return nowFull() + ' WIB';
  const tz = exif.tzOff !== undefined ? ' GMT' + (exif.tzOff >= 0 ? '+' : '') + exif.tzOff : ' WIB';
  return m[3] + '/' + m[2] + '/' + m[1] + ' ' + m[4] + ':' + m[5] + ':' + m[6] + tz;
}
