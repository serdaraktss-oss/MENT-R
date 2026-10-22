import React, { useState } from 'react';
import {
  ExternalLink,
  Search,
  Sparkles,
  Bot,
  BrainCircuit,
  Presentation,
  BookOpen,
  Video,
  Mic,
  Palette,
  Globe,
  Compass,
} from 'lucide-react';

interface AiToolItem {
  id: string;
  name: string;
  url: string;
  category: 'Sohbet & Metin' | 'Araştırma & Notlar' | 'Görsel & Sunum' | 'Ses & Video';
  badge: string;
  description: string;
  icon: any;
  accentColor: string; // Tailwind color class e.g. 'emerald'
  badgeBg: string;
  badgeText: string;
  logoBg: string;
  features: string[];
}

export const AI_TOOLS_LIST: AiToolItem[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    category: 'Sohbet & Metin',
    badge: 'OpenAI',
    description: 'Metin üretimi, kodlama, ders anlatım özeti ve genel sohbet tabanlı yapay zeka asistanı.',
    icon: Bot,
    accentColor: 'border-emerald-500/40 hover:border-emerald-500',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeText: 'text-emerald-300',
    logoBg: 'bg-emerald-500/20 text-emerald-400',
    features: ['GPT-4o Modeli', 'Kod & Denklem Çözümü', 'Metin Özetleme'],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    url: 'https://gemini.google.com',
    category: 'Sohbet & Metin',
    badge: 'Google',
    description: 'Google ekosistemiyle entegre, güncel internet erişimli ve çok modlu (multimodal) yapay zeka.',
    icon: Sparkles,
    accentColor: 'border-blue-500/40 hover:border-blue-500',
    badgeBg: 'bg-blue-500/10 border-blue-500/30',
    badgeText: 'text-blue-300',
    logoBg: 'bg-blue-500/20 text-blue-400',
    features: ['Çoklu Modlu (Görsel+Metin)', 'Google Docs Entegrasyonu', 'Hızlı Araştırma'],
  },
  {
    id: 'copilot',
    name: 'Microsoft Copilot',
    url: 'https://copilot.microsoft.com',
    category: 'Sohbet & Metin',
    badge: 'Microsoft',
    description: 'Bing arama altyapısı ve DALL-E görsel üretimi ile güçlendirilmiş kurumsal yapay zeka.',
    icon: Compass,
    accentColor: 'border-sky-500/40 hover:border-sky-500',
    badgeBg: 'bg-sky-500/10 border-sky-500/30',
    badgeText: 'text-sky-300',
    logoBg: 'bg-sky-500/20 text-sky-400',
    features: ['Görsel Üretimi (DALL-E 3)', 'Web Araması', 'Office Desteği'],
  },
  {
    id: 'claude',
    name: 'Claude AI',
    url: 'https://claude.ai',
    category: 'Sohbet & Metin',
    badge: 'Anthropic',
    description: 'Uzun makaleleri, kitapları ve kod bloklarını yüksek mantıksal doğrulukla analiz eden dil modeli.',
    icon: BrainCircuit,
    accentColor: 'border-amber-500/40 hover:border-amber-500',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    badgeText: 'text-amber-300',
    logoBg: 'bg-amber-500/20 text-amber-400',
    features: ['Geniş Bağlam Penceresi', 'Akademik Metin Analizi', 'Yüksek Doğruluk'],
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    url: 'https://www.perplexity.ai',
    category: 'Araştırma & Notlar',
    badge: 'Perplexity',
    description: 'Akademik ve bilimsel kaynakları anlık tarayarak dipnotlu ve kaynakçalı cevaplar sunan yapay zeka motoru.',
    icon: Globe,
    accentColor: 'border-teal-500/40 hover:border-teal-500',
    badgeBg: 'bg-teal-500/10 border-teal-500/30',
    badgeText: 'text-teal-300',
    logoBg: 'bg-teal-500/20 text-teal-400',
    features: ['Canlı İnternet Kaynakçası', 'Akademik Arama Filtresi', 'Dipnotlu Cevaplar'],
  },
  {
    id: 'canva',
    name: 'Canva Magic Studio',
    url: 'https://www.canva.com/magic-studio/',
    category: 'Görsel & Sunum',
    badge: 'Canva',
    description: 'Sunumlar, afişler, grafikler ve görsel tasarımlar için yapay zeka destekli sihirli tasarım araçları.',
    icon: Palette,
    accentColor: 'border-purple-500/40 hover:border-purple-500',
    badgeBg: 'bg-purple-500/10 border-purple-500/30',
    badgeText: 'text-purple-300',
    logoBg: 'bg-purple-500/20 text-purple-400',
    features: ['Görsel Üretimi', 'Otomatik Afiş & Sunum', 'Akıllı Düzenleme'],
  },
  {
    id: 'gamma',
    name: 'Gamma App',
    url: 'https://gamma.app',
    category: 'Görsel & Sunum',
    badge: 'Gamma',
    description: 'Yalnızca bir konu başlığı vererek dakikalar içinde profesyonel slayt, sunum ve web belgesi oluşturur.',
    icon: Presentation,
    accentColor: 'border-violet-500/40 hover:border-violet-500',
    badgeBg: 'bg-violet-500/10 border-violet-500/30',
    badgeText: 'text-violet-300',
    logoBg: 'bg-violet-500/20 text-violet-400',
    features: ['Saniyeler İçinde Slayt', 'Etkileşimli Şablonlar', 'Kolay Dışa Aktar'],
  },
  {
    id: 'notebooklm',
    name: 'NotebookLM',
    url: 'https://notebooklm.google.com',
    category: 'Araştırma & Notlar',
    badge: 'Google Labs',
    description: 'Kendi PDF, ders notu ve kaynak belgelerinizi yükleyip üzerine özel soru sorabileceğiniz kişisel yapay zeka defteri.',
    icon: BookOpen,
    accentColor: 'border-indigo-500/40 hover:border-indigo-500',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/30',
    badgeText: 'text-indigo-300',
    logoBg: 'bg-indigo-500/20 text-indigo-400',
    features: ['PDF & Not Analizi', 'Sadece Sizin Kaynaklarınız', 'Sesli Özet / Podcast'],
  },
  {
    id: 'runway',
    name: 'RunwayML',
    url: 'https://runwayml.com',
    category: 'Ses & Video',
    badge: 'Runway',
    description: 'Metinden video üretimi (Text-to-Video) ve görsel hareketlendirme yapan üretken yapay zeka stüdyosu.',
    icon: Video,
    accentColor: 'border-rose-500/40 hover:border-rose-500',
    badgeBg: 'bg-rose-500/10 border-rose-500/30',
    badgeText: 'text-rose-300',
    logoBg: 'bg-rose-500/20 text-rose-400',
    features: ['Gen-2 / Gen-3 Video AI', 'Görsel Animasyonu', 'Video Efekt Stüdyosu'],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    url: 'https://elevenlabs.io',
    category: 'Ses & Video',
    badge: 'ElevenLabs',
    description: 'İnsan sesinden ayırt edilemeyen, tonlama yeteneği yüksek yapay zeka seslendirme ve dublaj platformu.',
    icon: Mic,
    accentColor: 'border-fuchsia-500/40 hover:border-fuchsia-500',
    badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/30',
    badgeText: 'text-fuchsia-300',
    logoBg: 'bg-fuchsia-500/20 text-fuchsia-400',
    features: ['Doğal Türkçe Seslendirme', 'Ses Klonlama', 'Podcast & Metin Okuma'],
  },
];

