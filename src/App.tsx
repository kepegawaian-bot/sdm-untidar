import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  AppWindow, 
  FileText, 
  Megaphone,
  LifeBuoy, 
  Menu, 
  X, 
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  DownloadCloud,
  FileSignature,
  Building,
  GraduationCap,
  Users,
  CalendarCheck,
  BookOpen,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Award,
  Clock,
  HeartPlus,
  FileDigit,
  FolderOpen,
  MessageCircle,
  Bot,
  Send,
  Loader2,
  Instagram,
  Video,
  Play,
  Link,
  Info,
  CheckCircle2,
  Settings,
  Scale,
  Lock,
  Activity,
  TrendingUp,
  Image as LucideImage
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { PORTAL_CONTENT } from './data/portalData';

import AdminDashboard from './AdminDashboard';
import { db } from './lib/firebase';
import { doc, onSnapshot, getDoc, updateDoc, setDoc, increment, collection, serverTimestamp } from 'firebase/firestore';

// --- Assets ---
const LOGO_UNTIDAR = 'https://iili.io/BEI6PFn.png';
const LOGO_TLK = 'https://iili.io/Ba3KORp.png';
const LOGO_BLU = 'https://iili.io/BEImDdB.png';

// --- Types ---
type Tab = 'beranda' | 'layanan' | 'pengumuman' | 'bantuan' | 'admin' | 'profil';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('beranda');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dbSettings, setDbSettings] = useState<any>(null);
  const [isSKMOpen, setIsSKMOpen] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'site_settings', 'main');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setDbSettings(snap.data());
      }
    });
    return () => unsub();
  }, []);

  const [visitCount, setVisitCount] = React.useState<number | null>(null);

  // Visit Counter Effect
  React.useEffect(() => {
    const trackVisit = async () => {
      const statsRef = doc(db, 'settings', 'stats');
      try {
        // Try to update with increment first (most efficient)
        await updateDoc(statsRef, { 
          visitCount: increment(1),
          lastVisitAt: new Date().toISOString()
        });
        
        // After update, get the latest value to show
        const snap = await getDoc(statsRef);
        if (snap.exists()) {
          setVisitCount(snap.data().visitCount);
        }
      } catch (err: any) {
        // If document doesn't exist, create it
        if (err.code === 'not-found') {
          try {
            await setDoc(statsRef, { 
              visitCount: 1,
              lastVisitAt: new Date().toISOString()
            });
            setVisitCount(1);
          } catch (createErr) {
            console.error("Error creating stats:", createErr);
          }
        } else {
          console.error("Error tracking visit:", err);
          // Fallback: try to just read the count if update fails
          try {
            const snap = await getDoc(statsRef);
            if (snap.exists()) setVisitCount(snap.data().visitCount);
          } catch (readErr) {
            console.error("Error reading fallback stats:", readErr);
          }
        }
      }
    };
    trackVisit();
  }, []);

  const activeContent = React.useMemo(() => {
    if (!dbSettings) return PORTAL_CONTENT;
    const content = { 
      ...PORTAL_CONTENT, 
      ...dbSettings,
      footer: { ...PORTAL_CONTENT.footer, ...dbSettings.footer }
    };
    // Smart merge applications so `#` urls get overridden by updated defaults
    if (dbSettings.applications) {
      content.applications = dbSettings.applications.map((app: any, idx: number) => {
        const defaultApp = PORTAL_CONTENT.applications[idx];
        if (app.url === '#' && defaultApp && defaultApp.url !== '#') {
          return { ...app, url: defaultApp.url };
        }
        return app;
      });
    }
    return content;
  }, [dbSettings]);

  // Automated SKM Popup Trigger
  useEffect(() => {
    if (!activeContent.skmSettings?.popupEnabled || activeTab === 'admin') return;

    // Check visibility logic
    const visibilityMode = activeContent.skmSettings.visibilityMode || 'always';
    if (visibilityMode === 'hidden') return;
    
    if (visibilityMode === 'scheduled') {
      const now = new Date();
      const start = activeContent.skmSettings.startDate ? new Date(activeContent.skmSettings.startDate) : null;
      const end = activeContent.skmSettings.endDate ? new Date(activeContent.skmSettings.endDate) : null;
      
      // If start date is set and we're before it
      if (start && now < start && now.toDateString() !== start.toDateString()) return;
      // If end date is set and we're after it
      if (end && now > end && now.toDateString() !== end.toDateString()) return;
    }

    const lastShown = localStorage.getItem('last_skm_popup');
    const condition = activeContent.skmSettings.popupCondition || 'every_visit';
    
    let shouldShow = false;
    if (condition === 'every_visit') {
      shouldShow = true;
    } else {
      if (!lastShown) {
        shouldShow = true;
      } else {
        const lastDate = new Date(lastShown);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (condition === 'daily' && diffDays >= 1) shouldShow = true;
        if (condition === 'weekly' && diffDays >= 7) shouldShow = true;
        if (condition === 'monthly' && diffDays >= 30) shouldShow = true;
      }
    }

    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsSKMOpen(true);
        localStorage.setItem('last_skm_popup', new Date().toISOString());
      }, 8000); // 8 seconds delay for better UX
      return () => clearTimeout(timer);
    }
  }, [activeContent.skmSettings, activeTab]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { 
        id: 'profil', 
        label: 'Profil', 
        icon: FileText
    },
    { id: 'layanan', label: 'Layanan SDM', icon: AppWindow },
    { id: 'pengumuman', label: 'Informasi', icon: Megaphone },
    { id: 'bantuan', label: 'Bantuan', icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-mesh text-slate-800 font-sans selection:bg-amber-200 selection:text-amber-900 flex flex-col relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>
      <div className="absolute top-[40%] left-[25%] w-96 h-96 bg-rose-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-blob pointer-events-none"></div>

      {/* Top Navbar */}
      <header 
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
          scrolled 
            ? "bg-white/95 backdrop-blur-lg border-slate-200 shadow-sm py-2 lg:py-3" 
            : "bg-white/95 lg:bg-slate-900 border-slate-800 py-3 lg:py-4"
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo Area */}
          <div className="flex items-center gap-3 md:gap-5 cursor-pointer" onClick={() => setActiveTab('beranda')}>
            <img src={LOGO_UNTIDAR} alt="Logo Universitas Tidar" className="h-10 md:h-12 w-auto object-contain" />
            <div className="w-px h-8 bg-slate-300 hidden sm:block"></div>
            <img src={LOGO_TLK} alt="Logo TLK" className="h-10 md:h-12 w-auto object-contain hidden sm:block" />
            <div className="ml-1 hidden md:block">
              <span className={cn("font-bold text-lg leading-tight tracking-tight block text-left", (scrolled ? "text-slate-900" : "lg:text-white text-slate-900"))}>
                {activeContent.header.title}
              </span>
              <span className={cn("font-semibold text-[10px] tracking-wider uppercase block text-left", (scrolled ? "text-slate-500" : "lg:text-slate-400 text-slate-500"))}>
                {activeContent.header.subtitle}
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                  key={item.id}
                  onClick={() => {
                    window.scrollTo({top: 0});
                    setActiveTab(item.id as Tab);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-1",
                    activeTab === item.id 
                      ? (scrolled ? "bg-amber-100 text-amber-700" : "bg-white/10 text-amber-400") 
                      : (scrolled ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900" : "text-slate-300 hover:bg-white/5 hover:text-white")
                  )}
                >
                  <item.icon className="w-4 h-4 mr-1" />
                  {item.label}
              </button>
            ))}
            <div className="w-px h-6 bg-slate-400 mx-2 hidden lg:block opacity-40"></div>
            <button 
              onClick={() => {
                window.scrollTo({top: 0});
                setActiveTab('admin');
              }}
              className={cn(
              "ml-2 px-5 py-2 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-md border border-amber-500/50",
              scrolled ? "bg-amber-500 text-slate-900 hover:bg-amber-400" : "bg-amber-500 text-slate-900 hover:bg-amber-400"
            )}>
              Login Admin
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className={cn("lg:hidden p-2 rounded-lg", scrolled ? "text-slate-600" : "text-slate-600")}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[64px] bg-white border-b border-slate-200 shadow-xl z-40 lg:hidden"
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-center py-4 border-b border-slate-100 mb-4 sm:hidden">
                 <img src={LOGO_TLK} alt="Logo TLK" className="h-10 w-auto object-contain" />
              </div>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as Tab);
                    setIsMobileMenuOpen(false);
                    window.scrollTo({top: 0});
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-left",
                    activeTab === item.id ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-amber-600" : "text-slate-400")} />
                  {item.label}
                </button>
              ))}
              <div className="pt-4 mt-2 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setActiveTab('admin');
                    setIsMobileMenuOpen(false);
                    window.scrollTo({top: 0});
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-bold transition-colors hover:bg-slate-800"
                >
                  <Lock className="w-4 h-4" />
                  Login Admin
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 mt-0">
        {activeTab === 'beranda' && <BerandaView setActiveTab={setActiveTab} content={activeContent} visitCount={visitCount} />}
        {activeTab === 'layanan' && <LayananView content={activeContent} onOpenSKM={() => setIsSKMOpen(true)} />}
        {activeTab === 'profil' && <ProfilView content={activeContent} />}
        {activeTab === 'pengumuman' && <PengumumanView content={activeContent} />}
        {activeTab === 'bantuan' && <BantuanView content={activeContent} />}
        {activeTab === 'admin' && <AdminDashboard onExit={() => setActiveTab('beranda')} />}

        <AnimatePresence>
          {isSKMOpen && (
            <SKMSurveyModal 
              settings={activeContent.skmSettings}
              services={activeContent.services}
              onClose={() => setIsSKMOpen(false)} 
            />
          )}
        </AnimatePresence>
      </main>


      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800 relative z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-2xl w-max">
                 <img src={LOGO_UNTIDAR} alt="Logo Untidar" className="h-10 object-contain" />
                 <div className="w-px h-8 bg-slate-200"></div>
                 <img src={LOGO_BLU} alt="Logo BLU" className="h-10 object-contain" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 font-medium">
                Portal informasi dan layanan Tata Laksana & Kepegawaian (TLK) Universitas Tidar. Terintegrasi, transparan, dan profesional.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Tautan Cepat</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="https://untidar.ac.id/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-2"><ExternalLink className="w-3 h-3"/> Web Utama Untidar</a></li>
                <li><a href="https://siap.untidar.ac.id/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-2"><ExternalLink className="w-3 h-3"/> Sistem Informasi Akademik</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Layanan Utama</h4>
              <ul className="space-y-3 text-sm">
                {(activeContent.applications || []).slice(0, 4).map((app: any, idx: number) => (
                  <li key={idx}>
                    <a href={app.url} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors inline-block text-left w-full truncate">
                      {app.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Kontak & Jam Operasional</h4>
              <ul className="space-y-4 text-sm">
                <li className="text-slate-400 font-semibold mb-2">Kontak Helpdesk</li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-left">+62 897-4420-044</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-left">kepegawaian@untidar.ac.id</span>
                </li>
                <li className="text-slate-400 font-semibold mt-4 mb-2">Jam Operasional</li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="flex flex-col text-left">
                     <span>Senin – Kamis : 07.30 - 16.00</span>
                     <span>Jumat : 07.30 - 16.30</span>
                     <span>Sabtu – Minggu : Libur</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 text-sm text-center text-slate-500 flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col items-center md:items-start gap-3">
              <p>&copy; {new Date().getFullYear()} Tim Tata Laksana dan Kepegawaian Universitas Tidar. Hak Cipta Dilindungi.</p>
              {visitCount !== null && (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full pl-1.5 pr-4 py-1.5 shadow-2xl transition-all hover:border-slate-700 group">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shadow-inner group-hover:bg-slate-700 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em]">Global Visitor</span>
                    <span className="text-sm text-white font-mono font-bold tracking-tighter">
                      {visitCount.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans uppercase ml-1">Kunjungan</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
               <button onClick={() => { setActiveTab('admin'); window.scrollTo({top: 0}); }} className="hover:text-amber-400 cursor-pointer transition-colors text-xs font-bold mr-4" title="Masuk Mode Admin">
                 Admin Panel
               </button>
               <img src={LOGO_TLK} alt="Logo TLK" className="h-6 grayscale opacity-50" />
            </div>
          </div>
        </div>
      </footer>

      {/* Initialize AI floating chat */}
      <AIChatBot contextData={{
        services: activeContent?.services,
        profile: activeContent?.profile,
        bantuan: activeContent?.bantuan
      }} />
    </div>
  );
}

function usePdfUrl(url: string | undefined): string | undefined {
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!url) {
      setBlobUrl(undefined);
      return;
    }
    if (!url.startsWith('data:')) {
      setBlobUrl(url);
      return;
    }

    let isMounted = true;
    let createdUrl = '';

    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        if (!isMounted) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      })
      .catch(e => {
        console.error("Failed to convert data URL to blob", e);
        if (isMounted) setBlobUrl(url);
      });

    return () => {
      isMounted = false;
      if (createdUrl) {
         URL.revokeObjectURL(createdUrl);
      }
    };
  }, [url]);

  return blobUrl;
}

