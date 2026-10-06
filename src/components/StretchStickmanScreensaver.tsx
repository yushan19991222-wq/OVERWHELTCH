import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Flame,
  Heart,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { soundSynth } from '../utils/audioSynth';

interface StretchStickmanScreensaverProps {
  isOpen: boolean;
  onComplete: () => void;
  onDismiss: () => void;
  reason?: 'yawn' | 'sedentary' | 'manual';
}

interface RoutineStage {
  name: string;
  subtitle: string;
  duration: number; // in seconds
  icon: string;
  targetMuscles: string;
  instructions: string[];
}

const ROUTINE_STAGES: RoutineStage[] = [
  {
    name: '雙手托天頸椎舒展',
    subtitle: 'Overhead Reach & Spinal Decompression',
    duration: 10,
    icon: '🙆',
    targetMuscles: '頸椎深層肌群、胸大肌、背闊肌',
    instructions: [
      '請立刻從椅子上站起，雙腳與肩同寬',
      '十指交扣反掌向上推向天花板',
      '抬頭仰望指尖，深吸氣讓胸腔徹底展開',
    ],
  },
  {
    name: '左右側腰大轉體',
    subtitle: 'Torso Oblique Twist & Disc Activation',
    duration: 10,
    icon: '🧘',
    targetMuscles: '胸椎旋轉肌、腹斜肌、腰椎間盤',
    instructions: [
      '雙手自然垂放在身體兩側',
      '以上半身為軸心，帶動雙臂向左、向右輕鬆擺動',
      '感受椎間盤隨旋轉獲得微壓循環代謝',
    ],
  },
  {
    name: '顛腳踢腿靜脈幫浦',
    subtitle: 'Calf Pump & Venous Return Boost',
    duration: 10,
    icon: '🦵',
    targetMuscles: '小腿腓腸肌、比目魚肌、下肢靜脈瓣膜',
    instructions: [
      '雙腳用力顛起腳尖維持 1 秒，再輕緩落下',
      '左右腳輪流向前輕踢、甩動放鬆足踝',
      '啟動小腿第二顆心臟，將血液打回大腦！',
    ],
  },
];

