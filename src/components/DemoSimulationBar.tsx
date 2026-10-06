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
        {/* === 1. 修復活力項目 (對應上方第 4 張卡片：翡翠綠 Emerald) === */}
        {/* 1.1 Sedentary 30s Calisthenics Routine */}
        <button
          onClick={onTriggerSedentary}
          className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#05140d] hover:bg-[#082215] text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold shadow-[0_0_8px_rgba(16,185,129,0.18)] cursor-pointer"
          title="【修復項目】測試連續久坐超標：啟動全螢幕 30 秒動態火柴人脊椎減壓伸展 (+15 BP)"
        >
          <span className="material-symbols-outlined text-[13px] text-emerald-400 shrink-0">accessibility_new</span>
          <span>久坐逾時 (伸展體操)</span>
        </button>

        {/* 1.2 Leave Desk & Circulation Recovery */}
        <button
          onClick={onTriggerSlack}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#05140d] hover:bg-[#082215] text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold shadow-[0_0_8px_rgba(16,185,129,0.18)] cursor-pointer"
          title="【修復項目】測試離座走動滿 5 分鐘：薪水小偷健康存摺自動回血 (+10 BP)"
        >
          <span className="material-symbols-outlined text-[13px] text-emerald-400 shrink-0">directions_walk</span>
          <span>離座走動 (摸魚回血)</span>
        </button>

        {/* 1.3 Hourly Hydrate & Water Vitality Recovery */}
        {onTriggerHourlyBeautyAlert && (
          <button
            onClick={onTriggerHourlyBeautyAlert}
            className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#05140d] hover:bg-[#082215] text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold shadow-[0_0_8px_rgba(16,185,129,0.18)] cursor-pointer"
            title="【修復項目】測試定時細胞補水提醒：啟動工位定時補水 (+5 BP，注入修復活力)"
          >
            <span className="material-symbols-outlined text-[13px] text-emerald-400 shrink-0">water_drop</span>
            <span>定時補水 (活力回血)</span>
          </button>
        )}

        {/* === 3. 壓力指數項目 (對應上方第 2 張卡片：紫色 Purple / Indigo) === */}
        {/* 3.1 Posture & Proximity Distance Radar */}
        <button
          onClick={onTriggerProximity}
          className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#0e071c] hover:bg-[#180d2e] text-purple-300 border border-purple-500/50 hover:border-purple-400 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold shadow-[0_0_8px_rgba(168,85,247,0.18)] cursor-pointer"
          title="【壓力項目】測試頭部貼近螢幕駝背 (<30cm)：推高壓力指數並啟動護眼視距校準"
        >
          <span className="material-symbols-outlined text-[13px] text-purple-400 shrink-0">center_focus_strong</span>
          <span>駝背過近 (視距模糊)</span>
        </button>

        {/* 3.2 Stress & Frown Tension */}
        <button
          onClick={onTriggerFrown}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#0e071c] hover:bg-[#180d2e] text-purple-300 border border-purple-500/50 hover:border-purple-400 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold shadow-[0_0_8px_rgba(168,85,247,0.18)] cursor-pointer"
          title="【壓力項目】測試深鎖眉心緊繃：推高壓力指數並解鎖心靈解答之書 (-3 BP)"
        >
          <span className="material-symbols-outlined text-[13px] text-purple-400 shrink-0">psychology</span>
          <span>深鎖眉頭 (壓力緊繃)</span>
        </button>

        {/* === 4. 疲勞指數項目 (對應上方第 3 張卡片：玫瑰紅 Rose / Red) === */}
        {/* 4.1 Hypoxia & Yawn Detection */}
        <button
          onClick={onTriggerYawn}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#16060c] hover:bg-[#250a14] text-rose-300 border border-rose-500/50 hover:border-rose-400 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold shadow-[0_0_8px_rgba(244,63,94,0.18)] cursor-pointer"
          title="【疲勞項目】測試大腦缺氧張大嘴哈欠 (MAR≥0.48)：推高疲勞指數 (-5 BP)"
        >
          <span className="material-symbols-outlined text-[13px] text-rose-400 shrink-0">bedtime</span>
          <span>大口哈欠 (瞌睡提神)</span>
        </button>

        {/* 4.2 Dry Eye & Blink Fatigue */}
        <button
          onClick={onTriggerBlink}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#16060c] hover:bg-[#250a14] text-rose-300 border border-rose-500/50 hover:border-rose-400 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold shadow-[0_0_8px_rgba(244,63,94,0.18)] cursor-pointer"
          title="【疲勞項目】測試急促眨眼或久閉乾眼過勞：推高疲勞指數 (-3 BP)"
        >
          <span className="material-symbols-outlined text-[13px] text-rose-400 shrink-0">visibility</span>
          <span>頻繁眨眼 (乾眼過勞)</span>
        </button>

        {/* 4.3 Overtime & Burnout Drain */}
        <button
          onClick={onTriggerOvertime}
          className="px-2 py-0.5 sm:px-2 sm:py-1 rounded bg-[#16060c] hover:bg-[#250a14] text-rose-300 border border-rose-500/50 hover:border-rose-400 transition transform active:scale-95 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold shadow-[0_0_8px_rgba(244,63,94,0.18)] cursor-pointer"
          title="【疲勞項目】測試下班後超時伏案血汗加班：精力嚴重流失並催促打卡下班 (-15 BP)"
        >
          <span className="material-symbols-outlined text-[13px] text-rose-400 shrink-0">alarm</span>
          <span>超時加班 (血汗扣血)</span>
        </button>
      </div>
    </div>
  );
};

