import React, { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Clock, Calendar, Armchair, Droplets, Bell, BellOff, MessageSquare, AppWindow, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { GuardianSettings } from '../types';
import { requestNotificationPermission, isNotificationSupported } from '../utils/crossTabAlert';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GuardianSettings;
  onSave: (newSettings: GuardianSettings) => void;
  onResetTodayData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onResetTodayData,
}) => {
  const [baseAge, setBaseAge] = useState(settings.baseAge);
  const [offWorkTime, setOffWorkTime] = useState(settings.offWorkTime);
  const [sedentaryLimitMinutes, setSedentaryLimitMinutes] = useState<number | string>(
    settings.sedentaryLimitMinutes
  );
  const [hydrationIntervalMinutes, setHydrationIntervalMinutes] = useState<number | string>(
    settings.hydrationIntervalMinutes ?? 60
  );
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(
    settings.desktopNotificationsEnabled ?? true
  );
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState(
    settings.voiceAlertsEnabled ?? true
  );
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Sync state whenever modal opens or settings prop changes
  useEffect(() => {
    if (isOpen) {
      setBaseAge(settings.baseAge);
      setOffWorkTime(settings.offWorkTime || '17:30');
      setSedentaryLimitMinutes(settings.sedentaryLimitMinutes);
      setHydrationIntervalMinutes(settings.hydrationIntervalMinutes ?? 60);
      setSoundEnabled(settings.soundEnabled);
      setDesktopNotificationsEnabled(settings.desktopNotificationsEnabled ?? true);
      setVoiceAlertsEnabled(settings.voiceAlertsEnabled ?? true);
      setShowConfirmReset(false);
    }
  }, [isOpen, settings]);

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

  if (!isOpen) return null;

  const isSedentaryInvalid =
    sedentaryLimitMinutes === '' ||
    isNaN(Number(sedentaryLimitMinutes)) ||
    Number(sedentaryLimitMinutes) < 5;

  const isHydrationInvalid =
    hydrationIntervalMinutes === '' ||
    isNaN(Number(hydrationIntervalMinutes)) ||
    Number(hydrationIntervalMinutes) < 5;

  const hasValidationError = isSedentaryInvalid || isHydrationInvalid;

  const handleSave = () => {
    if (hasValidationError) return;

    onSave({
      baseAge: Number(baseAge) || 25,
      offWorkTime: offWorkTime || '17:30',
      sedentaryLimitMinutes: Math.max(5, Number(sedentaryLimitMinutes) || 45),
      hydrationIntervalMinutes: Math.max(5, Number(hydrationIntervalMinutes) || 60),
      soundEnabled,
      desktopNotificationsEnabled,
      voiceAlertsEnabled,
    });
    onClose();
  };

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-mono"
    >
      <div className="bg-[#0b101b] border border-slate-700 max-w-md w-full max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] rounded-md shadow-2xl relative cctv-brackets flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Pinned Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0 bg-[#080d17]/90">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-900 border border-slate-700 rounded text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 tracking-wider uppercase">
              [SYS_CONFIG]
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

        {/* Flexible Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs custom-scrollbar">
          {/* Base Age */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>BASE_AGE (生理基礎年齡)</span>
            </label>
            <input
              type="number"
              min="18"
              max="99"
              value={baseAge}
              onChange={(e) => setBaseAge(Number(e.target.value))}
              className="w-full bg-[#06090f] border border-slate-800 rounded px-3 py-2 text-cyan-300 font-bold font-mono focus:outline-none focus:border-cyan-400 transition text-xs"
            />
          </div>

          {/* Off Work Time */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1.5 font-bold text-slate-300">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>SHIFT_END (表定下班時間)</span>
              </label>
            </div>
            <input
              type="time"
              value={offWorkTime}
              onChange={(e) => setOffWorkTime(e.target.value)}
              className="[color-scheme:dark] w-full bg-[#06090f] border border-slate-800 rounded px-3 py-2 text-cyan-300 font-bold font-mono focus:outline-none focus:border-cyan-400 transition text-xs"
            />
          </div>

          {/* Sedentary Limit */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
              <Armchair className="w-3.5 h-3.5 text-cyan-400" />
              <span>SEDENTARY_LIMIT (久坐上限/分鐘)</span>
            </label>
            <input
              type="number"
              min="5"
              max="180"
              value={sedentaryLimitMinutes}
              onChange={(e) => {
                const val = e.target.value;
                setSedentaryLimitMinutes(val === '' ? ('' as unknown as number) : Number(val));
              }}
              className={`w-full bg-[#06090f] border rounded px-3 py-2 font-bold font-mono focus:outline-none transition text-xs ${
                isSedentaryInvalid
                  ? 'border-rose-500/80 bg-rose-950/20 text-rose-300 focus:border-rose-400'
                  : 'border-slate-800 text-cyan-300 focus:border-cyan-400'
              }`}
            />
            {isSedentaryInvalid && (
              <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                <span>久坐上限最低需設定為 5 分鐘以上</span>
              </p>
            )}
          </div>

          {/* Hydration Interval */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>HYDRATION_INTERVAL (喝水提醒間隔/分鐘)</span>
            </label>
            <input
              type="number"
              min="5"
              max="240"
              value={hydrationIntervalMinutes}
              onChange={(e) => {
                const val = e.target.value;
                setHydrationIntervalMinutes(val === '' ? ('' as unknown as number) : Number(val));
              }}
              className={`w-full bg-[#06090f] border rounded px-3 py-2 font-bold font-mono focus:outline-none transition text-xs ${
                isHydrationInvalid
                  ? 'border-rose-500/80 bg-rose-950/20 text-rose-300 focus:border-rose-400'
                  : 'border-slate-800 text-cyan-300 focus:border-cyan-400'
              }`}
            />
            {isHydrationInvalid && (
              <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                <span>喝水提醒間隔最低需設定為 5 分鐘以上</span>
              </p>
            )}
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
                const nextState = !desktopNotificationsEnabled;
                setDesktopNotificationsEnabled(nextState);
                if (nextState && isNotificationSupported()) {
                  try {
                    await requestNotificationPermission();
                  } catch (err) {
                    console.warn('Failed to request notification permission:', err);
                  }
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

          {/* Reset Today's Data Option (Red Alert Icon Button) */}
          {onResetTodayData && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">RESET_DATA: TODAY_SESSION</div>
                <div className="text-[10px] text-slate-500">清空並重置今日的累積數據與歷史紀錄</div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="p-2 rounded-md bg-rose-950/70 hover:bg-rose-900 border border-rose-500/60 hover:border-rose-400 text-rose-400 hover:text-rose-200 transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                title="一鍵重置今日數據"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Pinned Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0 bg-[#080d17]/90">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs border border-slate-750 transition cursor-pointer"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={hasValidationError}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition border ${
              hasValidationError
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60 shadow-none'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400/80 shadow-[0_0_8px_rgba(56,189,248,0.25)] cursor-pointer transform active:scale-95'
            }`}
            title={hasValidationError ? '數值低於最低限制 (最少 5 分鐘)，無法儲存' : '儲存變更'}
          >
            SAVE_CONFIG
          </button>
        </div>

        {/* Reset Confirmation Overlay Modal */}
        {showConfirmReset && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-[#0e0709] border border-rose-500/70 rounded-md p-5 max-w-xs w-full shadow-[0_0_30px_rgba(244,63,94,0.3)] flex flex-col gap-3 font-mono cctv-brackets">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
                <span>[SYS_WARNING: CONFIRM_RESET]</span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-sans">
                確定要清空並重置今日的所有健康存摺分數、體徵數據與歷史紀錄嗎？重置後系統將恢復 100 分滿血初始狀態。
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-900/60">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmReset(false);
                    if (onResetTodayData) onResetTodayData();
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-[0_0_10px_rgba(244,63,94,0.4)] cursor-pointer"
                >
                  確定重置
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
