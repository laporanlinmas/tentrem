/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║         TENTREM Chatbot Knowledge Engine — v9.0 Super Intelligence       ║
 * ║         Desa Tugurejo, Kec. Slahung, Kab. Ponorogo × Satpol PP Ponorogo ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Inovator & Pengembang: Ahmad Basith (ASN Satpol PP Kab. Ponorogo)      ║
 * ║  Pembina & Pengarah: Erry Setiyoso Birowo, SP (Kabid SDA & Linmas)      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

export type Intent =
  | 'GREETING'
  | 'THANKS'
  | 'HOW'
  | 'WHERE'
  | 'WHEN'
  | 'WHO'
  | 'WHY'
  | 'COST'
  | 'WHAT'
  | 'COMPLAINT'
  | 'CONTACT'
  | 'TICKET'
  | 'DISASTER'
  | 'OFF_TOPIC'
  | 'GENERAL';

export type EntityType = 'TIME' | 'PERSON' | 'LOCATION' | 'NUMBER' | 'TOPIC';

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  raw: string;
  span: [number, number];
}

export interface IntentResult {
  primary: Intent;
  secondary?: Intent;
  scores: Map<Intent, number>;
  confidence: number;
}

export interface QueryAnalysis {
  raw: string;
  normalized: string;
  tokens: string[];
  expandedTokens: string[];
  intent: IntentResult;
  entities: ExtractedEntity[];
  isFollowUp: boolean;
  domainConfidence: number;
  isOffTopic: boolean;
}

export interface RetrievedChunk {
  idx: number;
  text: string;
  score: number;
  isHeaderLike: boolean;
}

export interface ScoredSentence {
  text: string;
  bm25Score: number;
  positionScore: number;
  totalScore: number;
  sourceChunk: number;
}

export interface SynthesisResult {
  response: string;
  quality: number;
}

