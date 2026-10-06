import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Droplets,
  X,
  Zap,
  Maximize2,
  Camera,
  Activity,
  Heart,
  Smile,
  Eye,
  Shield,
} from 'lucide-react';
import { FaceCharismaScore } from '../types';
import { FiveAxisRadarChart } from './FiveAxisRadarChart';

interface FacialScoreCardProps {
  scoreData: FaceCharismaScore | null;
  isScanning: boolean;
  onTriggerScan: () => void;
  isFacePresent: boolean;
  onOpenCandidGallery?: () => void;
  candidCount?: number;
}

export const FacialScoreCard: React.FC<FacialScoreCardProps> = ({
  scoreData,
  isScanning,
  onTriggerScan,
  isFacePresent,
  onOpenCandidGallery,
  candidCount = 0,
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Close modal on ESC key
  useEffect(() => {
    if (!isDetailModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDetailModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailModalOpen]);

  // Lock background scrolling and hide scrollbars when detailed modal is open
  useEffect(() => {
    if (isDetailModalOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isDetailModalOpen]);

  const getRankBadgeClass = (rank: string) => {
    switch (rank) {
      case 'SSS':
        return 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 border-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.6)] font-black';
      case 'SS':
      case 'S':
        return 'bg-cyan-950/90 text-cyan-300 border-cyan-400/80 shadow-[0_0_10px_rgba(6,182,212,0.35)] font-black';
      case 'A+':
      case 'A':
        return 'bg-emerald-950/90 text-emerald-300 border-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.3)] font-bold';
      case 'B':
        return 'bg-amber-950/90 text-amber-300 border-amber-400/80 font-bold';
      case 'C':
      case 'D':
        return 'bg-rose-950/90 text-rose-300 border-rose-400/80 font-bold animate-pulse';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <>
      {/* Compact Overview Card in Right Column */}
      <div className="p-3 sm:p-3.5 rounded-md bg-[#06080e] border border-slate-800 shadow-xl backdrop-blur-md text-xs font-mono relative overflow-hidden cctv-brackets flex flex-col gap-2.5">
        {/* Unified Block Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#00d8ff] animate-pulse shadow-[0_0_8px_#00d8ff] shrink-0" />
            <span className="text-xs font-mono font-bold text-[#00d8ff] tracking-wider uppercase truncate">
              [BIO_CHARISMA]
            </span>
          </div>

          <button
            onClick={onTriggerScan}
            disabled={isScanning || !isFacePresent}
            className="px-2.5 py-1 rounded bg-[#030508] hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0"
            title="啟動 AI 面部氣色神采掃描"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isScanning ? '掃描中...' : '重新掃描'}</span>
          </button>
        </div>

        {/* Main Content Row: Full Width Score Card */}
        <div className="w-full min-w-0">
          {scoreData ? (
            /* Interactive Score Card (When scanned) */
            <div
              onClick={() => setIsDetailModalOpen(true)}
              className="w-full min-w-0 bg-[#030508] hover:bg-[#070d18] p-2.5 rounded-md border border-slate-800 hover:border-cyan-500/70 transition cursor-pointer group shadow-sm flex items-center justify-between gap-3"
              title="點擊展開 5 軸生物雷達詳細報告"
            >
              {/* Left Info: Rank badge & Title */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded flex flex-col items-center justify-center border shrink-0 ${getRankBadgeClass(
                    scoreData.rank
                  )}`}
                >
                  <span className="text-[7px] tracking-widest opacity-80 leading-none">RANK</span>
                  <span className="text-sm leading-none font-black">{scoreData.rank}</span>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>神采判定</span>
                  </div>
                  <div className="text-xs font-bold text-slate-100 truncate group-hover:text-cyan-200 mt-0.5">
                    {scoreData.title}
                  </div>
                </div>
              </div>

              {/* Right: Prominent Score Display */}
              <div className="flex flex-col items-end shrink-0 pl-3 pr-1 border-l border-slate-800/80">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight group-hover:text-cyan-100">
                    {scoreData.score}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">PTS</span>
                </div>
              </div>
            </div>
          ) : (
            /* Initial Onboarding Placeholder (No score yet) */
            <div
              onClick={isFacePresent ? onTriggerScan : undefined}
              className={`w-full min-w-0 bg-[#030508]/90 p-2.5 rounded-md border border-slate-800/80 flex flex-col justify-between gap-1.5 ${
                isFacePresent ? 'hover:bg-[#070d18] hover:border-cyan-500/60 cursor-pointer transition' : 'opacity-75'
              }`}
              title={isFacePresent ? '點擊立刻啟動 AI 面部神采掃描' : '請正對鏡頭以啟動評測'}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase tracking-wider shrink-0">
                  STATUS: UNCALIBRATED
                </span>
                <span className="text-sm font-black text-slate-500 font-mono tracking-wider">-- PTS</span>
              </div>
              <div className="text-[11px] text-slate-300 font-bold truncate flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isFacePresent ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]' : 'bg-rose-500'}`} />
                <span>{isFacePresent ? '人臉已鎖定：點擊啟動 AI 評測' : '未感應到人臉：請正對鏡頭'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Detailed description panel if NO score yet */}
        {!scoreData && (
          <div className="p-2 sm:p-2.5 rounded bg-slate-950 border border-slate-850 text-[11px] text-slate-300 leading-relaxed font-mono">
            <span className="text-[#00d8ff] font-bold mr-1">&gt; 評測說明:</span>
            <span>分析面色紅潤度、眼神聚焦度、嘴角與眉心放鬆度，計算即時面部神采指數與 5 軸生物雷達。</span>
          </div>
        )}
      </div>

      {/* Full Detail Modal Popup */}
      {isDetailModalOpen && scoreData && (
        <div className="fixed inset-0 z-[999995] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fade-in font-mono">
          <div className="bg-[#070a12] border border-cyan-500/40 rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.22)] relative text-xs text-slate-200 cctv-brackets animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header - Unified Style */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00d8ff] animate-pulse shadow-[0_0_8px_#00d8ff] shrink-0" />
                <h3 className="text-xs sm:text-sm font-mono font-bold text-[#00d8ff] tracking-wider uppercase">
                  [BIO_CHARISMA]
                </h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center"
                title="關閉報告"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <style>{`
              .custom-ow-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .custom-ow-scrollbar::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.02);
                border-radius: 4px;
              }
              .custom-ow-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(6, 182, 212, 0.35);
                border-radius: 4px;
              }
              .custom-ow-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(6, 182, 212, 0.6);
              }
            `}</style>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-3.5 custom-ow-scrollbar">
              
              {/* Score & Rank Hero Section */}
              <div className="rounded-xl bg-[#03060c] border border-cyan-500/30 shadow-inner overflow-hidden flex flex-col">
                {/* Top horizontal block: Level, Title, Score */}
                <div className="flex items-center justify-between p-3.5 sm:p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex flex-col items-center justify-center border font-mono font-black shrink-0 ${getRankBadgeClass(
                        scoreData.rank
                      )}`}
                    >
                      <span className="text-[8px] opacity-80 tracking-widest leading-none mb-0.5">RANK</span>
                      <span className="text-xl sm:text-2xl leading-none">{scoreData.rank}</span>
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>氣色狀態判讀</span>
                      </div>
                      <div className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
                        {scoreData.title}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3.5 pr-2 sm:pr-3 border-l border-slate-800/80 flex flex-col items-end justify-center min-w-[72px] sm:min-w-[80px]">
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_12px_rgba(6,182,212,0.6)] leading-none">
                      {scoreData.score}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 leading-none">/ 100 PTS</span>
                  </div>
                </div>

                {/* Bottom explanation block: comment (separated by dividing line and subtle dark bg) */}
                <div className="px-4 py-3 bg-[#020409]/50 border-t border-slate-800/60 text-[11px] sm:text-xs text-slate-300 font-normal leading-relaxed text-left">
                  {scoreData.comment}
                </div>
              </div>

              {/* 5-Axis Radar Diagram Section */}
              <div className="bg-[#03060c] border border-slate-800/90 rounded-xl p-3.5 sm:p-4 flex flex-col items-center shadow-md">
                {/* Dynamic SVG Radar Graph */}
                <FiveAxisRadarChart
                  size={250}
                  className="my-1"
                  fillColor="rgba(6, 182, 212, 0.22)"
                  strokeColor="#06b6d4"
                  data={[
                    { label: '面色紅潤', value: scoreData.metrics.radiance, color: '#38bdf8' },
                    { label: '眼神聚焦', value: scoreData.metrics.sparkle, color: '#22d3ee' },
                    { label: '嘴角舒展', value: scoreData.metrics.smilePower, color: '#34d399' },
                    { label: '眉心放鬆', value: scoreData.metrics.symmetry, color: '#818cf8' },
                    { label: '神態活力', value: scoreData.metrics.charisma, color: '#10b981' },
                  ]}
                />

                {/* Structured Sub-Metrics Breakdown Grid */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold mb-0.5">面色紅潤</span>
                    <span className="text-sm font-black text-sky-400 font-mono">{scoreData.metrics.radiance}%</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold mb-0.5">眼神聚焦</span>
                    <span className="text-sm font-black text-cyan-400 font-mono">{scoreData.metrics.sparkle}%</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold mb-0.5">嘴角舒展</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">{scoreData.metrics.smilePower}%</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold mb-0.5">眉心放鬆</span>
                    <span className="text-sm font-black text-indigo-400 font-mono">{scoreData.metrics.symmetry}%</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold mb-0.5">神態活力</span>
                    <span className="text-sm font-black text-teal-400 font-mono">{scoreData.metrics.charisma}%</span>
                  </div>
                </div>
              </div>

              {/* Health & Hydration Tip */}
              {(() => {
                const score = scoreData.score;
                let statusLabel = '標準調理';
                let adviceText = '適時深呼吸舒展眉心，飲用 250~300ml 溫水並起立活動 1 分鐘，促進血液循環。';
                
                if (score >= 90) {
                  statusLabel = '神采滿格';
                  adviceText = '目前氣色完美！雙眼有神、神態極具親和活力。建議繼續保持，每 45 分鐘適量補充溫水分，並維持挺拔坐姿以維持水光與專注力。';
                } else if (score >= 80) {
                  statusLabel = '充沛良好';
                  adviceText = '氣色與專注力維持良好。眼部有輕微乾澀兆頭，建議飲水 150ml，並微微向後伸展雙臂放鬆肩頸，讓面部肌肉更放鬆。';
                } else if (score >= 60) {
                  statusLabel = '疲勞警戒';
                  adviceText = '偵測到眼皮略顯沉重或眉宇間帶有些許緊繃。請立刻飲用 250~300ml 溫水，配合深呼吸 3 次，有助於舒緩壓力並活化面部氣色。';
                } else {
                  statusLabel = '極度黯淡';
                  adviceText = '神采指數極低，大腦缺氧、氣色乾枯。強烈督促您立刻起立離座走動，大口喝水，並進行 10 秒閉眼光學保濕，迅速補給顏值血條！';
                }

                return (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-400/50 text-cyan-100 flex items-start sm:items-center gap-2.5 shadow-md font-mono text-xs">
                    <Droplets className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <span className="font-bold text-cyan-300 mr-1.5">補水與氣色指引:</span>
                      <span>{adviceText}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
