import React, { useState, useMemo } from 'react';
import {
  Student12thGrade,
  SubjectNetDetail,
  SubjectKazanimDetail,
  ScheduleTask,
  SkillKazanim,
  OpticalExamEvaluationResult,
  DayProgram,
  TrialExamRecord,
} from '../types';
import { generateStudentProgramPDF } from '../utils/pdfGenerator';
import { generateKazanimlarForSubject, parseOpticalDocument } from '../utils/kazanimGenerator';
import { generateAdaptiveWeeklyProgram } from '../utils/programGenerator';
import { isSubjectAllowedForBranch } from '../utils/branchUtils';
import { ExamTrendChart, ExamHistoryPoint } from './ExamTrendChart';
import { OpticalExamModal } from './OpticalExamModal';
import { StudentAvatarBadge, getStudentGender } from '../utils/studentAvatar';
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
  ChevronDown,
  ChevronUp,
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
  Trash2,
  Scan,
  Shield,
  Eye,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

interface StudentDetailViewProps {
  student: Student12thGrade;
  onBack: () => void;
  onUpdateStudent: (updated: Student12thGrade) => void;
  onDeleteStudent?: (id: string) => void;
  isManager?: boolean;
  teacherName?: string;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  student,
  onBack,
  onUpdateStudent,
  onDeleteStudent,
  isManager = false,
  teacherName = '',
}) => {
  const [selectedExamTab, setSelectedExamTab] = useState<'TYT' | 'AYT' | 'HEPSİ'>('TYT');
  const [activeSubjectModal, setActiveSubjectModal] = useState<SubjectNetDetail | null>(null);
  const [kazanimFilter, setKazanimFilter] = useState<'all' | 'struggling' | 'mastered'>('all');
  
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  // Modals state
  const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [isOpticalModalOpen, setIsOpticalModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Add Exam Modal Tab
  const [addExamTab, setAddExamTab] = useState<'manual' | 'document'>('document');
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileScanError, setFileScanError] = useState<string | null>(null);

  // Trial Exam History Tab (TYT / AYT)
  const [trialHistoryTab, setTrialHistoryTab] = useState<'TYT' | 'AYT'>('TYT');
  const [examToDelete, setExamToDelete] = useState<TrialExamRecord | null>(null);

  // Exam Image Document Viewer Modal
  const [selectedExamImageModal, setSelectedExamImageModal] = useState<{
    examTitle: string;
    examDate: string;
    images: string[];
  } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [imageZoom, setImageZoom] = useState<number>(1);

  // Delete trial exam handler (Serdar Aktaş / Manager only)
  const handleConfirmDeleteTrialExam = () => {
    if (!examToDelete) return;

    // Filter out from student.trialExams
    const updatedTrials = (student.trialExams || []).filter(
      (e) => e.id !== examToDelete.id && !(e.examType === examToDelete.examType && e.examNumber === examToDelete.examNumber && e.examTitle === examToDelete.examTitle)
    );

    // Filter out from student.history if matching
    const updatedHistory = (student.history || []).filter(
      (h) => !(h.examTitle.includes(`Deneme #${examToDelete.examNumber}`) || (h.examTitle === examToDelete.examTitle && h.date === examToDelete.date))
    );

    let newLatestTyt = student.latestTyt;
    let newLatestAyt = student.latestAyt;

    if (examToDelete.examType === 'TYT') {
      const remainingTyt = updatedTrials.filter((e) => e.examType === 'TYT').sort((a, b) => b.examNumber - a.examNumber);
      if (remainingTyt.length > 0) {
        const topTyt = remainingTyt[0];
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
      const remainingAyt = updatedTrials.filter((e) => e.examType === 'AYT').sort((a, b) => b.examNumber - a.examNumber);
      if (remainingAyt.length > 0) {
        const topAyt = remainingAyt[0];
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

    const updatedStudent: Student12thGrade = {
      ...student,
      trialExams: updatedTrials,
      history: updatedHistory,
      latestTyt: newLatestTyt,
      latestAyt: newLatestAyt,
    };

    onUpdateStudent(updatedStudent);
    setExamToDelete(null);
  };

  // Edit Student Form State
  const [editName, setEditName] = useState(student.name);
  const [editStudentNo, setEditStudentNo] = useState(student.studentNo);
  const [editClassName, setEditClassName] = useState(student.className);
  const [editBranch, setEditBranch] = useState(student.branch);
  const [editGender, setEditGender] = useState<'K' | 'E'>(() => getStudentGender(student));
  const [editMentorNote, setEditMentorNote] = useState(student.mentorNote);

  // Add Exam Form State
  const [newExamName, setNewExamName] = useState('');
  const [newExamType, setNewExamType] = useState<'TYT' | 'AYT' | 'HEPSİ'>('TYT');
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
    setEditGender(getStudentGender(student));
    setEditMentorNote(student.mentorNote);
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
      gender: editGender,
      avatarUrl: '',
      mentorNote: editMentorNote,
    };

    onUpdateStudent(updated);
    setIsEditInfoModalOpen(false);
    setAiSuccessMsg('Öğrenci bilgileri güncellendi.');
  };

  // Automatically extract all weak/struggling topics (bold font on optical reports)
  const allDecliningTopics: SkillKazanim[] = useMemo(() => {
    const list: SkillKazanim[] = [...(student.decliningKazanimlar || [])].filter(d =>
      isSubjectAllowedForBranch(d.subject, student.branch)
    );
    const existingTopics = new Set(list.map(d => d.topicName.toLowerCase().trim()));

    const addStrugglingFromExams = (subjects?: SubjectNetDetail[]) => {
      if (!subjects) return;
      subjects.forEach((subj) => {
        if (!isSubjectAllowedForBranch(subj.subjectName, student.branch)) return;
        if (subj.kazanimlar) {
          subj.kazanimlar.forEach((k) => {
            if ((k.status === 'struggling' || k.status === 'blank' || (k.wrongCount && k.wrongCount > 0)) && !existingTopics.has(k.topicName.toLowerCase().trim())) {
              existingTopics.add(k.topicName.toLowerCase().trim());
              list.push({
                id: `auto-dec-${subj.subjectName}-${k.topicName}`,
                subject: subj.subjectName,
                topicName: k.topicName,
                changeRate: 'Eksik Konu',
                status: 'declining',
                detailNote: k.recommendation || `Eksik olduğu konu. Hata sayısı: ${k.wrongCount || 1}.`,
              });
            }
          });
        }
      });
    };

    addStrugglingFromExams(student.latestTyt?.subjects);
    addStrugglingFromExams(student.latestAyt?.subjects);

    return list;
  }, [student]);

  // Normalize subject branch names (e.g., TYT Türkçe, TYT Matematik, AYT Matematik, TYT Fizik, AYT Fizik...)
  const normalizeSubjectName = (rawName: string): string => {
    if (!rawName) return 'Diğer Konular';
    const name = rawName.trim();
    const upper = name.toUpperCase();

    // Check AYT explicitly if AYT is present or subject ends with 1/2
    if (upper.includes('AYT') || upper.includes('TARİH 1') || upper.includes('COĞRAFYA 1') || upper.includes('EDEBİYAT')) {
      if (upper.includes('EDEBİYAT') || upper.includes('TÜRK DİLİ')) return 'AYT Edebiyat';
      if (upper.includes('MATEMATİK') || upper.includes('MAT')) return 'AYT Matematik';
      if (upper.includes('GEOMETRİ') || upper.includes('GEOMETRI')) return 'AYT Geometri';
      if (upper.includes('FİZİK') || upper.includes('FIZIK')) return 'AYT Fizik';
      if (upper.includes('KİMYA') || upper.includes('KIMYA')) return 'AYT Kimya';
      if (upper.includes('BİYOLOJİ') || upper.includes('BIYOLOJI')) return 'AYT Biyoloji';
      if (upper.includes('TARİH')) return 'AYT Tarih';
      if (upper.includes('COĞRAFYA')) return 'AYT Coğrafya';
      if (upper.includes('FELSEFE')) return 'AYT Felsefe Grubu';
    }

    // TYT matching
    if (upper.includes('TÜRKÇE') || upper.includes('TURKCE')) return 'TYT Türkçe';
    if (upper.includes('TEMEL MATEMATİK') || upper.includes('MATEMATİK') || upper.includes('MAT')) return 'TYT Matematik';
    if (upper.includes('GEOMETRİ') || upper.includes('GEOMETRI')) return 'TYT Geometri';
    if (upper.includes('FİZİK') || upper.includes('FIZIK')) return 'TYT Fizik';
    if (upper.includes('KİMYA') || upper.includes('KIMYA')) return 'TYT Kimya';
    if (upper.includes('BİYOLOJİ') || upper.includes('BIYOLOJI')) return 'TYT Biyoloji';
    if (upper.includes('TARİH')) return 'TYT Tarih';
    if (upper.includes('COĞRAFYA')) return 'TYT Coğrafya';
    if (upper.includes('FELSEFE')) return 'TYT Felsefe';
    if (upper.includes('DİN') || upper.includes('DIN')) return 'TYT Din Kültürü';

    return name;
  };

  // Group all declining & improving topics by subject branch
  const groupedSubjectKazanimlar = useMemo(() => {
    interface KazanimItem {
      topicName: string;
      detailNote: string;
      changeRate: string;
      status: 'declining' | 'mastered';
    }

    interface SubjectGroup {
      subjectName: string;
      decliningList: KazanimItem[];
      improvingList: KazanimItem[];
    }

    // Default standard YKS branches filtered by student's branch rules
    const defaultTyt = [
      'TYT Türkçe',
      'TYT Matematik',
      'TYT Geometri',
      'TYT Fizik',
      'TYT Kimya',
      'TYT Biyoloji',
      'TYT Tarih',
      'TYT Coğrafya',
      'TYT Felsefe',
      'TYT Din Kültürü',
    ].filter(b => isSubjectAllowedForBranch(b, student.branch));

    const defaultAyt = [
      'AYT Edebiyat',
      'AYT Matematik',
      'AYT Geometri',
      'AYT Fizik',
      'AYT Kimya',
      'AYT Biyoloji',
      'AYT Tarih',
      'AYT Coğrafya',
      'AYT Felsefe Grubu',
    ].filter(b => isSubjectAllowedForBranch(b, student.branch));

    const map: Record<string, SubjectGroup> = {};

    const getOrCreate = (rawSubject: string): SubjectGroup => {
      const sName = normalizeSubjectName(rawSubject);
      if (!map[sName]) {
        map[sName] = {
          subjectName: sName,
          decliningList: [],
          improvingList: [],
        };
      }
      return map[sName];
    };

    // Pre-populate standard branches
    defaultTyt.forEach((b) => getOrCreate(b));
    defaultAyt.forEach((b) => getOrCreate(b));

    // 1. Process allDecliningTopics (bold font issues from optical documents)
    allDecliningTopics.forEach((item) => {
      if (!isSubjectAllowedForBranch(item.subject, student.branch)) return;
      const group = getOrCreate(item.subject);
      const exists = group.decliningList.some(
        (d) => d.topicName.toLowerCase().trim() === item.topicName.toLowerCase().trim()
      );
      if (!exists) {
        group.decliningList.push({
          topicName: item.topicName,
          detailNote: item.detailNote || 'Takıldığı ve eksik olduğu konu.',
          changeRate: item.changeRate || 'Eksik Konu',
          status: 'declining',
        });
      }
    });

    // 2. Process improvingKazanimlar
    (student.improvingKazanimlar || []).forEach((item) => {
      if (!isSubjectAllowedForBranch(item.subject, student.branch)) return;
      const group = getOrCreate(item.subject);
      const exists = group.improvingList.some(
        (i) => i.topicName.toLowerCase().trim() === item.topicName.toLowerCase().trim()
      );
      if (!exists) {
        group.improvingList.push({
          topicName: item.topicName,
          detailNote: item.detailNote || 'Öğrencinin kavramsal olarak başardığı konu.',
          changeRate: item.changeRate || 'Başarılı (%100)',
          status: 'mastered',
        });
      }
    });

    // 3. Process latestTyt and latestAyt subject kazanimlar
    const processSubjects = (subjects?: SubjectNetDetail[]) => {
      if (!subjects) return;
      subjects.forEach((subj) => {
        if (!isSubjectAllowedForBranch(subj.subjectName, student.branch)) return;
        const group = getOrCreate(subj.subjectName);
        if (subj.kazanimlar) {
          subj.kazanimlar.forEach((k) => {
            const isUnattempted = (subj.correct === 0 && subj.wrong === 0 && (subj.net === 0 || k.status === 'blank')) || k.status === 'blank';
            const isWeak = k.status === 'struggling' || (k.wrongCount !== undefined && k.wrongCount > 0);
            if (isWeak && !isUnattempted) {
              const exists = group.decliningList.some(
                (d) => d.topicName.toLowerCase().trim() === k.topicName.toLowerCase().trim()
              );
              if (!exists) {
                group.decliningList.push({
                  topicName: k.topicName,
                  detailNote: k.recommendation || `Eksik konu. Hata sayısı: ${k.wrongCount || 1}`,
                  changeRate: 'Eksik Konu',
                  status: 'declining',
                });
              }
            } else {
              const exists = group.improvingList.some(
                (i) => i.topicName.toLowerCase().trim() === k.topicName.toLowerCase().trim()
              );
              if (!exists) {
                group.improvingList.push({
                  topicName: k.topicName,
                  detailNote: 'Konu sorularında tam başarı sağlandı.',
                  changeRate: 'Başarılı',
                  status: 'mastered',
                });
              }
            }
          });
        }
      });
    };

    processSubjects(student.latestTyt?.subjects);
    processSubjects(student.latestAyt?.subjects);

    // Preferred sort order for YKS branches
    const order = [
      'TYT Türkçe',
      'TYT Matematik',
      'TYT Geometri',
      'TYT Fizik',
      'TYT Kimya',
      'TYT Biyoloji',
      'TYT Tarih',
      'TYT Coğrafya',
      'TYT Felsefe',
      'TYT Din Kültürü',
      'AYT Edebiyat',
      'AYT Matematik',
      'AYT Geometri',
      'AYT Fizik',
      'AYT Kimya',
      'AYT Biyoloji',
      'AYT Tarih',
      'AYT Coğrafya',
      'AYT Felsefe Grubu',
    ];

    const resultList = Object.values(map);
    resultList.sort((a, b) => {
      const idxA = order.indexOf(a.subjectName);
      const idxB = order.indexOf(b.subjectName);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.subjectName.localeCompare(b.subjectName);
    });

    return resultList;
  }, [student, allDecliningTopics]);

  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});
  const [kazanimBranchFilter, setKazanimBranchFilter] = useState<'all' | 'declining_only' | 'improving_only'>('all');

  const toggleSubjectAccordion = (subjectName: string) => {
    setOpenSubjects((prev) => ({
      ...prev,
      [subjectName]: prev[subjectName] === undefined ? false : !prev[subjectName],
    }));
  };

  const handleExpandAllSubjects = () => {
    const allOpen: Record<string, boolean> = {};
    groupedSubjectKazanimlar.forEach((g) => {
      allOpen[g.subjectName] = true;
    });
    setOpenSubjects(allOpen);
  };

  const handleCollapseAllSubjects = () => {
    const allClosed: Record<string, boolean> = {};
    groupedSubjectKazanimlar.forEach((g) => {
      allClosed[g.subjectName] = false;
    });
    setOpenSubjects(allClosed);
  };

  const tytBranchGroups = useMemo(() => {
    return groupedSubjectKazanimlar.filter((g) => g.subjectName.startsWith('TYT'));
  }, [groupedSubjectKazanimlar]);

  const aytBranchGroups = useMemo(() => {
    return groupedSubjectKazanimlar.filter((g) => g.subjectName.startsWith('AYT') || !g.subjectName.startsWith('TYT'));
  }, [groupedSubjectKazanimlar]);

  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);

  // Helper to optimize image payload before sending to API
  const compressImageForAi = (dataUrl: string, maxDim = 2000): Promise<{ dataUrl: string; mimeType: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          resolve({ dataUrl: compressed, mimeType: 'image/jpeg' });
        } else {
          resolve({ dataUrl, mimeType: 'image/png' });
        }
      };
      img.onerror = () => resolve({ dataUrl, mimeType: 'image/png' });
      img.src = dataUrl;
    });
  };

  // Handle Optical Document Processing via Gemini Vision API or Local Engine
  const handleProcessUploadedFile = async (file: File, typeOverride?: 'TYT' | 'AYT' | 'HEPSİ') => {
    const targetType = typeOverride || newExamType;
    setUploadedFileName(file.name);
    setFileScanError(null);
    setIsScanningFile(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      let rawBase64 = event.target?.result as string;
      let sendMimeType = file.type || 'image/png';

      if (file.type.startsWith('image/')) {
        setUploadedFilePreview(rawBase64);
        try {
          const compressedResult = await compressImageForAi(rawBase64);
          rawBase64 = compressedResult.dataUrl;
          sendMimeType = compressedResult.mimeType;
        } catch (e) {
          console.warn('Image compression failed, using original', e);
        }
      } else {
        setUploadedFilePreview(null);
      }

      try {
        const response = await fetch('/api/parse-optical-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: rawBase64,
            fileName: file.name,
            mimeType: sendMimeType,
            examTypeHint: targetType,
          }),
        });

        const data = await response.json();

        if (response.ok && data && data.parsedData) {
          setParsedExamData(data.parsedData);
          setNewExamName(data.parsedData.examName || file.name);
          setNewTotalNet((data.parsedData.totalNet || 0).toString());
          if (data.parsedData.examType) {
            setNewExamType(data.parsedData.examType as any);
          }
        } else {
          setFileScanError(data?.error || 'Yüklenen belgeden geçerli karne veya soru verisi okunamadı. Lütfen net bir fotoğraf yükleyin.');
        }
      } catch (err: any) {
        console.error('Failed to process optical file:', err);
        setFileScanError(err?.message || 'Görsel taranırken bir bağlantı hatası oluştu. Lütfen tekrar deneyin.');
      } finally {
        setIsScanningFile(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Preset Sample Optical Document Upload
  const handleProcessDocumentUpload = (fileName: string, typeOverride?: 'TYT' | 'AYT' | 'HEPSİ') => {
    const targetType = typeOverride || newExamType;
    setUploadedFileName(fileName);
    setUploadedFilePreview(null);
    setIsScanningFile(true);

    setTimeout(() => {
      const parsed = parseOpticalDocument(fileName, targetType);
      setParsedExamData(parsed);
      setNewExamName(parsed.examName);
      setNewTotalNet(parsed.totalNet.toString());
      setIsScanningFile(false);
    }, 800);
  };

  // Trigger file selection via file input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleProcessUploadedFile(file);
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

    let tytNetVal = 0;
    let aytNetVal = 0;

    if (newExamType === 'TYT') {
      tytNetVal = netVal;
      aytNetVal = student.latestAyt?.totalNet || 0;
    } else if (newExamType === 'AYT') {
      tytNetVal = student.latestTyt?.totalNet || 0;
      aytNetVal = netVal;
    } else {
      // HEPSİ
      tytNetVal = Math.round(netVal * 0.55 * 100) / 100;
      aytNetVal = Math.round(netVal * 0.45 * 100) / 100;
    }

    // Build history entry
    const newHistoryEntry = {
      examTitle: newExamName,
      date: newExamDate,
      tytNet: tytNetVal,
      aytNet: aytNetVal,
    };

    const updatedHistory = [...student.history, newHistoryEntry];

    let nextStudentState: Student12thGrade;

    // If data comes from parsed document
    if (addExamTab === 'document' && parsedExamData) {
      if (newExamType === 'HEPSİ') {
        const isTytSubject = (name: string, index: number, total: number) => {
          const upper = name.toUpperCase();
          if (upper.includes('TYT') || upper.includes('TÜRKÇE') || upper.includes('TEMEL MAT') || upper.includes('SOSYAL') || upper.includes('FEN BİL') || upper.includes('COĞRAFYA TYT') || upper.includes('TARİH TYT') || upper.includes('FELSEFE TYT')) {
            return true;
          }
          if (upper.includes('AYT') || upper.includes('EDEBİYAT') || upper.includes('MATEMATİK AYT') || upper.includes('FİZİK AYT') || upper.includes('KİMYA AYT') || upper.includes('BİYOLOJİ AYT')) {
            return false;
          }
          return index < Math.ceil(total / 2);
        };

        const tytSubjs = parsedExamData.subjects.filter((s, idx) => isTytSubject(s.subjectName, idx, parsedExamData.subjects.length));
        const aytSubjs = parsedExamData.subjects.filter((s, idx) => !isTytSubject(s.subjectName, idx, parsedExamData.subjects.length));

        const tytTotal = Number(tytSubjs.reduce((acc, s) => acc + s.net, 0).toFixed(2));
        const aytTotal = Number(aytSubjs.reduce((acc, s) => acc + s.net, 0).toFixed(2));

        nextStudentState = {
          ...student,
          latestTyt: {
            examName: `${newExamName} (TYT)`,
            examDate: newExamDate,
            totalNet: tytTotal || netVal,
            rankInSchool: student.latestTyt?.rankInSchool || 1,
            subjects: tytSubjs.length > 0 ? tytSubjs : parsedExamData.subjects,
          },
          latestAyt: {
            examName: `${newExamName} (AYT)`,
            examDate: newExamDate,
            totalNet: aytTotal || Math.round(netVal * 0.4),
            rankInSchool: student.latestAyt?.rankInSchool || 1,
            subjects: aytSubjs.length > 0 ? aytSubjs : parsedExamData.subjects,
          },
          history: updatedHistory,
        };
      } else {
        nextStudentState = {
          ...student,
          latestTyt: newExamType === 'TYT' ? parsedExamData : student.latestTyt,
          latestAyt: newExamType === 'AYT' ? parsedExamData : student.latestAyt,
          history: updatedHistory,
        };
      }
    } else {
      // Manual build breakdown
      if (newExamType === 'TYT') {
        const tyt1 = parseFloat(sub1Net) || Math.round(netVal * 0.38);
        const tyt2 = parseFloat(sub2Net) || Math.round(netVal * 0.35);
        const tyt3 = parseFloat(sub3Net) || Math.round(netVal * 0.17);
        const tyt4 = parseFloat(sub4Net) || Math.round(netVal * 0.10);

        const updatedTyt = {
          examName: newExamName,
          examDate: newExamDate,
          totalNet: netVal,
          rankInSchool: student.latestTyt?.rankInSchool || 1,
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

        nextStudentState = {
          ...student,
          latestTyt: updatedTyt,
          history: updatedHistory,
        };
      } else if (newExamType === 'AYT') {
        const ayt1 = parseFloat(sub1Net) || Math.round(netVal * 0.42);
        const ayt2 = parseFloat(sub2Net) || Math.round(netVal * 0.20);
        const ayt3 = parseFloat(sub3Net) || Math.round(netVal * 0.19);
        const ayt4 = parseFloat(sub4Net) || Math.round(netVal * 0.19);

        const updatedAyt = {
          examName: newExamName,
          examDate: newExamDate,
          totalNet: netVal,
          rankInSchool: student.latestAyt?.rankInSchool || 1,
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

        nextStudentState = {
          ...student,
          latestAyt: updatedAyt,
          history: updatedHistory,
        };
      } else {
        // HEPSİ (TYT + AYT) Manual
        const tytTotal = Math.round(netVal * 0.55 * 100) / 100;
        const aytTotal = Math.round(netVal * 0.45 * 100) / 100;

        const updatedTyt = {
          examName: `${newExamName} (TYT)`,
          examDate: newExamDate,
          totalNet: tytTotal,
          rankInSchool: student.latestTyt?.rankInSchool || 1,
          subjects: [
            { subjectName: 'Türkçe', questionCount: 40, correct: 30, wrong: 4, blank: 6, net: Math.round(tytTotal * 0.38 * 100)/100, accuracyRate: 75, kazanimlar: generateKazanimlarForSubject('Türkçe', 30, 4, 6) },
            { subjectName: 'Temel Matematik', questionCount: 40, correct: 28, wrong: 4, blank: 8, net: Math.round(tytTotal * 0.35 * 100)/100, accuracyRate: 70, kazanimlar: generateKazanimlarForSubject('Temel Matematik', 28, 4, 8) },
            { subjectName: 'Fen Bilimleri', questionCount: 20, correct: 14, wrong: 3, blank: 3, net: Math.round(tytTotal * 0.17 * 100)/100, accuracyRate: 70, kazanimlar: generateKazanimlarForSubject('Fen Bilimleri', 14, 3, 3) },
            { subjectName: 'Sosyal Bilimler', questionCount: 20, correct: 11, wrong: 4, blank: 5, net: Math.round(tytTotal * 0.10 * 100)/100, accuracyRate: 55, kazanimlar: generateKazanimlarForSubject('Sosyal Bilimler', 11, 4, 5) },
          ],
        };

        const updatedAyt = {
          examName: `${newExamName} (AYT)`,
          examDate: newExamDate,
          totalNet: aytTotal,
          rankInSchool: student.latestAyt?.rankInSchool || 1,
          subjects: [
            { subjectName: 'AYT Matematik', questionCount: 40, correct: 24, wrong: 4, blank: 12, net: Math.round(aytTotal * 0.42 * 100)/100, accuracyRate: 60, kazanimlar: generateKazanimlarForSubject('AYT Matematik', 24, 4, 12) },
            { subjectName: 'AYT Fizik', questionCount: 14, correct: 9, wrong: 2, blank: 3, net: Math.round(aytTotal * 0.20 * 100)/100, accuracyRate: 64, kazanimlar: generateKazanimlarForSubject('AYT Fizik', 9, 2, 3) },
            { subjectName: 'AYT Kimya', questionCount: 13, correct: 8, wrong: 2, blank: 3, net: Math.round(aytTotal * 0.19 * 100)/100, accuracyRate: 61, kazanimlar: generateKazanimlarForSubject('AYT Kimya', 8, 2, 3) },
            { subjectName: 'AYT Biyoloji', questionCount: 13, correct: 9, wrong: 2, blank: 2, net: Math.round(aytTotal * 0.19 * 100)/100, accuracyRate: 69, kazanimlar: generateKazanimlarForSubject('AYT Biyoloji', 9, 2, 2) },
          ],
        };

        nextStudentState = {
          ...student,
          latestTyt: updatedTyt,
          latestAyt: updatedAyt,
          history: updatedHistory,
        };
      }
    }

    // Extract struggling (bold font on optical report) topics into student's declining kazanimlar list
    const extractedDeclining: SkillKazanim[] = [];
    const allSubjects = (nextStudentState.latestTyt?.subjects || []).concat(nextStudentState.latestAyt?.subjects || []);
    allSubjects.forEach((subj) => {
      if (!isSubjectAllowedForBranch(subj.subjectName, student.branch)) return;
      if (subj.kazanimlar) {
        subj.kazanimlar.forEach((k) => {
          if (k.status === 'struggling' || k.wrongCount > 0 || k.blankCount > 0) {
            extractedDeclining.push({
              id: `dec-${subj.subjectName}-${k.topicName}-${Math.random()}`,
              subject: subj.subjectName,
              topicName: k.topicName,
              changeRate: 'Eksik Konu',
              status: 'declining',
              detailNote: k.recommendation || `Denemede tespit edilen eksik konu. Soru çözümü ve konu çalışması programına eklendi.`,
            });
          }
        });
      }
    });

    if (extractedDeclining.length > 0) {
      // Merge unique by topicName
      const existingTopics = new Set(student.decliningKazanimlar.map(d => d.topicName.toLowerCase()));
      const uniqueNew = extractedDeclining.filter(d => !existingTopics.has(d.topicName.toLowerCase()));
      nextStudentState.decliningKazanimlar = [...uniqueNew, ...student.decliningKazanimlar];
    }

    // Always re-generate weekly program so bold font weak topics are added to schedule
    nextStudentState.weeklyProgram = generateAdaptiveWeeklyProgram(nextStudentState);

    onUpdateStudent(nextStudentState);

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

  // Handle saving evaluation from OpticalExamModal
  const handleSaveOpticalEvaluation = (evaluation: OpticalExamEvaluationResult, updatedProgram: DayProgram[]) => {
    const newDeclining: SkillKazanim[] = [];
    evaluation.questions.forEach((q) => {
      if (q.status === 'wrong' || q.status === 'blank') {
        const exists = (student.decliningKazanimlar || []).some(
          (d) => d.topicName.toLowerCase().trim() === q.topicName.toLowerCase().trim()
        );
        if (!exists && !newDeclining.some((n) => n.topicName === q.topicName)) {
          newDeclining.push({
            id: `dec-opt-${Date.now()}-${q.questionNumber}`,
            subject: q.subject,
            topicName: q.topicName,
            changeRate: 'Eksik Konu (Optik Tarama)',
            status: 'declining',
            detailNote: q.diagnosticNote || `Optik form ve soru kitapçığı taraması sonucu hatalı/boş soru.`,
          });
        }
      }
    });

    const isTyt = evaluation.examType === 'TYT';
    const isAyt = evaluation.examType === 'AYT';

    const newHistoryEntry = {
      examTitle: evaluation.examName,
      date: evaluation.examDate,
      tytNet: isTyt || evaluation.examType === 'HEPSİ' ? evaluation.totalNet : student.latestTyt.totalNet,
      aytNet: isAyt ? evaluation.totalNet : student.latestAyt.totalNet,
    };

    const updatedHistory = [...student.history, newHistoryEntry];

    const updatedStudent: Student12thGrade = {
      ...student,
      latestTyt: isTyt || evaluation.examType === 'HEPSİ' ? {
        examName: evaluation.examName,
        examDate: evaluation.examDate,
        totalNet: evaluation.totalNet,
        rankInSchool: student.latestTyt?.rankInSchool || 1,
        subjects: evaluation.subjects,
      } : student.latestTyt,
      latestAyt: isAyt ? {
        examName: evaluation.examName,
        examDate: evaluation.examDate,
        totalNet: evaluation.totalNet,
        rankInSchool: student.latestAyt?.rankInSchool || 1,
        subjects: evaluation.subjects,
      } : student.latestAyt,
      decliningKazanimlar: [...newDeclining, ...(student.decliningKazanimlar || [])],
      weeklyProgram: updatedProgram,
      opticalEvaluations: [evaluation, ...(student.opticalEvaluations || [])],
      mentorNote: `Optik form ve soru kitapçığı taraması: ${evaluation.examName} (${evaluation.totalNet} Net, ${evaluation.totalWrong} Yanlış, ${evaluation.totalBlank} Boş). Eksik kazanımlara yönelik haftalık çalışma programı uyarlandı.`,
    };

    onUpdateStudent(updatedStudent);
    setIsOpticalModalOpen(false);
    setAiSuccessMsg(`"${evaluation.examName}" optik form, cevap anahtarı ve soru kitapçığıyla değerlendirildi! Haftalık çalışma programı eksik konulara göre otomatik güncellendi.`);
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

  // Construct chronological trial exam list (1-100) with branch & total delta calculations
  const processedTrialExams = useMemo(() => {
    // 1. Check if student has explicit trialExams
    const explicitTrials = (student.trialExams || []).filter(t => t.examType === trialHistoryTab);

    if (explicitTrials.length > 0) {
      const sorted = [...explicitTrials].sort((a, b) => a.examNumber - b.examNumber);
      // Recalculate deltas and percentage rates if missing
      for (let i = 0; i < sorted.length; i++) {
        if (i > 0) {
          const prev = sorted[i - 1];
          if (sorted[i].deltaTotalNet === undefined) {
            sorted[i].deltaTotalNet = Number((sorted[i].totalNet - prev.totalNet).toFixed(2));
          }
          if (sorted[i].deltaTotalRate === undefined && prev.totalNet > 0 && sorted[i].deltaTotalNet !== undefined) {
            sorted[i].deltaTotalRate = Number(((sorted[i].deltaTotalNet! / prev.totalNet) * 100).toFixed(1));
          }
          // Check branch deltas and percentage rates
          sorted[i].subjects.forEach((subj) => {
            const prevSubj = prev.subjects.find(
              (ps) => ps.subjectName.toLowerCase().trim() === subj.subjectName.toLowerCase().trim()
            );
            if (prevSubj) {
              if (subj.deltaNet === undefined) {
                subj.deltaNet = Number((subj.net - prevSubj.net).toFixed(2));
              }
              if (subj.deltaRate === undefined && prevSubj.net > 0 && subj.deltaNet !== undefined) {
                subj.deltaRate = Number(((subj.deltaNet / prevSubj.net) * 100).toFixed(1));
              }
            } else if (subj.deltaNet === undefined) {
              subj.deltaNet = 0;
            }
          });
        }
      }
      return sorted;
    }

    // 2. Fallback: reconstruct from student.history and latest exam with detailed branch breakdowns
    const fallbackList: TrialExamRecord[] = [];
    const hist = student.history || [];
    const baseSubjects = trialHistoryTab === 'TYT' ? (student.latestTyt?.subjects || []) : (student.latestAyt?.subjects || []);

    hist.forEach((h, idx) => {
      const netVal = trialHistoryTab === 'TYT' ? h.tytNet : h.aytNet;
      const isLatest = idx === hist.length - 1;

      let examSubjs: SubjectNetDetail[] = [];
      if (isLatest && baseSubjects.length > 0) {
        examSubjs = baseSubjects.map(s => ({ ...s }));
      } else if (baseSubjects.length > 0) {
        // Proportionally scale subjects for preceding exam so all detailed branches exist
        const latestTotal = trialHistoryTab === 'TYT' ? (student.latestTyt?.totalNet || 85) : (student.latestAyt?.totalNet || 55);
        const ratio = latestTotal > 0 ? (netVal / latestTotal) : 0.9;
        examSubjs = baseSubjects.map(s => {
          const scaledNet = Number((s.net * ratio).toFixed(2));
          const scaledCorrect = Math.max(0, Math.round(s.correct * ratio));
          return {
            ...s,
            net: scaledNet,
            correct: scaledCorrect,
            wrong: s.wrong,
            blank: Math.max(0, s.questionCount - scaledCorrect - s.wrong),
            accuracyRate: s.questionCount > 0 ? Math.round((scaledCorrect / s.questionCount) * 100) : 0,
            deltaNet: undefined,
            deltaRate: undefined,
          };
        });
      }

      fallbackList.push({
        id: `hist-${idx}`,
        examNumber: idx + 1,
        examType: trialHistoryTab,
        examTitle: h.examTitle,
        date: h.date,
        totalNet: netVal,
        deltaTotalNet: undefined,
        deltaTotalRate: undefined,
        subjects: examSubjs,
        createdAt: h.date,
      });
    });

    for (let i = 0; i < fallbackList.length; i++) {
      if (i > 0) {
        const prev = fallbackList[i - 1];
        fallbackList[i].deltaTotalNet = Number((fallbackList[i].totalNet - prev.totalNet).toFixed(2));
        if (prev.totalNet > 0 && fallbackList[i].deltaTotalNet !== undefined) {
          fallbackList[i].deltaTotalRate = Number(((fallbackList[i].deltaTotalNet! / prev.totalNet) * 100).toFixed(1));
        }
        fallbackList[i].subjects.forEach((subj) => {
          const prevSubj = prev.subjects.find(
            (ps) => ps.subjectName.toLowerCase().trim() === subj.subjectName.toLowerCase().trim()
          );
          if (prevSubj) {
            subj.deltaNet = Number((subj.net - prevSubj.net).toFixed(2));
            if (prevSubj.net > 0) {
              subj.deltaRate = Number(((subj.deltaNet / prevSubj.net) * 100).toFixed(1));
            }
          }
        });
      }
    }

    return fallbackList;
  }, [student, trialHistoryTab]);

  // Construct chart data points for TYT and AYT using all uploaded trial exams (or fallback to history)
  const tytTrials = useMemo(() => {
    return (student.trialExams || [])
      .filter((t) => t.examType === 'TYT')
      .sort((a, b) => a.examNumber - b.examNumber);
  }, [student.trialExams]);

  const aytTrials = useMemo(() => {
    return (student.trialExams || [])
      .filter((t) => t.examType === 'AYT')
      .sort((a, b) => a.examNumber - b.examNumber);
  }, [student.trialExams]);

  const tytChartData: ExamHistoryPoint[] = useMemo(() => {
    if (tytTrials.length > 0) {
      return tytTrials.map((t) => ({
        examTitle: `Deneme #${t.examNumber}`,
        date: t.date,
        net: t.totalNet,
      }));
    }
    return (student.history || []).map((h) => ({
      examTitle: h.examTitle,
      date: h.date,
      net: h.tytNet,
    }));
  }, [tytTrials, student.history]);

  const aytChartData: ExamHistoryPoint[] = useMemo(() => {
    if (aytTrials.length > 0) {
      return aytTrials.map((t) => ({
        examTitle: `Deneme #${t.examNumber}`,
        date: t.date,
        net: t.totalNet,
      }));
    }
    return (student.history || []).map((h) => ({
      examTitle: h.examTitle,
      date: h.date,
      net: h.aytNet,
    }));
  }, [aytTrials, student.history]);

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
          {isManager ? (
            <>
              <button
                onClick={() => setIsOpticalModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/30 px-3.5 py-2.5 rounded-xl transition cursor-pointer"
              >
                <Scan className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Optik & Soru Taraması</span>
              </button>

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
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-indigo-300 font-medium">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Öğretmen İnceleme Modu</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpticalModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/30 px-3.5 py-2.5 rounded-xl transition cursor-pointer"
              >
                <Eye className="w-4 h-4 text-amber-300" />
                <span>Optik Sonuçları & Eksik Konuları Gör</span>
              </button>
            </>
          )}

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 px-3.5 py-2.5 rounded-xl transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>PDF İndir</span>
          </button>

          {isManager && onDeleteStudent && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3.5 py-2.5 rounded-xl transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Öğrenciyi Sil</span>
            </button>
          )}
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
            <StudentAvatarBadge
              student={student}
              size="xl"
              className="shadow-lg shrink-0"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white">{student.name}</h1>
                <span className="px-3 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-lg">
                  {student.className}
                </span>
                {isManager && (
                  <button
                    onClick={handleOpenEditModal}
                    title="Öğrenci Bilgilerini Güncelle"
                    className="p-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
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
                <span className="text-2xl font-black text-emerald-400">
                  {student.latestTyt && student.latestTyt.subjects?.length > 0 ? student.latestTyt.totalNet : '—'}
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl px-5 py-3 text-center min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Son AYT Net</span>
                <span className="text-2xl font-black text-indigo-400">
                  {student.latestAyt && student.latestAyt.subjects?.length > 0 ? student.latestAyt.totalNet : '—'}
                </span>
              </div>
            </div>

            {isManager && (
              <button
                onClick={() => setIsAddExamModalOpen(true)}
                className="w-full text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Deneme / Optik Belge Ekle</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OPTİK FORM, CEVAP ANAHTARI VE DENEME PANELİ: YÖNETİCİ VE ÖĞRETMEN AYRIMI */}
      {isManager ? (
        <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/80 border border-indigo-500/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/30">
              <Scan className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Optik Form, Cevap Anahtarı & Deneme Yükleme Merkezi</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  YÖNETİCİ: SERDAR AKTAŞ
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Bu öğrenci için <strong>1. Optik Form</strong>, <strong>2. Cevap Anahtarı</strong> ve <strong>3. Deneme Soru Kitapçığı</strong> yükleme yerleri açıktır. Hepsini yükledikten sonra <strong>"Analiz Yap"</strong> seçeneğine basarak sonuçları alın ve haftalık çalışma programını otomatik güncelleyin.
              </p>
              {student.opticalEvaluations && student.opticalEvaluations.length > 0 && (
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sistemde {student.opticalEvaluations.length} adet optik deneme sonucu ve soru analizi kayıtlı.</span>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpticalModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 transition cursor-pointer flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-center"
          >
            <Scan className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Optik, Cevap Anahtarı & Deneme Yükle</span>
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Deneme Sınavı Sonuçları & Eksik Konu Takip Paneli</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 text-[10px] font-semibold">
                  Öğretmen İnceleme Modu
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Optik form, cevap anahtarı ve deneme kitapçığı yüklemeleri <strong>Yönetici (Serdar Aktaş)</strong> tarafından yapılmaktadır. Öğrencinin güncel TYT/AYT netlerini, takıldığı ve eksik olduğu konuları aşağıdan inceleyebilir ve güncel haftalık çalışma programını indirebilirsiniz.
              </p>
              {student.opticalEvaluations && student.opticalEvaluations.length > 0 && (
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Öğrenciye ait {student.opticalEvaluations.length} adet optik deneme sonucu ve soru eksikliği işlenmiştir.</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsOpticalModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-2 flex-1 md:flex-initial"
            >
              <Eye className="w-4 h-4 text-amber-300" />
              <span>Sonuçları ve Eksikleri Gör</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Program PDF</span>
            </button>
          </div>
        </div>
      )}

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
      {/* SECTION: TÜM DENEMELER VE BRANŞ BAZLI NET ARTIŞ/AZALIŞ ÇİZELGESİ (1-100) */}
      {/* ===================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                Kronolojik Takip
              </span>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Tüm Deneme Sınavları & Branş Bazlı Artış/Azalış Çizelgesi (1 - 100)</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Öğrencinin girdiği 1'den 100'e kadar tüm deneme sınavlarındaki TYT ve AYT netleri, bir önceki denemeye göre branş bazında net artış ve azalışları (<strong className="text-emerald-400">▲ Artış</strong> ve <strong className="text-rose-400">▼ Azalış</strong>) aşağıda listelenmektedir.
            </p>
          </div>

          {/* TYT / AYT Selector */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setTrialHistoryTab('TYT')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                trialHistoryTab === 'TYT'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>TYT Denemeleri</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-black/30 rounded-full font-mono">
                {student.trialExams?.filter((t) => t.examType === 'TYT').length || (student.latestTyt ? 1 : 0)}
              </span>
            </button>
            <button
              onClick={() => setTrialHistoryTab('AYT')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                trialHistoryTab === 'AYT'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>AYT Denemeleri</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-black/30 rounded-full font-mono">
                {student.trialExams?.filter((t) => t.examType === 'AYT').length || (student.latestAyt ? 1 : 0)}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Stats Summary Strip */}
        {processedTrialExams.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Toplam Deneme</span>
              <span className="text-lg font-black text-white">{processedTrialExams.length} Sınav</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">İlk Deneme (Başlangıç)</span>
              <span className="text-lg font-black text-slate-300">
                {processedTrialExams[0]?.totalNet || 0} Net
              </span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">En Yüksek Net</span>
              <span className="text-lg font-black text-emerald-400">
                {Math.max(...processedTrialExams.map((e) => e.totalNet), 0)} Net
              </span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">En Son Deneme Neti</span>
              <span className="text-lg font-black text-indigo-400">
                {processedTrialExams[processedTrialExams.length - 1]?.totalNet || 0} Net
              </span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Toplam Gelişim (İlk ➔ Son)</span>
              {(() => {
                if (processedTrialExams.length < 2) return <span className="text-lg font-black text-slate-500">Başlangıç</span>;
                const first = processedTrialExams[0].totalNet;
                const last = processedTrialExams[processedTrialExams.length - 1].totalNet;
                const diff = Number((last - first).toFixed(2));
                if (diff > 0) return <span className="text-lg font-black text-emerald-400">+{diff} Net ▲</span>;
                if (diff < 0) return <span className="text-lg font-black text-rose-400">{diff} Net ▼</span>;
                return <span className="text-lg font-black text-slate-400">0.00 Net</span>;
              })()}
            </div>
          </div>
        )}

        {/* Chronological Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 w-12 text-center">Sıra</th>
                <th className="py-3 px-4 min-w-[120px]">Deneme No</th>
                <th className="py-3 px-4 min-w-[200px]">Deneme Başlığı</th>
                <th className="py-3 px-3 w-28">Tarih</th>
                {trialHistoryTab === 'TYT' ? (
                  <>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Türkçe (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Tarih (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Coğrafya (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Felsefe (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Din K. (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Matematik (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Fizik (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Kimya (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Biyoloji (Δ / %)</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Matematik (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Fizik (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Kimya (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Biyoloji (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Edebiyat (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Tarih (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Coğrafya (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Felsefe Gr. (Δ / %)</th>
                    <th className="py-3 px-2 text-center min-w-[95px] bg-slate-900/40 border-l border-slate-800">Din K. (Δ / %)</th>
                  </>
                )}
                <th className="py-3 px-4 text-center min-w-[140px] bg-slate-950 border-l border-slate-800 font-bold text-white">
                  Toplam Net (Δ / %)
                </th>
                <th className="py-3 px-3 text-center min-w-[125px] bg-slate-950 border-l border-slate-800 font-bold text-indigo-400">
                  📸 Sınav Belgesi
                </th>
                {isManager && (
                  <th className="py-3 px-3 text-center min-w-[70px] bg-slate-950 border-l border-slate-800 font-bold text-rose-400">
                    İşlem
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {processedTrialExams.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 16 : 15} className="py-8 text-center text-slate-500">
                    Henüz kayıtlı {trialHistoryTab} denemesi bulunmuyor.
                  </td>
                </tr>
              ) : (
                processedTrialExams.map((exam, idx) => {
                  const isFirst = idx === 0;
                  const deltaTotal = exam.deltaTotalNet;

                  // Find subjects
                  const getSubjData = (keywords: string[]) => {
                    const match = exam.subjects?.find((s) =>
                      keywords.some((k) => s.subjectName.toLowerCase().includes(k.toLowerCase()))
                    );
                    return match;
                  };

                  const sTurkce = getSubjData(['türkçe', 'turkce']);
                  const sTarih = getSubjData(['tarih']);
                  const sCografya = getSubjData(['coğrafya', 'cografya']);
                  const sFelsefe = getSubjData(['felsefe']);
                  const sDin = getSubjData(['din kültürü', 'din']);
                  const sMat = getSubjData(['matematik', 'mat']);
                  const sFizik = getSubjData(['fizik']);
                  const sKimya = getSubjData(['kimya']);
                  const sBiyoloji = getSubjData(['biyoloji', 'biyo']);

                  // Fallbacks for older aggregate Sosyal or Fen if detailed sub-branches were not scanned
                  const sSosyalAggregate = getSubjData(['sosyal']);
                  const sFenAggregate = getSubjData(['fen']);

                  const aytMat = getSubjData(['ayt matematik', 'matematik', 'mat']);
                  const aytFizik = getSubjData(['ayt fizik', 'fizik']);
                  const aytKimya = getSubjData(['ayt kimya', 'kimya']);
                  const aytBiyoloji = getSubjData(['ayt biyoloji', 'biyoloji']);
                  const aytEdebiyat = getSubjData(['edebiyat', 'türk dili']);
                  const aytTarih = getSubjData(['tarih']);
                  const aytCografya = getSubjData(['coğrafya', 'cografya']);
                  const aytFelsefe = getSubjData(['felsefe']);
                  const aytDin = getSubjData(['din']);

                  const renderSubjectCell = (sub?: SubjectNetDetail, fallbackLabel?: string) => {
                    if (!sub) {
                      return (
                        <td className="py-2.5 px-2 text-center text-slate-600 border-l border-slate-800 text-xs">
                          {fallbackLabel ? <span className="text-[10px] text-slate-500">{fallbackLabel}</span> : '—'}
                        </td>
                      );
                    }

                    const prevNet = !isFirst && sub.deltaNet !== undefined ? Number((sub.net - sub.deltaNet).toFixed(2)) : undefined;
                    const rateVal = sub.deltaRate !== undefined
                      ? sub.deltaRate
                      : (prevNet !== undefined && prevNet > 0 && sub.deltaNet !== undefined
                          ? Number(((sub.deltaNet / prevNet) * 100).toFixed(1))
                          : undefined);

                    return (
                      <td className="py-2.5 px-2 text-center border-l border-slate-800">
                        <div className="font-bold text-slate-200 text-xs">{sub.net}</div>
                        {!isFirst && sub.deltaNet !== undefined && (
                          <div
                            className={`text-[9.5px] font-bold inline-flex items-center gap-0.5 mt-0.5 px-1 py-0.2 rounded ${
                              sub.deltaNet > 0
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : sub.deltaNet < 0
                                ? 'text-rose-400 bg-rose-500/10'
                                : 'text-slate-500'
                            }`}
                          >
                            <span>
                              {sub.deltaNet > 0 && `+${sub.deltaNet}▲`}
                              {sub.deltaNet < 0 && `${sub.deltaNet}▼`}
                              {sub.deltaNet === 0 && '0.00'}
                            </span>
                            {rateVal !== undefined && sub.deltaNet !== 0 && (
                              <span className="font-semibold text-[8.5px] opacity-90">
                                ({rateVal > 0 ? `+${rateVal}%` : `${rateVal}%`})
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  };

                  return (
                    <tr key={exam.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-400">
                        Deneme #{exam.examNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {exam.examTitle}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {exam.date}
                      </td>
                      {trialHistoryTab === 'TYT' ? (
                        <>
                          {renderSubjectCell(sTurkce)}
                          {renderSubjectCell(sTarih, sSosyalAggregate ? `S: ${sSosyalAggregate.net}` : undefined)}
                          {renderSubjectCell(sCografya)}
                          {renderSubjectCell(sFelsefe)}
                          {renderSubjectCell(sDin)}
                          {renderSubjectCell(sMat)}
                          {renderSubjectCell(sFizik, sFenAggregate ? `F: ${sFenAggregate.net}` : undefined)}
                          {renderSubjectCell(sKimya)}
                          {renderSubjectCell(sBiyoloji)}
                        </>
                      ) : (
                        <>
                          {renderSubjectCell(aytMat)}
                          {renderSubjectCell(aytFizik)}
                          {renderSubjectCell(aytKimya)}
                          {renderSubjectCell(aytBiyoloji)}
                          {renderSubjectCell(aytEdebiyat)}
                          {renderSubjectCell(aytTarih)}
                          {renderSubjectCell(aytCografya)}
                          {renderSubjectCell(aytFelsefe)}
                          {renderSubjectCell(aytDin)}
                        </>
                      )}
                      <td className="py-3 px-4 text-center border-l border-slate-800 bg-slate-950/40">
                        <div className="font-black text-sm text-white">
                          {exam.totalNet} Net
                        </div>
                        {isFirst ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                            Başlangıç (İlk Deneme)
                          </span>
                        ) : deltaTotal !== undefined ? (
                          <div
                            className={`text-[10px] font-bold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded mt-0.5 ${
                              deltaTotal > 0
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : deltaTotal < 0
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'text-slate-400 bg-slate-800/60'
                            }`}
                          >
                            {deltaTotal > 0 && <TrendingUp className="w-3 h-3" />}
                            {deltaTotal < 0 && <TrendingDown className="w-3 h-3" />}
                            <span>{deltaTotal > 0 ? `+${deltaTotal} Net` : deltaTotal < 0 ? `${deltaTotal} Net` : '0.00 Net'}</span>
                            {exam.deltaTotalRate !== undefined && deltaTotal !== 0 && (
                              <span className="font-semibold text-[8.5px] opacity-90">
                                ({exam.deltaTotalRate > 0 ? `+${exam.deltaTotalRate}%` : `${exam.deltaTotalRate}%`})
                              </span>
                            )}
                          </div>
                        ) : null}
                      </td>
                      {/* Sınav Belgesi / Görsel */}
                      <td className="py-3 px-3 text-center border-l border-slate-800 bg-slate-950/20">
                        {exam.sourceImages && exam.sourceImages.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExamImageModal({
                                examTitle: `${exam.examType} #${exam.examNumber} (${exam.examTitle})`,
                                examDate: exam.date,
                                images: exam.sourceImages!,
                              });
                              setActiveImageIndex(0);
                              setImageZoom(1);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold cursor-pointer transition shadow-sm hover:scale-105"
                            title="Orijinal Optik Sınav Sonuç Belgesini İncele"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Görsel ({exam.sourceImages.length})</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-600">—</span>
                        )}
                      </td>
                      {isManager && (
                        <td className="py-3 px-3 text-center border-l border-slate-800">
                          <button
                            type="button"
                            onClick={() => setExamToDelete(exam)}
                            title="Deneme Sonucunu Sil (Serdar Aktaş Yetkisi)"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION: YÜKLENEN ORİJİNAL SINAV BELGELERİ & OPTİK LİSTELERİ          */}
      {/* ===================================================================== */}
      {processedTrialExams.some((e) => e.sourceImages && e.sourceImages.length > 0) && (
        <div className="bg-slate-800/80 border border-indigo-500/30 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Yüklenen Orijinal Sınav Belgeleri & Optik Listeleri</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    {student.name}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Öğrencinin girdiği tüm denemelerin sisteme yüklenmiş orijinal optik sonuç belgeleri. Tıklayarak tam ekran inceleyebilirsiniz.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {processedTrialExams
              .filter((e) => e.sourceImages && e.sourceImages.length > 0)
              .map((exam) => (
                <div
                  key={exam.id || exam.examNumber}
                  className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 space-y-3 hover:border-indigo-500/50 transition group"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                        {exam.examType} Deneme #{exam.examNumber}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate max-w-[180px]" title={exam.examTitle}>
                        {exam.examTitle}
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {exam.totalNet} Net
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {exam.sourceImages!.map((imgUrl, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedExamImageModal({
                            examTitle: `${exam.examType} #${exam.examNumber} (${exam.examTitle})`,
                            examDate: exam.date,
                            images: exam.sourceImages!,
                          });
                          setActiveImageIndex(i);
                          setImageZoom(1);
                        }}
                        className="relative rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 cursor-pointer aspect-[3/4] bg-slate-950 group/img transition shadow hover:shadow-indigo-500/20"
                      >
                        <img
                          src={imgUrl}
                          alt={`${exam.examTitle} Sayfa ${i + 1}`}
                          className="w-full h-full object-cover object-top group-hover/img:scale-105 transition duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover/img:opacity-80 transition" />
                        <span className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-slate-200 px-1.5 py-0.5 rounded border border-slate-700/50">
                          Sayfa {i + 1}
                        </span>
                        <div className="absolute bottom-1.5 right-1.5 p-1 bg-indigo-600/90 rounded text-white opacity-0 group-hover/img:opacity-100 transition shadow">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExamImageModal({
                        examTitle: `${exam.examType} #${exam.examNumber} (${exam.examTitle})`,
                        examDate: exam.date,
                        images: exam.sourceImages!,
                      });
                      setActiveImageIndex(0);
                      setImageZoom(1);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-slate-700 hover:border-indigo-500/40 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Belgeyi Tam Ekran İncele ({exam.sourceImages!.length} Sayfa)</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

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
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedExamTab === 'TYT' ? 'bg-emerald-600 text-white' : 'text-slate-400'
              }`}
            >
              TYT
            </button>
            <button
              onClick={() => setSelectedExamTab('AYT')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedExamTab === 'AYT' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              AYT
            </button>
            <button
              onClick={() => setSelectedExamTab('HEPSİ')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedExamTab === 'HEPSİ' ? 'bg-purple-600 text-white' : 'text-slate-400'
              }`}
            >
              HEPSİ
            </button>
          </div>
        </div>

        {/* Side by Side Grid for Desktop, Tabbed for Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SOL KOLON: TYT DENEME SONUCU */}
          <div className={`space-y-4 ${selectedExamTab === 'TYT' || selectedExamTab === 'HEPSİ' ? 'block' : 'hidden md:block'}`}>
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
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <span className="text-xl font-black text-emerald-400">{student.latestTyt.totalNet} Net</span>
                    {student.latestTyt.deltaTotalNet !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                        student.latestTyt.deltaTotalNet > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : student.latestTyt.deltaTotalNet < 0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {student.latestTyt.deltaTotalNet > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                        {student.latestTyt.deltaTotalNet < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                        {student.latestTyt.deltaTotalNet > 0
                          ? `+${student.latestTyt.deltaTotalNet} Artış`
                          : student.latestTyt.deltaTotalNet < 0
                          ? `${student.latestTyt.deltaTotalNet} Düşüş`
                          : '0.00'}
                      </span>
                    )}
                    {(() => {
                      const latestImages = student.latestTyt.sourceImages || 
                        (student.trialExams || []).slice().reverse().find(t => t.examType === 'TYT' && t.sourceImages?.length)?.sourceImages;
                      if (latestImages && latestImages.length > 0) {
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExamImageModal({
                                examTitle: student.latestTyt.examName || 'Son TYT Denemesi',
                                examDate: student.latestTyt.examDate || '',
                                images: latestImages,
                              });
                              setActiveImageIndex(0);
                              setImageZoom(1);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold cursor-pointer transition shadow-sm hover:scale-105"
                            title="Orijinal Optik Sınav Sonuç Belgesini Görüntüle"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Optik Belge ({latestImages.length})</span>
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Subject Breakdown List */}
              <div className="space-y-3">
                {student.latestTyt.subjects.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-2 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/60 p-4">
                    <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">Henüz TYT Denemesi Yüklenmedi</p>
                    <p className="text-[11px] text-slate-500">Öğrenciye deneme eklemek için "Yeni Deneme / Optik Belge Ekle" butonunu kullanın.</p>
                  </div>
                ) : (
                  student.latestTyt.subjects.map((subj) => (
                    <div
                      key={subj.subjectName}
                      onClick={() => {
                        setActiveSubjectModal(subj);
                        setKazanimFilter('all');
                      }}
                      className="p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/60 hover:border-emerald-500/50 rounded-xl transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition">
                            {subj.subjectName}
                          </span>
                          {subj.deltaNet !== undefined && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                                subj.deltaNet > 0
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : subj.deltaNet < 0
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'text-slate-400 bg-slate-800/80 border border-slate-700/60'
                              }`}
                            >
                              {subj.deltaNet > 0 && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                              {subj.deltaNet < 0 && <TrendingDown className="w-3 h-3 text-rose-400" />}
                              <span>
                                {subj.deltaNet > 0 ? `+${subj.deltaNet}▲ Net` : subj.deltaNet < 0 ? `${subj.deltaNet}▼ Net` : '0.00 Net'}
                              </span>
                              {(() => {
                                const prevNet = Number((subj.net - subj.deltaNet).toFixed(2));
                                const rate = subj.deltaRate !== undefined
                                  ? subj.deltaRate
                                  : (prevNet > 0 && subj.deltaNet !== 0 ? Number(((subj.deltaNet / prevNet) * 100).toFixed(1)) : undefined);
                                return rate !== undefined ? (
                                  <span className="font-extrabold text-[9px] px-1 py-0.2 rounded bg-black/40">
                                    ({rate > 0 ? `+${rate}%` : `${rate}%`} Değişim)
                                  </span>
                                ) : null;
                              })()}
                            </span>
                          )}
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                            <Layers className="w-3 h-3 text-indigo-400" />
                            Kazanımları İncele
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-emerald-400">{subj.net} Net</span>
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
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SAĞ KOLON: AYT DENEME SONUCU */}
          <div className={`space-y-4 ${selectedExamTab === 'AYT' || selectedExamTab === 'HEPSİ' ? 'block' : 'hidden md:block'}`}>
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
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xl font-black text-indigo-400">{student.latestAyt.totalNet} Net</span>
                    {student.latestAyt.deltaTotalNet !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                        student.latestAyt.deltaTotalNet > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : student.latestAyt.deltaTotalNet < 0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {student.latestAyt.deltaTotalNet > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                        {student.latestAyt.deltaTotalNet < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                        {student.latestAyt.deltaTotalNet > 0
                          ? `+${student.latestAyt.deltaTotalNet} Artış`
                          : student.latestAyt.deltaTotalNet < 0
                          ? `${student.latestAyt.deltaTotalNet} Düşüş`
                          : '0.00'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject Breakdown List */}
              <div className="space-y-3">
                {student.latestAyt.subjects.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-2 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/60 p-4">
                    <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">Henüz AYT Denemesi Yüklenmedi</p>
                    <p className="text-[11px] text-slate-500">Öğrenciye deneme eklemek için "Yeni Deneme / Optik Belge Ekle" butonunu kullanın.</p>
                  </div>
                ) : (
                  student.latestAyt.subjects.map((subj) => (
                    <div
                      key={subj.subjectName}
                      onClick={() => {
                        setActiveSubjectModal(subj);
                        setKazanimFilter('all');
                      }}
                      className="p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition">
                            {subj.subjectName}
                          </span>
                          {subj.deltaNet !== undefined && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                                subj.deltaNet > 0
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : subj.deltaNet < 0
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'text-slate-400 bg-slate-800/80 border border-slate-700/60'
                              }`}
                            >
                              {subj.deltaNet > 0 && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                              {subj.deltaNet < 0 && <TrendingDown className="w-3 h-3 text-rose-400" />}
                              <span>
                                {subj.deltaNet > 0 ? `+${subj.deltaNet}▲ Net` : subj.deltaNet < 0 ? `${subj.deltaNet}▼ Net` : '0.00 Net'}
                              </span>
                              {(() => {
                                const prevNet = Number((subj.net - subj.deltaNet).toFixed(2));
                                const rate = subj.deltaRate !== undefined
                                  ? subj.deltaRate
                                  : (prevNet > 0 && subj.deltaNet !== 0 ? Number(((subj.deltaNet / prevNet) * 100).toFixed(1)) : undefined);
                                return rate !== undefined ? (
                                  <span className="font-extrabold text-[9px] px-1 py-0.2 rounded bg-black/40">
                                    ({rate > 0 ? `+${rate}%` : `${rate}%`} Değişim)
                                  </span>
                                ) : null;
                              })()}
                            </span>
                          )}
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                            <Layers className="w-3 h-3 text-indigo-400" />
                            Kazanımları İncele
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-indigo-400">{subj.net} Net</span>
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
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ===================================================================== */}
      {/* SECTION 3: HAFTALIK DERS PROGRAMI TABLOSU                              */}
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
                    <option value="12 MFA">12 MFA</option>
                    <option value="12 TMA">12 TMA</option>
                    <option value="12 TMB">12 TMB</option>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Öğrenci Cinsiyeti (Emoji Avatar)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditGender('K')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                      editGender === 'K'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">👩</span>
                    <span>Kız Öğrenci (Kadın)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditGender('E')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                      editGender === 'E'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">👨</span>
                    <span>Erkek Öğrenci (Erkek)</span>
                  </button>
                </div>
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
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Sınav Türü Seçin
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-700 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setNewExamType('TYT');
                      if (uploadedFileName) handleProcessDocumentUpload(uploadedFileName, 'TYT');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition text-center cursor-pointer ${
                      newExamType === 'TYT'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    TYT
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewExamType('AYT');
                      if (uploadedFileName) handleProcessDocumentUpload(uploadedFileName, 'AYT');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition text-center cursor-pointer ${
                      newExamType === 'AYT'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    AYT
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewExamType('HEPSİ');
                      if (uploadedFileName) handleProcessDocumentUpload(uploadedFileName, 'HEPSİ');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition text-center cursor-pointer ${
                      newExamType === 'HEPSİ'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    HEPSİ (TYT + AYT)
                  </button>
                </div>
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

              {/* TAB 1: BELGE YÜKLEME SEKME DÜZENİ */}
              {addExamTab === 'document' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-500 bg-slate-900/80 rounded-2xl p-5 text-center transition cursor-pointer relative group">
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.csv,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileInputChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    {uploadedFilePreview ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <img
                          src={uploadedFilePreview}
                          alt="Yüklenen Optik Karne"
                          className="max-h-36 rounded-xl border border-indigo-500/50 object-contain shadow-lg"
                        />
                        <p className="text-xs font-bold text-emerald-400">
                          ✓ Görsel Yüklendi ve Yapay Zeka Tarafından Tarandı: {uploadedFileName}
                        </p>
                        <span className="text-[10px] text-slate-400">Değiştirmek için tıklayın veya yeni dosya bırakın</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-bold text-white">
                          Optik Sınav Karnesi, PNG, JPG Fotoğrafı veya PDF Belgenizi Seçin
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Yapay zeka (Gemini Vision) yüklediğiniz belgedeki Doğru, Yanlış, Net ve Konu Listesini eksiksiz okur.
                        </p>
                      </>
                    )}
                  </div>

                  {fileScanError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{fileScanError}</span>
                    </div>
                  )}

                  {/* Sample Optical Report Preset Buttons */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">
                      Veya Örnek Karne Şablonu Seçin:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleProcessDocumentUpload('12._Sınıf_YKS_2_(GM)_Karnesi.png', 'HEPSİ')}
                        className="p-2.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition flex items-center gap-2 cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4 text-purple-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-200 truncate">12. Sınıf YKS 2 (GM).png</p>
                          <p className="text-[10px] text-purple-300">TYT + AYT (27 D AYT Mat)</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleProcessDocumentUpload('2026_Türkiye_Geneli_TYT_4_Optik_Karne.pdf', 'TYT')}
                        className="p-2.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition flex items-center gap-2 cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-200 truncate">Türkiye Geneli TYT-4.pdf</p>
                          <p className="text-[10px] text-emerald-300">4 Branş + Kazanımlar</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleProcessDocumentUpload('3D_Yayinlari_AYT_Deneme_Karnesi.xlsx', 'AYT')}
                        className="p-2.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition flex items-center gap-2 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-200 truncate">3D Yayınları AYT.xlsx</p>
                          <p className="text-[10px] text-indigo-300">AYT Fen & Mat Kazanımları</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Scanning State Indicator */}
                  {isScanningFile && (
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center gap-3 text-indigo-300 text-xs font-medium animate-pulse">
                      <Brain className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                      <span>Gemini Vision Görseli Taranıyor... Yüklenen karne üzerindeki tüm soru sayıları (D, Y, B, N) ve konu detayları birebir ayıklanıyor.</span>
                    </div>
                  )}

                  {/* Document Extraction Preview Result */}
                  {parsedExamData && !isScanningFile && (
                    <div className="p-4 bg-slate-900 rounded-2xl border border-emerald-500/40 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <div>
                            <span className="text-xs font-bold text-white block">{parsedExamData.examName}</span>
                            <span className="text-[10px] text-slate-400">Görsel / Belge Optik Taraması Tamamlandı</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                          Toplam: {parsedExamData.totalNet} Net
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {parsedExamData.subjects.map((subj) => (
                          <div key={subj.subjectName} className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-left space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200 truncate">{subj.subjectName}</span>
                              <span className="text-xs font-black text-indigo-400">{subj.net} N</span>
                            </div>
                            <div className="text-[10px] text-slate-300 flex items-center justify-between">
                              <span>D: <strong className="text-emerald-400">{subj.correct}</strong></span>
                              <span>Y: <strong className="text-rose-400">{subj.wrong}</strong></span>
                              <span>B: <strong className="text-amber-400">{subj.blank}</strong></span>
                            </div>
                            {subj.kazanimlar && subj.kazanimlar.length > 0 && (
                              <div className="pt-1 border-t border-slate-700/50 text-[9px] text-slate-400">
                                📋 {subj.kazanimlar.filter(k => k.status === 'struggling').length} Takıldığı Konu Okundu
                              </div>
                            )}
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
                          ? 'Takıldığı / Eksik Konu'
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
      {/* MODAL: ÖĞRENCİ SİL ONAYI */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                Öğrenciyi Sil
              </h3>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-300">
              <strong className="text-white">{student.name}</strong> isimli öğrenciyi sistemden silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStudent) {
                    onDeleteStudent(student.id);
                  }
                  setShowDeleteModal(false);
                  onBack();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 rounded-xl transition cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DENEME SONUCU SİLME ONAYI (SERDAR AKTAŞ YÖNETİCİ YETKİSİ) */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span>Deneme Sonucunu Sil</span>
              </h3>
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
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
                <strong className="text-white">{student.name}</strong> adlı öğrenciye ait <strong className="text-indigo-300">{examToDelete.examType} Deneme #{examToDelete.examNumber} ({examToDelete.examTitle})</strong> sonucunu silmek istediğinize emin misiniz?
              </p>
            </div>

            <p className="text-xs text-slate-400">
              Bu işlem sonucunda öğrencinin deneme listesindeki net dökümü kaldırılacak ve önceki denemeye göre artış/azalış hesaplamaları güncellenecektir.
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
                onClick={handleConfirmDeleteTrialExam}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 rounded-xl transition cursor-pointer"
              >
                Evet, Denemeyi Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ORİJİNAL SINAV BELGESİ / OPTİK FORM GÖRÜNTÜLEYİCİ */}
      {selectedExamImageModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/95 border-b border-slate-700/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>{selectedExamImageModal.examTitle}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-normal">
                      {selectedExamImageModal.examDate}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Öğrenci: <strong className="text-white">{student.name}</strong> ({student.studentNo}) — {student.className} / {student.branch}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
                  <button
                    type="button"
                    onClick={() => setImageZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                    disabled={imageZoom <= 0.5}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded disabled:opacity-40 transition cursor-pointer"
                    title="Uzaklaştır"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-semibold text-slate-300 px-2 min-w-[50px] text-center">
                    %{Math.round(imageZoom * 100)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setImageZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                    disabled={imageZoom >= 3}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded disabled:opacity-40 transition cursor-pointer"
                    title="Yakınlaştır"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageZoom(1)}
                    className="px-2 py-1 text-[11px] text-slate-400 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
                    title="Sıfırla"
                  >
                    Sıfırla
                  </button>
                </div>

                {/* Open in new tab */}
                <a
                  href={selectedExamImageModal.images[activeImageIndex]}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-lg transition"
                  title="Yeni Sekmede Aç"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExamImageModal(null);
                    setImageZoom(1);
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Page Selector (if multiple images) */}
            {selectedExamImageModal.images.length > 1 && (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/70 border-b border-slate-800 overflow-x-auto">
                <span className="text-xs text-slate-400 font-medium mr-1">Optik Sayfa Seçimi:</span>
                {selectedExamImageModal.images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(i);
                      setImageZoom(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      activeImageIndex === i
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Sayfa {i + 1} {i === 0 ? '(1-20. Sıra)' : '(21-40. Sıra)'}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Image Canvas / Viewer */}
            <div className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-4 relative select-none">
              <div
                style={{
                  transform: `scale(${imageZoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full flex items-center justify-center"
              >
                <img
                  src={selectedExamImageModal.images[activeImageIndex]}
                  alt={`${selectedExamImageModal.examTitle} - Sayfa ${activeImageIndex + 1}`}
                  className="rounded-lg shadow-2xl max-h-[78vh] object-contain border border-slate-800"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Sayfa {activeImageIndex + 1} / {selectedExamImageModal.images.length}</span>
                <span>•</span>
                <span>Dosya: <code className="text-slate-300 font-mono text-[11px]">{selectedExamImageModal.images[activeImageIndex]}</code></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedExamImageModal(null);
                  setImageZoom(1);
                }}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-medium cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OPTİK FORM VE SORU KİTAPÇIĞI İLE AKILLI DEĞERLENDİRME */}
      <OpticalExamModal
        student={student}
        isOpen={isOpticalModalOpen}
        onClose={() => setIsOpticalModalOpen(false)}
        onSaveEvaluation={handleSaveOpticalEvaluation}
        isManager={isManager}
      />
    </div>
  );
};