function PdfIframe({ url, title }: { url: string, title?: string }) {
  const objectUrl = usePdfUrl(url);
  const srcOrig = url.includes('drive.google.com') ? url : objectUrl;
  const src = url.includes('drive.google.com') ? url.replace('/view', '/preview') : objectUrl;
  
  return (
    <div className="w-full flex-1 flex flex-col items-center bg-slate-50 border rounded-xl overflow-hidden p-2">
      <div className="mb-2 w-full flex justify-end px-2">
         <a href={srcOrig} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-100 text-blue-700 rounded font-semibold text-xs hover:bg-blue-200 transition">
            Buka Dokumen di Tab Baru
         </a>
      </div>
      <object data={src} type="application/pdf" className="w-full h-full min-h-[500px] bg-white border border-slate-200 rounded-lg">
          <p className="p-4 text-center">Browser Anda tidak mendukung preview PDF. <a href={srcOrig} target="_blank" className="text-blue-600 underline">Download PDF</a></p>
      </object>
    </div>
  );
}

function BeholdWidgetWrapper({ html }: { html: string }) {
  // Isolate third party widget in an iframe so its script doesn't crash the main app
  return (
    <iframe
      title="Instagram Feed"
      sandbox="allow-scripts allow-popups allow-same-origin"
      srcDoc={`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; background: transparent; }
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `}
      className="w-full h-[500px] border-0 rounded-2xl overflow-hidden bg-slate-50"
    />
  );
}

