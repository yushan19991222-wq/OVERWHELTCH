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
      className="fixed inset-0 z-[999998] bg-[#090a0f]/98 backdrop-blur-3xl flex flex-col justify-between p-4 sm:p-6 text-center animate-in fade-in duration-300 font-mono select-none cctv-vignette"
      style={{
        backgroundImage:
          'radial-gradient(circle at center, rgba(0, 216, 255, 0.12) 0%, rgba(9, 10, 15, 0.98) 75%)',
      }}
    >
      {/* Tactical HUD Corner Crosshairs */}
      <div className="pointer-events-none absolute top-3 left-3 text-slate-600 text-xs z-20 select-none">
        + [OVERWATCH:OCULAR_SHIELD]
      </div>
      <div className="pointer-events-none absolute top-3 right-3 text-slate-600 text-xs z-20 select-none">
        [20-20-20_REST_ACTIVE] +
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 text-slate-600 text-xs z-20 select-none">
        + [RETINA_PRESERVATION]
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 text-slate-600 text-xs z-20 select-none">
        [OVERWATCH_OPTICAL] +
      </div>

      {/* Background Cybernetic Grid & CRT Scanlines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-70 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,216,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,216,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0" />

      {/* Top Banner - Overwatch Command Strip */}
      <header className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2 text-[#00d8ff] font-bold tracking-wider">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d8ff]/15 border border-[#00d8ff]/60 text-[#00d8ff] font-bold tracking-wider shadow-[0_0_15px_rgba(0,216,255,0.25)]">
            <span className="w-2 h-2 rounded-full bg-[#00d8ff] animate-pulse shadow-[0_0_8px_#00d8ff]" />
            <span>&gt; OVERWATCH // OCULAR_PROTECTION</span>
          </div>
          <span className="hidden md:inline text-slate-400 text-[11px] tracking-wide">
            &gt; STATUS: 護眼螢幕保護模式 // 睫狀肌放鬆引導中
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a0c10]/90 border border-white/10 text-slate-300 text-xs">
          <Clock className="w-3.5 h-3.5 text-[#00d8ff]" />
          <span className="font-bold tracking-widest">{currentTime}</span>
        </div>
      </header>

      {/* Central Eye Exercise & Rest Display */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-xl mx-auto my-auto px-4">
        {/* Animated Pulsing Eye Portal */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-[#00d8ff]/20 animate-ping" />
          <div className="w-16 h-16 rounded-xl bg-[#00d8ff]/15 border border-[#00d8ff] flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(0,216,255,0.4)]">
            👀
          </div>
        </div>

        <h2 className="text-xl sm:text-3xl font-black text-[#00d8ff] mb-1 uppercase tracking-wider font-mono">
          &gt; PROXIMITY_HAZARD // 距離過近警告
        </h2>

        <p className="text-slate-300 text-xs sm:text-sm mb-5 leading-relaxed max-w-md">
          工作已強行覆蓋！頭部距離螢幕過近，或過長時間未眨眼。
          <br />
          <span className="text-[#ffaa00] font-bold">
            &gt; 請向後靠上椅背、用力眨眼 3 次，並望向 6 公尺遠方放鬆睫狀肌！
          </span>
        </p>

        {/* Dynamic Eye Follow Exercise Animation */}
        <div className="relative w-full max-w-md h-24 mb-4 border border-white/10 rounded-xl bg-[#0a0c10]/95 overflow-hidden flex items-center justify-center p-2 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] backdrop-blur-xl cctv-brackets">
          <div className="absolute inset-0 flex flex-col items-center justify-between p-2 pointer-events-none opacity-40 text-[10px] text-[#00d8ff]">
            <span className="flex items-center gap-1 font-mono">⬆️ 向上望遠 [TARGET_LOCK]</span>
            <div className="w-full flex justify-between px-3 font-mono">
              <span>⬅️ 向左旋轉</span>
              <span>向右旋轉 ➡️</span>
            </div>
            <span className="flex items-center gap-1 font-mono">⬇️ 眨眼深呼吸 [RELAX]</span>
          </div>
          {/* Animated Orbiting Glowing Eye Target */}
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border border-[#00d8ff] bg-[#00d8ff]/20 flex items-center justify-center animate-ping">
              <span className="text-xs">👁️</span>
            </div>
            <span className="ml-2 text-xs font-bold text-[#00d8ff] font-mono">
              &gt; 請隨光點深呼吸放鬆眼部睫狀肌
            </span>
          </div>
        </div>

        {/* Progress Bar & Countdown Card */}
        <div className="w-full max-w-md p-5 rounded-xl bg-[#0a0c10]/95 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] mb-4 backdrop-blur-xl cctv-brackets">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-[#00d8ff]" />
              &gt; 睫狀肌放鬆倒數
            </span>
            <span className="font-mono text-xl font-black text-[#00d8ff]">
              {remainingSeconds.toFixed(0)}s
            </span>
          </div>

          <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden border border-white/10 p-0.5">
            <div
              className="bg-gradient-to-r from-[#00d8ff] via-teal-300 to-[#00ff87] h-full rounded-full transition-all duration-200 shadow-[0_0_12px_#00d8ff]"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>

          <div className="mt-3 text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00ff87]" />
            <span>&gt; 20-20-20 護眼原則：每 20 分鐘遠眺 20 英呎 20 秒</span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-[11px] text-slate-500 hover:text-slate-300 font-mono underline transition py-1 px-3 rounded-full hover:bg-white/5"
        >
          [MANUAL_OVERRIDE // 手動喚醒] 我已坐正後退並深呼吸
        </button>
      </main>

      {/* Footer - Overwatch Strip */}
      <footer className="relative z-10 w-full pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
        <span className="text-[#00d8ff] font-bold">[OVERWATCH // OCULAR_SAFEGUARD]</span>
        <span>保護雙眼，才能看到下班時美麗的夕陽。</span>
        <span className="text-[#00ff87] font-mono hidden sm:inline">&gt; RETINA_OK</span>
      </footer>
    </div>
  );
};
