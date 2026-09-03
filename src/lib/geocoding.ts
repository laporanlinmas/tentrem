export interface AddrResult {
  full: string;
  road: string;
  parts: string[];
}

export function reverseGeocodeForceStreet(lat: number, lng: number): Promise<AddrResult> {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve({
          full: 'Koordinat: ' + lat.toFixed(5) + ', ' + lng.toFixed(5) + ', Tugurejo, Slahung, Ponorogo',
          road: '',
          parts: ['Tugurejo', 'Slahung', 'Ponorogo']
        });
      }
    }, 4500);

    function finish(result: AddrResult) {
      if (done) return;
      clearTimeout(timer);
      done = true;
      resolve(result);
    }

    function buildAddr(road: string | null, houseNum: string | null, a: any): AddrResult {
      const parts: string[] = [];
      if (road) {
        let r = road;
        if (houseNum) r += ' No.' + houseNum;
        parts.push(r);
      }

      const dukuh = a.hamlet || a.allotments || a.neighbourhood || a.quarter || null;
      if (dukuh && dukuh !== road) parts.push('Dukuh ' + dukuh);

      const desa = a.village || a.town || a.suburb || 'Desa Tugurejo';
      parts.push(desa.startsWith('Desa') ? desa : 'Desa ' + desa);

      const kec = a.subdistrict || a.city_district || 'Slahung';
      parts.push(kec.startsWith('Kec') ? kec : 'Kec. ' + kec);

      const kab = a.city || a.county || a.regency || 'Kab. Ponorogo';
      parts.push(kab.startsWith('Kab') ? kab : 'Kab. ' + kab);

      parts.push('Jawa Timur, Indonesia');
      return { full: parts.join(', '), road: road || '', parts };
    }

    function buildFallback(latitude: number, longitude: number, addr: any | null): AddrResult {
      if (addr) {
        const parts: string[] = [];
        const desa = addr.village || addr.town || addr.suburb || 'Desa Tugurejo';
        parts.push(desa.startsWith('Desa') ? desa : 'Desa ' + desa);
        const kec = addr.subdistrict || addr.city_district || 'Slahung';
        parts.push(kec.startsWith('Kec') ? kec : 'Kec. ' + kec);
        const kab = addr.city || addr.county || addr.regency || 'Ponorogo';
        parts.push('Kab. ' + kab);
        parts.push('Jawa Timur, Indonesia');
        return { full: parts.join(', '), road: '', parts };
      }
      return {
        full: 'Lat ' + latitude.toFixed(5) + ', Long ' + longitude.toFixed(5) + ', Tugurejo, Slahung, Ponorogo',
        road: '',
        parts: ['Tugurejo', 'Slahung', 'Ponorogo']
      };
    }

    function tryOverpass(onFail: () => void) {
      const r = 0.0008;
      const q = '[out:json][timeout:4];way["highway"]["name"](' + (lat - r) + ',' + (lng - r) + ',' + (lat + r) + ',' + (lng + r) + ');out 1 tags;';
      fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q))
        .then((res) => res.json())
        .then((d) => {
          if (d && d.elements && d.elements.length > 0 && d.elements[0].tags && d.elements[0].tags.name) {
            const road = d.elements[0].tags.name;
            finish({
              full: road + ', Desa Tugurejo, Kec. Slahung, Kab. Ponorogo, Jawa Timur',
              road: road,
              parts: [road, 'Desa Tugurejo', 'Kec. Slahung', 'Kab. Ponorogo']
            });
          } else {
            onFail();
          }
        })
        .catch(() => {
          onFail();
        });
    }

    function tryZoom(zoom: number, nextZoom: number | null) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=${zoom}&addressdetails=1&namedetails=1&accept-language=id`
      )
        .then((res) => res.json())
        .then((d) => {
          if (done) return;
          if (!d || !d.address) {
            if (nextZoom) tryZoom(nextZoom, null);
            else finish(buildFallback(lat, lng, null));
            return;
          }
          const a = d.address;
          let road =
            a.road ||
            a.pedestrian ||
            a.footway ||
            a.path ||
            a.cycleway ||
            a.service ||
            a.track ||
            a.living_street ||
            a.motorway ||
            a.trunk ||
            a.primary ||
            a.secondary ||
            a.tertiary ||
            a.unclassified ||
            a.residential ||
            a.highway ||
            null;
          if (!road && d.namedetails && d.namedetails.name) road = d.namedetails.name;
          if (!road && d.display_name) {
            const cand = (d.display_name.split(',')[0] || '').trim();
            if (cand && !/^\d+\.?\d*$/.test(cand) && cand.length > 3) road = cand;
          }
          if (road) {
            finish(buildAddr(road, a.house_number || '', a));
          } else if (nextZoom) {
            tryZoom(nextZoom, null);
          } else {
            tryOverpass(() => {
              finish(buildFallback(lat, lng, a));
            });
          }
        })
        .catch(() => {
          if (done) return;
          if (nextZoom) tryZoom(nextZoom, null);
          else finish(buildFallback(lat, lng, null));
        });
    }

    tryZoom(19, 18);
  });
}
