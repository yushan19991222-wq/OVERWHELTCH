import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  Coffee,
  Heart,
  Droplets,
  Wind,
  Flame,
  Ghost,
  Footprints,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { ActiveHazardAlert } from '../types';
import { soundSynth } from '../utils/audioSynth';

interface ScreensaverMemeTakeoverProps {
  alert: ActiveHazardAlert | null;
  onDismiss: () => void;
}

export const ScreensaverMemeTakeover: React.FC<ScreensaverMemeTakeoverProps> = ({
  alert,
  onDismiss,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(8);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [actionTriggered, setActionTriggered] = useState<boolean>(false);

  // Breathing circle phase for Frown mode (0: inhale, 1: hold, 2: exhale)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');

  // Floating bouncing DVD mascot position
  const [bouncingPos, setBouncingPos] = useState({ x: 15, y: 25 });
  const animFrameRef = useRef<number | null>(null);

  // Canvas ref for Confetti / Coin shower
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time digital clock
  useEffect(() => {
    if (!alert || alert.type === 'sedentary' || alert.type === 'proximity') return;
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [alert]);

  // Reset countdown whenever a new alert arrives
  useEffect(() => {
    if (!alert || alert.type === 'sedentary' || alert.type === 'proximity') return;
    setCountdown(alert.type === 'frown' ? 10 : 8);
    setActionTriggered(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alert, onDismiss]);

  // Breathing cycle animation for frown mode
  useEffect(() => {
    if (!alert || alert.type !== 'frown') return;
    const breathTimer = setInterval(() => {
      setBreathPhase((prev) => (prev === 'inhale' ? 'exhale' : 'inhale'));
    }, 3500);
    return () => clearInterval(breathTimer);
  }, [alert]);

  // Floating screensaver meme badge drifting across screen
  useEffect(() => {
    if (!alert || alert.type === 'sedentary' || alert.type === 'proximity') return;

    let posX = Math.random() * 40 + 10;
    let posY = Math.random() * 30 + 15;
    let vx = 0.09;
    let vy = 0.07;

    const step = () => {
      posX += vx;
      posY += vy;

      if (posX <= 3 || posX >= 72) vx = -vx;
      if (posY <= 8 || posY >= 65) vy = -vy;

      setBouncingPos({ x: posX, y: posY });
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [alert]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcut listener (Space or Enter triggers interactive remedy)
  useEffect(() => {
    if (!alert || alert.type === 'sedentary' || alert.type === 'proximity') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleInteractiveAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alert]);

  // Particle shower canvas animation (for Slack celebration or Yawn water splashes)
  useEffect(() => {
    if (!alert || alert.type === 'sedentary' || alert.type === 'proximity') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const isSlack = alert.type === 'slack';
    const isYawn = alert.type === 'yawn';
    const isOvertime = alert.type === 'overtime';

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      rotation: number;
      rotSpeed: number;
      char: string;
      color: string;
      opacity: number;
    }> = [];

    const symbols = isSlack
      ? ['🪙', '💵', '☕', '🌴', '✨', '🏆', '🎉']
      : isYawn
      ? ['💧', '🌊', '⚡', '☕', '🥤', '🧊']
      : isOvertime
      ? ['👻', '🦇', '💀', '🩸', '⚠️']
      : ['🌸', '🍃', '✨', '💖', '🧘'];

    const numParticles = isSlack ? 45 : 30;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: isOvertime ? canvas.height + Math.random() * 200 : Math.random() * -canvas.height,
        size: Math.random() * 18 + 18,
        speedY: isOvertime ? -(Math.random() * 2.5 + 1.2) : Math.random() * 3 + 1.8,
        speedX: (Math.random() - 0.5) * 1.5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        char: symbols[Math.floor(Math.random() * symbols.length)],
        color: isSlack ? '#fbbf24' : isYawn ? '#38bdf8' : isOvertime ? '#f43f5e' : '#a78bfa',
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        if (isOvertime) {
          if (p.y < -50) {
            p.y = canvas.height + 50;
            p.x = Math.random() * canvas.width;
          }
        } else {
          if (p.y > canvas.height + 50) {
            p.y = -50;
            p.x = Math.random() * canvas.width;
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [alert]);

  if (!alert || alert.type === 'sedentary' || alert.type === 'proximity') return null;

  // Handle interactive action per mode
  const handleInteractiveAction = () => {
    setActionTriggered(true);
    if (alert.type === 'yawn') {
      soundSynth.playWaterDrink();
    } else if (alert.type === 'slack') {
      soundSynth.playCoinShower();
    } else if (alert.type === 'overtime') {
      soundSynth.playEscapeRun();
    } else {
      soundSynth.playBlinkChime();
    }

    setTimeout(() => {
      onDismiss();
    }, 1100);
  };

  // Preset Meme Media & Theming per Hazard
  const getThemeConfig = () => {
    switch (alert.type) {
      case 'yawn':
        return {
          title: '🚨 大哈欠抓包！老闆在背後凝視你！',
          subtitle: '嘴部大開已超過 1.5 秒，打哈欠會強烈傳染！快喝口冰水提神！',
          badgeText: 'ENERGY DRAIN // 扣 5 點生命存摺',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/60',
          accentColor: 'rose',
          memeImage:
            'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&auto=format&fit=crop&q=80',
          memeCaption: '【貓咪：張這麼大嘴，是想要吃掉整個公司嗎？】',
          floatingIcon: '🥱',
          actionText: '🥤 咕嚕喝口冰水提神！(解除封印)',
          actionClass:
            'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-[0_0_25px_rgba(6,182,212,0.5)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(244,63,94,0.25) 0%, rgba(7,10,18,0.98) 75%)',
        };
      case 'frown':
        return {
          title: '😠 這點薪水不值得你緊皺眉頭！',
          subtitle: '偵測到怨氣沖天、眉頭深鎖！跟隨光環深呼吸，放鬆面部肌群！',
          badgeText: 'GRUDGE LEVEL MAX // 扣 3 點生命存摺',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/60',
          accentColor: 'amber',
          memeImage:
            'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
          memeCaption: '【柴犬：人生苦短，薪水微薄，眉頭放鬆世界才會美好】',
          floatingIcon: '🐕',
          actionText: '🧘‍♂️ 怨念消散！我已深呼吸放鬆',
          actionClass:
            'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black shadow-[0_0_25px_rgba(245,158,11,0.5)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(245,158,11,0.22) 0%, rgba(7,10,18,0.98) 75%)',
        };
      case 'slack':
        return {
          title: '🏆 榮耀薪水小偷 LV.MAX！大捷！',
          subtitle: '偵測到離開座位悠閒摸魚！適度摸魚才是打工人的長壽大師哲學！',
          badgeText: 'HEALTH RECHARGE // 回血 +10 點',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60',
          accentColor: 'emerald',
          memeImage:
            'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600&auto=format&fit=crop&q=80',
          memeCaption: '【樹懶：在資本主義的縫隙中，喝咖啡伸展才是真贏家】',
          floatingIcon: '🦥',
          actionText: '☕ 乾杯！繼續高雅摸魚',
          actionClass:
            'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black shadow-[0_0_30px_rgba(16,185,129,0.5)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(16,185,129,0.25) 0%, rgba(7,10,18,0.98) 75%)',
        };
      case 'overtime':
        return {
          title: '🩸 血汗超時加班！靈魂出竅警報！',
          subtitle: '表定下班時間已過！資本主義的吸血鐮刀正在無情揮舞，快收拾東西！',
          badgeText: 'VAMPIRE EXTRACT // 扣 15 點生命存摺',
          badgeClass: 'bg-rose-600/30 text-rose-300 border-rose-500',
          accentColor: 'rose',
          memeImage:
            'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&auto=format&fit=crop&q=80',
          memeCaption: '【小狗：主人快走！這間公司會把你的靈魂吸光光！】',
          floatingIcon: '👻',
          actionText: '🏃‍♂️ 打卡下班！立刻收拾書包逃跑',
          actionClass:
            'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black shadow-[0_0_30px_rgba(225,29,72,0.6)] animate-pulse',
          glowGradient:
            'radial-gradient(circle at center, rgba(225,29,72,0.3) 0%, rgba(5,7,12,0.98) 75%)',
        };
      default:
        return {
          title: alert.title,
          subtitle: alert.message,
          badgeText: alert.badge,
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60',
          accentColor: 'cyan',
          memeImage:
            alert.image ||
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
          memeCaption: '【辦公室守護者：健康第一，安全打工】',
          floatingIcon: '🛡️',
          actionText: '我知道了，立刻調整！',
          actionClass: 'bg-cyan-500 hover:bg-cyan-400 text-black font-bold',
          glowGradient:
            'radial-gradient(circle at center, rgba(6,182,212,0.2) 0%, rgba(7,10,18,0.98) 75%)',
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <div
      id="screensaver-meme-takeover"
      className="fixed inset-0 z-[999990] bg-[#03060c] text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden font-mono cursor-default animate-in fade-in zoom-in-95 duration-300"
      style={{ backgroundImage: theme.glowGradient }}
    >
      {/* Background Particle Shower / Confetti Rain Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 opacity-80"
      />

      {/* Retro CRT Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-60 z-0" />

      {/* TOP HEADER STATUS BAR */}
      <header className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-md border font-bold tracking-wider animate-pulse ${theme.badgeClass}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
            <span>[SCREENSAVER_ALERT // 螢幕保護中斷]</span>
          </div>
          <span className="hidden md:inline text-slate-400 text-[11px]">
            {theme.badgeText}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Digital Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#090d18] border border-slate-800 text-slate-300 text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold tracking-widest">{currentTime}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/70 text-slate-400 hover:text-white transition"
            title="切換全螢幕"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Dismiss Button */}
          <button
            onClick={onDismiss}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400 transition"
            title="關閉彈窗"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* FLOATING BOUNCING SCREENSAVER MASCOT (Classic DVD Logo Physics) */}
      <div
        className="absolute z-10 pointer-events-none transition-transform duration-75 hidden sm:flex items-center gap-3 p-2.5 rounded-xl bg-[#090f1e]/90 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md"
        style={{
          left: `${bouncingPos.x}%`,
          top: `${bouncingPos.y}%`,
        }}
      >
        <div className="text-2xl animate-bounce">{theme.floatingIcon}</div>
        <div>
          <div className="text-[11px] font-bold text-slate-200">OHG 迷因守護雷達</div>
          <div className="text-[9px] text-cyan-400 font-mono">狀態: 即時趣味捕捉中</div>
        </div>
      </div>

      {/* CENTERPIECE: GIANT SCREENSAVER MEME CARD */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto my-auto py-2">
        {/* Giant Meme Visual Card with Border Glow */}
        <div className="relative group mb-4">
          <div className="relative w-72 sm:w-84 md:w-96 rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-slate-900">
            <img
              src={theme.memeImage}
              alt="Meme Guardian"
              className="w-full h-48 sm:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Caption Strip */}
            <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-md py-2 px-3 border-t border-slate-800 text-[11px] sm:text-xs text-slate-200 font-bold tracking-wide">
              {theme.memeCaption}
            </div>

            {/* Glowing Corner Accents */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-cyan-300 border border-cyan-500/50">
              MEME_CAM_LIVE
            </div>
          </div>
        </div>

        {/* Dynamic Title */}
        <h1 className="text-xl sm:text-3xl font-black tracking-wide uppercase mb-1 text-slate-100 flex items-center justify-center gap-2">
          <span>{theme.title}</span>
        </h1>

        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mb-5 leading-relaxed">
          {theme.subtitle}
        </p>

        {/* SPECIAL INTERACTIVE ANIMATION: Frown Breathing Visualizer */}
        {alert.type === 'frown' && (
          <div className="mb-4 flex flex-col items-center">
            <div className="relative w-24 h-24 flex items-center justify-center mb-2">
              <div
                className={`absolute rounded-full border-2 border-amber-400/80 transition-all duration-[3500ms] ease-in-out shadow-[0_0_30px_rgba(245,158,11,0.5)] ${
                  breathPhase === 'inhale'
                    ? 'w-24 h-24 bg-amber-500/20 scale-100'
                    : 'w-14 h-14 bg-amber-500/5 scale-75'
                }`}
              />
              <span className="relative z-10 text-xs font-bold text-amber-300 font-mono">
                {breathPhase === 'inhale' ? '深吸氣 🍃' : '緩吐氣 💨'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              跟隨光環膨脹吸氣、收縮吐氣，解鎖面部緊繃
            </span>
          </div>
        )}

        {/* Interactive Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
          <button
            onClick={handleInteractiveAction}
            disabled={actionTriggered}
            className={`w-full py-3 px-6 rounded-xl text-sm transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
              actionClassResolved(theme.actionClass, actionTriggered)
            }`}
          >
            {actionTriggered ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>動作完成！健康存摺恢復中...</span>
              </span>
            ) : (
              <span>{theme.actionText}</span>
            )}
          </button>
        </div>

        {/* Countdown & Keyboard Notice */}
        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>倒數 {countdown} 秒後自動收合</span>
          </span>
          <span>•</span>
          <span className="hidden sm:inline">可按 [空白鍵] 觸發互動 / [Esc] 關閉</span>
        </div>
      </main>

      {/* BOTTOM PROGRESS COUNTDOWN LINE */}
      <footer className="relative z-10 w-full pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">[OFFICE_HEALTH_GUARDIAN]</span>
          <span>好習慣積沙成塔，壞習慣光速顯老。笑一個，離下班又近了一秒。</span>
        </div>

        {/* Mini Progress Bar */}
        <div className="w-32 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-cyan-400 transition-all duration-1000"
            style={{ width: `${(countdown / (alert.type === 'frown' ? 10 : 8)) * 100}%` }}
          />
        </div>
      </footer>
    </div>
  );
};

function actionClassResolved(baseClass: string, isTriggered: boolean): string {
  if (isTriggered) {
    return 'bg-emerald-600 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105';
  }
  return baseClass;
}
