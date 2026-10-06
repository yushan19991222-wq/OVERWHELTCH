import React, { useState, useEffect, useRef } from 'react';
import { Shield, Crosshair, Sparkles, CheckCircle2, AlertTriangle, Radio, Navigation, Lock, UserX, Clock } from 'lucide-react';
import { soundSynth } from '../utils/audioSynth';

interface EyeStrainBlurOverlayProps {
  isOpen: boolean;
  proximityPct: number; // 0 - 100
  isFacePresent: boolean;
  onDismiss: () => void;
  onCalibrationSuccess?: () => void;
}

export const EyeStrainBlurOverlay: React.FC<EyeStrainBlurOverlayProps> = ({
  isOpen,
  proximityPct,
  isFacePresent,
  onDismiss,
  onCalibrationSuccess,
}) => {
  const HOLD_DURATION = 3.0; // 3 seconds hold time when qualified
  const STANDARD_MIN_CM = 35; // Optimal posture safe zone: >= 35cm

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [holdTimer, setHoldTimer] = useState<number>(HOLD_DURATION);
  const [refusalAttempt, setRefusalAttempt] = useState<boolean>(false);
  const [simulatedCmOverride, setSimulatedCmOverride] = useState<number | null>(null);

  const holdTimerRef = useRef<number>(HOLD_DURATION);
  const isCompletedRef = useRef<boolean>(false);
  const refusalTimeoutRef = useRef<number | null>(null);

  // Digital clock for topbar sync
  useEffect(() => {
    if (!isOpen) return;
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const outOfBoundsBufferRef = useRef<number>(0);

  // Calculate live estimated distance (cm) from camera with calibrated optical focal mapping
  const rawPct = Math.max(10, proximityPct);
  const cameraEstimatedCm = Math.round(1950 / Math.max(12, rawPct));
  const currentCm = simulatedCmOverride !== null ? simulatedCmOverride : cameraEstimatedCm;
  const currentFacePresent = simulatedCmOverride !== null ? true : isFacePresent;

  // Hysteresis & Grace Buffer:
  // Requires >= 35cm to start countdown (Optimal posture).
  // Once countdown starts (holdTimer < 5.0), allows >= 30cm (transition zone) so minor movements don't reset timer.
  const minRequiredCm = holdTimer < HOLD_DURATION ? 30 : STANDARD_MIN_CM;
  const isSafe = currentFacePresent && currentCm >= minRequiredCm;
  const isWarning = currentFacePresent && currentCm >= 30 && currentCm < minRequiredCm;
  const isDanger = !isSafe && !isWarning;

  const isSafeRef = useRef<boolean>(isSafe);
  isSafeRef.current = isSafe;

  const onCalibrationSuccessRef = useRef(onCalibrationSuccess);
  onCalibrationSuccessRef.current = onCalibrationSuccess;

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Trigger refusal feedback if user tries to close/escape while distance not compliant
  const triggerRefusalNotice = () => {
    if (isCompletedRef.current) return;
    try {
      soundSynth.playWarningBuzz();
    } catch {}
    setRefusalAttempt(true);
    if (refusalTimeoutRef.current) clearTimeout(refusalTimeoutRef.current);
    refusalTimeoutRef.current = window.setTimeout(() => {
      setRefusalAttempt(false);
    }, 2500);
  };

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setIsCompleted(false);
      isCompletedRef.current = false;
      holdTimerRef.current = HOLD_DURATION;
      setHoldTimer(HOLD_DURATION);
      setRefusalAttempt(false);
      setSimulatedCmOverride(null);
      try {
        soundSynth.playRadarLockBeep(520);
      } catch {}
    }
  }, [isOpen]);

  // Hidden ESC Key dismiss mechanism (Pressing ESC closes overlay immediately)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDownCapture = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onDismissRef.current();
        return;
      }

      if (isCompletedRef.current) return;

      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        triggerRefusalNotice();
      }
    };

    window.addEventListener('keydown', handleKeyDownCapture, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDownCapture, { capture: true });
    };
  }, [isOpen]);

  // Track holding time reliably: counts down when distance meets standard; allows 0.8s grace buffer for blinks/eye closure
  useEffect(() => {
    if (!isOpen) return;

    const intervalId = window.setInterval(() => {
      if (isCompletedRef.current) return;

      if (isSafeRef.current) {
        outOfBoundsBufferRef.current = 0; // reset grace buffer on safe frame
        holdTimerRef.current = Math.max(0, holdTimerRef.current - 0.1);
        setHoldTimer(holdTimerRef.current);

        if (holdTimerRef.current <= 0 && !isCompletedRef.current) {
          isCompletedRef.current = true;
          setIsCompleted(true);
          try {
            soundSynth.playTargetAcquired();
          } catch {}

          window.setTimeout(() => {
            if (onCalibrationSuccessRef.current) {
              onCalibrationSuccessRef.current();
            } else {
              onDismissRef.current();
            }
          }, 900);
        }
      } else {
        // Allow a 0.8s grace buffer for natural blinks, eye closure, or minor pose shifts
        outOfBoundsBufferRef.current += 0.1;
        if (outOfBoundsBufferRef.current >= 0.8) {
          if (holdTimerRef.current < HOLD_DURATION) {
            holdTimerRef.current = HOLD_DURATION;
            setHoldTimer(HOLD_DURATION);
          }
        }
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPct = ((HOLD_DURATION - holdTimer) / HOLD_DURATION) * 100;
  
  // Piecewise gauge needle mapping aligned with 3-segment bar (0-35%: <30cm, 35-50%: 30-35cm, 50-100%: >=35cm)
  let gaugePercent = 50;
  if (currentCm < 30) {
    gaugePercent = Math.max(5, Math.min(34, 5 + ((currentCm - 15) / 15) * 29));
  } else if (currentCm < 35) {
    gaugePercent = 35 + ((currentCm - 30) / 5) * 14;
  } else {
    gaugePercent = Math.min(98, 50 + ((currentCm - 35) / 30) * 45);
  }

  // Determine theme color
  const statusColor = isCompleted
    ? '#10b981'
    : isSafe
    ? '#06b6d4'
    : isWarning
    ? '#f59e0b'
    : '#ef4444';

  return (
    <div
      id="proximity-tactical-radar-overlay"
      onClick={() => {
        // If clicking anywhere on backdrop while distance is not compliant, trigger refusal
        if (!isSafe && !isCompleted) {
          triggerRefusalNotice();
        }
      }}
      className={`fixed inset-0 z-[999990] bg-[#07090e] text-slate-100 flex flex-col justify-between p-2 sm:p-4 select-none overflow-hidden font-mono cursor-default animate-in fade-in duration-300 pointer-events-auto h-[100dvh] max-h-[100dvh] w-full transition-transform ${
        refusalAttempt ? 'animate-[shake_0.4s_ease-in-out]' : ''
      }`}
      style={{
        backgroundImage: `radial-gradient(ellipse at center, ${
          isSafe ? 'rgba(6, 182, 212, 0.18)' : 'rgba(239, 68, 68, 0.16)'
        } 0%, rgba(7, 9, 14, 0.98) 75%)`,
      }}
    >
      {/* Retro CRT Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-70 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(6,182,212,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-60 z-0" />

      {/* TOP HEADER STATUS BAR - Identical to ScreensaverMemeTakeover & SedentaryLockModal */}
      <header className="relative z-20 w-full flex items-center justify-between pb-2 sm:pb-2.5 border-b border-white/10 text-xs shrink-0 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <div
            className="flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded border text-[10px] sm:text-[11px] font-bold tracking-wider truncate"
            style={{
              backgroundColor: `${statusColor}18`,
              borderColor: `${statusColor}60`,
              color: statusColor,
            }}
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current shadow-[0_0_8px_currentColor] shrink-0" />
            <span className="truncate">&gt; OVERWATCH // INTERCEPT</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {currentTime && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0a0c10]/90 border border-white/10 text-slate-300 text-[10px] sm:text-xs shadow-inner">
              <Clock className="w-3 h-3 text-[#00d8ff] shrink-0" />
              <span className="font-bold tracking-widest">{currentTime}</span>
            </div>
          )}
        </div>
      </header>

      {/* MAIN HERO CARD - Signature Overwatch Framed Card with high-tech glowing border & corner brackets */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center text-center px-1 sm:px-2 max-w-4xl lg:max-w-5xl mx-auto my-auto py-2 w-full">
        
        {/* Dismissal Refusal Banner */}
        {refusalAttempt && (
          <div className="mb-2 px-4 py-2 rounded-xl bg-red-950/95 border-2 border-red-500 text-red-200 text-xs font-bold shadow-[0_0_30px_rgba(239,68,68,0.8)] flex items-center gap-2 animate-bounce z-30">
            <Lock className="w-4 h-4 text-red-400 shrink-0" />
            <span>距離未達最佳標準（當前 {currentCm} cm，需 ≥ 35cm）！請稍向後靠拉開距離</span>
          </div>
        )}

        {/* The Outer Frame Box (Consistent with Overwatch Frown / Blink cards) */}
        <div
          className="relative w-full rounded-2xl bg-[#0a0c10]/95 border-2 shadow-[0_0_40px_rgba(6,182,212,0.22)] backdrop-blur-2xl p-4 sm:p-6 transition-all duration-300"
          style={{ borderColor: `${statusColor}70` }}
        >
          {/* Overwatch Signature 4-Corner Targeting Brackets */}
          <div
            className="absolute -top-[2px] -left-[2px] w-5 h-5 border-t-2 border-l-2 pointer-events-none z-30 rounded-tl-2xl"
            style={{ borderColor: statusColor }}
          />
          <div
            className="absolute -top-[2px] -right-[2px] w-5 h-5 border-t-2 border-r-2 pointer-events-none z-30 rounded-tr-2xl"
            style={{ borderColor: statusColor }}
          />
          <div
            className="absolute -bottom-[2px] -left-[2px] w-5 h-5 border-b-2 border-l-2 pointer-events-none z-30 rounded-bl-2xl"
            style={{ borderColor: statusColor }}
          />
          <div
            className="absolute -bottom-[2px] -right-[2px] w-5 h-5 border-b-2 border-r-2 pointer-events-none z-30 rounded-br-2xl"
            style={{ borderColor: statusColor }}
          />
          {/* Inner Accent Line */}
          <div
            className="absolute inset-1.5 rounded-xl border pointer-events-none z-10"
            style={{ borderColor: `${statusColor}20` }}
          />

          {/* Inner Card Top Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 w-full text-xs shrink-0 relative z-20">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" style={{ color: statusColor }} />
              <span className="font-semibold text-white tracking-wide text-sm sm:text-base font-sans">
                護眼視距雷達
              </span>
            </div>
            <div
              className="text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded font-bold uppercase border tracking-wider"
              style={{
                backgroundColor: `${statusColor}20`,
                borderColor: `${statusColor}60`,
                color: statusColor,
              }}
            >
              {isCompleted
                ? '校準完成'
                : !currentFacePresent
                ? '未感應到人臉'
                : isSafe
                ? '最佳距離 (≥35cm)'
                : isWarning
                ? '過渡距離 (30-35cm)'
                : '距離過近 (<30cm)'}
            </div>
          </div>

          {/* 2-Column Responsive Body for Clean Single-Screen Presentation */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-center w-full relative z-20">
            
            {/* Left Column: Radar Sonar Scanner with 100% Concentric Circles */}
            <div className="md:col-span-5 flex flex-col items-center justify-center py-1">
              <div className="relative w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 flex items-center justify-center">
                {/* Ring 1: Outer Sonar Ring */}
                <div
                  className="absolute inset-0 rounded-full border border-dashed transition-colors duration-300 pointer-events-none"
                  style={{ borderColor: `${statusColor}40` }}
                />

                {/* Ring 2: Radar Sweep Rotating Beam */}
                <div
                  className="absolute inset-0 rounded-full animate-spin pointer-events-none opacity-40"
                  style={{
                    animationDuration: isSafe ? '2s' : '1.2s',
                    background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${statusColor} 360deg)`,
                  }}
                />

                {/* Ring 3: Middle Safe Zone Target Ring (70% size, concentric) */}
                <div
                  className={`absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 transition-all duration-300 pointer-events-none ${
                    isSafe
                      ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] bg-cyan-950/20'
                      : 'border-slate-800 bg-black/40'
                  }`}
                />

                {/* Ring 4: Inner Warning Zone Ring (45% size, concentric) */}
                <div
                  className={`absolute w-20 h-20 sm:w-22 sm:h-22 rounded-full border transition-all duration-300 pointer-events-none ${
                    isWarning
                      ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'border-slate-800'
                  }`}
                />

                {/* Radar Crosshairs Lines */}
                <div className="absolute inset-x-0 h-px bg-white/10 pointer-events-none" />
                <div className="absolute inset-y-0 w-px bg-white/10 pointer-events-none" />

                {/* Ring 5: Innermost Target Circle (EXACT 50% 50% Concentric Center) */}
                <div
                  className="absolute w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all duration-200 shadow-xl pointer-events-none z-10"
                  style={{
                    borderColor: statusColor,
                    backgroundColor: `${statusColor}25`,
                    boxShadow: `0 0 16px ${statusColor}`,
                  }}
                >
                  {!currentFacePresent ? (
                    <UserX className="w-5 h-5 text-rose-400 animate-pulse" />
                  ) : (
                    <Crosshair
                      className={`w-5 h-5 transition-transform ${
                        isSafe ? 'rotate-90 text-cyan-300' : 'animate-spin text-rose-400'
                      }`}
                    />
                  )}
                </div>

                {/* Distance Indicator Pill: Positioned cleanly at the bottom without shifting the concentric center */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 pointer-events-none z-20">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/90 border shadow-md font-mono whitespace-nowrap"
                    style={{ borderColor: `${statusColor}80`, color: statusColor }}
                  >
                    {!currentFacePresent ? '人臉未感應' : `${currentCm} cm`}
                  </span>
                </div>

                {/* Circular Countdown Ring when in Safe Zone */}
                {isSafe && !isCompleted && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="46%"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3"
                      strokeDasharray="600"
                      strokeDashoffset={600 - (600 * progressPct) / 100}
                      className="transition-all duration-100"
                      style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }}
                    />
                  </svg>
                )}
              </div>

              <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: statusColor }} />
                <span>RADAR_SONAR_SCANNER</span>
              </div>
            </div>

            {/* Right Column: Distance Telemetry Readout & Non-Colliding Zone Slider */}
            <div className="md:col-span-7 flex flex-col gap-3 w-full max-w-lg mx-auto md:mx-0">
              {/* Digital Telemetry Readout Box */}
              <div className="w-full bg-[#070b12]/95 border border-white/10 p-3 sm:p-4 rounded-xl shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-cyan-400" />
                    即時距離感測
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    最佳姿勢視距: <span className="text-emerald-400">≥ 35 cm</span>
                  </span>
                </div>

                {/* Giant Distance Meter Display */}
                <div className="flex items-baseline justify-between py-1 border-b border-white/5">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl sm:text-4xl font-black tracking-tight font-mono"
                      style={{ color: statusColor }}
                    >
                      {!currentFacePresent ? '--' : currentCm}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">cm / 公分</span>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] text-slate-500">判定狀態</div>
                    <div className="text-xs font-bold" style={{ color: statusColor }}>
                      {isCompleted
                        ? '校準成功'
                        : isSafe
                        ? '最佳姿勢 (合格)'
                        : isWarning
                        ? '過渡區 (30-35cm)'
                        : '過近警告 (<30cm)'}
                    </div>
                  </div>
                </div>

                {/* Visual Zone Bar with 3-Column Grid Labels */}
                <div className="mt-3">
                  <div className="grid grid-cols-3 text-[9px] text-slate-400 mb-1 font-mono text-center font-bold">
                    <span className="text-rose-400 text-left">過近 (&lt;30cm)</span>
                    <span className="text-amber-400 text-center">過渡區 (30-35cm)</span>
                    <span className="text-emerald-400 text-right">最佳姿勢 (≥35cm)</span>
                  </div>

                  <div className="relative w-full h-3 bg-black/70 rounded-full border border-white/10 overflow-hidden flex">
                    {/* Danger Zone Segment */}
                    <div className="w-[35%] h-full bg-rose-950/80 border-r border-rose-500/30" />
                    {/* Warning Zone Segment */}
                    <div className="w-[15%] h-full bg-amber-950/80 border-r border-amber-500/30" />
                    {/* Optimal Zone Segment */}
                    <div className="w-[50%] h-full bg-emerald-950/80 relative">
                      <div className="absolute inset-0 bg-emerald-500/20 animate-pulse" />
                    </div>

                    {/* Dynamic Position Needle Indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-2 -ml-1 transition-all duration-200 shadow-[0_0_10px_white] rounded-full"
                      style={{
                        left: `${gaugePercent}%`,
                        backgroundColor: statusColor,
                      }}
                    />
                  </div>
                </div>

                {/* Quick Simulation / Testing Assistant Bar */}
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 text-[9px]">距離校準模擬:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSimulatedCmOverride(25);
                      }}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                        simulatedCmOverride === 25
                          ? 'bg-rose-900/60 border-rose-500 text-rose-300'
                          : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      太近 25cm (&lt;30)
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSimulatedCmOverride(32);
                      }}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                        simulatedCmOverride === 32
                          ? 'bg-amber-900/60 border-amber-500 text-amber-300'
                          : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      過渡 32cm (30-35)
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSimulatedCmOverride(42);
                      }}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                        simulatedCmOverride === 42
                          ? 'bg-cyan-900/60 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                          : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      最佳 42cm (≥35)
                    </button>
                    {simulatedCmOverride !== null && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSimulatedCmOverride(null);
                        }}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                      >
                        即時鏡頭
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action / Hold Guidance Banner */}
              <div
                className="w-full p-3 sm:p-3.5 rounded-xl border text-left shadow-lg backdrop-blur-md transition-all duration-300"
                style={{
                  backgroundColor: `${statusColor}14`,
                  borderColor: `${statusColor}50`,
                }}
              >
                {isCompleted ? (
                  <div className="flex items-center gap-2.5 text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">最佳護眼距離校準完成！(DISTANCE_OK)</div>
                      <div className="text-[10px] text-emerald-400/90 mt-0.5">
                        已維持最佳姿勢視距 (≥35cm)，獎勵健康存摺 +3 點！正在解除鎖定...
                      </div>
                    </div>
                  </div>
                ) : !currentFacePresent ? (
                  <div className="flex items-start gap-2 text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">鏡頭未感應到人臉 (FACE_OFFLINE)</div>
                      <div className="text-[10px] text-rose-200/90 mt-0.5 leading-relaxed">
                        請坐正面向相機鏡頭，保持最佳工作距離 <span className="font-bold text-white">35cm 以上</span>。
                      </div>
                    </div>
                  </div>
                ) : isSafe ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        最佳姿勢已達標！維持 3 秒即自動解鎖
                      </span>
                      <span className="text-sm font-black text-cyan-400 font-mono">
                        {holdTimer.toFixed(1)}s
                      </span>
                    </div>
                    <p className="text-[10px] text-cyan-200/80 mb-1.5">
                      請保持此最佳坐姿 (≥35cm)，若中途靠近至 30cm 以下將重置計時。
                    </p>
                    {/* Hold Progress Bar */}
                    <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-cyan-500/40 p-[1px]">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-100 shadow-[0_0_10px_#06b6d4]"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                ) : isWarning ? (
                  <div className="flex items-start gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">處於過渡區（當前 {currentCm} cm，範圍 30-35cm）</div>
                      <div className="text-[10px] text-amber-200/90 mt-0.5">
                        請稍微再往後退約 2~5 公分，達到 <span className="font-bold text-white">35cm 以上最佳姿勢區</span> 即可啟動解鎖倒數！
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">距離螢幕過近警告（當前 {currentCm} cm，低於 30cm）</div>
                      <div className="text-[10px] text-rose-200/90 mt-0.5 leading-relaxed">
                        距離低於 30cm 過近！請將腰背後靠至椅背，拉開至最佳姿勢標準（<span className="font-bold text-white">35 公分以上</span>）！
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* FOOTER - Identical to ScreensaverMemeTakeover */}
      <footer className="relative z-10 w-full pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[#00d8ff] font-bold">[OVERWATCH // OPTICAL_SAFEGUARD]</span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-emerald-400 font-mono">&gt; RADAR_LOCKED_UNTIL_COMPLIANT</span>
        </div>
      </footer>
    </div>
  );
};

