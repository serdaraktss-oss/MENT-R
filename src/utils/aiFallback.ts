export interface SmartReplyResult {
  replyText: string;
  actionExecuted?: string;
  triggerPdf?: boolean;
  triggerDocx?: boolean;
  targetTab?: 'students' | 'annual-plans' | 'yks-exams' | 'ai-tools' | 'ai-apps' | 'tubitak' | 'teknofest';
  targetStudentName?: string;
}

/**
 * Intelligent offline/fallback response generator for AI Mentor Assistant.
 * Ensures natural Turkish conversational replies without echoing user text.
 */
export function getSmartOfflineReply(userMessage: string, contextData: any = {}): SmartReplyResult {
  const lowerMsg = userMessage.toLowerCase().trim();
  let reply = '';

  if (lowerMsg.includes('tubitak') || lowerMsg.includes('tübitak')) {
    reply = 'Sizi hemen TÜBİTAK Projeleri sayfasına yönlendiriyorum hocam!';
    return { replyText: reply, actionExecuted: 'Sayfaya yönlendirildi: TÜBİTAK Projeleri', targetTab: 'tubitak' };
  }
  if (lowerMsg.includes('teknofest')) {
    reply = 'TEKNOFEST Projeleri sayfasına geçiş yapıyorum hocam!';
    return { replyText: reply, actionExecuted: 'Sayfaya yönlendirildi: TEKNOFEST Projeleri', targetTab: 'teknofest' };
  }
  if (lowerMsg.includes('yks') || lowerMsg.includes('deneme')) {
    reply = 'Deneme Sınavları sayfasına geçiyorum hocam!';
    return { replyText: reply, actionExecuted: 'Sayfaya yönlendirildi: YKS Geçmiş Denemeler', targetTab: 'yks-exams' };
  }
  if (lowerMsg.includes('plan') || lowerMsg.includes('müfredat')) {
    reply = 'Yıllık Planlar sayfasına geçiyorum hocam!';
    return { replyText: reply, actionExecuted: 'Sayfaya yönlendirildi: Yıllık Planlar', targetTab: 'annual-plans' };
  }
  if (lowerMsg.includes('yapay zeka') || lowerMsg.includes('araç')) {
    reply = 'Yapay Zeka Araçları portalına yönlendiriyorum hocam!';
    return { replyText: reply, actionExecuted: 'Sayfaya yönlendirildi: Yapay Zeka Araçları', targetTab: 'ai-apps' };
  }
  if (lowerMsg.includes('pdf')) {
    reply = 'İstediğiniz performans ve mentörlük raporunu PDF olarak indiriyorum hocam!';
    return { replyText: reply, actionExecuted: 'PDF Raporu İndirildi', triggerPdf: true };
  }
  if (lowerMsg.includes('word') || lowerMsg.includes('docx')) {
    reply = 'Raporunuzu Word (.docx) formatında indiriyorum hocam!';
    return { replyText: reply, actionExecuted: 'Word (DOCX) Raporu İndirildi', triggerDocx: true };
  }
  if (lowerMsg.includes('nasılsın') || lowerMsg.includes('nasilsin') || lowerMsg.includes('naber')) {
    reply = 'Harikayım Serdar Hocam, çok teşekkür ederim! Siz nasılsınız, gününüz ve öğrencilerimizin çalışmaları nasıl gidiyor?';
    return { replyText: reply };
  }
  if (lowerMsg.includes('selam') || lowerMsg.includes('merhaba') || lowerMsg.includes('günaydın') || lowerMsg.includes('gunaydin') || lowerMsg.includes('iyi günler') || lowerMsg.includes('iyi akşamlar')) {
    reply = 'Merhaba Serdar Hocam! Ben Mentör yapay zeka asistanınız. Öğrenci takipleri, deneme analizleri, ödev planlama ve müfredat takipleriniz için buradayım. Bugün nasıl yardımcı olabilirim?';
    return { replyText: reply };
  }
  if (lowerMsg.includes('teşekkür') || lowerMsg.includes('tesekkur') || lowerMsg.includes('sağol') || lowerMsg.includes('sagol')) {
    reply = 'Rica ederim Serdar Hocam! Her zaman yardımcı olmaktan mutluluk duyarım. Kolaylıklar dilerim!';
    return { replyText: reply };
  }
  if (lowerMsg.includes('öğrenci') || lowerMsg.includes('ogrenci') || lowerMsg.includes('liste')) {
    reply = 'Öğrenciler listesine yönlendiriyorum hocam!';
    return { replyText: reply, actionExecuted: 'Sayfaya yönlendirildi: Öğrenciler', targetTab: 'students' };
  }

  // Check student match in contextData
  const matchedStudent = (contextData?.studentsSummary || []).find((s: any) =>
    lowerMsg.includes(s.name.toLowerCase()) || lowerMsg.includes(s.name.split(' ')[0].toLowerCase())
  );
  if (matchedStudent) {
    reply = `${matchedStudent.name} isimli öğrencimizin detay gelişim kartını açıyorum hocam!`;
    return {
      replyText: reply,
      actionExecuted: `Öğrenci Detayı Açıldı: ${matchedStudent.name}`,
      targetTab: 'students',
      targetStudentName: matchedStudent.name,
    };
  }

  reply = 'Anlaşıldı Serdar Hocam. Öğrencilerimizin net durumları, haftalık ödev planları, deneme analizleri ve müfredat takipleri için her zaman buradayım. Başka nasıl yardımcı olabilirim?';
  return { replyText: reply };
}
