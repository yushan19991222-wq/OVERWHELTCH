import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import {
  TrendingUp,
  Activity,
  Zap,
  ShieldAlert,
  Brain,
} from 'lucide-react';
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

export interface PeriodicCardSnapshot {
  lastSlotKey: string;
  healthScore: number;
  stressScore: number;
  fatigueScore: number;
  recoveryScore: number;
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({
  trendHistory,
  events,
  currentScore,
  currentEmotion,
  telemetry,
  statsSummary,
  sedentaryLimitMinutes = 45,
}) => {
  // ─── 1. 根據圖表解析度與時間區間進行累加平均計算 ───
  // 統計從打卡上班（或初次成功進入頁面）起到當前更新時間點的所有數據點累加後之平均值
  const calculateCumulativeAverages = useCallback(() => {
    if (!trendHistory || trendHistory.length === 0) {
      const defaultHealth = currentScore || 100;
      return {
        healthScore: defaultHealth,
        stressScore: 15,
        fatigueScore: 10,
        recoveryScore: Math.min(100, Math.max(15, Math.round(defaultHealth * 0.65 + 20))),
      };
    }

    const totalPoints = trendHistory.length;
    let sumHealth = 0;
    let sumStress = 0;
    let sumFatigue = 0;
    let sumRecovery = 0;

    trendHistory.forEach((pt) => {
      sumHealth += typeof pt.score === 'number' ? pt.score : 100;
      
      const ptStress = typeof pt.stressScore === 'number'
        ? pt.stressScore
        : 20;
      sumStress += ptStress;

      const ptFatigue = typeof pt.fatigueScore === 'number'
        ? pt.fatigueScore
        : typeof pt.fatigueIndex === 'number'
        ? Math.min(100, pt.fatigueIndex * 10)
        : 15;
      sumFatigue += ptFatigue;

      const ptRecovery = typeof pt.recoveryScore === 'number'
        ? pt.recoveryScore
        : Math.min(100, Math.max(15, Math.round((pt.score || 100) * 0.65)));
      sumRecovery += ptRecovery;
    });

    return {
      healthScore: Math.round(sumHealth / totalPoints),
      stressScore: Math.min(100, Math.max(0, Math.round(sumStress / totalPoints))),
      fatigueScore: Math.min(100, Math.max(0, Math.round(sumFatigue / totalPoints))),
      recoveryScore: Math.min(100, Math.max(0, Math.round(sumRecovery / totalPoints))),
    };
  }, [trendHistory, currentScore]);

  // ─── 2. 智慧滾動式時間區間判定（依實際紀錄時間跨度自適應） ───
  const [userSelectedResolution, setUserSelectedResolution] = useState<'auto' | IntervalResolution>('auto');

  const dataTimeSpanMs = useMemo(() => {
    if (!trendHistory || trendHistory.length < 2) return 0;
    const timestamps = trendHistory.map((p) => p.timestamp || Date.now());
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps, Date.now());
    return Math.max(0, maxTs - minTs);
  }, [trendHistory]);

  const autoResolution: IntervalResolution = useMemo(() => {
    const THIRTY_MINS = 30 * 60 * 1000;
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    if (dataTimeSpanMs < THIRTY_MINS) return '5m';
    if (dataTimeSpanMs < THREE_HOURS) return '30m';
    return '1h';
  }, [dataTimeSpanMs]);

  const activeResolution: IntervalResolution = userSelectedResolution === 'auto' ? autoResolution : userSelectedResolution;

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

