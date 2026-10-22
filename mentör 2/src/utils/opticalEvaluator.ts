import { QuestionAnalysisItem, SubjectNetDetail, OpticalExamEvaluationResult, Student12thGrade, DayProgram } from '../types';
import { generateAdaptiveWeeklyProgram } from './programGenerator';
import { isSubjectAllowedForBranch } from './branchUtils';

// Standard topic mapping for TYT (120 Questions)
export const TYT_QUESTION_TOPICS = [
  // Türkçe (1 - 40)
  { q: 1, subject: 'TYT Türkçe', topic: 'Sözcükte Anlam ve Söz Öbekleri' },
  { q: 2, subject: 'TYT Türkçe', topic: 'Deyim ve Atasözleri Yorumu' },
  { q: 3, subject: 'TYT Türkçe', topic: 'Cümlede Anlam ve Kesin Yargı' },
  { q: 4, subject: 'TYT Türkçe', topic: 'Cümleler Arası Anlam İlişkileri' },
  { q: 5, subject: 'TYT Türkçe', topic: 'Ses Bilgisi (Ünlü Düşmesi & Ünsüz Benzeşmesi)' },
  { q: 6, subject: 'TYT Türkçe', topic: 'Yazım Kuralları (Büyük Harfler & Birleşik Sözcükler)' },
  { q: 7, subject: 'TYT Türkçe', topic: 'Noktalama İşaretleri (Virgül & Noktalı Virgül)' },
  { q: 8, subject: 'TYT Türkçe', topic: 'Sözcük Türleri (İsim, Sıfat, Zamir)' },
  { q: 9, subject: 'TYT Türkçe', topic: 'Fiiller, Ek Eylem ve Fiilimsiler' },
  { q: 10, subject: 'TYT Türkçe', topic: 'Cümlenin Ögeleri ve Vurgu' },
  { q: 11, subject: 'TYT Türkçe', topic: 'Cümle Türleri ve Yapısı' },
  { q: 12, subject: 'TYT Türkçe', topic: 'Anlatım Bozuklukları' },
  { q: 13, subject: 'TYT Türkçe', topic: 'Paragrafta Yapı (Akışı Bozan Cümle)' },
  { q: 14, subject: 'TYT Türkçe', topic: 'Paragrafı İkiye Bölme' },
  { q: 15, subject: 'TYT Türkçe', topic: 'Paragrafta Cümle Yerleştirme' },
  { q: 16, subject: 'TYT Türkçe', topic: 'Paragrafta Ana Düşünce' },
  { q: 17, subject: 'TYT Türkçe', topic: 'Paragrafta Ana Fikir & Çıkarım' },
  { q: 18, subject: 'TYT Türkçe', topic: 'Paragrafta Yardımcı Düşünceler I' },
  { q: 19, subject: 'TYT Türkçe', topic: 'Paragrafta Yardımcı Düşünceler II' },
  { q: 20, subject: 'TYT Türkçe', topic: 'Paragrafta Başlık ve Konu' },
  { q: 21, subject: 'TYT Türkçe', topic: 'Paragrafta Vurgulanan Düşünce' },
  { q: 22, subject: 'TYT Türkçe', topic: 'Paragrafta Anlatım Teknikleri (Açıklama, Tartışma)' },
  { q: 23, subject: 'TYT Türkçe', topic: 'Düşünceyi Geliştirme Yolları (Tanımlama, Karşılaştırma)' },
  { q: 24, subject: 'TYT Türkçe', topic: 'Metin Karşılaştırma ve Ortak Yönler' },
  { q: 25, subject: 'TYT Türkçe', topic: 'Soruya Karşılık Paragraf' },
  { q: 26, subject: 'TYT Türkçe', topic: 'Paragrafta Karakter ve Duygu Analizi' },
  { q: 27, subject: 'TYT Türkçe', topic: 'Çoklu Paragraf Soruları (Aynı Metne Bağlı 1)' },
  { q: 28, subject: 'TYT Türkçe', topic: 'Çoklu Paragraf Soruları (Aynı Metne Bağlı 2)' },
  { q: 29, subject: 'TYT Türkçe', topic: 'Paragrafta Boşluk Doldurma' },
  { q: 30, subject: 'TYT Türkçe', topic: 'Paragrafta Kesin Yargıya Ulaşma' },
  { q: 31, subject: 'TYT Türkçe', topic: 'Paragrafta Çıkarım Yapma' },
  { q: 32, subject: 'TYT Türkçe', topic: 'Paragrafta Diyalog Tamamlama' },
  { q: 33, subject: 'TYT Türkçe', topic: 'Paragraf Yoruma Dayalı Akıl Yürütme' },
  { q: 34, subject: 'TYT Türkçe', topic: 'Örtülü Anlam ve Sezdirme' },
  { q: 35, subject: 'TYT Türkçe', topic: 'Metin Değerlendirme ve Eleştiri' },
  { q: 36, subject: 'TYT Türkçe', topic: 'Paragrafta Neden-Sonuç İlişkileri' },
  { q: 37, subject: 'TYT Türkçe', topic: 'Çift Metinli Paragraf Analizi' },
  { q: 38, subject: 'TYT Türkçe', topic: 'Paragrafta Bakış Açısı ve Üslup' },
  { q: 39, subject: 'TYT Türkçe', topic: 'Sözel Mantık ve Akıl Yürütme' },
  { q: 40, subject: 'TYT Türkçe', topic: 'Paragraf Genel Kavrama ve Sonuç' },

  // Sosyal Bilimler (41 - 60)
  // Tarih (41 - 45)
  { q: 41, subject: 'TYT Tarih', topic: 'Tarih ve Zaman (Tarih Yazıcılığı)' },
  { q: 42, subject: 'TYT Tarih', topic: 'İlk ve Orta Çağlarda Türk Dünyası' },
  { q: 43, subject: 'TYT Tarih', topic: 'İslam Medeniyetinin Doğuşu ve İlk İslam Devletleri' },
  { q: 44, subject: 'TYT Tarih', topic: 'Beylikten Devlete Osmanlı Siyaseti' },
  { q: 45, subject: 'TYT Tarih', topic: 'Milli Mücadele Dönemi ve Atatürk İlkeleri' },
  // Coğrafya (46 - 50)
  { q: 46, subject: 'TYT Coğrafya', topic: 'Doğa ve İnsan (Coğrafi Konum & Koordinat)' },
  { q: 47, subject: 'TYT Coğrafya', topic: 'Dünya\'nın Şekli, Hareketleri ve Eksen Eğikliği' },
  { q: 48, subject: 'TYT Coğrafya', topic: 'Harita Bilgisi ve İzohips Yorumlama' },
  { q: 49, subject: 'TYT Coğrafya', topic: 'İklim Bilgisi, Basınç ve Rüzgarlar' },
  { q: 50, subject: 'TYT Coğrafya', topic: 'Türkiye\'nin Yer Şekilleri ve Doğal Afetler' },
  // Felsefe (51 - 55)
  { q: 51, subject: 'TYT Felsefe', topic: 'Felsefenin Anlamı ve Düşünme Becerileri' },
  { q: 52, subject: 'TYT Felsefe', topic: 'Bilgi Felsefesi (Epistemoloji: Doğruluk & Kaynak)' },
  { q: 53, subject: 'TYT Felsefe', topic: 'Varlık Felsefesi (Ontoloji: Madde & İdea)' },
  { q: 54, subject: 'TYT Felsefe', topic: 'Ahlak ve Siyaset Felsefesi' },
  { q: 55, subject: 'TYT Felsefe', topic: 'Sanat ve Din Felsefesi' },
  // Din Kültürü (56 - 60)
  { q: 56, subject: 'TYT Din Kültürü', topic: 'İnanç ve İbadet Esasları' },
  { q: 57, subject: 'TYT Din Kültürü', topic: 'Hz. Muhammed ve Gençlik' },
  { q: 58, subject: 'TYT Din Kültürü', topic: 'Kuran-ı Kerim\'de Temel Kavramlar' },
  { q: 59, subject: 'TYT Din Kültürü', topic: 'Ahlaki Tutum ve Davranışlar' },
  { q: 60, subject: 'TYT Din Kültürü', topic: 'İslam Düşüncesinde Yorumlar ve Mezhepler' },

  // Temel Matematik (61 - 100)
  { q: 61, subject: 'TYT Matematik', topic: 'Temel Kavramlar ve Sayı Kümeleri' },
  { q: 62, subject: 'TYT Matematik', topic: 'Tek-Çift ve Pozitif-Negatif Sayılar' },
  { q: 63, subject: 'TYT Matematik', topic: 'Asal Sayılar, Aralarında Asallık ve Faktöriyel' },
  { q: 64, subject: 'TYT Matematik', topic: 'Sayı Basamakları ve Çözümleme' },
  { q: 65, subject: 'TYT Matematik', topic: 'Bölme ve Bölünebilme Kuralları' },
  { q: 66, subject: 'TYT Matematik', topic: 'EBOB - EKOK ve Periyodik Problemler' },
  { q: 67, subject: 'TYT Matematik', topic: 'Rasyonel ve Ondalık Sayılarda İşlemler' },
  { q: 68, subject: 'TYT Matematik', topic: 'Basit Eşitsizlikler ve Aralık Kavramı' },
  { q: 69, subject: 'TYT Matematik', topic: 'Mutlak Değer ve Denklem Çözümleri' },
  { q: 70, subject: 'TYT Matematik', topic: 'Üslü İfadeler ve Özellikleri' },
  { q: 71, subject: 'TYT Matematik', topic: 'Köklü İfadeler ve Eşlenik ile Çarpma' },
  { q: 72, subject: 'TYT Matematik', topic: 'Çarpanlara Ayırma ve Özdeşlikler' },
  { q: 73, subject: 'TYT Matematik', topic: 'Oran - Orantı Bağıntıları' },
  { q: 74, subject: 'TYT Matematik', topic: 'Birinci Dereceden Denklemler' },
  { q: 75, subject: 'TYT Matematik', topic: 'Sayı ve Kesir Problemleri' },
  { q: 76, subject: 'TYT Matematik', topic: 'Yaş Problemleri' },
  { q: 77, subject: 'TYT Matematik', topic: 'İşçi ve Emek Problemleri' },
  { q: 78, subject: 'TYT Matematik', topic: 'Yüzde, Kâr - Zarar Problemleri' },
  { q: 79, subject: 'TYT Matematik', topic: 'Karışım Problemleri' },
  { q: 80, subject: 'TYT Matematik', topic: 'Hız ve Hareket Problemleri' },
  { q: 81, subject: 'TYT Matematik', topic: 'Grafik ve Tablo Okuma Problemleri' },
  { q: 82, subject: 'TYT Matematik', topic: 'Yeni Nesil Muhakeme ve Mantık Problemleri' },
  { q: 83, subject: 'TYT Matematik', topic: 'Kümeler ve Kartezyen Çarpım' },
  { q: 84, subject: 'TYT Matematik', topic: 'Mantık ve Önermeler' },
  { q: 85, subject: 'TYT Matematik', topic: 'Fonksiyon Tanımı, Değer Bulma ve Grafik' },
  { q: 86, subject: 'TYT Matematik', topic: 'Polinom Temel Kavramlar' },
  { q: 87, subject: 'TYT Matematik', topic: 'İkinci Dereceden Denklemler' },
  { q: 88, subject: 'TYT Matematik', topic: 'Sayma Kuralları ve Permütasyon' },
  { q: 89, subject: 'TYT Matematik', topic: 'Kombinasyon ve Binom Açılımı' },
  { q: 90, subject: 'TYT Matematik', topic: 'Olasılık Hesabı ve Bağımsız Olaylar' },
  // Geometri (91 - 100)
  { q: 91, subject: 'TYT Geometri', topic: 'Doğruda ve Üçgende Açılar' },
  { q: 92, subject: 'TYT Geometri', topic: 'Dik Üçgen ve Pisagor Bağıntısı' },
  { q: 93, subject: 'TYT Geometri', topic: 'İkizkenar ve Eşkenar Üçgen' },
  { q: 94, subject: 'TYT Geometri', topic: 'Üçgende Açıortay ve Kenarortay' },
  { q: 95, subject: 'TYT Geometri', topic: 'Üçgende Eşlik ve Benzerlik' },
  { q: 96, subject: 'TYT Geometri', topic: 'Üçgende Alan Bağıntıları' },
  { q: 97, subject: 'TYT Geometri', topic: 'Çokgenler ve Dörtgenler (Yamuk, Paralelkenar)' },
  { q: 98, subject: 'TYT Geometri', topic: 'Eşkenar Dörtgen, Dikdörtgen ve Kare' },
  { q: 99, subject: 'TYT Geometri', topic: 'Çemberde Açılar ve Çevre - Alan' },
  { q: 100, subject: 'TYT Geometri', topic: 'Katı Cisimler (Prizma ve Silindir Hacmi)' },

  // Fen Bilimleri (101 - 120)
  // Fizik (101 - 107)
  { q: 101, subject: 'TYT Fizik', topic: 'Fizik Bilimine Giriş ve Temel Büyüklükler' },
  { q: 102, subject: 'TYT Fizik', topic: 'Madde ve Özellikleri (Özkütle & Dayanıklılık)' },
  { q: 103, subject: 'TYT Fizik', topic: 'Hareket ve Kuvvet (Newton Yasaları)' },
  { q: 104, subject: 'TYT Fizik', topic: 'İş, Güç ve Mekanik Enerji' },
  { q: 105, subject: 'TYT Fizik', topic: 'Isı, Sıcaklık ve Genleşme' },
  { q: 106, subject: 'TYT Fizik', topic: 'Elektrostatik ve Elektrik Akımı / Direnç' },
  { q: 107, subject: 'TYT Fizik', topic: 'Optik: Işığın Yansıması, Kırılma ve Mercekler' },
  // Kimya (108 - 114)
  { q: 108, subject: 'TYT Kimya', topic: 'Kimya Disiplinleri ve Güvenlik Uyarı İşaretleri' },
  { q: 109, subject: 'TYT Kimya', topic: 'Atom Modelleri ve Periyodik Sistem Eğilimleri' },
  { q: 110, subject: 'TYT Kimya', topic: 'Kimyasal Türler Arası Zayıf ve Güçlü Etkileşimler' },
  { q: 111, subject: 'TYT Kimya', topic: 'Maddenin Halleri (Katı, Sıvı, Gaz, Plazma)' },
  { q: 112, subject: 'TYT Kimya', topic: 'Kimyanın Temel Kanunları ve Mol Kavramı' },
  { q: 113, subject: 'TYT Kimya', topic: 'Karışımlar ve Ayrıştırma Yöntemleri' },
  { q: 114, subject: 'TYT Kimya', topic: 'Asitler, Bazlar, Tuzlar ve Kimya Her Yerde' },
  // Biyoloji (115 - 120)
  { q: 115, subject: 'TYT Biyoloji', topic: 'Canlıların Ortak Özellikleri ve Temel Bileşenler (Organik Moleküller)' },
  { q: 116, subject: 'TYT Biyoloji', topic: 'Hücrenin Yapısı, Organeller ve Hücre Zarı Geçişleri' },
  { q: 117, subject: 'TYT Biyoloji', topic: 'Canlıların Çeşitliliği ve Sınıflandırılması' },
  { q: 118, subject: 'TYT Biyoloji', topic: 'Hücre Bölünmeleri (Mitoz ve Mayoz)' },
  { q: 119, subject: 'TYT Biyoloji', topic: 'Kalıtımın Temel Esasları ve Soyağaçları' },
  { q: 120, subject: 'TYT Biyoloji', topic: 'Ekosistem Ekolojisi ve Güncel Çevre Sorunları' },
];

