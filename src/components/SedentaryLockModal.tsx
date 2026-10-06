import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  UserX,
  AlertOctagon,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Zap,
  Activity,
  Flame,
} from 'lucide-react';

interface SedentaryLockModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  isFacePresent: boolean;
  onEmergencyOverride: () => void;
}

export const SedentaryLockModal: React.FC<SedentaryLockModalProps> = ({
  isOpen,
  remainingSeconds,
  isFacePresent,
  onEmergencyOverride,
}) => {
  // Current real-time clock for screensaver feel
  const [currentTime, setCurrentTime] = useState<string>('');
  const [keyPressAttempted, setKeyPressAttempted] = useState<boolean>(false);
  const keyPressTimeoutRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // DVD Screensaver floating position state (percentage 0 to 80)
  const [bouncingPos, setBouncingPos] = useState({ x: 20, y: 30 });
  const velocityRef = useRef({ vx: 0.18, vy: 0.14 });
  const animFrameRef = useRef<number | null>(null);

  // Update real-time digital clock
  useEffect(() => {
    if (!isOpen) return;
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('zh-TW', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard interruption detector (simulate screensaver keypress refusal)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape or Space or any key: show screensaver refusal
      e.preventDefault();
      setKeyPressAttempted(true);
      if (keyPressTimeoutRef.current) clearTimeout(keyPressTimeoutRef.current);
      keyPressTimeoutRef.current = window.setTimeout(() => {
        setKeyPressAttempted(false);
      }, 2500);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isOpen]);

  // Subtle screensaver drifting / floating animation
  useEffect(() => {
    if (!isOpen) return;

    let posX = Math.random() * 50 + 10;
    let posY = Math.random() * 40 + 15;
    let vx = 0.08;
    let vy = 0.06;

    const step = () => {
      posX += vx;
      posY += vy;

      if (posX <= 4 || posX >= 68) {
        vx = -vx;
      }
      if (posY <= 8 || posY >= 60) {
        vy = -vy;
      }

      setBouncingPos({ x: posX, y: posY });
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const mins = Math.floor(remainingSeconds / 60);
  const secs = Math.floor(remainingSeconds % 60);
  const countdownStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div
      id="sedentary-screensaver-interlock"
      className="fixed inset-0 z-[999999] bg-[#03060c] text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden font-mono cursor-default animate-in fade-in duration-300"
      onClick={() => {
        setKeyPressAttempted(true);
        if (keyPressTimeoutRef.current) clearTimeout(keyPressTimeoutRef.current);
        keyPressTimeoutRef.current = window.setTimeout(() => {
          setKeyPressAttempted(false);
        }, 2200);
      }}
    >
      {/* Screensaver Scanline & Grid Effect */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-70 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.15)_0%,rgba(3,6,12,0.95)_75%)] z-0" />

      {/* TOP SCREENSAVER BANNER BAR */}
      <header className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-rose-900/60 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-600/80 text-rose-400 font-bold tracking-wider animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
            <span>[SCREENSAVER INTERRUPT // 工作已強制凍結]</span>
          </div>
          <span className="hidden md:inline text-slate-500 text-[11px]">
            辦公室健康防護螢幕保護程式
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* Digital Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#090d18] border border-slate-800 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold tracking-widest">{currentTime}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/70 text-slate-400 hover:text-white transition"
            title="進入/退出全螢幕"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* FLOATING BOUNCING SCREENSAVER MEME ELEMENT (Classic DVD Logo Style Drift) */}
      <div
        className="absolute z-10 pointer-events-none transition-transform duration-75 hidden sm:flex items-center gap-3 p-3 rounded-xl bg-[#0b1120]/90 border border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.3)] backdrop-blur-md"
        style={{
          left: `${bouncingPos.x}%`,
          top: `${bouncingPos.y}%`,
        }}
      >
        <div className="w-14 h-14 rounded-lg overflow-hidden border border-rose-400 shrink-0">
          <img
            src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80"
            alt="Meme Judge Cat"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="text-rose-400 font-bold text-xs flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>屁股黏在椅子上了？</span>
          </div>
          <div className="text-[10px] text-slate-400">連貓咪都在螢幕上飄移監督你</div>
          <div className="text-[9px] text-cyan-400 font-mono mt-0.5">狀態: 強制中斷休息中</div>
        </div>
      </div>

      {/* CENTERPIECE: GIANT WORKSTATION SCREENSAVER LOCK */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto my-auto">
        {/* Animated Emergency Beacon */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-rose-600/20 animate-ping" />
          <div className="w-20 h-20 rounded-2xl bg-rose-950/90 border-2 border-rose-500 flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.6)]">
            <AlertOctagon className="w-10 h-10 text-rose-400 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-black text-rose-400 tracking-wider uppercase mb-2">
          [SEDENTARY_SCREENSAVER_LOCK]
        </h1>

        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mb-6 leading-relaxed">
          連續久坐超時！工作已被強行中斷，椎間盤與下肢靜脈發出最高級警報。
          <br />
          <span className="text-rose-300 font-bold">
            【解鎖條件】：請立刻起立離開座位，走動伸展喝水！
          </span>
        </p>

        {/* Giant Countdown Clock */}
        <div className="relative p-6 rounded-2xl bg-[#090e1a]/95 border-2 border-rose-500/80 shadow-[0_0_50px_rgba(225,29,72,0.4)] mb-5 w-full max-w-md backdrop-blur-xl">
          <div className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-1">
            起立離座倒數解鎖
          </div>
          <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400 font-mono tracking-widest my-1">
            {countdownStr}
          </div>

          {/* Sensor Detection Live Status */}
          <div
            className={`mt-4 p-3 rounded-lg border flex items-center justify-between text-left transition-all ${
              isFacePresent
                ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-400 text-emerald-200 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            <div className="flex items-center gap-2">
              {isFacePresent ? (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
              ) : (
                <UserX className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold font-mono">
                  {isFacePresent ? 'SENSOR: 鏡頭前仍有人臉 (坐著)' : 'SENSOR: 離座成功 (USER_ABSENT)'}
                </div>
                <div className="text-[10px] opacity-80">
                  {isFacePresent ? '屁股尚未離開椅子，倒數暫停中' : '偵測到已成功離座，倒數進行中...'}
                </div>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2 py-1 rounded font-mono ${
                isFacePresent ? 'bg-rose-900 text-rose-300' : 'bg-emerald-900 text-emerald-300'
              }`}
            >
              {isFacePresent ? 'LOCKED' : 'UNLOCKING'}
            </span>
          </div>
        </div>

        {/* Dynamic 3-Step Animated Stretch Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-md mb-4 text-left">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 backdrop-blur-md">
            <div className="text-rose-400 font-bold mb-1 flex items-center gap-1.5">
              <span className="text-lg animate-bounce">🙆</span>
              <span>雙手仰天拉伸</span>
            </div>
            <div className="text-slate-400 text-[10px] leading-tight">十指緊扣向上推高，釋放頸椎與腰部重壓</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 backdrop-blur-md">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
              <span className="text-lg animate-pulse">🧘</span>
              <span>轉身活化脊椎</span>
            </div>
            <div className="text-slate-400 text-[10px] leading-tight">雙腳踏平地面，腰部深呼吸向兩側輕轉</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 backdrop-blur-md">
            <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
              <span className="text-lg animate-bounce">🦵</span>
              <span>顛腳尖踢小腿</span>
            </div>
            <div className="text-slate-400 text-[10px] leading-tight">活動足踝小腿肌群，促使下肢靜脈血液回流</div>
          </div>
        </div>

        {/* Screensaver Input Intercept Flash Prompt */}
        {keyPressAttempted && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-amber-500/20 border border-amber-500 text-amber-300 text-xs font-bold animate-bounce shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            ⚠️ 螢幕保護程式鎖定中！敲擊鍵盤或滑鼠無效，請真正起立離開座位！
          </div>
        )}

        {/* Emergency Manual Wake Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEmergencyOverride();
          }}
          className="text-xs text-slate-500 hover:text-slate-300 font-mono underline transition py-1.5 px-3 rounded hover:bg-slate-900/60"
        >
          [MANUAL_WAKE // 手動喚醒] 我正在升降桌站立辦公或有緊急狀況
        </button>
      </main>

      {/* BOTTOM TICKER / PHILOSOPHY STRIP */}
      <footer className="relative z-10 w-full pt-3 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-rose-400 font-bold">[HEALTH_ADVISORY]</span>
          <span>身體只有一個，工作永遠做不完。現在起立喝杯水，椎間盤感謝你。</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span>AI VISION INTERLOCK</span>
          <span>•</span>
          <span className="text-cyan-400">STAND_UP_NOW</span>
        </div>
      </footer>
    </div>
  );
};
