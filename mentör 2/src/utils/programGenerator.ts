import { DayProgram, ScheduleTask, Student12thGrade } from '../types';
import { isSubjectAllowedForBranch } from './branchUtils';

/**
 * Generates an adaptive, highly structured 7-day study program.
 * Rules:
 * 1. NO hours/timeSlots (student chooses study time).
 * 2. Days: Pazartesi, Salı, Çarşamba, Perşembe, Cuma, Cumartesi, Pazar.
 * 3. MANDATORY EVERY SINGLE DAY: TYT Türkçe and TYT Matematik.
 * 4. Sayısal (MF): Only TYT Türkçe, TYT Matematik, TYT/AYT Fen (Fizik, Kimya, Biyoloji) and AYT Matematik.
 * 5. Eşit Ağırlık (TM): All subjects EXCEPT Fen (Fizik, Kimya, Biyoloji).
 */
export function generateAdaptiveWeeklyProgram(
  student: Partial<Student12thGrade>
): DayProgram[] {
  const tytNet = student.latestTyt?.totalNet || 70;
  const aytNet = student.latestAyt?.totalNet || 45;
  const totalNetCombined = tytNet + aytNet;

  let baseTurkceQuestions = 30;
  let baseMathQuestions = 30;
  let baseBranchQuestions = 25;

  if (totalNetCombined >= 130) {
    baseTurkceQuestions = 45;
    baseMathQuestions = 45;
    baseBranchQuestions = 40;
  } else if (totalNetCombined >= 95) {
    baseTurkceQuestions = 35;
    baseMathQuestions = 35;
    baseBranchQuestions = 30;
  } else {
    baseTurkceQuestions = 20;
    baseMathQuestions = 20;
    baseBranchQuestions = 15;
  }

  // Filter weak topics by student's branch rules first
  const weakTopicsList = (student.decliningKazanimlar || []).filter((d) =>
    isSubjectAllowedForBranch(d.subject, student.branch)
  );

  const getWeakTopicForSubject = (subj: string, fallback: string) => {
    const match = weakTopicsList.find(
      (d) => d.subject.toLowerCase().includes(subj.toLowerCase()) || d.topicName.toLowerCase().includes(subj.toLowerCase())
    );
    return match ? `${match.topicName} (Eksik Konu)` : fallback;
  };

  const days: DayProgram['dayName'][] = [
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi',
    'Pazar',
  ];

  const branchName = student.branch || 'Sayısal';

  return days.map((dayName, idx) => {
    const tasks: ScheduleTask[] = [];

    // 1. MANDATORY TYT TÜRKÇE (EVERY SINGLE DAY)
    const turkceWeak = getWeakTopicForSubject('Türkçe', 'Paragraf Hız Çözümü & Anlam Bütünlüğü');
    tasks.push({
      id: `task-${idx}-turkce`,
      subject: 'TYT Türkçe',
      topic: idx % 2 === 0 ? turkceWeak : 'Paragrafta Yapı & Dil Bilgisi Tekrarı',
      focusType: 'Her Gün Rutin',
      questionTarget: baseTurkceQuestions + (idx % 3 === 0 ? 5 : 0),
      detail: 'Süreli paragraf ve dil bilgisi soru çözümü.',
      isMandatoryCommon: true,
      isWeakTopic: idx % 2 === 0 && turkceWeak.includes('(Eksik Konu)'),
    });

    // 2. MANDATORY TYT MATEMATİK (EVERY SINGLE DAY)
    const mathWeak = getWeakTopicForSubject('Matematik', 'Rasyonel Sayılar & Problemler Rutini');
    tasks.push({
      id: `task-${idx}-math`,
      subject: 'TYT Matematik',
      topic: idx % 2 === 1 ? mathWeak : 'Denklem Kurma & Yeni Nesil Problemler',
      focusType: 'Her Gün Rutin',
      questionTarget: baseMathQuestions + (idx % 2 === 0 ? 5 : 0),
      detail: 'Problem hız testi ve temel matematik mantık analizi.',
      isMandatoryCommon: true,
      isWeakTopic: idx % 2 === 1 && mathWeak.includes('(Eksik Konu)'),
    });

    // 3. BRANCH SPECIFIC & WEAK TOPIC STUDY
    if (branchName === 'Sayısal') {
      // Sayısal (MF): Only TYT Türkçe, TYT Matematik, TYT/AYT Fen & AYT Matematik
      if (idx === 0 || idx === 3) {
        // AYT Matematik
        const aytMathWeak = getWeakTopicForSubject('Matematik', 'Trigonometri & Logaritma');
        tasks.push({
          id: `task-${idx}-aytmath`,
          subject: 'AYT Matematik',
          topic: aytMathWeak,
          focusType: aytMathWeak.includes('Eksik') ? 'Eksik Konu (Ağırlıklı Odak)' : 'Genel Tekrar',
          questionTarget: baseBranchQuestions + 5,
          detail: 'Ağırlıklı eksik konu analizi ve formül uygulaması.',
          isWeakTopic: aytMathWeak.includes('Eksik'),
        });
      } else if (idx === 1 || idx === 4) {
        // AYT / TYT Fizik
        const fizWeak = getWeakTopicForSubject('Fizik', 'Optik & Vektörler');
        tasks.push({
          id: `task-${idx}-fizik`,
          subject: 'TYT/AYT Fizik',
          topic: fizWeak,
          focusType: fizWeak.includes('Eksik') ? 'Eksik Konu (Ağırlıklı Odak)' : 'Genel Tekrar',
          questionTarget: baseBranchQuestions,
          detail: 'Fizik kavram soruları ve vektör bağıntıları.',
          isWeakTopic: fizWeak.includes('Eksik'),
        });
      } else if (idx === 2 || idx === 5) {
        // AYT / TYT Kimya
        const kimWeak = getWeakTopicForSubject('Kimya', 'Kimyasal Bağlar & Hibritleşme');
        tasks.push({
          id: `task-${idx}-kimya`,
          subject: 'TYT/AYT Kimya',
          topic: kimWeak,
          focusType: kimWeak.includes('Eksik') ? 'Eksik Konu (Ağırlıklı Odak)' : 'Genel Tekrar',
          questionTarget: baseBranchQuestions,
          detail: 'Molekül geometrisi ve reaksiyon dengesi testi.',
          isWeakTopic: kimWeak.includes('Eksik'),
        });
      } else {
        // Pazar: AYT Biyoloji & Sayısal Deneme Değerlendirmesi
        const bioWeak = getWeakTopicForSubject('Biyoloji', 'Hücre Solunumu & Protein Sentezi');
        tasks.push({
          id: `task-${idx}-biyo`,
          subject: 'TYT/AYT Biyoloji',
          topic: bioWeak,
          focusType: bioWeak.includes('Eksik') ? 'Eksik Konu (Ağırlıklı Odak)' : 'Soru Çözümü & Deneme',
          questionTarget: baseBranchQuestions,
          detail: 'Haftalık genel tekrar ve sistem şemaları okuması.',
          isWeakTopic: bioWeak.includes('Eksik'),
        });
      }
    } else if (branchName === 'Eşit Ağırlık') {
      // Eşit Ağırlık (TM): All subjects EXCEPT Fen (Fizik, Kimya, Biyoloji)
      if (idx === 0 || idx === 3) {
        const edbWeak = getWeakTopicForSubject('Edebiyat', 'Divan Edebiyatı & Nazım Şekilleri');
        tasks.push({
          id: `task-${idx}-edebiyat`,
          subject: 'AYT Edebiyat',
          topic: edbWeak,
          focusType: edbWeak.includes('Eksik') ? 'Eksik Konu (Ağırlıklı Odak)' : 'Genel Tekrar',
          questionTarget: baseBranchQuestions,
          detail: 'Eser-yazar eşleştirmesi ve kilit edebiyat soruları.',
          isWeakTopic: edbWeak.includes('Eksik'),
        });
      } else if (idx === 1 || idx === 4) {
        const aytMathWeak = getWeakTopicForSubject('Matematik', 'İkinci Dereceden Denklemler & Fonksiyonlar');
        tasks.push({
          id: `task-${idx}-tm-math`,
          subject: 'AYT Matematik',
          topic: aytMathWeak,
          focusType: aytMathWeak.includes('Eksik') ? 'Eksik Konu (Ağırlıklı Odak)' : 'Genel Tekrar',
          questionTarget: baseBranchQuestions,
          detail: 'AYT Matematik grafik ve denklem soru bankası.',
          isWeakTopic: aytMathWeak.includes('Eksik'),
        });
      } else if (idx === 2 || idx === 5) {
        const tarWeak = getWeakTopicForSubject('Tarih', 'İnkılap Tarihi & İlk Çağ Medeniyetleri');
        const cogWeak = getWeakTopicForSubject('Coğrafya', 'Türkiye İklimi & Harita Bilgisi');
        tasks.push({
          id: `task-${idx}-tarcog`,
          subject: 'TYT/AYT Tarih & Coğrafya',
          topic: idx === 2 ? tarWeak : cogWeak,
          focusType: 'Genel Tekrar',
          questionTarget: baseBranchQuestions,
          detail: 'Harita okuma, kavram analizleri ve kronoloji çalışması.',
          isWeakTopic: (idx === 2 ? tarWeak : cogWeak).includes('Eksik'),
        });
      } else {
        // Pazar: Felsefe & TM Genel Deneme Değerlendirmesi
        const felWeak = getWeakTopicForSubject('Felsefe', 'Felsefi Düşünce & Mantık');
        tasks.push({
          id: `task-${idx}-felsefe`,
          subject: 'TYT/AYT Sosyal Bilimler (Felsefe & Din)',
          topic: felWeak,
          focusType: 'Soru Çözümü & Deneme',
          questionTarget: baseBranchQuestions,
          detail: 'TM alan deneme analizi ve sosyal bilimler kavram testi.',
          isWeakTopic: felWeak.includes('Eksik'),
        });
      }
    } else {
      // Sözel / Dil / Diğer
      tasks.push({
        id: `task-${idx}-genel`,
        subject: `${branchName} Alan Dersi`,
        topic: getWeakTopicForSubject(branchName, 'Alan Soru Bankası Çözümü'),
        focusType: 'Genel Tekrar',
        questionTarget: baseBranchQuestions,
        detail: 'Konu anlatımlı soru bankası takibi.',
      });
    }

    return {
      dayName,
      tasks,
    };
  });
}
