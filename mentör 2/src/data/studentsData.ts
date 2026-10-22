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
    trialExams: [
      {
        id: 't-101-1',
        examNumber: 1,
        examType: 'TYT',
        examTitle: '12. SINIF YKS 1',
        date: '05.09.2025',
        totalNet: 84.00,
        subjects: [
          { subjectName: 'TYT Türkçe', questionCount: 40, correct: 32, wrong: 6, blank: 2, net: 30.50, accuracyRate: 80 },
          { subjectName: 'TYT Tarih', questionCount: 5, correct: 2, wrong: 2, blank: 1, net: 1.50, accuracyRate: 40 },
          { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 3, wrong: 1, blank: 1, net: 2.75, accuracyRate: 60 },
          { subjectName: 'TYT Felsefe', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80 },
          { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 4, wrong: 0, blank: 1, net: 4.00, accuracyRate: 80 },
          { subjectName: 'TYT Matematik', questionCount: 40, correct: 26, wrong: 4, blank: 10, net: 25.00, accuracyRate: 65 },
          { subjectName: 'TYT Fizik', questionCount: 7, correct: 5, wrong: 2, blank: 0, net: 4.50, accuracyRate: 71 },
          { subjectName: 'TYT Kimya', questionCount: 7, correct: 6, wrong: 1, blank: 0, net: 5.75, accuracyRate: 86 },
          { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 4, wrong: 2, blank: 0, net: 3.50, accuracyRate: 67 },
        ],
        createdAt: '05.09.2025',
      },
      {
        id: 't-101-2',
        examNumber: 2,
        examType: 'TYT',
        examTitle: '12. SINIF YKS 2 (GM)',
        date: '19.09.2025',
        totalNet: 94.75,
        deltaTotalNet: 10.75,
        deltaTotalRate: 12.8,
        subjects: [
          { subjectName: 'TYT Türkçe', questionCount: 40, correct: 35, wrong: 5, blank: 0, net: 33.75, accuracyRate: 88, deltaNet: 3.25, deltaRate: 10.7 },
          { subjectName: 'TYT Tarih', questionCount: 5, correct: 3, wrong: 2, blank: 0, net: 2.50, accuracyRate: 60, deltaNet: 1.00, deltaRate: 66.7 },
          { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 1.00, deltaRate: 36.4 },
          { subjectName: 'TYT Felsefe', questionCount: 5, correct: 5, wrong: 0, blank: 0, net: 5.00, accuracyRate: 100, deltaNet: 1.25, deltaRate: 33.3 },
          { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 5, wrong: 0, blank: 0, net: 5.00, accuracyRate: 100, deltaNet: 1.00, deltaRate: 25.0 },
          { subjectName: 'TYT Matematik', questionCount: 40, correct: 29, wrong: 2, blank: 9, net: 28.50, accuracyRate: 73, deltaNet: 3.50, deltaRate: 14.0 },
          { subjectName: 'TYT Fizik', questionCount: 7, correct: 6, wrong: 1, blank: 0, net: 5.75, accuracyRate: 86, deltaNet: 1.25, deltaRate: 27.8 },
          { subjectName: 'TYT Kimya', questionCount: 7, correct: 6, wrong: 1, blank: 0, net: 5.75, accuracyRate: 86, deltaNet: 0.00, deltaRate: 0.0 },
          { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 5, wrong: 1, blank: 0, net: 4.75, accuracyRate: 83, deltaNet: 1.25, deltaRate: 35.7 },
        ],
        createdAt: '19.09.2025',
      },
      {
        id: 't-101-3',
        examNumber: 1,
        examType: 'AYT',
        examTitle: '12. SINIF YKS 1 (AYT)',
        date: '05.09.2025',
        totalNet: 52.00,
        subjects: [
          { subjectName: 'AYT Matematik', questionCount: 40, correct: 26, wrong: 4, blank: 10, net: 25.00, accuracyRate: 65 },
          { subjectName: 'AYT Fizik', questionCount: 14, correct: 7, wrong: 4, blank: 3, net: 6.00, accuracyRate: 50 },
          { subjectName: 'AYT Kimya', questionCount: 13, correct: 10, wrong: 2, blank: 1, net: 9.50, accuracyRate: 77 },
          { subjectName: 'AYT Biyoloji', questionCount: 13, correct: 8, wrong: 4, blank: 1, net: 7.00, accuracyRate: 62 },
        ],
        createdAt: '05.09.2025',
      },
      {
        id: 't-101-4',
        examNumber: 2,
        examType: 'AYT',
        examTitle: '12. SINIF YKS 2 (GM AYT)',
        date: '19.09.2025',
        totalNet: 60.00,
        deltaTotalNet: 8.00,
        deltaTotalRate: 15.4,
        subjects: [
          { subjectName: 'AYT Matematik', questionCount: 40, correct: 28, wrong: 2, blank: 10, net: 27.50, accuracyRate: 70, deltaNet: 2.50, deltaRate: 10.0 },
          { subjectName: 'AYT Fizik', questionCount: 14, correct: 9, wrong: 3, blank: 2, net: 8.25, accuracyRate: 64, deltaNet: 2.25, deltaRate: 37.5 },
          { subjectName: 'AYT Kimya', questionCount: 13, correct: 12, wrong: 1, blank: 0, net: 11.75, accuracyRate: 92, deltaNet: 2.25, deltaRate: 23.7 },
          { subjectName: 'AYT Biyoloji', questionCount: 13, correct: 10, wrong: 2, blank: 1, net: 9.50, accuracyRate: 77, deltaNet: 2.50, deltaRate: 35.7 },
        ],
        createdAt: '19.09.2025',
      }
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
    trialExams: [
      {
        id: 't-102-1',
        examNumber: 1,
        examType: 'TYT',
        examTitle: '12. SINIF YKS 1',
        date: '05.09.2025',
        totalNet: 75.00,
        subjects: [
          { subjectName: 'TYT Türkçe', questionCount: 40, correct: 33, wrong: 4, blank: 3, net: 32.00, accuracyRate: 83 },
          { subjectName: 'TYT Tarih', questionCount: 5, correct: 3, wrong: 2, blank: 0, net: 2.50, accuracyRate: 60 },
          { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 3, wrong: 1, blank: 1, net: 2.75, accuracyRate: 60 },
          { subjectName: 'TYT Felsefe', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80 },
          { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 4, wrong: 0, blank: 1, net: 4.00, accuracyRate: 80 },
          { subjectName: 'TYT Matematik', questionCount: 40, correct: 20, wrong: 4, blank: 16, net: 19.00, accuracyRate: 50 },
          { subjectName: 'TYT Fizik', questionCount: 7, correct: 3, wrong: 2, blank: 2, net: 2.50, accuracyRate: 43 },
          { subjectName: 'TYT Kimya', questionCount: 7, correct: 4, wrong: 2, blank: 1, net: 3.50, accuracyRate: 57 },
          { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 3, wrong: 2, blank: 1, net: 2.50, accuracyRate: 50 },
        ],
        createdAt: '05.09.2025',
      },
      {
        id: 't-102-2',
        examNumber: 2,
        examType: 'TYT',
        examTitle: '12. SINIF YKS 2 (GM)',
        date: '19.09.2025',
        totalNet: 85.50,
        deltaTotalNet: 10.50,
        deltaTotalRate: 14.0,
        subjects: [
          { subjectName: 'TYT Türkçe', questionCount: 40, correct: 36, wrong: 3, blank: 1, net: 35.25, accuracyRate: 90, deltaNet: 3.25, deltaRate: 10.2 },
          { subjectName: 'TYT Tarih', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 1.25, deltaRate: 50.0 },
          { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 1.00, deltaRate: 36.4 },
          { subjectName: 'TYT Felsefe', questionCount: 5, correct: 5, wrong: 0, blank: 0, net: 5.00, accuracyRate: 100, deltaNet: 1.25, deltaRate: 33.3 },
          { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 5, wrong: 0, blank: 0, net: 5.00, accuracyRate: 100, deltaNet: 1.00, deltaRate: 25.0 },
          { subjectName: 'TYT Matematik', questionCount: 40, correct: 22, wrong: 3, blank: 15, net: 21.25, accuracyRate: 55, deltaNet: 2.25, deltaRate: 11.8 },
          { subjectName: 'TYT Fizik', questionCount: 7, correct: 4, wrong: 2, blank: 1, net: 3.50, accuracyRate: 57, deltaNet: 1.00, deltaRate: 40.0 },
          { subjectName: 'TYT Kimya', questionCount: 7, correct: 4, wrong: 1, blank: 2, net: 3.75, accuracyRate: 57, deltaNet: 0.25, deltaRate: 7.1 },
          { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 4, wrong: 1, blank: 1, net: 3.75, accuracyRate: 67, deltaNet: 1.25, deltaRate: 50.0 },
        ],
        createdAt: '19.09.2025',
      },
      {
        id: 't-102-3',
        examNumber: 1,
        examType: 'AYT',
        examTitle: '12. SINIF YKS 1 (AYT)',
        date: '05.09.2025',
        totalNet: 48.50,
        subjects: [
          { subjectName: 'AYT Edebiyat', questionCount: 24, correct: 18, wrong: 4, blank: 2, net: 17.00, accuracyRate: 75 },
          { subjectName: 'AYT Tarih', questionCount: 10, correct: 7, wrong: 2, blank: 1, net: 6.50, accuracyRate: 70 },
          { subjectName: 'AYT Coğrafya', questionCount: 6, correct: 4, wrong: 1, blank: 1, net: 3.75, accuracyRate: 67 },
          { subjectName: 'AYT Matematik', questionCount: 40, correct: 22, wrong: 3, blank: 15, net: 21.25, accuracyRate: 55 },
        ],
        createdAt: '05.09.2025',
      },
      {
        id: 't-102-4',
        examNumber: 2,
        examType: 'AYT',
        examTitle: '12. SINIF YKS 2 (GM AYT)',
        date: '19.09.2025',
        totalNet: 56.50,
        deltaTotalNet: 8.00,
        deltaTotalRate: 16.5,
        subjects: [
          { subjectName: 'AYT Edebiyat', questionCount: 24, correct: 21, wrong: 2, blank: 1, net: 20.50, accuracyRate: 88, deltaNet: 3.50, deltaRate: 20.6 },
          { subjectName: 'AYT Tarih', questionCount: 10, correct: 8, wrong: 1, blank: 1, net: 7.75, accuracyRate: 80, deltaNet: 1.25, deltaRate: 19.2 },
          { subjectName: 'AYT Coğrafya', questionCount: 6, correct: 5, wrong: 1, blank: 0, net: 4.75, accuracyRate: 83, deltaNet: 1.00, deltaRate: 26.7 },
          { subjectName: 'AYT Matematik', questionCount: 40, correct: 24, wrong: 2, blank: 14, net: 23.50, accuracyRate: 60, deltaNet: 2.25, deltaRate: 10.6 },
        ],
        createdAt: '19.09.2025',
      }
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
  },
  {
    id: 's-103',
    name: 'Yusuf Demir',
    className: '12 MFA',
    studentNo: '418',
    branch: 'Sayısal',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    mentorNote: 'Matematik ve Fizik net artış hızı çok yüksek. Geometri çizim pratikleri yapılıyor.',
    latestTyt: {
      examName: '12. SINIF YKS 2 (GM) (TYT)',
      examDate: '19.09.2025',
      totalNet: 88.50,
      rankInSchool: 2,
      deltaTotalNet: 8.50,
      deltaTotalRate: 10.6,
      subjects: [
        { subjectName: 'TYT Türkçe', questionCount: 40, correct: 34, wrong: 4, blank: 2, net: 33.00, accuracyRate: 85, deltaNet: 2.00, deltaRate: 6.5 },
        { subjectName: 'TYT Tarih', questionCount: 5, correct: 3, wrong: 1, blank: 1, net: 2.75, accuracyRate: 60, deltaNet: 0.50, deltaRate: 22.2 },
        { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 3, wrong: 2, blank: 0, net: 2.50, accuracyRate: 60, deltaNet: 0.25, deltaRate: 11.1 },
        { subjectName: 'TYT Felsefe', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 0.50, deltaRate: 15.4 },
        { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 0.25, deltaRate: 7.1 },
        { subjectName: 'TYT Matematik', questionCount: 40, correct: 28, wrong: 3, blank: 9, net: 27.25, accuracyRate: 70, deltaNet: 3.00, deltaRate: 12.4 },
        { subjectName: 'TYT Fizik', questionCount: 7, correct: 6, wrong: 1, blank: 0, net: 5.75, accuracyRate: 86, deltaNet: 1.50, deltaRate: 35.3 },
        { subjectName: 'TYT Kimya', questionCount: 7, correct: 5, wrong: 1, blank: 1, net: 4.75, accuracyRate: 71, deltaNet: 0.25, deltaRate: 5.6 },
        { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 5, wrong: 0, blank: 1, net: 5.00, accuracyRate: 83, deltaNet: 0.25, deltaRate: 5.3 },
      ]
    },
    latestAyt: {
      examName: '12. SINIF YKS 2 (GM AYT)',
      examDate: '19.09.2025',
      totalNet: 58.75,
      rankInSchool: 2,
      deltaTotalNet: 7.75,
      deltaTotalRate: 15.2,
      subjects: [
        { subjectName: 'AYT Matematik', questionCount: 40, correct: 28, wrong: 3, blank: 9, net: 27.25, accuracyRate: 70, deltaNet: 2.50, deltaRate: 10.1 },
        { subjectName: 'AYT Fizik', questionCount: 14, correct: 9, wrong: 4, blank: 1, net: 8.00, accuracyRate: 64, deltaNet: 2.00, deltaRate: 33.3 },
        { subjectName: 'AYT Kimya', questionCount: 13, correct: 11, wrong: 2, blank: 0, net: 10.50, accuracyRate: 85, deltaNet: 1.50, deltaRate: 16.7 },
        { subjectName: 'AYT Biyoloji', questionCount: 13, correct: 13, wrong: 0, blank: 0, net: 13.00, accuracyRate: 100, deltaNet: 1.75, deltaRate: 15.6 },
      ]
    },
    history: [
      { examTitle: '12. SINIF YKS 1', date: '05.09.2025', tytNet: 80.0, aytNet: 51.0 },
      { examTitle: '12. SINIF YKS 2 (GM)', date: '19.09.2025', tytNet: 88.5, aytNet: 58.75 },
    ],
    trialExams: [
      {
        id: 't-103-1',
        examNumber: 1,
        examType: 'TYT',
        examTitle: '12. SINIF YKS 1',
        date: '05.09.2025',
        totalNet: 80.00,
        subjects: [
          { subjectName: 'TYT Türkçe', questionCount: 40, correct: 32, wrong: 4, blank: 4, net: 31.00, accuracyRate: 80 },
          { subjectName: 'TYT Tarih', questionCount: 5, correct: 3, wrong: 3, blank: 0, net: 2.25, accuracyRate: 60 },
          { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 3, wrong: 3, blank: 0, net: 2.25, accuracyRate: 60 },
          { subjectName: 'TYT Felsefe', questionCount: 5, correct: 4, wrong: 3, blank: 0, net: 3.25, accuracyRate: 80 },
          { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 4, wrong: 2, blank: 0, net: 3.50, accuracyRate: 80 },
          { subjectName: 'TYT Matematik', questionCount: 40, correct: 25, wrong: 3, blank: 12, net: 24.25, accuracyRate: 63 },
          { subjectName: 'TYT Fizik', questionCount: 7, correct: 5, wrong: 3, blank: 0, net: 4.25, accuracyRate: 71 },
          { subjectName: 'TYT Kimya', questionCount: 7, correct: 5, wrong: 2, blank: 0, net: 4.50, accuracyRate: 71 },
          { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 5, wrong: 1, blank: 0, net: 4.75, accuracyRate: 83 },
        ],
        createdAt: '05.09.2025',
      },
      {
        id: 't-103-2',
        examNumber: 2,
        examType: 'TYT',
        examTitle: '12. SINIF YKS 2 (GM)',
        date: '19.09.2025',
        totalNet: 88.50,
        deltaTotalNet: 8.50,
        deltaTotalRate: 10.6,
        subjects: [
          { subjectName: 'TYT Türkçe', questionCount: 40, correct: 34, wrong: 4, blank: 2, net: 33.00, accuracyRate: 85, deltaNet: 2.00, deltaRate: 6.5 },
          { subjectName: 'TYT Tarih', questionCount: 5, correct: 3, wrong: 1, blank: 1, net: 2.75, accuracyRate: 60, deltaNet: 0.50, deltaRate: 22.2 },
          { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 3, wrong: 2, blank: 0, net: 2.50, accuracyRate: 60, deltaNet: 0.25, deltaRate: 11.1 },
          { subjectName: 'TYT Felsefe', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 0.50, deltaRate: 15.4 },
          { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 0.25, deltaRate: 7.1 },
          { subjectName: 'TYT Matematik', questionCount: 40, correct: 28, wrong: 3, blank: 9, net: 27.25, accuracyRate: 70, deltaNet: 3.00, deltaRate: 12.4 },
          { subjectName: 'TYT Fizik', questionCount: 7, correct: 6, wrong: 1, blank: 0, net: 5.75, accuracyRate: 86, deltaNet: 1.50, deltaRate: 35.3 },
          { subjectName: 'TYT Kimya', questionCount: 7, correct: 5, wrong: 1, blank: 1, net: 4.75, accuracyRate: 71, deltaNet: 0.25, deltaRate: 5.6 },
          { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 5, wrong: 0, blank: 1, net: 5.00, accuracyRate: 83, deltaNet: 0.25, deltaRate: 5.3 },
        ],
        createdAt: '19.09.2025',
      }
    ],
    improvingKazanimlar: [
      { id: 'imp-5', subject: 'TYT Fizik', topicName: 'Kuvvet ve Hareket', changeRate: '+25% Artış', status: 'improving', detailNote: 'Dinamik sorularında başarı arttı.' }
    ],
    decliningKazanimlar: []
  },
  {
    id: 's-105',
    name: 'Burak Aydın',
    className: '12 TMA',
    studentNo: '512',
    branch: 'Eşit Ağırlık',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    mentorNote: 'Türkçe ve Tarih alanında istikrarlı artış. Matematik problem çözümlerine ağırlık verildi.',
    latestTyt: {
      examName: '12. SINIF YKS 2 (GM) (TYT)',
      examDate: '19.09.2025',
      totalNet: 82.00,
      rankInSchool: 4,
      deltaTotalNet: 8.00,
      deltaTotalRate: 10.8,
      subjects: [
        { subjectName: 'TYT Türkçe', questionCount: 40, correct: 35, wrong: 4, blank: 1, net: 34.00, accuracyRate: 88, deltaNet: 3.00, deltaRate: 9.7 },
        { subjectName: 'TYT Tarih', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 1.50, deltaRate: 66.7 },
        { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 1.25, deltaRate: 50.0 },
        { subjectName: 'TYT Felsefe', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 0.50, deltaRate: 15.4 },
        { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 5, wrong: 0, blank: 0, net: 5.00, accuracyRate: 100, deltaNet: 0.50, deltaRate: 11.1 },
        { subjectName: 'TYT Matematik', questionCount: 40, correct: 22, wrong: 4, blank: 14, net: 21.00, accuracyRate: 55, deltaNet: 1.50, deltaRate: 7.7 },
        { subjectName: 'TYT Fizik', questionCount: 7, correct: 3, wrong: 1, blank: 3, net: 2.75, accuracyRate: 43, deltaNet: 0.50, deltaRate: 22.2 },
        { subjectName: 'TYT Kimya', questionCount: 7, correct: 4, wrong: 2, blank: 1, net: 3.50, accuracyRate: 57, deltaNet: 0.25, deltaRate: 7.7 },
        { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 4, wrong: 1, blank: 1, net: 3.75, accuracyRate: 67, deltaNet: 0.50, deltaRate: 15.4 },
      ]
    },
    latestAyt: {
      examName: '12. SINIF YKS 2 (GM AYT)',
      examDate: '19.09.2025',
      totalNet: 54.00,
      rankInSchool: 4,
      deltaTotalNet: 6.50,
      deltaTotalRate: 13.7,
      subjects: [
        { subjectName: 'AYT Edebiyat', questionCount: 24, correct: 20, wrong: 2, blank: 2, net: 19.50, accuracyRate: 83, deltaNet: 3.00, deltaRate: 18.2 },
        { subjectName: 'AYT Tarih', questionCount: 10, correct: 8, wrong: 1, blank: 1, net: 7.75, accuracyRate: 80, deltaNet: 1.50, deltaRate: 24.0 },
        { subjectName: 'AYT Coğrafya', questionCount: 6, correct: 5, wrong: 1, blank: 0, net: 4.75, accuracyRate: 83, deltaNet: 1.00, deltaRate: 26.7 },
        { subjectName: 'AYT Matematik', questionCount: 40, correct: 23, wrong: 4, blank: 13, net: 22.00, accuracyRate: 58, deltaNet: 1.00, deltaRate: 4.8 },
      ]
    },
    history: [
      { examTitle: '12. SINIF YKS 1', date: '05.09.2025', tytNet: 74.0, aytNet: 47.5 },
      { examTitle: '12. SINIF YKS 2 (GM)', date: '19.09.2025', tytNet: 82.0, aytNet: 54.0 },
    ],
    trialExams: [
      {
        id: 't-105-1',
        examNumber: 1,
        examType: 'TYT',
        examTitle: '12. SINIF YKS 1',
        date: '05.09.2025',
        totalNet: 74.00,
        subjects: [
          { subjectName: 'TYT Türkçe', questionCount: 40, correct: 32, wrong: 4, blank: 4, net: 31.00, accuracyRate: 80 },
          { subjectName: 'TYT Tarih', questionCount: 5, correct: 3, wrong: 3, blank: 0, net: 2.25, accuracyRate: 60 },
          { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 3, wrong: 2, blank: 0, net: 2.50, accuracyRate: 60 },
          { subjectName: 'TYT Felsefe', questionCount: 5, correct: 4, wrong: 3, blank: 0, net: 3.25, accuracyRate: 80 },
          { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 5, wrong: 2, blank: 0, net: 4.50, accuracyRate: 100 },
          { subjectName: 'TYT Matematik', questionCount: 40, correct: 20, wrong: 2, blank: 18, net: 19.50, accuracyRate: 50 },
          { subjectName: 'TYT Fizik', questionCount: 7, correct: 3, wrong: 3, blank: 1, net: 2.25, accuracyRate: 43 },
          { subjectName: 'TYT Kimya', questionCount: 7, correct: 4, wrong: 3, blank: 0, net: 3.25, accuracyRate: 57 },
          { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 4, wrong: 3, blank: 0, net: 3.25, accuracyRate: 67 },
        ],
        createdAt: '05.09.2025',
      },
      {
        id: 't-105-2',
        examNumber: 2,
        examType: 'TYT',
        examTitle: '12. SINIF YKS 2 (GM)',
        date: '19.09.2025',
        totalNet: 82.00,
        deltaTotalNet: 8.00,
        deltaTotalRate: 10.8,
        subjects: [
          { subjectName: 'TYT Türkçe', questionCount: 40, correct: 35, wrong: 4, blank: 1, net: 34.00, accuracyRate: 88, deltaNet: 3.00, deltaRate: 9.7 },
          { subjectName: 'TYT Tarih', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 1.50, deltaRate: 66.7 },
          { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 1.25, deltaRate: 50.0 },
          { subjectName: 'TYT Felsefe', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 0.50, deltaRate: 15.4 },
          { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 5, wrong: 0, blank: 0, net: 5.00, accuracyRate: 100, deltaNet: 0.50, deltaRate: 11.1 },
          { subjectName: 'TYT Matematik', questionCount: 40, correct: 22, wrong: 4, blank: 14, net: 21.00, accuracyRate: 55, deltaNet: 1.50, deltaRate: 7.7 },
          { subjectName: 'TYT Fizik', questionCount: 7, correct: 3, wrong: 1, blank: 3, net: 2.75, accuracyRate: 43, deltaNet: 0.50, deltaRate: 22.2 },
          { subjectName: 'TYT Kimya', questionCount: 7, correct: 4, wrong: 2, blank: 1, net: 3.50, accuracyRate: 57, deltaNet: 0.25, deltaRate: 7.7 },
          { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 4, wrong: 1, blank: 1, net: 3.75, accuracyRate: 67, deltaNet: 0.50, deltaRate: 15.4 },
        ],
        createdAt: '19.09.2025',
      }
    ],
    improvingKazanimlar: [],
    decliningKazanimlar: []
  },
  {
    id: 's-107',
    name: 'Arda Çelik',
    className: '12 TMB',
    studentNo: '604',
    branch: 'Eşit Ağırlık',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    mentorNote: 'Tarih ve Din Kültürü branşlarında yüksek artış oranı. Türkçe paragraf soru çözümü yoğunlaştırıldı.',
    latestTyt: {
      examName: '12. SINIF YKS 2 (GM) (TYT)',
      examDate: '19.09.2025',
      totalNet: 78.50,
      rankInSchool: 5,
      deltaTotalNet: 7.50,
      deltaTotalRate: 10.6,
      subjects: [
        { subjectName: 'TYT Türkçe', questionCount: 40, correct: 34, wrong: 5, blank: 1, net: 32.75, accuracyRate: 85, deltaNet: 2.50, deltaRate: 8.3 },
        { subjectName: 'TYT Tarih', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 1.75, deltaRate: 87.5 },
        { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 3, wrong: 1, blank: 1, net: 2.75, accuracyRate: 60, deltaNet: 0.75, deltaRate: 37.5 },
        { subjectName: 'TYT Felsefe', questionCount: 5, correct: 4, wrong: 0, blank: 1, net: 4.00, accuracyRate: 80, deltaNet: 0.50, deltaRate: 14.3 },
        { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 5, wrong: 0, blank: 0, net: 5.00, accuracyRate: 100, deltaNet: 1.00, deltaRate: 25.0 },
        { subjectName: 'TYT Matematik', questionCount: 40, correct: 20, wrong: 4, blank: 16, net: 19.00, accuracyRate: 50, deltaNet: 1.50, deltaRate: 8.6 },
        { subjectName: 'TYT Fizik', questionCount: 7, correct: 3, wrong: 2, blank: 2, net: 2.50, accuracyRate: 43, deltaNet: 0.50, deltaRate: 25.0 },
        { subjectName: 'TYT Kimya', questionCount: 7, correct: 4, wrong: 2, blank: 1, net: 3.50, accuracyRate: 57, deltaNet: 0.50, deltaRate: 16.7 },
        { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 3, wrong: 2, blank: 1, net: 2.50, accuracyRate: 50, deltaNet: 0.25, deltaRate: 11.1 },
      ]
    },
    latestAyt: {
      examName: '12. SINIF YKS 2 (GM AYT)',
      examDate: '19.09.2025',
      totalNet: 50.00,
      rankInSchool: 5,
      deltaTotalNet: 6.00,
      deltaTotalRate: 13.6,
      subjects: [
        { subjectName: 'AYT Edebiyat', questionCount: 24, correct: 18, wrong: 4, blank: 2, net: 17.00, accuracyRate: 75, deltaNet: 2.50, deltaRate: 17.2 },
        { subjectName: 'AYT Tarih', questionCount: 10, correct: 8, wrong: 2, blank: 0, net: 7.50, accuracyRate: 80, deltaNet: 1.50, deltaRate: 25.0 },
        { subjectName: 'AYT Coğrafya', questionCount: 6, correct: 4, wrong: 1, blank: 1, net: 3.75, accuracyRate: 67, deltaNet: 0.75, deltaRate: 25.0 },
        { subjectName: 'AYT Matematik', questionCount: 40, correct: 22, wrong: 3, blank: 15, net: 21.25, accuracyRate: 55, deltaNet: 1.25, deltaRate: 6.3 },
      ]
    },
    history: [
      { examTitle: '12. SINIF YKS 1', date: '05.09.2025', tytNet: 71.0, aytNet: 44.0 },
      { examTitle: '12. SINIF YKS 2 (GM)', date: '19.09.2025', tytNet: 78.5, aytNet: 50.0 },
    ],
    trialExams: [
      {
        id: 't-107-1',
        examNumber: 1,
        examType: 'TYT',
        examTitle: '12. SINIF YKS 1',
        date: '05.09.2025',
        totalNet: 71.00,
        subjects: [
          { subjectName: 'TYT Türkçe', questionCount: 40, correct: 31, wrong: 3, blank: 6, net: 30.25, accuracyRate: 78 },
          { subjectName: 'TYT Tarih', questionCount: 5, correct: 2, wrong: 0, blank: 3, net: 2.00, accuracyRate: 40 },
          { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 2, wrong: 0, blank: 3, net: 2.00, accuracyRate: 40 },
          { subjectName: 'TYT Felsefe', questionCount: 5, correct: 4, wrong: 2, blank: 0, net: 3.50, accuracyRate: 80 },
          { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 4, wrong: 0, blank: 1, net: 4.00, accuracyRate: 80 },
          { subjectName: 'TYT Matematik', questionCount: 40, correct: 18, wrong: 2, blank: 20, net: 17.50, accuracyRate: 45 },
          { subjectName: 'TYT Fizik', questionCount: 7, correct: 2, wrong: 0, blank: 5, net: 2.00, accuracyRate: 29 },
          { subjectName: 'TYT Kimya', questionCount: 7, correct: 3, wrong: 0, blank: 4, net: 3.00, accuracyRate: 43 },
          { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 2, wrong: 0, blank: 4, net: 2.25, accuracyRate: 38 },
        ],
        createdAt: '05.09.2025',
      },
      {
        id: 't-107-2',
        examNumber: 2,
        examType: 'TYT',
        examTitle: '12. SINIF YKS 2 (GM)',
        date: '19.09.2025',
        totalNet: 78.50,
        deltaTotalNet: 7.50,
        deltaTotalRate: 10.6,
        subjects: [
          { subjectName: 'TYT Türkçe', questionCount: 40, correct: 34, wrong: 5, blank: 1, net: 32.75, accuracyRate: 85, deltaNet: 2.50, deltaRate: 8.3 },
          { subjectName: 'TYT Tarih', questionCount: 5, correct: 4, wrong: 1, blank: 0, net: 3.75, accuracyRate: 80, deltaNet: 1.75, deltaRate: 87.5 },
          { subjectName: 'TYT Coğrafya', questionCount: 5, correct: 3, wrong: 1, blank: 1, net: 2.75, accuracyRate: 60, deltaNet: 0.75, deltaRate: 37.5 },
          { subjectName: 'TYT Felsefe', questionCount: 5, correct: 4, wrong: 0, blank: 1, net: 4.00, accuracyRate: 80, deltaNet: 0.50, deltaRate: 14.3 },
          { subjectName: 'TYT Din Kültürü', questionCount: 5, correct: 5, wrong: 0, blank: 0, net: 5.00, accuracyRate: 100, deltaNet: 1.00, deltaRate: 25.0 },
          { subjectName: 'TYT Matematik', questionCount: 40, correct: 20, wrong: 4, blank: 16, net: 19.00, accuracyRate: 50, deltaNet: 1.50, deltaRate: 8.6 },
          { subjectName: 'TYT Fizik', questionCount: 7, correct: 3, wrong: 2, blank: 2, net: 2.50, accuracyRate: 43, deltaNet: 0.50, deltaRate: 25.0 },
          { subjectName: 'TYT Kimya', questionCount: 7, correct: 4, wrong: 2, blank: 1, net: 3.50, accuracyRate: 57, deltaNet: 0.50, deltaRate: 16.7 },
          { subjectName: 'TYT Biyoloji', questionCount: 6, correct: 3, wrong: 2, blank: 1, net: 2.50, accuracyRate: 50, deltaNet: 0.25, deltaRate: 11.1 },
        ],
        createdAt: '19.09.2025',
      }
    ],
    improvingKazanimlar: [],
    decliningKazanimlar: []
  }
];

import studentStoreList from './students_store.json';

export const ALL_12TH_GRADE_STUDENTS: Student12thGrade[] = (studentStoreList as any[]).map((s) => ({
  ...s,
  weeklyProgram: s.weeklyProgram && s.weeklyProgram.length > 0 ? s.weeklyProgram : generateAdaptiveWeeklyProgram(s as any),
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