// ════════════════════════════════════════════════════════════════════════════
// EMBEDDED KNOWLEDGE BASE — Lengkap, Akurat, dan Komprehensif
// ════════════════════════════════════════════════════════════════════════════
const FALLBACK_TENTREM_TEXT = `
# BASIS PENGETAHUAN RESMI SISTEM TENTREM DESA TUGUREJO KABUPATEN PONOROGO
TENTREM singkatan dari: Tugurejo Nyaman Tanggap Responsif Modern.
Nama Lengkap: Sistem Informasi dan Pelayanan Terpadu Ketentraman, Ketertiban Umum, dan Mitigasi Bencana Desa Tugurejo, Kecamatan Slahung, Kabupaten Ponorogo, Jawa Timur.
Akronim TENTREM: T=Tugurejo, E=... (dieja dari nama desa). Kepanjangan resmi: Tugurejo Nyaman Tanggap Responsif Modern.

[PENGEMBANG & PEMBINA SISTEM TENTREM]
Inovator & Pengembang Sistem: Ahmad Basith, Aparatur Sipil Negara (ASN) Satuan Polisi Pamong Praja (Satpol PP) Kabupaten Ponorogo.
Pembina & Penanggung Jawab: Erry Setiyoso Birowo, SP (Kepala Bidang Sumber Daya Aparatur dan Perlindungan Masyarakat / Kabid SDA & Linmas Satpol PP Kabupaten Ponorogo).
Sistem TENTREM dikembangkan atas inisiasi Satpol PP Kabupaten Ponorogo bekerjasama dengan Pemerintah Desa Tugurejo guna meningkatkan pelayanan publik, ketentraman wilayah, dan kesiapsiagaan bencana berbasis digital.

[VISI DAN MISI TENTREM]
Visi: Terwujudnya lingkungan Desa Tugurejo yang aman, tentram, tertib, tangguh bencana, dan berbasis pelayanan digital modern yang transparan.
Misi TENTREM:
1. Meningkatkan kesiapsiagaan Satlinmas dan masyarakat dalam menjaga keamanan dan ketertiban lingkungan desa.
2. Menyediakan kanal pengaduan masyarakat yang cepat, mudah diakses, akurat dengan titik GPS, dan terpantau proses penanganannya.
3. Memperkuat mitigasi dan respons cepat tanggap darurat terhadap potensi bencana alam di wilayah perbukitan.
4. Menghadirkan keterbukaan informasi publik desa melalui berita dan prakiraan cuaca real-time.
5. Mengukur mutu kepuasan publik secara berkala demi peningkatan pelayanan desa yang berkelanjutan.

[KARAKTERISTIK GEOGRAFIS DESA TUGUREJO]
Lokasi: Desa Tugurejo, Kecamatan Slahung, Kabupaten Ponorogo, Provinsi Jawa Timur, Kode Pos 63463.
Desa Tugurejo berada di koridor strategis jalan utama penghubung Kabupaten Ponorogo dengan Kabupaten Pacitan.
Topografi: Wilayah perbukitan, lereng pegunungan, dan lembah dataran hijau dengan vegetasi hutan rakyat, perkebunan cengkeh, jati, dan sawah terasering.
Dusun Krajan: Pusat pemerintahan desa, permukiman warga, dan kegiatan ekonomi.
Dusun Tugu: Kawasan pemukiman perbukitan dan area pertanian warga.
Posko Induk Balai Desa Tugurejo: Pusat koordinasi regu piket dan komando siaga Satlinmas.
Mata pencaharian warga: bertani, berkebun, beternak, berdagang, wiraswasta, dan aparatur sipil.
Tradisi gotong royong dan ronda malam poskamling terjaga kuat sebagai kearifan lokal desa.

[POTENSI KEBENCANAAN & MITIGASI TANGGAP DARURAT]
Kerawanan Bencana Alam di Desa Tugurejo:
1. Tanah Longsor & Amblesan: Kontur lereng perbukitan rentan longsor saat musim penghujan dengan intensitas tinggi dan durasi lama.
2. Banjir Luapan Drainase: Endapan sedimentasi pada saluran air lembah berisiko meluap ke jalan dan pemukiman saat curah hujan tinggi.
3. Pohon Tumbang & Angin Kencang: Angin kencang atau puting beliung berisiko menumbangkan pohon di jalur jalan raya dan sekitar rumah warga.
Mitigasi & Kesiapsiagaan Linmas:
- Patroli pemantauan retakan tebing lereng dan debit air secara berkala.
- Posko Satlinmas siaga 24 jam siap respons cepat tanggap darurat.
- Koordinasi langsung dengan BPBD Kabupaten Ponorogo, Satpol PP Ponorogo, Koramil Slahung, dan Polsek Slahung.
- Sosialisasi jalur evakuasi aman ke lapangan terbuka atau Balai Desa bila terjadi bencana.
Prosedur Lapor Darurat: Warga dapat melapor melalui menu Pengaduan di website TENTREM atau menghubungi nomor WhatsApp petugas piket siaga Linmas yang tersedia 24 jam.

[SATLINMAS DESA TUGUREJO & SATLINMAS KABUPATEN PONOROGO]
Satlinmas (Satuan Perlindungan Masyarakat) Desa Tugurejo bertugas menjaga ketentraman, ketertiban umum (Trantibum), dan perlindungan warga di tingkat desa.
Satlinmas dibina langsung oleh Satpol PP Kabupaten Ponorogo di bawah arahan Kabid SDA & Linmas Erry Setiyoso Birowo, SP.
Tugas pokok Satlinmas: pengamanan kegiatan warga, ronda poskamling, penanganan darurat bencana, deteksi dini kerawanan, dan sinergi bersama Babinsa (TNI) serta Bhabinkamtibmas (Polri).
Satlinmas membantu penyelenggaraan Pemilu, Pilkades, dan kegiatan adat budaya desa.

[POSKAMLING & SISTEM KEAMANAN LINGKUNGAN DESA]
Poskamling Dusun Krajan: Pos pengawasan keamanan permukiman warga dan jalur lingkungan utama.
Poskamling Dusun Tugu: Pos pemantauan kawasan perbukitan dan ronda malam warga.
Posko Induk Trantibum Balai Desa: Pusat koordinasi regu piket dan komando siaga Satlinmas.
Fasilitas Poskamling: kentongan tradisional, tongkat pengaman, senter penerangan, kotak P3K darurat, dan buku mutasi jaga malam.
Isyarat kentongan memiliki 7 kode: 1 pukulan = tanda bahaya umum, 2 pukulan = kebakaran, 3 pukulan = bencana alam/longsor, 4 pukulan = pencurian/garong, 5 pukulan = ada orang meninggal, 6 pukulan = tanda berkumpul warga, bunyi bertalu-talu = bahaya sangat darurat.

[FITUR & HALAMAN LENGKAP SISTEM TENTREM]

HALAMAN PROFIL DESA & VIDEO:
Halaman Profil menampilkan gambaran lengkap Desa Tugurejo, sejarah desa, visi-misi TENTREM, profil Ahmad Basith selaku inovator pengembang sistem, video profil desa, serta informasi Satpol PP Kabupaten Ponorogo sebagai institusi pembina.
URL: /profil

HALAMAN WARTA & BERITA DESA:
Publikasi resmi kegiatan kemasyarakatan, pembangunan, agenda desa, pengumuman, dan transparansi pemerintahan desa yang terindeks Google News & Search.
Berita dapat dicari berdasarkan kategori dan dilengkapi gambar, tanggal, serta konten lengkap yang bisa dibagikan.
URL: /berita

HALAMAN KANAL PENGADUAN WARGA (ADUAN):
Layanan pengaduan online 24 jam bagi warga Desa Tugurejo untuk melaporkan masalah ketertiban umum.
Kategori pengaduan: Ketertiban Umum, Kebersihan & Sampah, Kerusakan Fasilitas Umum (jalan, lampu PJU), Parkir Liar, PKL & Gangguan Usaha, Keamanan Lingkungan, Lainnya/Aspirasi.
Fitur: input nama, nomor WA, kategori, tanggal kejadian, lokasi GPS otomatis, foto bukti (kamera langsung & galeri), deskripsi kronologi.
Menghasilkan nomor tiket resmi format ADU-YYMMDD-XXXX (contoh: ADU-260821-0001).
Tab Lacak Status: untuk melacak perkembangan laporan berdasarkan nomor tiket.
Status laporan: Baru (biru), Diproses (kuning), Selesai (hijau), Ditolak (merah).
URL: /aduan

HALAMAN LAPORAN RONDA MALAM (RONDA):
Dokumentasi kegiatan ronda malam bergilir warga poskamling per hari (1 hari 1 laporan).
Sistem verifikasi sandi dari Komandan Kelompok (Danpok) atau petugas Linmas wajib diinput sebelum bisa membuat laporan.
Foto dokumentasi ronda diambil langsung dari kamera HP dengan stempel watermark GPS koordinat, nama Danpok, waktu, dan nama poskamling secara otomatis untuk menjaga keaslian laporan.
Data laporan tersinkronisasi real-time ke Dashboard Web Admin Satlinmas.
URL: /ronda

HALAMAN STRUKTUR ORGANISASI SATKAMLING:
Menampilkan bagan komando dan struktur organisasi Satuan Keamanan Lingkungan (Satkamling) Desa Tugurejo secara lengkap.
Berisi informasi jabatan, nama petugas, foto, dan tupoksi masing-masing anggota Satlinmas.
URL: /struktur

HALAMAN GALERI DOKUMENTASI:
Arsip foto dan dokumentasi kegiatan ronda malam, gotong royong, kegiatan Satlinmas, dan momen desa Tugurejo.
URL: /galeri

HALAMAN ISYARAT KENTONGAN:
Panduan lengkap 7 kode isyarat kentongan tradisional yang digunakan warga Desa Tugurejo.
Dilengkapi simulator bunyi akustik interaktif yang dapat dimainkan langsung di browser.
URL: /kentongan

HALAMAN PETA WILAYAH DIGITAL:
Peta interaktif digital Desa Tugurejo yang memperlihatkan batas dusun Krajan & Tugu, persebaran poskamling, sarana umum, dan zona mitigasi kerawanan bencana.
URL: /peta

HALAMAN JADWAL RONDA (SMART POSKAMLING):
Menampilkan jadwal dan status ronda malam harian, informasi kelompok ronda aktif, dan nama Danpok bertugas.
URL: /jadwal-ronda

HALAMAN RINCIAN TUGAS (TUPOKSI):
Detail Tugas Pokok dan Fungsi (Tupoksi) lengkap setiap jabatan dalam struktur Satlinmas Desa Tugurejo.
URL: /rincian-tugas

HALAMAN INVENTARIS ASET POSKAMLING:
Catatan dan manajemen inventaris aset peralatan poskamling milik Satlinmas Desa Tugurejo, mulai dari senjata tongkat, senter, kentongan, hingga perlengkapan P3K.
URL: /inventaris

HALAMAN SURVEI KEPUASAN MASYARAKAT (IKM):
Formulir digital Indeks Kepuasan Masyarakat (IKM) untuk mengukur mutu layanan publik desa dalam 5 indikator: Kemudahan, Kemanfaatan, Kecepatan, Keakuratan, dan Rekomendasi Layanan.
URL: /survei

HALAMAN PRAKIRAAN CUACA BMKG:
Data cuaca real-time dan prakiraan harian BMKG untuk wilayah Tugurejo Slahung, mencakup suhu, kelembaban, kecepatan angin, kondisi langit, dan peringatan dini cuaca ekstrem.
URL: /cuaca

[DASHBOARD WEB ADMIN TENTREM]
Dashboard Web Admin adalah panel kendali terpusat khusus untuk Petugas Satlinmas dan Administrator Desa.
Fitur Admin: verifikasi dan tindak lanjut aduan warga, monitoring laporan ronda malam harian, konfigurasi sandi & kelompok ronda, pengelolaan personil Satlinmas, manajemen berita desa, survei IKM, manajemen inventaris, dan penerbitan laporan resmi (PDF/Excel/DOCX).
URL Admin Dashboard: https://tentrem.vercel.app/admin atau melalui link dari Header website.
Login Admin menggunakan akun khusus yang diberikan oleh Administrator Sistem.

[KONTAK & MEDIA SOSIAL RESMI]
WhatsApp Hotline Satpol PP Ponorogo: +62 823-3701-7307
Website Resmi Satpol PP Ponorogo: https://satpolpp.ponorogo.go.id
Instagram Satlinmas Ponorogo: @satlinmas_ponorogo (https://instagram.com/satlinmas_ponorogo)
Facebook Satpol PP Ponorogo: https://www.facebook.com/people/Satpol-PP-Kabupaten-Ponorogo/100067181276904/
TikTok Satpol PP Ponorogo: @satpol.pp.ponorogo (https://www.tiktok.com/@satpol.pp.ponorogo)
X/Twitter Satpol PP Ponorogo: @SatpolppPonoro1 (https://x.com/SatpolppPonoro1)
Kontak Petugas Piket Siaga Linmas Desa Tugurejo tersedia di menu Hubungi Petugas pada website TENTREM, siap menerima laporan darurat 24 jam via WhatsApp.

[PERTANYAAN UMUM / FAQ SISTEM TENTREM]

Q: Apa singkatan TENTREM yang benar?
A: TENTREM adalah singkatan dari nama desa: **Tugurejo Nyaman Tanggap Responsif Modern**. Sistem ini merupakan portal layanan terpadu ketentraman, ketertiban umum, dan mitigasi bencana Desa Tugurejo, Kecamatan Slahung, Kabupaten Ponorogo.

Q: Bagaimana cara membuat aduan / laporan pengaduan?
A: Buka halaman Pengaduan di menu website (/aduan), isi Nama Lengkap dan Nomor WhatsApp, pilih Kategori Pengaduan, tentukan Tanggal Kejadian, masukkan Lokasi (atau klik Ambil Lokasi GPS Saat Ini), tulis rincian kronologi kejadian, unggah foto bukti (kamera HP atau galeri), lalu klik Kirim Laporan. Anda akan mendapat nomor tiket resmi.

Q: Bagaimana cara melacak / cek status aduan?
A: Buka halaman Pengaduan (/aduan), pilih tab Lacak Status, masukkan nomor tiket resmi Anda (contoh: ADU-260821-0001), klik Cari Tiket. Sistem akan menampilkan status: Baru, Diproses, Selesai, atau Ditolak beserta catatan tindak lanjut dari petugas.

Q: Apakah layanan TENTREM gratis?
A: Ya, seluruh layanan dalam sistem TENTREM — pengaduan, berita, survei, cuaca, galeri, peta — semuanya 100% GRATIS untuk warga masyarakat.

Q: Bagaimana cara lapor ronda malam?
A: Buka halaman Laporan Ronda (/ronda), masukkan sandi verifikasi Danpok yang berlaku, isi data ronda (anggota hadir, catatan patroli), ambil foto dokumentasi langsung dari kamera HP. Foto akan otomatis distempel watermark GPS, nama Danpok, waktu, dan identitas poskamling. Laporan tersinkron ke Web Admin.

Q: Siapa yang mengembangkan sistem TENTREM?
A: Sistem TENTREM diinisiasi dan dikembangkan oleh Ahmad Basith, ASN Satpol PP Kabupaten Ponorogo, di bawah bimbingan Erry Setiyoso Birowo, SP (Kabid SDA & Linmas Satpol PP Ponorogo).

Q: Siapa pembina sistem TENTREM?
A: Pembina dan Penanggung Jawab Sistem TENTREM adalah Erry Setiyoso Birowo, SP, Kepala Bidang Sumber Daya Aparatur dan Perlindungan Masyarakat (Kabid SDA & Linmas) Satpol PP Kabupaten Ponorogo.

Q: Di mana Desa Tugurejo berada?
A: Desa Tugurejo terletak di Kecamatan Slahung, Kabupaten Ponorogo, Provinsi Jawa Timur, di jalur utama Ponorogo-Pacitan, Kode Pos 63463.

Q: Apa saja dusun di Desa Tugurejo?
A: Desa Tugurejo terdiri dari 2 dusun: Dusun Krajan (pusat pemerintahan dan permukiman) dan Dusun Tugu (kawasan perbukitan dan pertanian).

Q: Bagaimana cara mengisi survei kepuasan / IKM?
A: Buka halaman Survei (/survei), isi formulir digital Indeks Kepuasan Masyarakat (IKM) dengan memberikan penilaian pada 5 indikator: Kemudahan, Kemanfaatan, Kecepatan, Keakuratan, dan Rekomendasi Layanan, lalu kirimkan penilaian Anda.

Q: Bagaimana cara melihat peta wilayah desa?
A: Buka halaman Peta Wilayah (/peta) untuk melihat peta interaktif digital Desa Tugurejo dengan batas dusun, lokasi poskamling, dan zona kerawanan bencana.

Q: Apa itu isyarat kentongan?
A: Kentongan adalah alat komunikasi tradisional yang digunakan warga dan anggota Satlinmas Desa Tugurejo. Ada 7 kode bunyi: 1 pukulan=tanda bahaya umum, 2 pukulan=kebakaran, 3 pukulan=bencana alam/longsor, 4 pukulan=maling/pencurian, 5 pukulan=ada orang meninggal, 6 pukulan=tanda berkumpul, bertalu-talu=bahaya sangat darurat.

Q: Bagaimana melihat prakiraan cuaca desa?
A: Buka halaman Cuaca (/cuaca) untuk melihat data cuaca real-time dan prakiraan harian BMKG wilayah Tugurejo Slahung, termasuk suhu, kelembaban, angin, dan peringatan dini cuaca ekstrem.

Q: Apa itu inventaris poskamling?
A: Halaman Inventaris (/inventaris) memuat catatan aset peralatan poskamling Satlinmas Desa Tugurejo, termasuk senjata tongkat, senter, kentongan, P3K, dan perlengkapan lainnya.

Q: Cara akses dashboard admin?
A: Dashboard Web Admin TENTREM dapat diakses melalui URL admin pada website. Login menggunakan akun resmi yang diberikan oleh Administrator Sistem kepada petugas Satlinmas dan aparat desa yang berwenang.

Q: Apa itu Danpok dalam sistem ronda?
A: Danpok adalah Komandan Kelompok, pemimpin regu ronda malam poskamling. Danpok memegang sandi/kunci akses laporan ronda agar hanya petugas bertugas yang bisa mengisi laporan. Setiap kelompok ronda memiliki Danpok yang bertugas secara bergilir.

Q: Berapa anggota kelompok ronda?
A: Setiap kelompok ronda Desa Tugurejo terdiri dari beberapa anggota warga dan personil Satlinmas yang bertugas bergilir di Poskamling Dusun Krajan dan Poskamling Dusun Tugu.

Q: Bagaimana sistem watermark foto ronda bekerja?
A: Saat anggota Satlinmas mengambil foto dokumentasi ronda menggunakan kamera pada halaman Laporan Ronda, sistem TENTREM secara otomatis menambahkan stempel watermark yang berisi: koordinat GPS lokasi, nama Danpok, tanggal dan waktu pengambilan foto, serta identitas poskamling. Hal ini memastikan keaslian dan kevalidan laporan.

Q: Apakah laporan pengaduan bisa dilampiri foto?
A: Ya, warga dapat melampirkan hingga 3 foto bukti per laporan. Foto bisa diambil langsung dari kamera HP (dengan pembacaan koordinat GPS otomatis) atau dipilih dari galeri foto.

Q: Bagaimana cara menghubungi petugas Linmas?
A: Klik menu Hubungi Petugas di website atau tanyakan kepada chatbot ini. Nomor WhatsApp petugas piket siaga Linmas Desa Tugurejo akan ditampilkan sesuai jadwal piket yang sedang bertugas. Petugas siap menerima laporan dan pertanyaan 24 jam.

Q: Apa fungsi galeri dokumentasi?
A: Halaman Galeri (/galeri) menampilkan arsip foto dan dokumentasi visual kegiatan ronda malam, gotong royong, pembinaan Satlinmas, dan berbagai kegiatan kemasyarakatan Desa Tugurejo.

Q: Apa itu Struktur Satkamling?
A: Halaman Struktur (/struktur) menampilkan bagan komando dan hierarki organisasi Satuan Keamanan Lingkungan (Satkamling) Desa Tugurejo, lengkap dengan nama, jabatan, foto, dan tugas masing-masing anggota Satlinmas.

Q: Apa fungsi halaman Jadwal Ronda / Smart Poskamling?
A: Halaman Jadwal Ronda (/jadwal-ronda) menampilkan informasi jadwal ronda malam harian, status kehadiran kelompok ronda aktif, dan nama Danpok yang bertugas hari ini.

Q: Apa itu Rincian Tugas / Tupoksi?
A: Halaman Rincian Tugas (/rincian-tugas) berisi penjelasan detail Tugas Pokok dan Fungsi (Tupoksi) setiap jabatan dalam struktur Satlinmas Desa Tugurejo, dari Komandan hingga anggota.
`;

