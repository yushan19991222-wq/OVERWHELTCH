import React from 'react';
import { MemeToastItem } from '../types';

interface MemeToastContainerProps {
  toasts: MemeToastItem[];
  onDismiss: (id: string) => void;
}

export const MemeToastContainer: React.FC<MemeToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      id="meme-toast-container"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2.5 w-full max-w-md px-4 font-mono"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#0b101b] border border-cyan-500/70 p-3 rounded-lg shadow-2xl flex items-center gap-3 backdrop-blur-md w-full animate-in slide-in-from-top-4 fade-in duration-300 transform transition-all"
        >
          <img
            src={toast.image}
            alt={toast.title}
            className="w-11 h-11 rounded object-cover border border-slate-700 shrink-0 shadow-md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-slate-100 truncate">{toast.title}</span>
              <span
                className={`text-[9px] text-slate-950 font-bold px-1.5 py-0.5 rounded shrink-0 ${toast.badgeColor}`}
              >
                {toast.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{toast.desc}</p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-500 hover:text-slate-200 text-xs px-1 self-start transition"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
