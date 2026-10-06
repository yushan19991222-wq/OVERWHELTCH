import React, { useState } from 'react';
import { Eye, ShieldAlert, Coffee, Activity, Sparkles, Flame, Zap, X } from 'lucide-react';
import { MemeToastItem } from '../types';

interface MemeToastContainerProps {
  toasts: MemeToastItem[];
  onDismiss: (id: string) => void;
}

// Tactical Icon component that never flickers or causes network 404 recursion
const ToastThumbnail: React.FC<{ toast: MemeToastItem }> = React.memo(({ toast }) => {
  // Only attempt image render if it is a real inline camera snapshot or verified existing asset
  const isRealImage = Boolean(
    toast.image &&
      (toast.image.startsWith('data:image/') ||
        toast.image.startsWith('blob:') ||
        toast.image === '/memes/cat-yawn.jpg')
  );

  const [imgError, setImgError] = useState<boolean>(!isRealImage);

  const renderTacticalIcon = () => {
    switch (toast.type) {
      case 'blink':
        return <Eye className="w-5 h-5 text-cyan-400" />;
      case 'frown':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'yawn':
        return <Coffee className="w-5 h-5 text-rose-400" />;
      case 'sedentary':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'slack':
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      case 'overtime':
        return <Flame className="w-5 h-5 text-rose-400" />;
      default:
        return <Zap className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="relative w-10 h-10 rounded overflow-hidden border border-white/15 shrink-0 bg-[#070b14] flex items-center justify-center shadow-inner">
      {!imgError && isRealImage && toast.image ? (
        <img
          src={toast.image}
          alt={toast.title}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-[#070b14]">
          {renderTacticalIcon()}
        </div>
      )}
    </div>
  );
});

ToastThumbnail.displayName = 'ToastThumbnail';

export const MemeToastContainer: React.FC<MemeToastContainerProps> = React.memo(({ toasts, onDismiss }) => {
  return (
    <div
      id="meme-toast-container"
      className="fixed top-14 left-1/2 -translate-x-1/2 z-[99990] pointer-events-none flex flex-col items-center gap-2 w-full max-w-lg px-4 font-mono select-none"
    >
      <style>{`
        @keyframes toastDeplete {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-deplete {
          animation: toastDeplete 3s linear forwards;
        }
      `}</style>
      {toasts.map((toast) => {
        // Resolve border accent glow based on toast badge color
        const isDanger = toast.badgeColor.includes('rose') || toast.badgeColor.includes('red');
        const isWarning = toast.badgeColor.includes('amber') || toast.badgeColor.includes('yellow');

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

        const barColor = isDanger
          ? 'bg-rose-500/80'
          : isWarning
          ? 'bg-amber-400/80'
          : 'bg-cyan-400/80';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-[#0a0c10]/95 border ${borderColor} p-2.5 rounded-md shadow-2xl flex items-center gap-3 backdrop-blur-xl w-full animate-in slide-in-from-top-4 fade-in duration-200 transform transition-all cctv-brackets relative overflow-hidden`}
          >
            {/* Tactical top label strip */}
            <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <ToastThumbnail toast={toast} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
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
              className="p-1 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition self-center shrink-0 cursor-pointer"
              title="關閉警報"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* 3-second depletion indicator bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
              <div className={`h-full ${barColor} animate-toast-deplete`} />
            </div>
          </div>
        );
      })}
    </div>
  );
});

MemeToastContainer.displayName = 'MemeToastContainer';
