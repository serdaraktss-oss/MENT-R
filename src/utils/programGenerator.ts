import { DayProgram, ScheduleTask, Student12thGrade } from '../types';

/**
 * Generates an adaptive, highly structured 7-day study program.
 * Rules:
 * 1. NO hours/timeSlots (student chooses study time).
 * 2. Days: Pazartesi, Salı, Çarşamba, Perşembe, Cuma, Cumartesi, Pazar.
 * 3. MANDATORY EVERY SINGLE DAY: TYT Türkçe and TYT Matematik.
 * 4. Branch/Exam specific study targeting weak topics identified in trial exams.
 * 5. Adaptive Question Target based on student's total net score (Academic level).
 */
export function generateAdaptiveWeeklyProgram(
  student: Partial<Student12thGrade>
): DayProgram[] {
  const tytNet = student.latestTyt?.totalNet || 70;
  const aytNet = student.latestAyt?.totalNet || 45;
  const totalNetCombined = tytNet + aytNet;

  // Determine Question Target Multipliers based on Academic Level
  // High Level (>120 combined net): 40-50 questions/task
  // Medium Level (80-120 combined net): 25-35 questions/task
  // Base Level (<80 combined net): 15-25 questions/task (so student isn't discouraged)
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

  // Identify weak topics from student data or fallback
  const weakTopicsList = student.decliningKazanimlar || [];
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

    // 3. BRANCH SPECIFIC & WEAK TOPIC STUDY (Dengeli Dağılım)
    if (branchName === 'Sayısal') {
      if (idx === 0 || idx === 3) {
        // AYT Matematik / Fizik
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
        // AYT Fizik / Kimya
        const fizWeak = getWeakTopicForSubject('Fizik', 'Optik & Vektörler');
        tasks.push({
          id: `task-${idx}-fizik`,
          subject: 'AYT Fizik',
          topic: fizWeak,
          focusType: fizWeak.includes('Eksik') ? 'Eksik Konu (Ağırlıklı Odak)' : 'Genel Tekrar',
          questionTarget: baseBranchQuestions,
          detail: 'Denemedeki yanlış yapılan fizik kavram soruları.',
          isWeakTopic: fizWeak.includes('Eksik'),
        });
      } else if (idx === 2 || idx === 5) {
        // AYT Kimya / Biyoloji
        const kimWeak = getWeakTopicForSubject('Kimya', 'Kimyasal Bağlar & Hibritleşme');
        tasks.push({
          id: `task-${idx}-kimya`,
          subject: 'AYT Kimya',
          topic: kimWeak,
          focusType: kimWeak.includes('Eksik') ? 'Eksik Konu (Ağırlıklı Odak)' : 'Genel Tekrar',
          questionTarget: baseBranchQuestions,
          detail: 'Molekül geometrisi ve reaksiyon dengesi testi.',
          isWeakTopic: kimWeak.includes('Eksik'),
        });
      } else {
        // Pazar: Genel Deneme Değerlendirmesi & Biyoloji
        const bioWeak = getWeakTopicForSubject('Biyoloji', 'Hücre Solunumu & Protein Sentezi');
        tasks.push({
          id: `task-${idx}-biyo`,
          subject: 'AYT Biyoloji / Deneme',
          topic: bioWeak,
          focusType: 'Soru Çözümü & Deneme',
          questionTarget: baseBranchQuestions,
          detail: 'Haftalık genel tekrar ve sistem şemaları okuması.',
          isWeakTopic: bioWeak.includes('Eksik'),
        });
      }
    } else if (branchName === 'Eşit Ağırlık') {
      if (idx % 2 === 0) {
        tasks.push({
          id: `task-${idx}-edebiyat`,
          subject: 'AYT Edebiyat',
          topic: getWeakTopicForSubject('Edebiyat', 'Divan Edebiyatı & Nazım Şekilleri'),
          focusType: 'Eksik Konu (Ağırlıklı Odak)',
          questionTarget: baseBranchQuestions,
          detail: 'Eser-yazar eşleştirmesi ve kilit soru çözümü.',
          isWeakTopic: true,
        });
      } else {
        tasks.push({
          id: `task-${idx}-cografya`,
          subject: 'AYT Tarih & Coğrafya',
          topic: getWeakTopicForSubject('Tarih', 'İnkılap Tarihi & Türkiye İklimi'),
          focusType: 'Genel Tekrar',
          questionTarget: baseBranchQuestions,
          detail: 'Harita okuma ve kronoloji çalışması.',
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
