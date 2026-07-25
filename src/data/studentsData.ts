import { Student12thGrade } from '../types';
import { generateAdaptiveWeeklyProgram } from '../utils/programGenerator';

const rawStudents: Omit<Student12thGrade, 'weeklyProgram'>[] = [
  {
    id: 's101',
    name: 'Caner Yıldız',
    className: '12-A Fen Bilimleri',
    studentNo: '442',
    branch: 'Sayısal',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    mentorNote: 'Matematik ve Fizik netlerinde gözle görülür bir ivme var. Logaritma ve Kimyasal Bağlar eksikliklerine özel yoğunlaştırılmış haftalık soru çözümü uyguluyoruz.',
    
    latestTyt: {
      examName: 'Son Türkiye Geneli TYT-4',
      examDate: '18 Temmuz 2026',
      totalNet: 88.5,
      rankInSchool: 3,
      subjects: [
        { subjectName: 'Türkçe', questionCount: 40, correct: 34, wrong: 4, blank: 2, net: 33.0, accuracyRate: 85 },
        { subjectName: 'Temel Matematik', questionCount: 40, correct: 32, wrong: 5, blank: 3, net: 30.75, accuracyRate: 80 },
        { subjectName: 'Fen Bilimleri', questionCount: 20, correct: 16, wrong: 3, blank: 1, net: 15.25, accuracyRate: 81 },
        { subjectName: 'Sosyal Bilimler', questionCount: 20, correct: 11, wrong: 6, blank: 3, net: 9.5, accuracyRate: 55 },
      ]
    },

    latestAyt: {
      examName: 'Son Türkiye Geneli AYT-4',
      examDate: '19 Temmuz 2026',
      totalNet: 62.25,
      rankInSchool: 5,
      subjects: [
        { subjectName: 'AYT Matematik', questionCount: 40, correct: 28, wrong: 6, blank: 6, net: 26.5, accuracyRate: 70 },
        { subjectName: 'AYT Fizik', questionCount: 14, correct: 11, wrong: 2, blank: 1, net: 10.5, accuracyRate: 78 },
        { subjectName: 'AYT Kimya', questionCount: 13, correct: 9, wrong: 3, blank: 1, net: 8.25, accuracyRate: 69 },
        { subjectName: 'AYT Biyoloji', questionCount: 13, correct: 10, wrong: 2, blank: 1, net: 9.5, accuracyRate: 77 },
      ]
    },

    history: [
      { examTitle: 'Deneme 1', date: 'Ekim', tytNet: 72.5, aytNet: 45.0 },
      { examTitle: 'Deneme 2', date: 'Aralık', tytNet: 78.0, aytNet: 52.5 },
      { examTitle: 'Deneme 3', date: 'Şubat', tytNet: 82.25, aytNet: 58.0 },
      { examTitle: 'Deneme 4', date: 'Mayıs', tytNet: 88.5, aytNet: 62.25 },
    ],

    improvingKazanimlar: [
      { id: 'ik-1', subject: 'Matematik', topicName: 'Trigonometri I & Fonksiyon Grafikleri', changeRate: '+22% İlerleme', status: 'improving', detailNote: 'Açı dönüşümleri ve grafik okuma netleri %85 seviyesine yükseldi.' },
      { id: 'ik-2', subject: 'Türkçe', topicName: 'Paragrafta Yapı ve Anlam Bütünlüğü', changeRate: '+15% İlerleme', status: 'improving', detailNote: 'Paragraf süre yönetimi 28 dakikaya düştü, doğruluk oranı yüksek.' },
      { id: 'ik-3', subject: 'Fizik', topicName: 'Optik ve Dalga Mimarisi', changeRate: '+18% İlerleme', status: 'improving', detailNote: 'Kırılma ve mercek sorularında 0 hata ile tamamladı.' },
    ],

    decliningKazanimlar: [
      { id: 'dk-1', subject: 'Matematik', topicName: 'Logaritma ve Dizi Denklemleri', changeRate: '-14% Düşüş', status: 'declining', detailNote: 'Logaritma özelliklerinde ve taban değiştirmede işlem hataları yapılıyor.' },
      { id: 'dk-2', subject: 'Türkçe', topicName: 'Dil Bilgisi: Cümle Ögeleri', changeRate: '-10% Düşüş', status: 'declining', detailNote: 'Dolaylı tümleç ve zarf tümleci ayırt etmede takılıyor.' },
      { id: 'dk-3', subject: 'Kimya', topicName: 'Kimyasal Bağlar ve Hibritleşme', changeRate: '-8% Düşüş', status: 'declining', detailNote: 'Molekül geometrisi ve VSEPR gösterimi sorularında boş bırakılıyor.' },
    ],
  },
  {
    id: 's102',
    name: 'Elif Şahin',
    className: '12-A Fen Bilimleri',
    studentNo: '310',
    branch: 'Sayısal',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    mentorNote: 'Biyoloji ve Türkçe seviyesi derece grubunda. Matematikte Çember ve Analitik Geometriye yoğunlaşması netini 95+ seviyesine taşıyacaktır.',
    
    latestTyt: {
      examName: 'Son Türkiye Geneli TYT-4',
      examDate: '18 Temmuz 2026',
      totalNet: 94.25,
      rankInSchool: 1,
      subjects: [
        { subjectName: 'Türkçe', questionCount: 40, correct: 38, wrong: 2, blank: 0, net: 37.5, accuracyRate: 95 },
        { subjectName: 'Temel Matematik', questionCount: 40, correct: 34, wrong: 3, blank: 3, net: 33.25, accuracyRate: 85 },
        { subjectName: 'Fen Bilimleri', questionCount: 20, correct: 18, wrong: 2, blank: 0, net: 17.5, accuracyRate: 90 },
        { subjectName: 'Sosyal Bilimler', questionCount: 20, correct: 8, wrong: 8, blank: 4, net: 6.0, accuracyRate: 40 },
      ]
    },

    latestAyt: {
      examName: 'Son Türkiye Geneli AYT-4',
      examDate: '19 Temmuz 2026',
      totalNet: 68.75,
      rankInSchool: 1,
      subjects: [
        { subjectName: 'AYT Matematik', questionCount: 40, correct: 31, wrong: 4, blank: 5, net: 30.0, accuracyRate: 78 },
        { subjectName: 'AYT Fizik', questionCount: 14, correct: 12, wrong: 1, blank: 1, net: 11.75, accuracyRate: 88 },
        { subjectName: 'AYT Kimya', questionCount: 13, correct: 13, wrong: 0, blank: 0, net: 13.0, accuracyRate: 100 },
        { subjectName: 'AYT Biyoloji', questionCount: 13, correct: 13, wrong: 0, blank: 0, net: 13.0, accuracyRate: 100 },
      ]
    },

    history: [
      { examTitle: 'Deneme 1', date: 'Ekim', tytNet: 82.0, aytNet: 55.0 },
      { examTitle: 'Deneme 2', date: 'Aralık', tytNet: 86.5, aytNet: 60.0 },
      { examTitle: 'Deneme 3', date: 'Şubat', tytNet: 90.0, aytNet: 64.5 },
      { examTitle: 'Deneme 4', date: 'Mayıs', tytNet: 94.25, aytNet: 68.75 },
    ],

    improvingKazanimlar: [
      { id: 'ik-201', subject: 'Kimya', topicName: 'Organik Kimya & Tepkime Dengesi', changeRate: '+30% İlerleme', status: 'improving', detailNote: 'Organik adlandırma ve izomeri sorularının tamamı doğru.' },
      { id: 'ik-202', subject: 'Biyoloji', topicName: 'İnsan Fizyolojisi & Nöronlar', changeRate: '+25% İlerleme', status: 'improving', detailNote: 'Sistemler konusunu tam net ile kapatmaktadır.' },
    ],

    decliningKazanimlar: [
      { id: 'dk-201', subject: 'Geometri', topicName: 'Çemberde Açı ve Dairede Alan', changeRate: '-12% Düşüş', status: 'declining', detailNote: 'Kiriş ve teğet bağıntılarında görme zorluğu çekiyor.' },
      { id: 'dk-202', subject: 'Sosyal Bilimler', topicName: 'Coğrafya: İklim Tipleri ve Harita Okuma', changeRate: '-15% Düşüş', status: 'declining', detailNote: 'TYT Coğrafya harita sorularında boşları var.' },
    ],
  },
  {
    id: 's103',
    name: 'Mert Aksoy',
    className: '12-B Sayısal',
    studentNo: '188',
    branch: 'Sayısal',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    mentorNote: 'AYT Fizik ve Matematik konularında temel kavram eksikleri kapatılıyor. Günlük uyarlanmış daha az soru ile öğrencimizin özgüveni desteklenmektedir.',
    
    latestTyt: {
      examName: 'Son Türkiye Geneli TYT-4',
      examDate: '18 Temmuz 2026',
      totalNet: 52.5,
      rankInSchool: 22,
      subjects: [
        { subjectName: 'Türkçe', questionCount: 40, correct: 22, wrong: 12, blank: 6, net: 19.0, accuracyRate: 55 },
        { subjectName: 'Temel Matematik', questionCount: 40, correct: 18, wrong: 10, blank: 12, net: 15.5, accuracyRate: 45 },
        { subjectName: 'Fen Bilimleri', questionCount: 20, correct: 10, wrong: 6, blank: 4, net: 8.5, accuracyRate: 50 },
        { subjectName: 'Sosyal Bilimler', questionCount: 20, correct: 11, wrong: 6, blank: 3, net: 9.5, accuracyRate: 52 },
      ]
    },

    latestAyt: {
      examName: 'Son Türkiye Geneli AYT-4',
      examDate: '19 Temmuz 2026',
      totalNet: 32.25,
      rankInSchool: 20,
      subjects: [
        { subjectName: 'AYT Matematik', questionCount: 40, correct: 14, wrong: 10, blank: 16, net: 11.5, accuracyRate: 35 },
        { subjectName: 'AYT Fizik', questionCount: 14, correct: 6, wrong: 5, blank: 3, net: 4.75, accuracyRate: 42 },
        { subjectName: 'AYT Kimya', questionCount: 13, correct: 8, wrong: 4, blank: 1, net: 7.0, accuracyRate: 58 },
        { subjectName: 'AYT Biyoloji', questionCount: 13, correct: 10, wrong: 4, blank: 0, net: 9.0, accuracyRate: 68 },
      ]
    },

    history: [
      { examTitle: 'Deneme 1', date: 'Ekim', tytNet: 42.0, aytNet: 20.0 },
      { examTitle: 'Deneme 2', date: 'Aralık', tytNet: 46.5, aytNet: 24.0 },
      { examTitle: 'Deneme 3', date: 'Şubat', tytNet: 49.0, aytNet: 28.5 },
      { examTitle: 'Deneme 4', date: 'Mayıs', tytNet: 52.5, aytNet: 32.25 },
    ],

    improvingKazanimlar: [
      { id: 'ik-301', subject: 'Kimya', topicName: 'Gazlar & Sıvı Çözeltiler', changeRate: '+20% İlerleme', status: 'improving', detailNote: 'İdeal gaz denklemi ve derişim hesaplarında ilerleme var.' },
    ],

    decliningKazanimlar: [
      { id: 'dk-301', subject: 'Matematik', topicName: 'İkinci Dereceden Denklemler & Kökler', changeRate: '-16% Düşüş', status: 'declining', detailNote: 'Kök-katsayı bağıntılarında işlem hatası yüksek.' },
      { id: 'dk-302', subject: 'Fizik', topicName: 'Atışlar ve İki Boyutta Hareket', changeRate: '-11% Düşüş', status: 'declining', detailNote: 'Serbest düşme ve yatay atış formül uygulamalarında zorlanıyor.' },
    ],
  },
  {
    id: 's104',
    name: 'Derya Yılmaz',
    className: '12-C Eşit Ağırlık',
    studentNo: '205',
    branch: 'Eşit Ağırlık',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    mentorNote: 'Edebiyat ve Coğrafya netleri oldukça yüksek. AYT Matematikte Türev ve Analitik Geometriye ağırlık verilmektedir.',
    
    latestTyt: {
      examName: 'Son Türkiye Geneli TYT-4',
      examDate: '18 Temmuz 2026',
      totalNet: 83.0,
      rankInSchool: 6,
      subjects: [
        { subjectName: 'Türkçe', questionCount: 40, correct: 36, wrong: 3, blank: 1, net: 35.25, accuracyRate: 90 },
        { subjectName: 'Temel Matematik', questionCount: 40, correct: 26, wrong: 5, blank: 9, net: 24.75, accuracyRate: 65 },
        { subjectName: 'Sosyal Bilimler', questionCount: 20, correct: 17, wrong: 2, blank: 1, net: 16.5, accuracyRate: 85 },
        { subjectName: 'Fen Bilimleri', questionCount: 20, correct: 8, wrong: 6, blank: 6, net: 6.5, accuracyRate: 35 },
      ]
    },

    latestAyt: {
      examName: 'Son Türkiye Geneli AYT-4',
      examDate: '19 Temmuz 2026',
      totalNet: 56.5,
      rankInSchool: 2,
      subjects: [
        { subjectName: 'Edebiyat - Sosyal-1', questionCount: 40, correct: 34, wrong: 4, blank: 2, net: 33.0, accuracyRate: 85 },
        { subjectName: 'AYT Matematik', questionCount: 40, correct: 25, wrong: 6, blank: 9, net: 23.5, accuracyRate: 60 },
      ]
    },

    history: [
      { examTitle: 'Deneme 1', date: 'Ekim', tytNet: 68.0, aytNet: 42.0 },
      { examTitle: 'Deneme 2', date: 'Aralık', tytNet: 74.0, aytNet: 48.0 },
      { examTitle: 'Deneme 3', date: 'Şubat', tytNet: 78.5, aytNet: 51.5 },
      { examTitle: 'Deneme 4', date: 'Mayıs', tytNet: 83.0, aytNet: 56.5 },
    ],

    improvingKazanimlar: [
      { id: 'ik-401', subject: 'Edebiyat', topicName: 'Tanzimat & Servet-i Fünun Dönemi', changeRate: '+24% İlerleme', status: 'improving', detailNote: 'Eser-yazar eşleştirmelerinde sıfır hata.' },
    ],

    decliningKazanimlar: [
      { id: 'dk-401', subject: 'Matematik', topicName: 'Türev ve Geometrik Yorum', changeRate: '-15% Düşüş', status: 'declining', detailNote: 'Türevde teğet denklemi çıkarma adımlarında takılıyor.' },
      { id: 'dk-402', subject: 'Geometri', topicName: 'Analitik Geometri: Doğru Analitiği', changeRate: '-10% Düşüş', status: 'declining', detailNote: 'Eğim açısı ve iki doğru arası uzaklık formülü karıştırılıyor.' },
    ],
  },
];

