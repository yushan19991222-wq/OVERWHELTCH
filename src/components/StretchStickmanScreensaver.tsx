import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Activity,
  CheckCircle2,
  Clock,
  Heart,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Wind,
} from 'lucide-react';
import { soundSynth } from '../utils/audioSynth';

interface StretchStickmanScreensaverProps {
  isOpen: boolean;
  onComplete: () => void;
  onDismiss: () => void;
  reason?: 'yawn' | 'sedentary' | 'manual';
}

export interface RoutineStage {
  id:
    | 'overhead_reach'
    | 'torso_twist'
    | 'calf_pump'
    | 'shoulder_rolls'
    | 'side_bend'
    | 'neck_release'
    | 'standing_squat'
    | 'wrist_shake';
  name: string;
  subtitle: string;
  duration: number; // 10s
  icon: string;
  targetMuscles: string;
  accentColor: string;
  benefits: string;
  instructions: string[];
}

// Master pool of 8 distinct, exquisite biomechanical exercises
const EXERCISE_POOL: RoutineStage[] = [
  {
    id: 'overhead_reach',
    name: '雙手托天脊椎減壓',
    subtitle: 'Overhead Reach & Spinal Decompression',
    duration: 10,
    icon: '🙆',
    targetMuscles: '頸椎深層肌群、胸大肌、背闊肌',
    accentColor: '#00d8ff',
    benefits: '減輕椎間盤垂直壓力 85%，重置脊椎生理曲度',
    instructions: [
      '請立刻從椅子上站起，雙腳與肩同寬',
      '十指交扣、反掌向上極力推向天花板',
      '隨光環緩慢深吸氣，感受脊椎一節節向上拉開',
    ],
  },
  {
    id: 'torso_twist',
    name: '左右胸椎大旋轉',
    subtitle: 'Torso Oblique Twist & Scapula Activation',
    duration: 10,
    icon: '🧘',
    targetMuscles: '胸椎旋轉肌、腹斜肌、肩胛菱形肌',
    accentColor: '#fbbf24',
    benefits: '活化胸椎關節囊，加速腰背深層微循環',
    instructions: [
      '雙臂自然展開放鬆，保持骨盆朝向正前方',
      '以腰部為軸心，帶動上半身與雙臂向左右擺動',
      '感受背部緊繃肌肉隨旋轉釋放深層乳酸',
    ],
  },
  {
    id: 'calf_pump',
    name: '顛腳踢腿靜脈幫浦',
    subtitle: 'Calf Pump & Venous Return Boost',
    duration: 10,
    icon: '🦵',
    targetMuscles: '小腿腓腸肌、比目魚肌、下肢靜脈瓣膜',
    accentColor: '#10b981',
    benefits: '啟動人體第二心臟，將停滯血液打回大腦',
    instructions: [
      '雙腳用力顛起腳尖維持 1 秒，再輕緩落下',
      '左右腳輪流向前輕踢甩動，徹底放鬆足踝與膝關節',
      '全身微幅彈跳律動，迅速喚醒大腦思維活力！',
    ],
  },
  {
    id: 'shoulder_rolls',
    name: '沉肩擴胸肩胛環繞',
    subtitle: 'Scapular Rolls & Pecs Laser Release',
    duration: 10,
    icon: '🤷',
    targetMuscles: '斜方肌上中束、菱形肌、胸小肌',
    accentColor: '#f43f5e',
    benefits: '消除圓肩駝背，釋放斜方肌 90% 僵硬緊繃',
    instructions: [
      '雙肩向上聳起至耳邊，隨後大幅度向後下方環繞',
      '擴展胸腔時深吸氣，夾緊肩胛骨停留半秒',
      '感受肩頸深層血流暢通、呼吸更為通透開闊',
    ],
  },
  {
    id: 'side_bend',
    name: '側身彎月側腰舒展',
    subtitle: 'Lateral Crescent Stretch & Lat Decompression',
    duration: 10,
    icon: '🤸',
    targetMuscles: '腹內外斜肌、腰方肌、背闊肌',
    accentColor: '#8b5cf6',
    benefits: '拉伸久坐緊繃的側腰肌群，改善骨盆歪斜',
    instructions: [
      '單手向上高舉過頭，另一手自然扶住側腰或下垂',
      '上半身順勢向側邊延伸彎曲，形成優美新月弧線',
      '左右交替伸展，徹底釋放單邊受壓的腰椎神經',
    ],
  },
  {
    id: 'neck_release',
    name: '頸椎多軸全向舒緩',
    subtitle: 'Cervical Spine Multi-Axis Alignment',
    duration: 10,
    icon: '💆',
    targetMuscles: '胸鎖乳突肌、枕下肌群、頸夾肌',
    accentColor: '#06b6d4',
    benefits: '告別電腦烏龜頸，大幅降低頸源性頭痛風險',
    instructions: [
      '頭部緩慢向左側傾斜停留，感受右側頸部筋膜延展',
      '依序轉向右側與輕柔後仰，動作保持平緩均勻',
      '配合吐氣徹底釋放後腦勺與肩頸接縫處的深層壓力',
    ],
  },
  {
    id: 'standing_squat',
    name: '深蹲脈衝下肢循環',
    subtitle: 'Air Squat Pulse & Glute Power Flow',
    duration: 10,
    icon: '🏋️',
    targetMuscles: '股四頭肌、臀大肌、膕繩肌群',
    accentColor: '#f97316',
    benefits: '喚醒下肢休眠大肌群，加速全身熱量代謝',
    instructions: [
      '雙腳略寬於肩，臀部向後坐下進行流暢半深蹲',
      '雙手向前平舉以維持平衡，膝蓋對齊腳尖方向',
      '站起時收緊臀部，快速激發下半身血液循環！',
    ],
  },
  {
    id: 'wrist_shake',
    name: '手腕八字筋膜放鬆',
    subtitle: 'Wrist Figure-8 & Forearm Decompression',
    duration: 10,
    icon: '👋',
    targetMuscles: '前臂屈指肌、伸指肌、腕管橫韌帶',
    accentColor: '#ec4899',
    benefits: '預防鍵盤滑鼠手與腕隧道症候群，放鬆緊繃手指',
    instructions: [
      '雙手手腕放鬆，在身前連續劃出流暢的「∞」無限八字形',
      '指尖自然甩動，帶動前臂筋膜均勻釋放張力',
      '徹底消除敲擊鍵盤與長時間握持滑鼠所累積的疲勞',
    ],
  },
];

