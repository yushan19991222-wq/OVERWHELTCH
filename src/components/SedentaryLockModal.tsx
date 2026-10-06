import React from 'react';
import { ShieldAlert, CheckCircle2, UserX, AlertOctagon } from 'lucide-react';

interface SedentaryLockModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  isFacePresent: boolean;
  onEmergencyOverride: () => void;
}

export const SedentaryLockModal: React.FC<SedentaryLockModalProps> = ({
  isOpen,
  remainingSeconds,
  isFacePresent,
  onEmergencyOverride,
}) => {
  if (!isOpen) return null;

  const mins = Math.floor(remainingSeconds / 60);
  const secs = Math.floor(remainingSeconds % 60);
  const countdownStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div
      id="sedentary-lock-modal"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300"
    >
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Meme Cat Box */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mb-6 rounded-3xl overflow-hidden border-4 border-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.6)] group">
          <img
            src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80"
            alt="Meme Judge Cat"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
            <span className="text-rose-400 font-black tracking-widest text-lg animate-pulse">
              屁股黏在椅子上了？
            </span>
            <span className="text-xs text-slate-300 mt-0.5">
              連貓咪都看不下去了，快去喝水！
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-2 text-rose-400">
          <AlertOctagon className="w-8 h-8 animate-bounce" />
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">久坐超時警戒！</h1>
        </div>

        <p className="text-slate-300 text-sm mb-6 leading-relaxed max-w-sm">
          已連續在位超過極限！椎間盤與下半身循環正在發出求救訊號。
          <br />
          <span className="text-rose-300 font-bold">
            【解鎖條件】：請起立離開座位，讓鏡頭完全偵測不到人臉！
          </span>
        </p>

        {/* Real-time Presence Status */}
        <div
          className={`w-full p-4 rounded-2xl border mb-6 flex items-center justify-between transition-all ${
            isFacePresent
              ? 'bg-rose-950/70 border-rose-600/80 text-rose-300'
              : 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300 animate-pulse'
          }`}
        >
          <div className="flex items-center gap-2.5 text-left">
            {isFacePresent ? (
              <>
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-black">鏡頭前仍有人臉！</div>
                  <div className="text-[11px] text-rose-400/90">請離開座位走動、去倒水伸展</div>
                </div>
              </>
            ) : (
              <>
                <UserX className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-black">偵測到已成功離座！</div>
                  <div className="text-[11px] text-emerald-400/90">離位倒數解鎖進行中...</div>
                </div>
              </>
            )}
          </div>

          <div className="font-mono text-2xl sm:text-3xl font-black tracking-wider ml-4">
            {countdownStr}
          </div>
        </div>

        {/* Emergency Override Button */}
        <button
          onClick={onEmergencyOverride}
          className="text-xs text-slate-500 hover:text-slate-300 underline transition py-2"
        >
          [緊急覆蓋] 我正在升降桌站立辦公 (手動解鎖)
        </button>
      </div>
    </div>
  );
};
