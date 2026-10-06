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
      className="fixed inset-0 z-50 bg-[#06090e]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-300 font-mono"
    >
      <div className="max-w-md w-full flex flex-col items-center bg-[#0b101b] border-2 border-rose-600/80 p-6 rounded-xl shadow-[0_0_50px_rgba(225,29,72,0.4)]">
        {/* Technical Header */}
        <div className="w-full flex items-center justify-between pb-2 mb-4 border-b border-rose-900/60 text-[10px] text-rose-400 uppercase tracking-widest font-bold">
          <span>[HAZARD_INTERLOCK_V2]</span>
          <span>SEDENTARY_LIMIT_BREACH</span>
        </div>

        {/* Meme Cat Box with Industrial Frame */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 mb-4 rounded-lg overflow-hidden border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.5)] group hardware-reticle">
          <img
            src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80"
            alt="Meme Judge Cat"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
            <span className="text-rose-400 font-black tracking-widest text-base animate-pulse">
              屁股黏在椅子上了？
            </span>
            <span className="text-[11px] text-slate-300 mt-0.5">
              連貓咪都看不下去了，快去喝水！
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-2 text-rose-400">
          <AlertOctagon className="w-6 h-6 animate-bounce" />
          <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase">
            [SEDENTARY_LOCKOUT]
          </h1>
        </div>

        <p className="text-slate-300 text-xs mb-4 leading-relaxed max-w-sm">
          已連續在位超過極限！椎間盤與下半身循環發出求救訊號。
          <br />
          <span className="text-rose-300 font-bold">
            【解鎖條件】：請起立離開座位，使光學鏡頭無法辨識人臉！
          </span>
        </p>

        {/* Real-time Presence Sensor Status */}
        <div
          className={`w-full p-3.5 rounded-lg border mb-4 flex items-center justify-between transition-all ${
            isFacePresent
              ? 'bg-rose-950/80 border-rose-600/90 text-rose-300'
              : 'bg-emerald-950/80 border-emerald-500/90 text-emerald-300 animate-pulse'
          }`}
        >
          <div className="flex items-center gap-2 text-left">
            {isFacePresent ? (
              <>
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold font-mono">SENSOR: FACE_DETECTED</div>
                  <div className="text-[10px] text-rose-400">請完全離位走動、喝水伸展</div>
                </div>
              </>
            ) : (
              <>
                <UserX className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold font-mono">SENSOR: CLEAR (USER_ABSENT)</div>
                  <div className="text-[10px] text-emerald-400">離座解鎖倒數進行中...</div>
                </div>
              </>
            )}
          </div>

          <div className="font-mono text-2xl font-black tracking-wider ml-3 text-right">
            {countdownStr}
          </div>
        </div>

        {/* Emergency Override Button */}
        <button
          onClick={onEmergencyOverride}
          className="text-[11px] text-slate-500 hover:text-slate-300 font-mono underline transition py-1"
        >
          [MANUAL_OVERRIDE] 我正在升降桌站立辦公 (強制解除)
        </button>
      </div>
    </div>
  );
};
