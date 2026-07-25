import React, { useState } from 'react';
import { NavTab, Student12thGrade, TeacherUser, AnnualPlanDocument, PastYksExamDocument } from './types';
import { ALL_12TH_GRADE_STUDENTS, INITIAL_ANNUAL_PLANS, INITIAL_YKS_EXAMS } from './data/studentsData';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { StudentsListView } from './components/StudentsListView';
import { StudentDetailView } from './components/StudentDetailView';
import { AnnualPlansView } from './components/AnnualPlansView';
import { YksExamsView } from './components/YksExamsView';
import { AiWizardView } from './components/AiWizardView';
import { AiAppsView } from './components/AiAppsView';
import { TubitakView } from './components/TubitakView';
import { TeknofestView } from './components/TeknofestView';
import { RegisteredUsersView } from './components/RegisteredUsersView';
import { AiAssistantWidget } from './components/AiAssistantWidget';

export default function App() {
  // Login Authentication State
  const [teacher, setTeacher] = useState<TeacherUser>({
    username: 'Serdar Aktaş',
    displayName: 'Serdar Aktaş',
    role: 'Yönetici',
    isLoggedIn: false, // Default to login screen
  });

  // Navigation State (First tab is 'students')
  const [activeTab, setActiveTab] = useState<NavTab>('students');
  const [students, setStudents] = useState<Student12thGrade[]>(ALL_12TH_GRADE_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<Student12thGrade | null>(null);

  // Documents uploaded by manager Serdar Aktaş
  const [annualPlans, setAnnualPlans] = useState<AnnualPlanDocument[]>(INITIAL_ANNUAL_PLANS);
  const [yksExams, setYksExams] = useState<PastYksExamDocument[]>(INITIAL_YKS_EXAMS);

  // Login handler
  const handleLoginSuccess = (name: string, role?: string) => {
    const trimmed = name.trim();
    const isSerdar = trimmed.toLowerCase().includes('serdar aktaş') || trimmed.toLowerCase().includes('serdar aktas');
    setTeacher({
      username: trimmed,
      displayName: trimmed,
      role: role || (isSerdar ? 'Yönetici' : 'Mentör'),
      isLoggedIn: true,
    });
  };

  // Logout handler
  const handleLogout = () => {
    setTeacher((prev) => ({ ...prev, isLoggedIn: false }));
    setSelectedStudent(null);
  };

  // Update a student's data
  const handleUpdateStudent = (updatedStudent: Student12thGrade) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    setSelectedStudent(updatedStudent);
  };

  // Add a new student
  const handleAddStudent = (newStudent: Student12thGrade) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  // Annual plans management
  const handleAddPlan = (newPlan: AnnualPlanDocument) => {
    setAnnualPlans((prev) => [newPlan, ...prev]);
  };

  const handleDeletePlan = (id: string) => {
    setAnnualPlans((prev) => prev.filter((p) => p.id !== id));
  };

  // YKS past trial exams management
  const handleAddExam = (newExam: PastYksExamDocument) => {
    setYksExams((prev) => [newExam, ...prev]);
  };

  const handleDeleteExam = (id: string) => {
    setYksExams((prev) => prev.filter((e) => e.id !== id));
  };

  // Switch tabs
  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab !== 'students') {
      setSelectedStudent(null);
    }
  };

  // Render Login Page if not logged in
  if (!teacher.isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex antialiased selection:bg-indigo-500 selection:text-white">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        teacherName={teacher.displayName}
        userRole={teacher.role}
        onLogout={handleLogout}
        studentCount={students.length}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'students' && (
          <>
            {selectedStudent ? (
              <StudentDetailView
                student={selectedStudent}
                onBack={() => setSelectedStudent(null)}
                onUpdateStudent={handleUpdateStudent}
              />
            ) : (
              <StudentsListView
                students={students}
                onSelectStudent={(student) => setSelectedStudent(student)}
                onAddStudent={handleAddStudent}
              />
            )}
          </>
        )}

        {activeTab === 'annual-plans' && (
          <AnnualPlansView
            annualPlans={annualPlans}
            onAddPlan={handleAddPlan}
            onDeletePlan={handleDeletePlan}
          />
        )}

        {activeTab === 'yks-exams' && (
          <YksExamsView
            exams={yksExams}
            onAddExam={handleAddExam}
            onDeleteExam={handleDeleteExam}
          />
        )}

        {activeTab === 'ai-tools' && <AiWizardView />}

        {activeTab === 'ai-apps' && <AiAppsView />}

        {activeTab === 'tubitak' && <TubitakView />}

        {activeTab === 'teknofest' && <TeknofestView />}

        {activeTab === 'registered-users' && <RegisteredUsersView />}
      </main>

      {/* Floating Bottom-Right Intelligent AI Assistant (Anime Avatar) */}
      <AiAssistantWidget
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        students={students}
        selectedStudent={selectedStudent}
        onSelectStudent={setSelectedStudent}
        annualPlans={annualPlans}
        yksExams={yksExams}
        teacherName={teacher.displayName}
      />
    </div>
  );
}
