import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowRight, Plus, Minus } from 'lucide-react';
import { GuardianSettings } from '../types';
import { soundSynth } from '../utils/audioSynth';

interface InitialOnboardingModalProps {
  isOpen: boolean;
  onComplete: (settings: GuardianSettings) => void;
  defaultSettings?: GuardianSettings;
}

export const InitialOnboardingModal: React.FC<InitialOnboardingModalProps> = ({
  isOpen,
  onComplete,
  defaultSettings,
}) => {
  const [baseAge, setBaseAge] = useState<string>(String(defaultSettings?.baseAge ?? 25));
  const [offWorkTime, setOffWorkTime] = useState<string>(defaultSettings?.offWorkTime ?? '17:30');

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      const origTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = origOverflow;
        document.body.style.touchAction = origTouchAction;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAgeChange = (val: string) => {
    // Only allow digits or empty string while typing
    if (val === '' || /^\d+$/.test(val)) {
      setBaseAge(val);
    }
  };

  const handleAgeBlur = () => {
    const num = parseInt(baseAge, 10);
    if (isNaN(num) || num < 18) {
      setBaseAge('18');
    } else if (num > 99) {
      setBaseAge('99');
    }
  };

  const adjustAge = (delta: number) => {
    const current = parseInt(baseAge, 10) || 25;
    const next = Math.max(18, Math.min(99, current + delta));
    setBaseAge(String(next));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      soundSynth.playRewardJingle();
    } catch {}

    const parsedAge = parseInt(baseAge, 10);
    const validAge = isNaN(parsedAge) ? 25 : Math.max(18, Math.min(99, parsedAge));
    const validTime = offWorkTime || '17:30';

    const configuredSettings: GuardianSettings = {
      baseAge: validAge,
      offWorkTime: validTime,
      sedentaryLimitMinutes: defaultSettings?.sedentaryLimitMinutes ?? 45,
      hydrationIntervalMinutes: defaultSettings?.hydrationIntervalMinutes ?? 60,
      soundEnabled: defaultSettings?.soundEnabled ?? true,
      desktopNotificationsEnabled: defaultSettings?.desktopNotificationsEnabled ?? true,
      voiceAlertsEnabled: defaultSettings?.voiceAlertsEnabled ?? true,
    };

    onComplete(configuredSettings);
  };

  const currentAgeNum = parseInt(baseAge, 10) || 25;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-mono">
      {/* Streamlined Box */}
      <div className="relative w-full max-w-sm bg-[#080d17] border border-cyan-500/80 rounded-md p-4 sm:p-5 shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col gap-3.5 cctv-brackets">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#06b6d4]" />
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              [INITIAL_CONFIG]
            </h2>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          {/* 1. Base Age */}
          <div className="bg-[#040710] p-2.5 rounded border border-slate-800/90 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-bold text-slate-300 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>生理年齡 (歲)</span>
              </label>

              {/* Number stepper container */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustAge(-1)}
                  className="w-6 h-6 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition active:scale-95"
                  title="減少1歲"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={baseAge}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  onBlur={handleAgeBlur}
                  className="w-14 bg-black border border-slate-700 focus:border-cyan-400 rounded px-1.5 py-0.5 text-center text-cyan-300 font-bold font-mono focus:outline-none text-xs"
                  placeholder="25"
                  required
                />
                <button
                  type="button"
                  onClick={() => adjustAge(1)}
                  className="w-6 h-6 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition active:scale-95"
                  title="增加1歲"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick Age Presets */}
            <div className="flex items-center gap-1">
              {[18, 25, 28, 30, 35].map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setBaseAge(String(age))}
                  className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer text-center ${
                    currentAgeNum === age && baseAge !== ''
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                      : 'bg-black/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Target Off-Work Time */}
          <div className="bg-[#040710] p-2.5 rounded border border-slate-800/90 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-bold text-slate-300 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>下班時間</span>
              </label>
              <input
                type="time"
                value={offWorkTime}
                onChange={(e) => setOffWorkTime(e.target.value)}
                className="[color-scheme:dark] w-28 bg-black border border-slate-700 focus:border-cyan-400 rounded px-2 py-0.5 text-center text-cyan-300 font-bold font-mono focus:outline-none text-xs cursor-pointer"
                required
              />
            </div>

            {/* Quick Time Presets */}
            <div className="flex items-center gap-1">
              {['17:30', '18:00', '18:30', '19:00'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOffWorkTime(t)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer text-center ${
                    offWorkTime === t
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                      : 'bg-black/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className="w-full mt-1 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <span>進入系統 ENTER</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
