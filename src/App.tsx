import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  Volume2,
  VolumeX,
  Settings,
  Clock,
  Briefcase,
  AlertCircle,
  HelpCircle,
  AppWindow,
} from 'lucide-react';
import {
  HealthEvent,
  HealthTrendPoint,
  MemeToastItem,
  GuardianSettings,
  TelemetryData,
  DailySummaryStats,
  ActiveHazardAlert,
  FaceCharismaScore,
} from './types';
import { soundSynth } from './utils/audioSynth';
import { getFaceLandmarker, drawFacialLandmarks } from './utils/faceLandmarker';
import { FloatingHUD } from './components/FloatingHUD';
import { CameraFeed } from './components/CameraFeed';
import { SedentaryLockModal } from './components/SedentaryLockModal';
import { EyeStrainBlurOverlay } from './components/EyeStrainBlurOverlay';
import { DailyReceiptModal } from './components/DailyReceiptModal';
import { MemeToastContainer } from './components/MemeToastContainer';
import { SettingsModal } from './components/SettingsModal';
import { ActivityLogView } from './components/ActivityLogView';
import { HealthTrendChart } from './components/HealthTrendChart';
import { DemoSimulationBar } from './components/DemoSimulationBar';
import { FacialScoreCard } from './components/FacialScoreCard';
import { FloatingPiPInterlock } from './components/FloatingPiPInterlock';
import { CrossTabControlBar } from './components/CrossTabControlBar';
import { ScreensaverMemeTakeover } from './components/ScreensaverMemeTakeover';
import { StretchStickmanScreensaver } from './components/StretchStickmanScreensaver';
import { requestPiPWindow } from './utils/pipManager';
import { evaluateFaceScoreWithGemini, computeLocalFaceScore } from './utils/faceScoreEvaluator';
import {
  fireDesktopNotification,
  speakVoiceAlert,
  startTitleFlashing,
  stopTitleFlashing,
  broadcastCrossTabEvent,
  subscribeCrossTabEvents,
} from './utils/crossTabAlert';

