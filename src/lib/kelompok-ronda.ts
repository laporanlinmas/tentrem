import { db } from './firebase';
import { collection, onSnapshot, getDocs, doc, setDoc } from 'firebase/firestore';

export interface KelompokRonda {
  id: string;
  nama: string;
  hari?: string;
  danpok?: string;
  danru?: string;
  poskamling?: string;
  anggota?: string[];
  jadwal?: string;
  keterangan?: string;
  urutan?: number;
  aktif?: boolean;
}

export const DEFAULT_KELOMPOK_LIST: KelompokRonda[] = [
  {
    id: 'kr-1',
    nama: 'Kelompok 1 — Dusun Krajan',
    hari: 'Senin',
    danpok: 'Ahmad Basith',
    danru: 'Ahmad Basith',
    poskamling: 'Poskamling RT 01 Dusun Krajan',
    jadwal: 'Senin Malam / 20.00 WIB',
    anggota: ['Ahmad Basith (Danpok)', 'Budi Santoso', 'Joko Widodo', 'Slamet Riyadi'],
    keterangan: 'Wilayah pantau Krajan Barat dan jalan poros desa',
    urutan: 1,
    aktif: true,
  },
  {
    id: 'kr-2',
    nama: 'Kelompok 2 — Dusun Krajan',
    hari: 'Selasa',
    danpok: 'Suyitno',
    danru: 'Suyitno',
    poskamling: 'Poskamling RT 03 Dusun Krajan',
    jadwal: 'Selasa Malam / 20.00 WIB',
    anggota: ['Suyitno (Danpok)', 'Agus Prayitno', 'Sunaryo', 'Dwi Cahyono'],
    keterangan: 'Wilayah pantau Krajan Timur dan perbatasan desa',
    urutan: 2,
    aktif: true,
  },
  {
    id: 'kr-3',
    nama: 'Kelompok 3 — Dusun Tugu',
    hari: 'Rabu',
    danpok: 'Sugeng Riyadi',
    danru: 'Sugeng Riyadi',
    poskamling: 'Poskamling RT 01 Dusun Tugu',
    jadwal: 'Rabu Malam / 20.00 WIB',
    anggota: ['Sugeng Riyadi (Danpok)', 'Suparman', 'Triyono', 'Hadi Sucipto'],
    keterangan: 'Wilayah pantau Tugu Utara dan perbukitan',
    urutan: 3,
    aktif: true,
  },
  {
    id: 'kr-4',
    nama: 'Kelompok 4 — Dusun Tugu',
    hari: 'Kamis',
    danpok: 'Bambang Sudarsono',
    danru: 'Bambang Sudarsono',
    poskamling: 'Poskamling RT 02 Dusun Tugu',
    jadwal: 'Kamis Malam / 20.00 WIB',
    anggota: ['Bambang Sudarsono (Danpok)', 'Rudi Hartono', 'Wahyu Hidayat', 'Mulyono'],
    keterangan: 'Wilayah pantau Tugu Selatan dan persawahan',
    urutan: 4,
    aktif: true,
  },
  {
    id: 'kr-5',
    nama: 'Kelompok Satgas Linmas Inti Desa',
    hari: 'Jumat',
    danpok: 'Koordinator Satlinmas',
    danru: 'Koordinator Satlinmas',
    poskamling: 'Pos Komando Balai Desa Tugurejo',
    jadwal: 'Jumat Malam / Patroli Mobiling',
    anggota: ['Koordinator Satlinmas (Danpok)', 'Anggota Satgas Siaga', 'Piket Desa'],
    keterangan: 'Patroli mobiling seluruh wilayah Desa Tugurejo',
    urutan: 5,
    aktif: true,
  },
];

/**
 * Realtime listener for Kelompok Ronda collection from Firestore.
 * Automatically initializes defaults if Firestore collection is empty.
 */
export function subscribeKelompokRonda(
  callback: (list: KelompokRonda[]) => void
): () => void {
  if (!db) {
    callback(DEFAULT_KELOMPOK_LIST);
    return () => {};
  }

  try {
    const colRef = collection(db, 'kelompok_ronda');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: KelompokRonda[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            const pDanpok = data.danpok || data.danru || '';
            let angList: string[] = Array.isArray(data.anggota)
              ? data.anggota
              : data.anggota
              ? String(data.anggota).split('\n')
              : [];
            angList = angList.map((s) => s.trim()).filter(Boolean);

            // Ensure Danpok is present at the top of anggota list with (Danpok) badge
            if (pDanpok) {
              const alreadyHasDanpok = angList.some(
                (a) => a.toLowerCase().startsWith(pDanpok.toLowerCase()) || a.toLowerCase().includes('(danpok)') || a.toLowerCase().includes('(danru)')
              );
              if (!alreadyHasDanpok) {
                angList = [`${pDanpok} (Danpok)`, ...angList];
              } else {
                // Standardize to (Danpok)
                angList = angList.map((a) =>
                  a.toLowerCase().startsWith(pDanpok.toLowerCase())
                    ? `${pDanpok} (Danpok)`
                    : a.replace(/\(Danru\)/gi, '(Danpok)')
                );
              }
            }

            items.push({
              id: d.id,
              nama: data.nama || 'Kelompok Ronda',
              hari: data.hari || 'Senin',
              danpok: pDanpok,
              danru: pDanpok,
              poskamling: data.poskamling || '',
              anggota: angList,
              jadwal: data.jadwal || '',
              keterangan: data.keterangan || '',
              urutan: typeof data.urutan === 'number' ? data.urutan : 99,
              aktif: data.aktif !== false,
            });
          });
          items.sort((a, b) => (a.urutan || 99) - (b.urutan || 99));
          callback(items.filter((k) => k.aktif !== false));
        } else {
          // Seed defaults
          DEFAULT_KELOMPOK_LIST.forEach(async (item) => {
            try {
              await setDoc(doc(db, 'kelompok_ronda', item.id), item);
            } catch {}
          });
          callback(DEFAULT_KELOMPOK_LIST);
        }
      },
      (error) => {
        console.warn('[subscribeKelompokRonda] Firestore error, fallback to defaults:', error);
        callback(DEFAULT_KELOMPOK_LIST);
      }
    );
    return unsubscribe;
  } catch {
    callback(DEFAULT_KELOMPOK_LIST);
    return () => {};
  }
}
