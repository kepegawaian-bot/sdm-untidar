import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const data = {
  description: "Layanan ini diperuntukkan bagi Pegawai Kontrak / Tenaga Kependidikan Non ASN di lingkungan Universitas Tidar yang akan dilakukan evaluasi kinerja dan perpanjangan kontrak kerja.",
  dasarHukum: [
    "Undang-Undang Nomor 20 Tahun 2023 tentang Aparatur Sipil Negara.",
    "Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil jo Peraturan Pemerintah Nomor 17 Tahun 2020 tentang Perubahan atas Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil.",
    "Peraturan Pemerintah Nomor 49 Tahun 2018 tentang Manajemen Pegawai Pemerintah dengan Perjanjian Kerja.",
    "Peraturan Presiden Nomor 23 Tahun 2014 tentang Pendirian Universitas Tidar.",
    "Peraturan Menteri Pendidikan dan Kebudayaan Nomor 9 Tahun 2023 tentang Organisasi dan Tata Kerja Universitas Tidar.",
    "Peraturan Rektor Universitas Tidar Nomor 8 Tahun 2019 tentang Manajemen Tenaga Kependidikan Non ASN."
  ],
  pengertian: "Layanan ini diperuntukkan bagi Pegawai Kontrak / Tenaga Kependidikan Non ASN di lingkungan Universitas Tidar yang akan dilakukan evaluasi kinerja dan perpanjangan kontrak kerja.",
  jenisKenaikanPangkat: [
    {
      title: "Kelengkapan Berkas",
      description: "Dokumen yang wajib dilampirkan:",
      ketentuan: [],
      dokumen: [
        "Lembar penilaian kinerja pegawai kontrak.",
        "Lembar hasil evaluasi penilaian kinerja pegawai kontrak.",
        "Surat usul perpanjangan kontrak kerja.",
        "Rekapitulasi hasil penilaian kinerja pegawai kontrak.",
        "Database Bezetting Pegawai Kontrak.",
        "Draft SK Pengangkatan Kembali Tenaga Kependidikan Kontrak Non ASN.",
        "Draft Perjanjian Kontrak Kerja Pegawai Kontrak Non ASN.",
        "Materai untuk penandatanganan perjanjian kontrak kerja."
      ]
    },
    {
      title: "Output Layanan",
      description: "Hasil dari layanan evaluasi ini:",
      ketentuan: [],
      dokumen: [
        "SK Pengangkatan Kembali Tenaga Kependidikan Kontrak Non ASN.",
        "Perjanjian Kontrak Kerja Pegawai Kontrak Non ASN yang telah ditandatangani.",
        "Pegawai memperoleh kepastian status perpanjangan kontrak kerja."
      ]
    },
    {
      title: "Ketentuan Tambahan",
      description: "Ketentuan tambahan:",
      ketentuan: [],
      dokumen: [
        "Perpanjangan kontrak hanya dapat dilakukan berdasarkan hasil evaluasi kinerja pegawai.",
        "Pegawai dengan hasil penilaian kinerja tidak memenuhi standar dapat tidak diperpanjang kontraknya.",
        "Kontrak kerja berlaku sesuai jangka waktu yang ditetapkan dalam SK dan Perjanjian Kontrak Kerja."
      ]
    }
  ],
  alurSteps: [
    { title: "Pengantar Penilaian", description: "Unit kerja menyampaikan surat pengantar penilaian kinerja Pegawai Kontrak Non ASN." },
    { title: "Penilaian Kinerja", description: "Atasan langsung melakukan penilaian kinerja dan menyampaikan hasil evaluasi penilaian kinerja pegawai kontrak." },
    { title: "Penyampaian Evaluasi", description: "Hasil evaluasi penilaian kinerja Pegawai Kontrak Non ASN disampaikan kepada Kepala BPKU." },
    { title: "Verifikasi Kepegawaian", description: "Tim kepegawaian memeriksa dan memverifikasi hasil penilaian kinerja pegawai kontrak." },
    { title: "Penyiapan Draft", description: "Unit kepegawaian menyiapkan draft: SK Pengangkatan Kembali dan Perjanjian Kontrak Kerja." },
    { title: "Penandatanganan Pejabat", description: "Pejabat berwenang memeriksa dan menandatangani SK Pengangkatan Kembali serta Perjanjian Kontrak Kerja Pegawai Kontrak Non ASN." },
    { title: "Pemanggilan Pegawai", description: "Pegawai yang bersangkutan dipanggil untuk menandatangani perpanjangan kontrak kerja serta menerima SK Pengangkatan Kembali dan Perjanjian Kontrak Kerja." },
    { title: "Selesai", description: "Pegawai menandatangani Perjanjian Kontrak Kerja dan menerima SK Pengangkatan Kembali Tenaga Kependidikan Kontrak Non ASN." }
  ],
  pic: "Mifta Al Affif Hidayat"
};

async function run() {
  const settingsRef = doc(db, 'site_settings', 'main');
  const snap = await getDoc(settingsRef);
  if (snap.exists()) {
    let servicesData = snap.data().services || [];
    let found = false;
    servicesData.forEach((category: any) => {
        if (category.subCategories) {
            category.subCategories.forEach((subCategory: any) => {
                if (subCategory.title === "Layanan Pengelolaan Kepegawaian Bagi Tenaga Kependidikan") {
                    if (!subCategory.items) subCategory.items = [];
                    let item = subCategory.items.find((i: any) => i.title === 'Evaluasi dan Perpanjangan Kontrak Kerja Pegawai Kontrak (Non ASN)');
                    if (item) {
                        item.detail = data;
                        found = true;
                    } else {
                        subCategory.items.push({
                            title: 'Evaluasi dan Perpanjangan Kontrak Kerja Pegawai Kontrak (Non ASN)',
                            url: '#',
                            detail: data
                        });
                        found = true;
                    }
                }
            });
        }
    });

    if (found) {
      await updateDoc(settingsRef, { services: servicesData });
      console.log('Successfully updated Evaluasi dan Perpanjangan Kontrak Kerja Pegawai Kontrak (Non ASN) in Firestore!');
    } else {
      console.log('Category not found in services.');
    }
    process.exit(0);
  }
}

run().catch(console.error);
