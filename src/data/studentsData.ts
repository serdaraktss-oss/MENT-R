import { Student12thGrade, AnnualPlanDocument } from '../types';
import { generateAdaptiveWeeklyProgram } from '../utils/programGenerator';
import { parseOpticalDocument } from '../utils/kazanimGenerator';

const opticalData = parseOpticalDocument('12_SINIF_YKS_2_GM.png', 'HEPSİ');
const tytData = parseOpticalDocument('12_SINIF_YKS_2_GM.png', 'TYT');
const aytData = parseOpticalDocument('12_SINIF_YKS_2_GM.png', 'AYT');

const rawStudents: Omit<Student12thGrade, 'weeklyProgram'>[] = [
  {
    id: 's-101',
    name: 'Caner Yıldız',
    className: '12 MFA',
    studentNo: '412',
    branch: 'Sayısal',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    mentorNote: 'TYT Matematik (Obeb-Okek), TYT Tarih (İnsanlığın Hafızası), TYT Coğrafya (Dünyanın Şekli) ve TYT Biyoloji (Temel Bileşikler) konuları eksik konu olarak takip edilmektedir.',
    latestTyt: tytData,
    latestAyt: aytData,
    history: [
      { examTitle: '12. SINIF YKS 1', date: '05.09.2025', tytNet: 78.5, aytNet: 52.0 },
      { examTitle: '12. SINIF YKS 2 (GM)', date: '19.09.2025', tytNet: 84.75, aytNet: 62.5 },
    ],
    improvingKazanimlar: [
      { id: 'imp-1', subject: 'TYT Türkçe', topicName: 'Sözcükte Anlam ve Deyimler', changeRate: '+15% Artış', status: 'improving', detailNote: 'Paragraf ve sözel mantık çözüm hızı arttı.' },
      { id: 'imp-2', subject: 'TYT Matematik', topicName: 'Doğal Sayılarda Dört İşlem', changeRate: '+20% Artış', status: 'improving', detailNote: 'Temel kavram sorularında tam isabet sağlandı.' },
      { id: 'imp-3', subject: 'AYT Matematik', topicName: 'Faktöriyel ve Tam Sayılarda İşlemler', changeRate: '+12% Artış', status: 'improving', detailNote: 'İşlem hızı ve doğruluğu yükseldi.' }
    ],
    decliningKazanimlar: [
      { id: 'dec-1', subject: 'TYT Matematik', topicName: 'Obeb ve Okek', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'EBOB-EKOK problemleri tekrar edilmeli.' },
      { id: 'dec-2', subject: 'TYT Matematik', topicName: 'Tam sayılarda İşlemler', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'İşlem hatalarına dikkat edilmeli ve temel kavramlar gözden geçirilmeli.' },
      { id: 'dec-3', subject: 'TYT Tarih', topicName: 'İnsanlığın Hafızası Tarih', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'Tarih bilimi kavramları ve zaman haritası tekrar edilmeli.' },
      { id: 'dec-4', subject: 'TYT Tarih', topicName: 'İlk Çağ\'da Yeryüzündeki Medeniyetler', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'İlk çağ medeniyetleri gözden geçirilmeli.' },
      { id: 'dec-5', subject: 'TYT Coğrafya', topicName: 'Dünya\'nın Şekli ve Hareketleri', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'Eksen eğikliği ve harita bilgisi tekrar edilmeli.' },
      { id: 'dec-6', subject: 'TYT Biyoloji', topicName: 'Canlıların Yapısında Bulunan Temel Bileşikler', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'Organik moleküller ve enzimler tekrar edilmeli.' },
      { id: 'dec-7', subject: 'AYT Matematik', topicName: 'Fonksiyonlarda Öteleme ve Dönüşüm', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'Grafik dönüşümleri ve öteleme kuralları tekrar edilmeli.' },
      { id: 'dec-8', subject: 'AYT Fizik', topicName: 'Vektör-Kuvvet (Doğadaki Temel Kuvvetler)', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'Vektör analizi ve bileşenler tekrar edilmeli.' }
    ]
  },
  {
    id: 's-102',
    name: 'Elif Şahin',
    className: '12 TMA',
    studentNo: '508',
    branch: 'Eşit Ağırlık',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    mentorNote: 'AYT Edebiyat ve TYT Türkçe performansı yüksek. Matematik Obeb-Okek ve Tarih konuları takipte.',
    latestTyt: tytData,
    latestAyt: aytData,
    history: [
      { examTitle: '12. SINIF YKS 1', date: '05.09.2025', tytNet: 72.0, aytNet: 48.5 },
      { examTitle: '12. SINIF YKS 2 (GM)', date: '19.09.2025', tytNet: 79.25, aytNet: 55.0 },
    ],
    improvingKazanimlar: [
      { id: 'imp-4', subject: 'TYT Türkçe', topicName: 'Paragraf ve Metin Analizi', changeRate: '+18% Artış', status: 'improving', detailNote: 'Okuma hızı ve kavrama yüksek.' }
    ],
    decliningKazanimlar: [
      { id: 'dec-9', subject: 'TYT Matematik', topicName: 'Obeb ve Okek', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'EBOB-EKOK problemleri tekrar edilmeli.' },
      { id: 'dec-10', subject: 'TYT Tarih', topicName: 'İnsanlığın Hafızası Tarih', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'Tarih bilimi kavramları tekrar edilmeli.' },
      { id: 'dec-11', subject: 'TYT Coğrafya', topicName: 'Dünya\'nın Şekli ve Hareketleri', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'Eksen eğikliği konusu tekrar edilmeli.' },
      { id: 'dec-12', subject: 'TYT Biyoloji', topicName: 'Canlıların Yapısında Bulunan Temel Bileşikler', changeRate: 'Eksik Konu', status: 'declining', detailNote: 'Organik bileşikler ve enzimler tekrar edilmeli.' }
    ]
  }
];

export const ALL_12TH_GRADE_STUDENTS: Student12thGrade[] = rawStudents.map((s) => ({
  ...s,
  weeklyProgram: generateAdaptiveWeeklyProgram(s),
}));

export const INITIAL_ANNUAL_PLANS: AnnualPlanDocument[] = [];

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
