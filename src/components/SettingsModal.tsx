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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-mono"
    >
      <div className="bg-[#0b101b] border border-slate-700 max-w-md w-full p-5 rounded-xl shadow-2xl relative">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-900 border border-slate-700 rounded text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 tracking-wider uppercase">
              [SYS_CONFIG // CALIBRATION]
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Base Age */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>PARAM: BASE_AGE (生理基礎年齡)</span>
            </label>
            <input
              type="number"
              min="18"
              max="99"
              value={baseAge}
              onChange={(e) => setBaseAge(Number(e.target.value))}
              className="w-full bg-[#06090f] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-400 transition text-xs"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              計算公式: BASE_AGE + (100 - CURRENT_SCORE) * 0.8
            </p>
          </div>

          {/* Off Work Time */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>PARAM: SHIFT_END (表定下班時間)</span>
            </label>
            <input
              type="time"
              value={offWorkTime}
              onChange={(e) => setOffWorkTime(e.target.value)}
              className="w-full bg-[#06090f] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-400 transition text-xs"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              超過此時間且人臉在位，觸發 OVERTIME_DRAIN 扣分程序
            </p>
          </div>

          {/* Sedentary Limit */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
              <Armchair className="w-3.5 h-3.5 text-amber-400" />
              <span>PARAM: SEDENTARY_LIMIT (久坐上限/分鐘)</span>
            </label>
            <input
              type="number"
              min="1"
              max="180"
              value={sedentaryLimitMinutes}
              onChange={(e) => setSedentaryLimitMinutes(Number(e.target.value))}
              className="w-full bg-[#06090f] border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-400 transition text-xs"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              連續久坐達標即啟動全螢幕離座鎖定
            </p>
          </div>

          {/* Sound Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200">WEB_AUDIO_SYNTH: SOUND_FEEDBACK</div>
              <div className="text-[10px] text-slate-500">哈欠音效、摸魚獎勵、加班倒數警報</div>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs border border-slate-700/80 transition"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition transform active:scale-95 border border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          >
            SAVE_CONFIG
          </button>
        </div>
      </div>
    </div>
  );
};
