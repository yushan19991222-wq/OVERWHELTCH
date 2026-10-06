import React from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { HealthEvent } from '../types';

interface ActivityLogViewProps {
  events: HealthEvent[];
  onClear: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ events, onClear }) => {
  return (
    <div className="bg-[#06080e] border border-slate-800 rounded-lg p-3.5 flex flex-col flex-1 min-h-[280px] backdrop-blur-md shadow-xl font-mono cctv-brackets">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
            [SURVEILLANCE_INTERCEPT_STREAM]
          </h3>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/60 border border-slate-800 text-slate-500">
            CNT: {events.length}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[9px] text-slate-500 hover:text-slate-200 flex items-center gap-1 transition px-1.5 py-0.5 rounded border border-slate-800 hover:border-slate-700 bg-black/40"
        >
          <Trash2 className="w-2.5 h-2.5" />
          <span>PURGE</span>
        </button>
      </div>

      <div className="space-y-1 overflow-y-auto max-h-[300px] pr-1 text-xs">
        {events.length === 0 ? (
          <div className="p-8 text-center text-slate-600 text-[11px]">
            &gt; [IDLE] MONITORING NODES ACTIVE. AWAITING TELEMETRY DELTAS...
          </div>
        ) : (
          events.map((ev) => {
            let badgeBg = 'bg-black/80 border-slate-800 text-slate-400';
            let tag = 'INFO';
            let tagColor = 'text-slate-500';

            if (ev.delta < 0) {
              badgeBg = 'bg-rose-950/80 border-rose-500/60 text-rose-300';
              tag = 'HAZARD';
              tagColor = 'text-rose-400';
            } else if (ev.delta > 0) {
              badgeBg = 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300';
              tag = 'RECOVER';
              tagColor = 'text-emerald-400';
            }

            return (
              <div
                key={ev.id}
                className="p-1.5 rounded bg-[#040609] border border-slate-900 hover:border-slate-700/80 flex items-center justify-between gap-2 transition-all font-mono"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] text-slate-500 shrink-0">[{ev.timestamp}]</span>
                  <span className={`text-[9px] font-bold px-1 py-0.2 rounded border border-slate-800 shrink-0 ${tagColor}`}>
                    {tag}
                  </span>
                  <span className="text-xs shrink-0">{ev.icon}</span>
                  <span className="text-slate-300 text-[11px] truncate">{ev.message}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {ev.delta !== 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeBg}`}>
                      {ev.delta > 0 ? `+${ev.delta}` : ev.delta}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
