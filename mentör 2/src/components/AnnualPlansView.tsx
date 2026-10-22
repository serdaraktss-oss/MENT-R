import React, { useState } from 'react';
import { AnnualPlanDocument } from '../types';
import { FolderUp, FileText, UploadCloud, CheckCircle, Trash2, Plus, BookOpen, Sparkles, ShieldCheck, GraduationCap, Filter } from 'lucide-react';

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
  // Sınıf Seviyesi Sekmeleri Filter State: Hepsi, 9. Sınıf, 10. Sınıf, 11. Sınıf, 12. Sınıf
  const [selectedGrade, setSelectedGrade] = useState<string>('Hepsi');
  const [selectedBranch, setSelectedBranch] = useState<string>('TÜMÜ');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [subject, setSubject] = useState('Matematik');
  const [gradeLevel, setGradeLevel] = useState<string>('12. Sınıf');
  const branch: 'Ortak / Tüm Branşlar' = 'Ortak / Tüm Branşlar';
  const [fileName, setFileName] = useState('');
  const [topicsText, setTopicsText] = useState('');
  const [notes, setNotes] = useState('');

  const subjectsList = [
    'Matematik',
    'Geometri',
    'Fizik',
    'Kimya',
    'Biyoloji',
    'Türkçe & Paragraf',
    'Türk Dili ve Edebiyatı',
    'Tarih',
    'Coğrafya',
    'Felsefe & Din Kültürü',
    'İngilizce / YDT'
  ];

  const gradeTabs = ['Hepsi', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf'];
  const modalGradeOptions = ['Hepsi', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf'];

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
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newPlan: AnnualPlanDocument = {
      id: `plan-${Date.now()}`,
      subject,
      gradeLevel,
      branch,
      fileName,
      fileSize: '1.4 MB',
      uploadDate: new Date().toLocaleDateString('tr-TR'),
      uploadedBy: 'Serdar Aktaş (Yönetici)',
      activeWeeksCount: 36,
      keyTopics: keyTopicsArr.length > 0 ? keyTopicsArr : ['Tüm Yıllık Müfredat Kazanımları'],
      notes: notes || 'Yönetici tarafından yüklenmiş resmi ders yıllık planı.',
    };

    onAddPlan(newPlan);
    setIsModalOpen(false);
    setFileName('');
    setTopicsText('');
    setNotes('');
  };

  const filteredPlans = annualPlans.filter((p) => {
    // Sınıf Seviyesi Filtresi
    if (selectedGrade !== 'Hepsi' && p.gradeLevel !== selectedGrade) {
      return false;
    }
    // Alan/Branş Filtresi
    if (selectedBranch !== 'TÜMÜ') {
      if (p.branch !== selectedBranch && p.branch !== 'Ortak / Tüm Branşlar') {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> SERDAR AKTAŞ YÖNETİCİ PANELİ
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-md">
              DERS PLANLARI
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-2">
            Yıllık Ders Planları & Müfredat Arşivi
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Sınıf seviyelerine ve ders adlarına göre düzenlenen yıllık müfredat planları. Yüklenen planlar haftalık çalışma programlarının MEB takvimiyle tam uyumlu hazırlanmasını sağlar.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ders Planı Yükle</span>
        </button>
      </div>

      {/* Sınıf Seviyesi Sekmeleri (Ana Filtre) */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-lg space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-xs uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Sınıf Seviyesi Filtrele:</span>
          </div>
          <span className="text-xs text-slate-400">
            Toplam <strong>{filteredPlans.length}</strong> Ders Planı
          </span>
        </div>

        {/* Grade Tabs: Hepsi, 9. Sınıf, 10. Sınıf, 11. Sınıf, 12. Sınıf */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {gradeTabs.map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedGrade === grade
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/80'
              }`}
            >
              <span>{grade}</span>
              {selectedGrade === grade && <CheckCircle className="w-3.5 h-3.5 text-indigo-200" />}
            </button>
          ))}
        </div>

        {/* Sub-filter: Alan / Branş Filtresi */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" /> Alan:
          </span>
          {['TÜMÜ', 'Sayısal', 'Eşit Ağırlık', 'Sözel', 'Dil', 'Ortak / Tüm Branşlar'].map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer whitespace-nowrap ${
                selectedBranch === b
                  ? 'bg-slate-700 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* AI Integration Highlight Note */}
      <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-200 leading-relaxed">
          <strong className="text-indigo-300 block mb-0.5">Yapay Zeka (Mentör AI) Entegrasyonu:</strong>
          Seçili sınıf seviyesi ve ders adı planları, öğrencilerin haftalık ders çalışma programı oluşturulurken MEB müfredat kazanım sıralamasını doğrudan kontrol eder.
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <FolderUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-sm">
              {selectedGrade === 'Hepsi'
                ? 'Sistemde henüz ders planı bulunmuyor.'
                : `${selectedGrade} seviyesine ait ders planı bulunamadı.`}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              "Yeni Ders Planı Yükle" butonuna tıklayarak yeni ders ve sınıf seviyesi planı ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header with Ders Adı and Sınıf Seviyesi */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Sınıf Seviyesi Badge */}
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                          {plan.gradeLevel || '12. Sınıf'}
                        </span>
                        {/* Alan / Branş Badge */}
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold rounded-md">
                          {plan.branch}
                        </span>
                      </div>
                      {/* Ders Adı */}
                      <h3 className="text-base font-bold text-white leading-tight mt-1">
                        {plan.subject}
                      </h3>
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

                {/* File Info Box */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono mb-1">
                    <span className="truncate max-w-[190px] text-slate-200 font-sans font-semibold">
                      {plan.fileName}
                    </span>
                    <span className="text-[10px] text-slate-400">{plan.fileSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Eklendi: {plan.uploadDate}</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Aktif
                    </span>
                  </div>
                </div>

                {/* Key Topics */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-indigo-400" /> Müfredat Konuları ({plan.keyTopics.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {plan.keyTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-md"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate">Yükleyen: <strong className="text-slate-300">{plan.uploadedBy}</strong></span>
                <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold">36 Hafta</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Yeni Ders Planı Yükle</h3>
                  <p className="text-xs text-slate-400">Serdar Aktaş Müfredat Yönetimi</p>
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
              {/* Ders Adı */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Ders Adı</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Müfredat Branşı</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    {subjectsList.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sınıf Seviyesi (Sekmeler: Hepsi, 9. Sınıf, 10. Sınıf, 11. Sınıf, 12. Sınıf) */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Sınıf Seviyesi Sekmeleri</span>
                  <span className="text-[10px] text-emerald-400 font-medium">Seçili: {gradeLevel}</span>
                </label>
                
                {/* Sınıf Seviyesi Tab Buttons */}
                <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                  {modalGradeOptions.map((grade) => (
                    <button
                      type="button"
                      key={grade}
                      onClick={() => setGradeLevel(grade)}
                      className={`py-2 px-1 text-center text-xs font-bold rounded-lg transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        gradeLevel === grade
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <span className="leading-tight">{grade}</span>
                      {gradeLevel === grade && (
                        <span className="w-1 h-1 rounded-full bg-indigo-200" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ders Plan Belgesi (PDF / Word / Excel)
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 text-center bg-slate-950/50 transition">
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
                        <p className="text-[11px] text-slate-500 mt-1">PDF, Word veya Excel ders müfredat belgesi</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Topics / Kazanımlar */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Müfredat Konu / Kazanım Başlıkları (Her satıra bir konu)
                </label>
                <textarea
                  rows={3}
                  value={topicsText}
                  onChange={(e) => setTopicsText(e.target.value)}
                  placeholder="Örn:&#10;Fonksiyonlar ve Grafikler&#10;Polinomlar ve Çarpanlara Ayırma&#10;İkinci Dereceden Denklemler"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Ders Planını Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