  // ─── 3. 按照下方圖表更新週期 (5m/30m/1h) 進行累加平均快照記錄 ───
  const [periodicSnapshot, setPeriodicSnapshot] = useState<PeriodicCardSnapshot>(() => {
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const saved = localStorage.getItem('overwatch_trend_snapshot');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.date === today && parsed.snapshot && (parsed.snapshot.stressScore > 0 || parsed.snapshot.recoveryScore > 0)) {
          return parsed.snapshot;
        }
      }
    } catch {}

    const initAvgs = calculateCumulativeAverages();
    const currentSlotKey = `${activeResolution}_${Math.floor(Date.now() / resolutionMs)}`;

    return {
      lastSlotKey: currentSlotKey,
      ...initAvgs,
    };
  });

  // 自動同步當日快照至 localStorage
  useEffect(() => {
    try {
      const today = new Date().toLocaleDateString('en-CA');
      localStorage.setItem(
        'overwatch_trend_snapshot',
        JSON.stringify({
          date: today,
          snapshot: periodicSnapshot,
        })
      );
    } catch (err) {
      console.warn('Failed to save trend snapshot to localStorage:', err);
    }
  }, [periodicSnapshot]);

  // 定期檢查並於圖表設定週期 (5m / 30m / 1h) 邊界自動更新卡片累加平均數值
  useEffect(() => {
    const checkAndUpdateSlot = () => {
      const currentSlotKey = `${activeResolution}_${Math.floor(Date.now() / resolutionMs)}`;
      setPeriodicSnapshot((prev) => {
        // 如果槽位未改變，維持既有統計數值穩定，不隨即時畫面跳動
        if (prev.lastSlotKey === currentSlotKey && (prev.stressScore > 0 || prev.recoveryScore > 0)) {
          return prev;
        }

        const avgs = calculateCumulativeAverages();
        return {
          lastSlotKey: currentSlotKey,
          ...avgs,
        };
      });
    };

    checkAndUpdateSlot();
    const interval = setInterval(checkAndUpdateSlot, 1000);
    return () => clearInterval(interval);
  }, [activeResolution, resolutionMs, calculateCumulativeAverages]);

  // ─── 4. 根據實際記錄的 trendHistory 構建時間軸數據（100% 真實記錄，絕不生成假數據） ───
  const chartData = useMemo(() => {
    if (!trendHistory || trendHistory.length === 0) {
      return [];
    }

    // 將 trendHistory 按照選定的 bucket 進行彙整聚合（只保留實際有記錄的時間槽）
    const bucketGroups = new Map<string, HealthTrendPoint[]>();
    trendHistory.forEach((pt) => {
      const slot = alignToSlot(pt.timestamp || Date.now(), activeResolution);
      const list = bucketGroups.get(slot.timeStr) || [];
      list.push(pt);
      bucketGroups.set(slot.timeStr, list);
    });

    const series = Array.from(bucketGroups.entries()).map(([timeStr, points]) => {
      const firstPt = points[0];
      const avgScore = Math.round(points.reduce((s, p) => s + p.score, 0) / points.length);

      const realStressPoints = points.filter((p) => p.stressScore !== undefined);
      const avgStress =
        realStressPoints.length > 0
          ? Math.round(realStressPoints.reduce((s, p) => s + (p.stressScore || 0), 0) / realStressPoints.length)
          : periodicSnapshot.stressScore;

      const realFatiguePoints = points.filter((p) => p.fatigueScore !== undefined);
      const avgFatigue =
        realFatiguePoints.length > 0
          ? Math.round(realFatiguePoints.reduce((s, p) => s + (p.fatigueScore || 0), 0) / realFatiguePoints.length)
          : periodicSnapshot.fatigueScore;

      const realRecoveryPoints = points.filter((p) => p.recoveryScore !== undefined);
      const avgRecovery =
        realRecoveryPoints.length > 0
          ? Math.round(realRecoveryPoints.reduce((s, p) => s + (p.recoveryScore || 0), 0) / realRecoveryPoints.length)
          : periodicSnapshot.recoveryScore;

      const latestEvent = points[points.length - 1].eventName;

      return {
        time: timeStr,
        timestamp: firstPt.timestamp || Date.now(),
        score: avgScore,
        stressScore: avgStress,
        fatigueScore: avgFatigue,
        recoveryScore: avgRecovery,
        eventName: latestEvent || '時段紀錄',
        displayTime: timeStr,
      };
    });

    // 依實際時間戳排序
    series.sort((a, b) => a.timestamp - b.timestamp);
    return series;
  }, [
    trendHistory,
    activeResolution,
    currentScore,
    periodicSnapshot.stressScore,
    periodicSnapshot.fatigueScore,
    periodicSnapshot.recoveryScore,
  ]);

  // Overall Health Status Badge Logic (基於圖表週期累加平均快照)
  let statusBadgeText = '全日良好 OPTIMAL';
  let statusBadgeClass = 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300';
  if (periodicSnapshot.healthScore < 60) {
    statusBadgeText = '全日過勞 CRITICAL';
    statusBadgeClass = 'bg-rose-950/80 border-rose-500/80 text-rose-300 animate-pulse';
  } else if (periodicSnapshot.healthScore < 80) {
    statusBadgeText = '全日疲勞 FATIGUED';
    statusBadgeClass = 'bg-amber-950/80 border-amber-500/80 text-amber-300';
  }

  // 簡短狀態文案 (基於圖表週期累加平均快照)
  const stressStatusText = periodicSnapshot.stressScore <= 25 ? '平靜無擾' : periodicSnapshot.stressScore <= 50 ? '輕微緊繃' : '高壓警戒';
  const fatigueStatusText = periodicSnapshot.fatigueScore <= 25 ? '體態輕盈' : periodicSnapshot.fatigueScore <= 50 ? '輕度疲憊' : '過勞警戒';
  const recoveryStatusText = periodicSnapshot.recoveryScore >= 50 ? '充沛回血' : periodicSnapshot.recoveryScore >= 20 ? '穩定蓄能' : '需補水休息';

  return (
    <div className="bg-[#06080e] border border-slate-800 rounded-md p-3 sm:p-3.5 flex flex-col h-full backdrop-blur-md shadow-xl font-mono cctv-brackets">
      {/* 簡約清晰的標題列（附帶智慧滾動刻度切換與更新間隔標註） */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2.5 gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#00d8ff] animate-pulse shadow-[0_0_8px_#00d8ff] shrink-0" />
          <h3 className="text-xs font-mono font-bold text-[#00d8ff] tracking-wider uppercase truncate">
            [HEALTH_TREND]
          </h3>
          <span className="text-[9px] text-slate-500 hidden sm:inline-block font-sans">
            (累加平均 · 每{activeResolution}更新)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusBadgeClass}`}>
            {statusBadgeText}
          </span>
        </div>
      </div>

      {/* ─── 四張卡片：全日打卡至今累加平均統計數據 ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2 sm:mb-2.5 shrink-0">
        {/* 左側：健康分數 HERO CARD */}
        <div className="sm:col-span-4 rounded-md bg-[#050b16] border border-cyan-500/60 px-3 py-2 sm:py-2.5 flex flex-col justify-between shadow-[0_0_15px_rgba(6,182,212,0.12)] relative overflow-hidden">
          <div className="flex items-center justify-between text-cyan-300 font-bold text-[10px] tracking-wider uppercase">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>健康分數</span>
            </span>
          </div>

          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] flex items-baseline">
              <span>{periodicSnapshot.healthScore}</span>
              <span className="text-xs text-slate-500 font-normal ml-1">/100</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans">
              {periodicSnapshot.healthScore >= 80 ? '體徵平穩良好' : periodicSnapshot.healthScore >= 60 ? '輕度疲勞消耗' : '過勞臨界警示'}
            </div>
          </div>
        </div>

        {/* 右側：三大維度卡片 (壓力、疲勞、修復) */}
        <div className="sm:col-span-8 grid grid-cols-3 gap-2">
          
          {/* 維度 1：🧠 壓力指數 */}
          <div className="bg-[#040814] border border-indigo-500/30 px-2.5 py-2 sm:py-2.5 rounded-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold text-indigo-300 uppercase">
              <span className="flex items-center gap-1">
                <Brain className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="truncate">壓力指數</span>
              </span>
            </div>

            <div className="my-0.5">
              <div className="text-lg sm:text-xl font-black text-indigo-200 font-mono flex items-baseline">
                <span>{periodicSnapshot.stressScore}</span>
                <span className="text-[10px] text-slate-500 font-normal ml-1">/100</span>
              </div>
            </div>

            <div className="text-[9px] text-slate-400 truncate">
              {stressStatusText}
            </div>
          </div>

          {/* 維度 2：🚨 疲勞指數 */}
          <div className="bg-[#120509] border border-rose-500/30 px-2.5 py-2 sm:py-2.5 rounded-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold text-rose-300 uppercase">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">疲勞指數</span>
              </span>
            </div>

            <div className="my-0.5">
              <div className="text-lg sm:text-xl font-black text-rose-300 font-mono flex items-baseline">
                <span>{periodicSnapshot.fatigueScore}</span>
                <span className="text-[10px] text-slate-500 font-normal ml-1">/100</span>
              </div>
            </div>

            <div className="text-[9px] text-rose-300/90 truncate">
              {fatigueStatusText}
            </div>
          </div>

          {/* 維度 3：⚡ 修復活力 */}
          <div className="bg-[#04100c] border border-emerald-500/30 px-2.5 py-2 sm:py-2.5 rounded-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300 uppercase">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">修復活力</span>
              </span>
            </div>

            <div className="my-0.5">
              <div className="text-lg sm:text-xl font-black text-emerald-300 font-mono flex items-baseline">
                <span>{periodicSnapshot.recoveryScore}</span>
                <span className="text-[10px] text-slate-500 font-normal ml-1">/100</span>
              </div>
            </div>

            <div className="text-[9px] text-emerald-400/90 truncate">
              {recoveryStatusText}
            </div>
          </div>

        </div>
      </div>

      {/* ─── 下方清晰折線圖 (動態滾動時間區間呈現) ─── */}
      <div className="w-full flex-1 min-h-[260px] relative my-1">
        {chartData.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none text-slate-500 font-mono text-xs bg-[#06080e]/60 backdrop-blur-[1px]">
            <div className="px-3 py-1.5 rounded border border-slate-800 bg-[#0a0f1d]/80 text-slate-400 flex items-center gap-2 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span>[ 待打卡上班 · 尚未開始記錄歷史體徵 ]</span>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 12, left: 6, bottom: 2 }}
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
              padding={{ left: 12, right: 12 }}
            />

            {/* 左側清晰藍色刻度數字 (0, 25, 50, 75, 100) */}
            <YAxis
              yAxisId="health"
              domain={[0, 100]}
              tick={{ fill: '#38bdf8', fontSize: 10, fontFamily: 'monospace' }}
              stroke="rgba(56, 189, 248, 0.3)"
              ticks={[0, 25, 50, 75, 100]}
              width={36}
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
  );
};
