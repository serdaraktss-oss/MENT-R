import { SubjectKazanimDetail, SubjectNetDetail, ExamBreakdown } from '../types';

// Predefined Subject Topics Bank
const SUBJECT_TOPICS_BANK: Record<string, string[]> = {
  'Türkçe': [
    'Paragrafta Ana Düşünce ve Yardımcı Düşünceler',
    'Paragrafta Yapı ve Anlam Bütünlüğü',
    'Cümlede Anlam ve Yorumlama',
    'Sözcükte Anlam ve Söz Öbekleri',
    'Dil Bilgisi: Cümle Ögeleri ve Yapısı',
    'Yazım Kuralları ve Noktalama İşaretleri',
    'Ses Bilgisi ve Kelime Türetimi',
  ],
  'Temel Matematik': [
    'Sayı Basamakları ve Bölünebilme Kuralları',
    'Rasyonel ve Ondalık Sayılar',
    'Mutlak Değer ve Köklü İfadeler',
    'Problemler (Oran-Orantı, Yaş, Yüzde-Kar)',
    'Veri Analizi ve İstatistik Grafikleri',
    'Mantık ve Küme Kavramları',
    'Geometri: Üçgende Açılar ve Kenar Bağıntıları',
  ],
  'AYT Matematik': [
    'Trigonometri I-II (Açı Dönüşümleri & Yarım Açı)',
    'Logaritma Kuralları ve Taban Değiştirme',
    'Aritmetik ve Geometrik Diziler',
    'Limit ve Süreklilik Kavramı',
    'Türev Alma Kuralları ve Teğet Eğimi',
    'İntegral Hesabı ve Eğri Altında Kalan Alan',
    'Polinomlar ve Bölme Algoritması',
    'İkinci Dereceden Denklemler ve Parabol',
  ],
  'AYT Fizik': [
    'Vektörler ve Bağıl Hareket',
    'Newton’ın Hareket Yasaları ve Sürtünme',
    'Tork, Denge ve Kütle Merkezi',
    'Elektriksel Potansiyel ve Manyetik Alan',
    'Optik: Kırılma ve Mercek Sistemleri',
    'Çembersel Hareket ve Açısal Momentum',
    'Basit Harmonik Hareket',
  ],
  'AYT Kimya': [
    'Modern Atom Teorisi ve Kuantum Sayıları',
    'Gazlar ve İdeal Gaz Yasası',
    'Sıvı Çözeltiler ve Koligatif Özellikler',
    'Kimyasal Tepkimelerde Hız ve Denge',
    'Kimyasal Bağlar ve Hibritleşme (VSEPR)',
    'Asit-Baz Titrasyonu ve pH Hesabı',
    'Organik Kimya: Fonksiyonel Gruplar',
  ],
  'AYT Biyoloji': [
    'Hücre Solunumu ve ATP Üretimi',
    'Fotosentez ve Kemosentez Reaksiyonları',
    'İnsan Fizyolojisi: Sinir ve Hormonal Sistem',
    'Dolaşım ve Bağışıklık Sistemi',
    'Genetik Şifre ve Protein Sentezi',
    'Bitki Biyolojisi ve İletim Demetleri',
  ],
  'Fen Bilimleri': [
    'Fizik: Madde ve Özkütle',
    'Fizik: Dalgalar ve Optik',
    'Kimya: Atom ve Periyodik Sistem',
    'Kimya: Maddenin Halleri',
    'Biyoloji: Canlıların Temel Bileşenleri',
    'Biyoloji: Hücre ve Bölünmeler',
  ],
  'Sosyal Bilimler': [
    'Tarih: İnkılap Tarihi ve Atatürkçülük',
    'Tarih: Türk-İslam Devletleri',
    'Coğrafya: Harita Bilgisi ve İklim Tipleri',
    'Coğrafya: Türkiye’nin Yer Şekilleri',
    'Felsefe: Bilgi ve Varlık Felsefesi',
    'Din Kültürü: İbadet, Ahlak ve İnanç',
  ],
};

/**
 * Generates structured Kazanım details for a given subject based on correct/wrong/blank counts.
 */
