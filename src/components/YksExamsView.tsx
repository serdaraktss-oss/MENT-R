import React, { useState } from 'react';
import { PastYksExamDocument } from '../types';
import { FileSpreadsheet, Upload, Download, Trash2, Plus, Sparkles, CheckCircle2, BookCheck, ShieldCheck, FileText } from 'lucide-react';

interface YksExamsViewProps {
  exams: PastYksExamDocument[];
  onAddExam: (exam: PastYksExamDocument) => void;
  onDeleteExam: (id: string) => void;
}

export const YksExamsView: React.FC<YksExamsViewProps> = ({
  exams,
  onAddExam,
  onDeleteExam,
}) => {
  const [filterType, setFilterType] = useState<'TÜMÜ' | 'TYT' | 'AYT' | 'YDT'>('TÜMÜ');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'YDT'>('TYT');
  const [publisher, setPublisher] = useState('Özdebir Yayınları');
  const [fileName, setFileName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(120);
  const [topicsText, setTopicsText] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !fileName) {
      alert('Lütfen deneme adını ve PDF dosyasını giriniz.');
      return;
    }

    const topicsArr = topicsText
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newExam: PastYksExamDocument = {
      id: `exam-${Date.now()}`,
      examTitle,
      examType,
      publisher,
      uploadDate: new Date().toLocaleDateString('tr-TR'),
      fileName,
      fileSize: '4.8 MB',
      totalQuestions: Number(totalQuestions) || 120,
      testedKazanimlar: topicsArr.length > 0 ? topicsArr : ['Türkçe Paragraf', 'Matematik Problemler', 'Fizik Kuvvet', 'Kimya'],
    };

    onAddExam(newExam);
    setIsModalOpen(false);
    setExamTitle('');
    setFileName('');
    setTopicsText('');
  };

  const filteredExams = exams.filter((ex) => {
    if (filterType === 'TÜMÜ') return true;
    return ex.examType === filterType;
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
              DENEME SINAVI ARŞİVİ
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-2">
            YKS Geçmiş Deneme Sınavları
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Buraya yükleyeceğiniz geçmiş TYT & AYT deneme kitapçıkları ve soru dağılım matrisleri, AI öğrenci analiz sisteminde öğrencilerin zayıf kaldığı spesifik soru tiplerini tespit etmek için kullanılır.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Deneme Sınavı Yükle</span>
        </button>
      </div>

      {/* AI Synchronization Info */}
      <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-200 leading-relaxed">
          <strong className="text-emerald-300 block mb-0.5">Eksik Konu Şekillendirme Algoritması:</strong>
          Yüklenen denemelerdeki soru dağılımları ile öğrencilerin deneme sonuçlarındaki yanlış/boşlar otomatik eşleştirilir. Böylece öğrencinin çalışma programında tam eksik olduğu noktalar (Örn: Parabol, Gazlar, Kuvvet-Açı) öne çıkarılır.
        </div>
      </div>

      {/* Exam Type Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['TÜMÜ', 'TYT', 'AYT', 'YDT'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === t
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            {t === 'TÜMÜ' ? 'Tüm Denemeler' : `${t} Denemeleri`}
          </button>
        ))}
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExams.length === 0 ? (
          <div className="col-span-full bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-sm">Sistemde henüz deneme sınavı belgesi bulunmuyor.</p>
            <p className="text-slate-500 text-xs mt-1">Üstteki "Yeni Deneme Sınavı Yükle" butonuna basarak PDF ekleyebilirsiniz.</p>
          </div>
        ) : (
          filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-slate-800/90 border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                      exam.examType === 'TYT'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    }`}>
                      {exam.examType}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">
                        {exam.examTitle}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Yayın: {exam.publisher} • {exam.totalQuestions} Soru
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteExam(exam.id)}
                    title="Denemeyi Sil"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono mb-1">
                    <span className="truncate max-w-[200px] text-slate-200 font-sans font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" /> {exam.fileName}
                    </span>
                    <span className="text-[10px] text-slate-400">{exam.fileSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Yükleme: {exam.uploadDate}</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Matris Eşleşti
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BookCheck className="w-3 h-3 text-emerald-400" /> Öne Çıkan Konu Dağılımı:
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                    {exam.testedKazanimlar.map((kazanim, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-md"
                      >
                        {kazanim}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Arşiv Kodu: <span className="font-mono text-slate-300">{exam.id}</span></span>
                <button
                  onClick={() => alert(`Deneme PDF Belgesi ("${exam.fileName}") indiriliyor.`)}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> PDF İndir
                </button>
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
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Geçmiş YKS Deneme Sınavı Yükle</h3>
                  <p className="text-xs text-slate-400">Yönetici Serdar Aktaş Arşiv Kaydı</p>
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
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deneme Sınavı Başlığı
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Örn: 2026 Özdebir Türkiye Geneli TYT-1 Prova"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sınav Türü
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                    <option value="YDT">YDT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Yayın Evi
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="Örn: Özdebir"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Soru Sayısı
                  </label>
                  <input
                    type="number"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deneme Sınavı PDF Dosyası
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 text-center bg-slate-900/50 transition">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="yks-pdf-file-input"
                  />
                  <label htmlFor="yks-pdf-file-input" className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                    {fileName ? (
                      <p className="text-sm font-bold text-emerald-400 font-mono">{fileName}</p>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-200">Deneme Kitapçığı PDF'i Seçin</p>
                        <p className="text-[11px] text-slate-500 mt-1">Soru kitapçığı veya cevap anahtarı PDF belgesi</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Test Edilen Konu / Kazanım Listesi (Her satıra bir konu)
                </label>
                <textarea
                  rows={3}
                  value={topicsText}
                  onChange={(e) => setTopicsText(e.target.value)}
                  placeholder="Örn:&#10;Türkçe - Paragraf Ana Fikir&#10;Matematik - Sayı Basamakları&#10;Fizik - Elektrik ve Mıknatıs"
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
                  Denemeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
