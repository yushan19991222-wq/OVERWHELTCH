import React, { useState, useEffect } from 'react';
import {
  AppWindow,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  fireDesktopNotification,
  speakVoiceAlert,
} from '../utils/crossTabAlert';

interface CrossTabControlBarProps {
  isPiPActive: boolean;
  onTogglePiP: () => void;
  voiceAlertsEnabled: boolean;
  onToggleVoice: (enabled: boolean) => void;
  desktopNotificationsEnabled: boolean;
  onToggleDesktopNotifications: (enabled: boolean) => void;
  isMeetingMode: boolean;
  onToggleMeetingMode: () => void;
}

export const CrossTabControlBar: React.FC<CrossTabControlBarProps> = ({
  isPiPActive,
  onTogglePiP,
  voiceAlertsEnabled,
  onToggleVoice,
  desktopNotificationsEnabled,
  onToggleDesktopNotifications,
  isMeetingMode,
  onToggleMeetingMode,
}) => {
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [showInfo, setShowInfo] = useState<boolean>(false);

  useEffect(() => {
    if (isNotificationSupported()) {
      setNotifPermission(getNotificationPermission());
    }
  }, []);

  const handleRequestNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      onToggleDesktopNotifications(true);
      fireDesktopNotification({
        title: '🛡️ Office Health Guardian 系統阻擋已啟動',
        body: '不論切換到哪個分頁或視窗，超時久坐與健康警報都將在此彈出阻擋！',
        tag: 'test-permission',
      });
      speakVoiceAlert('系統桌面通知已成功啟用！跨分頁守護已就緒。');
    } else {
      onToggleDesktopNotifications(false);
    }
  };

  return (
    <div
      id="cross-tab-control-bar"
      className="bg-[#06080e] border border-slate-800 rounded-md p-3 font-mono text-xs relative backdrop-blur-md cctv-brackets shadow-lg"
    >
      {/* Top Banner Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-black/60 border border-cyan-500/60 rounded text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200 tracking-wider text-xs">
                [OVERWATCH // INTERFACE_INTERCEPT_CHANNELS]
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                MULTI-NODE ARMED
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              跨應用程式置頂與系統桌面攔截：在任何螢幕與全螢幕工作狀態下強制中斷久坐與疲勞
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition self-start sm:self-auto"
        >
          <HelpCircle className="w-3 h-3" />
          <span>{showInfo ? 'COLLAPSE' : 'SYS_INFO'}</span>
        </button>
      </div>

      {/* Principle details drop */}
      {showInfo && (
        <div className="p-2.5 mb-2.5 rounded bg-[#030508] border border-slate-800 text-[11px] text-slate-300 space-y-1 leading-relaxed animate-in fade-in duration-200">
          <div className="text-cyan-300 font-bold text-xs">[INTERCEPT PROTOCOL ARCHITECTURE]:</div>
          <div>
            1. <strong className="text-white">OS 系統級桌面通知</strong>：具備 requireInteraction，切換至任一全螢幕軟體仍會在角落置頂警告。
          </div>
          <div>
            2. <strong className="text-white">跨桌面永遠置頂視窗 (PiP)</strong>：透過 Document PiP 建立獨立置頂監視子視窗，久坐時直接覆蓋畫面。
          </div>
          <div>
            3. <strong className="text-white">AI 語音廣播 (Voice TTS)</strong>：背景合成語音警告，戴耳機或雙螢幕時無死角阻擋。
          </div>
        </div>
      )}

      {/* Interactive Controls Group */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* 1. Always-on-Top Floating PiP Button */}
        <button
          onClick={onTogglePiP}
          className={`p-2 rounded border transition-all text-left flex items-center gap-2.5 group ${
            isPiPActive
              ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
              : 'bg-[#030508] border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div
            className={`p-1.5 rounded shrink-0 ${
              isPiPActive ? 'bg-cyan-900/60 text-cyan-300' : 'bg-black text-slate-400 group-hover:text-cyan-400'
            }`}
          >
            <AppWindow className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold flex items-center justify-between text-xs">
              <span className="truncate">PIP_OVERLAY</span>
              {isPiPActive ? (
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/80 text-cyan-300 font-bold">ACTIVE</span>
              ) : (
                <span className="text-[9px] text-slate-600">OFF</span>
              )}
            </div>
            <div className="text-[9px] text-slate-500 truncate">
              {isPiPActive ? '已開啟：浮動在所有軟體上' : '永遠置頂跨桌面浮動'}
            </div>
          </div>
        </button>

        {/* 2. Desktop System Notification Toggle */}
        <button
          onClick={async () => {
            const nextState = !desktopNotificationsEnabled;
            onToggleDesktopNotifications(nextState);
            if (nextState && isNotificationSupported() && notifPermission !== 'granted') {
              try {
                const res = await requestNotificationPermission();
                if (res !== 'unsupported') {
                  setNotifPermission(res);
                }
              } catch (err) {
                console.warn('Failed to request notification permission:', err);
              }
            }
          }}
          className={`p-2 rounded border transition-all text-left flex items-center gap-2.5 group cursor-pointer ${
            desktopNotificationsEnabled
              ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
              : 'bg-[#030508] border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div
            className={`p-1.5 rounded shrink-0 ${
              desktopNotificationsEnabled
                ? 'bg-cyan-900/60 text-cyan-300'
                : 'bg-black text-slate-400 group-hover:text-cyan-400'
            }`}
          >
            {desktopNotificationsEnabled ? (
              <Bell className="w-3.5 h-3.5" />
            ) : (
              <BellOff className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold flex items-center justify-between text-xs">
              <span className="truncate">SYSTEM_NOTIF</span>
              {desktopNotificationsEnabled ? (
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/80 text-cyan-300 font-bold">ARMED</span>
              ) : (
                <span className="text-[9px] text-slate-600">OFF</span>
              )}
            </div>
            <div className="text-[9px] text-slate-500 truncate">
              {desktopNotificationsEnabled
                ? notifPermission === 'granted'
                  ? '已授權：跳出系統強阻擋'
                  : '已開啟 (切換分頁發送警報)'
                : '已關閉 (點擊開啟通知)'}
            </div>
          </div>
        </button>

        {/* 3. AI Voice Alerts TTS Toggle */}
        <button
          onClick={() => onToggleVoice(!voiceAlertsEnabled)}
          className={`p-2 rounded border transition-all text-left flex items-center gap-2.5 group ${
            voiceAlertsEnabled
              ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
              : 'bg-[#030508] border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div
            className={`p-1.5 rounded shrink-0 ${
              voiceAlertsEnabled
                ? 'bg-cyan-900/60 text-cyan-300'
                : 'bg-black text-slate-400 group-hover:text-cyan-400'
            }`}
          >
            {voiceAlertsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold flex items-center justify-between text-xs">
              <span className="truncate">VOICE_SYNTH</span>
              {voiceAlertsEnabled ? (
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/80 text-cyan-300 font-bold">LIVE</span>
              ) : (
                <span className="text-[9px] text-slate-600">OFF</span>
              )}
            </div>
            <div className="text-[9px] text-slate-500 truncate">
              {voiceAlertsEnabled ? '背景語音警報已就緒' : '已關閉語音 (點擊開啟)'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
