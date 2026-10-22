import { jsPDF } from 'jspdf';
import { Student12thGrade } from '../types';

export function generateStudentProgramPDF(student: Student12thGrade) {
  // Use Landscape for standard table presentation across 7 days
  const doc = new jsPDF({
    orientation: 'l', // Landscape
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 12;
  let y = margin;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Title Logo
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('MENTÖR', margin, 17);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('12. SINIF YKS KİŞİSELLEŞTİRİLMİŞ HAFTALIK DERS VE SORU ÇALIŞMA PROGRAMI TABLOSU', margin + 35, 17);

  doc.setFontSize(8.5);
  doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, pageWidth - margin - 45, 17);

  y = 31;

  // Student Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(student.name, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Sınıf: ${student.className}  |  Okul No: ${student.studentNo}  |  Alan: ${student.branch}`, margin + 4, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`Son TYT Neti: ${student.latestTyt.totalNet}`, margin + 4, y + 18);

  doc.setTextColor(79, 70, 229);
  doc.text(`Son AYT Neti: ${student.latestAyt.totalNet}`, margin + 50, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Öğretmen Notu: ${student.mentorNote || 'Zayıf olunan konulara ağırlık verilmiştir.'}`, margin + 110, y + 12);

  y += 27;

  // Table Title Notice
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('* Not: Saatler öğrencinin kendi günlük temposuna bırakılmıştır. TYT Türkçe ve TYT Matematik her gün zorunludur.', margin, y);
  y += 5;

  // TABLE HEADER
  const colWidths = [32, 48, 120, 38, 35]; // Total = 273mm (fits 297mm - 24mm margin)
  const colHeaders = [
    'GÜN',
    'ÇALIŞILACAK DERS',
    'DENEMEDEKİ EKSİK / ÇALIŞILACAK KONU',
    'HEDEF SORU',
    'ODAK TÜRÜ',
  ];

  doc.setFillColor(30, 41, 59);
  doc.setDrawColor(30, 41, 59);
  doc.rect(margin, y, colWidths.reduce((a, b) => a + b, 0), 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  let xPos = margin;
  colHeaders.forEach((header, idx) => {
    doc.text(header, xPos + 2, y + 5.5);
    xPos += colWidths[idx];
  });

  y += 8;

  // TABLE ROWS
  student.weeklyProgram.forEach((dayProgram, dayIdx) => {
    const isEvenDay = dayIdx % 2 === 0;

    dayProgram.tasks.forEach((task, taskIdx) => {
      // Page break check
      if (y + 9 > pageHeight - margin) {
        doc.addPage('a4', 'l');
        y = margin;

        // Redraw Header on new page
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, y, colWidths.reduce((a, b) => a + b, 0), 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);

        let xSub = margin;
        colHeaders.forEach((header, idx) => {
          doc.text(header, xSub + 2, y + 5.5);
          xSub += colWidths[idx];
        });
        y += 8;
      }

      const rowHeight = 8;

      // Row Background
      if (task.isMandatoryCommon) {
        doc.setFillColor(240, 253, 244); // Light Green for TYT Common
        doc.setDrawColor(187, 247, 208);
      } else if (task.isWeakTopic || task.focusType.includes('Eksik')) {
        doc.setFillColor(254, 242, 242); // Light Red for Weak Topics
        doc.setDrawColor(254, 202, 202);
      } else if (isEvenDay) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
      } else {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
      }

      doc.rect(margin, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'FD');

      let currentX = margin;

      // Col 1: Day Name (Only print on first task of day)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      if (taskIdx === 0) {
        doc.text(dayProgram.dayName.toUpperCase(), currentX + 2, y + 5);
      }
      currentX += colWidths[0];

      // Col 2: Subject
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      if (task.isMandatoryCommon) {
        doc.setTextColor(22, 101, 52); // Dark Green
      } else if (task.isWeakTopic) {
        doc.setTextColor(153, 27, 27); // Dark Red
      } else {
        doc.setTextColor(30, 41, 59);
      }
      doc.text(task.subject, currentX + 2, y + 5);
      currentX += colWidths[1];

      // Col 3: Topic (Deneme Eksik Konusu)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const topicStr = task.topic.length > 70 ? task.topic.substring(0, 67) + '...' : task.topic;
      doc.text(topicStr, currentX + 2, y + 5);
      currentX += colWidths[2];

      // Col 4: Target Question Count
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text(`${task.questionTarget || 30} Soru`, currentX + 2, y + 5);
      currentX += colWidths[3];

      // Col 5: Focus Type Badge
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      if (task.isMandatoryCommon) {
        doc.setTextColor(21, 128, 61);
        doc.text('Her Gün Ortak', currentX + 2, y + 5);
      } else if (task.isWeakTopic) {
        doc.setTextColor(185, 28, 28);
        doc.text('Eksik Konu Odaklı', currentX + 2, y + 5);
      } else {
        doc.setTextColor(100, 116, 139);
        doc.text('Genel Tekrar', currentX + 2, y + 5);
      }

      y += rowHeight;
    });
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`MENTÖR Eğitim Portal Hizmetleri - YKS Öğrenci Takip Sistemi  |  Sayfa ${i} / ${totalPages}`, margin, pageHeight - 5);
  }

  // Save PDF
  const safeFileName = `MENTOR_${student.name.replace(/\s+/g, '_')}_Haftalik_Ders_Programi_Tablosu.pdf`;
  doc.save(safeFileName);
}
