import React, { useState } from 'react';
import { Sparkles, BookOpen, Send, CheckCircle2, HelpCircle, FileText } from 'lucide-react';

export const AiWizardView: React.FC = () => {
  const [topic, setTopic] = useState('Matematik: Logaritma');
  const [difficulty, setDifficulty] = useState('Orta (YKS Düzeyi)');
  const [questionCount, setQuestionCount] = useState('2');
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/ai-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty,
          count: parseInt(questionCount, 10) || 2,
        }),
      });

      const data = await response.json();
      if (data.questions && Array.isArray(data.questions)) {
        setGeneratedQuestions(data.questions);
      } else {
        setErrorMsg('Soru üretilemedi.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-black text-white">AI Öğretmen & Mentör Sihirbazı</h2>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Öğrencilerinizin zayıf olduğu YKS konuları için Gemini 2.5 Flash ile anında özel çalışma soruları ve çözüm adımları üretin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Form */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Soru Üretim Parametreleri
          </h3>

          <form onSubmit={handleGenerateQuestions} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Ders ve Konu
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Matematik: Logaritma">Matematik: Logaritma & Taban Değiştirme</option>
                <option value="Matematik: Trigonometri">Matematik: Trigonometri Toplam-Fark</option>
                <option value="Türkçe: Cümle Ögeleri">Türkçe: Cümle Ögeleri</option>
                <option value="Kimya: Kimyasal Bağlar">Kimya: Kimyasal Bağlar & VSEPR</option>
                <option value="Fizik: Atışlar ve İki Boyutta Hareket">Fizik: İki Boyutta Hareket</option>
                <option value="Geometri: Çemberde Açı ve Teğet">Geometri: Çemberde Teğet Bağıntıları</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Zorluk Derecesi
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Kolay / Temel Kavram">Kolay / Temel Kavram</option>
                <option value="Orta (YKS Düzeyi)">Orta (YKS Düzeyi)</option>
                <option value="Zor / İleri Seviye">Zor / Derece Grubu Düzeyi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Soru Adedi
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">1 Soru</option>
                <option value="2">2 Soru</option>
                <option value="3">3 Soru</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Gemini 2.5 Soru Hazırlıyor...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Soru Üret</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 min-h-[400px]">
            <h3 className="font-bold text-white text-base border-b border-slate-700 pb-3 mb-4 flex items-center justify-between">
              <span>Üretilen Çalışma Soruları</span>
              <span className="text-xs font-normal text-slate-400">Öğrenciye çıktı verilmeye hazır</span>
            </h3>

            {errorMsg && (
              <p className="text-rose-400 text-xs p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                {errorMsg}
              </p>
            )}

            {generatedQuestions.length === 0 ? (
              <div className="text-center py-16 text-slate-500 space-y-2">
                <HelpCircle className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-medium">Lütfen soldaki menüden ders seçip "Soru Üret" butonuna basınız.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-5 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-indigo-400">Soru #{idx + 1} • {q.subject}</span>
                      <span className="text-xs text-slate-400">{q.title}</span>
                    </div>

                    <p className="text-sm font-semibold text-slate-100 leading-relaxed">{q.questionText}</p>

                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {q.options.map((opt: string, oIdx: number) => (
                          <div
                            key={oIdx}
                            className="p-2.5 bg-slate-800 border border-slate-700/60 rounded-lg text-xs text-slate-300"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 mt-2">
                        <strong>Çözüm Adımı: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
