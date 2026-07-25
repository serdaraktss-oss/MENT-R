import React, { useState } from 'react';
import { Student12thGrade, SubjectNetDetail, SubjectKazanimDetail, ScheduleTask } from '../types';
import { generateStudentProgramPDF } from '../utils/pdfGenerator';
import { generateKazanimlarForSubject, parseOpticalDocument } from '../utils/kazanimGenerator';
import { ExamTrendChart, ExamHistoryPoint } from './ExamTrendChart';
import {
  ArrowLeft,
  Download,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  FileText,
  Clock,
  Plus,
  Edit3,
  BarChart2,
  X,
  UserCheck,
  FileSpreadsheet,
  UploadCloud,
  FileCheck,
  ListFilter,
  Check,
  Brain,
  Layers,
} from 'lucide-react';

interface StudentDetailViewProps {
  student: Student12thGrade;
  onBack: () => void;
  onUpdateStudent: (updated: Student12thGrade) => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  student,
  onBack,
  onUpdateStudent,
}) => {
  const [selectedExamTab, setSelectedExamTab] = useState<'TYT' | 'AYT'>('TYT');
  const [activeSubjectModal, setActiveSubjectModal] = useState<SubjectNetDetail | null>(null);
  const [kazanimFilter, setKazanimFilter] = useState<'all' | 'struggling' | 'mastered'>('all');
  
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  // Modals state
  const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);

  // Add Exam Modal Tab
  const [addExamTab, setAddExamTab] = useState<'manual' | 'document'>('document');
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Edit Student Form State
  const [editName, setEditName] = useState(student.name);
  const [editStudentNo, setEditStudentNo] = useState(student.studentNo);
  const [editClassName, setEditClassName] = useState(student.className);
  const [editBranch, setEditBranch] = useState(student.branch);
  const [editMentorNote, setEditMentorNote] = useState(student.mentorNote);
  const [editAvatarUrl, setEditAvatarUrl] = useState(student.avatarUrl);

  // Add Exam Form State
  const [newExamName, setNewExamName] = useState('');
  const [newExamType, setNewExamType] = useState<'TYT' | 'AYT'>('TYT');
  const [newExamDate, setNewExamDate] = useState('Ağustos 2026');
  const [newTotalNet, setNewTotalNet] = useState('');
  
  // Optional subject nets for manual entry
  const [sub1Net, setSub1Net] = useState('');
  const [sub2Net, setSub2Net] = useState('');
  const [sub3Net, setSub3Net] = useState('');
  const [sub4Net, setSub4Net] = useState('');

  // Parsed Optical Document Data
  const [parsedExamData, setParsedExamData] = useState<ReturnType<typeof parseOpticalDocument> | null>(null);

  // PDF Export trigger
  const handleExportPDF = () => {
    generateStudentProgramPDF(student);
  };

  // Open Edit Modal with current values
  const handleOpenEditModal = () => {
    setEditName(student.name);
    setEditStudentNo(student.studentNo);
    setEditClassName(student.className);
    setEditBranch(student.branch);
    setEditMentorNote(student.mentorNote);
    setEditAvatarUrl(student.avatarUrl);
    setIsEditInfoModalOpen(true);
  };

  // Submit Student Info Edit
  const handleSaveStudentInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Lütfen öğrenci adı ve soyadını giriniz.');
      return;
    }

    const updated: Student12thGrade = {
      ...student,
      name: editName,
      studentNo: editStudentNo,
      className: editClassName as any,
      branch: editBranch as any,
      mentorNote: editMentorNote,
      avatarUrl: editAvatarUrl || student.avatarUrl,
    };

    onUpdateStudent(updated);
    setIsEditInfoModalOpen(false);
    setAiSuccessMsg('Öğrenci bilgileri güncellendi.');
  };

  // Handle Optical Document Upload Simulation
  const handleProcessDocumentUpload = (fileName: string) => {
    setUploadedFileName(fileName);
    setIsScanningFile(true);

    setTimeout(() => {
      const parsed = parseOpticalDocument(fileName, newExamType);
      setParsedExamData(parsed);
      setNewExamName(parsed.examName);
      setNewTotalNet(parsed.totalNet.toString());
      setIsScanningFile(false);
    }, 1000);
  };

  // Trigger file selection via file input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleProcessDocumentUpload(file.name);
    }
  };

  // Submit New Trial Exam Result (Manual or Document)
  const handleSaveNewExam = (e: React.FormEvent) => {
    e.preventDefault();
    const netVal = parseFloat(newTotalNet);
    if (!newExamName.trim() || isNaN(netVal)) {
      alert('Lütfen geçerli bir sınav adı ve toplam net değeri giriniz.');
      return;
    }

    // Build history entry
    const newHistoryEntry = {
      examTitle: newExamName,
      date: newExamDate,
      tytNet: newExamType === 'TYT' ? netVal : student.latestTyt.totalNet,
      aytNet: newExamType === 'AYT' ? netVal : student.latestAyt.totalNet,
    };

    const updatedHistory = [...student.history, newHistoryEntry];

    // If data comes from parsed document
    if (addExamTab === 'document' && parsedExamData) {
      const updatedStudent: Student12thGrade = {
        ...student,
        latestTyt: newExamType === 'TYT' ? parsedExamData : student.latestTyt,
        latestAyt: newExamType === 'AYT' ? parsedExamData : student.latestAyt,
        history: updatedHistory,
      };

      onUpdateStudent(updatedStudent);
    } else {
      // Manual build breakdown for latest exam view
      if (newExamType === 'TYT') {
        const tyt1 = parseFloat(sub1Net) || Math.round(netVal * 0.38);
        const tyt2 = parseFloat(sub2Net) || Math.round(netVal * 0.35);
        const tyt3 = parseFloat(sub3Net) || Math.round(netVal * 0.17);
        const tyt4 = parseFloat(sub4Net) || Math.round(netVal * 0.10);

        const updatedTyt = {
          examName: newExamName,
          examDate: newExamDate,
          totalNet: netVal,
          rankInSchool: student.latestTyt.rankInSchool,
          subjects: [
            {
              subjectName: 'Türkçe',
              questionCount: 40,
              correct: Math.min(40, Math.ceil(tyt1 * 1.05)),
              wrong: 3,
              blank: 1,
              net: tyt1,
              accuracyRate: Math.min(100, Math.round((tyt1 / 40) * 100)),
              kazanimlar: generateKazanimlarForSubject('Türkçe', Math.ceil(tyt1 * 1.05), 3, 1),
            },
            {
              subjectName: 'Temel Matematik',
              questionCount: 40,
              correct: Math.min(40, Math.ceil(tyt2 * 1.05)),
              wrong: 3,
              blank: 1,
              net: tyt2,
              accuracyRate: Math.min(100, Math.round((tyt2 / 40) * 100)),
              kazanimlar: generateKazanimlarForSubject('Temel Matematik', Math.ceil(tyt2 * 1.05), 3, 1),
            },
            {
              subjectName: 'Fen Bilimleri',
              questionCount: 20,
              correct: Math.min(20, Math.ceil(tyt3 * 1.05)),
              wrong: 2,
              blank: 1,
              net: tyt3,
              accuracyRate: Math.min(100, Math.round((tyt3 / 20) * 100)),
              kazanimlar: generateKazanimlarForSubject('Fen Bilimleri', Math.ceil(tyt3 * 1.05), 2, 1),
            },
            {
              subjectName: 'Sosyal Bilimler',
              questionCount: 20,
              correct: Math.min(20, Math.ceil(tyt4 * 1.05)),
              wrong: 2,
              blank: 1,
              net: tyt4,
              accuracyRate: Math.min(100, Math.round((tyt4 / 20) * 100)),
              kazanimlar: generateKazanimlarForSubject('Sosyal Bilimler', Math.ceil(tyt4 * 1.05), 2, 1),
            },
          ],
        };

        const updatedStudent: Student12thGrade = {
          ...student,
          latestTyt: updatedTyt,
          history: updatedHistory,
        };

        onUpdateStudent(updatedStudent);
      } else {
        const ayt1 = parseFloat(sub1Net) || Math.round(netVal * 0.42);
        const ayt2 = parseFloat(sub2Net) || Math.round(netVal * 0.20);
        const ayt3 = parseFloat(sub3Net) || Math.round(netVal * 0.19);
        const ayt4 = parseFloat(sub4Net) || Math.round(netVal * 0.19);

        const updatedAyt = {
          examName: newExamName,
          examDate: newExamDate,
          totalNet: netVal,
          rankInSchool: student.latestAyt.rankInSchool,
          subjects: [
            {
              subjectName: 'AYT Matematik',
              questionCount: 40,
              correct: Math.min(40, Math.ceil(ayt1 * 1.05)),
              wrong: 3,
              blank: 1,
              net: ayt1,
              accuracyRate: Math.min(100, Math.round((ayt1 / 40) * 100)),
              kazanimlar: generateKazanimlarForSubject('AYT Matematik', Math.ceil(ayt1 * 1.05), 3, 1),
            },
            {
              subjectName: 'AYT Fizik',
              questionCount: 14,
              correct: Math.min(14, Math.ceil(ayt2 * 1.05)),
              wrong: 1,
              blank: 1,
              net: ayt2,
              accuracyRate: Math.min(100, Math.round((ayt2 / 14) * 100)),
              kazanimlar: generateKazanimlarForSubject('AYT Fizik', Math.ceil(ayt2 * 1.05), 1, 1),
            },
            {
              subjectName: 'AYT Kimya',
              questionCount: 13,
              correct: Math.min(13, Math.ceil(ayt3 * 1.05)),
              wrong: 1,
              blank: 1,
              net: ayt3,
              accuracyRate: Math.min(100, Math.round((ayt3 / 13) * 100)),
              kazanimlar: generateKazanimlarForSubject('AYT Kimya', Math.ceil(ayt3 * 1.05), 1, 1),
            },
            {
              subjectName: 'AYT Biyoloji',
              questionCount: 13,
              correct: Math.min(13, Math.ceil(ayt4 * 1.05)),
              wrong: 1,
              blank: 1,
              net: ayt4,
              accuracyRate: Math.min(100, Math.round((ayt4 / 13) * 100)),
              kazanimlar: generateKazanimlarForSubject('AYT Biyoloji', Math.ceil(ayt4 * 1.05), 1, 1),
            },
          ],
        };

        const updatedStudent: Student12thGrade = {
          ...student,
          latestAyt: updatedAyt,
          history: updatedHistory,
        };

        onUpdateStudent(updatedStudent);
      }
    }

    setIsAddExamModalOpen(false);
    setNewExamName('');
    setNewTotalNet('');
    setSub1Net('');
    setSub2Net('');
    setSub3Net('');
    setSub4Net('');
    setUploadedFileName('');
    setParsedExamData(null);
    setAiSuccessMsg(`Yeni ${newExamType} deneme sonucu belgelerdeki branş ve kazanım analizi ile eklendi!`);
  };

  // Add a specific struggling kazanım directly into student's weekly study schedule
  const handleAddKazanimToSchedule = (topicName: string, subjectName: string) => {
    const newTask: ScheduleTask = {
      id: `task-kazanim-${Date.now()}`,
      subject: subjectName,
      topic: topicName,
      focusType: 'Eksik Konu (Ağırlıklı Odak)',
      questionTarget: 35,
      detail: 'Denemedeki eksik kazanıma yönelik çözümlü soru bankası takibi.',
      isWeakTopic: true,
    };

    const updatedProgram = student.weeklyProgram.map((day, idx) => {
      if (idx === 0) {
        return { ...day, tasks: [newTask, ...day.tasks] };
      }
      return day;
    });

    const updatedStudent: Student12thGrade = {
      ...student,
      weeklyProgram: updatedProgram,
    };

    onUpdateStudent(updatedStudent);
    setAiSuccessMsg(`"${topicName}" eksik kazanımı Pazartesi ders programına eklendi!`);
  };

  // Re-balance schedule with AI endpoint
  const handleRebalanceScheduleWithAI = async () => {
    setIsAiGenerating(true);
    setAiSuccessMsg('');

    try {
      const response = await fetch('/api/generate-weekly-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          branch: student.branch,
          weakTopics: student.decliningKazanimlar.map((d) => `${d.subject}: ${d.topicName}`),
          strongTopics: student.improvingKazanimlar.map((i) => `${i.subject}: ${i.topicName}`),
        }),
      });

      const data = await response.json();

      if (data.schedule && Array.isArray(data.schedule)) {
        const updatedProgram = student.weeklyProgram.map((day) => {
          const aiDay = data.schedule.find((d: any) => d.dayName.toLowerCase() === day.dayName.toLowerCase());
          if (aiDay && aiDay.tasks) {
            return {
              ...day,
              tasks: aiDay.tasks.map((t: any, idx: number) => {
                const sub = t.subject || 'Ders';
                const isMandatory = sub.includes('TYT Türkçe') || sub.includes('TYT Matematik');
                return {
                  id: `ai-t-${day.dayName}-${idx}`,
                  subject: sub,
                  topic: t.topic || 'Konu',
                  focusType: t.focusType || (isMandatory ? 'Zorunlu Ortak Ders' : 'Ağırlıklı Odak'),
                  questionTarget: t.questionTarget || (isMandatory ? 30 : 25),
                  detail: t.detail || 'Konu tekrarı ve soru çözümü',
                  isMandatoryCommon: isMandatory,
                  isWeakTopic: !isMandatory,
                };
              }),
            };
          }
          return day;
        });

        const updatedStudent: Student12thGrade = {
          ...student,
          mentorNote: data.mentorNote || student.mentorNote,
          weeklyProgram: updatedProgram,
        };

        onUpdateStudent(updatedStudent);
        setAiSuccessMsg('Program Gemini AI tarafından zayıf konulara ağırlık verilecek şekilde güncellendi!');
      } else {
        setAiSuccessMsg('Program güncellendi.');
      }
    } catch (e) {
      console.error('AI schedule balancing failed', e);
      setAiSuccessMsg('AI servisi yanıt vermedi, mevcut dengeli program korundu.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Construct chart data points for TYT and AYT
  const tytChartData: ExamHistoryPoint[] = student.history.map((h) => ({
    examTitle: h.examTitle,
    date: h.date,
    net: h.tytNet,
  }));

  const aytChartData: ExamHistoryPoint[] = student.history.map((h) => ({
    examTitle: h.examTitle,
    date: h.date,
    net: h.aytNet,
  }));

  // Resolve active subject's full kazanım list
  const activeSubjectKazanimlar: SubjectKazanimDetail[] = activeSubjectModal
    ? activeSubjectModal.kazanimlar ||
      generateKazanimlarForSubject(
        activeSubjectModal.subjectName,
        activeSubjectModal.correct,
        activeSubjectModal.wrong,
        activeSubjectModal.blank
      )
    : [];

  const filteredKazanimlar = activeSubjectKazanimlar.filter((k) => {
    if (kazanimFilter === 'struggling') return k.status === 'struggling' || k.status === 'blank';
    if (kazanimFilter === 'mastered') return k.status === 'mastered';
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 border border-slate-700/80 px-4 py-2.5 rounded-xl transition cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Öğrenci Listesine Dön</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenEditModal}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2.5 rounded-xl transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>Öğrenci Bilgilerini Düzenle</span>
          </button>

          <button
            onClick={() => setIsAddExamModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-2.5 rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Yeni Deneme / Optik Belge Ekle</span>
          </button>

          <button
            onClick={handleRebalanceScheduleWithAI}
            disabled={isAiGenerating}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-amber-400 ${isAiGenerating ? 'animate-spin' : ''}`} />
            <span>{isAiGenerating ? 'Dengeliyor...' : 'AI Program Dengele'}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 px-3.5 py-2.5 rounded-xl transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>PDF İndir</span>
          </button>
        </div>
      </div>

      {aiSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 text-sm font-medium animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{aiSuccessMsg}</span>
          </div>
          <button onClick={() => setAiSuccessMsg('')} className="text-emerald-400 font-bold text-xs p-1">
            ✕
          </button>
        </div>
      )}

      {/* Student Overview Header Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg shrink-0"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white">{student.name}</h1>
                <span className="px-3 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-lg">
                  {student.className}
                </span>
                <button
                  onClick={handleOpenEditModal}
                  title="Öğrenci Bilgilerini Güncelle"
                  className="p-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-400 font-medium">
                <span>Öğrenci No: <strong className="text-slate-200">{student.studentNo}</strong></span>
                <span>•</span>
                <span>Alan: <strong className="text-indigo-400 font-semibold">{student.branch}</strong></span>
              </div>

              {/* Mentor Note Box */}
              <div className="mt-3 p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs text-slate-300 max-w-2xl flex items-start gap-2">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">Mentör Özel Notu: </span>
                  <span>{student.mentorNote}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Trial Net Summary & Add Exam Button */}
          <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-slate-700/60 pt-4 md:pt-0">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl px-5 py-3 text-center min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Son TYT Net</span>
                <span className="text-2xl font-black text-emerald-400">{student.latestTyt.totalNet}</span>
              </div>

              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl px-5 py-3 text-center min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Son AYT Net</span>
                <span className="text-2xl font-black text-indigo-400">{student.latestAyt.totalNet}</span>
              </div>
            </div>

            <button
              onClick={() => setIsAddExamModalOpen(true)}
              className="w-full text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Deneme / Optik Belge Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: DENEMELER ARASI NET YÜKSELİŞ VE DÜŞÜŞ ŞEMALARI (TYT & AYT)  */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <span>Denemeler Arası Toplam Net Yükseliş & Düşüş Şemaları</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Girdiğiniz veya optik belgeden yüklediğiniz her deneme sınavı buradaki TYT ve AYT grafiklerine anında yansır. Sınavlar arasındaki toplam net dalgalanmalarını takip edebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TYT Toplam Net Dalgalanma Şeması */}
          <ExamTrendChart
            title="TYT Denemeleri Toplam Net İlerleme Şeması"
            examType="TYT"
            data={tytChartData}
            accentColor="emerald"
          />

          {/* AYT Toplam Net Dalgalanma Şeması */}
          <ExamTrendChart
            title="AYT Denemeleri Toplam Net İlerleme Şeması"
            examType="AYT"
            data={aytChartData}
            accentColor="indigo"
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 2: SON DENEME SONUCU & BRANŞLARA TIKLAYINCA KAZANIM ANALİZİ   */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span>Son Deneme Sınavı Branş Analizi (Kazanım Detayı İçin Derslere Tıklayın)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Her bir branşa (ör. AYT Matematik, Türkçe) tıkladığınızda o denemede sorulan tüm kazanımlar ve takılınan konular açılır.
            </p>
          </div>

          {/* Mobile Tab Toggle */}
          <div className="flex md:hidden bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setSelectedExamTab('TYT')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedExamTab === 'TYT' ? 'bg-emerald-600 text-white' : 'text-slate-400'
              }`}
            >
              TYT
            </button>
            <button
              onClick={() => setSelectedExamTab('AYT')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedExamTab === 'AYT' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              AYT
            </button>
          </div>
        </div>

        {/* Side by Side Grid for Desktop, Tabbed for Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SOL KOLON: TYT DENEME SONUCU */}
          <div className={`space-y-4 ${selectedExamTab === 'TYT' ? 'block' : 'hidden md:block'}`}>
            <div className="bg-slate-800/90 border border-emerald-500/30 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                    TYT
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">TYT Sınav Sonucu</h3>
                    <p className="text-xs text-slate-400">{student.latestTyt.examName}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Toplam TYT Net</span>
                  <span className="text-xl font-black text-emerald-400">{student.latestTyt.totalNet} Net</span>
                </div>
              </div>

              {/* Subject Breakdown List */}
              <div className="space-y-3">
                {student.latestTyt.subjects.map((subj) => (
                  <div
                    key={subj.subjectName}
                    onClick={() => {
                      setActiveSubjectModal(subj);
                      setKazanimFilter('all');
                    }}
                    className="p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/60 hover:border-emerald-500/50 rounded-xl transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition">
                          {subj.subjectName}
                        </span>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                          <Layers className="w-3 h-3 text-indigo-400" />
                          Kazanımları İncele
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-400">{subj.net} Net</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span>Doğru: <strong className="text-emerald-400">{subj.correct}</strong></span>
                      <span>Yanlış: <strong className="text-rose-400">{subj.wrong}</strong></span>
                      <span>Boş: <strong className="text-amber-400">{subj.blank}</strong></span>
                      <span>Başarı: %{subj.accuracyRate}</span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${subj.accuracyRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SAĞ KOLON: AYT DENEME SONUCU */}
          <div className={`space-y-4 ${selectedExamTab === 'AYT' ? 'block' : 'hidden md:block'}`}>
            <div className="bg-slate-800/90 border border-indigo-500/30 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm">
                    AYT
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">AYT Sınav Sonucu</h3>
                    <p className="text-xs text-slate-400">{student.latestAyt.examName}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Toplam AYT Net</span>
                  <span className="text-xl font-black text-indigo-400">{student.latestAyt.totalNet} Net</span>
                </div>
              </div>

              {/* Subject Breakdown List */}
              <div className="space-y-3">
                {student.latestAyt.subjects.map((subj) => (
                  <div
                    key={subj.subjectName}
                    onClick={() => {
                      setActiveSubjectModal(subj);
                      setKazanimFilter('all');
                    }}
                    className="p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition">
                          {subj.subjectName}
                        </span>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                          <Layers className="w-3 h-3 text-indigo-400" />
                          Kazanımları İncele
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-400">{subj.net} Net</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span>Doğru: <strong className="text-emerald-400">{subj.correct}</strong></span>
                      <span>Yanlış: <strong className="text-rose-400">{subj.wrong}</strong></span>
                      <span>Boş: <strong className="text-amber-400">{subj.blank}</strong></span>
                      <span>Başarı: %{subj.accuracyRate}</span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${subj.accuracyRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 3: KAZANIM ANALİZİ (GELİŞİM GÖSTERİLEN VE DÜŞÜŞTE OLANLAR)    */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>Genel Kazanım Gelişim & Düşüş Özeti</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GELİŞİM GÖSTERİLEN KAZANIMLAR */}
          <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 pb-2 border-b border-slate-700/80">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Gelişim Gösterdiği Kazanımlar</h3>
            </div>

            {student.improvingKazanimlar.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-900/80 border border-emerald-500/20 rounded-xl space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md">
                    {item.subject}
                  </span>
                  <span className="text-xs font-black text-emerald-400">{item.changeRate}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">{item.topicName}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{item.detailNote}</p>
              </div>
            ))}
          </div>

          {/* DÜŞÜŞTE OLAN KAZANIMLAR */}
          <div className="bg-slate-800/80 border border-rose-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 pb-2 border-b border-slate-700/80">
              <TrendingDown className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Düşüşte Olan Kazanımlar (Öncelikli Odak)</h3>
            </div>

            {student.decliningKazanimlar.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-900/80 border border-rose-500/20 rounded-xl space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-md">
                    {item.subject}
                  </span>
                  <span className="text-xs font-black text-rose-400">{item.changeRate}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">{item.topicName}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{item.detailNote}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 4: HAFTALIK DERS PROGRAMI TABLOSU                              */}
      {/* ===================================================================== */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 space-y-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-black text-white">Kişiselleştirilmiş Haftalık Çalışma Programı Tablosu</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Saatler gösterilmez; öğrenci çalışma saatlerini kendi belirler. <strong className="text-emerald-400 font-semibold">TYT Türkçe</strong> ve <strong className="text-emerald-400 font-semibold">TYT Matematik</strong> her gün zorunlu ortak derstir. Soru sayıları öğrencinin akademik seviyesine özel ayarlanmıştır.
            </p>
          </div>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Tablo PDF Olarak İndir</span>
          </button>
        </div>

        {/* Informational Banner for Rules */}
        <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Her Gün Ortak Dersler:</strong> TYT Türkçe & TYT Matematik (Tüm öğrenciler için zorunlu)</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Seviyeye Özel Soru Hedefi:</strong> Toplam Net: {student.latestTyt.totalNet + student.latestAyt.totalNet} Net seviyesine özel hedeflenmiştir.</span>
          </div>
        </div>

        {/* Tabular Weekly View across 7 Days */}
        <div className="overflow-x-auto rounded-xl border border-slate-700/80">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-900/90 text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
                {student.weeklyProgram.map((day) => (
                  <th key={day.dayName} className="p-3.5 border-r border-slate-700/60 last:border-r-0 min-w-[140px] bg-slate-900/90">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-300 font-black">{day.dayName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{day.tasks.length} Görev</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs">
              <tr className="bg-slate-800/40 align-top">
                {student.weeklyProgram.map((day) => (
                  <td key={day.dayName} className="p-2.5 border-r border-slate-700/60 last:border-r-0 space-y-2.5">
                    {day.tasks.map((task) => {
                      const isMandatory = task.isMandatoryCommon || task.subject.includes('TYT Türkçe') || task.subject.includes('TYT Matematik');
                      const isWeak = task.isWeakTopic || task.focusType.includes('Eksik');

                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-xl border transition space-y-1.5 ${
                            isMandatory
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : isWeak
                              ? 'bg-rose-500/10 border-rose-500/30'
                              : 'bg-slate-900/80 border-slate-700/60'
                          }`}
                        >
                          {/* Subject Header */}
                          <div className="flex items-center justify-between">
                            <span className={`font-black text-xs ${isMandatory ? 'text-emerald-300' : isWeak ? 'text-rose-300' : 'text-slate-200'}`}>
                              {task.subject}
                            </span>
                            {isMandatory && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">
                                Her Gün
                              </span>
                            )}
                          </div>

                          {/* Topic Details / Deneme Eksik Konusu */}
                          <div>
                            <p className="text-[11px] font-semibold text-slate-200 leading-snug">
                              {task.topic}
                            </p>
                            {task.detail && (
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                                {task.detail}
                              </p>
                            )}
                          </div>

                          {/* Target Question Count Badge */}
                          <div className="pt-1 border-t border-slate-700/40 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-medium">Hedef Soru:</span>
                            <span className="text-xs font-black text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                              {task.questionTarget || 30} Soru
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ÖĞRENCİ BİLGİLERİNİ DÜZENLE */}
      {isEditInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Öğrenci Bilgilerini Güncelle</h3>
              </div>
              <button
                onClick={() => setIsEditInfoModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Öğrenci İsim & Soyisim
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Okul Numarası
                  </label>
                  <input
                    type="text"
                    value={editStudentNo}
                    onChange={(e) => setEditStudentNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sınıf / Şube
                  </label>
                  <select
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="12-A Fen Bilimleri">12-A Fen Bilimleri</option>
                    <option value="12-B Sayısal">12-B Sayısal</option>
                    <option value="12-C Eşit Ağırlık">12-C Eşit Ağırlık</option>
                    <option value="12-D Dil">12-D Dil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Branş / Alan
                  </label>
                  <select
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Sayısal">Sayısal</option>
                    <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                    <option value="Sözel">Sözel</option>
                    <option value="Dil">Dil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Profil Fotoğrafı URL
                </label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mentör Özel Değerlendirme Notu
                </label>
                <textarea
                  rows={3}
                  value={editMentorNote}
                  onChange={(e) => setEditMentorNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditInfoModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-600 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: YENİ DENEME SONUCU VEYA OPTİK BELGE YÜKLE */}
      {isAddExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Yeni Deneme Sınavı Ekleyin</h3>
              </div>
              <button
                onClick={() => {
                  setIsAddExamModalOpen(false);
                  setParsedExamData(null);
                }}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Tabs: Document vs Manual */}
            <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setAddExamTab('document')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                  addExamTab === 'document'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Belge / Optik Karne Yükle (Otomatik)</span>
              </button>

              <button
                type="button"
                onClick={() => setAddExamTab('manual')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                  addExamTab === 'manual'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Manuel Net Girişi</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewExam} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sınav Türü
                  </label>
                  <select
                    value={newExamType}
                    onChange={(e) => {
                      const t = e.target.value as 'TYT' | 'AYT';
                      setNewExamType(t);
                      if (uploadedFileName) {
                        handleProcessDocumentUpload(uploadedFileName);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TYT">TYT (Temel Yeterlilik)</option>
                    <option value="AYT">AYT (Alan Yeterlilik)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sınav Tarihi / Dönemi
                  </label>
                  <input
                    type="text"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    placeholder="Örn: Ağustos 2026"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* TAB 1: BELGE YÜKLEME SEKME DÜZENİ */}
              {addExamTab === 'document' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-500 bg-slate-900/80 rounded-2xl p-6 text-center transition cursor-pointer relative group">
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.csv,.png,.jpg"
                      onChange={handleFileInputChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-white">
                      Optik Sınav Karnesi, PDF veya Excel Belgenizi Sürükleyin veya Seçin
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Desteklenen formatlar: PDF, XLSX, CSV, Optik Resim (Max 15MB)
                    </p>
                  </div>

                  {/* Sample Optical Report Preset Buttons */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">
                      Veya Hazır Sınav Belgesi Örneği Seçin:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleProcessDocumentUpload('2026_Türkiye_Geneli_TYT_4_Optik_Karne.pdf')}
                        className="p-2.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition flex items-center gap-2 cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-200 truncate">Türkiye Geneli TYT-4 Optik.pdf</p>
                          <p className="text-[10px] text-slate-400">4 Branş + Kazanımlar</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleProcessDocumentUpload('3D_Yayinlari_AYT_Deneme_Karnesi.xlsx')}
                        className="p-2.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition flex items-center gap-2 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-200 truncate">3D Yayınları AYT Karnesi.xlsx</p>
                          <p className="text-[10px] text-slate-400">AYT Fen & Mat Kazanımları</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Scanning State Indicator */}
                  {isScanningFile && (
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center gap-3 text-indigo-300 text-xs font-medium animate-pulse">
                      <Brain className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                      <span>Belge taranıyor... Tüm branşlardan doğru, yanlış, net ve kazanım verileri otomatik çıkarılıyor.</span>
                    </div>
                  )}

                  {/* Document Extraction Preview Result */}
                  {parsedExamData && !isScanningFile && (
                    <div className="p-4 bg-slate-900 rounded-2xl border border-emerald-500/40 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Belgeden Okunan Veri Özeti</span>
                        </div>
                        <span className="text-xs font-black text-emerald-400">Toplam: {parsedExamData.totalNet} Net</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {parsedExamData.subjects.map((subj) => (
                          <div key={subj.subjectName} className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-center">
                            <span className="text-[10px] text-slate-400 font-semibold block truncate">{subj.subjectName}</span>
                            <span className="text-xs font-black text-indigo-300">{subj.net} Net</span>
                            <span className="text-[9px] text-emerald-400 block mt-0.5">{subj.kazanimlar?.length || 4} Kazanım Taranmış</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MANUEL GİRİŞ SEKME DÜZENİ */}
              {addExamTab === 'manual' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Deneme Sınavı Adı
                    </label>
                    <input
                      type="text"
                      value={newExamName}
                      onChange={(e) => setNewExamName(e.target.value)}
                      placeholder="Örn: 2026 Türkiye Geneli Özdebir TYT-5"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Toplam Net
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      value={newTotalNet}
                      onChange={(e) => setNewTotalNet(e.target.value)}
                      placeholder="Örn: 92.5"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Optional Subject Nets Input */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700 space-y-2">
                    <p className="text-xs font-bold text-slate-300">Ders Bazlı Net Girişi (Opsiyonel):</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          {newExamType === 'TYT' ? 'Türkçe Net' : 'AYT Mat Net'}
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          value={sub1Net}
                          onChange={(e) => setSub1Net(e.target.value)}
                          placeholder="Örn: 32.5"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          {newExamType === 'TYT' ? 'Temel Mat Net' : 'AYT Fizik Net'}
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          value={sub2Net}
                          onChange={(e) => setSub2Net(e.target.value)}
                          placeholder="Örn: 28.0"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          {newExamType === 'TYT' ? 'Fen Net' : 'AYT Kimya Net'}
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          value={sub3Net}
                          onChange={(e) => setSub3Net(e.target.value)}
                          placeholder="Örn: 16.25"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          {newExamType === 'TYT' ? 'Sosyal Net' : 'AYT Biyoloji Net'}
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          value={sub4Net}
                          onChange={(e) => setSub4Net(e.target.value)}
                          placeholder="Örn: 11.5"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddExamModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-600 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  Denemeyi Kaydet ve Grafiklere Yansıt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: DERS / BRANŞ DETAYI & O DENEMEDE SORULAN KAZANIMLAR MODALI   */}
      {/* ===================================================================== */}
      {activeSubjectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-xl font-bold text-white">{activeSubjectModal.subjectName} Sınav & Kazanım Analizi</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Bu deneme sınavında {activeSubjectModal.subjectName} dersinden sorulan tüm kazanımlar ve öğrencinin başarı durumu
                </p>
              </div>
              <button
                onClick={() => setActiveSubjectModal(null)}
                className="text-slate-400 hover:text-white text-sm font-bold bg-slate-700/60 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Grid Cards */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Doğru</span>
                <span className="text-xl font-black text-emerald-400">{activeSubjectModal.correct}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Yanlış</span>
                <span className="text-xl font-black text-rose-400">{activeSubjectModal.wrong}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Boş</span>
                <span className="text-xl font-black text-amber-400">{activeSubjectModal.blank}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Toplam Net</span>
                <span className="text-xl font-black text-indigo-400">{activeSubjectModal.net}</span>
              </div>
            </div>

            {/* Kazanım List Filter Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ListFilter className="w-4 h-4 text-indigo-400" />
                <span>Denemede Sorulan Kazanımlar ({activeSubjectKazanimlar.length}):</span>
              </span>

              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  onClick={() => setKazanimFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    kazanimFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setKazanimFilter('struggling')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    kazanimFilter === 'struggling' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Takıldığı / Eksikler
                </button>
                <button
                  onClick={() => setKazanimFilter('mastered')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    kazanimFilter === 'mastered' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Başarılı
                </button>
              </div>
            </div>

            {/* Detailed Kazanım Items List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {filteredKazanimlar.map((kazanim, idx) => {
                const isStruggling = kazanim.status === 'struggling';
                const isBlank = kazanim.status === 'blank';

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border space-y-2 transition ${
                      isStruggling
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : isBlank
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-slate-900/80 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isStruggling ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : isBlank ? (
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <h4 className="text-sm font-bold text-white">{kazanim.topicName}</h4>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isStruggling
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isBlank
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {isStruggling
                          ? 'Takıldığı / Eksik Kazanım'
                          : isBlank
                          ? 'Boş Bırakıldı'
                          : 'Tam Başarılı'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pl-6">
                      <span>
                        Sorulan Soru: <strong className="text-slate-200">{kazanim.questionCount} Adet</strong>
                      </span>
                      <span>
                        Doğru: <strong className="text-emerald-400">{kazanim.correctCount}</strong> | Yanlış:{' '}
                        <strong className="text-rose-400">{kazanim.wrongCount}</strong> | Boş:{' '}
                        <strong className="text-amber-400">{kazanim.blankCount}</strong>
                      </span>
                    </div>

                    {/* Mentör Recommendation & Quick Action */}
                    {kazanim.recommendation && (
                      <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                        <span>💡 {kazanim.recommendation}</span>

                        {(isStruggling || isBlank) && (
                          <button
                            onClick={() => handleAddKazanimToSchedule(kazanim.topicName, activeSubjectModal.subjectName)}
                            className="text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 px-2.5 py-1 rounded-md transition cursor-pointer shrink-0 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Programıma Ekle
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-700">
              <button
                onClick={() => setActiveSubjectModal(null)}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
