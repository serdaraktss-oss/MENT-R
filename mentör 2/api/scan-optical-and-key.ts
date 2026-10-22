import { GoogleGenAI } from '@google/genai';
import { evaluateOpticalAgainstKey } from '../src/utils/opticalEvaluator.js';

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
    studentBranch = 'Sayısal',
  } = req.body || {};

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      const localResult = evaluateOpticalAgainstKey({
        examName,
        examType,
        examDate,
        answerKeyInput: answerKeyText || '',
        studentMarkingsInput: studentMarkingsText || '',
        examImages,
        studentBranch,
      });
      return res.json({ result: localResult, fallback: true });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts: any[] = [];

    // 1. Optical Form Image
    if (opticalImage && typeof opticalImage === 'string' && opticalImage.includes('base64,')) {
      const cleanOpt = opticalImage.replace(/^data:[^;]+;base64,/, '');
      const mime = opticalImage.match(/^data:([^;]+);base64,/)?.[1] || 'image/png';
      parts.push({
        inlineData: { mimeType: mime, data: cleanOpt },
      });
      parts.push({
        text: 'BELGE 1 (ÖĞRENCİ OPTİK FORMU): Bu görsel öğrencinin doldurduğu gerçek optik form veya sınav karnesidir. Öğrencinin hangi soru numarasına hangi şıkkı (A, B, C, D, E) kodladığını veya boş bıraktığını bu görseldeki işaretlemeleri tek tek okuyarak belirle.',
      });
    }

    // 2. Answer Key Image
    if (answerKeyImage && typeof answerKeyImage === 'string' && answerKeyImage.includes('base64,')) {
      const cleanKey = answerKeyImage.replace(/^data:[^;]+;base64,/, '');
      const mime = answerKeyImage.match(/^data:([^;]+);base64,/)?.[1] || 'image/png';
      parts.push({
        inlineData: { mimeType: mime, data: cleanKey },
      });
      parts.push({
        text: 'BELGE 2 (CEVAP ANAHTARI): Bu görsel sınavın resmi cevap anahtarıdır. Soru numaralarının doğru şıklarını (A, B, C, D, E) doğrudan bu görselden oku.',
      });
    }

    // 3. Exam Booklet Question Images (supports all uploaded pages, up to 12)
    if (Array.isArray(examImages) && examImages.length > 0) {
      examImages.slice(0, 12).forEach((img: any, idx: number) => {
        if (img.dataUrl && typeof img.dataUrl === 'string' && img.dataUrl.includes('base64,')) {
          const cleanImg = img.dataUrl.replace(/^data:[^;]+;base64,/, '');
          const mime = img.dataUrl.match(/^data:([^;]+);base64,/)?.[1] || 'image/jpeg';
          parts.push({
            inlineData: { mimeType: mime, data: cleanImg },
          });
          parts.push({
            text: `BELGE ${idx + 3} (DENEME SORU KİTAPÇIĞI SAYFASI - ${img.name || `Sayfa ${idx + 1}`}): BU SAYFADAKİ SORULARI ÇOK DİKKATLİ İNCELE. Soru numaralarını, soru metnini ve sorunun test ettiği tam konuyu doğrudan bu sayfadan oku. Asla uydurma soru üretme!`,
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

ÇOK KESİN VE TİTİZ TALİMATLAR:
1. KULLANICININ YÜKLEDİĞİ GÖRSELLERİ SATIR SATIR VE KELİME KELİME İNCELE:
   - Kullanıcı uydurma veya görselle alakası olmayan sorulardan kesinlikle şikayetçidir.
   - SADECE VE SADECE YÜKLENEN GÖRSELLERDE GÖRDÜĞÜN GERÇEK SORULARI TESPİT ET.
   - Soru kitapçığı sayfalarında basılı olan soruları tek tek oku.
   - Her soru için:
     * "questionNumber": Sayfadaki soru numarası (örn: 1, 2, 3...)
     * "subject": Sorunun ait olduğu ders ("TYT Türkçe", "TYT Matematik", "TYT Fizik", "AYT Matematik", "AYT Biyoloji" vb.)
     * "questionSnippet": Görseldeki gerçek sorunun İLK 10-25 KELİMESİNİ VEYA SORU KÖKÜNÜ BİREBİR ALINTILA (örn: "f(x) = ax² + bx + c fonksiyonunun tepe noktası...", "Şekildeki sürtünmesiz eğik düzlemde serbest bırakılan m kütleli..."). Bu alıntı, soruyu gerçekten okuduğunun ispatıdır.
     * "topicName": Sorunun test ettiği GERÇEK VE SPESİFİK KONU (örn: "Parabolün Tepe Noktası ve Simetri Ekseni", "Dinamik: Sürtünmeli Eğik Düzlem", "Paragrafta Anlam: Çıkarım Yapma", "Mitoz Bölünme: Metafaz Evresi"). ASLA görselde olmayan hayali konu yazma!
     * "diagnosticNote": Öğrenci bu soruyu yanlış veya boş bıraktıysa, sorudaki hangi kavramı/ayrıntıyı kaçırdığını soru metnine atıfta bulunarak açıkla.

2. OPTİK FORM VE CEVAP ANAHTARI EŞLEŞTİRMESİ:
   - Optik form görselinden öğrencinin işaretlediği şıkları (A, B, C, D, E veya "-" boş) oku.
   - Cevap anahtarından doğru şıkları (A, B, C, D, E) oku.
   - Her soru için durumu belirle:
     * Öğrenci şıkkı == Doğru şık -> status: "correct"
     * Öğrenci şıkkı != Doğru şık (işaretleme var) -> status: "wrong"
     * Öğrenci şıkkı boş veya okunmuyor -> status: "blank"

3. GELİŞTİRİLMESİ GEREKEN NOKTALAR:
   - Soru kitapçığı görsellerinde yanlış ve boş bırakılan soruların konularını "kazanimlar" listesinde topla.
   - Her zayıf konu için "recommendation" alanına o soruya özel nokta atışı çalışma tavsiyesi ver.

4. MATEMATİKSEL DOĞRULUK:
   - Her branş için doğru, yanlış, boş ve Net = Doğru - (Yanlış / 4) hesapla.
   - Toplam Net, Toplam Doğru, Toplam Yanlış, Toplam Boş değerlerini doğru topla.

Lütfen SADECE aşağıdaki JSON formatında yanıt ver, markdown dışında fazladan metin yazma:
{
  "examName": "${examName}",
  "examType": "${examType}",
  "examDate": "${examDate}",
  "totalNet": 0,
  "totalCorrect": 0,
  "totalWrong": 0,
  "totalBlank": 0,
  "subjects": [
    {
      "subjectName": "string",
      "questionCount": 0,
      "correct": 0,
      "wrong": 0,
      "blank": 0,
      "net": 0,
      "accuracyRate": 0,
      "kazanimlar": [
        {
          "topicName": "string",
          "questionCount": 0,
          "correctCount": 0,
          "wrongCount": 0,
          "blankCount": 0,
          "status": "struggling",
          "recommendation": "string"
        }
      ]
    }
  ],
  "questions": [
    {
      "questionNumber": 1,
      "subject": "string",
      "studentAnswer": "string",
      "correctAnswer": "string",
      "status": "correct",
      "topicName": "string",
      "questionSnippet": "string",
      "diagnosticNote": "string"
    }
  ]
}`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let responseText = response.text || '';
    responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsed: any = {};
    try {
      parsed = JSON.parse(responseText);
    } catch (pe) {
      console.error('Failed to parse Gemini JSON response in Vercel handler:', pe, responseText);
      throw new Error('Yapay zeka çıktısı JSON formatında çözümlenemedi.');
    }

    // If subjects missing but questions present, construct subjects dynamically
    if (!Array.isArray(parsed.subjects) || parsed.subjects.length === 0) {
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
              kazanimlar: [],
            };
          }
          subMap[sName].questionCount++;
          if (q.status === 'correct') subMap[sName].correct++;
          else if (q.status === 'wrong') subMap[sName].wrong++;
          else subMap[sName].blank++;

          if (q.status === 'wrong' || q.status === 'blank') {
            subMap[sName].kazanimlar.push({
              topicName: q.topicName || 'Tespit Edilen Soru Konusu',
              questionCount: 1,
              correctCount: 0,
              wrongCount: q.status === 'wrong' ? 1 : 0,
              blankCount: q.status === 'blank' ? 1 : 0,
              status: 'struggling',
              recommendation: q.diagnosticNote || `${q.topicName} konusunda tekrar yapılmalı.`,
            });
          }
        });

        parsed.subjects = Object.values(subMap).map((s: any) => {
          s.net = Number((s.correct - (s.wrong * 0.25)).toFixed(2));
          s.accuracyRate = s.questionCount > 0 ? Math.round((s.correct / s.questionCount) * 100) : 0;
          return s;
        });
      } else {
        throw new Error('Yüklenen görsellerden soru veya optik form verisi okunamadı. Lütfen fotoğrafların net ve aydınlık olduğundan emin olun.');
      }
    }

    if (Array.isArray(parsed.questions)) {
      parsed.questions.forEach((q: any, i: number) => {
        q.id = q.id || `q-${q.questionNumber || i + 1}-${Date.now()}`;
      });
      const correctCount = parsed.questions.filter((q: any) => q.status === 'correct').length;
      const wrongCount = parsed.questions.filter((q: any) => q.status === 'wrong').length;
      const blankCount = parsed.questions.filter((q: any) => q.status === 'blank').length;
      parsed.totalCorrect = correctCount;
      parsed.totalWrong = wrongCount;
      parsed.totalBlank = blankCount;
      parsed.totalNet = Number((correctCount - (wrongCount * 0.25)).toFixed(2));
    }

    parsed.id = `eval-${Date.now()}`;
    parsed.bookletImages = examImages;
    parsed.createdAt = new Date().toISOString();

    res.json({ result: parsed, fallback: false });
  } catch (error: any) {
    console.error('Vercel Handler Scan Optical & Key Error:', error);
    res.status(500).json({
      error: error.message || 'Görseller taranırken bir hata oluştu. Lütfen net görsel yükleyip tekrar deneyin.',
    });
  }
}
