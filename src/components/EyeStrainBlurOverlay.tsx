import React from 'react';
import { Eye, CheckCircle2, RotateCw } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div
      id="eye-strain-blur-overlay"
      className="fixed inset-0 z-40 backdrop-blur-2xl bg-[#06090e]/80 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-300 font-mono"
    >
      <div className="bg-[#0b101b] border border-cyan-500/70 p-6 rounded-xl max-w-lg w-full shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col items-center">
        {/* Technical Header */}
        <div className="w-full flex items-center justify-between pb-2 mb-4 border-b border-slate-800 text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
          <span>[OPTICAL_SAFETY_INTERLOCK]</span>
          <span>CODE: OCULAR_OVERHEAT</span>
        </div>

        <div className="w-14 h-14 rounded-lg bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-3xl mb-3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          👀⚡
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-cyan-300 mb-2 uppercase tracking-wide">
          [SCREEN_PROXIMITY_HAZARD]
        </h2>

        <p className="text-slate-300 text-xs mb-4 leading-relaxed max-w-md">
          偵測到頭部距離螢幕過近或長久未正常眨眼！
          <br />
          <span className="text-[11px] text-cyan-400/80">
            請將身體往後靠椅背，望向遠方，並轉動眼球放鬆睫狀肌。
          </span>
        </p>

        {/* Progress Bar (Hardware Style) */}
        <div className="w-full bg-[#06090f] rounded h-2 mb-2 overflow-hidden border border-slate-800 p-0.5">
          <div
            className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-sm transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-[11px] text-slate-400 font-mono mb-4">
          <span className="flex items-center gap-1.5">
            <RotateCw className="w-3 h-3 animate-spin text-cyan-400" />
            OCULAR_RECOVERY_IN_PROGRESS
          </span>
          <span className="font-bold text-cyan-300">
            T-{remainingSeconds.toFixed(1)}s
          </span>
        </div>

        <button
          onClick={onDismiss}
          className="text-[11px] text-slate-500 hover:text-slate-300 underline transition py-1"
        >
          [MANUAL_CLEAR] 我已後退坐正並深呼吸 (強制解除護眼模式)
        </button>
      </div>
    </div>
  );
};
