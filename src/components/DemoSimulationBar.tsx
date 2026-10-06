import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface DemoSimulationBarProps {
  onTriggerSedentary: () => void;
  onTriggerProximity: () => void;
  onTriggerYawn: () => void;
  onTriggerBlink: () => void;
  onTriggerFrown: () => void;
  onTriggerSlack: () => void;
  onTriggerOvertime: () => void;
  onTriggerHourlyBeautyAlert?: () => void;
}

export const DemoSimulationBar: React.FC<DemoSimulationBarProps> = ({
  onTriggerSedentary,
  onTriggerProximity,
  onTriggerYawn,
  onTriggerBlink,
  onTriggerFrown,
  onTriggerSlack,
  onTriggerOvertime,
  onTriggerHourlyBeautyAlert,
}) => {
  return (
    <div className="p-2.5 rounded-md bg-[#06080e] border border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs font-mono">
      <div className="flex items-center gap-1.5 text-slate-300 font-bold shrink-0">
        <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] text-cyan-300 tracking-wider">[OPERATOR_OVERRIDE_BENCH]:</span>
      </div>

      <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
        {/* 1. Sedentary 30s Calisthenics Routine */}
        <button
          onClick={onTriggerSedentary}
          className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-200 border border-cyan-400/60 hover:border-cyan-300 transition transform active:scale-95 flex items-center gap-1 text-[11px] font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]"
          title="測試久坐超時，直接喚醒全螢幕 30 秒隨機 3 種站立動態體操"
        >
          <span>🧘</span>
          <span>SEDENTARY_STRETCH (久坐體操)</span>
        </button>

        {/* 2. Proximity Distance Radar */}
        <button
          onClick={onTriggerProximity}
          className="px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/50 hover:border-rose-400 transition transform active:scale-95 flex items-center gap-1 text-[11px] font-bold"
          title="測試頭部貼近螢幕，觸發護眼距離雷達與 3 秒安全視距校準"
        >
          <span>🎯👀</span>
          <span>PROXIMITY_RADAR (距離雷達)</span>
        </button>

        {/* 3. Yawn Scared Detection */}
        <button
          onClick={onTriggerYawn}
          className="px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-500/40 hover:border-amber-400 transition transform active:scale-95 flex items-center gap-1 text-[11px] font-bold"
          title="測試張大嘴打哈欠抓包，彈出驚悚鬼怪/萌貓全螢幕迷因 (-5BP)"
        >
          <span>🥱🐱</span>
          <span>YAWN_SCARE [-5]</span>
        </button>

        {/* 4. Blink Fatigue Idol SPA */}
        <button
          onClick={onTriggerBlink}
          className="px-2 py-1 rounded bg-pink-950/40 hover:bg-pink-900/50 text-pink-300 border border-pink-500/40 hover:border-pink-400 transition transform active:scale-95 flex items-center gap-1 text-[11px] font-bold"
          title="測試頻繁眨眼/眼部疲勞，彈出男女神偶像洗眼 SPA (-3BP)"
        >
          <span>✨😍</span>
          <span>BLINK_IDOL (眨眼養眼)</span>
        </button>

        {/* 5. Frown Tension */}
        <button
          onClick={onTriggerFrown}
          className="px-2 py-1 rounded bg-[#0b0e14] hover:bg-slate-900 text-slate-300 border border-slate-700/80 hover:border-slate-600 transition transform active:scale-95 flex items-center gap-1 text-[11px]"
          title="測試眉頭緊鎖怨氣沖天，提醒放鬆額頭 (-3BP)"
        >
          <span>😠</span>
          <span>FROWN [-3]</span>
        </button>

        {/* 6. Leave Desk Slack Recharge */}
        <button
          onClick={onTriggerSlack}
          className="px-2 py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 transition transform active:scale-95 flex items-center gap-1 text-[11px] font-bold"
          title="測試離座超過 3 分鐘，獎勵薪水小偷回血 (+10BP)"
        >
          <span>☕</span>
          <span>SLACK [+10]</span>
        </button>

        {/* 7. Overtime Drain */}
        <button
          onClick={onTriggerOvertime}
          className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/40 hover:border-red-400 transition transform active:scale-95 flex items-center gap-1 text-[11px]"
          title="測試下班後超時伏案加班，生命力流失 (-15BP)"
        >
          <span>🩸</span>
          <span>OVERTIME [-15]</span>
        </button>

        {/* 8. Hourly Hydrate & Beauty Score */}
        {onTriggerHourlyBeautyAlert && (
          <button
            onClick={onTriggerHourlyBeautyAlert}
            className="px-2.5 py-1 rounded bg-gradient-to-r from-blue-950/60 to-cyan-950/60 hover:from-blue-900/70 hover:to-cyan-900/70 text-cyan-200 border border-cyan-400/50 hover:border-cyan-300 transition transform active:scale-95 flex items-center gap-1 text-[11px] font-bold"
            title="模擬 1 小時整點 AI 顏值評測彈窗與喝水水光肌提醒 (+5BP)"
          >
            <span>💧✨</span>
            <span>HOURLY_HYDRATE (喝水評測)</span>
          </button>
        )}
      </div>
    </div>
  );
};
