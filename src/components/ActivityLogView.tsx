import React from 'react';
import { ClipboardList, Trash2 } from 'lucide-react';
import { HealthEvent } from '../types';

interface ActivityLogViewProps {
  events: HealthEvent[];
  onClear: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ events, onClear }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 flex flex-col flex-1 min-h-[300px] backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <h3 className="text-xs font-black tracking-wider text-slate-300 uppercase flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-cyan-400" />
          <span>辦公即時事件日誌</span>
        </h3>
        <button
          onClick={onClear}
          className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
        >
          <Trash2 className="w-3 h-3" />
          <span>清空</span>
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[320px] pr-1 text-xs">
        {events.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            目前尚無健康存摺異動事件，請保持良好坐姿與表情！
          </div>
        ) : (
          events.map((ev) => {
            let badgeBg = 'bg-slate-800 text-slate-300';
            let borderClass = 'border-slate-800/80';

            if (ev.delta < 0) {
              badgeBg = 'bg-rose-950/70 border border-rose-500/40 text-rose-300';
              borderClass = 'border-rose-900/30';
            } else if (ev.delta > 0) {
              badgeBg = 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300';
              borderClass = 'border-emerald-900/30';
            }

            return (
              <div
                key={ev.id}
                className={`p-2.5 rounded-xl bg-slate-950/60 border ${borderClass} flex items-center justify-between gap-2.5 transition-all hover:border-slate-700`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{ev.icon}</span>
                  <span className="text-slate-300 truncate">{ev.message}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ev.delta !== 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${badgeBg}`}>
                      {ev.delta > 0 ? `+${ev.delta}` : ev.delta}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-500">{ev.timestamp}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
