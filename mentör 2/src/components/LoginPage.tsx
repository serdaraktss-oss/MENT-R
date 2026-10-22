import React, { useState } from 'react';
import { Lock, User, GraduationCap, AlertCircle, ArrowRight, CheckCircle2, UserPlus, LogIn } from 'lucide-react';
import { loginAppUser, registerAppUser } from '../lib/supabase';
import { recordUserLogin } from '../lib/userLogTracker';

interface LoginPageProps {
  onLoginSuccess: (teacherName: string, role?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('Serdar Aktaş');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleMode = (mode: boolean) => {
    setIsRegisterMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    if (mode && username === 'Serdar Aktaş') {
      setUsername('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Lütfen kullanıcı adı ve şifre giriniz.');
      return;
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // --- REGISTER MODE ---
        const result = await registerAppUser(username, password);
        if (result.success && result.user) {
          recordUserLogin(result.user.username, result.user.role);
          setSuccessMsg('Kayıt işleminiz başarıyla tamamlandı! Giriş yapılıyor...');
          setTimeout(() => {
            onLoginSuccess(result.user!.username, result.user!.role);
          }, 800);
        } else {
          setErrorMsg(result.error || 'Kayıt yapılırken bir hata oluştu.');
        }
      } else {
        // --- LOGIN MODE ---
        const result = await loginAppUser(username, password);
        if (result.success && result.user) {
          recordUserLogin(result.user.username, result.user.role);
          onLoginSuccess(result.user.username, result.user.role);
        } else {
          if (result.isNotRegistered) {
            setErrorMsg('Bu kullanıcı adı sistemde bulunamadı. Lütfen kayıt ekranına geçerek kayıt olunuz.');
          } else {
            setErrorMsg(result.error || 'Giriş yapılırken bir hata oluştu.');
          }
        }
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      setErrorMsg('İşlem sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Blur Spheres */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-8 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 mb-4">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white font-sans">
            Mentör
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">
            Öğrenci Takip Portalı
          </p>
          
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isRegisterMode ? 'Yeni Kullanıcı Kayıt Ekranı' : 'Yönetici & Mentör Girişi'}</span>
          </div>
        </div>

        {/* Tab switcher between Login and Register */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 mb-6">
          <button
            type="button"
            onClick={() => handleToggleMode(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              !isRegisterMode
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Giriş Yap</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isRegisterMode
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Kayıt Ol</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300 text-xs leading-relaxed animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {errorMsg.includes('bulunamadı') && !isRegisterMode && (
                  <button
                    type="button"
                    onClick={() => handleToggleMode(true)}
                    className="block mt-1.5 font-bold text-indigo-300 hover:underline cursor-pointer"
                  >
                    Şimdi Kayıt Ol &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300 text-xs leading-relaxed animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Kullanıcı Adı */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınızı giriniz"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
              />
            </div>
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi giriniz"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-70 cursor-pointer"
          >
            {isLoading ? (
              <span>Lütfen Bekleyiniz...</span>
            ) : isRegisterMode ? (
              <>
                <span>Kayıt Ol</span>
                <UserPlus className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Giriş Yap</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch mode links */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {!isRegisterMode ? (
            <p>
              Hesabınız yok mu?{' '}
              <button
                type="button"
                onClick={() => handleToggleMode(true)}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
              >
                Kayıt Olun
              </button>
            </p>
          ) : (
            <p>
              Zaten hesabınız var mı?{' '}
              <button
                type="button"
                onClick={() => handleToggleMode(false)}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
              >
                Giriş Yapın
              </button>
            </p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700/60 text-center">
          <p className="text-[11px] text-slate-500">
            Mentör © 2026 • Serdar Aktaş Yönetim & Supabase Veri Tabanı
          </p>
        </div>
      </div>
    </div>
  );
};
