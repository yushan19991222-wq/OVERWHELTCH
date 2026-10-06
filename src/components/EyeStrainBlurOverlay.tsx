import React, { useState, useEffect, useRef } from 'react';
import { Shield, Crosshair, Sparkles, CheckCircle2, AlertTriangle, Radio, Navigation } from 'lucide-react';
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
  // Simulated or real distance in cm
  // Proximity 75% -> 33cm; 65% -> 38cm; 50% -> 50cm; 40% -> 62cm; 30% -> 83cm
  const [simulatedOffset, setSimulatedOffset] = useState<number>(0);
  const [isSimulatingSafe, setIsSimulatingSafe] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [holdTimer, setHoldTimer] = useState<number>(3.5); // 3.5 seconds required
  const [lastBeepSec, setLastBeepSec] = useState<number>(4);

  const HOLD_DURATION = 3.5;

  // Calculate live estimated distance (cm)
  const rawPct = isSimulatingSafe ? 38 : Math.max(10, proximityPct - simulatedOffset);
  const estimatedCm = Math.round(2500 / Math.max(15, rawPct));

  // Thresholds:
  // Safe zone: >= 55cm (rawPct <= 45)
  // Warning zone: 48cm - 54cm (rawPct 46 - 52)
  // Danger zone: < 48cm (rawPct >= 53)
  const isSafe = estimatedCm >= 55 || (isFacePresent && rawPct <= 45) || isSimulatingSafe;
  const isWarning = !isSafe && estimatedCm >= 48;
  const isDanger = !isSafe && !isWarning;

  // Track holding time
  useEffect(() => {
    if (!isOpen || isCompleted) return;

    let intervalId: number;

    if (isSafe) {
      intervalId = window.setInterval(() => {
        setHoldTimer((prev) => {
          const next = Math.max(0, prev - 0.1);
          const currentCeil = Math.ceil(next);

          if (currentCeil !== lastBeepSec && next > 0) {
            setLastBeepSec(currentCeil);
            soundSynth.playRadarLockBeep(880 + (HOLD_DURATION - next) * 120);
          }

          if (next <= 0) {
            setIsCompleted(true);
            soundSynth.playTargetAcquired();
            window.setTimeout(() => {
              if (onCalibrationSuccess) {
                onCalibrationSuccess();
              } else {
                onDismiss();
              }
            }, 2400);
          }
          return next;
        });
      }, 100);
    } else {
      // Reset timer if user breaks safe distance
      if (holdTimer < HOLD_DURATION && !isCompleted) {
        setHoldTimer(HOLD_DURATION);
        setLastBeepSec(4);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, isSafe, isCompleted, holdTimer, lastBeepSec, onCalibrationSuccess, onDismiss]);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setIsCompleted(false);
      setHoldTimer(HOLD_DURATION);
      setIsSimulatingSafe(false);
      setSimulatedOffset(0);
      setLastBeepSec(4);
      soundSynth.playRadarLockBeep(520);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (ESC to dismiss)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  const progressPct = ((HOLD_DURATION - holdTimer) / HOLD_DURATION) * 100;
  const gaugePercent = Math.min(100, Math.max(10, ((estimatedCm - 25) / 60) * 100));

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
      className="fixed inset-0 z-[999999] bg-[#050508]/98 backdrop-blur-3xl flex flex-col justify-between p-3 sm:p-5 text-center font-mono select-none overflow-y-auto"
      style={{
        backgroundImage: `radial-gradient(circle at center, ${
          isSafe ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.16)'
        } 0%, rgba(5, 5, 8, 0.98) 75%)`,
      }}
    >
      {/* Tactical Corner Brackets */}
      <div className="pointer-events-none absolute top-3 left-3 text-slate-500 text-[10px] z-20">
        ┌─ [OVERWATCH // OPTICAL_RANGE_FINDER]
      </div>
      <div className="pointer-events-none absolute top-3 right-3 text-slate-500 text-[10px] z-20">
        [TARGET_ACQUISITION_SYS] ─┐
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 text-slate-500 text-[10px] z-20">
        └─ [RETINA_PRESERVATION_RADAR]
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 text-slate-500 text-[10px] z-20">
        [PRESS_ESC_TO_OVERRIDE] ─┘
      </div>

      {/* Cybernetic Dot Grid and Scanlines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-70 z-0 pointer-events-none" />

      {/* Top Header Command Bar */}
      <header className="relative z-10 w-full flex items-center justify-between pb-2.5 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border transition-colors shadow-lg"
            style={{
              backgroundColor: `${statusColor}18`,
              borderColor: `${statusColor}60`,
              color: statusColor,
            }}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>&gt; PROXIMITY_RADAR // 護眼視距校準</span>
          </div>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            {isCompleted
              ? '校準成功！視網膜防護啟動'
              : isSafe
              ? '最佳距離已鎖定，維持中...'
              : '距離過近！請向後退以放鬆睫狀肌'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-black/60 border border-white/5">
            ESC: 退出
          </span>
        </div>
      </header>

      {/* Center Tactical Range Finder Display */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto my-auto py-2 w-full">
        {/* Radar Sonar & Cyber Reticle */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 mb-3 flex items-center justify-center">
          {/* Outer Sonar Ring */}
          <div
            className="absolute inset-0 rounded-full border border-dashed transition-colors duration-300"
            style={{ borderColor: `${statusColor}40` }}
          />

          {/* Radar Sweep Rotating Beam */}
          <div
            className="absolute inset-0 rounded-full animate-spin pointer-events-none opacity-40"
            style={{
              animationDuration: isSafe ? '2s' : '1.2s',
              background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${statusColor} 360deg)`,
            }}
          />

          {/* Safe Zone Target Ring (55cm - 70cm) */}
          <div
            className={`absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
              isSafe
                ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] bg-cyan-950/20'
                : 'border-slate-700 bg-black/40'
            }`}
          >
            {/* Inner Danger Zone Ring (< 48cm) */}
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border transition-all duration-300 flex items-center justify-center ${
                isDanger
                  ? 'border-rose-500 bg-rose-950/30 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                  : 'border-slate-800'
              }`}
            />
          </div>

          {/* Radar Crosshairs */}
          <div className="absolute inset-x-0 h-px bg-white/10 pointer-events-none" />
          <div className="absolute inset-y-0 w-px bg-white/10 pointer-events-none" />

          {/* Cardinal Marks */}
          <span className="absolute top-1 text-[8px] text-slate-500">000°</span>
          <span className="absolute bottom-1 text-[8px] text-slate-500">180°</span>
          <span className="absolute left-1 text-[8px] text-slate-500">270°</span>
          <span className="absolute right-1 text-[8px] text-slate-500">090°</span>

          {/* Dynamic Target Blip / Face Marker */}
          <div
            className="absolute transition-all duration-300 flex flex-col items-center justify-center"
            style={{
              transform: `scale(${Math.max(0.7, rawPct / 45)})`,
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 shadow-xl"
              style={{
                borderColor: statusColor,
                backgroundColor: `${statusColor}25`,
                boxShadow: `0 0 16px ${statusColor}`,
              }}
            >
              <Crosshair
                className={`w-5 h-5 transition-transform ${
                  isSafe ? 'rotate-90 text-cyan-300' : 'animate-spin text-rose-400'
                }`}
              />
            </div>
            <span
              className="text-[9px] font-bold mt-1 px-1 rounded bg-black/80 border"
              style={{ borderColor: `${statusColor}80`, color: statusColor }}
            >
              {estimatedCm} cm
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

        {/* Digital Telemetry Readout & Status Header */}
        <div className="w-full max-w-md bg-[#090d16]/90 border border-white/10 p-3.5 sm:p-4 rounded-md shadow-2xl backdrop-blur-xl mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Navigation className="w-3 h-3 text-cyan-400" />
              即時距離偵測 (OPTICAL_RADAR)
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded font-bold uppercase border"
              style={{
                backgroundColor: `${statusColor}20`,
                borderColor: `${statusColor}60`,
                color: statusColor,
              }}
            >
              {isCompleted
                ? 'LOCKED_SUCCESS'
                : isSafe
                ? 'OPTIMAL_SAFE_ZONE'
                : isWarning
                ? 'APPROACHING'
                : 'TOO_CLOSE_DANGER'}
            </span>
          </div>

          {/* Giant Distance Meter Display */}
          <div className="flex items-baseline justify-between py-1 border-b border-white/5">
            <div className="flex items-baseline gap-2">
              <span
                className="text-3xl sm:text-4xl font-black tracking-tight"
                style={{ color: statusColor }}
              >
                {estimatedCm}
              </span>
              <span className="text-xs text-slate-400 font-bold">cm / 公分</span>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-500">標準人體工學護眼距離</div>
              <div className="text-xs font-bold text-emerald-400">55 ~ 70 cm</div>
            </div>
          </div>

          {/* Interactive Range Slider Visualization */}
          <div className="mt-3">
            <div className="flex justify-between text-[9px] text-slate-500 mb-1">
              <span className="text-rose-400">過近 (&lt;48cm)</span>
              <span className="text-amber-400">接近中 (48-54cm)</span>
              <span className="text-emerald-400 font-bold">最佳安全區 (55-70cm)</span>
            </div>

            <div className="relative w-full h-3 bg-black/60 rounded border border-white/10 overflow-hidden flex">
              {/* Danger Zone Segment */}
              <div className="w-[35%] h-full bg-rose-950/70 border-r border-rose-500/30" />
              {/* Warning Zone Segment */}
              <div className="w-[15%] h-full bg-amber-950/70 border-r border-amber-500/30" />
              {/* Optimal Zone Segment */}
              <div className="w-[50%] h-full bg-emerald-950/70 relative">
                <div className="absolute inset-0 bg-emerald-500/20 animate-pulse" />
              </div>

              {/* Dynamic Position Needle Indicator */}
              <div
                className="absolute top-0 bottom-0 w-1.5 -ml-0.5 transition-all duration-200 shadow-[0_0_8px_white]"
                style={{
                  left: `${gaugePercent}%`,
                  backgroundColor: statusColor,
                }}
              />
            </div>
          </div>
        </div>

        {/* Action / Hold Guidance Banner */}
        <div
          className="w-full max-w-md p-3.5 rounded-md border text-left shadow-lg backdrop-blur-md transition-all duration-300"
          style={{
            backgroundColor: `${statusColor}12`,
            borderColor: `${statusColor}50`,
          }}
        >
          {isCompleted ? (
            <div className="flex items-center gap-2.5 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">🎯 最佳護眼距離校準完成！(DISTANCE_OK)</div>
                <div className="text-[10px] text-emerald-400/90 mt-0.5">
                  已恢復安全視距，獎勵健康存摺 +3 點！正在解除鎖定...
                </div>
              </div>
            </div>
          ) : isSafe ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  🎯 最佳護眼距離已鎖定！請維持這個距離
                </span>
                <span className="text-sm font-black text-cyan-400 font-mono">
                  {holdTimer.toFixed(1)}s
                </span>
              </div>
              <p className="text-[10px] text-cyan-200/80 mb-2">
                請保持此坐姿，倒數結束後系統將自動關閉彈窗並恢復背景監測。
              </p>
              {/* Hold Progress Bar */}
              <div className="w-full bg-black/60 rounded h-2 overflow-hidden border border-cyan-500/40 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded transition-all duration-100 shadow-[0_0_10px_#06b6d4]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : isWarning ? (
            <div className="flex items-start gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <div className="text-xs font-bold">🟡 接近安全範圍（當前 {estimatedCm} cm）</div>
                <div className="text-[10px] text-amber-200/90 mt-0.5">
                  請稍微再往後退約 5~10 公分，進入 55cm 以上之最佳護眼安全綠區！
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <div className="text-xs font-bold">🔴 距離螢幕過近警告（當前 {estimatedCm} cm）</div>
                <div className="text-[10px] text-rose-200/90 mt-0.5 leading-relaxed">
                  請將頭部向後靠上椅背，將視距拉開至 <span className="font-bold text-white">55 公分</span> 以上，即可啟動自動解鎖倒數！
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Simulator Override Button (for manual test or calibration) */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {!isSafe && (
            <button
              onClick={() => {
                setIsSimulatingSafe(true);
                soundSynth.playRadarLockBeep(980);
              }}
              className="px-3 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/50 text-[10px] font-bold transition flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              <span>🕹️ 模擬往後坐至 60cm 安全距離</span>
            </button>
          )}

          <button
            onClick={onDismiss}
            className="px-3 py-1 rounded bg-black/60 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 text-[10px] transition"
          >
            [ESC // 手動解除] 我已調整完畢
          </button>
        </div>
      </main>

      {/* Footer Tactical Strip */}
      <footer className="relative z-10 w-full pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
        <span className="text-cyan-400 font-bold">[OVERWATCH // OPTICAL_SAFEGUARD]</span>
        <span className="hidden sm:inline">20-20-20 原則：每 20 分鐘遠眺 20 英呎（6 公尺）20 秒</span>
        <span className="text-emerald-400 font-mono">&gt; RADAR_ACTIVE</span>
      </footer>
    </div>
  );
};
