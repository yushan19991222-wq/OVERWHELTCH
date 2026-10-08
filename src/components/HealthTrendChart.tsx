import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { HeartPulse, Zap, Moon, BatteryCharging } from 'lucide-react';
import { HealthTrendPoint, HealthEvent, EmotionData, TelemetryData } from '../types';

interface HealthTrendChartProps {
  trendHistory: HealthTrendPoint[];
  events: HealthEvent[];
  currentScore: number;
  currentEmotion?: EmotionData;
  telemetry?: TelemetryData;
  statsSummary?: {
    yawnsCaught: number;
    frownsCaught: number;
    sedentaryLocksCount: number;
    slackMinutesEarned: number;
    overtimeMinutes: number;
  };
  sedentaryLimitMinutes?: number;
}

export type IntervalResolution = '5m' | '30m' | '1h';

// Align any timestamp to the specific resolution bucket
export const alignToSlot = (
  timestamp: number | undefined | null,
  resolution: IntervalResolution
): { timeStr: string; timestamp: number; slotTimestamp: number } => {
  const validTs = typeof timestamp === 'number' && !isNaN(timestamp) && timestamp > 0 ? timestamp : Date.now();
  const d = new Date(validTs);
  if (resolution === '5m') {
    const min = Math.floor(d.getMinutes() / 5) * 5;
    d.setMinutes(min, 0, 0);
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    return {
      timeStr,
      timestamp: d.getTime(),
      slotTimestamp: d.getTime(),
    };
  } else if (resolution === '30m') {
    const min = Math.floor(d.getMinutes() / 30) * 30;
    d.setMinutes(min, 0, 0);
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    return {
      timeStr,
      timestamp: d.getTime(),
      slotTimestamp: d.getTime(),
    };
  } else {
    // 1h
    d.setMinutes(0, 0, 0);
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:00`;
    return {
      timeStr,
      timestamp: d.getTime(),
      slotTimestamp: d.getTime(),
    };
  }
};

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({
  trendHistory,
  events,
  currentScore,
  currentEmotion,
  telemetry,
  statsSummary,
  sedentaryLimitMinutes = 45,
}) => {
  // ─── 1. 智慧滾動式時間區間判定（依實際紀錄時間跨度自適應 5m / 30m / 1h） ───
  const dataTimeSpanMs = useMemo(() => {
    if (!trendHistory || trendHistory.length === 0) return 0;
    const timestamps = trendHistory.map((p) => p.timestamp || Date.now());
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps, Date.now());
    return Math.max(0, maxTs - minTs);
  }, [trendHistory]);

  const activeResolution: IntervalResolution = useMemo(() => {
    const ONE_HOUR = 60 * 60 * 1000;
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    if (dataTimeSpanMs <= ONE_HOUR) return '5m';
    if (dataTimeSpanMs <= FOUR_HOURS) return '30m';
    return '1h';
  }, [dataTimeSpanMs]);

  const resolutionMs = useMemo(() => {
    switch (activeResolution) {
      case '30m':
        return 30 * 60 * 1000;
      case '1h':
        return 60 * 60 * 1000;
      case '5m':
      default:
        return 5 * 60 * 1000;
    }
  }, [activeResolution]);

  // ─── 2. 根據實際記錄與當前時間構建連續時間軸走勢數據（自起點平順延伸至當前時刻） ───
  const chartData = useMemo(() => {
    if (!trendHistory || trendHistory.length === 0) {
      return [];
    }

    // 將 trendHistory 按照選定的 bucket 進行彙整聚合
    const bucketGroups = new Map<string, HealthTrendPoint[]>();
    trendHistory.forEach((pt) => {
      const slot = alignToSlot(pt.timestamp || Date.now(), activeResolution);
      const list = bucketGroups.get(slot.timeStr) || [];
      list.push(pt);
      bucketGroups.set(slot.timeStr, list);
    });

    const nowTs = Date.now();
    const timestamps = trendHistory.map((p) => p.timestamp || nowTs);
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps, nowTs);

    const startSlotTs = alignToSlot(minTs, activeResolution).slotTimestamp;
    const endSlotTs = alignToSlot(maxTs, activeResolution).slotTimestamp;

    let lastKnownScore = currentScore || 100;
    let lastKnownStress = 20;
    let lastKnownFatigue = 15;
    let lastKnownRecovery = 65;

    const series: Array<{
      time: string;
      timestamp: number;
      score: number;
      stressScore: number;
      fatigueScore: number;
      recoveryScore: number;
      eventName: string;
      displayTime: string;
    }> = [];

    let currentTs = startSlotTs;
    // 自打卡首個時段起，連續推演至當前最新時段（上限 120 個槽位）
    while (currentTs <= endSlotTs && series.length < 120) {
      const slot = alignToSlot(currentTs, activeResolution);
      const points = bucketGroups.get(slot.timeStr);

      if (points && points.length > 0) {
        const avgScore = Math.round(points.reduce((s, p) => s + p.score, 0) / points.length);
        const realStressPoints = points.filter((p) => p.stressScore !== undefined);
        const avgStress =
          realStressPoints.length > 0
            ? Math.round(realStressPoints.reduce((s, p) => s + (p.stressScore || 0), 0) / realStressPoints.length)
            : lastKnownStress;

        const realFatiguePoints = points.filter((p) => p.fatigueScore !== undefined);
        const avgFatigue =
          realFatiguePoints.length > 0
            ? Math.round(realFatiguePoints.reduce((s, p) => s + (p.fatigueScore || 0), 0) / realFatiguePoints.length)
            : lastKnownFatigue;

        const realRecoveryPoints = points.filter((p) => p.recoveryScore !== undefined);
        const avgRecovery =
          realRecoveryPoints.length > 0
            ? Math.round(realRecoveryPoints.reduce((s, p) => s + (p.recoveryScore || 0), 0) / realRecoveryPoints.length)
            : lastKnownRecovery;

        const latestEvent = points[points.length - 1].eventName || '時段紀錄';

        lastKnownScore = avgScore;
        lastKnownStress = avgStress;
        lastKnownFatigue = avgFatigue;
        lastKnownRecovery = avgRecovery;

        series.push({
          time: slot.timeStr,
          timestamp: slot.slotTimestamp,
          score: avgScore,
          stressScore: avgStress,
          fatigueScore: avgFatigue,
          recoveryScore: avgRecovery,
          eventName: latestEvent,
          displayTime: slot.timeStr,
        });
      } else {
        // 中間平穩時段或當前最新時段
        const isCurrentSlot = slot.slotTimestamp === endSlotTs;
        const slotScore = isCurrentSlot ? (currentScore ?? lastKnownScore) : lastKnownScore;

        series.push({
          time: slot.timeStr,
          timestamp: slot.slotTimestamp,
          score: slotScore,
          stressScore: lastKnownStress,
          fatigueScore: lastKnownFatigue,
          recoveryScore: lastKnownRecovery,
          eventName: isCurrentSlot ? '即時體徵' : '平穩時段',
          displayTime: slot.timeStr,
        });
      }

      currentTs += resolutionMs;
    }

    return series;
  }, [
    trendHistory,
    activeResolution,
    resolutionMs,
    currentScore,
  ]);

  // ─── 4.1 容器寬度動態監聽與自適應一屏可視筆數計算 ───
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasUserScrolledRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [scrollPosition, setScrollPosition] = useState<{ isAtStart: boolean; isAtEnd: boolean }>({
    isAtStart: true,
    isAtEnd: true,
  });

  useEffect(() => {
    const el = chartWrapperRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(el.clientWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 每個時段點的最適可讀寬度 (像素)，依螢幕寬度自適應調配
  const slotWidthPx = useMemo(() => {
    if (containerWidth < 480) return 46;
    if (containerWidth < 768) return 50;
    return 54;
  }, [containerWidth]);

  // 當前螢幕寬度下，一屏最適可視時段數量 (自適應調配)
  const visibleSlotsCount = useMemo(() => {
    if (containerWidth <= 0) return 10;
    const effectiveWidth = Math.max(120, containerWidth - 38);
    return Math.max(5, Math.floor(effectiveWidth / slotWidthPx));
  }, [containerWidth, slotWidthPx]);

  const isScrollable = chartData.length > visibleSlotsCount;

  // 動態自適應計算圖表總寬度 (超過筆數時展開供橫向滑動)
  const calculatedChartWidth = useMemo(() => {
    if (!isScrollable || containerWidth <= 0) {
      return '100%';
    }
    const neededWidth = chartData.length * slotWidthPx;
    const effectiveWidth = Math.max(120, containerWidth - 38);
    return Math.max(effectiveWidth, neededWidth);
  }, [isScrollable, containerWidth, chartData.length, slotWidthPx]);

  // 預設或新數據加入時自動平滑滑動至最右側（最新當前時段）
  useEffect(() => {
    if (isScrollable && scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      if (!hasUserScrolledRef.current) {
        requestAnimationFrame(() => {
          el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: 'smooth' });
        });
      }
    }
  }, [chartData.length, isScrollable]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    hasUserScrolledRef.current = true;
    const maxScroll = scrollWidth - clientWidth;
    setScrollPosition({
      isAtStart: scrollLeft <= 8,
      isAtEnd: scrollLeft >= maxScroll - 8,
    });
  }, []);

  // Overall Health Status Badge Logic
  let statusBadgeText = '體徵平穩 OPTIMAL';
  let statusBadgeClass = 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300';
  if (currentScore < 60) {
    statusBadgeText = '過勞警戒 CRITICAL';
    statusBadgeClass = 'bg-rose-950/80 border-rose-500/80 text-rose-300 animate-pulse';
  } else if (currentScore < 80) {
    statusBadgeText = '輕度疲憊 FATIGUED';
    statusBadgeClass = 'bg-amber-950/80 border-amber-500/80 text-amber-300';
  }

  // ─── 即時 4 維度體徵數據計算 (對應圖表上方 4 張狀態卡片與下方 4 條走勢折線) ───
  const latestDataPoint = useMemo(() => {
    if (chartData && chartData.length > 0) {
      return chartData[chartData.length - 1];
    }
    return null;
  }, [chartData]);

  // 1. 健康指數 (Cyan)
  const displayHealthScore = currentScore;
  const healthBadge = useMemo(() => {
    if (displayHealthScore >= 80) return { text: 'OPTIMAL', class: 'bg-cyan-950/80 border-cyan-500/70 text-cyan-300' };
    if (displayHealthScore >= 60) return { text: 'FATIGUED', class: 'bg-amber-950/80 border-amber-500/70 text-amber-300' };
    return { text: 'CRITICAL', class: 'bg-rose-950/80 border-rose-500/70 text-rose-300 animate-pulse' };
  }, [displayHealthScore]);

  // 2. 壓力指數 (Indigo / Purple)
  const liveStress = useMemo(() => {
    if (latestDataPoint && typeof latestDataPoint.stressScore === 'number') {
      return latestDataPoint.stressScore;
    }
    const frownVal = telemetry?.frown ?? 0;
    const proxVal = telemetry?.proximity ?? 0;
    const deskSecs = telemetry?.consecutiveDeskSeconds ?? 0;
    const deskMins = deskSecs / 60;
    return Math.min(100, Math.max(12, Math.round(
      (deskMins / 10) * 5.5 +
      (frownVal > 0.01 ? ((frownVal - 0.01) / 0.06) * 30 : 0) +
      (proxVal > 45 ? ((proxVal - 45) / 25) * 20 : 0) +
      ((statsSummary?.frownsCaught ?? 0) * 3)
    )));
  }, [latestDataPoint, telemetry, statsSummary]);

  const stressBadge = useMemo(() => {
    if (liveStress >= 60) return { text: 'HIGH 緊繃', class: 'bg-rose-950/80 border-rose-500/70 text-rose-300' };
    if (liveStress >= 35) return { text: 'MED 偏高', class: 'bg-indigo-950/80 border-indigo-500/70 text-indigo-300' };
    return { text: 'LOW 平緩', class: 'bg-cyan-950/80 border-cyan-500/70 text-cyan-300' };
  }, [liveStress]);

  // 3. 疲勞指數 (Rose / Red)
  const liveFatigue = useMemo(() => {
    if (latestDataPoint && typeof latestDataPoint.fatigueScore === 'number') {
      return latestDataPoint.fatigueScore;
    }
    const marVal = telemetry?.mar ?? 0;
    const isBlinking = telemetry?.isFrequentBlinking ? 20 : 0;
    const deskSecs = telemetry?.consecutiveDeskSeconds ?? 0;
    const deskMins = deskSecs / 60;
    const yawns = statsSummary?.yawnsCaught ?? 0;
    return Math.min(100, Math.max(8, Math.round(
      (marVal > 0.45 ? 25 : 0) +
      isBlinking +
      Math.min(30, (deskMins / (sedentaryLimitMinutes || 45)) * 25) +
      (yawns * 4) +
      (currentScore < 70 ? (70 - currentScore) * 0.4 : 0)
    )));
  }, [latestDataPoint, telemetry, statsSummary, sedentaryLimitMinutes, currentScore]);

  const fatigueBadge = useMemo(() => {
    if (liveFatigue >= 60) return { text: 'ALERT 警報', class: 'bg-rose-950/80 border-rose-500/70 text-rose-300 animate-pulse' };
    if (liveFatigue >= 35) return { text: 'TIRED 疲勞', class: 'bg-amber-950/80 border-amber-500/70 text-amber-300' };
    return { text: 'FRESH 充沛', class: 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300' };
  }, [liveFatigue]);

  // 4. 修復活力 (Emerald)
  const liveRecovery = useMemo(() => {
    if (latestDataPoint && typeof latestDataPoint.recoveryScore === 'number') {
      return latestDataPoint.recoveryScore;
    }
    const baseRec = Math.round(currentScore * 0.65);
    const slackBonus = Math.min(25, (statsSummary?.slackMinutesEarned ?? 0) * 3);
    const stretchBonus = (statsSummary?.sedentaryLocksCount ?? 0) * 5;
    return Math.min(100, Math.max(15, baseRec + slackBonus + stretchBonus));
  }, [latestDataPoint, currentScore, statsSummary]);

  const recoveryBadge = useMemo(() => {
    if (liveRecovery >= 75) return { text: 'PEAK 滿格', class: 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300' };
    if (liveRecovery >= 45) return { text: 'CHARGING 蓄力', class: 'bg-teal-950/80 border-teal-500/70 text-teal-300' };
    return { text: 'LOW 匱乏', class: 'bg-rose-950/80 border-rose-500/70 text-rose-300' };
  }, [liveRecovery]);

  return (
    <div className="bg-[#06080e] border border-slate-800 rounded-md p-3 sm:p-3.5 flex flex-col h-full backdrop-blur-md shadow-xl font-mono cctv-brackets">
      {/* 簡約清晰的標題列與圖表走勢圖例 */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2 gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#00d8ff] animate-pulse shadow-[0_0_8px_#00d8ff] shrink-0" />
          <h3 className="text-xs font-mono font-bold text-[#00d8ff] tracking-wider uppercase truncate">
            [HEALTH_TREND]
          </h3>
        </div>

        {/* 圖例說明與即時狀態 */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 text-[9px] sm:text-[10px]">
          <span className="flex items-center gap-1 text-cyan-400 font-bold">
            <span className="w-2 h-0.5 bg-cyan-400 rounded-full" />
            <span>健康</span>
          </span>
          <span className="flex items-center gap-1 text-indigo-300">
            <span className="w-2 h-0.5 bg-indigo-400 rounded-full" />
            <span>壓力</span>
          </span>
          <span className="flex items-center gap-1 text-rose-300">
            <span className="w-2 h-0.5 bg-rose-400 rounded-full" />
            <span>疲勞</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-300">
            <span className="w-2 h-0.5 bg-emerald-400 rounded-full" />
            <span>修復</span>
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ml-1 ${statusBadgeClass}`}>
            {statusBadgeText}
          </span>
        </div>
      </div>

      {/* ─── 圖表上方 4 維度體徵即時狀態卡片 (對應下方 4 條走勢折線與操作測試台) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2 shrink-0">
        {/* === 第 1 張卡片：健康指數 (青色 Cyan) === */}
        <div
          className="p-2 sm:p-2.5 rounded bg-[#070b14] border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between select-none relative group shadow-sm"
          title="【健康指數】即時綜合身心健康評級，連動全日體徵走勢"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold truncate text-[10px] sm:text-[11px]">
              <HeartPulse className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="tracking-wider">健康指數</span>
            </span>
            <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${healthBadge.class}`}>
              {healthBadge.text}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1 my-0.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-cyan-300 tabular-nums tracking-tight">
              {displayHealthScore}
              <span className="text-[10px] font-normal text-slate-500 ml-1">PTS</span>
            </span>
            <span className="text-[9px] text-slate-400 font-mono truncate hidden xs:inline">
              綜合體徵
            </span>
          </div>

          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800/80 my-1">
            <div
              className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, displayHealthScore))}%` }}
            />
          </div>

          <div className="text-[9px] text-slate-400 flex items-center justify-between font-mono truncate">
            <span className="text-slate-500">基準: 100</span>
            <span className="text-cyan-400/90 truncate">即時戰力走勢</span>
          </div>
        </div>

        {/* === 第 2 張卡片：壓力指數 (紫色 Purple / Indigo) === */}
        <div
          className="p-2 sm:p-2.5 rounded bg-[#070b14] border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between select-none relative group shadow-sm"
          title="【壓力指數】由眉心緊繃、視距過近與連貫伏案時長綜合運算"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="flex items-center gap-1.5 text-indigo-400 font-bold truncate text-[10px] sm:text-[11px]">
              <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="tracking-wider">壓力指數</span>
            </span>
            <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${stressBadge.class}`}>
              {stressBadge.text}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1 my-0.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-indigo-300 tabular-nums tracking-tight">
              {liveStress}
              <span className="text-[10px] font-normal text-slate-500 ml-1">PTS</span>
            </span>
            <span className="text-[9px] text-slate-400 font-mono truncate hidden xs:inline">
              緊繃評級
            </span>
          </div>

          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800/80 my-1">
            <div
              className="h-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, liveStress))}%` }}
            />
          </div>

          <div className="text-[9px] text-slate-400 flex items-center justify-between font-mono truncate">
            <span className="text-slate-500">緊繃: {statsSummary?.frownsCaught ?? 0}次</span>
            <span className="text-indigo-400/90 truncate">視距 & 眉心</span>
          </div>
        </div>

        {/* === 第 3 張卡片：疲勞指數 (玫瑰紅 Rose / Red) === */}
        <div
          className="p-2 sm:p-2.5 rounded bg-[#070b14] border border-slate-800 hover:border-rose-500/50 transition-all flex flex-col justify-between select-none relative group shadow-sm"
          title="【疲勞指數】由大腦缺氧哈欠、頻繁眨眼乾眼與超時加班綜合運算"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="flex items-center gap-1.5 text-rose-400 font-bold truncate text-[10px] sm:text-[11px]">
              <Moon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="tracking-wider">疲勞指數</span>
            </span>
            <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${fatigueBadge.class}`}>
              {fatigueBadge.text}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1 my-0.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-rose-300 tabular-nums tracking-tight">
              {liveFatigue}
              <span className="text-[10px] font-normal text-slate-500 ml-1">PTS</span>
            </span>
            <span className="text-[9px] text-slate-400 font-mono truncate hidden xs:inline">
              倦怠警戒
            </span>
          </div>

          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800/80 my-1">
            <div
              className="h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, liveFatigue))}%` }}
            />
          </div>

          <div className="text-[9px] text-slate-400 flex items-center justify-between font-mono truncate">
            <span className="text-slate-500">哈欠: {statsSummary?.yawnsCaught ?? 0}次</span>
            <span className="text-rose-400/90 truncate">乾眼 & 缺氧</span>
          </div>
        </div>

        {/* === 第 4 張卡片：修復活力 (翡翠綠 Emerald) === */}
        <div
          className="p-2 sm:p-2.5 rounded bg-[#070b14] border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between select-none relative group shadow-sm"
          title="【修復活力】由離座摸魚回血、久坐體操伸展與定時水分補給注入活力"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold truncate text-[10px] sm:text-[11px]">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="tracking-wider">修復活力</span>
            </span>
            <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${recoveryBadge.class}`}>
              {recoveryBadge.text}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1 my-0.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-300 tabular-nums tracking-tight">
              {liveRecovery}
              <span className="text-[10px] font-normal text-slate-500 ml-1">PTS</span>
            </span>
            <span className="text-[9px] text-slate-400 font-mono truncate hidden xs:inline">
              回血蓄力
            </span>
          </div>

          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800/80 my-1">
            <div
              className="h-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, liveRecovery))}%` }}
            />
          </div>

          <div className="text-[9px] text-slate-400 flex items-center justify-between font-mono truncate">
            <span className="text-slate-500">摸魚: +{statsSummary?.slackMinutesEarned ?? 0}m</span>
            <span className="text-emerald-400/90 truncate">伸展 {statsSummary?.sedentaryLocksCount ?? 0}次</span>
          </div>
        </div>
      </div>

      {/* ─── 下方清晰折線圖 (支援橫向滑動與左側固定 Y 軸) ─── */}
      <div ref={chartWrapperRef} className="w-full flex-1 min-h-[250px] relative my-1 flex overflow-hidden">
        {chartData.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none text-slate-500 font-mono text-xs bg-[#06080e]/70 backdrop-blur-[1px]">
            <div className="px-3 py-1.5 rounded border border-slate-800 bg-[#0a0f1d]/90 text-slate-400 flex items-center gap-2 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span>[ 待打卡上班 · 尚未開始記錄歷史體徵 ]</span>
            </div>
          </div>
        )}

        {/* 釘選左側 Y 軸標籤 (始終保持可見，不隨圖表水平滾動移出視線) */}
        <div className="w-[38px] shrink-0 h-full select-none pointer-events-none border-r border-slate-800/80 bg-[#06080e] z-10">
          <ResponsiveContainer width={38} height="100%">
            <ComposedChart
              data={[{ score: 0 }, { score: 100 }]}
              margin={{ top: 10, right: 0, left: -2, bottom: 2 }}
            >
              <YAxis
                yAxisId="health"
                domain={[0, 100]}
                tick={{ fill: '#38bdf8', fontSize: 10, fontFamily: 'monospace' }}
                stroke="rgba(56, 189, 248, 0.3)"
                ticks={[0, 25, 50, 75, 100]}
                width={38}
              />
              <XAxis hide height={24} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 可橫向滑動之圖表走勢本體 */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 h-full overflow-x-auto overflow-y-hidden custom-scrollbar relative"
        >
          {/* 左側溢位陰影提示 */}
          {isScrollable && !scrollPosition.isAtStart && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#06080e] to-transparent z-10" />
          )}

          {/* 右側溢位陰影提示 */}
          {isScrollable && !scrollPosition.isAtEnd && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#06080e] to-transparent z-10" />
          )}

          <div style={{ width: calculatedChartWidth, minWidth: '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 10, bottom: 2 }}
              >
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="2 2"
                  vertical={false}
                />

                {/* X 軸刻度 */}
                <XAxis
                  dataKey="time"
                  interval={0}
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  stroke="rgba(255, 255, 255, 0.1)"
                  dy={5}
                  height={24}
                  padding={{ left: 16, right: 16 }}
                />

                {/* 隱藏主圖表中的 YAxis，由左側釘選 Y 軸呈現 */}
                <YAxis
                  yAxisId="health"
                  domain={[0, 100]}
                  hide={true}
                />

                {/* 四維度整合浮動視窗 (Tooltip) */}
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as any;
                      return (
                        <div className="bg-[#03060d]/95 backdrop-blur-md border border-cyan-500/70 p-2.5 rounded-lg shadow-2xl font-mono text-xs max-w-[240px]">
                          <div className="text-[10px] text-slate-400 pb-1.5 border-b border-slate-800 flex justify-between items-center">
                            <span className="text-cyan-300 font-bold">{data.time}</span>
                            <span className="text-slate-400 truncate">
                              {data.eventName}
                            </span>
                          </div>

                          <div className="mt-1.5 space-y-1">
                            <div className="flex justify-between items-center text-cyan-300 font-bold">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                健康分數:
                              </span>
                              <span className="text-sm">{data.score} PTS</span>
                            </div>

                            <div className="flex justify-between items-center text-indigo-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                壓力指數:
                              </span>
                              <span>{data.stressScore} PTS</span>
                            </div>

                            <div className="flex justify-between items-center text-rose-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                疲勞指數:
                              </span>
                              <span>{data.fatigueScore} PTS</span>
                            </div>

                            <div className="flex justify-between items-center text-emerald-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                修復活力:
                              </span>
                              <span>{data.recoveryScore} PTS</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* 80分健康基準參考線 */}
                <ReferenceLine
                  yAxisId="health"
                  y={80}
                  stroke="#06b6d4"
                  strokeDasharray="4 4"
                  label={{
                    value: '健康基準 (80分)',
                    fill: '#06b6d4',
                    fontSize: 9,
                    position: 'insideTopLeft',
                  }}
                />

                {/* 1. 健康分數：青藍色折線加微光底色 */}
                <Area
                  yAxisId="health"
                  type="linear"
                  dataKey="score"
                  name="健康分數"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#healthGradient)"
                  isAnimationActive={false}
                  connectNulls={true}
                  dot={{
                    r: 4,
                    fill: '#06b6d4',
                    stroke: '#030712',
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#38bdf8',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />

                {/* 2. 壓力指數：紫靛色折線 */}
                <Line
                  yAxisId="health"
                  type="linear"
                  dataKey="stressScore"
                  name="壓力指數"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  isAnimationActive={false}
                  connectNulls={true}
                  dot={{
                    r: 3.5,
                    fill: '#818cf8',
                    stroke: '#030712',
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: '#a5b4fc',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />

                {/* 3. 疲勞指數：玫紅色警示折線 */}
                <Line
                  yAxisId="health"
                  type="linear"
                  dataKey="fatigueScore"
                  name="疲勞指數"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  isAnimationActive={false}
                  connectNulls={true}
                  dot={{
                    r: 3.5,
                    fill: '#f43f5e',
                    stroke: '#030712',
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: '#fb7185',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />

                {/* 4. 修復活力：翡翠綠色折線 */}
                <Line
                  yAxisId="health"
                  type="linear"
                  dataKey="recoveryScore"
                  name="修復活力"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  isAnimationActive={false}
                  connectNulls={true}
                  dot={{
                    r: 3.5,
                    fill: '#10b981',
                    stroke: '#030712',
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: '#34d399',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── 底部操作與滑動提示 ─── */}
      {isScrollable && (
        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1 border-t border-slate-800/50 shrink-0">
          <span className="truncate">
            ⇄ 支援左右觸控滑動 / 滾輪捲動檢視全日紀錄 (每屏呈現 {visibleSlotsCount} 筆)
          </span>
          <span className="text-slate-400 shrink-0 hidden xs:inline">
            已自動對齊最新
          </span>
        </div>
      )}
    </div>
  );
};
