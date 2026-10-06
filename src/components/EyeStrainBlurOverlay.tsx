import React, { useState, useEffect } from 'react';
import { Eye, RotateCw, Sparkles, Clock, AlertCircle } from 'lucide-react';

interface EyeStrainBlurOverlayProps {
  isOpen: boolean;
  progressPct: number;
  remainingSeconds: number;
  onDismiss: () => void;
}

export const EyeStrainBlurOverlay: React.FC<EyeStrainBlurOverlayProps> = ({
  isOpen,
  progressPct,
  remainingSeconds,
  onDismiss,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="eye-strain-screensaver-overlay"
      className="fixed inset-0 z-[999998] bg-[#030811]/95 backdrop-blur-3xl flex flex-col justify-between p-4 sm:p-6 text-center animate-in fade-in duration-300 font-mono select-none"
    >
      {/* Background Cybernetic Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.18)_0%,rgba(3,8,17,0.95)_70%)] z-0" />

      {/* Top Banner */}
      <header className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-cyan-900/60 text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wider animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
          <span>[OPTICAL SAFETY SCREENSAVER // 護眼螢幕保護模式]</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#090d18] border border-cyan-950 text-slate-300 text-xs">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold tracking-widest">{currentTime}</span>
        </div>
      </header>

      {/* Central Eye Exercise & Rest Display */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-xl mx-auto my-auto px-4">
        {/* Animated Pulsing Eye Portal */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-cyan-500/20 animate-ping" />
          <div className="w-20 h-20 rounded-2xl bg-cyan-950/90 border-2 border-cyan-400 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(6,182,212,0.5)]">
            👀
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-cyan-300 mb-2 uppercase tracking-wide">
          [SCREEN_PROXIMITY_HAZARD]
        </h2>

        <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed max-w-md">
          工作已強行覆蓋！頭部距離螢幕過近，或過長時間未眨眼。
          <br />
          <span className="text-cyan-400 font-bold">
            請向後靠上椅背、用力眨眼 3 次，並望向 6 公尺遠方放鬆睫狀肌！
          </span>
        </p>

        {/* Dynamic Eye Follow Exercise Animation */}
        <div className="relative w-full max-w-md h-24 mb-4 border border-cyan-800/80 rounded-2xl bg-[#050b16]/90 overflow-hidden flex items-center justify-center p-2 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <div className="absolute inset-0 flex flex-col items-center justify-between p-2 pointer-events-none opacity-40 text-[10px] text-cyan-300">
            <span className="flex items-center gap-1">⬆️ 向上望遠</span>
            <div className="w-full flex justify-between px-3">
              <span>⬅️ 向左旋轉</span>
              <span>向右旋轉 ➡️</span>
            </div>
            <span className="flex items-center gap-1">⬇️ 眨眼深呼吸</span>
          </div>
          {/* Animated Orbiting Glowing Eye Target */}
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border border-cyan-400/80 bg-cyan-500/20 flex items-center justify-center animate-ping">
              <span className="text-xs">👁️</span>
            </div>
            <span className="ml-2 text-xs font-bold text-cyan-300 font-mono">
              請隨光點深呼吸放鬆眼部睫狀肌
            </span>
          </div>
        </div>

        {/* Progress Bar & Countdown Card */}
        <div className="w-full max-w-md p-5 rounded-xl bg-[#070e1c] border border-cyan-500/70 shadow-[0_0_40px_rgba(6,182,212,0.3)] mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              睫狀肌放鬆倒數中
            </span>
            <span className="font-mono text-base font-black text-cyan-300">
              {remainingSeconds.toFixed(0)}s
            </span>
          </div>

          <div className="w-full bg-[#03060c] rounded-full h-3 overflow-hidden border border-cyan-900/80 p-0.5">
            <div
              className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 h-full rounded-full transition-all duration-200 shadow-[0_0_10px_#06b6d4]"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>

          <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>20-20-20 護眼原則：每 20 分鐘遠眺 20 英呎 20 秒</span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-xs text-slate-500 hover:text-slate-300 font-mono underline transition py-1 px-3 rounded hover:bg-slate-900/60"
        >
          [MANUAL_CLEAR // 手動喚醒] 我已坐正後退並深呼吸
        </button>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
        <span className="text-cyan-400 font-bold">[OCULAR_SAFEGUARD]</span>
        <span>保護雙眼，才能看到下班時美麗的夕陽。</span>
      </footer>
    </div>
  );
};
