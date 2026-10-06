import React from 'react';
import { AlertTriangle, Sparkles, X } from 'lucide-react';
import { MemeToastItem } from '../types';

interface MemeToastContainerProps {
  toasts: MemeToastItem[];
  onDismiss: (id: string) => void;
}

export const MemeToastContainer: React.FC<MemeToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      id="meme-toast-container"
      className="fixed top-14 left-1/2 -translate-x-1/2 z-[99990] pointer-events-none flex flex-col items-center gap-2 w-full max-w-lg px-4 font-mono select-none"
    >
      {toasts.map((toast) => {
        // Resolve border accent glow based on toast badge color
        const isDanger = toast.badgeColor.includes('rose') || toast.badgeColor.includes('red');
        const isWarning = toast.badgeColor.includes('amber') || toast.badgeColor.includes('yellow');
        const isSuccess = toast.badgeColor.includes('emerald') || toast.badgeColor.includes('green');

        const borderColor = isDanger
          ? 'border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
          : isWarning
          ? 'border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
          : 'border-cyan-500/60 shadow-[0_0_10px_rgba(56,189,248,0.2)]';

        const dotColor = isDanger
          ? 'bg-rose-500'
          : isWarning
          ? 'bg-amber-400'
          : 'bg-cyan-400';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-[#0a0c10]/95 border ${borderColor} p-2.5 rounded-md shadow-2xl flex items-center gap-3 backdrop-blur-xl w-full animate-in slide-in-from-top-4 fade-in duration-300 transform transition-all cctv-brackets relative overflow-hidden`}
          >
            {/* Tactical top label strip */}
            <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative w-11 h-11 rounded overflow-hidden border border-white/15 shrink-0 bg-black/60 shadow-inner">
              <img
                src={toast.image}
                alt={toast.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse shrink-0`} />
                  <span className="text-[10px] text-slate-400 tracking-wider uppercase font-bold">
                    &gt; INTERCEPT //
                  </span>
                  <span className="text-xs font-bold text-slate-100 truncate tracking-wide">
                    {toast.title}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 tracking-wider uppercase border border-white/10 ${toast.badgeColor}`}
                >
                  {toast.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                {toast.desc}
              </p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition self-center shrink-0"
              title="關閉警報"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