export const ALL_12TH_GRADE_STUDENTS: Student12thGrade[] = rawStudents.map((s) => ({
  ...s,
  weeklyProgram: generateAdaptiveWeeklyProgram(s),
}));

export const INITIAL_ANNUAL_PLANS = [
  {
    id: 'plan-101',
    subject: 'AYT Matematik',
    branch: 'Sayısal' as const,
    fileName: '2025-2026_AYT_Matematik_Yillik_Plan_SerdarAktas.pdf',
    fileSize: '2.1 MB',
    uploadDate: '15.09.2025',
    uploadedBy: 'Serdar Aktaş (Yönetici)',
    activeWeeksCount: 36,
    keyTopics: ['Polinomlar & İkinci Dereceden Denklem', 'Fonksiyonlar & Parabol', 'Trigonometri I-II', 'Logaritma & Diziler', 'Limit ve Süreklilik', 'Türev ve Uygulamaları', 'İntegral Hesabı'],
    notes: 'Serdar Aktaş tarafından hazırlanmış MEB uyumlu 36 haftalık Sayısal AYT Matematik müfredat haritasıdır.'
  },
  {
    id: 'plan-102',
    subject: 'AYT Fizik',
    branch: 'Sayısal' as const,
    fileName: '2025-2026_AYT_Fizik_Mufredat_Plani.docx',
    fileSize: '1.8 MB',
    uploadDate: '18.09.2025',
    uploadedBy: 'Serdar Aktaş (Yönetici)',
    activeWeeksCount: 36,
    keyTopics: ['Vektörler & Bağıl Hareket', 'Newton Un Hareket Yasaları', 'Atışlar & İş Güç Enerji', 'Elektrik & Manyetizma', 'Çembersel Hareket & Basit Harmonik', 'Dalga Mekaniği & Modern Fizik'],
    notes: 'Deney ve soru tipleri ağırlıklı Fizik müfredat dağılımı.'
  },
  {
    id: 'plan-103',
    subject: 'AYT Kimya',
    branch: 'Sayısal' as const,
    fileName: '2025-2026_AYT_Kimya_Yillik_Plan.pdf',
    fileSize: '1.4 MB',
    uploadDate: '20.09.2025',
    uploadedBy: 'Serdar Aktaş (Yönetici)',
    activeWeeksCount: 36,
    keyTopics: ['Modern Atom Teorisi', 'Gazlar & Sıvı Çözeltiler', 'Kimyasal Tepkimelerde Enerji & Hız', 'Kimyasal Denge & Asit-Baz', 'Elektrokimya & Organik Kimya'],
    notes: 'Organik kimya reaksiyon mekanizmaları son 8 haftaya planlanmıştır.'
  },
  {
    id: 'plan-104',
    subject: 'Türk Dili ve Edebiyatı',
    branch: 'Eşit Ağırlık' as const,
    fileName: '2025-2026_YKS_Edebiyat_Yillik_Plan.xlsx',
    fileSize: '950 KB',
    uploadDate: '22.09.2025',
    uploadedBy: 'Serdar Aktaş (Yönetici)',
    activeWeeksCount: 36,
    keyTopics: ['Şiir Bilgisi & Edebi Sanatlar', 'İslamiyet Öncesi & Divan Edebiyatı', 'Tanzimat & Servet-i Fünun', 'Milli Edebiyat & Cumhuriyet Dönemi', 'Roman & Tiyatro Türleri'],
    notes: 'Eşit Ağırlık öğrencileri için eser-yazar ezber haritası içeren yıllık plan.'
  }
];