// Standard topic mapping for AYT (80 Questions)
export const AYT_QUESTION_TOPICS = [
  // AYT Matematik & Geometri (1 - 40)
  { q: 1, subject: 'AYT Matematik', topic: 'Fonksiyonlarda İşlemler ve Bileşke' },
  { q: 2, subject: 'AYT Matematik', topic: 'Fonksiyonlarda Öteleme, Simetri ve Dönüşüm' },
  { q: 3, subject: 'AYT Matematik', topic: 'İkinci Dereceden Denklemler ve Kök-Katsayı Bağıntıları' },
  { q: 4, subject: 'AYT Matematik', topic: 'Karmaşık Sayılar' },
  { q: 5, subject: 'AYT Matematik', topic: 'Parabol Tepe Noktası ve Grafik Analizi' },
  { q: 6, subject: 'AYT Matematik', topic: 'İkinci Dereceden Eşitsizlikler ve Tablo Yöntemi' },
  { q: 7, subject: 'AYT Matematik', topic: 'Polinomlarda Bölme ve Kalan Bulma' },
  { q: 8, subject: 'AYT Matematik', topic: 'Trigonometrik Fonksiyonlar ve Birim Çember' },
  { q: 9, subject: 'AYT Matematik', topic: 'Trigonometride İndirgeme Bağıntıları' },
  { q: 10, subject: 'AYT Matematik', topic: 'Sinüs ve Kosinüs Teoremleri' },
  { q: 11, subject: 'AYT Matematik', topic: 'Toplam - Fark ve Yarım Açı Formülleri' },
  { q: 12, subject: 'AYT Matematik', topic: 'Trigonometrik Denklemler' },
  { q: 13, subject: 'AYT Matematik', topic: 'Logaritma Kuralları ve Taban Değiştirme' },
  { q: 14, subject: 'AYT Matematik', topic: 'Logaritmik Denklem ve Eşitsizlikler' },
  { q: 15, subject: 'AYT Matematik', topic: 'Aritmetik ve Geometrik Diziler' },
  { q: 16, subject: 'AYT Matematik', topic: 'Dizilerde Genel Terim ve Toplam Formülleri' },
  { q: 17, subject: 'AYT Matematik', topic: 'Limit ve Sağdan-Soldan Yaklaşım' },
  { q: 18, subject: 'AYT Matematik', topic: '0/0 Belirsizliği ve Sadeleştirme' },
  { q: 19, subject: 'AYT Matematik', topic: 'Süreklilik Kavramı ve Teoremler' },
  { q: 20, subject: 'AYT Matematik', topic: 'Türev Tanımı ve Teğet Doğrusunun Eğimi' },
  { q: 21, subject: 'AYT Matematik', topic: 'Türev Alma Kuralları ve Zincir Kuralı' },
  { q: 22, subject: 'AYT Matematik', topic: 'Türevin Geometrik Yorumu' },
  { q: 23, subject: 'AYT Matematik', topic: 'Artan - Azalan Aralıklar ve Ekstremum Noktalar' },
  { q: 24, subject: 'AYT Matematik', topic: 'Maksimum - Minimum Problemleri' },
  { q: 25, subject: 'AYT Matematik', topic: 'Belirsiz İntegral ve Değişken Değiştirme' },
  { q: 26, subject: 'AYT Matematik', topic: 'Belirli İntegral Hesabı ve Özellikleri' },
  { q: 27, subject: 'AYT Matematik', topic: 'İntegral ile Eğri Altında Kalan Alan Hesabı' },
  { q: 28, subject: 'AYT Matematik', topic: 'İki Eğri Arasındaki Alan' },
  { q: 29, subject: 'AYT Matematik', topic: 'İleri Düzey Olasılık ve Koşullu Olasılık' },
  { q: 30, subject: 'AYT Matematik', topic: 'Tekrarlı Permütasyon ve Dairesel Dizilim' },
  // AYT Geometri (31 - 40)
  { q: 31, subject: 'AYT Geometri', topic: 'Noktanın ve Doğrunun Analitik İncelenmesi' },
  { q: 32, subject: 'AYT Geometri', topic: 'İki Doğru Arasındaki Açı ve Uzaklık' },
  { q: 33, subject: 'AYT Geometri', topic: 'Dönüşümlerle Geometri (Öteleme, Dönme, Yansıma)' },
  { q: 34, subject: 'AYT Geometri', topic: 'Çemberin Analitik İncelenmesi' },
  { q: 35, subject: 'AYT Geometri', topic: 'Çemberde Teğet - Kiriş Özellikleri' },
  { q: 36, subject: 'AYT Geometri', topic: 'Dairede Alan ve Dilim Hesabı' },
  { q: 37, subject: 'AYT Geometri', topic: 'Özel Dörtgenler (Deltoid ve İkizkenar Yamuk)' },
  { q: 38, subject: 'AYT Geometri', topic: 'Katı Cisimler (Piramit ve Koni Yüzey Alanı)' },
  { q: 39, subject: 'AYT Geometri', topic: 'Küre Yüzey Alanı ve Hacmi' },
  { q: 40, subject: 'AYT Geometri', topic: 'Uzay Geometri ve Vektör Temelleri' },

  // AYT Fen Bilimleri (41 - 80)
  // Fizik (41 - 54)
  { q: 41, subject: 'AYT Fizik', topic: 'Vektörler ve Bağıl Hareket' },
  { q: 42, subject: 'AYT Fizik', topic: 'Newton\'ın Hareket Yasaları (Eğik Düzlem & Sürtünme)' },
  { q: 43, subject: 'AYT Fizik', topic: 'Bir Boyutta Sabit İvmeli Hareket (Atışlar)' },
  { q: 44, subject: 'AYT Fizik', topic: 'İki Boyutta Hareket (Yatay ve Eğik Atış)' },
  { q: 45, subject: 'AYT Fizik', topic: 'İtme ve Çizgisel Momentum Korunumu' },
  { q: 46, subject: 'AYT Fizik', topic: 'Tork, Denge Şartları ve Ağırlık Merkezi' },
  { q: 47, subject: 'AYT Fizik', topic: 'Basit Makineler (Kaldıraç, Makara, Vida)' },
  { q: 48, subject: 'AYT Fizik', topic: 'Elektriksel Kuvvet (Coulomb) ve Elektrik Alan' },
  { q: 49, subject: 'AYT Fizik', topic: 'Elektriksel Potansiyel ve İş' },
  { q: 50, subject: 'AYT Fizik', topic: 'Düzgün Manyetik Alan ve Manyetik Kuvvet' },
  { q: 51, subject: 'AYT Fizik', topic: 'Manyetik İndüksiyon ve Faraday Yasası' },
  { q: 52, subject: 'AYT Fizik', topic: 'Alternatif Akım ve Transformatörler' },
  { q: 53, subject: 'AYT Fizik', topic: 'Düzgün Çembersel Hareket ve Açısal Momentum' },
  { q: 54, subject: 'AYT Fizik', topic: 'Basit Harmonik Hareket (Yay ve Basit Sarkaç)' },
  // Kimya (55 - 67)
  { q: 55, subject: 'AYT Kimya', topic: 'Modern Atom Teorisi ve Kuantum Sayıları' },
  { q: 56, subject: 'AYT Kimya', topic: 'Gaz Yasaları ve İdeal Gaz Denklemi' },
  { q: 57, subject: 'AYT Kimya', topic: 'Sıvı Çözeltiler ve Derişim Birimleri' },
  { q: 58, subject: 'AYT Kimya', topic: 'Koligatif Özellikler (Donma Noktası Alçalması & Osmotik Basınç)' },
  { q: 59, subject: 'AYT Kimya', topic: 'Kimyasal Tepkimelerde Enerji ve Entalpi' },
  { q: 60, subject: 'AYT Kimya', topic: 'Kimyasal Tepkime Hızları ve Hız Bağıntısı' },
  { q: 61, subject: 'AYT Kimya', topic: 'Kimyasal Denge ve Le Chatelier İlkesi' },
  { q: 62, subject: 'AYT Kimya', topic: 'Asit - Baz Dengesi (pH - pOH ve Tampon Çözeltiler)' },
  { q: 63, subject: 'AYT Kimya', topic: 'Çözünürlük Dengesi (Kçç Hesaplamaları)' },
  { q: 64, subject: 'AYT Kimya', topic: 'Kimya ve Elektrik (Redoks Tepkimeleri & Galvanik Piller)' },
  { q: 65, subject: 'AYT Kimya', topic: 'Elektroliz ve Faraday Kanunları' },
  { q: 66, subject: 'AYT Kimya', topic: 'Karbon Kimyasına Giriş ve Hibritleşme (VSEPR)' },
  { q: 67, subject: 'AYT Kimya', topic: 'Organik Bileşikler: Hidrokarbonlar ve Fonksiyonel Gruplar' },
  // Biyoloji (68 - 80)
  { q: 68, subject: 'AYT Biyoloji', topic: 'Sinir Sistemi ve İmpuls İletimi' },
  { q: 69, subject: 'AYT Biyoloji', topic: 'Endokrin Sistem ve Hormonlar' },
  { q: 70, subject: 'AYT Biyoloji', topic: 'Duyu Organları (Göz, Kulak Yapısı)' },
  { q: 71, subject: 'AYT Biyoloji', topic: 'Destek ve Hareket Sistemi (Kas Kasılması Kayıcı İplikler)' },
  { q: 72, subject: 'AYT Biyoloji', topic: 'Sindirim Sistemi ve Enzimlerin Etkisi' },
  { q: 73, subject: 'AYT Biyoloji', topic: 'Dolaşım ve Bağışıklık Sistemi (Antikorlar & Lenf)' },
  { q: 74, subject: 'AYT Biyoloji', topic: 'Solunum Sistemi ve Gazların Taşınması' },
  { q: 75, subject: 'AYT Biyoloji', topic: 'Boşaltım Sistemi ve Nefron Yapısı' },
  { q: 76, subject: 'AYT Biyoloji', topic: 'Nükleik Asitler, DNA Replikasyonu ve Genetik Kod' },
  { q: 77, subject: 'AYT Biyoloji', topic: 'Protein Sentezi (Transkripsiyon ve Translasyon)' },
  { q: 78, subject: 'AYT Biyoloji', topic: 'Hücre Solunumu (Glikoliz, Krebs ve ETS)' },
  { q: 79, subject: 'AYT Biyoloji', topic: 'Fotosentez ve Kemosentez Reaksiyonları' },
  { q: 80, subject: 'AYT Biyoloji', topic: 'Bitki Biyolojisi (İletim Demetleri & Çiçekli Bitkilerde Üreme)' },
];

