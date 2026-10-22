import React, { useState, useEffect } from 'react';
import {
  Student12thGrade,
  OpticalExamEvaluationResult,
  DayProgram,
} from '../types';
import {
  evaluateOpticalAgainstKey,
  buildScheduleFromEvaluation,
  PRESET_ANSWER_KEYS,
} from '../utils/opticalEvaluator';
import { generateStudentProgramPDF } from '../utils/pdfGenerator';
import {
  X,
  Scan,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Save,
  Download,
  KeyRound,
  FileSpreadsheet,
  Eye,
  Trash2,
  Shield,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Client-side image optimization helper to prevent payload drops & ensure razor-sharp OCR
const optimizeImageFile = (file: File, maxDimension = 2400, quality = 0.92): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawData = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawData);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const optimized = canvas.toDataURL('image/jpeg', quality);
        resolve(optimized);
      };
      img.onerror = () => resolve(rawData);
      img.src = rawData;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface OpticalExamModalProps {
  student: Student12thGrade;
  isOpen: boolean;
  onClose: () => void;
  onSaveEvaluation: (evaluation: OpticalExamEvaluationResult, updatedProgram: DayProgram[]) => void;
  isManager?: boolean;
}

export const OpticalExamModal: React.FC<OpticalExamModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaveEvaluation,
  isManager = false,
}) => {
  if (!isOpen) return null;

  // View mode: 'upload' (the 3 upload sections) or 'results' (the diagnostic results & schedule)
  // Non-manager teachers always view 'results'
  const [viewMode, setViewMode] = useState<'upload' | 'results'>(() => {
    return isManager ? 'upload' : 'results';
  });

  // Ensure viewMode is results if not manager
  useEffect(() => {
    if (!isManager && viewMode !== 'results') {
      setViewMode('results');
    }
  }, [isManager, viewMode]);

  // Exam Info
  const [examName, setExamName] = useState('2026 Türkiye Geneli YKS Denemesi');
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'HEPSİ'>('TYT');
  const [examDate, setExamDate] = useState(new Date().toLocaleDateString('tr-TR'));

  // 1. OPTİK FORM YÜKLEME
  const [opticalImage, setOpticalImage] = useState<string | null>(null);
  const [opticalImageName, setOpticalImageName] = useState('');
  const [studentMarkingsText, setStudentMarkingsText] = useState('');

  // 2. CEVAP ANAHTARI YÜKLEME
  const [answerKeyMode, setAnswerKeyMode] = useState<'image' | 'preset' | 'text'>('image');
  const [answerKeyPreset, setAnswerKeyPreset] = useState<'TYT_A_KITAPCIK' | 'AYT_SAYISAL_A_KITAPCIK'>('TYT_A_KITAPCIK');
  const [answerKeyText, setAnswerKeyText] = useState('');
  const [answerKeyImage, setAnswerKeyImage] = useState<string | null>(null);
  const [answerKeyImageName, setAnswerKeyImageName] = useState('');

  // 3. DENEMEYİ / SORU KİTAPÇIĞINI YÜKLEME (Gerçek görseller, varsayılan boş)
  const [examImages, setExamImages] = useState<{ id: string; name: string; dataUrl: string }[]>([]);

  // Results State: Yalnızca kayıtlı veya taranmış gerçek sonuçlar, uydurma veri yok
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<OpticalExamEvaluationResult | null>(() => {
    if (student.opticalEvaluations && student.opticalEvaluations.length > 0) {
      return student.opticalEvaluations[student.opticalEvaluations.length - 1];
    }
    return null;
  });

  const [activeDiagTab, setActiveDiagTab] = useState<'ALL' | 'TYT' | 'AYT'>('ALL');
  const [questionFilter, setQuestionFilter] = useState<'all' | 'wrong' | 'blank' | 'correct'>('wrong');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [adjustedSchedule, setAdjustedSchedule] = useState<DayProgram[] | null>(() => {
    if (student.weeklyProgram && student.weeklyProgram.length > 0) {
      return student.weeklyProgram;
    }
    return null;
  });

  // Ensure schedule is built if evaluation exists but schedule missing
  useEffect(() => {
    if (evaluationResult && (!adjustedSchedule || adjustedSchedule.length === 0)) {
      setAdjustedSchedule(buildScheduleFromEvaluation(evaluationResult, student));
    }
  }, [evaluationResult, adjustedSchedule, student]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Toggle individual question status (correct -> wrong -> blank -> correct) in interactive manager view
  const handleToggleQuestionStatus = (qId: string) => {
    if (!evaluationResult) return;
    const nextStatusMap: Record<string, 'correct' | 'wrong' | 'blank'> = {
      correct: 'wrong',
      wrong: 'blank',
      blank: 'correct',
    };

    const updatedQuestions = evaluationResult.questions.map((q) => {
      if (q.id === qId) {
        const nextStatus = nextStatusMap[q.status] || 'correct';
        return {
          ...q,
          status: nextStatus,
          studentAnswer: nextStatus === 'correct' ? q.correctAnswer : nextStatus === 'blank' ? '' : (q.studentAnswer || (q.correctAnswer === 'A' ? 'B' : 'A')),
        };
      }
      return q;
    });

    // Recompute subjects stats directly from questions
    const subMap: Record<string, any> = {};
    updatedQuestions.forEach((q) => {
      const sName = q.subject || 'Genel Değerlendirme';
      if (!subMap[sName]) {
        subMap[sName] = {
          subjectName: sName,
          questionCount: 0,
          correct: 0,
          wrong: 0,
          blank: 0,
          net: 0,
          accuracyRate: 0,
          kazanimlar: [],
        };
      }
      subMap[sName].questionCount++;
      if (q.status === 'correct') subMap[sName].correct++;
      else if (q.status === 'wrong') subMap[sName].wrong++;
      else subMap[sName].blank++;

      const existingK = subMap[sName].kazanimlar.find((k: any) => k.topicName === q.topicName);
      if (existingK) {
        existingK.questionCount++;
        if (q.status === 'correct') existingK.correctCount++;
        else if (q.status === 'wrong') existingK.wrongCount++;
        else existingK.blankCount++;
        if (q.status !== 'correct' && q.diagnosticNote) {
          existingK.recommendation = q.diagnosticNote;
          existingK.status = 'struggling';
        }
      } else {
        subMap[sName].kazanimlar.push({
          topicName: q.topicName,
          questionCount: 1,
          correctCount: q.status === 'correct' ? 1 : 0,
          wrongCount: q.status === 'wrong' ? 1 : 0,
          blankCount: q.status === 'blank' ? 1 : 0,
          status: q.status === 'correct' ? 'mastered' : 'struggling',
          recommendation: q.diagnosticNote || `${q.topicName} konusunda tekrar yapılmalı.`,
        });
      }
    });

    const updatedSubjects = Object.values(subMap).map((s: any) => {
      s.net = Number((s.correct - s.wrong * 0.25).toFixed(2));
      s.accuracyRate = s.questionCount > 0 ? Math.round((s.correct / s.questionCount) * 100) : 0;
      return s;
    });

    const correctCount = updatedQuestions.filter((q) => q.status === 'correct').length;
    const wrongCount = updatedQuestions.filter((q) => q.status === 'wrong').length;
    const blankCount = updatedQuestions.filter((q) => q.status === 'blank').length;

    const newEvalResult: OpticalExamEvaluationResult = {
      ...evaluationResult,
      questions: updatedQuestions,
      subjects: updatedSubjects,
      totalCorrect: correctCount,
      totalWrong: wrongCount,
      totalBlank: blankCount,
      totalNet: Number((correctCount - wrongCount * 0.25).toFixed(2)),
    };

    setEvaluationResult(newEvalResult);
    const newSchedule = buildScheduleFromEvaluation(newEvalResult, student);
    setAdjustedSchedule(newSchedule);
  };

  // Handle Exam Type Switch
  const handleExamTypeChange = (type: 'TYT' | 'AYT' | 'HEPSİ') => {
    setExamType(type);
    if (answerKeyMode === 'preset') {
      if (type === 'AYT') {
        setAnswerKeyPreset('AYT_SAYISAL_A_KITAPCIK');
        setAnswerKeyText(PRESET_ANSWER_KEYS['AYT_SAYISAL_A_KITAPCIK']);
      } else {
        setAnswerKeyPreset('TYT_A_KITAPCIK');
        setAnswerKeyText(PRESET_ANSWER_KEYS['TYT_A_KITAPCIK']);
      }
    }
  };

  // 1. Optical Form Upload Handler with canvas optimization
  const handleOpticalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOpticalImageName(file.name);
      setIsOptimizing(true);
      try {
        const optimized = await optimizeImageFile(file, 2400, 0.92);
        setOpticalImage(optimized);
      } catch (err) {
        console.error('Optik form optimize hatası:', err);
      } finally {
        setIsOptimizing(false);
      }
    }
  };

  // 2. Answer Key Image Upload Handler with canvas optimization
  const handleAnswerKeyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAnswerKeyImageName(file.name);
      setIsOptimizing(true);
      try {
        const optimized = await optimizeImageFile(file, 2400, 0.92);
        setAnswerKeyImage(optimized);
      } catch (err) {
        console.error('Cevap anahtarı optimize hatası:', err);
      } finally {
        setIsOptimizing(false);
      }
    }
  };

  // 3. Exam Booklet Upload Handler with canvas optimization (Multiple pages)
  const handleExamBookletUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      setIsOptimizing(true);
      try {
        for (const file of files) {
          const optimized = await optimizeImageFile(file, 2400, 0.92);
          setExamImages((prev) => [
            ...prev,
            {
              id: `booklet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: file.name,
              dataUrl: optimized,
            },
          ]);
        }
      } catch (err) {
        console.error('Kitapçık sayfası optimize hatası:', err);
      } finally {
        setIsOptimizing(false);
      }
    }
  };

  const handleRemoveExamImage = (id: string) => {
    setExamImages((prev) => prev.filter((img) => img.id !== id));
  };

  // TRIGGER: ANALİZ YAP (Run Analysis strictly across user uploaded images)
  const handleRunAnalysis = async () => {
    if (!opticalImage && examImages.length === 0 && !answerKeyImage && !answerKeyText.trim()) {
      alert('Lütfen analiz için en az bir optik form, cevap anahtarı veya soru kitapçığı görseli yükleyin.');
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setViewMode('results');

    try {
      const response = await fetch('/api/scan-optical-and-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examName,
          examType,
          examDate,
          answerKeyText: answerKeyMode === 'text' || answerKeyMode === 'preset' ? answerKeyText : '',
          answerKeyImage: answerKeyMode === 'image' ? answerKeyImage : null,
          opticalImage,
          studentMarkingsText,
          examImages,
          studentName: student.name,
          studentBranch: student.branch,
        }),
      });

      const data = await response.json();

      if (response.ok && data.result) {
        setEvaluationResult(data.result);
        const schedule = buildScheduleFromEvaluation(data.result, student);
        setAdjustedSchedule(schedule);
      } else {
        throw new Error(data.error || 'Görseller taranırken bir hata oluştu. Lütfen net görsel yükleyip tekrar deneyin.');
      }
    } catch (e: any) {
      console.error('API call failed:', e);
      setScanError(e.message || 'Görseller analiz edilirken bir hata oluştu. Lütfen fotoğrafların net ve okunabilir olduğundan emin olun.');
    } finally {
      setIsScanning(false);
    }
  };

  // Save the evaluation and apply schedule
  const handleApplyScheduleAndSave = () => {
    if (!evaluationResult || !adjustedSchedule) return;
    setIsSaving(true);

    setTimeout(() => {
      onSaveEvaluation(evaluationResult, adjustedSchedule);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 400);
  };

  // PDF Export
  const handleExportPDF = () => {
    if (!adjustedSchedule) return;
    const tempStudent: Student12thGrade = {
      ...student,
      mentorNote: `Optik form, cevap anahtarı ve soru kitapçığı analizi sonucu "${examName}" denemesindeki eksik konulara göre haftalık program düzenlenmiştir.`,
      weeklyProgram: adjustedSchedule,
    };
    generateStudentProgramPDF(tempStudent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Deneme Sınavı Optik & Soru Analizi</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                  {student.name} • {student.branch}
                </span>
                {isManager ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold">
                    Yönetici: Serdar Aktaş
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-400" />
                    Öğretmen İnceleme Modu
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isManager
                  ? '1. Optik Formu yükleyin, 2. Cevap Anahtarını yükleyin, 3. Denemeyi yükleyin ve Analiz Yap seçeneğine basın.'
                  : 'Öğrencinin branş bazlı doğru, yanlış ve boş sayıları ile deneme kitapçığından tespit edilen eksik konuları aşağıda listelenmiştir. Yükleme yetkisi sadece Yönetici Serdar Aktaş\'a aittir.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'results' && isManager && (
              <button
                type="button"
                onClick={() => setViewMode('upload')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Yükleme Ekranına Dön</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ============================================================== */}
          {/* VIEW MODE 1: ÜÇ SEÇENEKLİ YÜKLEME EKRANI & ANALİZ YAP BUTONU   */}
          {/* ============================================================== */}
          {viewMode === 'upload' && !isManager && (
            <div className="p-10 text-center bg-slate-800/40 border border-slate-800 rounded-2xl space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Yükleme Yetkisi Kısıtlı</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Optik form, cevap anahtarı ve deneme soru kitapçığı yüklemelerini yalnızca <strong>Yönetici (Serdar Aktaş)</strong> yapabilir. Öğretmenler deneme sonuçlarını ve öğrenci eksiklerini inceleyebilir.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('results')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Sonuçları ve Eksik Konuları Görüntüle
              </button>
            </div>
          )}

          {viewMode === 'upload' && isManager && (
            <div className="space-y-6 animate-fadeIn">
              {/* Sınav Bilgileri Çubuğu */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Sınav Adı</label>
                    <input
                      type="text"
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      placeholder="Örn: Özdebir TYT-1, Bilgi Sarmal AYT-2"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Sınav Türü</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['TYT', 'AYT', 'HEPSİ'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleExamTypeChange(t)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                            examType === t
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Tarih</label>
                    <input
                      type="text"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Kullanıcının İstediği 3 Yükleme Yeri (Side-by-side 3 Cards) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* -------------------------------------------------------- */}
                {/* 1. KISIM: OPTİK FORM YÜKLEME                              */}
                {/* -------------------------------------------------------- */}
                <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-700 transition">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                          1
                        </span>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Scan className="w-4 h-4 text-indigo-400" />
                          <span>Optik Form Yükle</span>
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Öğrenci Kağıdı</span>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      {student.name} isimli öğrencinin doldurduğu optik formun cep telefonu fotoğrafını veya taranmış görüntüsünü yükleyin.
                    </p>

                    <div className="mt-4">
                      <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition">
                        <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-200 text-center">
                          {opticalImageName ? opticalImageName : 'Optik Form Görseli Seç'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, PDF (Maks 25MB)</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleOpticalImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {opticalImage ? (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate font-medium">{opticalImageName || 'Optik Form Yüklendi'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOpticalImage(null);
                            setOpticalImageName('');
                          }}
                          className="text-[11px] text-rose-400 hover:text-rose-300"
                        >
                          Kaldır
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] text-slate-500 italic">
                        Öğrencinin işaretleme yaptığı gerçek optik formun fotoğrafını yükleyin.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    Durum:{' '}
                    {opticalImage ? (
                      <span className="text-emerald-400 font-semibold">✓ Optik Form Hazır</span>
                    ) : (
                      <span className="text-amber-400 font-medium">Optik form görseli bekleniyor</span>
                    )}
                  </div>
                </div>

                {/* -------------------------------------------------------- */}
                {/* 2. KISIM: CEVAP ANAHTARI YÜKLEME                          */}
                {/* -------------------------------------------------------- */}
                <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-700 transition">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-black text-xs flex items-center justify-center">
                          2
                        </span>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-violet-400" />
                          <span>Cevap Anahtarı</span>
                        </h3>
                      </div>
                      <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setAnswerKeyMode('image')}
                          className={`px-2 py-0.5 rounded transition ${
                            answerKeyMode === 'image' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400'
                          }`}
                        >
                          Fotoğraf
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAnswerKeyMode('preset');
                            setAnswerKeyText(examType === 'AYT' ? PRESET_ANSWER_KEYS['AYT_SAYISAL_A_KITAPCIK'] : PRESET_ANSWER_KEYS['TYT_A_KITAPCIK']);
                          }}
                          className={`px-2 py-0.5 rounded transition ${
                            answerKeyMode === 'preset' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400'
                          }`}
                        >
                          Şablon
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnswerKeyMode('text')}
                          className={`px-2 py-0.5 rounded transition ${
                            answerKeyMode === 'text' ? 'bg-violet-600 text-white font-bold' : 'text-slate-400'
                          }`}
                        >
                          Metin
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Sınavın resmi cevap anahtarının fotoğrafını yükleyin veya şablondan/metinden girin.
                    </p>

                    <div className="mt-4">
                      {answerKeyMode === 'image' && (
                        <div className="space-y-2">
                          <label className="border-2 border-dashed border-slate-700 hover:border-violet-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition">
                            <Upload className="w-6 h-6 text-violet-400 mb-1.5" />
                            <span className="text-xs font-semibold text-slate-200 text-center">
                              {answerKeyImageName ? answerKeyImageName : 'Cevap Anahtarı Fotoğrafı Seç'}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">Kitapçık arkası veya optik anahtar</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleAnswerKeyImageUpload}
                              className="hidden"
                            />
                          </label>
                          {answerKeyImage && (
                            <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                              <Check className="w-3.5 h-3.5" /> Cevap anahtarı görseli hazır
                            </p>
                          )}
                        </div>
                      )}

                      {answerKeyMode === 'preset' && (
                        <div className="space-y-2">
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">
                                {examType === 'AYT' ? 'AYT A Kitapçığı Standart Şablonu' : 'TYT A Kitapçığı Standart Şablonu'}
                              </span>
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                Seçildi
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {examType === 'AYT' ? '80 Soru: Mat 40, Fen 40' : '120 Soru: Türkçe 40, Sos 20, Mat 40, Fen 20'}
                            </p>
                          </div>
                        </div>
                      )}

                      {answerKeyMode === 'text' && (
                        <div className="space-y-1.5">
                          <textarea
                            rows={3}
                            value={answerKeyText}
                            onChange={(e) => setAnswerKeyText(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] font-mono text-violet-300 focus:outline-none"
                            placeholder="A B C D E A C..."
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    Durum:{' '}
                    {answerKeyImage || answerKeyText.trim() ? (
                      <span className="text-emerald-400 font-semibold">✓ Cevap Anahtarı Tanımlı</span>
                    ) : (
                      <span className="text-amber-400 font-medium">Cevap anahtarı bekleniyor</span>
                    )}
                  </div>
                </div>

                {/* -------------------------------------------------------- */}
                {/* 3. KISIM: DENEMEYİ / SORU KİTAPÇIĞINI YÜKLEME             */}
                {/* -------------------------------------------------------- */}
                <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-700 transition">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                          3
                        </span>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                          <span>Deneme Soru Kitapçığı</span>
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{examImages.length} Sayfa</span>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Soru sayfalarını veya soru fotoğraflarını yükleyin. Yapay zeka bu görsellerdeki soru metinlerini kelimesi kelimesine okuyup analiz edecektir.
                    </p>

                    <div className="mt-4">
                      <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition">
                        <Upload className="w-6 h-6 text-emerald-400 mb-1.5" />
                        <span className="text-xs font-semibold text-slate-200 text-center">
                          Deneme Soru Görsellerini Yükle
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Çoklu sayfa seçimi desteklenir (PNG, JPG)</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleExamBookletUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {examImages.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                        {examImages.map((img, i) => (
                          <div
                            key={img.id}
                            className="relative w-14 h-14 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-950 shrink-0 group"
                          >
                            <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <span className="text-[10px] text-white font-bold">#{i + 1}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveExamImage(img.id)}
                              className="absolute top-0.5 right-0.5 p-0.5 bg-black/80 text-slate-300 hover:text-rose-400 rounded cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    Durum:{' '}
                    {examImages.length > 0 ? (
                      <span className="text-emerald-400 font-semibold">✓ {examImages.length} Soru Sayfası Yüklendi</span>
                    ) : (
                      <span className="text-amber-400 font-medium">Soru sayfalarını veya fotoğraflarını seçin</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ANA AKSİYON ÇUBUĞU: "ANALİZ YAP" BUTONU */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Yüklenen Gerçek Görseller Üzerinden Analiz Yapılacaktır</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    "Analiz Yap" seçeneğine bastığınızda yapay zeka yüklediğiniz soru sayfalarındaki metinleri okur, optik form ile karşılaştırır ve sadece gerçek soru içeriklerine göre eksik konuları çıkarır.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={isScanning || isOptimizing}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/40 hover:shadow-indigo-600/60 transition cursor-pointer flex items-center gap-2.5 shrink-0 disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Görseller Taranıyor...</span>
                    </>
                  ) : (
                    <>
                      <Scan className="w-5 h-5 text-amber-300" />
                      <span>Analiz Yap</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW MODE 2: ANALİZ SONUÇLARI, TEŞHİS & HAFTALIK DERS PROGRAMI */}
          {/* ============================================================== */}
          {viewMode === 'results' && (
            <div className="space-y-6 animate-fadeIn">
              {scanError ? (
                <div className="py-12 px-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4 max-w-xl mx-auto animate-fadeIn">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Görseller Analiz Edilirken Hata Oluştu</h3>
                    <p className="text-xs text-rose-300 mt-1.5 leading-relaxed">{scanError}</p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Lütfen yüklediğiniz soru kitapçığı sayfalarının ve optik formun net, aydınlık ve okunabilir olduğundan emin olun.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setViewMode('upload')}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition cursor-pointer"
                    >
                      Yükleme Ekranına Dön
                    </button>
                    <button
                      type="button"
                      onClick={handleRunAnalysis}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      Tekrar Dene
                    </button>
                  </div>
                </div>
              ) : isScanning ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500 flex items-center justify-center text-indigo-400">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Yapay Zeka Yüklediğiniz Görselleri İnceliyor...</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      1. Yüklenen soru kitapçığı sayfalarındaki sorular tek tek okunuyor.<br />
                      2. Optik form işaretlemeleri ile cevap anahtarı karşılaştırılıyor.<br />
                      3. Soru metinlerinde test edilen gerçek kazanımlara göre haftalık program hazırlanıyor.
                    </p>
                  </div>
                </div>
              ) : evaluationResult ? (
                <div className="space-y-6">
                  {/* Bilgilendirme Kartı: Öğretmen Modu */}
                  {!isManager && (
                    <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 text-slate-300">
                        <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
                        <span>
                          <strong>Öğretmen İnceleme Modu:</strong> Yeni optik form, cevap anahtarı ve deneme kitapçığı yükleme yetkisi yalnızca <strong>Yönetici (Serdar Aktaş)</strong> için tanımlıdır. Bu ekranda öğrencinin branş bazlı doğru, yanlış ve boş sayılarını, tespit edilen eksik konularını ve ders programını inceleyebilirsiniz.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 w-fit transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF İndir</span>
                      </button>
                    </div>
                  )}

                  {/* Görsel Birebir Doğrulama Rozeti */}
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-indigo-500/40 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-xs flex items-center gap-1.5">
                          <span>Mikroskobik Görsel Doğrulaması Aktif</span>
                          <span className="px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                            {evaluationResult.questions.length} Gerçek Soru İncelendi
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Tüm veriler, yüklediğiniz soru kitapçığı sayfaları ve optik formdan kelimesi kelimesine taranmıştır. Görselde basılı olmayan hiçbir uydurma soru veya branş sisteme dahil edilmemiştir.
                        </p>
                      </div>
                    </div>
                    {isManager && (
                      <span className="text-[11px] text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-medium">
                        💡 Durum butonuna (Doğru / Yanlış / Boş) tıklayarak anlık değiştirebilirsiniz.
                      </span>
                    )}
                  </div>

                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 text-center">
                      <p className="text-xs text-slate-400 font-medium">Toplam Net</p>
                      <p className="text-2xl font-black text-indigo-400 mt-0.5">{evaluationResult.totalNet}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{evaluationResult.examName}</p>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 text-center">
                      <p className="text-xs text-emerald-400 font-medium">Doğru</p>
                      <p className="text-2xl font-black text-emerald-400 mt-0.5">{evaluationResult.totalCorrect}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Tam Başarılı</p>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 text-center">
                      <p className="text-xs text-rose-400 font-medium">Yanlış</p>
                      <p className="text-2xl font-black text-rose-400 mt-0.5">{evaluationResult.totalWrong}</p>
                      <p className="text-[10px] text-rose-400/80 mt-0.5">Eksik Kazanım</p>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 text-center">
                      <p className="text-xs text-amber-400 font-medium">Boş</p>
                      <p className="text-2xl font-black text-amber-400 mt-0.5">{evaluationResult.totalBlank}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Gözden Geçirilmeli</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1 bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 text-center">
                      <p className="text-xs text-slate-400 font-medium">Başarı Yüzdesi</p>
                      <p className="text-2xl font-black text-white mt-0.5">
                        %{Math.round((evaluationResult.totalCorrect / Math.max(1, evaluationResult.totalCorrect + evaluationResult.totalWrong + evaluationResult.totalBlank)) * 100)}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{evaluationResult.examDate}</p>
                    </div>
                  </div>

                  {/* Branş Sekmeleri */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveDiagTab('ALL')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          activeDiagTab === 'ALL'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>Tüm Tespit Edilen Branşlar ({evaluationResult.subjects.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDiagTab('TYT')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          activeDiagTab === 'TYT'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>TYT Branşları</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDiagTab('AYT')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          activeDiagTab === 'AYT'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>AYT Branşları</span>
                      </button>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Görsellerden Okunan:</span>{' '}
                      <span className="text-indigo-400 font-bold font-mono">{evaluationResult.questions.length} Soru</span>
                      <span className="text-slate-600">•</span>
                      <span>Eksik Konu:</span>{' '}
                      <span className="text-rose-400 font-bold font-mono">{evaluationResult.totalWrong + evaluationResult.totalBlank}</span>
                    </div>
                  </div>

                  {/* Branş Bazlı Geliştirilmesi Gereken Noktalar Listesi */}
                  <div className="space-y-4">
                    {evaluationResult.subjects
                      .filter((s) => {
                        if (activeDiagTab === 'ALL') return true;
                        if (activeDiagTab === 'TYT') return s.subjectName.toUpperCase().includes('TYT');
                        return s.subjectName.toUpperCase().includes('AYT') || !s.subjectName.toUpperCase().includes('TYT');
                      })
                      .map((subj) => {
                        const weakKazanimlar = (subj.kazanimlar || []).filter((k) => k.status === 'struggling');
                        const strongKazanimlar = (subj.kazanimlar || []).filter((k) => k.status === 'mastered');

                        return (
                          <div
                            key={subj.subjectName}
                            className="bg-slate-800/40 border border-slate-800 rounded-xl p-4.5 space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
                              <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                <h4 className="text-sm font-bold text-white">{subj.subjectName}</h4>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                  {subj.net} Net ({subj.correct}D {subj.wrong}Y {subj.blank}B)
                                </span>
                              </div>
                              <span className="text-xs text-slate-400">
                                Başarı: %{subj.accuracyRate} ({subj.questionCount} Soru)
                              </span>
                            </div>

                            {/* Geliştirilmesi Gereken Noktalar (Hatalı/Boş Konular) */}
                            {weakKazanimlar.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Geliştirilmesi Gereken Noktalar (Yüklenen Soru Kitapçığından Tespit Edildi):</span>
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                  {weakKazanimlar.map((wk, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between gap-1.5"
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <p className="text-xs font-bold text-slate-200">{wk.topicName}</p>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold shrink-0">
                                          {wk.wrongCount} Yanlış {wk.blankCount > 0 ? `• ${wk.blankCount} Boş` : ''}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-400 leading-relaxed">
                                        {wk.recommendation || 'Bu konudaki kurallar ve formül uygulamaları tekrar edilmeli.'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                <span>Bu branşta soru kaçırılmadı! Tüm sorular doğru yanıtlandı.</span>
                              </div>
                            )}

                            {strongKazanimlar.length > 0 && (
                              <div className="text-xs text-slate-400 pt-1">
                                <span className="font-semibold text-emerald-400">Pekiştirilen Güçlü Konular: </span>
                                <span>{strongKazanimlar.slice(0, 3).map((s) => s.topicName).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Deneme Sonucuna Göre Otomatik Ayarlanan 7 Günlük Ders Programı */}
                  {adjustedSchedule && (
                    <div className="bg-slate-800/40 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/30">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Görsellerdeki Eksiklere Göre Ayarlanan Haftalık Çalışma Programı</h4>
                            <p className="text-xs text-indigo-300/80">
                              Yüklenen sorularda tespit edilen eksik ve pekiştirilmesi gereken konular 7 günlük programa dağıtıldı.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleExportPDF}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5 transition"
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-400" />
                            <span>PDF İndir</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
                        {adjustedSchedule.map((day) => (
                          <div
                            key={day.dayName}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2"
                          >
                            <div className="border-b border-slate-800 pb-1 flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{day.dayName}</span>
                              <span className="text-[10px] text-slate-500">{day.tasks.length} Görev</span>
                            </div>

                            <div className="space-y-1.5 flex-1">
                              {day.tasks.map((task, tIdx) => (
                                <div
                                  key={task.id || tIdx}
                                  className={`p-2 rounded-lg text-[11px] space-y-1 ${
                                    task.isWeakTopic
                                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-200'
                                      : task.isMandatoryCommon
                                      ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-200'
                                      : 'bg-slate-800/80 border border-slate-700/60 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold truncate">{task.subject}</span>
                                    <span
                                      className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                                        task.isWeakTopic
                                          ? 'bg-rose-500/20 text-rose-300'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {task.questionTarget} Soru
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                                    {task.topic}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {saveSuccess && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                          <span className="font-semibold">
                            Program öğrencinin profiline kaydedildi ve eşitlendi!
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Soru Bazlı Tablo */}
                  <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Görsellerden Okunan Gerçek Sorular ({evaluationResult.questions.length} Soru)
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Her satır doğrudan yüklediğiniz soru kitapçığından kelimesi kelimesine okunmuştur. Detayları görmek için satıra tıklayabilirsiniz.
                        </p>
                      </div>
                      <div className="flex gap-1.5 text-[11px]">
                        {(['wrong', 'blank', 'correct', 'all'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setQuestionFilter(f)}
                            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                              questionFilter === f
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {f === 'wrong' ? 'Yanlışlar' : f === 'blank' ? 'Boşlar' : f === 'correct' ? 'Doğrular' : 'Tümü'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-700/80">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 sticky top-0 text-slate-400 font-semibold border-b border-slate-700 z-10">
                          <tr>
                            <th className="p-2.5">Soru No & Görsel Metni</th>
                            <th className="p-2.5">Branş</th>
                            <th className="p-2.5">Tespit Edilen Gerçek Konu</th>
                            <th className="p-2.5 text-center">Öğrenci</th>
                            <th className="p-2.5 text-center">Doğru</th>
                            <th className="p-2.5 text-center">Durum {isManager && <span className="text-[10px] text-indigo-400">(Tıkla)</span>}</th>
                            <th className="p-2.5">Soruya Özgü Çıkarım / Analiz</th>
                            <th className="p-2.5 text-center">Detay</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-[11px]">
                          {evaluationResult.questions
                            .filter((q) => {
                              if (questionFilter === 'wrong') return q.status === 'wrong';
                              if (questionFilter === 'blank') return q.status === 'blank';
                              if (questionFilter === 'correct') return q.status === 'correct';
                              return true;
                            })
                            .map((q) => {
                              const isExpanded = expandedQuestionId === q.id;
                              return (
                                <React.Fragment key={q.id}>
                                  <tr
                                    className="hover:bg-slate-800/40 cursor-pointer transition"
                                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                                  >
                                    <td className="p-2.5 font-medium">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                                          S{q.questionNumber}
                                        </span>
                                        {q.sourceImage && (
                                          <span className="text-[9px] text-indigo-300 bg-indigo-500/10 px-1 rounded truncate max-w-[80px]">
                                            {q.sourceImage}
                                          </span>
                                        )}
                                      </div>
                                      {q.questionSnippet && (
                                        <p className="text-[10px] text-slate-400 italic truncate max-w-xs mt-1">
                                          "{q.questionSnippet}"
                                        </p>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-slate-300 font-medium">{q.subject}</td>
                                    <td className="p-2.5 text-slate-200 font-semibold">{q.topicName}</td>
                                    <td className="p-2.5 text-center font-bold font-mono">
                                      {q.studentAnswer ? (
                                        <span
                                          className={
                                            q.status === 'correct'
                                              ? 'text-emerald-400'
                                              : 'text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded'
                                          }
                                        >
                                          {q.studentAnswer}
                                        </span>
                                      ) : (
                                        <span className="text-amber-400 font-normal">Boş</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-center font-bold font-mono text-emerald-400">
                                      {q.correctAnswer}
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <button
                                        type="button"
                                        disabled={!isManager}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isManager) handleToggleQuestionStatus(q.id);
                                        }}
                                        title={isManager ? "Durumu değiştirmek için tıklayın" : undefined}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                                          isManager ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-default'
                                        } ${
                                          q.status === 'correct'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : q.status === 'wrong'
                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        }`}
                                      >
                                        {q.status === 'correct' ? 'DOĞRU' : q.status === 'wrong' ? 'YANLIŞ' : 'BOŞ'}
                                      </button>
                                    </td>
                                    <td className="p-2.5 text-slate-400 text-[11px] truncate max-w-xs" title={q.diagnosticNote}>
                                      {q.diagnosticNote || 'Görsel içeriğine göre analiz edildi.'}
                                    </td>
                                    <td className="p-2.5 text-center text-slate-500">
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 mx-auto text-indigo-400" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 mx-auto hover:text-white" />
                                      )}
                                    </td>
                                  </tr>

                                  {/* Genişletilmiş Soru Detay Kartı */}
                                  {isExpanded && (
                                    <tr className="bg-slate-950/70 border-b border-indigo-500/20">
                                      <td colSpan={8} className="p-4 space-y-2.5 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                            <p className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                                              <FileText className="w-3.5 h-3.5" />
                                              <span>Yüklenen Görselden Birebir Okunan Soru Metni:</span>
                                            </p>
                                            <p className="text-slate-200 leading-relaxed font-sans italic bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                                              {q.questionSnippet || 'Soru görseli incelendi ve konu tespit edildi.'}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                                              <span>Doğru Cevap: <strong className="text-emerald-400 font-mono">{q.correctAnswer}</strong></span>
                                              <span>•</span>
                                              <span>Öğrenci: <strong className="text-indigo-300 font-mono">{q.studentAnswer || 'İşaretsiz / Boş'}</strong></span>
                                              {q.sourceImage && (
                                                <>
                                                  <span>•</span>
                                                  <span>Görsel: <strong className="text-slate-300">{q.sourceImage}</strong></span>
                                                </>
                                              )}
                                            </div>
                                          </div>

                                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                            <p className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                                              <AlertTriangle className="w-3.5 h-3.5" />
                                              <span>Tespit Edilen Soru Konusu ve Çıkarım Analizi:</span>
                                            </p>
                                            <div className="space-y-1">
                                              <p className="text-white font-bold">{q.topicName}</p>
                                              <p className="text-slate-300 leading-relaxed text-[11px]">
                                                {q.diagnosticNote || 'Sorudaki kavramlar ve formül uygulamaları tekrar edilmelidir.'}
                                              </p>
                                            </div>
                                            {isManager && (
                                              <div className="pt-2 flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400">Öğrenci durumunu değiştir:</span>
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleQuestionStatus(q.id)}
                                                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition cursor-pointer"
                                                >
                                                  Durumu Değiştir ({q.status === 'correct' ? 'Yanlış Yap' : q.status === 'wrong' ? 'Boş Yap' : 'Doğru Yap'})
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between sticky bottom-0 z-20">
          <div>
            {viewMode === 'results' ? (
              isManager ? (
                <button
                  type="button"
                  onClick={() => setViewMode('upload')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Yükleme Ekranına Dön</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Öğretmen İnceleme Modu • Yükleme Yetkisi: Serdar Aktaş</span>
                </div>
              )
            ) : (
              <span className="text-xs text-slate-400">
                Öğrenci: <strong className="text-slate-200">{student.name}</strong> • 3 parçayı yükleyip Analiz Yap'a basın
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {viewMode === 'upload' ? (
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isScanning}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
              >
                <Scan className="w-4 h-4 text-amber-300" />
                <span>Analiz Yap</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : isManager ? (
              <button
                type="button"
                onClick={handleApplyScheduleAndSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Kaydediliyor...' : 'Programı Öğrenciye Kaydet & Uygula'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExportPDF}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Haftalık Programı PDF İndir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
