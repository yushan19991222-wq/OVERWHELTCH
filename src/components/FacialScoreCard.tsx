import React, { useState } from 'react';
import { Sparkles, Zap, RefreshCw, Eye, Smile, Shield, Flame, X, Maximize2, ChevronRight, Droplets } from 'lucide-react';
import { FaceCharismaScore } from '../types';

interface FacialScoreCardProps {
  scoreData: FaceCharismaScore | null;
  isScanning: boolean;
  onTriggerScan: () => void;
  isFacePresent: boolean;
}

export const FacialScoreCard: React.FC<FacialScoreCardProps> = ({
  scoreData,
  isScanning,
  onTriggerScan,
  isFacePresent,
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const getRankBadgeClass = (rank: string) => {
    switch (rank) {
      case 'SSS':
        return 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)] border-pink-300';
      case 'SS':
        return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)] border-purple-300';
      case 'S':
        return 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)] border-cyan-300 font-black';
      case 'A+':
      case 'A':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      case 'B':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'C':
      case 'D':
        return 'bg-rose-500/25 text-rose-300 border-rose-500/60 animate-pulse';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  // State 1: No score yet (Initial Idle state)
  if (!scoreData) {
    return (
      <div className="p-3.5 rounded-md bg-[#06080e] border border-slate-800 text-xs font-mono flex items-center justify-between shadow-xl backdrop-blur-md cctv-brackets">
        <div className="flex items-center gap-2.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-200">[AI 顏值評分系統]</span>
            <span className="text-[10px] text-slate-500">待命中 (面向鏡頭即可自動/手動掃描)</span>
          </div>
        </div>
        <button
          onClick={onTriggerScan}
          disabled={isScanning || !isFacePresent}
          className="px-3 py-1.5 rounded bg-pink-950/80 hover:bg-pink-900 border border-pink-500/60 text-pink-200 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-md shrink-0"
        >
          <Zap className="w-3.5 h-3.5 text-pink-400" />
          <span>{isScanning ? '掃描中...' : '立即掃描'}</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Compact Overview Card aligned neatly with Camera Feed */}
      <div className="p-3.5 rounded-md bg-[#06080e] border border-pink-500/30 shadow-[0_4px_20px_rgba(236,72,153,0.12)] backdrop-blur-md text-xs font-mono relative overflow-hidden cctv-brackets flex flex-col justify-between">
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899] shrink-0" />
            <span className="text-[11px] font-bold text-pink-300 tracking-wider uppercase truncate">
              [AI_BIO_CHARISMA] // 顏值水光
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-950/80 text-pink-300 border border-pink-500/40 shrink-0">
              {scoreData.highlightTag}
            </span>
          </div>

          <button
            onClick={onTriggerScan}
            disabled={isScanning || !isFacePresent}
            className="px-2 py-0.5 rounded bg-pink-950/60 hover:bg-pink-900 border border-pink-500/50 text-pink-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40 shrink-0"
            title="重新掃描顏值"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-pink-400' : ''}`} />
            <span>{isScanning ? '掃描中' : '重測'}</span>
          </button>
        </div>

        {/* Concise Score Value Summary */}
        <div
          onClick={() => setIsDetailModalOpen(true)}
          className="flex items-center justify-between gap-3 bg-[#030508] p-2.5 rounded border border-slate-800 hover:border-pink-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Rank Badge */}
            <div
              className={`w-9 h-9 rounded flex flex-col items-center justify-center border font-black text-xs shrink-0 ${getRankBadgeClass(
                scoreData.rank
              )}`}
            >
              <span className="text-[7px] opacity-80 leading-none">RANK</span>
              <span className="leading-tight">{scoreData.rank}</span>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] text-pink-400 font-bold flex items-center gap-1 truncate">
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>{scoreData.title}</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {scoreData.comment}
              </div>
            </div>
          </div>

          {/* Big Score Value */}
          <div className="flex items-baseline gap-1 shrink-0 text-right">
            <span className="text-2xl font-black text-pink-400 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]">
              {scoreData.score}
            </span>
            <span className="text-[9px] text-slate-500 font-bold">PTS</span>
          </div>
        </div>

        {/* Click to expand detail button */}
        <button
          onClick={() => setIsDetailModalOpen(true)}
          className="mt-2.5 w-full py-1.5 px-2.5 rounded bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 text-pink-300 text-[10px] font-bold transition flex items-center justify-between gap-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Maximize2 className="w-3 h-3 text-pink-400" />
            <span>點擊查看 5 軸評測與水光護膚分析</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-pink-400" />
        </button>
      </div>

      {/* Full Detail Modal Popup */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#070a10] border border-pink-500/50 rounded-lg max-w-lg w-full p-5 font-mono shadow-2xl relative text-xs text-slate-200 cctv-brackets animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                <h3 className="text-sm font-bold text-pink-300 tracking-wider uppercase">
                  [AI 生物顏值水光氣場 // 完整評測報告]
                </h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Rank Hero Section */}
            <div className="flex items-center justify-between p-3.5 rounded-md bg-[#030508] border border-pink-500/30 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-md flex flex-col items-center justify-center border font-black text-base shrink-0 ${getRankBadgeClass(
                    scoreData.rank
                  )}`}
                >
                  <span className="text-[8px] opacity-80 leading-none">RANK</span>
                  <span className="leading-tight">{scoreData.rank}</span>
                </div>
                <div>
                  <div className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">
                    AI 戰術封號
                  </div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {scoreData.title}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-black text-pink-400 font-mono tracking-tighter drop-shadow-[0_0_12px_rgba(236,72,153,0.5)]">
                  {scoreData.score}
                </div>
                <div className="text-[10px] text-slate-500 font-bold">/ 100 PTS</div>
              </div>
            </div>

            {/* Tactical Commentary */}
            <div className="p-3 rounded bg-pink-950/20 border border-pink-500/30 mb-4 text-xs text-slate-200 leading-relaxed">
              <span className="text-pink-400 font-bold mr-1.5">&gt; 戰術督導評語:</span>
              <span>{scoreData.comment}</span>
            </div>

            {/* 5-Axis Radar Breakdown */}
            <div className="space-y-2 mb-4">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                [5 軸生物特徵雷達參數]
              </div>

              {/* Radiance */}
              <div className="bg-[#030508] p-2 rounded border border-slate-800 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1 text-pink-300 w-24 shrink-0">
                  <Sparkles className="w-3 h-3 text-pink-400" /> 氣場光彩
                </span>
                <div className="flex-1 bg-slate-900 h-2 rounded overflow-hidden">
                  <div className="h-full bg-pink-400" style={{ width: `${scoreData.metrics.radiance}%` }} />
                </div>
                <span className="font-bold text-pink-400 w-10 text-right">{scoreData.metrics.radiance}%</span>
              </div>

              {/* Sparkle */}
              <div className="bg-[#030508] p-2 rounded border border-slate-800 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1 text-cyan-300 w-24 shrink-0">
                  <Eye className="w-3 h-3 text-cyan-400" /> 眼神電力
                </span>
                <div className="flex-1 bg-slate-900 h-2 rounded overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${scoreData.metrics.sparkle}%` }} />
                </div>
                <span className="font-bold text-cyan-400 w-10 text-right">{scoreData.metrics.sparkle}%</span>
              </div>

              {/* Smile Power */}
              <div className="bg-[#030508] p-2 rounded border border-slate-800 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1 text-yellow-300 w-24 shrink-0">
                  <Smile className="w-3 h-3 text-yellow-400" /> 笑容治癒
                </span>
                <div className="flex-1 bg-slate-900 h-2 rounded overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${scoreData.metrics.smilePower}%` }} />
                </div>
                <span className="font-bold text-yellow-400 w-10 text-right">{scoreData.metrics.smilePower}%</span>
              </div>

              {/* Symmetry */}
              <div className="bg-[#030508] p-2 rounded border border-slate-800 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1 text-purple-300 w-24 shrink-0">
                  <Shield className="w-3 h-3 text-purple-400" /> 黃金比例
                </span>
                <div className="flex-1 bg-slate-900 h-2 rounded overflow-hidden">
                  <div className="h-full bg-purple-400" style={{ width: `${scoreData.metrics.symmetry}%` }} />
                </div>
                <span className="font-bold text-purple-400 w-10 text-right">{scoreData.metrics.symmetry}%</span>
              </div>

              {/* Charisma */}
              <div className="bg-[#030508] p-2 rounded border border-slate-800 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1 text-rose-300 w-24 shrink-0">
                  <Flame className="w-3 h-3 text-rose-400" /> 總裁霸氣
                </span>
                <div className="flex-1 bg-slate-900 h-2 rounded overflow-hidden">
                  <div className="h-full bg-rose-400" style={{ width: `${scoreData.metrics.charisma}%` }} />
                </div>
                <span className="font-bold text-rose-400 w-10 text-right">{scoreData.metrics.charisma}%</span>
              </div>
            </div>

            {/* Skincare Tip */}
            <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 mb-4 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-cyan-300 mr-1">💧 補水提顏密技:</span>
                <span>每小時補水 250~300ml 可維持皮膚光澤與細胞彈性，氣場直線飆升！</span>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  onTriggerScan();
                }}
                disabled={isScanning || !isFacePresent}
                className="px-3 py-1.5 rounded bg-pink-950/80 hover:bg-pink-900 border border-pink-500/60 text-pink-200 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-pink-400' : ''}`} />
                <span>{isScanning ? '掃描中...' : '重新掃描'}</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                關閉報告
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