export default function App() {
  // Application State
  const [healthScore, setHealthScore] = useState<number>(100);
  const [trendHistory, setTrendHistory] = useState<HealthTrendPoint[]>([]);
  const [settings, setSettings] = useState<GuardianSettings>({
    baseAge: 25,
    offWorkTime: '18:30',
    sedentaryLimitMinutes: 45,
    soundEnabled: true,
    desktopNotificationsEnabled: true,
    voiceAlertsEnabled: true,
  });

  const [isMeetingMode, setIsMeetingMode] = useState<boolean>(false);
  const [showMesh, setShowMesh] = useState<boolean>(true);

  // Picture-in-Picture & Always-on-Top Floating Interceptor State
  const [isPiPActive, setIsPiPActive] = useState<boolean>(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [activeHazard, setActiveHazard] = useState<ActiveHazardAlert | null>(null);
  const activeHazardTimeoutRef = useRef<number | null>(null);

  // Modals & Screensavers
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isSedentaryLocked, setIsSedentaryLocked] = useState<boolean>(false);
  const [sedentaryRemainingSeconds, setSedentaryRemainingSeconds] = useState<number>(15);
  const [isStretchScreensaverOpen, setIsStretchScreensaverOpen] = useState<boolean>(false);
  const [stretchScreensaverReason, setStretchScreensaverReason] = useState<'yawn' | 'sedentary' | 'manual'>('sedentary');

  const [isEyeStrainActive, setIsEyeStrainActive] = useState<boolean>(false);
  const [eyeStrainProgress, setEyeStrainProgress] = useState<number>(0);
  const [eyeStrainRemaining, setEyeStrainRemaining] = useState<number>(5);

  const [isOvertime, setIsOvertime] = useState<boolean>(false);
  const [overtimeMinutes, setOvertimeMinutes] = useState<number>(0);

  // Stats Counters for Daily Summary Card
  const [statsSummary, setStatsSummary] = useState({
    yawnsCaught: 0,
    frownsCaught: 0,
    sedentaryLocksCount: 0,
    slackMinutesEarned: 0,
    overtimeMinutes: 0,
  });

  // Events & Toasts
  const [events, setEvents] = useState<HealthEvent[]>([
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
      type: 'system',
      message: '守護網啟動：100% 本地即時 AI 臉部健康偵測',
      delta: 0,
      icon: '🛡️',
    },
  ]);
  const [toasts, setToasts] = useState<MemeToastItem[]>([]);

  // Camera & Telemetry
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    mar: 0,
    frown: 0,
    proximity: 0,
    blinkScore: 0,
    isFacePresent: false,
    consecutiveDeskSeconds: 0,
    consecutiveAwaySeconds: 0,
    isYawning: false,
    isFrowning: false,
    isTooClose: false,
    isFrequentBlinking: false,
  });

  // AI Face Charisma & Beauty Score State (Persisted in localStorage)
  const [faceScoreData, setFaceScoreData] = useState<FaceCharismaScore | null>(() => {
    try {
      const saved = localStorage.getItem('overwatch_last_face_score');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isScanningFace, setIsScanningFace] = useState<boolean>(false);

  // Latest candid snapshot captured randomly from webcam stream
  const candidSnapshotRef = useRef<{ image: string; time: string; timestamp: number } | null>(null);

  // Trackers ref for high-frequency detection logic
  const detectionRef = useRef({
    yawnStartTime: 0 as number | null,
    yawnCooldown: 0,
    frownStartTime: 0 as number | null,
    frownCooldown: 0,
    consecutiveDeskSecs: 0,
    consecutiveAwaySecs: 0,
    lastFrameTime: performance.now(),
    overtimeTicker: 0,
    isFaceCurrentlyPresent: false,
    blinkTimestamps: [] as number[],
    wasBlinking: false,
    blinkCooldown: 0,
    lastHourlyBeautyScanTime: performance.now(),
    lastRandomSnapshotTime: 0,
    nextRandomSnapshotIntervalSecs: 600 + Math.floor(Math.random() * 900), // Random 10~25 min
    latestSmile: 0.5,
    latestBrowRelaxation: 0.8,
    latestEyeOpenness: 0.8,
    latestProximityPct: 40,
  });

  // Sound sync
  useEffect(() => {
    soundSynth.isMuted = isMeetingMode || !settings.soundEnabled;
  }, [isMeetingMode, settings.soundEnabled]);

  // Add Log Event
  const logEvent = useCallback(
    (message: string, delta: number = 0, type: HealthEvent['type'] = 'info', icon: string = '📌') => {
      const newEvent: HealthEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        type,
        message,
        delta,
        icon,
      };
      setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
    },
    []
  );

  // Trigger Meme Toast
  const triggerToast = useCallback(
    (item: Omit<MemeToastItem, 'id'>) => {
      if (isMeetingMode) return; // Silent in meeting mode
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newToast: MemeToastItem = { ...item, id };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 8500);
    },
    [isMeetingMode]
  );

  // Score modifier helper
  const modifyScore = useCallback(
    (delta: number, reason: string, icon: string = '⚡') => {
      setHealthScore((prev) => {
        const nextScore = Math.max(0, Math.min(120, prev + delta));
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('zh-TW', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        setTrendHistory((history) => {
          const newPoint: HealthTrendPoint = {
            time: timeLabel,
            timestamp: Date.now(),
            score: nextScore,
            fatigueIndex: delta < 0 ? Math.min(10, Math.abs(delta) * 2) : 1,
            eventDelta: delta,
            eventName: reason.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 10),
            eventType: delta < 0 ? 'penalty' : delta > 0 ? 'reward' : 'info',
          };
          return [...history, newPoint].slice(-40);
        });

        return nextScore;
      });
      logEvent(reason, delta, delta < 0 ? 'penalty' : 'reward', icon);
    },
    [logEvent]
  );

  // Cross-tab & Multi-interface Hazard Dispatcher (OS Notifications, TTS Voice, Title Flashing, PiP)
  const dispatchHazardAlert = useCallback(
    (hazard: ActiveHazardAlert, voiceSpeechText: string) => {
      setActiveHazard(hazard);
      if (activeHazardTimeoutRef.current) {
        clearTimeout(activeHazardTimeoutRef.current);
      }
      activeHazardTimeoutRef.current = window.setTimeout(() => {
        setActiveHazard(null);
      }, 25000);

      // 1. OS Desktop Native Notification (blocks over all tabs and OS applications)
      if (settings.desktopNotificationsEnabled && !isMeetingMode) {
        fireDesktopNotification({
          title: `🚨 ${hazard.title}`,
          body: `${hazard.message} [${hazard.badge}]`,
          icon: hazard.image,
          tag: `ohg-${hazard.type}`,
          requireInteraction: true,
        });
      }

      // 2. Web Speech Synthesis Voice broadcast
      if (settings.voiceAlertsEnabled && !isMeetingMode) {
        speakVoiceAlert(voiceSpeechText);
      }

      // 3. Flashing background tab title
      if (typeof document !== 'undefined' && document.hidden) {
        startTitleFlashing(hazard.title);
      }

      // 4. Cross-tab synchronization
      broadcastCrossTabEvent('hazard_alert', hazard);
    },
    [settings.desktopNotificationsEnabled, settings.voiceAlertsEnabled, isMeetingMode]
  );

  // Multi-tab synchronization listener
  useEffect(() => {
    const unsubscribe = subscribeCrossTabEvents((event) => {
      if (event.type === 'sedentary_lock') {
        setIsSedentaryLocked(true);
        setSedentaryRemainingSeconds(15);
      } else if (event.type === 'sedentary_unlock') {
        setIsSedentaryLocked(false);
      } else if (event.type === 'hazard_alert') {
        const h = event.payload as ActiveHazardAlert;
        setActiveHazard(h);
        if (activeHazardTimeoutRef.current) clearTimeout(activeHazardTimeoutRef.current);
        activeHazardTimeoutRef.current = window.setTimeout(() => setActiveHazard(null), 25000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleTogglePiP = async () => {
    if (isPiPActive && pipWindow) {
      try {
        pipWindow.close();
      } catch {
        // ignore
      }
      setPipWindow(null);
      setIsPiPActive(false);
      return;
    }

    const win = await requestPiPWindow(() => {
      setIsPiPActive(false);
      setPipWindow(null);
    });

    if (win) {
      setPipWindow(win);
      setIsPiPActive(true);
      logEvent('跨桌面永遠置頂視窗已啟動：警報與鎖定將在螢幕最上層彈出阻擋', 0, 'info', '🪟');
    }
  };

  /* ====================================================================
     Detection Triggers (Both real-time AI & demo triggers)
     ==================================================================== */
  // Helper to capture a cybernetic candid webcam snapshot directly from camera feed
  const takeCandidWebcamSnapshot = useCallback(
    (customLabel: string = 'HOURLY_HYDRATION_CHECK', expressionType?: 'yawn' | 'blink' | 'frown' | 'candid'): string | null => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
        return null;
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Draw mirrored video frame (natural selfie orientation)
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Determine funny ugly/unflattering label based on expressionType or facial metrics
        let uglyTag = '工位野生姿態存證';
        const jaw = detectionRef.current.latestSmile || 0; // MAR estimate
        const eye = detectionRef.current.latestEyeOpenness || 0.8;

        if (expressionType === 'yawn') {
          uglyTag = '🚨 醜照存證：打哈欠巨口崩壞瞬間 (嘴巴張開 > 95%)';
        } else if (expressionType === 'blink' || eye < 0.35) {
          uglyTag = '🚨 醜照存證：眼睛半閉呆滯迷茫 (眼皮沉重打瞌睡)';
        } else if (expressionType === 'frown') {
          uglyTag = '🚨 醜照存證：眉頭深鎖班味爆表 (怨氣沖天)';
        } else {
          const UGLY_LABELS = [
            '🚨 醜照存證：工位失神崩態',
            '🚨 醜照存證：眼皮沉重打瞌睡',
            '🚨 醜照存證：嘴唇微張呆滯中',
            '🚨 醜照存證：野生打工人捕捉',
          ];
          uglyTag = UGLY_LABELS[Math.floor(Math.random() * UGLY_LABELS.length)];
        }

        // Stamp cybernetic surveillance telemetry HUD
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });
        const dateStr = now.toLocaleDateString('zh-TW');

        // Top HUD strip
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(0, 0, canvas.width, 36);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 36);
        ctx.lineTo(canvas.width, 36);
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`+ [OVERWATCH // 崩壞醜照突擊抓拍] +`, 12, 23);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${dateStr} ${timeStr}`, canvas.width - 12, 23);

        // Bottom Telemetry Strip
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 40);
        ctx.lineTo(canvas.width, canvas.height - 40);
        ctx.stroke();

        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`> ${uglyTag}`, 12, canvas.height - 16);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`💧 補水目標: 立即喝水去班味`, canvas.width - 12, canvas.height - 16);

        // Warning target reticle in center
        const w = canvas.width;
        const h = canvas.height;
        const reticleWidth = 160;
        const reticleHeight = 160;
        const rx = (w - reticleWidth) / 2;
        const ry = (h - reticleHeight) / 2;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(rx, ry, reticleWidth, reticleHeight);
        ctx.setLineDash([]);

        // Reticle corner marks
        const bLen = 16;
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2.5;
        // TL
        ctx.beginPath(); ctx.moveTo(rx - 8, ry - 8 + bLen); ctx.lineTo(rx - 8, ry - 8); ctx.lineTo(rx - 8 + bLen, ry - 8); ctx.stroke();
        // TR
        ctx.beginPath(); ctx.moveTo(rx + reticleWidth + 8 - bLen, ry - 8); ctx.lineTo(rx + reticleWidth + 8, ry - 8); ctx.lineTo(rx + reticleWidth + 8, ry - 8 + bLen); ctx.stroke();
        // BL
        ctx.beginPath(); ctx.moveTo(rx - 8, ry + reticleHeight + 8 - bLen); ctx.lineTo(rx - 8, ry + reticleHeight + 8); ctx.lineTo(rx - 8 + bLen, ry + reticleHeight + 8); ctx.stroke();
        // BR
        ctx.beginPath(); ctx.moveTo(rx + reticleWidth + 8 - bLen, ry + reticleHeight + 8); ctx.lineTo(rx + reticleWidth + 8, ry + reticleHeight + 8); ctx.lineTo(rx + reticleWidth + 8, ry + reticleHeight + 8 - bLen); ctx.stroke();

        return canvas.toDataURL('image/jpeg', 0.88);
      } catch (err) {
        console.warn('Failed to take candid snapshot:', err);
        return null;
      }
    },
    []
  );

  const handleYawnPenalty = useCallback(() => {
    modifyScore(-5, '大哈欠抓包：嘴巴大開 > 1.5s (-5點)', '🥱');
    setStatsSummary((s) => ({ ...s, yawnsCaught: s.yawnsCaught + 1 }));
    soundSynth.playYawnAlert();

    // Capture exact yawning ugly shot from camera stream
    const yawnSnap = takeCandidWebcamSnapshot('大哈欠嘴巴大開崩壞照', 'yawn');
    if (yawnSnap) {
      const nowStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
      candidSnapshotRef.current = {
        image: yawnSnap,
        time: nowStr,
        timestamp: Date.now(),
      };
    }
    const snapImage = yawnSnap || '/memes/cat-yawn.jpg';

    triggerToast({
      title: '老闆正在你背後看著你！👀',
      desc: '偵測到嘴部大開打哈欠！崩壞醜照已存證！快喝口水提神！',
      badge: '扣 5 點 // 崩壞抓拍',
      badgeColor: 'bg-rose-500 text-white',
      image: snapImage,
      type: 'yawn',
    });
    dispatchHazardAlert(
      {
        type: 'yawn',
        title: '大哈欠抓包！崩壞醜照即時存證！',
        message: '偵測到嘴巴大開打哈欠！工位野生崩壞瞬間已拍攝存證，快喝口水提神！',
        badge: '扣 5 點 // 醜照抓拍',
        severity: 'critical',
        image: snapImage,
        timestamp: Date.now(),
      },
      '注意！偵測到張大嘴打哈欠，崩壞醜照已存證，快喝口水提神！'
    );
  }, [modifyScore, triggerToast, dispatchHazardAlert, takeCandidWebcamSnapshot]);

  const handleFrownPenalty = useCallback(() => {
    modifyScore(-3, '長期緊皺眉頭：怨念氣場爆棚 (-3點)', '😠');
    setStatsSummary((s) => ({ ...s, frownsCaught: s.frownsCaught + 1 }));
    soundSynth.playWarningBuzz();

    // Capture exact frowning ugly shot
    const frownSnap = takeCandidWebcamSnapshot('緊皺眉頭厭世臉', 'frown');
    if (frownSnap) {
      const nowStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
      candidSnapshotRef.current = {
        image: frownSnap,
        time: nowStr,
        timestamp: Date.now(),
      };
    }
    const snapImage = frownSnap || '/memes/dog-frown.jpg';

    triggerToast({
      title: '這點薪水不值得你皺眉！🐕',
      desc: '偵測到怨氣沖天眉頭深鎖！厭世崩壞抓拍已存檔，深呼吸放鬆額頭！',
      badge: '扣 3 點 // 厭世抓拍',
      badgeColor: 'bg-amber-500 text-slate-950',
      image: snapImage,
      type: 'frown',
    });
    dispatchHazardAlert(
      {
        type: 'frown',
        title: '這點薪水不值得你緊皺眉頭！',
        message: '偵測到怨氣沖天眉頭深鎖！厭世崩壞抓拍已存檔，深呼吸放鬆額頭！',
        badge: '扣 3 點 // 醜照抓拍',
        severity: 'warning',
        image: snapImage,
        timestamp: Date.now(),
      },
      '注意！偵測到緊皺眉頭怨念深重，請深呼吸放鬆額頭！'
    );
  }, [modifyScore, triggerToast, dispatchHazardAlert, takeCandidWebcamSnapshot]);

  const handleBlinkPenalty = useCallback(() => {
    modifyScore(-3, '視覺神經疲勞：頻繁眨眼過勞 (-3點)', '✨');
    soundSynth.playBlinkChime();

    // Capture exact eye-strain / half-closed eye shot
    const blinkSnap = takeCandidWebcamSnapshot('眼睛半閉呆滯狀態', 'blink');
    if (blinkSnap) {
      const nowStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
      candidSnapshotRef.current = {
        image: blinkSnap,
        time: nowStr,
        timestamp: Date.now(),
      };
    }
    const snapImage = blinkSnap || '/memes/idol-handsome-1.jpg';

    triggerToast({
      title: '神仙顏值洗眼 SPA 已啟動！✨😍',
      desc: '偵測到雙眼過勞眼睛半閉！呆滯崩壞瞬間已抓拍存證，奉上頂級神顏！',
      badge: '護眼洗眼',
      badgeColor: 'bg-pink-500 text-white',
      image: snapImage,
      type: 'blink',
    });
    dispatchHazardAlert(
      {
        type: 'blink',
        title: '視覺神經疲勞 // 頂級神顏洗眼 SPA',
        message: '雙眼過勞乾澀，捕捉到眼神呆滯半閉瞬間！偶像級神顏已降臨為你注入多巴胺！',
        badge: '護眼 SPA // 醜照抓拍',
        severity: 'warning',
        image: snapImage,
        timestamp: Date.now(),
      },
      '注意！偵測到眼皮沉重，請放鬆眼眶肌肉！'
    );
  }, [modifyScore, triggerToast, dispatchHazardAlert, takeCandidWebcamSnapshot]);

  const handleScanFaceCharisma = useCallback(
    async (isAuto: boolean = false, triggerTakeoverModal: boolean = false) => {
      if (isScanningFace) return;
      setIsScanningFace(true);

      const inputs = {
        smile: detectionRef.current.latestSmile || 0,
        browRelaxation: detectionRef.current.latestBrowRelaxation ?? 1,
        eyeOpenness: detectionRef.current.latestEyeOpenness ?? 0.8,
        isFacePresent: detectionRef.current.isFaceCurrentlyPresent,
        proximityPct: detectionRef.current.latestProximityPct || 0,
        yawnsCount: statsSummary.yawnsCaught,
        frownsCount: statsSummary.frownsCaught,
        consecutiveDeskMinutes: Math.floor(telemetry.consecutiveDeskSeconds / 60),
        healthScore: healthScore,
      };

      try {
        const result = await evaluateFaceScoreWithGemini(inputs);
        setFaceScoreData(result);
        try {
          localStorage.setItem('overwatch_last_face_score', JSON.stringify(result));
        } catch (err) {
          console.warn('Failed to save last face score to localStorage:', err);
        }
        soundSynth.playBlinkChime();

        // Retrieve or immediately capture candid snapshot from webcam
        const nowStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
        const liveSnapshot = takeCandidWebcamSnapshot('HOURLY_HYDRATION_CHECK');
        if (liveSnapshot) {
          candidSnapshotRef.current = {
            image: liveSnapshot,
            time: nowStr,
            timestamp: Date.now(),
          };
        }

        const candidImg =
          candidSnapshotRef.current?.image ||
          liveSnapshot ||
          '/memes/idol-handsome-1.jpg';
        const candidTime = candidSnapshotRef.current?.time || nowStr;

        if (triggerTakeoverModal) {
          modifyScore(+5, `💧 整點 AI 顏值評測：${result.score}分 [${result.rank}] (喝水補水加分 +5點)`, '💧');
          soundSynth.playWaterDrink();
          dispatchHazardAlert(
            {
              type: 'beauty_score',
              title: `💧 整點 AI 顏值水光評測：${result.score}分 [${result.rank}]`,
              message: `【突擊抓拍紀錄 ${candidTime}】${result.title}！${result.comment} 💧 立即飲用 300ml 溫水補充細胞水分，顏值將飆升 +10 分！`,
              badge: `顏值 ${result.score}分 // 工位抓拍`,
              severity: 'reward',
              image: candidImg,
              timestamp: Date.now(),
            },
            `整點 AI 顏值評測完成！當前評分 ${result.score} 分，記得多喝水讓顏值飆升！`
          );
        } else if (!isAuto) {
          triggerToast({
            title: `✨ AI 顏值掃描：${result.score} 分 [${result.rank}]`,
            desc: `【抓拍 ${candidTime}】${result.title} — 多喝水可讓肌膚透亮飽水、顏值直線上升！💧`,
            badge: `${result.score}分`,
            badgeColor: 'bg-cyan-500 text-slate-950',
            image: candidImg,
            type: 'blink',
          });
        }

        logEvent(
          `AI 顏值評測：${result.score}分 [${result.rank}] — ${result.title} (工位抓拍存證，提醒多喝水)`,
          triggerTakeoverModal ? 5 : 0,
          'reward',
          '💧'
        );
      } catch (err) {
        console.warn('Face scoring failed:', err);
      } finally {
        setIsScanningFace(false);
      }
    },
    [isScanningFace, triggerToast, logEvent, modifyScore, dispatchHazardAlert, takeCandidWebcamSnapshot]
  );

  const handleProximityBlur = useCallback(() => {
    setIsEyeStrainActive(true);
    modifyScore(-5, '頭部距離螢幕過近：啟動護眼科技雷達校準 (-5點)', '👀');
    soundSynth.playWarningBuzz();
    
    // Voice alert & notifications
    if (settings.voiceAlertsEnabled && !isMeetingMode) {
      speakVoiceAlert('距離螢幕過近！請向後靠上椅背拉開距離！');
    }
    if (settings.desktopNotificationsEnabled && !isMeetingMode) {
      fireDesktopNotification({
        title: '🚨 距離過近警告',
        body: '頭部距離螢幕過近！請向後靠上椅背拉開至 55cm 以上安全距離！',
        tag: 'ohg-proximity',
        requireInteraction: true,
      });
    }
  }, [modifyScore, settings.voiceAlertsEnabled, settings.desktopNotificationsEnabled, isMeetingMode]);

  const handleProximityCalibrationSuccess = useCallback(() => {
    setIsEyeStrainActive(false);
    modifyScore(+3, '🎯 護眼距離校準成功：已拉開至安全距離 (55~70cm) (+3點)', '🎯');
    triggerToast({
      title: '🎯 最佳護眼距離已鎖定',
      desc: '成功維持安全視距 (55~70cm)！睫狀肌已獲得適度放鬆。',
      badge: '校準成功 +3pts',
      badgeColor: 'bg-emerald-500 text-slate-950',
      type: 'blink',
    });
    logEvent('護眼雷達：成功拉開至最佳安全距離 (55~70cm) 並完成校準', 3, 'reward', '🎯');
  }, [modifyScore, triggerToast, logEvent]);

  const handleSedentaryLock = useCallback(() => {
    // Directly launch the exquisite 30-second Stickman Calisthenics stretch screen!
    setStretchScreensaverReason('sedentary');
    setIsStretchScreensaverOpen(true);
    modifyScore(-5, '連續久坐超過時限：啟動 30 秒站立伸展體操 (-5點)', '🪑');
    setStatsSummary((s) => ({ ...s, sedentaryLocksCount: s.sedentaryLocksCount + 1 }));
    soundSynth.playYawnAlert();
    broadcastCrossTabEvent('sedentary_lock', true);

    if (settings.voiceAlertsEnabled && !isMeetingMode) {
      speakVoiceAlert('久坐超時！請立刻起立，跟隨全螢幕體操放鬆脊椎！');
    }
    if (settings.desktopNotificationsEnabled && !isMeetingMode) {
      fireDesktopNotification({
        title: '🧘 久坐超時！30 秒體操伸展已啟動',
        body: '請起立活動四肢，跟隨螢幕上的體操教練進行 30 秒舒展放鬆！',
        tag: 'ohg-stretch-sedentary',
        requireInteraction: true,
      });
    }
  }, [modifyScore, settings.voiceAlertsEnabled, settings.desktopNotificationsEnabled, isMeetingMode]);

  const handleSedentaryUnlock = useCallback(() => {
    setIsSedentaryLocked(false);
    detectionRef.current.consecutiveDeskSecs = 0;
    soundSynth.playRewardJingle();
    stopTitleFlashing();
    broadcastCrossTabEvent('sedentary_unlock', true);
    logEvent('恭喜起立活動！屁股與椅子成功分離，血液恢復流動', 0, 'info', '🎉');
    triggerToast({
      title: '🎉 恭喜離開座位活動！',
      desc: '屁股成功與椅子分離，血液重新流動，椎間盤向你深深致謝！',
      badge: '久坐解除',
      badgeColor: 'bg-emerald-500 text-slate-950',
      image: '/memes/cat-curious.jpg',
      type: 'sedentary',
    });
    if (settings.voiceAlertsEnabled && !isMeetingMode) {
      speakVoiceAlert('恭喜成功起立離座活動！鎖定已解除，血液重新流動！');
    }
  }, [logEvent, triggerToast, settings.voiceAlertsEnabled, isMeetingMode]);

  const handleSlackReward = useCallback(
    (minutes: number) => {
      modifyScore(10, `榮耀薪水小偷！成功離開座位摸魚 ${minutes} 分鐘 (+10點)`, '☕');
      setStatsSummary((s) => ({ ...s, slackMinutesEarned: s.slackMinutesEarned + minutes }));
      soundSynth.playRewardJingle();
      triggerToast({
        title: '🏆 薪水小偷 Lv.MAX！',
        desc: `偵測到離座超過 ${minutes} 分鐘！適度摸魚才是長壽工作的大師哲學！`,
        badge: '回血 +10 點',
        badgeColor: 'bg-emerald-400 text-slate-950',
        image: '/memes/cat-chill.jpg',
        type: 'slack',
      });
      dispatchHazardAlert(
        {
          type: 'slack',
          title: '🏆 薪水小偷 Lv.MAX！',
          message: `成功離開座位摸魚 ${minutes} 分鐘！適度摸魚才是長壽工作的大師哲學！`,
          badge: '回血 +10 點',
          severity: 'reward',
          image: '/memes/cat-chill.jpg',
          timestamp: Date.now(),
        },
        `恭喜薪水小偷離座摸魚${minutes}分鐘，健康存摺回血十點！`
      );
    },
    [modifyScore, triggerToast, dispatchHazardAlert]
  );

  const handleOvertimeDeduction = useCallback(() => {
    modifyScore(-15, '血汗超時加班：生命力被無情抽取 (-15點)', '🩸');
    setStatsSummary((s) => ({ ...s, overtimeMinutes: s.overtimeMinutes + 10 }));
    soundSynth.playWarningBuzz();
    triggerToast({
      title: '🩸 生命力光速流失中！',
      desc: `表定下班時間已過，你仍伏案加班！快收拾東西打卡下班！`,
      badge: '扣 15 點',
      badgeColor: 'bg-rose-600 text-white',
      image: '/memes/dog-tired.jpg',
      type: 'overtime',
    });
    dispatchHazardAlert(
      {
        type: 'overtime',
        title: '🩸 生命力流失 // 超時加班警報',
        message: '表定下班時間已過，你仍伏案加班！快收拾東西打卡下班！',
        badge: '扣 15 點 // 靈魂汲取',
        severity: 'critical',
        image: '/memes/dog-tired.jpg',
        timestamp: Date.now(),
      },
      '注意！偵測到超時加班，健康存摺扣十五點，快打卡下班！'
    );
  }, [modifyScore, triggerToast, dispatchHazardAlert]);

  /* ====================================================================
     MediaPipe FaceLandmarker Initialization & Video Setup
     ==================================================================== */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setIsCameraActive(true);
        };
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setCameraError(`無法開啟攝影機 (${errMsg})。可點選「重試」或使用下方快速模擬列進行互動體驗。`);
      setIsCameraActive(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function initAI() {
      try {
        await getFaceLandmarker();
        if (!isCancelled) {
          setIsModelLoaded(true);
          startCamera();
        }
      } catch (err: unknown) {
        console.error('FaceLandmarker load failed:', err);
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setModelLoadError(msg);
          setIsModelLoaded(true); // allow app interaction
        }
      }
    }

    initAI();

    return () => {
      isCancelled = true;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  /* ====================================================================
     Realtime Video AI Processing Loop
     ==================================================================== */
  useEffect(() => {
    let animationFrameId: number;

    async function processLoop() {
      const now = performance.now();
      const delta = (now - detectionRef.current.lastFrameTime) / 1000;
      detectionRef.current.lastFrameTime = now;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        // Sync canvas resolution with video dimensions
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          try {
            const landmarker = await getFaceLandmarker();
            const results = landmarker.detectForVideo(video, now);
            const hasFace = results.faceLandmarks && results.faceLandmarks.length > 0;
            detectionRef.current.isFaceCurrentlyPresent = !!hasFace;

            if (hasFace) {
              const landmarks = results.faceLandmarks[0];
              const blendshapes = results.faceBlendshapes?.[0]?.categories || [];

              // Draw Facial landmarks if toggled
              if (showMesh) {
                drawFacialLandmarks(ctx, landmarks, canvas.width, canvas.height, '#06b6d4');
              }

              // 1. MAR (Jaw Open)
              const jawOpenShape = blendshapes.find((b) => b.categoryName === 'jawOpen');
              const jawVal = jawOpenShape ? jawOpenShape.score : computeFallbackMAR(landmarks);

              // 2. Frown (Brow Down)
              const browDownL =
                blendshapes.find((b) => b.categoryName === 'browDownLeft')?.score || 0;
              const browDownR =
                blendshapes.find((b) => b.categoryName === 'browDownRight')?.score || 0;
              const frownVal = (browDownL + browDownR) / 2;

              // 3. Proximity / Screen Distance
              const ys = landmarks.map((p) => p.y);
              const faceHeight = Math.max(...ys) - Math.min(...ys);
              const proximityPct = Math.round(faceHeight * 100);

              // 4. Blinking & Eye Vitality
              const blinkL =
                blendshapes.find((b) => b.categoryName === 'eyeBlinkLeft')?.score || 0;
              const blinkR =
                blendshapes.find((b) => b.categoryName === 'eyeBlinkRight')?.score || 0;
              const blinkScore = Math.max(blinkL, blinkR);

              // 5. Smile & Facial Radiance
              const smileL =
                blendshapes.find((b) => b.categoryName === 'mouthSmileLeft')?.score || 0;
              const smileR =
                blendshapes.find((b) => b.categoryName === 'mouthSmileRight')?.score || 0;
              const smileVal = (smileL + smileR) / 2;
              const eyeOpenVal = Math.max(0, 1 - blinkScore);
              const browRelaxVal = Math.max(0, 1 - frownVal);

              // Store latest features for AI Charisma Scanner
              detectionRef.current.latestSmile = smileVal;
              detectionRef.current.latestBrowRelaxation = browRelaxVal;
              detectionRef.current.latestEyeOpenness = eyeOpenVal;
              detectionRef.current.latestProximityPct = proximityPct;

              // Blink frequency tracker (counts blinks in rolling 4-second window)
              if (blinkScore > 0.52 && !detectionRef.current.wasBlinking) {
                detectionRef.current.wasBlinking = true;
                detectionRef.current.blinkTimestamps.push(now);
              } else if (blinkScore < 0.28) {
                detectionRef.current.wasBlinking = false;
              }

              // Prune old blink timestamps (> 4s)
              detectionRef.current.blinkTimestamps = detectionRef.current.blinkTimestamps.filter(
                (t) => now - t <= 4000
              );

              const isFrequentBlinkingNow = detectionRef.current.blinkTimestamps.length >= 6;
              if (isFrequentBlinkingNow && detectionRef.current.blinkCooldown <= 0) {
                handleBlinkPenalty();
                detectionRef.current.blinkCooldown = 15; // 15s cooldown
              }

              // Hourly Automatic AI Face Charisma Score & Hydration Reminder (every 1 hour = 3600s = 3,600,000ms)
              if (
                detectionRef.current.lastHourlyBeautyScanTime === 0 ||
                now - detectionRef.current.lastHourlyBeautyScanTime > 3600000
              ) {
                detectionRef.current.lastHourlyBeautyScanTime = now;
                // Run 1-hour beauty evaluation screensaver takeover!
                handleScanFaceCharisma(true, true);
              }

              // Update desk / away trackers
              detectionRef.current.consecutiveDeskSecs += delta;

              // Check if returning from a > 3 minute (180s) away period
              if (detectionRef.current.consecutiveAwaySecs >= 180) {
                const mins = Math.round(detectionRef.current.consecutiveAwaySecs / 60);
                handleSlackReward(mins);
              }
              detectionRef.current.consecutiveAwaySecs = 0;

              // Yawn Trigger Check (>0.48 for > 1.5s)
              const isYawningNow = jawVal > 0.48;
              if (isYawningNow) {
                if (!detectionRef.current.yawnStartTime) {
                  detectionRef.current.yawnStartTime = performance.now();
                }
                const elapsedYawn = (performance.now() - detectionRef.current.yawnStartTime) / 1000;
                if (elapsedYawn > 1.5 && detectionRef.current.yawnCooldown <= 0) {
                  handleYawnPenalty();
                  detectionRef.current.yawnCooldown = 8; // 8s cooldown
                }
              } else {
                detectionRef.current.yawnStartTime = null;
              }

              // Frown Trigger Check (>0.45 for > 4.5s)
              const isFrowningNow = frownVal > 0.45;
              if (isFrowningNow) {
                if (!detectionRef.current.frownStartTime) {
                  detectionRef.current.frownStartTime = performance.now();
                }
                const elapsedFrown =
                  (performance.now() - detectionRef.current.frownStartTime) / 1000;
                if (elapsedFrown > 4.5 && detectionRef.current.frownCooldown <= 0) {
                  handleFrownPenalty();
                  detectionRef.current.frownCooldown = 15; // 15s cooldown
                }
              } else {
                detectionRef.current.frownStartTime = null;
              }

              // Proximity Trigger Check (>65% height)
              const isTooCloseNow = faceHeight > 0.65;
              if (isTooCloseNow && !isEyeStrainActive) {
                handleProximityBlur();
              }

              // Decay cooldowns
              if (detectionRef.current.yawnCooldown > 0) {
                detectionRef.current.yawnCooldown -= delta;
              }
              if (detectionRef.current.frownCooldown > 0) {
                detectionRef.current.frownCooldown -= delta;
              }
              if (detectionRef.current.blinkCooldown > 0) {
                detectionRef.current.blinkCooldown -= delta;
              }

              // Update Telemetry state
              setTelemetry({
                mar: jawVal,
                frown: frownVal,
                proximity: proximityPct,
                blinkScore,
                isFacePresent: true,
                consecutiveDeskSeconds: detectionRef.current.consecutiveDeskSecs,
                consecutiveAwaySeconds: 0,
                isYawning: isYawningNow,
                isFrowning: isFrowningNow,
                isTooClose: isTooCloseNow,
                isFrequentBlinking: isFrequentBlinkingNow,
              });
            } else {
              // No face present
              detectionRef.current.consecutiveAwaySecs += delta;
              detectionRef.current.consecutiveDeskSecs = 0;
              detectionRef.current.yawnStartTime = null;
              detectionRef.current.frownStartTime = null;

              setTelemetry((prev) => ({
                ...prev,
                mar: 0,
                frown: 0,
                proximity: 0,
                isFacePresent: false,
                consecutiveDeskSeconds: 0,
                consecutiveAwaySeconds: detectionRef.current.consecutiveAwaySecs,
                isYawning: false,
                isFrowning: false,
                isTooClose: false,
              }));
            }
          } catch {
            // landmarker detect error
          }
        }
      }

      animationFrameId = requestAnimationFrame(processLoop);
    }

    animationFrameId = requestAnimationFrame(processLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    showMesh,
    isEyeStrainActive,
    handleYawnPenalty,
    handleFrownPenalty,
    handleProximityBlur,
    handleSlackReward,
  ]);

  /* ====================================================================
     Background Interval: Sedentary, Eye Strain & Overtime Tick
     ==================================================================== */
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Sedentary Limit Check
      const deskLimitSecs = settings.sedentaryLimitMinutes * 60;
      if (
        detectionRef.current.consecutiveDeskSecs >= deskLimitSecs &&
        !isStretchScreensaverOpen &&
        !isSedentaryLocked
      ) {
        handleSedentaryLock();
      }

      // If Sedentary is Locked, countdown ONLY advances if user is ABSENT!
      if (isSedentaryLocked) {
        if (!detectionRef.current.isFaceCurrentlyPresent) {
          setSedentaryRemainingSeconds((sec) => {
            const next = sec - 1;
            if (next <= 0) {
              setTimeout(() => {
                handleSedentaryUnlock();
              }, 0);
              return 0;
            }
            return next;
          });
        }
      }

      // 2. Eye Strain Blur Countdown
      if (isEyeStrainActive) {
        setEyeStrainRemaining((rem) => {
          const next = rem - 1;
          const pct = Math.min(100, Math.max(0, ((5 - next) / 5) * 100));
          setTimeout(() => {
            setEyeStrainProgress(pct);
            if (next <= 0) {
              setIsEyeStrainActive(false);
              logEvent('眼部放鬆完成，畫面模糊已解除', 0, 'info', '👀');
            }
          }, 0);
          return Math.max(0, next);
        });
      }

      // 3. Overtime Check
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      if (
        currentTimeStr >= settings.offWorkTime &&
        detectionRef.current.isFaceCurrentlyPresent
      ) {
        setIsOvertime(true);
        detectionRef.current.overtimeTicker += 1;
        setOvertimeMinutes(Math.floor(detectionRef.current.overtimeTicker / 60));

        // Deduct 15 points every 10 minutes (600s)
        if (detectionRef.current.overtimeTicker % 600 === 0 && detectionRef.current.overtimeTicker > 0) {
          handleOvertimeDeduction();
        }
      } else {
        setIsOvertime(false);
      }

      // 4. Random Periodic Candid Snapshot Capture (Quiet background snapshot during the hour)
      const nowPerf = performance.now();
      const elapsedSinceLastSnap = (nowPerf - detectionRef.current.lastRandomSnapshotTime) / 1000;
      if (
        detectionRef.current.isFaceCurrentlyPresent &&
        elapsedSinceLastSnap >= detectionRef.current.nextRandomSnapshotIntervalSecs
      ) {
        detectionRef.current.lastRandomSnapshotTime = nowPerf;
        // Schedule next random snapshot between 10 ~ 25 minutes
        detectionRef.current.nextRandomSnapshotIntervalSecs = 600 + Math.floor(Math.random() * 900);
        const snapshot = takeCandidWebcamSnapshot('HOURLY_HYDRATION_CHECK');
        if (snapshot) {
          const timeStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
          candidSnapshotRef.current = {
            image: snapshot,
            time: timeStr,
            timestamp: Date.now(),
          };
        }
      }

      // 5. Hourly Beauty & Hydration Evaluation (Every 60 minutes = 3600 seconds)
      const elapsedSinceHourlyScan = (nowPerf - detectionRef.current.lastHourlyBeautyScanTime) / 1000;
      if (elapsedSinceHourlyScan >= 3600 && detectionRef.current.isFaceCurrentlyPresent && !isSedentaryLocked) {
        detectionRef.current.lastHourlyBeautyScanTime = nowPerf;
        handleScanFaceCharisma(true, true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    settings,
    isSedentaryLocked,
    isEyeStrainActive,
    handleSedentaryLock,
    handleSedentaryUnlock,
    handleOvertimeDeduction,
    handleScanFaceCharisma,
    takeCandidWebcamSnapshot,
    logEvent,
  ]);

  // Compute Daily Summary Stats
  const getSummaryStats = (): DailySummaryStats => {
    const finalAge = Number((settings.baseAge + (100 - healthScore) * 0.8).toFixed(1));
    let title = '打工戰士';
    let quote = '平安下班，勝造七級浮屠。';

    if (healthScore >= 90) {
      title = '摸魚養生大師 (天選社畜)';
      quote = '懂得在資本主義夾縫中喝水伸展，你能長命百歲！';
    } else if (healthScore >= 70) {
      title = '標準職場螺絲釘';
      quote = '微量熬夜與緊繃，回家請立刻平躺放空。';
    } else if (healthScore >= 45) {
      title = '重度損耗人體電池';
      quote = '這點薪水不值得你拿命換，明天請假吧！';
    } else {
      title = '半隻腳已踏入棺材';
      quote = '急需離職單與大自然森林浴！';
    }

    return {
      date: new Date().toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      baseAge: settings.baseAge,
      finalBodyAge: finalAge,
      finalHealthScore: healthScore,
      yawnsCaught: statsSummary.yawnsCaught,
      frownsCaught: statsSummary.frownsCaught,
      sedentaryLocksCount: statsSummary.sedentaryLocksCount,
      slackMinutesEarned: statsSummary.slackMinutesEarned,
      overtimeMinutes: statsSummary.overtimeMinutes,
      title,
      quote,
    };
  };

  // Memoized handlers to ensure stable references across 60fps renders
  const handleDismissHazard = useCallback(() => {
    setActiveHazard(null);
  }, []);

  const handleStartStretchFromYawn = useCallback(() => {
    setActiveHazard(null);
    setStretchScreensaverReason('yawn');
    setIsStretchScreensaverOpen(true);
  }, []);

  const handleStartStretchFromSedentary = useCallback(() => {
    setStretchScreensaverReason('sedentary');
    setIsStretchScreensaverOpen(true);
  }, []);

  const handleEmergencyOverride = useCallback(() => {
    setIsSedentaryLocked(false);
    detectionRef.current.consecutiveDeskSecs = 0;
    logEvent('已手動覆蓋久坐鎖定：站立辦公中', 0, 'info', '🧍');
  }, [logEvent]);

  const handleDismissEyeStrain = useCallback(() => {
    setIsEyeStrainActive(false);
    logEvent('已手動解除眼肌放鬆模糊', 0, 'info', '👀');
  }, [logEvent]);

  const handleStretchComplete = useCallback(() => {
    setIsStretchScreensaverOpen(false);
    setHealthScore((prev) => Math.min(100, prev + 15));
    setIsSedentaryLocked(false);
    detectionRef.current.consecutiveDeskSecs = 0;
    triggerToast({
      title: '🧘 30 秒站立動態體操完成！',
      desc: '脊椎減壓達到 85%，下肢靜脈血液循環大幅提升！健康存摺 +15 點！',
      badge: '+15 BP',
      badgeColor: 'bg-emerald-500 text-slate-950',
      type: 'general',
    });
    logEvent(
      '【30秒暖身操完成】動態體操引導脊椎減壓成功！健康存摺 +15 BP',
      15,
      'reward',
      '🧘'
    );
  }, [triggerToast, logEvent]);

  const handleStretchDismiss = useCallback(() => {
    setIsStretchScreensaverOpen(false);
    setIsSedentaryLocked(false);
    detectionRef.current.consecutiveDeskSecs = 0;
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleTriggerDemoSlack = useCallback(() => {
    handleSlackReward(5);
  }, [handleSlackReward]);

  const handleClearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleCloseReceipt = useCallback(() => {
    setIsReceiptOpen(false);
  }, []);

  const handleSaveSettings = useCallback(
    (newSettings: GuardianSettings) => {
      setSettings(newSettings);
      logEvent(
        `守護參數已更新：基礎年齡 ${newSettings.baseAge}歲 / 下班時間 ${newSettings.offWorkTime}`,
        0,
        'info',
        '⚙️'
      );
    },
    [logEvent]
  );

  const handleClosePiP = useCallback(() => {
    if (pipWindow) {
      try {
        pipWindow.close();
      } catch {
        // ignore
      }
    }
    setPipWindow(null);
    setIsPiPActive(false);
  }, [pipWindow]);

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-200 hardware-grid-bg flex flex-col selection:bg-cyan-500 selection:text-black overflow-x-hidden w-full">
      {/* Full-Screen Overlays */}
      <SedentaryLockModal
        isOpen={isSedentaryLocked}
        remainingSeconds={sedentaryRemainingSeconds}
        isFacePresent={telemetry.isFacePresent}
        onStartStretchWorkout={handleStartStretchFromSedentary}
        onEmergencyOverride={handleEmergencyOverride}
      />

      <EyeStrainBlurOverlay
        isOpen={isEyeStrainActive}
        proximityPct={telemetry.proximity}
        isFacePresent={telemetry.isFacePresent}
        onDismiss={handleDismissEyeStrain}
        onCalibrationSuccess={handleProximityCalibrationSuccess}
      />

      {/* Screensaver Full-Screen Meme Takeover (Yawn, Frown, Slack, Overtime) */}
      <ScreensaverMemeTakeover
        alert={activeHazard}
        onDismiss={handleDismissHazard}
        onStartStretchWorkout={handleStartStretchFromYawn}
      />

      {/* 30-Second Stickman Calisthenics Warm-Up Screensaver */}
      <StretchStickmanScreensaver
        isOpen={isStretchScreensaverOpen}
        reason={stretchScreensaverReason}
        onComplete={handleStretchComplete}
        onDismiss={handleStretchDismiss}
      />

      {/* Meme Floating Toasts */}
      <MemeToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
      />

      {/* Main Hardware Instrument Header */}
      <header className="sticky top-0 z-30 px-2.5 sm:px-6 py-2 border-b border-slate-800 bg-[#06080e]/95 backdrop-blur-md flex items-center justify-between shadow-lg font-mono w-full min-w-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#030508] border border-cyan-500/50 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(6,182,212,0.25)] shrink-0">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h1 className="text-xs sm:text-sm font-black tracking-wider text-slate-100 uppercase truncate">
                OVERWATCH
                <span className="hidden md:inline"> // BIOSURVEILLANCE OS</span>
              </h1>
              <span className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hidden sm:inline-block tracking-widest shrink-0">
                AI_VISION_PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-400 truncate">
              <span className="flex items-center gap-1 text-cyan-400 font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                CAM_REC
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="hidden md:inline text-slate-500 truncate">辦公室久坐與健康存摺監控網絡</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 text-xs">
          {/* PiP Always-on-top Interceptor Quick Toggle */}
          <button
            onClick={handleTogglePiP}
            className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded text-[10px] sm:text-[11px] font-bold border transition-all ${
              isPiPActive
                ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.25)]'
                : 'bg-[#030508] border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title="開啟永遠置頂浮動視窗"
          >
            <AppWindow className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">{isPiPActive ? 'PIP_ACTIVE' : 'PIP_DOCK'}</span>
          </button>

          {/* Meeting Mode Switch */}
          <button
            onClick={() => {
              const next = !isMeetingMode;
              setIsMeetingMode(next);
              logEvent(
                next ? '已開啟「會議模式」：靜音所有彈窗與音效' : '會議結束：守護警報全面恢復',
                0,
                'info',
                next ? '🤫' : '🔔'
              );
            }}
            className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded text-[10px] sm:text-[11px] font-bold border transition-all ${
              isMeetingMode
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                : 'bg-[#030508] border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
            title="開啟會議模式：靜音所有彈窗與警報"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isMeetingMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className="hidden sm:inline">{isMeetingMode ? 'MTG: ON' : 'MTG: OFF'}</span>
            <span className="sm:hidden">{isMeetingMode ? 'MTG' : 'OFF'}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1 sm:p-1.5 rounded bg-[#030508] border border-slate-800 hover:border-cyan-500/60 text-slate-400 hover:text-cyan-400 transition"
            title="守護者儀器參數設定"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Clock-Out Summary Card Button */}
          <button
            onClick={() => setIsReceiptOpen(true)}
            className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-2 sm:px-2.5 py-1 rounded text-[10px] sm:text-[11px] transition transform active:scale-95 border border-cyan-400/80 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">[RECEIPT]</span>
            <span className="sm:hidden">結算</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-5">
        {/* Cross-Tab & Cross-Interface Interceptor Control Bar */}
        <CrossTabControlBar
          isPiPActive={isPiPActive}
          onTogglePiP={handleTogglePiP}
          voiceAlertsEnabled={settings.voiceAlertsEnabled}
          onToggleVoice={(enabled) =>
            setSettings((prev) => ({ ...prev, voiceAlertsEnabled: enabled }))
          }
          desktopNotificationsEnabled={settings.desktopNotificationsEnabled}
          onToggleDesktopNotifications={(enabled) =>
            setSettings((prev) => ({ ...prev, desktopNotificationsEnabled: enabled }))
          }
          isMeetingMode={isMeetingMode}
          onToggleMeetingMode={() => setIsMeetingMode(!isMeetingMode)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left / Center View: Camera & Controls */}
          <div className="lg:col-span-8 flex flex-col justify-between h-full">
            <CameraFeed
              videoRef={videoRef}
              canvasRef={canvasRef}
              isModelLoaded={isModelLoaded}
              modelLoadError={modelLoadError}
              isCameraActive={isCameraActive}
              cameraError={cameraError}
              onRetryCamera={startCamera}
              showMesh={showMesh}
              onToggleMesh={() => setShowMesh(!showMesh)}
              telemetry={telemetry}
              sedentaryLimitMinutes={settings.sedentaryLimitMinutes}
              onTriggerYawn={handleYawnPenalty}
              faceScoreData={faceScoreData}
              isScanningFace={isScanningFace}
              onTriggerFaceScan={() => handleScanFaceCharisma(false)}
            />
          </div>

          {/* Right Column: Gamified HUD & Facial Charisma Radar */}
          <div className="lg:col-span-4 flex flex-col gap-4 justify-between h-full">
            <FloatingHUD
              healthScore={healthScore}
              baseAge={settings.baseAge}
              isOvertime={isOvertime}
              offWorkTime={settings.offWorkTime}
              overtimeMinutes={overtimeMinutes}
            />

            {/* AI Facial Charisma Radar & Beauty Rating Card */}
            <FacialScoreCard
              scoreData={faceScoreData}
              isScanning={isScanningFace}
              onTriggerScan={() => handleScanFaceCharisma(false)}
              isFacePresent={telemetry.isFacePresent}
            />
          </div>
        </div>

        {/* Health & Fatigue Trend Chart Side-by-Side with Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 flex flex-col">
            <HealthTrendChart
              trendHistory={trendHistory}
              events={events}
              currentScore={healthScore}
            />
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <ActivityLogView events={events} onClear={handleClearEvents} />
          </div>
        </div>

        {/* Temporary / Dev Operator Override Bench (Moved to very bottom for easy deprecation) */}
        <div className="pt-2 border-t border-slate-850 opacity-70 hover:opacity-100 transition-opacity">
          <DemoSimulationBar
            onTriggerSedentary={handleSedentaryLock}
            onTriggerProximity={handleProximityBlur}
            onTriggerYawn={handleYawnPenalty}
            onTriggerBlink={handleBlinkPenalty}
            onTriggerFrown={handleFrownPenalty}
            onTriggerSlack={handleTriggerDemoSlack}
            onTriggerOvertime={handleOvertimeDeduction}
            onTriggerHourlyBeautyAlert={() => handleScanFaceCharisma(false, true)}
          />
        </div>
      </main>

      {/* Hardware Specialist Tool Footer */}
      <footer className="py-2.5 px-3 sm:px-6 text-[10px] sm:text-[11px] font-mono text-slate-500 border-t border-slate-800/80 bg-[#090d14] flex flex-col sm:flex-row justify-between items-start sm:items-center max-w-7xl mx-auto w-full gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-cyan-400 font-bold">[OHG-SYS-SPEC]</span>
          <span>100% LOCAL WASM</span>
          <span>•</span>
          <span>DEV: CAM_0</span>
          <span>•</span>
          <span className="text-cyan-400/90 font-bold">ZERO_DATA_UPLOAD</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
          <span className="text-slate-400">TELEMETRY: ACTIVE</span>
          <span>•</span>
          <span>REFRESH: 60Hz</span>
          <span>•</span>
          <span className="text-slate-400">SECURE_SANDBOX</span>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <DailyReceiptModal
        isOpen={isReceiptOpen}
        onClose={handleCloseReceipt}
        stats={getSummaryStats()}
        events={events}
      />

      {/* Picture-in-Picture Floating Interceptor Portal */}
      {isPiPActive &&
        pipWindow &&
        createPortal(
          <FloatingPiPInterlock
            healthScore={healthScore}
            baseAge={settings.baseAge}
            telemetry={telemetry}
            activeHazard={activeHazard}
            isSedentaryLocked={isSedentaryLocked}
            sedentaryRemaining={sedentaryRemainingSeconds}
            isEyeStrainActive={isEyeStrainActive}
            eyeStrainRemaining={eyeStrainRemaining}
            isOvertime={isOvertime}
            overtimeMinutes={overtimeMinutes}
            onDismissHazard={handleDismissHazard}
            onEmergencyOverride={handleEmergencyOverride}
            onClosePiP={handleClosePiP}
          />,
          pipWindow.document.body
        )}
    </div>
  );
}

/**
 * Fallback MAR coordinate calculation if blendshapes are unavailable
 */
function computeFallbackMAR(landmarks: Array<{ x: number; y: number }>): number {
  const top = landmarks[13];
  const bottom = landmarks[14];
  const left = landmarks[78];
  const right = landmarks[308];
  if (!top || !bottom || !left || !right) return 0;
  const vertical = Math.hypot(top.x - bottom.x, top.y - bottom.y);
  const horizontal = Math.hypot(left.x - right.x, left.y - right.y);
  return vertical / (horizontal || 1);
}
