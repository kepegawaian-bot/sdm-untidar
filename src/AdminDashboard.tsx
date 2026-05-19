import React, { useState, useEffect } from 'react';
import { auth, provider, db, storage, OperationType, handleFirestoreError } from './lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from './lib/utils';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection, query, orderBy } from 'firebase/firestore';
import { PORTAL_CONTENT } from './data/portalData';
import { Plus, Trash, ArrowUp, ArrowDown, ExternalLink, GripVertical, Scale, BookOpen, FileSignature, Settings, Users, Search, ArrowLeft, Save, CheckCircle2, Activity, TrendingUp, FileText, LogOut, Lock as LockIcon } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem(props: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-[-24px] top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      {props.children}
    </div>
  );
}

function PanduanEditor({ services }: { services: any[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [existingDetails, setExistingDetails] = useState<string[]>([]);

  // Track which services already have content in Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'service_details'), (snap) => {
      setExistingDetails(snap.docs.map(doc => doc.id));
    });
    return () => unsub();
  }, []);

  const categories = services.map(cat => ({
    name: cat.category,
    color: cat.color,
    items: [
      ...(cat.items || []),
      ...(cat.subCategories || []).flatMap((sub: any) => sub.items || [])
    ].map(item => ({
      ...item,
      slug: item.title.toLowerCase().replace(/\s+/g, '-')
    }))
  })).filter(cat => cat.items.length > 0);

  useEffect(() => {
    if (selectedSlug) {
      const load = async () => {
        setLoading(true);
        try {
          const snap = await getDoc(doc(db, 'service_details', selectedSlug));
          if (snap.exists()) {
            setDetail(snap.data());
          } else {
            const allItems = categories.flatMap(c => c.items);
            const svc = allItems.find(s => s.slug === selectedSlug);
            setDetail({
              title: svc?.title || selectedSlug,
              description: '',
              dasarHukum: [],
              pengertian: '',
              jenisKenaikanPangkat: [],
              alurSteps: [],
              pic: ''
            });
          }
        } catch (e) { console.error(e); }
        setLoading(false);
      };
      load();
    }
  }, [selectedSlug]);

  const handleSeedKenaikanPangkat = () => {
    setDetail({
      title: "Kenaikan Pangkat PNS",
      description: "Layanan pengusulan kenaikan pangkat bagi Pegawai Negeri Sipil di lingkungan Universitas Tidar.",
      dasarHukum: [
        "Undang-Undang Nomor 5 Tahun 2014 tentang Aparatur Sipil Negara",
        "Peraturan Pemerintah Nomor 11 Tahun 2017 stdd Peraturan Pemerintah Nomor 17 Tahun 2020",
        "Keputusan Kepala BKN Nomor 12 Tahun 2002",
        "Peraturan BKN Nomor 4 Tahun 2023 tentang Periodisasi Kenaikan Pangkat PNS"
      ],
      pengertian: "Kenaikan pangkat adalah penghargaan yang diberikan atas prestasi kerja dan pengabdian Pegawai Negeri Sipil yang bersangkutan terhadap Negara. Dimaksudkan sebagai dorongan untuk lebih meningkatkan prestasi kerja.",
      jenisKenaikanPangkat: [
        {
          title: "Kenaikan Pangkat Reguler",
          description: "Bagi PNS yang tidak menduduki jabatan struktural atau fungsional tertentu.",
          ketentuan: [
            "Sekurang-kurangnya telah 4 (empat) tahun dalam pangkat terakhir",
            "Setiap unsur penilaian prestasi kerja sekurang-kurangnya bernilai baik dalam 2 (dua) tahun terakhir",
            "Pindah golongan II ke III atau III ke IV wajib lulus Ujian Dinas (Udin)"
          ],
          dokumen: [
            "Penilaian Prestasi Kerja 2 (dua) tahun terakhir",
            "Surat Tanda Lulus Ujian Dinas (jika pindah golongan)",
            "Ijazah & Transkrip (jika ada peningkatan pendidikan)",
            "Surat Pencantuman Gelar dari BKN (jika ada)"
          ]
        },
        {
          title: "Kenaikan Pangkat Pilihan (Struktural)",
          description: "Bagi pejabat JPT Pratama, Administrator, dan Pengawas.",
          ketentuan: [
            "Telah 1 (satu) tahun dalam pangkat terakhir dan 1 tahun dalam jabatan",
            "Unsur penilaian prestasi kerja bernilai baik dalam 2 (dua) tahun terakhir"
          ],
          dokumen: [
            "Penilaian Prestasi Kerja 2 (dua) tahun terakhir"
          ]
        },
        {
          title: "Kenaikan Pangkat Pilihan (Fungsional)",
          description: "Bagi pejabat fungsional tertentu.",
          ketentuan: [
            "Sekurang-kurangnya telah 2 (dua) tahun dalam pangkat terakhir",
            "Telah memenuhi angka kredit yang ditentukan",
            "Unsur penilaian prestasi kerja bernilai baik dalam 2 (dua) tahun terakhir"
          ],
          dokumen: [
            "SK Penetapan Angka Kredit (PAK) terakhir",
            "Penilaian Prestasi Kerja 2 (dua) tahun terakhir"
          ]
        }
      ],
      alurSteps: [
        { title: "Pengusulan", description: "Pegawai mengumpulkan berkas usulan ke masing-masing Unit Kerja / Fakultas." },
        { title: "Verifikasi Internal", description: "Tim SDM melakukan verifikasi kelengkapan dokumen sesuai ketentuan." },
        { title: "Input SIASN", description: "Admin menginput data usul ke sistem SIASN BKN." },
        { title: "Pertimbangan Teknis", description: "BKN mengeluarkan Pertek (Pertimbangan Teknis) sebagai dasar SK." },
        { title: "Penerbitan SK", description: "Penandatanganan SK Kenaikan Pangkat oleh Pejabat yang Berwenang." }
      ],
      pic: "Anisa Hidayati, S.E."
    });
  };

  const handleSeedMutasi = () => {
    setDetail({
      title: "Mutasi PNS Tenaga Kependidikan",
      description: "Layanan pengajuan alih tugas/mutasi bagi Pegawai Negeri Sipil Tenaga Kependidikan.",
      dasarHukum: [
        "Undang-Undang Nomor 12 Tahun 2012 tentang Pendidikan Tinggi",
        "Undang-undang (UU) Nomor 20 Tahun 2023 tentang Aparatur Sipil Negara",
        "Peraturan Pemerintah Nomor 49 Tahun 2018 tentang Manajemen PPPK",
        "Peraturan Pemerintah (PP) Nomor 17 Tahun 2020 tentang Perubahan atas Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil",
        "Peraturan Pemerintah Nomor 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil",
        "Peraturan Menteri Riset, Teknologi, dan Pendidikan Tinggi Nomor 2 Tahun 2017 tentang Statuta Universitas Tidar",
        "Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 9 Tahun 2023 tentang Organisasi dan Tata Kerja Universitas Tidar"
      ],
      pengertian: "Pengajuan Alih Tugas/Mutasi PNS Tenaga Kependidikan adalah layanan kepegawaian yang diberikan kepada Pegawai Negeri Sipil Tenaga Kependidikan untuk mengajukan perpindahan tugas atau mutasi kerja ke Universitas Tidar, baik dari instansi lain maupun antar satuan kerja, sesuai dengan ketentuan peraturan perundang-undangan dan kebutuhan organisasi.",
      jenisKenaikanPangkat: [
        {
          title: "Persyaratan Dokumen",
          description: "Dokumen yang wajib disiapkan dan dilampirkan oleh pemohon.",
          ketentuan: [
            "Surat ditujukan kepada Rektor Universitas Tidar",
            "Sesuai kebutuhan organisasi dan formasi yang tersedia",
            "Lulus asesmen internal Universitas Tidar"
          ],
          dokumen: [
            "Surat permohonan alih tugas/mutasi",
            "Surat lamaran alih tugas/mutasi",
            "SK CPNS & SK PNS",
            "SK Pangkat Terakhir",
            "SK Jabatan Terakhir",
            "Surat bersedia melepas dari instansi asal",
            "Berkas mutasi sesuai ketentuan Kemendiktisaintek"
          ]
        }
      ],
      alurSteps: [
        { title: "Pengajuan", description: "Pemohon mengajukan permohonan kepada Rektor melalui Petugas Persuratan." },
        { title: "Telaah Rektor", description: "Rektor menelaah and memberikan disposisi kepada Kepala Biro." },
        { title: "Pertimbangan Biro", description: "Analisis kebutuhan pegawai dan dokumen beban kerja." },
        { title: "Asesmen", description: "Unit Tata Laksana dan Kepegawaian melakukan asesmen terhadap pemohon." },
        { title: "Surat Kelayakan", description: "Penerbitan surat keterangan kelayakan alih tugas/mutasi." },
        { title: "Penyusunan Draf", description: "Penyusunan draf surat pengantar dan kesediaan menerima." },
        { title: "Tanda Tangan", description: "Rektor menandatangani surat pengantar dan kesediaan." },
        { title: "Penyampaian Berkas", description: "Berkas dikirim ke Kementerian melalui SINDE dan email." }
      ],
      pic: "Devina Araminta, S.E."
    });
  };

  if (!selectedSlug) {
    return (
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Katalog Panduan Layanan</h2>
              <p className="text-slate-500 font-medium">Pilih jenis layanan untuk melengkapi detail informasi panduan (SOP).</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama layanan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-10">
            {categories.map((cat, i) => {
              const filteredItems = cat.items.filter(item => 
                item.title.toLowerCase().includes(searchQuery.toLowerCase())
              );
              if (filteredItems.length === 0) return null;

              return (
                <div key={i} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-2 h-6 rounded-full bg-blue-600")} />
                    <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">{cat.name}</h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-400">{filteredItems.length} ITEM</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item, j) => {
                      const hasContent = existingDetails.includes(item.slug);
                      return (
                        <button 
                          key={j} 
                          onClick={() => setSelectedSlug(item.slug)} 
                          className={cn(
                            "group flex flex-col p-5 border rounded-[2rem] text-left transition-all hover:shadow-xl",
                            hasContent 
                              ? "bg-white border-green-100 hover:border-green-300" 
                              : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-blue-300"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                              hasContent ? "bg-green-50 text-green-600" : "bg-white text-slate-300"
                            )}>
                              {hasContent ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </div>
                            {hasContent ? (
                              <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Lengkap</span>
                            ) : (
                              <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-full uppercase tracking-widest">Belum Diisi</span>
                            )}
                          </div>
                          <span className="font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors text-sm leading-snug tracking-tight">
                            {item.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (loading || (selectedSlug && !detail)) return (
    <div className="bg-white p-20 rounded-[3rem] text-center flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Memuat Data Layanan...</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 sticky top-0 z-50 bg-slate-50/80 backdrop-blur py-4">
        <button 
          onClick={() => setSelectedSlug(null)} 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-600 hover:text-blue-600 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              setSaving(true);
              try {
                await setDoc(doc(db, 'service_details', selectedSlug), { ...detail, updatedAt: serverTimestamp() });
                alert('Detail Panduan Layanan Berhasil Disimpan!');
              } catch(e) { handleFirestoreError(e, OperationType.UPDATE, `service_details/${selectedSlug}`); }
              setSaving(false);
            }} 
            disabled={saving} 
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
            {saving ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
          </button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 space-y-12">
        <div className="pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-4">
           <div>
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2 block">Nama Layanan (Otomatis)</label>
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{detail.title}</h2>
           </div>
           {selectedSlug === 'kenaikan-pangkat-pns' && (
             <button 
               onClick={handleSeedKenaikanPangkat}
               className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-xs font-black hover:bg-amber-100 transition-colors"
             >
               ✨ GUNAKAN TEMPLATE KP
             </button>
           )}
           {selectedSlug === 'mutasi-pns-tenaga-kependidikan' && (
             <button 
               onClick={handleSeedMutasi}
               className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-xs font-black hover:bg-amber-100 transition-colors"
             >
               ✨ GUNAKAN TEMPLATE MUTASI
             </button>
           )}
        </div>

        <section className="space-y-4">
           <div className="flex items-center justify-between">
             <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                <Scale className="w-4 h-4 text-slate-400" /> Dasar Hukum
             </h3>
             <button 
               className="text-xs font-black px-4 py-2 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition"
               onClick={() => alert("Fitur AI: Generate Dasar Hukum otomatis")}
             >
               ✨ Generate dengan AI
             </button>
           </div>
           <div className="space-y-3">
             {detail.dasarHukum.map((h: string, i: number) => (
               <div key={i} className="flex gap-2 group animate-in slide-in-from-left-2">
                 <input 
                   placeholder="Undang-undang / Peraturan..."
                   value={h} 
                   onChange={e => {
                     const copy = [...detail.dasarHukum];
                     copy[i] = e.target.value;
                     setDetail({...detail, dasarHukum: copy});
                   }} 
                   className="flex-1 bg-slate-50 border-slate-100 rounded-2xl px-5 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all" 
                 />
                 <button 
                   onClick={() => setDetail({...detail, dasarHukum: detail.dasarHukum.filter((_:any,idx:number)=>idx!==i)})}
                   className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                 >
                   <Trash className="w-4 h-4 text-red-400"/>
                 </button>
               </div>
             ))}
             <button 
               onClick={() => setDetail({...detail, dasarHukum: [...detail.dasarHukum, '']})} 
               className="flex items-center gap-2 text-xs text-blue-600 font-black px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
             >
               <Plus className="w-3 h-3" /> Tambah Dasar Hukum
             </button>
           </div>
        </section>

        <section className="space-y-4">
           <div className="flex items-center justify-between">
             <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-400" /> Pengertian
             </h3>
             <button 
               className="text-xs font-black px-4 py-2 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition"
               onClick={() => alert("Fitur AI: Generate Pengertian secara otomatis")}
             >
               ✨ Generate dengan AI
             </button>
           </div>
           <textarea 
             value={detail.pengertian} 
             onChange={e => setDetail({...detail, pengertian: e.target.value})} 
             className="w-full bg-slate-50 border-slate-100 rounded-[2rem] p-6 text-sm font-medium leading-relaxed min-h-[150px] focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all" 
             placeholder="Jelaskan definisi atau pengertian dari layanan ini..." 
           />
        </section>

        <section className="space-y-6">
           <div className="flex items-center justify-between">
             <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-slate-400" /> Jenis, Syarat & Kelengkapan Dokumen
             </h3>
             <button 
               onClick={() => setDetail({...detail, jenisKenaikanPangkat: [...(detail.jenisKenaikanPangkat || []), {title: '', description: '', ketentuan: [''], dokumen: ['']}]})} 
               className="text-xs font-black px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition-all"
             >
               + Tambah Sub-Kategori / Jenis
             </button>
           </div>
           
           <div className="space-y-8">
              {detail.jenisKenaikanPangkat?.map((j: any, idx: number) => (
                <div key={idx} className="border border-slate-100 rounded-[2.5rem] bg-slate-50/50 p-8 relative group">
                  <button 
                    onClick={() => setDetail({...detail, jenisKenaikanPangkat: detail.jenisKenaikanPangkat.filter((_:any,i:number)=>i!==idx)})} 
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash className="w-5 h-5"/>
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Nama Jenis Layanan</label>
                        <input 
                          value={j.title} 
                          onChange={e => {
                            const copy = [...detail.jenisKenaikanPangkat];
                            copy[idx] = {...copy[idx], title: e.target.value};
                            setDetail({...detail, jenisKenaikanPangkat: copy});
                          }} 
                          className="w-full bg-white font-bold text-slate-800 rounded-xl px-4 py-3 border border-slate-100 outline-none focus:border-blue-500" 
                          placeholder="Misal: Kenaikan Pangkat Reguler" 
                        />
                        <input 
                          value={j.description} 
                          onChange={e => {
                            const copy = [...detail.jenisKenaikanPangkat];
                            copy[idx] = {...copy[idx], description: e.target.value};
                            setDetail({...detail, jenisKenaikanPangkat: copy});
                          }} 
                          className="w-full bg-white text-xs text-slate-500 font-medium rounded-xl px-4 py-2 border border-slate-100" 
                          placeholder="Keterangan singkat siapa yang berhak..." 
                        />
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Ketentuan & Kriteria:</p>
                        <div className="space-y-2">
                          {j.ketentuan?.map((k: string, kIdx: number) => (
                            <div key={kIdx} className="flex gap-2">
                              <input 
                                value={k} 
                                onChange={e => {
                                  const copy = [...detail.jenisKenaikanPangkat];
                                  const ket = [...copy[idx].ketentuan];
                                  ket[kIdx] = e.target.value;
                                  copy[idx] = {...copy[idx], ketentuan: ket};
                                  setDetail({...detail, jenisKenaikanPangkat: copy});
                                }} 
                                className="flex-1 bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs" 
                                placeholder="Telah 4 tahun dalam pangkat..."
                              />
                              <button onClick={() => {
                                const copy = [...detail.jenisKenaikanPangkat];
                                copy[idx] = {...copy[idx], ketentuan: copy[idx].ketentuan.filter((_:any,i:number)=>i!==kIdx)};
                                setDetail({...detail, jenisKenaikanPangkat: copy});
                              }}><Trash className="w-3 h-3 text-slate-300" /></button>
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              const copy = [...detail.jenisKenaikanPangkat];
                              copy[idx] = {...copy[idx], ketentuan: [...(copy[idx].ketentuan || []), '']};
                              setDetail({...detail, jenisKenaikanPangkat: copy});
                            }} 
                            className="text-[10px] text-blue-600 font-black">+ Tambah Ketentuan</button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Kelengkapan Dokumen:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {j.dokumen?.map((d: string, dIdx: number) => (
                          <div key={dIdx} className="flex gap-2">
                            <input 
                              value={d} 
                              onChange={e => {
                                 const copy = [...detail.jenisKenaikanPangkat];
                                 const docs = [...copy[idx].dokumen];
                                 docs[dIdx] = e.target.value;
                                 copy[idx] = {...copy[idx], dokumen: docs};
                                 setDetail({...detail, jenisKenaikanPangkat: copy});
                              }} 
                              className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs" 
                              placeholder="FC SK Pangkat / PAK / Ijazah..."
                            />
                            <button onClick={() => {
                              const copy = [...detail.jenisKenaikanPangkat];
                              copy[idx] = {...copy[idx], dokumen: copy[idx].dokumen.filter((_:any,i:number)=>i!==dIdx)};
                              setDetail({...detail, jenisKenaikanPangkat: copy});
                            }}><Trash className="w-3 h-3 text-slate-300" /></button>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const copy = [...detail.jenisKenaikanPangkat];
                            copy[idx] = {...copy[idx], dokumen: [...(copy[idx].dokumen || []), '']};
                            setDetail({...detail, jenisKenaikanPangkat: copy});
                          }} 
                          className="text-[10px] text-blue-600 font-black">+ Tambah Dokumen</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </section>

        <section className="space-y-4">
           <div className="flex items-center justify-between">
             <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" /> Alur & SOP Progress
             </h3>
             <div className="flex gap-2">
               <button 
                 className="text-xs font-black px-4 py-2 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700"
                 onClick={() => alert("Fitur AI: Generate SOP dari Peraturan...")}
               >
                 ✨ Generate dengan AI
               </button>
             </div>
           </div>
           
           <div className="space-y-4 flex items-center gap-4">
             <label className={`flex-1 flex items-center gap-3 p-4 bg-white border ${detail.sopMode !== 'file' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'} rounded-2xl cursor-pointer hover:border-blue-500`}>
               <input type="radio" checked={detail.sopMode !== 'file'} onChange={() => setDetail({...detail, sopMode: 'text'})} className="text-blue-600 w-4 h-4" />
               <span className="text-sm font-bold text-slate-700">Isi Manual (Teks)</span>
             </label>
             <label className={`flex-1 flex items-center gap-3 p-4 bg-white border ${detail.sopMode === 'file' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'} rounded-2xl cursor-pointer hover:border-blue-500`}>
               <input type="radio" checked={detail.sopMode === 'file'} onChange={() => setDetail({...detail, sopMode: 'file'})} className="text-blue-600 w-4 h-4" />
               <span className="text-sm font-bold text-slate-700">Upload PDF SOP / Link Gambar</span>
             </label>
           </div>
           
           {detail.sopMode === 'file' ? (
             <div className="bg-white p-6 border border-slate-200 rounded-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Upload File PDF (Disarankan)</label>
                    <div className="flex gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-100 transition-all font-bold text-sm">
                        <Plus className="w-4 h-4" /> Pilih & Upload PDF
                        <input 
                          type="file" 
                          accept="application/pdf,image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            if (file.size > 5 * 1024 * 1024) {
                              alert("File terlalu besar (maks 5MB)");
                              return;
                            }

                            setSaving(true);
                            try {
                              if (!storage) {
                                throw new Error("Firebase Storage service is not initialized. Please check your configuration.");
                              }
                              const storageRef = ref(storage, `sop_files/${selectedSlug}_${Date.now()}_${file.name}`);
                              await uploadBytes(storageRef, file);
                              const url = await getDownloadURL(storageRef);
                              setDetail({...detail, sopUrl: url});
                              alert("Berhasil mengunggah dokumen!");
                            } catch (error) {
                              console.error("Upload error:", error);
                              alert("Gagal mengunggah file. Pastikan Firebase Storage sudah aktif & rules mengizinkan write.");
                            }
                            setSaving(false);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Atau Gunakan Link URL</label>
                    <input 
                      type="url" 
                      value={detail.sopUrl || ''} 
                      onChange={e => setDetail({...detail, sopUrl: e.target.value})}
                      placeholder="https://drive.google.com/... atau url lain"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none flex-1 font-medium text-sm"
                    />
                  </div>
                </div>

                {detail.sopUrl && (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner bg-slate-50">
                    <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preview Dokumen Terpasang</span>
                       <button onClick={() => setDetail({...detail, sopUrl: ''})} className="text-red-500 hover:text-red-700">
                         <Trash className="w-3.5 h-3.5" />
                       </button>
                    </div>
                    {detail.sopUrl.toLowerCase().endsWith('.pdf') || detail.sopUrl.includes('firebasestorage') || detail.sopUrl.includes('drive.google.com') ? (
                      <iframe 
                        src={detail.sopUrl.includes('drive.google.com') ? detail.sopUrl.replace('/view', '/preview') : detail.sopUrl} 
                        className="w-full aspect-[4/3] border-none" 
                        title="SOP Preview"
                      />
                    ) : (
                      <img src={detail.sopUrl} alt="SOP Preview" className="w-full h-auto object-contain max-h-[500px]" />
                    )}
                  </div>
                )}
                <p className="text-xs text-slate-500">File yang diunggah akan disimpan di Firebase Storage (Spark Plan Free Tier). Batas ukuran file adalah 5MB.</p>
             </div>
           ) : (
            <div className="space-y-3">
               {detail.alurSteps.map((s: any, idx: number) => (
                 <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">{idx+1}</div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        value={s.title} 
                        onChange={e => {
                          const copy = [...detail.alurSteps];
                          copy[idx] = {...copy[idx], title: e.target.value};
                          setDetail({...detail, alurSteps: copy});
                        }} 
                        className="bg-white rounded-lg px-3 py-2 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Langkah Ke-2: Verifikasi..." 
                      />
                      <input 
                        value={s.description} 
                        onChange={e => {
                          const copy = [...detail.alurSteps];
                          copy[idx] = {...copy[idx], description: e.target.value};
                          setDetail({...detail, alurSteps: copy});
                        }} 
                        className="bg-white rounded-lg px-3 py-2 text-sm text-slate-500 border-none outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Keterangan singkat apa yang terjadi..." 
                      />
                    </div>
                    <button onClick={() => setDetail({...detail, alurSteps: detail.alurSteps.filter((_:any,i:number)=>i!==idx)})}><Trash className="w-4 h-4 text-red-300" /></button>
                 </div>
               ))}
               <button 
                 onClick={() => setDetail({...detail, alurSteps: [...detail.alurSteps, {title: '', description: ''}]})} 
                 className="text-xs text-blue-600 font-black px-4 py-2 bg-blue-50 rounded-xl"
               >
                 + Tambah Langkah SOP
               </button>
            </div>
           )}
        </section>

        <section className="p-10 rounded-[3rem] bg-amber-50 border border-amber-100 flex flex-col md:flex-row items-center gap-8">
           <div className="w-20 h-20 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-xl shadow-amber-500/20">
             <Users className="w-10 h-10" />
           </div>
           <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-amber-900/40 uppercase tracking-[0.2em] mb-1 block">Penanggung Jawab (PIC)</label>
              <input 
                value={detail.pic} 
                onChange={e => setDetail({...detail, pic: e.target.value})} 
                className="block w-full bg-transparent text-3xl font-black text-amber-900 border-b border-amber-200 outline-none focus:border-amber-500 pb-2" 
                placeholder="Nama Lengkap & Gelar PIC" 
              />
              <p className="text-amber-700/60 font-bold text-xs uppercase tracking-widest">Tim Kerja Tata Laksana & Kepegawaian</p>
           </div>
        </section>
      </div>
    </div>
  );
}

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart, 
  Pie
} from 'recharts';

// --- SKM Results Component ---
function SKMResults() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'skm_surveys'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setSurveys(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'skm_surveys');
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Menganalisis Data Survei...</p>
    </div>
  );

  const averageTotal = surveys.length > 0 
    ? surveys.reduce((acc, curr) => acc + (curr.averageScore || 0), 0) / surveys.length 
    : 0;

  // Prepare chart data
  const ratingKeys = [
    { key: 'persyaratan', label: 'Persyaratan' },
    { key: 'prosedur', label: 'Prosedur' },
    { key: 'waktu', label: 'Waktu' },
    { key: 'biaya', label: 'Biaya/Tarif' },
    { key: 'produk', label: 'Produk' },
    { key: 'kompetensi', label: 'Kompetensi' },
    { key: 'perilaku', label: 'Perilaku' },
    { key: 'sarpras', label: 'Sarpras' },
    { key: 'pengaduan', label: 'Pengaduan' }
  ];

  const chartData = ratingKeys.map(rk => {
    const total = surveys.reduce((acc, curr) => acc + (curr.ratings?.[rk.key] || 0), 0);
    const avg = surveys.length > 0 ? total / surveys.length : 0;
    return { name: rk.label, score: Number(avg.toFixed(2)) };
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4', '#f97316'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 group hover:border-blue-200 transition-all">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Responden</h3>
           <div className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">{surveys.length}</div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 group hover:border-emerald-200 transition-all">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Indeks Kepuasan (IKM)</h3>
           <div className={cn(
             "text-4xl font-black tracking-tighter transition-colors",
             averageTotal >= 3.25 ? "text-emerald-500" : averageTotal >= 2.51 ? "text-blue-500" : "text-amber-500"
           )}>
             {averageTotal.toFixed(2)}
           </div>
           <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Skala 1.00 - 4.00</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 group hover:border-amber-200 transition-all">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mutu Pelayanan</h3>
           <div className="text-xl font-black text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors uppercase">
             {averageTotal >= 3.25 ? "SANGAT BAIK (A)" : averageTotal >= 2.51 ? "BAIK (B)" : "KURANG BAIK (C)"}
           </div>
        </div>
      </div>

      {/* Analisis Visual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Distribusi Nilai (Permen PANRB 14/2017)</h3>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                 <XAxis type="number" domain={[0, 4]} hide />
                 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                 <Tooltip cursor={{ fill: '#f8fafc' }} />
                 <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={20}>
                   {chartData.map((_entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Sebaran Responden per Layanan</h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Array.from(new Set(surveys.map(s => s.layanan))).map(layanan => ({
                      name: layanan,
                      value: surveys.filter(s => s.layanan === layanan).length
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {surveys.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 min-h-[400px]">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Analisis per Unsur Pelayanan</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 4]} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={20}>
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Sebaran Unit Kerja</h3>
            <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
               {Array.from(new Set(surveys.map(s => s.unitKerja || 'Lainnya'))).map((unit, idx) => {
                 const count = surveys.filter(s => s.unitKerja === unit || (!s.unitKerja && unit === 'Lainnya')).length;
                 const percentage = (count / surveys.length) * 100;
                 return (
                   <div key={idx} className="mb-4">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600 truncate max-w-[200px]">{unit}</span>
                        <span className="text-slate-400">{count} Responden ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Detail Respon Terakhir</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responden</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Layanan</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Skor</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Saran & Masukan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {surveys.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6 text-[10px] font-bold text-slate-400">
                    {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                  </td>
                  <td className="p-6">
                    <div className="font-bold text-slate-800 text-sm">{s.nama || 'Anonim'}</div>
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{s.unitKerja || '-'}</div>
                  </td>
                  <td className="p-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                      "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
                    )}>
                      {s.layanan}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center w-9 h-9 rounded-xl font-black text-white text-[11px] shadow-sm",
                      s.averageScore >= 3.25 ? "bg-emerald-500 shadow-emerald-500/10" : s.averageScore >= 2.51 ? "bg-blue-500" : "bg-amber-500"
                    )}>
                      {s.averageScore.toFixed(1)}
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 max-w-xs">{s.saran || '-'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {surveys.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
               <FileText className="w-8 h-8" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Belum ada data survei yang masuk.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Visitor Stats Component ---
function VisitorStats() {
  const [visitCount, setVisitCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'site_settings', 'main');
    getDoc(docRef).then(snap => {
      if (snap.exists()) {
        setVisitCount(snap.data().visitCount || 0);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="p-20 text-center animate-pulse">
       <Activity className="w-10 h-10 text-slate-200 mx-auto mb-4" />
       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Menarik Data Statistik...</p>
    </div>
  );

  // Mock historical data for visual flavor
  const historicalData = [
    { name: 'Sen', visits: Math.floor(visitCount / 7 * 0.8) },
    { name: 'Sel', visits: Math.floor(visitCount / 7 * 1.2) },
    { name: 'Rab', visits: Math.floor(visitCount / 7 * 0.9) },
    { name: 'Kam', visits: Math.floor(visitCount / 7 * 1.1) },
    { name: 'Jum', visits: Math.floor(visitCount / 7 * 1.3) },
    { name: 'Sab', visits: Math.floor(visitCount / 7 * 0.5) },
    { name: 'Min', visits: Math.floor(visitCount / 7 * 0.4) },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Total Kunjungan Portal</h3>
            <div className="text-6xl font-black text-slate-900 tracking-tighter mb-2">{visitCount.toLocaleString('id-ID')}</div>
            <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Rata-rata {Math.floor(visitCount / 30)} kunjungan per hari bulan ini
            </p>
         </div>

         <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Tren Kunjungan Mingguan (Simulasi)</h3>
            <div className="h-[180px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={historicalData}>
                    <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="p-12 bg-blue-600 rounded-[3rem] text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden">
         <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
         <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl font-black tracking-tighter mb-4 leading-none">Analisis Kunjungan & Efektivitas Layanan</h2>
            <p className="text-blue-100 font-medium leading-relaxed mb-8">Data statistik menunjukkan tingkat interaksi pengunjung dengan portal layanan SDM. Gunakan data ini untuk mengoptimalkan penempatan informasi strategis.</p>
            <div className="flex flex-wrap gap-4">
               <div className="px-5 py-3 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
                  <div className="text-xs font-bold text-blue-200 mb-1 uppercase tracking-widest">Waktu Ter ramai</div>
                  <div className="text-xl font-bold">10:00 - 14:00 WIB</div>
               </div>
               <div className="px-5 py-3 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
                  <div className="text-xs font-bold text-blue-200 mb-1 uppercase tracking-widest">Device Dominan</div>
                  <div className="text-xl font-bold">Desktop (72%)</div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onExit }: { onExit?: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && u.email === 'kepegawaian@untidar.ac.id') {
        try {
          const docRef = doc(db, 'site_settings', 'main');
          const unsubSettings = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              // Backfill if data is missing or looks like old partial data
              if (!data.announcements) data.announcements = PORTAL_CONTENT.announcements;
              if (!data.recentDocuments) data.recentDocuments = PORTAL_CONTENT.recentDocuments;
              if (!data.applications) data.applications = PORTAL_CONTENT.applications;
              if (!data.profile) data.profile = PORTAL_CONTENT.profile;
              if (!data.footer) {
                data.footer = PORTAL_CONTENT.footer;
              } else {
                data.footer = { ...PORTAL_CONTENT.footer, ...data.footer };
              }
              if (!data.skmSettings) {
                data.skmSettings = PORTAL_CONTENT.skmSettings;
              } else {
                data.skmSettings = { ...PORTAL_CONTENT.skmSettings, ...data.skmSettings };
              }
              
              // If services exists, just use it.
              setSettings(data);
              setIsAdmin(true);
            } else {
              setSettings({
                 header: PORTAL_CONTENT.header,
                 hero: PORTAL_CONTENT.hero,
                 footer: PORTAL_CONTENT.footer,
                 announcements: PORTAL_CONTENT.announcements,
                 recentDocuments: PORTAL_CONTENT.recentDocuments,
                 applications: PORTAL_CONTENT.applications,
                 services: PORTAL_CONTENT.services
              });
              setIsAdmin(true);
            }
          }, (err) => {
             console.error(err);
             setIsAdmin(false);
          });
          setLoading(false);
          return () => unsubSettings();
        } catch(e) {
          setIsAdmin(false);
        }
      } else {
        if (u) {
            await signOut(auth);
            alert("Akses ditolak: Anda tidak memiliki izin admin.");
        }
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (authProvider: any = provider, mode: 'popup' | 'redirect' = 'popup') => {
    try {
      console.log(`Attempting login with ${mode}...`);
      if (mode === 'popup') {
        const result = await signInWithPopup(auth, authProvider);
        console.log('Login success (popup):', result.user.email);
      } else {
        const { signInWithRedirect: fv_signInWithRedirect } = await import('firebase/auth');
        await fv_signInWithRedirect(auth, authProvider);
        console.log('Redirecting for login...');
      }
    } catch(e: any) {
      console.error('Login Error:', e);
      handleLoginError(e);
    }
  };

  const handleLoginError = (e: any) => {
    if (e.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        alert(
          "Domain Belum Terdaftar di Firebase!\n\n" +
          "Silakan tambahkan domain berikut ke 'Authorized Domains' di Firebase Console:\n" +
          "- " + currentDomain + "\n\n" +
          "Buka Firebase Console > Authentication > Settings > Authorized Domains."
        );
      } else if (e.code === 'auth/popup-blocked') {
        alert("Popup diblokir. Silakan gunakan tombol 'Metode Redirect' atau buka aplikasi di Tab Baru.");
      } else if (e.code === 'auth/network-request-failed') {
        alert("Koneksi gagal. Pastikan Firebase sudah aktif & Anda terhubung internet.");
      } else {
        alert("Gagal login: " + (e.message || "Terjadi kesalahan."));
      }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'site_settings', 'main'), {
        ...settings,
        updatedAt: serverTimestamp()
      });
      alert('Berhasil: Semua perubahan telah tersimpan ke database.');
    } catch(e: any) {
      console.error('Save Error:', e);
      let errorMsg = "Gagal menyimpan perubahan.";
      
      if (e.message && e.message.includes("permission-denied")) {
        errorMsg = "Akses Ditolak: Pastikan domain dashboard ini sudah didaftarkan di Firebase Console (Authorized Domains).";
      } else if (e.message) {
        try {
          const parsed = JSON.parse(e.message);
          errorMsg = `Gagal simpan: ${parsed.error}`;
        } catch {
          errorMsg = `Gagal simpan: ${e.message}`;
        }
      }
      
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const updateSettingNode = (node: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [node]: {
        ...prev[node],
        [field]: value
      }
    }));
  };

  const updateArrayItem = (arrayName: string, index: number, field: string, value: string) => {
    setSettings((prev: any) => {
      const newArray = [...(prev[arrayName] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addArrayItem = (arrayName: string, template: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] || []), template]
    }));
  };

  const removeArrayItem = (arrayName: string, index: number) => {
    setSettings((prev: any) => {
      const newArray = [...(prev[arrayName] || [])];
      newArray.splice(index, 1);
      return { ...prev, [arrayName]: newArray };
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent, arrayName: string, subIndex?: number) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSettings((prev: any) => {
        if (subIndex !== undefined) {
          // Handle nested items (e.g., service items)
          const newServices = [...(prev.services || [])];
          const currentItems = [...(newServices[subIndex].items || [])];
          
          const oldIndex = currentItems.findIndex((_, i) => `${arrayName}-${subIndex}-${i}` === active.id);
          const newIndex = currentItems.findIndex((_, i) => `${arrayName}-${subIndex}-${i}` === over.id);
          
          if (oldIndex !== -1 && newIndex !== -1) {
            newServices[subIndex] = {
              ...newServices[subIndex],
              items: arrayMove(currentItems, oldIndex, newIndex)
            };
            return { ...prev, services: newServices };
          }
          return prev;
        } else {
          // Handle top level arrays
          const currentArray = [...(prev[arrayName] || [])];
          const oldIndex = currentArray.findIndex((_, i) => `${arrayName}-${i}` === active.id);
          const newIndex = currentArray.findIndex((_, i) => `${arrayName}-${i}` === over.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            return {
              ...prev,
              [arrayName]: arrayMove(currentArray, oldIndex, newIndex)
            };
          }
          return prev;
        }
      });
    }
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400; // Allow a bit larger for better quality, 400px is typical
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Generate WebP or JPEG to save space. We'll use WebP.
            const dataUrl = canvas.toDataURL('image/webp', 0.8);
            updateArrayItem('applications', index, 'imageUrl', dataUrl);
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="p-10">Memuat...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LockIcon className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Login</h2>
          <p className="text-slate-500 mb-8 text-sm">Masuk dengan akun Google untuk mengelola konten portal.</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => login(provider, 'popup')} 
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-amber-400 transition-all shadow-sm"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Masuk dengan Google
            </button>
            
            <button 
              onClick={() => login(provider, 'redirect')} 
              className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors py-2 border border-dashed border-slate-200 rounded-lg"
            >
              Gunakan Metode Redirect (Jika Popup Gagal)
            </button>
          </div>

          {onExit && (
            <button onClick={onExit} className="mt-8 text-sm font-semibold text-slate-400 hover:text-slate-800 transition-colors">
              Kembali ke Beranda
            </button>
          )}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profil & Struktur' },
    { id: 'beranda', label: 'Beranda' },
    { id: 'announcements', label: 'Pengumuman' },
    { id: 'services', label: 'Layanan SDM' },
    { id: 'applications', label: 'Aplikasi' },
    { id: 'panduan', label: 'Panduan Layanan (SOP)' },
    { id: 'skm', label: 'Hasil Survei (SKM)' },
    { id: 'stats', label: 'Statistik Pengunjung' },
    { id: 'bantuan', label: 'Bantuan (Helpdesk)' },
    { id: 'footer', label: 'Footer' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 pt-32 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Panel - Konten Portal</h1>
        <div className="flex gap-4">
          <button onClick={onExit} className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
            Kembali ke Beranda
          </button>
          <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </div>

      {settings && (
        <div className="flex gap-6">
          <div className="w-64 shrink-0 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-colors",
                  activeTab === tab.id ? "bg-white text-blue-600 shadow-sm border" : "text-slate-600 hover:bg-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex-1 space-y-6">
            {/* Profil Tim Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h2 className="text-lg font-bold mb-4">Profil Tim Kerja TLK</h2>
                 <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Deskripsi</label>
                      <textarea value={settings.profile?.description} onChange={(e) => updateSettingNode('profile', 'description', e.target.value)} className="w-full border rounded px-3 py-2 text-sm h-24" />
                   </div>
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Struktur Organisasi (Upload Gambar)</label>
                      <div className="flex gap-2 items-center border border-slate-300 rounded px-2 bg-white p-2">
                          <label className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-2 rounded cursor-pointer hover:bg-slate-200 truncate flex-1 text-center font-mono">
                              {settings.profile?.orgChartImageUrl ? "Ganti Gambar" : "Upload Gambar"}
                              <input type="file" accept="image/*" onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (!file) return;
                                 const reader = new FileReader();
                                 reader.onload = (event) => {
                                     updateSettingNode('profile', 'orgChartImageUrl', event.target?.result as string);
                                 };
                                 reader.readAsDataURL(file);
                              }} className="hidden" />
                          </label>
                          {settings.profile?.orgChartImageUrl && (
                              <button onClick={() => updateSettingNode('profile', 'orgChartImageUrl', '')} className="text-red-500 hover:text-red-700 p-1" title="Hapus Gambar">
                                  <Trash className="w-4 h-4"/>
                              </button>
                          )}
                      </div>
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Anggota Tim</label>
                      <div className="space-y-3">
                          {settings.profile?.members?.map((m: any, idx: number) => (
                               <div key={idx} className="flex gap-4 items-center p-3 border rounded bg-slate-50">
                                   <div className="w-16 h-16 bg-slate-200 rounded shrink-0 overflow-hidden">
                                      {m.imageUrl ? <img src={m.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400">?</div>}
                                   </div>
                                   <div className="flex-1 space-y-1">
                                      <input value={m.name} onChange={(e) => {
                                          const newMembers = [...settings.profile.members];
                                          newMembers[idx] = {...newMembers[idx], name: e.target.value};
                                          updateSettingNode('profile', 'members', newMembers);
                                      }} className="w-full border rounded px-2 py-1 text-sm font-semibold" placeholder="Nama" />
                                      <input value={m.role} onChange={(e) => {
                                          const newMembers = [...settings.profile.members];
                                          newMembers[idx] = {...newMembers[idx], role: e.target.value};
                                          updateSettingNode('profile', 'members', newMembers);
                                      }} className="w-full border rounded px-2 py-1 text-sm" placeholder="Jabatan" />
                                   </div>
                                   <label className="shrink-0 text-xs bg-slate-200 px-3 py-2 rounded cursor-pointer hover:bg-slate-300">
                                      Foto
                                      <input type="file" accept="image/*" onChange={(e) => {
                                         const file = e.target.files?.[0];
                                         if (!file) return;
                                         const reader = new FileReader();
                                         reader.onload = (event) => {
                                             const newMembers = [...settings.profile.members];
                                             newMembers[idx] = {...newMembers[idx], imageUrl: event.target?.result as string};
                                             updateSettingNode('profile', 'members', newMembers);
                                         };
                                         reader.readAsDataURL(file);
                                      }} className="hidden" />
                                   </label>
                                   <button onClick={() => {
                                       const newMembers = settings.profile.members.filter((_: any, i: number) => i !== idx);
                                       updateSettingNode('profile', 'members', newMembers);
                                   }} className="text-red-500 hover:text-red-700 p-1"><Trash className="w-4 h-4"/></button>
                               </div>
                          ))}
                          <button onClick={() => updateSettingNode('profile', 'members', [...settings.profile.members, { name: '', role: '', imageUrl: '' }])} className="w-full text-sm bg-blue-50 text-blue-600 py-2 rounded font-semibold">+ Tambah Anggota</button>
                      </div>
                   </div>
                 </div>
              </div>
            )}
            
            {/* Beranda Tab */}
            {activeTab === 'beranda' && (
              <>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <h2 className="text-lg font-bold mb-4">1. Header</h2>
                   <div className="grid grid-cols-2 gap-4 mb-2">
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 mb-1">Title</label>
                       <input value={settings.header?.title} onChange={(e) => updateSettingNode('header', 'title', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 mb-1">Subtitle</label>
                       <input value={settings.header?.subtitle} onChange={(e) => updateSettingNode('header', 'subtitle', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 mb-1">Kementerian</label>
                       <input value={settings.header?.ministry} onChange={(e) => updateSettingNode('header', 'ministry', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                     </div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <h2 className="text-lg font-bold mb-4">2. Banner Utama (Hero)</h2>
                   <div className="grid grid-cols-1 gap-4 mb-2">
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 mb-1">Headline</label>
                       <input value={settings.hero?.title} onChange={(e) => updateSettingNode('hero', 'title', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 mb-1">Deskripsi</label>
                       <textarea value={settings.hero?.description} onChange={(e) => updateSettingNode('hero', 'description', e.target.value)} className="w-full border rounded px-3 py-2 text-sm h-24" />
                     </div>
                   </div>
                </div>
              </>
            )}

            {/* Pengumuman Tab */}
            {activeTab === 'announcements' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="text-lg font-bold">3. Pengumuman & Informasi</h2>
                     <button onClick={() => addArrayItem('announcements', { date: 'DD MMM YYYY', title: 'Pengumuman Baru', tag: 'New', type: 'Berita', url: '#' })} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded flex items-center gap-1"><Plus className="w-4 h-4"/> Tambah</button>
                 </div>
                 <div className="space-y-3 pl-6">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'announcements')}>
                      <SortableContext items={(settings.announcements || []).map((_: any, i: number) => `announcements-${i}`)} strategy={verticalListSortingStrategy}>
                        {(settings.announcements || []).map((item: any, i: number) => (
                          <SortableItem key={`announcements-${i}`} id={`announcements-${i}`}>
                            <div className="flex flex-col gap-2 border p-3 rounded bg-slate-50">
                               <div className="flex gap-2 items-center">
                                  <input value={item.date} onChange={(e) => updateArrayItem('announcements', i, 'date', e.target.value)} className="w-32 border rounded px-2 py-1 text-sm" placeholder="DD MMM YYYY" />
                                  <input value={item.title} onChange={(e) => updateArrayItem('announcements', i, 'title', e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm font-semibold" placeholder="Judul Pengumuman" />
                                  <button onClick={() => removeArrayItem('announcements', i)} className="text-red-500 p-1 hover:bg-red-50 rounded ml-auto"><Trash className="w-4 h-4"/></button>
                               </div>
                               <div className="flex gap-2 items-center">
                                  <input value={item.tag} onChange={(e) => updateArrayItem('announcements', i, 'tag', e.target.value)} className="w-24 border rounded px-2 py-1 text-sm" placeholder="Tag (misal: New)" />
                                  <input value={item.type} onChange={(e) => updateArrayItem('announcements', i, 'type', e.target.value)} className="w-1/4 border rounded px-2 py-1 text-sm" placeholder="Tipe (misal: Berita/Sosialisasi)" />
                                  <input value={item.url} onChange={(e) => updateArrayItem('announcements', i, 'url', e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Link Pengumuman (Tiktok/IG/Web)" />
                               </div>
                            </div>
                          </SortableItem>
                        ))}
                      </SortableContext>
                    </DndContext>
                 </div>
              </div>
            )}
            
            {/* Layanan SDM Tab */}
            {activeTab === 'services' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="text-lg font-bold">5. Layanan SDM (Kategori & Item)</h2>
                     <button 
                        onClick={async () => {
                          const standardServices = JSON.parse(JSON.stringify(PORTAL_CONTENT.services));
                          setSettings((prev: any) => ({
                            ...prev,
                            services: standardServices
                          }));
                          
                          setSaving(true);
                          try {
                            const docRef = doc(db, 'site_settings', 'main');
                            const snap = await getDoc(docRef);
                            const currentData = snap.exists() ? snap.data() : {};
                            
                            await setDoc(docRef, {
                              ...currentData,
                              services: standardServices,
                              updatedAt: serverTimestamp()
                            });
                            alert("Berasil memuat data standar. Halaman akan dimuat ulang.");
                            window.location.reload();
                          } catch(e) {
                            console.error(e);
                            alert("Terjadi kesalahan saat memuat data.");
                          }
                          setSaving(false);
                        }}
                        className="text-xs bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                     >
                        Muat Data Standar
                     </button>
                 </div>
                 <p className="text-sm text-slate-500 mb-4">Edit sub-layanan yang muncul di dalam tab Layanan SDM. Anda dapat menambahkan sub-kategori jika diperlukan.</p>
                 <div className="space-y-8 pl-6">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'services')}>
                      <SortableContext items={(settings.services || []).map((_: any, i: number) => `services-${i}`)} strategy={verticalListSortingStrategy}>
                        {(settings.services || []).map((kat: any, i: number) => (
                          <SortableItem key={`services-${i}`} id={`services-${i}`}>
                            <div className="border border-slate-200 p-6 rounded-2xl bg-white shadow-sm">
                               <div className="flex justify-between items-center mb-6">
                                  <div className="flex items-center gap-4 w-2/3">
                                    <div className="flex flex-col gap-2">
                                      <select value={kat.icon || "AppWindow"} onChange={(e) => {
                                         const newServices = [...settings.services];
                                         newServices[i] = { ...newServices[i], icon: e.target.value };
                                         setSettings({ ...settings, services: newServices });
                                      }} className="border rounded p-1 text-xs bg-slate-50">
                                        <option value="Briefcase">Briefcase</option>
                                        <option value="HeartPlus">HeartPlus</option>
                                        <option value="ShieldCheck">ShieldCheck</option>
                                        <option value="GraduationCap">GraduationCap</option>
                                        <option value="Building">Building</option>
                                        <option value="FolderOpen">FolderOpen</option>
                                        <option value="AppWindow">Default Icon</option>
                                      </select>
                                      <select value={kat.color || "blue"} onChange={(e) => {
                                         const newServices = [...settings.services];
                                         newServices[i] = { ...newServices[i], color: e.target.value };
                                         setSettings({ ...settings, services: newServices });
                                      }} className="border rounded p-1 text-xs bg-slate-50">
                                        <option value="blue">Blue (Karier)</option>
                                        <option value="rose">Rose (Kesejahteraan)</option>
                                        <option value="amber">Amber (Disiplin)</option>
                                        <option value="emerald">Emerald (SDM)</option>
                                        <option value="indigo">Indigo (OTK)</option>
                                        <option value="slate">Slate (Lainnya)</option>
                                      </select>
                                    </div>
                                    <input value={kat.category} onChange={(e) => {
                                       const newServices = [...settings.services];
                                       newServices[i] = { ...newServices[i], category: e.target.value };
                                       setSettings({ ...settings, services: newServices });
                                    }} className="font-bold text-lg text-slate-800 bg-transparent border-b border-slate-300 px-1 py-1 w-full focus:outline-none focus:border-blue-500" placeholder="Kategori Utama" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => {
                                        const newServices = [...settings.services];
                                        const newSub = { title: 'Sub-Kategori Baru', items: [{ title: 'Item Baru', url: '#' }] };
                                        newServices[i] = { 
                                          ...newServices[i], 
                                          subCategories: [...(newServices[i].subCategories || []), newSub],
                                          items: undefined // Remove flat items if switching to sub-categories
                                        };
                                        setSettings({ ...settings, services: newServices });
                                    }} className="text-xs bg-amber-50 text-amber-700 font-bold px-3 py-1.5 rounded-lg border border-amber-200">+ Sub-Kategori</button>
                                    <button onClick={() => {
                                        const newServices = [...settings.services];
                                        newServices[i] = { 
                                          ...newServices[i], 
                                          items: [...(newServices[i].items || []), { title: 'Item Baru', url: '#' }],
                                          subCategories: undefined // Remove sub-categories if switching to flat
                                        };
                                        setSettings({ ...settings, services: newServices });
                                    }} className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-lg border border-blue-200">+ Item Langsung</button>
                                    <button onClick={() => removeArrayItem('services', i)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"><Trash className="w-4 h-4"/></button>
                                  </div>
                               </div>

                               {/* Flat Items List */}
                               {kat.items && (
                                 <div className="space-y-2 pl-4 border-l-2 border-slate-100 ml-2">
                                    {kat.items.map((item: any, j: number) => (
                                      <div key={j} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                         <input value={item.title} onChange={(e) => {
                                            const newServices = [...settings.services];
                                            newServices[i].items[j] = { ...newServices[i].items[j], title: e.target.value };
                                            setSettings({ ...settings, services: newServices });
                                         }} className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder="Nama Layanan" />
                                         <input value={item.url} onChange={(e) => {
                                            const newServices = [...settings.services];
                                            newServices[i].items[j] = { ...newServices[i].items[j], url: e.target.value };
                                            setSettings({ ...settings, services: newServices });
                                         }} className="flex-1 border rounded px-3 py-1.5 text-sm text-slate-500" placeholder="Link URL" />
                                         <button onClick={() => {
                                            const newServices = [...settings.services];
                                            newServices[i].items.splice(j, 1);
                                            setSettings({ ...settings, services: newServices });
                                         }} className="text-red-400 p-2 hover:bg-white rounded-full"><Trash className="w-4 h-4" /></button>
                                      </div>
                                    ))}
                                 </div>
                               )}

                               {/* Sub-Categories List */}
                               {kat.subCategories && (
                                 <div className="space-y-6">
                                    {kat.subCategories.map((sub: any, subIdx: number) => (
                                      <div key={subIdx} className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-300">
                                        <div className="flex items-center justify-between mb-4">
                                          <input value={sub.title} onChange={(e) => {
                                            const newServices = [...settings.services];
                                            newServices[i].subCategories[subIdx] = { ...newServices[i].subCategories[subIdx], title: e.target.value };
                                            setSettings({ ...settings, services: newServices });
                                          }} className="font-bold text-sm text-slate-600 bg-transparent border-b border-slate-200 outline-none w-1/2 focus:border-blue-400" placeholder="Judul Sub-Kategori" />
                                          <div className="flex items-center gap-2">
                                            <button onClick={() => {
                                                const newServices = [...settings.services];
                                                newServices[i].subCategories[subIdx].items = [...(newServices[i].subCategories[subIdx].items || []), { title: 'Item Baru', url: '#' }];
                                                setSettings({ ...settings, services: newServices });
                                            }} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">+ Item</button>
                                            <button onClick={() => {
                                                const newServices = [...settings.services];
                                                newServices[i].subCategories.splice(subIdx, 1);
                                                setSettings({ ...settings, services: newServices });
                                            }} className="text-red-400 p-1 hover:bg-white rounded"><Trash className="w-3.5 h-3.5" /></button>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          {sub.items.map((item: any, itemIdx: number) => (
                                            <div key={itemIdx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
                                              <input value={item.title} onChange={(e) => {
                                                const newServices = [...settings.services];
                                                newServices[i].subCategories[subIdx].items[itemIdx] = { ...newServices[i].subCategories[subIdx].items[itemIdx], title: e.target.value };
                                                setSettings({ ...settings, services: newServices });
                                              }} className="flex-1 border rounded px-2 py-1 text-xs" placeholder="Nama Layanan" />
                                              <input value={item.url} onChange={(e) => {
                                                const newServices = [...settings.services];
                                                newServices[i].subCategories[subIdx].items[itemIdx] = { ...newServices[i].subCategories[subIdx].items[itemIdx], url: e.target.value };
                                                setSettings({ ...settings, services: newServices });
                                              }} className="flex-1 border rounded px-2 py-1 text-xs text-slate-500" placeholder="Link URL" />
                                              <button onClick={() => {
                                                const newServices = [...settings.services];
                                                newServices[i].subCategories[subIdx].items.splice(itemIdx, 1);
                                                setSettings({ ...settings, services: newServices });
                                              }} className="text-red-400 p-1 hover:bg-slate-50 rounded"><Trash className="w-3.5 h-3.5" /></button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                 </div>
                               )}
                            </div>
                          </SortableItem>
                        ))}
                      </SortableContext>
                    </DndContext>
                    <button onClick={() => setSettings({ ...settings, services: [...(settings.services || []), { category: 'Kategori Baru', icon: 'AppWindow', items: [] }] })} className="w-full text-sm bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">+ Tambah Kategori Layanan Baru</button>
                 </div>
              </div>
            )}
            
            {/* Aplikasi Tab */}
            {activeTab === 'applications' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="text-lg font-bold">6. Aplikasi & Layanan Utama</h2>
                     <button onClick={() => addArrayItem('applications', { title: 'Aplikasi Baru', url: '#', imageUrl: '', category: 'Sistem Informasi Urusan Tata Laksana dan Kepegawaian' })} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded flex items-center gap-1"><Plus className="w-4 h-4"/> Tambah</button>
                 </div>
                 <div className="space-y-4 pl-6">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'applications')}>
                      <SortableContext items={(settings.applications || []).map((_: any, i: number) => `applications-${i}`)} strategy={verticalListSortingStrategy}>
                        {(settings.applications || []).map((item: any, i: number) => (
                          <SortableItem key={`applications-${i}`} id={`applications-${i}`}>
                            <div className="flex flex-col gap-2 border p-3 rounded bg-slate-50">
                               <div className="flex gap-2 items-center">
                                   <input value={item.title} onChange={(e) => updateArrayItem('applications', i, 'title', e.target.value)} className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm font-semibold" placeholder="Nama Layanan" />
                                   <select value={item.category} onChange={(e) => updateArrayItem('applications', i, 'category', e.target.value)} className="w-1/3 border border-slate-300 rounded px-2 py-1 text-sm bg-white">
                                       <option value="Sistem Informasi Urusan Tata Laksana dan Kepegawaian">SISTEM INFORMASI URUSAN TATA LAKSANA DAN KEPEGAWAIAN</option>
                                       <option value="Sistem Informasi Pengembangan Kompetensi">SISTEM INFORMASI PENGEMBANGAN KOMPETENSI</option>
                                       <option value="Kanal Informasi Lainnya">KANAL INFORMASI LAINNYA</option>
                                   </select>
                                   <button onClick={() => removeArrayItem('applications', i)} className="text-red-500 p-1 hover:bg-red-50 rounded ml-auto"><Trash className="w-4 h-4"/></button>
                               </div>
                               <div className="flex gap-2">
                                   <input value={item.url} onChange={(e) => updateArrayItem('applications', i, 'url', e.target.value)} className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm" placeholder="URL Link (misal: https://...)" />
                                   <div className="flex-1 flex gap-2 items-center border border-slate-300 rounded px-2 bg-white">
                                       <label className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded cursor-pointer hover:bg-slate-200 truncate flex-1 text-center font-mono">
                                           {item.imageUrl ? "Ganti Logo" : "Upload Logo"}
                                           <input type="file" accept="image/*" onChange={(e) => handleImageUpload(i, e)} className="hidden" />
                                       </label>
                                       {item.imageUrl && (
                                           <button onClick={() => updateArrayItem('applications', i, 'imageUrl', '')} className="text-red-500 hover:text-red-700 p-1" title="Hapus Logo">
                                               <Trash className="w-4 h-4"/>
                                           </button>
                                       )}
                                   </div>
                               </div>
                            </div>
                          </SortableItem>
                        ))}
                      </SortableContext>
                    </DndContext>
                 </div>
              </div>
            )}

            {/* Panduan Layanan Tab */}
            {activeTab === 'panduan' && <PanduanEditor services={settings.services || []} />}
            
            {/* HASIL SKM Tab */}
            {activeTab === 'skm' && (
              <div className="space-y-12">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                       <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Pengaturan Popup SKM</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Kontrol Kapan Survei Muncul ke Pengunjung</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      {/* Mode Tampil SKM */}
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Aksesabilitas SKM</label>
                        <select 
                          value={settings.skmSettings?.visibilityMode || 'always'} 
                          onChange={(e) => updateSettingNode('skmSettings', 'visibilityMode', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                        >
                           <option value="always">Selalu Dibuka (Tampil Terus)</option>
                           <option value="scheduled">Sesuai Jadwal (Tanggal Tertentu)</option>
                           <option value="hidden">Ditutup (Disembunyikan)</option>
                        </select>
                      </div>
                      
                      {settings.skmSettings?.visibilityMode === 'scheduled' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tanggal Mulai</label>
                            <input 
                              type="date"
                              value={settings.skmSettings?.startDate || ''} 
                              onChange={(e) => updateSettingNode('skmSettings', 'startDate', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tanggal Selesai</label>
                            <input 
                              type="date"
                              value={settings.skmSettings?.endDate || ''} 
                              onChange={(e) => updateSettingNode('skmSettings', 'endDate', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800">Aktifkan Popup Otomatis</p>
                          <p className="text-xs text-slate-500">Munculkan modal survei secara otomatis</p>
                        </div>
                        <button 
                          onClick={() => updateSettingNode('skmSettings', 'popupEnabled', !settings.skmSettings?.popupEnabled)}
                          name="toggle-skm-popup"
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            settings.skmSettings?.popupEnabled ? "bg-emerald-500" : "bg-slate-300"
                          )}
                        >
                          <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", settings.skmSettings?.popupEnabled ? "right-1" : "left-1")} />
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Frekuensi Muncul</label>
                        <select 
                          value={settings.skmSettings?.popupCondition || 'every_visit'} 
                          onChange={(e) => updateSettingNode('skmSettings', 'popupCondition', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                        >
                           <option value="every_visit">Setiap Kunjungan (Halaman Dimuat)</option>
                           <option value="daily">Satu Kali Sehari</option>
                           <option value="weekly">Satu Kali Seminggu</option>
                           <option value="monthly">Satu Kali Sebulan</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Judul Popup</label>
                        <input 
                          value={settings.skmSettings?.popupTitle || ''} 
                          onChange={(e) => updateSettingNode('skmSettings', 'popupTitle', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pesan / Deskripsi Singkat</label>
                        <textarea 
                          value={settings.skmSettings?.popupDescription || ''} 
                          onChange={(e) => updateSettingNode('skmSettings', 'popupDescription', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all h-24"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-3 mb-8">
                     <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <FileText className="w-6 h-6" />
                     </div>
                     <div>
                       <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Hasil Survei Kepuasan</h2>
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Data Masuk dari Pengunjung Portal</p>
                     </div>
                  </div>
                  <SKMResults />
                </div>
              </div>
            )}

            {/* STATS Tab */}
            {activeTab === 'stats' && <VisitorStats />}

            {activeTab === 'bantuan' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h2 className="text-lg font-bold mb-4">Pengaturan Bantuan (Helpdesk)</h2>
                 <div className="grid grid-cols-1 gap-4">
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Nomor Telepon / WhatsApp</label>
                     <input value={settings.bantuan?.telepon || ''} onChange={(e) => updateSettingNode('bantuan', 'telepon', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="(0293) 364113" />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Keterangan Telepon</label>
                     <input value={settings.bantuan?.keteranganTelepon || ''} onChange={(e) => updateSettingNode('bantuan', 'keteranganTelepon', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Layanan aktif pada jam kerja (Senin-Jumat, 08.00 - 16.00 WIB)." />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Alamat Email</label>
                     <input value={settings.bantuan?.email || ''} onChange={(e) => updateSettingNode('bantuan', 'email', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="kepegawaian@untidar.ac.id" />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Keterangan Email</label>
                     <input value={settings.bantuan?.keteranganEmail || ''} onChange={(e) => updateSettingNode('bantuan', 'keteranganEmail', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Gunakan email Untidar Anda untuk mengirimkan dokumen yang membutuhkan proses." />
                   </div>
                 </div>
              </div>
            )}

            {/* Footer Tab */}
            {activeTab === 'footer' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h2 className="text-lg font-bold mb-4">6. Footer Kontak</h2>
                 <div className="grid grid-cols-1 gap-4 mb-2">
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Alamat</label>
                     <input value={settings.footer?.address} onChange={(e) => updateSettingNode('footer', 'address', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Telepon</label>
                     <input value={settings.footer?.phone} onChange={(e) => updateSettingNode('footer', 'phone', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                     <input value={settings.footer?.email} onChange={(e) => updateSettingNode('footer', 'email', e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Link Instagram (URL)</label>
                     <input value={settings.footer?.instagramUrl || ''} onChange={(e) => updateSettingNode('footer', 'instagramUrl', e.target.value)} className="w-full border rounded px-3 py-2 text-sm font-mono" placeholder="https://instagram.com/sdm_untidar" />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Kode Widget / Iframe Instagram Feed</label>
                     <textarea value={settings.footer?.instagramWidgetCode || ''} onChange={(e) => updateSettingNode('footer', 'instagramWidgetCode', e.target.value)} className="w-full border rounded px-3 py-2 text-sm h-32 font-mono" placeholder="<script src='...'></script><div class='...'></div>" />
                   </div>
                 </div>
              </div>
            )}
            
            <div className="pt-4 pb-12 sticky bottom-0 bg-slate-50 border-t mt-8">
               <button onClick={handleSave} disabled={saving} className="w-full shadow-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-lg">
                 {saving ? 'Menyimpan Perubahan...' : 'Simpan Semua Perubahan'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

