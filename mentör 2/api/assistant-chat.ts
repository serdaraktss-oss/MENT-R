import { GoogleGenAI } from '@google/genai';

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

  try {
    const { userMessage, chatHistory = [], contextData = {} } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
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
        reply = 'Harikayım Serdar Hocam, çok teşekkür ederim! Siz nasılsınız, gününüz ve öğrencilerimizin çalışmaları nasıl gidiyor?';
      } else if (lowerMsg.includes('selam') || lowerMsg.includes('merhaba') || lowerMsg.includes('günaydın') || lowerMsg.includes('gunaydin') || lowerMsg.includes('iyi günler')) {
        reply = 'Merhaba Serdar Hocam! Ben Mentör yapay zeka asistanınız. Öğrenci takipleri, deneme analizleri, program oluşturma ve ders planlamalarında size yardımcı olmak için buradayım. Nasıl yardımcı olabilirim?';
      } else {
        const matchedStudent = (contextData.studentsSummary || []).find((s: any) =>
          lowerMsg.includes(s.name.toLowerCase()) || lowerMsg.includes(s.name.split(' ')[0].toLowerCase())
        );
        if (matchedStudent) {
          reply = `${matchedStudent.name} isimli öğrencimizin gelişim kartını açıyorum hocam!`;
          action = `[ACTION:SELECT_STUDENT:${matchedStudent.name}]`;
        } else {
          reply = 'Merhaba Serdar Hocam! Ben Mentör. Tüm öğrenci takipleri, denemeler, müfredat ve sorularınız için buradayım. Bugün nasıl yardımcı olabilirim?';
        }
      }

      return res.status(200).json({ reply: `${reply} ${action}`.trim(), fallback: true });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemPrompt = `Adın: Mentör.
Sen kullanıcılarla günlük dilde akıcı, samimi, empati kurabilen ve yardımsever bir şekilde iletişim kuran kişisel bir konuşma asistanısın. Amacın, hem günlük sohbetlerde keyifli bir arkadaş gibi eşlik etmek hem de sorulan her türlü bilgi sorusuna net, doğru ve anlaşılır yanıtlar vermektir. Kullanıcı "Serdar Aktaş" veya öğretmenlerimize "Hocam" şeklinde hitap et.

# KONUŞMA TARZI VE TONU
- Doğal, içten, samimi ve saygılı.
- Kullanıcının moduna uygun adaptif ve çözüm odaklı.

# PLATFORM VERİLERİ:
- Aktif Sayfa: ${contextData.activeTab || 'Öğrenciler'}
- Seçili Öğrenci: ${contextData.selectedStudentName || 'Yok'}
- Toplam Öğrenci Sayısı: ${contextData.studentCount || 0}
- Denemeler Sayısı: ${contextData.yksExamsCount || 0}
- Yıllık Planlar Sayısı: ${contextData.annualPlansCount || 0}

YAPABİLECEĞİN EYLEM ETİKETLERİ:
- [ACTION:NAVIGATE:students]
- [ACTION:NAVIGATE:annual-plans]
- [ACTION:NAVIGATE:yks-exams]
- [ACTION:NAVIGATE:ai-tools]
- [ACTION:NAVIGATE:ai-apps]
- [ACTION:NAVIGATE:tubitak]
- [ACTION:NAVIGATE:teknofest]
- [ACTION:SELECT_STUDENT:Öğrenci Adı]
- [ACTION:EXPORT_PDF]
- [ACTION:EXPORT_WORD]`;

    const formattedHistory = chatHistory.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1500,
        temperature: 0.7,
      }
    });

    let rawText = (response.text || 'Anlaşıldı hocam, yardımcı olmaya hazırım.').trim();
    if ((rawText.startsWith('"') && rawText.endsWith('"')) || (rawText.startsWith('“') && rawText.endsWith('”'))) {
      rawText = rawText.slice(1, -1).trim();
    }

    return res.status(200).json({ reply: rawText, fallback: false });
  } catch (error: any) {
    console.error('Vercel Assistant Chat Error:', error);
    return res.status(500).json({ error: 'Asistan yanıtı oluşturulurken hata oluştu.', details: error.message });
  }
}
