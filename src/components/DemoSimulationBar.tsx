import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface DemoSimulationBarProps {
  onTriggerYawn: () => void;
  onTriggerFrown: () => void;
  onTriggerSedentary: () => void;
  onTriggerSlack: () => void;
  onTriggerProximity: () => void;
  onTriggerOvertime: () => void;
  onTriggerStretch?: () => void;
}

export const DemoSimulationBar: React.FC<DemoSimulationBarProps> = ({
  onTriggerYawn,
  onTriggerFrown,
  onTriggerSedentary,
  onTriggerSlack,
  onTriggerProximity,
  onTriggerOvertime,
  onTriggerStretch,
}) => {
  return (
    <div className="p-2.5 rounded-md bg-[#06080e] border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
      <div className="flex items-center gap-1.5 text-slate-300 font-bold shrink-0">
        <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] text-cyan-300 tracking-wider">[OPERATOR_OVERRIDE_BENCH]:</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={onTriggerYawn}
          className="px-2 py-1 rounded bg-[#030508] hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 transition transform active:scale-95 flex items-center gap-1 text-[11px]"
          title="測試張大嘴打哈欠超過 1.5 秒"
        >
          <span>🥱</span>
          <span>YAWN [-5]</span>
        </button>

        <button
          onClick={onTriggerFrown}
          className="px-2 py-1 rounded bg-[#030508] hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 transition transform active:scale-95 flex items-center gap-1 text-[11px]"
          title="測試緊皺眉頭超過 5 秒"
        >
          <span>😠</span>
          <span>FROWN [-3]</span>
        </button>

        <button
          onClick={onTriggerSedentary}
          className="px-2 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 border border-cyan-500/50 hover:border-cyan-400 transition transform active:scale-95 flex items-center gap-1 text-[11px] font-bold"
          title="測試連續久坐觸發全螢幕保護程式覆蓋中斷"
        >
          <span>🖥️</span>
          <span>SCREENSAVER</span>
        </button>

        {onTriggerStretch && (
          <button
            onClick={onTriggerStretch}
            className="px-2 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 border border-cyan-500/50 hover:border-cyan-400 transition transform active:scale-95 flex items-center gap-1 text-[11px] font-bold"
            title="測試 30 秒動態物理小人伸展暖身操"
          >
            <span>🧘</span>
            <span>30s_STRETCH</span>
          </button>
        )}

        <button
          onClick={onTriggerSlack}
          className="px-2 py-1 rounded bg-[#030508] hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 transition transform active:scale-95 flex items-center gap-1 text-[11px]"
          title="測試離座超過 3 分鐘摸魚回血"
        >
          <span>☕</span>
          <span>SLACK [+10]</span>
        </button>

        <button
          onClick={onTriggerProximity}
          className="px-2 py-1 rounded bg-[#030508] hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 transition transform active:scale-95 flex items-center gap-1 text-[11px]"
          title="測試貼太近畫面模糊 5 秒護眼"
        >
          <span>👀</span>
          <span>PROXIMITY</span>
        </button>

        <button
          onClick={onTriggerOvertime}
          className="px-2 py-1 rounded bg-[#030508] hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 transition transform active:scale-95 flex items-center gap-1 text-[11px]"
          title="測試超時加班生命力流失"
        >
          <span>🩸</span>
          <span>OVERTIME</span>
        </button>
      </div>
    </div>
  );
};