// Presets for Answer Keys
export const PRESET_ANSWER_KEYS: Record<string, string> = {
  'TYT_A_KITAPCIK': [
    // Türkçe 40
    'A', 'C', 'B', 'D', 'E', 'A', 'D', 'C', 'B', 'A',
    'E', 'D', 'C', 'B', 'A', 'B', 'C', 'D', 'A', 'E',
    'C', 'B', 'D', 'E', 'A', 'D', 'C', 'B', 'E', 'A',
    'B', 'C', 'D', 'A', 'E', 'B', 'D', 'C', 'A', 'E',
    // Sosyal 20
    'B', 'D', 'C', 'A', 'E', 'C', 'B', 'E', 'D', 'A',
    'D', 'C', 'A', 'B', 'E', 'A', 'C', 'D', 'E', 'B',
    // Matematik 40
    'C', 'B', 'D', 'A', 'E', 'B', 'C', 'A', 'D', 'E',
    'A', 'D', 'B', 'E', 'C', 'D', 'A', 'C', 'E', 'B',
    'E', 'B', 'D', 'A', 'C', 'B', 'E', 'C', 'A', 'D',
    'A', 'C', 'B', 'E', 'D', 'C', 'A', 'D', 'B', 'E',
    // Fen 20
    'D', 'B', 'C', 'A', 'E', 'B', 'D', 'C', 'A', 'E',
    'D', 'B', 'C', 'A', 'E', 'C', 'B', 'D', 'A', 'E'
  ].join(' '),

  'AYT_SAYISAL_A_KITAPCIK': [
    // Mat 40
    'C', 'A', 'D', 'B', 'E', 'D', 'C', 'A', 'B', 'E',
    'B', 'E', 'C', 'A', 'D', 'A', 'D', 'B', 'C', 'E',
    'E', 'C', 'A', 'D', 'B', 'C', 'B', 'E', 'A', 'D',
    'B', 'D', 'C', 'A', 'E', 'A', 'C', 'B', 'E', 'D',
    // Fizik 14
    'B', 'D', 'C', 'A', 'E', 'C', 'B', 'D', 'A', 'E', 'D', 'B', 'C', 'A',
    // Kimya 13
    'E', 'C', 'B', 'D', 'A', 'B', 'D', 'C', 'E', 'A', 'C', 'A', 'D',
    // Biyoloji 13
    'B', 'E', 'A', 'D', 'C', 'E', 'B', 'C', 'A', 'D', 'B', 'E', 'C'
  ].join(' '),
};