function BerandaView({ setActiveTab, content, visitCount }: { setActiveTab: (tab: Tab) => void, content: any, visitCount: number | null }) {
  if (!content) return null;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const applications = content.applications || [];
  const heroImages = content.hero?.backgroundImages && content.hero.backgroundImages.length > 0 
                     ? content.hero.backgroundImages 
                     : ["https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"];

  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentBgIndex((prev) => (prev + 1) % heroImages.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);
  
  const filteredApps = searchQuery.trim() === '' 
    ? applications 
    : applications.filter((app: any) => 
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (app.category && app.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const groupedApps = filteredApps.reduce((acc: any, app: any) => {
    const defaultCat = "Aplikasi & Layanan";
    const cat = app.category || defaultCat;
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(app);
    return acc;
  }, {});

  const categories = Object.keys(groupedApps);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-[#0f172a] border-b-8 border-amber-500 rounded-b-[3rem] md:rounded-b-[4rem] shadow-2xl">
        <AnimatePresence mode="popLayout">
          {heroImages.map((img: string, idx: number) => (
            idx === currentBgIndex && (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 0.5, scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 mix-blend-multiply bg-cover bg-center"
                style={{ backgroundImage: `url(${img})` }}
              />
            )
          ))}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/90 to-transparent" />
        
        {/* Floating Decorative Elements for Hero */}
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse animation-delay-2000"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left text-white">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 text-amber-300 text-xs font-black mb-8 backdrop-blur-xl border border-white/20 uppercase tracking-[0.2em] shadow-xl shadow-black/20">
                  {content.header.ministry}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-amber-200">
                  {content.hero.title}
                </h1>
                <p className="text-slate-300 md:text-xl max-w-2xl lg:mx-0 mx-auto leading-relaxed mb-10 font-medium opacity-90">
                  {content.hero.description}
                </p>

                {/* Modern Search Bar */}
                <div className="max-w-2xl lg:mx-0 mx-auto p-1.5 md:p-2 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center relative z-10 group focus-within:bg-white transition-all duration-500">
                  <Search className="w-6 h-6 text-slate-400 ml-4 hidden sm:block group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={content.hero.searchPlaceholder}
                    className="w-full bg-transparent border-none px-4 py-4 md:py-6 text-white group-focus-within:text-slate-900 text-lg md:text-xl font-bold outline-none placeholder-slate-400 focus:ring-0"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="p-2 mr-2 hover:bg-slate-100/10 group-focus-within:hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (searchQuery.trim() !== '') {
                        const el = document.getElementById('applications-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        setActiveTab('layanan');
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-10 py-4 md:py-6 rounded-2xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap shadow-xl shadow-amber-500/20 active:scale-95"
                  >
                    <span className="uppercase tracking-widest text-sm">{searchQuery.trim() !== '' ? 'Cari' : 'Mulai'}</span>
                    <ArrowRight className="w-5 h-5 hidden sm:block" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div id="applications-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-3rem] md:mt-[-4rem] relative z-20 space-y-20 mb-24">
        
        {/* Quick Stats Section - REFINED */}
        <div className="bg-white rounded-3xl p-4 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 shadow-2xl shadow-blue-900/5">
          {[
            { 
              label: 'Aplikasi Terpadu', 
              value: applications.length, 
              icon: AppWindow, 
              color: 'text-blue-600', 
              bg: 'bg-blue-500/10',
              gradient: 'from-blue-50/50 to-transparent hover:from-blue-50 hover:to-blue-50/50 hover:border-blue-200',
              desc: 'Sistem info kepegawaian',
              action: () => {
                const el = document.getElementById('applications-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            },
            { 
              label: 'Layanan Pengguna', 
              value: '45+', 
              icon: Users, 
              color: 'text-amber-600', 
              bg: 'bg-amber-500/10',
              gradient: 'from-amber-50/50 to-transparent hover:from-amber-50 hover:to-amber-50/50 hover:border-amber-200',
              desc: 'Klik untuk lihat semua layanan',
              action: () => {
                setActiveTab('layanan');
              }
            },
            { 
              label: 'Dokumen & Panduan', 
              value: '120+', 
              icon: FileText, 
              color: 'text-emerald-600', 
              bg: 'bg-emerald-500/10',
              gradient: 'from-emerald-50/50 to-transparent hover:from-emerald-50 hover:to-emerald-50/50 hover:border-emerald-200',
              desc: 'Manual & peraturan SDM',
              action: () => {
                setActiveTab('layanan');
              }
            },
            { 
              label: 'Akses Publik', 
              value: visitCount ? (visitCount < 1000 ? visitCount.toString() : `${(visitCount / 1000).toFixed(1)}k+`) : '10k+', 
              icon: Activity, 
              color: 'text-rose-600', 
              bg: 'bg-rose-500/10',
              gradient: 'from-rose-50/50 to-transparent hover:from-rose-50 hover:to-rose-50/50 hover:border-rose-200',
              desc: 'Total kunjungan portal',
              action: null
            }
          ].map((stat, i) => (
            <motion.button 
              key={i}
              onClick={stat.action || undefined}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1), duration: 0.6 }}
              className={cn(
                "group relative p-6 rounded-3xl flex flex-col items-center md:items-start text-center md:text-left transition-all duration-500",
                "border border-slate-100 bg-gradient-to-b overflow-hidden",
                stat.gradient,
                stat.action ? "hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] cursor-pointer" : "cursor-default"
              )}
            >
               {/* Decorative background blob */}
               <div className={cn("absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-50", stat.bg)}></div>

               <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-[15deg] shadow-inner relative z-10", stat.bg, stat.color)}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-1 relative z-10">{stat.value}</div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 mb-3 relative z-10">{stat.label}</div>
              <div className="hidden md:block text-[11px] font-semibold text-slate-500 leading-tight opacity-50 group-hover:opacity-100 transition-all duration-500 relative z-10">
                {stat.desc}
              </div>
              
              {stat.action && (
                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className={cn("w-5 h-5", stat.color)} />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Dynamic App Groups */}
        {categories.length > 0 ? (
          categories.map((category, idx) => (
            <div key={idx} className="bg-white pt-8">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4 relative">
                <div className="absolute bottom-[-1px] left-0 w-24 h-[3px] bg-red-600 rounded-full"></div>
                <Link className="w-6 h-6 md:w-8 md:h-8 text-slate-800" />
                <h2 className="text-xl md:text-3xl font-medium text-slate-800">{category}</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12 py-4">
                {groupedApps[category].map((app: any, i: number) => (
                  <motion.a 
                    key={i}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -6, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25, delay: i * 0.05 }}
                    className="group block relative flex flex-col items-center justify-center p-2 text-center mix-blend-multiply opacity-90 hover:opacity-100 transition-all duration-300 w-full hover:drop-shadow-sm overflow-hidden aspect-[4/2]"
                  >
                    {app.imageUrl ? (
                       <img src={app.imageUrl} alt={app.title} className="w-full h-full object-contain mix-blend-darken scale-105 group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                       <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50/50 rounded-xl p-3 border border-slate-100/50 hover:bg-slate-50 transition-colors">
                         <AppWindow className="w-6 h-6 md:w-8 md:h-8 text-slate-400 group-hover:text-amber-500 transition-colors mb-2" />
                         <h4 className="text-[10px] sm:text-xs font-bold text-slate-600 leading-tight line-clamp-2 uppercase">
                           {app.title}
                         </h4>
                       </div>
                    )}
                  </motion.a>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
             <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-400" />
             </div>
             <h3 className="text-2xl font-bold text-slate-700">Tidak ada hasil ditemukan</h3>
             <p className="text-slate-500 mt-2">Coba kata kunci lain untuk mencari layanan atau aplikasi</p>
             <button 
               onClick={() => setSearchQuery('')}
               className="mt-6 px-6 py-3 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 transition-colors"
             >
               Reset Pencarian
             </button>
          </div>
        )}

        {/* Media Sosial & Publikasi */}
        <div className="glass p-6 md:p-10 rounded-3xl shadow-2xl shadow-slate-200/40">
           <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">Media Sosial Resmi</h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-pink-500 to-amber-500 mx-auto mt-6 rounded-full"></div>
            </div>
           
           <div className="grid grid-cols-1 gap-8 md:gap-12">
            
            {/* Instagram @sdm_untidar */}
            <div>
              <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-100 pb-3">
                <div className="p-2 bg-pink-50 rounded-xl">
                    <Instagram className="w-5 h-5 text-pink-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Postingan Instagram Terbaru</h3>
              </div>
              
              {content.footer?.instagramWidgetCode ? (
                <BeholdWidgetWrapper html={content.footer.instagramWidgetCode} />
              ) : (
                <div className="space-y-6">
                  {/* Visual Mock Feed - Better looking than just a card */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=400&auto=format&fit=crop", caption: "Kegiatan Pembinaan SDM" },
                      { src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=400&auto=format&fit=crop", caption: "Kampus Untidar" },
                      { src: "https://images.unsplash.com/photo-1560780552-ba54683cb263?q=80&w=400&auto=format&fit=crop", caption: "Rapat Koordinasi" },
                      { src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=400&auto=format&fit=crop", caption: "Internal Workshop" },
                      { src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&auto=format&fit=crop", caption: "Kerja Tim" },
                      { src: "https://images.unsplash.com/photo-1544717297-fa95ec9103ee?q=80&w=400&auto=format&fit=crop", caption: "Layanan Kepegawaian" }
                    ].map((post, i) => (
                      <motion.a 
                        key={i} 
                        href={content.footer?.instagramUrl || "https://www.instagram.com/sdm_untidar"} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative group block shadow-md border border-slate-200"
                      >
                          <img src={post.src} alt="IG Post Preview" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                              <div className="flex items-center gap-2 text-white">
                                <Instagram className="w-4 h-4 text-pink-400" />
                                <span className="text-[10px] font-bold uppercase truncate">{post.caption}</span>
                              </div>
                          </div>
                      </motion.a>
                    ))}
                  </div>
                  
                  <div className="mt-8 flex flex-col items-center gap-4">
                    <p className="text-slate-500 text-sm max-w-lg text-center px-6">
                      Ikuti akun resmi Instagram Tim SDM Universitas Tidar untuk mendapatkan informasi pelayanan kepegawaian dan kegiatan terbaru secara realtime.
                    </p>
                    
                    <a 
                      href={content.footer?.instagramUrl || "https://www.instagram.com/sdm_untidar"} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group inline-flex items-center gap-3 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg shadow-pink-200 active:scale-95"
                    >
                        <Instagram className="w-5 h-5" />
                        <span>Kunjungi Profil @sdm_untidar</span>
                        <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  </div>
                </div>
              )}
            </div>
           </div>
        </div>

        {/* Pengumuman Terkini */}
        <div className="grid grid-cols-1 gap-12">
          {/* Pengumuman Terkini */}
          <section>
            <div className="glass rounded-3xl p-6 md:p-10">
              <h3 className="text-3xl font-black tracking-tighter mb-12 text-slate-900 flex items-center gap-4 border-b-4 border-slate-100 pb-6 uppercase">
                <Megaphone className="w-10 h-10 text-amber-500" />
                Papan Informasi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {(content.announcements || []).map((news: any, i: number) => (
                    <div key={i} className="flex gap-4 group cursor-pointer border-b border-slate-50 pb-4 last:border-0 md:border-0">
                      <div className="w-16 text-center shrink-0 py-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-amber-50 group-hover:border-amber-200 transition-all">
                        <span className="block text-2xl font-black text-slate-400 group-hover:text-amber-500 transition-colors leading-none">{news.date.split(' ')[0]}</span>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase mt-1">{news.date.split(' ')[1]}</span>
                      </div>
                      <div className="text-left flex-1">
                         <h4 className="text-base font-bold text-slate-700 group-hover:text-blue-700 leading-snug line-clamp-2 transition-colors">{news.title}</h4>
                         <span className="text-xs font-semibold text-slate-400 mt-2 block">{news.type || news.tag}</span>
                      </div>
                    </div>
                 ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- Detailed Views to match Google Sites robust content ---

const DEFAULT_QUESTIONS = [
  { id: 'persyaratan', label: 'Persyaratan', question: 'Kesesuaian persyaratan pelayanan dengan jenis pelayanannya.' },
  { id: 'prosedur', label: 'Prosedur', question: 'Kemudahan tahapan pelayanan yang diberikan (kesederhanaan alur).' },
  { id: 'waktu', label: 'Waktu Pelayanan', question: 'Kecepatan dan ketepatan waktu dalam penyelesaian pelayanan.' },
  { id: 'biaya', label: 'Biaya/Tarif', question: 'Kewajaran biaya/tarif dalam mendapatkan pelayanan (termasuk jika gratis).' },
  { id: 'produk', label: 'Produk Spesifikasi', question: 'Kesesuaian hasil pelayanan yang diterima dengan ketentuan yang ditetapkan.' },
  { id: 'kompetensi', label: 'Kompetensi Pelaksana', question: 'Kemampuan, pengetahuan, dan keterampilan petugas dalam memberikan pelayanan.' },
  { id: 'perilaku', label: 'Perilaku Pelaksana', question: 'Sikap petugas dalam memberikan pelayanan terkait kesopanan dan keramahan.' },
  { id: 'sarpras', label: 'Sarana & Prasarana', question: 'Kualitas dan kenyamanan sarana prasarana pendukung pelayanan.' },
  { id: 'pengaduan', label: 'Penanganan Pengaduan', question: 'Respon dan tata cara penanganan pengaduan, saran, dan masukan.' }
];

// --- SKM Survey Modal ---
function SKMSurveyModal({ onClose, settings, services }: { onClose: () => void, settings?: any, services?: any }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const questions = settings?.questions?.length > 0 ? settings.questions : DEFAULT_QUESTIONS;

  const [formData, setFormData] = useState({
    nama: '',
    unitKerja: '',
    layanan: '',
    ratings: questions.reduce((acc: any, q: any) => ({ ...acc, [q.id]: 0 }), {}),
    saran: ''
  });

  const ratingLabels = [
    { value: 1, label: 'Sangat Tidak Setuju', color: 'bg-red-500' },
    { value: 2, label: 'Tidak Setuju', color: 'bg-orange-500' },
    { value: 3, label: 'Setuju', color: 'bg-blue-500' },
    { value: 4, label: 'Sangat Setuju', color: 'bg-emerald-500' }
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Calculate overall score
      const values = Object.values(formData.ratings) as number[];
      const totalScore = values.reduce((a: number, b: number) => a + b, 0);
      const averageScore = totalScore / values.length;

      await setDoc(doc(collection(db, 'skm_surveys')), {
        ...formData,
        averageScore,
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      alert('Gagal mengirim survei. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const isStepComplete = () => {
    if (step === 1) return formData.layanan !== '';
    if (step === 2) return Object.values(formData.ratings).every((v: any) => Number(v) > 0);
    return true;
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white w-full max-w-lg rounded-[3rem] p-12 text-center shadow-2xl"
        >
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Terima Kasih!</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-8">
            Kontribusi Anda sangat berharga bagi kami untuk terus meningkatkan kualitas pelayanan kepegawaian Universitas Tidar berdasarkan Permen PANRB No. 14 Tahun 2017.
          </p>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 flex">
           <motion.div 
             className="h-full bg-amber-500" 
             animate={{ width: `${(step / 3) * 100}%` }}
           />
        </div>

        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
           <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{settings?.popupTitle || 'Survei Kepuasan Masyarakat (SKM)'}</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Berbasis Core Values ASN BerAKHLAK</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
           {settings?.externalUrl ? (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 mb-8">
                   <p className="text-blue-800 font-medium text-sm leading-relaxed">
                     {settings?.popupDescription || 'Bantu kami mengukur kualitas pelayanan Tim Tata Laksana & Kepegawaian agar semakin profesional dan berdampak bagi seluruh Civitas Akademika.'}
                   </p>
                </div>
                <p className="text-slate-500 mb-6">Survei ini dilakukan melalui platform pihak ketiga.</p>
                <div className="flex justify-center flex-col sm:flex-row gap-4 mt-8">
                    <button onClick={onClose} className="px-6 py-4 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                      Nanti Saja
                    </button>
                    <a 
                      href={settings.externalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={onClose}
                      className="px-8 py-4 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                    >
                      Buka Formulir SKM <span className="text-xl">→</span>
                    </a>
                </div>
             </motion.div>
           ) : step === 1 ? (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 mb-8">
                   <p className="text-blue-800 font-medium text-sm leading-relaxed">
                     {settings?.popupDescription || 'Bantu kami mengukur kualitas pelayanan Tim Tata Laksana & Kepegawaian agar semakin profesional dan berdampak bagi seluruh Civitas Akademika.'}
                   </p>
                </div>
                
                <div className="space-y-4">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Data Responden (Opsional)</label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        type="text" placeholder="Nama Lengkap" 
                        value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                      />
                      <input 
                        type="text" placeholder="Unit Kerja / Fakultas" 
                        value={formData.unitKerja} onChange={e => setFormData({...formData, unitKerja: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                      />
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Layanan yang Dinilai *</label>
                   <select 
                     value={formData.layanan} 
                     onChange={e => setFormData({...formData, layanan: e.target.value})}
                     className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all appearance-none"
                   >
                      <option value="">Pilih Jenis Layanan...</option>
                      {(services || []).map((cat: any) => (
                        <optgroup key={cat.category} label={cat.category}>
                          {(cat.items || []).map((item: any) => (
                            <option key={item.title} value={item.title}>{item.title}</option>
                          ))}
                          {(cat.subCategories || []).map((sub: any) => (
                            sub.items.map((item: any) => (
                              <option key={item.title} value={item.title}>{item.title}</option>
                            ))
                          ))}
                        </optgroup>
                      ))}
                      <option value="Lainnya">Lainnya</option>
                   </select>
                </div>
             </motion.div>
           ) : null}

           {step === 2 && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 pb-8">
                {questions.map((q, idx) => (
                   <div key={q.id} className="space-y-4 border-b border-slate-50 pb-8 last:border-0">
                      <div className="flex items-start gap-4">
                         <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs shrink-0">{idx+1}</div>
                         <div className="space-y-1">
                            <h4 className="font-black text-slate-800 leading-tight uppercase text-xs tracking-wider">{q.label}</h4>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed">{q.question}</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 px-2">
                         {ratingLabels.map((r) => {
                            const isSelected = (formData.ratings as any)[q.id] === r.value;
                            return (
                               <button
                                 key={r.value}
                                 onClick={() => setFormData({
                                   ...formData, 
                                   ratings: { ...formData.ratings, [q.id]: r.value }
                                 })}
                                 className={cn(
                                   "flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all group",
                                   isSelected 
                                     ? `${r.color} border-transparent text-white shadow-lg scale-105` 
                                     : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                 )}
                               >
                                  <div className={cn(
                                    "w-3 h-3 rounded-full",
                                    isSelected ? "bg-white" : "bg-slate-100 group-hover:bg-slate-200"
                                  )} />
                                  <span className="text-[8px] font-black uppercase text-center leading-tight">{r.label}</span>
                               </button>
                            );
                         })}
                      </div>
                   </div>
                ))}
             </motion.div>
           )}

           {step === 3 && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="space-y-4">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Saran & Masukan</label>
                   <textarea 
                     rows={6}
                     placeholder="Tuliskan kritik, saran, atau apresiasi Anda untuk Tim TLK..." 
                     value={formData.saran} onChange={e => setFormData({...formData, saran: e.target.value})}
                     className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium text-slate-700 leading-relaxed"
                   />
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                   <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                   <p className="text-xs text-slate-500 leading-relaxed font-medium">
                     Data survei ini akan digunakan semata-mata untuk perbaikan kualitas layanan kepegawaian. Kami menjamin kerahasiaan identitas dan data pribadi Anda.
                   </p>
                </div>
             </motion.div>
           )}
        </div>

        {/* Footer Navigation */}
        {!settings?.externalUrl && (
          <div className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/50">
             {step > 1 ? (
               <button 
                 onClick={() => setStep(step - 1)}
                 className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-800 transition-colors"
               >
                 Kembali
               </button>
             ) : (
               <div />
             )}
             
             <button 
               onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
               disabled={!isStepComplete() || loading}
               className={cn(
                 "px-8 py-3 rounded-xl font-black text-white shadow-xl transition-all flex items-center gap-2",
                 isStepComplete() ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-slate-300 cursor-not-allowed"
               )}
             >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {step === 3 ? (loading ? 'MENGIRIM...' : 'KIRIM SURVEI') : 'LANJUT'}
                {step < 3 && <ArrowRight className="w-4 h-4" />}
             </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// --- Service Detail Modal ---
function ServiceDetailModal({ service, onClose, theme }: { service: any, onClose: () => void, theme: any }) {
  const [activeTab, setActiveTab] = useState<'info' | 'syarat' | 'alur' | 'draft'>('info');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn("p-8 md:p-10 relative overflow-hidden shrink-0", theme.light)}>
           <button 
             onClick={onClose}
             className="absolute right-6 top-6 w-10 h-10 rounded-full bg-white/50 backdrop-blur flex items-center justify-center hover:bg-white transition-colors z-20"
           >
             <X className="w-5 h-5 text-slate-800" />
           </button>
           
           <div className="relative z-10">
              <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4", theme.active, "text-white")}>
                Panduan Layanan
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none mb-4">{service.title}</h2>
              <p className="text-slate-600 font-medium max-w-2xl">{service.description}</p>
           </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'info', label: 'Informasi Umum', icon: Info },
            { id: 'syarat', label: 'Syarat & Dokumen', icon: FileSignature },
            { id: 'alur', label: 'Alur & SOP', icon: Settings },
            ...(service.drafts?.length > 0 ? [{ id: 'draft', label: 'Format & Draft', icon: DownloadCloud }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all relative whitespace-nowrap",
                activeTab === tab.id ? theme.text : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="modal-tab" className={cn("absolute bottom-0 left-0 right-0 h-1 rounded-t-full", theme.bg)} />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 bg-white custom-scrollbar">
           <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  key="info"
                  className="space-y-8"
                >
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                      <Scale className={cn("w-4 h-4", theme.text)} />
                      Dasar Hukum
                    </h3>
                    <ul className="space-y-3">
                      {service.dasarHukum?.map((item, i) => (
                        <li key={i} className="flex gap-3 text-slate-600 leading-relaxed group">
                           <div className={cn("w-1.5 h-1.5 rounded-full mt-2.5 transition-all group-hover:scale-150", theme.bg)} />
                           {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                      <BookOpen className={cn("w-4 h-4", theme.text)} />
                      Pengertian
                    </h3>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-slate-700 leading-relaxed font-medium italic">
                      "{service.pengertian}"
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'syarat' && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  key="syarat"
                  className="space-y-10"
                >
                   {service.jenisKenaikanPangkat?.map((jenis, i) => (
                     <div key={i} className="rounded-[2.5rem] border border-slate-100 overflow-hidden bg-slate-50/30">
                        <div className={cn("px-8 py-5 border-b border-white", theme.light)}>
                          <h4 className="font-black text-slate-800 text-lg">{jenis.title}</h4>
                          <p className="text-sm text-slate-500 font-medium">{jenis.description}</p>
                        </div>
                        <div className="p-8 grid md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-3 h-3" /> Ketentuan
                              </h5>
                              <ul className="space-y-3">
                                {jenis.ketentuan.map((k, j) => (
                                  <li key={j} className="flex gap-3 text-slate-600 text-sm font-medium leading-relaxed">
                                    <CheckCircle2 className={cn("w-4 h-4 mt-0.5", theme.text)} />
                                    {k}
                                  </li>
                                ))}
                              </ul>
                           </div>
                           <div className="space-y-4">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Kelengkapan Dokumen
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {jenis.dokumen.map((d, j) => (
                                  <span key={j} className="px-3 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
                                    {d}
                                  </span>
                                ))}
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                </motion.div>
              )}

              {activeTab === 'alur' && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  key="alur"
                  className="space-y-12"
                >
                  <div className="relative">
                    {service.sopMode === 'file' && service.sopUrl ? (
                      <div className="w-full aspect-[4/3] max-h-[800px] border border-slate-200 rounded-3xl overflow-hidden shadow-lg bg-slate-50 flex flex-col">
                        <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          </div>
                        </div>
                        <PdfIframe url={service.sopUrl} title={`Preview SOP for ${service.title}`} />
                      </div>
                    ) : (
                      <>
                        <div className="absolute left-[27px] top-4 bottom-4 w-1 bg-slate-100 rounded-full" />
                        <div className="space-y-8">
                          {service.alurSteps?.map((step: any, i: number) => (
                            <div key={i} className="flex gap-6 relative group">
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg relative z-10 transition-transform group-hover:scale-110",
                                theme.active, "text-white"
                              )}>
                                {i+1}
                              </div>
                              <div className="pt-2">
                                <h4 className="text-xl font-black text-slate-800 tracking-tight">{step.title}</h4>
                                <p className="text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-800 uppercase tracking-wider text-xs">Penanggung Jawab (PIC)</h5>
                      <p className="text-2xl font-black text-amber-900 tracking-tighter">{service.pic}</p>
                      <p className="text-amber-700/60 font-bold text-xs mt-1 uppercase">Tim Kerja Tata Laksana & Kepegawaian</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'draft' && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  key="draft"
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Format Dokumen / Draft</h3>
                    <p className="text-slate-500 font-medium max-w-lg mx-auto">
                      Unduh format dokumen atau draft yang diperlukan untuk mengajukan layanan ini. Setelah diunduh, Anda dapat mengisi dan menyesuaikannya.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {service.drafts?.map((draft: any, i: number) => (
                      <a 
                        key={i} 
                        href={draft.url} 
                        download={draft.name}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-slate-100 rounded-3xl border border-slate-200 transition-all hover:scale-[1.02]"
                      >
                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-2", theme.active, "text-white shadow-lg")}>
                          <DownloadCloud className="w-8 h-8" />
                        </div>
                        <h4 className="font-black text-slate-700 text-center uppercase tracking-wider text-sm mb-1">{draft.name}</h4>
                        {draft.description && (
                          <p className="text-xs text-slate-500 font-medium text-center">{draft.description}</p>
                        )}
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LayananView({ content, onOpenSKM }: { content: any, onOpenSKM: () => void }) {
  if (!content) return null;
  const services = content.services || [];
  const [selectedCategory, setSelectedCategory] = useState(services[0]?.category || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const activeCategory = services.find((s: any) => s.category === selectedCategory) || services[0];
  const activeColor = activeCategory?.color || "blue";

  const colorConfig: Record<string, any> = {
    blue: { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", ring: "focus:ring-blue-500/10", active: "bg-blue-600", accent: "from-blue-500 to-blue-600" },
    rose: { bg: "bg-rose-500", light: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", ring: "focus:ring-rose-500/10", active: "bg-rose-600", accent: "from-rose-500 to-rose-600" },
    amber: { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", ring: "focus:ring-amber-500/10", active: "bg-amber-600", accent: "from-amber-500 to-amber-600" },
    emerald: { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", ring: "focus:ring-emerald-500/10", active: "bg-emerald-600", accent: "from-emerald-500 to-emerald-600" },
    indigo: { bg: "bg-indigo-500", light: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", ring: "focus:ring-indigo-500/10", active: "bg-indigo-600", accent: "from-indigo-500 to-indigo-600" },
    slate: { bg: "bg-slate-700", light: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", ring: "focus:ring-slate-500/10", active: "bg-slate-800", accent: "from-slate-700 to-slate-800" },
  };

  const currentTheme = colorConfig[activeColor as string] || colorConfig.blue;

  const handleOpenDetail = async (item: any) => {
    if (loadingDetail) return;
    
    // Check if it's the SKM survey
    if (item.url === 'skm-survey' || item.id === 'skm-survey') {
      const skmSettings = content.skmSettings || {};
      const visibilityMode = skmSettings.visibilityMode || 'always';
      
      let isVisible = true;
      if (visibilityMode === 'hidden') isVisible = false;
      if (visibilityMode === 'scheduled') {
        const now = new Date();
        const start = skmSettings.startDate ? new Date(skmSettings.startDate) : null;
        const end = skmSettings.endDate ? new Date(skmSettings.endDate) : null;
        if (start && now < start && now.toDateString() !== start.toDateString()) isVisible = false;
        if (end && now > end && now.toDateString() !== end.toDateString()) isVisible = false;
      }

      if (!isVisible) {
        alert("Maaf, Survei Kepuasan Masyarakat saat ini belum dibuka atau telah ditutup.");
        return;
      }
      
      if (skmSettings.externalUrl) {
        window.open(skmSettings.externalUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      
      onOpenSKM();
      return;
    }

    const slug = item.title.toLowerCase().replace(/\s+/g, '-');
    setLoadingDetail(true);
    try {
      const snap = await getDoc(doc(db, 'service_details', slug));
      if (snap.exists()) {
        setSelectedService(snap.data());
      } else if (item.detail) {
        setSelectedService(item.detail);
      } else if (slug === 'mutasi-pns-tenaga-kependidikan') {
        setSelectedService({
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
      } else if (item.url && item.url !== "#") {
        window.open(item.url, '_blank');
      } else {
        setSelectedService({
          title: item.title,
          description: "Detail panduan untuk layanan ini sedang disiapkan oleh Tim SDM.",
          dasarHukum: [],
          pengertian: "",
          alurSteps: [],
          pic: "Tim Kerja Tata Laksana & Kepegawaian"
        });
      }
    } catch (e) {
      console.error(e);
      if (item.url && item.url !== "#") window.open(item.url, '_blank');
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredItems = (items: any[]) => {
    if (!searchTerm) return items;
    return items.filter((item: any) => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getIcon = (name: string, className = "w-5 h-5") => {
    switch (name) {
      case "Briefcase": return <Briefcase className={className} />;
      case "HeartPlus": return <HeartPlus className={className} />;
      case "ShieldCheck": return <ShieldCheck className={className} />;
      case "GraduationCap": return <GraduationCap className={className} />;
      case "Building": return <Building className={className} />;
      case "FolderOpen": return <FolderOpen className={className} />;
      default: return <AppWindow className={className} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="max-w-2xl text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-xl shadow-slate-200">
            <AppWindow className="w-3 h-3 text-amber-500" />
            Katalog Layanan Digital
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-4 first-letter:uppercase">Layanan <span className="text-amber-500">Terintegrasi</span></h2>
          <div className="w-20 h-2 bg-slate-900 rounded-full mb-6" />
          <p className="text-slate-500 text-lg font-medium leading-relaxed">Pusat akses cepat berbagai layanan administrasi, karier, dan kesejahteraan SDM Universitas Tidar yang transparan dan akuntabel.</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari jenis layanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl focus:ring-8 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all shadow-xl shadow-slate-200/50 group-hover:border-slate-300 font-medium"
          />
        </div>
      </div>

      {/* Featured Services Quick Access */}
      {!searchTerm && (
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-6 h-6 text-amber-500" />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Layanan Paling Sering Diakses</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Mutasi PNS', cat: 'Layanan Manajemen Karier', icon: Briefcase },
              { title: 'Cuti Pegawai', cat: 'Layanan Kesejahteraan', icon: HeartPlus },
              { title: 'SKP Tahunan', cat: 'Layanan Disiplin dan Kinerja', icon: ShieldCheck },
              { title: 'Tugas Belajar', cat: 'Layanan Pengembangan SDM', icon: GraduationCap }
            ].map((feat, i) => (
              <motion.button
                key={i}
                whileHover={{ y: -8 }}
                onClick={() => {
                  setSelectedCategory(feat.cat);
                  setSearchTerm(feat.title);
                }}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all text-left flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <feat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 tracking-tight text-sm uppercase leading-tight line-clamp-1">{feat.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{feat.cat.replace('Layanan ', '')}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Category Hub (Bento Grid) - Semua nampak, tidak ada yang tersembunyi */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {services.map((kat: any, i: number) => {
          const isSelected = selectedCategory === kat.category;
          const theme = colorConfig[kat.color as string] || colorConfig.blue;
          return (
            <button
              key={i}
              onClick={() => setSelectedCategory(kat.category)}
              className={cn(
                "group relative flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all duration-500 border-2",
                isSelected
                  ? `${theme.active} border-transparent text-white shadow-2xl shadow-${kat.color}-500/20 scale-105 z-10`
                  : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:text-slate-900"
              )}
            >
              {/* Animated Background Pulse for Active */}
              {isSelected && (
                <div className="absolute inset-0 rounded-[2rem] bg-white opacity-0 group-hover:opacity-10 transition-opacity animate-pulse"></div>
              )}
              
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110",
                isSelected ? "bg-white/20 text-white" : `${theme.light} ${theme.text}`
              )}>
                {getIcon(kat.icon, "w-7 h-7")}
              </div>
              <span className="text-[11px] font-black uppercase tracking-tight text-center leading-tight">
                {kat.category.replace("Layanan ", "")}
              </span>

              {/* Indicator Dot */}
              {isSelected && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-lg"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[3rem] border border-slate-200/80 shadow-2xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-[600px] transition-all">
            {/* Dynamic Content Header */}
            <div className={cn("p-12 border-b relative overflow-hidden", currentTheme.light, "border-white/50")}>
                <div className={cn("absolute right-0 bottom-0 w-80 h-80 opacity-[0.03] translate-x-10 translate-y-20", currentTheme.text)}>
                   {getIcon(activeCategory?.icon, "w-full h-full")}
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6", currentTheme.active, "text-white shadow-lg")}>
                        {activeCategory?.category}
                      </div>
                      <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter max-w-xl leading-none">{activeCategory?.category}</h3>
                      <p className="text-slate-500 mt-4 text-lg font-medium">Tersedia <span className={cn("font-bold px-2 py-0.5 rounded-md mx-1", currentTheme.light, currentTheme.text)}>{
                        activeCategory?.subCategories 
                          ? activeCategory.subCategories.reduce((acc: number, sub: any) => acc + filteredItems(sub.items).length, 0)
                          : filteredItems(activeCategory?.items || []).length
                      }</span> akses layanan aktif dalam kategori ini.</p>
                    </div>
                </div>
            </div>

            <div className="p-12 bg-slate-50/30">
                {activeCategory?.subCategories ? (
                  <div className="space-y-20">
                    {activeCategory.subCategories.map((sub: any, i: number) => {
                      const items = filteredItems(sub.items);
                      if (searchTerm && items.length === 0) return null;
                      return (
                        <div key={i} className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                          <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-4">
                            <div className="flex items-center gap-5">
                              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", currentTheme.active)}>
                                {getIcon(activeCategory?.icon, "w-6 h-6")}
                              </div>
                              <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                                {sub.title}
                              </h4>
                            </div>
                            <div className={cn("px-4 py-2 rounded-full text-[11px] font-black border-2 tracking-wider", currentTheme.text, currentTheme.border, "bg-white")}>
                              {items.length} ITEM LAYANAN
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {items.map((item: any, j: number) => (
                              <ServiceCard key={j} item={item} theme={currentTheme} onClick={() => handleOpenDetail(item)} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {filteredItems(activeCategory?.items || []).map((item: any, j: number) => (
                      <ServiceCard 
                        key={j} 
                        item={item} 
                        theme={currentTheme} 
                        onClick={() => handleOpenDetail(item)} 
                        loading={loadingDetail}
                      />
                    ))}
                  </div>
                )}

                {/* Service Detail Modal */}
                <AnimatePresence>
                  {selectedService && (
                    <ServiceDetailModal 
                      service={selectedService} 
                      onClose={() => setSelectedService(null)} 
                      theme={currentTheme}
                    />
                  )}
                </AnimatePresence>

                {/* Empty State */}
                {searchTerm && (
                  (() => {
                    const total = activeCategory?.subCategories 
                      ? activeCategory.subCategories.reduce((acc: number, sub: any) => acc + filteredItems(sub.items).length, 0)
                      : filteredItems(activeCategory?.items || []).length;
                    if (total === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                            <Search className="w-10 h-10" />
                          </div>
                          <h5 className="text-xl font-bold text-slate-800 mb-2">Layanan Tidak Ketemu</h5>
                          <p className="text-slate-400 max-w-sm">Maaf, kami tidak menemukan layanan dengan kata kunci "{searchTerm}" di kategori ini.</p>
                          <button onClick={() => setSearchTerm("")} className="mt-8 px-6 py-2 rounded-full border-2 border-blue-100 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors uppercase tracking-wider">Reset Pencarian</button>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
             </div>
          </div>
      </div>
  );
}

function ServiceCard({ item, theme, onClick, loading }: { item: any, theme: any, onClick?: () => void, loading?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={cn(
        "group flex items-center justify-between p-5 rounded-[2rem] bg-white border border-slate-100 hover:shadow-2xl hover:shadow-slate-200 transition-all h-full relative overflow-hidden w-full text-left",
        `hover:border-transparent`,
        loading && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 opacity-40 group-hover:opacity-100 transition-opacity", theme.bg)}></div>
      <div className="flex items-center gap-4 text-left relative z-10 pl-2">
        <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all bg-slate-50 text-slate-500 group-hover:scale-110",
            `group-hover:${theme.light} group-hover:${theme.text}`
        )}>
          {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <FileText className="w-7 h-7" />}
        </div>
        <div className="flex flex-col">
            <span className="font-extrabold text-slate-800 group-hover:text-slate-900 transition-colors text-[13px] leading-tight tracking-tight uppercase">
                {item.title}
            </span>
            <span className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {loading ? 'MEMUAT...' : 'LIHAT DETAIL / AKSES'} <ArrowUpRight className="w-3 h-3" />
            </span>
        </div>
      </div>
      <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100",
          theme.active, "text-white"
      )}>
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
      </div>
    </button>
  );
}

function ProfilView({ content }: { content: any }) {
  if (!content) return null;
  const profile = content.profile || { description: "", functions: [], members: [] };
  
  const leader = profile.members?.[0];
  const deputy = profile.members?.[1];
  const head = profile.members?.[2];
  const staff = profile.members?.slice(3) || [];

  const MemberNode = ({ member, type }: { member: any, type: 'leader' | 'deputy' | 'staff' }) => {
    if (!member) return null;
    
    return (
        <motion.div 
          whileHover={{ y: -8, scale: 1.02 }}
          className={cn(
            "relative rounded-[1.5rem] border border-white/40 glass overflow-hidden flex flex-col shrink-0 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-300/40 group/card", 
            type === 'leader' ? 'w-40 h-52' : type === 'deputy' ? 'w-36 h-48' : 'w-32 h-44'
          )}
        >
            {/* Photo */}
            <div className="h-[60%] w-full overflow-hidden bg-slate-50 flex items-center justify-center relative">
              {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover grayscale opacity-80 group-hover/card:grayscale-0 group-hover/card:opacity-100 transition-all duration-1000" />
              ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <Users className="w-12 h-12 text-slate-300 group-hover/card:text-amber-500 transition-colors duration-500" />
                  </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent group-hover/card:via-transparent transition-all duration-700" />
            </div>
            
            {/* Information */}
            <div className="relative z-10 flex-1 p-3 pt-0 text-center flex flex-col justify-center">
              <div className="font-bold text-[8px] uppercase tracking-[0.2em] text-amber-600 mb-0.5 line-clamp-2">{member.role || (type === 'leader' ? 'Ketua Tim' : type === 'deputy' ? 'Sekretariat' : 'Anggota')}</div>
              <div className="font-black text-[11px] tracking-tight text-slate-900 line-clamp-2 leading-tight uppercase group-hover/card:text-amber-700 transition-colors">{member.name}</div>
            </div>
        </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-32 animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-36">
        {/* Intro Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass border border-amber-500/20 text-amber-600 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/5">
                    Mengenal Kami
                </div>
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-950 tracking-tighter leading-[0.85]">
                  Profil Tim Kerja <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-400">TLK Untidar</span>
                </h2>
                <div className="w-24 h-2 bg-slate-900 rounded-full" />
                <p className="text-slate-500 text-xl md:text-2xl leading-relaxed font-medium max-w-xl opacity-80">
                    {profile.description}
                </p>
                <div className="grid grid-cols-2 gap-8 pt-6">
                    <div className="glass p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 group hover:bg-slate-900 hover:text-white transition-all duration-500">
                        <div className="text-4xl font-black mb-2 transition-transform group-hover:scale-110">01</div>
                        <div className="text-xs font-black uppercase tracking-widest opacity-60">Integritas</div>
                    </div>
                    <div className="glass p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 group hover:bg-slate-900 hover:text-white transition-all duration-500">
                        <div className="text-4xl font-black mb-2 transition-transform group-hover:scale-110">02</div>
                        <div className="text-xs font-black uppercase tracking-widest opacity-60">Kolaborasi</div>
                    </div>
                </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white group"
            >
                <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay group-hover:bg-black/20 transition-all duration-1000" />
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" 
                  alt="Team Collaboration" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100" 
                />
                <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
                    <h4 className="text-white font-black text-3xl tracking-tighter italic leading-tight">"Profesional, Melayani, Bermartabat."</h4>
                </div>
            </motion.div>
        </div>

        {/* Structure Section */}
        <section className="glass p-10 md:p-20 rounded-[4rem] shadow-2xl shadow-slate-200/30 overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] -mr-20 -mt-20"></div>

            <div className="text-center mb-16 space-y-4 relative z-10">
                <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em]">Hierarchy</h3>
                <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter">Struktur Organisasi</h2>
                <div className="w-12 h-1.5 bg-slate-200 mx-auto rounded-full" />
            </div>
            
            <div className="flex justify-center overflow-x-auto pb-12 no-scrollbar">
                {profile.orgChartImageUrl ? (
                    <motion.div 
                      key="img-chart"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-8 rounded-[3rem] shadow-inner border border-slate-100"
                    >
                        <img src={profile.orgChartImageUrl} alt="Struktur Organisasi" className="max-w-full h-auto rounded-2xl shadow-sm" />
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center min-w-[1000px]">
                        {/* Level 1: Leader */}
                        <div className="flex flex-col items-center">
                            <MemberNode member={leader} type="leader" />
                            <div className="h-16 w-0.5 bg-slate-200 relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/50 to-transparent" />
                            </div>
                        </div>
                        
                        {/* Level 2: Deputy */}
                        {deputy && (
                            <div className="flex flex-col items-center">
                                <MemberNode member={deputy} type="deputy" />
                                <div className="h-16 w-0.5 bg-slate-200" />
                            </div>
                        )}

                        {/* Level 3: Head */}
                        {head && (
                            <div className="flex flex-col items-center">
                                <MemberNode member={head} type="deputy" />
                                <div className="h-16 w-0.5 bg-slate-200" />
                            </div>
                        )}

                        {/* Level 4: Staff Grid with Integrated Connectors */}
                        <div className="w-full max-w-6xl">
                            <div className="grid grid-cols-4 w-full h-16">
                                <div className="relative">
                                    <div className="absolute right-0 top-0 w-1/2 h-0.5 bg-slate-200"></div>
                                    <div className="absolute right-1/2 top-0 w-0.5 h-full bg-slate-200"></div>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-x-0 top-0 h-0.5 bg-slate-200"></div>
                                    <div className="absolute left-1/2 top-0 w-0.5 h-full bg-slate-200"></div>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-x-0 top-0 h-0.5 bg-slate-200"></div>
                                    <div className="absolute left-1/2 top-0 w-0.5 h-full bg-slate-200"></div>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-0 top-0 w-1/2 h-0.5 bg-slate-200"></div>
                                    <div className="absolute left-1/2 top-0 w-0.5 h-full bg-slate-200"></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                {[0, 1, 2, 3].map((colIdx) => (
                                    <div key={colIdx} className="flex flex-col items-center">
                                         <div className="flex flex-col gap-6 items-center">
                                             {staff.slice(colIdx * 3, colIdx * 3 + 3).map((m: any, rowIdx: number) => {
                                                 return (
                                                    <React.Fragment key={rowIdx}>
                                                        <MemberNode member={m} type="staff" />
                                                        {rowIdx < staff.slice(colIdx * 3, colIdx * 3 + 3).length - 1 && (
                                                            <div className="w-0.5 h-10 bg-slate-100" />
                                                        )}
                                                    </React.Fragment>
                                                 );
                                             })}
                                         </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>

        {/* Vision & Functions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-1 bg-slate-950 rounded-[4rem] p-16 text-white relative overflow-hidden group shadow-2xl shadow-slate-950/40"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000">
                    <GraduationCap className="w-48 h-48" />
                </div>
                <h3 className="text-4xl font-black tracking-tighter mb-10 bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">Visi Utama</h3>
                <p className="text-slate-300 text-xl leading-relaxed font-medium italic opacity-90">
                    "Menjadi pusat pelayanan tata laksana dan kepegawaian yang unggul, profesional, dan akuntabel dalam mendukung Universitas Tidar menuju Wilayah Bebas Korupsi (WBK)."
                </p>
                <div className="mt-16 flex items-center gap-6">
                    <div className="w-16 h-1.5 bg-amber-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Core Values</span>
                </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 glass rounded-[4rem] p-16 border border-white/40 shadow-2xl shadow-slate-200/40 relative overflow-hidden"
            >
                <div className="absolute bottom-0 right-0 p-12 text-slate-900 opacity-[0.02]">
                  <Briefcase className="w-80 h-80" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-12 flex items-center gap-4">
                  <span className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                    <Scale className="w-6 h-6" />
                  </span>
                  Fungsi & Rincian Tugas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {profile.functions.map((f: string, i: number) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-500 shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-slate-600 font-bold leading-relaxed text-sm opacity-80 group-hover:opacity-100 transition-opacity">
                        {f}
                      </p>
                    </div>
                  ))}
                </div>
            </motion.div>
        </div>

        {/* Logo Philosophy Section */}
        {profile.logoUrl && (
            <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                   <img src={profile.logoUrl} alt="Watermark" className="w-96 h-96" />
                </div>
                
                <div className="row flex flex-col lg:flex-row gap-20 items-center">
                    <div className="lg:w-1/3">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-amber-500/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full" />
                            <img src={profile.logoUrl} alt="Logo TLK" className="w-full h-auto object-contain relative z-10" />
                        </div>
                    </div>
                    
                    <div className="lg:w-2/3 space-y-12">
                        <div className="space-y-4">
                          <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Filosofi <span className="text-amber-500">Logo</span></h3>
                          <p className="text-slate-500 font-medium">Setiap elemen dalam visual identitas kami mencerminkan semangat pelayanan dan integritas pendidikan tinggi.</p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-10">
                          {profile.filosofiLogo && profile.filosofiLogo.map((item: any, i: number) => (
                              <div key={i} className="space-y-3 p-6 rounded-[2rem] bg-slate-50 border border-white hover:border-slate-200 transition-all hover:bg-white hover:shadow-xl group">
                                  <h4 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-amber-600 transition-colors uppercase text-xs">{item.title}</h4>
                                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                              </div>
                          ))}
                        </div>

                        {profile.moto && (
                            <div className="bg-slate-900 rounded-3xl p-8 text-white flex items-center gap-6 shadow-2xl">
                                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                                   <Megaphone className="w-6 h-6 text-slate-900" />
                                </div>
                                <p className="text-xl font-bold tracking-tight italic opacity-90">
                                    "{profile.moto}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

function PengumumanView({ content }: { content: any }) {
  if (!content) return null;
  const announcements = content.announcements || [];
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-48 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="text-center mb-20 space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-slate-900/20"
        >
          <Megaphone className="w-10 h-10 text-amber-500" />
        </motion.div>
        <h2 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tighter">Informasi Terkini</h2>
        <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">Pusat publikasi surat edaran, berita layanan, dan liputan kegiatan kepegawaian Universitas Tidar.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {announcements.map((nf: any, i: number)=> (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass group p-10 rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-500 flex flex-col h-full"
          >
             <div className="flex items-center justify-between mb-8">
               <span className="text-[10px] font-black px-4 py-1.5 bg-amber-500 text-slate-950 rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/20">{nf.type || nf.tag || 'Berita'}</span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <CalendarCheck className="w-3 h-3" /> {nf.date}
               </span>
             </div>
             
             <h3 className="text-2xl font-black text-slate-950 tracking-tight mb-4 group-hover:text-amber-600 transition-colors duration-500 leading-tight flex-1">
               {nf.title}
             </h3>
             
             <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 opacity-80">
               {nf.excerpt || "Silakan klik baca selengkapnya untuk detail informasi ini."}
             </p>
             
             <a 
               href={nf.url || '#'} 
               target={nf.url && nf.url !== '#' ? '_blank' : undefined} 
               rel={nf.url && nf.url !== '#' ? 'noopener noreferrer' : undefined} 
               className="inline-flex items-center gap-3 text-slate-950 font-black text-xs uppercase tracking-widest group-hover:gap-5 transition-all w-max"
             >
               Baca Selengkapnya
               <ArrowUpRight className="w-4 h-4 text-amber-500" />
             </a>
          </motion.div>
        ))}
        
        {announcements.length === 0 && (
           <div className="md:col-span-2 text-center py-20 glass rounded-[3rem] border-dashed border-2 border-white/40">
             <Info className="w-16 h-16 text-slate-300 mx-auto mb-6" />
             <h3 className="text-2xl font-black text-slate-400">Belum ada pengumuman hari ini</h3>
           </div>
        )}
      </div>
    </div>
  );
}

function BantuanView({ content }: { content: any }) {
  const bantuan = content.bantuan || {};
  const telepon = bantuan.telepon || '(0293) 364113';
  const keteranganTelepon = bantuan.keteranganTelepon || 'Layanan aktif pada jam kerja (Senin-Jumat, 08.00 - 16.00 WIB).';
  const email = bantuan.email || 'kepegawaian@untidar.ac.id';
  const keteranganEmail = bantuan.keteranganEmail || 'Gunakan email Untidar Anda untuk mengirimkan dokumen yang membutuhkan proses.';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-48 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="text-center mb-24 space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/20"
        >
          <LifeBuoy className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tighter">Pusat Bantuan</h2>
        <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">Hubungi staf tata laksana dan kepegawaian jika Anda memiliki kendala pengurusan dokumen atau akses sistem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          whileHover={{ y: -10 }}
          className="glass p-12 rounded-[4rem] border border-white/40 shadow-2xl shadow-slate-200/40 relative overflow-hidden group"
        >
           <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000 text-blue-600">
             <Phone className="w-48 h-48" />
           </div>
           <div className="w-16 h-16 rounded-3xl bg-blue-500 flex items-center justify-center text-white mb-8 shadow-lg shadow-blue-500/20">
             <Phone className="w-8 h-8" />
           </div>
           <h3 className="text-3xl font-black text-slate-950 tracking-tighter mb-4">Telepon Resmi</h3>
           <p className="text-slate-500 font-bold mb-8 text-sm leading-relaxed opacity-80">{keteranganTelepon}</p>
           <p className="text-4xl font-black text-slate-950 tracking-tighter group-hover:text-blue-600 transition-colors">{telepon}</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -10 }}
          className="glass p-12 rounded-[4rem] border border-white/40 shadow-2xl shadow-slate-200/40 relative overflow-hidden group"
        >
           <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000 text-emerald-600">
             <Mail className="w-48 h-48" />
           </div>
           <div className="w-16 h-16 rounded-3xl bg-emerald-500 flex items-center justify-center text-white mb-8 shadow-lg shadow-emerald-500/20">
             <Mail className="w-8 h-8" />
           </div>
           <h3 className="text-3xl font-black text-slate-950 tracking-tighter mb-4">Email Persuratan</h3>
           <p className="text-slate-500 font-bold mb-8 text-sm leading-relaxed opacity-80">{keteranganEmail}</p>
           <p className="text-2xl font-black text-slate-950 tracking-tighter group-hover:text-emerald-600 transition-colors truncate">{email}</p>
        </motion.div>
      </div>
    </div>
  );
}

// --- AI ChatBot Feature ---
function AIChatBot({ contextData }: { contextData: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Halo! Saya asisten virtual Layanan SDM Universitas Tidar. Ada yang bisa saya bantu terkait layanan kepegawaian?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          contextData: contextData,
          history: messages.map(m => ({ 
            role: m.role === 'user' ? 'user' : 'model', 
            parts: [{ text: m.text }] 
          }))
        })
      });

      if (!resp.ok) {
        throw new Error("Gagal terhubung ke AI");
      }

      const data = await resp.json();
      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Maaf, sistem AI kami sedang tidak tersedia atau koneksi terputus. Silakan coba lagi." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2",
          isOpen ? "opacity-0 scale-50 pointer-events-none" : "opacity-100 scale-100 bg-amber-500 text-slate-900 hover:bg-amber-400"
        )}
      >
        <Bot className="w-6 h-6" />
        <span className="font-bold">Tanya AI</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 p-4 pb-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Asisten Virtual TLK</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 relative flex flex-col gap-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "self-end items-end" : "self-start items-start"
                  )}
                >
                  <div 
                    className={cn(
                      "px-4 py-3 rounded-2xl shadow-sm border",
                      msg.role === 'user' 
                        ? "bg-amber-500 text-slate-900 rounded-tr-sm border-amber-600/20 font-medium" 
                        : "bg-white text-slate-700 rounded-tl-sm border-slate-200"
                    )}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.text}</p>
                    ) : (
                      <div className="markdown-body prose prose-slate prose-sm max-w-none">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium px-1">
                    {msg.role === 'user' ? 'Anda' : 'Asisten AI'}
                  </span>
                </div>
              ))}
              
              {isTyping && (
                <div className="self-start flex flex-col max-w-[85%]">
                  <div className="px-4 py-4 rounded-2xl bg-white rounded-tl-sm border border-slate-200 shadow-sm flex items-center gap-2">
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="shrink-0" />
            </div>

            {/* Input area */}
            <form 
              onSubmit={handleSend}
              className="p-4 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
            >
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan sesuatu..."
                className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                disabled={isTyping}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
