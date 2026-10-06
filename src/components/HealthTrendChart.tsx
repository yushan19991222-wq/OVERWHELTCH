import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Activity, ShieldAlert, Zap, Filter, Clock } from 'lucide-react';
import { HealthTrendPoint, HealthEvent } from '../types';

interface HealthTrendChartProps {
  trendHistory: HealthTrendPoint[];
  events: HealthEvent[];
  currentScore: number;
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({
  trendHistory,
  events,
  currentScore,
}) => {
  const [viewMode, setViewMode] = useState<'all' | 'score' | 'fatigue'>('all');

  // Generate initial simulated today timeline data if trendHistory is short
  const chartData = useMemo(() => {
    if (trendHistory && trendHistory.length >= 5) {
      return trendHistory;
    }

    // Default simulated timeline starting from 09:00 AM today
    const now = new Date();
    const currentHour = now.getHours();
    const points: HealthTrendPoint[] = [];

    // Helper to format 2-digit hour/min
    const fmt = (h: number, m: number) =>
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    let runningScore = 100;
    const startHour = 9;
    const totalHours = Math.max(1, currentHour >= startHour ? currentHour - startHour : 4);

    // Initial 09:00 point
    points.push({
      time: '09:00',
      timestamp: Date.now() - totalHours * 3600 * 1000,
      score: 100,
      fatigueIndex: 1,
      eventDelta: 0,
      eventName: '上班簽到',
      eventType: 'info',
    });

    // Generate points along the timeline
    for (let i = 1; i <= Math.min(totalHours * 2, 12); i++) {
      const pastMins = i * 30;
      const t = new Date(Date.now() - (totalHours * 60 - pastMins) * 60 * 1000);
      const timeLabel = fmt(t.getHours(), t.getMinutes());

      // Simulate slight fatigue variation and hydration boosts
      let delta = 0;
      let fatigue = 1;
      let name = '定時健康監控';
      let type: 'penalty' | 'reward' | 'info' = 'info';

      if (i === 2) {
        delta = -5;
        fatigue = 6;
        name = '打哈欠抓包';
        type = 'penalty';
      } else if (i === 4) {
        delta = +5;
        fatigue = 2;
        name = '整點補水加分';
        type = 'reward';
      } else if (i === 6) {
        delta = -3;
        fatigue = 5;
        name = '緊皺眉頭警戒';
        type = 'penalty';
      } else if (i === 8) {
        delta = +3;
        fatigue = 2;
        name = '伸展操解鎖';
        type = 'reward';
      } else if (i === 10) {
        delta = -5;
        fatigue = 7;
        name = '久坐超時提醒';
        type = 'penalty';
      }

      runningScore = Math.max(20, Math.min(120, runningScore + delta));
      fatigue = Math.max(1, Math.min(10, fatigue + (runningScore < 80 ? 2 : -1)));

      points.push({
        time: timeLabel,
        timestamp: t.getTime(),
        score: runningScore,
        fatigueIndex: fatigue,
        eventDelta: delta,
        eventName: name,
        eventType: type,
      });
    }

    // Append latest event data if available
    if (events && events.length > 0) {
      const lastEv = events[0];
      const exist = points.some((p) => p.time === lastEv.timestamp);
      if (!exist) {
        points.push({
          time: lastEv.timestamp.slice(0, 5),
          timestamp: Date.now(),
          score: currentScore,
          fatigueIndex: lastEv.delta < 0 ? 8 : 2,
          eventDelta: lastEv.delta,
          eventName: lastEv.message.slice(0, 10),
          eventType: lastEv.delta < 0 ? 'penalty' : lastEv.delta > 0 ? 'reward' : 'info',
        });
      }
    } else if (points.length > 0) {
      // Ensure last point reflects current actual score
      points[points.length - 1].score = currentScore;
    }

    return points;
  }, [trendHistory, events, currentScore]);

  // Calculate high-level summary metrics
  const minScore = useMemo(
    () => Math.min(...chartData.map((d) => d.score), currentScore),
    [chartData, currentScore]
  );

  const maxScore = useMemo(
    () => Math.max(...chartData.map((d) => d.score), currentScore),
    [chartData, currentScore]
  );

  const totalPenalties = useMemo(
    () => events.filter((e) => e.delta < 0).length,
    [events]
  );

  const totalRewards = useMemo(
    () => events.filter((e) => e.delta > 0).length,
    [events]
  );

  // Status Badge Logic
  let statusBadgeText = '極佳 PERFECT';
  let statusBadgeClass = 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300';
  if (currentScore < 60) {
    statusBadgeText = '高危 CRITICAL';
    statusBadgeClass = 'bg-rose-950/80 border-rose-500/80 text-rose-300 animate-pulse';
  } else if (currentScore < 80) {
    statusBadgeText = '疲勞 FATIGUED';
    statusBadgeClass = 'bg-amber-950/80 border-amber-500/80 text-amber-300';
  }

  return (
    <div className="bg-[#06080e] border border-slate-800 rounded-md p-3.5 flex flex-col flex-1 min-h-[300px] backdrop-blur-md shadow-xl font-mono cctv-brackets">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-slate-800 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h3 className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
            [健康狀態與疲勞波動趨勢圖]
          </h3>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusBadgeClass}`}>
            {statusBadgeText}
          </span>
        </div>

        {/* View Filter Switchers */}
        <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setViewMode('all')}
            className={`text-[9px] px-2 py-0.5 rounded transition ${
              viewMode === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            全覽
          </button>
          <button
            onClick={() => setViewMode('score')}
            className={`text-[9px] px-2 py-0.5 rounded transition ${
              viewMode === 'score'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            分數曲線
          </button>
          <button
            onClick={() => setViewMode('fatigue')}
            className={`text-[9px] px-2 py-0.5 rounded transition ${
              viewMode === 'fatigue'
                ? 'bg-rose-500 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            疲勞事件
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="bg-[#030509] border border-slate-850 p-2 rounded flex flex-col justify-center">
          <div className="text-[9px] text-slate-500 flex items-center gap-1 uppercase">
            <Activity className="w-2.5 h-2.5 text-cyan-400" />
            <span>目前健康分</span>
          </div>
          <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
            {currentScore} <span className="text-[9px] text-slate-500">PTS</span>
          </div>
        </div>

        <div className="bg-[#030509] border border-slate-850 p-2 rounded flex flex-col justify-center">
          <div className="text-[9px] text-slate-500 flex items-center gap-1 uppercase">
            <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
            <span>今日疲勞警告</span>
          </div>
          <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
            {totalPenalties} <span className="text-[9px] text-slate-500">次次數</span>
          </div>
        </div>

        <div className="bg-[#030509] border border-slate-850 p-2 rounded flex flex-col justify-center">
          <div className="text-[9px] text-slate-500 flex items-center gap-1 uppercase">
            <Zap className="w-2.5 h-2.5 text-emerald-400" />
            <span>補水/舒展修復</span>
          </div>
          <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            {totalRewards} <span className="text-[9px] text-slate-500">次加分</span>
          </div>
        </div>

        <div className="bg-[#030509] border border-slate-850 p-2 rounded flex flex-col justify-center">
          <div className="text-[9px] text-slate-500 flex items-center gap-1 uppercase">
            <Clock className="w-2.5 h-2.5 text-amber-400" />
            <span>最高/最低紀錄</span>
          </div>
          <div className="text-xs font-bold text-slate-300 font-mono mt-0.5">
            <span className="text-cyan-400">{maxScore}</span> /{' '}
            <span className="text-rose-400">{minScore}</span>
          </div>
        </div>
      </div>

      {/* Recharts Main Graph */}
      <div className="w-full h-[220px] sm:h-[240px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
          >
            <defs>
              {/* Cyan Gradient for Health Score */}
              <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>

              {/* Rose Gradient for Fatigue Index */}
              <linearGradient id="fatigueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255, 255, 255, 0.06)"
              strokeDasharray="2 2"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
              stroke="rgba(255, 255, 255, 0.1)"
              dy={5}
            />

            {/* Left YAxis: Health Score (0~120) */}
            <YAxis
              yAxisId="health"
              domain={[0, 120]}
              tick={{ fill: '#38bdf8', fontSize: 10, fontFamily: 'monospace' }}
              stroke="rgba(56, 189, 248, 0.2)"
              ticks={[0, 40, 80, 100, 120]}
            />

            {/* Right YAxis: Fatigue Risk Index (0~10) */}
            <YAxis
              yAxisId="fatigue"
              orientation="right"
              domain={[0, 10]}
              tick={{ fill: '#fb7185', fontSize: 10, fontFamily: 'monospace' }}
              stroke="rgba(251, 113, 133, 0.2)"
              hide={viewMode === 'score'}
            />

            {/* Custom Cyberpunk Tooltip */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as HealthTrendPoint;
                  return (
                    <div className="bg-[#03060d] border border-cyan-500/70 p-2.5 rounded shadow-2xl font-mono text-xs max-w-[220px]">
                      <div className="text-[10px] text-slate-400 pb-1 border-b border-slate-800 flex justify-between">
                        <span>時間: {label}</span>
                        <span className="text-cyan-400 font-bold">
                          {data.eventName || '趨勢節點'}
                        </span>
                      </div>

                      <div className="mt-1.5 space-y-1">
                        <div className="flex justify-between items-center text-cyan-300 font-bold">
                          <span>健康分數:</span>
                          <span className="text-sm">{data.score} 分</span>
                        </div>

                        <div className="flex justify-between items-center text-rose-400">
                          <span>疲勞指數:</span>
                          <span>{data.fatigueIndex} / 10</span>
                        </div>

                        {data.eventDelta !== 0 && (
                          <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                            <span className="text-slate-400">分數變動:</span>
                            <span
                              className={`font-bold px-1 rounded ${
                                data.eventDelta > 0
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {data.eventDelta > 0 ? `+${data.eventDelta}` : data.eventDelta}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Safe / Healthy Threshold Line */}
            <ReferenceLine
              yAxisId="health"
              y={80}
              stroke="#06b6d4"
              strokeDasharray="4 4"
              label={{
                value: '最佳健康線 (80分)',
                fill: '#06b6d4',
                fontSize: 9,
                position: 'insideTopLeft',
              }}
            />

            {/* Critical Warning Threshold Line */}
            <ReferenceLine
              yAxisId="health"
              y={50}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              label={{
                value: '疲勞警戒線 (50分)',
                fill: '#f43f5e',
                fontSize: 9,
                position: 'insideBottomLeft',
              }}
            />

            {/* Health Score Area Curve */}
            {(viewMode === 'all' || viewMode === 'score') && (
              <Area
                yAxisId="health"
                type="monotone"
                dataKey="score"
                name="健康分數"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#healthGradient)"
                dot={{
                  r: 3,
                  fill: '#06b6d4',
                  stroke: '#030712',
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 5,
                  fill: '#38bdf8',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
              />
            )}

            {/* Fatigue Event Bar or Line */}
            {(viewMode === 'all' || viewMode === 'fatigue') && (
              <Bar
                yAxisId="fatigue"
                dataKey="fatigueIndex"
                name="疲勞指數"
                fill="#f43f5e"
                opacity={0.65}
                barSize={12}
                radius={[3, 3, 0, 0]}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Legend / Helper Note */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" />
            <span className="text-slate-400">青色實線: 健康評分 (0-120)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-rose-500/70 rounded-xs" />
            <span className="text-slate-400">紅色長條: 疲勞波動指數 (0-10)</span>
          </div>
        </div>
        <div className="text-[9px] text-slate-600">
          * 即時數據由 AI 臉部辨識與行為監測即時繪製
        </div>
      </div>
    </div>
  );
};
