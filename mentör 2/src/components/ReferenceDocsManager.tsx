import React, { useState, useEffect } from 'react';
import { ReferenceDocument } from '../types';
import {
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Eye,
  Plus,
  BookOpen,
  FileCheck,
  AlertCircle,
  Sparkles,
  Info,
  X,
  Edit3,
  HelpCircle,
} from 'lucide-react';

interface ReferenceDocsManagerProps {
  module: 'tubitak' | 'teknofest';
  docs: ReferenceDocument[];
  onUpdateDocs: (docs: ReferenceDocument[]) => void;
}

export const ReferenceDocsManager: React.FC<ReferenceDocsManagerProps> = ({
  module,
  docs,
  onUpdateDocs,
}) => {
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<ReferenceDocument['category']>('Şablon');
  const [docContent, setDocContent] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ReferenceDocument | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);

  const themeColor = module === 'tubitak' ? 'indigo' : 'rose';

  // Preset built-in official templates for quick loading
  const handleLoadOfficialPreset = () => {
    let presetDoc: ReferenceDocument;
    if (module === 'tubitak') {
      presetDoc = {
        id: `preset-tubitak-${Date.now()}`,
        module: 'tubitak',
        name: 'TÜBİTAK 2204-A/B Resmi Proje Rapor Şablonu & Yazım Kuralları',
        category: 'Yazım Kuralları',
        content: `TÜBİTAK 2204 LİSE VE ORTAOKUL ARAŞTIRMA PROJELERİ YAZIM VE PUANLAMA KURALLARI:
1. Rapor Sayfa Düzeni: Times New Roman 12 punto, 1.5 satır aralığı, kenar boşlukları 2.5 cm olmalıdır.
2. Özet Bölümü: Tam olarak 150-250 kelime arasında olmalı; amaç, yöntem, bulgular ve sonuç tek bir paragrafta açıklanmalıdır.
3. Özgünlük ve İnovasyon: Projede sunulan problemin literatürdeki karşılığı APA 7 formatında en az 5 kaynakla desteklenmelidir.
4. Metodoloji ve İş-Zaman Çizelgesi: Araştırma adımları kronolojik olarak iş-zaman tablosuna dökülmeli, deney ve gözlem protokolleri detaylandırılmalıdır.
5. Bulgular ve Tartışma: Elde edilen nicel veriler grafiklerle ifade edilmeli, istatistiksel analizler sunulmalıdır.`,
        size: 850,
        uploadedAt: new Date().toLocaleDateString('tr-TR'),
        active: true,
      };
    } else {
      presetDoc = {
        id: `preset-teknofest-${Date.now()}`,
        module: 'teknofest',
        name: 'TEKNOFEST Detay Rapor Formatı & Puanlama Kriterleri',
        category: 'Şablon',
        content: `TEKNOFEST TEKNİK DETAY RAPORU VE PUANLAMA FORMATI:
1. Proje Özeti ve Problem Tanımı: Çözülmek istenen sorun net, ölçülebilir ve toplumsal/sanayi ihtiyacına dönük olmalıdır.
2. Yerlilik ve Özgünlük (%25 Ağırlık): Projenin muadillerinden üstün yönleri, yerli imkanlarla üretilebilirlik potansiyeli ve patent/faydalı model değeri açıklanmalıdır.
3. Yöntem ve Sistem Mimarisi (%35 Ağırlık): Kullanılacak mikrodenetleyiciler, algoritmalar, donanım kartları ve yazılım akış şeması blok diyagramlarla desteklenmelidir.
4. Risk Analizi ve Yerli Tedarik (%20 Ağırlık): Karşılaşılabilecek teknik riskler (sensör arızası, güç tüketimi, haberleşme kopması) ve alternatif yerli çözümler listelenmelidir.
5. Yaygın Etki ve Sürdürülebilirlik (%20 Ağırlık): Proje çıktılarının ticari potansiyeli ve hedef kitleye sunduğu erişilebilirlik.`,
        size: 920,
        uploadedAt: new Date().toLocaleDateString('tr-TR'),
        active: true,
      };
    }

    const updated = [presetDoc, ...docs];
    onUpdateDocs(updated);
    setUploadStatusMsg(`"${presetDoc.name}" başarıyla eklendi ve AI üretimine dahil edildi.`);
    setTimeout(() => setUploadStatusMsg(null), 4000);
  };

  // Handle file drop or file select
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const textContent = event.target?.result as string || '';
        const newDoc: ReferenceDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          module,
          name: file.name,
          category: file.name.toLowerCase().includes('kur') ? 'Yazım Kuralları' : file.name.toLowerCase().includes('ornek') ? 'Örnek Proje' : 'Şablon',
          content: textContent.length > 0 ? textContent : `[Dosya Yüklendi: ${file.name}]\nİçerik AI promptuna referans metin olarak eklendi.`,
          size: file.size,
          uploadedAt: new Date().toLocaleDateString('tr-TR'),
          active: true,
        };

        const updated = [newDoc, ...docs];
        onUpdateDocs(updated);
        setUploadStatusMsg(`"${file.name}" belgesi başarıyla yüklendi.`);
        setTimeout(() => setUploadStatusMsg(null), 4000);
      };

      reader.onerror = () => {
        alert('Dosya okunurken bir hata oluştu.');
      };

      // Read text content
      reader.readAsText(file);
    });

    // Reset input
    e.target.value = '';
  };

  // Toggle doc active status
  const handleToggleActive = (id: string) => {
    const updated = docs.map((d) => (d.id === id ? { ...d, active: !d.active } : d));
    onUpdateDocs(updated);
  };

  // Delete document
  const handleDeleteDoc = (id: string) => {
    const updated = docs.filter((d) => d.id !== id);
    onUpdateDocs(updated);
  };

  // Manual Add or Edit Document
  const handleSaveManualDoc = () => {
    if (!docName.trim() || !docContent.trim()) {
      alert('Lütfen belge adını ve metin içeriğini doldurun.');
      return;
    }

    if (editingDocId) {
      const updated = docs.map((d) =>
        d.id === editingDocId
          ? {
              ...d,
              name: docName,
              category: docCategory,
              content: docContent,
              size: new Blob([docContent]).size,
            }
          : d
      );
      onUpdateDocs(updated);
    } else {
      const newDoc: ReferenceDocument = {
        id: `doc-manual-${Date.now()}`,
        module,
        name: docName,
        category: docCategory,
        content: docContent,
        size: new Blob([docContent]).size,
        uploadedAt: new Date().toLocaleDateString('tr-TR'),
        active: true,
      };
      onUpdateDocs([newDoc, ...docs]);
    }

    setIsManualModalOpen(false);
    setDocName('');
    setDocContent('');
    setEditingDocId(null);
  };

  const handleOpenEdit = (doc: ReferenceDocument) => {
    setEditingDocId(doc.id);
    setDocName(doc.name);
    setDocCategory(doc.category);
    setDocContent(doc.content);
    setIsManualModalOpen(true);
  };

  const activeCount = docs.filter((d) => d.active).length;

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <BookOpen className={`w-5 h-5 ${module === 'tubitak' ? 'text-indigo-400' : 'text-rose-400'}`} />
            {module === 'tubitak' ? 'TÜBİTAK 2204' : 'TEKNOFEST'} Referans Belgeler, Şablonlar & Kurallar Deposu
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Yükleyeceğiniz resmi şartnameler, kılavuzlar, yazım kuralları ve örnek derece projeleri; yeni proje oluştururken yapay zeka tarafından doğrudan örnek ve kural alınır.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadOfficialPreset}
            className={`px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-600`}
            title="Resmi Şablon Metnini Otomatik Yükle"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Resmi Şablon Yükle</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingDocId(null);
              setDocName('');
              setDocContent('');
              setIsManualModalOpen(true);
            }}
            className={`px-3.5 py-2 ${
              module === 'tubitak' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-rose-600 hover:bg-rose-500'
            } text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Metin / Kural Ekle</span>
          </button>
        </div>
      </div>

      {uploadStatusMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{uploadStatusMsg}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/50 rounded-2xl p-6 text-center transition relative cursor-pointer group">
        <input
          type="file"
          multiple
          accept=".txt,.pdf,.docx,.doc,.json,.md,.csv"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <div className={`p-3 rounded-full ${module === 'tubitak' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'} group-hover:scale-110 transition`}>
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">
              Şablon, Yazım Kılavuzu veya Örnek Proje Dosyası Yükleyin
            </p>

            <p className="text-[11px] text-slate-400 mt-0.5">
              Tıklayın veya dosyalarınızı buraya sürükleyin (.txt, .pdf, .docx, .json, .md)
            </p>
          </div>
          <span className="text-[10px] text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            Yüklenen her belge yeni proje üretilirken yapay zeka rehber sistemine otomatik dahil edilir.
          </span>
        </div>
      </div>

      {/* Document List Header & Active Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Yüklenen Belgeler ({docs.length})
          </span>
        </div>

        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
          activeCount > 0
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
        }`}>
          {activeCount > 0 ? `⚡ ${activeCount} Belge AI Üretimine Aktif Dahil` : '⚠️ Hiçbir Belge Aktif Değil'}
        </span>
      </div>

      {/* Document List */}
      {docs.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-8 text-center space-y-2">
          <Info className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-300 font-bold">Henüz yüklenmiş bir referans belge bulunmuyor.</p>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Yukarıdaki alandan dosya yükleyebilir veya "Resmi Şablon Yükle" butonuna basarak varsayılan TÜBİTAK/TEKNOFEST rapor standartlarını anında ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className={`bg-slate-900/90 border rounded-xl p-4 transition flex flex-col justify-between space-y-3 ${
                doc.active
                  ? module === 'tubitak'
                    ? 'border-indigo-500/50 shadow-md shadow-indigo-950/30'
                    : 'border-rose-500/50 shadow-md shadow-rose-950/30'
                  : 'border-slate-700/80 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${doc.active ? (module === 'tubitak' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-rose-500/20 text-rose-300') : 'bg-slate-800 text-slate-400'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate" title={doc.name}>
                      {doc.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md">
                        {doc.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {Math.round(doc.size / 1024 * 10) / 10} KB • {doc.uploadedAt}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(doc.id)}
                  className={`p-1 rounded-lg transition cursor-pointer shrink-0 ${
                    doc.active ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'
                  }`}
                  title={doc.active ? 'AI Üretiminde Aktif (Devre dışı bırakmak için tıklayın)' : 'AI Üretiminde Pasif (Aktif etmek için tıklayın)'}
                >
                  {doc.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>

              {/* Snippet preview */}
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono line-clamp-2 leading-relaxed">
                {doc.content}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className={`text-[10px] font-bold ${doc.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {doc.active ? '✓ AI Üretimine Dahil Edildi' : '○ Devre Dışı'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="İçeriği İncele"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(doc)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Düzenle"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-1.5 hover:bg-rose-500/20 rounded-lg text-rose-400 hover:text-rose-300 transition cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MANUAL / EDIT MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              {editingDocId ? 'Referans Belgeyi Düzenle' : 'Yeni Referans Belge / Şablon Metni Ekle'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Belge / Şablon Adı:</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Örn: 2026 TÜBİTAK Lise Biyoloji Rapor Standartları"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Kategori:</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Şablon">Şablon</option>
                  <option value="Yazım Kuralları">Yazım Kuralları</option>
                  <option value="Örnek Proje">Örnek Proje</option>
                  <option value="Puanlama Kriteri">Puanlama Kriteri</option>
                  <option value="Diğer Rehber">Diğer Rehber</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Belge Metni / Kurallar / Örnek Proje İçeriği:
                </label>
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  rows={8}
                  placeholder="Buraya AI tarafınca rehber alınacak şartname maddelerini, yazım kurallarını veya örnek proje metnini yapıştırabilirsiniz..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveManualDoc}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md"
              >
                Kaydet & AI Rehberine Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 relative max-h-[85vh] flex flex-col">
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30 inline-block mb-1">
                {previewDoc.category}
              </span>
              <h3 className="text-base font-bold text-white">{previewDoc.name}</h3>
              <p className="text-[11px] text-slate-400">
                Yüklenme Tarihi: {previewDoc.uploadedAt} • Boyut: {Math.round(previewDoc.size / 1024 * 10) / 10} KB
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap flex-1">
              {previewDoc.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <span className={`text-xs font-bold ${previewDoc.active ? 'text-emerald-400' : 'text-slate-400'}`}>
                {previewDoc.active ? '✓ AI Üretiminde Aktif Dahil Ediliyor' : '○ Pasif Durumda'}
              </span>

              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
