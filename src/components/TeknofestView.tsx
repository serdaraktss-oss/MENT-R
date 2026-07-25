import React, { useState } from 'react';
import { TeknofestProject, ReferenceDocument } from '../types';
import { INITIAL_TEKNOFEST_PROJECTS } from '../data/projectsData';
import { exportTeknofestDOCX, exportTeknofestPDF } from '../utils/projectExporters';
import { ReferenceDocsManager } from './ReferenceDocsManager';
import {
  FileText,
  Sparkles,
  Download,
  Plus,
  Edit3,
  Trash2,
  Rocket,
  Cpu,
  Layers,
  Clock,
  Save,
  AlertCircle,
  Loader2,
  BookOpen,
  FolderOpen,
  FileCheck,
} from 'lucide-react';

export const TeknofestView: React.FC = () => {
  const [projects, setProjects] = useState<TeknofestProject[]>(INITIAL_TEKNOFEST_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<TeknofestProject | null>(INITIAL_TEKNOFEST_PROJECTS[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create' | 'detail' | 'documents'>('list');

  // Referans Belgeler & Şablonlar State
  const [referenceDocs, setReferenceDocs] = useState<ReferenceDocument[]>(() => {
    const saved = localStorage.getItem('teknofest_reference_docs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse teknofest_reference_docs', e);
      }
    }
    return [
      {
        id: 'default-teknofest-1',
        module: 'teknofest',
        name: 'TEKNOFEST Detay Rapor Formatı & Puanlama Kriterleri',
        category: 'Şablon',
        content: 'TEKNOFEST TEKNİK DETAY RAPORU VE PUANLAMA FORMATI:\n1. Proje Özeti ve Problem Tanımı: Çözülmek istenen sorun net, ölçülebilir ve toplumsal/sanayi ihtiyacına dönük olmalıdır.\n2. Yerlilik ve Özgünlük (%25 Ağırlık): Projenin muadillerinden üstün yönleri, yerli imkanlarla üretilebilirlik potansiyeli ve patent/faydalı model değeri açıklanmalıdır.\n3. Yöntem ve Sistem Mimarisi (%35 Ağırlık): Kullanılacak mikrodenetleyiciler, algoritmalar, donanım kartları ve yazılım akış şeması blok diyagramlarla desteklenmelidir.\n4. Risk Analizi ve Yerli Tedarik (%20 Ağırlık): Karşılaşılabilecek teknik riskler (sensör arızası, güç tüketimi, haberleşme kopması) ve alternatif yerli çözümler listelenmelidir.',
        size: 980,
        uploadedAt: new Date().toLocaleDateString('tr-TR'),
        active: true,
      },
    ];
  });

  const handleUpdateReferenceDocs = (docs: ReferenceDocument[]) => {
    setReferenceDocs(docs);
    localStorage.setItem('teknofest_reference_docs', JSON.stringify(docs));
  };

  // AI Generator Form State - 8 Proje Taslağı Sekmesi
  const [draftTab, setDraftTab] = useState<'kategori' | 'takim' | 'proje' | 'uyeler' | 'sorun' | 'ihtiyac' | 'yontem' | 'hedef'>('kategori');
  const [category, setCategory] = useState('İnsanlık Yararına Teknoloji');
  const [takimAdi, setTakimAdi] = useState('Anka Ar-Ge Teknoloji Takımı');
  const [projeAdi, setProjeAdi] = useState('Göçük Altı Canlı Sinyali Tespiti Yapan Otonom İHA ve Yapay Zeka Sistemi');
  const [takimUyeleri, setTakimUyeleri] = useState('Mert Aksoy, Derya Yılmaz');
  const [cozumUrettigiSorun, setCozumUrettigiSorun] = useState('Afet sonrası arama-kurtarma süreçlerinde enkaz altındaki canlıların ses ve ısı sinyallerinin zamanında tespit edilememesi.');
  const [cozumUrettigiIhtiyacFikri, setCozumUrettigiIhtiyacFikri] = useState('Otonom İHA uçuş kartı, termal görüntü işleme ve akustik gürültü filtreleme ile enkaz altı canlı lokasyonunun haritalandırılması.');
  const [kullanilacakTeknikYontem, setKullanilacakTeknikYontem] = useState('ROS, Pixhawk uçuş kontrol kartı, Python, TensorFlow Lite, YOLOV8 nesne algılama algoritması.');
  const [hedefKitle, setHedefKitle] = useState('AFAD, Kızılay, AKUT, belediye arama-kurtarma ekipleri ve insani yardım kuruluşları.');

  const [studentName, setStudentName] = useState('Mert Aksoy & Derya Yılmaz');
  const [topicIdea, setTopicIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const categoryOptions = [
    'İnsanlık Yararına Teknoloji',
    'Akıllı Ulaşım Teknolojileri',
    'Eğitim Teknolojileri',
    'Çevre ve Enerji Teknolojileri',
    'Biyoteknoloji İnovasyon',
    'Tarım Teknolojileri',
    'Sanayide Dijital Teknolojiler',
    'Engelsiz Yaşam Teknolojileri',
    'Afet Yönetimi Teknolojileri',
    'Kablosuz İletişim ve Ağ Teknolojileri',
  ];

  const handleGenerateProject = async () => {
    setIsGenerating(true);
    setErrorMsg('');

    try {
      const activeDocs = referenceDocs.filter((d) => d.active);
      const response = await fetch('/api/generate-teknofest-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          studentName: takimUyeleri,
          takimAdi,
          projeAdi,
          takimUyeleri,
          cozumUrettigiSorun,
          cozumUrettigiIhtiyacFikri,
          kullanilacakTeknikYontem,
          hedefKitle,
          topicIdea: `${projeAdi} - ${cozumUrettigiSorun}`,
          referenceDocs: activeDocs.map((d) => ({
            name: d.name,
            category: d.category,
            content: d.content,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.project) {
        const newProj: TeknofestProject = {
          ...data.project,
          id: `teknofest-${Date.now()}`,
          kategori: category,
          projeAdi: projeAdi || data.project.projeAdi,
          takimAdi,
          takimUyeleri,
          cozumUrettigiSorun,
          cozumUrettigiIhtiyacFikri,
          kullanilacakTeknikYontem,
          hedefKitle,
          studentName: takimUyeleri || 'Teknoloji Takımı',
          createdAt: new Date().toLocaleDateString('tr-TR'),
        };

        setProjects([newProj, ...projects]);
        setSelectedProject(newProj);
        setActiveSubTab('detail');
      } else {
        setErrorMsg('AI TEKNOFEST projesi üretilemedi. Lütfen bağlantınızı kontrol ediniz.');
      }
    } catch (e: any) {
      console.error('TEKNOFEST generation error:', e);
      setErrorMsg('Bir hata oluştu: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProjectEdits = () => {
    if (!selectedProject) return;
    setProjects(projects.map((p) => (p.id === selectedProject.id ? selectedProject : p)));
    setIsEditing(false);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Bu TEKNOFEST projesini silmek istediğinize emin misiniz?')) {
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);
      if (selectedProject?.id === id) {
        setSelectedProject(updated[0] || null);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 border border-rose-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-400/30 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" /> TEKNOFEST HAVACILIK VE TEKNOLOJİ
              </span>
              <span className="text-xs text-slate-400">Detay Raporu & Ar-Ge Proje Hazırlık Modülü</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              TEKNOFEST Proje Oluşturucu & Rapor Düzenleyici
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              TEKNOFEST yarışma kılavuzlarına tam uyumlu, yerlilik ve özgünlük oranı yüksek, sistem mimarisi ve risk analizi eksiksiz projeler hazırlayın. Word (.docx) ve PDF formatlarında anında indirin.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveSubTab('create')}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Yapay Zeka İle Proje Üret</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-700/60">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'list'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kayıtlı TEKNOFEST Projeleri ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'create'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Proje Taslağı Oluştur</span>
          </button>

          <button
            onClick={() => setActiveSubTab('documents')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'documents'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Referans Belgeler & Şablonlar ({referenceDocs.length})</span>
          </button>

          {selectedProject && (
            <button
              onClick={() => setActiveSubTab('detail')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'detail'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Rapor İncele & Düzenle</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUB-TAB 1: CREATE NEW AI TEKNOFEST PROJECT WITH 8 DRAFT TABS          */}
      {/* ===================================================================== */}
      {activeSubTab === 'create' && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-md space-y-6">
          <div className="border-b border-slate-700/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-rose-400" />
                TEKNOFEST Özgün Proje Taslak Oluşturucu
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Aşağıdaki 8 taslak sekmesini doldurarak TEKNOFEST Detay Rapor Şablonuna %100 uygun, yerlilik ve Ar-Ge odaklı özgün proje raporu oluşturun.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-full text-xs font-bold shrink-0 self-start md:self-auto">
                8 Taslak Parametresi Entegre
              </span>
              <button
                type="button"
                onClick={() => setActiveSubTab('documents')}
                className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-full text-xs font-bold shrink-0 self-start md:self-auto transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{referenceDocs.filter((d) => d.active).length} Aktif Referans Belge AI Reçetesine Dahil</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 8 DRAFT TABS NAVIGATION BAR */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-700/60 no-scrollbar">
            {[
              { id: 'kategori', label: '1. Yarışma Kategorisi', icon: '🏆' },
              { id: 'takim', label: '2. Takım Adı', icon: '🛡️' },
              { id: 'proje', label: '3. Proje Adı', icon: '💡' },
              { id: 'uyeler', label: '4. Takım Üyeleri', icon: '👥' },
              { id: 'sorun', label: '5. Çözüm Ürettiği Sorun', icon: '⚠️' },
              { id: 'ihtiyac', label: '6. İhtiyaç / Çözüm Fikri', icon: '🚀' },
              { id: 'yontem', label: '7. Teknik / Yöntem', icon: '🛠️' },
              { id: 'hedef', label: '8. Hedef Kitle', icon: '🎯' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDraftTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  draftTab === tab.id
                    ? 'bg-rose-600 text-white shadow-md border border-rose-400/50'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ACTIVE TAB CONTENT */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 min-h-[160px]">
            {draftTab === 'kategori' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <span>🏆 Sekme 1: TEKNOFEST Yarışma Kategorisi</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Yarışma Kategorisi Seçin:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {draftTab === 'takim' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <span>🛡️ Sekme 2: Takım Adı</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    TEKNOFEST Takım Adı:
                  </label>
                  <input
                    type="text"
                    value={takimAdi}
                    onChange={(e) => setTakimAdi(e.target.value)}
                    placeholder="Örn: Anka Ar-Ge Teknoloji Takımı"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {draftTab === 'proje' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <span>💡 Sekme 3: Proje Adı</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Proje Başlığı (İnovatif Başlık - Max 15 Kelime):
                  </label>
                  <textarea
                    value={projeAdi}
                    onChange={(e) => setProjeAdi(e.target.value)}
                    rows={2}
                    placeholder="Örn: Göçük Altı Canlı Sinyali Tespiti Yapan Otonom İHA ve Yapay Zeka Sistemi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-bold"
                  />
                </div>
              </div>
            )}

            {draftTab === 'uyeler' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <span>👥 Sekme 4: Takım Üyeleri</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Takım Kaptanı ve Üyeleri:
                  </label>
                  <input
                    type="text"
                    value={takimUyeleri}
                    onChange={(e) => setTakimUyeleri(e.target.value)}
                    placeholder="Örn: Mert Aksoy (Takım Kaptanı), Derya Yılmaz (Yazılım Sorumlusu)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {draftTab === 'sorun' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <span>⚠️ Sekme 5: Çözüm Ürettiği Sorun</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Somut Problem Tanımı (Problem Statement):
                  </label>
                  <textarea
                    value={cozumUrettigiSorun}
                    onChange={(e) => setCozumUrettigiSorun(e.target.value)}
                    rows={3}
                    placeholder="Çözülmek istenen teknik, insani veya sanayi problemi..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {draftTab === 'ihtiyac' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <span>🚀 Sekme 6: Çözüm Ürettiği İhtiyaç / Çözüm Fikri</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    İhtiyaç Analizi, Yerlilik ve İnovatif Çözüm Fikri:
                  </label>
                  <textarea
                    value={cozumUrettigiIhtiyacFikri}
                    onChange={(e) => setCozumUrettigiIhtiyacFikri(e.target.value)}
                    rows={3}
                    placeholder="Sistemin sunduğu yenilikçi çözüm, yerli üretim değeri ve farkı..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {draftTab === 'yontem' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <span>🛠️ Sekme 7: Kullanılacak Teknik / Yöntem</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Donanım, Yazılım, Sensörler ve Mühendislik Yöntemi:
                  </label>
                  <textarea
                    value={kullanilacakTeknikYontem}
                    onChange={(e) => setKullanilacakTeknikYontem(e.target.value)}
                    rows={3}
                    placeholder="Kullanılacak mikrodenetleyiciler, algoritmalar, diller, CAD/CAM tasarımları..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {draftTab === 'hedef' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <span>🎯 Sekme 8: Hedef Kitle</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Hedef Kitle, Kullanıcılar ve Yaygınlaştırma Potansiyeli:
                  </label>
                  <textarea
                    value={hedefKitle}
                    onChange={(e) => setHedefKitle(e.target.value)}
                    rows={3}
                    placeholder="Arama kurtarma Ekipleri, AFAD, hastaneler, engelliler, sürücüler vb..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ALL 8 DRAFT SUMMARY GRID PREVIEW */}
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Doldurulan 8 Proje Taslak Özeti:
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px]">
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-rose-300 font-bold block">1. Kategori:</span>
                <span className="text-slate-200 truncate block">{category}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-rose-300 font-bold block">2. Takım Adı:</span>
                <span className="text-slate-200 truncate block">{takimAdi || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-rose-300 font-bold block">3. Proje Adı:</span>
                <span className="text-slate-200 truncate block">{projeAdi || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-rose-300 font-bold block">4. Üyeler:</span>
                <span className="text-slate-200 truncate block">{takimUyeleri || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-rose-300 font-bold block">5. Sorun:</span>
                <span className="text-slate-200 truncate block">{cozumUrettigiSorun || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-rose-300 font-bold block">6. İhtiyaç / Çözüm:</span>
                <span className="text-slate-200 truncate block">{cozumUrettigiIhtiyacFikri || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-rose-300 font-bold block">7. Teknik / Yöntem:</span>
                <span className="text-slate-200 truncate block">{kullanilacakTeknikYontem || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-rose-300 font-bold block">8. Hedef Kitle:</span>
                <span className="text-slate-200 truncate block">{hedefKitle || '-'}</span>
              </div>
            </div>
          </div>

          {/* GENERATE BUTTON */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleGenerateProject}
              disabled={isGenerating}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Özgün TEKNOFEST Detay Raporu Üretiliyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>TEKNOFEST Özgün Proje Raporu Üret</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 2: LIST OF TEKNOFEST PROJECTS                                 */}
      {/* ===================================================================== */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 hover:border-rose-500/50 transition space-y-4 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded text-[10px] font-bold">
                      {proj.kategori}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {proj.createdAt}
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-white leading-snug line-clamp-2">
                    {proj.projeAdi}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {proj.ozet}
                  </p>

                  <div className="pt-1 flex flex-wrap gap-1">
                    {(proj.anahtarKelimeler || []).map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-slate-900 text-slate-400 rounded text-[10px] border border-slate-700">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedProject(proj);
                      setActiveSubTab('detail');
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Raporu İncele</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => exportTeknofestDOCX(proj)}
                      className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="Word (.docx) İndir"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>DOCX</span>
                    </button>

                    <button
                      onClick={() => exportTeknofestPDF(proj)}
                      className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="PDF İndir"
                    >
                      <Download className="w-3.5 h-3.5 text-rose-400" />
                      <span>PDF</span>
                    </button>

                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="Projeyi Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 3: DETAILED TEKNOFEST REPORT VIEW AND EDITOR                 */}
      {/* ===================================================================== */}
      {activeSubTab === 'detail' && selectedProject && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-lg space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
            <div>
              <span className="text-xs text-rose-400 font-bold uppercase tracking-wider">
                TEKNOFEST Detay Raporu — {selectedProject.kategori}
              </span>
              <h2 className="text-lg font-black text-white mt-1">
                TEKNOFEST Proje Rapor İnceleme
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Raporu Düzenle</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveProjectEdits}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Değişiklikleri Kaydet</span>
                </button>
              )}

              <button
                onClick={() => exportTeknofestDOCX(selectedProject)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Word (.docx) İndir</span>
              </button>

              <button
                onClick={() => exportTeknofestPDF(selectedProject)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>PDF İndir</span>
              </button>
            </div>
          </div>

          {/* Form / Content View */}
          <div className="space-y-6 text-slate-200">
            {/* Kategori */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60">
              <label className="block text-xs font-bold text-slate-400 mb-1">Yarışma Kategorisi:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={selectedProject.kategori}
                  onChange={(e) => setSelectedProject({ ...selectedProject, kategori: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                />
              ) : (
                <p className="text-sm font-bold text-white">{selectedProject.kategori}</p>
              )}
            </div>

            {/* Proje Adı */}
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                Proje Adı (Max 15 Kelime):
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.projeAdi}
                  onChange={(e) => setSelectedProject({ ...selectedProject, projeAdi: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-bold"
                />
              ) : (
                <h3 className="text-base font-black text-white bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                  {selectedProject.projeAdi}
                </h3>
              )}
            </div>

            {/* Proje Özeti */}
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                1. Proje Özeti:
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.ozet}
                  onChange={(e) => setSelectedProject({ ...selectedProject, ozet: e.target.value })}
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.ozet}
                </p>
              )}
            </div>

            {/* Problem / İhtiyaç Tanımı */}
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                2. Problem ve İhtiyaç Tanımı:
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.problemIhtiyac}
                  onChange={(e) => setSelectedProject({ ...selectedProject, problemIhtiyac: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.problemIhtiyac}
                </p>
              )}
            </div>

            {/* Yerlilik, Özgünlük ve Yenilikçi Yönü */}
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                3. Yerlilik, Özgünlük ve Yenilikçi Yönü:
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.yerlilikOzgunluk}
                  onChange={(e) => setSelectedProject({ ...selectedProject, yerlilikOzgunluk: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.yerlilikOzgunluk}
                </p>
              )}
            </div>

            {/* Hedef Kitle ve Kullanılabilirlik */}
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                4. Hedef Kitle ve Kullanılabilirlik:
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.hedefKitle}
                  onChange={(e) => setSelectedProject({ ...selectedProject, hedefKitle: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.hedefKitle}
                </p>
              )}
            </div>

            {/* Yöntem ve Uygulanabilirlik */}
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                5. Yöntem ve Uygulanabilirlik (Sistem Mimarisi):
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.yontemUygulanabilirlik}
                  onChange={(e) => setSelectedProject({ ...selectedProject, yontemUygulanabilirlik: e.target.value })}
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.yontemUygulanabilirlik}
                </p>
              )}
            </div>

            {/* Yerli Üretim Potansiyeli ve Riskler */}
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                6. Yerli Üretim Potansiyeli, Riskler ve Çözüm Yolları:
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.yerliUretimVeRiskler}
                  onChange={(e) => setSelectedProject({ ...selectedProject, yerliUretimVeRiskler: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.yerliUretimVeRiskler}
                </p>
              )}
            </div>

            {/* Etki ve Sürdürülebilirlik */}
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                7. Tahmini Etki, Yaygınlaştırma ve Sürdürülebilirlik:
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.etkiVeSurdurulebilirlik}
                  onChange={(e) => setSelectedProject({ ...selectedProject, etkiVeSurdurulebilirlik: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.etkiVeSurdurulebilirlik}
                </p>
              )}
            </div>

            {/* Proje İş-Zaman Çizelgesi */}
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
                8. Proje İş-Zaman Planı Tablosu:
              </label>
              <div className="overflow-x-auto rounded-xl border border-slate-700/80">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 border-b border-slate-700 font-bold uppercase text-[10px]">
                      <th className="p-2.5">İş Paketi / Süreç</th>
                      <th className="p-2 text-center">NİSAN</th>
                      <th className="p-2 text-center">MAYIS</th>
                      <th className="p-2 text-center">HAZİRAN</th>
                      <th className="p-2 text-center">TEMMUZ</th>
                      <th className="p-2 text-center">AĞUSTOS</th>
                      <th className="p-2 text-center">EYLÜL</th>
                      <th className="p-2 text-center">EKİM</th>
                      <th className="p-2 text-center">KASIM</th>
                      <th className="p-2 text-center">ARALIK</th>
                      <th className="p-2 text-center">OCAK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {(selectedProject.isZamanCizelgesi || []).map((row, idx) => (
                      <tr key={idx} className="bg-slate-800/40">
                        <td className="p-2.5 font-medium text-slate-200">{row.isAdi}</td>
                        <td className="p-2 text-center font-bold text-rose-400">{row.nisan ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-rose-400">{row.mayis ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-rose-400">{row.haziran ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-rose-400">{row.temmuz ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-rose-400">{row.agustos ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-rose-400">{row.eylul ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-rose-400">{row.ekim ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-rose-400">{row.kasim ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-rose-400">{row.aralik ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-rose-400">{row.ocak ? '✓' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kaynaklar */}
            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                9. Kaynaklar (APA Formatında):
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.kaynaklar}
                  onChange={(e) => setSelectedProject({ ...selectedProject, kaynaklar: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white whitespace-pre-line"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed whitespace-pre-line">
                  {selectedProject.kaynaklar}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 4: REFERENCE DOCUMENTS & TEMPLATE MANAGEMENT                  */}
      {/* ===================================================================== */}
      {activeSubTab === 'documents' && (
        <ReferenceDocsManager
          module="teknofest"
          docs={referenceDocs}
          onUpdateDocs={handleUpdateReferenceDocs}
        />
      )}
    </div>
  );
};
