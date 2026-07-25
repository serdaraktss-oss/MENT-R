import React, { useEffect, useState } from 'react';
import { Users, RefreshCw, Database, Copy, Check, Shield, User, Calendar, Code, Sparkles } from 'lucide-react';
import { fetchAllRegisteredUsers, AppUserRecord } from '../lib/supabase';

export const RegisteredUsersView: React.FC = () => {
  const [users, setUsers] = useState<AppUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Kayıtlı Kullanıcılar (Supabase)</h1>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-full">
                {users.length} Kullanıcı
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sisteme kayıt olan tüm mentör ve öğretmenlerin Supabase veri tabanı listesi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowSqlModal(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
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

      {/* Supabase Connection Status Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div>
            <span className="font-bold text-white">Supabase Bağlantısı Etkin:</span>
            <span className="ml-1 text-slate-300">
              Project ID: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">xeznkvkjdycmiubfyujq</code>
            </span>
          </div>
        </div>
        <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
          <Database className="w-3.5 h-3.5" /> REST API v1 Entegre
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            Sistemdeki Tüm Kullanıcılar Listesi
          </h2>
          <span className="text-xs text-slate-500">Yönetici Paneli Görünümü</span>
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Kayıtlı kullanıcı bulunamadı veya listeleniyor...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">Kullanıcı Adı</th>
                  <th className="p-4">Rol / Unvan</th>
                  <th className="p-4">Kayıt Tarihi</th>
                  <th className="p-4">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((user, idx) => {
                  const isAdmin = user.role === 'Yönetici' || user.username.toLowerCase().includes('serdar');
                  return (
                    <tr key={user.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-white flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                          isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}>
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100">{user.username}</p>
                          <p className="text-[10px] text-slate-500">ID: {user.id ? user.id.substring(0, 8) + '...' : 'Sistem'}</p>
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

                      <td className="p-4 text-slate-400 flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Bugün'}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold">
                          ● Aktif Kullanıcı
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