export const AiAppsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');

  const categories = ['Tümü', 'Sohbet & Metin', 'Araştırma & Notlar', 'Görsel & Sunum', 'Ses & Video'];

  const filteredTools = AI_TOOLS_LIST.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.badge.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'Tümü' || tool.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Popüler Yapay Zeka Araçları Portalı</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Eğitim & Proje İçin Yapay Zeka Araçları
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Öğrenci takibi, ders materyali hazırlığı, TÜBİTAK/TEKNOFEST proje araştırması ve sunum tasarımı süreçlerinde kullanabileceğiniz en popüler 10 yapay zeka aracına tek tıkla ulaşın.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 shrink-0 space-y-1 text-center md:text-right">
            <span className="text-2xl font-black text-indigo-400">10+</span>
            <p className="text-xs font-bold text-slate-200">Entegre AI Bağlantısı</p>
            <p className="text-[10px] text-slate-400">Hızlı Erişim Linkleri</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Yapay zeka aracı ara (örn: ChatGPT, Gamma)..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <div
              key={tool.id}
              className={`bg-slate-900/90 border ${tool.accentColor} rounded-2xl p-5 shadow-lg transition duration-200 flex flex-col justify-between space-y-4 hover:shadow-indigo-950/40 group`}
            >
              <div className="space-y-3">
                {/* Card Top Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${tool.logoBg} group-hover:scale-105 transition shrink-0`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                        {tool.name}
                      </h3>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${tool.badgeBg} ${tool.badgeText} mt-0.5`}>
                        {tool.badge}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700 shrink-0">
                    {tool.category}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
                  {tool.description}
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tool.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-slate-950/80 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md"
                    >
                      • {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono truncate max-w-[180px]">
                  {tool.url.replace('https://', '')}
                </span>

                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 group-hover:bg-indigo-500"
                >
                  <span>Siteye Git</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Search className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Aramanıza Uygun Yapay Zeka Aracı Bulunamadı</h3>
          <p className="text-xs text-slate-400">
            Lütfen arama kelimenizi veya seçili kategoriyi değiştirerek tekrar deneyin.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('Tümü');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition mt-2"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      )}
    </div>
  );
};
