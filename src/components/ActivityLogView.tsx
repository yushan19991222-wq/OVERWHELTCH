import React from 'react';
import { ClipboardList, Trash2 } from 'lucide-react';
import { HealthEvent } from '../types';

interface ActivityLogViewProps {
  events: HealthEvent[];
  onClear: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ events, onClear }) => {
  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4 flex flex-col flex-1 min-h-[300px] backdrop-blur-md shadow-xl font-mono">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
        <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
          <span>[SYSTEM_EVENT_RECORDER]</span>
        </h3>
        <button
          onClick={onClear}
          className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition px-1.5 py-0.5 rounded border border-slate-800 hover:border-slate-700 bg-slate-900"
        >
          <Trash2 className="w-3 h-3" />
          <span>PURGE</span>
        </button>
      </div>

      <div className="space-y-1.5 overflow-y-auto max-h-[320px] pr-1 text-xs">
        {events.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            [LOG_BUFFER_EMPTY] 尚無異動紀錄，狀態正常監控中...
          </div>
        ) : (
          events.map((ev) => {
            let badgeBg = 'bg-slate-900 border-slate-800 text-slate-400';
            let borderClass = 'border-slate-800/80';

            if (ev.delta < 0) {
              badgeBg = 'bg-rose-950/80 border border-rose-500/50 text-rose-300';
              borderClass = 'border-rose-900/40';
            } else if (ev.delta > 0) {
              badgeBg = 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300';
              borderClass = 'border-emerald-900/40';
            }

            return (
              <div
                key={ev.id}
                className={`p-2 rounded-lg bg-[#070b12] border ${borderClass} flex items-center justify-between gap-2 transition-all hover:border-slate-700`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">{ev.icon}</span>
                  <span className="text-slate-300 text-[11px] truncate">{ev.message}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ev.delta !== 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeBg}`}>
                      {ev.delta > 0 ? `+${ev.delta}` : ev.delta}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">{ev.timestamp}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
