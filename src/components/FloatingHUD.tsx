import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  HeartPulse,
  Clock,
  Activity,
  Zap,
  Battery,
  Flame,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Camera,
  FolderArchive,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { EmotionData } from '../types';

interface FloatingHUDProps {
  healthScore: number;
  baseAge: number;
  isOvertime: boolean;
  offWorkTime: string;
  overtimeMinutes: number;
  currentEmotion?: EmotionData | null;
  isClockedOut?: boolean;
  onClockInAgain?: () => void;
  onClockOut?: () => void;
  onOpenCandidGallery?: () => void;
  candidCount?: number;
}

export const FloatingHUD: React.FC<FloatingHUDProps> = ({
  healthScore,
  baseAge,
  isOvertime,
  offWorkTime,
  overtimeMinutes,
  currentEmotion,
  isClockedOut,
  onClockInAgain,
  onClockOut,
  onOpenCandidGallery,
  candidCount = 0,
}) => {
  // Real-time tick for exact off-work chronograph countdown (100ms precision)
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const resolvedOffWorkTime = offWorkTime || '17:30';

  const { targetHours, targetMinutes } = useMemo(() => {
    const parts = (resolvedOffWorkTime).split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    return {
      targetHours: isNaN(h) ? 17 : Math.min(23, Math.max(0, h)),
      targetMinutes: isNaN(m) ? 30 : Math.min(59, Math.max(0, m)),
    };
  }, [resolvedOffWorkTime]);

  const isAfterOffWork = useMemo(() => {
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    return currentH > targetHours || (currentH === targetHours && currentM >= targetMinutes);
  }, [now, targetHours, targetMinutes]);

  const getClockOutText = () => {
    if (isClockedOut) return '查看結算單';
    if (isOvertime || isAfterOffWork) return '加班打卡';
    return '提早下班去';
  };

  // Compute live stopwatch chronograph breakdown
  const { hoursStr, minsStr, secsStr, msStr, isOverdue } = useMemo(() => {
    try {
      const target = new Date(now);
      target.setHours(targetHours, targetMinutes, 0, 0);

      const diffMs = target.getTime() - now.getTime();
      const isPastOffWorkTime = diffMs <= 0;

      // When either real time passed off-work time OR overtime mode is active
      if (isPastOffWorkTime || isOvertime) {
        let elapsedOvertimeMs = 0;
        if (isPastOffWorkTime) {
          elapsedOvertimeMs = Math.abs(diffMs);
        } else if (isOvertime) {
          // If manually simulated before scheduled off-work time
          elapsedOvertimeMs = Math.max(600000, (overtimeMinutes || 10) * 60 * 1000);
        }

        const hrs = Math.floor(elapsedOvertimeMs / (1000 * 60 * 60));
        const mins = Math.floor((elapsedOvertimeMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((elapsedOvertimeMs % (1000 * 60)) / 1000);
        const ms = Math.floor((elapsedOvertimeMs % 1000) / 100);

        return {
          hoursStr: String(hrs).padStart(2, '0'),
          minsStr: String(mins).padStart(2, '0'),
          secsStr: String(secs).padStart(2, '0'),
          msStr: String(ms),
          isOverdue: true,
        };
      }

      // Normal Countdown to Scheduled Off-Work Time
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      const ms = Math.floor((diffMs % 1000) / 100);

      return {
        hoursStr: String(hrs).padStart(2, '0'),
        minsStr: String(mins).padStart(2, '0'),
        secsStr: String(secs).padStart(2, '0'),
        msStr: String(ms),
        isOverdue: false,
      };
    } catch {
      return { hoursStr: '00', minsStr: '00', secsStr: '00', msStr: '0', isOverdue: false };
    }
  }, [now, targetHours, targetMinutes, isOvertime, overtimeMinutes]);

  // Formula: Base Age + (100 - Current Score) * 0.8
  const estimatedBodyAge = Number((baseAge + (100 - healthScore) * 0.8).toFixed(1));
  const ageDifference = Number((estimatedBodyAge - baseAge).toFixed(1));

  // Body Battery & Estimated Focus Endurance
  const batteryPct = Math.min(100, Math.max(0, healthScore));
  const estFocusHours = (Math.max(0.5, (healthScore / 100) * 6.5)).toFixed(1);
  
  // Dynamic Drain Rate Status
  let drainText = '平穩放電 (1.0x)';
  let drainBadgeColor = 'text-cyan-300 bg-cyan-950/80 border-cyan-500/40';

  if (isOvertime) {
    drainText = '超時燃燒 (2.5x)';
    drainBadgeColor = 'text-rose-300 bg-rose-950/80 border-rose-500/60 animate-pulse';
  } else if (healthScore < 50) {
    drainText = '重度耗損 (1.8x)';
    drainBadgeColor = 'text-amber-300 bg-amber-950/80 border-amber-500/50';
  } else if (currentEmotion?.primaryEmotion === 'smile' || currentEmotion?.primaryEmotion === 'calm') {
    drainText = '修復回血 (0.4x)';
    drainBadgeColor = 'text-emerald-300 bg-emerald-950/80 border-emerald-500/50';
  }

  // Determine status & styling with strictly controlled Overwatch palette
  let statusLevel = 'PRIME';
  let scoreColorClass = 'text-cyan-400';
  let borderAccentClass = 'border-slate-800';

  if (healthScore >= 80) {
    statusLevel = 'NOMINAL';
    scoreColorClass = 'text-cyan-400';
    borderAccentClass = 'border-slate-800';
  } else if (healthScore >= 60) {
    statusLevel = 'MODERATE';
    scoreColorClass = 'text-cyan-300';
    borderAccentClass = 'border-slate-800';
  } else if (healthScore >= 40) {
    statusLevel = 'ELEVATED';
    scoreColorClass = 'text-amber-400';
    borderAccentClass = 'border-amber-500/30';
  } else {
    statusLevel = 'CRITICAL';
    scoreColorClass = 'text-rose-400';
    borderAccentClass = 'border-rose-500/50';
  }

  return (
    <div
      id="main-health-hud"
      className={`rounded-md p-4 border transition-all duration-300 relative overflow-hidden backdrop-blur-md cctv-brackets flex flex-col gap-3.5 sm:gap-4 ${
        isOvertime
          ? 'bg-rose-950/30 border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-life-drain'
          : `bg-[#06080e] ${borderAccentClass} shadow-xl`
      }`}
    >
      {/* HEADER: Unified Style */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#00d8ff] animate-pulse shadow-[0_0_8px_#00d8ff] shrink-0" />
          <span className="text-xs font-mono font-bold text-[#00d8ff] tracking-wider uppercase truncate">
            [HEALTH_DOSSIER]
          </span>
        </div>
      </div>

      {/* SECTION 1: CORE ACTUARIAL METRICS */}
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
              <span className="text-[8px] px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                ACTUARY
              </span>
            </div>

            <div className="my-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                  {estimatedBodyAge}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">歲</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono border-t border-slate-850 pt-1.5 mt-0.5">
              <span className="text-slate-400">實際: {baseAge} 歲</span>
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
              <span className="text-[8px] px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                BALANCE
              </span>
            </div>

            <div className="my-1.5">
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight ${scoreColorClass} drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]`}>
                  {healthScore}
                </span>
                <span className="text-xs text-slate-400 font-bold">/ 100</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono border-t border-slate-850 pt-1.5 mt-0.5">
              <span className="text-slate-400">狀態等級</span>
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

        {/* Body Battery & Focus Endurance Matrix */}
        <div className="p-2.5 rounded bg-[#030508] border border-slate-800/90 font-mono flex flex-col justify-between gap-1.5 hover:border-slate-750 transition">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-200 font-bold">
              <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>人體電池與續航</span>
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${drainBadgeColor} flex items-center gap-1`}>
              <span>{drainText}</span>
            </span>
          </div>

          {/* 10-Segment Tactical Battery Array */}
          <div className="flex items-center gap-1 w-full my-0.5">
            {[...Array(10)].map((_, i) => {
              const active = (i + 1) * 10 <= batteryPct || (i * 10 < batteryPct && batteryPct % 10 > 3);
              let segColor = 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]';
              if (batteryPct < 50) segColor = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]';
              else if (batteryPct < 75) segColor = 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]';

              return (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                    active ? segColor : 'bg-slate-900 border border-slate-800'
                  }`}
                />
              );
            })}
          </div>

          {/* Battery Status & Estimated Endurance */}
          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
            <span className="text-slate-400">
              電量: <span className={`font-bold font-mono ${batteryPct < 50 ? 'text-rose-400' : 'text-cyan-300'}`}>{batteryPct}%</span>
            </span>
            <span className="text-slate-300 font-mono font-bold flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-slate-400" />
              <span>預估專注續航:</span>
              <span className="text-cyan-300 text-[10px] font-black font-mono">~{estFocusHours}h</span>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: FREEDOM CHRONO STOPWATCH */}
      <div className="font-mono border-none pt-0">
        {/* High-Tension Tactical Stopwatch Card */}
        <div
          className={`p-3 rounded-lg bg-[#020408] border-none relative overflow-hidden flex flex-col justify-between gap-2.5 transition-all ${
            isOverdue || isOvertime
              ? 'ring-1 ring-rose-500/30'
              : 'ring-1 ring-cyan-500/20'
          }`}
        >
          {/* Subtle Scanline Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-25 pointer-events-none" />

          {/* Top Status Strip */}
          <div className="flex items-center justify-between z-10 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isClockedOut
                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]'
                    : isOverdue || isOvertime
                    ? 'bg-rose-500 animate-ping shadow-[0_0_6px_#f43f5e]'
                    : 'bg-cyan-400 animate-pulse shadow-[0_0_6px_#06b6d4]'
                }`}
              />
              <span className={`text-[11px] font-bold tracking-wider truncate ${isClockedOut ? 'text-zinc-400' : 'text-zinc-200'}`}>
                {isClockedOut ? '已打卡下班' : isOverdue || isOvertime ? '超時無償加班中' : '下班倒數碼表'}
              </span>
            </div>

            {isClockedOut ? (
              onClockInAgain && (
                <button
                  onClick={onClockInAgain}
                  className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[9px] font-bold transition shrink-0 cursor-pointer flex items-center gap-1"
                  title="重新啟動下班碼表"
                >
                  <RotateCcw className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span>重新上班</span>
                </button>
              )
            ) : (isOverdue || isOvertime) && onClockOut ? (
              <button
                onClick={onClockOut}
                className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-850 border border-rose-500/80 text-rose-300 text-[9px] font-bold transition shrink-0 cursor-pointer flex items-center gap-1"
                title="立即打卡下班並領取結算收據"
              >
                <span>打卡下班</span>
              </button>
            ) : (
              /* 過勞風險 Tag: Replaces [COUNTDOWN] */
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-wider uppercase flex items-center gap-1 shrink-0 ${
                  healthScore >= 80
                    ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
                    : healthScore >= 50
                    ? 'bg-zinc-900 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-900 text-rose-300 border-rose-500/50 animate-pulse'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    healthScore >= 80
                      ? 'bg-cyan-400'
                      : healthScore >= 50
                      ? 'bg-amber-400'
                      : 'bg-rose-500 animate-ping'
                  }`}
                />
                <span>過勞風險: {healthScore >= 80 ? 'LOW' : healthScore >= 50 ? 'MED' : 'CRIT'}</span>
              </span>
            )}
          </div>

          {/* Digital Stopwatch or Clocked Out Sealed Banner */}
          {isClockedOut ? (
            <div className="bg-[#050505] border border-zinc-800 rounded-md p-2.5 flex items-center justify-between shadow-inner relative z-10 font-mono">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-300 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-200 tracking-wider">SHIFT_CLOSED</span>
                    <span className="text-[8px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      已離席
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-500 truncate mt-0.5">
                    本日工時與健康存摺已結算封存
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <div className="text-xs font-bold text-zinc-400 tabular-nums">00:00:00</div>
                <div className="text-[8px] text-zinc-600 font-bold tracking-widest uppercase">OFF DUTY</div>
              </div>
            </div>
          ) : (
            /* High-Tension Digital Stopwatch Digits Display */
            <div className="bg-[#050505] border border-zinc-800 rounded-md p-2 flex items-center justify-center gap-1 shadow-inner relative z-10 font-mono">
              {/* Hours Block */}
              <div className="flex flex-col items-center">
                <div className="bg-black/90 px-2 py-0.5 rounded border border-zinc-800 shadow-inner">
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-wider tabular-nums ${
                      isOverdue || isOvertime
                        ? 'text-rose-400'
                        : 'text-zinc-100'
                    }`}
                  >
                    {hoursStr}
                  </span>
                </div>
                <span className="text-[7px] text-zinc-500 uppercase tracking-widest mt-0.5">HRS</span>
              </div>

              <span className="text-xl font-bold text-zinc-600 mb-2">:</span>

              {/* Minutes Block */}
              <div className="flex flex-col items-center">
                <div className="bg-black/90 px-2 py-0.5 rounded border border-zinc-800 shadow-inner">
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-wider tabular-nums ${
                      isOverdue || isOvertime
                        ? 'text-rose-400'
                        : 'text-zinc-200'
                    }`}
                  >
                    {minsStr}
                  </span>
                </div>
                <span className="text-[7px] text-zinc-500 uppercase tracking-widest mt-0.5">MIN</span>
              </div>

              <span className="text-xl font-bold text-zinc-600 mb-2">:</span>

              {/* Seconds Block */}
              <div className="flex flex-col items-center">
                <div className="bg-black/90 px-2 py-0.5 rounded border border-zinc-800 shadow-inner">
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-wider tabular-nums ${
                      isOverdue || isOvertime
                        ? 'text-rose-400'
                        : 'text-zinc-200'
                    }`}
                  >
                    {secsStr}
                  </span>
                </div>
                <span className="text-[7px] text-zinc-500 uppercase tracking-widest mt-0.5">SEC</span>
              </div>

              {/* Milliseconds Fraction */}
              <div className="flex flex-col items-center pl-0.5">
                <div className="bg-black/70 px-1 py-0.5 rounded border border-zinc-800 shadow-inner">
                  <span className="text-sm sm:text-base font-bold text-zinc-400 tabular-nums">
                    .{msStr}
                  </span>
                </div>
                <span className="text-[7px] text-zinc-500 uppercase tracking-widest mt-0.5">MS</span>
              </div>
            </div>
          )}

          {/* Status Descriptor Subline */}
          {!isClockedOut && (
            <div className="flex items-center justify-between text-[10px] font-mono px-1 z-10">
              <span className="text-zinc-500 flex items-center gap-1">
                <span>{isOverdue || isOvertime ? '超時加班累計' : `表定下班: ${resolvedOffWorkTime}`}</span>
              </span>
              <span className={isOverdue || isOvertime ? 'text-rose-400 font-bold' : 'text-cyan-300 font-bold'}>
                {isOverdue || isOvertime
                  ? `已超時 ${hoursStr}:${minsStr}:${secsStr}`
                  : `剩餘 ${parseInt(hoursStr, 10)}小時${parseInt(minsStr, 10)}分`}
              </span>
            </div>
          )}

          {/* Bottom Action Area: Flexible Left Button & Compact Vertical Right Entry */}
          <div className="flex items-stretch gap-2 w-full font-mono h-[56px]">
            {/* Left Button: Clock Out / Receipt Button (Flexible Main Width) */}
            {onClockOut && (
              <button
                onClick={onClockOut}
                className={`flex-1 min-w-0 px-3.5 py-2 rounded-md border transition cursor-pointer flex items-center justify-between group shadow-sm text-left ${
                  isClockedOut
                    ? 'bg-[#0a0a0a] hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                    : isOvertime
                    ? 'bg-rose-950/60 hover:bg-rose-900/80 border-rose-500/70 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                    : isAfterOffWork
                    ? 'bg-zinc-200 hover:bg-white text-zinc-950 font-bold border-zinc-300 shadow-sm'
                    : 'bg-cyan-950/70 hover:bg-cyan-900/80 border-cyan-500/50 hover:border-cyan-400/80 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.18)]'
                }`}
                title={isClockedOut ? '檢視今日結算單（已凍結）' : '打卡下班並查看今日結算單'}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Unified Frameless Icon */}
                  <div className="shrink-0 flex items-center justify-center">
                    {isClockedOut ? (
                      <FileText className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                    ) : isOvertime ? (
                      <Clock className="w-5 h-5 text-rose-400 group-hover:scale-105 transition-all" />
                    ) : isAfterOffWork ? (
                      <Clock className="w-5 h-5 text-zinc-950 group-hover:scale-105 transition-all" />
                    ) : (
                      <Clock className="w-5 h-5 text-cyan-300 group-hover:text-cyan-200 group-hover:scale-105 transition-all" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 justify-center">
                    <span
                      className={`text-xs font-bold tracking-wider truncate leading-tight ${
                        isClockedOut
                          ? 'text-zinc-200 group-hover:text-white'
                          : isOvertime
                          ? 'text-rose-200 group-hover:text-white'
                          : isAfterOffWork
                          ? 'text-zinc-950'
                          : 'text-cyan-100 group-hover:text-white'
                      }`}
                    >
                      {getClockOutText()}
                    </span>
                    <span
                      className={`text-[9px] tracking-tight truncate leading-tight mt-0.5 ${
                        isAfterOffWork
                          ? 'text-zinc-700 font-semibold'
                          : isClockedOut
                          ? 'text-zinc-500'
                          : isOvertime
                          ? 'text-rose-400/80'
                          : 'text-cyan-400/80 group-hover:text-cyan-300'
                      }`}
                    >
                      {isClockedOut ? '本日戰報已封存' : `表定 ${offWorkTime || '17:30'}`}
                    </span>
                  </div>
                </div>

                <ArrowUpRight
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ml-2 ${
                    isAfterOffWork
                      ? 'text-zinc-950'
                      : isClockedOut
                      ? 'text-zinc-500 group-hover:text-zinc-300'
                      : isOvertime
                      ? 'text-rose-400 group-hover:text-rose-200'
                      : 'text-cyan-400 group-hover:text-cyan-200'
                  }`}
                />
              </button>
            )}

            {/* Right Button: Candid Gallery (Vertical Icon + Text, Clean Frameless, Balanced) */}
            {onOpenCandidGallery && (
              <button
                onClick={onOpenCandidGallery}
                className="w-20 sm:w-22 shrink-0 px-2.5 pt-3 pb-2 rounded-md border border-zinc-800 hover:border-zinc-700 bg-[#0a0a0a] hover:bg-zinc-900 transition cursor-pointer flex flex-col items-center justify-center gap-1 group shadow-sm text-center relative"
                title="檢視工位抓拍紀錄存證相簿"
              >
                <div className="relative flex items-center justify-center">
                  <Camera className="w-5 h-5 text-zinc-400 group-hover:text-cyan-400 group-hover:scale-105 transition-all" />
                  {candidCount > 0 && (
                    <span className="absolute -top-1 -right-3 z-10 px-1 min-w-[15px] h-3.5 flex items-center justify-center text-center bg-cyan-950 text-cyan-300 border border-cyan-400/80 text-[9px] font-bold font-mono rounded-full leading-none shadow-[0_0_8px_rgba(6,182,212,0.45)]">
                      {candidCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors tracking-wider leading-tight">
                  工位相簿
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
