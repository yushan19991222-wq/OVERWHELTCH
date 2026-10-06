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
    <div className="p-3.5 sm:p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 text-slate-300 font-bold">
        <FlaskConical className="w-4 h-4 text-cyan-400" />
        <span>互動示範與速測 (Instant Trigger)：</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onTriggerYawn}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition transform active:scale-95 flex items-center gap-1.5"
          title="測試張大嘴打哈欠超過 1.5 秒"
        >
          <span>🥱</span>
          <span>打哈欠 (-5)</span>
        </button>

        <button
          onClick={onTriggerFrown}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition transform active:scale-95 flex items-center gap-1.5"
          title="測試緊皺眉頭超過 5 秒"
        >
          <span>😠</span>
          <span>皺眉發火 (-3)</span>
        </button>

        <button
          onClick={onTriggerSedentary}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition transform active:scale-95 flex items-center gap-1.5"
          title="測試連續久坐觸發迷因貓全螢幕鎖定"
        >
          <span>🪑</span>
          <span>久坐鎖定 (-10)</span>
        </button>

        <button
          onClick={onTriggerSlack}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition transform active:scale-95 flex items-center gap-1.5"
          title="測試離座超過 3 分鐘摸魚回血"
        >
          <span>☕</span>
          <span>摸魚獎勵 (+10)</span>
        </button>

        <button
          onClick={onTriggerProximity}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition transform active:scale-95 flex items-center gap-1.5"
          title="測試貼太近畫面模糊 5 秒護眼"
        >
          <span>👀</span>
          <span>螢幕貼太近 (-5)</span>
        </button>

        <button
          onClick={onTriggerOvertime}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition transform active:scale-95 flex items-center gap-1.5"
          title="測試超時加班生命力流失"
        >
          <span>🩸</span>
          <span>超時加班 (-15)</span>
        </button>
      </div>
    </div>
  );
};
