import React, { useState } from 'react';
import { Student12thGrade } from '../types';
import { Search, Filter, TrendingUp, TrendingDown, ArrowRight, UserPlus, X, CheckCircle2, Trash2, UploadCloud, Layers, BarChart3, Users } from 'lucide-react';
import { ClassBranchAnalyticsView } from './ClassBranchAnalyticsView';
import { StudentAvatarBadge } from '../utils/studentAvatar';

interface StudentsListViewProps {
  students: Student12thGrade[];
  onSelectStudent: (student: Student12thGrade) => void;
  onAddStudent?: (newStudent: Student12thGrade) => void;
  onDeleteStudent?: (id: string) => void;
  onNavigateToUpload?: () => void;
  isManager?: boolean;
}

export const StudentsListView: React.FC<StudentsListViewProps> = ({
  students,
  onSelectStudent,
  onAddStudent,
  onDeleteStudent,
  onNavigateToUpload,
  isManager = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('12 MFA');
  const [viewMode, setViewMode] = useState<'students' | 'branch-analytics'>('students');

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'K' | 'E'>('E');
  const [newClassName, setNewClassName] = useState<'12 MFA' | '12 TMA' | '12 TMB'>('12 MFA');
  const [newBranch, setNewBranch] = useState<'Sayısal' | 'Eşit Ağırlık' | 'Sözel' | 'Dil'>('Sayısal');

  // Delete Confirmation State
  const [studentToDelete, setStudentToDelete] = useState<Student12thGrade | null>(null);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.studentNo && student.studentNo.includes(searchQuery)) ||
      student.branch.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = student.className === selectedClass;

    return matchesSearch && matchesClass;
  });

  // Handle adding new student
  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Lütfen öğrenci ad-soyadamını giriniz.');
      return;
    }

    const generatedNo = Math.floor(100 + Math.random() * 900).toString();

    const newStudentObj: Student12thGrade = {
      id: `s-${Date.now()}`,
      name: newName.trim(),
      studentNo: generatedNo,
      className: newClassName,
      branch: newBranch,
      gender: newGender,
      avatarUrl: '',
      mentorNote: 'YENİ ÖĞRENCİ - Mentör takibi başlatıldı.',
      latestTyt: {
        examName: 'Henüz Deneme Yüklenmedi',
        examDate: '-',
        totalNet: 0,
        rankInSchool: 0,
        subjects: [],
      },
      latestAyt: {
        examName: 'Henüz Deneme Yüklenmedi',
        examDate: '-',
        totalNet: 0,
        rankInSchool: 0,
        subjects: [],
      },
      history: [],
      improvingKazanimlar: [],
      decliningKazanimlar: [],
      weeklyProgram: [],
    };

    if (onAddStudent) {
      onAddStudent(newStudentObj);
    }
    setIsAddModalOpen(false);
    setNewName('');
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

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setViewMode(viewMode === 'students' ? 'branch-analytics' : 'students')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-md ${
              viewMode === 'branch-analytics'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                : 'bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>{viewMode === 'branch-analytics' ? 'Öğrenci Kartları Listesine Dön' : 'Sınıfların Branş Analizini Gör'}</span>
            <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded font-mono text-emerald-400">
              Artış / Azalış 📊
            </span>
          </button>

          {isManager && onNavigateToUpload && (
            <button
              onClick={onNavigateToUpload}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-emerald-200" />
              <span>Deneme Sonucu Yükle (TYT & AYT)</span>
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono">1-100</span>
            </button>
          )}

          {isManager && onAddStudent && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>Yeni Öğrenci Ekle</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'branch-analytics' ? (
        <ClassBranchAnalyticsView
          students={students}
          selectedClassFilter={selectedClass}
          onClassFilterChange={(cls) => setSelectedClass(cls)}
          onSelectStudent={onSelectStudent}
        />
      ) : (
        <>
          {/* Quick Class Highlight Banner */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{selectedClass} Sınıfı Branş Bazlı Gelişim Özeti</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                    Artış & Azalış Gözlemi
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Bu sınıfın tüm branşlardaki (Sosyal: Tarih, Coğrafya, Felsefe, Din; Fen: Fizik, Kimya, Biyoloji; Türkçe & Matematik) net artış ve azalış oranlarını gözlemleyin.
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewMode('branch-analytics')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <span>{selectedClass} Branş Grafiğini Gör</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
          {['12 MFA', '12 TMA', '12 TMB'].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedClass === cls
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {cls}
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
                <StudentAvatarBadge
                  student={student}
                  size="lg"
                  className="group-hover:scale-105 transition shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                      {student.name}
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-700 text-slate-300 rounded-md">
                      No: {student.studentNo}
                    </span>
                    {student.trialExams && student.trialExams.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-md">
                        {student.trialExams.length} Deneme
                      </span>
                    )}
                    {student.trialExams && student.trialExams.some((t) => t.sourceImages && t.sourceImages.length > 0) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-md">
                        📸 Belgeli
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {student.className} • <span className="text-indigo-400 font-semibold">{student.branch}</span>
                  </p>


                </div>
              </div>

              {/* Exam Scores & Action Button */}
              <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-slate-700/60 pt-3 lg:pt-0">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2 text-center min-w-[95px]">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Son TYT Net</span>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-base font-black text-emerald-400">
                        {student.latestTyt && student.latestTyt.subjects?.length > 0 ? student.latestTyt.totalNet : '—'}
                      </span>
                      {student.latestTyt?.deltaTotalNet !== undefined && student.latestTyt.deltaTotalNet !== 0 && (
                        <span className={`text-[10px] font-bold ${
                          student.latestTyt.deltaTotalNet > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {student.latestTyt.deltaTotalNet > 0 ? `+${student.latestTyt.deltaTotalNet}` : student.latestTyt.deltaTotalNet}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2 text-center min-w-[95px]">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Son AYT Net</span>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-base font-black text-indigo-400">
                        {student.latestAyt && student.latestAyt.subjects?.length > 0 ? student.latestAyt.totalNet : '—'}
                      </span>
                      {student.latestAyt?.deltaTotalNet !== undefined && student.latestAyt.deltaTotalNet !== 0 && (
                        <span className={`text-[10px] font-bold ${
                          student.latestAyt.deltaTotalNet > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {student.latestAyt.deltaTotalNet > 0 ? `+${student.latestAyt.deltaTotalNet}` : student.latestAyt.deltaTotalNet}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm font-bold text-indigo-400 group-hover:text-white bg-indigo-500/10 group-hover:bg-indigo-600 border border-indigo-500/30 group-hover:border-indigo-600 px-4 py-2.5 rounded-xl transition">
                    <span>İncele / Düzenle</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  {isManager && onDeleteStudent && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStudentToDelete(student);
                      }}
                      title="Öğrenciyi Sil"
                      className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700/60 hover:border-rose-500/30 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
        </>
      )}

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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Öğrenci Cinsiyeti (Emoji Avatar)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewGender('K')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                      newGender === 'K'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">👩</span>
                    <span>Kız Öğrenci (Kadın)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGender('E')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                      newGender === 'E'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">👨</span>
                    <span>Erkek Öğrenci (Erkek)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sınıf / Şube
                  </label>
                  <select
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="12 MFA">12 MFA</option>
                    <option value="12 TMA">12 TMA</option>
                    <option value="12 TMB">12 TMB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Alan / Branş
                  </label>
                  <select
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Sayısal">Sayısal</option>
                    <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                    <option value="Sözel">Sözel</option>
                    <option value="Dil">Dil</option>
                  </select>
                </div>
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
      {/* MODAL: ÖĞRENCİ SİL ONAYI */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                Öğrenciyi Sil
              </h3>
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-300">
              <strong className="text-white">{studentToDelete.name}</strong> isimli öğrenciyi sistemden silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStudent) {
                    onDeleteStudent(studentToDelete.id);
                  }
                  setStudentToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 rounded-xl transition cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
