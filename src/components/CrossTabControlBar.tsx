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
      className="bg-[#0b101b] border border-cyan-500/60 rounded-xl p-3.5 sm:p-4 shadow-xl font-mono text-xs relative overflow-hidden"
    >
      {/* Top Banner Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-cyan-950 border border-cyan-500/60 rounded text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-wider text-xs">
                [CROSS_INTERFACE_INTERCEPTOR // 跨分頁與跨介面強阻擋]
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                ACTIVE_SHIELD
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              開啟後不論您在切換分頁、使用 VS Code、Excel 或是全螢幕工作，都能跳出阻擋警告
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition self-start sm:self-auto"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showInfo ? '收起說明' : '運作原理'}</span>
        </button>
      </div>

      {/* Principle details drop */}
      {showInfo && (
        <div className="p-3 mb-3 rounded-lg bg-[#070b13] border border-slate-800 text-[11px] text-slate-300 space-y-1.5 leading-relaxed animate-in fade-in duration-200">
          <div className="text-cyan-300 font-bold">三道跨介面阻擋防線：</div>
          <div>
            1. <strong className="text-white">OS 系統級桌面通知 (System Notifications)</strong>：帶有
            <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-400">requireInteraction</code>
            ，即使切換到其他瀏覽器分頁或桌面程式，警報也會常駐於作業系統角落強烈提醒。
          </div>
          <div>
            2. <strong className="text-white">跨桌面永遠置頂視窗 (Picture-in-Picture)</strong>：利用
            Document Picture-in-Picture 技術，生成一個永遠浮動於所有程式上層的儀表板，一旦久坐鎖定直接佔滿視窗彈出迷因貓倒數！
          </div>
          <div>
            3. <strong className="text-white">AI 即時語音廣播 (Voice TTS)</strong>：背景發出真人語音警報，戴著耳機或看別台螢幕也能瞬間被中斷。
          </div>
        </div>
      )}

      {/* Interactive Controls Group */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. Always-on-Top Floating PiP Button */}
        <button
          onClick={onTogglePiP}
          className={`p-2.5 rounded-lg border transition-all text-left flex items-start gap-2.5 group ${
            isPiPActive
              ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-[#070b12] border-slate-800 hover:border-cyan-500/70 text-slate-300 hover:bg-slate-900/60'
          }`}
        >
          <div
            className={`p-1.5 rounded shrink-0 ${
              isPiPActive ? 'bg-cyan-900 text-cyan-300' : 'bg-slate-900 text-slate-400 group-hover:text-cyan-400'
            }`}
          >
            <AppWindow className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold flex items-center justify-between gap-1">
              <span className="truncate">永遠置頂浮動視窗</span>
              {isPiPActive && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isPiPActive ? '已開啟：浮動在所有軟體上' : '點擊啟動 PiP 跨桌面浮動'}
            </div>
          </div>
        </button>

        {/* 2. Desktop System Notification Toggle */}
        <button
          onClick={
            notifPermission === 'granted'
              ? () => onToggleDesktopNotifications(!desktopNotificationsEnabled)
              : handleRequestNotifications
          }
          className={`p-2.5 rounded-lg border transition-all text-left flex items-start gap-2.5 group ${
            desktopNotificationsEnabled && notifPermission === 'granted'
              ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'bg-[#070b12] border-slate-800 hover:border-emerald-500/70 text-slate-300 hover:bg-slate-900/60'
          }`}
        >
          <div
            className={`p-1.5 rounded shrink-0 ${
              desktopNotificationsEnabled && notifPermission === 'granted'
                ? 'bg-emerald-900 text-emerald-300'
                : 'bg-slate-900 text-slate-400 group-hover:text-emerald-400'
            }`}
          >
            {desktopNotificationsEnabled && notifPermission === 'granted' ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold flex items-center justify-between gap-1">
              <span className="truncate">系統桌面強阻擋通知</span>
              {desktopNotificationsEnabled && notifPermission === 'granted' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {notifPermission === 'granted'
                ? desktopNotificationsEnabled
                  ? '已授權：跳出全螢幕阻擋'
                  : '已暫停 (點擊開啟)'
                : '需點擊授權瀏覽器通知'}
            </div>
          </div>
        </button>

        {/* 3. AI Voice Alerts TTS Toggle */}
        <button
          onClick={() => onToggleVoice(!voiceAlertsEnabled)}
          className={`p-2.5 rounded-lg border transition-all text-left flex items-start gap-2.5 group ${
            voiceAlertsEnabled
              ? 'bg-purple-950/80 border-purple-500/80 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
              : 'bg-[#070b12] border-slate-800 hover:border-purple-500/70 text-slate-300 hover:bg-slate-900/60'
          }`}
        >
          <div
            className={`p-1.5 rounded shrink-0 ${
              voiceAlertsEnabled
                ? 'bg-purple-900 text-purple-300'
                : 'bg-slate-900 text-slate-400 group-hover:text-purple-400'
            }`}
          >
            {voiceAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="font-bold flex items-center justify-between gap-1">
              <span className="truncate">語音警報廣播 (TTS)</span>
              {voiceAlertsEnabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {voiceAlertsEnabled ? '背景語音警報已就緒' : '已關閉語音 (點擊開啟)'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
