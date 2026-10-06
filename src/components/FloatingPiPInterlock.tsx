import React from 'react';
import {
  Shield,
  AlertOctagon,
  Eye,
  Activity,
  UserCheck,
  UserX,
  RotateCw,
  Flame,
  Volume2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { TelemetryData, ActiveHazardAlert } from '../types';

interface FloatingPiPInterlockProps {
  healthScore: number;
  baseAge: number;
  telemetry: TelemetryData;
  activeHazard: ActiveHazardAlert | null;
  isSedentaryLocked: boolean;
  sedentaryRemaining: number;
  isEyeStrainActive: boolean;
  eyeStrainRemaining: number;
  isOvertime: boolean;
  overtimeMinutes: number;
  onDismissHazard?: () => void;
  onEmergencyOverride?: () => void;
  onClosePiP?: () => void;
}

export const FloatingPiPInterlock: React.FC<FloatingPiPInterlockProps> = ({
  healthScore,
  baseAge,
  telemetry,
  activeHazard,
  isSedentaryLocked,
  sedentaryRemaining,
  isEyeStrainActive,
  eyeStrainRemaining,
  isOvertime,
  overtimeMinutes,
  onDismissHazard,
  onEmergencyOverride,
  onClosePiP,
}) => {
  // Estimated body age
  const estimatedAge = Math.max(18, Math.round(baseAge + (100 - healthScore) * 0.8));

  // Determine if there's a blocking state
  const isBlocking = isSedentaryLocked || isEyeStrainActive || (activeHazard && activeHazard.severity === 'critical');

  return (
    <div className="w-full h-full min-h-screen bg-[#070b13] text-slate-200 font-mono flex flex-col p-3 select-none hardware-grid-bg border-2 border-cyan-500/40">
      {/* PiP Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5 text-[10px]">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]" />
          <span>[OHG-PiP // ALWAYS-ON-TOP]</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[9px]">跨桌面置頂阻擋</span>
          {onClosePiP && (
            <button
              onClick={onClosePiP}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]"
              title="關閉置頂視窗"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 1. CRITICAL BLOCKING OVERLAY: SEDENTARY LOCKOUT */}
      {isSedentaryLocked ? (
        <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg bg-rose-950/90 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.5)] text-center animate-pulse">
          <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-rose-400 mb-2 shadow-lg">
            <img
              src="/memes/cat-judge.jpg"
              alt="Meme Judge Cat"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/memes/cat-judge.jpg';
              }}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-rose-300 font-black text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
            <AlertOctagon className="w-4 h-4 animate-bounce text-rose-400" />
            <span>久坐超時！螢幕保護程式中斷中</span>
          </div>
          <p className="text-[10px] text-slate-200 mb-2">
            連貓咪都看不下去了！請立刻起立離開座位！
          </p>

          <div className="w-full p-2 rounded bg-black/60 border border-rose-500/70 mb-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-300">
              {telemetry.isFacePresent ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  仍偵測到人臉！
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <UserX className="w-3.5 h-3.5" />
                  已成功離座倒數中
                </span>
              )}
            </span>
            <span className="text-rose-300 font-black text-base">{sedentaryRemaining}s</span>
          </div>

          {onEmergencyOverride && (
            <button
              onClick={onEmergencyOverride}
              className="text-[9px] text-slate-400 hover:text-white underline"
            >
              [手動解除覆蓋] 站立辦公中
            </button>
          )}
        </div>
      ) : isEyeStrainActive ? (
        /* 2. CRITICAL BLOCKING OVERLAY: EYE STRAIN PROXIMITY */
        <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg bg-cyan-950/90 border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] text-center">
          <div className="w-10 h-10 rounded bg-cyan-900/80 border border-cyan-400 flex items-center justify-center text-xl mb-2">
            👀⚡
          </div>
          <div className="text-cyan-300 font-bold text-xs uppercase tracking-wider mb-1">
            [護眼阻擋] 離螢幕過近！
          </div>
          <p className="text-[10px] text-slate-300 mb-2">
            請立刻向後靠椅背，用力眨眼並望向遠方放鬆睫狀肌！
          </p>
          <div className="text-sm font-bold text-cyan-300 font-mono mb-2">
            倒數 {eyeStrainRemaining} 秒解除
          </div>
          {onDismissHazard && (
            <button
              onClick={onDismissHazard}
              className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px]"
            >
              [我已坐正後退]
            </button>
          )}
        </div>
      ) : activeHazard ? (
        /* 3. HAZARD POPUP (Yawn / Frown / Overtime / Slack) */
        <div
          className={`flex-1 flex flex-col items-center justify-center p-3 rounded-md border text-center transition-all ${
            activeHazard.severity === 'critical'
              ? 'bg-rose-950/80 border-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.25)]'
              : activeHazard.severity === 'warning'
              ? 'bg-amber-950/80 border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
              : 'bg-cyan-950/70 border-cyan-500/70 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
          }`}
        >
          {activeHazard.image && (
            <img
              src={activeHazard.image}
              alt="Hazard Meme"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/memes/cat-judge.jpg';
              }}
              className="w-14 h-14 rounded object-cover border border-slate-700 mb-2 shadow"
            />
          )}
          <div className="text-xs font-bold mb-1 text-slate-100">{activeHazard.title}</div>
          <p className="text-[10px] text-slate-300 mb-2 leading-relaxed">
            {activeHazard.message}
          </p>
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded mb-2.5 ${
              activeHazard.severity === 'critical'
                ? 'bg-rose-500 text-white'
                : activeHazard.severity === 'warning'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-cyan-400 text-slate-950'
            }`}
          >
            {activeHazard.badge}
          </span>
          {onDismissHazard && (
            <button
              onClick={onDismissHazard}
              className="px-3 py-1 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-[10px] transition"
            >
              [確認收到 // DISMISS]
            </button>
          )}
        </div>
      ) : (
        /* 4. NORMAL HUD INSTRUMENT VIEW */
        <div className="flex-1 flex flex-col justify-between gap-2 text-xs">
          {/* Top telemetry cards */}
          <div className="grid grid-cols-2 gap-2">
            {/* Body Age */}
            <div className="p-2.5 rounded bg-[#0b101b] border border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                <span>預估生理年齡</span>
              </div>
              <div className="text-2xl font-black text-cyan-300 mt-0.5">
                {estimatedAge} <span className="text-[10px] text-slate-500">歲</span>
              </div>
              <div className="text-[9px] text-slate-500">基礎: {baseAge} 歲</div>
            </div>

            {/* Health Score */}
            <div className="p-2.5 rounded bg-[#0b101b] border border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>健康存摺點數</span>
                <span className="text-[8px] text-slate-500">/100</span>
              </div>
              <div
                className={`text-2xl font-black mt-0.5 ${
                  healthScore >= 80
                    ? 'text-cyan-300'
                    : healthScore >= 50
                    ? 'text-amber-400'
                    : 'text-rose-400 animate-pulse'
                }`}
              >
                {healthScore}
              </div>
              <div className="text-[9px] text-slate-500">
                {healthScore >= 80 ? '存摺充沛' : healthScore >= 50 ? '赤字邊緣' : '破產破產！'}
              </div>
            </div>
          </div>

          {/* Real-time gauge metrics */}
          <div className="p-2 rounded bg-[#0b101b] border border-slate-800 space-y-1.5 text-[10px]">
            {/* MAR */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">張嘴 MAR:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-[#06090f] h-1.5 rounded overflow-hidden">
                  <div
                    className={`h-full ${telemetry.mar > 0.48 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(100, telemetry.mar * 180)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-bold text-cyan-300">
                  {telemetry.mar.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Proximity */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">距離螢幕:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-[#06090f] h-1.5 rounded overflow-hidden">
                  <div
                    className={`h-full ${telemetry.proximity > 65 ? 'bg-rose-500' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min(100, telemetry.proximity)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-bold text-amber-300">
                  {telemetry.proximity}%
                </span>
              </div>
            </div>

            {/* Desk time */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">連續久坐:</span>
              <span className="font-bold text-rose-400">
                {Math.floor(telemetry.consecutiveDeskSeconds / 60)}分{' '}
                {Math.round(telemetry.consecutiveDeskSeconds % 60)}秒
              </span>
            </div>
          </div>

          {/* Overtime warning */}
          {isOvertime && (
            <div className="p-1.5 rounded bg-rose-950/80 border border-rose-500/80 text-[10px] text-rose-300 flex items-center justify-between animate-pulse">
              <span className="flex items-center gap-1 font-bold">
                <Flame className="w-3 h-3 text-rose-400" />
                超時加班扣命中
              </span>
              <span>+{overtimeMinutes}m</span>
            </div>
          )}

          {/* Status footer */}
          <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-500">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {telemetry.isFacePresent ? 'FACE_LOCKED' : 'USER_ABSENT (摸魚中)'}
            </span>
            <span>置頂保護中</span>
          </div>
        </div>
      )}
    </div>
  );
};
