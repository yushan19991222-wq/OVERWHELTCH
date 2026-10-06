import React, { useRef, useEffect, useState } from 'react';
import { Download, Share2, Check, X, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailySummaryStats, HealthEvent } from '../types';
import { soundSynth } from '../utils/audioSynth';

interface DailyReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DailySummaryStats;
  events: HealthEvent[];
}

export const DailyReceiptModal: React.FC<DailyReceiptModalProps> = ({
  isOpen,
  onClose,
  stats,
  events,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // ignore in environments without full window support
    }

    // Render Canvas Receipt
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Header Title
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('/// OFFICE HEALTH GUARDIAN RECEIPT ///', 40, 50);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 30px sans-serif';
    ctx.fillText('今日下班・生理年齡結算收據', 40, 92);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px monospace';
    ctx.fillText(`結算日期：${stats.date} | 守護驗證：100% 本機端 AI 存證`, 40, 122);

    // Dashed Divider
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(40, 142);
    ctx.lineTo(w - 40, 142);
    ctx.stroke();
    ctx.setLineDash([]);

    // Two main Metric Cards: Health Score & Body Age
    // Box 1: Health Score
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    roundRect(ctx, 40, 165, 245, 120, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('今日健康存摺結餘', 60, 195);

    ctx.fillStyle = stats.finalHealthScore >= 70 ? '#34d399' : '#f43f5e';
    ctx.font = '900 44px sans-serif';
    ctx.fillText(`${stats.finalHealthScore}`, 60, 250);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('PT / 100', 145, 250);

    // Box 2: Body Age
    roundRect(ctx, 315, 165, 245, 120, 16);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`估算生理年齡 (原齡: ${stats.baseAge}歲)`, 335, 195);

    ctx.fillStyle = '#22d3ee';
    ctx.font = '900 44px sans-serif';
    ctx.fillText(`${stats.finalBodyAge}`, 335, 250);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('歲', 435, 250);

    // Appraisal Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#38bdf8';
    roundRect(ctx, 40, 305, w - 80, 105, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(`社畜評級：${stats.title}`, 60, 342);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px sans-serif';
    ctx.fillText(`「${stats.quote}」`, 60, 378);

    // Key stats breakdown
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('--- 今日違規與加分事件統計 ---', 40, 445);

    const breakdownItems = [
      `🥱 打大哈欠抓包次數：${stats.yawnsCaught} 次 (-${stats.yawnsCaught * 5} 點)`,
      `😠 愁容滿面皺眉次數：${stats.frownsCaught} 次 (-${stats.frownsCaught * 3} 點)`,
      `🪑 連續久坐觸發鎖定：${stats.sedentaryLocksCount} 次 (-${stats.sedentaryLocksCount * 10} 點)`,
      `🏆 摸魚離座獎勵回血：${stats.slackMinutesEarned} 分鐘 (+${Math.min(30, stats.slackMinutesEarned * 2)} 點)`,
      `🩸 超時加班燃燒生命：${stats.overtimeMinutes} 分鐘`,
    ];

    let startY = 475;
    ctx.font = '13px sans-serif';
    breakdownItems.forEach((text) => {
      ctx.fillStyle = text.includes('+') ? '#86efac' : text.includes('-') ? '#fca5a5' : '#cbd5e1';
      ctx.fillText(text, 50, startY);
      startY += 26;
    });

    // Recent Log items
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('--- 最近重要日誌紀錄 ---', 40, startY + 15);
    startY += 40;

    const recentEvents = events.slice(0, 3);
    if (recentEvents.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('今日表現良好，未留下重大懲罰日誌！', 50, startY);
    } else {
      recentEvents.forEach((ev) => {
        ctx.fillStyle = ev.delta < 0 ? '#fda4af' : ev.delta > 0 ? '#86efac' : '#cbd5e1';
        ctx.font = '12px sans-serif';
        const line = `• [${ev.timestamp}] ${ev.message}`;
        ctx.fillText(line.substring(0, 44), 50, startY);
        startY += 24;
      });
    }

    // Official Stamp / Watermark
    ctx.save();
    ctx.translate(w - 140, h - 95);
    ctx.rotate(-0.12);
    ctx.strokeStyle = stats.finalHealthScore >= 70 ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 3;
    roundRect(ctx, -65, -30, 130, 58, 10);
    ctx.stroke();

    ctx.fillStyle = stats.finalHealthScore >= 70 ? '#10b981' : '#f43f5e';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stats.finalHealthScore >= 70 ? '打卡合格' : '需補元氣', 0, 6);
    ctx.restore();

    // Footer
    ctx.fillStyle = '#475569';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('OFFICE HEALTH GUARDIAN • 100% LOCAL CLIENT-SIDE AI PRIVACY VERIFIED', 40, h - 25);
  }, [isOpen, stats, events]);

  if (!isOpen) return null;

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundSynth.playSnapSound();
    const link = document.createElement('a');
    link.download = `OfficeHealth_BodyAge_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const copyShareText = () => {
    const text = `🛡️【Office Health Guardian 今日打卡結算】\n👤 基礎年齡: ${stats.baseAge}歲 ➡️ 預估生理年齡: ${stats.finalBodyAge}歲\n💖 健康存摺結餘: ${stats.finalHealthScore}/100 點\n🎖️ 評級: ${stats.title}\n💬 「${stats.quote}」\n#OfficeHealthGuardian #辦公室健康存摺`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      id="daily-receipt-modal"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300"
    >
      <div className="bg-slate-900 border border-slate-700/80 max-w-md w-full p-5 sm:p-6 rounded-3xl shadow-2xl relative flex flex-col items-center my-auto">
        {/* Modal Header */}
        <div className="w-full flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 font-mono">
              DAILY BODY AGE REPORT
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Canvas */}
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 mb-4 flex justify-center">
          <canvas
            ref={canvasRef}
            width={600}
            height={740}
            className="w-full max-h-[60vh] object-contain rounded-2xl"
          />
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-3">
          <button
            onClick={downloadImage}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>下載收據圖檔</span>
          </button>

          <button
            onClick={copyShareText}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2 transform active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? '已複製到剪貼簿！' : '複製分享文字'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
