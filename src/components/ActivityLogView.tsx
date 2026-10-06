import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { HealthEvent } from '../types';

interface ActivityLogViewProps {
  events: HealthEvent[];
  onClear: () => void;
}

// Helper to strip all emoji characters for clean Overwatch terminal log style
const stripEmoji = (str: string) => {
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ events, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when a new event is added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [events.length]);

  return (
    <div className="bg-[#06080e] border border-slate-800 rounded-md p-3.5 flex flex-col h-full overflow-hidden backdrop-blur-md shadow-xl font-mono cctv-brackets">
      {/* Unified Block Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#00d8ff] animate-pulse shadow-[0_0_8px_#00d8ff] shrink-0" />
          <h3 className="text-xs font-mono font-bold text-[#00d8ff] tracking-wider uppercase truncate">
            [SURVEILLANCE_LOG]
          </h3>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/60 border border-slate-800 text-slate-400 font-bold">
            {events.length} 筆
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[9px] text-slate-400 hover:text-slate-100 flex items-center gap-1 transition px-1.5 py-0.5 rounded border border-slate-800 hover:border-slate-700 bg-black/40 cursor-pointer"
        >
          <Trash2 className="w-2.5 h-2.5" />
          <span>清除紀錄</span>
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 max-h-[380px] lg:max-h-none overflow-y-auto space-y-1.5 pr-1.5 text-xs custom-scrollbar"
      >
        {events.length === 0 ? (
          <div className="h-full min-h-[220px] flex items-center justify-center p-8 text-center text-slate-500 text-[11px]">
            &gt; [待命中] 鏡頭健康監控運作中，尚無異常事件...
          </div>
        ) : (
          events.map((ev) => {
            let badgeBg = 'bg-black/80 border-slate-800 text-slate-400';
            let tag = 'INFO';
            let tagColor = 'text-slate-400';

            if (ev.delta < 0) {
              badgeBg = 'bg-rose-950/70 border-rose-500/50 text-rose-300';
              tag = 'HAZARD';
              tagColor = 'text-rose-400';
            } else if (ev.delta > 0) {
              badgeBg = 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300';
              tag = 'RECOVER';
              tagColor = 'text-cyan-400';
            }

            return (
              <div
                key={ev.id}
                className="p-1.5 rounded bg-[#040609] border border-slate-900 hover:border-slate-700/80 flex items-center justify-between gap-2 transition-all font-mono shrink-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] text-slate-500 shrink-0">[{ev.timestamp}]</span>
                  <span className={`text-[9px] font-bold px-1 py-0.2 rounded border border-slate-800 shrink-0 ${tagColor}`}>
                    {tag}
                  </span>
                  <span className="text-slate-200 text-[11px] truncate">{stripEmoji(ev.message)}</span>
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
