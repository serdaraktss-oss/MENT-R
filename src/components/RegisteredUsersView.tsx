import React, { useEffect, useState } from 'react';
import {
  Users,
  RefreshCw,
  Database,
  Copy,
  Check,
  Shield,
  User,
  Calendar,
  Code,
  Sparkles,
  Clock,
  Activity,
  LogIn,
  Eye,
  X,
  PlusCircle,
  FileText,
  Search,
} from 'lucide-react';
import { fetchAllRegisteredUsers, AppUserRecord } from '../lib/supabase';
import {
  getAllLoginLogs,
  getUserLoginCount,
  getUserLogsList,
  getUserLastLogin,
  recordUserLogin,
  UserLoginLog,
} from '../lib/userLogTracker';

export const RegisteredUsersView: React.FC = () => {
  const [users, setUsers] = useState<AppUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // User detail modal for login breakdown
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<AppUserRecord | null>(null);
  const [userLogs, setUserLogs] = useState<UserLoginLog[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [copiedLogs, setCopiedLogs] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllRegisteredUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load registered users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Update modal user logs whenever selectedUserForLogs changes
  useEffect(() => {
    if (selectedUserForLogs) {
      const logs = getUserLogsList(selectedUserForLogs.username);
      setUserLogs(logs);
    } else {
      setUserLogs([]);
    }
  }, [selectedUserForLogs]);

  // Overall statistics
  const allLogs = getAllLoginLogs();
  const totalSystemLogins = allLogs.length;

  // Find most active user
  const userCounts = users.map((u) => ({
    username: u.username,
    count: getUserLoginCount(u.username),
  }));

  userCounts.sort((a, b) => b.count - a.count);
  const mostActiveUser = userCounts.length > 0 ? userCounts[0] : null;

  const handleOpenLogsModal = (user: AppUserRecord) => {
    setSelectedUserForLogs(user);
    setLogSearchQuery('');
  };

  const handleAddSimulatedLogin = (username: string, role?: string) => {
    recordUserLogin(username, role);
    loadUsers();
    if (selectedUserForLogs && selectedUserForLogs.username.toLowerCase() === username.toLowerCase()) {
      const updated = getUserLogsList(username);
      setUserLogs(updated);
    }
  };

  const handleCopyLogsText = () => {
    if (!selectedUserForLogs) return;
    const textLines = [
      `=== ${selectedUserForLogs.username.toUpperCase()} SİSTEM GİRİŞ DÖKÜMÜ VE TARİHÇESİ ===`,
      `Toplam Giriş Sayısı: ${userLogs.length} Kez`,
      `Unvan/Rol: ${selectedUserForLogs.role || 'Mentör'}`,
      `Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`,
      '-------------------------------------------------------',
      ...userLogs.map(
        (l, i) => `${i + 1}. Giriş Tarihi: ${l.formattedTime} | Portalı: ${l.deviceInfo} | IP: ${l.ipAddress || '192.168.1.1'}`
      ),
    ].join('\n');

    navigator.clipboard.writeText(textLines);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2500);
  };

  const filteredLogs = userLogs.filter(
    (l) =>
      l.formattedTime.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.deviceInfo.toLowerCase().includes(logSearchQuery.toLowerCase())
  );

  const sqlCode = `-- SUPABASE MENTÖR UYGULAMASI KULLANICILAR TABLOSU (SQL)
-- ======================================================

-- 1. Kullanıcılar Tablosunu Oluşturma
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Mentör',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Row Level Security (RLS) Güvenlik Katmanını Etkinleştirme
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 3. Çakışmayı Önlemek İçin Varsa Eski Kuralları Temizleme
DROP POLICY IF EXISTS "Public Read Users" ON public.app_users;
DROP POLICY IF EXISTS "Public Insert Users" ON public.app_users;
DROP POLICY IF EXISTS "Public Update Users" ON public.app_users;

-- 4. Yeni Erişim İzinlerini Oluşturma
CREATE POLICY "Public Read Users" ON public.app_users FOR SELECT USING (true);
CREATE POLICY "Public Insert Users" ON public.app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Users" ON public.app_users FOR UPDATE USING (true);

-- 5. Varsayılan Yönetici Hesabını Tanımlama (Serdar Aktaş / 12345)
INSERT INTO public.app_users (username, password, role)
VALUES ('Serdar Aktaş', '12345', 'Yönetici')
ON CONFLICT (username) DO NOTHING;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Kayıtlı Kullanıcılar & Giriş Logları</h1>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-full">
                {users.length} Kullanıcı
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sadece Yönetici (Serdar Aktaş) yetkisindeki üye listesi ve kullanıcıların sisteme giriş döküm analizleri.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowSqlModal(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Supabase SQL Kodu</span>
          </button>

          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Users */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kayıtlı Kullanıcı</p>
            <p className="text-xl font-black text-white mt-0.5">{users.length} <span className="text-xs font-normal text-slate-400">Üye</span></p>
          </div>
        </div>

        {/* Total Login Count */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Toplam Giriş İşlemi</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{totalSystemLogins} <span className="text-xs font-normal text-slate-400">Oturum</span></p>
          </div>
        </div>

        {/* Most Active User */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">En Aktif Kullanıcı</p>
            <p className="text-sm font-bold text-amber-300 truncate mt-0.5">
              {mostActiveUser ? `${mostActiveUser.username} (${mostActiveUser.count} Giriş)` : 'Henüz Yok'}
            </p>
          </div>
        </div>
      </div>

      {/* Supabase Connection Status Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-200 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div>
            <span className="font-bold text-white">Supabase Bulut Veri Tabanı Etkin:</span>
            <span className="ml-1 text-slate-300">
              Project ID: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">xeznkvkjdycmiubfyujq</code>
            </span>
          </div>
        </div>
        <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
          <Database className="w-3.5 h-3.5" /> Canlı Giriş Takip Modülü Aktif
        </span>
      </div>

      {/* Users & Login Count Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            Kullanıcı Listesi ve Giriş İstatistikleri
          </h2>
          <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 font-medium">
            🔒 Sadece Serdar Aktaş Yönetici Ekranı
          </span>
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Kayıtlı kullanıcı bulunamadı veya yükleniyor...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">Kullanıcı Adı / Unvan</th>
                  <th className="p-4">Sistem Rolü</th>
                  <th className="p-4 text-center">Giriş Sayısı (Kaç Kere Girdi)</th>
                  <th className="p-4">Son Giriş Tarihi ve Saati</th>
                  <th className="p-4 text-right">Eylemler / Döküm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((user, idx) => {
                  const isAdmin = user.role === 'Yönetici' || user.username.toLowerCase().includes('serdar');
                  const loginCount = getUserLoginCount(user.username);
                  const lastLogin = getUserLastLogin(user.username);

                  return (
                    <tr key={user.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-white flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isAdmin
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                          }`}
                        >
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                            {user.username}
                            {isAdmin && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                                Yönetici
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Kayıt: {user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : 'Sistem'}
                          </p>
                        </div>
                      </td>

                      <td className="p-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full font-bold text-[11px]">
                            <Shield className="w-3 h-3" /> Yönetici (Serdar Aktaş)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full font-semibold text-[11px]">
                            <User className="w-3 h-3" /> Mentör Öğretmen
                          </span>
                        )}
                      </td>

                      {/* Giriş Sayısı */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black shadow-sm ${
                            loginCount > 5
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : loginCount > 0
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          {loginCount} Giriş Yapıldı
                        </span>
                      </td>

                      {/* Son Giriş Tarihi */}
                      <td className="p-4 text-slate-300">
                        {lastLogin ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{lastLogin}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Giriş Kaydı Bulunmuyor</span>
                        )}
                      </td>

                      {/* Eylemler / Detay Döküm Butonu */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAddSimulatedLogin(user.username, user.role)}
                            title="+1 Giriş Ekle (Test)"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer border border-slate-700"
                          >
                            <PlusCircle className="w-4 h-4 text-emerald-400" />
                          </button>

                          <button
                            onClick={() => handleOpenLogsModal(user)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Giriş Dökümü ({loginCount})</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAYLI GİRİŞ DÖKÜMÜ VE TARİHÇE MODALI */}
      {selectedUserForLogs && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {selectedUserForLogs.username} — Sistem Giriş Dökümü & Logları
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kullanıcının hangi tarihlerde ve kaç defa giriş yaptığına dair detaylı döküm listesi.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForLogs(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick User Stats inside Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Toplam Giriş</span>
                <p className="text-lg font-black text-indigo-400">{userLogs.length} Kez Giriş Yapıldı</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Hesap Rolü</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{selectedUserForLogs.role || 'Mentör'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Son Aktif Giriş</span>
                <p className="text-xs font-semibold text-emerald-400 mt-1">
                  {userLogs.length > 0 ? userLogs[0].formattedTime : 'Giriş Yok'}
                </p>
              </div>
            </div>

            {/* Modal Tools: Filter & Copy */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tarih veya cihaz ara..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleAddSimulatedLogin(selectedUserForLogs.username, selectedUserForLogs.role)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Simüle Giriş Ekle</span>
                </button>

                <button
                  onClick={handleCopyLogsText}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  {copiedLogs ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Döküm Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Döküm Metnini Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Logs List Table */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/40">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Bu kullanıcı için filtreye uygun giriş kaydı bulunamadı.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] font-bold sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Giriş Tarihi ve Saati</th>
                      <th className="p-3">Oturum Portalı / Cihaz</th>
                      <th className="p-3">IP Adresi</th>
                      <th className="p-3 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredLogs.map((log, index) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition text-[11px]">
                        <td className="p-3 font-bold text-slate-500">{filteredLogs.length - index}</td>
                        <td className="p-3 font-bold text-slate-100 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{log.formattedTime}</span>
                        </td>
                        <td className="p-3 text-slate-300 font-sans">{log.deviceInfo}</td>
                        <td className="p-3 text-slate-400">{log.ipAddress || '192.168.1.10'}</td>
                        <td className="p-3 text-right font-sans">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">
                            ● Başarılı Giriş
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Giriş logları oturum başladığında otomatik kaydedilir.
              </span>
              <button
                onClick={() => setSelectedUserForLogs(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                Supabase Veri Tabanı SQL Kodu
              </h3>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕ Kapat
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Supabase panelinizde (<strong className="text-emerald-300">SQL Editor</strong>) sekmesini açıp aşağıdaki kodu yapıştırarak <strong className="text-emerald-300">Run</strong> butonuna basmanız yeterlidir:
            </p>

            <div className="relative bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto max-h-72">
              <pre>{sqlCode}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                SQL kodu otomatik tablo ve yönetici hesabını oluşturur.
              </span>

              <button
                onClick={handleCopySql}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>SQL Kodunu Kopyala</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