let cachedKnowledgeText = '';
let fetchPromise: Promise<string> | null = null;

export async function getTentremText(): Promise<string> {
  if (cachedKnowledgeText) return cachedKnowledgeText;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch('/tentrem.txt');
      if (res.ok) {
        const txt = await res.text();
        if (txt && txt.trim().length > 100) {
          cachedKnowledgeText = txt;
          return txt;
        }
      }
    } catch {
      // ignore and use fallback
    }
    cachedKnowledgeText = FALLBACK_TENTREM_TEXT;
    return FALLBACK_TENTREM_TEXT;
  })();

  return fetchPromise;
}

export function prefetchTentremText(): void {
  getTentremText().catch(() => {});
}

// Backward compatibility alias
export const getSatgasLinmasText = getTentremText;
export const prefetchSatgasLinmasText = prefetchTentremText;

// ════════════════════════════════════════════════════════════════════════════
// QUERY PREPROCESSING & STEMMING
// ════════════════════════════════════════════════════════════════════════════
const SYNONYMS: Record<string, string[]> = {
  tentrem: ['aplikasi', 'sistem', 'portal', 'layanan', 'website', 'web'],
  satlinmas: ['linmas', 'hansip', 'petugas', 'personil', 'aparat', 'satuan perlindungan'],
  poskamling: ['ronda', 'siskamling', 'gardu', 'pos', 'jaga', 'satkamling', 'pos kamling'],
  aduan: ['lapor', 'pengaduan', 'keluhan', 'aspirasi', 'tiket', 'komplain', 'report'],
  bencana: ['longsor', 'banjir', 'kebencanaan', 'pohon tumbang', 'evakuasi', 'darurat', 'tanah longsor'],
  lokasi: ['alamat', 'tempat', 'wilayah', 'desa', 'dusun', 'krajan', 'tugu', 'slahung', 'ponorogo'],
  pembuat: ['pencipta', 'pengembang', 'inovator', 'ahmad basith', 'basith', 'satpol pp'],
  pembina: ['penanggung jawab', 'erry setiyoso', 'erry', 'kabid linmas', 'kabid sda'],
  cuaca: ['bmkg', 'hujan', 'suhu', 'prakiraan', 'angin', 'kelembaban', 'cuaca ekstrem'],
  berita: ['warta', 'informasi', 'kabar', 'pengumuman', 'agenda', 'kegiatan', 'artikel'],
  survei: ['ikm', 'evaluasi', 'kepuasan', 'penilaian', 'kuesioner', 'kritik', 'saran'],
  galeri: ['foto', 'gambar', 'dokumentasi', 'album', 'arsip foto', 'potret'],
  peta: ['map', 'wilayah', 'batas dusun', 'peta digital', 'titik', 'kerawanan'],
  kentongan: ['isyarat', 'kode', 'bunyi', 'tradisional', 'alat komunikasi', 'kentong'],
  inventaris: ['aset', 'alat', 'perlengkapan', 'peralatan', 'fasilitas poskamling'],
  struktur: ['bagan', 'organisasi', 'komando', 'hierarki', 'jabatan', 'susunan'],
  profil: ['video profil', 'sejarah', 'gambaran', 'tentang desa'],
  danpok: ['komandan kelompok', 'komandan ronda', 'pimpinan ronda', 'sandi ronda'],
  admin: ['dashboard', 'web admin', 'panel', 'login admin', 'administrator'],
  gratis: ['biaya', 'tarif', 'bayar', 'free', 'tidak berbayar', 'tanpa biaya'],
  tupoksi: ['rincian tugas', 'tugas pokok', 'fungsi', 'uraian tugas'],
  jadwal: ['jadwal ronda', 'smart poskamling', 'giliran', 'piket', 'shift'],
};

