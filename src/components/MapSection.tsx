'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Maximize2,
  Minimize2,
  RefreshCw,
  Crosshair,
  Navigation,
  Plus,
  Minus,
  Layers,
  Shield,
  Home,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

declare const window: any;

interface LayerPetaItem {
  _ri: string;
  nama: string;
  deskripsi?: string;
  simbol: string;
  warna?: string;
  lat: number;
  lng: number;
  aktif?: boolean;
}

interface GambarPetaItem {
  id: string;
  type: string;
  warna: string;
  nama: string;
  ket: string;
  measurement?: string;
  geojson: string;
}

// Fallback high-priority points in Desa Tugurejo if database is empty
const DEFAULT_LOCATIONS: LayerPetaItem[] = [
  {
    _ri: 'def-1',
    nama: 'Pos Kamling RT 01/RW 01 Dusun Krajan',
    deskripsi: 'Posko utama pengamanan lingkungan Krajan Timur dengan jadwal ronda aktif setiap malam.',
    simbol: 'posjaga',
    warna: '#059669',
    lat: -8.04826,
    lng: 111.37173,
    aktif: true
  },
  {
    _ri: 'def-2',
    nama: 'Posko Terpadu Dusun Tugu',
    deskripsi: 'Posko pengamanan wilayah barat Desa Tugurejo dan jalur lintasan perbatasan.',
    simbol: 'posjaga',
    warna: '#0284c7',
    lat: -8.04610,
    lng: 111.36850,
    aktif: true
  },
  {
    _ri: 'def-3',
    nama: 'Balai Desa Tugurejo & Posko Satlinmas',
    deskripsi: 'Pusat pemerintahan desa dan pos komando koordinasi penanganan ketertiban umum.',
    simbol: 'bangunan',
    warna: '#7c3aed',
    lat: -8.04750,
    lng: 111.37310,
    aktif: true
  },
  {
    _ri: 'def-4',
    nama: 'Titik Pantau Pertigaan Krajan',
    deskripsi: 'Titik hotspot persimpangan lalu lintas utama masuk pemukiman warga.',
    simbol: 'hotspot',
    warna: '#ea580c',
    lat: -8.04920,
    lng: 111.37450,
    aktif: true
  }
];

const SVG_ICONS: Record<string, string> = {
  'rute':     `<path d="M9 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /><path d="M19 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /><path d="M7 15V9a4 4 0 0 1 4-4h4" />`,
  'hotspot':  `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />`,
  'posjaga':  `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />`,
  'toko':     `<path d="m2 7 4.41-3.67A2 2 0 0 1 7.7 3h8.6a2 2 0 0 1 1.3.33L22 7" /><path d="M2 12h20" /><path d="M2 7v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7" />`,
  'batas':    `<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />`,
  'bangunan': `<rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M8 6h2" /><path d="M14 6h2" /><path d="M8 11h2" /><path d="M14 11h2" />`,
  'kamera':   `<path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" ry="2" />`,
  'parkir':   `<rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 17V7h4a3 3 0 0 1 0 6H9" />`,
  'map-pin':  `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />`,
};

