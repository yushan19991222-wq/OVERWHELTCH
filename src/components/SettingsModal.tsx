import React, { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Clock, Calendar, Armchair, Bell, BellOff, MessageSquare, AppWindow, X } from 'lucide-react';
import { GuardianSettings } from '../types';
import { requestNotificationPermission, isNotificationSupported } from '../utils/crossTabAlert';

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
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(
    settings.desktopNotificationsEnabled ?? true
  );
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState(
    settings.voiceAlertsEnabled ?? true
  );

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

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      baseAge: Number(baseAge) || 25,
      offWorkTime: offWorkTime || '18:30',
      sedentaryLimitMinutes: Number(sedentaryLimitMinutes) || 45,
      soundEnabled,
      desktopNotificationsEnabled,
      voiceAlertsEnabled,
    });
    onClose();
  };

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-mono"
    >
      <div className="bg-[#0b101b] border border-slate-700 max-w-md w-full p-5 rounded-md shadow-2xl relative cctv-brackets">
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
            type="button"
            onClick={onClose}
            className="p-1 rounded-md bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center"
            title="關閉"
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
              className="w-full bg-[#06090f] border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-400 transition text-xs"
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
              className="w-full bg-[#06090f] border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-400 transition text-xs"
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
              className="w-full bg-[#06090f] border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-400 transition text-xs"
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

          {/* Desktop Notifications Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200">OS_NOTIFICATION: DESKTOP_ALERTS</div>
              <div className="text-[10px] text-slate-500">切換其他分頁或桌面程式時，跳出常駐阻擋通知</div>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!desktopNotificationsEnabled && isNotificationSupported()) {
                  const perm = await requestNotificationPermission();
                  if (perm === 'granted') {
                    setDesktopNotificationsEnabled(true);
                  } else {
                    setDesktopNotificationsEnabled(false);
                  }
                } else {
                  setDesktopNotificationsEnabled(!desktopNotificationsEnabled);
                }
              }}
              className={`p-2 rounded-md border transition-all cursor-pointer ${
                desktopNotificationsEnabled
                  ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {desktopNotificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
          </div>

          {/* Voice Broadcast Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200">AI_VOICE_TTS: SPEECH_BROADCAST</div>
              <div className="text-[10px] text-slate-500">超時久坐與哈欠抓包時，發出語音播報中斷</div>
            </div>
            <button
              type="button"
              onClick={() => setVoiceAlertsEnabled(!voiceAlertsEnabled)}
              className={`p-2 rounded-md border transition-all cursor-pointer ${
                voiceAlertsEnabled
                  ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {voiceAlertsEnabled ? <MessageSquare className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs border border-slate-750 transition cursor-pointer"
          >
            CANCEL (取消)
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition transform active:scale-95 border border-cyan-400/80 shadow-[0_0_8px_rgba(56,189,248,0.25)] cursor-pointer"
          >
            SAVE_CONFIG (儲存設定)
          </button>
        </div>
      </div>
    </div>
  );
};
