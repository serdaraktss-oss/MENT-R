import React, { useState } from 'react';
import { Student12thGrade } from '../types';
import { Search, Filter, TrendingUp, TrendingDown, ArrowRight, UserPlus, X, CheckCircle2 } from 'lucide-react';

interface StudentsListViewProps {
  students: Student12thGrade[];
  onSelectStudent: (student: Student12thGrade) => void;
  onAddStudent?: (newStudent: Student12thGrade) => void;
}

export const StudentsListView: React.FC<StudentsListViewProps> = ({
  students,
  onSelectStudent,
  onAddStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStudentNo, setNewStudentNo] = useState('');
  const [newClassName, setNewClassName] = useState<'12-A Fen Bilimleri' | '12-B Sayısal' | '12-C Eşit Ağırlık' | '12-D Dil'>('12-A Fen Bilimleri');
  const [newBranch, setNewBranch] = useState<'Sayısal' | 'Eşit Ağırlık' | 'Sözel' | 'Dil'>('Sayısal');
  const [newInitialTyt, setNewInitialTyt] = useState('75.0');
  const [newInitialAyt, setNewInitialAyt] = useState('50.0');
  const [newMentorNote, setNewMentorNote] = useState('YENİ ÖĞRENCİ - Mentör takibi başlatıldı.');

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentNo.includes(searchQuery) ||
      student.branch.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClass === 'ALL' || student.className === selectedClass;

    return matchesSearch && matchesClass;
  });

  // Handle adding new student
  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newStudentNo.trim()) {
      alert('Lütfen öğrenci isim-soyisim ve okul numarasını giriniz.');
      return;
    }

    const tytNetVal = parseFloat(newInitialTyt) || 70.0;
    const aytNetVal = parseFloat(newInitialAyt) || 45.0;

    const newStudentObj: Student12thGrade = {
      id: `s-${Date.now()}`,
      name: newName,
      studentNo: newStudentNo,
      className: newClassName,
      branch: newBranch,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=200&auto=format&fit=crop&q=80`,
      mentorNote: newMentorNote,
      latestTyt: {
        examName: 'Giriş / İlk Deneme TYT-1',
        examDate: 'Ağustos 2026',
        totalNet: tytNetVal,
        rankInSchool: 8,
        subjects: [
          { subjectName: 'Türkçe', questionCount: 40, correct: 28, wrong: 6, blank: 6, net: Math.round(tytNetVal * 0.38), accuracyRate: 70 },
          { subjectName: 'Temel Matematik', questionCount: 40, correct: 25, wrong: 5, blank: 10, net: Math.round(tytNetVal * 0.35), accuracyRate: 62 },
          { subjectName: 'Fen Bilimleri', questionCount: 20, correct: 13, wrong: 3, blank: 4, net: Math.round(tytNetVal * 0.17), accuracyRate: 65 },
          { subjectName: 'Sosyal Bilimler', questionCount: 20, correct: 11, wrong: 4, blank: 5, net: Math.round(tytNetVal * 0.10), accuracyRate: 55 },
        ],
      },
      latestAyt: {
        examName: 'Giriş / İlk Deneme AYT-1',
        examDate: 'Ağustos 2026',
        totalNet: aytNetVal,
        rankInSchool: 10,
        subjects: [
          { subjectName: 'AYT Matematik', questionCount: 40, correct: 22, wrong: 6, blank: 12, net: Math.round(aytNetVal * 0.42), accuracyRate: 55 },
          { subjectName: 'AYT Fizik', questionCount: 14, correct: 9, wrong: 3, blank: 2, net: Math.round(aytNetVal * 0.20), accuracyRate: 64 },
          { subjectName: 'AYT Kimya', questionCount: 13, correct: 8, wrong: 3, blank: 2, net: Math.round(aytNetVal * 0.19), accuracyRate: 61 },
          { subjectName: 'AYT Biyoloji', questionCount: 13, correct: 8, wrong: 2, blank: 3, net: Math.round(aytNetVal * 0.19), accuracyRate: 61 },
        ],
      },
      history: [
        { examTitle: 'Başlangıç Denemesi', date: 'Temmuz', tytNet: Math.max(20, tytNetVal - 6), aytNet: Math.max(15, aytNetVal - 5) },
        { examTitle: 'Son Deneme (Mevcut)', date: 'Ağustos', tytNet: tytNetVal, aytNet: aytNetVal },
      ],
      improvingKazanimlar: [
        { id: `ik-${Date.now()}-1`, subject: 'Türkçe', topicName: 'Paragrafta Anlam Bütünlüğü', changeRate: '+12% İlerleme', status: 'improving', detailNote: 'Soru çözümü devam ediyor.' },
      ],
      decliningKazanimlar: [
        { id: `dk-${Date.now()}-1`, subject: 'Matematik', topicName: 'Trigonometri I', changeRate: '-8% Düşüş', status: 'declining', detailNote: 'Özel çalışma programı eklendi.' },
      ],
      weeklyProgram: [
        {
          dayName: 'Pazartesi',
          tasks: [
            { id: 'wt1', timeSlot: '17:00 - 18:30', subject: 'Matematik', topic: 'Trigonometri & Denklem', focusType: 'Eksik Konu (Ağırlıklı Odak)', questionTarget: 30, detail: '30 Soru Çözümü' },
            { id: 'wt2', timeSlot: '19:00 - 20:15', subject: 'Türkçe', topic: 'Paragraf Hız Testi', focusType: 'Genel Tekrar', questionTarget: 25, detail: '25 Soru Çözümü' },
          ],
        },
        {
          dayName: 'Salı',
          tasks: [
            { id: 'wt3', timeSlot: '17:00 - 18:30', subject: 'Fizik', topic: 'Vektörler & Dinamik', focusType: 'Genel Tekrar', questionTarget: 20, detail: '20 Soru Çözümü' },
          ],
        },
        { dayName: 'Çarşamba', tasks: [] },
        { dayName: 'Perşembe', tasks: [] },
        { dayName: 'Cuma', tasks: [] },
        { dayName: 'Cumartesi', tasks: [] },
        { dayName: 'Pazar', tasks: [] },
      ],
    };

    if (onAddStudent) {
      onAddStudent(newStudentObj);
    }
    setIsAddModalOpen(false);
    setNewName('');
    setNewStudentNo('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-xs rounded-md">
              12. SINIF
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Öğrenci Takip Listesi</h2>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Öğrencileri güncelleyebilir, yeni deneme sınavı ekleyebilir veya listeye yeni öğrenci kaydedebilirsiniz.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yeni Öğrenci Ekle</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Öğrenci adı, no veya alan ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          {['ALL', '12-A Fen Bilimleri', '12-B Sayısal', '12-C Eşit Ağırlık', '12-D Dil'].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedClass === cls
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {cls === 'ALL' ? 'Tüm 12. Sınıflar' : cls}
            </button>
          ))}
        </div>
      </div>

      {/* Students Vertical List */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm">Aramanıza uygun 12. sınıf öğrencisi bulunamadı.</p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className="group bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Student Basic Info */}
              <div className="flex items-center gap-4">
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/30 group-hover:border-indigo-500 transition shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                      {student.name}
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-700 text-slate-300 rounded-md">
                      No: {student.studentNo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {student.className} • <span className="text-indigo-400 font-semibold">{student.branch}</span>
                  </p>

                  {/* Declining topic preview badge */}
                  {student.decliningKazanimlar.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-lg w-fit">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Eksik Konu: <strong>{student.decliningKazanimlar[0].topicName}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Scores & Action Button */}
              <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-slate-700/60 pt-3 lg:pt-0">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2 text-center min-w-[90px]">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Son TYT Net</span>
                    <span className="text-base font-black text-emerald-400">{student.latestTyt.totalNet}</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2 text-center min-w-[90px]">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Son AYT Net</span>
                    <span className="text-base font-black text-indigo-400">{student.latestAyt.totalNet}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm font-bold text-indigo-400 group-hover:text-white bg-indigo-500/10 group-hover:bg-indigo-600 border border-indigo-500/30 group-hover:border-indigo-600 px-4 py-2.5 rounded-xl transition">
                  <span>İncele / Düzenle</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: YENİ ÖĞRENCİ EKLE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Sisteme Yeni Öğrenci Ekle</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Öğrenci Ad Soyad
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Okul Numarası
                  </label>
                  <input
                    type="text"
                    value={newStudentNo}
                    onChange={(e) => setNewStudentNo(e.target.value)}
                    placeholder="Örn: 512"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sınıf / Şube
                  </label>
                  <select
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="12-A Fen Bilimleri">12-A Fen Bilimleri</option>
                    <option value="12-B Sayısal">12-B Sayısal</option>
                    <option value="12-C Eşit Ağırlık">12-C Eşit Ağırlık</option>
                    <option value="12-D Dil">12-D Dil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Branş / Alan
                  </label>
                  <select
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Sayısal">Sayısal</option>
                    <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                    <option value="Sözel">Sözel</option>
                    <option value="Dil">Dil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Giriş TYT Net
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={newInitialTyt}
                    onChange={(e) => setNewInitialTyt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Giriş AYT Net
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={newInitialAyt}
                    onChange={(e) => setNewInitialAyt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mentör Notu
                </label>
                <textarea
                  rows={2}
                  value={newMentorNote}
                  onChange={(e) => setNewMentorNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-600 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Öğrenciyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
