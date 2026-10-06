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
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-3 w-full max-w-md px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 backdrop-blur-xl w-full animate-in slide-in-from-top-4 fade-in duration-300 transform transition-all"
        >
          <img
            src={toast.image}
            alt={toast.title}
            className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0 shadow-md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-black text-slate-100 truncate">{toast.title}</span>
              <span
                className={`text-[10px] text-slate-950 font-black px-1.5 py-0.5 rounded-md shrink-0 ${toast.badgeColor}`}
              >
                {toast.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{toast.desc}</p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-500 hover:text-slate-300 text-xs px-1 self-start"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
