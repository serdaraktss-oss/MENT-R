import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  BorderStyle,
  AlignmentType,
  ShadingType,
} from 'docx';
import { TubitakProject, TeknofestProject, IsZamanItem } from '../types';

// Helper to trigger browser download of a Blob
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// TÜBİTAK EXPORTERS (DOCX & PDF)
// ============================================================================

export async function exportTubitakDOCX(project: TubitakProject) {
  const months = [
    'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK', 'OCAK'
  ];

  const tableHeaderRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'İşin Adı', bold: true, size: 18, font: 'Times New Roman' })] })],
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR, color: 'auto' },
      }),
      ...months.map((m) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: m, bold: true, size: 14, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        width: { size: 7, type: WidthType.PERCENTAGE },
        shading: { fill: 'E2E8F0', type: ShadingType.CLEAR, color: 'auto' },
      }))
    ]
  });

  const tableDataRows = (project.isZamanCizelgesi || []).map((item) => {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: item.isAdi, size: 18, font: 'Times New Roman' })] })],
        }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.nisan ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.mayis ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.haziran ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.temmuz ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.agustos ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.eylul ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.ekim ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.kasim ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.aralik ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.ocak ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
      ]
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 2.5 cm approx
          }
        },
        children: [
          // Header Fields
          new Paragraph({
            children: [
              new TextRun({ text: 'Proje Ana Alanı : ', bold: true, size: 24, font: 'Times New Roman' }),
              new TextRun({ text: project.projeAnaAlani, size: 24, font: 'Times New Roman' }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Proje Tematik Alanı : ', bold: true, size: 24, font: 'Times New Roman' }),
              new TextRun({ text: project.projeTematikAlani, size: 24, font: 'Times New Roman' }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Proje Adı (Başlığı) : ', bold: true, size: 24, font: 'Times New Roman' }),
              new TextRun({ text: project.projeAdi, bold: true, size: 24, font: 'Times New Roman' }),
            ]
          }),
          new Paragraph({ text: '' }),

          // Özet
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Özet', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.ozet, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Anahtar Kelimeler: ', bold: true, size: 24, font: 'Times New Roman' }),
              new TextRun({ text: (project.anahtarKelimeler || []).join(', '), size: 24, font: 'Times New Roman' }),
            ]
          }),
          new Paragraph({ text: '' }),

          // Amaç
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Amaç', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.amac, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Giriş
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Giriş', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.giris, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Yöntem
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Yöntem', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.yontem, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Proje İş-Zaman Çizelgesi
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Proje İş-Zaman Çizelgesi', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Table({
            rows: [tableHeaderRow, ...tableDataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: '' }),

          // Bulgular
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Bulgular', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.bulgular, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Sonuç ve Tartışma
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Sonuç ve Tartışma', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.sonucVeTartisma, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Öneriler
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Öneriler', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.oneriler, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Kaynaklar
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Kaynaklar', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.kaynaklar, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),

          ...(project.ekler ? [
            new Paragraph({ text: '' }),
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({ text: 'Ekler', bold: true, size: 24, font: 'Times New Roman' })],
            }),
            new Paragraph({
              children: [new TextRun({ text: project.ekler, size: 24, font: 'Times New Roman' })],
            }),
          ] : []),
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const safeName = `TUBITAK_2204_${project.projeAdi.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, '_')}.docx`;
  downloadBlob(blob, safeName);
}

