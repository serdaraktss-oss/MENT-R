import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award, BarChart3 } from 'lucide-react';

export interface ExamHistoryPoint {
  examTitle: string;
  date: string;
  net: number;
}

interface ExamTrendChartProps {
  title: string;
  examType: 'TYT' | 'AYT';
  data: ExamHistoryPoint[];
  accentColor: 'emerald' | 'indigo';
}

export const ExamTrendChart: React.FC<ExamTrendChartProps> = ({
  title,
  examType,
  data,
  accentColor,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 text-center text-slate-400 text-xs">
        Henüz {examType} deneme verisi girilmemiş.
      </div>
    );
  }

  // Calculate min, max, average, and latest trend
  const nets = data.map((d) => d.net);
  const minNet = Math.min(...nets);
  const maxNet = Math.max(...nets);
  const avgNet = (nets.reduce((a, b) => a + b, 0) / nets.length).toFixed(1);

  const firstNet = nets[0];
  const latestNet = nets[nets.length - 1];
  const totalDiff = (latestNet - firstNet).toFixed(1);
  const isOverallPositive = Number(totalDiff) >= 0;

  // Recent diff between last two exams
  const lastTwoDiff = data.length > 1 ? (data[data.length - 1].net - data[data.length - 2].net).toFixed(1) : '0';
  const isRecentPositive = Number(lastTwoDiff) >= 0;

  // SVG dimensions for chart curve
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 30;
  const width = 500; // viewBox width

  // Net scaling
  const minScale = Math.max(0, Math.floor(minNet - 10));
  const maxScale = Math.ceil(maxNet + 10);
  const range = maxScale - minScale || 1;

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX + (index / (data.length - 1)) * (width - 2 * paddingX);
    const y =
      chartHeight -
      paddingY -
      ((item.net - minScale) / range) * (chartHeight - 2 * paddingY);
    return { x, y, ...item };
  });

  // SVG Path generator for smooth line
  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Filled area path under the line
  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - 15} L ${points[0].x} ${chartHeight - 15} Z`
      : '';

  const strokeColor = accentColor === 'emerald' ? '#10b981' : '#6366f1';
  const fillColor = accentColor === 'emerald' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)';
  const badgeBg = accentColor === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center border ${badgeBg}`}>
            {examType}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">{title}</h3>
            <p className="text-[11px] text-slate-400">Toplam {data.length} Deneme Sınavı Kaydı</p>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-slate-700/70 px-2.5 py-1 rounded-lg text-center">
            <span className="text-[9px] text-slate-400 uppercase font-semibold block">Ortalama</span>
            <span className="text-xs font-black text-slate-200">{avgNet} Net</span>
          </div>
          <div className="bg-slate-900 border border-slate-700/70 px-2.5 py-1 rounded-lg text-center">
            <span className="text-[9px] text-slate-400 uppercase font-semibold block">Zirve</span>
            <span className="text-xs font-black text-amber-400">{maxNet} Net</span>
          </div>
          <div className="bg-slate-900 border border-slate-700/70 px-2.5 py-1 rounded-lg text-center">
            <span className="text-[9px] text-slate-400 uppercase font-semibold block">Son Değişim</span>
            <span className={`text-xs font-black flex items-center gap-0.5 ${isRecentPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isRecentPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isRecentPositive ? `+${lastTwoDiff}` : lastTwoDiff}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Chart Graphic */}
      <div className="relative bg-slate-900/90 rounded-xl p-3 border border-slate-700/60 overflow-hidden">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
          <div className="border-b border-slate-600 w-full" />
          <div className="border-b border-slate-600 w-full" />
          <div className="border-b border-slate-600 w-full" />
        </div>

        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full h-44 overflow-visible relative z-10"
        >
          <defs>
            <linearGradient id={`grad-${examType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under line */}
          {points.length > 1 && (
            <path d={areaD} fill={`url(#grad-${examType})`} />
          )}

          {/* Line */}
          {points.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Nodes & Value Labels */}
          {points.map((p, i) => {
            const prevNet = i > 0 ? points[i - 1].net : null;
            const diff = prevNet !== null ? (p.net - prevNet).toFixed(1) : null;
            const isUp = diff !== null && Number(diff) >= 0;

            return (
              <g key={i} className="group cursor-pointer">
                {/* Vertical dash line */}
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={p.x}
                  y2={chartHeight - 15}
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="2 2"
                />

                {/* Outer halo */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="7"
                  fill={strokeColor}
                  fillOpacity="0.3"
                  className="group-hover:scale-125 transition-transform origin-center"
                />

                {/* Node circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#0f172a"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                />

                {/* Net Value Pill on top */}
                <rect
                  x={p.x - 22}
                  y={p.y - 25}
                  width="44"
                  height="18"
                  rx="5"
                  fill="#1e293b"
                  stroke={strokeColor}
                  strokeWidth="1"
                />
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {p.net}
                </text>

                {/* Exam Label at bottom */}
                <text
                  x={p.x}
                  y={chartHeight - 2}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="600"
                >
                  {p.examTitle}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Sequential Fluctuation Breakdown List */}
      <div className="space-y-1.5 pt-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Sınavlar Arası Yükseliş / Düşüş Geçmişi:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {data.map((item, idx) => {
            const prev = idx > 0 ? data[idx - 1] : null;
            const diff = prev ? (item.net - prev.net).toFixed(1) : null;
            const isUp = diff !== null && Number(diff) >= 0;

            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-200 truncate max-w-[130px]">{item.examTitle}</p>
                  <p className="text-[10px] text-slate-400">{item.date}</p>
                </div>

                <div className="text-right">
                  <p className="font-black text-slate-100">{item.net} Net</p>
                  {diff !== null ? (
                    <span className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {isUp ? `+${diff}` : diff}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">Başlangıç</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
