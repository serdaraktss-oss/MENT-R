import React, { useState } from 'react';
import { AnnualPlanDocument } from '../types';
import { FolderUp, FileText, UploadCloud, CheckCircle, Trash2, Plus, BookOpen, Layers, Sparkles, ShieldCheck } from 'lucide-react';

interface AnnualPlansViewProps {
  annualPlans: AnnualPlanDocument[];
  onAddPlan: (plan: AnnualPlanDocument) => void;
  onDeletePlan: (id: string) => void;
}

export const AnnualPlansView: React.FC<AnnualPlansViewProps> = ({
  annualPlans,
  onAddPlan,
  onDeletePlan,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('TÜMÜ');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [subject, setSubject] = useState('Matematik');
  const [branch, setBranch] = useState<'Sayısal' | 'Eşit Ağırlık' | 'Sözel' | 'Dil' | 'Ortak / Tüm Branşlar'>('Sayısal');
  const [fileName, setFileName] = useState('');
  const [topicsText, setTopicsText] = useState('');
  const [notes, setNotes] = useState('');

  const subjectsList = [
    'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji',
    'Türkçe & Paragraf', 'Türk Dili ve Edebiyatı', 'Tarih', 'Coğrafya',
    'Felsefe & Din Kültürü', 'İngilizce / YDT'
  ];

  const handleFileUploadSimulated = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) {
      alert('Lütfen bir yıllık plan belgesi seçiniz (PDF/DOCX/XLSX).');
      return;
    }

    const keyTopicsArr = topicsText
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newPlan: AnnualPlanDocument = {
      id: `plan-${Date.now()}`,
      subject,
      branch,
      fileName,
      fileSize: '1.4 MB',
      uploadDate: new Date().toLocaleDateString('tr-TR'),
      uploadedBy: 'Serdar Aktaş (Yönetici)',
      activeWeeksCount: 36,
      keyTopics: keyTopicsArr.length > 0 ? keyTopicsArr : ['Tüm Yıllık Müfredat Kazanımları'],
      notes: notes || 'Yönetici tarafından yüklenmiş resmi branş planı.',
    };

    onAddPlan(newPlan);
    setIsModalOpen(false);
    setFileName('');
    setTopicsText('');
    setNotes('');
  };

  const filteredPlans = annualPlans.filter((p) => {
    if (selectedBranch === 'TÜMÜ') return true;
    return p.branch === selectedBranch || p.branch === 'Ortak / Tüm Branşlar';
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-indigo-950/40 to-slate-800 border border-slate-700/80 rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> SERDAR AKTAŞ YÖNETİCİ PANELİ
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-md">
              MÜFREDAT ARŞİVİ
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-2">
            Branş Yıllık Planlar Belgeleri
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Her branş için yükleyeceğiniz yıllık müfredat planları, yapay zeka tarafından taranarak haftalık çalışma programlarının hangi sırada ve tarihlerde uygulanacağını doğrudan yönlendirir.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Yıllık Plan Yükle</span>
        </button>
      </div>

      {/* AI Integration Highlight Note */}
      <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-200 leading-relaxed">
          <strong className="text-indigo-300 block mb-0.5">Yapay Zeka (Mentör AI) Entegrasyonu:</strong>
          Sisteme eklediğiniz her yıllık plan belgesi, öğrencilerin haftalık program hazırlanırken MEB / YKS müfredat sırasıyla tam uyumlu hareket etmesini sağlar.
        </div>
      </div>

      {/* Branch Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['TÜMÜ', 'Sayısal', 'Eşit Ağırlık', 'Sözel', 'Dil', 'Ortak / Tüm Branşlar'].map((b) => (
          <button
            key={b}
            onClick={() => setSelectedBranch(b)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              selectedBranch === b
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center">
            <FolderUp className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-sm">Seçilen branşa ait henüz yıllık plan yüklenmedi.</p>
            <p className="text-slate-500 text-xs mt-1">Yönetici olarak üstteki "Yeni Yıllık Plan Yükle" butonundan belge ekleyebilirsiniz.</p>
          </div>
        ) : (
          filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-slate-800/90 border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">
                        {plan.subject}
                      </h3>
                      <p className="text-[11px] text-indigo-400 font-medium">
                        {plan.branch}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeletePlan(plan.id)}
                    title="Planı Sil"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono mb-1">
                    <span className="truncate max-w-[200px] text-slate-200 font-sans font-semibold">{plan.fileName}</span>
                    <span className="text-[10px] text-slate-400">{plan.fileSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Yüklenme: {plan.uploadDate}</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Aktif
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-indigo-400" /> Öncelikli Müfredat Konuları ({plan.keyTopics.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {plan.keyTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 bg-slate-900 border border-slate-700/80 text-slate-300 rounded-md"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate">Yükleyen: <strong className="text-slate-300">{plan.uploadedBy}</strong></span>
                <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold">36 Hafta</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Yıllık Plan Belgesi Yükle</h3>
                  <p className="text-xs text-slate-400">Yönetici Serdar Aktaş YKS Müfredat Girişi</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ders / Branş
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    {subjectsList.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hedef Alan
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Sayısal">Sayısal</option>
                    <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                    <option value="Sözel">Sözel</option>
                    <option value="Dil">Dil</option>
                    <option value="Ortak / Tüm Branşlar">Ortak / Tüm Branşlar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Yıllık Plan Belgesi Dosyası (PDF / Docx / Excel)
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 text-center bg-slate-900/50 transition">
                  <input
                    type="file"
                    accept=".pdf,.docx,.xlsx,.doc"
                    onChange={handleFileUploadSimulated}
                    className="hidden"
                    id="annual-plan-file-input"
                  />
                  <label htmlFor="annual-plan-file-input" className="cursor-pointer block">
                    <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                    {fileName ? (
                      <p className="text-sm font-bold text-emerald-400 font-mono">{fileName}</p>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-200">Dosya seçmek için tıklayın veya sürükleyin</p>
                        <p className="text-[11px] text-slate-500 mt-1">PDF, Word veya Excel yıllık müfredat dosyası</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Yıllık Plan Konu / Kazanım Başlıkları (Her satıra bir konu)
                </label>
                <textarea
                  rows={3}
                  value={topicsText}
                  onChange={(e) => setTopicsText(e.target.value)}
                  placeholder="Örn:&#10;Trigonometri & Limit&#10;Türev ve Uygulamaları&#10;İntegral Hesabı"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-600 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Sisteme Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
