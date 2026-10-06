import React from 'react';
import { Sparkles, HeartPulse, AlertTriangle, Flame, Clock } from 'lucide-react';

interface FloatingHUDProps {
  healthScore: number;
  baseAge: number;
  isOvertime: boolean;
  offWorkTime: string;
  overtimeMinutes: number;
}

export const FloatingHUD: React.FC<FloatingHUDProps> = ({
  healthScore,
  baseAge,
  isOvertime,
  offWorkTime,
  overtimeMinutes,
}) => {
  // Formula: Base Age + (100 - Current Score) * 0.8
  const estimatedBodyAge = Number((baseAge + (100 - healthScore) * 0.8).toFixed(1));
  const ageDifference = Number((estimatedBodyAge - baseAge).toFixed(1));

  // Determine status & styling
  let statusIcon = '🧘';
  let statusTitle = '元氣滿滿社畜';
  let statusDesc = '心態極佳，身心皆在顛峰狀態';
  let scoreColorClass = 'text-emerald-400';
  let barGradient = 'from-emerald-500 via-teal-400 to-cyan-400';

  if (healthScore >= 95) {
    statusIcon = '🧘';
    statusTitle = '元氣滿滿社畜';
    statusDesc = '心態極佳，身心皆在顛峰狀態';
    scoreColorClass = 'text-emerald-400';
    barGradient = 'from-emerald-500 via-teal-400 to-cyan-400';
  } else if (healthScore >= 80) {
    statusIcon = '💼';
    statusTitle = '穩健打工人';
    statusDesc = '微量耗損，尚可應付常規專案';
    scoreColorClass = 'text-teal-400';
    barGradient = 'from-teal-500 to-emerald-400';
  } else if (healthScore >= 60) {
    statusIcon = '🥱';
    statusTitle = '電量低落中';
    statusDesc = '咖啡因成癮，頻繁打哈欠與眼澀';
    scoreColorClass = 'text-amber-400';
    barGradient = 'from-amber-500 to-yellow-400';
  } else if (healthScore >= 40) {
    statusIcon = '🧟';
    statusTitle = '辦公室行屍走肉';
    statusDesc = '椎間盤哀嚎，怨念濃烈發酵中';
    scoreColorClass = 'text-orange-400';
    barGradient = 'from-orange-500 to-rose-400';
  } else {
    statusIcon = '💀';
    statusTitle = '半隻腳已入棺';
    statusDesc = '生命體徵微弱，急需遞交離職單';
    scoreColorClass = 'text-rose-400';
    barGradient = 'from-rose-600 via-red-500 to-rose-400';
  }

  const scorePct = Math.min(100, Math.max(0, healthScore));

  return (
    <div
      id="main-health-hud"
      className={`rounded-3xl p-5 border transition-all duration-500 shadow-2xl relative overflow-hidden backdrop-blur-xl ${
        isOvertime
          ? 'bg-rose-950/40 border-rose-500/80 shadow-rose-950/50 animate-life-drain'
          : 'bg-slate-900/80 border-slate-800/90 shadow-slate-950/60'
      }`}
    >
      {/* Ambient background glow */}
      <div
        className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          isOvertime
            ? 'bg-rose-500/20'
            : healthScore >= 80
            ? 'bg-emerald-500/15'
            : healthScore >= 60
            ? 'bg-amber-500/15'
            : 'bg-rose-500/20'
        }`}
      />

      {/* Top Row: Estimated Body Age & Health Score */}
      <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>身體預估年齡</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 font-mono">
              {estimatedBodyAge}
            </span>
            <span className="text-sm font-bold text-slate-400">歲</span>
            {ageDifference !== 0 && (
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full font-mono ${
                  ageDifference > 0
                    ? 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                    : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                }`}
              >
                {ageDifference > 0 ? `+${ageDifference}` : `${ageDifference}`} 歲老化
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            生理基礎年齡: {baseAge} 歲
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>健康存摺點數</span>
          </div>
          <div className="flex items-baseline justify-end gap-1 mt-1 font-mono">
            <span className={`text-3xl sm:text-4xl font-black ${scoreColorClass}`}>
              {healthScore}
            </span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {healthScore >= 80 ? '存摺盈餘' : healthScore >= 50 ? '赤字邊緣' : '破產破產！'}
          </div>
        </div>
      </div>

      {/* Health Score Gauge Bar */}
      <div className="mb-4 relative z-10">
        <div className="w-full bg-slate-950/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500 shadow-sm`}
            style={{ width: `${scorePct}%` }}
          />
        </div>
      </div>

      {/* Dynamic Status Pill */}
      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">
          {statusIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-100 truncate">{statusTitle}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
              診斷狀態
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug truncate mt-0.5">{statusDesc}</p>
        </div>
      </div>

      {/* Overtime Life Drain Warning Box */}
      {isOvertime && (
        <div className="mt-3 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/70 flex items-center justify-between text-xs animate-pulse relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-900/80 rounded-lg text-rose-300">
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="font-black text-rose-200">超時加班中 (壽命光速流失)</div>
              <div className="text-[11px] text-rose-400/90">
                每 10 分鐘扣 15 點生命值 • 已超時 {overtimeMinutes} 分鐘
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 font-mono font-bold text-rose-300 text-xs bg-rose-900/40 px-2.5 py-1 rounded-lg border border-rose-700/50">
            <Clock className="w-3.5 h-3.5" />
            <span>&gt; {offWorkTime}</span>
          </div>
        </div>
      )}
    </div>
  );
};
