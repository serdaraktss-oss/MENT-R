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
import { TrialExamUploadView } from './components/TrialExamUploadView';
import { ClassBranchAnalyticsView } from './components/ClassBranchAnalyticsView';

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

  // Cloud loaded flag to prevent initial static state from overwriting Supabase
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);

  // Initial local states (hydrated from cache or initial static data)
  const [students, setStudents] = useState<Student12thGrade[]>(() => {
    try {
      const saved = localStorage.getItem('yks_students_data_v4');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 35) {
          return parsed;
        }
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

  // Load students, plans and exams from persistent server store & cloud on mount
  useEffect(() => {
    let active = true;

    async function hydrateAppData() {
      try {
        // 1. First load from server persistent storage (/api/students)
        try {
          const srvRes = await fetch('/api/students');
          if (srvRes.ok) {
            const srvData = await srvRes.json();
            if (active && srvData.success && srvData.found && Array.isArray(srvData.students) && srvData.students.length >= 35) {
              setStudents(srvData.students);
            } else {
              // Server has no students file yet or has old data, persist canonical students to server storage
              fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ALL_12TH_GRADE_STUDENTS),
              }).catch(() => {});
            }
          }
        } catch (e) {
          console.warn('Server storage read warning:', e);
        }

        // 2. Hydrate from cloud if available, merging safely
        const resStudents = await fetchSharedCloudData<Student12thGrade[]>('students');
        if (active && resStudents.found && Array.isArray(resStudents.data) && resStudents.data.length >= 35) {
          setStudents((prev) => {
            const baseList = prev.length >= 35 ? [...prev] : [...ALL_12TH_GRADE_STUDENTS];
            resStudents.data!.forEach((incomingStu) => {
              const idx = baseList.findIndex((s) => s.id === incomingStu.id || s.name === incomingStu.name);
              if (idx >= 0) {
                const currentTrials = baseList[idx].trialExams || [];
                const incomingTrials = incomingStu.trialExams || [];
                // Combine and deduplicate trial exams
                const trialMap = new Map<string, any>();
                currentTrials.forEach((t) => trialMap.set(`${t.examType}_${t.examNumber}`, t));
                incomingTrials.forEach((t) => {
                  const key = `${t.examType}_${t.examNumber}`;
                  if (!trialMap.has(key)) {
                    trialMap.set(key, t);
                  }
                });
                const combinedTrials = Array.from(trialMap.values()).sort((a, b) => a.examNumber - b.examNumber);
                baseList[idx] = {
                  ...baseList[idx],
                  ...incomingStu,
                  name: baseList[idx].name, // Preserve canonical full legal name
                  trialExams: combinedTrials,
                  latestTyt: combinedTrials.filter(t => t.examType === 'TYT').pop() || baseList[idx].latestTyt,
                  latestAyt: combinedTrials.filter(t => t.examType === 'AYT').pop() || baseList[idx].latestAyt,
                };
              }
            });
            return baseList;
          });
        }

        const resPlans = await fetchSharedCloudData<AnnualPlanDocument[]>('annual_plans');
        if (active && resPlans.found && Array.isArray(resPlans.data)) {
          setAnnualPlans(resPlans.data);
        }

        const resExams = await fetchSharedCloudData<PastYksExamDocument[]>('yks_exams');
        if (active && resExams.found && Array.isArray(resExams.data)) {
          setYksExams(resExams.data);
        }
      } catch (err) {
        console.warn('Initial data hydration warning:', err);
      } finally {
        if (active) {
          setIsCloudLoaded(true);
        }
      }
    }

    hydrateAppData();

    return () => {
      active = false;
    };
  }, []);

  // Save changes to localStorage, server persistent storage, and Supabase Cloud
  useEffect(() => {
    try {
      localStorage.setItem('yks_teacher_session', JSON.stringify(teacher));
    } catch (e) {}
  }, [teacher]);

  useEffect(() => {
    if (!isCloudLoaded) return;
    try {
      localStorage.setItem('yks_students_data_v4', JSON.stringify(students));
      localStorage.setItem('yks_students_data_v3', JSON.stringify(students));
      localStorage.setItem('yks_students_data', JSON.stringify(students));
      saveSharedCloudData('students', students);
      // Persist to local server file system storage
      fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(students),
      }).catch((err) => console.warn('Server save warning:', err));
    } catch (e) {
      console.error('Failed to save students data:', e);
    }
  }, [students, isCloudLoaded]);

  useEffect(() => {
    if (!isCloudLoaded) return;
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
  }, [annualPlans, isCloudLoaded]);

  useEffect(() => {
    if (!isCloudLoaded) return;
    try {
      localStorage.setItem('yks_exams_data', JSON.stringify(yksExams));
      saveSharedCloudData('yks_exams', yksExams);
    } catch (e) {
      console.error('Failed to save exams data:', e);
    }
  }, [yksExams, isCloudLoaded]);


  // Determine if current user is Manager (Serdar Aktaş / Yönetici)
  const isManager =
    (teacher.role && teacher.role.toLowerCase().includes('yönetici')) ||
    teacher.displayName.toLowerCase().includes('serdar aktaş') ||
    teacher.displayName.toLowerCase().includes('serdar aktas');

  // Enforce role-based access restriction for specific tabs (tubitak, teknofest, registered-users, trial-upload)
  useEffect(() => {
    if (!isManager && ['tubitak', 'teknofest', 'registered-users', 'trial-upload'].includes(activeTab)) {
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

  // Keep selectedStudent synchronized when students array updates
  useEffect(() => {
    if (selectedStudent) {
      const refreshed = students.find((s) => s.id === selectedStudent.id);
      if (refreshed && refreshed !== selectedStudent) {
        setSelectedStudent(refreshed);
      }
    }
  }, [students]);

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
    if (!isManager && ['tubitak', 'teknofest', 'registered-users', 'trial-upload'].includes(tab)) {
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
                onDeleteStudent={isManager ? handleDeleteStudent : undefined}
                isManager={isManager}
                teacherName={teacher.displayName}
              />
            ) : (
              <StudentsListView
                students={students}
                onSelectStudent={(student) => setSelectedStudent(student)}
                onAddStudent={handleAddStudent}
                onDeleteStudent={isManager ? handleDeleteStudent : undefined}
                isManager={isManager}
                onNavigateToUpload={isManager ? () => setActiveTab('trial-upload') : undefined}
              />
            )}
          </>
        )}

        {activeTab === 'class-analytics' && (
          <ClassBranchAnalyticsView
            students={students}
            onSelectStudent={(student) => {
              setSelectedStudent(student);
              setActiveTab('students');
            }}
          />
        )}

        {activeTab === 'trial-upload' && (
          <TrialExamUploadView
            students={students}
            onUpdateStudents={(newStudents) => {
              setStudents(newStudents);
              try {
                localStorage.setItem('yks_students_data', JSON.stringify(newStudents));
                saveSharedCloudData('students', newStudents);
                fetch('/api/students', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newStudents),
                }).catch(() => {});
              } catch (e) {}

              if (selectedStudent) {
                const refreshed = newStudents.find((s) => s.id === selectedStudent.id);
                if (refreshed) setSelectedStudent(refreshed);
              }
            }}
            onNavigateToStudent={(student) => {
              setSelectedStudent(student);
              setActiveTab('students');
            }}
            isManager={isManager}
            teacherName={teacher.displayName}
          />
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
