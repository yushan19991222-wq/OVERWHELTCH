import React, { useState } from 'react';
import { Settings, X, Volume2, VolumeX, Clock, Calendar, Armchair } from 'lucide-react';
import { GuardianSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GuardianSettings;
  onSave: (newSettings: GuardianSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [baseAge, setBaseAge] = useState(settings.baseAge);
  const [offWorkTime, setOffWorkTime] = useState(settings.offWorkTime);
  const [sedentaryLimitMinutes, setSedentaryLimitMinutes] = useState(
    settings.sedentaryLimitMinutes
  );
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      baseAge: Number(baseAge) || 25,
      offWorkTime: offWorkTime || '18:30',
      sedentaryLimitMinutes: Number(sedentaryLimitMinutes) || 45,
      soundEnabled,
    });
    onClose();
  };

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700/80 max-w-md w-full p-6 rounded-3xl shadow-2xl relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-800 rounded-xl text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-100">守護者參數設定</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Base Age */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-300 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>生理基本年齡 (歲)</span>
            </label>
            <input
              type="number"
              min="18"
              max="99"
              value={baseAge}
              onChange={(e) => setBaseAge(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-400 transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              身體年齡將以此基準加上耗損值：原齡 + (100 - 目前點數) * 0.8
            </p>
          </div>

          {/* Off Work Time */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-300 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>表定下班時間 (自動開啟加班奪命警報)</span>
            </label>
            <input
              type="time"
              value={offWorkTime}
              onChange={(e) => setOffWorkTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-400 transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              超過此時間且人臉仍在座位，自動觸發生命力流失特效與扣分
            </p>
          </div>

          {/* Sedentary Limit */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-300 mb-1.5">
              <Armchair className="w-3.5 h-3.5 text-amber-400" />
              <span>連續久坐警戒門檻 (分鐘)</span>
            </label>
            <input
              type="number"
              min="1"
              max="180"
              value={sedentaryLimitMinutes}
              onChange={(e) => setSedentaryLimitMinutes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-400 transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              預設 45 分鐘，達到時觸發迷因貓全螢幕鎖定畫面
            </p>
          </div>

          {/* Sound Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200">音效提示 (Web Audio)</div>
              <div className="text-[11px] text-slate-500">打哈欠警報、摸魚獎勵、警示音效</div>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-all ${
                soundEnabled
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
          >
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
};
