import React, { useState, useEffect } from 'react';
import { NavTab, Student12thGrade, TeacherUser, AnnualPlanDocument, PastYksExamDocument } from './types';
import { ALL_12TH_GRADE_STUDENTS, INITIAL_ANNUAL_PLANS, INITIAL_YKS_EXAMS } from './data/studentsData';
import { fetchSharedCloudData, saveSharedCloudData } from './lib/supabase';
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
  // Login Authentication State with localStorage persistence
  const [teacher, setTeacher] = useState<TeacherUser>(() => {
    try {
      const saved = localStorage.getItem('yks_teacher_session');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved teacher session:', e);
    }
    return {
      username: 'Serdar Aktaş',
      displayName: 'Serdar Aktaş',
      role: 'Yönetici',
      isLoggedIn: true,
    };
  });

  // Navigation State (First tab is 'students')
  const [activeTab, setActiveTab] = useState<NavTab>('students');

  // Initial local states (hydrated from cache or initial static data)
  const [students, setStudents] = useState<Student12thGrade[]>(() => {
    try {
      const saved = localStorage.getItem('yks_students_data');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return ALL_12TH_GRADE_STUDENTS;
  });

  const [selectedStudent, setSelectedStudent] = useState<Student12thGrade | null>(null);

  const [annualPlans, setAnnualPlans] = useState<AnnualPlanDocument[]>(() => {
    try {
      const saved = localStorage.getItem('yks_annual_plans_data');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return INITIAL_ANNUAL_PLANS;
  });

  const [yksExams, setYksExams] = useState<PastYksExamDocument[]>(() => {
    try {
      const saved = localStorage.getItem('yks_exams_data');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return INITIAL_YKS_EXAMS;
  });

  // Load latest cloud data from Supabase on mount
  useEffect(() => {
    let active = true;

    async function syncFromCloud() {
      try {
        const cloudStudents = await fetchSharedCloudData<Student12thGrade[]>('students', students);
        if (active && Array.isArray(cloudStudents) && cloudStudents.length > 0) {
          setStudents(cloudStudents);
        }

        const cloudPlans = await fetchSharedCloudData<AnnualPlanDocument[]>('annual_plans', annualPlans);
        if (active && Array.isArray(cloudPlans)) {
          setAnnualPlans(cloudPlans);
        }

        const cloudExams = await fetchSharedCloudData<PastYksExamDocument[]>('yks_exams', yksExams);
        if (active && Array.isArray(cloudExams)) {
          setYksExams(cloudExams);
        }
      } catch (err) {
        console.warn('Initial cloud sync warning:', err);
      }
    }

    syncFromCloud();

    // Live sync polling every 10 seconds for multi-user synchronization across devices
    const interval = setInterval(() => {
      syncFromCloud();
    }, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Save changes to localStorage and Supabase Cloud
  useEffect(() => {
    try {
      localStorage.setItem('yks_teacher_session', JSON.stringify(teacher));
    } catch (e) {}
  }, [teacher]);

  useEffect(() => {
    try {
      localStorage.setItem('yks_students_data', JSON.stringify(students));
      saveSharedCloudData('students', students);
    } catch (e) {
      console.error('Failed to save students data:', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('yks_annual_plans_data', JSON.stringify(annualPlans));
      saveSharedCloudData('annual_plans', annualPlans);
      fetch('/api/annual-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annualPlans),
      }).catch(() => {});
    } catch (e) {
      console.error('Failed to save annual plans:', e);
    }
  }, [annualPlans]);

  useEffect(() => {
    try {
      localStorage.setItem('yks_exams_data', JSON.stringify(yksExams));
      saveSharedCloudData('yks_exams', yksExams);
    } catch (e) {
      console.error('Failed to save exams data:', e);
    }
  }, [yksExams]);


  // Determine if current user is Manager (Serdar Aktaş / Yönetici)
  const isManager =
    (teacher.role && teacher.role.toLowerCase().includes('yönetici')) ||
    teacher.displayName.toLowerCase().includes('serdar aktaş') ||
    teacher.displayName.toLowerCase().includes('serdar aktas');

  // Enforce role-based access restriction for specific tabs (tubitak, teknofest, registered-users)
  useEffect(() => {
    if (!isManager && ['tubitak', 'teknofest', 'registered-users'].includes(activeTab)) {
      setActiveTab('students');
    }
  }, [isManager, activeTab]);

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

  // Delete a student
  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (selectedStudent && selectedStudent.id === id) {
      setSelectedStudent(null);
    }
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
    if (!isManager && ['tubitak', 'teknofest', 'registered-users'].includes(tab)) {
      return;
    }
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
                onDeleteStudent={handleDeleteStudent}
              />
            ) : (
              <StudentsListView
                students={students}
                onSelectStudent={(student) => setSelectedStudent(student)}
                onAddStudent={handleAddStudent}
                onDeleteStudent={handleDeleteStudent}
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