const STOPWORDS = new Set([
  'yang', 'untuk', 'pada', 'ke', 'para', 'namun', 'menurut', 'antara', 'dia', 'dua',
  'ia', 'seperti', 'jika', 'sehingga', 'kembali', 'dan', 'ini', 'karena', 'oleh',
  'saat', 'harus', 'kurang', 'saja', 'bisa', 'akan', 'aku', 'kami', 'kita', 'mereka',
  'dengan', 'dari', 'dalam', 'atau', 'juga', 'sudah', 'belum', 'ada', 'tidak', 'bukan'
]);

function normalizeQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeQuery(text)
    .split(' ')
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

// ════════════════════════════════════════════════════════════════════════════
// INTENT RECOGNITION
// ════════════════════════════════════════════════════════════════════════════
function detectIntent(normalized: string): IntentResult {
  const scores = new Map<Intent, number>();

  const check = (regex: RegExp, intent: Intent, weight = 1.0) => {
    if (regex.test(normalized)) {
      scores.set(intent, (scores.get(intent) || 0) + weight);
    }
  };

  check(/^(halo|hai|selamat|pagi|siang|sore|malam|assalamu|hi\b|hey\b)/i, 'GREETING', 2.0);
  check(/(terima kasih|makasih|suwun|matur nuwun|thanks|thx|tq\b)/i, 'THANKS', 2.0);
  check(/(siapa|pembuat|pengembang|inovator|pembina|tokoh|profil|ahmad basith|erry)/i, 'WHO', 2.0);
  check(/(bagaimana|cara|prosedur|panduan|langkah|tutorial|gimana|caranya|petunjuk)/i, 'HOW', 1.8);
  check(/(dimana|lokasi|alamat|peta|wilayah|dusun|krajan|tugu|slahung|letak)/i, 'WHERE', 1.8);
  check(/(kapan|waktu|jadwal|jam|piket|ronda|buka|operasional|giliran)/i, 'WHEN', 1.5);
  check(/(kenapa|mengapa|alasan|tujuan|fungsi|manfaat|gunanya|apa fungsi)/i, 'WHY', 1.5);
  check(/(biaya|tarif|bayar|gratis|harga|ongkos|berbayar|free)/i, 'COST', 2.0);
  check(/(aduan|lapor|keluhan|pengaduan|masalah|rusak|sampah|tertib|komplain)/i, 'COMPLAINT', 2.0);
  check(/(tiket|cek status|lacak|adu-|status laporan|nomor tiket)/i, 'TICKET', 2.0);
  check(/(kontak|wa|whatsapp|nomor|telepon|hubungi|call center|hotline|chat)/i, 'CONTACT', 2.0);
  check(/(bencana|longsor|banjir|angin|pohon tumbang|mitigasi|evakuasi|darurat|gempa)/i, 'DISASTER', 2.0);
  check(/(apa itu|apa sih|definisi|pengertian|tentrem|artinya|singkatan|kepanjangan)/i, 'WHAT', 1.5);

  let maxScore = 0;
  let primary: Intent = 'GENERAL';

  scores.forEach((score, intent) => {
    if (score > maxScore) {
      maxScore = score;
      primary = intent;
    }
  });

  return {
    primary,
    scores,
    confidence: maxScore,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// BM25+ HYBRID RETRIEVAL & SYNTHESIS
// ════════════════════════════════════════════════════════════════════════════
function splitIntoChunks(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(c => c.trim())
    .filter(c => c.length > 20);
}

function scoreChunk(chunk: string, tokens: string[]): number {
  const chunkNorm = chunk.toLowerCase();
  let score = 0;

  tokens.forEach(token => {
    if (chunkNorm.includes(token)) {
      score += 10;
      const count = (chunkNorm.match(new RegExp(token, 'g')) || []).length;
      score += Math.min(count, 4) * 2;
    }

    // Check domain synonyms
    Object.entries(SYNONYMS).forEach(([key, syns]) => {
      if (token === key && chunkNorm.includes(key)) {
        score += 6;
      }
      if (syns.some(s => token.includes(s) || s.includes(token))) {
        if (chunkNorm.includes(key) || syns.some(s => chunkNorm.includes(s))) {
          score += 4;
        }
      }
    });
  });

  return score;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN ASK CHATBOT PIPELINE
// ════════════════════════════════════════════════════════════════════════════
let lastAnswer = '';

export async function askChatbot(userQuery: string): Promise<string> {
  const rawQuery = userQuery.trim();
  if (!rawQuery) return 'Halo! Ada yang bisa saya bantu terkait sistem TENTREM Desa Tugurejo?';

  const normalized = normalizeQuery(rawQuery);
  const intentResult = detectIntent(normalized);

  // ── 1. Instant Intent Matches ──────────────────────────────────────────────
  if (intentResult.primary === 'GREETING') {
    return 'Halo! 👋 Selamat datang di **TENTREM** — *Tugurejo Nyaman Tanggap Responsif Modern*, Desa Tugurejo, Kec. Slahung, Kab. Ponorogo.\n\nAda yang bisa saya bantu? Saya siap memandu Anda mengenai layanan pengaduan warga, laporan ronda malam, berita desa, peta wilayah, cuaca BMKG, atau informasi Satlinmas.';
  }

  if (intentResult.primary === 'THANKS') {
    return 'Sama-sama! 😊 Senang bisa membantu Anda. Jika ada hal lain seputar Desa Tugurejo atau layanan TENTREM yang ingin ditanyakan, jangan ragu untuk bertanya kembali.';
  }

  if (intentResult.primary === 'COST') {
    return 'Seluruh layanan sistem TENTREM Desa Tugurejo — pengaduan warga, laporan ronda, berita desa, survei IKM, prakiraan cuaca BMKG, galeri, peta, hingga isyarat kentongan — semuanya **100% GRATIS** tanpa dipungut biaya apapun untuk warga masyarakat.';
  }

  // ── 2. Akronim & Kepanjangan TENTREM ──────────────────────────────────────
  if (/singkatan|kepanjangan|artinya|akronim|tentrem itu|apa itu tentrem|apa tentrem/i.test(normalized)) {
    return '**TENTREM** adalah singkatan dari:\n**Tugurejo Nyaman Tanggap Responsif Modern**\n\nSistem Informasi & Pelayanan Terpadu Ketentraman, Ketertiban Umum, dan Mitigasi Bencana Desa Tugurejo, Kecamatan Slahung, Kabupaten Ponorogo.';
  }

  // ── 3. Pengembang & Pembina ────────────────────────────────────────────────
  if (/siapa.*pembuat|siapa.*buat|siapa.*pengembang|ahmad basith|siapa.*inovator|siapa.*basith|basith itu|basith siapa/i.test(normalized)) {
    return '**Ahmad Basith** adalah inovator & pengembang Sistem TENTREM, ASN Satpol PP Kabupaten Ponorogo.';
  }

  if (/siapa.*pembina|siapa.*penanggung jawab|erry setiyoso|erry birowo|siapa.*erry|kabid linmas/i.test(normalized)) {
    return '**Erry Setiyoso Birowo, SP** adalah Pembina & Penanggung Jawab Sistem TENTREM, Kepala Bidang SDA & Linmas Satpol PP Kabupaten Ponorogo.';
  }

  // ── 4. Bencana & Mitigasi ─────────────────────────────────────────────────
  if (/longsor|bencana|kebencanaan|banjir|angin kencang|mitigasi|evakuasi|darurat|gempa|pohon tumbang/i.test(normalized) || intentResult.primary === 'DISASTER') {
    return 'Desa Tugurejo memiliki bentang alam perbukitan di jalur Ponorogo-Pacitan. Potensi kerawanan utama: **tanah longsor pada lereng perbukitan**, **banjir luapan drainase saat hujan deras**, dan **pohon tumbang akibat angin kencang**.\n\nSatlinmas siaga **24 jam** untuk deteksi dini, pemantauan debit air, dan tanggap darurat, berkoordinasi dengan BPBD Kabupaten Ponorogo, Satpol PP, Koramil Slahung, dan Polsek Slahung. Laporan darurat bisa disampaikan via menu Pengaduan atau WhatsApp petugas piket Linmas.';
  }

  // ── 5. Ronda & Poskamling ─────────────────────────────────────────────────
  if (/ronda|siskamling|poskamling|danpok|komandan kelompok|patroli malam|jadwal ronda|kelompok ronda|lapor ronda/i.test(normalized)) {
    return 'Layanan **Laporan Ronda Malam Poskamling** TENTREM:\n• Dokumentasi ronda malam berkala (1 hari 1 laporan)\n• Wajib verifikasi sandi dari **Danpok** (Komandan Kelompok) sebelum isi laporan\n• Foto dokumentasi otomatis distempel **watermark GPS** + nama Danpok + waktu\n• Tersinkron real-time ke Dashboard Web Admin\n• Tersedia di Poskamling Dusun Krajan & Dusun Tugu\n\nBuka halaman Lapor Ronda untuk memulai laporan ronda malam Anda.';
  }

  // ── 6. Satlinmas ─────────────────────────────────────────────────────────
  if (/satlinmas|linmas|hansip|anggota satlinmas|personil satlinmas/i.test(normalized)) {
    return 'Satlinmas (Satuan Perlindungan Masyarakat) Desa Tugurejo adalah garda terdepan ketentraman dan ketertiban desa. Dibina langsung oleh Satpol PP Kabupaten Ponorogo.\n\nTugas pokok: pengamanan kegiatan warga, ronda poskamling, tanggap darurat bencana, deteksi dini kerawanan, dan bersinergi bersama Babinsa (TNI) serta Bhabinkamtibmas (Polri).';
  }

  // ── 7. Kentongan ──────────────────────────────────────────────────────────
  if (/kentongan|isyarat kentongan|kode kentongan|bunyi kentongan|pukulan kentongan/i.test(normalized)) {
    return 'Isyarat kentongan Desa Tugurejo memiliki **7 kode bunyi**:\n• 1 pukulan = Tanda bahaya umum\n• 2 pukulan = Kebakaran\n• 3 pukulan = Bencana alam / Longsor\n• 4 pukulan = Pencurian / Garong\n• 5 pukulan = Ada orang meninggal\n• 6 pukulan = Tanda berkumpul warga\n• Bertalu-talu = Bahaya sangat darurat\n\nBuka halaman Isyarat Kentongan untuk simulator bunyi akustik interaktif.';
  }

  // ── 8. Inventaris ─────────────────────────────────────────────────────────
  if (/inventaris|aset poskamling|peralatan poskamling|perlengkapan ronda/i.test(normalized)) {
    return 'Halaman **Inventaris** memuat catatan dan manajemen aset peralatan Poskamling Satlinmas Desa Tugurejo, meliputi: tongkat pengaman, senter, kentongan, kotak P3K, seragam, dan perlengkapan patroli lainnya. Data inventaris dikelola oleh petugas Satlinmas dan tersinkron dengan Web Admin.';
  }

  // ── 9. Galeri ─────────────────────────────────────────────────────────────
  if (/galeri|foto ronda|dokumentasi kegiatan|arsip foto|album foto|gambar kegiatan/i.test(normalized)) {
    return 'Halaman **Galeri Dokumentasi** menampilkan arsip foto kegiatan ronda malam, gotong royong, pembinaan Satlinmas, dan momen-momen kegiatan kemasyarakatan Desa Tugurejo. Foto terorganisir secara sistematis dan dapat dilihat oleh seluruh warga.';
  }

  // ── 10. Struktur Organisasi ───────────────────────────────────────────────
  if (/struktur|bagan|organisasi|susunan|hierarki komando|jabatan satlinmas/i.test(normalized)) {
    return 'Halaman **Struktur Satkamling** menampilkan bagan komando dan hierarki organisasi Satuan Keamanan Lingkungan (Satkamling) Desa Tugurejo. Lengkap dengan nama, jabatan, foto, dan uraian tugas setiap anggota Satlinmas dari komandan hingga anggota.';
  }

  // ── 11. Profil Desa & Video ───────────────────────────────────────────────
  if (/profil desa|video profil|sejarah desa|tentang desa|gambaran desa/i.test(normalized)) {
    return 'Halaman **Profil Desa & Video** memuat gambaran lengkap Desa Tugurejo: letak geografis, sejarah desa, kondisi wilayah, visi-misi TENTREM, profil Ahmad Basith selaku inovator pengembang, video profil desa, serta informasi institusi pembina Satpol PP Kabupaten Ponorogo.';
  }

  // ── 12. Tupoksi / Rincian Tugas ───────────────────────────────────────────
  if (/tupoksi|rincian tugas|tugas pokok|fungsi jabatan|uraian tugas/i.test(normalized)) {
    return 'Halaman **Rincian Tugas (Tupoksi)** berisi penjelasan detail Tugas Pokok dan Fungsi setiap jabatan dalam struktur Satlinmas Desa Tugurejo, dari Komandan Satlinmas hingga anggota, mencakup kewajiban, wewenang, dan tanggung jawab masing-masing.';
  }

  // ── 13. Admin Dashboard ───────────────────────────────────────────────────
  if (/admin|dashboard|web admin|login admin|panel admin|administrator/i.test(normalized)) {
    return '**Dashboard Web Admin TENTREM** adalah panel kendali terpusat eksklusif untuk Petugas Satlinmas dan Administrator Desa.\n\nFitur Admin: verifikasi & tindak lanjut aduan warga, monitoring laporan ronda harian, konfigurasi sandi & kelompok ronda, manajemen personil, pengelolaan berita, survei IKM, inventaris, dan penerbitan laporan resmi (PDF/Excel/DOCX).\n\nLogin menggunakan akun resmi yang diberikan oleh Administrator Sistem.';
  }

  // ── 14. Survei / IKM ──────────────────────────────────────────────────────
  if (/survei|ikm|indeks kepuasan|evaluasi layanan|kritik saran|penilaian layanan/i.test(normalized)) {
    return 'Halaman **Survei Kepuasan Masyarakat (IKM)** menyediakan formulir digital untuk mengukur mutu layanan publik Desa Tugurejo. Tersedia 5 indikator penilaian: **Kemudahan**, **Kemanfaatan**, **Kecepatan**, **Keakuratan**, dan **Rekomendasi Layanan**.\n\nPartisipasi survei warga sangat membantu peningkatan kualitas pelayanan TENTREM.';
  }

  // ── 15. Berita / Warta Desa ───────────────────────────────────────────────
  if (/berita|warta|kabar desa|pengumuman|agenda desa|informasi terbaru/i.test(normalized)) {
    return 'Halaman **Warta & Berita Desa** menerbitkan berita resmi kegiatan kemasyarakatan, gotong royong, pembangunan, agenda desa, dan pengumuman penting Desa Tugurejo yang terindeks Google News & Search. Berita tersedia dalam format artikel lengkap dengan foto dan dapat dibagikan.';
  }

  // ── 16. Peta Wilayah ──────────────────────────────────────────────────────
  if (/peta|peta wilayah|batas dusun|titik poskamling|zona kerawanan|peta digital|map desa/i.test(normalized)) {
    return 'Halaman **Peta Wilayah Digital** menampilkan peta interaktif Desa Tugurejo dengan: batas Dusun Krajan & Dusun Tugu, titik-titik lokasi Poskamling, sarana umum, jalur jalan, dan zona kerawanan bencana. Sangat berguna untuk orientasi wilayah dan perencanaan patroli.';
  }

  // ── 17. Cuaca BMKG ────────────────────────────────────────────────────────
  if (/cuaca|bmkg|hujan|suhu|prakiraan cuaca|angin|kelembaban|cuaca ekstrem/i.test(normalized)) {
    return 'Halaman **Prakiraan Cuaca BMKG** menampilkan data cuaca real-time dan prakiraan harian BMKG untuk wilayah Tugurejo Slahung, meliputi: **suhu**, **kelembaban udara**, **kecepatan angin**, **kondisi langit**, dan **peringatan dini** cuaca ekstrem. Sangat bermanfaat untuk kesiapsiagaan bencana hidrometeorologi.';
  }

  // ── 18. Cara Lapor / Pengaduan ────────────────────────────────────────────
  if (/cara lapor|buat aduan|kirim pengaduan|cara pengaduan|bagaimana lapor|cara melaporkan/i.test(normalized) || intentResult.primary === 'COMPLAINT') {
    return 'Cara membuat laporan pengaduan di TENTREM:\n1. Buka halaman **Pengaduan** (/aduan)\n2. Isi **Nama Lengkap** dan **Nomor WhatsApp**\n3. Pilih **Kategori**: Ketertiban Umum, Kebersihan, Fasilitas Rusak, Parkir Liar, PKL, Keamanan, atau Lainnya\n4. Tentukan **Tanggal Kejadian**\n5. Masukkan **Lokasi** (atau klik tombol GPS Otomatis)\n6. Tulis **Kronologi** kejadian secara jelas\n7. Unggah **Foto Bukti** (kamera/galeri, maks. 3 foto)\n8. Klik **Kirim Laporan** → Anda mendapat **Nomor Tiket Resmi**';
  }

  // ── 19. Cek Tiket / Status Laporan ───────────────────────────────────────
  if (/lacak|cek tiket|status tiket|status laporan|nomor tiket|lacak laporan/i.test(normalized) || intentResult.primary === 'TICKET') {
    return 'Untuk melacak status laporan pengaduan:\n1. Buka halaman **Pengaduan** (/aduan)\n2. Pilih tab **Lacak Status**\n3. Masukkan **Nomor Tiket** Anda (contoh: `ADU-260821-0001`)\n4. Klik **Cari Tiket**\n\nStatus yang akan ditampilkan:\n🔵 **Baru** = Laporan diterima, menunggu verifikasi\n🟡 **Diproses** = Sedang ditindaklanjuti petugas\n🟢 **Selesai** = Penanganan selesai\n🔴 **Ditolak** = Laporan tidak memenuhi syarat';
  }

  // ── 20. Jadwal Ronda / Smart Poskamling ──────────────────────────────────
  if (/jadwal ronda|smart poskamling|giliran ronda|shift ronda|jadwal piket ronda/i.test(normalized)) {
    return 'Halaman **Jadwal Ronda (Smart Poskamling)** menampilkan jadwal ronda malam harian secara digital, mencakup: kelompok ronda bertugas hari ini, nama-nama anggota yang bertugas, status Danpok aktif, dan catatan laporan ronda terkini. Sistem ini membantu transparansi dan akuntabilitas kegiatan ronda.';
  }

  // ── 21. Watermark Foto ────────────────────────────────────────────────────
  if (/watermark|stempel foto|watermark gps|foto ronda bukti|foto otomatis/i.test(normalized)) {
    return 'Fitur **Watermark Otomatis** pada Laporan Ronda TENTREM memastikan keaslian dokumentasi ronda malam. Saat anggota mengambil foto dari kamera HP di halaman Laporan Ronda, sistem secara otomatis menyematkan:\n• Koordinat GPS lokasi pengambilan foto\n• Nama Danpok (Komandan Kelompok) yang bertugas\n• Tanggal & waktu pengambilan foto\n• Identitas Poskamling\n\nHal ini mencegah pemalsuan laporan dan memastikan akuntabilitas dokumentasi.';
  }

  // ── 22. Desa Tugurejo (Geografis & Umum) ─────────────────────────────────
  if (/desa tugurejo|dimana desa|letak desa|lokasi desa|kecamatan slahung|kab ponorogo|jawa timur/i.test(normalized) || intentResult.primary === 'WHERE') {
    return 'Desa Tugurejo terletak di **Kecamatan Slahung, Kabupaten Ponorogo, Provinsi Jawa Timur** (Kode Pos 63463). Berada di koridor jalur utama Ponorogo-Pacitan, dengan bentang alam perbukitan, lereng pegunungan, dan lembah hijau.\n\nWilayah terdiri dari:\n• **Dusun Krajan** — Pusat pemerintahan dan permukiman\n• **Dusun Tugu** — Kawasan perbukitan dan pertanian';
  }

  // ── 23. Kategori Pengaduan ────────────────────────────────────────────────
  if (/kategori aduan|jenis laporan|macam pengaduan|apa saja yang bisa dilaporkan/i.test(normalized)) {
    return 'Kategori pengaduan yang dapat dilaporkan melalui TENTREM:\n• **Ketertiban Umum** — Kerumunan, kebisingan, pelanggaran norma\n• **Kebersihan & Sampah** — Sampah liar, pencemaran lingkungan\n• **Kerusakan Fasilitas Umum** — Jalan berlubang, lampu PJU padam, saluran air tersumbat\n• **Parkir Liar** — Kendaraan mengganggu lalulintas\n• **PKL & Gangguan Usaha** — PKL di tempat terlarang\n• **Keamanan Lingkungan** — Potensi kriminalitas, orang mencurigakan\n• **Lainnya / Aspirasi** — Masukan, saran, dan aspirasi warga';
  }

  // ── 24. Piket / Kontak Darurat ────────────────────────────────────────────
  if (/piket|petugas piket|siaga|hotline|darurat|nomor darurat|linmas siaga/i.test(normalized)) {
    return 'Petugas Piket Siaga Satlinmas Desa Tugurejo siap melayani **24 jam** via WhatsApp. Nomor petugas piket yang sedang bertugas dapat dilihat di menu **Hubungi Petugas** pada website TENTREM atau klik tombol **Hubungi Petugas** di chatbot ini.\n\nUntuk darurat bencana, segera hubungi petugas piket atau buat laporan pengaduan di halaman Aduan dengan memilih kategori Keamanan Lingkungan.';
  }

  // ── 25. Satpol PP Ponorogo ────────────────────────────────────────────────
  if (/satpol pp|satpolpp|website satpol|satpol ponorogo/i.test(normalized)) {
    return 'Institusi Pembina Sistem TENTREM adalah **Satpol PP (Satuan Polisi Pamong Praja) Kabupaten Ponorogo**.\n• Website Resmi: satpolpp.ponorogo.go.id\n• WhatsApp: +62 823-3701-7307\n• Instagram: @satlinmas_ponorogo\n• Facebook: Satpol PP Kabupaten Ponorogo\n• TikTok: @satpol.pp.ponorogo\n• X/Twitter: @SatpolppPonoro1';
  }

  // ── 26. Knowledge Base Retrieval (Fallback) — Smart 5W1H Synthesis ─────────
  const knowledge = await getTentremText();
  const chunks = splitIntoChunks(knowledge);
  const tokens = tokenize(rawQuery);

  if (tokens.length === 0) {
    return 'Mohon ajukan pertanyaan yang lebih spesifik seputar layanan TENTREM, Satlinmas Desa Tugurejo, Poskamling, Bencana, atau informasi desa. Saya siap membantu! 😊';
  }

  // Deteksi tipe pertanyaan 5W1H untuk kontrol panjang jawaban
  const isWho   = /siapa|who\b|nama siapa|orangnya/i.test(rawQuery);
  const isWhat  = /\bapa\b|what\b|definisi|artinya|pengertian/i.test(rawQuery);
  const isWhere = /\bdimana\b|\bdi mana\b|lokasi|alamat|letak|terletak/i.test(rawQuery);
  const isWhen  = /\bkapan\b|jadwal|jam berapa|waktu|tanggal/i.test(rawQuery);
  const isWhy   = /kenapa|mengapa|alasan|tujuan|fungsi/i.test(rawQuery);
  const isHow   = /bagaimana|cara |gimana|langkah|prosedur/i.test(rawQuery);

  // Tentukan maks kalimat berdasarkan tipe pertanyaan
  const maxSentences = isWho || isWhere || isWhen ? 1
    : isWhat ? 2
    : isWhy || isHow ? 3
    : 2;

  // Score tiap chunk
  const scoredChunks: RetrievedChunk[] = chunks.map((text, idx) => ({
    idx,
    text,
    score: scoreChunk(text, tokens),
    isHeaderLike: text.startsWith('#') || text.startsWith('[') || text.startsWith('Q:'),
  }));

  scoredChunks.sort((a, b) => b.score - a.score);
  const bestChunks = scoredChunks.filter(c => c.score > 0).slice(0, 3);

  if (bestChunks.length === 0 || bestChunks[0].score < 6) {
    return 'Maaf, informasi tersebut belum tersedia. Coba tanyakan tentang:\n• **Ahmad Basith** (Inovator) atau **Erry Setiyoso Birowo** (Pembina)\n• **Pengaduan warga**, **Laporan Ronda**, **Berita Desa**\n• **Peta Wilayah**, **Cuaca BMKG**, **Kentongan**\n• **Satlinmas**, **Poskamling**, atau **Dashboard Admin**';
  }

  // Gabungkan teks, pisah per kalimat, score tiap kalimat terhadap query
  const allSentences: { text: string; score: number }[] = [];

  bestChunks.forEach(chunk => {
    // Pisah juga per baris (untuk format "Nama: nilai")
    const raw = chunk.text
      .replace(/^\[.*?\]/gm, '')
      .replace(/^#.*?$/gm, '')
      .replace(/^Q:.*?$/gm, '')
      .trim();

    const lines = raw.split(/\n/).map(l => l.trim()).filter(l => l.length > 8);
    lines.forEach(line => {
      const sents = line.split(/(?<=[.?!:])/).map(s => s.trim()).filter(s => s.length > 8);
      sents.forEach(s => {
        const sNorm = s.toLowerCase();
        let score = 0;
        tokens.forEach(t => {
          if (sNorm.includes(t)) score += 3;
        });
        // Bonus khusus per tipe pertanyaan
        if (isWho    && /nama|basith|erry|ahmad|inovator|pengembang|pembina/i.test(s)) score += 5;
        if (isWhere  && /desa|kecamatan|kabupaten|lokasi|terletak|alamat/i.test(s)) score += 5;
        if (isWhat   && /adalah|merupakan|yaitu|singkatan|kepanjangan/i.test(s)) score += 5;
        if (isWhen   && /jadwal|jam|piket|waktu|kapan|hari/i.test(s)) score += 5;
        if (isWhy    && /tujuan|fungsi|manfaat|karena|untuk/i.test(s)) score += 5;
        if (isHow    && /cara|langkah|buka|isi|klik|masukkan|pilih/i.test(s)) score += 5;
        if (score > 0) allSentences.push({ text: s, score });
      });
    });
  });

  // Sort dan ambil kalimat terbaik sesuai maxSentences
  allSentences.sort((a, b) => b.score - a.score);
  const unique = allSentences
    .filter((s, i, arr) => arr.findIndex(x => x.text === s.text) === i)
    .slice(0, maxSentences);

  const responseText = unique.map(s => s.text).join(' ').trim();
  lastAnswer = responseText;

  return responseText || 'TENTREM adalah portal layanan terpadu Desa Tugurejo yang dikembangkan oleh **Ahmad Basith** (ASN Satpol PP Ponorogo), dibina oleh **Erry Setiyoso Birowo, SP**.';
}

export function resetMemory(): void {
  lastAnswer = '';
}