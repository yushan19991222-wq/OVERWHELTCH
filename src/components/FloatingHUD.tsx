import React from 'react';
import {
  Sparkles,
  HeartPulse,
  Flame,
  Clock,
  Activity,
  Smile,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { EmotionData } from '../types';

interface FloatingHUDProps {
  healthScore: number;
  baseAge: number;
  isOvertime: boolean;
  offWorkTime: string;
  overtimeMinutes: number;
  currentEmotion?: EmotionData | null;
}

export const FloatingHUD: React.FC<FloatingHUDProps> = ({
  healthScore,
  baseAge,
  isOvertime,
  offWorkTime,
  overtimeMinutes,
  currentEmotion,
}) => {
  // Formula: Base Age + (100 - Current Score) * 0.8
  const estimatedBodyAge = Number((baseAge + (100 - healthScore) * 0.8).toFixed(1));
  const ageDifference = Number((estimatedBodyAge - baseAge).toFixed(1));

  // Determine status & styling with strictly controlled Overwatch palette
  let statusIcon = '🧘';
  let statusTitle = '元氣滿滿社畜';
  let statusDesc = '心態極佳，身心皆在顛峰狀態';
  let statusLevel = 'PRIME';
  let scoreColorClass = 'text-cyan-400';
  let barColorClass = 'bg-cyan-400';
  let borderAccentClass = 'border-slate-800';

  if (healthScore >= 80) {
    statusIcon = '🧘';
    statusTitle = '元氣滿滿社畜';
    statusDesc = '心態極佳，身心皆在顛峰狀態';
    statusLevel = 'NOMINAL';
    scoreColorClass = 'text-cyan-400';
    barColorClass = 'bg-cyan-400';
    borderAccentClass = 'border-slate-800';
  } else if (healthScore >= 60) {
    statusIcon = '💼';
    statusTitle = '穩健打工人';
    statusDesc = '微量耗損，尚可應付常規專案';
    statusLevel = 'MODERATE';
    scoreColorClass = 'text-cyan-300';
    barColorClass = 'bg-cyan-400';
    borderAccentClass = 'border-slate-800';
  } else if (healthScore >= 40) {
    statusIcon = '🥱';
    statusTitle = '電量低落中';
    statusDesc = '咖啡因成癮，頻繁打哈欠與眼澀';
    statusLevel = 'ELEVATED';
    scoreColorClass = 'text-amber-400';
    barColorClass = 'bg-amber-400';
    borderAccentClass = 'border-amber-500/30';
  } else {
    statusIcon = '💀';
    statusTitle = '半隻腳已入棺';
    statusDesc = '生命體徵微弱，急需遞交離職單';
    statusLevel = 'CRITICAL';
    scoreColorClass = 'text-rose-400';
    barColorClass = 'bg-rose-500';
    borderAccentClass = 'border-rose-500/50';
  }

  const scorePct = Math.min(100, Math.max(0, healthScore));

  return (
    <div
      id="main-health-hud"
      className={`flex-1 rounded-md p-4 border transition-all duration-300 relative overflow-hidden backdrop-blur-md cctv-brackets flex flex-col justify-between gap-3.5 ${
        isOvertime
          ? 'bg-rose-950/30 border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-life-drain'
          : `bg-[#06080e] ${borderAccentClass} shadow-xl`
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────
          HEADER: Dossier Meta & Security Clearance
         ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] font-mono">
        <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wider">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span>[OVERWATCH // ACTUARY_DOSSIER]</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold">
            SEC-LVL: ALPHA
          </span>
          <span className="text-[9px] text-slate-500 hidden sm:inline">REV: 4.2</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: CORE ACTUARIAL METRICS (Highest Importance)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        {/* Dual Primary Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card A: Physiological Age (EST_BODY_AGE) */}
          <div className="p-3 rounded bg-[#030508] border border-slate-800/90 flex flex-col justify-between relative group hover:border-cyan-500/40 transition">
            <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                生理年齡
              </span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                ACTUARY
              </span>
            </div>

            <div className="my-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                  {estimatedBodyAge}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">歲</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono border-t border-slate-850 pt-1.5 mt-0.5">
              <span className="text-slate-500">實際: {baseAge} 歲</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded ${
                  ageDifference > 0
                    ? 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                    : 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300'
                }`}
              >
                {ageDifference > 0 ? `+${ageDifference}` : `${ageDifference}`} 歲
              </span>
            </div>
          </div>

          {/* Card B: Health Reserve Score (RESERVE_SCORE) */}
          <div className="p-3 rounded bg-[#030508] border border-slate-800/90 flex flex-col justify-between relative group hover:border-cyan-500/40 transition">
            <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <HeartPulse className="w-3 h-3 text-rose-400 shrink-0" />
                生命力存摺
              </span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                BALANCE
              </span>
            </div>

            <div className="my-1.5">
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight ${scoreColorClass} drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]`}>
                  {healthScore}
                </span>
                <span className="text-xs text-slate-500 font-bold">/ 100</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono border-t border-slate-850 pt-1.5 mt-0.5">
              <span className="text-slate-500">狀態等級</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded ${
                  healthScore >= 80
                    ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
                    : healthScore >= 50
                    ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                    : 'bg-rose-950/80 border border-rose-500/40 text-rose-300 animate-pulse'
                }`}
              >
                [{statusLevel}]
              </span>
            </div>
          </div>
        </div>

        {/* Life Energy Surveillance Gauge */}
        <div className="p-2.5 rounded bg-[#030508] border border-slate-800/90 font-mono">
          <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 text-slate-300 font-bold">
              <Activity className="w-2.5 h-2.5 text-cyan-400" />
              生命力存摺充盈率
            </span>
            <span className="font-bold text-slate-300">{scorePct}%</span>
          </div>

          {/* Multi-segment Meter */}
          <div className="w-full bg-[#06080e] h-2 rounded overflow-hidden p-0.5 border border-slate-800 relative">
            <div
              className={`h-full rounded-sm ${barColorClass} transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]`}
              style={{ width: `${scorePct}%` }}
            />
          </div>

          <div className="flex justify-between text-[7px] text-slate-500 mt-1">
            <span>0% (耗盡破產)</span>
            <span>50% (低電量警示)</span>
            <span>100% (極致健康)</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: REAL-TIME BIOMETRIC & EMOTIONAL DIAGNOSTICS
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2 font-mono">
        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1">
          <span>// 即時生理與心緒診斷</span>
          <span className="flex-1 h-px bg-slate-850" />
        </div>

        {/* Diagnostic Status (SYS_EVAL) */}
        <div className="p-2.5 rounded bg-[#030508] border border-slate-800/90 flex items-start gap-3 hover:border-slate-700 transition">
          <div className="w-9 h-9 rounded bg-[#070a10] border border-slate-700/80 flex items-center justify-center text-xl shrink-0 mt-0.5 shadow-inner">
            {statusIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-bold text-slate-100">{statusTitle}</span>
              <span className="text-[8px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold shrink-0">
                SYS_EVAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed break-words">{statusDesc}</p>
          </div>
        </div>

        {/* Real-time Emotion Signal (EMOTION) */}
        <div className="p-2.5 rounded bg-[#030508] border border-slate-800/90 flex items-start gap-3 hover:border-slate-700 transition">
          <div className="w-9 h-9 rounded bg-[#070a10] border border-slate-700/80 flex items-center justify-center text-xl shrink-0 mt-0.5 shadow-inner">
            {currentEmotion ? currentEmotion.emoji : '😐'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-bold text-cyan-300">
                {currentEmotion ? currentEmotion.label : '待相機偵測'}
              </span>
              <span className="text-[8px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                EMOTION
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed break-words">
              {currentEmotion
                ? `面部微表情即時解析（神態信號捕捉中）`
                : `啟動攝影機並面向鏡頭，系統將自動解析`}
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CONTINGENCY / OVERTIME ALERT (High Urgency)
         ───────────────────────────────────────────────────────────── */}
      {isOvertime && (
        <div className="p-2.5 rounded bg-rose-950/80 border border-rose-500/80 flex items-center justify-between text-xs animate-pulse font-mono shadow-[0_0_15px_rgba(244,63,94,0.3)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-rose-900/80 rounded border border-rose-500/60 text-rose-200 shrink-0">
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-rose-200 text-[11px] flex items-center gap-1.5 truncate">
                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                <span>[OVERTIME_DRAIN_ACTIVE]</span>
              </div>
              <div className="text-[9px] text-rose-300 mt-0.5 truncate">
                生命力扣減: -15 PTS / 10m • 已超時 {overtimeMinutes} 分鐘
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 font-bold text-rose-200 text-[9px] bg-rose-900/90 px-2 py-1 rounded border border-rose-600 shrink-0">
            <Clock className="w-3 h-3 text-rose-300" />
            <span>&gt; {offWorkTime}</span>
          </div>
        </div>
      )}
    </div>
  );
};

