import React from 'react';
import { FlaskConical } from 'lucide-react';

interface DemoSimulationBarProps {
  onTriggerYawn: () => void;
  onTriggerFrown: () => void;
  onTriggerSedentary: () => void;
  onTriggerSlack: () => void;
  onTriggerProximity: () => void;
  onTriggerOvertime: () => void;
}

export const DemoSimulationBar: React.FC<DemoSimulationBarProps> = ({
  onTriggerYawn,
  onTriggerFrown,
  onTriggerSedentary,
  onTriggerSlack,
  onTriggerProximity,
  onTriggerOvertime,
}) => {
  return (
    <div className="p-3 rounded-xl bg-[#0b101b] border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-mono">
      <div className="flex items-center gap-2 text-slate-300 font-bold shrink-0">
        <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] text-cyan-300">[DIAG_BENCH // TEST_TRIGGER]:</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={onTriggerYawn}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 hover:border-rose-500/70 transition transform active:scale-95 flex items-center gap-1.5 hover:text-white"
          title="測試張大嘴打哈欠超過 1.5 秒"
        >
          <span>🥱</span>
          <span>YAWN (-5)</span>
        </button>

        <button
          onClick={onTriggerFrown}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 hover:border-amber-500/70 transition transform active:scale-95 flex items-center gap-1.5 hover:text-white"
          title="測試緊皺眉頭超過 5 秒"
        >
          <span>😠</span>
          <span>FROWN (-3)</span>
        </button>

        <button
          onClick={onTriggerSedentary}
          className="px-2.5 py-1.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/80 hover:border-rose-400 transition transform active:scale-95 flex items-center gap-1.5 font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]"
          title="測試連續久坐觸發全螢幕保護程式覆蓋中斷"
        >
          <span>🖥️</span>
          <span>螢幕保護中斷 (SCREENSAVER)</span>
        </button>

        <button
          onClick={onTriggerSlack}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 hover:border-emerald-500/70 transition transform active:scale-95 flex items-center gap-1.5 hover:text-white"
          title="測試離座超過 3 分鐘摸魚回血"
        >
          <span>☕</span>
          <span>SLACK (+10)</span>
        </button>

        <button
          onClick={onTriggerProximity}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 hover:border-cyan-500/70 transition transform active:scale-95 flex items-center gap-1.5 hover:text-white"
          title="測試貼太近畫面模糊 5 秒護眼"
        >
          <span>👀</span>
          <span>PROXIMITY (-5)</span>
        </button>

        <button
          onClick={onTriggerOvertime}
          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 hover:border-rose-500/70 transition transform active:scale-95 flex items-center gap-1.5 hover:text-white"
          title="測試超時加班生命力流失"
        >
          <span>🩸</span>
          <span>OVERTIME (-15)</span>
        </button>
      </div>
    </div>
  );
};