export default function MapSection() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [layersList, setLayersList] = useState<LayerPetaItem[]>(DEFAULT_LOCATIONS);
  const [gambarList, setGambarList] = useState<GambarPetaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const mapRef = useRef<any>(null);
  const kmlGroupRef = useRef<any>(null);
  const kmlBoundsRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const gambarGroupRef = useRef<any>(null);
  const locateMarkerRef = useRef<any>(null);
  const locateCircleRef = useRef<any>(null);

  const PETA_CENTER: [number, number] = [-8.04826, 111.37173];
  const PETA_ZOOM = 14;

  const TILE_LAYERS: Record<string, any> = {
    osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap', label: 'OpenStreetMap', maxZoom: 19 },
    satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Esri', label: 'Satelit Esri', maxZoom: 19 },
    hybrid: { url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', attr: 'Google', label: 'Google Hybrid', maxZoom: 20 },
    google_sat: { url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', attr: 'Google', label: 'Google Sat', maxZoom: 20 },
    topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: 'OpenTopoMap', label: 'Topografi', maxZoom: 17 },
  };

  // Ensure Leaflet is loaded
  const _ensureLeaflet = (cb: () => void) => {
    if (typeof window !== 'undefined' && window.L) return cb();
    const addLink = (href: string, id: string) => {
      if (document.getElementById(id)) return;
      const l = document.createElement('link');
      l.id = id;
      l.rel = 'stylesheet';
      l.href = href;
      document.head.appendChild(l);
    };
    const addScript = (src: string, onload: () => void) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = onload;
      document.head.appendChild(s);
    };
    addLink('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css', 'lf-css');
    addScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', cb);
  };

  // Custom SVG pin marker
  const _makeIcon = (warna = '#059669', simbolId = 'posjaga') => {
    const L = window.L;
    if (!L) return undefined;
    const path = SVG_ICONS[simbolId] || SVG_ICONS['map-pin'];
    const html = `
      <div style="transform:translate(-50%,-100%);filter:drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
        <svg width="32" height="42" viewBox="0 0 32 42" style="display:block">
          <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0Z" fill="${warna}"/>
          <circle cx="16" cy="15" r="9" fill="#ffffff"/>
          <g transform="translate(9,8) scale(0.6)" stroke="${warna}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">${path}</g>
        </svg>
      </div>`;
    return L.divIcon({ html, className: '', iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -40] });
  };

  // Fetch Firestore map data
  const fetchData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const layerSnap = await getDocs(collection(db, 'layer_peta'));
      if (!layerSnap.empty) {
        const layers: LayerPetaItem[] = layerSnap.docs.map((d) => {
          const data = d.data();
          const lat = typeof data.lat === 'number' ? data.lat : parseFloat(String(data.lat || '').replace(/,/g, '.')) || 0;
          const lng = typeof data.lng === 'number' ? data.lng : parseFloat(String(data.lng || '').replace(/,/g, '.')) || 0;
          return {
            _ri: d.id,
            nama: String(data.nama || '').trim(),
            deskripsi: String(data.deskripsi || data.ket || '').trim(),
            simbol: String(data.simbol || 'posjaga').trim(),
            warna: String(data.warna || '#059669').trim(),
            lat,
            lng,
            aktif: data.aktif === true || String(data.aktif).toUpperCase() === 'TRUE',
          };
        });
        setLayersList(layers);
      } else {
        setLayersList(DEFAULT_LOCATIONS);
      }

      const gambarSnap = await getDocs(collection(db, 'gambar_peta'));
      if (!gambarSnap.empty) {
        const gambars: GambarPetaItem[] = gambarSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: String(data.type || 'polygon'),
            warna: String(data.warna || '#059669'),
            nama: String(data.nama || ''),
            ket: String(data.ket || ''),
            measurement: String(data.measurement || ''),
            geojson: typeof data.geojson === 'string' ? data.geojson : JSON.stringify(data.geojson || {}),
          };
        });
        setGambarList(gambars);
      }
    } catch (err) {
      console.warn('[MapSection] Firestore fetch warning:', err);
      setLayersList(DEFAULT_LOCATIONS);
    } finally {
      setLoading(false);
    }
  };

  // Load KML boundary polygon
  const loadKml = async (map: any) => {
    const L = window.L;
    if (!L || !map || !kmlGroupRef.current) return;
    try {
      const res = await fetch('/tugurejo.kml');
      if (!res.ok) return;
      const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
      const kmlGroup = kmlGroupRef.current;
      kmlGroup.clearLayers();

      const pms = xml.getElementsByTagName('Placemark');
      for (let i = 0; i < pms.length; i++) {
        const pm = pms[i];
        const dataNodes = pm.getElementsByTagName('Data');
        const ext: Record<string, string> = {};
        for (let j = 0; j < dataNodes.length; j++) {
          const n = dataNodes[j].getAttribute('name');
          const v = dataNodes[j].getElementsByTagName('value')[0]?.textContent || '';
          if (n) ext[n] = v;
        }

        const polys = pm.getElementsByTagName('Polygon');
        for (let p = 0; p < polys.length; p++) {
          const coordText = polys[p].getElementsByTagName('outerBoundaryIs')[0]
            ?.getElementsByTagName('coordinates')[0]?.textContent;
          if (!coordText) continue;

          const latlngs: [number, number][] = coordText.trim().split(/\s+/)
            .map((s) => {
              const parts = s.split(',');
              return [parseFloat(parts[1]), parseFloat(parts[0])] as [number, number];
            })
            .filter(([a, b]) => !isNaN(a) && !isNaN(b));

          if (!latlngs.length) continue;

          const poly = L.polygon(latlngs, {
            color: '#059669',
            weight: 3,
            opacity: 0.95,
            fillColor: '#10b981',
            fillOpacity: 0.15,
          });

          poly.on('mouseover', () => poly.setStyle({ weight: 4, fillOpacity: 0.28 }));
          poly.on('mouseout', () => poly.setStyle({ weight: 3, fillOpacity: 0.15 }));

          const kelurahan = ext.nm_kelurahan || 'Tugurejo';
          poly.bindPopup(`
            <div style="font-family:sans-serif;padding:6px 8px;min-width:200px">
              <div style="font-weight:900;font-size:.9rem;color:#0f172a;display:flex;align-items:center;gap:6px">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                Batas Desa ${kelurahan}
              </div>
              <div style="margin-top:6px;padding:3px 8px;background:#05966915;color:#059669;border:1px solid #05966930;border-radius:6px;font-size:.7rem;font-weight:800;display:inline-block">
                Batas Administrasi Wilayah
              </div>
              <div style="font-size:.75rem;color:#475569;margin-top:6px;line-height:1.4">
                Kecamatan Slahung, Kabupaten Ponorogo, Jawa Timur
              </div>
            </div>
          `);
          kmlGroup.addLayer(poly);
        }
      }

      if (kmlGroup.getLayers().length > 0) {
        const bounds = kmlGroup.getBounds();
        kmlBoundsRef.current = bounds;
        map.fitBounds(bounds, { padding: [30, 30], animate: true });
      }
    } catch (err) {
      console.warn('[MapSection] KML parse warning:', err);
    }
  };

  // Initialize Map
  useEffect(() => {
    _ensureLeaflet(() => {
      const L = window.L;
      if (!L) return;

      const container = document.getElementById('website-leaflet-map');
      if (!container) return;

      // Prevent "Map container is already initialized"
      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = null;
      }

      if (mapRef.current) {
        try {
          mapRef.current.off();
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }

      const map = L.map('website-leaflet-map', {
        center: PETA_CENTER,
        zoom: PETA_ZOOM,
        zoomControl: false,
        attributionControl: true,
      });
      mapRef.current = map;

      const osmL = L.tileLayer(TILE_LAYERS.osm.url, { attribution: TILE_LAYERS.osm.attr, maxZoom: 19, crossOrigin: true });
      const satL = L.tileLayer(TILE_LAYERS.satellite.url, { attribution: TILE_LAYERS.satellite.attr, maxZoom: 19, crossOrigin: true });
      const hybL = L.tileLayer(TILE_LAYERS.hybrid.url, { attribution: TILE_LAYERS.hybrid.attr, maxZoom: 20, crossOrigin: true });
      const gsL = L.tileLayer(TILE_LAYERS.google_sat.url, { attribution: TILE_LAYERS.google_sat.attr, maxZoom: 20, crossOrigin: true });
      const toL = L.tileLayer(TILE_LAYERS.topo.url, { attribution: TILE_LAYERS.topo.attr, maxZoom: 17, crossOrigin: true });

      // Default basemap
      hybL.addTo(map);

      const kmlGroup = L.featureGroup().addTo(map);
      kmlGroupRef.current = kmlGroup;

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      const gambarGroup = L.featureGroup().addTo(map);
      gambarGroupRef.current = gambarGroup;

      const baseMaps = {
        'Google Hybrid (Rekomendasi)': hybL,
        'OpenStreetMap': osmL,
        'Satelit Esri': satL,
        'Google Satelit': gsL,
        'Topografi': toL,
      };

      const overlayMaps = {
        'Batas Desa Tugurejo (KML)': kmlGroup,
        'Layer Posko & Titik Pantau': markersGroup,
        'Gambar Wilayah & Rute': gambarGroup,
      };

      L.control.layers(baseMaps, overlayMaps, { collapsed: true, position: 'topright' }).addTo(map);
      L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

      loadKml(map);
      fetchData();

      // Trigger size invalidation at intervals to guarantee sharp full rendering
      [50, 150, 400, 800].forEach((delay) => {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize({ animate: false });
          }
        }, delay);
      });

      setIsMapReady(true);
    });

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.off();
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
      kmlGroupRef.current = null;
      markersGroupRef.current = null;
      gambarGroupRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current || !window.L || !markersGroupRef.current) return;
    const L = window.L;
    const group = markersGroupRef.current;
    group.clearLayers();

    layersList
      .filter((l) => l.aktif !== false)
      .forEach((layer) => {
        if (!layer.lat || !layer.lng) return;
        const gmUrl = `https://maps.google.com/?q=${layer.lat},${layer.lng}`;
        const marker = L.marker([layer.lat, layer.lng], {
          icon: _makeIcon(layer.warna || '#059669', layer.simbol || 'posjaga'),
        });

        marker.bindPopup(`
          <div style="font-family:sans-serif;padding:6px 8px;min-width:210px">
            <div style="font-weight:900;color:#0f172a;font-size:.9rem;margin-bottom:4px">${layer.nama}</div>
            ${layer.deskripsi ? `<div style="font-size:.75rem;color:#475569;line-height:1.45;margin-bottom:8px">${layer.deskripsi}</div>` : ''}
            <a href="${gmUrl}" target="_blank" rel="noopener noreferrer"
              style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:${layer.warna || '#059669'};color:#ffffff;border-radius:8px;font-size:.72rem;font-weight:800;text-decoration:none;width:100%;justify-content:center;box-sizing:border-box">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Buka di Google Maps
            </a>
          </div>
        `);
        group.addLayer(marker);
      });
  }, [layersList, isMapReady]);

  // Update Shapes
  useEffect(() => {
    if (!mapRef.current || !window.L || !gambarGroupRef.current) return;
    const L = window.L;
    const group = gambarGroupRef.current;
    group.clearLayers();

    gambarList.forEach((item) => {
      try {
        const geoObj = JSON.parse(item.geojson);
        let layer: any;

        if (item.type === 'circle' && geoObj.center && geoObj.radius) {
          layer = L.circle([geoObj.center.lat, geoObj.center.lng], {
            radius: geoObj.radius,
            color: item.warna || '#059669',
            fillColor: item.warna || '#059669',
            fillOpacity: 0.2,
            weight: 2.5,
          });
        } else {
          layer = L.geoJSON(geoObj, {
            style: {
              color: item.warna || '#059669',
              fillColor: item.warna || '#059669',
              fillOpacity: 0.2,
              weight: 2.5,
            },
          });
        }

        const popupParts = [
          item.nama ? `<div style="font-weight:900;font-size:.85rem;color:#0f172a;margin-bottom:3px">${item.nama}</div>` : '',
          item.ket ? `<div style="font-size:.72rem;color:#475569;line-height:1.4">${item.ket}</div>` : '',
          item.measurement ? `<div style="font-size:.7rem;color:#059669;margin-top:4px;font-family:monospace;font-weight:bold">${item.measurement}</div>` : '',
        ].filter(Boolean).join('');

        if (popupParts) {
          layer.bindPopup(`<div style="font-family:sans-serif;padding:6px 8px;min-width:160px">${popupParts}</div>`);
        }

        group.addLayer(layer);
      } catch (err) {
        console.warn('[MapSection] gambar_peta parse warning:', err);
      }
    });
  }, [gambarList, isMapReady]);

  const handleReset = () => {
    if (!mapRef.current) return;
    kmlBoundsRef.current
      ? mapRef.current.fitBounds(kmlBoundsRef.current, { padding: [30, 30], animate: true })
      : mapRef.current.flyTo(PETA_CENTER, PETA_ZOOM, { animate: true });
  };

  const handleLocate = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.locate({ setView: true, maxZoom: 16 });
    map.on('locationfound', (e: any) => {
      if (locateMarkerRef.current) map.removeLayer(locateMarkerRef.current);
      if (locateCircleRef.current) map.removeLayer(locateCircleRef.current);
      const L = window.L;
      locateMarkerRef.current = L.circleMarker(e.latlng, {
        radius: 8,
        color: '#ffffff',
        fillColor: '#0284c7',
        fillOpacity: 1,
        weight: 3,
      }).addTo(map);
      locateCircleRef.current = L.circle(e.latlng, e.accuracy / 2, {
        color: '#0284c7',
        fillColor: '#0284c7',
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);
    });
  };

  const handleRefresh = () => {
    if (mapRef.current) loadKml(mapRef.current);
    fetchData();
  };

  const toggleFullscreen = () => {
    const el = document.getElementById('website-map-container');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => setIsFullscreen(true));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFs = () => {
      setIsFullscreen(!!document.fullscreenElement);
      [100, 300, 600].forEach((d) =>
        setTimeout(() => mapRef.current?.invalidateSize({ animate: false }), d)
      );
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  return (
    <div
      id="website-map-container"
      className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col relative"
    >
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 relative z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
              Peta Wilayah &amp; Poskamling Desa Tugurejo
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Kecamatan Slahung, Kabupaten Ponorogo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Focus button */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 px-3 rounded-xl hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-sm"
            title="Fokus ke Batas Desa Tugurejo"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Fokus Wilayah</span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 px-3 rounded-xl hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-sm"
            title="Muat Ulang Data Titik"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center justify-center text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-2 sm:py-2 sm:px-3 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Map Canvas Frame */}
      <div className="relative w-full h-[520px] sm:h-[600px] lg:h-[650px] bg-slate-950">
        <div id="website-leaflet-map" className="w-full h-full" style={{ zIndex: 1 }} />

        {/* Floating Zoom & GPS Controls */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Perbesar Peta (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Perkecil Peta (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleLocate}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-sky-600 shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mt-1 cursor-pointer"
            title="Deteksi Lokasi Saya"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
