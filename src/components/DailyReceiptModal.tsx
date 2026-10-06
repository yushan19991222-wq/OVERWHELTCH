import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Download, Share2, Check, Sparkles, Trophy, X, Terminal, Heart, Play, Briefcase } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailySummaryStats, HealthEvent } from '../types';
import { soundSynth } from '../utils/audioSynth';

interface DailyReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DailySummaryStats;
  events: HealthEvent[];
  isClockedOut?: boolean;
  onClockInAgain?: () => void;
}

export const DailyReceiptModal: React.FC<DailyReceiptModalProps> = ({
  isOpen,
  onClose,
  stats,
  events,
  isClockedOut,
  onClockInAgain,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const [scanMessage, setIsScanMessage] = useState('');
  const [isBarcodeHovered, setIsBarcodeHovered] = useState(false);

  // Stable session ID generated once per modal opening session, preventing continuous re-render flickering
  const sessionId = useMemo(() => {
    if (!isOpen) return '0x4F1A_OHG';
    const hex = Math.floor(0x1000 + Math.random() * 0xefff).toString(16).toUpperCase();
    return `0x${hex}_OHG`;
  }, [isOpen]);

  // Close modal on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll and interaction when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  // Trigger print buzz and confetti on open
  useEffect(() => {
    if (!isOpen) return;

    // Fire mechanical printer sound
    try {
      soundSynth.playPrintBuzz();
    } catch {}

    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {}

    // Reset barcode interaction states
    setIsScanned(false);
    setIsScanMessage('');
  }, [isOpen]);

  // Hidden high-res canvas rendering for download
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Reset drawing state defaults to prevent persistent canvas context translation/alignment carrying over
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#fbfbf7');
    bgGrad.addColorStop(1, '#f1f0e8');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Header Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('========================================', 40, 40);
    ctx.fillText('      OVERWHELTCH MONITOR CLINIC        ', 40, 60);
    ctx.fillText('     SHIFT END REPORT // SHIFT_CLOSE     ', 40, 80);
    ctx.fillText('========================================', 40, 100);

    ctx.fillStyle = '#475569';
    ctx.font = '12px monospace';
    ctx.fillText(`DATE: ${stats.date}`, 40, 130);
    ctx.fillText(`CASHIER: LOCAL_EDGE_INFERENCE_v2`, 40, 150);
    ctx.fillText(`SESSION: OVW_SHIFT_${sessionId}`, 40, 170);

    ctx.fillText('----------------------------------------', 40, 200);

    // Items list
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px monospace';

    const items = [
      { name: '🥱 YAWN_PENALTY', qty: `x${stats.yawnsCaught}`, pts: `-${stats.yawnsCaught * 5} PTS` },
      { name: '😠 FROWN_PENALTY', qty: `x${stats.frownsCaught}`, pts: `-${stats.frownsCaught * 3} PTS` },
      { name: '🪑 SEDENTARY_LOCK', qty: `x${stats.sedentaryLocksCount}`, pts: `-${stats.sedentaryLocksCount * 10} PTS` },
      { name: '🏆 SLACK_RECOVERY', qty: `${stats.slackMinutesEarned}m`, pts: `+${Math.min(30, stats.slackMinutesEarned * 2)} PTS` },
      { name: '🩸 OVERTIME_DRAIN', qty: `${stats.overtimeMinutes}m`, pts: `-${Math.max(0, Math.floor(stats.overtimeMinutes / 10) * 15)} PTS` },
    ];

    let currentY = 225;
    items.forEach((it) => {
      ctx.fillText(it.name.padEnd(20, '.'), 40, currentY);
      ctx.fillText(it.qty.padEnd(10, ' '), 240, currentY);
      ctx.fillText(it.pts.padStart(10, ' '), 380, currentY);
      currentY += 25;
    });

    ctx.fillStyle = '#475569';
    ctx.font = '12px monospace';
    ctx.fillText('----------------------------------------', 40, currentY);
    currentY += 25;

    // Totals
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`HEALTH RETAINED: ${stats.finalHealthScore} / 100 PTS`, 40, currentY);
    currentY += 25;
    ctx.fillText(`PHYSIOLOGICAL AGE: ${stats.finalBodyAge} YRS`, 40, currentY);
    currentY += 20;
    ctx.font = '12px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(`(ACTUAL AGE: ${stats.baseAge} YRS / DIFF: ${stats.finalBodyAge >= stats.baseAge ? '+' : ''}${(stats.finalBodyAge - stats.baseAge).toFixed(1)} YRS)`, 40, currentY);
    currentY += 30;

    ctx.fillText('----------------------------------------', 40, currentY);
    currentY += 25;

    // Appraisal
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`STATUS: [${stats.title}]`, 40, currentY);
    currentY += 20;
    ctx.fillStyle = '#334155';
    ctx.font = 'italic 11px sans-serif';

    const quoteStr = `「${stats.quote}」`;
    const maxQuoteWidth = w - 100;
    if (ctx.measureText(quoteStr).width > maxQuoteWidth) {
      let mid = Math.floor(quoteStr.length / 2);
      ctx.fillText(quoteStr.slice(0, mid), 40, currentY);
      ctx.fillText(quoteStr.slice(mid), 40, currentY + 18);
      currentY += 38;
    } else {
      ctx.fillText(quoteStr, 40, currentY);
      currentY += 24;
    }

    ctx.fillStyle = '#475569';
    ctx.font = '12px monospace';
    ctx.fillText('----------------------------------------', 40, currentY);
    currentY += 30;

    // Simulated Barcode in PNG
    ctx.fillStyle = '#0f172a';
    for (let x = 60; x < w - 60; x += 6) {
      const barW = (x % 4 === 0) ? 3 : (x % 3 === 0) ? 1.5 : 1;
      ctx.fillRect(x, currentY, barW, 40);
    }
    currentY += 52;

    ctx.textAlign = 'center';
    ctx.font = '10px monospace';
    ctx.fillText('* OHG-SECURE-HEALTH-VERIFIED-HASH-v2 *', w / 2, currentY);

    // Ink Stamp
    ctx.save();
    ctx.translate(w - 120, h - 160);
    ctx.rotate(-0.15);
    ctx.strokeStyle = stats.finalHealthScore >= 70 ? '#059669' : '#dc2626';
    ctx.lineWidth = 3;
    // Draw roundRect manually
    const rX = -60, rY = -25, rW = 120, rH = 50, rRad = 8;
    ctx.beginPath();
    ctx.moveTo(rX + rRad, rY);
    ctx.lineTo(rX + rW - rRad, rY);
    ctx.quadraticCurveTo(rX + rW, rY, rX + rW, rY + rRad);
    ctx.lineTo(rX + rW, rY + rH - rRad);
    ctx.quadraticCurveTo(rX + rW, rY + rH, rX + rW - rRad, rY + rH);
    ctx.lineTo(rX + rRad, rY + rH);
    ctx.quadraticCurveTo(rX, rY + rH, rX, rY + rH - rRad);
    ctx.lineTo(rX, rY + rRad);
    ctx.quadraticCurveTo(rX, rY, rX + rRad, rY);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = stats.finalHealthScore >= 70 ? '#059669' : '#dc2626';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(stats.finalHealthScore >= 70 ? '打卡合格' : '需補元氣', 0, 6);
    ctx.restore();

  }, [isOpen, stats, events]);

  if (!isOpen) return null;

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundSynth.playSnapSound();
    const link = document.createElement('a');
    link.download = `OVERWHELTCH_HealthReceipt_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const copyShareText = () => {
    const text = `🛡️【OVERWHELTCH | WATCH BEFORE YOU OVERWHELM 今日打卡結算】\n👤 基礎年齡: ${stats.baseAge}歲 ➡️ 預估生理年齡: ${stats.finalBodyAge}歲\n💖 健康存摺結餘: ${stats.finalHealthScore}/100 點\n🎖️ 評級: ${stats.title}\n💬 「${stats.quote}」\n#OVERWHELTCH #WatchBeforeYouOverwhelm #辦公室身心健康監視器`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // Barcode interactions
  const handleBarcodeHover = () => {
    if (!isBarcodeHovered) {
      try {
        soundSynth.playRadarLockBeep(1200);
      } catch {}
      setIsBarcodeHovered(true);
    }
  };

  const handleBarcodeClick = () => {
    try {
      soundSynth.playCoinShower();
    } catch {}
    setIsScanned(true);
    const messages = [
      'SCAN_OK // 認證結果：合格勞工 🟢',
      'SCAN_OK // 判定：今日尚有殘存元氣 ⚡',
      'SCAN_OK // 警報：薪水小偷指數：極高 💸',
      'SCAN_OK // 警告：老闆的下一台跑車已蓄勢待發 🏎️',
    ];
    setIsScanMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  const isHealthy = stats.finalHealthScore >= 70;

  return (
    <div
      id="daily-receipt-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-300 font-mono"
    >
      {/* Target Canvas Hidden for rendering download */}
      <canvas
        ref={canvasRef}
        width={480}
        height={680}
        className="hidden"
      />

      <div className="bg-[#0b101b] border border-slate-800 max-w-md w-full p-4 sm:p-5 rounded-xl shadow-2xl relative flex flex-col items-center my-auto max-h-[95vh] overflow-y-auto scrollbar-thin">
        
        {/* Modal Header */}
        <div className="w-full flex justify-between items-center mb-3 pb-2 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              [ACTUARY_REPORT]
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PRINTABLE SIMULATED THERMAL RECEIPT SLIDING OUT */}
        <div className="w-full relative select-none max-h-[64vh] overflow-y-auto overflow-x-hidden pr-0.5 rounded-lg border border-slate-800/80 mb-4 bg-black/40 scrollbar-thin">
          
          {/* Virtual Printer Slot Header */}
          <div className="sticky top-0 z-20 w-full h-4 bg-gradient-to-b from-[#1c243a] to-[#0b101b] border-b border-slate-750 flex items-center justify-center">
            <div className="w-32 h-1 bg-black/60 rounded-full border border-slate-900 shadow-inner" />
          </div>

          {/* Thermal Receipt Paper Body */}
          <div className="w-full bg-[#fbfbf7] text-zinc-900 shadow-2xl relative ow-receipt-print overflow-hidden flex flex-col pt-3 pb-5">
            
            {/* Serrated Cut at Top */}
            <div className="absolute top-0 inset-x-0 h-2 flex pointer-events-none">
              <svg className="w-full h-2 text-[#0b101b] fill-current" viewBox="0 0 100 10" preserveAspectRatio="none">
                <polygon points="0,10 5,0 10,10 15,0 20,10 25,0 30,10 35,0 40,10 45,0 50,10 55,0 60,10 65,0 70,10 75,0 80,10 85,0 90,10 95,0 100,10" />
              </svg>
            </div>

            {/* Receipt Content */}
            <div className="px-5 sm:px-6 pt-3 text-[11px] font-mono leading-relaxed">
              <div className="text-center font-bold text-xs tracking-wider mb-1">
                =================================
              </div>
              <div className="text-center font-black text-sm tracking-wider text-black">
                OVERWHELTCH BIOSURVEILLANCE OS
              </div>
              <div className="text-center font-bold text-[10px] tracking-widest text-zinc-500 uppercase mt-0.5">
                SHIFT END REPORT // SHIFT_CLOSE
              </div>
              <div className="text-center font-bold text-xs tracking-wider mt-1">
                =================================
              </div>

              {/* Timestamp Dossier */}
              <div className="mt-3.5 space-y-0.5 text-zinc-600 font-bold border-b border-dashed border-zinc-300 pb-3">
                <div className="flex justify-between">
                  <span>DATE/TIME:</span>
                  <span className="text-zinc-900">{stats.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span className="text-zinc-900">EDGE_AI_SURVEILLANCE_v2</span>
                </div>
                <div className="flex justify-between">
                  <span>SESSION_ID:</span>
                  <span className="text-zinc-900">{sessionId}</span>
                </div>
              </div>

              {/* Detailed Item List */}
              <div className="mt-4 space-y-3">
                <div className="font-black text-zinc-900 text-[10px] tracking-wider uppercase mb-1">
                  [QUANTIFIED EVENTS]
                </div>
                
                {/* Yawn Penalty */}
                <div className="flex justify-between items-center group/item hover:bg-zinc-200/50 p-1 rounded transition">
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900">🥱 YAWN_PENALTY</span>
                    <span className="text-[10px] text-zinc-500 ml-1.5 font-bold">x{stats.yawnsCaught}</span>
                  </div>
                  <span className="font-black text-red-600 shrink-0 font-mono">
                    -{stats.yawnsCaught * 5} PTS
                  </span>
                </div>

                {/* Frown Penalty */}
                <div className="flex justify-between items-center group/item hover:bg-zinc-200/50 p-1 rounded transition">
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900">😠 FROWN_PENALTY</span>
                    <span className="text-[10px] text-zinc-500 ml-1.5 font-bold">x{stats.frownsCaught}</span>
                  </div>
                  <span className="font-black text-red-600 shrink-0 font-mono">
                    -{stats.frownsCaught * 3} PTS
                  </span>
                </div>

                {/* Sedentary Penalty */}
                <div className="flex justify-between items-center group/item hover:bg-zinc-200/50 p-1 rounded transition">
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900">🪑 SEDENTARY_LOCK</span>
                    <span className="text-[10px] text-zinc-500 ml-1.5 font-bold">x{stats.sedentaryLocksCount}</span>
                  </div>
                  <span className="font-black text-red-600 shrink-0 font-mono">
                    -{stats.sedentaryLocksCount * 10} PTS
                  </span>
                </div>

                {/* Slacking Reward */}
                <div className="flex justify-between items-center group/item hover:bg-zinc-200/50 p-1 rounded transition">
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900">🏆 SLACK_RECOVERY</span>
                    <span className="text-[10px] text-zinc-500 ml-1.5 font-bold">{stats.slackMinutesEarned}m</span>
                  </div>
                  <span className="font-black text-emerald-600 shrink-0 font-mono">
                    +{Math.min(30, stats.slackMinutesEarned * 2)} PTS
                  </span>
                </div>

                {/* Overtime Penalty */}
                <div className="flex justify-between items-center group/item hover:bg-zinc-200/50 p-1 rounded transition">
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900">🩸 OVERTIME_DRAIN</span>
                    <span className="text-[10px] text-zinc-500 ml-1.5 font-bold">{stats.overtimeMinutes}m</span>
                  </div>
                  <span className="font-black text-red-600 shrink-0 font-mono">
                    -{Math.max(0, Math.floor(stats.overtimeMinutes / 10) * 15)} PTS
                  </span>
                </div>
              </div>

              {/* Invoice Totals Breakdown */}
              <div className="mt-4 pt-3.5 border-t border-dashed border-zinc-300 space-y-1.5">
                <div className="flex justify-between font-black text-sm text-black">
                  <span>HEALTH RETAINED:</span>
                  <span className={isHealthy ? 'text-emerald-700' : 'text-red-600'}>
                    {stats.finalHealthScore} / 100 PTS
                  </span>
                </div>
                <div className="flex justify-between font-black text-xs text-black">
                  <span>PHYSIOLOGICAL AGE:</span>
                  <span className="text-cyan-700">{stats.finalBodyAge} YRS</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                  <span>(ACTUAL AGE: {stats.baseAge} YRS // DEVIATION:):</span>
                  <span className={stats.finalBodyAge >= stats.baseAge ? 'text-red-600' : 'text-emerald-700'}>
                    {stats.finalBodyAge >= stats.baseAge ? '+' : ''}{(stats.finalBodyAge - stats.baseAge).toFixed(1)} YRS
                  </span>
                </div>
              </div>

              {/* Appraisal Callout */}
              <div className="mt-4 pt-3 border-t border-dashed border-zinc-300">
                <div className="font-black text-zinc-900 text-[10px] tracking-wider uppercase mb-1">
                  [EVALUATION_REPORT]
                </div>
                <div className="font-bold text-zinc-800 text-[11px] leading-relaxed">
                  評級: <span className="underline underline-offset-2 decoration-zinc-400 font-black">{stats.title}</span>
                </div>
                <div className="text-[10.5px] italic text-zinc-600 mt-1 font-serif leading-relaxed">
                  「{stats.quote}」
                </div>
              </div>

              {/* Barcode Interlock (Hover sweeps laser, click triggers Easter-egg) */}
              <div className="mt-6 pt-3.5 border-t border-dashed border-zinc-300 relative">
                
                {/* Visual Official Stamp overlay */}
                <div className={`absolute right-4 top-2 select-none pointer-events-none transform rotate-[-12deg] z-10 border-2 px-3 py-1 rounded font-black text-[11px] tracking-widest uppercase opacity-85 ${
                  isHealthy ? 'border-emerald-600 text-emerald-700' : 'border-red-500 text-red-600'
                }`}>
                  {isHealthy ? 'PASS / 合格' : 'RECHARGE / 需補元氣'}
                </div>

                <div className="font-black text-[8px] text-zinc-400 tracking-widest uppercase text-center mb-2">
                  * TOUCH BARCODE TO SCAN VERIFICATION *
                </div>

                {/* Simulated Barcode block */}
                <div 
                  onMouseEnter={handleBarcodeHover}
                  onMouseLeave={() => setIsBarcodeHovered(false)}
                  onClick={handleBarcodeClick}
                  className="flex justify-center gap-[1px] h-10 w-full overflow-hidden opacity-90 select-none cursor-pointer relative group/barcode bg-white p-1 rounded border border-zinc-200 shadow-sm"
                >
                  {/* Sweep Laser line effect on hover */}
                  {isBarcodeHovered && (
                    <div className="absolute inset-x-0 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.85)] animate-bounce top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}

                  {/* Generate varying barcode line columns */}
                  {[...Array(44)].map((_, idx) => {
                    const widthClass = (idx % 5 === 0) ? 'w-[4px]' : (idx % 3 === 0) ? 'w-[2px]' : 'w-[1px]';
                    return (
                      <div 
                        key={idx} 
                        className={`h-full bg-zinc-900 shrink-0 ${widthClass}`} 
                      />
                    );
                  })}
                </div>

                {/* Interactive Scan Response Box */}
                {isScanned ? (
                  <div className="mt-2.5 p-2 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-center text-zinc-800 animate-pulse font-mono tracking-wide">
                    {scanMessage}
                  </div>
                ) : (
                  <div className="text-center text-[9px] text-zinc-400 mt-1.5 font-bold tracking-wider">
                    * CODE_SECURE_VERIFIED_v2 *
                  </div>
                )}
              </div>
            </div>

            {/* Serrated Cut at Bottom */}
            <div className="absolute bottom-0 inset-x-0 h-2 flex pointer-events-none">
              <svg className="w-full h-2 text-[#0b101b] fill-current rotate-180" viewBox="0 0 100 10" preserveAspectRatio="none">
                <polygon points="0,10 5,0 10,10 15,0 20,10 25,0 30,10 35,0 40,10 45,0 50,10 55,0 60,10 65,0 70,10 75,0 80,10 85,0 90,10 95,0 100,10" />
              </svg>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-2.5 shrink-0 font-mono">
          <button
            onClick={downloadImage}
            className="py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 transform active:scale-95 shadow-[0_0_8px_rgba(56,189,248,0.25)] border border-cyan-400/80 cursor-pointer"
            title="Download PNG image of receipt"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>EXPORT_PNG</span>
          </button>

          <button
            onClick={copyShareText}
            className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 font-bold text-xs border border-slate-750 transition flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
            title="Copy copy text of shift report to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-cyan-400 shrink-0" /> : <Share2 className="w-4 h-4 shrink-0" />}
            <span>{copied ? 'COPIED!' : 'COPY_TEXT'}</span>
          </button>
        </div>
      </div>

      {/* Styled Print Animation Rules */}
      <style>{`
        @keyframes owReceiptPrint {
          0% {
            max-height: 0px;
            opacity: 0.1;
            transform: translateY(-50px) scaleY(0.1);
          }
          100% {
            max-height: 1200px;
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }
        .ow-receipt-print {
          animation: owReceiptPrint 1.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          transform-origin: top;
        }
      `}</style>
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
