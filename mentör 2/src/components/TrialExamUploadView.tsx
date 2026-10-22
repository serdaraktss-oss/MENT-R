import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Users,
  Eye,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Shield,
  X,
  BarChart2,
  BarChart3,
  Search,
  Filter,
  Check,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Student12thGrade, SubjectNetDetail, TrialExamRecord, ExamBreakdown } from '../types';
import { getStudentGender } from '../utils/studentAvatar';

interface TrialExamUploadViewProps {
  students: Student12thGrade[];
  onUpdateStudents: (updatedStudents: Student12thGrade[]) => void;
  onNavigateToStudent?: (student: Student12thGrade) => void;
  isManager?: boolean;
  teacherName?: string;
}

interface ParsedSubjectItem {
  subjectName: string;
  questionCount: number;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
}

interface ParsedStudentRow {
  id: string;
  scannedName: string;
  matchedStudentId: string; // ID of existing student, or 'new'
  studentNo: string;
  className: string;
  branch: 'Sayısal' | 'Eşit Ağırlık' | 'Sözel' | 'Dil';
  subjects: ParsedSubjectItem[];
  totalNet: number;
  prevTotalNet?: number;
  deltaTotalNet?: number;
  deltaTotalRate?: number;
  branchDeltas?: Record<string, number>;
  branchRates?: Record<string, number>;
}

interface UploadedImageItem {
  id: string;
  name: string;
  base64: string;
  previewUrl?: string;
  size: string;
}

interface ExamPageState {
  examNumber: number;
  examType: 'TYT' | 'AYT';
  examTitle: string;
  examDate: string;
  image1: UploadedImageItem | null; // 1. Görsel (Sayfa 1 / Sol Liste)
  image2: UploadedImageItem | null; // 2. Görsel (Sayfa 2 / Sağ Liste)
  parsedRows: ParsedStudentRow[];
  isAnalyzed: boolean;
  isSaved: boolean;
}

