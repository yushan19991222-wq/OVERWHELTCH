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
        <span className="text-[10px] text-cyan-300 tracking-wider">[HEALTH_OVERRIDE_BENCH] (健康疲勞模擬控制台):</span>
      </div>

      <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
        {/* 1. Sedentary 30s Calisthenics Routine */}
        <button
          onClick={onTriggerSedentary}
          className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-cyan-300 border border-slate-700/80 hover:border-cyan-400 transition transform active:scale-95 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold shadow-[0_0_8px_rgba(6,182,212,0.15)]"
          title="測試久坐時限超標，喚醒全螢幕 30 秒動態脊椎減壓體操"
        >
          <span>🧘</span>
          <span>SPINE_RESCUE (久坐減壓體操)</span>
        </button>

        {/* 2. Posture & Proximity Distance Radar */}
        <button
          onClick={onTriggerProximity}
          className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-rose-300 border border-slate-700/80 hover:border-rose-400 transition transform active:scale-95 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold"
          title="測試頭部貼近螢幕駝背（<30cm），啟動護眼視距雷達與 3 秒安全視距校準"
        >
          <span>🎯👀</span>
          <span>POSTURE_RADAR (近距駝背校準)</span>
        </button>

        {/* 3. Hypoxia & Yawn Scared Detection */}
        <button
          onClick={onTriggerYawn}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-amber-300 border border-slate-700/80 hover:border-amber-400 transition transform active:scale-95 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold"
          title="測試大腦缺氧張大嘴打哈欠，彈出防瞌睡鬼怪/萌貓迷因 (-5BP)"
        >
          <span>🥱🐱</span>
          <span>HYPOXIA_SCARE (缺氧哈欠警報)</span>
        </button>

        {/* 4. Dry Eye & Blink Fatigue Idol SPA */}
        <button
          onClick={onTriggerBlink}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-cyan-300 border border-slate-700/80 hover:border-cyan-400 transition transform active:scale-95 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold"
          title="測試 5 秒 3 次頻繁眨眼乾眼過勞，彈出神顏偶像洗眼護眼 SPA (-3BP)"
        >
          <span>✨😍</span>
          <span>DRY_EYE_SPA (乾眼疲勞洗眼)</span>
        </button>

        {/* 5. Stress & Frown Tension */}
        <button
          onClick={onTriggerFrown}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-indigo-300 border border-slate-700/80 hover:border-indigo-400 transition transform active:scale-95 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold"
          title="測試眉頭緊鎖與壓力緊繃，解鎖心靈解答之書 (-3BP)"
        >
          <span>📖</span>
          <span>STRESS_RELIEF (緊繃壓力排解)</span>
        </button>

        {/* 6. Leave Desk & Circulation Recovery */}
        <button
          onClick={onTriggerSlack}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-emerald-300 border border-slate-700/80 hover:border-emerald-400 transition transform active:scale-95 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold"
          title="測試離座走動活動超過 3 分鐘，獎勵健康存摺循環回血 (+10BP)"
        >
          <span>☕</span>
          <span>LEAVE_DESK (離座循環回血)</span>
        </button>

        {/* 7. Overtime & Burnout Drain */}
        <button
          onClick={onTriggerOvertime}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-rose-300 border border-slate-700/80 hover:border-rose-400 transition transform active:scale-95 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold"
          title="測試下班後超時伏案血汗加班，生命力流失與下班提醒 (-15BP)"
        >
          <span>🩸</span>
          <span>BURNOUT_ALERT (超時過勞警報)</span>
        </button>

        {/* 8. Hourly Hydrate & Beauty Score */}
        {onTriggerHourlyBeautyAlert && (
          <button
            onClick={onTriggerHourlyBeautyAlert}
            className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-cyan-200 border border-slate-700/80 hover:border-cyan-400 transition transform active:scale-95 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold"
            title="測試整點久坐細胞補水提醒與 AI 顏值活力評測 (+5BP)"
          >
            <span>💧✨</span>
            <span>HYDRATION_SCAN (整點細胞補水)</span>
          </button>
        )}
      </div>
    </div>
  );
};
