import React, { useState } from 'react';
import { PastYksExamDocument } from '../types';
import { FileSpreadsheet, Upload, Download, Trash2, Plus, Sparkles, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';

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

  // Form states: Sadece Sınav Türü ve Sınav Başlığı (+ Dosya)
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<string>('TYT');
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !fileName) {
      alert('Lütfen sınav başlığını ve deneme PDF dosyasını seçiniz.');
      return;
    }

    const newExam: PastYksExamDocument = {
      id: `exam-${Date.now()}`,
      examTitle: examTitle.trim(),
      examType: examType as any,
      publisher: 'Özdebir / Kurumsal Deneme',
      uploadDate: new Date().toLocaleDateString('tr-TR'),
      fileName,
      fileSize: '4.8 MB',
      totalQuestions: examType === 'TYT' ? 120 : examType === 'AYT' ? 80 : 100,
      testedKazanimlar: ['Genel Müfredat Konuları', 'Deneme Sınavı Matrisi'],
    };

    onAddExam(newExam);
    setIsModalOpen(false);
    setExamTitle('');
    setFileName('');
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
              DENEME ARŞİVİ
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-2">
            Denemeler
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Sisteme yüklenen deneme sınavı kitapçıkları ve sınav başlıkları, yapay zeka mentör sisteminde öğrencilerin eksik kaldığı ders ve konuların belirlenmesinde kullanılır.
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
          Yüklenen deneme sınavları ile öğrencilerin sınav netleri otomatik eşleştirilir. Böylece öğrencinin çalışma programında zayıf olduğu ders ve konular öne çıkarılır.
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
            <p className="text-slate-500 text-xs mt-1">Üstteki "Yeni Deneme Sınavı Yükle" butonuna basarak sınav ekleyebilirsiniz.</p>
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
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Sınav Türü: <strong className="text-indigo-300">{exam.examType}</strong>
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
                      <CheckCircle2 className="w-3 h-3" /> Aktif
                    </span>
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

      {/* Upload Modal (Sadece Sınav Türü ve Sınav Başlığı) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Yeni Deneme Sınavı Yükle</h3>
                  <p className="text-xs text-slate-400">Serdar Aktaş Deneme Yönetimi</p>
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
              {/* Sınav Türü */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Sınav Türü
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="TYT">TYT (Temel Yeterlilik Testi)</option>
                  <option value="AYT">AYT (Alan Yeterlilik Testi)</option>
                  <option value="HEPSİ">HEPSİ (TYT + AYT Birleşik Deneme)</option>
                  <option value="YDT">YDT (Yabancı Dil Testi)</option>
                  <option value="LGS">LGS</option>
                  <option value="Genel Deneme">Genel Deneme Sınavı</option>
                </select>
              </div>

              {/* Sınav Başlığı */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Sınav Başlığı
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Örn: Özdebir Türkiye Geneli TYT-1 Prova Sınavı"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Deneme PDF Belgesi */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Deneme Sınavı Dosyası (PDF)
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 text-center bg-slate-900/50 transition">
                  <input
                    type="file"
                    accept=".pdf,.docx,.xlsx"
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
                        <p className="text-xs font-semibold text-slate-200">Deneme Kitapçığı / Sınav Belgesi Seçin</p>
                        <p className="text-[11px] text-slate-500 mt-1">PDF, Word veya Excel belgesi</p>
                      </>
                    )}
                  </label>
                </div>
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
                  Deneme Sınavını Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
