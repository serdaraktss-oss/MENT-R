import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { parseOpticalDocument } from './src/utils/kazanimGenerator.js';

dotenv.config();

const getDirname = () => {
  if (typeof __dirname !== 'undefined') return __dirname;
  if (typeof import.meta !== 'undefined' && import.meta && import.meta.url) {
    return path.dirname(fileURLToPath(import.meta.url));
  }
  return process.cwd();
};

const appDir = getDirname();
const annualPlansFilePath = path.join(appDir, 'src', 'data', 'annual_plans_store.json');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // GET Annual Plans from server persistent storage
  app.get('/api/annual-plans', (req, res) => {
    try {
      if (fs.existsSync(annualPlansFilePath)) {
        const data = fs.readFileSync(annualPlansFilePath, 'utf-8');
        return res.json(JSON.parse(data));
      }
      return res.json([]);
    } catch (e) {
      console.error('Failed to read annual plans store:', e);
      return res.json([]);
    }
  });

  // POST Annual Plans to server persistent storage
  app.post('/api/annual-plans', (req, res) => {
    try {
      const plans = req.body;
      fs.mkdirSync(path.dirname(annualPlansFilePath), { recursive: true });
      fs.writeFileSync(annualPlansFilePath, JSON.stringify(plans, null, 2), 'utf-8');
      return res.json({ success: true, count: Array.isArray(plans) ? plans.length : 0 });
    } catch (e: any) {
      console.error('Failed to save annual plans store:', e);
      return res.status(500).json({ error: e.message });
    }
  });

  // Initialize Gemini API lazily or with optional check
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  };

  // Smart AI Assistant Chat Endpoint
  app.post('/api/assistant-chat', async (req, res) => {
    try {
      const { userMessage, chatHistory = [], contextData = {} } = req.body;
      const ai = getAiClient();

      const systemPrompt = `Adın: Mentör.
Sen kullanıcılarla günlük dilde akıcı, samimi, empati kurabilen ve yardımsever bir şekilde iletişim kuran kişisel bir konuşma asistanısın. Amacın, hem günlük sohbetlerde keyifli bir arkadaş gibi eşlik etmek hem de sorulan her türlü bilgi sorusuna net, doğru ve anlaşılır yanıtlar vermektir. Kullanıcı "Serdar Aktaş" veya öğretmenlerimize "Hocam" şeklinde hitap et.

# KİMLİK VE ROL
Sen kullanıcılarla günlük dilde akıcı, samimi, empati kurabilen ve yardımsever bir şekilde iletişim kuran kişisel bir konuşma asistanısın. Amacın, hem günlük sohbetlerde keyifli bir arkadaş gibi eşlik etmek hem de sorulan her türlü bilgi sorusuna net, doğru ve anlaşılır yanıtlar vermektir.

# KONUŞMA TARZI VE TONU
1. DOĞAL VE İÇTEN: Robotik veya aşırı resmi bir dil kullanma. Günlük Türkçeye uygun, sıcak, kibar ve cana yakın bir ton benimse.
2. ADAPTİF TON: Kullanıcının moduna uyum sağla. Kullanıcı neşeliyse neşeli, üzgün veya stresliysen empatik ve destekleyici ol.
3. AKICI VE ANLAŞILIR: Cümlelerini karmaşık jargonlardan arındır. Gereksiz uzun paragraflar yerine okuması kolay, akıcı ve öz yanıtlar ver.

# YANIT STRATEJİSİ VE KAPSAM
1. GENEL BİLGİ VE SORULAR: 
   - Bilim, tarih, genel kültür, teknoloji gibi her türlü konuda sorulan sorulara doğru ve yapıcı yanıtlar ver.
   - Karmaşık konuları açıklarken günlük hayattan benzetmeler (metaforlar) kullan.
2. GÜNLÜK SOHBET VE DERTLEŞME:
   - Kullanıcı sadece sohbet etmek veya bir konusunu paylaşmak istediğinde iyi bir dinleyici ol.
   - Sadece bilgi verip çekilme; sohbetin devam etmesi için arada açık uçlu, samimi sorular sor (Örn: "Sen bu konuda ne düşünüyorsun?", "Günün nasıl geçiyor?").
3. BİLİNMEYEN VE HASSAS KONULAR:
   - Emin olmadığın veya kesin bilgiye sahip olmadığın konularda açık ol, dürüstçe durumunu belirt.
   - Tıbbi, hukuki veya hayati konularda yönlendirme yaparken bunun profesyonel bir tavsiye olmadığını, genel bilgilendirme olduğunu nazikçe vurgula.

# KURALLAR
- HER ZAMAN CÜMLELERİNİ EKSİKSİZ VE TAMAMLANMIŞ OLARAK BİTİR. Cümleyi yarım bırakma veya yarıda kesme.
- Kullanıcının sözünü keser gibi tek kelimelik veya soğuk yanıtlar verme.
- Kullanıcıyı azarlama, ders verir gibi konuşma veya yargılama.
- Her zaman çözüm odaklı, pozitif ve net ol.

# PLATFORM VERİLERİ (Gerektiğinde Yönlendirme ve Öğrenci Bilgisi İçin Kullan):
- Aktif Sayfa: ${contextData.activeTab || 'Öğrenciler'}
- Seçili Öğrenci: ${contextData.selectedStudentName || 'Yok'}
- Toplam Öğrenci Sayısı: ${contextData.studentCount || 0}
- Öğrenciler Özeti: ${JSON.stringify(contextData.studentsSummary || [])}
- Denemeler Sayısı: ${contextData.yksExamsCount || 0}
- Yıllık Planlar Sayısı: ${contextData.annualPlansCount || 0}

YAPABİLECEĞİN EYLEM ETİKETLERİ (İlgili bir istek gelirse cümlenin sonuna ekle):
- [ACTION:NAVIGATE:students] -> Öğrenci listesine gider
- [ACTION:NAVIGATE:annual-plans] -> Yıllık planlar sayfasına gider
- [ACTION:NAVIGATE:yks-exams] -> Denemeler sınavları sayfasına gider
- [ACTION:NAVIGATE:ai-tools] -> Akıllı Müfredat & Soru oluşturucuya gider
- [ACTION:NAVIGATE:ai-apps] -> Yapay Zeka Araçları portalına gider
- [ACTION:NAVIGATE:tubitak] -> TÜBİTAK projeleri sayfasına gider
- [ACTION:NAVIGATE:teknofest] -> TEKNOFEST projeleri sayfasına gider
- [ACTION:SELECT_STUDENT:Öğrenci Adı] -> İlgili öğrenci detayını açar
- [ACTION:EXPORT_PDF] -> PDF raporu indirir
- [ACTION:EXPORT_WORD] -> Word (.docx) raporu indirir`;

      if (!ai) {
        // Fallback matching logic if Gemini API key is missing
        let reply = '';
        let action = '';

        const lowerMsg = (userMessage || '').toLowerCase();

        if (lowerMsg.includes('tubitak') || lowerMsg.includes('tübitak')) {
          reply = 'Sizi hemen TÜBİTAK Projeleri sayfasına yönlendiriyorum hocam!';
          action = '[ACTION:NAVIGATE:tubitak]';
        } else if (lowerMsg.includes('teknofest')) {
          reply = 'TEKNOFEST Projeleri sayfasına geçiş yapıyorum hocam!';
          action = '[ACTION:NAVIGATE:teknofest]';
        } else if (lowerMsg.includes('yks') || lowerMsg.includes('deneme')) {
          reply = 'Denemeler sınavları sayfasına geçiyorum hocam!';
          action = '[ACTION:NAVIGATE:yks-exams]';
        } else if (lowerMsg.includes('plan') || lowerMsg.includes('müfredat')) {
          reply = 'Yıllık planlar sayfasına geçiyorum hocam!';
          action = '[ACTION:NAVIGATE:annual-plans]';
        } else if (lowerMsg.includes('yapay zeka') || lowerMsg.includes('arac') || lowerMsg.includes('araç')) {
          reply = 'Yapay Zeka Araçları portalına geçiş yapıyorum hocam!';
          action = '[ACTION:NAVIGATE:ai-apps]';
        } else if (lowerMsg.includes('pdf')) {
          reply = 'İstediğiniz raporu PDF olarak indiriyorum hocam!';
          action = '[ACTION:EXPORT_PDF]';
        } else if (lowerMsg.includes('word') || lowerMsg.includes('docx')) {
          reply = 'Raporunuzu Word (.docx) formatında indiriyorum hocam!';
          action = '[ACTION:EXPORT_WORD]';
        } else if (lowerMsg.includes('nasılsın') || lowerMsg.includes('nasilsin') || lowerMsg.includes('naber')) {
          reply = 'Harikayım hocam, çok teşekkür ederim! Siz nasılsınız, gününüz nasıl geçiyor?';
        } else if (lowerMsg.includes('selam') || lowerMsg.includes('merhaba') || lowerMsg.includes('günaydın') || lowerMsg.includes('gunaydin')) {
          reply = 'Merhaba hocam! Ben Mentör, size ve öğrencilerimize her konuda yardımcı olmaktan mutluluk duyarım. Nasıl yardımcı olabilirim?';
        } else {
          // Check student match
          const matchedStudent = (contextData.studentsSummary || []).find((s: any) =>
            lowerMsg.includes(s.name.toLowerCase()) || lowerMsg.includes(s.name.split(' ')[0].toLowerCase())
          );
          if (matchedStudent) {
            reply = `${matchedStudent.name} isimli öğrencimizin gelişim kartını açıyorum hocam!`;
            action = `[ACTION:SELECT_STUDENT:${matchedStudent.name}]`;
          } else {
            reply = 'Merhaba hocam! Ben Mentör. Tüm öğrenci takipleri, denemeler, müfredat ve sorularınız için buradayım. Bugün nasıl yardımcı olabilirim?';
          }
        }

        return res.json({ reply: `${reply} ${action}`.trim(), fallback: true });
      }

      // Build contents array with chat history
      const formattedHistory = chatHistory.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const contents = [
        ...formattedHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 1500, // Enough headroom for complete, smooth, natural responses without truncation
          temperature: 0.7,
        }
      });

      let rawText = (response.text || 'Anlaşıldı hocam, yardımcı olmaya hazırım.').trim();
      if ((rawText.startsWith('"') && rawText.endsWith('"')) || (rawText.startsWith('“') && rawText.endsWith('”'))) {
        rawText = rawText.slice(1, -1).trim();
      }

      res.json({ reply: rawText, fallback: false });
    } catch (error: any) {
      console.error('Assistant Chat Error:', error);
      res.status(500).json({ error: 'Asistan yanıtı oluşturulurken hata oluştu.', details: error.message });
    }
  });

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Student Performance Analysis Endpoint
  app.post('/api/ai-analyze', async (req, res) => {
    try {
      const { studentName, grade, subjectData, weakTopics, strongTopics } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.json({
          analysis: `${studentName} için öneri: Logaritma ve Cümle Ögeleri konularında haftalık 50 ek soru çözümü ve konu tekrar videolarının izlenmesi tavsiye edilir.`,
          fallback: true
        });
      }

      const prompt = `Sen Mentör platformunda uzman bir YKS eğitim danışmanı ve öğretmen yardımcısısın.
Öğrenci: ${studentName || 'Caner Yıldız'} (${grade || '12-A Fen Bilimleri'})
Güçlü/Yükselen Konular: ${strongTopics?.join(', ') || 'Trigonometri I, Paragrafta Anlam, Optik'}
Düşüşteki/Zayıf Konular: ${weakTopics?.join(', ') || 'Logaritma, Cümle Ögeleri, Kimyasal Bağlar'}
Net / Soru Detayı: ${JSON.stringify(subjectData || { Matematik: '33D 5Y 2B', Türkçe: '36D 4Y 0B' })}

Lütfen yönetici/öğretmen Serdar Aktaş ve öğrenciye hitaben Türkçe olarak:
1. Kısa bir performans değerlendirmesi (2 cümle)
2. Zayıf olunan konular için nokta atışı 2 adet eksik giderme eylem planı
3. Öğrenciyi motive edici 1 kapanış cümlesi yaz.
Yanıtın derli toplu, profesyonel ve teşvik edici olsun.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      res.json({
        analysis: response.text || 'Analiz oluşturuldu.',
        fallback: false
      });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({
        error: 'AI analizi oluşturulurken bir hata oluştu.',
        details: error.message
      });
    }
  });

  // AI Weekly Schedule Program Generator for Mentors
  app.post('/api/generate-weekly-program', async (req, res) => {
    try {
      const { studentName, branch, weakTopics, strongTopics } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.json({
          fallback: true,
          notes: `${studentName} için kişiselleştirilmiş program hazırlandı.`
        });
      }

      const prompt = `Sen Mentör platformunda 12. sınıf YKS öğrencileri için mentörlük yapan uzman bir eğitim koçusun. Yönetici Serdar Aktaş tarafından yüklenen branş yıllık planları ve geçmiş YKS deneme sınavı matrislerini dikkate alarak öğrencinin eksiklerini şekillendir.
Öğrenci Adı: ${studentName || 'Caner Yıldız'}
Alan: ${branch || 'Sayısal / Fen Bilimleri'}
Zayıf / Düşüşte Olduğu Konular: ${weakTopics?.join(', ') || 'Logaritma, Cümle Ögeleri, Kimyasal Bağlar'}
Güçlü / Yükselen Konular: ${strongTopics?.join(', ') || 'Trigonometri I, Paragraf, Optik'}

GÖREV:
Öğrenciye özel Pazartesi'den Pazar'a 7 günlük dengeli bir çalışma programı tablosu önerisi oluştur.
KRİTİK KURALLAR:
1. SAAT YAZMA: Ders programında kesinlikle saat bilgisi (örn: 17:00-18:30) YER ALMASIN. Öğrenci çalışma saatlerini kendi belirleyecek.
2. ZORUNLU ORTAK DERSLER: TYT Türkçe ve TYT Matematik TÜM ÖĞRENCİLER İÇİN ORTAK ÖNEME SAHİPTİR. HER GÜN PROGRAMDA MUTLAKA YER ALMALIDIR.
3. DERS SAYISI: Her gün için tam 3 ders görevi tanımla (TYT Türkçe + TYT Matematik + 1 Branş veya Eksik Konu Dersi).
4. SORU SAYISI: Her göreve öğrencinin akademik seviyesine uygun hedef soru sayısı (questionTarget: 15 ile 50 arası) tanımla.

Lütfen yanıtını tam olarak aşağıdaki JSON formatında döndür:
{
  "mentorNote": "Öğretmenin öğrenciye özel tavsiye notu (2 cümle)",
  "schedule": [
    {
      "dayName": "Pazartesi",
      "tasks": [
        { "subject": "TYT Türkçe", "topic": "Paragraf & Anlam Bilgisi", "focusType": "Zorunlu Ortak Ders", "questionTarget": 30, "detail": "Her gün rutin 30 soru paragraf çözümü" },
        { "subject": "TYT Matematik", "topic": "Temel Kavramlar & Problemler", "focusType": "Zorunlu Ortak Ders", "questionTarget": 35, "detail": "Her gün rutin 35 soru matematik tekrarı" },
        { "subject": "AYT Matematik", "topic": "Logaritma", "focusType": "Eksik Konu (Ağırlıklı Odak)", "questionTarget": 40, "detail": "Denemedeki eksik kazanıma yönelik 40 soru" }
      ]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      let parsed = {};
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch (e) {
        console.error('Failed to parse AI schedule JSON', e);
      }

      res.json({ ...parsed, fallback: false });
    } catch (error: any) {
      console.error('AI Schedule Error:', error);
      res.status(500).json({ error: 'Program oluşturulamadı' });
    }
  });

  // AI Practice Question Generator Endpoint
  app.post('/api/ai-questions', async (req, res) => {
    try {
      const { topic, difficulty = 'Orta', count = 2 } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.json({
          questions: [
            {
              id: 'q-ai-1',
              subject: topic || 'Matematik: Logaritma',
              title: 'Logaritma Fonksiyonu Denklem Çözümü',
              questionText: 'log₂(x² - 1) = 3 denklemini sağlayan pozitif x değeri kaçtır?',
              options: ['3', '√7', '3', '4', '√9'],
              correctAnswer: '3',
              explanation: 'log₂(x² - 1) = 3 ⇒ x² - 1 = 2³ = 8 ⇒ x² = 9 ⇒ x = 3 (pozitif değer).'
            }
          ],
          fallback: true
        });
      }

      const prompt = `Eğitim teknolojileri uygulaması için YKS / lise düzeyinde ${topic} konusunda ${count} adet özel çalışma sorusu üret.
Zorluk seviyesi: ${difficulty}.

Lütfen yanıtını geçerli bir JSON dizisi (JSON array) formatında ver. Format tam olarak şöyle olmalı (başka metin ekleme, doğrudan JSON ver):
[
  {
    "id": "q-1",
    "subject": "${topic}",
    "title": "Soru Başlığı",
    "questionText": "Açık ve net soru metni",
    "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı", "E şıkkı"],
    "correctAnswer": "Doğru Şık metni veya Harfi",
    "explanation": "Adım adım çözüm açıklaması"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      let questions = [];
      try {
        questions = JSON.parse(response.text || '[]');
      } catch (e) {
        console.error('Failed to parse AI questions JSON:', e);
      }

      res.json({ questions, fallback: false });
    } catch (error: any) {
      console.error('Gemini Questions Error:', error);
      res.status(500).json({ error: 'Soru üretilemedi', details: error.message });
    }
  });

  // AI TÜBİTAK 2204 Research Project Generator Endpoint
  app.post('/api/generate-tubitak-project', async (req, res) => {
    try {
      const {
        mainArea,
        thematicArea,
        topicIdea,
        studentName,
        takimAdi,
        projeAdi,
        takimUyeleri,
        cozumUrettigiSorun,
        cozumUrettigiIhtiyacFikri,
        kullanilacakTeknikYontem,
        hedefKitle,
        referenceDocs,
      } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.status(400).json({ error: 'API Anahtarı bulunamadı', fallback: true });
      }

      let referenceDocsPrompt = '';
      if (Array.isArray(referenceDocs) && referenceDocs.length > 0) {
        referenceDocsPrompt = `\n\nÖNEMLİ: KULLANICININ YÜKLEDİĞİ YOL GÖSTERİCİ REFERANS BELGELER, ŞABLONLAR VE KURALLAR:
Aşağıdaki belgeler kullanıcı tarafından yüklenmiştir. Üretilecek yeni projenin dilini, yapısını, yazım kurallarını ve içerik derinliğini BU BELGELERDEKİ ŞABLON VE KURALLARA BİREBİR SADIK KALARAK ŞEKİLLENDİR:
` + referenceDocs.map((doc: any, idx: number) => `--- [BELGE ${idx + 1}: ${doc.name || 'Referans'} (${doc.category || 'Şablon'})] ---\n${doc.content}\n---`).join('\n\n');
      }

      const prompt = `Sen TÜBİTAK 2204 Lise ve Ortaokul Öğrencileri Araştırma Projeleri Yarışması Jüri Üyesi ve Kıdemli Akademik Proje Danışmanısın.
PROJE TASLAK PARAMETRELERİ:
- Yarışma / Ana & Tematik Alanı: ${mainArea || 'Bilgisayar ve Yazılım'} - ${thematicArea || 'Yapay Zeka ve Veri Analitiği'}
- Takım Adı: ${takimAdi || 'Geliştirici Ekip'}
- Proje Adı: ${projeAdi || topicIdea || 'Lise öğrencilerinin sınav kaygısını görüntü işleme ile tespiti'}
- Takım Üyeleri / Öğrenci: ${takimUyeleri || studentName || 'Caner Yıldız & Elif Şahin'}
- Çözüm Ürettiği Sorun: ${cozumUrettigiSorun || 'Sınav anındaki yüksek kaygının akademik performansı düşürmesi'}
- Çözüm Ürettiği İhtiyaç / Çözüm Fikri: ${cozumUrettigiIhtiyacFikri || 'Görüntü işleme ve PPG verileriyle anlık biyo-geribildirimli solunum egzersizi desteği'}
- Kullanılacak Teknik / Yöntem: ${kullanilacakTeknikYontem || 'Python, PyTorch, CNN derin öğrenme ve PPG sensör analizi'}
- Hedef Kitle: ${hedefKitle || 'YKS ve LGS sınavına hazırlanan öğrenciler'}
${referenceDocsPrompt}

KULLANILACAK DİL VE ÜSLUP (ÇOK ÖNEMLİ):
1. %100 ÖZGÜN, akademik dili yüksek, bilimsel araştırma makalesi düzeyinde resmi Türkçe anlatım kullanılacaktır.
2. Yapay zeka kalıpları (örn: 'bu proje devrim niteliğindedir', 'günümüz dünyasında', 'süper şarj etmek', 'eşsiz bir şekilde', 'kusursuz') KESİNLİKLE KULLANILMAYACAKTIR.
3. Cümleler araştırmacı üslubunda, pasif ve akademik fiil çatılarıyla (örneğin: 'incelenmiştir', 'hedeflenmektedir', 'metodolojik olarak tasarlanmıştır', 'analiz edilmiştir') yazılacaktır.
4. İntihal riski olmayacak şekilde özgün literatür ve metodoloji oluşturulacaktır.

Lütfen aşağıdaki TÜBİTAK 2204 resmi proje rapor taslağı yapısına BİREBİR UYGUN JSON formatında yanıt üret:

{
  "projeAnaAlani": "${mainArea || 'Bilgisayar ve Yazılım'}",
  "projeTematikAlani": "${thematicArea || 'Yapay Zeka ve Veri Analitiği'}",
  "projeAdi": "${projeAdi || 'Akademik proje başlığı'}",
  "takimAdi": "${takimAdi || 'Takım Adı'}",
  "takimUyeleri": "${takimUyeleri || studentName || 'Öğrenci Listesi'}",
  "cozumUrettigiSorun": "${cozumUrettigiSorun || 'Çözülen temel problem'}",
  "cozumUrettigiIhtiyacFikri": "${cozumUrettigiIhtiyacFikri || 'Geliştirilen yenilikçi çözüm fikri'}",
  "kullanilacakTeknikYontem": "${kullanilacakTeknikYontem || 'Metodoloji ve teknik altyapı'}",
  "hedefKitle": "${hedefKitle || 'Hedef kitle'}",
  "ozet": "Tam olarak 150-250 kelime arasında, çalışmanın amacını, yöntemini, kullanılan veri toplama araçlarını ve elde edilen temel bulguları özetleyen akademik paragraf",
  "anahtarKelimeler": ["En fazla 5 adet virgülsüz anahtar kelime dizisi"],
  "amac": "Doğrudan projenin amacına, somut hedeflerine ve Ar-Ge içeriğine odaklanan, çözülen problemi ve bilimsel katkıyı açıklayan detaylı bölüm",
  "giris": "Araştırma konusu hakkında yapılmış araştırmaların sonuçlarının ve bu alanda cevapsız olan soruların bilimsel literatüre dayandırılarak anlatıldığı kaynak taraması bölümü",
  "yontem": "Araştırma yönteminin, veri toplama araçlarının, deney/gözlem veya yazılım/donanım mimarisinin ve veri analiz yönteminin açıklandığı detaylı bölüm",
  "isZamanCizelgesi": [
    { "isAdi": "Literatür Taraması ve Kaynak Toplama", "nisan": true, "mayis": true, "haziran": false, "temmuz": false, "agustos": false, "eylul": false, "ekim": false, "kasim": false, "aralik": false, "ocak": false },
    { "isAdi": "Sistem Mimarisi ve Veri Seti Hazırlığı", "nisan": false, "mayis": true, "haziran": true, "temmuz": false, "agustos": false, "eylul": false, "ekim": false, "kasim": false, "aralik": false, "ocak": false },
    { "isAdi": "Algoritma Geliştirme ve Protatif Kodlama", "nisan": false, "mayis": false, "haziran": true, "temmuz": true, "agustos": true, "eylul": false, "ekim": false, "kasim": false, "aralik": false, "ocak": false },
    { "isAdi": "Saha Deneyleri, Testler ve Veri Analizi", "nisan": false, "mayis": false, "haziran": false, "temmuz": false, "agustos": true, "eylul": true, "ekim": true, "kasim": false, "aralik": false, "ocak": false },
    { "isAdi": "Proje Raporu Yazımı ve Final Değerlendirme", "nisan": false, "mayis": false, "haziran": false, "temmuz": false, "agustos": false, "eylul": false, "ekim": true, "kasim": true, "aralik": true, "ocak": true }
  ],
  "bulgular": "Çalışmada toplanan nicel ve nitel veriler ile bu verilere ait istatistiksel analiz sonuçlarının sunulduğu bölüm",
  "sonucVeTartisma": "Elde edilen bulguların araştırma hipotezine uygun olarak yorumlandığı ve literatürdeki diğer çalışmalarla kıyaslandığı bölüm",
  "oneriler": "Benzer çalışmalar yapacak araştırmacılara ve uygulayıcılara rehberlik edecek teknik öneriler",
  "kaynaklar": "APA 7 formatında düzenlenmiş en az 5 adet akademik bilimsel makale atıfı"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ project: parsed, fallback: false });
    } catch (error: any) {
      console.error('TÜBİTAK Project AI Error:', error);
      res.status(500).json({ error: 'TÜBİTAK projesi üretilirken bir hata oluştu', details: error.message });
    }
  });

  // AI TEKNOFEST Project Generator Endpoint
  app.post('/api/generate-teknofest-project', async (req, res) => {
    try {
      const {
        category,
        topicIdea,
        studentName,
        takimAdi,
        projeAdi,
        takimUyeleri,
        cozumUrettigiSorun,
        cozumUrettigiIhtiyacFikri,
        kullanilacakTeknikYontem,
        hedefKitle,
        referenceDocs,
      } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.status(400).json({ error: 'API Anahtarı bulunamadı', fallback: true });
      }

      let referenceDocsPrompt = '';
      if (Array.isArray(referenceDocs) && referenceDocs.length > 0) {
        referenceDocsPrompt = `\n\nÖNEMLİ: KULLANICININ YÜKLEDİĞİ YOL GÖSTERİCİ REFERANS BELGELER, ŞABLONLAR VE KURALLAR:
Aşağıdaki belgeler kullanıcı tarafından yüklenmiştir. Üretilecek yeni TEKNOFEST raporunu BU BELGELERDEKİ YERLİLİK/AR-GE KRİTERLERİNE, ŞABLON YAPISINA VE TEKNİK FORMATLARA BİREBİR UYGUN ÜRET:
` + referenceDocs.map((doc: any, idx: number) => `--- [BELGE ${idx + 1}: ${doc.name || 'Referans'} (${doc.category || 'Şablon'})] ---\n${doc.content}\n---`).join('\n\n');
      }

      const prompt = `Sen TEKNOFEST Havacılık, Uzay ve Teknoloji Festivali Teknik Değerlendirme Kurulu Üyesi ve Ar-Ge Mentorüsün.
PROJE TASLAK PARAMETRELERİ:
- Yarışma Kategorisi: ${category || 'İnsanlık Yararına Teknoloji'}
- Takım Adı: ${takimAdi || 'Teknoloji Takımı'}
- Proje Adı: ${projeAdi || topicIdea || 'Göçük Altı Canlı Tespiti Yapan Otonom İHA'}
- Takım Üyeleri: ${takimUyeleri || studentName || 'Mert Aksoy & Derya Yılmaz'}
- Çözüm Ürettiği Sorun: ${cozumUrettigiSorun || 'Deprem sonrası göçük altındaki canlılara zamanında ulaşılamaması'}
- Çözüm Ürettiği İhtiyaç / Çözüm Fikri: ${cozumUrettigiIhtiyacFikri || 'Termal kamera ve akustik gürültü filtreleme ile canlı tespiti yapan otonom İHA'}
- Kullanılacak Teknik / Yöntem: ${kullanilacakTeknikYontem || 'ROS, Python, TensorFlow Lite, Pixhawk uçuş kartı'}
- Hedef Kitle: ${hedefKitle || 'AFAD, Kızılay, İtfaiye ve Arama Kurtarma ekipleri'}
${referenceDocsPrompt}

KULLANILACAK DİL VE ÜSLUP (ÇOK ÖNEMLİ):
1. %100 ÖZGÜN, Ar-Ge ve inovasyon odaklı, mühendislik ve teknoloji standartlarında akademik Türkçe kullanılacaktır.
2. Basit yapay zeka ajitasyonları ve 'süper şarj etmek', 'devrim niteliğinde', 'kusursuz' gibi ucuz reklam dili KESİNLİKLE KULLANILMAYACAKTIR.
3. Yerlilik, üretilebilirlik, sistem mimarisi, risk yönetimi ve sürdürülebilirlik somut teknik terimlerle açıklanacaktır.

Lütfen aşağıdaki TEKNOFEST Detay Rapor Şablonuna BİREBİR UYGUN JSON yanıt üret:

{
  "kategori": "${category || 'İnsanlık Yararına Teknoloji'}",
  "projeAdi": "${projeAdi || 'Teknolojik proje adı'}",
  "takimAdi": "${takimAdi || 'Takım Adı'}",
  "takimUyeleri": "${takimUyeleri || studentName || 'Takım Üyeleri'}",
  "cozumUrettigiSorun": "${cozumUrettigiSorun || 'Çözülen problem'}",
  "cozumUrettigiIhtiyacFikri": "${cozumUrettigiIhtiyacFikri || 'İhtiyaç ve Çözüm fikri'}",
  "kullanilacakTeknikYontem": "${kullanilacakTeknikYontem || 'Teknik ve Yöntem'}",
  "hedefKitle": "${hedefKitle || 'Hedef Kitle'}",
  "ozet": "Projenin amacını, çözüm getirdiği problemi, kullanılan donanım/yazılım teknolojilerini ve özgün yönünü özetleyen paragraf",
  "anahtarKelimeler": ["En fazla 5 adet teknik anahtar kelime"],
  "problemIhtiyac": "Projenin hangi somut toplumsal, sanayi veya teknik probleme yanıt verdiğini ve mevcut çözümlerin yetersiz kaldığı noktaları açıklayan bölüm",
  "yerlilikOzgunluk": "Projenin yerli üretim potansiyelini, piyasadaki muadillerinden ayıran yenilikçi ve özgün Ar-Ge yönlerini açıklayan detaylı metin",
  "yontemUygulanabilirlik": "Kullanılacak donanım bileşenleri, yazılım dilleri, algoritmik akış şeması ve sistem mimarisinin teknik açıklaması",
  "yerliUretimVeRiskler": "Proje geliştirme sürecinde karşılaşılabilecek teknik ve lojistik riskler ile yerli bileşen temin olanakları",
  "etkiVeSurdurulebilirlik": "Projenin yaygınlaştırma potansiyeli, çevresel/ekonomik etkileri ve uzun vadeli sürdürülebilirliği",
  "isZamanCizelgesi": [
    { "isAdi": "İhtiyaç Analizi ve Komponent Seçimi", "nisan": true, "mayis": false, "haziran": false, "temmuz": false, "agustos": false, "eylul": false, "ekim": false, "kasim": false, "aralik": false, "ocak": false },
    { "isAdi": "Devre Tasarımı ve Algoritma Geliştirme", "nisan": false, "mayis": true, "haziran": true, "temmuz": false, "agustos": false, "eylul": false, "ekim": false, "kasim": false, "aralik": false, "ocak": false },
    { "isAdi": "Prototip İmalatı ve Entegrasyon", "nisan": false, "mayis": false, "haziran": false, "temmuz": true, "agustos": true, "eylul": false, "ekim": false, "kasim": false, "aralik": false, "ocak": false },
    { "isAdi": "Saha Testleri ve Kalibrasyon", "nisan": false, "mayis": false, "haziran": false, "temmuz": false, "agustos": false, "eylul": true, "ekim": true, "kasim": false, "aralik": false, "ocak": false },
    { "isAdi": "Teknik Rapor Finalizasyonu ve Sunum", "nisan": false, "mayis": false, "haziran": false, "temmuz": false, "agustos": false, "eylul": false, "ekim": false, "kasim": true, "aralik": true, "ocak": true }
  ],
  "kaynaklar": "APA 7 formatında teknik ve akademik referanslar listesi"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ project: parsed, fallback: false });
    } catch (error: any) {
      console.error('TEKNOFEST Project AI Error:', error);
      res.status(500).json({ error: 'TEKNOFEST projesi üretilirken bir hata oluştu', details: error.message });
    }
  });

  // AI Optical Document & Scorecard Parsing Endpoint (Gemini Vision)
  app.post('/api/parse-optical-document', async (req, res) => {
    try {
      const { fileData, fileName, mimeType, examTypeHint } = req.body;
      const ai = getAiClient();

      if (!ai || !fileData) {
        const fallback = parseOpticalDocument(fileName || 'Optik_Karne.png', examTypeHint || 'HEPSİ');
        return res.json({ parsedData: fallback, fallback: true });
      }

      // Format clean base64 string and mime type
      const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
      const actualMime = mimeType && mimeType.includes('/') ? mimeType : 'image/png';

      const prompt = `Sen Türkiye YKS (TYT / AYT) ve LGS optik sınav sonuç karnelerini, karne görsellerini ve sınav raporu belgelerini (PNG, JPG, PDF vb.) %100 doğrulukla tarayıp okuyan uzman bir optik tarayıcı ve OCR veri ayıklayıcısın.

GÖREV:
Görseldeki (veya belgedeki) optik sınav sonuç karnesini DİKKATLE VE TÜM SATIRLARI İNCELEYEREK OKU VE YANITLA.

KRİTİK UYARILAR VE AKILDA TUTULMASI GEREKENLER:
1. GÖRSELDEKİ GERÇEK VERİLERE KESİNLİKLE SADIK KAL. Hayalî veya uydurma net, doğru, yanlış veya konu ismi EKLEME. Görseldeki veriler neyse BİREBİR aynısını al.
   - Örnek: Eğer görselde MATEMATİK AYT dersinin Doğru (D) sayısı 27 ise, sakın 30 yazma! Tam olarak 27 yaz.
2. ⭐ KOYU RENK / KOYU FONT (BOLD TEXT) KRİTİK KURALI ⭐:
   Karnedeki konu ve kazanım listelerinde, ÖĞRENCİNİN HATA YAPTIĞI VEYA BOŞ BIRAKTIĞI (EKSİK OLDUĞU) KONULAR KOYU RENK FONT (BOLD) İLE YAZILMIŞTIR!
   - Açık / normal renkli fontta basılmış konular: Öğrencinin doğru yaptığı konular ('mastered').
   - KOYU SİYAH FONTLA (BOLD) BASILMIŞ KONULAR: Öğrencinin soru kaçırdığı, yanlış yaptığı veya boş bıraktığı eksik konulardır ('struggling').
   - Görseldeki tüm KOYU RENKLİ KONULARI istisnasız tespit et ve bunlara status: "struggling" atayarak öğrencinin eksikler listesine eklenmesini sağla!

3. DERS VE SORU DETAYLARI:
   Görselde geçen tüm dersleri (TÜRKÇE TYT, TEMEL MATEMATİK, GEOMETRİ TYT, FİZİK TYT, KİMYA TYT, BİYOLOJİ TYT, MATEMATİK AYT, GEOMETRİ AYT, FİZİK AYT, KİMYA AYT, BİYOLOJİ AYT vb.):
   - Soru Sayısı (questionCount)
   - Doğru Sayısı (correct)
   - Yanlış Sayısı (wrong)
   - Boş Sayısı (blank)
   - Net Sayısı (net) -> (Görselde yazan net sayısı)
   - Başarı Yüzdesi (accuracyRate)

4. KONULAR / KAZANIMLAR (kazanimlar):
   Görseldeki ders altındaki konu/kazanım listesini incele:
   - Görselde yazan GERÇEK KONU İSMİNİ BİREBİR AL (Örn: "Fonksiyonlarda Öteleme ve Dönüşüm", "Bileşke Fonksiyonu", "Vektör-Kuvvet", "Atomun Kuantum Modeli ve Yapısı", "Maddenin Halleri ve Özkütle", "Üçgende Eşlik ve Orta Taban", "Canlıların Yapısında Bulunan Organik Bileşikler" vb.).
   - Koyu renk (bold) basılmış konular için status: 'struggling' ver ve tavsiye notu yaz (Örn: "Görselde koyu fontla işaretlenmiş eksik konu, tekrar edilmeli.").
   - Normal basılmış konular için status: 'mastered' ver.

5. SINAV ADI VE BİLGİLERİ:
   - Karnedeki sınav adı (Örn: "12. SINIF YKS 2 (GM)", "ÖZDEBİR YKS-1" vb.)
   - Sınav Tarihi (Örn: "19.09.2025" veya görseldeki tarih)

JSON YANIT FORMATI:
{
  "examName": "12. SINIF YKS 2 (GM)",
  "examDate": "19.09.2025",
  "examType": "HEPSİ",
  "totalNet": 147.25,
  "rankInSchool": 1,
  "subjects": [
    {
      "subjectName": "AYT Matematik",
      "questionCount": 30,
      "correct": 27,
      "wrong": 2,
      "blank": 1,
      "net": 26.5,
      "accuracyRate": 90,
      "kazanimlar": [
        {
          "topicName": "Fonksiyonlarda Öteleme ve Dönüşüm",
          "questionCount": 5,
          "correctCount": 4,
          "wrongCount": 1,
          "blankCount": 0,
          "status": "struggling",
          "recommendation": "Karne görselinde KOYU RENK ile basılmış eksik konu, grafik ve öteleme kuralları tekrar edilmeli."
        }
      ]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            inlineData: {
              mimeType: actualMime,
              data: base64Data
            }
          },
          { text: prompt }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      let parsed = JSON.parse(response.text || '{}');
      if (!parsed.subjects || parsed.subjects.length === 0) {
        parsed = parseOpticalDocument(fileName || 'Optik_Karne.png', examTypeHint || 'HEPSİ');
      }

      res.json({ parsedData: parsed, fallback: false });
    } catch (error: any) {
      console.error('AI Optical Parsing Error:', error);
      const fallback = parseOpticalDocument(req.body.fileName || 'Optik_Karne.png', req.body.examTypeHint || 'HEPSİ');
      res.json({ parsedData: fallback, fallback: true, error: error.message });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduTrack Pro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