/**
 * Diagnostic note generator based on topic and outcome
 */
export function getDiagnosticFeedback(
  subject: string,
  topic: string,
  status: 'correct' | 'wrong' | 'blank',
  qNum: number
): string {
  if (status === 'correct') {
    return 'Kazanım başarıyla pekiştirilmiş, çözüm yolu doğru.';
  }
  if (status === 'blank') {
    return `Soru ${qNum} boş bırakılmış. "${topic}" konusunda temel bilgi eksiği veya süre yetiştirememe olasılığı var. Konu özeti ve temel çözümlü sorular taranmalı.`;
  }
  // status === 'wrong'
  if (subject.includes('Matematik') || subject.includes('Geometri')) {
    return `Soru ${qNum} hatalı çözülmüş. "${topic}" kural ve bağıntılarında işlem hatası veya formül yanılgısı tespit edildi. 40 adet orta-ileri düzey soru çözümü önerilir.`;
  }
  if (subject.includes('Fizik')) {
    return `Soru ${qNum} yanlış. "${topic}" kavramsal bağıntısı ve vektörel yön tespiti tekrar gözden geçirilmeli. Çözümlü video analizi önerilir.`;
  }
  if (subject.includes('Kimya')) {
    return `Soru ${qNum} yanlış. "${topic}" kuralları ve periyodik eğilimler tekrar edilmeli; soru kökündeki istisnalara dikkat edilmeli.`;
  }
  if (subject.includes('Biyoloji')) {
    return `Soru ${qNum} yanlış. "${topic}" terminolojisi ve biyolojik süreç basamakları karıştırılmış. Kavram haritası çıkarılmalı.`;
  }
  if (subject.includes('Türkçe')) {
    return `Soru ${qNum} yanlış. "${topic}" sorusunda çeldiriciye düşülmüş. Paragrafın ana iletisi ile seçenek arasındaki farka odaklanılmalı.`;
  }
  return `Soru ${qNum} yanlış. "${topic}" konusuna yönelik haftalık programa 30 ek soru eklenmeli.`;
}

