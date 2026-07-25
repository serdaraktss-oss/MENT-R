import React, { useState } from 'react';
import { TubitakProject, ReferenceDocument } from '../types';
import { INITIAL_TUBITAK_PROJECTS } from '../data/projectsData';
import { exportTubitakDOCX, exportTubitakPDF } from '../utils/projectExporters';
import { ReferenceDocsManager } from './ReferenceDocsManager';
import {
  FileText,
  Sparkles,
  Download,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  BookOpen,
  Award,
  Layers,
  Search,
  Clock,
  Save,
  AlertCircle,
  Loader2,
  FolderOpen,
  FileCheck,
} from 'lucide-react';

export const TubitakView: React.FC = () => {
  const [projects, setProjects] = useState<TubitakProject[]>(INITIAL_TUBITAK_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<TubitakProject | null>(INITIAL_TUBITAK_PROJECTS[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create' | 'detail' | 'documents'>('list');

  // Referans Belgeler & Şablonlar State
  const [referenceDocs, setReferenceDocs] = useState<ReferenceDocument[]>(() => {
    const saved = localStorage.getItem('tubitak_reference_docs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse tubitak_reference_docs', e);
      }
    }
    return [
      {
        id: 'default-tubitak-1',
        module: 'tubitak',
        name: 'TÜBİTAK 2204 Resmi Proje Rapor Şablonu & Yazım Kuralları',
        category: 'Yazım Kuralları',
        content: 'TÜBİTAK 2204 LİSE VE ORTAOKUL ARAŞTIRMA PROJELERİ YAZIM VE PUANLAMA KURALLARI:\n1. Rapor Sayfa Düzeni: Times New Roman 12 punto, 1.5 satır aralığı, kenar boşlukları 2.5 cm olmalıdır.\n2. Özet Bölümü: Tam olarak 150-250 kelime arasında olmalı; amaç, yöntem, bulgular ve sonuç tek bir paragrafta açıklanmalıdır.\n3. Özgünlük ve İnovasyon: Projede sunulan problemin literatürdeki karşılığı APA 7 formatında en az 5 kaynakla desteklenmelidir.\n4. Metodoloji ve İş-Zaman Çizelgesi: Araştırma adımları kronolojik olarak iş-zaman tablosuna dökülmeli, deney ve gözlem protokolleri detaylandırılmalıdır.',
        size: 920,
        uploadedAt: new Date().toLocaleDateString('tr-TR'),
        active: true,
      },
    ];
  });

  const handleUpdateReferenceDocs = (docs: ReferenceDocument[]) => {
    setReferenceDocs(docs);
    localStorage.setItem('tubitak_reference_docs', JSON.stringify(docs));
  };


  // AI Generator Form State - 8 Proje Taslağı Sekmesi
  const [draftTab, setDraftTab] = useState<'kategori' | 'takim' | 'proje' | 'uyeler' | 'sorun' | 'ihtiyac' | 'yontem' | 'hedef'>('kategori');
  const [mainArea, setMainArea] = useState('Bilgisayar ve Yazılım');
  const [thematicArea, setThematicArea] = useState('Yapay Zeka ve Veri Analitiği');
  const [takimAdi, setTakimAdi] = useState('Gelecek İnovasyon Takımı');
  const [projeAdi, setProjeAdi] = useState('Lise Öğrencilerinin Sınav Kaygısının Derin Öğrenme ve PPG Sinyal Analizi ile Tespiti');
  const [takimUyeleri, setTakimUyeleri] = useState('Caner Yıldız, Elif Şahin');
  const [cozumUrettigiSorun, setCozumUrettigiSorun] = useState('Sınav anındaki yüksek kaygının akademik performansı ve netleri olumsuz etkilemesi, anlık biyometrik takibin yetersizliği.');
  const [cozumUrettigiIhtiyacFikri, setCozumUrettigiIhtiyacFikri] = useState('Görüntü işleme ile yüz mimiklerinden kaygı tespiti ve PPG sensör verileriyle otonom kişiselleştirilmiş nefes egzersizi yönlendirmesi.');
  const [kullanilacakTeknikYontem, setKullanilacakTeknikYontem] = useState('Python, PyTorch CNN derin öğrenme kütüphanesi, PPG biyometrik sensör kartı, Raspberry Pi 4 B entegrasyonu.');
  const [hedefKitle, setHedefKitle] = useState('YKS ve LGS sınavına hazırlanan lise ve ortaokul öğrencileri, rehber öğretmenler ve sınav koçları.');

  const [studentName, setStudentName] = useState('Caner Yıldız & Elif Şahin');
  const [topicIdea, setTopicIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mainAreaOptions = [
    'Bilgisayar ve Yazılım',
    'Biyoloji',
    'Fizik',
    'Kimya',
    'Matematik',
    'Sosyoloji',
    'Psikoloji',
    'Tarih',
    'Türk Dili ve Edebiyatı',
    'Coğrafya',
    'Değerler Eğitimi',
    'Teknolojik Tasarım',
  ];

  const thematicAreaOptions = [
    'Yapay Zeka ve Veri Analitiği',
    'Sürdürülebilirlik ve Yeşil Dönüşüm',
    'Biyotıp ve Sağlık Teknolojileri',
    'Siber Güvenlik ve Ağ Teknolojileri',
    'Dijital Dönüşüm ve Akıllı Şehirler',
    'Robotik ve Kodlama',
    'Yenilenebilir Enerji Sistemleri',
    'Afet Yönetimi ve Güvenlik',
    'Eğitimde Yenilikçi Yaklaşımlar',
  ];

  const handleGenerateProject = async () => {
    setIsGenerating(true);
    setErrorMsg('');

    try {
      const activeDocs = referenceDocs.filter((d) => d.active);
      const response = await fetch('/api/generate-tubitak-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainArea,
          thematicArea,
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
        const newProj: TubitakProject = {
          ...data.project,
          id: `tubitak-${Date.now()}`,
          projeAnaAlani: mainArea,
          projeTematikAlani: thematicArea,
          projeAdi: projeAdi || data.project.projeAdi,
          takimAdi,
          takimUyeleri,
          cozumUrettigiSorun,
          cozumUrettigiIhtiyacFikri,
          kullanilacakTeknikYontem,
          hedefKitle,
          studentName: takimUyeleri || 'Öğrenci Proje Ekibi',
          createdAt: new Date().toLocaleDateString('tr-TR'),
        };

        setProjects([newProj, ...projects]);
        setSelectedProject(newProj);
        setActiveSubTab('detail');
      } else {
        setErrorMsg('AI Proje üretilemedi. Lütfen bağlantınızı kontrol ediniz.');
      }
    } catch (e: any) {
      console.error('TÜBİTAK generation error:', e);
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
    if (confirm('Bu TÜBİTAK projesini silmek istediğinize emin misiniz?')) {
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
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> TÜBİTAK 2204
              </span>
              <span className="text-xs text-slate-400">Lise & Ortaokul Araştırma Projeleri Hazırlık Modülü</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              TÜBİTAK Proje Oluşturucu & Rapor Düzenleyici
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              TÜBİTAK 2204 resmi proje rapor taslağına birebir uyumlu, %100 özgün, akademik dili yüksek, intihal içermeyen araştırma projeleri oluşturun. Word (.docx) ve PDF formatlarında doğrudan indirin.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveSubTab('create')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
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
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kayıtlı TÜBİTAK Projeleri ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'create'
                ? 'bg-blue-600 text-white shadow-md'
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
                ? 'bg-blue-600 text-white shadow-md'
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
                  ? 'bg-blue-600 text-white shadow-md'
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
      {/* SUB-TAB 1: CREATE NEW AI PROJECT WITH 8 DRAFT TABS                    */}
      {/* ===================================================================== */}
      {activeSubTab === 'create' && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-md space-y-6">
          <div className="border-b border-slate-700/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                TÜBİTAK 2204 Özgün Proje Taslak Oluşturucu
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Aşağıdaki 8 taslak sekmesini doldurarak resmi TÜBİTAK 2204 şablon yapısına %100 uygun, akademik dili yüksek özgün proje raporu oluşturun.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-xs font-bold shrink-0 self-start md:self-auto">
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
                    ? 'bg-indigo-600 text-white shadow-md border border-indigo-400/50'
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
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <span>🏆 Sekme 1: Yarışma Kategorisi & Alan Seçimi</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Proje Ana Alanı:
                    </label>
                    <select
                      value={mainArea}
                      onChange={(e) => setMainArea(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      {mainAreaOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Proje Tematik Alanı:
                    </label>
                    <select
                      value={thematicArea}
                      onChange={(e) => setThematicArea(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      {thematicAreaOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {draftTab === 'takim' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <span>🛡️ Sekme 2: Takım Adı</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Proje Takımı Adı:
                  </label>
                  <input
                    type="text"
                    value={takimAdi}
                    onChange={(e) => setTakimAdi(e.target.value)}
                    placeholder="Örn: Gelecek İnovasyon Takımı / Siber Gençlik"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Yarışma başvurularında yer alacak resmi takım unvanı.
                  </p>
                </div>
              </div>
            )}

            {draftTab === 'proje' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <span>💡 Sekme 3: Proje Adı</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Proje Başlığı (Max 15 Kelime Akademik Başlık):
                  </label>
                  <textarea
                    value={projeAdi}
                    onChange={(e) => setProjeAdi(e.target.value)}
                    rows={2}
                    placeholder="Örn: Lise Öğrencilerinin Sınav Kaygısının Derin Öğrenme ve PPG Sinyal Analizi ile Tespiti"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>
            )}

            {draftTab === 'uyeler' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <span>👥 Sekme 4: Takım Üyeleri</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Takım Üyeleri Öğrenci Adları & Sorumlulukları:
                  </label>
                  <input
                    type="text"
                    value={takimUyeleri}
                    onChange={(e) => setTakimUyeleri(e.target.value)}
                    placeholder="Örn: Caner Yıldız (12-A), Elif Şahin (12-B)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Projeyi hazırlayan ve sunacak öğrencilerin tam adları.
                  </p>
                </div>
              </div>
            )}

            {draftTab === 'sorun' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <span>⚠️ Sekme 5: Çözüm Ürettiği Sorun</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Projenin Çözmeyi Hedeflediği Problem (Problem Statement):
                  </label>
                  <textarea
                    value={cozumUrettigiSorun}
                    onChange={(e) => setCozumUrettigiSorun(e.target.value)}
                    rows={3}
                    placeholder="Mevcut durumda yaşanan aksaklık, toplumsal veya akademik problem..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {draftTab === 'ihtiyac' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <span>🚀 Sekme 6: Çözüm Ürettiği İhtiyaç / Çözüm Fikri</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Geliştirilen Yenilikçi Çözüm Fikri ve İhtiyaç Analizi:
                  </label>
                  <textarea
                    value={cozumUrettigiIhtiyacFikri}
                    onChange={(e) => setCozumUrettigiIhtiyacFikri(e.target.value)}
                    rows={3}
                    placeholder="Projenin ortaya koyduğu yenilikçi yaklaşım, özgün çözüm ve Ar-Ge değeri..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {draftTab === 'yontem' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <span>🛠️ Sekme 7: Kullanılacak Teknik / Yöntem</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Yöntem, Metodoloji, Donanım ve Yazılım Teknikleri:
                  </label>
                  <textarea
                    value={kullanilacakTeknikYontem}
                    onChange={(e) => setKullanilacakTeknikYontem(e.target.value)}
                    rows={3}
                    placeholder="Kullanılacak kodlama dilleri, sensörler, anketler, veri analiz yöntemleri..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {draftTab === 'hedef' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <span>🎯 Sekme 8: Hedef Kitle</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Proje Çıktılarından Faydalanacak Hedef Kitle ve Kullanıcı Grubu:
                  </label>
                  <textarea
                    value={hedefKitle}
                    onChange={(e) => setHedefKitle(e.target.value)}
                    rows={3}
                    placeholder="Son kullanıcılar, kurumlar, öğrenciler, hastalar, arama kurtarma ekipleri..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                <span className="text-indigo-300 font-bold block">1. Kategori:</span>
                <span className="text-slate-200 truncate block">{mainArea} / {thematicArea}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-indigo-300 font-bold block">2. Takım Adı:</span>
                <span className="text-slate-200 truncate block">{takimAdi || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-indigo-300 font-bold block">3. Proje Adı:</span>
                <span className="text-slate-200 truncate block">{projeAdi || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-indigo-300 font-bold block">4. Üyeler:</span>
                <span className="text-slate-200 truncate block">{takimUyeleri || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-indigo-300 font-bold block">5. Sorun:</span>
                <span className="text-slate-200 truncate block">{cozumUrettigiSorun || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-indigo-300 font-bold block">6. İhtiyaç / Çözüm:</span>
                <span className="text-slate-200 truncate block">{cozumUrettigiIhtiyacFikri || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-indigo-300 font-bold block">7. Teknik / Yöntem:</span>
                <span className="text-slate-200 truncate block">{kullanilacakTeknikYontem || '-'}</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <span className="text-indigo-300 font-bold block">8. Hedef Kitle:</span>
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
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Özgün TÜBİTAK Raporu Üretiliyor (%100 İntihalsiz)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>TÜBİTAK 2204 Özgün Proje Raporu Üret</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 2: LIST OF PROJECTS                                           */}
      {/* ===================================================================== */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 hover:border-blue-500/50 transition space-y-4 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold">
                      {proj.projeAnaAlani}
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
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Raporu İncele</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => exportTubitakDOCX(proj)}
                      className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="Word (.docx) İndir"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>DOCX</span>
                    </button>

                    <button
                      onClick={() => exportTubitakPDF(proj)}
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
      {/* SUB-TAB 3: DETAILED REPORT VIEW AND EDITOR                             */}
      {/* ===================================================================== */}
      {activeSubTab === 'detail' && selectedProject && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-lg space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
            <div>
              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                {selectedProject.projeAnaAlani} — {selectedProject.projeTematikAlani}
              </span>
              <h2 className="text-lg font-black text-white mt-1">
                TÜBİTAK 2204 Proje Rapor Detayı
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
                onClick={() => exportTubitakDOCX(selectedProject)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Word (.docx) İndir</span>
              </button>

              <button
                onClick={() => exportTubitakPDF(selectedProject)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>PDF İndir</span>
              </button>
            </div>
          </div>

          {/* Form / Content View */}
          <div className="space-y-6 text-slate-200">
            {/* Header Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-700/60">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Proje Ana Alanı:</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={selectedProject.projeAnaAlani}
                    onChange={(e) => setSelectedProject({ ...selectedProject, projeAnaAlani: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                  />
                ) : (
                  <p className="text-sm font-bold text-white">{selectedProject.projeAnaAlani}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Proje Tematik Alanı:</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={selectedProject.projeTematikAlani}
                    onChange={(e) => setSelectedProject({ ...selectedProject, projeTematikAlani: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                  />
                ) : (
                  <p className="text-sm font-bold text-white">{selectedProject.projeTematikAlani}</p>
                )}
              </div>
            </div>

            {/* Proje Adı */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                Proje Adı (Başlığı) — (Max 15 Kelime):
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

            {/* Özet */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                Özet (150-250 Kelime):
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

            {/* Amaç */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                Amaç (Ar-Ge & Somut Hedefler):
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.amac}
                  onChange={(e) => setSelectedProject({ ...selectedProject, amac: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.amac}
                </p>
              )}
            </div>

            {/* Giriş */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                Giriş (Literatür Taraması & Bilimsel Yayınlar):
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.giris}
                  onChange={(e) => setSelectedProject({ ...selectedProject, giris: e.target.value })}
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.giris}
                </p>
              )}
            </div>

            {/* Yöntem */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                Yöntem (Veri Toplama, Deney Düzeneği & Analiz):
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.yontem}
                  onChange={(e) => setSelectedProject({ ...selectedProject, yontem: e.target.value })}
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.yontem}
                </p>
              )}
            </div>

            {/* Proje İş-Zaman Çizelgesi */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                Proje İş-Zaman Çizelgesi Tablosu:
              </label>
              <div className="overflow-x-auto rounded-xl border border-slate-700/80">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 border-b border-slate-700 font-bold uppercase text-[10px]">
                      <th className="p-2.5">İşin Adı / Süreç</th>
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
                        <td className="p-2 text-center font-bold text-blue-400">{row.nisan ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-blue-400">{row.mayis ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-blue-400">{row.haziran ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-blue-400">{row.temmuz ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-blue-400">{row.agustos ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-blue-400">{row.eylul ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-blue-400">{row.ekim ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-blue-400">{row.kasim ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-blue-400">{row.aralik ? '✓' : ''}</td>
                        <td className="p-2 text-center font-bold text-blue-400">{row.ocak ? '✓' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bulgular */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                Bulgular (Veriler ve İstatistiksel Analiz):
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.bulgular}
                  onChange={(e) => setSelectedProject({ ...selectedProject, bulgular: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.bulgular}
                </p>
              )}
            </div>

            {/* Sonuç ve Tartışma */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                Sonuç ve Tartışma:
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.sonucVeTartisma}
                  onChange={(e) => setSelectedProject({ ...selectedProject, sonucVeTartisma: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.sonucVeTartisma}
                </p>
              )}
            </div>

            {/* Öneriler */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                Öneriler:
              </label>
              {isEditing ? (
                <textarea
                  value={selectedProject.oneriler}
                  onChange={(e) => setSelectedProject({ ...selectedProject, oneriler: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              ) : (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed text-justify">
                  {selectedProject.oneriler}
                </p>
              )}
            </div>

            {/* Kaynaklar */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                Kaynaklar (APA Yazım Kuralları):
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
          module="tubitak"
          docs={referenceDocs}
          onUpdateDocs={handleUpdateReferenceDocs}
        />
      )}
    </div>
  );
};
