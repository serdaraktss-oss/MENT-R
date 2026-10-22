import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { parseOpticalDocument } from './src/utils/kazanimGenerator.js';
import { evaluateOpticalAgainstKey } from './src/utils/opticalEvaluator.js';

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
const studentsFilePath = path.join(appDir, 'src', 'data', 'students_store.json');
const trialExamPagesFilePath = path.join(appDir, 'src', 'data', 'trial_exam_pages_store.json');
const uploadsDir = path.join(appDir, 'uploads', 'exam_images');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Static directory for uploaded exam images
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(path.join(appDir, 'uploads')));

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

  // GET Students from server persistent storage
  app.get('/api/students', (req, res) => {
    try {
      if (fs.existsSync(studentsFilePath)) {
        const data = fs.readFileSync(studentsFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ success: true, found: true, students: parsed });
        }
      }
      return res.json({ success: true, found: false, students: null });
    } catch (e) {
      console.error('Failed to read students store:', e);
      return res.json({ success: true, found: false, students: null });
    }
  });

  // POST Students to server persistent storage
  app.post('/api/students', (req, res) => {
    try {
      const studentsList = req.body;
      if (!Array.isArray(studentsList)) {
        return res.status(400).json({ error: 'Body must be an array of students' });
      }
      fs.mkdirSync(path.dirname(studentsFilePath), { recursive: true });
      fs.writeFileSync(studentsFilePath, JSON.stringify(studentsList, null, 2), 'utf-8');
      return res.json({ success: true, count: studentsList.length });
    } catch (e: any) {
      console.error('Failed to save students store:', e);
      return res.status(500).json({ error: e.message });
    }
  });

  // GET Trial Exam Pages (Images, parsed tables, states per exam)
  app.get('/api/trial-exam-pages', (req, res) => {
    try {
      if (fs.existsSync(trialExamPagesFilePath)) {
        const data = fs.readFileSync(trialExamPagesFilePath, 'utf-8');
        return res.json({ success: true, pages: JSON.parse(data) });
      }
      return res.json({ success: true, pages: {} });
    } catch (e) {
      console.error('Failed to read trial exam pages store:', e);
      return res.json({ success: true, pages: {} });
    }
  });

  // POST Trial Exam Pages
  app.post('/api/trial-exam-pages', (req, res) => {
    try {
      const pages = req.body;
      fs.mkdirSync(path.dirname(trialExamPagesFilePath), { recursive: true });
      fs.writeFileSync(trialExamPagesFilePath, JSON.stringify(pages, null, 2), 'utf-8');
      return res.json({ success: true });
    } catch (e: any) {
      console.error('Failed to save trial exam pages store:', e);
      return res.status(500).json({ error: e.message });
    }
  });

  // POST Upload Exam Image to disk to prevent localStorage overflow
  app.post('/api/upload-exam-image', (req, res) => {
    try {
      const { imageData, fileName } = req.body;
      if (!imageData) {
        return res.status(400).json({ error: 'Görsel verisi bulunamadı' });
      }
      fs.mkdirSync(uploadsDir, { recursive: true });
      const cleanName = (fileName || 'deneme_gorsel.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueName = `${Date.now()}_${cleanName}`;
      const filePath = path.join(uploadsDir, uniqueName);

      const matches = typeof imageData === 'string' ? imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/) : null;
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(imageData, 'base64');
      fs.writeFileSync(filePath, buffer);

      const sizeStr = buffer.length > 1024 * 1024
        ? `${(buffer.length / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(buffer.length / 1024)} KB`;

      return res.json({
        success: true,
        url: `/uploads/exam_images/${uniqueName}`,
        name: fileName || uniqueName,
        size: sizeStr,
      });
    } catch (e: any) {
      console.error('Failed to upload exam image:', e);
      return res.status(500).json({ error: e.message });
    }
  });

  // Initialize Gemini API with user-agent header
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Helper to convert raw errors or JSON error objects into user-friendly Turkish messages
  const cleanErrorMessage = (err: any): string => {
    if (!err) return 'Bilinmeyen bir hata meydana geldi.';
    let msg = typeof err === 'string' ? err : (err.message || String(err));
    if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
      return 'Yapay zeka model sunucularında anlık yoğunluk (503) yaşanıyor. Sistem yedek modelleri denedi; lütfen birkaç saniye sonra tekrar deneyiniz.';
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return 'İstek kotası limiti aşıldı (429). Lütfen kısa bir süre sonra yeniden deneyiniz.';
    }
    try {
      if (msg.trim().startsWith('{') && msg.includes('"error"')) {
        const parsed = JSON.parse(msg);
        if (parsed.error?.message) {
          return cleanErrorMessage(parsed.error.message);
        }
      }
    } catch {}
    return msg;
  };

  // Candidate models prioritized by stability and availability
  const CANDIDATE_MODELS = [
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
  ];

  // Robust content generator with automatic model fallback & retry
  const generateWithAi = async (
    ai: GoogleGenAI,
    options: {
      contents: any;
      config?: any;
      preferredModel?: string;
    }
  ) => {
    const primaryModel = options.preferredModel || 'gemini-3.8-flash';
    const models = [
      primaryModel,
      ...CANDIDATE_MODELS.filter(m => m !== primaryModel)
    ];

    let lastError: any = null;

    for (const modelName of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: options.contents,
            config: options.config,
          });
          return response;
        } catch (err: any) {
          lastError = err;
          const errMsg = String(err?.message || err);
          const isRateOrDemand = errMsg.includes('503') || 
                                 errMsg.includes('UNAVAILABLE') || 
                                 errMsg.includes('429') || 
                                 errMsg.includes('high demand') || 
                                 errMsg.includes('RESOURCE_EXHAUSTED');

          console.warn(`[Gemini Fallback] Model ${modelName} (attempt ${attempt + 1}) failed:`, errMsg.slice(0, 120));

          if (isRateOrDemand && attempt === 0) {
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
          break;
        }
      }
    }

    throw lastError;
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

      const response = await generateWithAi(ai, {
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
      res.status(500).json({ error: cleanErrorMessage(error), details: error.message });
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

      const response = await generateWithAi(ai, {
        contents: prompt,
      });

      res.json({
        analysis: response.text || 'Analiz oluşturuldu.',
        fallback: false
      });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({
        error: cleanErrorMessage(error),
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

      const response = await generateWithAi(ai, {
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
      res.status(500).json({ error: cleanErrorMessage(error) });
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

      const response = await generateWithAi(ai, {
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
      res.status(500).json({ error: cleanErrorMessage(error), details: error.message });
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

      const response = await generateWithAi(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ project: parsed, fallback: false });
    } catch (error: any) {
      console.error('TÜBİTAK Project AI Error:', error);
      res.status(500).json({ error: cleanErrorMessage(error), details: error.message });
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

      const response = await generateWithAi(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ project: parsed, fallback: false });
    } catch (error: any) {
      console.error('TEKNOFEST Project AI Error:', error);
      res.status(500).json({ error: cleanErrorMessage(error), details: error.message });
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

      const response = await generateWithAi(ai, {
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
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          const subMap: Record<string, any> = {};
          parsed.questions.forEach((q: any) => {
            const sName = q.subject || 'Genel Değerlendirme';
            if (!subMap[sName]) {
              subMap[sName] = {
                subjectName: sName,
                questionCount: 0,
                correct: 0,
                wrong: 0,
                blank: 0,
                net: 0,
                accuracyRate: 0,
                kazanimlar: []
              };
            }
            subMap[sName].questionCount++;
            if (q.status === 'correct') subMap[sName].correct++;
            else if (q.status === 'wrong') subMap[sName].wrong++;
            else subMap[sName].blank++;

            if (q.status !== 'correct') {
              subMap[sName].kazanimlar.push({
                topicName: q.topicName || 'Tespit Edilen Soru Konusu',
                questionCount: 1,
                correctCount: 0,
                wrongCount: q.status === 'wrong' ? 1 : 0,
                blankCount: q.status === 'blank' ? 1 : 0,
                status: 'struggling',
                recommendation: q.diagnosticNote || `${q.topicName} konusunda tekrar yapılmalı.`
              });
            }
          });
          parsed.subjects = Object.values(subMap).map((s: any) => {
            s.net = Number((s.correct - (s.wrong * 0.25)).toFixed(2));
            s.accuracyRate = s.questionCount > 0 ? Math.round((s.correct / s.questionCount) * 100) : 0;
            return s;
          });
        } else {
          return res.status(400).json({
            error: 'Yüklenen görselden sınav karnesi veya soru bilgisi okunamadı. Lütfen görselin net ve aydınlık olduğundan emin olun.',
            parsedData: null
          });
        }
      }

      res.json({ parsedData: parsed, fallback: false });
    } catch (error: any) {
      console.error('AI Optical Parsing Error:', error);
      res.status(500).json({
        error: cleanErrorMessage(error),
        parsedData: null
      });
    }
  });

  // AI Optical Sheet + Answer Key + Exam Booklet Images Evaluation Endpoint
  app.post('/api/scan-optical-and-key', async (req, res) => {
    try {
      const {
        examName = 'YKS Deneme Sınavı',
        examType = 'TYT',
        examDate = new Date().toLocaleDateString('tr-TR'),
        answerKeyText = '',
        answerKeyImage,
        opticalImage,
        studentMarkingsText = '',
        examImages = [],
        studentName = 'Öğrenci',
        studentBranch = 'Sayısal'
      } = req.body || {};

      const ai = getAiClient();

      if (!ai) {
        return res.status(500).json({
          error: 'Yapay zeka analiz servisi (GEMINI_API_KEY) yapılandırılmamış. Lütfen ortam değişkenlerini kontrol edin.'
        });
      }

      if (!opticalImage && (!Array.isArray(examImages) || examImages.length === 0) && !answerKeyImage && !answerKeyText) {
        return res.status(400).json({
          error: 'Analiz yapabilmek için en az bir optik form, cevap anahtarı veya deneme soru kitapçığı görseli yüklenmelidir.'
        });
      }

      const parts: any[] = [];

      // 1. Optical Form Image
      if (opticalImage && typeof opticalImage === 'string' && opticalImage.includes('base64,')) {
        const cleanOpt = opticalImage.replace(/^data:[^;]+;base64,/, '');
        const mime = opticalImage.match(/^data:([^;]+);base64,/)?.[1] || 'image/png';
        parts.push({
          inlineData: { mimeType: mime, data: cleanOpt }
        });
        parts.push({
          text: 'BELGE 1 (ÖĞRENCİ OPTİK FORMU): Bu görsel öğrencinin doldurduğu gerçek optik form veya sınav karnesidir. Öğrencinin hangi soru numarasına hangi şıkkı (A, B, C, D, E) kodladığını veya boş bıraktığını bu görseldeki işaretlemeleri tek tek okuyarak belirle.'
        });
      }

      // 2. Answer Key Image
      if (answerKeyImage && typeof answerKeyImage === 'string' && answerKeyImage.includes('base64,')) {
        const cleanKey = answerKeyImage.replace(/^data:[^;]+;base64,/, '');
        const mime = answerKeyImage.match(/^data:([^;]+);base64,/)?.[1] || 'image/png';
        parts.push({
          inlineData: { mimeType: mime, data: cleanKey }
        });
        parts.push({
          text: 'BELGE 2 (CEVAP ANAHTARI): Bu görsel sınavın resmi cevap anahtarıdır. Soru numaralarının doğru şıklarını (A, B, C, D, E) doğrudan bu görselden oku.'
        });
      }

      // 3. Exam Booklet Question Images (supports all uploaded pages, up to 12)
      if (Array.isArray(examImages) && examImages.length > 0) {
        examImages.slice(0, 12).forEach((img: any, idx: number) => {
          if (img.dataUrl && typeof img.dataUrl === 'string' && img.dataUrl.includes('base64,')) {
            const cleanImg = img.dataUrl.replace(/^data:[^;]+;base64,/, '');
            const mime = img.dataUrl.match(/^data:([^;]+);base64,/)?.[1] || 'image/jpeg';
            parts.push({
              inlineData: { mimeType: mime, data: cleanImg }
            });
            parts.push({
              text: `BELGE ${idx + 3} (DENEME SORU KİTAPÇIĞI SAYFASI - ${img.name || `Sayfa ${idx + 1}`}): BU SAYFADAKİ SORULARI ÇOK DİKKATLİ İNCELE. Soru numaralarını, soru metnini ve sorunun test ettiği tam konuyu doğrudan bu sayfadan oku. Asla uydurma soru üretme!`
            });
          }
        });
      }

      const promptText = `Sen uzman bir Ölçme ve Değerlendirme Uzmanı, Optik Form Okuyucusu ve YKS Soru Analizcisisin.

ÖĞRENCİ: ${studentName} (Alanı: ${studentBranch})
SINAV ADI: ${examName} (${examType})
SINAV TARİHİ: ${examDate}
${answerKeyText ? `KULLANICININ YAZDIĞI CEVAP ANAHTARI: ${answerKeyText}` : ''}
${studentMarkingsText ? `KULLANICININ YAZDIĞI ÖĞRENCİ KODLAMALARI: ${studentMarkingsText}` : ''}

⭐⭐⭐ KESİNLİKLE VE İSTİSNASIZ UYULMASI GEREKEN SIFIR-UYDURMA (ZERO HALLUCINATION) KURALLARI ⭐⭐⭐
Kullanıcı, daha önce sistemin görsellerle alakası olmayan uydurma sorular, hayali branşlar ve alakasız çıkarımlar üretmesinden dolayı şikayetçidir.
Görselleri AŞIRI DERECEDE TİTİZ, MİKROSKOPİK DÜZEYDE ve KELİME KELİME inceleyeceksin. Aşağıdaki kurallara %100 sadık kalacaksın:

1. SADECE VE SADECE YÜKLENEN GÖRSELLERDE GÖRÜNEN GERÇEK SORULARI TESPİT ET:
   - Soru kitapçığı veya optik form görsellerinde hangi sorular basılıysa YALNIZCA O SORULARI oku.
   - Görselde toplam 2 soru varsa 'questions' dizisinde TAM OLARAK 2 soru olmalıdır!
   - Görselde 4 soru varsa TAM OLARAK 4 soru olmalıdır!
   - Görsellerde bulunmayan TEK BİR SORU NUMARASI VEYA KONU DAHİ UYDURMAK KESİNLİKLE VE KESİNLİKLE YASAKTIR. Standart 40 soruluk hayali bir sınav üretmeyeceksin!

2. HER SORU İÇİN GÖRSEL ALINTI KANITI ("questionSnippet"):
   - Her soru için "questionSnippet" alanına, görselde basılı olan soru metnini veya soru kökünü EN AZ 15-35 KELİME OLARAK BİREBİR KELİMESİ KELİMESİNE ALINTILA.
   - Örnek: "f: R -> R, f(x) = ax^2 + bx + c fonksiyonunun tepe noktası T(2, -4) olduğuna göre...", "Şekildeki sürtünmesiz eğik düzlem üzerinde serbest bırakılan m kütleli cisim...".
   - Bu alıntı, soruyu gerçekten kullanıcının yüklediği görselden okuduğunun doğrudan kanıtıdır. Asla genel geçer veya uydurma metin yazma!

3. NOKTA ATIŞI GERÇEK KONU ADI ("topicName"):
   - Sorunun test ettiği GERÇEK VE SPESİFİK konuyu yaz.
   - Görseldeki soru hangi matematiksel teorem, fizik kuralı, kimyasal reaksiyon veya biyolojik kavrama aitse tam olarak onu yaz (Örn: "Parabolün Tepe Noktası ve Grafiği", "Dinamik: Eğik Düzlemde Sürtünme ve İvme", "Gaz Yasaları: İdeal Gaz Denklemi", "Fotosentez: Işığa Bağımlı Evre").
   - Soruyla ilgisi olmayan alakasız veya uydurma konu yazmak KESİNLİKLE YASAKTIR.

4. SORUYA ÖZGÜ GERÇEKÇİ ÇIKARIM VE EKSİKLİK ANALİZİ ("diagnosticNote"):
   - Çıkarımlarını görseldeki sorunun içeriğine, verilen şekil/grafiklere, formüllere veya öncüllere (I, II, III) dayandır.
   - Örnek: "Sorudaki sürtünme katsayısı ve eğim açısı bileşenlerinin ayrılmasında işlem hatası yapılmış.", "Türevin geometrik yorumunda teğet doğrusunun eğimi f'(x) bağıntısı dikkate alınmalı.".
   - Görseldeki soruyla alakası olmayan ezber veya hayali çıkarımlar YAPMA!

5. BRANŞ BELİRLEME ("subject"):
   - Her sorunun ait olduğu dersi/branşı sorunun içeriğine göre belirle (örn: "AYT Matematik", "AYT Fizik", "AYT Kimya", "TYT Türkçe", "TYT Matematik", "TYT Geometri", "AYT Biyoloji" vb.).
   - Sadece görsellerde sorusu tespit edilen branşları dahil et!

6. CEVAP VE İŞARETLEME ANALİZİ:
   - "correctAnswer": Cevap anahtarı görseli/metni varsa oradan oku; yoksa soruyu görselden kendin çözerek doğru şıkkı (A, B, C, D, E) belirle.
   - "studentAnswer": Optik form görselinden veya kitapçık üzerindeki öğrencinin işaretlediği/daire içine aldığı şıktan oku. Eğer öğrenci işareti yoksa "" (boş) bırak.
   - "status":
     * Öğrenci şıkkı doğru şık ile aynıysa -> "correct"
     * Öğrenci farklı bir şık işaretlemişse -> "wrong"
     * Öğrenci işaretlemesi yoksa veya optik formda boşsa -> "blank"

7. YALNIZCA AŞAĞIDAKİ JSON FORMATINDA YANIT VER:
{
  "examName": "${examName}",
  "examType": "${examType}",
  "examDate": "${examDate}",
  "questions": [
    {
      "questionNumber": 1,
      "subject": "AYT Matematik",
      "questionSnippet": "Görselden birebir okunan soru metni (en az 15-30 kelime)...",
      "topicName": "Parabolün Tepe Noktası",
      "diagnosticNote": "Sorudaki tepe noktası formülü ve simetri ekseni analizi...",
      "studentAnswer": "C",
      "correctAnswer": "A",
      "status": "wrong",
      "sourceImage": "Sayfa 1"
    }
  ]
}`;

      parts.push({ text: promptText });

      const response = await generateWithAi(ai, {
        contents: parts,
        config: {
          responseMimeType: 'application/json'
        }
      });

      let responseText = response.text || '';
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (pe) {
        console.error('Failed to parse Gemini JSON response:', pe, responseText);
        throw new Error('Yapay zeka çıktısı JSON formatında çözümlenemedi.');
      }

      if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('Yüklenen görsellerden soru veya işaretleme tespit edilemedi. Lütfen sorunun veya optik formun net, aydınlık ve okunabilir bir fotoğrafını yükleyin.');
      }

      // CRITICAL REBUILD:
      // Always construct subjects and kazanimlar DIRECTLY from the verified parsed questions.
      // This guarantees zero hallucinated subjects (e.g. no Türkçe if user only uploaded Fizik questions).
      const subMap: Record<string, any> = {};
      parsed.questions.forEach((q: any, i: number) => {
        q.id = q.id || `q-${q.questionNumber || i + 1}-${Date.now()}`;
        q.questionNumber = q.questionNumber || i + 1;
        q.topicName = q.topicName || `Soru ${q.questionNumber} Konusu`;
        q.subject = q.subject || (examType === 'AYT' ? 'AYT Branşı' : 'TYT Branşı');

        const sName = q.subject;
        if (!subMap[sName]) {
          subMap[sName] = {
            subjectName: sName,
            questionCount: 0,
            correct: 0,
            wrong: 0,
            blank: 0,
            net: 0,
            accuracyRate: 0,
            kazanimlar: []
          };
        }
        subMap[sName].questionCount++;
        if (q.status === 'correct') subMap[sName].correct++;
        else if (q.status === 'wrong') subMap[sName].wrong++;
        else subMap[sName].blank++;

        // Add to subject kazanimlar
        const existingK = subMap[sName].kazanimlar.find((k: any) => k.topicName === q.topicName);
        if (existingK) {
          existingK.questionCount++;
          if (q.status === 'correct') existingK.correctCount++;
          else if (q.status === 'wrong') existingK.wrongCount++;
          else existingK.blankCount++;
          if (q.status !== 'correct' && q.diagnosticNote) {
            existingK.recommendation = q.diagnosticNote;
            existingK.status = 'struggling';
          }
        } else {
          subMap[sName].kazanimlar.push({
            topicName: q.topicName,
            questionCount: 1,
            correctCount: q.status === 'correct' ? 1 : 0,
            wrongCount: q.status === 'wrong' ? 1 : 0,
            blankCount: q.status === 'blank' ? 1 : 0,
            status: q.status === 'correct' ? 'mastered' : 'struggling',
            recommendation: q.diagnosticNote || `${q.topicName} konusunda kurallar ve formül uygulamaları tekrar edilmeli.`
          });
        }
      });

      parsed.subjects = Object.values(subMap).map((s: any) => {
        s.net = Number((s.correct - (s.wrong * 0.25)).toFixed(2));
        s.accuracyRate = s.questionCount > 0 ? Math.round((s.correct / s.questionCount) * 100) : 0;
        return s;
      });

      const correctCount = parsed.questions.filter((q: any) => q.status === 'correct').length;
      const wrongCount = parsed.questions.filter((q: any) => q.status === 'wrong').length;
      const blankCount = parsed.questions.filter((q: any) => q.status === 'blank').length;
      parsed.totalCorrect = correctCount;
      parsed.totalWrong = wrongCount;
      parsed.totalBlank = blankCount;
      parsed.totalNet = Number((correctCount - (wrongCount * 0.25)).toFixed(2));

      parsed.id = `eval-${Date.now()}`;
      parsed.bookletImages = examImages;
      parsed.createdAt = new Date().toISOString();

      res.json({ result: parsed, fallback: false });
    } catch (error: any) {
      console.error('Scan Optical & Key Server Error:', error);
      res.status(500).json({
        error: cleanErrorMessage(error)
      });
    }
  });

  // POST /api/parse-batch-exam-sheet
  // Parses batch trial exam documents/lists/scorecards for multiple students (TYT / AYT)
  app.post('/api/parse-batch-exam-sheet', async (req, res) => {
    try {
      const {
        images = [], // Array of base64 image strings or objects
        examType = 'TYT', // 'TYT' | 'AYT'
        examNumber = 1, // 1 to 100
        examTitle = 'Deneme Sınavı',
        examDate = new Date().toISOString().split('T')[0],
        existingStudents = [] // Array of { id, name, className, branch, studentNo }
      } = req.body;

      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({
          error: 'Lütfen incelenmek üzere en az bir adet deneme sonuç listesi veya karne görseli yükleyiniz.'
        });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(500).json({
          error: 'Gemini API anahtarı yapılandırılmamış. Lütfen çevre değişkenlerini kontrol edin.'
        });
      }

      const parts: any[] = [];

      images.forEach((img: any, idx: number) => {
        let base64Data = '';
        let mimeType = 'image/jpeg';

        if (typeof img === 'string') {
          if (img.startsWith('/uploads/') || img.startsWith('uploads/')) {
            const relPath = img.startsWith('/') ? img.slice(1) : img;
            const fullImgPath = path.join(appDir, relPath);
            if (fs.existsSync(fullImgPath)) {
              base64Data = fs.readFileSync(fullImgPath).toString('base64');
              mimeType = fullImgPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
            }
          } else {
            const match = img.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              mimeType = match[1];
              base64Data = match[2];
            } else {
              base64Data = img;
            }
          }
        } else if (img && img.data) {
          mimeType = img.mimeType || 'image/jpeg';
          base64Data = img.data.replace(/^data:[^;]+;base64,/, '');
        }

        if (base64Data) {
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        }
      });

      if (parts.length === 0) {
        return res.status(400).json({
          error: 'Geçerli görsel verisi bulunamadı.'
        });
      }

      const existingNamesStr = existingStudents
        .map((s: any) => `${s.name} (${s.className || '12. Sınıf'} - ${s.branch || 'Genel'})`)
        .join(', ');

      const promptText = `Sen uzman bir Ölçme ve Değerlendirme Uzmanı, Optik Form ve Sınav Sonuç Çizelgesi Ayrıştırıcısısın.
Sana yüklenen ${parts.length} adet görselde bir sınıfın, okulun veya deneme merkezinin TOPLU DENEME SINAVI SONUÇ ÇİZELGESİ, ÖĞRENCİ KARNE LİSTESİ veya OPTİK SONUÇ TABLOSU yer almaktadır.

# SINAV BİLGİLERİ:
- Sınav Türü: ${examType} (TYT veya AYT)
- Deneme No: Deneme #${examNumber}
- Deneme Başlığı: ${examTitle}
- Tarih: ${examDate}

# SİSTEMDE KAYITLI MEVCUT ÖĞRENCİLER:
${existingNamesStr || 'Caner Yıldız (12 MFA - Sayısal), Elif Şahin (12 TMA - Eşit Ağırlık)'}

# GÖREVİN:
Görsellerdeki TÜM ÖĞRENCİLERİ satır satır çok dikkatlice oku.
Her öğrencinin ad-soyadını ve ${examType} branşlarındaki DOĞRU (D), YANLIŞ (Y), BOŞ (B) ve NET sayılarını BİREBİR görselden oku ve çıkar.

# KESİNLİKLE UYULMASI GEREKEN TAVİZSİZ KURALLAR:
1. SADECE VE SADECE YÜKLENEN GÖRSEL(LER)DE YAZILI OLAN GERÇEK VERİLERİ OKU.
   - Görselde bulunmayan hiçbir öğrenciyi veya rastgele hayali ders sonucunu ASLA UYDURMA.
   - Öğrencinin adını belgede yazdığı şekliyle oku.
2. BRANŞ AYRIŞTIRMASI (TÜM BRANŞLAR AYRI VE DETAYLI ÇIKARILMALIDIR):
   - Eğer sınav TYT ise:
     * "TYT Türkçe" (40 soru)
     * SOSYAL BİLİMLER: "TYT Tarih" (5 soru), "TYT Coğrafya" (5 soru), "TYT Felsefe" (5 soru), "TYT Din Kültürü" (5 soru)
     * "TYT Matematik" (40 soru)
     * FEN BİLİMLERİ: "TYT Fizik" (7 soru), "TYT Kimya" (7 soru), "TYT Biyoloji" (6 soru)
     (Not: Belgede Sosyal ve Fen tek blok halinde yer alıyorsa dahi alt branşlar varsa mutlaka Tarih, Coğrafya, Felsefe, Din Kültürü, Fizik, Kimya, Biyoloji olarak ayrı ayrı ayrıştırınız).
   - Eğer sınav AYT ise branşlar: "AYT Matematik", "AYT Fizik", "AYT Kimya", "AYT Biyoloji", "AYT Edebiyat", "AYT Tarih", "AYT Coğrafya", "AYT Felsefe Grubu", "AYT Din Kültürü".
3. NET HESAPLAMA DOĞRULAMASI:
   - Formül: Net = Doğru - (Yanlış * 0.25).
   - Toplam Net: Tüm branş netlerinin toplamı.
4. MEVCUT ÖĞRENCİ EŞLEŞTİRMESİ:
   - Belgede okunan öğrenci adı, yukarıdaki mevcut öğrenci listesinden biriyle eşleşiyorsa "matchedExistingName" alanına o öğrencinin sistemdeki adını yaz. Eşleşmiyorsa bu alanı boş bırak.

# ÇIKTI ŞEMASI (SADECE JSON FORMATINDA DÖNDÜR):
{
  "examType": "${examType}",
  "examNumber": ${examNumber},
  "examTitle": "${examTitle}",
  "examDate": "${examDate}",
  "students": [
    {
      "scannedName": "Öğrencinin Belgedeki Adı Soyadı",
      "matchedExistingName": "Caner Yıldız",
      "studentNo": "412",
      "className": "12 MFA",
      "branch": "Sayısal",
      "subjects": [
        {
          "subjectName": "${examType === 'TYT' ? 'TYT Türkçe' : 'AYT Matematik'}",
          "questionCount": 40,
          "correct": 34,
          "wrong": 4,
          "blank": 2,
          "net": 33.0,
          "accuracyRate": 85
        }
      ],
      "totalNet": 33.0
    }
  ]
}`;

      parts.push({ text: promptText });

      const response = await generateWithAi(ai, {
        contents: parts,
        config: {
          responseMimeType: 'application/json'
        }
      });

      let responseText = response.text || '';
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (pe) {
        console.error('Failed to parse Gemini batch exam JSON:', pe, responseText);
        throw new Error('Yapay zeka analiz çıktısı JSON formatında çözümlenemedi.');
      }

      if (!Array.isArray(parsed.students) || parsed.students.length === 0) {
        return res.status(422).json({
          error: 'Yüklenen görsel(ler)de öğrenci sonuç çizelgesi veya puan tablosu tespit edilemedi. Lütfen net ve okunabilir bir sonuç belgesi yükleyiniz.'
        });
      }

      // Ensure mathematical net consistency for each subject and total
      parsed.students.forEach((stu: any) => {
        let calcTotalNet = 0;
        if (Array.isArray(stu.subjects)) {
          stu.subjects.forEach((sub: any) => {
            const c = Number(sub.correct) || 0;
            const w = Number(sub.wrong) || 0;
            const b = Number(sub.blank) || 0;
            const net = Number((c - (w * 0.25)).toFixed(2));
            sub.correct = c;
            sub.wrong = w;
            sub.blank = b;
            sub.net = net;
            const totalQ = sub.questionCount || (c + w + b) || 1;
            sub.questionCount = totalQ;
            sub.accuracyRate = Math.round((c / totalQ) * 100);
            calcTotalNet += net;
          });
        }
        stu.totalNet = Number(calcTotalNet.toFixed(2));
      });

      res.json({
        success: true,
        data: parsed
      });
    } catch (error: any) {
      console.error('Parse Batch Exam Sheet Error:', error);
      res.status(500).json({
        error: cleanErrorMessage(error)
      });
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