export const INITIAL_YKS_EXAMS = [
  {
    id: 'exam-201',
    examTitle: '2026 Türkiye Geneli Özdebir TYT-1',
    examType: 'TYT' as const,
    publisher: 'Özdebir Yayınları',
    uploadDate: '10.10.2025',
    fileName: 'Ozdebir_TG_TYT_1_Soru_Kitapcigi_CevapAnahtari.pdf',
    fileSize: '5.4 MB',
    totalQuestions: 120,
    testedKazanimlar: ['Paragrafta Anlam', 'Yazım Kuralları', 'Sayı Basamakları & Bölünebilme', 'Köklü Sayılar', 'Kuvvet-Hareket', 'Mol Kavramı', 'Hücre Bölünmeleri', 'Harita Bilgisi']
  },
  {
    id: 'exam-202',
    examTitle: '2026 Bilgi Sarmal Türkiye Geneli AYT-2',
    examType: 'AYT' as const,
    publisher: 'Bilgi Sarmal',
    uploadDate: '15.12.2025',
    fileName: 'BilgiSarmal_TG_AYT_2_Denemesi.pdf',
    fileSize: '6.2 MB',
    totalQuestions: 80,
    testedKazanimlar: ['Trigonometri', 'Parabol', 'Elektrik Alan & Potansiyel', 'Gaz Yasaları', 'Protein Sentezi', 'Divan Şiiri', 'Küresel Örgütler']
  },
  {
    id: 'exam-203',
    examTitle: '2026 3D Yayınları Prova AYT-3',
    examType: 'AYT' as const,
    publisher: '3D Yayınları',
    uploadDate: '20.02.2026',
    fileName: '3D_AYT_3_Soru_ve_Konu_Dağılım_Matrisi.pdf',
    fileSize: '4.9 MB',
    totalQuestions: 80,
    testedKazanimlar: ['Limit ve Süreklilik', 'Türev Alma Kuralları', 'İndüksiyon Akımı', 'Asit-Baz Dengesi', 'Bitki Biyolojisi', 'Milli Edebiyat Dönemi']
  }
];