// 3 fixed theme colors in exact order: 1st Purple, 2nd Yellow, 3rd Green
const FIXED_STRETCH_COLORS = ['#8b5cf6', '#fbbf24', '#10b981'];

const selectRandomThreeStages = (): RoutineStage[] => {
  const shuffled = [...EXERCISE_POOL].sort(() => 0.5 - Math.random());
  const picked = shuffled.slice(0, 3);
  return picked.map((stg, idx) => ({
    ...stg,
    accentColor: FIXED_STRETCH_COLORS[idx],
  }));
};

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
  const hasTriggeredCompleteRef = useRef(false);

  // Currently active 3 random routine stages for this session
  const [activeStages, setActiveStages] = useState<RoutineStage[]>(() => selectRandomThreeStages());

  const [totalSecondsRemaining, setTotalSecondsRemaining] = useState<number>(30);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [hasFinished, setHasFinished] = useState<boolean>(false);
  const [finishCountdown, setFinishCountdown] = useState<number>(3);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Pick new random 3 stages every time screensaver opens
  useEffect(() => {
    if (isOpen) {
      setActiveStages(selectRandomThreeStages());
      setTotalSecondsRemaining(30);
      setIsPaused(false);
      setHasFinished(false);
      setFinishCountdown(3);
      hasTriggeredCompleteRef.current = false;
      soundSynth.playRadarLockBeep(520);
    }
  }, [isOpen]);

  // Total elapsed seconds (0 to 30)
  const elapsedSeconds = Math.min(30, Math.max(0, 30 - totalSecondsRemaining));

  // Automatic flow stage index (0: 0-10s, 1: 10-20s, 2: 20-30s; 10 seconds per stage)
  const autoStageIndex = hasFinished
    ? 2
    : Math.min(2, Math.floor(elapsedSeconds / 10));
  const effectiveStageIndex = autoStageIndex;
  const currentStage = activeStages[effectiveStageIndex] || activeStages[0];

  // Seconds elapsed within the current 10s stage (0 to 9, or 10 if finished)
  const currentStageElapsed = hasFinished ? 10 : elapsedSeconds % 10;
  const currentStageRemaining = hasFinished ? 0 : 10 - currentStageElapsed;
  const totalProgressPct = (elapsedSeconds / 30) * 100;

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

  // Breathing Guide Cycle (4s Inhale, 4s Exhale)
  useEffect(() => {
    if (!isOpen || isPaused || hasFinished) return;
    const breathTimer = setInterval(() => {
      setBreathPhase((prev) => (prev === 'inhale' ? 'exhale' : 'inhale'));
    }, 4000);
    return () => clearInterval(breathTimer);
  }, [isOpen, isPaused, hasFinished]);

  // Main countdown timer (30s, exactly 1 second per step, pauses properly)
  useEffect(() => {
    if (!isOpen || isPaused || hasFinished) return;

    const interval = setInterval(() => {
      setTotalSecondsRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        const next = prev - 1;

        // Sound cue on stage transitions (remaining 20s = 10s done, remaining 10s = 20s done)
        if (!isMuted) {
          if (next === 20 || next === 10) {
            soundSynth.playTargetAcquired();
          } else if (next % 2 === 0 && next > 0) {
            soundSynth.playRadarLockBeep(640);
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, hasFinished, isMuted]);

  // Handle completion celebration when 30 seconds run out
  useEffect(() => {
    if (isOpen && totalSecondsRemaining === 0 && !hasFinished && !hasTriggeredCompleteRef.current) {
      hasTriggeredCompleteRef.current = true;
      setHasFinished(true);
      setFinishCountdown(3);
      soundSynth.playRewardJingle();

      // Multi-angle celebratory confetti bursts
      try {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#00d8ff', '#10b981', '#fbbf24', '#f43f5e', '#ffffff'],
          zIndex: 999999,
        });

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 70,
            origin: { x: 0.1, y: 0.7 },
            colors: ['#00d8ff', '#10b981', '#fbbf24', '#a855f7'],
            zIndex: 999999,
          });
        }, 300);

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 70,
            origin: { x: 0.9, y: 0.7 },
            colors: ['#10b981', '#fbbf24', '#f43f5e', '#ffffff'],
            zIndex: 999999,
          });
        }, 600);
      } catch (e) {
        console.error('Confetti trigger error:', e);
      }
    }
  }, [isOpen, totalSecondsRemaining, hasFinished]);

  // Ending screen stays for 3 seconds, then automatically closes and returns to home screen
  useEffect(() => {
    if (!isOpen || !hasFinished) return;

    // Countdown 3 -> 2 -> 1 -> 0
    const countdownTimer = setInterval(() => {
      setFinishCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Exactly 3 seconds (3000ms) delay before auto-closing to home
    const autoCloseTimer = setTimeout(() => {
      onCompleteRef.current();
    }, 3000);

    return () => {
      clearInterval(countdownTimer);
      clearTimeout(autoCloseTimer);
    };
  }, [isOpen, hasFinished]);

  // Keyboard shortcut listener (ESC to exit, SPACE to pause/resume or instant return when finished)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hasFinished) {
          onCompleteRef.current();
        } else {
          onDismissRef.current();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        if (hasFinished) {
          onCompleteRef.current();
        } else {
          setIsPaused((p) => !p);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasFinished]);

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

  /* ====================================================================
     Procedural Cybernetic Biomechanics Coach Canvas Animation (8 Actions)
     ==================================================================== */
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    let frame = 0;

    // Helper: Draw Glowing Neon Joint Node
    const drawJoint = (
      x: number,
      y: number,
      radius: number,
      color: string,
      glowRadius: number = 10
    ) => {
      ctx.save();
      ctx.shadowBlur = glowRadius;
      ctx.shadowColor = color;

      // Outer ring
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner glowing core
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw Cybernetic Limb with Dual Glow Contours
    const drawLimb = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
      lineWidth: number = 5
    ) => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;

      // Outer glow line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Inner white energy conduit
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, lineWidth * 0.35);
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.restore();
    };

    // Helper: Draw Cyber Visor Head
    const drawCyberHead = (hx: number, hy: number, color: string, eyeOffsetX: number = 0) => {
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(hx, hy, 22, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(10, 15, 25, 0.9)';
      ctx.fill();

      // Visor
      ctx.beginPath();
      ctx.roundRect(hx - 11 + eyeOffsetX, hy - 4, 22, 7, 3);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      if (canvas && canvas.parentElement) {
        const pw = canvas.parentElement.clientWidth;
        const ph = canvas.parentElement.clientHeight;
        if (pw > 0 && ph > 0 && (canvas.width !== pw || canvas.height !== ph)) {
          width = canvas.width = pw;
          height = canvas.height = ph;
        }
      }

      if (!isPaused) {
        frame++;
      }
      const time = frame * 0.035;

      ctx.clearRect(0, 0, width, height);

      // --- 1. Isometric Sci-Fi Floor Grid & Perspective Waves ---
      const floorY = height * 0.84;
      const centerX = width * 0.5;

      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let i = -5; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX + i * 45, floorY);
        ctx.lineTo(centerX + i * 110, height);
        ctx.stroke();
      }
      for (let j = 0; j < 4; j++) {
        const ringY = floorY + j * 18;
        ctx.beginPath();
        ctx.moveTo(width * 0.1, ringY);
        ctx.lineTo(width * 0.9, ringY);
        ctx.stroke();
      }
      ctx.restore();

      // Floor Holographic Ripple under feet
      const currentStageColor = currentStage.accentColor;
      const rippleRadius = 75 + Math.sin(time * 2.5) * 12;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX, floorY, rippleRadius, 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = `${currentStageColor}12`;
      ctx.fill();
      ctx.strokeStyle = `${currentStageColor}50`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(centerX, floorY, rippleRadius * 0.55, 9, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `${currentStageColor}80`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // --- 2. Avatar Biomechanical Baseline ---
      let hipX = centerX;
      let hipY = floorY - 125;
      let headY = hipY - 120;
      let headX = centerX;

      const stageId = currentStage.id;

      if (stageId === 'overhead_reach') {
        // ====================================================================
        // 1. 🙆 雙手托天脊椎減壓 (Overhead Reach)
        // ====================================================================
        const reachPulse = Math.sin(time * 2.5);
        headY -= 14 + reachPulse * 12;
        hipY -= reachPulse * 5;
        const handY = headY - 55 - reachPulse * 15;
        const handX = centerX;

        // Upward Particle Stream
        ctx.save();
        for (let p = 0; p < 6; p++) {
          const streamY = floorY - ((frame * 3 + p * 45) % (floorY - handY));
          const streamX = centerX + Math.sin(time * 3 + p) * 12;
          ctx.beginPath();
          ctx.arc(streamX, streamY, 2 + Math.sin(p) * 1, 0, Math.PI * 2);
          ctx.fillStyle = currentStageColor;
          ctx.shadowBlur = 8;
          ctx.shadowColor = currentStageColor;
          ctx.fill();
        }
        ctx.restore();

        drawCyberHead(headX, headY, currentStageColor);

        // Spine
        for (let s = 1; s <= 5; s++) {
          const ratio = s / 6;
          const vY = headY + 22 + (hipY - (headY + 22)) * ratio;
          drawJoint(headX, vY, 3, currentStageColor, 8);
          if (s > 1) {
            const prevY = headY + 22 + (hipY - (headY + 22)) * ((s - 1) / 6);
            drawLimb(headX, prevY, headX, vY, currentStageColor, 4);
          }
        }

        // Shoulders & Arms Up
        const shoulderY = headY + 32;
        drawJoint(centerX - 32, shoulderY, 5, currentStageColor, 12);
        drawJoint(centerX + 32, shoulderY, 5, currentStageColor, 12);

        const leftElbowX = centerX - 24 - reachPulse * 6;
        const leftElbowY = headY - 12;
        const rightElbowX = centerX + 24 + reachPulse * 6;
        const rightElbowY = headY - 12;

        drawLimb(centerX - 32, shoulderY, leftElbowX, leftElbowY, currentStageColor, 6);
        drawLimb(leftElbowX, leftElbowY, handX - 6, handY, currentStageColor, 6);
        drawJoint(leftElbowX, leftElbowY, 4, currentStageColor);

        drawLimb(centerX + 32, shoulderY, rightElbowX, rightElbowY, currentStageColor, 6);
        drawLimb(rightElbowX, rightElbowY, handX + 6, handY, currentStageColor, 6);
        drawJoint(rightElbowX, rightElbowY, 4, currentStageColor);

        drawJoint(handX, handY, 7 + Math.abs(reachPulse) * 4, '#ffffff', 25);

        // Legs
        drawJoint(hipX, hipY, 6, currentStageColor, 14);
        drawLimb(hipX, hipY, centerX - 38, floorY - 60, currentStageColor, 6);
        drawLimb(centerX - 38, floorY - 60, centerX - 48, floorY, currentStageColor, 6);
        drawJoint(centerX - 38, floorY - 60, 4.5, currentStageColor);
        drawJoint(centerX - 48, floorY, 4, currentStageColor);

        drawLimb(hipX, hipY, centerX + 38, floorY - 60, currentStageColor, 6);
        drawLimb(centerX + 38, floorY - 60, centerX + 48, floorY, currentStageColor, 6);
        drawJoint(centerX + 38, floorY - 60, 4.5, currentStageColor);
        drawJoint(centerX + 48, floorY, 4, currentStageColor);
      } else if (stageId === 'torso_twist') {
        // ====================================================================
        // 2. 🧘 左右胸椎大旋轉 (Torso Twist)
        // ====================================================================
        const twistAngle = Math.sin(time * 3);
        const shoulderW = 38 * Math.cos(twistAngle);
        headX = centerX + twistAngle * 10;

        drawCyberHead(headX, headY, currentStageColor, twistAngle * 5);

        // Spine curve
        const spineMidX = centerX + twistAngle * 14;
        const spineMidY = (headY + hipY) * 0.5;
        drawLimb(headX, headY + 22, spineMidX, spineMidY, currentStageColor, 5);
        drawLimb(spineMidX, spineMidY, hipX, hipY, currentStageColor, 5);
        drawJoint(spineMidX, spineMidY, 4, currentStageColor, 10);

        // Waist halo ring
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, hipY - 20, 65, 18, twistAngle * 0.35, 0, Math.PI * 2);
        ctx.strokeStyle = `${currentStageColor}99`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.restore();

        // Shoulders & Swinging Arms
        const shoulderY = headY + 34;
        const leftShoulderX = centerX - shoulderW;
        const rightShoulderX = centerX + shoulderW;
        drawJoint(leftShoulderX, shoulderY, 5, currentStageColor, 12);
        drawJoint(rightShoulderX, shoulderY, 5, currentStageColor, 12);

        const leftHandX = centerX - Math.cos(twistAngle) * 78;
        const leftHandY = headY + 50 + twistAngle * 22;
        const rightHandX = centerX + Math.cos(twistAngle) * 78;
        const rightHandY = headY + 50 - twistAngle * 22;

        drawLimb(leftShoulderX, shoulderY, (leftShoulderX + leftHandX) * 0.5, headY + 45, currentStageColor, 6);
        drawLimb((leftShoulderX + leftHandX) * 0.5, headY + 45, leftHandX, leftHandY, currentStageColor, 6);
        drawJoint(leftHandX, leftHandY, 5, '#ffffff', 16);

        drawLimb(rightShoulderX, shoulderY, (rightShoulderX + rightHandX) * 0.5, headY + 45, currentStageColor, 6);
        drawLimb((rightShoulderX + rightHandX) * 0.5, headY + 45, rightHandX, rightHandY, currentStageColor, 6);
        drawJoint(rightHandX, rightHandY, 5, '#ffffff', 16);

        drawJoint(hipX, hipY, 6, currentStageColor, 14);
        drawLimb(hipX, hipY, centerX - 36, floorY - 58, currentStageColor, 6);
        drawLimb(centerX - 36, floorY - 58, centerX - 45, floorY, currentStageColor, 6);
        drawLimb(hipX, hipY, centerX + 36, floorY - 58, currentStageColor, 6);
        drawLimb(centerX + 36, floorY - 58, centerX + 45, floorY, currentStageColor, 6);
      } else if (stageId === 'calf_pump') {
        // ====================================================================
        // 3. 🦵 顛腳踢腿靜脈幫浦 (Calf Pump)
        // ====================================================================
        const bounce = Math.abs(Math.sin(time * 5));
        const kickCycle = Math.sin(time * 3.5);

        hipY -= bounce * 16;
        headY -= bounce * 16;

        drawCyberHead(headX, headY, currentStageColor);
        drawLimb(headX, headY + 22, hipX, hipY, currentStageColor, 5);

        const shoulderY = headY + 30;
        drawJoint(centerX - 32, shoulderY, 5, currentStageColor, 12);
        drawJoint(centerX + 32, shoulderY, 5, currentStageColor, 12);

        // V arms
        drawLimb(centerX - 32, shoulderY, centerX - 55, headY - 8 - bounce * 10, currentStageColor, 6);
        drawLimb(centerX - 55, headY - 8 - bounce * 10, centerX - 75, headY - 45 - bounce * 16, currentStageColor, 6);
        drawJoint(centerX - 75, headY - 45 - bounce * 16, 5.5, '#ffffff', 18);

        drawLimb(centerX + 32, shoulderY, centerX + 55, headY - 8 - bounce * 10, currentStageColor, 6);
        drawLimb(centerX + 55, headY - 8 - bounce * 10, centerX + 75, headY - 45 - bounce * 16, currentStageColor, 6);
        drawJoint(centerX + 75, headY - 45 - bounce * 16, 5.5, '#ffffff', 18);

        drawJoint(hipX, hipY, 6, currentStageColor, 14);

        if (kickCycle > 0) {
          drawLimb(hipX, hipY, centerX - 26, floorY - 62, currentStageColor, 6);
          drawLimb(centerX - 26, floorY - 62, centerX - 28, floorY - bounce * 14, currentStageColor, 6);
          drawLimb(hipX, hipY, centerX + 36, floorY - 78, currentStageColor, 6);
          drawLimb(centerX + 36, floorY - 78, centerX + 75, floorY - 55 - kickCycle * 32, currentStageColor, 6);
          drawJoint(centerX + 75, floorY - 55 - kickCycle * 32, 5, '#ffffff', 16);
        } else {
          drawLimb(hipX, hipY, centerX + 26, floorY - 62, currentStageColor, 6);
          drawLimb(centerX + 26, floorY - 62, centerX + 28, floorY - bounce * 14, currentStageColor, 6);
          drawLimb(hipX, hipY, centerX - 36, floorY - 78, currentStageColor, 6);
          drawLimb(centerX - 36, floorY - 78, centerX - 75, floorY - 55 + kickCycle * 32, currentStageColor, 6);
          drawJoint(centerX - 75, floorY - 55 + kickCycle * 32, 5, '#ffffff', 16);
        }

        // Upward blood flow arrows
        ctx.save();
        for (let b = 0; b < 4; b++) {
          const arrowY = floorY - ((frame * 4 + b * 50) % (floorY - headY));
          const arrowX = centerX + (b % 2 === 0 ? -18 : 18);
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX - 4, arrowY + 8);
          ctx.lineTo(arrowX + 4, arrowY + 8);
          ctx.closePath();
          ctx.fillStyle = currentStageColor;
          ctx.shadowBlur = 10;
          ctx.shadowColor = currentStageColor;
          ctx.fill();
        }
        ctx.restore();
      } else if (stageId === 'shoulder_rolls') {
        // ====================================================================
        // 4. 🤷 沉肩擴胸肩胛環繞 (Shoulder Rolls)
        // ====================================================================
        const rollAngle = time * 3.5;
        const shoulderRollY = Math.sin(rollAngle) * 12;
        const shoulderRollX = Math.cos(rollAngle) * 8;

        drawCyberHead(headX, headY, currentStageColor);
        drawLimb(headX, headY + 22, hipX, hipY, currentStageColor, 5);

        // Circular Laser Orbits around Shoulders
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX - 36, headY + 34, 18, 14, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + 36, headY + 34, 18, 14, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `${currentStageColor}66`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();

        const leftShX = centerX - 36 + shoulderRollX;
        const leftShY = headY + 34 + shoulderRollY;
        const rightShX = centerX + 36 - shoulderRollX;
        const rightShY = headY + 34 + shoulderRollY;

        drawJoint(leftShX, leftShY, 6, currentStageColor, 14);
        drawJoint(rightShX, rightShY, 6, currentStageColor, 14);

        // Hands resting gently on shoulders/chest
        drawLimb(leftShX, leftShY, centerX - 50, headY + 55, currentStageColor, 6);
        drawLimb(centerX - 50, headY + 55, leftShX + 6, leftShY + 8, currentStageColor, 6);
        drawJoint(leftShX + 6, leftShY + 8, 4.5, '#ffffff', 14);

        drawLimb(rightShX, rightShY, centerX + 50, headY + 55, currentStageColor, 6);
        drawLimb(centerX + 50, headY + 55, rightShX - 6, rightShY + 8, currentStageColor, 6);
        drawJoint(rightShX - 6, rightShY + 8, 4.5, '#ffffff', 14);

        // Legs
        drawJoint(hipX, hipY, 6, currentStageColor, 14);
        drawLimb(hipX, hipY, centerX - 35, floorY - 58, currentStageColor, 6);
        drawLimb(centerX - 35, floorY - 58, centerX - 42, floorY, currentStageColor, 6);
        drawLimb(hipX, hipY, centerX + 35, floorY - 58, currentStageColor, 6);
        drawLimb(centerX + 35, floorY - 58, centerX + 42, floorY, currentStageColor, 6);
      } else if (stageId === 'side_bend') {
        // ====================================================================
        // 5. 🤸 側身彎月側腰舒展 (Side Bend Stretch)
        // ====================================================================
        const bendCycle = Math.sin(time * 2.5); // -1 to +1
        const bendShift = bendCycle * 32;

        headX = centerX + bendShift * 0.9;
        headY += Math.abs(bendCycle) * 8;

        drawCyberHead(headX, headY, currentStageColor, bendCycle * 6);

        // Curved Spine
        const midSpineX = centerX + bendShift * 0.5;
        const midSpineY = (headY + hipY) * 0.5;
        drawLimb(headX, headY + 22, midSpineX, midSpineY, currentStageColor, 5);
        drawLimb(midSpineX, midSpineY, hipX, hipY, currentStageColor, 5);

        // Arching Arm overhead
        const shY = headY + 32;
        if (bendCycle >= 0) {
          // Left arm reaches overhead to the right
          drawLimb(centerX - 32, shY, centerX - 15, headY - 18, currentStageColor, 6);
          drawLimb(centerX - 15, headY - 18, headX + 35, headY - 35, currentStageColor, 6);
          drawJoint(headX + 35, headY - 35, 6, '#ffffff', 20);

          // Right arm slides down thigh
          drawLimb(centerX + 32, shY, centerX + 42, hipY + 20, currentStageColor, 6);
          drawJoint(centerX + 42, hipY + 20, 4.5, currentStageColor, 10);
        } else {
          // Right arm reaches overhead to the left
          drawLimb(centerX + 32, shY, centerX + 15, headY - 18, currentStageColor, 6);
          drawLimb(centerX + 15, headY - 18, headX - 35, headY - 35, currentStageColor, 6);
          drawJoint(headX - 35, headY - 35, 6, '#ffffff', 20);

          // Left arm slides down thigh
          drawLimb(centerX - 32, shY, centerX - 42, hipY + 20, currentStageColor, 6);
          drawJoint(centerX - 42, hipY + 20, 4.5, currentStageColor, 10);
        }

        // Sturdy Legs
        drawJoint(hipX, hipY, 6, currentStageColor, 14);
        drawLimb(hipX, hipY, centerX - 40, floorY - 58, currentStageColor, 6);
        drawLimb(centerX - 40, floorY - 58, centerX - 50, floorY, currentStageColor, 6);
        drawLimb(hipX, hipY, centerX + 40, floorY - 58, currentStageColor, 6);
        drawLimb(centerX + 40, floorY - 58, centerX + 50, floorY, currentStageColor, 6);
      } else if (stageId === 'neck_release') {
        // ====================================================================
        // 6. 💆 頸椎多軸全向舒緩 (Neck Release)
        // ====================================================================
        const neckTilt = Math.sin(time * 2.2) * 16;
        const neckNod = Math.cos(time * 2.2) * 8;

        headX = centerX + neckTilt;
        headY = hipY - 120 + neckNod;

        // Cervical Targeting Halo
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, headY + 22, 28, 0, Math.PI * 2);
        ctx.strokeStyle = `${currentStageColor}66`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.restore();

        drawCyberHead(headX, headY, currentStageColor, neckTilt * 0.4);
        drawLimb(headX, headY + 22, hipX, hipY, currentStageColor, 5);

        // Hands lightly on hips
        const shY = headY + 34;
        drawJoint(centerX - 32, shY, 5, currentStageColor, 12);
        drawJoint(centerX + 32, shY, 5, currentStageColor, 12);

        drawLimb(centerX - 32, shY, centerX - 48, hipY - 10, currentStageColor, 6);
        drawLimb(centerX - 48, hipY - 10, centerX - 24, hipY, currentStageColor, 6);
        drawJoint(centerX - 24, hipY, 4.5, '#ffffff', 12);

        drawLimb(centerX + 32, shY, centerX + 48, hipY - 10, currentStageColor, 6);
        drawLimb(centerX + 48, hipY - 10, centerX + 24, hipY, currentStageColor, 6);
        drawJoint(centerX + 24, hipY, 4.5, '#ffffff', 12);

        // Legs
        drawJoint(hipX, hipY, 6, currentStageColor, 14);
        drawLimb(hipX, hipY, centerX - 35, floorY - 58, currentStageColor, 6);
        drawLimb(centerX - 35, floorY - 58, centerX - 42, floorY, currentStageColor, 6);
        drawLimb(hipX, hipY, centerX + 35, floorY - 58, currentStageColor, 6);
        drawLimb(centerX + 35, floorY - 58, centerX + 42, floorY, currentStageColor, 6);
      } else if (stageId === 'standing_squat') {
        // ====================================================================
        // 7. 🏋️ 深蹲脈衝下肢循環 (Standing Squat Pulse)
        // ====================================================================
        const squatDepth = Math.max(0, Math.sin(time * 3));
        const dropPx = squatDepth * 40;

        hipY = floorY - 125 + dropPx;
        headY = hipY - 120;

        drawCyberHead(headX, headY, currentStageColor);
        drawLimb(headX, headY + 22, hipX, hipY, currentStageColor, 5);

        // Counterbalance Arms reaching forward
        const shY = headY + 32;
        drawJoint(centerX - 32, shY, 5, currentStageColor, 12);
        drawJoint(centerX + 32, shY, 5, currentStageColor, 12);

        const handFwdY = shY + 10 - squatDepth * 8;
        drawLimb(centerX - 32, shY, centerX - 48, shY + 12, currentStageColor, 6);
        drawLimb(centerX - 48, shY + 12, centerX - 70, handFwdY, currentStageColor, 6);
        drawJoint(centerX - 70, handFwdY, 5, '#ffffff', 18);

        drawLimb(centerX + 32, shY, centerX + 48, shY + 12, currentStageColor, 6);
        drawLimb(centerX + 48, shY + 12, centerX + 70, handFwdY, currentStageColor, 6);
        drawJoint(centerX + 70, handFwdY, 5, '#ffffff', 18);

        // Bent Knees Squatting Out
        drawJoint(hipX, hipY, 6, currentStageColor, 14);
        const kneeSpread = 45 + squatDepth * 18;
        const kneeY = floorY - 55 + dropPx * 0.45;

        drawLimb(hipX, hipY, centerX - kneeSpread, kneeY, currentStageColor, 6);
        drawLimb(centerX - kneeSpread, kneeY, centerX - 55, floorY, currentStageColor, 6);
        drawJoint(centerX - kneeSpread, kneeY, 5, currentStageColor);

        drawLimb(hipX, hipY, centerX + kneeSpread, kneeY, currentStageColor, 6);
        drawLimb(centerX + kneeSpread, kneeY, centerX + 55, floorY, currentStageColor, 6);
        drawJoint(centerX + kneeSpread, kneeY, 5, currentStageColor);
      } else {
        // ====================================================================
        // 8. 👋 手腕八字筋膜放鬆 (Wrist Figure-8 Shake)
        // ====================================================================
        const figure8Time = time * 4.5;
        const wristLeftX = centerX - 45 + Math.sin(figure8Time) * 22;
        const wristLeftY = headY + 55 + Math.sin(figure8Time * 2) * 14;

        const wristRightX = centerX + 45 + Math.sin(figure8Time + Math.PI) * 22;
        const wristRightY = headY + 55 + Math.sin((figure8Time + Math.PI) * 2) * 14;

        drawCyberHead(headX, headY, currentStageColor);
        drawLimb(headX, headY + 22, hipX, hipY, currentStageColor, 5);

        const shY = headY + 32;
        drawJoint(centerX - 32, shY, 5, currentStageColor, 12);
        drawJoint(centerX + 32, shY, 5, currentStageColor, 12);

        // Arms driving infinity wrist paths
        drawLimb(centerX - 32, shY, centerX - 40, headY + 45, currentStageColor, 6);
        drawLimb(centerX - 40, headY + 45, wristLeftX, wristLeftY, currentStageColor, 6);
        drawJoint(wristLeftX, wristLeftY, 5.5, '#ffffff', 20);

        drawLimb(centerX + 32, shY, centerX + 40, headY + 45, currentStageColor, 6);
        drawLimb(centerX + 40, headY + 45, wristRightX, wristRightY, currentStageColor, 6);
        drawJoint(wristRightX, wristRightY, 5.5, '#ffffff', 20);

        // Infinite Figure-8 Sparkling trails
        ctx.save();
        for (let i = 0; i < 6; i++) {
          const trailT = figure8Time - i * 0.15;
          const trX = centerX - 45 + Math.sin(trailT) * 22;
          const trY = headY + 55 + Math.sin(trailT * 2) * 14;
          ctx.beginPath();
          ctx.arc(trX, trY, 3 - i * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = currentStageColor;
          ctx.fill();
        }
        ctx.restore();

        // Legs
        drawJoint(hipX, hipY, 6, currentStageColor, 14);
        drawLimb(hipX, hipY, centerX - 35, floorY - 58, currentStageColor, 6);
        drawLimb(centerX - 35, floorY - 58, centerX - 42, floorY, currentStageColor, 6);
        drawLimb(hipX, hipY, centerX + 35, floorY - 58, currentStageColor, 6);
        drawLimb(centerX + 35, floorY - 58, centerX + 42, floorY, currentStageColor, 6);
      }

      if (!hasFinished) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect();
        width = canvas.width = Math.floor(rect.width) || 700;
        height = canvas.height = Math.floor(rect.height) || 450;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, currentStage, isPaused, hasFinished]);

  if (!isOpen) return null;

  return (
    <div
      id="stretch-stickman-screensaver"
      className="fixed inset-0 z-[999995] bg-[#05070d]/98 text-slate-100 flex flex-col justify-between p-3 sm:p-5 select-none overflow-y-auto font-mono cursor-default animate-in fade-in duration-300"
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 30%, ${currentStage.accentColor}18 0%, rgba(5, 7, 13, 0.98) 75%)`,
      }}
    >
      {/* Cybernetic Dot Grid and CRT Scanlines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:36px_36px] opacity-70 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] opacity-70 z-0 pointer-events-none" />

      {/* TOP HEADER STATUS BAR - Unified with ScreensaverMemeTakeover & SedentaryLockModal */}
      <header className="relative z-10 w-full flex items-center justify-between pb-2 sm:pb-2.5 border-b border-white/10 text-xs shrink-0 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded bg-[#00d8ff]/15 border border-[#00d8ff]/60 text-[#00d8ff] font-bold tracking-wider shadow-[0_0_15px_rgba(0,216,255,0.25)] truncate text-[10px] sm:text-[11px]">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00d8ff] animate-pulse shadow-[0_0_8px_#00d8ff] shrink-0" />
            <span className="truncate">&gt; OVERWHELTCH // INTERCEPT</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="p-1.5 rounded bg-[#10141c] border border-white/10 hover:border-cyan-400 text-slate-400 hover:text-white transition"
            title={isMuted ? '開啟節奏音效' : '靜音'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </button>

          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0a0c10]/90 border border-white/10 text-slate-300 text-xs">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="font-bold tracking-widest">{currentTime}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-[#10141c] border border-white/10 hover:border-cyan-400 text-slate-400 hover:text-white transition"
            title="切換全螢幕"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* MAIN EXERCISE STAGE */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-stretch justify-center gap-4 sm:gap-6 px-2 sm:px-4 py-2 max-w-6xl mx-auto my-auto w-full">
        {/* LEFT COLUMN: ANIMATED BIOMECHANICAL STICKMAN COACH */}
        <div className="flex-1 w-full flex flex-col justify-between">
          <div className="relative w-full flex-1 min-h-[260px] sm:min-h-[320px] lg:min-h-[380px] rounded-md bg-[#080b12]/95 border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center backdrop-blur-xl">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Stage Indicator Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 border border-white/20 text-[10px] sm:text-xs font-bold tracking-wider backdrop-blur-md flex items-center gap-2 shadow-md">
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: currentStage.accentColor }}
              />
              <span style={{ color: currentStage.accentColor }}>
                PHASE 0{effectiveStageIndex + 1} / 03: {currentStage.name}
              </span>
            </div>

            {/* Breathing Pacer Circle */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-black/80 border border-white/20 text-[10px] text-slate-300 backdrop-blur-md flex items-center gap-1.5 shadow-md">
              <Wind
                className={`w-3.5 h-3.5 transition-transform duration-1000 ${
                  breathPhase === 'inhale' ? 'text-cyan-400 scale-125' : 'text-emerald-400 scale-90'
                }`}
              />
              <span>{breathPhase === 'inhale' ? '深吸氣 INHALE' : '緩慢吐氣 EXHALE'}</span>
            </div>

            {/* Target Muscle Chip */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/80 border border-white/15 text-[10px] text-slate-300 backdrop-blur-md hidden sm:block tracking-wide shadow-md">
              🎯 活化部位: <span className="text-white font-bold">{currentStage.targetMuscles}</span>
            </div>

            {/* Paused Overlay */}
            {isPaused && !hasFinished && (
              <div className="absolute inset-0 bg-[#090a0f]/90 backdrop-blur-sm flex flex-col items-center justify-center text-amber-400 z-30">
                <Pause className="w-12 h-12 mb-2 animate-pulse" />
                <span className="text-sm font-bold tracking-wider font-mono">
                  &gt; CALISTHENICS_PAUSED [按空白鍵繼續]
                </span>
              </div>
            )}
          </div>

          {/* Integrated Segmented 3-Stage Progress Bar (No clickable cards, pure pipeline bar) */}
          <div className="w-full mt-3 flex flex-col gap-1.5 select-none">
            {/* 3-Segment Stepper Progress Bar */}
            <div className="grid grid-cols-3 gap-2 w-full">
              {activeStages.map((stg, idx) => {
                const isPassed = hasFinished || elapsedSeconds >= (idx + 1) * 10;
                const isActive = !hasFinished && elapsedSeconds >= idx * 10 && elapsedSeconds < (idx + 1) * 10;
                const stageSec = isActive ? elapsedSeconds - idx * 10 : isPassed ? 10 : 0;
                const segmentProgressPct = isPassed
                  ? 100
                  : isActive
                  ? (stageSec / 10) * 100
                  : 0;

                return (
                  <div key={stg.id + idx} className="flex flex-col gap-1.5">
                    {/* Continuous Fill Track */}
                    <div className="w-full h-2 bg-black/60 rounded-full border border-white/10 overflow-hidden p-0.5 relative">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${segmentProgressPct}%`,
                          backgroundColor: segmentProgressPct > 0 ? stg.accentColor : 'transparent',
                          boxShadow: segmentProgressPct > 0 ? `0 0 10px ${stg.accentColor}` : 'none',
                        }}
                      />
                    </div>

                    {/* Subtitle / Action Label */}
                    <div className="flex items-center justify-between px-0.5 text-[10px] font-mono">
                      <span className="flex items-center gap-1 font-bold truncate" style={{ color: isActive || isPassed ? stg.accentColor : '#64748b' }}>
                        <span>{stg.icon}</span>
                        <span className="truncate">{stg.name}</span>
                      </span>

                      <span className="text-[9px] font-bold" style={{ color: isActive || isPassed ? stg.accentColor : '#475569' }}>
                        {isPassed ? '✓ 10s' : isActive ? `剩餘 ${10 - stageSec}s` : '10s'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WORKOUT TELEMETRY & GUIDANCE PANEL */}
        <div className="w-full lg:w-96 flex flex-col justify-between bg-[#080c14]/95 border border-white/15 rounded-md p-3.5 sm:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {/* GIANT COUNTDOWN DIAL */}
          <div className="text-center pb-3 border-b border-white/10">
            <div className="text-[10px] sm:text-xs text-slate-400 tracking-widest uppercase font-bold mb-0.5">
              &gt; TOTAL_REMAINING // 總剩餘時間
            </div>
            <div className="text-4xl sm:text-6xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 my-0.5">
              00:{String(totalSecondsRemaining).padStart(2, '0')}
            </div>

            {/* Total 30s Progress Bar */}
            <div className="w-full bg-black/60 rounded h-2 overflow-hidden border border-white/10 p-0.5 mt-1.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded transition-all duration-300 shadow-[0_0_12px_#06b6d4]"
                style={{ width: `${totalProgressPct}%` }}
              />
            </div>
          </div>

          {/* CURRENT STAGE GUIDANCE */}
          <div className="my-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentStage.icon}</span>
                <div>
                  <div className="text-sm sm:text-base font-bold text-slate-100 tracking-wide">
                    {currentStage.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{currentStage.subtitle}</div>
                </div>
              </div>

              <span
                className="text-[10px] px-2 py-0.5 rounded font-bold border font-mono"
                style={{
                  backgroundColor: `${currentStage.accentColor}20`,
                  borderColor: `${currentStage.accentColor}60`,
                  color: currentStage.accentColor,
                }}
              >
                {hasFinished ? '✓ 動作完成 (10s)' : `剩餘 ${currentStageRemaining}s`}
              </span>
            </div>

            <div className="space-y-1.5 mt-2.5">
              {currentStage.instructions.map((inst, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded bg-[#0e131d]/90 border border-white/10 text-xs text-slate-300"
                >
                  <span
                    className="w-4 h-4 rounded text-slate-950 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                    style={{ backgroundColor: currentStage.accentColor }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-tight">{inst}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TELEMETRY GAUGES */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="p-2 rounded bg-[#0e131d] border border-white/10 text-left">
              <div className="text-slate-400 flex items-center gap-1 text-[10px]">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>微循環指數</span>
              </div>
              <div className="text-cyan-400 font-black text-sm font-mono mt-0.5">+88% 活化度</div>
            </div>

            <div className="p-2 rounded bg-[#0e131d] border border-white/10 text-left">
              <div className="text-slate-400 flex items-center gap-1 text-[10px]">
                <Heart className="w-3 h-3 text-rose-400" />
                <span>生理存摺回血</span>
              </div>
              <div className="text-emerald-400 font-black text-sm font-mono mt-0.5">+15 BP 獎勵</div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="flex-1 py-2.5 px-3 rounded bg-[#10141c] hover:bg-slate-800 border border-white/10 hover:border-cyan-400 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              {isPaused ? (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isPaused ? '繼續暖身 (SPACE)' : '暫停 (SPACE)'}</span>
            </button>

            <button
              onClick={() => {
                setTotalSecondsRemaining(30);
                setIsPaused(false);
                setHasFinished(false);
                setFinishCountdown(3);
                hasTriggeredCompleteRef.current = false;
              }}
              className="px-4 py-2.5 rounded bg-[#10141c] hover:bg-slate-800 border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="重置 30 秒計時"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
          </div>
        </div>
      </main>

      {/* FULL-VIEWPORT CELEBRATORY ENDING SCREEN */}
      {hasFinished && (
        <div className="fixed inset-0 z-50 bg-[#050912]/96 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-300 font-mono select-none">
          <div className="relative mb-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 animate-bounce" />
            </div>
            <Sparkles className="w-5 h-5 text-cyan-300 absolute -top-1 -right-1 animate-spin duration-1000" />
          </div>

          <div className="text-xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 mb-2">
            🎉 30 秒站立動態體操完成！
          </div>

          <div className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mb-4">
            &gt; 已完成 3 組舒展動作 • 久坐時長已重置
          </div>

          {/* Reward Badge */}
          <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs sm:text-sm font-black tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] mb-6">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
            <span>健康存摺 +15 BP 回血成功！</span>
          </div>

          {/* 3-Second Countdown & Auto-Close Bar */}
          <div className="flex flex-col items-center gap-2 w-full max-w-xs mb-5">
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>將於 {finishCountdown} 秒後自動關閉...</span>
            </div>

            {/* Countdown progress bar (3s total) */}
            <div className="w-full h-1.5 bg-black/60 rounded-full border border-emerald-500/30 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${Math.max(0, (finishCountdown / 3) * 100)}%` }}
              />
            </div>
          </div>

          {/* Direct Home Return Button */}
          <button
            onClick={() => onCompleteRef.current()}
            className="px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] transition transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer font-mono"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>立即返回首頁</span>
          </button>
        </div>
      )}

      {/* FOOTER TICKER */}
      <footer className="relative z-10 w-full pt-2.5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">[OVERWHELTCH // CALISTHENICS_OS]</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-emerald-400">&gt; BIOMECHANICS_ACTIVE</span>
        </div>
      </footer>
    </div>
  );
};
