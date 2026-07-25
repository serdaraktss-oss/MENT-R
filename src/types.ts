export type NavTab = 'students' | 'annual-plans' | 'yks-exams' | 'ai-tools' | 'ai-apps' | 'tubitak' | 'teknofest' | 'registered-users';

export interface IsZamanItem {
  isAdi: string;
  nisan?: boolean;
  mayis?: boolean;
  haziran?: boolean;
  temmuz?: boolean;
  agustos?: boolean;
  eylul?: boolean;
  ekim?: boolean;
  kasim?: boolean;
  aralik?: boolean;
  ocak?: boolean;
}

export interface TubitakProject {
  id: string;
  projeAnaAlani: string; // e.g. Bilgisayar ve Yazılım, Biyoloji, Fizik, Kimya, Matematik...
  projeTematikAlani: string; // e.g. Yapay Zeka, Sürdürülebilirlik, Robotik...
  projeAdi: string; // Max 15 kelime
  ozet: string; // 150-250 kelime
  anahtarKelimeler: string[]; // Max 5 kelime
  amac: string; // Ar-Ge içeriği, somut hedefler, problem tanımı
  giris: string; // Literatür taraması, bilimsel dayanaklar
  yontem: string; // Araştırma yöntemi, veri toplama araçları, analiz
  isZamanCizelgesi: IsZamanItem[];
  bulgular: string; // Veriler ve analiz sonuçları
  sonucVeTartisma: string; // Tartışma ve değerlendirme
  oneriler: string; // Gelecek çalışmalara öneriler
  kaynaklar: string; // APA formatında atıflar
  ekler?: string;
  studentName?: string;
  takimAdi?: string;
  takimUyeleri?: string;
  cozumUrettigiSorun?: string;
  cozumUrettigiIhtiyacFikri?: string;
  kullanilacakTeknikYontem?: string;
  hedefKitle?: string;
  createdAt: string;
}

export interface TeknofestProject {
  id: string;
  kategori: string; // İnsanlık Yararına Teknoloji, Akıllı Ulaşım, Biyoteknoloji İnovasyon...
  projeAdi: string; // Max 15 kelime
  ozet: string; // Proje Özeti
  anahtarKelimeler: string[];
  problemIhtiyac: string; // Problem ve İhtiyaç Tanımı
  yerlilikOzgunluk: string; // Yerlilik, Özgünlük ve Yenilikçi Yönü
  hedefKitle: string; // Hedef Kitle ve Kullanılabilirlik
  yontemUygulanabilirlik: string; // Yöntem ve Uygulanabilirlik (Donanım/Yazılım)
  yerliUretimVeRiskler: string; // Yerli Üretim Potansiyeli ve Risk Analizi
  etkiVeSurdurulebilirlik: string; // Etki, Yaygınlaştırma ve Sürdürülebilirlik
  isZamanCizelgesi: IsZamanItem[];
  kaynaklar: string; // APA Referanslar
  studentName?: string;
  takimAdi?: string;
  takimUyeleri?: string;
  cozumUrettigiSorun?: string;
  cozumUrettigiIhtiyacFikri?: string;
  kullanilacakTeknikYontem?: string;
  createdAt: string;
}

export interface AnnualPlanDocument {
  id: string;
  subject: string; // e.g. 'Matematik', 'Fizik', 'Türkçe', 'Kimya', 'Biyoloji', 'Edebiyat', 'Tarih', 'Coğrafya'
  branch: 'Sayısal' | 'Eşit Ağırlık' | 'Sözel' | 'Dil' | 'Ortak / Tüm Branşlar';
  fileName: string;
  fileSize: string;
  uploadDate: string;
  uploadedBy: string; // 'Serdar Aktaş (Yönetici)'
  activeWeeksCount: number;
  keyTopics: string[];
  notes?: string;
}

export interface PastYksExamDocument {
  id: string;
  examTitle: string; // e.g. '2026 Türkiye Geneli TYT-1', 'Özdebir AYT Prova'
  examType: 'TYT' | 'AYT' | 'YDT';
  publisher: string;
  uploadDate: string;
  fileName: string;
  fileSize: string;
  totalQuestions: number;
  testedKazanimlar: string[]; // Topics covered in this trial exam
  downloadUrl?: string;
}

export interface SubjectKazanimDetail {
  topicName: string;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  status: 'mastered' | 'struggling' | 'blank';
  recommendation?: string;
}

export interface SubjectNetDetail {
  subjectName: string;
  questionCount: number;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
  accuracyRate: number; // e.g. 85 for 85%
  kazanimlar?: SubjectKazanimDetail[];
}

export interface ExamBreakdown {
  examName: string;
  examDate: string;
  totalNet: number;
  rankInSchool?: number;
  subjects: SubjectNetDetail[];
}

export interface SkillKazanim {
  id: string;
  subject: string;
  topicName: string;
  changeRate: string; // e.g. "+18% Artış" or "-12% Düşüş"
  status: 'improving' | 'declining';
  detailNote: string;
}

export interface ScheduleTask {
  id: string;
  timeSlot?: string;
  subject: string;
  topic: string;
  focusType: 'Eksik Konu (Ağırlıklı Odak)' | 'Her Gün Rutin' | 'Genel Tekrar' | 'Soru Çözümü & Deneme' | 'Konu Çalışması';
  questionTarget: number; // Hedef soru sayısı (öğrencinin akademik seviyesine göre ayarlanır)
  detail?: string;
  isMandatoryCommon?: boolean; // TYT Türkçe ve TYT Matematik için her gün zorunlu ortak ders
  isWeakTopic?: boolean; // Denemelerdeki eksik konulardan mı geldi
}

export interface DayProgram {
  dayName: 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar';
  dateStr?: string;
  tasks: ScheduleTask[];
}

export interface Student12thGrade {
  id: string;
  name: string;
  className: '12-A Fen Bilimleri' | '12-B Sayısal' | '12-C Eşit Ağırlık' | '12-D Dil';
  studentNo: string;
  branch: 'Sayısal' | 'Eşit Ağırlık' | 'Sözel' | 'Dil';
  avatarUrl: string;
  mentorNote: string;
  
  // TYT & AYT Exam Results
  latestTyt: ExamBreakdown;
  latestAyt: ExamBreakdown;

  // Historical Exam Trend
  history: {
    examTitle: string;
    date: string;
    tytNet: number;
    aytNet: number;
  }[];

  // Skill Gains & Losses
  improvingKazanimlar: SkillKazanim[];
  decliningKazanimlar: SkillKazanim[];

  // Weekly Program for PDF
  weeklyProgram: DayProgram[];
}

export interface TeacherUser {
  username: string;
  displayName: string;
  role: string;
  isLoggedIn: boolean;
}

export interface ReferenceDocument {
  id: string;
  module: 'tubitak' | 'teknofest';
  name: string;
  category: 'Şablon' | 'Yazım Kuralları' | 'Örnek Proje' | 'Puanlama Kriteri' | 'Diğer Rehber';
  content: string;
  size: number;
  uploadedAt: string;
  active: boolean;
}

