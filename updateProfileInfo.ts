import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const fungsiTugas = [
  "Melaksanakan urusan ketatalaksanaan dan penyusunan formasi, rencana pengembangan, pengadaan, pengangkatan, mutasi, pengembangan, disiplin, pemberhentian, serta administrasi kepegawaian pendidik dan tenaga kependidikan.",
  "Membantu penyusunan program kerja sesuai bidang tugas tim untuk mendukung layanan fungsi biro;",
  "Mengoordinasikan urusan penyusunan bahan peta jabatan, analisis jabatan, evaluasi jabatan, dan analisis beban kerja;",
  "Mengoordinasikan urusan penyusunan bahan peta proses bisnis, prosedur kerja, dan standar pelayanan;",
  "Mengoordinasikan urusan pengelolaan sistem informasi tata laksana;",
  "Mengoordinasikan urusan analisis dan penyusunan bahan usul rencana kebutuhan/formasi dan pengembangan pendidik dan tenaga kependidikan;",
  "Mengoordinasikan urusan penyiapan bahan penerimaan, pengangkatan, penempatan, dan pemindahan pendidik dan tenaga kependidikan serta mutasi lainnya;",
  "Mengoordinasikan urusan penyiapan bahan usul kenaikan pangkat/jabatan akademik dan sertifikasi dosen serta usul kenaikan pangkat/jabatan tenaga kependidikan;",
  "Mengoordinasikan urusan penyiapan bahan usul penilaian angka kredit pendidik dan jabatan fungsional selain pendidik;",
  "Mengoordinasikan urusan pengangkatan dosen yang diberi tugas tambahan;",
  "Mengoordinasikan urusan pengangkatan tenaga kependidikan yang diangkat dalam jabatan struktural;",
  "Mengoordinasikan urusan perencanaan, penyusunan bahan usul, dan monitoring tugas belajar pendidik dan tenaga kependidikan;",
  "Mengoordinasikan urusan penyiapan bahan penilaian kinerja pendidik dan tenaga kependidikan;",
  "Mengoordinasikan urusan penyiapan bahan rencana pembinaan kompetensi dan pengembangan karier pendidik dan tenaga kependidikan;",
  "Mengoordinasikan urusan urusan pembinaan dan pengembangan karier pegawai;",
  "Melakukan urusan pengambilan sumpah/janji, pelantikan, dan serah terima jabatan;",
  "Mengoordinasikan urusan penyiapan bahan penggajian, tunjangan, jaminan kesehatan, jaminan ketenagakerjaan, dan jaminan hari tua/jaminan pensiun bagi pendidik dan tenaga kependidikan;",
  "Mengoordinasikan urusan informasi layanan tabungan perumahan rakyat bagi aparatur sipil negara;",
  "Mengoordinasikan urusan penyiapan tanda pengenal pegawai Untidar, kartu isteri/kartu suami, pemberian cuti, tanda jasa, dan penghargaan pendidik dan tenaga kependidikan;",
  "Mengoordinasikan urusan penyusunan usul ujian dinas dan ujian kenaikan pangkat penyesuaian ijazah;",
  "Mengoordinasikan urusan laporan harta kekayaan aparatur negara;",
  "Mengoordinasikan urusan penyiapan bahan pelaksanaan pemilihan pendidik dan tenaga kependidikan berprestasi;",
  "Mengoordinasikan urusan disiplin pendidik dan tenaga kependidikan;",
  "Mengoordinasikan urusan penyiapan bahan usul pemberian sanksi bagi pendidik dan tenaga kependidikan yang melakukan pelanggaran;",
  "Mengoordinasikan urusan penyusunan bahan usul pemberhentian dan pemensiunan pendidik dan tenaga kependidikan;",
  "Mengoordinasikan urusan penyusunan data dan informasi pendidik dan tenaga kependidikan;",
  "Mengoordinasikan urusan pengelolaan sistem informasi kepegawaian internal dan eksternal;",
  "Memberikan rekomendasi dan penilaian prestasi kinerja bawahan langsung dalam rangka pembinaan karir;",
  "Mengoordinasikan urusan penyimpanan dan pemeliharaan dokumen;",
  "Mengoordinasikan urusan penyusunan konsep laporan biro sesuai bidang tugas tim; dan",
  "Mengoordinasikan urusan tugas kedinasan lain yang diperintahkan atasan."
];

async function run() {
  const settingsRef = doc(db, 'site_settings', 'main');
  const snap = await getDoc(settingsRef);
  if (snap.exists()) {
    let data = snap.data();
    if (!data.profile) {
      data.profile = { description: "", functions: [], members: [] };
    }
    data.profile.functions = fungsiTugas;
    data.profile.description = "Biro Perencanaan, Keuangan, dan Umum Universitas Tidar";
    data.profile.logoUrl = "https://iili.io/Ba3KORp.png";
    data.profile.filosofiLogo = [
        { title: "Simbol 2 (dua) tangan", desc: "Merupakan wujud sikap untuk senantiasa membina, mengayomi, dan berkolaborasi yang baik antara peran pengelolaan manajemen sumber daya manusia dan manajemen tata laksana Untidar." },
        { title: "Warna Biru", desc: "Merupakan unsur peran tata laksana yang terorganisir -> berusaha memberikan pengelolaan tata laksana yang baik untuk capaian kebutuhan organisasi." },
        { title: "Warna Hijau", desc: "Merupakan unsur peran kepegawaian yang berkelanjutan -> berusaha memberikan layanan manajemen SDM dan mendukung pengembangan SDM yang optimal." },
        { title: "Segi 6 (Heksagon)", desc: "Melambangkan 1 (satu) makna output TLK Untidar: Unggul dan bermartabat; dan 5 (lima) makna nilai-nilai untuk membentuk karakter SDM Untidar: Tangguh, Integratif, Dedikatif, Aktif, dan Responsif." }
    ];
    data.profile.moto = "Menciptakan sumber daya manusia Untidar yang Unggul dan bermartabat dengan menerapkan 5 (lima) core value jati diri TIDAR yaitu Tangguh, Integratif, Dedikatif, Aktif, dan Responsif.";
    
    await updateDoc(settingsRef, { profile: data.profile });
    console.log("Profile updated successfully!");
  }
}

run().catch(console.error);