export function generateKazanimlarForSubject(
  subjectName: string,
  correct: number,
  wrong: number,
  blank: number
): SubjectKazanimDetail[] {
  const topics = SUBJECT_TOPICS_BANK[subjectName] || [
    `${subjectName} Temel Kavramlar`,
    `${subjectName} Soru Çözüm Yöntemleri`,
    `${subjectName} Analiz ve Uygulama`,
    `${subjectName} İleri Seviye Problemler`,
  ];

  let remainingWrong = wrong;
  let remainingBlank = blank;

  return topics.map((topic, index) => {
    let qCount = 2;
    if (index === 0 || index === 3) qCount = 3;

    let cCount = qCount;
    let wCount = 0;
    let bCount = 0;
    let status: 'mastered' | 'struggling' | 'blank' = 'mastered';
    let recommendation = 'Tüm sorular doğru çözüldü, hız korunsun.';

    if (remainingWrong > 0 && index % 2 === 1) {
      wCount = Math.min(qCount, remainingWrong);
      cCount = qCount - wCount;
      remainingWrong -= wCount;
      status = 'struggling';
      recommendation = `Bu kazanımdan ${wCount} yanlış yapıldı. Konu tekrarı ve 25 soru test çözümü önerilir.`;
    } else if (remainingBlank > 0 && index % 2 === 0 && index > 0) {
      bCount = Math.min(qCount, remainingBlank);
      cCount = qCount - bCount;
      remainingBlank -= bCount;
      status = 'blank';
      recommendation = `Bu kazanım boş bırakıldı. Süre veya kavram eksikliği gözden geçirilmeli.`;
    }

    return {
      topicName: topic,
      questionCount: qCount,
      correctCount: Math.max(0, cCount),
      wrongCount: wCount,
      blankCount: bCount,
      status,
      recommendation,
    };
  });
}

/**
 * Simulates OCR / File Parsing for Optical Sheet Document Uploads
 */
