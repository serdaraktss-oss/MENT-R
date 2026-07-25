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
  examType: 'TYT' | 'AYT'
): ExamBreakdown {
  const isTYT = examType === 'TYT';
  const title = fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ");

  if (isTYT) {
    const subjects: SubjectNetDetail[] = [
      {
        subjectName: 'Türkçe',
        questionCount: 40,
        correct: 33,
        wrong: 5,
        blank: 2,
        net: 31.75,
        accuracyRate: 82,
        kazanimlar: generateKazanimlarForSubject('Türkçe', 33, 5, 2),
      },
      {
        subjectName: 'Temel Matematik',
        questionCount: 40,
        correct: 31,
        wrong: 4,
        blank: 5,
        net: 30.0,
        accuracyRate: 78,
        kazanimlar: generateKazanimlarForSubject('Temel Matematik', 31, 4, 5),
      },
      {
        subjectName: 'Fen Bilimleri',
        questionCount: 20,
        correct: 16,
        wrong: 3,
        blank: 1,
        net: 15.25,
        accuracyRate: 80,
        kazanimlar: generateKazanimlarForSubject('Fen Bilimleri', 16, 3, 1),
      },
      {
        subjectName: 'Sosyal Bilimler',
        questionCount: 20,
        correct: 12,
        wrong: 5,
        blank: 3,
        net: 10.75,
        accuracyRate: 60,
        kazanimlar: generateKazanimlarForSubject('Sosyal Bilimler', 12, 5, 3),
      },
    ];

    const totalNet = Number((31.75 + 30.0 + 15.25 + 10.75).toFixed(2));

    return {
      examName: title || 'Belgeden Aktarılan Optik TYT Denemesi',
      examDate: 'Ağustos 2026',
      totalNet,
      rankInSchool: 2,
      subjects,
    };
  } else {
    const subjects: SubjectNetDetail[] = [
      {
        subjectName: 'AYT Matematik',
        questionCount: 40,
        correct: 30,
        wrong: 5,
        blank: 5,
        net: 28.75,
        accuracyRate: 75,
        kazanimlar: generateKazanimlarForSubject('AYT Matematik', 30, 5, 5),
      },
      {
        subjectName: 'AYT Fizik',
        questionCount: 14,
        correct: 11,
        wrong: 2,
        blank: 1,
        net: 10.5,
        accuracyRate: 78,
        kazanimlar: generateKazanimlarForSubject('AYT Fizik', 11, 2, 1),
      },
      {
        subjectName: 'AYT Kimya',
        questionCount: 13,
        correct: 10,
        wrong: 2,
        blank: 1,
        net: 9.5,
        accuracyRate: 77,
        kazanimlar: generateKazanimlarForSubject('AYT Kimya', 10, 2, 1),
      },
      {
        subjectName: 'AYT Biyoloji',
        questionCount: 13,
        correct: 11,
        wrong: 1,
        blank: 1,
        net: 10.75,
        accuracyRate: 84,
        kazanimlar: generateKazanimlarForSubject('AYT Biyoloji', 11, 1, 1),
      },
    ];

    const totalNet = Number((28.75 + 10.5 + 9.5 + 10.75).toFixed(2));

    return {
      examName: title || 'Belgeden Aktarılan Optik AYT Denemesi',
      examDate: 'Ağustos 2026',
      totalNet,
      rankInSchool: 3,
      subjects,
    };
  }
}