export const StretchStickmanScreensaver: React.FC<StretchStickmanScreensaverProps> = ({
  isOpen,
  onComplete,
  onDismiss,
  reason = 'sedentary',
}) => {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [totalSecondsRemaining, setTotalSecondsRemaining] = useState<number>(30);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'lottie'>('canvas');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [hasFinished, setHasFinished] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedSecsRef = useRef<number>(0);

  // Current stage index (0: 0-10s, 1: 10-20s, 2: 20-30s)
  const currentStageIndex = Math.min(2, Math.floor((30 - totalSecondsRemaining) / 10));
  const currentStage = ROUTINE_STAGES[currentStageIndex];
  const stageElapsed = (30 - totalSecondsRemaining) % 10;
  const stageProgressPct = (stageElapsed / 10) * 100;
  const totalProgressPct = ((30 - totalSecondsRemaining) / 30) * 100;

  // Real-time clock in HUD
  useEffect(() => {
    if (!isOpen) return;
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Main countdown timer (30s)
  useEffect(() => {
    if (!isOpen) return;
    setTotalSecondsRemaining(30);
    setIsPaused(false);
    setHasFinished(false);
    elapsedSecsRef.current = 0;
    startTimeRef.current = Date.now();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isPaused || hasFinished) return;

    const interval = setInterval(() => {
      setTotalSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            setHasFinished(true);
            soundSynth.playRewardJingle();
          }, 0);
          return 0;
        }

        // Tick sound on every second
        if (!isMuted) {
          if (prev % 5 === 0) {
            soundSynth.playBlinkChime();
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, isMuted, hasFinished]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismissRef.current();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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

  // HTML5 Canvas Procedural Animated Stickman
  useEffect(() => {
    if (!isOpen || activeTab !== 'canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    let frame = 0;

    const render = () => {
      frame++;
      const time = frame * 0.04;

      ctx.clearRect(0, 0, width, height);

      // Floor grid line
      const floorY = height * 0.82;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 2;
      ctx.moveTo(width * 0.1, floorY);
      ctx.lineTo(width * 0.9, floorY);
      ctx.stroke();

      // Energy shadow puddle under feet
      ctx.beginPath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.ellipse(width * 0.5, floorY, 65 + Math.sin(time * 2) * 8, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stickman Root center position
      const centerX = width * 0.5;
      const stageIdx = currentStageIndex;

      // Stickman geometry parameters
      let hipX = centerX;
      let hipY = floorY - 110;
      let headY = hipY - 110;
      let headX = centerX;

      // Color themes per stage
      const colors = ['#38bdf8', '#fbbf24', '#34d399'];
      const activeColor = colors[stageIdx];

      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = activeColor;
      ctx.strokeStyle = activeColor;
      ctx.fillStyle = activeColor;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stageIdx === 0) {
        // --- STAGE 1: Overhead Spinal Reach (🙆 雙手托天式) ---
        const reachPulse = Math.sin(time * 2.5);
        headY -= 10 + reachPulse * 8;
        hipY -= reachPulse * 4;

        // Head
        ctx.beginPath();
        ctx.arc(headX, headY, 20, 0, Math.PI * 2);
        ctx.stroke();

        // Smiling face
        ctx.beginPath();
        ctx.arc(headX, headY + 3, 9, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Spine / Torso
        ctx.beginPath();
        ctx.moveTo(headX, headY + 20);
        ctx.lineTo(hipX, hipY);
        ctx.stroke();

        // Arms reaching up to sky with clasped hands
        const handY = headY - 45 - reachPulse * 12;
        const handX = centerX;

        // Left Arm (Shoulder -> Elbow -> Hand)
        const leftElbowX = centerX - 25 - reachPulse * 5;
        const leftElbowY = headY - 10;
        ctx.beginPath();
        ctx.moveTo(headX, headY + 28);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.lineTo(handX - 5, handY);
        ctx.stroke();

        // Right Arm (Shoulder -> Elbow -> Hand)
        const rightElbowX = centerX + 25 + reachPulse * 5;
        const rightElbowY = headY - 10;
        ctx.beginPath();
        ctx.moveTo(headX, headY + 28);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.lineTo(handX + 5, handY);
        ctx.stroke();

        // Clasp hands sparkle burst
        ctx.beginPath();
        ctx.arc(handX, handY, 8 + Math.abs(reachPulse) * 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();

        // Legs (Solid grounded stance)
        // Left Leg: Hip -> Knee -> Foot
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(centerX - 35, floorY - 55);
        ctx.lineTo(centerX - 45, floorY);
        ctx.stroke();

        // Right Leg
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(centerX + 35, floorY - 55);
        ctx.lineTo(centerX + 45, floorY);
        ctx.stroke();

        // Rising Energy Arrows (Canvas particles)
        for (let i = 0; i < 4; i++) {
          const arrowX = centerX - 60 + i * 40;
          const arrowY = ((frame * 3 + i * 45) % 180) * -1 + floorY;
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 2;
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX, arrowY - 15);
          ctx.stroke();
        }
      } else if (stageIdx === 1) {
        // --- STAGE 2: Torso Oblique Twist (🧘 左右側腰旋轉) ---
        const twistAngle = Math.sin(time * 3);
        const shoulderW = 35 * Math.cos(twistAngle);

        // Head looking with the swing
        ctx.beginPath();
        ctx.arc(headX + twistAngle * 8, headY, 20, 0, Math.PI * 2);
        ctx.stroke();

        // Spine with subtle sway
        ctx.beginPath();
        ctx.moveTo(headX, headY + 20);
        ctx.lineTo(hipX, hipY);
        ctx.stroke();

        // Swinging Arms across chest
        const leftHandX = centerX - Math.cos(twistAngle) * 65;
        const leftHandY = headY + 40 + twistAngle * 18;
        const rightHandX = centerX + Math.cos(twistAngle) * 65;
        const rightHandY = headY + 40 - twistAngle * 18;

        // Left arm
        ctx.beginPath();
        ctx.moveTo(centerX - shoulderW, headY + 28);
        ctx.lineTo(leftHandX, leftHandY);
        ctx.stroke();

        // Right arm
        ctx.beginPath();
        ctx.moveTo(centerX + shoulderW, headY + 28);
        ctx.lineTo(rightHandX, rightHandY);
        ctx.stroke();

        // Legs (Firm stance with subtle knee micro-bend)
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(centerX - 35, floorY - 55);
        ctx.lineTo(centerX - 42, floorY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(centerX + 35, floorY - 55);
        ctx.lineTo(centerX + 42, floorY);
        ctx.stroke();

        // Circular wind swirl around hips
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 3;
        ctx.ellipse(centerX, hipY - 15, 60, 18, twistAngle * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // --- STAGE 3: Calf Pump & Leg Shakeout (🦵 顛腳甩腿小腿幫浦) ---
        const bounce = Math.abs(Math.sin(time * 5));
        const kickCycle = Math.sin(time * 3.5);

        hipY -= bounce * 14;
        headY -= bounce * 14;

        // Head (Joyful bounce)
        ctx.beginPath();
        ctx.arc(headX, headY, 20, 0, Math.PI * 2);
        ctx.stroke();

        // Spine
        ctx.beginPath();
        ctx.moveTo(headX, headY + 20);
        ctx.lineTo(hipX, hipY);
        ctx.stroke();

        // Cheerful Victory Arms (V-shape)
        ctx.beginPath();
        ctx.moveTo(headX, headY + 25);
        ctx.lineTo(centerX - 45, headY - 15 - bounce * 10);
        ctx.lineTo(centerX - 60, headY - 45 - bounce * 15);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(headX, headY + 25);
        ctx.lineTo(centerX + 45, headY - 15 - bounce * 10);
        ctx.lineTo(centerX + 60, headY - 45 - bounce * 15);
        ctx.stroke();

        // Legs: One foot calf-raising, other foot shaking/kicking
        if (kickCycle > 0) {
          // Standing on Left Toe
          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(centerX - 25, floorY - 60);
          ctx.lineTo(centerX - 28, floorY - bounce * 12);
          ctx.stroke();

          // Right Leg Kicking out
          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(centerX + 35, floorY - 75);
          ctx.lineTo(centerX + 65, floorY - 55 - kickCycle * 25);
          ctx.stroke();
        } else {
          // Standing on Right Toe
          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(centerX + 25, floorY - 60);
          ctx.lineTo(centerX + 28, floorY - bounce * 12);
          ctx.stroke();

          // Left Leg Kicking out
          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(centerX - 35, floorY - 75);
          ctx.lineTo(centerX - 65, floorY - 55 + kickCycle * 25);
          ctx.stroke();
        }

        // Bouncy Foot Pump Sparks
        ctx.beginPath();
        ctx.fillStyle = '#34d399';
        ctx.arc(centerX, floorY - 5, 8 + bounce * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, activeTab, currentStageIndex]);

  if (!isOpen) return null;

  return (
    <div
      id="stretch-stickman-screensaver"
      className="fixed inset-0 z-[999995] bg-[#090a0f] text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden font-mono cursor-default animate-in fade-in duration-300 cctv-vignette"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 30%, rgba(0, 216, 255, 0.12) 0%, rgba(9, 10, 15, 0.98) 75%)',
      }}
    >
      {/* Tactical HUD Corner Crosshairs */}
      <div className="pointer-events-none absolute top-3 left-3 text-slate-600 text-xs z-20 select-none">
        + [HUD:BIOMECHANICS]
      </div>
      <div className="pointer-events-none absolute top-3 right-3 text-slate-600 text-xs z-20 select-none">
        [DECOMPRESSION_ONLINE] +
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 text-slate-600 text-xs z-20 select-none">
        + [SPINAL_RELIEF: +85%]
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 text-slate-600 text-xs z-20 select-none">
        [OVERWATCH_COACH_v3] +
      </div>

      {/* Retro CRT Scanlines & Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-70 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,216,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,216,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0" />

      {/* TOP HEADER STATUS BAR - Overwatch Command Strip */}
      <header className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#00d8ff]/15 border border-[#00d8ff]/60 text-[#00d8ff] font-bold tracking-wider shadow-[0_0_15px_rgba(0,216,255,0.25)]">
            <span className="w-2 h-2 rounded-full bg-[#00d8ff] animate-pulse shadow-[0_0_8px_#00d8ff]" />
            <span>&gt; OVERWATCH // CALISTHENICS_ACTIVATION</span>
          </div>
          <span className="hidden md:inline text-slate-400 text-[11px] tracking-wide">
            {reason === 'yawn'
              ? '> STATUS: 腦部缺氧防護 // 站立伸展迅速充氧'
              : '> STATUS: 椎間盤減壓保護 // 即刻離座解鎖'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher: Canvas vs Lottie */}
          <div className="flex items-center bg-[#10141c] p-0.5 rounded border border-white/10 text-[11px]">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-2.5 py-0.5 rounded-sm transition text-[10px] font-bold tracking-wider ${
                activeTab === 'canvas'
                  ? 'bg-[#00d8ff] text-slate-950 shadow-[0_0_10px_rgba(0,216,255,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              物理小人
            </button>
            <button
              onClick={() => setActiveTab('lottie')}
              className={`px-2.5 py-0.5 rounded-sm transition text-[10px] font-bold tracking-wider ${
                activeTab === 'lottie'
                  ? 'bg-[#00d8ff] text-slate-950 shadow-[0_0_10px_rgba(0,216,255,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              向量動畫
            </button>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="p-1.5 rounded bg-[#10141c] border border-white/10 hover:border-[#00d8ff] text-slate-400 hover:text-white transition"
            title={isMuted ? '開啟節奏音效' : '靜音'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#00d8ff]" />}
          </button>

          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0a0c10]/90 border border-white/10 text-slate-300 text-xs">
            <Clock className="w-3.5 h-3.5 text-[#00d8ff]" />
            <span className="font-bold tracking-widest">{currentTime}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-[#10141c] border border-white/10 hover:border-[#00d8ff] text-slate-400 hover:text-white transition"
            title="切換全螢幕"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Dismiss Button */}
          <button
            onClick={onDismiss}
            className="p-1.5 rounded bg-[#10141c] border border-white/10 hover:border-[#ff3366] text-slate-400 hover:text-[#ff3366] transition"
            title="關閉"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* MAIN EXERCISE STAGE & STICKMAN CANVAS */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 px-4 py-2 max-w-6xl mx-auto my-auto w-full">
        {/* LEFT COLUMN: ANIMATION CANVAS DISPLAY */}
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <div className="relative w-full max-w-lg h-72 sm:h-96 rounded-md bg-[#0a0c10]/95 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center backdrop-blur-xl cctv-brackets">
            {activeTab === 'canvas' ? (
              <canvas ref={canvasRef} className="w-full h-full block" />
            ) : (
              /* LottieFiles / SVG Vector Calisthenics Stage */
              <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                <div className="w-32 h-32 rounded-full bg-cyan-950/40 border-2 border-[#00d8ff]/80 flex items-center justify-center text-6xl shadow-[0_0_35px_rgba(0,216,255,0.35)] mb-3 animate-bounce">
                  {currentStage.icon}
                </div>
                <div className="text-lg font-black text-[#00d8ff] mb-1 font-mono tracking-wider">
                  &gt; {currentStage.name}
                </div>
                <div className="text-xs text-slate-400 font-mono mb-3">
                  {currentStage.subtitle}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#00ff87] bg-[#00ff87]/10 px-2.5 py-1 rounded border border-[#00ff87]/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>&gt; LottieFiles 向量引導循環中</span>
                </div>
              </div>
            )}

            {/* Stage Indicator Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 border border-white/15 text-[10px] text-[#00d8ff] font-bold tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-md">
              <span>[PHASE: 0{currentStageIndex + 1} / 03 // ACTIVE]</span>
            </div>

            {/* Target Muscle Chip */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/80 border border-white/15 text-[10px] text-slate-300 backdrop-blur-md hidden sm:block tracking-wide shadow-md">
              &gt; TARGET_PHYSIOLOGY: {currentStage.targetMuscles}
            </div>

            {/* Paused Overlay */}
            {isPaused && (
              <div className="absolute inset-0 bg-[#090a0f]/90 backdrop-blur-sm flex flex-col items-center justify-center text-[#ffaa00]">
                <Pause className="w-12 h-12 mb-2 animate-pulse" />
                <span className="text-sm font-bold tracking-wider font-mono">&gt; CALISTHENICS_PAUSED [PRESS SPACE]</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: WORKOUT TELEMETRY & GUIDANCE PANEL */}
        <div className="w-full lg:w-96 flex flex-col justify-between bg-[#0a0c10]/95 border border-white/10 rounded-md p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] backdrop-blur-xl cctv-brackets">
          {/* GIANT COUNTDOWN DIAL */}
          <div className="text-center pb-4 border-b border-white/10">
            <div className="text-xs text-slate-400 tracking-widest uppercase font-bold mb-1">
              &gt; REMAINING_TIME // 總剩餘時間
            </div>
            <div className="text-6xl sm:text-7xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00d8ff] via-teal-300 to-[#00ff87] my-1">
              00:{String(totalSecondsRemaining).padStart(2, '0')}
            </div>

            {/* Total 30s Progress Bar */}
            <div className="w-full bg-black/60 rounded-sm h-2 overflow-hidden border border-white/10 p-0.5 mt-2">
              <div
                className="h-full bg-gradient-to-r from-[#00d8ff] via-teal-400 to-[#00ff87] rounded-sm transition-all duration-300 shadow-[0_0_12px_#00d8ff]"
                style={{ width: `${totalProgressPct}%` }}
              />
            </div>
          </div>

          {/* CURRENT STAGE GUIDANCE */}
          <div className="my-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{currentStage.icon}</span>
              <div>
                <div className="text-sm sm:text-base font-bold text-slate-100 tracking-wide">
                  {currentStage.name}
                </div>
                <div className="text-[10px] text-[#00d8ff] font-mono">
                  &gt; 本階段剩餘: {10 - stageElapsed}s
                </div>
              </div>
            </div>

            <div className="space-y-1.5 mt-3">
              {currentStage.instructions.map((inst, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded bg-[#10141c]/80 border border-white/10 text-xs text-slate-300"
                >
                  <span className="w-4 h-4 rounded bg-[#00d8ff]/20 text-[#00d8ff] border border-[#00d8ff]/50 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-tight">{inst}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TELEMETRY GAUGES */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
            <div className="p-2 rounded bg-[#10141c] border border-white/10 text-left">
              <div className="text-slate-400 flex items-center gap-1 text-[10px]">
                <Activity className="w-3 h-3 text-[#00d8ff]" />
                <span>椎間盤減壓</span>
              </div>
              <div className="text-[#00d8ff] font-black text-sm font-mono mt-0.5">
                +85% 舒展度
              </div>
            </div>

            <div className="p-2 rounded bg-[#10141c] border border-white/10 text-left">
              <div className="text-slate-400 flex items-center gap-1 text-[10px]">
                <Heart className="w-3 h-3 text-[#ff3366]" />
                <span>生理存摺補償</span>
              </div>
              <div className="text-[#00ff87] font-black text-sm font-mono mt-0.5">
                +15 BP 回血
              </div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="flex-1 py-2.5 px-3 rounded bg-[#10141c] hover:bg-slate-800 border border-white/10 hover:border-[#00d8ff] text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-[#00ff87]" /> : <Pause className="w-3.5 h-3.5 text-[#ffaa00]" />}
              <span>{isPaused ? '繼續暖身' : '暫停'}</span>
            </button>

            <button
              onClick={() => {
                setTotalSecondsRemaining(30);
                setIsPaused(false);
                setHasFinished(false);
              }}
              className="p-2.5 rounded bg-[#10141c] hover:bg-slate-800 border border-white/10 hover:border-[#00d8ff] text-slate-400 hover:text-white transition"
              title="重置"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                onCompleteRef.current();
                onDismissRef.current();
              }}
              className="flex-1 py-2.5 px-3 rounded bg-[#00ff87] hover:bg-emerald-400 text-slate-950 text-xs font-black transition shadow-[0_0_20px_rgba(0,255,135,0.4)] flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{hasFinished ? '完成！打卡回血' : '提早完成'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER TICKER - Overwatch Strip */}
      <footer className="relative z-10 w-full pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[#00d8ff] font-bold">[OVERWATCH // CALISTHENICS]</span>
          <span>每久坐 50 分鐘，進行 30 秒站立伸展，可有效降低 70% 肩頸腰椎病變風險。</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span>[SPACE] 暫停 / 繼續</span>
          <span>•</span>
          <span className="text-[#00ff87]">&gt; BIOSURVEILLANCE_ACTIVE</span>
        </div>
      </footer>
    </div>
  );
};
