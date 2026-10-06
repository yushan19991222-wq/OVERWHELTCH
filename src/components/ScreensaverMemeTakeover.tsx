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
  RefreshCw,
  Image as ImageIcon,
  Activity,
  Smile,
} from 'lucide-react';
import { ActiveHazardAlert } from '../types';
import { soundSynth } from '../utils/audioSynth';

interface ScreensaverMemeTakeoverProps {
  alert: ActiveHazardAlert | null;
  onDismiss: () => void;
  onStartStretchWorkout?: () => void;
}

interface GeminiMemeResult {
  keyword: string;
  punchline: string;
  advice: string;
  imagePrompt: string;
  gifUrl: string;
  gifTitle: string;
  source: string;
}

export const ScreensaverMemeTakeover: React.FC<ScreensaverMemeTakeoverProps> = ({
  alert,
  onDismiss,
  onStartStretchWorkout,
}) => {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const onStartStretchWorkoutRef = useRef(onStartStretchWorkout);
  onStartStretchWorkoutRef.current = onStartStretchWorkout;

  const lastFetchedFrownTimestampRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(10);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [actionTriggered, setActionTriggered] = useState<boolean>(false);

  // Gemini + Giphy dynamic meme states for FROWN
  const [geminiMeme, setGeminiMeme] = useState<GeminiMemeResult | null>(null);
  const [isGeneratingMeme, setIsGeneratingMeme] = useState<boolean>(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState<boolean>(false);
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null);

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
  }, [alert?.type, alert?.timestamp]);

  // Fetch dynamic Gemini + Giphy meme when FROWN alert occurs
  const fetchGeminiFrownMeme = async () => {
    setIsGeneratingMeme(true);
    setAiGeneratedImageUrl(null);
    try {
      const res = await fetch('/api/gemini/frown-meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stressLevel: 'high' }),
      });
      if (res.ok) {
        const data: GeminiMemeResult = await res.json();
        setGeminiMeme(data);
      }
    } catch (err) {
      console.warn('Failed to fetch Gemini frown meme:', err);
    } finally {
      setIsGeneratingMeme(false);
    }
  };

  // Generate an AI image using Gemini model if requested
  const handleGenerateAiImage = async () => {
    if (isGeneratingAiImage) return;
    setIsGeneratingAiImage(true);
    try {
      const prompt =
        geminiMeme?.imagePrompt ||
        'Funny stressed office worker or grumpy cat having a dramatic reaction to work';
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setAiGeneratedImageUrl(data.imageUrl);
        }
      }
    } catch (err) {
      console.warn('Failed to generate AI image:', err);
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  // Trigger Gemini API call automatically on Frown
  useEffect(() => {
    if (alert?.type === 'frown') {
      const alertTs = alert.timestamp || Date.now();
      if (lastFetchedFrownTimestampRef.current !== alertTs) {
        lastFetchedFrownTimestampRef.current = alertTs;
        fetchGeminiFrownMeme();
      }
    } else {
      setGeminiMeme(null);
      setAiGeneratedImageUrl(null);
      lastFetchedFrownTimestampRef.current = null;
    }
  }, [alert?.type, alert?.timestamp]);

  // Reset countdown whenever a new alert arrives
  useEffect(() => {
    if (!alert || alert.type === 'sedentary' || alert.type === 'proximity') return;
    setCountdown(alert.type === 'frown' ? 12 : 8);
    setActionTriggered(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            onDismissRef.current();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alert?.type, alert?.timestamp]);

  // Breathing cycle animation for frown mode
  useEffect(() => {
    if (!alert || alert.type !== 'frown') return;
    const breathTimer = setInterval(() => {
      setBreathPhase((prev) => (prev === 'inhale' ? 'exhale' : 'inhale'));
    }, 3500);
    return () => clearInterval(breathTimer);
  }, [alert?.type]);

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
        onDismissRef.current();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleInteractiveAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alert?.type, alert?.timestamp]);

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
        size: Math.random() * 12 + 18,
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
      onDismissRef.current();
    }, 1100);
  };

  // Preset Meme Media & Theming per Hazard - Overwatch HUD Specifications
  const getThemeConfig = () => {
    switch (alert.type) {
      case 'yawn':
        return {
          title: '大腦嚴重缺氧 // 大哈欠抓包',
          subtitle: '嘴部開度超過閾值 1.5 秒，打哈欠連鎖反應偵測！建議起立補水或啟動 30 秒神經肌肉活化操！',
          badgeText: '> SEVERITY: ELEVATED // HEALTH_SCORE: -5',
          badgeClass: 'bg-[#ffaa00]/15 text-[#ffaa00] border-[#ffaa00]/60 shadow-[0_0_15px_rgba(255,170,0,0.25)]',
          accentColor: '#ffaa00',
          memeImage:
            'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&auto=format&fit=crop&q=80',
          memeCaption: '> TARGET_LOG: [貓咪] 嘴張這麼大，準備吞噬整個辦公室？',
          floatingIcon: '🥱',
          actionText: '🥤 咕嚕喝口水提神 (EXEC_OVERRIDE)',
          actionClass:
            'bg-[#00d8ff] hover:bg-[#38bdf8] text-slate-950 font-black shadow-[0_0_25px_rgba(0,216,255,0.45)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(255,170,0,0.18) 0%, rgba(9,10,15,0.98) 75%)',
        };
      case 'frown':
        return {
          title: geminiMeme?.punchline
            ? `壓力過載 // ${geminiMeme.punchline}`
            : '眉頭深鎖 // 怨念過載警報',
          subtitle:
            geminiMeme?.advice ||
            '偵測到面部肌群長期緊繃！跟隨同心光環進行深層腹式呼吸，放鬆眼眶與額頭神經！',
          badgeText: `> SEVERITY: STRESS // ${geminiMeme ? `GIPHY: #${geminiMeme.keyword}` : 'HEALTH_SCORE: -3'}`,
          badgeClass: 'bg-[#ffaa00]/15 text-[#ffaa00] border-[#ffaa00]/60 shadow-[0_0_15px_rgba(255,170,0,0.25)]',
          accentColor: '#ffaa00',
          memeImage:
            aiGeneratedImageUrl ||
            geminiMeme?.gifUrl ||
            'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
          memeCaption: geminiMeme
            ? `> GIPHY_TELEMETRY: #${geminiMeme.keyword} // ${geminiMeme.gifTitle}`
            : '> TARGET_LOG: [柴犬] 人生苦短，薪水微薄，眉頭放鬆世界才會美好',
          floatingIcon: '🐕',
          actionText: '🧘‍♂️ 怨念釋放！我已深呼吸放鬆',
          actionClass:
            'bg-[#ffaa00] hover:bg-amber-400 text-slate-950 font-black shadow-[0_0_25px_rgba(255,170,0,0.45)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(255,170,0,0.2) 0%, rgba(9,10,15,0.98) 75%)',
        };
      case 'slack':
        return {
          title: '離座摸魚 // 榮耀充能大捷',
          subtitle: '光學感測無人臉！適度離座走動、喝咖啡放鬆，乃打工人延續職業壽命的最佳戰略！',
          badgeText: '> STATUS: RECOVERY // HEALTH_SCORE: +10',
          badgeClass: 'bg-[#00ff87]/15 text-[#00ff87] border-[#00ff87]/60 shadow-[0_0_15px_rgba(0,255,135,0.25)]',
          accentColor: '#00ff87',
          memeImage:
            'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600&auto=format&fit=crop&q=80',
          memeCaption: '> TARGET_LOG: [樹懶] 於資本結構夾縫中，悠閒伸展才是真贏家',
          floatingIcon: '🦥',
          actionText: '☕ 乾杯！繼續維持高雅摸魚',
          actionClass:
            'bg-[#00ff87] hover:bg-emerald-400 text-slate-950 font-black shadow-[0_0_25px_rgba(0,255,135,0.45)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(0,255,135,0.18) 0%, rgba(9,10,15,0.98) 75%)',
        };
      case 'overtime':
        return {
          title: '生命力流失 // 超時加班警報',
          subtitle: '表定下班時間已超過！資本無情汲取精力，立即停止非必要任務，整裝下班！',
          badgeText: '> CRITICAL: VAMPIRE_DRAIN // HEALTH_SCORE: -15',
          badgeClass: 'bg-[#ff3366]/20 text-[#ff3366] border-[#ff3366]/70 shadow-[0_0_20px_rgba(255,51,102,0.35)]',
          accentColor: '#ff3366',
          memeImage:
            'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&auto=format&fit=crop&q=80',
          memeCaption: '> TARGET_LOG: [小狗] 主人快撤！靈魂指標正在以 0.8x 光速流逝！',
          floatingIcon: '👻',
          actionText: '🏃‍♂️ 打卡下班！立刻收拾書包逃跑',
          actionClass:
            'bg-[#ff3366] hover:bg-rose-500 text-white font-black shadow-[0_0_25px_rgba(255,51,102,0.5)] animate-pulse',
          glowGradient:
            'radial-gradient(circle at center, rgba(255,51,102,0.22) 0%, rgba(9,10,15,0.98) 75%)',
        };
      default:
        return {
          title: alert.title,
          subtitle: alert.message,
          badgeText: `> ALERT: ${alert.badge}`,
          badgeClass: 'bg-[#00d8ff]/15 text-[#00d8ff] border-[#00d8ff]/60 shadow-[0_0_15px_rgba(0,216,255,0.25)]',
          accentColor: '#00d8ff',
          memeImage:
            alert.image ||
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
          memeCaption: '> TARGET_LOG: [HEALTH_GUARDIAN] 保持高度警覺，守護生理資產',
          floatingIcon: '🛡️',
          actionText: '確認並調整 (EXEC_CONFIRM)',
          actionClass: 'bg-[#00d8ff] hover:bg-[#38bdf8] text-black font-black',
          glowGradient:
            'radial-gradient(circle at center, rgba(0,216,255,0.18) 0%, rgba(9,10,15,0.98) 75%)',
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <div
      id="screensaver-meme-takeover"
      className="fixed inset-0 z-[999990] bg-[#090a0f] text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden font-mono cursor-default animate-in fade-in duration-300 cctv-vignette"
      style={{ backgroundImage: theme.glowGradient }}
    >
      {/* Tactical HUD Corner Crosshairs */}
      <div className="pointer-events-none absolute top-3 left-3 text-slate-600 text-xs z-20 select-none">
        + [HUD:OVERWATCH_SYS]
      </div>
      <div className="pointer-events-none absolute top-3 right-3 text-slate-600 text-xs z-20 select-none">
        [SYS_LATENCY: 12ms] +
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 text-slate-600 text-xs z-20 select-none">
        + [SECURITY_CLEARANCE: LVL_4]
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 text-slate-600 text-xs z-20 select-none">
        [OVERRIDE_ENABLED] +
      </div>

      {/* Background Particle Shower / Confetti Rain Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
      />

      {/* Retro CRT Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-70 z-0" />

      {/* TOP HEADER STATUS BAR - Overwatch Command Strip */}
      <header className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pill Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-bold tracking-wider ${theme.badgeClass}`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
            <span>
              {alert.type === 'frown'
                ? '> OVERWATCH // STRESS_HAZARD_INTERCEPT'
                : '> OVERWATCH // BIO_SURVEILLANCE_ALERT'}
            </span>
          </div>
          <span className="hidden md:inline text-slate-400 text-[11px] tracking-wide">
            {theme.badgeText}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Digital Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a0c10]/90 border border-white/10 text-slate-300 text-xs shadow-inner">
            <Clock className="w-3.5 h-3.5 text-[#00d8ff]" />
            <span className="font-bold tracking-widest">{currentTime}</span>
          </div>

          {/* Fullscreen Pill Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full bg-[#10141c] border border-white/10 hover:border-[#00d8ff]/70 text-slate-400 hover:text-white transition"
            title="切換全螢幕"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Dismiss Pill Button */}
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-full bg-[#10141c] border border-white/10 hover:border-[#ff3366] text-slate-400 hover:text-[#ff3366] transition"
            title="關閉彈窗"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* FLOATING BOUNCING TACTICAL PROBE DRONE (Overwatch HUD Telemetry Mascot) */}
      <div
        className="absolute z-10 pointer-events-none transition-transform duration-75 hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-full bg-[#0a0c10]/90 border border-[#00d8ff]/40 shadow-[0_0_20px_rgba(0,216,255,0.25)] backdrop-blur-md"
        style={{
          left: `${bouncingPos.x}%`,
          top: `${bouncingPos.y}%`,
        }}
      >
        <div className="text-xl animate-bounce">{theme.floatingIcon}</div>
        <div>
          <div className="text-[10px] font-bold text-slate-200 tracking-wider">
            &gt; PROBE_01 // BIO_RADAR
          </div>
          <div className="text-[9px] text-[#00d8ff] font-mono">
            {alert.type === 'frown' ? '[GEMINI_3.8_ACTIVE]' : '[SURVEILLANCE_LOCKED]'}
          </div>
        </div>
      </div>

      {/* CENTERPIECE: OVERWATCH COMMAND HUD MODAL CARD */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto my-auto py-2">
        <div className="relative w-full rounded-xl bg-[#0a0c10]/95 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] backdrop-blur-xl p-5 sm:p-7 cctv-brackets">
          {/* Card Top Telemetry Stripe */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-4 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
              <span className="font-bold tracking-widest text-slate-300 uppercase">
                &gt; INTERRUPT_SEQ: ACTIVE
              </span>
            </div>
            <div className="tracking-widest uppercase text-slate-500 font-mono">
              CHANNEL: OVERWATCH_FEED_01
            </div>
          </div>

          {/* Meme Visual Display Box with Tactical Frame */}
          <div className="relative group mb-4 mx-auto max-w-md">
            <div className="relative rounded-xl overflow-hidden border border-white/15 shadow-2xl bg-black/80">
              {isGeneratingMeme || isGeneratingAiImage ? (
                <div className="w-full h-44 sm:h-52 flex flex-col items-center justify-center bg-[#090c12] text-[#00d8ff] p-4">
                  <Sparkles className="w-8 h-8 animate-spin mb-2 text-[#ffaa00]" />
                  <span className="text-xs font-bold font-mono tracking-wider animate-pulse">
                    {isGeneratingAiImage
                      ? '> GEMINI_AI: 正在即時渲染光學迷因圖像...'
                      : '> GEMINI_3.8: 正在分析生物遙測數據並檢索 GIPHY...'}
                  </span>
                </div>
              ) : (
                <img
                  src={theme.memeImage}
                  alt="Meme Guardian"
                  className="w-full h-44 sm:h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}

              {/* Caption Strip */}
              <div className="absolute bottom-0 inset-x-0 bg-[#0a0c10]/90 backdrop-blur-md py-2 px-3 border-t border-white/10 text-[11px] sm:text-xs text-slate-200 font-bold tracking-wide text-left">
                {theme.memeCaption}
              </div>

              {/* Glowing Corner Badge */}
              <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/85 backdrop-blur-sm text-[9px] text-[#00d8ff] border border-[#00d8ff]/50 font-mono flex items-center gap-1 shadow-md">
                <Sparkles className="w-2.5 h-2.5 text-[#00d8ff]" />
                <span>
                  {aiGeneratedImageUrl
                    ? 'AI_OPTICAL_RENDER'
                    : alert.type === 'frown'
                    ? 'GEMINI_INTERCEPT'
                    : 'TACTICAL_FEED'}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Monospace Title */}
          <h1 className="text-base sm:text-xl font-black tracking-widest uppercase mb-1.5 text-slate-100 flex items-center justify-center gap-2">
            <span>&gt; {theme.title}</span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto mb-4 leading-relaxed tracking-wide">
            {theme.subtitle}
          </p>

          {/* FROWN SPECIAL: Dynamic Gemini Controls & Biometric Concentric Breathing Circle */}
          {alert.type === 'frown' && (
            <div className="mb-4 flex flex-col items-center w-full">
              {/* Pill action buttons for AI */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                <button
                  onClick={fetchGeminiFrownMeme}
                  disabled={isGeneratingMeme}
                  className="px-3.5 py-1.5 rounded-full bg-[#10141c] hover:bg-slate-800 border border-[#ffaa00]/60 text-[#ffaa00] text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,170,0,0.2)]"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isGeneratingMeme ? 'animate-spin' : ''}`}
                  />
                  <span>🔄 重新檢索 Gemini GIPHY</span>
                </button>

                <button
                  onClick={handleGenerateAiImage}
                  disabled={isGeneratingAiImage}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800 hover:to-indigo-800 border border-purple-400/60 text-purple-200 text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                >
                  <ImageIcon
                    className={`w-3 h-3 ${isGeneratingAiImage ? 'animate-spin' : ''}`}
                  />
                  <span>🎨 Gemini AI 圖像渲染</span>
                </button>
              </div>

              {/* Biometric Pulse Breathing Circle */}
              <div className="relative w-20 h-20 flex items-center justify-center mb-1">
                <div
                  className={`absolute rounded-full border-2 border-[#ffaa00] transition-all duration-[3500ms] ease-in-out shadow-[0_0_25px_rgba(255,170,0,0.4)] ${
                    breathPhase === 'inhale'
                      ? 'w-20 h-20 bg-[#ffaa00]/15 scale-100'
                      : 'w-12 h-12 bg-[#ffaa00]/5 scale-75'
                  }`}
                />
                <span className="relative z-10 text-[10px] font-bold text-[#ffaa00] font-mono tracking-wider">
                  {breathPhase === 'inhale' ? '深吸氣 [IN]' : '緩吐氣 [OUT]'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                &gt; 面部張力釋放引導：跟隨脈衝呼吸放鬆眉心與顳肌
              </span>
            </div>
          )}

          {/* YAWN SPECIAL: Launch 30s Warm-Up Workout Button */}
          {alert.type === 'yawn' && onStartStretchWorkout && (
            <div className="mb-3 w-full max-w-md mx-auto">
              <button
                onClick={() => {
                  onDismissRef.current();
                  onStartStretchWorkoutRef.current?.();
                }}
                className="w-full py-2.5 px-4 rounded-full bg-[#00d8ff] hover:bg-[#38bdf8] text-slate-950 font-black text-xs sm:text-sm tracking-wider transition flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,216,255,0.4)] transform hover:scale-[1.02]"
              >
                <Activity className="w-4 h-4 animate-bounce text-slate-950" />
                <span>&gt; 啟動 30 秒神經肌肉活化操 (CALISTHENICS_ROUTINE)</span>
              </button>
            </div>
          )}

          {/* Interactive Command Pill Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mx-auto">
            <button
              onClick={handleInteractiveAction}
              disabled={actionTriggered}
              className={`w-full py-3 px-6 rounded-full text-xs sm:text-sm tracking-wider uppercase font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg ${actionClassResolved(
                theme.actionClass,
                actionTriggered
              )}`}
            >
              {actionTriggered ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>&gt; PROTOCOL_ACKNOWLEDGED: 生理存摺恢復中...</span>
                </span>
              ) : (
                <span>&gt; {theme.actionText}</span>
              )}
            </button>
          </div>

          {/* Countdown & Keyboard Notice */}
          <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-[#00d8ff]">
              <Clock className="w-3 h-3" />
              <span>自動閉鎖倒數: {countdown}s</span>
            </span>
            <span>|</span>
            <span className="hidden sm:inline">[SPACE] 執行響應 / [ESC] 退出</span>
          </div>
        </div>
      </main>

      {/* BOTTOM PROGRESS COUNTDOWN LINE - Overwatch Console Footer */}
      <footer className="relative z-10 w-full pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="text-[#00d8ff] font-bold">[OVERWATCH // BIOSURVEILLANCE]</span>
          <span className="hidden md:inline">系統常駐監測中・維護生理機能乃最高作戰準則</span>
        </div>

        {/* Mini Segmented Progress Bar */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400 text-[10px]">T-MINUS</span>
          <div className="w-28 sm:w-36 bg-black/60 rounded-full h-1.5 overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#00d8ff] to-[#00ff87] transition-all duration-1000 shadow-[0_0_8px_#00d8ff]"
              style={{ width: `${(countdown / (alert.type === 'frown' ? 12 : 8)) * 100}%` }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

function actionClassResolved(baseClass: string, isTriggered: boolean): string {
  if (isTriggered) {
    return 'bg-[#00ff87] text-slate-950 font-black shadow-[0_0_25px_rgba(0,255,135,0.6)] scale-105';
  }
  return baseClass;
}
