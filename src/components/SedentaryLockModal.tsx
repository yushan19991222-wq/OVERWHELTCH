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
  onStartStretchWorkout?: () => void;
}

export const SedentaryLockModal: React.FC<SedentaryLockModalProps> = ({
  isOpen,
  remainingSeconds,
  isFacePresent,
  onEmergencyOverride,
  onStartStretchWorkout,
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
      className="fixed inset-0 z-[999999] bg-[#090a0f] text-slate-100 flex flex-col justify-between p-2.5 sm:p-4 select-none overflow-hidden font-mono cursor-default animate-in fade-in duration-300 cctv-vignette h-[100dvh] max-h-[100dvh] w-full"
      onClick={() => {
        setKeyPressAttempted(true);
        if (keyPressTimeoutRef.current) clearTimeout(keyPressTimeoutRef.current);
        keyPressTimeoutRef.current = window.setTimeout(() => {
          setKeyPressAttempted(false);
        }, 2200);
      }}
      style={{
        backgroundImage:
          'radial-gradient(ellipse at center, rgba(255, 51, 102, 0.12) 0%, rgba(9, 10, 15, 0.98) 75%)',
      }}
    >
      {/* Tactical HUD Corner Crosshairs */}
      <div className="pointer-events-none absolute top-3 left-3 text-slate-600 text-[10px] sm:text-xs z-20 select-none hidden xs:block">
        + [OVERWATCH:SECURITY_LOCK]
      </div>
      <div className="pointer-events-none absolute top-3 right-3 text-slate-600 text-[10px] sm:text-xs z-20 select-none hidden xs:block">
        [SPINE_SHIELD_ACTIVE] +
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 text-slate-600 text-[10px] sm:text-xs z-20 select-none hidden xs:block">
        + [AI_VISION_INTERLOCK]
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 text-slate-600 text-[10px] sm:text-xs z-20 select-none hidden xs:block">
        [STATUS: CRITICAL] +
      </div>

      {/* Screensaver Scanline & Grid Effect */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-70 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,51,102,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,51,102,0.02)_1px,transparent_1px)] bg-[size:40px_40px] z-0" />

      {/* TOP SCREENSAVER BANNER BAR - Overwatch Command Strip */}
      <header className="relative z-10 w-full flex items-center justify-between pb-2.5 sm:pb-3 border-b border-white/10 text-xs shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#ff3366]/15 border border-[#ff3366]/60 text-[#ff3366] font-bold tracking-wider shadow-[0_0_15px_rgba(255,51,102,0.3)] animate-pulse truncate text-[10px] sm:text-xs">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ff3366] shadow-[0_0_8px_#ff3366] shrink-0" />
            <span className="truncate">&gt; OVERWATCH // SEDENTARY_LOCK</span>
          </div>
          <span className="hidden md:inline text-slate-400 text-[11px] tracking-wide truncate">
            &gt; PROTOCOL: 工作台強制凍結中 // 椎間盤健康防護
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
          {/* Digital Clock */}
          <div className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#0a0c10]/90 border border-white/10 text-slate-300 text-[10px] sm:text-xs">
            <Clock className="w-3 h-3 text-[#00d8ff] shrink-0" />
            <span className="font-bold tracking-widest">{currentTime}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-1 sm:p-1.5 rounded bg-[#10141c] border border-white/10 hover:border-[#00d8ff] text-slate-400 hover:text-white transition"
            title="進入/退出全螢幕"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          </button>

          {/* Top-Right Direct Exit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEmergencyOverride();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-500/70 hover:border-rose-400 text-rose-200 hover:text-white transition shadow text-[10px] font-mono font-bold cursor-pointer"
            title="解除鎖定回到工作台"
          >
            <span>強制退出解鎖</span>
          </button>
        </div>
      </header>

      {/* FLOATING BOUNCING SCREENSAVER MEME ELEMENT (Classic DVD Logo Style Drift) */}
      <div
        className="absolute z-10 pointer-events-none transition-transform duration-75 hidden sm:flex items-center gap-3 p-3 rounded-md bg-[#0a0c10]/95 border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] backdrop-blur-md cctv-brackets"
        style={{
          left: `${bouncingPos.x}%`,
          top: `${bouncingPos.y}%`,
        }}
      >
        <div className="w-12 h-12 rounded overflow-hidden border border-[#ff3366]/60 shrink-0">
          <img
            src="/memes/cat-judge.jpg"
            alt="Meme Judge Cat"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="text-[#ff3366] font-bold text-xs flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#ff3366]" />
            <span>&gt; SENTRY: 屁股黏住了？</span>
          </div>
          <div className="text-[10px] text-slate-400">連戰術小貓都在監視螢幕飄移</div>
          <div className="text-[9px] text-[#00d8ff] font-mono mt-0.5">&gt; STATUS: 強制中斷休息中</div>
        </div>
      </div>

      {/* CENTERPIECE: GIANT WORKSTATION SCREENSAVER LOCK */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto my-auto">
        {/* Animated Emergency Beacon */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-[#ff3366]/20 animate-ping" />
          <div className="w-16 h-16 rounded-md bg-[#ff3366]/15 border border-[#ff3366] flex items-center justify-center shadow-[0_0_30px_rgba(255,51,102,0.5)]">
            <AlertOctagon className="w-8 h-8 text-[#ff3366] animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-wide uppercase mb-1 font-sans">
          久坐強制鎖定
        </h1>

        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mb-4 leading-relaxed">
          連續久坐超時，工作台已暫時凍結。請起立活動放鬆。
          <br />
          <span className="text-[#ffaa00] font-bold">
            解鎖條件：請立刻起立離開座位，走動伸展喝水。
          </span>
        </p>

        {/* Giant Countdown Clock */}
        <div className="relative p-4 sm:p-5 rounded-md bg-[#0a0c10]/95 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] mb-3 sm:mb-4 w-full max-w-md backdrop-blur-xl cctv-brackets">
          <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
            &gt; UNLOCK_TIMER // 起立離座倒數解鎖
          </div>
          <div className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff3366] via-amber-300 to-[#ff3366] font-mono tracking-widest my-1">
            {countdownStr}
          </div>

          {/* Sensor Detection Live Status */}
          <div
            className={`mt-2.5 sm:mt-3 p-2 sm:p-2.5 rounded border flex items-center justify-between text-left transition-all ${
              isFacePresent
                ? 'bg-[#ff3366]/10 border-[#ff3366]/50 text-rose-200'
                : 'bg-[#00ff87]/10 border-[#00ff87]/50 text-emerald-200 animate-pulse shadow-[0_0_15px_rgba(0,255,135,0.2)]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isFacePresent ? (
                <ShieldAlert className="w-4 h-4 text-[#ff3366] shrink-0 animate-bounce" />
              ) : (
                <UserX className="w-4 h-4 text-[#00ff87] shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-bold font-mono truncate">
                  {isFacePresent ? '> SENSOR: 人臉在席 (未離座)' : '> SENSOR: 離座成功 (ABSENT)'}
                </div>
                <div className="text-[9px] sm:text-[10px] opacity-80 truncate">
                  {isFacePresent ? '屁股尚未離開椅子，倒數暫停中' : '偵測到已離座，倒數進行中...'}
                </div>
              </div>
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded font-mono shrink-0 ml-1 ${
                isFacePresent ? 'bg-[#ff3366]/30 text-[#ff3366] border border-[#ff3366]/50' : 'bg-[#00ff87]/30 text-[#00ff87] border border-[#00ff87]/50'
              }`}
            >
              {isFacePresent ? '[LOCKED]' : '[UNLOCKING]'}
            </span>
          </div>
        </div>

        {/* Dynamic 3-Step Animated Stretch Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 w-full max-w-md mb-3 sm:mb-4 text-left">
          <div className="p-2 sm:p-2.5 rounded bg-[#10141c] border border-white/10 text-[11px] text-slate-300 backdrop-blur-md">
            <div className="text-[#ff3366] font-bold mb-0.5 sm:mb-1 flex items-center gap-1.5 text-xs">
              <span>雙手仰天拉伸</span>
            </div>
            <div className="text-slate-400 text-[9px] sm:text-[10px] leading-tight">十指緊扣向上推高，釋放頸椎重壓</div>
          </div>
          <div className="p-2 sm:p-2.5 rounded bg-[#10141c] border border-white/10 text-[11px] text-slate-300 backdrop-blur-md">
            <div className="text-[#ffaa00] font-bold mb-0.5 sm:mb-1 flex items-center gap-1.5 text-xs">
              <span>轉身活化脊椎</span>
            </div>
            <div className="text-slate-400 text-[9px] sm:text-[10px] leading-tight">踏平地面，腰部深呼吸向兩側輕轉</div>
          </div>
          <div className="p-2 sm:p-2.5 rounded bg-[#10141c] border border-white/10 text-[11px] text-slate-300 backdrop-blur-md">
            <div className="text-[#00ff87] font-bold mb-0.5 sm:mb-1 flex items-center gap-1.5 text-xs">
              <span>顛腳尖踢小腿</span>
            </div>
            <div className="text-slate-400 text-[9px] sm:text-[10px] leading-tight">活動足踝小腿肌群，促使靜脈回流</div>
          </div>
        </div>

        {/* 30-Second Stickman Calisthenics Screensaver Launcher Button */}
        {onStartStretchWorkout && (
          <button
            onClick={onStartStretchWorkout}
            className="w-full max-w-md py-2 px-3.5 rounded-md bg-[#00ff87] hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(0,255,135,0.4)] flex items-center justify-center gap-2 transform hover:scale-[1.01] transition mb-3 font-mono"
          >
            <Activity className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>進入 30 秒全螢幕伸展操 (即可解鎖)</span>
          </button>
        )}

        {/* Screensaver Input Intercept Flash Prompt */}
        {keyPressAttempted && (
          <div className="mb-3 px-3 py-1.5 rounded bg-[#ffaa00]/15 border border-[#ffaa00]/60 text-[#ffaa00] text-xs font-bold animate-bounce shadow-[0_0_15px_rgba(255,170,0,0.3)]">
            &gt; ALERT: 螢幕保護程式鎖定中！請真正起立離開座位！
          </div>
        )}

        {/* Emergency Manual Wake Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEmergencyOverride();
          }}
          className="text-[11px] text-slate-500 hover:text-slate-300 font-mono underline transition py-1 px-3 rounded hover:bg-white/5"
        >
          [MANUAL_OVERRIDE] 我正在升降桌站立辦公或有緊急狀況
        </button>
      </main>

      {/* BOTTOM TICKER / PHILOSOPHY STRIP - Overwatch Strip */}
      <footer className="relative z-10 w-full pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[#ff3366] font-bold">[OVERWATCH // HEALTH_INTERLOCK]</span>
          <span>身體只有一個，工作永遠做不完。現在起立喝杯水，椎間盤感謝你。</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span>AI VISION INTERLOCK</span>
          <span>•</span>
          <span className="text-[#00d8ff]">&gt; STAND_UP_NOW</span>
        </div>
      </footer>
    </div>
  );
};
