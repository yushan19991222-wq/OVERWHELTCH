import React from 'react';

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
    <div className="p-2.5 sm:p-3 rounded-md bg-[#06080e] border border-slate-800 backdrop-blur-md flex flex-col gap-2.5 text-xs font-mono">
      <div className="flex items-center justify-between border-b border-solid border-slate-800/80 pb-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-white font-bold shrink-0">
          <span className="material-symbols-outlined text-[15px] text-cyan-400 shrink-0">tune</span>
          <span className="text-[11px] text-white tracking-wider font-bold">[OVERRIDE_BENCH]</span>
        </div>
        <span className="text-[9px] text-slate-500 hidden sm:inline-block tracking-wider">
          SIMULATION CONTROLS
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 w-full">
        {/* === CATEGORY 1: Positive Recovery & Daily Routine (Cyan / 淺藍) === */}
        {/* 1. Sedentary 30s Calisthenics Routine */}
        <button
          onClick={onTriggerSedentary}
          className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-cyan-300 border border-slate-700/80 hover:border-cyan-500/60 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold shadow-[0_0_8px_rgba(6,182,212,0.15)] cursor-pointer"
          title="測試連續久坐超標：啟動全螢幕 30 秒動態火柴人脊椎減壓伸展"
        >
          <span className="material-symbols-outlined text-[13px] text-cyan-400 shrink-0">accessibility_new</span>
          <span>久坐逾時 (伸展體操)</span>
        </button>

        {/* 2. Leave Desk & Circulation Recovery */}
        <button
          onClick={onTriggerSlack}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-cyan-300 border border-slate-700/80 hover:border-cyan-500/60 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold cursor-pointer"
          title="測試離座走動滿 5 分鐘：薪水小偷健康存摺自動回血 (+10 BP)"
        >
          <span className="material-symbols-outlined text-[13px] text-cyan-400 shrink-0">directions_walk</span>
          <span>離座走動 (摸魚回血)</span>
        </button>

        {/* 3. Hourly Hydrate & Beauty Score */}
        {onTriggerHourlyBeautyAlert && (
          <button
            onClick={onTriggerHourlyBeautyAlert}
            className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-cyan-300 border border-slate-700/80 hover:border-cyan-500/60 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold cursor-pointer"
            title="測試整點細胞補水提醒：啟動 AI 顏值活力雷達掃描 (+5 BP)"
          >
            <span className="material-symbols-outlined text-[13px] text-cyan-400 shrink-0">water_drop</span>
            <span>整點補水 (顏值評測)</span>
          </button>
        )}

        {/* === CATEGORY 2: Fatigue & Care Alerts (Amber / 琥珀黃) === */}
        {/* 4. Hypoxia & Yawn Detection */}
        <button
          onClick={onTriggerYawn}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-amber-300 border border-slate-700/80 hover:border-amber-500/60 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold cursor-pointer"
          title="測試大腦缺氧張大嘴哈欠 (MAR≥0.48)：彈出醒腦迷因與疲憊警示 (-5 BP)"
        >
          <span className="material-symbols-outlined text-[13px] text-amber-400 shrink-0">bedtime</span>
          <span>大口哈欠 (瞌睡提神)</span>
        </button>

        {/* 5. Dry Eye & Blink Fatigue */}
        <button
          onClick={onTriggerBlink}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-amber-300 border border-slate-700/80 hover:border-amber-500/60 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold cursor-pointer"
          title="測試急促眨眼或久閉乾眼過勞：啟動神顏養眼護眼 SPA (-3 BP)"
        >
          <span className="material-symbols-outlined text-[13px] text-amber-400 shrink-0">visibility</span>
          <span>頻繁眨眼 (乾眼過勞)</span>
        </button>

        {/* === CATEGORY 3: Critical Hazard & Overtime Drain (Rose / 玫瑰紅) === */}
        {/* 6. Posture & Proximity Distance Radar */}
        <button
          onClick={onTriggerProximity}
          className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-rose-300 border border-slate-700/80 hover:border-rose-500/60 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold cursor-pointer"
          title="測試頭部貼近螢幕駝背 (<30cm)：啟動護眼視距模糊與安全距離校準"
        >
          <span className="material-symbols-outlined text-[13px] text-rose-400 shrink-0">center_focus_strong</span>
          <span>駝背過近 (視距模糊)</span>
        </button>

        {/* 7. Stress & Frown Tension */}
        <button
          onClick={onTriggerFrown}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-rose-300 border border-slate-700/80 hover:border-rose-500/60 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold cursor-pointer"
          title="測試深鎖眉心緊繃 (持續5秒)：解鎖心靈解答之書與減壓提醒 (-3 BP)"
        >
          <span className="material-symbols-outlined text-[13px] text-rose-400 shrink-0">psychology</span>
          <span>深鎖眉頭 (壓力緊繃)</span>
        </button>

        {/* 8. Overtime & Burnout Drain */}
        <button
          onClick={onTriggerOvertime}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#0b0e17] hover:bg-slate-800 text-rose-300 border border-slate-700/80 hover:border-rose-500/60 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold cursor-pointer"
          title="測試下班後超時伏案血汗加班：生命力流失與催促打卡下班 (-15 BP)"
        >
          <span className="material-symbols-outlined text-[13px] text-rose-400 shrink-0">alarm</span>
          <span>超時加班 (血汗扣血)</span>
        </button>
      </div>
    </div>
  );
};

