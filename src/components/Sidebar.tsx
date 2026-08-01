import React from 'react';
import { NavTab } from '../types';
import { GraduationCap, Users, FolderCheck, FileSpreadsheet, Sparkles, LogOut, Shield, Award, Rocket, Bot, UserCheck } from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  teacherName: string;
  userRole?: string;
  onLogout: () => void;
  studentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  teacherName,
  userRole,
  onLogout,
  studentCount,
}) => {
  const isManager =
    (userRole && userRole.toLowerCase().includes('yönetici')) ||
    teacherName.toLowerCase().includes('serdar aktaş') ||
    teacherName.toLowerCase().includes('serdar aktas');

  const userInitials = teacherName
    ? teacherName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'M';

  const allNavItems = [
    {
      id: 'students' as NavTab,
      label: 'Öğrenciler',
      icon: Users,
      badge: `${studentCount} Öğrenci`,
      description: 'Öğrenci Seçimi & Program Detayı',
    },
    {
      id: 'annual-plans' as NavTab,
      label: 'Yıllık Planlar (Belgeler)',
      icon: FolderCheck,
      description: 'Serdar Aktaş Özel • Branş Müfredatı',
    },
    {
      id: 'yks-exams' as NavTab,
      label: 'Denemeler',
      icon: FileSpreadsheet,
      description: 'Serdar Aktaş Özel • Deneme Arşivi',
    },
    {
      id: 'ai-tools' as NavTab,
      label: 'AI Program & Analiz',
      icon: Sparkles,
      description: 'Akıllı Müfredat & Eksik Analizi',
    },
    {
      id: 'ai-apps' as NavTab,
      label: 'Yapay Zeka Araçları',
      icon: Bot,
      badge: '10 AI Bağlantısı',
      description: 'ChatGPT, Gemini, Claude & Diğerleri',
    },
    {
      id: 'tubitak' as NavTab,
      label: 'TÜBİTAK Projeleri',
      icon: Award,
      description: '2204 Araştırma Raporu Taslağı',
      isManagerOnly: true,
    },
    {
      id: 'teknofest' as NavTab,
      label: 'TEKNOFEST Projeleri',
      icon: Rocket,
      description: 'Havacılık & İnovasyon Detay Raporu',
      isManagerOnly: true,
    },
    {
      id: 'registered-users' as NavTab,
      label: 'Kayıtlı Kullanıcılar',
      icon: UserCheck,
      badge: 'Supabase',
      description: 'Serdar Aktaş Özel • Üye Yönetimi',
      isManagerOnly: true,
    },
  ];

  const navItems = allNavItems.filter((item) => !item.isManagerOnly || isManager);

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white font-sans">
              Mentör
            </h1>
            <p className="text-[11px] font-medium text-slate-400">
              Öğrenci Takip Portalı
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4 space-y-1.5">
          <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Ana Menü</span>
            <span className="text-[10px] text-indigo-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> {isManager ? 'Yönetici' : 'Mentör'}
            </span>
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div className="truncate">
                    <p className="text-sm leading-tight font-medium truncate">{item.label}</p>
                    <p className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1 ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / Teacher Profile Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">{teacherName || 'Giriş Yapan Kullanıcı'}</p>
              <p className="text-[10px] text-indigo-400 font-medium">{isManager ? 'Sistem Yöneticisi' : 'Mentör'}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Çıkış Yap"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