export function exportTubitakPDF(project: TubitakProject) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20; // 2.0 cm approx
  let y = margin;

  const addHeader = (title: string) => {
    if (y + 15 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(title, margin, y);
    y += 6;
  };

  const addBodyText = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text || '', pageWidth - margin * 2);
    
    lines.forEach((line: string) => {
      if (y + 6 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  };

  // Title Banner
  doc.setFillColor(30, 58, 138); // Dark Blue
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TÜBİTAK 2204 ARAŞTIRMA PROJELERİ RAPORU', margin, 15);

  y = 32;

  // Metadata Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Proje Ana Alanı: ${project.projeAnaAlani}`, margin, y); y += 6;
  doc.text(`Proje Tematik Alanı: ${project.projeTematikAlani}`, margin, y); y += 6;
  doc.text(`Proje Adı: ${project.projeAdi}`, margin, y); y += 10;

  addHeader('Özet');
  addBodyText(project.ozet);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Anahtar Kelimeler: ${(project.anahtarKelimeler || []).join(', ')}`, margin, y);
  y += 10;

  addHeader('Amaç');
  addBodyText(project.amac);

  addHeader('Giriş (Literatür Taraması)');
  addBodyText(project.giris);

  addHeader('Yöntem ve Materyal');
  addBodyText(project.yontem);

  addHeader('Bulgular');
  addBodyText(project.bulgular);

  addHeader('Sonuç ve Tartışma');
  addBodyText(project.sonucVeTartisma);

  addHeader('Öneriler');
  addBodyText(project.oneriler);

  addHeader('Kaynaklar (APA)');
  addBodyText(project.kaynaklar);

  const safeName = `TUBITAK_2204_${project.projeAdi.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, '_')}.pdf`;
  doc.save(safeName);
}

// ============================================================================
// TEKNOFEST EXPORTERS (DOCX & PDF)
// ============================================================================

export async function exportTeknofestDOCX(project: TeknofestProject) {
  const months = ['NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK', 'OCAK'];

  const tableHeaderRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'İş Paketi / Süreç', bold: true, size: 18, font: 'Times New Roman' })] })],
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { fill: '003366', type: ShadingType.CLEAR, color: 'auto' },
      }),
      ...months.map((m) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: m, bold: true, size: 14, color: 'FFFFFF', font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        width: { size: 7, type: WidthType.PERCENTAGE },
        shading: { fill: '003366', type: ShadingType.CLEAR, color: 'auto' },
      }))
    ]
  });

  const tableDataRows = (project.isZamanCizelgesi || []).map((item) => {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: item.isAdi, size: 18, font: 'Times New Roman' })] })],
        }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.nisan ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.mayis ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.haziran ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.temmuz ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.agustos ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.eylul ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.ekim ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.kasim ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.aralik ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.ocak ? 'X' : '', bold: true, size: 18 })], alignment: AlignmentType.CENTER })] }),
      ]
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          }
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'TEKNOFEST HAVACILIK, UZAY VE TEKNOLOJİ FESTİVALİ', bold: true, size: 28, font: 'Times New Roman' }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Yarışma Kategorisi: ${project.kategori}`, bold: true, size: 24, font: 'Times New Roman' }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Proje Adı: ${project.projeAdi}`, bold: true, size: 24, font: 'Times New Roman' }),
            ]
          }),
          new Paragraph({ text: '' }),

          // Özet
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '1. Proje Özeti', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.ozet, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Problem / İhtiyaç Tanımı
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '2. Problem ve İhtiyaç Tanımı', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.problemIhtiyac, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Yerlilik ve Özgünlük
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '3. Yerlilik, Özgünlük ve Yenilikçi Yönü', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.yerlilikOzgunluk, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Hedef Kitle ve Kullanılabilirlik
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '4. Hedef Kitle ve Kullanılabilirlik', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.hedefKitle, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Yöntem ve Uygulanabilirlik
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '5. Yöntem ve Uygulanabilirlik (Donanım / Yazılım Mimarisi)', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.yontemUygulanabilirlik, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Yerli Üretim Potansiyeli ve Riskler
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '6. Yerli Üretim Potansiyeli, Riskler ve Çözüm Yolları', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.yerliUretimVeRiskler, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // Etki ve Sürdürülebilirlik
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '7. Tahmini Etki, Yaygınlaştırma ve Sürdürülebilirlik', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.etkiVeSurdurulebilirlik, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({ text: '' }),

          // İş-Zaman Çizelgesi
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '8. Proje İş-Zaman Planı', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Table({
            rows: [tableHeaderRow, ...tableDataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: '' }),

          // Kaynaklar
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '9. Kaynaklar', bold: true, size: 24, font: 'Times New Roman' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: project.kaynaklar, size: 24, font: 'Times New Roman' })],
            alignment: AlignmentType.JUSTIFIED,
          }),
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const safeName = `TEKNOFEST_${project.projeAdi.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, '_')}.docx`;
  downloadBlob(blob, safeName);
}

export function exportTeknofestPDF(project: TeknofestProject) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  const addHeader = (title: string) => {
    if (y + 15 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(190, 18, 60); // Red TEKNOFEST brand color
    doc.text(title, margin, y);
    y += 6;
  };

  const addBodyText = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text || '', pageWidth - margin * 2);
    
    lines.forEach((line: string) => {
      if (y + 6 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  };

  // Title Banner
  doc.setFillColor(190, 18, 60); // TEKNOFEST Red
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TEKNOFEST PROJE DETAY RAPORU', margin, 15);

  y = 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Yarışma Kategorisi: ${project.kategori}`, margin, y); y += 6;
  doc.text(`Proje Adı: ${project.projeAdi}`, margin, y); y += 10;

  addHeader('1. Proje Özeti');
  addBodyText(project.ozet);

  addHeader('2. Problem ve İhtiyaç Tanımı');
  addBodyText(project.problemIhtiyac);

  addHeader('3. Yerlilik, Özgünlük ve Yenilikçi Yönü');
  addBodyText(project.yerlilikOzgunluk);

  addHeader('4. Hedef Kitle ve Kullanılabilirlik');
  addBodyText(project.hedefKitle);

  addHeader('5. Yöntem ve Uygulanabilirlik');
  addBodyText(project.yontemUygulanabilirlik);

  addHeader('6. Yerli Üretim Potansiyeli ve Riskler');
  addBodyText(project.yerliUretimVeRiskler);

  addHeader('7. Etki ve Sürdürülebilirlik');
  addBodyText(project.etkiVeSurdurulebilirlik);

  addHeader('8. Kaynaklar');
  addBodyText(project.kaynaklar);

  const safeName = `TEKNOFEST_${project.projeAdi.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, '_')}.pdf`;
  doc.save(safeName);
}
