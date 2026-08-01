import React, { useState, useRef, useEffect } from 'react';
import { NavTab, Student12thGrade, AnnualPlanDocument, PastYksExamDocument } from '../types';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { getSmartOfflineReply } from '../utils/aiFallback';
import {
  X,
  Send,
  Sparkles,
  Bot,
  FileText,
  Download,
  UserCheck,
  ChevronRight,
  Maximize2,
  Minimize2,
  Loader2,
  ListFilter,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface AiAssistantWidgetProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  students: Student12thGrade[];
  selectedStudent: Student12thGrade | null;
  onSelectStudent: (student: Student12thGrade | null) => void;
  annualPlans: AnnualPlanDocument[];
  yksExams: PastYksExamDocument[];
  teacherName: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionExecuted?: string;
  hasPdfDownload?: boolean;
  hasDocxDownload?: boolean;
}

export const AiAssistantWidget: React.FC<AiAssistantWidgetProps> = ({
  activeTab,
  onSelectTab,
  students,
  selectedStudent,
  onSelectStudent,
  annualPlans,
  yksExams,
  teacherName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Yellow Panda SVG Graphic Vector Component
  const YellowPandaSvg = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
      <defs>
        <linearGradient id="pandaYellowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="pandaPatchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Background Circle Frame */}
      <circle cx="50" cy="50" r="50" fill="#090d16" />

      {/* Panda Ears */}
      <circle cx="24" cy="22" r="14" fill="#0f172a" stroke="#fbbf24" strokeWidth="2.5" />
      <circle cx="24" cy="22" r="8" fill="#d97706" opacity="0.8" />

      <circle cx="76" cy="22" r="14" fill="#0f172a" stroke="#fbbf24" strokeWidth="2.5" />
      <circle cx="76" cy="22" r="8" fill="#d97706" opacity="0.8" />

      {/* Panda Head (Golden Yellow Fur) */}
      <ellipse cx="50" cy="54" rx="38" ry="34" fill="url(#pandaYellowGrad)" stroke="#b45309" strokeWidth="2" />

      {/* Inner Muzzle / Snout Area */}
      <ellipse cx="50" cy="62" rx="16" ry="12" fill="#fffbeb" opacity="0.9" />

      {/* Dark Eye Patches */}
      <ellipse cx="33" cy="46" rx="11" ry="13" transform="rotate(-12 33 46)" fill="url(#pandaPatchGrad)" />
      <ellipse cx="67" cy="46" rx="11" ry="13" transform="rotate(12 67 46)" fill="url(#pandaPatchGrad)" />

      {/* White Eyes */}
      <circle cx="34" cy="45" r="5" fill="#ffffff" />
      <circle cx="66" cy="45" r="5" fill="#ffffff" />

      {/* Pupils */}
      <circle cx="35" cy="45" r="2.8" fill="#020617" />
      <circle cx="65" cy="45" r="2.8" fill="#020617" />

      {/* Eye Reflection Dots */}
      <circle cx="36" cy="43.8" r="1" fill="#ffffff" />
      <circle cx="66" cy="43.8" r="1" fill="#ffffff" />

      {/* Panda Nose */}
      <path d="M 45 56 C 45 53, 55 53, 55 56 C 55 60, 45 60, 45 56 Z" fill="#0f172a" />

      {/* Cute Mouth */}
      <path d="M 50 59 L 50 64" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 42 63 Q 50 71 58 63" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />

      {/* Soft Rosy Blush Cheeks */}
      <ellipse cx="22" cy="58" rx="5" ry="3.5" fill="#f43f5e" opacity="0.5" />
      <ellipse cx="78" cy="58" rx="5" ry="3.5" fill="#f43f5e" opacity="0.5" />

      {/* Small Bamboo Leaf Accent on Head */}
      <path d="M 46 22 Q 52 14 62 18 Q 54 26 46 22 Z" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
    </svg>
  );

  // Chat history with initial greeting requirement
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: 'Merhaba hocam nasıl yardımcı olabilirim',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Execute embedded AI action tags like [ACTION:NAVIGATE:tubitak] or [ACTION:SELECT_STUDENT:Caner Yıldız]
  const processAction = (text: string) => {
    let cleanText = text;
    let actionInfo = '';
    let triggerPdf = false;
    let triggerDocx = false;

    // 1. Navigation Action
    const navMatch = text.match(/\[ACTION:NAVIGATE:([a-z-]+)\]/i);
    if (navMatch && navMatch[1]) {
      const targetTab = navMatch[1] as NavTab;
      onSelectTab(targetTab);
      actionInfo = `Sayfaya yönlendirildi: ${getTabLabel(targetTab)}`;
      cleanText = cleanText.replace(navMatch[0], '').trim();
    }

    // 2. Student Selection Action
    const stdMatch = text.match(/\[ACTION:SELECT_STUDENT:(.+?)\]/i);
    if (stdMatch && stdMatch[1]) {
      const query = stdMatch[1].trim().toLowerCase();
      const found = students.find(
        (s) =>
          s.id === stdMatch[1].trim() ||
          s.name.toLowerCase().includes(query) ||
          s.name.toLowerCase().startsWith(query)
      );
      if (found) {
        onSelectTab('students');
        onSelectStudent(found);
        actionInfo = `Öğrenci Detayı Açıldı: ${found.name}`;
      } else if (students.length > 0) {
        onSelectTab('students');
        actionInfo = `Öğrenciler Listesi Açıldı`;
      }
      cleanText = cleanText.replace(stdMatch[0], '').trim();
    }

    // 3. Export PDF Action
    if (text.includes('[ACTION:EXPORT_PDF]')) {
      triggerPdf = true;
      cleanText = cleanText.replace('[ACTION:EXPORT_PDF]', '').trim();
      generateSummaryPDF();
      actionInfo = 'PDF Raporu İndirildi';
    }

    // 4. Export Word Action
    if (text.includes('[ACTION:EXPORT_WORD]')) {
      triggerDocx = true;
      cleanText = cleanText.replace('[ACTION:EXPORT_WORD]', '').trim();
      generateSummaryDOCX();
      actionInfo = 'Word (DOCX) Raporu İndirildi';
    }

    return { cleanText, actionInfo, triggerPdf, triggerDocx };
  };

  const getTabLabel = (tab: NavTab) => {
    switch (tab) {
      case 'students':
        return 'Öğrenciler';
      case 'annual-plans':
        return 'Yıllık Planlar';
      case 'yks-exams':
        return 'YKS Geçmiş Denemeler';
      case 'ai-tools':
        return 'Akıllı Müfredat & Soru';
      case 'ai-apps':
        return 'Yapay Zeka Araçları';
      case 'tubitak':
        return 'TÜBİTAK Projeleri';
      case 'teknofest':
        return 'TEKNOFEST Projeleri';
      default:
        return 'Sayfa';
    }
  };

  // Helper to Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || isLoading) return;

    const userMessageObj: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessageObj]);
    if (!textToSend) setInputMsg('');
    setIsLoading(true);

    // Build context data for server AI
    const contextData = {
      activeTab,
      selectedStudentName: selectedStudent ? selectedStudent.name : 'Yok',
      studentCount: students.length,
      studentsSummary: students.slice(0, 15).map((s) => ({
        id: s.id,
        name: s.name,
        class: s.className,
        targetUni: s.targetUniversity,
        targetDept: s.targetDepartment,
        tytNet: s.tytAverageNet,
        aytNet: s.aytAverageNet,
        weakTopics: s.weakTopics,
      })),
      yksExamsCount: yksExams.length,
      annualPlansCount: annualPlans.length,
    };

    try {
      const response = await fetch('/api/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text.trim(),
          chatHistory: messages.slice(-6),
          contextData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const data = await response.json();
      const rawReply = data.reply || 'Anlaşıldı Serdar Hocam, başka nasıl yardımcı olabilirim?';

      const { cleanText, actionInfo, triggerPdf, triggerDocx } = processAction(rawReply);

      const assistantMsgObj: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: cleanText || 'İstediğiniz eylem gerçekleştirildi hocam.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: actionInfo || undefined,
        hasPdfDownload: triggerPdf,
        hasDocxDownload: triggerDocx,
      };

      setMessages((prev) => [...prev, assistantMsgObj]);
    } catch (e) {
      console.warn('Assistant API fallback triggered:', e);
      const offlineResult = getSmartOfflineReply(text.trim(), contextData);
      const { cleanText, actionInfo, triggerPdf, triggerDocx } = processAction(offlineResult.replyText);

      if (offlineResult.targetTab) {
        onSelectTab(offlineResult.targetTab);
      }
      if (offlineResult.targetStudentName) {
        const found = students.find((s) =>
          s.name.toLowerCase().includes(offlineResult.targetStudentName!.toLowerCase())
        );
        if (found) {
          onSelectTab('students');
          onSelectStudent(found);
        }
      }
      if (offlineResult.triggerPdf || triggerPdf) {
        generateSummaryPDF();
      }
      if (offlineResult.triggerDocx || triggerDocx) {
        generateSummaryDOCX();
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'assistant',
          text: cleanText || offlineResult.replyText,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          actionExecuted: offlineResult.actionExecuted || actionInfo || undefined,
          hasPdfDownload: offlineResult.triggerPdf || triggerPdf,
          hasDocxDownload: offlineResult.triggerDocx || triggerDocx,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate PDF Summary Export
  const generateSummaryPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('OKUL MENTORLUK & YKS AKILLI RAPORU', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Olusturan: Serdar Aktas | Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 28);
    doc.line(14, 32, 196, 32);

    let yPos = 40;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Ogrenci Performans Ve Net Ozeti', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    students.forEach((std, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${std.name} (${std.className}) - Hedef: ${std.targetUniversity} / ${std.targetDepartment}`, 14, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`   TYT Net: ${std.tytAverageNet} | AYT Net: ${std.aytAverageNet} | Zayif Konular: ${std.weakTopics.slice(0, 3).join(', ')}`, 14, yPos);
      yPos += 7;
    });

    yPos += 6;
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('2. Kayitli Projeler Ve Dokumanlar', 14, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Toplam Kayitli YKS Deneme Sınavı: ${yksExams.length} adet`, 14, yPos);
    yPos += 6;
    doc.text(`• Toplam Yillik Müfredat Plani: ${annualPlans.length} adet`, 14, yPos);
    yPos += 12;

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('Bu rapor Akilli AI Asistani tarafindan otomatik olusturulmustur.', 14, yPos);

    doc.save(`Mentorluk_Genel_Ozet_Raporu_${Date.now()}.pdf`);
  };

  // Generate Word DOCX Summary Export
  const generateSummaryDOCX = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: 'OKUL MENTÖRLÜK VE YKS ÖĞRENCİ AKILLI RAPORU',
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Raporu Düzenleyen: Serdar Aktaş | Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
                  italics: true,
                }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '1. Öğrenci Listesi ve Akademik Durumu',
              heading: HeadingLevel.HEADING_2,
            }),
            ...students.map(
              (s, i) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: `${i + 1}. ${s.name} (${s.className}): `, bold: true }),
                    new TextRun({
                      text: `Hedef: ${s.targetUniversity} - ${s.targetDepartment} | TYT Net: ${s.tytAverageNet} | AYT Net: ${s.aytAverageNet} | Zayıf Konular: ${s.weakTopics.join(', ')}`,
                    }),
                  ],
                })
            ),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '2. Genel İstatistikler',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: `• Toplam Kayıtlı Öğrenci Sayısı: ${students.length}`,
            }),
            new Paragraph({
              text: `• Geçmiş YKS İl/İlçe Deneme Sayısı: ${yksExams.length}`,
            }),
            new Paragraph({
              text: `• Müfredat Yıllık Plan Sayısı: ${annualPlans.length}`,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Bu belge Akıllı Yapay Zeka Asistanı tarafından üretilmiştir.',
                  italics: true,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mentorluk_Genel_Ozet_Raporu_${Date.now()}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* ========================================================================= */}
      {/* 1. CLOSED LAUNCHER BUTTON (COMPACT FLOATING ANIME AVATAR BUTTON)          */}
      {/* ========================================================================= */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 border-2 border-amber-500/60 hover:border-amber-400 text-white rounded-full p-2.5 pr-5 shadow-2xl shadow-amber-950/80 transition-all duration-300 hover:scale-105 cursor-pointer active:scale-95"
          title="Mentör Yapay Zeka Asistanı"
        >
          {/* Yellow Panda Avatar Graphic Frame */}
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400 bg-amber-500/20 shrink-0 shadow-inner flex items-center justify-center">
            <YellowPandaSvg />
            {/* Glowing online dot */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-amber-200 group-hover:text-amber-100 transition flex items-center gap-1">
              Mentör Asistan <Sparkles className="w-3 h-3 text-amber-300 animate-bounce" />
            </span>
            <span className="text-[10px] text-amber-300/80 font-medium">Kişisel Konuşma Asistanı</span>
          </div>
        </button>
      )}

      {/* ========================================================================= */}
      {/* 2. OPEN CHAT POPUP WINDOW                                                 */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          className={`bg-slate-900/95 border border-amber-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isExpanded
              ? 'w-[90vw] md:w-[680px] h-[85vh] max-h-[750px]'
              : 'w-[92vw] sm:w-[400px] md:w-[430px] h-[540px] max-h-[85vh]'
          }`}
        >
          {/* --- CHAT HEADER --- */}
          <div className="bg-gradient-to-r from-slate-950 via-amber-950/90 to-slate-950 border-b border-amber-500/30 p-3.5 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Yellow Panda Avatar Box */}
              <div className="relative w-10 h-10 rounded-full border-2 border-amber-400 bg-amber-950/50 overflow-hidden shrink-0 shadow-lg">
                <YellowPandaSvg />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-slate-900 rounded-full" />
              </div>

              <div>
                <h3 className="text-xs font-black text-amber-100 flex items-center gap-1.5">
                  Mentör 🐼
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] rounded-full font-bold">
                    CANLI YAPAY ZEKA
                  </span>
                </h3>
                <p className="text-[10px] text-amber-300/80 font-medium truncate max-w-[200px]">
                  {teacherName} Hocam • Mentör Çevrimiçi
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title={isExpanded ? 'Küçült' : 'Genişlet'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-300 rounded-lg transition cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* --- CHAT MESSAGES CONTAINER --- */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble Container */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 space-y-1.5 leading-relaxed shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Executed Action Badge */}
                  {msg.actionExecuted && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-700/60 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{msg.actionExecuted}</span>
                    </div>
                  )}

                  {/* Inline PDF / DOCX Download Triggers */}
                  {(msg.hasPdfDownload || msg.hasDocxDownload) && (
                    <div className="mt-2 flex flex-wrap gap-2 pt-2 border-t border-slate-700">
                      {msg.hasPdfDownload && (
                        <button
                          onClick={generateSummaryPDF}
                          className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-200 border border-rose-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF Belgesini İndir</span>
                        </button>
                      )}
                      {msg.hasDocxDownload && (
                        <button
                          onClick={generateSummaryDOCX}
                          className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-200 border border-blue-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Word (DOCX) İndir</span>
                        </button>
                      )}
                    </div>
                  )}

                  <span
                    className={`block text-[9px] text-right opacity-70 ${
                      msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 p-2.5 rounded-2xl max-w-[220px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span className="text-[11px] font-medium">Mentör yazıyor...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* --- QUICK COMMAND SHORTCUTS --- */}
          <div className="p-2 px-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-500 shrink-0">Hızlı Komutlar:</span>

            <button
              onClick={() => handleSendMessage('Nasılsın Mentör?')}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
            >
              <span>🐼 Nasılsın?</span>
            </button>

            <button
              onClick={() => handleSendMessage('Öğrencilerin akademik özetini PDF olarak indir')}
              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3 h-3 text-rose-400" />
              <span>PDF İndir</span>
            </button>

            <button
              onClick={() => handleSendMessage('Öğrencilerin akademik özetini Word (.docx) olarak indir')}
              className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[10px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3 h-3 text-blue-400" />
              <span>Word İndir</span>
            </button>

            <button
              onClick={() => handleSendMessage('TÜBİTAK projeleri sayfasına git')}
              className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-bold shrink-0 transition cursor-pointer"
            >
              TÜBİTAK'a Git
            </button>

            <button
              onClick={() => handleSendMessage('YKS deneme sınavlarını aç')}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold shrink-0 transition cursor-pointer"
            >
              YKS Denemeleri
            </button>

            <button
              onClick={() => handleSendMessage('Caner Yıldız detay sayfasını aç')}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold shrink-0 transition cursor-pointer"
            >
              Caner'i Aç
            </button>
          </div>

          {/* --- CHAT INPUT FORM --- */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Bir komut yazın (Örn: Zeynep'i aç, Raporu PDF indir)..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() || isLoading}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shrink-0"
              title="Gönder"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
