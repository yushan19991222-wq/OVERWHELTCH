import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  Volume2,
  VolumeX,
  Settings,
  Clock,
  Briefcase,
  AlertCircle,
  HelpCircle,
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
  CandidSnapshotItem,
} from './types';
import { CandidGalleryModal } from './components/CandidGalleryModal';
import { evaluateRealtimeEmotion } from './utils/emotionEvaluator';
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
import { CrossTabControlBar } from './components/CrossTabControlBar';
import { ScreensaverMemeTakeover } from './components/ScreensaverMemeTakeover';
import { StretchStickmanScreensaver } from './components/StretchStickmanScreensaver';
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
  const [trendHistory, setTrendHistory] = useState<HealthTrendPoint[]>(() => {
    const now = new Date();
    const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(roundedMinutes).padStart(2, '0');
    return [
      {
        time: `${hh}:${mm}`,
        timestamp: Date.now(),
        score: 100,
        fatigueIndex: 1,
        eventDelta: 0,
        eventName: '系統啟動',
        eventType: 'info',
      },
    ];
  });
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

  const [activeHazard, setActiveHazard] = useState<ActiveHazardAlert | null>(null);
  const activeHazardRef = useRef<ActiveHazardAlert | null>(null);
  activeHazardRef.current = activeHazard;
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
  const candidSnapshotRef = useRef<{
    image: string;
    time: string;
    timestamp: number;
    faceCenter?: { x: number; y: number };
    eyePositions?: {
      leftEye: { x: number; y: number };
      rightEye: { x: number; y: number };
      eyeDistance: number;
      rotationDeg: number;
    };
  } | null>(null);

  // Candid Snapshots Gallery State
  const [candidGallery, setCandidGallery] = useState<CandidSnapshotItem[]>(() => {
    try {
      const saved = localStorage.getItem('overwatch_candid_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCandidGalleryOpen, setIsCandidGalleryOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('overwatch_candid_gallery', JSON.stringify(candidGallery));
    } catch (err) {
      console.warn('Failed to save candid gallery to localStorage:', err);
    }
  }, [candidGallery]);

  const addCandidSnapshot = useCallback(
    (snapUrl: string, tag: string, type: CandidSnapshotItem['type']) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });
      const newItem: CandidSnapshotItem = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        image: snapUrl,
        tag,
        type,
        time: timeStr,
        timestamp: Date.now(),
      };
      setCandidGallery((prev) => [newItem, ...prev].slice(0, 30));
    },
    []
  );

  const handleDeleteSnapshot = useCallback((id: string) => {
    setCandidGallery((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearGallery = useCallback(() => {
    setCandidGallery([]);
    try {
      localStorage.removeItem('overwatch_candid_gallery');
    } catch {
      // ignore
    }
  }, []);

  // Trackers ref for high-frequency detection logic
  const detectionRef = useRef({
    yawnStartTime: 0 as number | null,
    yawnCooldown: 0,
    frownStartTime: 0 as number | null,
    frownCooldown: 0,
    proximityStartTime: 0 as number | null,
    proximityCooldown: 0,
    consecutiveDeskSecs: 0,
    consecutiveAwaySecs: 0,
    lastFrameTime: performance.now(),
    overtimeTicker: 0,
    isFaceCurrentlyPresent: false,
    blinkTimestamps: [] as number[],
    wasBlinking: false,
    blinkClosureStartTime: 0,
    lastBlinkPeakTime: 0,
    blinkCooldown: 0,
    lastHourlyBeautyScanTime: performance.now(),
    lastRandomSnapshotTime: 0,
    nextRandomSnapshotIntervalSecs: 600 + Math.floor(Math.random() * 900), // Random 10~25 min
    latestSmile: 0.5,
    latestBrowRelaxation: 0.8,
    latestEyeOpenness: 0.8,
    latestBrowPressure: 0.2,
    latestProximityPct: 40,
    latestFaceBounds: null as { minX: number; maxX: number; minY: number; maxY: number } | null,
    latestFaceCenter: { x: 50, y: 38 } as { x: number; y: number },
    rawEyeLandmarks: null as {
      left: { x: number; y: number };
      right: { x: number; y: number };
    } | null,
    latestEyePositions: {
      leftEye: { x: 42, y: 36 },
      rightEye: { x: 58, y: 36 },
      eyeDistance: 16,
      rotationDeg: 0,
    } as {
      leftEye: { x: number; y: number };
      rightEye: { x: number; y: number };
      eyeDistance: number;
      rotationDeg: number;
    },
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

  // Trigger Meme Toast (Now auto-dismisses in 3 seconds with streamlined copy)
  const triggerToast = useCallback(
    (item: Omit<MemeToastItem, 'id'>) => {
      if (isMeetingMode) return; // Silent in meeting mode
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newToast: MemeToastItem = { ...item, id };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    [isMeetingMode]
  );

  // Score modifier helper (100% Real Measured Data grouped by 5-minute units)
  const modifyScore = useCallback(
    (delta: number, reason: string, icon: string = '⚡') => {
      setHealthScore((prev) => {
        const nextScore = Math.max(0, Math.min(120, prev + delta));
        const now = new Date();
        const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(roundedMinutes).padStart(2, '0');
        const timeSlot = `${hh}:${mm}`;

        setTrendHistory((history) => {
          const newPoint: HealthTrendPoint = {
            time: timeSlot,
            timestamp: now.getTime(),
            score: nextScore,
            fatigueIndex: delta < 0 ? Math.min(10, Math.max(2, Math.abs(delta) * 2)) : 1,
            eventDelta: delta,
            eventName: reason.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 10),
            eventType: delta < 0 ? 'penalty' : delta > 0 ? 'reward' : 'info',
          };

          // If current 5-minute slot already exists, update latest score & event in this 5-min window
          if (history.length > 0 && history[history.length - 1].time === timeSlot) {
            const updated = [...history];
            updated[updated.length - 1] = newPoint;
            return updated;
          }

          return [...history, newPoint].slice(-40);
        });

        return nextScore;
      });
      logEvent(reason, delta, delta < 0 ? 'penalty' : 'reward', icon);
    },
    [logEvent]
  );

  // Auto record health score every 5-minute real-time interval
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(roundedMinutes).padStart(2, '0');
      const timeSlot = `${hh}:${mm}`;

      setTrendHistory((history) => {
        if (history.length > 0 && history[history.length - 1].time === timeSlot) {
          return history;
        }
        return [
          ...history,
          {
            time: timeSlot,
            timestamp: now.getTime(),
            score: healthScore,
            fatigueIndex: healthScore < 80 ? 3 : 1,
            eventDelta: 0,
            eventName: '定時健康檢查',
            eventType: 'info' as const,
          },
        ].slice(-40);
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [healthScore]);

  // Cross-tab & Multi-interface Hazard Dispatcher (OS Notifications, TTS Voice, Title Flashing, PiP)
  const dispatchHazardAlert = useCallback(
    (hazard: ActiveHazardAlert, voiceSpeechText: string) => {
      setActiveHazard(hazard);
      // Do not auto-dismiss hazard alert! Keep page open until user action
      if (activeHazardTimeoutRef.current) {
        clearTimeout(activeHazardTimeoutRef.current);
      }

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

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleRecordWater = useCallback(() => {
    setIsSedentaryLocked(false);
    detectionRef.current.consecutiveDeskSecs = 0;
    modifyScore(+10, '補充水分 300ml：成功解除久坐鎖定 (+10點)', '💧');
    soundSynth.playWaterDrink();
    logEvent('補充水分 300ml：細胞獲得修復，久坐鎖定成功解除', 10, 'reward', '💧');
  }, [modifyScore, logEvent]);

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
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /* ====================================================================
     Detection Triggers (Both real-time AI & demo triggers)
     ==================================================================== */
  // Helper to capture a cybernetic candid webcam snapshot directly from camera feed
  const takeCandidWebcamSnapshot = useCallback(
    (customLabel: string = 'HOURLY_HYDRATION_CHECK', expressionType?: 'yawn' | 'blink' | 'frown' | 'candid'): {
      image: string;
      faceCenter: { x: number; y: number };
      eyePositions: {
        leftEye: { x: number; y: number };
        rightEye: { x: number; y: number };
        eyeDistance: number;
        rotationDeg: number;
      };
    } | null => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
        return null;
      }
      try {
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 480;

        // Standard 4:3 photobooth canvas matching native webcam proportions
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const bounds = detectionRef.current.latestFaceBounds;
        const hasFace = detectionRef.current.isFaceCurrentlyPresent && bounds;

        let computedFaceCenter = { x: 50, y: 34 };
        let computedEyePositions = {
          leftEye: { x: 42, y: 32 },
          rightEye: { x: 58, y: 32 },
          eyeDistance: 16,
          rotationDeg: 0,
        };

        if (hasFace) {
          // Natural, comfortable portrait framing:
          // The face occupies ~30% of frame height with ample headroom, hair, shoulders and chest.
          // Gently trims the lower edge to avoid keyboard / desk clutter.
          const faceW = (bounds.maxX - bounds.minX) * vw;
          const faceH = (bounds.maxY - bounds.minY) * vh;
          const faceCenterX = ((bounds.minX + bounds.maxX) / 2) * vw;
          const faceCenterY = ((bounds.minY + bounds.maxY) / 2) * vh;

          // Target crop height: preserves 90%~95% of vertical field of view
          let targetCropH = Math.min(vh, Math.max(vh * 0.90, faceH * 2.9));
          let targetCropW = targetCropH * (canvas.width / canvas.height);

          if (targetCropW > vw) {
            targetCropW = vw;
            targetCropH = targetCropW / (canvas.width / canvas.height);
          }

          const cropX = Math.max(0, Math.min(vw - targetCropW, faceCenterX - targetCropW / 2));
          // Center vertically: keep eye-line comfortably in upper third (40% down)
          const cropY = Math.max(0, Math.min(vh - targetCropH, faceCenterY - targetCropH * 0.42));

          // Draw cropped & mirrored video frame (natural selfie orientation)
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(
            video,
            cropX, cropY, targetCropW, targetCropH,
            0, 0, canvas.width, canvas.height
          );
          ctx.restore();

          // Calculate PRECISE eye coordinates on mirrored canvas
          const raw = detectionRef.current.rawEyeLandmarks;
          if (raw && raw.left && raw.right) {
            const pxLeftX = raw.left.x * vw;
            const pxLeftY = raw.left.y * vh;
            const pxRightX = raw.right.x * vw;
            const pxRightY = raw.right.y * vh;

            const eye1 = {
              x: (1 - (pxLeftX - cropX) / targetCropW) * 100,
              y: ((pxLeftY - cropY) / targetCropH) * 100,
            };
            const eye2 = {
              x: (1 - (pxRightX - cropX) / targetCropW) * 100,
              y: ((pxRightY - cropY) / targetCropH) * 100,
            };

            const screenLeft = eye1.x < eye2.x ? eye1 : eye2;
            const screenRight = eye1.x < eye2.x ? eye2 : eye1;
            const dist = Math.hypot(screenRight.x - screenLeft.x, screenRight.y - screenLeft.y);
            const rot = Math.atan2(screenRight.y - screenLeft.y, screenRight.x - screenLeft.x) * (180 / Math.PI);

            computedEyePositions = {
              leftEye: {
                x: Number(Math.max(5, Math.min(95, screenLeft.x)).toFixed(2)),
                y: Number(Math.max(5, Math.min(95, screenLeft.y)).toFixed(2)),
              },
              rightEye: {
                x: Number(Math.max(5, Math.min(95, screenRight.x)).toFixed(2)),
                y: Number(Math.max(5, Math.min(95, screenRight.y)).toFixed(2)),
              },
              eyeDistance: Number(dist.toFixed(2)),
              rotationDeg: Number(rot.toFixed(2)),
            };

            computedFaceCenter = {
              x: Number(((screenLeft.x + screenRight.x) / 2).toFixed(2)),
              y: Number(((screenLeft.y + screenRight.y) / 2).toFixed(2)),
            };
          }
        } else {
          // Fallback if no face detected: preserve upper 90% of camera feed
          const cropH = vh * 0.90;
          const cropW = cropH * (canvas.width / canvas.height);
          const cropX = Math.max(0, (vw - cropW) / 2);
          const cropY = 0;

          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(
            video,
            cropX, cropY, cropW, cropH,
            0, 0, canvas.width, canvas.height
          );
          ctx.restore();
        }

        // Clean surveillance stamp: top strip only, NEVER stamp across bottom so photo is clean & pristine
        if (customLabel !== 'HOURLY_HYDRATION_CHECK') {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });
          const dateStr = now.toLocaleDateString('zh-TW');

          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(0, 0, canvas.width, 32);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 32);
          ctx.lineTo(canvas.width, 32);
          ctx.stroke();

          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`+ [OVERWATCH // 抓拍存證] +`, 12, 20);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '11px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${dateStr} ${timeStr}`, canvas.width - 12, 20);
        }

        return {
          image: canvas.toDataURL('image/jpeg', 0.92),
          faceCenter: computedFaceCenter,
          eyePositions: computedEyePositions,
        };
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
        image: yawnSnap.image,
        time: nowStr,
        timestamp: Date.now(),
        faceCenter: yawnSnap.faceCenter,
        eyePositions: yawnSnap.eyePositions,
      };
      addCandidSnapshot(yawnSnap.image, '🚨 醜照存證：打哈欠嘴巴大開崩壞瞬間', 'yawn');
    }
    const snapImage = yawnSnap?.image || '/memes/cat-yawn.jpg';

    triggerToast({
      title: '打哈欠抓包！🥱',
      desc: '偵測到張口打哈欠，醜照已存證，請喝水提神',
      badge: '-5 點',
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
        faceCenter: yawnSnap?.faceCenter,
        eyePositions: yawnSnap?.eyePositions,
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
        image: frownSnap.image,
        time: nowStr,
        timestamp: Date.now(),
        faceCenter: frownSnap.faceCenter,
        eyePositions: frownSnap.eyePositions,
      };
      addCandidSnapshot(frownSnap.image, '🚨 醜照存證：眉頭深鎖怨氣爆表', 'frown');
    }
    const snapImage = frownSnap?.image || '/memes/dog-frown.jpg';

    triggerToast({
      title: '眉頭深鎖提醒 🤔',
      desc: '偵測到緊繃皺眉，請深呼吸放鬆眉心',
      badge: '-3 點',
      badgeColor: 'bg-amber-500 text-slate-950',
      image: snapImage,
      type: 'frown',
    });
    dispatchHazardAlert(
      {
        type: 'frown',
        title: '是什麼事讓你眉頭深鎖？',
        message: '偵測到眉頭深鎖怨氣場！厭世崩壞抓拍已存檔，請深呼吸放鬆額頭！',
        badge: '扣 3 點 // 醜照抓拍',
        severity: 'warning',
        image: snapImage,
        faceCenter: frownSnap?.faceCenter,
        eyePositions: frownSnap?.eyePositions,
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
        image: blinkSnap.image,
        time: nowStr,
        timestamp: Date.now(),
        faceCenter: blinkSnap.faceCenter,
        eyePositions: blinkSnap.eyePositions,
      };
      addCandidSnapshot(blinkSnap.image, '🚨 醜照存證：雙眼半閉打瞌睡狀態', 'blink');
    }
    const snapImage = blinkSnap?.image || '/memes/idol-handsome-1.jpg';

    triggerToast({
      title: '視覺疲勞警報 👀',
      desc: '頻繁眨眼或眼皮沉重，請閉眼放鬆 10 秒',
      badge: '深層護眼',
      badgeColor: 'bg-blue-600 text-white',
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
        faceCenter: blinkSnap?.faceCenter || { x: 50.5, y: 27.6 },
        eyePositions: blinkSnap?.eyePositions || {
          leftEye: { x: 41.0, y: 28.0 },
          rightEye: { x: 60.0, y: 27.2 },
          eyeDistance: 19.0,
          rotationDeg: -2.3,
        },
        timestamp: Date.now(),
      },
      '注意！偵測到眼皮沉重，請放鬆眼眶肌肉！'
    );
  }, [modifyScore, triggerToast, dispatchHazardAlert, takeCandidWebcamSnapshot]);

  const handleScanFaceCharisma = useCallback(
    async (isAuto: boolean = false, triggerTakeoverModal: boolean = false) => {
      // If modal takeover requested, trigger modal IMMEDIATELY for instant user response
      if (triggerTakeoverModal) {
        const nowStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
        const liveSnapshot = takeCandidWebcamSnapshot('HOURLY_HYDRATION_CHECK');
        if (liveSnapshot) {
          candidSnapshotRef.current = {
            image: liveSnapshot.image,
            time: nowStr,
            timestamp: Date.now(),
            faceCenter: liveSnapshot.faceCenter,
            eyePositions: liveSnapshot.eyePositions,
          };
          addCandidSnapshot(liveSnapshot.image, `📸 工位突擊抓拍醜照`, 'scan');
        }

        const activeSnap = liveSnapshot || candidSnapshotRef.current;
        const candidImg = activeSnap?.image || '/memes/idol-handsome-1.jpg';
        const resolvedFaceCenter = activeSnap?.faceCenter || { x: 50.5, y: 27.6 };
        const resolvedEyePositions = activeSnap?.eyePositions || {
          leftEye: { x: 41.0, y: 28.0 },
          rightEye: { x: 60.0, y: 27.2 },
          eyeDistance: 19.0,
          rotationDeg: -2.3,
        };

        modifyScore(+5, '💧 整點久坐補水：喚醒細胞水光能量 (+5點)', '💧');
        try {
          soundSynth.playWaterDrink();
        } catch {}
        dispatchHazardAlert(
          {
            type: 'beauty_score',
            title: '💧 整點久坐補水 // 細胞缺水警戒',
            message: '工位久坐水分蒸發！即刻飲用 350ml 溫水放鬆甦醒，補充細胞水光！',
            badge: '久坐補水',
            severity: 'reward',
            image: candidImg,
            faceCenter: resolvedFaceCenter,
            eyePositions: resolvedEyePositions,
            timestamp: Date.now(),
          },
          '整點補水時間到！記得多喝水讓顏值飆升！'
        );
      }

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

        const nowStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
        const candidImg = candidSnapshotRef.current?.image || '/memes/idol-handsome-1.jpg';

        if (!triggerTakeoverModal && !isAuto) {
          triggerToast({
            title: `✨ AI 顏值評測：${result.score}分 [${result.rank}]`,
            desc: `${result.title}・適時補水維持好氣色`,
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
    [
      isScanningFace,
      statsSummary.yawnsCaught,
      statsSummary.frownsCaught,
      telemetry.consecutiveDeskSeconds,
      healthScore,
      takeCandidWebcamSnapshot,
      addCandidSnapshot,
      modifyScore,
      dispatchHazardAlert,
      triggerToast,
      logEvent,
    ]
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
        body: '頭部過度貼近螢幕（低於 30cm）！請靠上椅背保持最佳姿勢視距 (≥35cm)！',
        tag: 'ohg-proximity',
        requireInteraction: true,
      });
    }
  }, [modifyScore, settings.voiceAlertsEnabled, settings.desktopNotificationsEnabled, isMeetingMode]);

  const handleProximityCalibrationSuccess = useCallback(() => {
    setIsEyeStrainActive(false);
    triggerToast({
      title: '🎯 最佳護眼距離已鎖定',
      desc: '已維持最佳姿勢視距 (≥35cm)，視力防護就緒',
      badge: '校準成功',
      badgeColor: 'bg-emerald-500 text-slate-950',
      image: '/memes/cat-curious.jpg',
      type: 'blink',
    });
    logEvent('護眼雷達：成功維持最佳姿勢視距 (≥35cm) 並完成校準', 0, 'reward', '🎯');
  }, [triggerToast, logEvent]);

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
      title: '🎉 離座活動完成！',
      desc: '久坐鎖定已解除，下肢血液循環恢復',
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
        title: '☕ 離座摸魚獎勵',
        desc: `離座滿 ${minutes} 分鐘，健康存摺自動回血`,
        badge: '+10 BP',
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
      title: '🩸 超時加班警報',
      desc: '已過下班時間，請盡速打卡下班',
      badge: '-15 BP',
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

  const handleEscapeOvertime = useCallback((ranAway: boolean) => {
    if (ranAway) {
      setHealthScore((prev) => Math.min(100, prev + 20));
      triggerToast({
        title: '🏃‍♂️ 打卡下班成功！',
        desc: '拒絕無意義內卷，生命值 +20 點',
        badge: '+20 BP',
        badgeColor: 'bg-emerald-500 text-slate-950',
        type: 'general',
      });
      logEvent('【拒絕內卷】老子不幹了打卡下班！健康存摺 +20 BP', 20, 'reward', '🏃‍♂️💨');
    } else {
      logEvent('【向資本低頭】屈服於老闆的法拉利圓夢集資，繼續血汗加班。', 0, 'info', '🙇‍♂️');
    }
  }, [triggerToast, logEvent]);

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

  // Global ESC key listener to exit any open modal / takeover / screensaver
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeHazard) {
          setActiveHazard(null);
        } else if (isEyeStrainActive) {
          setIsEyeStrainActive(false);
        } else if (isSedentaryLocked) {
          setIsSedentaryLocked(false);
        } else if (isReceiptOpen) {
          setIsReceiptOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isCandidGalleryOpen) {
          setIsCandidGalleryOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    activeHazard,
    isEyeStrainActive,
    isSedentaryLocked,
    isReceiptOpen,
    isSettingsOpen,
    isCandidGalleryOpen,
  ]);

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

              // Calculate bounding box and face center coordinates (mirrored for selfie feed)
              const xs = landmarks.map((p) => p.x);
              const ys = landmarks.map((p) => p.y);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              const faceHeight = maxY - minY;
              detectionRef.current.latestFaceBounds = { minX, maxX, minY, maxY };
              const mirroredCenterX = Math.round((1 - (minX + maxX) / 2) * 100);
              const centerY = Math.round(((minY + maxY) / 2) * 100);
              detectionRef.current.latestFaceCenter = {
                x: Math.max(10, Math.min(90, mirroredCenterX)),
                y: Math.max(10, Math.min(90, centerY)),
              };

              // Calculate exact eye coordinates with full eye polygon centroid precision (mirrored for selfie feed)
              const rawLeft = landmarks[468] || (landmarks[33] && landmarks[133] ? {
                x: (landmarks[33].x + landmarks[133].x) / 2,
                y: ((landmarks[159]?.y || landmarks[33].y) + (landmarks[145]?.y || landmarks[133].y)) / 2,
              } : landmarks[159]);
              const rawRight = landmarks[473] || (landmarks[263] && landmarks[362] ? {
                x: (landmarks[263].x + landmarks[362].x) / 2,
                y: ((landmarks[386]?.y || landmarks[263].y) + (landmarks[374]?.y || landmarks[362].y)) / 2,
              } : landmarks[386]);

              if (rawLeft && rawRight) {
                detectionRef.current.rawEyeLandmarks = {
                  left: { x: rawLeft.x, y: rawLeft.y },
                  right: { x: rawRight.x, y: rawRight.y },
                };
                const eye1 = {
                  x: Math.round((1 - rawLeft.x) * 100),
                  y: Math.round(rawLeft.y * 100),
                };
                const eye2 = {
                  x: Math.round((1 - rawRight.x) * 100),
                  y: Math.round(rawRight.y * 100),
                };
                const leftEye = eye1.x < eye2.x ? eye1 : eye2;
                const rightEye = eye1.x < eye2.x ? eye2 : eye1;
                const dist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
                const rot = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
                detectionRef.current.latestEyePositions = {
                  leftEye: {
                    x: Math.max(10, Math.min(90, leftEye.x)),
                    y: Math.max(10, Math.min(90, leftEye.y)),
                  },
                  rightEye: {
                    x: Math.max(10, Math.min(90, rightEye.x)),
                    y: Math.max(10, Math.min(90, rightEye.y)),
                  },
                  eyeDistance: dist,
                  rotationDeg: rot,
                };
              }

              // Draw Facial landmarks if toggled
              if (showMesh) {
                drawFacialLandmarks(ctx, landmarks, canvas.width, canvas.height, '#06b6d4');
              }

              // 1. MAR (Jaw Open) & Speech Activity
              const jawOpenShape = blendshapes.find((b) => b.categoryName === 'jawOpen');
              const jawVal = jawOpenShape ? jawOpenShape.score : computeFallbackMAR(landmarks);

              // 2. Head Orientation Kinematics: Pitch (Looking Down) & Yaw (Looking Sideways)
              const foreheadPt = landmarks[10];
              const chinPt = landmarks[152];
              const nosePt = landmarks[1] || landmarks[4];
              const headVerticalSpan = Math.max(0.001, (chinPt?.y ?? 1) - (foreheadPt?.y ?? 0));
              const noseRelY = ((nosePt?.y ?? 0.5) - (foreheadPt?.y ?? 0)) / headVerticalSpan;
              // When looking down or camera angle is low, noseRelY increases (> 0.54)
              const isLookingDown = noseRelY > 0.54;

              // Estimate head yaw / looking sideways (nose #1 relative to outer eye corners #33 and #263)
              const leftEyeCornerPt = landmarks[33];
              const rightEyeCornerPt = landmarks[263];
              let isLookingSideways = false;
              if (nosePt && leftEyeCornerPt && rightEyeCornerPt) {
                const distToL = Math.abs(nosePt.x - leftEyeCornerPt.x);
                const distToR = Math.abs(rightEyeCornerPt.x - nosePt.x);
                const totalSpanX = Math.max(0.001, distToL + distToR);
                const yawBalance = distToL / totalSpanX; // ~0.50 when facing forward
                const yawDev = Math.abs(yawBalance - 0.50) * 2;
                isLookingSideways = yawDev > 0.20;
              }

              // 3. Multi-Expression Synchronous Extraction (Facial Affect Analysis)
              const smileL =
                blendshapes.find((b) => b.categoryName === 'mouthSmileLeft')?.score || 0;
              const smileR =
                blendshapes.find((b) => b.categoryName === 'mouthSmileRight')?.score || 0;
              const smileVal = (smileL + smileR) / 2;

              const mouthFrownL =
                blendshapes.find((b) => b.categoryName === 'mouthFrownLeft')?.score || 0;
              const mouthFrownR =
                blendshapes.find((b) => b.categoryName === 'mouthFrownRight')?.score || 0;
              const mouthFrownVal = (mouthFrownL + mouthFrownR) / 2;

              const mouthPressL =
                blendshapes.find((b) => b.categoryName === 'mouthPressLeft')?.score || 0;
              const mouthPressR =
                blendshapes.find((b) => b.categoryName === 'mouthPressRight')?.score || 0;
              const mouthPucker =
                blendshapes.find((b) => b.categoryName === 'mouthPucker')?.score || 0;
              const mouthPressVal = Math.max((mouthPressL + mouthPressR) / 2, mouthPucker);

              const mouthShrugLower =
                blendshapes.find((b) => b.categoryName === 'mouthShrugLower')?.score || 0;
              const mouthShrugUpper =
                blendshapes.find((b) => b.categoryName === 'mouthShrugUpper')?.score || 0;

              const noseSneerL =
                blendshapes.find((b) => b.categoryName === 'noseSneerLeft')?.score || 0;
              const noseSneerR =
                blendshapes.find((b) => b.categoryName === 'noseSneerRight')?.score || 0;
              const noseSneerVal = (noseSneerL + noseSneerR) / 2;

              const cheekSquintL =
                blendshapes.find((b) => b.categoryName === 'cheekSquintLeft')?.score || 0;
              const cheekSquintR =
                blendshapes.find((b) => b.categoryName === 'cheekSquintRight')?.score || 0;
              const cheekSquintVal = (cheekSquintL + cheekSquintR) / 2;

              const eyeWideL =
                blendshapes.find((b) => b.categoryName === 'eyeWideLeft')?.score || 0;
              const eyeWideR =
                blendshapes.find((b) => b.categoryName === 'eyeWideRight')?.score || 0;
              const eyeWideVal = (eyeWideL + eyeWideR) / 2;

              // Geometric Lip Corner Curvature (Landmarks #61, #291 vs Lip Center #13, #14)
              const lipCornerL = landmarks[61];
              const lipCornerR = landmarks[291];
              const lipCenterTop = landmarks[13] || landmarks[0];
              const lipCenterBottom = landmarks[14] || landmarks[17];
              let lipCornerElevation = 0;
              if (lipCornerL && lipCornerR && lipCenterTop && lipCenterBottom && faceHeight > 0.05) {
                const avgCornerY = (lipCornerL.y + lipCornerR.y) / 2;
                const avgCenterY = (lipCenterTop.y + lipCenterBottom.y) / 2;
                lipCornerElevation = (avgCenterY - avgCornerY) / faceHeight;
              }

              // 4. Synchronous Frown & Eyebrow Tension Evaluation
              const browDownL =
                blendshapes.find((b) => b.categoryName === 'browDownLeft')?.score || 0;
              const browDownR =
                blendshapes.find((b) => b.categoryName === 'browDownRight')?.score || 0;
              const browLowerer =
                blendshapes.find((b) => b.categoryName === 'browLowerer')?.score || 0;

              const avgBrowDown = (browDownL + browDownR) / 2;
              const maxBrowDown = Math.max(browDownL, browDownR);
              // True frowning is bilateral; unilateral twitches or side glances are penalized
              const browSymmetry = maxBrowDown > 0.04 ? avgBrowDown / maxBrowDown : 1;
              let baseBrowScore = Math.max(
                avgBrowDown * 3.6 * (0.4 + 0.6 * browSymmetry),
                browLowerer * 3.2
              );

              // Multi-Expression Synergy & Inhibitory Cross-Validation:
              // A. Smile & Laughter Inhibition (smiling/grinning crinkles brows but is NOT stress)
              if (smileVal > 0.06 || lipCornerElevation > 0.010) {
                const smileImpact = Math.max((smileVal - 0.06) * 6, (lipCornerElevation - 0.010) * 35);
                baseBrowScore *= Math.max(0.05, 1 - Math.min(0.95, smileImpact));
              }

              // B. Speech / Talking / Open Mouth Inhibition (conversational prosody)
              if (jawVal > 0.18) {
                const jawImpact = (jawVal - 0.18) * 3.0;
                baseBrowScore *= Math.max(0.15, 1 - Math.min(0.85, jawImpact));
              }

              // C. Orientation Inhibition (Looking down at desk or sideways at monitor)
              if (isLookingDown) {
                baseBrowScore *= 0.45;
              }
              if (isLookingSideways) {
                baseBrowScore *= 0.40;
              }

              // D. Micro-Expression Stress Synergy (Corroborating tension in lower face & nose)
              const lowerFaceTension = Math.max(
                mouthFrownVal * 1.5,
                mouthPressVal * 1.2,
                mouthShrugLower * 1.3,
                noseSneerVal * 1.5
              );
              const strainMultiplier = 1.0 + Math.min(0.40, lowerFaceTension * 1.2);

              // Geometric Inner Eyebrow Compression (#107 vs #336)
              const rightInnerBrow = landmarks[107] || landmarks[66];
              const leftInnerBrow = landmarks[336] || landmarks[296];
              const rightEyeCorner = landmarks[33];
              const leftEyeCorner = landmarks[263];
              let geomConvergence = 0;
              if (
                !isLookingSideways &&
                !isLookingDown &&
                smileVal < 0.06 &&
                rightInnerBrow &&
                leftInnerBrow &&
                rightEyeCorner &&
                leftEyeCorner
              ) {
                const eyeSpan = Math.max(0.01, Math.hypot(leftEyeCorner.x - rightEyeCorner.x, leftEyeCorner.y - rightEyeCorner.y));
                const browSpan = Math.hypot(leftInnerBrow.x - rightInnerBrow.x, leftInnerBrow.y - rightInnerBrow.y);
                const ratio = browSpan / eyeSpan;
                if (ratio < 0.42) {
                  geomConvergence = Math.min(1.2, ((0.42 - ratio) / 0.05) * 1.2);
                }
              }

              // Vertical Eyebrow Drop towards Eyes (#107 & #336 vs #159 & #386)
              const rEyeTop = landmarks[159] || landmarks[386];
              const lEyeTop = landmarks[386] || landmarks[159];
              let geomVerticalLowering = 0;
              if (
                !isLookingDown &&
                !isLookingSideways &&
                smileVal < 0.06 &&
                rightInnerBrow &&
                leftInnerBrow &&
                rEyeTop &&
                lEyeTop &&
                faceHeight > 0.05
              ) {
                const rDrop = (rEyeTop.y - rightInnerBrow.y) / faceHeight;
                const lDrop = (lEyeTop.y - leftInnerBrow.y) / faceHeight;
                const avgDrop = (rDrop + lDrop) / 2;
                if (avgDrop < 0.105) {
                  geomVerticalLowering = Math.min(1.2, ((0.105 - avgDrop) / 0.035) * 1.2);
                }
              }

              // Final integrated Brow Stress Score:
              // Geometry only amplifies if there is genuine brow muscle engagement (baseBrowScore >= 0.15)
              const hasGenuineBrowMovement = baseBrowScore >= 0.15;
              const geomFactor = hasGenuineBrowMovement
                ? Math.max(geomConvergence, geomVerticalLowering)
                : 0;

              const rawBrowPressure = Math.max(
                baseBrowScore * strainMultiplier,
                hasGenuineBrowMovement ? (baseBrowScore * 0.7 + geomFactor * 0.3) * strainMultiplier : baseBrowScore
              );
              const prevBrow = detectionRef.current.latestBrowPressure ?? rawBrowPressure;
              const browPressure = Number((prevBrow * 0.35 + rawBrowPressure * 0.65).toFixed(2));
              detectionRef.current.latestBrowPressure = browPressure;
              const frownVal = browPressure;

              // 5. Proximity / Screen Distance
              const stableBoneSpan = foreheadPt && chinPt ? Math.abs(chinPt.y - foreheadPt.y) * 1.28 : faceHeight;
              const rawProximity = Math.round(stableBoneSpan * 100);
              const prevProximity = detectionRef.current.latestProximityPct || rawProximity;
              const proximityPct = Math.round(prevProximity * 0.70 + rawProximity * 0.30);
              detectionRef.current.latestProximityPct = proximityPct;

              // 6. Blinking & Eye Vitality & Camera Closed Eye Detection
              const blinkL =
                blendshapes.find((b) => b.categoryName === 'eyeBlinkLeft')?.score || 0;
              const blinkR =
                blendshapes.find((b) => b.categoryName === 'eyeBlinkRight')?.score || 0;
              const ear = computeFallbackEAR(landmarks);
              
              // Dynamic thresholds according to head pitch
              const earBlink = ear < (isLookingDown ? 0.12 : 0.14)
                ? Math.max(0, Math.min(1, ((isLookingDown ? 0.12 : 0.14) - ear) / 0.08))
                : 0;
              const blinkAvg = (blinkL + blinkR) / 2;
              const blinkScore = Math.max(blinkAvg, earBlink);
              
              // Calibrated true eye closure thresholds:
              // Looking down naturally lowers eyelids to ~0.40-0.55 without closing eyes.
              // A real complete blink requires eyelids to fully meet (>= 0.65 straight, >= 0.78 when tilted down).
              const bothEyesClosed = blinkL >= (isLookingDown ? 0.70 : 0.58) && blinkR >= (isLookingDown ? 0.70 : 0.58);
              const avgClosed = blinkAvg >= (isLookingDown ? 0.78 : 0.65);
              const isEyesClosedNow = (bothEyesClosed || avgClosed) && (ear < 0.13 || blinkAvg > 0.72);

              const eyeOpenVal = Math.max(0, 1 - blinkScore);
              const browRelaxVal = Math.max(0, 1 - frownVal);

              // Store latest features for AI Charisma Scanner
              detectionRef.current.latestSmile = smileVal;
              detectionRef.current.latestBrowRelaxation = browRelaxVal;
              detectionRef.current.latestEyeOpenness = eyeOpenVal;
              detectionRef.current.latestProximityPct = proximityPct;

              // Robust Blink Impulse & Eye Fatigue State Machine:
              // A real human blink lasts 60ms ~ 400ms.
              // Requires at least 280ms spacing between distinct blinks to prevent multi-triggering.
              if (isEyesClosedNow) {
                if (!detectionRef.current.wasBlinking) {
                  detectionRef.current.wasBlinking = true;
                  detectionRef.current.blinkClosureStartTime = now;
                }
              } else {
                if (detectionRef.current.wasBlinking) {
                  const closureDuration = now - detectionRef.current.blinkClosureStartTime;
                  // Regular human full blink: 60ms ~ 400ms
                  if (closureDuration >= 60 && closureDuration <= 400) {
                    if (now - detectionRef.current.lastBlinkPeakTime > 280) {
                      detectionRef.current.lastBlinkPeakTime = now;
                      detectionRef.current.blinkTimestamps.push(now);
                    }
                  }
                  detectionRef.current.wasBlinking = false;
                }
              }

              // Prune old blink timestamps (> 5.0s window per requirement: 5秒3次才開啟)
              detectionRef.current.blinkTimestamps = detectionRef.current.blinkTimestamps.filter(
                (t) => now - t <= 5000
              );

              // Dual-trigger criteria:
              // Criterion 1: Rapid flutter / dry eye (>= 3 full blinks within 5.0 seconds)
              const isRapidBlinking = detectionRef.current.blinkTimestamps.length >= 3;

              // Criterion 2: Prolonged eye closure (eyes closed continuously for >= 2.2s while sitting)
              const prolongedClosureDuration = detectionRef.current.wasBlinking
                ? now - detectionRef.current.blinkClosureStartTime
                : 0;
              const isProlongedClosed = prolongedClosureDuration >= 2200;

              const isFrequentBlinkingNow = isRapidBlinking || isProlongedClosed;

              if (
                isFrequentBlinkingNow &&
                detectionRef.current.blinkCooldown <= 0 &&
                !activeHazardRef.current
              ) {
                handleBlinkPenalty();
                detectionRef.current.blinkCooldown = 25; // 25s cooldown
                detectionRef.current.blinkTimestamps = [];
                detectionRef.current.wasBlinking = false;
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

              // Yawn vs Laugh Distinction Check:
              // Laugh has upturned lip corners, cheek squint / cheek elevation, or strong smile.
              // Yawn has vertical jaw dropping, NO mouth smile, NO cheek squint, and sustained duration.
              const isLaughingNow =
                smileVal > 0.22 || (smileVal > 0.15 && cheekSquintVal > 0.18) || lipCornerElevation > 0.035;
              const isYawningNow = jawVal > 0.46 && !isLaughingNow && cheekSquintVal < 0.15;
              if (isYawningNow) {
                if (!detectionRef.current.yawnStartTime) {
                  detectionRef.current.yawnStartTime = performance.now();
                }
                const elapsedYawn = (performance.now() - detectionRef.current.yawnStartTime) / 1000;
                if (elapsedYawn > 1.5 && detectionRef.current.yawnCooldown <= 0 && !activeHazardRef.current) {
                  handleYawnPenalty();
                  detectionRef.current.yawnCooldown = 8; // 8s cooldown
                }
              } else {
                detectionRef.current.yawnStartTime = null;
              }

              // Frown Trigger Check (Brow Pressure >= 0.75 sustained for 1.0s triggers frown alert)
              // Requiring 1.0s sustained hold with multi-expression corroboration ensures reading and gaze shifts do not trigger alerts
              const isFrowningNow = frownVal >= 0.75;
              if (isFrowningNow) {
                if (!detectionRef.current.frownStartTime) {
                  detectionRef.current.frownStartTime = performance.now();
                }
                const elapsedFrown =
                  (performance.now() - detectionRef.current.frownStartTime) / 1000;
                if (elapsedFrown >= 1.0 && detectionRef.current.frownCooldown <= 0 && !activeHazardRef.current) {
                  handleFrownPenalty();
                  detectionRef.current.frownCooldown = 25; // 25s cooldown
                }
              } else {
                detectionRef.current.frownStartTime = null;
              }

              // Proximity Trigger Check (>64% indicates distance < 30cm, require 1.5s sustained duration)
              // Optimal posture (>= 35cm) is <= 55% of frame; transition is 30-35cm (56%~64%)
              const isTooCloseNow = proximityPct > 64;
              if (isTooCloseNow) {
                if (!detectionRef.current.proximityStartTime) {
                  detectionRef.current.proximityStartTime = performance.now();
                }
                const elapsedClose =
                  (performance.now() - detectionRef.current.proximityStartTime) / 1000;
                if (
                  elapsedClose >= 1.5 &&
                  !isEyeStrainActive &&
                  (detectionRef.current.proximityCooldown || 0) <= 0
                ) {
                  handleProximityBlur();
                  detectionRef.current.proximityCooldown = 25; // 25s cooldown
                }
              } else {
                detectionRef.current.proximityStartTime = null;
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
              if ((detectionRef.current.proximityCooldown || 0) > 0) {
                detectionRef.current.proximityCooldown -= delta;
              }

              // Evaluate real-time rich emotion state with full kinematics
              const currentEmotion = evaluateRealtimeEmotion({
                smileVal,
                frownVal,
                jawVal,
                lipCornerElevation,
                mouthFrownVal,
                mouthPressVal,
                cheekSquintVal,
                eyeWideVal,
                blinkScore,
                consecutiveDeskSecs: detectionRef.current.consecutiveDeskSecs,
                isFrequentBlinking: isFrequentBlinkingNow,
              });

              // Update Telemetry state with real-time camera eye closure
              setTelemetry({
                mar: jawVal,
                frown: frownVal,
                proximity: proximityPct,
                blinkScore,
                ear,
                isEyesClosed: isEyesClosedNow,
                blinkCountWindow: detectionRef.current.blinkTimestamps.length,
                prolongedCloseSeconds: Number((prolongedClosureDuration / 1000).toFixed(1)),
                smileScore: smileVal,
                emotion: currentEmotion,
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
              detectionRef.current.latestFaceBounds = null;
              detectionRef.current.consecutiveAwaySecs += delta;
              detectionRef.current.consecutiveDeskSecs = 0;
              detectionRef.current.yawnStartTime = null;
              detectionRef.current.frownStartTime = null;

              // 離座機制：從離座 5 分鐘 (300 秒) 後開啟機制，出現離座計時器與健康點數 5 分鐘單位動態特效
              if (
                detectionRef.current.consecutiveAwaySecs >= 300 &&
                (!activeHazardRef.current || activeHazardRef.current.type !== 'slack')
              ) {
                dispatchHazardAlert(
                  {
                    type: 'slack',
                    title: '☕ 離座摸魚健康修復 // 薪水小偷 Lv.MAX',
                    message: '已離座超過 5 分鐘！離座計時器持續進行中，健康存摺點數每 5 分鐘自動進帳！',
                    badge: '離座 5 分鐘獎勵',
                    severity: 'reward',
                    image: '/memes/cat-chill.jpg',
                    timestamp: Date.now(),
                  },
                  '離座超過 5 分鐘，離座健康點數累積中！'
                );
              }

              setTelemetry((prev) => ({
                ...prev,
                mar: 0,
                frown: 0,
                proximity: 0,
                blinkScore: 0,
                ear: undefined,
                isEyesClosed: false,
                smileScore: 0,
                emotion: undefined,
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

      // 2. Eye Strain Blur - Controlled strictly by distance standard in EyeStrainBlurOverlay
      // (No auto-timer timeout; only unlocked when distance meets >= 55cm standard for required duration)

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
            image: snapshot.image,
            time: timeStr,
            timestamp: Date.now(),
            faceCenter: snapshot.faceCenter,
            eyePositions: snapshot.eyePositions,
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
    if (activeHazardTimeoutRef.current) {
      clearTimeout(activeHazardTimeoutRef.current);
      activeHazardTimeoutRef.current = null;
    }
  }, []);

  const handleStartStretchFromYawn = useCallback(() => {
    setActiveHazard(null);
    if (activeHazardTimeoutRef.current) {
      clearTimeout(activeHazardTimeoutRef.current);
      activeHazardTimeoutRef.current = null;
    }
    setStretchScreensaverReason('yawn');
    setIsStretchScreensaverOpen(true);
  }, []);

  const handleStartStretchFromSedentary = useCallback(() => {
    setStretchScreensaverReason('sedentary');
    setIsStretchScreensaverOpen(true);
  }, []);

  const handleEmergencyOverride = useCallback(() => {
    setIsSedentaryLocked(false);
    setIsEyeStrainActive(false);
    setActiveHazard(null);
    if (activeHazardTimeoutRef.current) {
      clearTimeout(activeHazardTimeoutRef.current);
      activeHazardTimeoutRef.current = null;
    }
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
      title: '🧘 站立動態體操完成！',
      desc: '脊椎有效減壓，健康存摺 +15 點',
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
            className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-2 sm:px-2.5 py-1 rounded text-[10px] sm:text-[11px] transition transform active:scale-95 border border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.25)]"
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">[RECEIPT]</span>
            <span className="sm:hidden">結算</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-5">
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
              onOpenCandidGallery={() => setIsCandidGalleryOpen(true)}
              candidCount={candidGallery.length}
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
              currentEmotion={telemetry.emotion}
            />

            {/* AI Facial Charisma Radar & Beauty Rating Card */}
            <FacialScoreCard
              scoreData={faceScoreData}
              isScanning={isScanningFace}
              onTriggerScan={() => handleScanFaceCharisma(false)}
              isFacePresent={telemetry.isFacePresent}
              onOpenCandidGallery={() => setIsCandidGalleryOpen(true)}
              candidCount={candidGallery.length}
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
              currentEmotion={telemetry.emotion}
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

      <CandidGalleryModal
        isOpen={isCandidGalleryOpen}
        onClose={() => setIsCandidGalleryOpen(false)}
        gallery={candidGallery}
        onDeleteSnapshot={handleDeleteSnapshot}
        onClearGallery={handleClearGallery}
      />

      {/* Yawn & Hazard Fullscreen Screensaver Meme Takeover Modal */}
      {activeHazard && (
        <ScreensaverMemeTakeover
          alert={activeHazard}
          telemetry={telemetry}
          onDismiss={handleDismissHazard}
          onStartStretchWorkout={() => {
            setIsStretchScreensaverOpen(true);
            handleDismissHazard();
          }}
          onEscapeOvertime={handleEscapeOvertime}
        />
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

/**
 * Fallback EAR (Eye Aspect Ratio) calculation from MediaPipe landmarks
 * Normal open eyes: ~0.24 - 0.35
 * Closed eyes: < 0.20
 */
function computeFallbackEAR(landmarks: Array<{ x: number; y: number }>): number {
  if (!landmarks || landmarks.length < 400) return 0.28;
  // Left eye: outer corner 33, inner corner 133, top 159, bottom 145
  const lTop = landmarks[159];
  const lBottom = landmarks[145];
  const lLeft = landmarks[33];
  const lRight = landmarks[133];
  let leftEAR = 0.28;
  if (lTop && lBottom && lLeft && lRight) {
    const lH = Math.hypot(lRight.x - lLeft.x, lRight.y - lLeft.y) || 1;
    const lV = Math.hypot(lBottom.x - lTop.x, lBottom.y - lTop.y);
    leftEAR = lV / lH;
  }

  // Right eye: inner corner 362, outer corner 263, top 386, bottom 374
  const rTop = landmarks[386];
  const rBottom = landmarks[374];
  const rLeft = landmarks[362];
  const rRight = landmarks[263];
  let rightEAR = 0.28;
  if (rTop && rBottom && rLeft && rRight) {
    const rH = Math.hypot(rRight.x - rLeft.x, rRight.y - rLeft.y) || 1;
    const rV = Math.hypot(rBottom.x - rTop.x, rBottom.y - rTop.y);
    rightEAR = rV / rH;
  }

  return (leftEAR + rightEAR) / 2;
}
