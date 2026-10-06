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
      className="fixed inset-0 z-40 backdrop-blur-xl bg-slate-950/70 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300"
    >
      <div className="bg-slate-900/90 border border-cyan-500/40 p-8 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-cyan-500/20 animate-bounce">
          👀⚡
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-cyan-300 mb-2">
          距離螢幕太近 / 視網膜抗議中！
        </h2>

        <p className="text-slate-300 text-sm mb-6 leading-relaxed max-w-md">
          偵測到頭部距離螢幕過近或長久未正常眨眼！
          <br />
          <span className="text-xs text-slate-400">
            請將身體往後靠椅背，望向遠方，並用力眨眼或轉動眼球放鬆眼肌！
          </span>
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-3 mb-2 overflow-hidden border border-slate-800 p-0.5">
          <div
            className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-xs text-slate-400 font-mono mb-6">
          <span className="flex items-center gap-1">
            <RotateCw className="w-3 h-3 animate-spin text-cyan-400" />
            轉動眼球 / 連續眨眼放鬆中
          </span>
          <span className="font-bold text-cyan-300">
            倒數 {remainingSeconds.toFixed(1)} 秒
          </span>
        </div>

        <button
          onClick={onDismiss}
          className="text-xs text-slate-500 hover:text-slate-300 underline transition py-1"
        >
          我已後退並深呼吸放鬆 (手動解除模糊)
        </button>
      </div>
    </div>
  );
};
