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
      className={`rounded-lg p-3.5 border transition-all duration-300 relative overflow-hidden backdrop-blur-md cctv-brackets ${
        isOvertime
          ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.4)] animate-life-drain'
          : 'bg-[#06080e] border-slate-800 shadow-xl'
      }`}
    >
      {/* Top Technical Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] font-mono text-slate-400 mb-3">
        <span className="text-cyan-400 font-bold flex items-center gap-1.5 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          [OVERWATCH // ACTUARY_DOSSIER]
        </span>
        <span className="text-slate-500">SEC-LVL: ALPHA</span>
      </div>

      {/* Top Row: Estimated Body Age & Health Score */}
      <div className="flex items-start justify-between gap-4 mb-3 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>EST_BODY_AGE (生理換算)</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
              {estimatedBodyAge}
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">YRS</span>
            {ageDifference !== 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                  ageDifference > 0
                    ? 'bg-rose-950/80 border border-rose-500/70 text-rose-300'
                    : 'bg-emerald-950/80 border border-emerald-500/70 text-emerald-300'
                }`}
              >
                {ageDifference > 0 ? `+${ageDifference}` : `${ageDifference}`} YRS
              </span>
            )}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            CHRONO: {baseAge}.0 // DELTA: {ageDifference >= 0 ? `+${ageDifference}` : ageDifference}
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            <HeartPulse className="w-3 h-3 text-rose-400" />
            <span>RESERVE_SCORE (存摺)</span>
          </div>
          <div className="flex items-baseline justify-end gap-1 mt-1 font-mono">
            <span className={`text-3xl sm:text-4xl font-black ${scoreColorClass}`}>
              {healthScore}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 mt-0.5">
            {healthScore >= 80 ? '[STATUS: NOMINAL]' : healthScore >= 50 ? '[STATUS: ELEVATED]' : '[STATUS: CRITICAL]'}
          </div>
        </div>
      </div>

      {/* Segmented Surveillance Gauge Bar */}
      <div className="mb-3 relative z-10">
        <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1">
          <span>0 (BANKRUPT)</span>
          <span>50 (WARNING)</span>
          <span>100 (NOMINAL)</span>
        </div>
        <div className="w-full bg-[#030508] h-2 rounded overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-sm bg-gradient-to-r ${barGradient} transition-all duration-500`}
            style={{ width: `${scorePct}%` }}
          />
        </div>
      </div>

      {/* Diagnostic Status Module */}
      <div className="p-2.5 rounded bg-[#070a10] border border-slate-800 flex items-center gap-2.5 relative z-10 font-mono">
        <div className="w-8 h-8 rounded bg-[#030508] border border-slate-800 flex items-center justify-center text-lg shrink-0">
          {statusIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 truncate">{statusTitle}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-cyan-400 border border-slate-800">
              SYS_EVAL
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug truncate mt-0.5">{statusDesc}</p>
        </div>
      </div>

      {/* Overtime Life Drain Warning Box */}
      {isOvertime && (
        <div className="mt-2.5 p-2.5 rounded bg-rose-950/80 border border-rose-500/80 flex items-center justify-between text-xs animate-pulse relative z-10 font-mono">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-rose-900/80 rounded text-rose-300">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div>
              <div className="font-bold text-rose-200 text-xs">[OVERTIME_DRAIN_ACTIVE]</div>
              <div className="text-[10px] text-rose-400">
                -15 PTS / 10m • 超時: {overtimeMinutes}m
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 font-bold text-rose-300 text-[10px] bg-rose-900/50 px-2 py-0.5 rounded border border-rose-700/60">
            <Clock className="w-3 h-3" />
            <span>&gt; {offWorkTime}</span>
          </div>
        </div>
      )}
    </div>
  );
};