export const TrialExamUploadView: React.FC<TrialExamUploadViewProps> = ({
  students,
  onUpdateStudents,
  onNavigateToStudent,
  isManager = true,
  teacherName = 'Serdar Aktaş',
}) => {
  // Main Tab Mode: 'TYT' | 'AYT' | 'ANALYTICS' | 'MANAGE'
  const [activeTabMode, setActiveTabMode] = useState<'TYT' | 'AYT' | 'ANALYTICS' | 'MANAGE'>('TYT');
  const activeExamType: 'TYT' | 'AYT' = activeTabMode === 'AYT' ? 'AYT' : 'TYT';

  // Current active exam number for TYT and AYT
  const [selectedTytNumber, setSelectedTytNumber] = useState<number>(1);
  const [selectedAytNumber, setSelectedAytNumber] = useState<number>(1);
  const currentExamNumber = activeExamType === 'TYT' ? selectedTytNumber : selectedAytNumber;

  // Key-value store for exam pages: Key is `${examType}_${examNumber}` (e.g., 'TYT_1', 'TYT_2', 'AYT_1')
  // Hydrated from localStorage and server
  const [examPages, setExamPages] = useState<Record<string, ExamPageState>>(() => {
    try {
      const saved = localStorage.getItem('yks_trial_exam_pages');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {};
  });

  // Load exam pages from server on mount
  useEffect(() => {
    fetch('/api/trial-exam-pages')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.pages && Object.keys(data.pages).length > 0) {
          setExamPages((prev) => ({
            ...data.pages,
            ...prev,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Save examPages to localStorage and server whenever updated (stripped of heavy base64 to prevent QuotaExceededError)
  useEffect(() => {
    if (Object.keys(examPages).length === 0) return;
    try {
      const sanitized: Record<string, any> = {};
      Object.entries(examPages).forEach(([k, val]) => {
        const v = val as ExamPageState;
        sanitized[k] = {
          ...v,
          image1: v.image1 ? { id: v.image1.id, name: v.image1.name, previewUrl: v.image1.previewUrl?.startsWith('/uploads') ? v.image1.previewUrl : '', size: v.image1.size } : null,
          image2: v.image2 ? { id: v.image2.id, name: v.image2.name, previewUrl: v.image2.previewUrl?.startsWith('/uploads') ? v.image2.previewUrl : '', size: v.image2.size } : null,
        };
      });
      localStorage.setItem('yks_trial_exam_pages', JSON.stringify(sanitized));
      fetch('/api/trial-exam-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized),
      }).catch(() => {});
    } catch (e) {
      console.warn('Local storage examPages save warning:', e);
    }
  }, [examPages]);

  // Current key for active exam type & number
  const currentKey = `${activeExamType}_${currentExamNumber}`;

  // Helper to get or create page state (also recovers student data if already saved in student.trialExams)
  const currentPageState = useMemo<ExamPageState>(() => {
    if (examPages[currentKey]) {
      return examPages[currentKey];
    }

    // Check if students already have records for this exam
    const existingRecordsForExam = students.filter((s) =>
      (s.trialExams || []).some(
        (e) => e.examType === activeExamType && e.examNumber === currentExamNumber
      )
    );

    let initialRows: ParsedStudentRow[] = [];
    let initialTitle = `2026 Türkiye Geneli ${activeExamType} Deneme-${currentExamNumber}`;
    let initialDate = new Date().toISOString().split('T')[0];

    if (existingRecordsForExam.length > 0) {
      initialRows = existingRecordsForExam.map((s, idx) => {
        const rec = s.trialExams!.find(
          (e) => e.examType === activeExamType && e.examNumber === currentExamNumber
        )!;
        initialTitle = rec.examTitle || initialTitle;
        initialDate = rec.date || initialDate;

        const subjs: ParsedSubjectItem[] = rec.subjects.map((sub) => ({
          subjectName: sub.subjectName,
          questionCount: sub.questionCount || 40,
          correct: sub.correct || 0,
          wrong: sub.wrong || 0,
          blank: sub.blank || 0,
          net: sub.net || 0,
        }));

        const branchDeltas: Record<string, number> = {};
        const branchRates: Record<string, number> = {};
        rec.subjects.forEach((sub) => {
          if (sub.deltaNet !== undefined) {
            branchDeltas[sub.subjectName] = sub.deltaNet;
          }
          if (sub.deltaRate !== undefined) {
            branchRates[sub.subjectName] = sub.deltaRate;
          }
        });

        return {
          id: `saved-row-${s.id}-${currentExamNumber}`,
          scannedName: s.name,
          matchedStudentId: s.id,
          studentNo: s.studentNo,
          className: s.className,
          branch: s.branch,
          subjects: subjs,
          totalNet: rec.totalNet,
          prevTotalNet: rec.deltaTotalNet !== undefined ? Number((rec.totalNet - rec.deltaTotalNet).toFixed(2)) : undefined,
          deltaTotalNet: rec.deltaTotalNet,
          deltaTotalRate: rec.deltaTotalRate,
          branchDeltas,
          branchRates,
        };
      });
    }

    return {
      examNumber: currentExamNumber,
      examType: activeExamType,
      examTitle: initialTitle,
      examDate: initialDate,
      image1: null,
      image2: null,
      parsedRows: initialRows,
      isAnalyzed: initialRows.length > 0,
      isSaved: existingRecordsForExam.length > 0,
    };
  }, [examPages, currentKey, activeExamType, currentExamNumber, students]);

  // Updating current exam page helper
  const updateCurrentPage = (partial: Partial<ExamPageState>) => {
    const updated = {
      ...(examPages[currentKey] || currentPageState),
      ...partial,
    };
    setExamPages((prev) => ({
      ...prev,
      [currentKey]: updated,
    }));
  };

  // Scanning & UI state
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Lightbox preview modal for uploaded images
  const [previewImageModal, setPreviewImageModal] = useState<{ title: string; src: string } | null>(null);

  // Hidden file input refs for slot 1 and slot 2
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Deletion modals state (Serdar Aktaş Authority)
  const [examToDelete, setExamToDelete] = useState<{
    key: string;
    examType: 'TYT' | 'AYT';
    examNumber: number;
    examTitle: string;
    studentCount: number;
  } | null>(null);

  const [singleRecordToDelete, setSingleRecordToDelete] = useState<{
    studentId: string;
    studentName: string;
    examId: string;
    examTitle: string;
    examNumber: number;
    examType: string;
  } | null>(null);

  const [expandedExamKey, setExpandedExamKey] = useState<string | null>(null);

  // Analytics filter state
  const [analyticsExamType, setAnalyticsExamType] = useState<'ALL' | 'TYT' | 'AYT'>('TYT');
  const [analyticsSearchStudent, setAnalyticsSearchStudent] = useState('');
  const [analyticsSelectedBranch, setAnalyticsSelectedBranch] = useState<string>('all');

  // Direct exam-to-exam comparison selector state (Deneme X vs Deneme Y)
  const [compareExam1Num, setCompareExam1Num] = useState<number>(1);
  const [compareExam2Num, setCompareExam2Num] = useState<number>(2);

  // Standard Subject Templates (Full Detailed Sub-branches: Türkçe, Tarih, Coğrafya, Felsefe, Din Kültürü, Matematik, Fizik, Kimya, Biyoloji)
  const getStandardSubjects = (examType: 'TYT' | 'AYT', branch?: string): ParsedSubjectItem[] => {
    if (examType === 'TYT') {
      return [
        { subjectName: 'TYT Türkçe', questionCount: 40, correct: 0, wrong: 0, blank: 40, net: 0 },
        { subjectName: 'TYT Tarih', questionCount: 5, correct: 0, wrong: 0, blank: 5, net: 0 },
        { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 0, wrong: 0, blank: 5, net: 0 },
        { subjectName: 'TYT Felsefe', questionCount: 5, correct: 0, wrong: 0, blank: 5, net: 0 },
        { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 0, wrong: 0, blank: 5, net: 0 },
        { subjectName: 'TYT Matematik', questionCount: 40, correct: 0, wrong: 0, blank: 40, net: 0 },
        { subjectName: 'TYT Fizik', questionCount: 7, correct: 0, wrong: 0, blank: 7, net: 0 },
        { subjectName: 'TYT Kimya', questionCount: 7, correct: 0, wrong: 0, blank: 7, net: 0 },
        { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 0, wrong: 0, blank: 6, net: 0 },
      ];
    } else {
      if (branch === 'Sayısal') {
        return [
          { subjectName: 'AYT Matematik', questionCount: 40, correct: 0, wrong: 0, blank: 40, net: 0 },
          { subjectName: 'AYT Fizik', questionCount: 14, correct: 0, wrong: 0, blank: 14, net: 0 },
          { subjectName: 'AYT Kimya', questionCount: 13, correct: 0, wrong: 0, blank: 13, net: 0 },
          { subjectName: 'AYT Biyoloji', questionCount: 13, correct: 0, wrong: 0, blank: 13, net: 0 },
        ];
      } else if (branch === 'Eşit Ağırlık') {
        return [
          { subjectName: 'AYT Matematik', questionCount: 40, correct: 0, wrong: 0, blank: 40, net: 0 },
          { subjectName: 'AYT Edebiyat', questionCount: 24, correct: 0, wrong: 0, blank: 24, net: 0 },
          { subjectName: 'AYT Tarih', questionCount: 10, correct: 0, wrong: 0, blank: 10, net: 0 },
          { subjectName: 'AYT Coğrafya', questionCount: 6, correct: 0, wrong: 0, blank: 6, net: 0 },
        ];
      } else {
        return [
          { subjectName: 'AYT Matematik', questionCount: 40, correct: 0, wrong: 0, blank: 40, net: 0 },
          { subjectName: 'AYT Fizik', questionCount: 14, correct: 0, wrong: 0, blank: 14, net: 0 },
          { subjectName: 'AYT Kimya', questionCount: 13, correct: 0, wrong: 0, blank: 13, net: 0 },
          { subjectName: 'AYT Biyoloji', questionCount: 13, correct: 0, wrong: 0, blank: 13, net: 0 },
          { subjectName: 'AYT Edebiyat', questionCount: 24, correct: 0, wrong: 0, blank: 24, net: 0 },
          { subjectName: 'AYT Tarih', questionCount: 10, correct: 0, wrong: 0, blank: 10, net: 0 },
          { subjectName: 'AYT Coğrafya', questionCount: 6, correct: 0, wrong: 0, blank: 6, net: 0 },
        ];
      }
    }
  };

  // Helper to calculate delta preview: compares against immediately preceding exam of the same type
  const calculateRowDeltas = (
    matchedStudentId: string,
    subjects: ParsedSubjectItem[],
    totalNet: number,
    examType: 'TYT' | 'AYT',
    examNumber: number
  ) => {
    const targetStudent = students.find((s) => s.id === matchedStudentId);
    if (!targetStudent) {
      return { prevTotalNet: undefined, deltaTotalNet: undefined, deltaTotalRate: undefined, branchDeltas: {}, branchRates: {}, prevExamTitle: undefined };
    }

    // Find the immediately preceding trial exam of the same type (examNumber < currentExamNumber)
    const prevTrials = (targetStudent.trialExams || [])
      .filter((e) => e.examType === examType && e.examNumber < examNumber)
      .sort((a, b) => b.examNumber - a.examNumber);

    const prevExam = prevTrials.length > 0 ? prevTrials[0] : null;

    if (!prevExam) {
      return { prevTotalNet: undefined, deltaTotalNet: undefined, deltaTotalRate: undefined, branchDeltas: {}, branchRates: {}, prevExamTitle: undefined };
    }

    const prevTotalNet = prevExam.totalNet;
    const deltaTotalNet = Number((totalNet - prevTotalNet).toFixed(2));
    const deltaTotalRate = prevTotalNet > 0 ? Number(((deltaTotalNet / prevTotalNet) * 100).toFixed(1)) : undefined;

    const branchDeltas: Record<string, number> = {};
    const branchRates: Record<string, number> = {};
    subjects.forEach((subj) => {
      const prevSubj = prevExam.subjects.find(
        (ps) => ps.subjectName.toLowerCase().trim() === subj.subjectName.toLowerCase().trim()
      );
      if (prevSubj) {
        const d = Number((subj.net - prevSubj.net).toFixed(2));
        branchDeltas[subj.subjectName] = d;
        if (prevSubj.net > 0) {
          branchRates[subj.subjectName] = Number(((d / prevSubj.net) * 100).toFixed(1));
        }
      } else {
        branchDeltas[subj.subjectName] = subj.net;
      }
    });

    return {
      prevTotalNet,
      deltaTotalNet,
      deltaTotalRate,
      branchDeltas,
      branchRates,
      prevExamTitle: `Deneme #${prevExam.examNumber}`,
    };
  };

  // Upload handler for single slot (1 or 2)
  const handleSlotImageUpload = async (slotIndex: 1 | 2, file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setScanError(null);
    setSuccessMessage(null);

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    let serverUrl = '';
    try {
      const upRes = await fetch('/api/upload-exam-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: base64, fileName: file.name }),
      });
      const upData = await upRes.json();
      if (upRes.ok && upData.url) {
        serverUrl = upData.url;
      }
    } catch (e) {
      console.warn('Image upload to server error:', e);
    }

    const imgItem: UploadedImageItem = {
      id: `img-${Date.now()}-${slotIndex}`,
      name: file.name,
      base64,
      previewUrl: serverUrl || base64,
      size: sizeStr,
    };

    if (slotIndex === 1) {
      updateCurrentPage({ image1: imgItem });
    } else {
      updateCurrentPage({ image2: imgItem });
    }
  };

  // Remove slot image
  const handleRemoveSlotImage = (slotIndex: 1 | 2) => {
    if (slotIndex === 1) {
      updateCurrentPage({ image1: null });
    } else {
      updateCurrentPage({ image2: null });
    }
  };

  // =========================================================================
  // COMMIT ROWS TO STUDENTS: AUTOMATIC & SEAMLESS PERSISTENCE ACROSS EXAMS
  // =========================================================================
  const commitRowsToStudentsList = (
    rows: ParsedStudentRow[],
    examTitle: string,
    examDate: string,
    examType: 'TYT' | 'AYT',
    examNum: number
  ) => {
    if (!rows || rows.length === 0) return { updatedCount: 0, newCreatedCount: 0 };

    let updatedStudentsList = [...students];
    let updatedCount = 0;
    let newCreatedCount = 0;

    rows.forEach((row) => {
      const studentIndex = updatedStudentsList.findIndex(
        (s) =>
          s.id === row.matchedStudentId ||
          (row.matchedStudentId === 'new' && s.name.toLowerCase().trim() === row.scannedName.toLowerCase().trim())
      );

      const subjectNetDetails: SubjectNetDetail[] = row.subjects.map((sub) => {
        const branchDelta = row.branchDeltas?.[sub.subjectName];
        const branchRate = row.branchRates?.[sub.subjectName];
        const qCount = sub.questionCount || 40;
        const acc = qCount > 0 ? Math.round((sub.correct / qCount) * 100) : 0;
        return {
          subjectName: sub.subjectName,
          questionCount: qCount,
          correct: sub.correct,
          wrong: sub.wrong,
          blank: sub.blank,
          net: sub.net,
          accuracyRate: acc,
          deltaNet: branchDelta,
          deltaRate: branchRate,
        };
      });

      const sourceImgs = [
        currentPageState.image1?.name,
        currentPageState.image2?.name,
      ].filter(Boolean) as string[];

      const trialRecord: TrialExamRecord = {
        id: `trial-${examType}-${examNum}-${studentIndex >= 0 ? updatedStudentsList[studentIndex].id : Date.now()}`,
        examNumber: examNum,
        examType: examType,
        examTitle: examTitle || `2026 Türkiye Geneli ${examType} Deneme-${examNum}`,
        date: examDate || new Date().toISOString().split('T')[0],
        totalNet: row.totalNet,
        deltaTotalNet: row.deltaTotalNet,
        deltaTotalRate: row.deltaTotalRate,
        subjects: subjectNetDetails,
        sourceImages: sourceImgs,
        createdAt: new Date().toISOString(),
      };

      if (studentIndex >= 0) {
        const currentStudent = { ...updatedStudentsList[studentIndex] };
        const existingTrials = [...(currentStudent.trialExams || [])];

        // Replace if already exists with same type and number
        const filteredTrials = existingTrials.filter(
          (t) => !(t.examType === examType && t.examNumber === examNum)
        );
        filteredTrials.push(trialRecord);

        // Sort all trial records by examNumber ascending
        filteredTrials.sort((a, b) => a.examNumber - b.examNumber);

        // Recalculate deltas and rates across the full chronological sequence for this student
        const tytTrials = filteredTrials.filter((t) => t.examType === 'TYT').sort((a, b) => a.examNumber - b.examNumber);
        for (let i = 0; i < tytTrials.length; i++) {
          if (i === 0) {
            tytTrials[i].deltaTotalNet = undefined;
            tytTrials[i].deltaTotalRate = undefined;
            tytTrials[i].subjects.forEach((s) => {
              s.deltaNet = undefined;
              s.deltaRate = undefined;
            });
          } else {
            const prev = tytTrials[i - 1];
            const dTot = Number((tytTrials[i].totalNet - prev.totalNet).toFixed(2));
            tytTrials[i].deltaTotalNet = dTot;
            tytTrials[i].deltaTotalRate = prev.totalNet > 0 ? Number(((dTot / prev.totalNet) * 100).toFixed(1)) : undefined;
            tytTrials[i].subjects.forEach((s) => {
              const ps = prev.subjects.find((p) => p.subjectName.toLowerCase().trim() === s.subjectName.toLowerCase().trim());
              if (ps) {
                const dSub = Number((s.net - ps.net).toFixed(2));
                s.deltaNet = dSub;
                s.deltaRate = ps.net > 0 ? Number(((dSub / ps.net) * 100).toFixed(1)) : undefined;
              } else {
                s.deltaNet = s.net;
                s.deltaRate = undefined;
              }
            });
          }
        }

        const aytTrials = filteredTrials.filter((t) => t.examType === 'AYT').sort((a, b) => a.examNumber - b.examNumber);
        for (let i = 0; i < aytTrials.length; i++) {
          if (i === 0) {
            aytTrials[i].deltaTotalNet = undefined;
            aytTrials[i].deltaTotalRate = undefined;
            aytTrials[i].subjects.forEach((s) => {
              s.deltaNet = undefined;
              s.deltaRate = undefined;
            });
          } else {
            const prev = aytTrials[i - 1];
            const dTot = Number((aytTrials[i].totalNet - prev.totalNet).toFixed(2));
            aytTrials[i].deltaTotalNet = dTot;
            aytTrials[i].deltaTotalRate = prev.totalNet > 0 ? Number(((dTot / prev.totalNet) * 100).toFixed(1)) : undefined;
            aytTrials[i].subjects.forEach((s) => {
              const ps = prev.subjects.find((p) => p.subjectName.toLowerCase().trim() === s.subjectName.toLowerCase().trim());
              if (ps) {
                const dSub = Number((s.net - ps.net).toFixed(2));
                s.deltaNet = dSub;
                s.deltaRate = ps.net > 0 ? Number(((dSub / ps.net) * 100).toFixed(1)) : undefined;
              } else {
                s.deltaNet = s.net;
                s.deltaRate = undefined;
              }
            });
          }
        }

        currentStudent.trialExams = [...tytTrials, ...aytTrials];

        // Update latestTyt / latestAyt to the highest examNumber
        if (tytTrials.length > 0) {
          const topTyt = tytTrials[tytTrials.length - 1];
          currentStudent.latestTyt = {
            examName: `${topTyt.examTitle} (Deneme #${topTyt.examNumber})`,
            examDate: topTyt.date,
            totalNet: topTyt.totalNet,
            deltaTotalNet: topTyt.deltaTotalNet,
            deltaTotalRate: topTyt.deltaTotalRate,
            subjects: topTyt.subjects,
          };
        }

        if (aytTrials.length > 0) {
          const topAyt = aytTrials[aytTrials.length - 1];
          currentStudent.latestAyt = {
            examName: `${topAyt.examTitle} (Deneme #${topAyt.examNumber})`,
            examDate: topAyt.date,
            totalNet: topAyt.totalNet,
            deltaTotalNet: topAyt.deltaTotalNet,
            deltaTotalRate: topAyt.deltaTotalRate,
            subjects: topAyt.subjects,
          };
        }

        // Rebuild history array from all trial exams
        const allSortedTrials = [...filteredTrials].sort((a, b) => a.examNumber - b.examNumber);
        const newHist = allSortedTrials.map((t) => ({
          examTitle: `${t.examTitle} (Deneme #${t.examNumber})`,
          date: t.date,
          tytNet: t.examType === 'TYT' ? t.totalNet : currentStudent.latestTyt?.totalNet || 0,
          aytNet: t.examType === 'AYT' ? t.totalNet : currentStudent.latestAyt?.totalNet || 0,
          deltaTytNet: t.examType === 'TYT' ? t.deltaTotalNet : undefined,
          deltaAytNet: t.examType === 'AYT' ? t.deltaTotalNet : undefined,
        }));
        currentStudent.history = newHist;

        updatedStudentsList[studentIndex] = currentStudent;
        updatedCount++;
      } else {
        const newStudentId = `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const examBreakdown: ExamBreakdown = {
          examName: `${examTitle} (Deneme #${examNum})`,
          examDate: examDate,
          totalNet: row.totalNet,
          deltaTotalNet: row.deltaTotalNet,
          subjects: subjectNetDetails,
        };

        const newStudent: Student12thGrade = {
          id: newStudentId,
          name: row.scannedName,
          className: row.className || '12 MFA',
          studentNo: row.studentNo || Math.floor(100 + Math.random() * 900).toString(),
          branch: row.branch,
          gender: getStudentGender({ name: row.scannedName }),
          avatarUrl: '',
          mentorNote: 'Deneme sonuç listesinden otomatik oluşturuldu.',
          latestTyt:
            examType === 'TYT'
              ? examBreakdown
              : {
                  examName: 'Henüz TYT Girilmedi',
                  examDate: '-',
                  totalNet: 0,
                  subjects: [],
                },
          latestAyt:
            examType === 'AYT'
              ? examBreakdown
              : {
                  examName: 'Henüz AYT Girilmedi',
                  examDate: '-',
                  totalNet: 0,
                  subjects: [],
                },
          history: [
            {
              examTitle: `${examTitle} (Deneme #${examNum})`,
              date: examDate,
              tytNet: examType === 'TYT' ? row.totalNet : 0,
              aytNet: examType === 'AYT' ? row.totalNet : 0,
            },
          ],
          trialExams: [trialRecord],
          improvingKazanimlar: [],
          decliningKazanimlar: [],
          weeklyProgram: [],
        };
        updatedStudentsList.push(newStudent);
        newCreatedCount++;
      }
    });

    // Commit to parent App.tsx state & server disk
    onUpdateStudents(updatedStudentsList);
    return { updatedCount, newCreatedCount };
  };

  // Run AI Vision Examination for the 2 images of this specific exam
  const handleRunExamAnalysis = async () => {
    const img1 = currentPageState.image1;
    const img2 = currentPageState.image2;

    if (!img1 || !img2) {
      setScanError(
        `Her deneme için 2 görsel yüklenmesi zorunludur. Şu anda ${
          img1 ? 'yalnızca 1. görsel yüklendi' : img2 ? 'yalnızca 2. görsel yüklendi' : 'hiç görsel yüklenmedi'
        }. Lütfen her iki görseli de yükleyiniz.`
      );
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        images: [img1.previewUrl || img1.base64, img2.previewUrl || img2.base64],
        examType: activeExamType,
        examNumber: currentExamNumber,
        examTitle: currentPageState.examTitle,
        examDate: currentPageState.examDate,
        existingStudents: students.map((s) => ({
          id: s.id,
          name: s.name,
          className: s.className,
          branch: s.branch,
          studentNo: s.studentNo,
        })),
      };

      const res = await fetch('/api/parse-batch-exam-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.data?.students) {
        throw new Error(data.error || 'Görseller incelenirken bir sorun oluştu.');
      }

      // Map scanned students to table rows
      const rows: ParsedStudentRow[] = data.data.students.map((stu: any, idx: number) => {
        let matchedId = 'new';
        const scannedNameClean = (stu.matchedExistingName || stu.scannedName || '').toLowerCase().trim();
        const found = students.find((s) => {
          const sName = s.name.toLowerCase().trim();
          return sName === scannedNameClean || sName.includes(scannedNameClean) || scannedNameClean.includes(sName);
        });

        if (found) {
          matchedId = found.id;
        }

        const subjects: ParsedSubjectItem[] = (stu.subjects || []).map((sub: any) => ({
          subjectName: sub.subjectName,
          questionCount: sub.questionCount || 40,
          correct: Number(sub.correct) || 0,
          wrong: Number(sub.wrong) || 0,
          blank: Number(sub.blank) || 0,
          net: Number(sub.net) || 0,
        }));

        const totalNet = Number(stu.totalNet) || Number(subjects.reduce((sum, s) => sum + s.net, 0).toFixed(2));
        const deltas = calculateRowDeltas(matchedId, subjects, totalNet, activeExamType, currentExamNumber);

        return {
          id: `row-${Date.now()}-${idx}`,
          scannedName: stu.scannedName || `Öğrenci ${idx + 1}`,
          matchedStudentId: matchedId,
          studentNo: stu.studentNo || (found ? found.studentNo : ''),
          className: stu.className || (found ? found.className : '12 MFA'),
          branch: (stu.branch as any) || (found ? found.branch : 'Sayısal'),
          subjects,
          totalNet,
          prevTotalNet: deltas.prevTotalNet,
          deltaTotalNet: deltas.deltaTotalNet,
          deltaTotalRate: deltas.deltaTotalRate,
          branchDeltas: deltas.branchDeltas,
          branchRates: deltas.branchRates,
        };
      });

      // Update page state
      updateCurrentPage({
        parsedRows: rows,
        isAnalyzed: true,
        isSaved: true,
      });

      // AUTOMATICALLY COMMIT TO STUDENTS IMMEDIATELY SO VALUES ARE PROCESSED AND PRESERVED!
      commitRowsToStudentsList(
        rows,
        currentPageState.examTitle,
        currentPageState.examDate,
        activeExamType,
        currentExamNumber
      );

      setSuccessMessage(
        `✓ ${activeExamType} Deneme #${currentExamNumber} için 2 adet görsel başarıyla incelendi ve ${rows.length} öğrencinin tüm alt branş netleri (Türkçe, Tarih, Coğrafya, Felsefe, Din, Matematik, Fizik, Kimya, Biyoloji) profillerine işlenerek kalıcı olarak saklandı!`
      );
    } catch (err: any) {
      console.error('Batch scan error:', err);
      setScanError(err.message || 'Görseller incelenirken bir hata oluştu. Lütfen net bir fotoğraf yükleyin.');
    } finally {
      setIsScanning(false);
    }
  };

  // Load Sample Data (For Demonstration & Testing with Full Detailed Sub-branches)
  const handleLoadSampleSheet = () => {
    setScanError(null);
    setSuccessMessage(null);

    const rows: ParsedStudentRow[] = students.map((s, idx) => {
      let subjects: ParsedSubjectItem[] = [];

      // Base scores scaled by currentExamNumber so comparisons show progressive changes
      const examBonus = (currentExamNumber - 1) * 0.4;

      if (activeExamType === 'TYT') {
        subjects = [
          {
            subjectName: 'TYT Türkçe',
            questionCount: 40,
            correct: Math.min(40, Math.max(12, Math.round(28 + (idx % 7) + examBonus * 1.5))),
            wrong: 4,
            blank: Math.max(0, 8 - (idx % 7)),
            net: Number((Math.min(40, Math.round(28 + (idx % 7) + examBonus * 1.5)) - 1.0).toFixed(2)),
          },
          {
            subjectName: 'TYT Tarih',
            questionCount: 5,
            correct: Math.min(5, Math.max(1, Math.round(3 + (idx % 3) * 0.5 + examBonus * 0.2))),
            wrong: 1,
            blank: 1,
            net: Number((Math.min(5, Math.round(3 + (idx % 3) * 0.5 + examBonus * 0.2)) - 0.25).toFixed(2)),
          },
          {
            subjectName: 'TYT Coğrafya',
            questionCount: 5,
            correct: Math.min(5, Math.max(1, Math.round(3 + ((idx + 1) % 3) * 0.5 + examBonus * 0.2))),
            wrong: 1,
            blank: 1,
            net: Number((Math.min(5, Math.round(3 + ((idx + 1) % 3) * 0.5 + examBonus * 0.2)) - 0.25).toFixed(2)),
          },
          {
            subjectName: 'TYT Felsefe',
            questionCount: 5,
            correct: Math.min(5, Math.max(2, Math.round(3.5 + examBonus * 0.15))),
            wrong: 1,
            blank: 0,
            net: Number((Math.min(5, Math.round(3.5 + examBonus * 0.15)) - 0.25).toFixed(2)),
          },
          {
            subjectName: 'TYT Din Kültürü',
            questionCount: 5,
            correct: Math.min(5, Math.max(2, Math.round(4 + examBonus * 0.1))),
            wrong: 1,
            blank: 0,
            net: Number((Math.min(5, Math.round(4 + examBonus * 0.1)) - 0.25).toFixed(2)),
          },
          {
            subjectName: 'TYT Matematik',
            questionCount: 40,
            correct: Math.min(40, Math.max(10, Math.round(23 + (idx % 10) * 1.5 + examBonus * 1.8))),
            wrong: 4,
            blank: Math.max(0, 13 - (idx % 10)),
            net: Number((Math.min(40, Math.round(23 + (idx % 10) * 1.5 + examBonus * 1.8)) - 1.0).toFixed(2)),
          },
          {
            subjectName: 'TYT Fizik',
            questionCount: 7,
            correct: Math.min(7, Math.max(1, Math.round(4 + (idx % 3) * 0.6 + examBonus * 0.3))),
            wrong: 1,
            blank: 2,
            net: Number((Math.min(7, Math.round(4 + (idx % 3) * 0.6 + examBonus * 0.3)) - 0.25).toFixed(2)),
          },
          {
            subjectName: 'TYT Kimya',
            questionCount: 7,
            correct: Math.min(7, Math.max(1, Math.round(4.5 + ((idx + 1) % 3) * 0.5 + examBonus * 0.25))),
            wrong: 1,
            blank: 1,
            net: Number((Math.min(7, Math.round(4.5 + ((idx + 1) % 3) * 0.5 + examBonus * 0.25)) - 0.25).toFixed(2)),
          },
          {
            subjectName: 'TYT Biyoloji',
            questionCount: 6,
            correct: Math.min(6, Math.max(1, Math.round(4 + (idx % 2) * 0.5 + examBonus * 0.25))),
            wrong: 1,
            blank: 1,
            net: Number((Math.min(6, Math.round(4 + (idx % 2) * 0.5 + examBonus * 0.25)) - 0.25).toFixed(2)),
          },
        ];
      } else {
        if (s.branch === 'Sayısal') {
          subjects = [
            {
              subjectName: 'AYT Matematik',
              questionCount: 40,
              correct: Math.min(40, Math.round(28 + idx + examBonus * 1.2)),
              wrong: 4,
              blank: Math.max(0, 8 - idx),
              net: Number((Math.min(40, Math.round(28 + idx + examBonus * 1.2)) - 1.0).toFixed(2)),
            },
            { subjectName: 'AYT Fizik', questionCount: 14, correct: Math.min(14, 10 + (idx % 3)), wrong: 2, blank: 2, net: 9.5 },
            { subjectName: 'AYT Kimya', questionCount: 13, correct: Math.min(13, 10 + (idx % 2)), wrong: 2, blank: 1, net: 9.5 },
            { subjectName: 'AYT Biyoloji', questionCount: 13, correct: Math.min(13, 11 + (idx % 2)), wrong: 1, blank: 1, net: 10.75 },
          ];
        } else {
          subjects = [
            { subjectName: 'AYT Matematik', questionCount: 40, correct: Math.min(40, 22 + idx), wrong: 6, blank: 12, net: 20.5 },
            { subjectName: 'AYT Edebiyat', questionCount: 24, correct: 21, wrong: 2, blank: 1, net: 20.5 },
            { subjectName: 'AYT Tarih', questionCount: 10, correct: 8, wrong: 1, blank: 1, net: 7.75 },
            { subjectName: 'AYT Coğrafya', questionCount: 6, correct: 5, wrong: 1, blank: 0, net: 4.75 },
          ];
        }
      }

      const totalNet = Number(subjects.reduce((sum, sub) => sum + sub.net, 0).toFixed(2));
      const deltas = calculateRowDeltas(s.id, subjects, totalNet, activeExamType, currentExamNumber);

      return {
        id: `sample-${s.id}-${currentExamNumber}`,
        scannedName: s.name,
        matchedStudentId: s.id,
        studentNo: s.studentNo,
        className: s.className,
        branch: s.branch,
        subjects,
        totalNet,
        prevTotalNet: deltas.prevTotalNet,
        deltaTotalNet: deltas.deltaTotalNet,
        deltaTotalRate: deltas.deltaTotalRate,
        branchDeltas: deltas.branchDeltas,
        branchRates: deltas.branchRates,
      };
    });

    updateCurrentPage({
      parsedRows: rows,
      isAnalyzed: true,
      isSaved: true,
    });

    // Automatically commit and persist to all students
    commitRowsToStudentsList(
      rows,
      currentPageState.examTitle,
      currentPageState.examDate,
      activeExamType,
      currentExamNumber
    );

    setSuccessMessage(
      `✓ Örnek ${activeExamType} Deneme #${currentExamNumber} sonuç listesi yüklendi, ${rows.length} öğrenciye işlendi ve saklandı! Artık bir sonraki denemeye geçebilirsiniz.`
    );
  };

  // Add Empty Row to the Table
  const handleAddManualRow = () => {
    const defSubjs = getStandardSubjects(activeExamType);
    const newRow: ParsedStudentRow = {
      id: `manual-${Date.now()}`,
      scannedName: 'Yeni Öğrenci',
      matchedStudentId: 'new',
      studentNo: '',
      className: '12 MFA',
      branch: 'Sayısal',
      subjects: defSubjs,
      totalNet: 0,
      prevTotalNet: undefined,
      deltaTotalNet: undefined,
      branchDeltas: {},
    };
    updateCurrentPage({
      parsedRows: [...currentPageState.parsedRows, newRow],
    });
  };

  // Update cell in parsed table
  const handleUpdateStudentField = (
    rowId: string,
    field: 'scannedName' | 'matchedStudentId' | 'studentNo' | 'className' | 'branch',
    value: any
  ) => {
    const updated = currentPageState.parsedRows.map((row) => {
      if (row.id !== rowId) return row;
      const copy = { ...row, [field]: value };
      if (field === 'matchedStudentId') {
        const deltas = calculateRowDeltas(value, row.subjects, row.totalNet, activeExamType, currentExamNumber);
        copy.prevTotalNet = deltas.prevTotalNet;
        copy.deltaTotalNet = deltas.deltaTotalNet;
        copy.branchDeltas = deltas.branchDeltas;
      }
      return copy;
    });
    updateCurrentPage({ parsedRows: updated });
  };

  // Update subject scores (D / Y)
  const handleUpdateSubjectScore = (
    rowId: string,
    subjectIndex: number,
    field: 'correct' | 'wrong',
    value: number
  ) => {
    const updated = currentPageState.parsedRows.map((row) => {
      if (row.id !== rowId) return row;
      const newSubjects = [...row.subjects];
      const targetSubj = { ...newSubjects[subjectIndex] };
      const val = Math.max(0, value || 0);

      if (field === 'correct') {
        targetSubj.correct = val;
      } else {
        targetSubj.wrong = val;
      }

      const calculatedNet = Number((targetSubj.correct - targetSubj.wrong * 0.25).toFixed(2));
      targetSubj.net = calculatedNet;
      newSubjects[subjectIndex] = targetSubj;

      const newTotalNet = Number(newSubjects.reduce((sum, s) => sum + s.net, 0).toFixed(2));
      const deltas = calculateRowDeltas(row.matchedStudentId, newSubjects, newTotalNet, activeExamType, currentExamNumber);

      return {
        ...row,
        subjects: newSubjects,
        totalNet: newTotalNet,
        prevTotalNet: deltas.prevTotalNet,
        deltaTotalNet: deltas.deltaTotalNet,
        branchDeltas: deltas.branchDeltas,
      };
    });
    updateCurrentPage({ parsedRows: updated });
  };

  // Remove row
  const handleRemoveRow = (rowId: string) => {
    updateCurrentPage({
      parsedRows: currentPageState.parsedRows.filter((r) => r.id !== rowId),
    });
  };

  // =========================================================================
  // COMMIT & SAVE: PERSIST ACROSS EXAMS & RECALCULATE CHAIN DELTAS
  // =========================================================================
  const handleSaveAllToStudents = () => {
    if (currentPageState.parsedRows.length === 0) return;

    const { updatedCount, newCreatedCount } = commitRowsToStudentsList(
      currentPageState.parsedRows,
      currentPageState.examTitle,
      currentPageState.examDate,
      activeExamType,
      currentExamNumber
    );

    // Save page status
    updateCurrentPage({ isSaved: true, isAnalyzed: true });

    setSuccessMessage(
      `Tebrikler! ${updatedCount} öğrencinin ${activeExamType} Deneme #${currentExamNumber} netleri ve diğer denemelerle kıyaslama artış/azalışları başarıyla işlendi ve saklandı! ${
        newCreatedCount > 0 ? `(${newCreatedCount} yeni öğrenci listeye eklendi)` : ''
      }`
    );
  };

  // Aggregated unique trial exams across all students for management & deletion
  const aggregatedExams = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        examType: 'TYT' | 'AYT';
        examNumber: number;
        examTitle: string;
        date: string;
        studentRecords: {
          student: Student12thGrade;
          record: TrialExamRecord;
        }[];
        averageNet: number;
        maxNet: number;
        minNet: number;
      }
    >();

    students.forEach((s) => {
      (s.trialExams || []).forEach((rec) => {
        const key = `${rec.examType}__${rec.examNumber}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            examType: rec.examType,
            examNumber: rec.examNumber,
            examTitle: rec.examTitle,
            date: rec.date,
            studentRecords: [],
            averageNet: 0,
            maxNet: 0,
            minNet: 0,
          });
        }
        map.get(key)!.studentRecords.push({ student: s, record: rec });
      });
    });

    const list = Array.from(map.values()).map((item) => {
      const nets = item.studentRecords.map((r) => r.record.totalNet);
      const total = nets.reduce((sum, n) => sum + n, 0);
      item.averageNet = nets.length ? Number((total / nets.length).toFixed(2)) : 0;
      item.maxNet = nets.length ? Math.max(...nets) : 0;
      item.minNet = nets.length ? Math.min(...nets) : 0;
      return item;
    });

    return list.sort((a, b) => {
      if (a.examNumber !== b.examNumber) return b.examNumber - a.examNumber;
      return a.examType.localeCompare(b.examType);
    });
  }, [students]);

  // Auto-sync comparison numbers when available exams change or analytics type changes
  useEffect(() => {
    const targetType = analyticsExamType === 'AYT' ? 'AYT' : 'TYT';
    const available = aggregatedExams
      .filter((e) => e.examType === targetType)
      .map((e) => e.examNumber)
      .sort((a, b) => a - b);

    if (available.length >= 2) {
      if (!available.includes(compareExam1Num)) {
        setCompareExam1Num(available[0]);
      }
      if (!available.includes(compareExam2Num) || compareExam1Num === compareExam2Num) {
        setCompareExam2Num(available[available.length - 1]);
      }
    } else if (available.length === 1) {
      setCompareExam1Num(available[0]);
      setCompareExam2Num(available[0]);
    }
  }, [aggregatedExams, analyticsExamType, compareExam1Num, compareExam2Num]);

  // Delete an entire exam across all students (Serdar Aktaş / Manager Authority)
  const handleDeleteEntireExam = (target: {
    key: string;
    examType: 'TYT' | 'AYT';
    examNumber: number;
    examTitle: string;
  }) => {
    const updatedStudentsList = students.map((stu) => {
      const hasRecord = (stu.trialExams || []).some(
        (e) => e.examType === target.examType && e.examNumber === target.examNumber
      );
      if (!hasRecord) return stu;

      const remainingTrials = (stu.trialExams || []).filter(
        (e) => !(e.examType === target.examType && e.examNumber === target.examNumber)
      );

      // Recalculate deltas for remaining trials
      const tytTrials = remainingTrials.filter((t) => t.examType === 'TYT').sort((a, b) => a.examNumber - b.examNumber);
      for (let i = 0; i < tytTrials.length; i++) {
        if (i === 0) {
          tytTrials[i].deltaTotalNet = undefined;
          tytTrials[i].subjects.forEach((s) => (s.deltaNet = undefined));
        } else {
          const prev = tytTrials[i - 1];
          tytTrials[i].deltaTotalNet = Number((tytTrials[i].totalNet - prev.totalNet).toFixed(2));
          tytTrials[i].subjects.forEach((s) => {
            const ps = prev.subjects.find((p) => p.subjectName.toLowerCase().trim() === s.subjectName.toLowerCase().trim());
            s.deltaNet = ps ? Number((s.net - ps.net).toFixed(2)) : 0;
          });
        }
      }

      const aytTrials = remainingTrials.filter((t) => t.examType === 'AYT').sort((a, b) => a.examNumber - b.examNumber);
      for (let i = 0; i < aytTrials.length; i++) {
        if (i === 0) {
          aytTrials[i].deltaTotalNet = undefined;
          aytTrials[i].subjects.forEach((s) => (s.deltaNet = undefined));
        } else {
          const prev = aytTrials[i - 1];
          aytTrials[i].deltaTotalNet = Number((aytTrials[i].totalNet - prev.totalNet).toFixed(2));
          aytTrials[i].subjects.forEach((s) => {
            const ps = prev.subjects.find((p) => p.subjectName.toLowerCase().trim() === s.subjectName.toLowerCase().trim());
            s.deltaNet = ps ? Number((s.net - ps.net).toFixed(2)) : 0;
          });
        }
      }

      const newRemainingTrials = [...tytTrials, ...aytTrials];

      let newLatestTyt = stu.latestTyt;
      let newLatestAyt = stu.latestAyt;

      if (target.examType === 'TYT') {
        if (tytTrials.length > 0) {
          const topTyt = tytTrials[tytTrials.length - 1];
          newLatestTyt = {
            examName: `${topTyt.examTitle} (Deneme #${topTyt.examNumber})`,
            examDate: topTyt.date,
            totalNet: topTyt.totalNet,
            deltaTotalNet: topTyt.deltaTotalNet,
            subjects: topTyt.subjects,
          };
        } else {
          newLatestTyt = {
            examName: 'Henüz TYT Girilmedi',
            examDate: '-',
            totalNet: 0,
            subjects: [],
          };
        }
      } else {
        if (aytTrials.length > 0) {
          const topAyt = aytTrials[aytTrials.length - 1];
          newLatestAyt = {
            examName: `${topAyt.examTitle} (Deneme #${topAyt.examNumber})`,
            examDate: topAyt.date,
            totalNet: topAyt.totalNet,
            deltaTotalNet: topAyt.deltaTotalNet,
            subjects: topAyt.subjects,
          };
        } else {
          newLatestAyt = {
            examName: 'Henüz AYT Girilmedi',
            examDate: '-',
            totalNet: 0,
            subjects: [],
          };
        }
      }

      return {
        ...stu,
        trialExams: newRemainingTrials,
        latestTyt: newLatestTyt,
        latestAyt: newLatestAyt,
      };
    });

    onUpdateStudents(updatedStudentsList);

    // Update examPages store
    const pageKey = `${target.examType}_${target.examNumber}`;
    setExamPages((prev) => {
      const copy = { ...prev };
      delete copy[pageKey];
      try {
        localStorage.setItem('yks_trial_exam_pages', JSON.stringify(copy));
      } catch (e) {}
      return copy;
    });

    setSuccessMessage(
      `${target.examType} Deneme #${target.examNumber} (${target.examTitle}) sınavı ve tüm öğrenci sonuçları Serdar Aktaş yetkisiyle başarıyla silindi.`
    );
    setExamToDelete(null);
  };

  // Delete an individual student's record from a specific exam
  const handleDeleteSingleStudentRecord = (studentId: string, examRecordId: string) => {
    const updatedStudentsList = students.map((stu) => {
      if (stu.id !== studentId) return stu;

      const targetRec = (stu.trialExams || []).find((e) => e.id === examRecordId);
      if (!targetRec) return stu;

      const remainingTrials = (stu.trialExams || []).filter((e) => e.id !== examRecordId);

      let newLatestTyt = stu.latestTyt;
      let newLatestAyt = stu.latestAyt;

      if (targetRec.examType === 'TYT') {
        const remainingTyt = remainingTrials.filter((e) => e.examType === 'TYT').sort((a, b) => a.examNumber - b.examNumber);
        if (remainingTyt.length > 0) {
          const topTyt = remainingTyt[remainingTyt.length - 1];
          newLatestTyt = {
            examName: topTyt.examTitle,
            examDate: topTyt.date,
            totalNet: topTyt.totalNet,
            subjects: topTyt.subjects,
          };
        } else {
          newLatestTyt = {
            examName: 'Henüz TYT Girilmedi',
            examDate: '-',
            totalNet: 0,
            subjects: [],
          };
        }
      } else {
        const remainingAyt = remainingTrials.filter((e) => e.examType === 'AYT').sort((a, b) => a.examNumber - b.examNumber);
        if (remainingAyt.length > 0) {
          const topAyt = remainingAyt[remainingAyt.length - 1];
          newLatestAyt = {
            examName: topAyt.examTitle,
            examDate: topAyt.date,
            totalNet: topAyt.totalNet,
            subjects: topAyt.subjects,
          };
        } else {
          newLatestAyt = {
            examName: 'Henüz AYT Girilmedi',
            examDate: '-',
            totalNet: 0,
            subjects: [],
          };
        }
      }

      return {
        ...stu,
        trialExams: remainingTrials,
        latestTyt: newLatestTyt,
        latestAyt: newLatestAyt,
      };
    });

    onUpdateStudents(updatedStudentsList);
    setSuccessMessage(`${singleRecordToDelete?.studentName} öğrencisinin deneme sonucu silindi.`);
    setSingleRecordToDelete(null);
  };

  // =========================================================================
  // COLLECTIVE BRANCH ANALYSIS CALCULATIONS (TOPLU BRANŞ ANALİZİ & KIYASLAMALAR)
  // =========================================================================
  const branchAnalyticsData = useMemo(() => {
    const targetExamType = analyticsExamType === 'ALL' ? undefined : analyticsExamType;

    // Filter aggregated exams by type
    const relevantExams = aggregatedExams
      .filter((e) => !targetExamType || e.examType === targetExamType)
      .sort((a, b) => a.examNumber - b.examNumber); // Chronological

    // Set of all subject/branch names
    const subjectNamesSet = new Set<string>();
    relevantExams.forEach((exam) => {
      exam.studentRecords.forEach((sr) => {
        sr.record.subjects.forEach((s) => {
          subjectNamesSet.add(s.subjectName);
        });
      });
    });

    const subjectNames = Array.from(subjectNamesSet);

    // For each subject/branch, compute exam-by-exam class averages
    const branchStats = subjectNames.map((subjName) => {
      const examProgressions = relevantExams.map((exam) => {
        let totalNet = 0;
        let count = 0;
        let minNet = 999;
        let maxNet = -999;

        exam.studentRecords.forEach((sr) => {
          const matchSub = sr.record.subjects.find((s) => s.subjectName === subjName);
          if (matchSub) {
            totalNet += matchSub.net;
            count++;
            if (matchSub.net > maxNet) maxNet = matchSub.net;
            if (matchSub.net < minNet) minNet = matchSub.net;
          }
        });

        const avgNet = count > 0 ? Number((totalNet / count).toFixed(2)) : 0;
        return {
          examKey: exam.key,
          examNumber: exam.examNumber,
          examType: exam.examType,
          examTitle: exam.examTitle,
          date: exam.date,
          studentCount: count,
          averageNet: avgNet,
          maxNet: count > 0 ? maxNet : 0,
          minNet: count > 0 ? minNet : 0,
        };
      });

      const validExams = examProgressions.filter((ep) => ep.studentCount > 0);

      let latestDelta: number | undefined = undefined;
      if (validExams.length >= 2) {
        const last = validExams[validExams.length - 1];
        const prev = validExams[validExams.length - 2];
        latestDelta = Number((last.averageNet - prev.averageNet).toFixed(2));
      }

      const firstAvg = validExams.length > 0 ? validExams[0].averageNet : 0;
      const lastAvg = validExams.length > 0 ? validExams[validExams.length - 1].averageNet : 0;
      const overallDelta = validExams.length >= 2 ? Number((lastAvg - firstAvg).toFixed(2)) : 0;

      return {
        subjectName: subjName,
        examCount: validExams.length,
        validExams,
        latestAverage: lastAvg,
        latestDelta,
        overallDelta,
      };
    });

    branchStats.sort((a, b) => b.overallDelta - a.overallDelta);

    return {
      relevantExams,
      subjectNames,
      branchStats,
    };
  }, [aggregatedExams, analyticsExamType]);

  // =========================================================================
  // DIRECT 1-TO-1 EXAM COMPARISON REPORT (Deneme X vs Deneme Y)
  // =========================================================================
  const directComparisonReport = useMemo(() => {
    const targetType = analyticsExamType === 'AYT' ? 'AYT' : 'TYT';
    const exam1 = aggregatedExams.find((e) => e.examType === targetType && e.examNumber === compareExam1Num);
    const exam2 = aggregatedExams.find((e) => e.examType === targetType && e.examNumber === compareExam2Num);

    if (!exam1 || !exam2) return null;

    // Class average total net delta
    const deltaAvgTotal = Number((exam2.averageNet - exam1.averageNet).toFixed(2));

    // Subject/Branch comparison
    const allSubjects = new Set<string>();
    exam1.studentRecords.forEach((sr) => sr.record.subjects.forEach((s) => allSubjects.add(s.subjectName)));
    exam2.studentRecords.forEach((sr) => sr.record.subjects.forEach((s) => allSubjects.add(s.subjectName)));

    const branchComparison = Array.from(allSubjects).map((subjName) => {
      // Exam 1 avg
      const e1Subjs = exam1.studentRecords
        .map((sr) => sr.record.subjects.find((s) => s.subjectName === subjName)?.net)
        .filter((n) => n !== undefined) as number[];
      const avg1 = e1Subjs.length ? Number((e1Subjs.reduce((a, b) => a + b, 0) / e1Subjs.length).toFixed(2)) : 0;

      // Exam 2 avg
      const e2Subjs = exam2.studentRecords
        .map((sr) => sr.record.subjects.find((s) => s.subjectName === subjName)?.net)
        .filter((n) => n !== undefined) as number[];
      const avg2 = e2Subjs.length ? Number((e2Subjs.reduce((a, b) => a + b, 0) / e2Subjs.length).toFixed(2)) : 0;

      const delta = Number((avg2 - avg1).toFixed(2));
      const rate = avg1 > 0 ? Number(((delta / avg1) * 100).toFixed(1)) : undefined;

      return {
        subjectName: subjName,
        avg1,
        avg2,
        delta,
        rate,
      };
    });

    // Student level deltas between exam 1 and exam 2
    const studentDeltas = students
      .map((stu) => {
        const r1 = (stu.trialExams || []).find((e) => e.examType === targetType && e.examNumber === compareExam1Num);
        const r2 = (stu.trialExams || []).find((e) => e.examType === targetType && e.examNumber === compareExam2Num);

        if (!r1 || !r2) return null;

        const net1 = r1.totalNet;
        const net2 = r2.totalNet;
        const diff = Number((net2 - net1).toFixed(2));

        const branchDiffs: Record<string, { n1: number; n2: number; delta: number; rate?: number }> = {};
        allSubjects.forEach((subj) => {
          const s1 = r1.subjects.find((s) => s.subjectName.toLowerCase().trim() === subj.toLowerCase().trim())?.net ?? 0;
          const s2 = r2.subjects.find((s) => s.subjectName.toLowerCase().trim() === subj.toLowerCase().trim())?.net ?? 0;
          const delta = Number((s2 - s1).toFixed(2));
          const rate = s1 > 0 ? Number(((delta / s1) * 100).toFixed(1)) : undefined;
          branchDiffs[subj] = {
            n1: s1,
            n2: s2,
            delta,
            rate,
          };
        });

        return {
          student: stu,
          net1,
          net2,
          diff,
          branchDiffs,
        };
      })
      .filter(Boolean) as {
      student: Student12thGrade;
      net1: number;
      net2: number;
      diff: number;
      branchDiffs: Record<string, { n1: number; n2: number; delta: number; rate?: number }>;
    }[];

    const topImprovers = [...studentDeltas].sort((a, b) => b.diff - a.diff).slice(0, 3);
    const needAttention = [...studentDeltas].sort((a, b) => a.diff - b.diff).filter((s) => s.diff < 0).slice(0, 3);
    const improvedCount = studentDeltas.filter((s) => s.diff > 0).length;
    const declinedCount = studentDeltas.filter((s) => s.diff < 0).length;
    const unchangedCount = studentDeltas.filter((s) => s.diff === 0).length;

    return {
      exam1,
      exam2,
      deltaAvgTotal,
      branchComparison,
      topImprovers,
      needAttention,
      studentDeltas,
      improvedCount,
      declinedCount,
      unchangedCount,
      studentCount: studentDeltas.length,
    };
  }, [aggregatedExams, analyticsExamType, compareExam1Num, compareExam2Num, students]);

  // Non-manager guard
  if (!isManager) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white">Yetkisiz Erişim Kısıtlaması</h2>
          <p className="text-sm text-slate-400">
            Deneme sonucu yükleme ve deneme silme işlemleri yalnızca <strong className="text-white">Yönetici (Serdar Aktaş)</strong> hesabına yetkilendirilmiştir.
          </p>
        </div>
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 text-left space-y-1">
          <p>• Aktif Kullanıcı: <span className="text-slate-200 font-bold">{teacherName}</span></p>
          <p>• Yetki Durumu: <span className="text-rose-400 font-bold">Kısıtlı Kullanıcı</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-black text-xs rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Ölçme & Değerlendirme Modülü
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-lg">
                Deneme 1 - 100 Arası
              </span>
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-lg flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Yönetici: Serdar Aktaş (Yükleme & Silme Yetkisi)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Toplu Deneme Sonucu Yükleme & Denemeler Arası Kıyaslama
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Her deneme için <strong>2 adet sonuç görseli</strong> yükleyin. Yüklediğiniz her deneme (Deneme 1, Deneme 2, Deneme 3...) öğrencilerin profillerine kalıcı olarak işlenir ve saklanır. Sınavlar arasında <strong>branş branş net artış/azalış kıyaslamaları</strong> otomatik yapılır.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleLoadSampleSheet}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Örnek Deneme #{currentExamNumber} Sonuç Çizelgesi Yükle (Test)</span>
            </button>
          </div>
        </div>

        {/* 4 Main Tabs: TYT Yükle | AYT Yükle | Toplu Branş Analizi & Kıyaslama | Yönet & Sil */}
        <div className="mt-8 pt-6 border-t border-slate-700/60 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 w-full lg:w-auto gap-1">
            <button
              onClick={() => {
                setActiveTabMode('TYT');
                setScanError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTabMode === 'TYT'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="w-5 h-5 rounded-md bg-emerald-950 flex items-center justify-center text-emerald-300 font-black text-[10px]">
                TYT
              </div>
              <span>TYT Denemeleri (2 Görsel Yükle)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200 font-mono">
                #{selectedTytNumber}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTabMode('AYT');
                setScanError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTabMode === 'AYT'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="w-5 h-5 rounded-md bg-indigo-950 flex items-center justify-center text-indigo-300 font-black text-[10px]">
                AYT
              </div>
              <span>AYT Denemeleri (2 Görsel Yükle)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-200 font-mono">
                #{selectedAytNumber}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTabMode('ANALYTICS');
                setScanError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTabMode === 'ANALYTICS'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-cyan-300" />
              <span>Denemeler Arası Kıyaslama & Analiz</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-200 font-mono">
                {aggregatedExams.length} Deneme
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTabMode('MANAGE');
                setScanError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTabMode === 'MANAGE'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trash2 className="w-4 h-4 text-rose-300" />
              <span>Yüklü Denemeleri Yönet & Sil</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-200 font-mono">
                {aggregatedExams.length} Deneme
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Yüklenen tüm denemeler sunucuda ve öğrenci profillerinde kalıcı saklanır.</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VIEW MODE 1 & 2: TYT or AYT EXAM UPLOAD (2 IMAGES PER EXAM PAGE)        */}
      {/* ===================================================================== */}
      {(activeTabMode === 'TYT' || activeTabMode === 'AYT') && (
        <div className="space-y-6">
          {/* DENEME SAYFASI GEZİNTİ ÇUBUĞU (TYT 1, TYT 2, TYT 3...) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-black text-xs ${
                      activeExamType === 'TYT' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {activeExamType} Sayfaları
                  </span>
                  <h3 className="text-base font-black text-white">
                    Deneme Sayfaları (Her Deneme İçin 2 Görsel Yüklenir & Saklanır)
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Deneme 1, Deneme 2, Deneme 3 butonlarına tıklayarak her denemenin sayfasına geçebilirsiniz. Yüklediğiniz hiçbir deneme kaybolmaz, hepsi saklanır.
                </p>
              </div>

              {/* Direct Jump to any number 1-100 */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400 font-medium">Hızlı Deneme Seç:</span>
                <div className="relative">
                  <select
                    value={currentExamNumber}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      if (activeExamType === 'TYT') setSelectedTytNumber(num);
                      else setSelectedAytNumber(num);
                      setScanError(null);
                      setSuccessMessage(null);
                    }}
                    className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-indigo-500 appearance-none pr-8 cursor-pointer"
                  >
                    {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {activeExamType} Deneme #{n}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Quick Switcher Pills for Exams 1 to 10 (and beyond) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {Array.from({ length: Math.max(10, currentExamNumber + 2) }, (_, i) => i + 1).map((num) => {
                const key = `${activeExamType}_${num}`;
                const state = examPages[key];
                const isActive = num === currentExamNumber;
                const hasImg1 = !!state?.image1;
                const hasImg2 = !!state?.image2;
                const imgCount = (hasImg1 ? 1 : 0) + (hasImg2 ? 1 : 0);
                
                // Check if students already have this exam
                const studentsWithExam = students.filter((s) =>
                  (s.trialExams || []).some((e) => e.examType === activeExamType && e.examNumber === num)
                );
                const isSaved = studentsWithExam.length > 0 || !!state?.isSaved;
                const studentCount = studentsWithExam.length || state?.parsedRows?.length || 0;

                return (
                  <button
                    key={num}
                    onClick={() => {
                      if (activeExamType === 'TYT') setSelectedTytNumber(num);
                      else setSelectedAytNumber(num);
                      setScanError(null);
                      setSuccessMessage(null);
                    }}
                    className={`px-4 py-2.5 rounded-2xl border transition text-left flex flex-col gap-1 shrink-0 cursor-pointer ${
                      isActive
                        ? activeExamType === 'TYT'
                          ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md shadow-emerald-950'
                          : 'bg-indigo-950/80 border-indigo-500 text-white shadow-md shadow-indigo-950'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-black text-xs">
                        {activeExamType} #{num}
                      </span>
                      {isSaved ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Öğrencilere Kaydedildi" />
                      ) : state?.isAnalyzed ? (
                        <span className="w-2 h-2 rounded-full bg-cyan-400" title="Analiz Edildi" />
                      ) : imgCount === 2 ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400" title="2 Görsel Hazır" />
                      ) : null}
                    </div>

                    <div className="text-[10px] font-mono text-slate-400">
                      {isSaved
                        ? `${studentCount} Öğrenci ✓`
                        : state?.isAnalyzed
                        ? `${state.parsedRows.length} Ayrıştırıldı`
                        : `${imgCount}/2 Görsel`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE EXAM PAGE DETAILS & CONTROLS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Deneme Sayısı */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Seçili Deneme Sayfası</span>
                </label>
                <div className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white font-black text-sm flex items-center justify-between">
                  <span>
                    {activeExamType} Deneme #{currentExamNumber}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      currentPageState.isSaved
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : currentPageState.isAnalyzed
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {currentPageState.isSaved
                      ? 'Öğrenci Sayfalarına İşlendi & Saklandı'
                      : currentPageState.isAnalyzed
                      ? 'Analiz Edildi (Kayıt Bekliyor)'
                      : 'Görseller Bekleniyor'}
                  </span>
                </div>
              </div>

              {/* Sınav Tarihi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Sınav Tarihi</span>
                </label>
                <input
                  type="date"
                  value={currentPageState.examDate}
                  onChange={(e) => updateCurrentPage({ examDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white font-medium text-sm focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                />
              </div>

              {/* Deneme İsmi / Yayın Adı */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                  <span>Deneme İsmi / Yayın Adı</span>
                </label>
                <input
                  type="text"
                  value={currentPageState.examTitle}
                  onChange={(e) => updateCurrentPage({ examTitle: e.target.value })}
                  placeholder={`Örn: 2026 Türkiye Geneli ${activeExamType} Deneme-${currentExamNumber}`}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white font-medium text-sm focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            {/* 2 GÖRSEL YÜKLEME ALANI (SAYFA 1 & SAYFA 2) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-indigo-400" />
                    <span>
                      {activeExamType} Deneme #{currentExamNumber} İçin 2 Görsel Yükleyin
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bu deneme için 1. görsel ve 2. görsel olmak üzere iki sayfa yükleyin. İki görsel tamamlandığında analizi başlatıp sonuçları kaydedin.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                      currentPageState.image1 && currentPageState.image2
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : currentPageState.image1 || currentPageState.image2
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {currentPageState.image1 && currentPageState.image2
                        ? '2/2 Görsel Yüklendi (Hazır)'
                        : currentPageState.image1 || currentPageState.image2
                        ? '1/2 Görsel Yüklendi'
                        : '0/2 Görsel (Bekleniyor)'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Hidden file inputs */}
              <input
                type="file"
                ref={fileInputRef1}
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleSlotImageUpload(1, e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <input
                type="file"
                ref={fileInputRef2}
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleSlotImageUpload(2, e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* 2-COLUMNS: SLOT 1 & SLOT 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* 1. GÖRSEL KARTI */}
                <div
                  className={`rounded-2xl border transition p-5 space-y-4 ${
                    currentPageState.image1
                      ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-500/30">
                        1
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-white">1. Görsel (Sayfa 1 / Sol Liste)</h5>
                        <p className="text-[11px] text-slate-400">Sonuç listesi veya karne çizelgesi 1. sayfa</p>
                      </div>
                    </div>

                    {currentPageState.image1 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Yüklendi ✓
                      </span>
                    )}
                  </div>

                  {currentPageState.image1 ? (
                    <div className="space-y-3">
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group">
                        <img
                          src={currentPageState.image1.base64}
                          alt="Sayfa 1"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImageModal({
                                title: `${activeExamType} Deneme #${currentExamNumber} - 1. Görsel`,
                                src: currentPageState.image1!.base64,
                              })
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Büyüt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlotImage(1)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Kaldır</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="truncate max-w-[200px] font-mono text-[11px]">
                          {currentPageState.image1.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{currentPageState.image1.size}</span>
                          <button
                            type="button"
                            onClick={() => fileInputRef1.current?.click()}
                            className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold cursor-pointer underline ml-2"
                          >
                            Değiştir
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef1.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-900/50 hover:bg-slate-900 transition rounded-xl p-6 text-center cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-200">1. Görseli Seçin veya Sürükleyin</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, JPEG veya taranmış belge</p>
                    </div>
                  )}
                </div>

                {/* 2. GÖRSEL KARTI */}
                <div
                  className={`rounded-2xl border transition p-5 space-y-4 ${
                    currentPageState.image2
                      ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-500/30">
                        2
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-white">2. Görsel (Sayfa 2 / Sağ Liste)</h5>
                        <p className="text-[11px] text-slate-400">Sonuç listesi veya karne çizelgesi 2. sayfa</p>
                      </div>
                    </div>

                    {currentPageState.image2 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Yüklendi ✓
                      </span>
                    )}
                  </div>

                  {currentPageState.image2 ? (
                    <div className="space-y-3">
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group">
                        <img
                          src={currentPageState.image2.base64}
                          alt="Sayfa 2"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImageModal({
                                title: `${activeExamType} Deneme #${currentExamNumber} - 2. Görsel`,
                                src: currentPageState.image2!.base64,
                              })
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Büyüt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlotImage(2)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Kaldır</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="truncate max-w-[200px] font-mono text-[11px]">
                          {currentPageState.image2.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{currentPageState.image2.size}</span>
                          <button
                            type="button"
                            onClick={() => fileInputRef2.current?.click()}
                            className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold cursor-pointer underline ml-2"
                          >
                            Değiştir
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef2.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-indigo-500/70 bg-slate-900/50 hover:bg-slate-900 transition rounded-xl p-6 text-center cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-200">2. Görseli Seçin veya Sürükleyin</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, JPEG veya taranmış belge</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Run Analysis Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                {currentPageState.image1 && currentPageState.image2 ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Her iki görsel hazır! Analiz butonuna basarak ayrıştırmayı tamamlayabilirsiniz.</span>
                  </span>
                ) : (
                  <span>Lütfen analizi tamamlamak için hem 1. hem de 2. görseli yükleyin.</span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleRunExamAnalysis}
                  disabled={isScanning || !currentPageState.image1 || !currentPageState.image2}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                    activeExamType === 'TYT'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>2 Görsel Detaylıca İnceleniyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>2 Görseli Analiz Et ve Deneme #{currentExamNumber} Ayrıştırmasını Tamamla</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scan Error Alert */}
            {scanError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="space-y-0.5">
                  <strong className="font-bold">Analiz Uyarısı:</strong>
                  <p>{scanError}</p>
                </div>
              </div>
            )}

            {/* Success Alert */}
            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="space-y-0.5">
                  <strong className="font-bold">İşlem Başarılı:</strong>
                  <p>{successMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* PARSED STUDENTS RESULT TABLE & CONFIRMATION */}
          {currentPageState.parsedRows.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-black text-xs ${
                        activeExamType === 'TYT' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {activeExamType} Deneme #{currentExamNumber}
                    </span>
                    <h3 className="text-xl font-black text-white tracking-tight">
                      Öğrenci Sonuç Çizelgesi & Önceki Denemeyle Kıyaslama
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Bu denemeden okunan öğrenci branş netleri ve bir önceki denemeye göre (<strong className="text-emerald-400">▲ Artış</strong> / <strong className="text-rose-400">▼ Azalış</strong>) değişimleri aşağıdadır. İnceledikten sonra "Tüm Öğrenci Sayfalarına İşle ve Kaydet" butonuna tıklayınız.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddManualRow}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>+ Yeni Öğrenci Ekle</span>
                  </button>

                  <button
                    onClick={handleSaveAllToStudents}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-lg transition cursor-pointer flex items-center gap-2 ${
                      activeExamType === 'TYT'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tüm Öğrenci Sayfalarına İşle ve Kaydet ({currentPageState.parsedRows.length})</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-4 min-w-[200px]">Öğrenci Adı (Belgeden Okunan)</th>
                      <th className="py-3 px-4 min-w-[200px]">Sistemdeki Eşleşen Öğrenci</th>
                      <th className="py-3 px-3 w-24">Sınıf / No</th>
                      {currentPageState.parsedRows[0]?.subjects.map((sub, sIdx) => (
                        <th
                          key={sIdx}
                          className="py-3 px-3 text-center min-w-[140px] bg-slate-900/40 border-l border-slate-800"
                        >
                          <div>{sub.subjectName}</div>
                          <div className="text-[9px] text-slate-500 font-normal mt-0.5">D | Y | Net (Δ / %)</div>
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center min-w-[130px] bg-slate-950 border-l border-slate-800">
                        <div>Toplam Net</div>
                        <div className="text-[9px] text-slate-500 font-normal mt-0.5">Önceki / Değişim (Δ / %)</div>
                      </th>
                      <th className="py-3 px-3 w-12 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                    {currentPageState.parsedRows.map((row, rIdx) => {
                      const deltaTotal = row.deltaTotalNet;
                      const hasPrev = row.prevTotalNet !== undefined;

                      return (
                        <tr key={row.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 text-center text-slate-500 font-mono">{rIdx + 1}</td>

                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={row.scannedName}
                              onChange={(e) => handleUpdateStudentField(row.id, 'scannedName', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          <td className="py-3 px-4">
                            <select
                              value={row.matchedStudentId}
                              onChange={(e) => handleUpdateStudentField(row.id, 'matchedStudentId', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                            >
                              <option value="new">+ Yeni Öğrenci Olarak Ekle</option>
                              {students.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.className} - {s.branch})
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-3 px-3">
                            <span className="text-slate-300 font-semibold block">{row.className}</span>
                            <span className="text-[10px] text-slate-500">
                              {row.studentNo ? `No: ${row.studentNo}` : row.branch}
                            </span>
                          </td>

                          {row.subjects.map((sub, sIdx) => {
                            const branchDelta = row.branchDeltas?.[sub.subjectName];
                            const branchRate = row.branchRates?.[sub.subjectName] !== undefined
                              ? row.branchRates[sub.subjectName]
                              : (branchDelta !== undefined && (sub.net - branchDelta) > 0 && branchDelta !== 0
                                  ? Number(((branchDelta / (sub.net - branchDelta)) * 100).toFixed(1))
                                  : undefined);
                            return (
                              <td key={sIdx} className="py-2.5 px-3 border-l border-slate-800 bg-slate-950/20">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input
                                    type="number"
                                    min={0}
                                    max={sub.questionCount}
                                    value={sub.correct}
                                    onChange={(e) =>
                                      handleUpdateSubjectScore(row.id, sIdx, 'correct', Number(e.target.value))
                                    }
                                    className="w-10 bg-slate-900 border border-emerald-500/40 rounded px-1.5 py-1 text-center font-bold text-emerald-400 text-xs focus:outline-none focus:border-emerald-500"
                                    title="Doğru Sayısı"
                                  />
                                  <span className="text-slate-600 font-mono">/</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={sub.questionCount}
                                    value={sub.wrong}
                                    onChange={(e) =>
                                      handleUpdateSubjectScore(row.id, sIdx, 'wrong', Number(e.target.value))
                                    }
                                    className="w-10 bg-slate-900 border border-rose-500/40 rounded px-1.5 py-1 text-center font-bold text-rose-400 text-xs focus:outline-none focus:border-rose-500"
                                    title="Yanlış Sayısı"
                                  />
                                </div>

                                <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                                  <span className="font-black text-slate-200 text-xs">{sub.net}</span>
                                  {hasPrev && branchDelta !== undefined && (
                                    <span
                                      className={`text-[9.5px] font-bold flex items-center gap-0.5 px-1 py-0.2 rounded ${
                                        branchDelta > 0
                                          ? 'text-emerald-400 bg-emerald-500/10'
                                          : branchDelta < 0
                                          ? 'text-rose-400 bg-rose-500/10'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      <span>
                                        {branchDelta > 0 && `+${branchDelta}▲`}
                                        {branchDelta < 0 && `${branchDelta}▼`}
                                        {branchDelta === 0 && '0'}
                                      </span>
                                      {branchRate !== undefined && branchDelta !== 0 && (
                                        <span className="font-semibold text-[8.5px] opacity-90">
                                          ({branchRate > 0 ? `+${branchRate}%` : `${branchRate}%`})
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          <td className="py-3 px-4 text-center border-l border-slate-800 bg-slate-950/40">
                            <div className="font-black text-sm text-white">{row.totalNet} Net</div>
                            {hasPrev ? (
                              <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                                {deltaTotal !== undefined && deltaTotal > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px] flex items-center gap-0.5">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>+{deltaTotal} Net ▲</span>
                                    {row.deltaTotalRate !== undefined && (
                                      <span className="text-[9px] font-semibold opacity-90">(+{row.deltaTotalRate}%)</span>
                                    )}
                                  </span>
                                )}
                                {deltaTotal !== undefined && deltaTotal < 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold text-[10px] flex items-center gap-0.5">
                                    <TrendingDown className="w-3 h-3" />
                                    <span>{deltaTotal} Net ▼</span>
                                    {row.deltaTotalRate !== undefined && (
                                      <span className="text-[9px] font-semibold opacity-90">({row.deltaTotalRate}%)</span>
                                    )}
                                  </span>
                                )}
                                {deltaTotal === 0 && (
                                  <span className="text-slate-400 text-[10px] font-medium">Değişmedi (0.00)</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500">İlk Deneme</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                              title="Satırı Kaldır"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Sonuçları kaydettikten sonra üstteki şeritten sıradaki deneme sayfasına geçebilirsiniz. Tüm denemeler saklanır.
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleSaveAllToStudents}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-sm text-white shadow-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                      activeExamType === 'TYT'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tüm Öğrenci Sayfalarına İşle ve Sakla ({currentPageState.parsedRows.length} Öğrenci)</span>
                  </button>

                  <button
                    onClick={() => {
                      const nextNum = Math.min(100, currentExamNumber + 1);
                      if (activeExamType === 'TYT') setSelectedTytNumber(nextNum);
                      else setSelectedAytNumber(nextNum);
                      setScanError(null);
                      setSuccessMessage(null);
                    }}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Sıradaki Denemeye Geç (#{currentExamNumber + 1})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW MODE 3: COLLECTIVE BRANCH ANALYTICS & CROSS-EXAM COMPARISONS     */}
      {/* ===================================================================== */}
      {activeTabMode === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    Denemeler Arası Kıyaslama Raporu
                  </span>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    <span>Toplu Deneme & Branş Bazlı Kıyaslama ve Değerlendirme</span>
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                  Sisteme yüklenen tüm denemeler (Deneme 1, Deneme 2, Deneme 3...) karşılaştırılarak her branşın sınıf ortalamasındaki net artış ve azalışları, en çok yükselen branşlar ve öğrenci bazlı değişimler aşağıda incelenmektedir.
                </p>
              </div>

              {/* Exam Type Filter */}
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
                <button
                  onClick={() => setAnalyticsExamType('TYT')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    analyticsExamType === 'TYT'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  TYT Branşları
                </button>
                <button
                  onClick={() => setAnalyticsExamType('AYT')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    analyticsExamType === 'AYT'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AYT Branşları
                </button>
                <button
                  onClick={() => setAnalyticsExamType('ALL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    analyticsExamType === 'ALL'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tüm Sınavlar
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold">İncelenen Deneme Sayısı</span>
                <div className="text-xl font-black text-white">{branchAnalyticsData.relevantExams.length} Deneme</div>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {analyticsExamType === 'ALL' ? 'TYT & AYT' : `${analyticsExamType} Sınavları`}
                </span>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold">Kayıtlı Branş Sayısı</span>
                <div className="text-xl font-black text-indigo-400">{branchAnalyticsData.subjectNames.length} Branş</div>
                <span className="text-[10px] text-slate-400 font-mono">Ders Bazında Takip</span>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold">En Yüksek Net Artışı</span>
                {branchAnalyticsData.branchStats.length > 0 && branchAnalyticsData.branchStats[0].overallDelta > 0 ? (
                  <>
                    <div className="text-xl font-black text-emerald-400">
                      +{branchAnalyticsData.branchStats[0].overallDelta} Net ▲
                    </div>
                    <span className="text-[10px] text-slate-300 truncate block">
                      {branchAnalyticsData.branchStats[0].subjectName}
                    </span>
                  </>
                ) : (
                  <div className="text-sm font-bold text-slate-500">—</div>
                )}
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold">Öğrenci Katılımı</span>
                <div className="text-xl font-black text-amber-300">{students.length} Öğrenci</div>
                <span className="text-[10px] text-slate-400 font-mono">Aktif Sınıf Verisi</span>
              </div>
            </div>
          </div>

          {/* DEDICATED DIRECT EXAM-TO-EXAM COMPARISON CARD (Deneme X vs Deneme Y) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                  <span>Sınavlar Arası Birebir Kıyaslama Seçicisi</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dilediğiniz iki denemeyi seçerek sınıf ve öğrenci netlerinin doğrudan karşılaştırmasını inceleyin.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">1. Sınav:</span>
                  <select
                    value={compareExam1Num}
                    onChange={(e) => setCompareExam1Num(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {aggregatedExams
                      .filter((e) => e.examType === (analyticsExamType === 'AYT' ? 'AYT' : 'TYT'))
                      .map((e) => (
                        <option key={e.examNumber} value={e.examNumber}>
                          {e.examType} Deneme #{e.examNumber} ({e.examTitle})
                        </option>
                      ))}
                  </select>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">2. Sınav:</span>
                  <select
                    value={compareExam2Num}
                    onChange={(e) => setCompareExam2Num(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {aggregatedExams
                      .filter((e) => e.examType === (analyticsExamType === 'AYT' ? 'AYT' : 'TYT'))
                      .map((e) => (
                        <option key={e.examNumber} value={e.examNumber}>
                          {e.examType} Deneme #{e.examNumber} ({e.examTitle})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {directComparisonReport ? (
              <div className="space-y-6">
                {/* Comparison Highlight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-slate-400">Sınıf Toplam Net Değişimi</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white">
                        {directComparisonReport.exam1.averageNet} ➔ {directComparisonReport.exam2.averageNet} Net
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 ${
                        directComparisonReport.deltaAvgTotal > 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : directComparisonReport.deltaAvgTotal < 0
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'text-slate-400 bg-slate-800'
                      }`}
                    >
                      {directComparisonReport.deltaAvgTotal > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                      {directComparisonReport.deltaAvgTotal < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                      <span>
                        {directComparisonReport.deltaAvgTotal > 0 && `+${directComparisonReport.deltaAvgTotal}▲ Sınıf Ortalaması Arttı`}
                        {directComparisonReport.deltaAvgTotal < 0 && `${directComparisonReport.deltaAvgTotal}▼ Sınıf Ortalaması Düştü`}
                        {directComparisonReport.deltaAvgTotal === 0 && 'Değişmedi (0.00)'}
                      </span>
                    </span>
                  </div>

                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-slate-400">Net Değişim Dağılımı</span>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>Neti Artan:</span>
                        <span>{directComparisonReport.improvedCount} Öğrenci ▲</span>
                      </div>
                      <div className="flex items-center justify-between text-rose-400 font-bold">
                        <span>Neti Düşen:</span>
                        <span>{directComparisonReport.declinedCount} Öğrenci ▼</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 font-medium">
                        <span>Değişmeyen:</span>
                        <span>{directComparisonReport.unchangedCount} Öğrenci</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-slate-400">En Çok Net Artıran Öğrenciler</span>
                    <div className="space-y-1">
                      {directComparisonReport.topImprovers.length > 0 ? (
                        directComparisonReport.topImprovers.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white truncate max-w-[150px]">{s.student.name}</span>
                            <span className="font-black text-emerald-400 font-mono">+{s.diff}▲ Net</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">Veri bulunamadı</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-slate-400">Takip Gereken / Düşüş Yaşayanlar</span>
                    <div className="space-y-1">
                      {directComparisonReport.needAttention.length > 0 ? (
                        directComparisonReport.needAttention.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white truncate max-w-[150px]">{s.student.name}</span>
                            <span className="font-black text-rose-400 font-mono">{s.diff}▼ Net</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-400 font-medium">Bu denemede düşüş yaşayan öğrenci yok!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject-by-Subject Delta Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Branş Bazında Deneme #{compareExam1Num} ile Deneme #{compareExam2Num} Sınıf Ortalaması Kıyaslaması
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {directComparisonReport.branchComparison.map((b) => (
                      <div
                        key={b.subjectName}
                        className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5"
                      >
                        <span className="text-xs font-bold text-slate-300 block truncate">{b.subjectName}</span>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{b.avg1} ➔ {b.avg2} Net</span>
                          <span
                            className={`font-black text-[11px] inline-flex items-center gap-1 ${
                              b.delta > 0 ? 'text-emerald-400' : b.delta < 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {b.delta > 0 && `+${b.delta}▲`}
                              {b.delta < 0 && `${b.delta}▼`}
                              {b.delta === 0 && '0.00'}
                            </span>
                            {b.rate !== undefined && b.delta !== 0 && (
                              <span className="font-semibold text-[9.5px] opacity-90">
                                ({b.rate > 0 ? `+${b.rate}%` : `${b.rate}%`})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Student-by-Student Detailed Direct Comparison Table */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Öğrenci Bazında Deneme #{compareExam1Num} ile Deneme #{compareExam2Num} Kıyaslama Tablosu</span>
                    <span className="text-[11px] font-mono text-cyan-400 font-normal">{directComparisonReport.studentDeltas.length} Öğrenci Karşılaştırıldı</span>
                  </h4>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3 w-12 text-center">Sıra</th>
                          <th className="py-2.5 px-4 min-w-[160px]">Öğrenci Adı</th>
                          <th className="py-2.5 px-3 min-w-[110px]">Sınıf / Alan</th>
                          <th className="py-2.5 px-3 text-center min-w-[100px] bg-slate-900/40 border-l border-slate-800">
                            Deneme #{compareExam1Num} Net
                          </th>
                          <th className="py-2.5 px-3 text-center min-w-[100px] bg-slate-900/40 border-l border-slate-800">
                            Deneme #{compareExam2Num} Net
                          </th>
                          <th className="py-2.5 px-3 text-center min-w-[110px] bg-slate-950 border-l border-slate-800 font-bold text-white">
                            Toplam Net Farkı (Δ)
                          </th>
                          <th className="py-2.5 px-4 min-w-[260px] bg-slate-900/30 border-l border-slate-800">
                            Branş Bazlı Farklar (Ders Ders Δ)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                        {directComparisonReport.studentDeltas.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-500">
                              Bu iki sınav için ortak öğrenci kaydı bulunamadı.
                            </td>
                          </tr>
                        ) : (
                          directComparisonReport.studentDeltas
                            .sort((a, b) => b.diff - a.diff)
                            .map((row, rIdx) => {
                              const isPositive = row.diff > 0;
                              const isNegative = row.diff < 0;

                              return (
                                <tr key={row.student.id} className="hover:bg-slate-800/40 transition">
                                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                                    {rIdx + 1}
                                  </td>
                                  <td className="py-2.5 px-4 font-bold text-white">
                                    {onNavigateToStudent ? (
                                      <button
                                        type="button"
                                        onClick={() => onNavigateToStudent(row.student)}
                                        className="hover:text-indigo-400 hover:underline cursor-pointer text-left"
                                      >
                                        {row.student.name}
                                      </button>
                                    ) : (
                                      row.student.name
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-400">
                                    {row.student.className} • {row.student.branch}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold text-slate-300 border-l border-slate-800">
                                    {row.net1} Net
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold text-indigo-300 border-l border-slate-800">
                                    {row.net2} Net
                                  </td>
                                  <td className="py-2.5 px-3 text-center border-l border-slate-800 bg-slate-950/40">
                                    <span
                                      className={`px-2 py-0.5 rounded-lg font-black text-xs inline-flex items-center gap-1 ${
                                        isPositive
                                          ? 'bg-emerald-500/20 text-emerald-300'
                                          : isNegative
                                          ? 'bg-rose-500/20 text-rose-300'
                                          : 'text-slate-400 bg-slate-800'
                                      }`}
                                    >
                                      {isPositive && `+${row.diff}▲ Net`}
                                      {isNegative && `${row.diff}▼ Net`}
                                      {row.diff === 0 && '0.00 Net'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 border-l border-slate-800">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {Object.entries(row.branchDiffs).map(([branchName, bData]: [string, any]) => {
                                        const shortName = branchName.replace('TYT ', '').replace('AYT ', '');
                                        const bPositive = bData.delta > 0;
                                        const bNegative = bData.delta < 0;

                                        return (
                                          <span
                                            key={branchName}
                                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold inline-flex items-center gap-0.5 ${
                                              bPositive
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : bNegative
                                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                : 'bg-slate-800 text-slate-400'
                                            }`}
                                            title={`${branchName}: ${bData.n1} ➔ ${bData.n2} (Fark: ${bData.delta > 0 ? '+' : ''}${bData.delta}${bData.rate !== undefined ? `, Oran: ${bData.rate > 0 ? '+' : ''}${bData.rate}%` : ''})`}
                                          >
                                            <span>{shortName}: {bPositive ? `+${bData.delta}▲` : bNegative ? `${bData.delta}▼` : '0'}</span>
                                            {bData.rate !== undefined && bData.delta !== 0 && (
                                              <span className="text-[8.5px] font-normal opacity-90">
                                                ({bData.rate > 0 ? `+${bData.rate}%` : `${bData.rate}%`})
                                              </span>
                                            )}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                Kıyaslama yapabilmek için lütfen yukarıdaki menüden iki farklı deneme seçiniz.
              </div>
            )}
          </div>

          {/* BRANCH CARDS GRID */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Branş Bazında Genel Değerlendirme & Sınavlar Arası İlerleme Grafiği</span>
            </h3>

            {branchAnalyticsData.branchStats.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">Henüz İncelenecek Deneme Bulunmuyor</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Yukarıdaki "TYT Denemeleri" veya "AYT Denemeleri" sekmelerinden en az iki deneme yükleyerek artış ve azalış grafiklerini görüntüleyebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {branchAnalyticsData.branchStats.map((branch) => {
                  const hasIncrease = branch.overallDelta > 0;
                  const hasDecrease = branch.overallDelta < 0;

                  return (
                    <div
                      key={branch.subjectName}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-black text-base text-white">{branch.subjectName}</h4>
                          <span className="text-[11px] text-slate-400">{branch.examCount} Deneme Boyunca Takip</span>
                        </div>

                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                            hasIncrease
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : hasDecrease
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {hasIncrease && <TrendingUp className="w-3.5 h-3.5" />}
                          {hasDecrease && <TrendingDown className="w-3.5 h-3.5" />}
                          <span>
                            {hasIncrease && `+${branch.overallDelta}▲`}
                            {hasDecrease && `${branch.overallDelta}▼`}
                            {branch.overallDelta === 0 && '0.00'}
                          </span>
                        </span>
                      </div>

                      {/* Progression Steps (Deneme 1 -> Deneme 2 -> Deneme 3) */}
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Sınav Bazında Sınıf Ortalama Netleri:
                        </span>

                        <div className="space-y-1.5">
                          {branch.validExams.map((ex, exIdx) => {
                            const prevEx = exIdx > 0 ? branch.validExams[exIdx - 1] : null;
                            const stepDelta = prevEx ? Number((ex.averageNet - prevEx.averageNet).toFixed(2)) : null;

                            return (
                              <div
                                key={ex.examKey}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-850 text-xs"
                              >
                                <span className="font-bold text-slate-300">
                                  {ex.examType} Deneme #{ex.examNumber}
                                </span>

                                <div className="flex items-center gap-2">
                                  <span className="font-black text-white">{ex.averageNet} Net</span>
                                  {stepDelta !== null && (
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        stepDelta > 0
                                          ? 'bg-emerald-500/10 text-emerald-400'
                                          : stepDelta < 0
                                          ? 'bg-rose-500/10 text-rose-400'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {stepDelta > 0 && `+${stepDelta}▲`}
                                      {stepDelta < 0 && `${stepDelta}▼`}
                                      {stepDelta === 0 && '0'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer Stat */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Son Sınav Ortalaması:</span>
                        <strong className="text-indigo-300 font-black">{branch.latestAverage} Net</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STUDENT LEVEL COMPARISON MATRIX ACROSS EXAMS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Öğrenci Bazlı Branş Değişim Matrisi (Tüm Denemeler)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Her öğrencinin denemeler arasındaki net değişimlerini ve toplam yükseliş/düşüş trendlerini inceleyebilirsiniz.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={analyticsSearchStudent}
                    onChange={(e) => setAnalyticsSearchStudent(e.target.value)}
                    placeholder="Öğrenci ara..."
                    className="bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Branch selector */}
                <select
                  value={analyticsSelectedBranch}
                  onChange={(e) => setAnalyticsSelectedBranch(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Toplam Net Karşılaştırması</option>
                  {branchAnalyticsData.subjectNames.map((subj) => (
                    <option key={subj} value={subj}>
                      Sadece: {subj}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 min-w-[180px]">Öğrenci Adı</th>
                    <th className="py-3 px-3 w-28">Sınıf / Alan</th>
                    {branchAnalyticsData.relevantExams.map((ex) => (
                      <th
                        key={ex.key}
                        className="py-3 px-3 text-center min-w-[120px] bg-slate-900/40 border-l border-slate-800"
                      >
                        <div>
                          {ex.examType} #{ex.examNumber}
                        </div>
                        <div className="text-[9px] text-slate-500 font-normal">{ex.date}</div>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center min-w-[120px] bg-slate-950 border-l border-slate-800">
                      Toplam Değişim
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                  {students
                    .filter((s) => s.name.toLowerCase().includes(analyticsSearchStudent.toLowerCase()))
                    .map((student) => {
                      const examResults = branchAnalyticsData.relevantExams.map((ex) => {
                        const rec = (student.trialExams || []).find(
                          (t) => t.examType === ex.examType && t.examNumber === ex.examNumber
                        );
                        if (!rec) return null;

                        if (analyticsSelectedBranch === 'all') {
                          return {
                            net: rec.totalNet,
                            delta: rec.deltaTotalNet,
                            rate: rec.deltaTotalRate,
                          };
                        } else {
                          const subj = rec.subjects.find((s) => s.subjectName === analyticsSelectedBranch);
                          const sRate = subj?.deltaRate !== undefined
                            ? subj.deltaRate
                            : (subj?.deltaNet !== undefined && (subj.net - subj.deltaNet) > 0 && subj.deltaNet !== 0
                                ? Number(((subj.deltaNet / (subj.net - subj.deltaNet)) * 100).toFixed(1))
                                : undefined);
                          return subj ? { net: subj.net, delta: subj.deltaNet, rate: sRate } : null;
                        }
                      });

                      const validResults = examResults.filter((r) => r !== null) as { net: number; delta?: number; rate?: number }[];
                      let overallDelta: number | undefined = undefined;
                      if (validResults.length >= 2) {
                        const first = validResults[0].net;
                        const last = validResults[validResults.length - 1].net;
                        overallDelta = Number((last - first).toFixed(2));
                      }

                      return (
                        <tr key={student.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-bold text-white">
                            {onNavigateToStudent ? (
                              <button
                                type="button"
                                onClick={() => onNavigateToStudent(student)}
                                className="hover:text-indigo-400 hover:underline cursor-pointer text-left"
                              >
                                {student.name}
                              </button>
                            ) : (
                              student.name
                            )}
                          </td>

                          <td className="py-3 px-3 text-slate-400">
                            {student.className} • {student.branch}
                          </td>

                          {examResults.map((res, exIdx) => (
                            <td key={exIdx} className="py-2.5 px-3 text-center border-l border-slate-800">
                              {res ? (
                                <div>
                                  <span className="font-black text-white">{res.net}</span>
                                  {res.delta !== undefined && (
                                    <span
                                      className={`ml-1 text-[10px] font-bold ${
                                        res.delta > 0
                                          ? 'text-emerald-400'
                                          : res.delta < 0
                                          ? 'text-rose-400'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      <span>
                                        {res.delta > 0 && `+${res.delta}▲`}
                                        {res.delta < 0 && `${res.delta}▼`}
                                        {res.delta === 0 && '0'}
                                      </span>
                                      {res.rate !== undefined && res.delta !== 0 && (
                                        <span className="font-semibold text-[8.5px] opacity-90 ml-0.5">
                                          ({res.rate > 0 ? `+${res.rate}%` : `${res.rate}%`})
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                          ))}

                          <td className="py-3 px-3 text-center border-l border-slate-800 bg-slate-950/40">
                            {overallDelta !== undefined ? (
                              <span
                                className={`px-2 py-0.5 rounded-lg font-bold text-xs inline-flex items-center gap-1 ${
                                  overallDelta > 0
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : overallDelta < 0
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'text-slate-400'
                                }`}
                              >
                                {overallDelta > 0 && `+${overallDelta}▲`}
                                {overallDelta < 0 && `${overallDelta}▼`}
                                {overallDelta === 0 && '0.00'}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">Veri Yok</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW MODE 4: MANAGE & DELETE UPLOADED EXAMS (SERDAR AKTAŞ AUTHORITY)    */}
      {/* ===================================================================== */}
      {activeTabMode === 'MANAGE' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                  <span>Sistemde Kayıtlı Denemeleri Yönet & Sil</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Yönetici Serdar Aktaş yetkisi ile sisteme yüklenen tüm denemeleri silebilir veya hatalı girilen öğrenci sonuçlarını tek tek kaldırabilirsiniz.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Toplam {aggregatedExams.length} Deneme Kaydı</span>
                </span>
              </div>
            </div>

            {aggregatedExams.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
                <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">Henüz Yüklenmiş Deneme Bulunmuyor</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Yukarıdaki "TYT Denemeleri" veya "AYT Denemeleri" sekmelerinden ilk deneme sonuç görsellerini yükleyebilirsiniz.
                </p>
                <button
                  onClick={() => setActiveTabMode('TYT')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  TYT Denemesi Yükle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {aggregatedExams.map((exam) => {
                  const isExpanded = expandedExamKey === exam.key;
                  return (
                    <div
                      key={exam.key}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 ${
                              exam.examType === 'TYT'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                                : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/50'
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold text-slate-400">{exam.examType}</span>
                            <span className="text-base font-black">#{exam.examNumber}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-black text-white">{exam.examTitle}</h3>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  exam.examType === 'TYT'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                }`}
                              >
                                {exam.examType} Sınavı
                              </span>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {exam.date}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1 text-slate-300">
                                <Users className="w-3.5 h-3.5 text-indigo-400" />
                                <strong>{exam.studentRecords.length}</strong> Öğrenci Katıldı
                              </span>
                              <span>•</span>
                              <span>
                                Ortalama Net: <strong className="text-indigo-300">{exam.averageNet} Net</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Net Aralığı: <strong className="text-slate-300">{exam.minNet} - {exam.maxNet} Net</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                          <button
                            type="button"
                            onClick={() => setExpandedExamKey(isExpanded ? null : exam.key)}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Öğrenci Dökümü ({exam.studentRecords.length})</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExamToDelete({
                                key: exam.key,
                                examType: exam.examType,
                                examNumber: exam.examNumber,
                                examTitle: exam.examTitle,
                                studentCount: exam.studentRecords.length,
                              })
                            }
                            className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                            title="Tüm denemeyi ve tüm öğrenci sonuçlarını sil"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Denemeyi Sil</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Student Results Matrix */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-800/80 space-y-2">
                          <div className="text-xs font-bold text-slate-300">
                            Bu Denemeye Kayıtlı Öğrenci Sonuçları (Tekil Olarak da Silebilirsiniz):
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px]">
                                  <th className="py-2.5 px-3">Öğrenci Adı</th>
                                  <th className="py-2.5 px-2">Sınıf / No</th>
                                  <th className="py-2.5 px-2">Alan</th>
                                  <th className="py-2.5 px-3 text-center">Toplam Net</th>
                                  <th className="py-2.5 px-3">Branş Dökümü</th>
                                  <th className="py-2.5 px-3 text-center">İşlem</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                                {exam.studentRecords.map(({ student, record }) => (
                                  <tr key={record.id} className="hover:bg-slate-900/40 transition">
                                    <td className="py-2.5 px-3 font-bold text-white">
                                      {onNavigateToStudent ? (
                                        <button
                                          type="button"
                                          onClick={() => onNavigateToStudent(student)}
                                          className="hover:text-indigo-400 hover:underline cursor-pointer text-left"
                                        >
                                          {student.name}
                                        </button>
                                      ) : (
                                        student.name
                                      )}
                                    </td>
                                    <td className="py-2.5 px-2 text-slate-400">
                                      {student.className} • #{student.studentNo}
                                    </td>
                                    <td className="py-2.5 px-2">
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                        {student.branch}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-black text-indigo-300">
                                      {record.totalNet} Net
                                      {record.deltaTotalNet !== undefined && (
                                        <span
                                          className={`ml-1 text-[10px] font-bold ${
                                            record.deltaTotalNet > 0
                                              ? 'text-emerald-400'
                                              : record.deltaTotalNet < 0
                                              ? 'text-rose-400'
                                              : 'text-slate-500'
                                          }`}
                                        >
                                          {record.deltaTotalNet > 0 && `+${record.deltaTotalNet}▲`}
                                          {record.deltaTotalNet < 0 && `${record.deltaTotalNet}▼`}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-300">
                                      <div className="flex flex-wrap gap-1.5">
                                        {record.subjects.map((s, si) => (
                                          <span
                                            key={si}
                                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                                          >
                                            {s.subjectName.replace('TYT ', '').replace('AYT ', '')}: <strong>{s.net}</strong>
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSingleRecordToDelete({
                                            studentId: student.id,
                                            studentName: student.name,
                                            examId: record.id,
                                            examTitle: record.examTitle,
                                            examNumber: record.examNumber,
                                            examType: record.examType,
                                          })
                                        }
                                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
                                        title={`${student.name} sonucunu bu denemeden sil`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guide & Rules Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-xs text-slate-400 space-y-3">
        <h4 className="font-bold text-slate-200 flex items-center gap-2 text-sm">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Deneme Sonuçlarının Saklanması & Kıyaslama Mantığı</span>
        </h4>
        <ul className="list-disc list-inside space-y-1.5 leading-relaxed text-slate-400">
          <li>
            <strong>Kalıcı Veri Saklama:</strong> Yüklediğiniz her deneme (Deneme 1, Deneme 2, Deneme 3...) sunucuda ve öğrenci profillerinde saklanır; başka denemelere geçtiğinizde önceki denemeler ASLA kaybolmaz.
          </li>
          <li>
            <strong>Sınavlar Arası Artış/Azalış Kıyaslaması:</strong> Deneme 2, Deneme 1 ile; Deneme 3, Deneme 2 ile kıyaslanır. Her branştaki doğru, yanlış ve net farkları (<strong className="text-emerald-400">▲ Artış</strong> ve <strong className="text-rose-400">▼ Azalış</strong>) anında hesaplanır.
          </li>
          <li>
            <strong>Birebir Kıyaslama Raporu:</strong> "Denemeler Arası Kıyaslama & Analiz" sekmesinden herhangi iki denemeyi seçerek sınıf ortalamalarındaki sıçramaları ve öğrenci ilerlemelerini yan yana karşılaştırabilirsiniz.
          </li>
          <li>
            <strong>Yetki Kısıtı:</strong> Deneme yükleme ve silme yetkisi sadece Serdar Aktaş hesabına aittir.
          </li>
        </ul>
      </div>

      {/* MODAL: IMAGE PREVIEW LIGHTBOX */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-sm text-white">{previewImageModal.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-xl bg-black/50 flex items-center justify-center p-2">
              <img
                src={previewImageModal.src}
                alt={previewImageModal.title}
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TÜM DENEMEYİ SİLME ONAYI (SERDAR AKTAŞ YÖNETİCİ YETKİSİ) */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span>Denemeyi ve Tüm Sonuçları Sil</span>
              </h3>
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
              <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Yönetici Yetkisi: Serdar Aktaş</span>
              </div>
              <p className="text-xs text-slate-200">
                <strong className="text-indigo-300">
                  {examToDelete.examType} Deneme #{examToDelete.examNumber} ({examToDelete.examTitle})
                </strong>{' '}
                sınavına ait tüm <strong className="text-white">{examToDelete.studentCount} öğrencinin</strong> sonuçlarını silmek istediğinize emin misiniz?
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Bu işlem sonucunda ilgili deneme tüm öğrencilerin profillerinden tamamen kaldırılacak, kalan denemelerin net artış/azalış hesaplamaları baştan düzenlenecektir.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEntireExam(examToDelete)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Evet, Tüm Sonuçları Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TEKİL ÖĞRENCİ DENEME SONUCU SİLME ONAYI */}
      {singleRecordToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span>Öğrenci Deneme Sonucunu Sil</span>
              </h3>
              <button
                type="button"
                onClick={() => setSingleRecordToDelete(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1.5">
              <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Yönetici Yetkisi: Serdar Aktaş</span>
              </div>
              <p className="text-xs text-slate-300">
                <strong className="text-white">{singleRecordToDelete.studentName}</strong> adlı öğrencinin{' '}
                <strong className="text-indigo-300">
                  {singleRecordToDelete.examType} Deneme #{singleRecordToDelete.examNumber}
                </strong>{' '}
                sonucunu silmek istediğinize emin misiniz?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSingleRecordToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDeleteSingleStudentRecord(
                    singleRecordToDelete.studentId,
                    singleRecordToDelete.examId
                  )
                }
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 rounded-xl transition cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
