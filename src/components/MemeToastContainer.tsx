import React, { useState } from 'react';
import { Eye, ShieldAlert, Coffee, Activity, Sparkles, Flame, Zap, X } from 'lucide-react';
import { MemeToastItem } from '../types';

interface MemeToastContainerProps {
  toasts: MemeToastItem[];
  onDismiss: (id: string) => void;
}

// Tactical Icon component that handles images and high-contrast icon fallbacks
const ToastThumbnail: React.FC<{ toast: MemeToastItem }> = React.memo(({ toast }) => {
  const [imgError, setImgError] = useState<boolean>(false);

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

  const hasValidImage = Boolean(
    toast.image &&
    toast.image.trim().length > 0 &&
    !toast.image.includes('cat-curious') &&
    !toast.image.includes('cat-chill') &&
    !toast.image.includes('dog-tired') &&
    !toast.image.includes('dog-frown') &&
    !imgError
  );

  return (
    <div className="relative w-10 h-10 rounded-md overflow-hidden border border-cyan-500/40 shrink-0 bg-[#060a14] flex items-center justify-center shadow-md">
      {hasValidImage ? (
        <img
          src={toast.image}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-[#060a14]">
          {renderTacticalIcon()}
        </div>
      )}
    </div>
  );
});

ToastThumbnail.displayName = 'ToastThumbnail';

// Helper to remove any emojis from text
const stripEmojis = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const MemeToastContainer: React.FC<MemeToastContainerProps> = React.memo(({ toasts, onDismiss }) => {
  // Guarantee only 1 toast is rendered at any time (latest toast singleton)
  const currentToast = toasts.length > 0 ? toasts[toasts.length - 1] : null;

  if (!currentToast) return null;

  // Resolve border accent glow based on toast badge color
  const isDanger = currentToast.badgeColor.includes('rose') || currentToast.badgeColor.includes('red');
  const isWarning = currentToast.badgeColor.includes('amber') || currentToast.badgeColor.includes('yellow');

  const borderColor = isDanger
    ? 'border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
    : isWarning
    ? 'border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
    : 'border-cyan-500/60 shadow-[0_0_12px_rgba(56,189,248,0.25)]';

  const dotColor = isDanger
    ? 'bg-rose-500'
    : isWarning
    ? 'bg-amber-400'
    : 'bg-cyan-400';

  const barColor = isDanger
    ? 'bg-rose-500'
    : isWarning
    ? 'bg-amber-400'
    : 'bg-cyan-400';

  const titleText = stripEmojis(currentToast.title);
  const descText = stripEmojis(currentToast.desc);
  const badgeText = stripEmojis(currentToast.badge);

  return (
    <div
      id="meme-toast-container"
      className="fixed top-14 left-1/2 -translate-x-1/2 z-[99990] pointer-events-none flex flex-col items-center w-full max-w-sm sm:max-w-md px-3 font-mono select-none"
    >
      <style>{`
        @keyframes toastDeplete3s {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-deplete-3s {
          animation: toastDeplete3s 3s linear forwards;
        }
      `}</style>
      
      <div
        key={currentToast.id}
        className={`pointer-events-auto bg-[#0a0c10]/95 border ${borderColor} p-2.5 rounded-md shadow-2xl flex items-center gap-3 backdrop-blur-xl w-full animate-in slide-in-from-top-3 fade-in duration-150 transform transition-all cctv-brackets relative overflow-hidden`}
      >
        {/* Tactical top label strip */}
        <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <ToastThumbnail toast={currentToast} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 animate-pulse`} />
              <span className="text-[9px] text-slate-400 tracking-wider uppercase font-bold shrink-0">
                &gt; INTERCEPT //
              </span>
              <span className="text-xs font-bold text-slate-100 truncate tracking-wide">
                {titleText}
              </span>
            </div>
            {badgeText && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 tracking-wider uppercase border border-white/10 ${currentToast.badgeColor}`}
              >
                {badgeText}
              </span>
            )}
          </div>
          {descText && (
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              {descText}
            </p>
          )}
        </div>

        <button
          onClick={() => onDismiss(currentToast.id)}
          className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/10 transition self-center shrink-0 cursor-pointer"
          title="關閉提示"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* 3-second depletion indicator bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
          <div className={`h-full ${barColor} animate-toast-deplete-3s`} />
        </div>
      </div>
    </div>
  );
});

MemeToastContainer.displayName = 'MemeToastContainer';