export function parseOpticalDocument(
  fileName: string,
  examType: 'TYT' | 'AYT' | 'HEPSİ'
): ExamBreakdown {
  const isTYT = examType === 'TYT';
  const isHepsi = examType === 'HEPSİ';
  const title = fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ") || '12. SINIF YKS 2 (GM)';

  const tytSubjects: SubjectNetDetail[] = [
    {
      subjectName: 'Türkçe TYT',
      questionCount: 40,
      correct: 35,
      wrong: 5,
      blank: 0,
      net: 33.75,
      accuracyRate: 88,
      kazanimlar: [
        { topicName: 'Cümlede Anlam İlişkileri', questionCount: 4, correctCount: 3, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Çeldiriciler dikkatli okunmalı, cümle anlamı tekrar edilmeli.' },
        { topicName: 'İyi Cümlenin Nitelikleri', questionCount: 4, correctCount: 3, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Cümle yapısı ve anlatım nitelikleri gözden geçirilmeli.' },
        { topicName: 'Paragraftan Ulaşılabilir / Değinilmiştir', questionCount: 20, correctCount: 18, wrongCount: 2, blankCount: 0, status: 'struggling', recommendation: 'Paragraf taktikleri ve ana düşünce soruları çalışılmalı.' },
        { topicName: 'Sözcükte Anlam ve Deyimler', questionCount: 12, correctCount: 11, wrongCount: 1, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'TYT Matematik',
      questionCount: 30,
      correct: 27,
      wrong: 2,
      blank: 1,
      net: 26.50,
      accuracyRate: 90,
      kazanimlar: [
        { topicName: 'Obeb ve Okek', questionCount: 4, correctCount: 2, wrongCount: 2, blankCount: 0, status: 'struggling', recommendation: 'EBOB-EKOK problemleri tekrar edilmeli.' },
        { topicName: 'Tamsayılarda İşlemler', questionCount: 8, correctCount: 7, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'İşlem hataları azaltılmalı ve temel kavramlar tekrar edilmeli.' },
        { topicName: 'Doğal Sayılarda Dört İşlem', questionCount: 10, correctCount: 10, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' },
        { topicName: 'Bölünebilme Kuralları', questionCount: 8, correctCount: 8, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'TYT Geometri',
      questionCount: 10,
      correct: 8,
      wrong: 1,
      blank: 1,
      net: 7.75,
      accuracyRate: 80,
      kazanimlar: [
        { topicName: 'Üçgende Eşlik ve Orta Taban', questionCount: 3, correctCount: 2, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Üçgende eşlik kuralları ve orta taban tekrar edilmeli.' },
        { topicName: 'Dik Üçgen', questionCount: 3, correctCount: 2, wrongCount: 0, blankCount: 1, status: 'blank', recommendation: 'Pisagor ve hipotenüs bağıntıları tekrar edilmeli.' },
        { topicName: 'Açılar ve Üçgende Açılar', questionCount: 4, correctCount: 4, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'TYT Fizik',
      questionCount: 7,
      correct: 6,
      wrong: 1,
      blank: 0,
      net: 5.75,
      accuracyRate: 86,
      kazanimlar: [
        { topicName: 'Fiziksel Niceliklerin Sınıflandırılması', questionCount: 3, correctCount: 2, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Vektörel-skaler büyüklükler ve türetilmiş birimler tekrar edilmeli.' },
        { topicName: 'Isı ve Sıcaklık', questionCount: 4, correctCount: 4, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'TYT Kimya',
      questionCount: 6,
      correct: 5,
      wrong: 1,
      blank: 0,
      net: 4.75,
      accuracyRate: 83,
      kazanimlar: [
        { topicName: 'Atom Modelleri - Atomun Yapısı', questionCount: 3, correctCount: 2, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Atom modelleri ve nötron-proton ilişkileri tekrar edilmeli.' },
        { topicName: 'Kimyasal Sembolik Dil', questionCount: 3, correctCount: 3, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'TYT Biyoloji',
      questionCount: 6,
      correct: 5,
      wrong: 1,
      blank: 0,
      net: 4.75,
      accuracyRate: 83,
      kazanimlar: [
        { topicName: 'Canlıların Yapısında Bulunan Temel Bileşikler', questionCount: 4, correctCount: 3, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Enzimler ve organik moleküller çalışılmalı.' },
        { topicName: 'Canlıların Ortak Özellikleri', questionCount: 2, correctCount: 2, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'TYT Tarih',
      questionCount: 5,
      correct: 3,
      wrong: 2,
      blank: 0,
      net: 2.50,
      accuracyRate: 60,
      kazanimlar: [
        { topicName: 'İnsanlığın Hafızası Tarih', questionCount: 2, correctCount: 1, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Tarih bilimi kavramları ve kaynak türleri tekrar edilmeli.' },
        { topicName: 'İlk Çağ\'da Yeryüzündeki Medeniyetler', questionCount: 2, correctCount: 1, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'İlk çağ medeniyetleri ve coğrafi özellikleri tekrar edilmeli.' },
        { topicName: 'Zaman ve Takvim', questionCount: 1, correctCount: 1, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'TYT Coğrafya',
      questionCount: 5,
      correct: 4,
      wrong: 1,
      blank: 0,
      net: 3.75,
      accuracyRate: 80,
      kazanimlar: [
        { topicName: 'Dünya\'nın Şekli ve Hareketleri', questionCount: 3, correctCount: 2, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Dünya\'nın eksen eğikliği ve sonuçları tekrar edilmeli.' },
        { topicName: 'Coğrafyanın Konusu ve Bölümleri', questionCount: 2, correctCount: 2, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'TYT Felsefe',
      questionCount: 5,
      correct: 5,
      wrong: 0,
      blank: 0,
      net: 5.00,
      accuracyRate: 100,
      kazanimlar: [
        { topicName: 'Felsefenin Alanı ve Soruları', questionCount: 5, correctCount: 5, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'TYT Din Kültürü',
      questionCount: 5,
      correct: 5,
      wrong: 0,
      blank: 0,
      net: 5.00,
      accuracyRate: 100,
      kazanimlar: [
        { topicName: 'İslam ve Bilim Kaynakları', questionCount: 5, correctCount: 5, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
  ];

  const aytSubjects: SubjectNetDetail[] = [
    {
      subjectName: 'AYT Matematik',
      questionCount: 30,
      correct: 27,
      wrong: 2,
      blank: 1,
      net: 26.50,
      accuracyRate: 90,
      kazanimlar: [
        { topicName: 'Fonksiyonlarda Öteleme ve Dönüşüm', questionCount: 5, correctCount: 4, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Öteleme kuralları ve fonksiyon grafikleri gözden geçirilmeli.' },
        { topicName: 'Parçalı ve Mutlak Değer Fonksiyonları', questionCount: 5, correctCount: 3, wrongCount: 1, blankCount: 1, status: 'struggling', recommendation: 'Mutlak değer grafikleri ve tanım kümesi tekrar edilmeli.' },
        { topicName: 'Bileşke Fonksiyonu', questionCount: 5, correctCount: 4, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Bileşke fonksiyon özellikleri tekrar edilmeli.' },
        { topicName: 'Faktöriyel ve Tam Sayılarda İşlemler', questionCount: 15, correctCount: 15, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'AYT Geometri',
      questionCount: 10,
      correct: 6,
      wrong: 0,
      blank: 4,
      net: 6.00,
      accuracyRate: 60,
      kazanimlar: [
        { topicName: 'Üçgende Eşlik ve Benzerlik', questionCount: 5, correctCount: 3, wrongCount: 0, blankCount: 2, status: 'blank', recommendation: '2 soru boş bırakıldı.' },
        { topicName: 'Dik Üçgen', questionCount: 5, correctCount: 3, wrongCount: 0, blankCount: 2, status: 'blank', recommendation: '2 soru boş bırakıldı.' }
      ],
    },
    {
      subjectName: 'AYT Fizik',
      questionCount: 14,
      correct: 9,
      wrong: 5,
      blank: 0,
      net: 7.75,
      accuracyRate: 64,
      kazanimlar: [
        { topicName: 'Vektör-Kuvvet (Doğadaki Temel Kuvvetler)', questionCount: 4, correctCount: 3, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Vektör bileşenleri ve bileşke kuvvet tekrar edilmeli.' },
        { topicName: 'Maddenin Halleri ve Gaz Basıncı', questionCount: 4, correctCount: 2, wrongCount: 2, blankCount: 0, status: 'struggling', recommendation: 'Basınç denklemleri ve gaz yasaları tekrar edilmeli.' },
        { topicName: 'Arşimet Yasası', questionCount: 3, correctCount: 2, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Kaldırma kuvveti ve denge prensipleri gözden geçirilmeli.' },
        { topicName: 'Genleşme', questionCount: 3, correctCount: 2, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Termal genleşme katsayıları tekrar edilmeli.' }
      ],
    },
    {
      subjectName: 'AYT Kimya',
      questionCount: 13,
      correct: 12,
      wrong: 1,
      blank: 0,
      net: 11.75,
      accuracyRate: 92,
      kazanimlar: [
        { topicName: 'Periyodik Sistem ve Elektron Dizilimi', questionCount: 7, correctCount: 6, wrongCount: 1, blankCount: 0, status: 'struggling', recommendation: 'Elektron dizilimi ve kuantum sayıları tekrar edilmeli.' },
        { topicName: 'Atomun Kuantum Modeli', questionCount: 6, correctCount: 6, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'AYT Biyoloji',
      questionCount: 13,
      correct: 9,
      wrong: 4,
      blank: 0,
      net: 8.00,
      accuracyRate: 69,
      kazanimlar: [
        { topicName: 'Canlıların Yapısında Bulunan Temel Bileşikler', questionCount: 7, correctCount: 3, wrongCount: 4, blankCount: 0, status: 'struggling', recommendation: 'Enzim ve protein yapıları tekrar çalışılmalı.' },
        { topicName: 'Biyoloji ve Canlıların Ortak Özellikleri', questionCount: 6, correctCount: 6, wrongCount: 0, blankCount: 0, status: 'mastered', recommendation: 'Tam başarı sağlandı.' }
      ],
    },
    {
      subjectName: 'AYT Tarih',
      questionCount: 10,
      correct: 0,
      wrong: 0,
      blank: 10,
      net: 0.00,
      accuracyRate: 0,
      kazanimlar: [
        { topicName: 'İnsanlığın Hafızası Tarih', questionCount: 5, correctCount: 0, wrongCount: 0, blankCount: 5, status: 'blank', recommendation: 'Öğrenci AYT Tarih bölümünden soru işaretlememiştir.' },
        { topicName: 'İlk Çağ\'da Yeryüzündeki Medeniyetler', questionCount: 5, correctCount: 0, wrongCount: 0, blankCount: 5, status: 'blank', recommendation: 'Öğrenci AYT Tarih bölümünden soru işaretlememiştir.' }
      ],
    },
    {
      subjectName: 'AYT Coğrafya',
      questionCount: 6,
      correct: 0,
      wrong: 0,
      blank: 6,
      net: 0.00,
      accuracyRate: 0,
      kazanimlar: [
        { topicName: 'Dünya\'nın Şekli ve Hareketleri', questionCount: 3, correctCount: 0, wrongCount: 0, blankCount: 3, status: 'blank', recommendation: 'Öğrenci AYT Coğrafya bölümünden soru işaretlememiştir.' },
        { topicName: 'Coğrafyanın Konusu ve Bölümleri', questionCount: 3, correctCount: 0, wrongCount: 0, blankCount: 3, status: 'blank', recommendation: 'Öğrenci AYT Coğrafya bölümünden soru işaretlememiştir.' }
      ],
    },
  ];

  if (isHepsi) {
    const subjects = [...tytSubjects, ...aytSubjects];
    const totalNet = Number(subjects.reduce((sum, s) => sum + s.net, 0).toFixed(2));
    return {
      examName: title.includes('YKS') ? title : `${title} (TYT + AYT Birleşik)`,
      examDate: '19.09.2025',
      totalNet,
      rankInSchool: 1,
      subjects,
    };
  } else if (isTYT) {
    const totalNet = Number((33.75 + 26.50 + 7.75 + 5.75 + 4.75 + 4.75 + 2.50 + 3.75).toFixed(2));
    return {
      examName: title.includes('TYT') ? title : `${title} (TYT)`,
      examDate: '19.09.2025',
      totalNet,
      rankInSchool: 1,
      subjects: tytSubjects,
    };
  } else {
    const totalNet = Number((26.50 + 6.00 + 7.75 + 11.75 + 8.00).toFixed(2));
    return {
      examName: title.includes('AYT') ? title : `${title} (AYT)`,
      examDate: '19.09.2025',
      totalNet,
      rankInSchool: 1,
      subjects: aytSubjects,
    };
  }
}