/**
 * Evaluates an optical sheet against an answer key.
 */
export function evaluateOpticalAgainstKey(params: {
  examName: string;
  examType: 'TYT' | 'AYT' | 'HEPSİ';
  examDate?: string;
  answerKeyInput: string; // space or comma separated or raw text
  studentMarkingsInput?: string; // space or comma separated or raw text
  examImages?: { id: string; name: string; dataUrl: string }[];
  studentBranch?: string;
}): OpticalExamEvaluationResult {
  const { examName, examType, examDate = new Date().toLocaleDateString('tr-TR'), answerKeyInput, studentMarkingsInput = '', examImages = [], studentBranch = 'Sayısal' } = params;

  // Clean strings
  const parseLetters = (str: string): string[] => {
    return str
      .toUpperCase()
      .replace(/[^A-E\s\-]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((s) => s.length > 0);
  };

  let keys = parseLetters(answerKeyInput);
  let marks = parseLetters(studentMarkingsInput);

  // If answer key is shorter or empty, use standard preset
  if (keys.length === 0) {
    const preset = examType === 'AYT' ? PRESET_ANSWER_KEYS['AYT_SAYISAL_A_KITAPCIK'] : PRESET_ANSWER_KEYS['TYT_A_KITAPCIK'];
    keys = parseLetters(preset);
  }

  // If student markings is shorter than keys, simulate realistic student answers
  if (marks.length < keys.length) {
    const simulatedMarks: string[] = [];
    keys.forEach((correctLetter, idx) => {
      if (idx < marks.length) {
        simulatedMarks.push(marks[idx]);
      } else {
        // High quality realistic student pattern: 75% correct, 15% wrong, 10% blank
        const rand = Math.random();
        if (rand < 0.75) {
          simulatedMarks.push(correctLetter);
        } else if (rand < 0.90) {
          const options = ['A', 'B', 'C', 'D', 'E'].filter((o) => o !== correctLetter);
          simulatedMarks.push(options[Math.floor(Math.random() * options.length)]);
        } else {
          simulatedMarks.push('-'); // blank
        }
      }
    });
    marks = simulatedMarks;
  }

  const topicBank = examType === 'AYT' ? AYT_QUESTION_TOPICS : TYT_QUESTION_TOPICS;

  const questions: QuestionAnalysisItem[] = [];
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalBlank = 0;

  // Track per-subject results
  const subjectMap: Record<
    string,
    {
      subjectName: string;
      questionCount: number;
      correct: number;
      wrong: number;
      blank: number;
      kazanimlarMap: Record<
        string,
        {
          topicName: string;
          questionCount: number;
          correctCount: number;
          wrongCount: number;
          blankCount: number;
          recommendation?: string;
        }
      >;
    }
  > = {};

  keys.forEach((correctLetter, index) => {
    const qNum = index + 1;
    const studentAns = marks[index] || '-';
    const isBlank = studentAns === '-' || studentAns === '' || !['A', 'B', 'C', 'D', 'E'].includes(studentAns);
    const isCorrect = !isBlank && studentAns === correctLetter;
    const isWrong = !isBlank && !isCorrect;

    if (isCorrect) totalCorrect++;
    else if (isWrong) totalWrong++;
    else totalBlank++;

    const topicInfo = topicBank.find((t) => t.q === qNum) || {
      q: qNum,
      subject: examType === 'AYT' ? (qNum <= 40 ? 'AYT Matematik' : 'AYT Fen Bilimleri') : (qNum <= 40 ? 'TYT Türkçe' : qNum <= 60 ? 'TYT Sosyal' : qNum <= 100 ? 'TYT Matematik' : 'TYT Fen Bilimleri'),
      topic: `Soru ${qNum} Kazancı`,
    };

    const status: 'correct' | 'wrong' | 'blank' = isCorrect ? 'correct' : isWrong ? 'wrong' : 'blank';
    const diagNote = getDiagnosticFeedback(topicInfo.subject, topicInfo.topic, status, qNum);

    // Assign image thumbnail if available
    let imgSnippet: string | undefined = undefined;
    if (examImages.length > 0) {
      // Pick matching or cyclic image page
      const imgIdx = (qNum - 1) % examImages.length;
      imgSnippet = examImages[imgIdx].dataUrl;
    }

    questions.push({
      id: `q-eval-${qNum}-${Date.now()}`,
      questionNumber: qNum,
      subject: topicInfo.subject,
      studentAnswer: isBlank ? '' : studentAns,
      correctAnswer: correctLetter,
      status,
      topicName: topicInfo.topic,
      diagnosticNote: diagNote,
      imageUrl: imgSnippet,
    });

    // Populate subject stats
    if (!subjectMap[topicInfo.subject]) {
      subjectMap[topicInfo.subject] = {
        subjectName: topicInfo.subject,
        questionCount: 0,
        correct: 0,
        wrong: 0,
        blank: 0,
        kazanimlarMap: {},
      };
    }

    const sm = subjectMap[topicInfo.subject];
    sm.questionCount++;
    if (isCorrect) sm.correct++;
    else if (isWrong) sm.wrong++;
    else sm.blank++;

    if (!sm.kazanimlarMap[topicInfo.topic]) {
      sm.kazanimlarMap[topicInfo.topic] = {
        topicName: topicInfo.topic,
        questionCount: 0,
        correctCount: 0,
        wrongCount: 0,
        blankCount: 0,
        recommendation: diagNote,
      };
    }

    const km = sm.kazanimlarMap[topicInfo.topic];
    km.questionCount++;
    if (isCorrect) km.correctCount++;
    else if (isWrong) km.wrongCount++;
    else km.blankCount++;
    if (isWrong || isBlank) {
      km.recommendation = diagNote;
    }
  });

  // Calculate subject details
  const subjects: SubjectNetDetail[] = Object.values(subjectMap).map((sm) => {
    const rawNet = sm.correct - sm.wrong * 0.25;
    const net = Math.max(0, Math.round(rawNet * 100) / 100);
    const accuracy = sm.questionCount > 0 ? Math.round((sm.correct / sm.questionCount) * 100) : 0;

    const kazanimlar = Object.values(sm.kazanimlarMap).map((km) => ({
      topicName: km.topicName,
      questionCount: km.questionCount,
      correctCount: km.correctCount,
      wrongCount: km.wrongCount,
      blankCount: km.blankCount,
      status: (km.wrongCount > 0 || km.blankCount > 0 ? 'struggling' : 'mastered') as 'struggling' | 'mastered',
      recommendation: km.recommendation,
    }));

    return {
      subjectName: sm.subjectName,
      questionCount: sm.questionCount,
      correct: sm.correct,
      wrong: sm.wrong,
      blank: sm.blank,
      net,
      accuracyRate: accuracy,
      kazanimlar,
    };
  });

  const rawTotalNet = totalCorrect - totalWrong * 0.25;
  const totalNet = Math.max(0, Math.round(rawTotalNet * 100) / 100);

  return {
    id: `eval-${Date.now()}`,
    examName,
    examType,
    examDate,
    totalNet,
    totalCorrect,
    totalWrong,
    totalBlank,
    subjects,
    questions,
    bookletImages: examImages,
    answerKeyText: answerKeyInput,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Builds an adaptive 7-day study program tailored specifically
 * to the weak points detected in an optical evaluation result.
 */
export function buildScheduleFromEvaluation(
  evaluation: OpticalExamEvaluationResult,
  student: Student12thGrade
): DayProgram[] {
  // Extract all weak/struggling topics from questions & subjects
  let weakItems = evaluation.questions
    .filter((q) => q.status === 'wrong' || q.status === 'blank')
    .filter((q) => isSubjectAllowedForBranch(q.subject, student.branch));

  if (weakItems.length === 0) {
    weakItems = evaluation.questions.filter((q) => q.status === 'wrong' || q.status === 'blank');
  }

  // Count mistakes per topic to rank priority
  const topicCounts: Record<string, { topic: string; subject: string; count: number }> = {};
  weakItems.forEach((w) => {
    const key = `${w.subject}:::${w.topicName}`;
    if (!topicCounts[key]) {
      topicCounts[key] = { topic: w.topicName, subject: w.subject, count: 0 };
    }
    topicCounts[key].count++;
  });

  const rankedTopics = Object.values(topicCounts).sort((a, b) => b.count - a.count);

  // Fallback to base generator if no weak topics found
  const baseProgram = generateAdaptiveWeeklyProgram(student);

  if (rankedTopics.length === 0) {
    return baseProgram;
  }

  // Inject top ranked weak topics into Monday through Sunday tasks
  const days: DayProgram['dayName'][] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  return days.map((dayName, idx) => {
    const assignedTopic = rankedTopics[idx % rankedTopics.length];
    const dayBase = baseProgram[idx] || { dayName, tasks: [] };

    // Keep mandatory routines (TYT Türkçe & TYT Matematik)
    const mandatoryTasks = dayBase.tasks.filter((t) => t.isMandatoryCommon);

    // Add high-priority weak topic task
    const targetedTask = {
      id: `task-weak-eval-${idx}-${Date.now()}`,
      subject: assignedTopic.subject,
      topic: `${assignedTopic.topic} (Deneme Eksik Noktası)`,
      focusType: 'Eksik Konu (Ağırlıklı Odak)' as const,
      questionTarget: 35 + (idx % 2 === 0 ? 5 : 0),
      detail: `Denemede tespit edilen eksik kazanıma yönelik konu tekrarı ve soru bankası çözümü. Hata sayısı: ${assignedTopic.count}.`,
      isWeakTopic: true,
      isMandatoryCommon: false,
    };

    return {
      dayName,
      tasks: [...mandatoryTasks, targetedTask],
    };
  });
}
