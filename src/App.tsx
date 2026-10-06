import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { getGestureRecognizer, isPeaceSignLandmarks } from './utils/gestureRecognizer';
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
import { InitialOnboardingModal } from './components/InitialOnboardingModal';
import { evaluateFaceScoreWithGemini, computeLocalFaceScore } from './utils/faceScoreEvaluator';
import {
  fireDesktopNotification,
  speakVoiceAlert,
  startTitleFlashing,
  stopTitleFlashing,
  broadcastCrossTabEvent,
  subscribeCrossTabEvents,
} from './utils/crossTabAlert';

const getTodayDateKey = () => new Date().toLocaleDateString('en-CA');

export const getBaselineCharismaScore = (): FaceCharismaScore => ({
  score: 95,
  title: '氣場充沛 (精神煥發)',
  rank: 'SSS',
  comment: '面色紅潤光澤，雙眼聚焦神采奕奕，面部放鬆自然！社畜戰力處於全天頂峰狀態。',
  metrics: {
    radiance: 92,
    sparkle: 94,
    smilePower: 90,
    symmetry: 96,
    charisma: 95,
  },
  timestamp: Date.now(),
  highlightTag: '頂峰狀態',
  source: 'SYSTEM_BASELINE',
  savedDate: getTodayDateKey(),
});

interface DailySessionState {
  date: string;
  sessionStartTime?: number;
  lastHydrationTime?: number;
  deskSessionStartTime?: number;
  healthScore: number;
  trendHistory: HealthTrendPoint[];
  statsSummary: {
    yawnsCaught: number;
    frownsCaught: number;
    sedentaryLocksCount: number;
    slackMinutesEarned: number;
    overtimeMinutes: number;
  };
  events: HealthEvent[];
  isClockedIn?: boolean;
  isClockedOut?: boolean;
}

const loadTodaySessionState = (): DailySessionState | null => {
  try {
    const raw = localStorage.getItem('overwatch_daily_state');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const today = getTodayDateKey();
    if (parsed && parsed.date === today) {
      const clockInDate = localStorage.getItem('overwatch_clockin_date');
      const isClockedInToday = clockInDate === today;

      const todayTrendHistory = Array.isArray(parsed.trendHistory)
        ? parsed.trendHistory.filter((pt: HealthTrendPoint) => {
            if (!pt.timestamp) return true;
            return new Date(pt.timestamp).toLocaleDateString('en-CA') === today;
          })
        : [];

      return {
        ...parsed,
        isClockedIn: isClockedInToday ? (parsed.isClockedIn !== undefined ? parsed.isClockedIn : true) : false,
        trendHistory: isClockedInToday ? (todayTrendHistory.length > 0 ? todayTrendHistory : []) : [],
      };
    } else {
      // Purge old date state from previous days
      localStorage.removeItem('overwatch_daily_state');
      localStorage.removeItem('overwatch_last_face_score');
      localStorage.removeItem('overwatch_trend_snapshot');
      localStorage.removeItem('overwatch_clockin_date');
    }
  } catch (err) {
    console.warn('Failed to load daily session state:', err);
  }
  return null;
};

export default function App() {
  // Restore today's cached session state if reloaded or reopened on the same day
  const initialSession = useMemo(() => loadTodaySessionState(), []);

  // Application State
  const [healthScore, setHealthScore] = useState<number>(() => {
    return initialSession ? initialSession.healthScore : 100;
  });

  const [trendHistory, setTrendHistory] = useState<HealthTrendPoint[]>(() => {
    if (initialSession && Array.isArray(initialSession.trendHistory) && initialSession.trendHistory.length > 0) {
      return initialSession.trendHistory;
    }
    return [];
  });
  const [settings, setSettings] = useState<GuardianSettings>(() => {
    try {
      const saved = localStorage.getItem('overwatch_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          baseAge: Number(parsed.baseAge) || 25,
          offWorkTime: parsed.offWorkTime || '17:30',
          sedentaryLimitMinutes: Number(parsed.sedentaryLimitMinutes) || 45,
          hydrationIntervalMinutes: Number(parsed.hydrationIntervalMinutes) || 60,
          soundEnabled: parsed.soundEnabled ?? true,
          desktopNotificationsEnabled: parsed.desktopNotificationsEnabled ?? true,
          voiceAlertsEnabled: parsed.voiceAlertsEnabled ?? true,
        };
      }
    } catch {}
    return {
      baseAge: 25,
      offWorkTime: '17:30',
      sedentaryLimitMinutes: 45,
      hydrationIntervalMinutes: 60,
      soundEnabled: true,
      desktopNotificationsEnabled: true,
      voiceAlertsEnabled: true,
    };
  });

  // First-time onboarding popup state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('overwatch_user_initialized');
    } catch {
      return false;
    }
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
  const [frozenReceiptStats, setFrozenReceiptStats] = useState<DailySummaryStats | null>(null);
  const [frozenReceiptEvents, setFrozenReceiptEvents] = useState<HealthEvent[] | null>(null);
  const [isSedentaryLocked, setIsSedentaryLocked] = useState<boolean>(false);
  const [sedentaryRemainingSeconds, setSedentaryRemainingSeconds] = useState<number>(15);
  const [isStretchScreensaverOpen, setIsStretchScreensaverOpen] = useState<boolean>(false);
  const [stretchScreensaverReason, setStretchScreensaverReason] = useState<'yawn' | 'sedentary' | 'manual'>('sedentary');

  const [isEyeStrainActive, setIsEyeStrainActive] = useState<boolean>(false);
  const [eyeStrainProgress, setEyeStrainProgress] = useState<number>(0);
  const [eyeStrainRemaining, setEyeStrainRemaining] = useState<number>(5);

  const [isOvertime, setIsOvertime] = useState<boolean>(false);
  const [overtimeMinutes, setOvertimeMinutes] = useState<number>(0);
  const [isClockedIn, setIsClockedIn] = useState<boolean>(() => {
    try {
      const today = getTodayDateKey();
      // If brand new user, initial onboarding completion will automatically clock them in
      if (!localStorage.getItem('overwatch_user_initialized')) {
        return false;
      }
      const lastClockInDate = localStorage.getItem('overwatch_clockin_date');
      if (lastClockInDate === today) {
        if (initialSession) {
          return initialSession.isClockedIn !== undefined ? initialSession.isClockedIn : true;
        }
        return true;
      }
      // Different day / cross-day rollover: requires clicking Clock In for the new day
      return false;
    } catch {
      return false;
    }
  });
  const [isClockedOut, setIsClockedOut] = useState<boolean>(() => {
    return initialSession ? !!initialSession.isClockedOut : false;
  });
  const [isOffWorkPunchModalOpen, setIsOffWorkPunchModalOpen] = useState<boolean>(false);

  // Stats Counters for Daily Summary Card
  const [statsSummary, setStatsSummary] = useState(() => {
    if (initialSession && initialSession.statsSummary) {
      return initialSession.statsSummary;
    }
    return {
      yawnsCaught: 0,
      frownsCaught: 0,
      sedentaryLocksCount: 0,
      slackMinutesEarned: 0,
      overtimeMinutes: 0,
    };
  });

  // Events & Toasts
  const [events, setEvents] = useState<HealthEvent[]>(() => {
    if (initialSession && Array.isArray(initialSession.events) && initialSession.events.length > 0) {
      return initialSession.events;
    }
    return [
      {
        id: 'init',
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        type: 'system',
        message: 'OVERWHELTCH 啟動：100% 本地即時 AI 臉部健康監視器',
        delta: 0,
        icon: '🛡️',
      },
    ];
  });
  const [toasts, setToasts] = useState<MemeToastItem[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(() => {
    return initialSession?.sessionStartTime || Date.now();
  });
  const [lastHydrationTime, setLastHydrationTime] = useState<number>(() => {
    return initialSession?.lastHydrationTime || initialSession?.sessionStartTime || Date.now();
  });

  // Auto-sync daily session data to localStorage
  useEffect(() => {
    try {
      const today = getTodayDateKey();
      const sessionToSave: DailySessionState = {
        date: today,
        sessionStartTime,
        lastHydrationTime,
        deskSessionStartTime: detectionRef.current.deskSessionStartTime || sessionStartTime,
        healthScore,
        trendHistory,
        statsSummary,
        events,
        isClockedIn,
        isClockedOut,
      };
      localStorage.setItem('overwatch_daily_state', JSON.stringify(sessionToSave));
      if (detectionRef.current.deskSessionStartTime) {
        localStorage.setItem('overwatch_desk_session_start', String(detectionRef.current.deskSessionStartTime));
      }
    } catch (err) {
      console.warn('Failed to save daily state to localStorage:', err);
    }
  }, [sessionStartTime, lastHydrationTime, healthScore, trendHistory, statsSummary, events, isClockedIn, isClockedOut]);

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

  // AI Face Charisma & Beauty Score State (Persisted in localStorage for today only)
  const [faceScoreData, setFaceScoreData] = useState<FaceCharismaScore>(() => {
    try {
      const saved = localStorage.getItem('overwatch_last_face_score');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.savedDate === getTodayDateKey()) {
          return parsed;
        }
      }
    } catch {}
    return getBaselineCharismaScore();
  });
  const [isScanningFace, setIsScanningFace] = useState<boolean>(false);
  const hasAutoScannedRef = useRef<boolean>(false);

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

  // Candid Snapshots Gallery State (Filter to keep only today's snapshots)
  const [candidGallery, setCandidGallery] = useState<CandidSnapshotItem[]>(() => {
    try {
      const saved = localStorage.getItem('overwatch_candid_gallery');
      if (!saved) return [];
      const parsed: CandidSnapshotItem[] = JSON.parse(saved);
      const today = getTodayDateKey();
      return parsed.filter((item) => new Date(item.timestamp).toLocaleDateString('en-CA') === today);
    } catch {
      return [];
    }
  });
  const [isCandidGalleryOpen, setIsCandidGalleryOpen] = useState<boolean>(false);
  const [isShutterFlashing, setIsShutterFlashing] = useState<boolean>(false);

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

  // Track right column height to ensure left camera block matches it with 100% precision
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [rightColumnHeight, setRightColumnHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = rightColumnRef.current;
    if (!el) return;
    const updateHeight = () => {
      if (window.innerWidth >= 1024) {
        setRightColumnHeight(el.clientHeight);
      } else {
        setRightColumnHeight(null);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    window.addEventListener('resize', updateHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Trackers ref for high-frequency detection logic
  const detectionRef = useRef({
    yawnStartTime: 0 as number | null,
    hasTriggeredThisYawn: false,
    yawnConsecutiveCount: 0,
    yawnCooldown: 0,
    frownStartTime: 0 as number | null,
    hasTriggeredThisFrown: false,
    frownCooldown: 0,
    proximityStartTime: 0 as number | null,
    hasTriggeredThisProximity: false,
    proximityCooldown: 0,
    consecutiveDeskSecs: 0,
    consecutiveAwaySecs: 0,
    deskSessionStartTime: (initialSession?.deskSessionStartTime || initialSession?.sessionStartTime || (typeof window !== 'undefined' && localStorage.getItem('overwatch_desk_session_start') ? Number(localStorage.getItem('overwatch_desk_session_start')) : null)) as number | null,
    lastFaceLeaveTimestamp: null as number | null,
    hasTriggeredSlackAlert: false,
    lastFrameTime: performance.now(),
    overtimeTicker: 0,
    isFaceCurrentlyPresent: false,
    blinkTimestamps: [] as number[],
    wasBlinking: false,
    blinkClosureStartTime: 0,
    lastBlinkPeakTime: 0,
    blinkCooldown: 0,
    peaceCooldown: 0,
    peaceConsecutiveDetections: 0,
    lastGestureCheckTime: 0,
    isRecognizingGesture: false,
    lastFaceScoreEvalTime: 0,
    lastRandomSnapshotTime: 0,
    nextRandomSnapshotIntervalSecs: 600 + Math.floor(Math.random() * 900), // Random 10~25 min
    rolling30MinSamples: [] as Array<{
      timestamp: number;
      smile: number;
      browRelaxation: number;
      eyeOpenness: number;
      proximityPct: number;
    }>,
    lastSampleTimestamp: 0,
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

  // Trigger Meme Toast (Now strictly auto-dismisses in 3 seconds, singleton mode, emoji-free)
  const triggerToast = useCallback(
    (item: Omit<MemeToastItem, 'id'>) => {
      if (isMeetingMode) return; // Silent in meeting mode
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const cleanText = (str?: string) =>
        (str || '')
          .replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
          .replace(/\s+/g, ' ')
          .trim();

      const newToast: MemeToastItem = {
        ...item,
        id,
        title: cleanText(item.title),
        desc: cleanText(item.desc),
        badge: cleanText(item.badge),
      };

      // Always maintain only 1 active toast (singleton)
      setToasts([newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    [isMeetingMode]
  );

  // Score modifier helper (100% Real Measured Data grouped by 5-minute units)
  const modifyScore = useCallback(
    (delta: number, reason: string, icon: string = '⚡') => {
      // If user has NOT clocked in or user clocked out:
      // DO NOT modify score or record trend points
      if (!isClockedIn || isClockedOut) {
        return;
      }

      setHealthScore((prev) => {
        const nextScore = Math.max(0, Math.min(100, prev + delta));
        const now = new Date();
        const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(roundedMinutes).padStart(2, '0');
        const timeSlot = `${hh}:${mm}`;

        setTrendHistory((history) => {
          // Dynamic 6-axis real-time composite fatigue load (1 ~ 10):
          const instantFrownLoad = (telemetry.frown >= 0.04 ? 2.5 : 0);
          const instantYawnLoad = (delta < 0 && reason.includes('哈欠') ? 4 : telemetry.mar > 0.45 ? 2.5 : 0);
          const instantProximityLoad = (telemetry.proximity > 60 ? 2 : 0);
          const instantBlinkLoad = (telemetry.isFrequentBlinking ? 2 : 0);
          const instantDeskLoad = (detectionRef.current.consecutiveDeskSecs > (settings.sedentaryLimitMinutes * 45) ? 2 : 0);

          const compositeFatigue = delta < 0
            ? Math.min(10, Math.max(3, Math.round(Math.abs(delta) * 1.5 + instantFrownLoad + instantYawnLoad + instantProximityLoad + instantBlinkLoad + instantDeskLoad)))
            : 1;

          const deskMins = (detectionRef.current.consecutiveDeskSecs || 0) / 60;
          const currentStress = Math.min(100, Math.max(12, Math.round(
            (deskMins / 10) * 5.5 +
            (telemetry.frown > 0.01 ? ((telemetry.frown - 0.01) / 0.06) * 30 : 0) +
            (telemetry.proximity > 45 ? ((telemetry.proximity - 45) / 25) * 20 : 0) +
            (delta < 0 ? Math.abs(delta) * 2.5 : 0)
          )));
          const currentRecovery = Math.min(100, Math.max(15, Math.round(
            nextScore * 0.60 +
            (delta > 0 ? delta * 2 : 0) +
            (telemetry.proximity > 0 && telemetry.proximity <= 45 ? 8 : 0) -
            Math.max(0, (deskMins - 15) * 1.2)
          )));

          const newPoint: HealthTrendPoint = {
            time: timeSlot,
            timestamp: now.getTime(),
            score: nextScore,
            fatigueIndex: compositeFatigue,
            stressScore: currentStress,
            recoveryScore: currentRecovery,
            eventDelta: delta,
            eventName: reason.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 10),
            eventType: delta < 0 ? 'penalty' : delta > 0 ? 'reward' : 'info',
            emotionLabel: telemetry.emotion?.label,
            emotionEmoji: telemetry.emotion?.emoji,
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
    [logEvent, telemetry, settings.sedentaryLimitMinutes]
  );

  // Auto record health score every 5-minute real-time interval with 6-axis telemetry integration
  useEffect(() => {
    const timer = setInterval(() => {
      // If user has NOT clocked in or user clocked out:
      // DO NOT record periodic sampling points!
      if (!isClockedIn || isClockedOut) {
        return;
      }

      const now = new Date();
      const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(roundedMinutes).padStart(2, '0');
      const timeSlot = `${hh}:${mm}`;

      setTrendHistory((history) => {
        if (history.length > 0 && history[history.length - 1].time === timeSlot) {
          return history;
        }

        // Composite 6-axis fatigue evaluation for idle periodic sampling
        const currentFatigueLoad = Math.min(
          10,
          Math.max(
            1,
            Math.round(
              (telemetry.mar > 0.45 ? 3 : 0) +
              (telemetry.frown >= 0.04 ? 2.5 : 0) +
              (telemetry.proximity > 60 ? 2 : 0) +
              (telemetry.isFrequentBlinking ? 2 : 0) +
              (detectionRef.current.consecutiveDeskSecs > (settings.sedentaryLimitMinutes * 50) ? 2.5 : 0) +
              (healthScore < 80 ? 1 : 0)
            )
          )
        );

        const deskMins = (detectionRef.current.consecutiveDeskSecs || 0) / 60;
        const currentStress = Math.min(100, Math.max(12, Math.round(
          (deskMins / 10) * 5.5 +
          (telemetry.frown > 0.01 ? ((telemetry.frown - 0.01) / 0.06) * 30 : 0) +
          (telemetry.proximity > 45 ? ((telemetry.proximity - 45) / 25) * 20 : 0)
        )));
        const currentRecovery = Math.min(100, Math.max(15, Math.round(
          healthScore * 0.60 +
          (telemetry.proximity > 0 && telemetry.proximity <= 45 ? 8 : 0) +
          ((telemetry.emotion?.label === '愉悅微笑' || telemetry.emotion?.label === '放鬆平靜') ? 10 : 0) -
          Math.max(0, (deskMins - 15) * 1.2)
        )));

        return [
          ...history,
          {
            time: timeSlot,
            timestamp: now.getTime(),
            score: healthScore,
            fatigueIndex: currentFatigueLoad,
            stressScore: currentStress,
            recoveryScore: currentRecovery,
            eventDelta: 0,
            eventName: '六維綜合巡檢',
            eventType: 'info' as const,
            emotionLabel: telemetry.emotion?.label,
            emotionEmoji: telemetry.emotion?.emoji,
          },
        ].slice(-40);
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [healthScore, telemetry, isClockedIn, isClockedOut, settings.sedentaryLimitMinutes]);

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
    setLastHydrationTime(Date.now());
    modifyScore(+10, '補充水分 300ml：成功補充水分，補水週期重新起算 (+10點)', '💧');
    soundSynth.playWaterDrink();
  }, [modifyScore]);

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
          ctx.fillText(`+ [OVERWATCH] +`, 12, 20);

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

  // Hidden Easter Egg: Peace Sign ✌️ Candid Snapshot Handler
  const handlePeaceSnapshot = useCallback(() => {
    soundSynth.playCameraShutter();

    // Trigger visual camera shutter flash animation on CCTV viewport
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 250);

    // Capture candid snapshot directly from camera stream
    const snap = takeCandidWebcamSnapshot('✌️ 工位野生比耶瞬間', 'candid');
    if (snap) {
      const nowStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
      candidSnapshotRef.current = {
        image: snap.image,
        time: nowStr,
        timestamp: Date.now(),
        faceCenter: snap.faceCenter,
        eyePositions: snap.eyePositions,
      };
      addCandidSnapshot(snap.image, '✌️ 元氣滿滿：工位比耶瞬間', 'peace');
    }

    modifyScore(+10, '✌️ 解鎖隱藏彩蛋：工位元氣比耶！精神值大幅回血 (+10點)', '✌️');
    logEvent('✌️ 解鎖隱藏機制：捕捉到工位元氣比耶瞬間！照片已存入工位相簿', 10, 'reward', '✌️');

    triggerToast({
      title: '✌️ 抓到比耶！元氣滿滿',
      desc: '成功解鎖隱藏彩蛋！工位野生比耶照已收納至工位相簿',
      badge: '+10 BP',
      badgeColor: 'bg-emerald-400 text-slate-950 font-bold',
      image: snap?.image,
      type: 'general',
    });
  }, [takeCandidWebcamSnapshot, addCandidSnapshot, modifyScore, logEvent, triggerToast]);

  const handleTriggerHydrationAlert = useCallback(() => {
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
      addCandidSnapshot(liveSnapshot.image, `📸 工位突擊抓拍存證`, 'scan');
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

    setLastHydrationTime(Date.now());
    modifyScore(+5, '💧 定時久坐補水：補充體內水分與細胞能量，提升修復活力 (+5點)', '💧');
    try {
      soundSynth.playWaterDrink();
    } catch {}
    dispatchHazardAlert(
      {
        type: 'hydration',
        title: '💧 定時久坐補水 // 細胞缺水警戒',
        message: '工位久坐水分蒸發！即刻飲用 350ml 溫水放鬆甦醒，補充體內水分！',
        badge: '久坐補水',
        severity: 'reward',
        image: candidImg,
        faceCenter: resolvedFaceCenter,
        eyePositions: resolvedEyePositions,
        timestamp: Date.now(),
      },
      '定時補水時間到！記得多喝水補充體內水分！'
    );
  }, [takeCandidWebcamSnapshot, addCandidSnapshot, modifyScore, dispatchHazardAlert]);

  const handleScanFaceCharisma = useCallback(
    async (isAuto: boolean = false) => {
      if (isScanningFace) return;
      setIsScanningFace(true);

      // Compute true rolling 30-minute time-weighted averages from collected telemetry samples
      const samples = detectionRef.current.rolling30MinSamples;
      const count = samples.length;

      let avgSmile = detectionRef.current.latestSmile || 0;
      let avgBrowRelaxation = detectionRef.current.latestBrowRelaxation ?? 1;
      let avgEyeOpenness = detectionRef.current.latestEyeOpenness ?? 0.8;
      let avgProximity = detectionRef.current.latestProximityPct || 0;

      if (count > 0) {
        avgSmile = samples.reduce((acc, s) => acc + s.smile, 0) / count;
        avgBrowRelaxation = samples.reduce((acc, s) => acc + s.browRelaxation, 0) / count;
        avgEyeOpenness = samples.reduce((acc, s) => acc + s.eyeOpenness, 0) / count;
        avgProximity = samples.reduce((acc, s) => acc + s.proximityPct, 0) / count;
      }

      const inputs = {
        smile: avgSmile,
        browRelaxation: avgBrowRelaxation,
        eyeOpenness: avgEyeOpenness,
        isFacePresent: detectionRef.current.isFaceCurrentlyPresent,
        proximityPct: avgProximity,
        yawnsCount: statsSummary.yawnsCaught,
        frownsCount: statsSummary.frownsCaught,
        consecutiveDeskMinutes: Math.floor(telemetry.consecutiveDeskSeconds / 60),
        healthScore: healthScore,
      };

      try {
        const result = await evaluateFaceScoreWithGemini(inputs);
        setFaceScoreData(result);
        try {
          const scoreToSave = { ...result, savedDate: getTodayDateKey() };
          localStorage.setItem('overwatch_last_face_score', JSON.stringify(scoreToSave));
        } catch (err) {
          console.warn('Failed to save last face score to localStorage:', err);
        }

        const nowStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
        const candidImg = candidSnapshotRef.current?.image || '/memes/idol-handsome-1.jpg';

        if (!isAuto) {
          triggerToast({
            title: `✨ AI 顏值評測：${result.score}分 [${result.rank}]`,
            desc: `${result.title}・精神滿滿活力充沛`,
            badge: `${result.score}分`,
            badgeColor: 'bg-cyan-500 text-slate-950',
            image: candidImg,
            type: 'blink',
          });
        }

        logEvent(
          `✨ AI 顏值評測：${result.score}分 [${result.rank}] — ${result.title} (工位即時體徵儀態掃描)`,
          0,
          'info',
          '✨'
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
    modifyScore(-5, '頭部距離螢幕過近：啟動護眼科技雷達校準 (-5點)', 'PROXIMITY');
    soundSynth.playWarningBuzz();
    
    // Voice alert & notifications
    if (settings.voiceAlertsEnabled && !isMeetingMode) {
      speakVoiceAlert('距離螢幕過近！請向後靠上椅背拉開距離！');
    }
    if (settings.desktopNotificationsEnabled && !isMeetingMode) {
      fireDesktopNotification({
        title: '距離過近警告',
        body: '頭部過度貼近螢幕（低於 30cm）！請靠上椅背保持最佳姿勢視距 (≥35cm)！',
        tag: 'ohg-proximity',
        requireInteraction: true,
      });
    }
  }, [modifyScore, settings.voiceAlertsEnabled, settings.desktopNotificationsEnabled, isMeetingMode]);

  const handleProximityCalibrationSuccess = useCallback(() => {
    setIsEyeStrainActive(false);
    triggerToast({
      title: '最佳護眼距離已鎖定',
      desc: '已維持最佳姿勢視距 (≥35cm)，視力防護就緒',
      badge: '校準成功',
      badgeColor: 'bg-emerald-500 text-slate-950',
      image: '/memes/cat-curious.jpg',
      type: 'blink',
    });
    logEvent('護眼雷達：成功維持最佳姿勢視距 (≥35cm) 並完成校準', 0, 'reward', 'CALIBRATED');
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
    detectionRef.current.deskSessionStartTime = Date.now();
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

  const handleOvertimeDeduction = useCallback((isDemoForce: boolean = false) => {
    if (isClockedOut && !isDemoForce) return;
    if (isDemoForce) {
      setIsClockedOut(false);
      setIsOvertime(true);
    }
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
  }, [isClockedOut, modifyScore, triggerToast, dispatchHazardAlert]);

  const handleEscapeOvertime = useCallback((ranAway: boolean) => {
    if (ranAway) {
      setIsClockedOut(true);
      setIsOvertime(false);
      setIsReceiptOpen(true);
      try {
        soundSynth.playRewardJingle();
        soundSynth.playOracleReveal();
      } catch {}
      setHealthScore((prev) => Math.min(100, prev + 20));
      logEvent('【截胡超跑基金】老闆的法拉利夢想崩塌！拿去換神車 TOYOTA 快樂下班去！', 20, 'reward', '🚗💨');
    } else {
      logEvent('【向資本低頭】屈服於老闆的法拉利圓夢集資，繼續血汗加班。', 0, 'info', '🙇‍♂️');
    }
  }, [logEvent]);

  /* ====================================================================
     MediaPipe FaceLandmarker Initialization & Video Setup
     ==================================================================== */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      // Clean up previous stream tracks to prevent hardware lock
      if (videoRef.current && videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach((track) => track.stop());
      }

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
      setCameraError('請允許瀏覽器授權開啟鏡頭，以啟動即時身心健康監測。');
      setIsCameraActive(false);
    }
  }, []);

  // Ref to track laptop lid closure / tab hidden state and timestamps
  const lidClosedAtRef = useRef<number | null>(null);

  // Auto handle laptop lid close / system sleep / tab wake up
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lidClosedAtRef.current = Date.now();
        console.log('💻 [LID_CLOSE/TAB_HIDDEN] Laptop lid closed or tab hidden. Pausing desk & away timers.');
      } else if (document.visibilityState === 'visible') {
        const closedAt = lidClosedAtRef.current;
        const closedDurationMs = closedAt ? Date.now() - closedAt : 0;
        console.log(`💻 [LID_OPEN/TAB_VISIBLE] System wake-up detected (was closed for ${(closedDurationMs / 1000).toFixed(1)}s).`);

        // If computer was closed/asleep for more than 3 seconds:
        if (closedDurationMs > 3000) {
          // Pause desk session timer during sleep by shifting deskSessionStartTime forward
          if (detectionRef.current.deskSessionStartTime) {
            detectionRef.current.deskSessionStartTime += closedDurationMs;
            try {
              localStorage.setItem('overwatch_desk_session_start', String(detectionRef.current.deskSessionStartTime));
            } catch {}
          }
          // Pause hydration interval timer during sleep by shifting lastHydrationTime forward
          setLastHydrationTime((prev) => prev + closedDurationMs);
          // Reset away trackers so sleep duration is not falsely counted as away slack time
          detectionRef.current.lastFaceLeaveTimestamp = null;
          detectionRef.current.hasTriggeredSlackAlert = false;
          detectionRef.current.consecutiveAwaySecs = 0;

          // Clear any stale slack or sedentary hazards that may have triggered right before sleeping
          if (activeHazardRef.current?.type === 'slack' || activeHazardRef.current?.type === 'sedentary') {
            setActiveHazard(null);
          }
        }

        lidClosedAtRef.current = null;
        startCamera();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startCamera, logEvent]);

  useEffect(() => {
    let isCancelled = false;

    async function initAI() {
      try {
        await getFaceLandmarker();
        if (!isCancelled) {
          setIsModelLoaded(true);
          startCamera();

          // Smoothly warm up GestureRecognizer in the background after main camera starts
          setTimeout(() => {
            if (!isCancelled) {
              getGestureRecognizer().catch((err) => {
                console.warn('GestureRecognizer background load notice:', err);
              });
            }
          }, 1200);
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
      let delta = (now - detectionRef.current.lastFrameTime) / 1000;

      // Handle system suspension, hibernation or tab freeze
      if (delta > 5.0) {
        console.log('👀 [RESUME_DETECTED] System woke up or tab resumed from freeze (time gap:', delta, 's). Restarting stream and capping delta.');
        delta = 0.1; // Cap the first frame's delta to avoid abnormal timer and state jumps
        startCamera();
      }

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
              // When looking down or camera angle is low, noseRelY increases (> 0.485 indicates downward head tilt)
              const isLookingDown = noseRelY > 0.485;
              const pitchDownDev = Math.max(0, noseRelY - 0.465);
              const pitchDampener = Math.max(0.08, 1 - pitchDownDev * 6.5);

              // Eye Gaze Downward Direction (looking down with eyes, e.g. at keyboard or lower screen)
              const eyeLookDownL =
                blendshapes.find((b) => b.categoryName === 'eyeLookDownLeft')?.score || 0;
              const eyeLookDownR =
                blendshapes.find((b) => b.categoryName === 'eyeLookDownRight')?.score || 0;
              const eyeLookDownVal = (eyeLookDownL + eyeLookDownR) / 2;
              const gazeDownDampener = Math.max(0.10, 1 - eyeLookDownVal * 2.5);

              // Estimate head yaw / looking sideways (nose #1 relative to outer eye corners #33 and #263)
              const leftEyeCornerPt = landmarks[33];
              const rightEyeCornerPt = landmarks[263];
              let isLookingSideways = false;
              let yawDev = 0;
              if (nosePt && leftEyeCornerPt && rightEyeCornerPt) {
                const distToL = Math.abs(nosePt.x - leftEyeCornerPt.x);
                const distToR = Math.abs(rightEyeCornerPt.x - nosePt.x);
                const totalSpanX = Math.max(0.001, distToL + distToR);
                const yawBalance = distToL / totalSpanX; // ~0.50 when facing forward
                yawDev = Math.abs(yawBalance - 0.50) * 2;
                isLookingSideways = yawDev > 0.11; // Catch even slight head turns to prevent side-face false triggers
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
              const avgBrowDown = (browDownL + browDownR) / 2;
              const maxBrowDown = Math.max(browDownL, browDownR);

              // Geometric Inner Eyebrow Compression (#107 vs #336 normalized to eye span #33 vs #263)
              const rightInnerBrow = landmarks[107] || landmarks[66];
              const leftInnerBrow = landmarks[336] || landmarks[296];
              const rightEyeCorner = landmarks[33];
              const leftEyeCorner = landmarks[263];

              // Eyebrow and Inner Furrow Tracking
              let geomFurrow = 0;
              if (
                rightInnerBrow &&
                leftInnerBrow &&
                rightEyeCorner &&
                leftEyeCorner
              ) {
                const eyeSpan = Math.max(0.01, Math.hypot(leftEyeCorner.x - rightEyeCorner.x, leftEyeCorner.y - rightEyeCorner.y));
                const browSpan = Math.hypot(leftInnerBrow.x - rightInnerBrow.x, leftInnerBrow.y - rightInnerBrow.y);
                const ratio = browSpan / eyeSpan;
                // If inner brows draw closer together (< 0.35 of eye span)
                if (ratio < 0.35) {
                  geomFurrow = Math.min(0.035, (0.35 - ratio) * 0.35);
                }
              }

              // Direct, responsive brow signal:
              // Natural resting face sits around 0.00 ~ 0.02
              // Natural effortless frown comfortably reaches 0.04 ~ 0.07 without straining
              const browAvg = (browDownL + browDownR) / 2;
              const browMax = Math.max(browDownL, browDownR);
              // Scale blendshape so a natural, non-violent frown reaches 0.04+ easily
              const rawBrowSignal = (browMax * 0.60 + browAvg * 0.40) * 1.55 + geomFurrow;

              // Micro-stress hints (nose sneer / mouth frown) provide subtle boost when brows start moving
              const microStressBoost = rawBrowSignal > 0.02
                ? Math.max(noseSneerVal * 0.15, mouthFrownVal * 0.15)
                : 0;

              let baseBrowScore = rawBrowSignal + microStressBoost;

              // Inhibit smile/laughter false positives
              if (smileVal > 0.10 || lipCornerElevation > 0.02) {
                const smileDamp = Math.max((smileVal - 0.10) * 3.0, (lipCornerElevation - 0.02) * 15);
                baseBrowScore *= Math.max(0.1, 1 - Math.min(0.9, smileDamp));
              }

              // Inhibit extreme jaw opening / yawn / speech
              if (jawVal > 0.28) {
                baseBrowScore *= Math.max(0.2, 1 - (jawVal - 0.28) * 2.0);
              }

              // Side-angle mild dampener (only if turned heavily sideways)
              if (isLookingSideways && yawDev > 0.18) {
                baseBrowScore *= Math.max(0.4, 1 - (yawDev - 0.18) * 2.0);
              }

              const rawBrowPressure = Math.max(0, baseBrowScore);
              const prevBrow = detectionRef.current.latestBrowPressure ?? rawBrowPressure;
              // Responsive EMA: 0.50 new + 0.50 prev gives zero lag and smooth values
              const browPressure = Number((prevBrow * 0.50 + rawBrowPressure * 0.50).toFixed(2));
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
              
              // Dynamic thresholds according to head pitch, factoring in smile/squint suppression
              const isSquintingFromSmile = smileVal > 0.12 || cheekSquintVal > 0.15;
              const earBlink = ear < (isLookingDown ? 0.14 : 0.17)
                ? Math.max(0, Math.min(1, ((isLookingDown ? 0.14 : 0.17) - ear) / 0.07))
                : 0;
              const rawBlinkAvg = (blinkL + blinkR) / 2;
              
              // Inhibit false blink scores caused by smiling/laughing/cheek squinting
              const blinkAvg = isSquintingFromSmile ? rawBlinkAvg * 0.5 : rawBlinkAvg;
              const blinkScore = Math.max(blinkAvg, isSquintingFromSmile ? 0 : earBlink);
              
              // Robust complete closure threshold (prevent false positives from gazing down or slight eyelid droop):
              const bothEyesClosed =
                !isSquintingFromSmile &&
                ((blinkL >= (isLookingDown ? 0.65 : 0.58) && blinkR >= (isLookingDown ? 0.65 : 0.58)) ||
                 (blinkAvg >= (isLookingDown ? 0.68 : 0.60)) ||
                 (ear < (isLookingDown ? 0.135 : 0.155) && blinkAvg > 0.35));
              const isEyesClosedNow = bothEyesClosed;

              const eyeOpenVal = Math.max(0, 1 - blinkScore);
              const browRelaxVal = Math.max(0, 1 - frownVal);

              // Store latest features for AI Charisma Scanner
              detectionRef.current.latestSmile = smileVal;
              detectionRef.current.latestBrowRelaxation = browRelaxVal;
              detectionRef.current.latestEyeOpenness = eyeOpenVal;
              detectionRef.current.latestProximityPct = proximityPct;

              // Robust Blink Impulse State Machine:
              // Genuine blink duration: 60ms ~ 450ms.
              // Enforce 160ms refractory period between blinks to prevent single slow blinks counting multiple times.
              if (isEyesClosedNow) {
                if (!detectionRef.current.wasBlinking) {
                  detectionRef.current.wasBlinking = true;
                  detectionRef.current.blinkClosureStartTime = now;
                }
              } else {
                if (detectionRef.current.wasBlinking) {
                  const closureDuration = now - detectionRef.current.blinkClosureStartTime;
                  if (closureDuration >= 60 && closureDuration <= 450) {
                    if (now - detectionRef.current.lastBlinkPeakTime > 160) {
                      detectionRef.current.lastBlinkPeakTime = now;
                      detectionRef.current.blinkTimestamps.push(now);
                    }
                  }
                  detectionRef.current.wasBlinking = false;
                }
              }

              // Prune old blink timestamps (> 4.0s sliding window)
              // Only rapid bursts of 5+ blinks within 4 seconds trigger dry-eye fatigue
              detectionRef.current.blinkTimestamps = detectionRef.current.blinkTimestamps.filter(
                (t) => now - t <= 4000
              );

              // Dual-trigger criteria (Robust & Non-intrusive):
              // Criterion 1: Rapid Dry-Eye Fluttering (>= 5 rapid consecutive blinks within 4.0 seconds)
              const isRapidBlinking = detectionRef.current.blinkTimestamps.length >= 5;

              // Criterion 2: Prolonged heavy-lid eye closure (continuous closure for >= 3.0s, e.g. nodding off / micro-sleep)
              const prolongedClosureDuration = detectionRef.current.wasBlinking
                ? now - detectionRef.current.blinkClosureStartTime
                : 0;
              const isProlongedClosed = prolongedClosureDuration >= 3000;

              const isFrequentBlinkingNow = isRapidBlinking || isProlongedClosed;

              const isTrackingActive = isClockedIn && !isClockedOut;

              if (
                isTrackingActive &&
                isFrequentBlinkingNow &&
                detectionRef.current.blinkCooldown <= 0 &&
                !activeHazardRef.current
              ) {
                handleBlinkPenalty();
                detectionRef.current.blinkTimestamps = [];
                detectionRef.current.wasBlinking = false;
                detectionRef.current.blinkCooldown = 6; // 6s buffer
              }

              // Update desk / away trackers
              // If document is hidden / laptop is closed / not clocked in, do not process away transition or award spurious slack rewards
              if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                return;
              }

              // If user was away, evaluate away duration using absolute system clock
              if (isTrackingActive && detectionRef.current.lastFaceLeaveTimestamp) {
                const awayDurationSecs = (Date.now() - detectionRef.current.lastFaceLeaveTimestamp) / 1000;

                // Only reset sedentary sitting timer if away continuously for >= 300s (5 minutes)
                if (awayDurationSecs >= 300) {
                  const nowTs = Date.now();
                  detectionRef.current.deskSessionStartTime = nowTs;
                  detectionRef.current.consecutiveDeskSecs = 0;
                  try {
                    localStorage.setItem('overwatch_desk_session_start', String(nowTs));
                  } catch {}

                  // Grant slack reward for taking a 5-minute or longer break (<= 2 hours)
                  if (awayDurationSecs <= 7200) {
                    const mins = Math.min(60, Math.max(1, Math.round(awayDurationSecs / 60)));
                    handleSlackReward(mins);
                  }
                } else {
                  // Away < 5 minutes (< 300s): preserve desk session, pause duration adjustment
                  if (detectionRef.current.deskSessionStartTime) {
                    detectionRef.current.deskSessionStartTime += (awayDurationSecs * 1000);
                    try {
                      localStorage.setItem('overwatch_desk_session_start', String(detectionRef.current.deskSessionStartTime));
                    } catch {}
                  }
                }
                detectionRef.current.lastFaceLeaveTimestamp = null;
                detectionRef.current.consecutiveAwaySecs = 0;
                detectionRef.current.hasTriggeredSlackAlert = false;
              }

              if (isTrackingActive && !detectionRef.current.deskSessionStartTime) {
                detectionRef.current.deskSessionStartTime = Date.now();
              }

              if (isTrackingActive && detectionRef.current.deskSessionStartTime) {
                const elapsedDeskSecs = Math.floor((Date.now() - detectionRef.current.deskSessionStartTime) / 1000);
                detectionRef.current.consecutiveDeskSecs = Math.max(0, elapsedDeskSecs);
              }

              // Check sedentary limit immediately on frame
              const deskLimitSecs = (settings.sedentaryLimitMinutes || 45) * 60;
              if (
                isTrackingActive &&
                detectionRef.current.consecutiveDeskSecs >= deskLimitSecs &&
                !isStretchScreensaverOpen &&
                !isSedentaryLocked
              ) {
                handleSedentaryLock();
              }

              // Yawn vs Laugh Distinction Check:
              // Consecutive 3 yawns permitted with zero buffer; after 3 consecutive yawns, enters 5s buffer.
              const isLaughingNow =
                smileVal > 0.22 || (smileVal > 0.15 && cheekSquintVal > 0.18) || lipCornerElevation > 0.035;
              const isYawningNow = jawVal > 0.46 && !isLaughingNow && cheekSquintVal < 0.15;
              if (isYawningNow) {
                if (!detectionRef.current.yawnStartTime) {
                  detectionRef.current.yawnStartTime = performance.now();
                }
                const elapsedYawn = (performance.now() - detectionRef.current.yawnStartTime) / 1000;
                if (
                  isTrackingActive &&
                  elapsedYawn >= 1.0 &&
                  !detectionRef.current.hasTriggeredThisYawn &&
                  detectionRef.current.yawnCooldown <= 0 &&
                  !activeHazardRef.current
                ) {
                  handleYawnPenalty();
                  detectionRef.current.hasTriggeredThisYawn = true;
                  detectionRef.current.yawnConsecutiveCount = (detectionRef.current.yawnConsecutiveCount || 0) + 1;
                  if (detectionRef.current.yawnConsecutiveCount >= 3) {
                    detectionRef.current.yawnCooldown = 5; // 5s buffer after 3 consecutive yawns
                    detectionRef.current.yawnConsecutiveCount = 0;
                  }
                }
              } else {
                detectionRef.current.yawnStartTime = null;
                detectionRef.current.hasTriggeredThisYawn = false;
              }

              // Frown Trigger Check (Require genuine Brow Pressure > 0.07 sustained for 5.0s, 5s buffer, facing forward)
              const isFrowningNow = frownVal > 0.07 && !isLookingSideways;
              let currentFrownElapsedSecs = 0;
              if (isFrowningNow) {
                if (!detectionRef.current.frownStartTime) {
                  detectionRef.current.frownStartTime = performance.now();
                }
                const elapsedFrown =
                  (performance.now() - detectionRef.current.frownStartTime) / 1000;
                currentFrownElapsedSecs = elapsedFrown;
                if (
                  isTrackingActive &&
                  elapsedFrown >= 5.0 &&
                  !detectionRef.current.hasTriggeredThisFrown &&
                  detectionRef.current.frownCooldown <= 0 &&
                  !activeHazardRef.current
                ) {
                  handleFrownPenalty();
                  detectionRef.current.hasTriggeredThisFrown = true;
                  detectionRef.current.frownCooldown = 5; // 5s buffer
                }
              } else {
                detectionRef.current.frownStartTime = null;
                detectionRef.current.hasTriggeredThisFrown = false;
              }

              // Proximity Trigger Check (>64% indicates distance < 30cm, require 1.5s sustained duration, 5s buffer)
              const isTooCloseNow = proximityPct > 64;
              if (isTooCloseNow) {
                if (!detectionRef.current.proximityStartTime) {
                  detectionRef.current.proximityStartTime = performance.now();
                }
                const elapsedClose =
                  (performance.now() - detectionRef.current.proximityStartTime) / 1000;
                if (
                  isTrackingActive &&
                  elapsedClose >= 1.5 &&
                  !isEyeStrainActive &&
                  detectionRef.current.proximityCooldown <= 0 &&
                  !detectionRef.current.hasTriggeredThisProximity
                ) {
                  handleProximityBlur();
                  detectionRef.current.hasTriggeredThisProximity = true;
                  detectionRef.current.proximityCooldown = 5; // 5s buffer
                }
              } else {
                detectionRef.current.proximityStartTime = null;
                detectionRef.current.hasTriggeredThisProximity = false;
              }

              // Decay 5-second buffer cooldowns
              if (detectionRef.current.yawnCooldown > 0) {
                detectionRef.current.yawnCooldown -= delta;
              }
              if (detectionRef.current.frownCooldown > 0) {
                detectionRef.current.frownCooldown -= delta;
              }
              if (detectionRef.current.blinkCooldown > 0) {
                detectionRef.current.blinkCooldown -= delta;
              }
              if (detectionRef.current.proximityCooldown > 0) {
                detectionRef.current.proximityCooldown -= delta;
              }
              if (detectionRef.current.peaceCooldown > 0) {
                detectionRef.current.peaceCooldown -= delta;
              }

              // Record rolling 30-minute telemetry sample (sampled every 1 second)
              if (now - detectionRef.current.lastSampleTimestamp >= 1000) {
                detectionRef.current.lastSampleTimestamp = now;
                detectionRef.current.rolling30MinSamples.push({
                  timestamp: now,
                  smile: smileVal,
                  browRelaxation: Math.max(0, 1 - frownVal * 5),
                  eyeOpenness: isEyesClosedNow ? 0.2 : Math.max(0.4, 1 - blinkScore),
                  proximityPct: proximityPct,
                });
                // Keep only samples from the last 30 minutes (1800000 ms)
                detectionRef.current.rolling30MinSamples = detectionRef.current.rolling30MinSamples.filter(
                  (s) => now - s.timestamp <= 1800000
                );
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
                frownDurationSeconds: Number(currentFrownElapsedSecs.toFixed(1)),
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
              detectionRef.current.yawnStartTime = null;
              detectionRef.current.frownStartTime = null;

              // If document is hidden / laptop is closed, do not accumulate away seconds or fire slack alerts
              if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                return;
              }

              if (!detectionRef.current.lastFaceLeaveTimestamp) {
                detectionRef.current.lastFaceLeaveTimestamp = Date.now();
              }

              const awaySecs = (Date.now() - detectionRef.current.lastFaceLeaveTimestamp) / 1000;
              const defaultSlackTargetSecs = 180; // 3 mins default
              detectionRef.current.consecutiveAwaySecs = awaySecs;

              // Only reset desk timer if continuous away time reaches >= 300 seconds (5 minutes)
              if (awaySecs >= 300) {
                detectionRef.current.consecutiveDeskSecs = 0;
              }

              // While away: if away time reaches default 3m and alert has not triggered
              // Only trigger if within realistic break window (<= 2 hours) and tab is active
              if (
                isCameraActive &&
                awaySecs >= defaultSlackTargetSecs &&
                awaySecs <= 7200 &&
                !detectionRef.current.hasTriggeredSlackAlert &&
                (!activeHazardRef.current || activeHazardRef.current.type !== 'slack')
              ) {
                detectionRef.current.hasTriggeredSlackAlert = true;
                const mins = Math.max(1, Math.round(awaySecs / 60));
                dispatchHazardAlert(
                  {
                    type: 'slack',
                    title: '☕ 離座摸魚健康修復 // 薪水小偷 Lv.MAX',
                    message: `已離座滿 ${mins} 分鐘！離座休息有益血液循環，回座時將自動完成回血！`,
                    badge: `離座 ${mins} 分鐘獎勵`,
                    severity: 'reward',
                    image: '/memes/cat-chill.jpg',
                    timestamp: Date.now(),
                  },
                  `離座滿 ${mins} 分鐘，離座健康點數累積中！`
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
                consecutiveDeskSeconds: awaySecs < 20 ? detectionRef.current.consecutiveDeskSecs : 0,
                consecutiveAwaySeconds: Math.round(awaySecs),
                isYawning: false,
                isFrowning: false,
                isTooClose: false,
                isFrequentBlinking: false,
              }));
            }
          } catch {
            // landmarker detect error
          }

          // Gesture Recognition for Peace Sign ✌️ Easter Egg (sampled every ~100ms for swift response)
          if (
            !detectionRef.current.isRecognizingGesture &&
            now - detectionRef.current.lastGestureCheckTime >= 100 &&
            detectionRef.current.peaceCooldown <= 0
          ) {
            detectionRef.current.lastGestureCheckTime = now;
            detectionRef.current.isRecognizingGesture = true;

            getGestureRecognizer()
              .then((recognizer) => {
                if (!recognizer || !videoRef.current || videoRef.current.readyState < 2) return;
                try {
                  const gestureResult = recognizer.recognize(videoRef.current);
                  let isPeace = false;

                  // 1. Check MediaPipe pre-trained gesture categories for 'Victory' (✌️ Peace Sign)
                  // Combined with structural landmark verification for instant accuracy
                  if (gestureResult.gestures && gestureResult.gestures.length > 0 && gestureResult.landmarks && gestureResult.landmarks.length > 0) {
                    for (let i = 0; i < gestureResult.gestures.length; i++) {
                      const handGestures = gestureResult.gestures[i];
                      const handLandmarks = gestureResult.landmarks[i];
                      const victoryGesture = handGestures.find((g) => g.categoryName === 'Victory' && g.score >= 0.55);
                      if (victoryGesture && handLandmarks && isPeaceSignLandmarks(handLandmarks)) {
                        isPeace = true;
                        break;
                      }
                    }
                  }

                  // 2. Fallback: Check geometric landmark heuristic (Index & Middle fingers extended in straight V-shape)
                  if (!isPeace && gestureResult.landmarks && gestureResult.landmarks.length > 0) {
                    for (const handLandmarks of gestureResult.landmarks) {
                      if (isPeaceSignLandmarks(handLandmarks)) {
                        isPeace = true;
                        break;
                      }
                    }
                  }

                  if (isPeace) {
                    detectionRef.current.peaceConsecutiveDetections =
                      (detectionRef.current.peaceConsecutiveDetections || 0) + 1;
                    // Trigger swiftly on 2 consecutive checks (~200ms) for snappy, effortless capture
                    if (detectionRef.current.peaceConsecutiveDetections >= 2) {
                      detectionRef.current.peaceCooldown = 5.0; // 5 seconds cooldown
                      detectionRef.current.peaceConsecutiveDetections = 0;
                      handlePeaceSnapshot();
                    }
                  } else {
                    detectionRef.current.peaceConsecutiveDetections = 0;
                  }
                } catch {
                  // Silently handle any frame drops
                }
              })
              .catch(() => {})
              .finally(() => {
                detectionRef.current.isRecognizingGesture = false;
              });
          }
        }
      }

      animationFrameId = requestAnimationFrame(processLoop);
    }

    animationFrameId = requestAnimationFrame(processLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    showMesh,
    isClockedIn,
    isClockedOut,
    isEyeStrainActive,
    handleYawnPenalty,
    handleFrownPenalty,
    handleProximityBlur,
    handleSlackReward,
    handlePeaceSnapshot,
  ]);

  // Track active date for automatic midnight rollover reset
  const currentDayDateRef = useRef<string>(getTodayDateKey());

  /* ====================================================================
     Background Interval: Sedentary, Eye Strain & Overtime Tick
     ==================================================================== */
  useEffect(() => {
    const timer = setInterval(() => {
      // 0. Midnight Rollover Check (Automatic Daily Reset on New Day)
      const currentDayKey = getTodayDateKey();
      if (currentDayDateRef.current !== currentDayKey) {
        console.log('🌅 [MIDNIGHT_ROLLOVER] New day detected:', currentDayKey, '(previous:', currentDayDateRef.current, '). Resetting daily statistics.');
        currentDayDateRef.current = currentDayKey;

        // Reset daily metrics for the new day
        setHealthScore(100);
        setTrendHistory([]);
        setStatsSummary({
          yawnsCaught: 0,
          frownsCaught: 0,
          sedentaryLocksCount: 0,
          slackMinutesEarned: 0,
          overtimeMinutes: 0,
        });
        setEvents([
          {
            id: `init_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
            type: 'system',
            message: `🌅 跨日自動刷新：已為您載入 ${currentDayKey} 全新一日健康存摺`,
            delta: 0,
            icon: '🌅',
          },
        ]);
        setIsClockedIn(false);
        setIsClockedOut(false);
        try {
          localStorage.removeItem('overwatch_clockin_date');
        } catch {}
        setSessionStartTime(Date.now());
        setLastHydrationTime(Date.now());
        setOvertimeMinutes(0);
        setIsOvertime(false);
        const baselineCharisma = getBaselineCharismaScore();
        setFaceScoreData(baselineCharisma);
        hasAutoScannedRef.current = false;
        try {
          localStorage.setItem('overwatch_last_face_score', JSON.stringify(baselineCharisma));
        } catch {}
        detectionRef.current.overtimeTicker = 0;

        // Filter candid gallery to keep only today's snapshots
        setCandidGallery((prev) => prev.filter((item) => new Date(item.timestamp).toLocaleDateString('en-CA') === currentDayKey));
      }

      // If user clocked out or user has NOT clocked in yet, pause background ticker
      if (isClockedOut || !isClockedIn) {
        return;
      }

      // 1. Sedentary Limit Check (only tracks when user face is present at an open active screen)
      if (detectionRef.current.isFaceCurrentlyPresent && detectionRef.current.deskSessionStartTime) {
        const elapsedDeskSecs = Math.floor((Date.now() - detectionRef.current.deskSessionStartTime) / 1000);
        detectionRef.current.consecutiveDeskSecs = Math.max(0, elapsedDeskSecs);
      }

      const deskLimitSecs = (settings.sedentaryLimitMinutes || 45) * 60;
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
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      const [hPart, mPart] = (settings.offWorkTime || '17:30').split(':').map((v) => Number(v) || 0);
      const targetTotalMinutes = hPart * 60 + mPart;
      const isPastOffWorkTime = currentTotalMinutes >= targetTotalMinutes;

      if (isPastOffWorkTime) {
        setIsOvertime(true);
        if (detectionRef.current.isFaceCurrentlyPresent) {
          detectionRef.current.overtimeTicker += 1;
          setOvertimeMinutes(Math.floor(detectionRef.current.overtimeTicker / 60));

          // Deduct 15 points every 10 minutes (600s)
          if (detectionRef.current.overtimeTicker % 600 === 0 && detectionRef.current.overtimeTicker > 0) {
            handleOvertimeDeduction();
          }
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

      // 5. Periodic Hydration Check (Trigger after elapsed interval from start or last hydration)
      const hydrationIntervalSecs = (settings.hydrationIntervalMinutes || 60) * 60;
      const elapsedSinceHydration = (Date.now() - lastHydrationTime) / 1000;
      if (
        elapsedSinceHydration >= hydrationIntervalSecs &&
        detectionRef.current.isFaceCurrentlyPresent &&
        !isSedentaryLocked &&
        !isStretchScreensaverOpen &&
        !activeHazard
      ) {
        handleTriggerHydrationAlert();
        logEvent(
          `💧 定時補水巡檢：距離上次補水已滿 ${settings.hydrationIntervalMinutes || 60} 分鐘，請起立飲水補充水分！`,
          0,
          'info',
          '💧'
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isSedentaryLocked,
    isStretchScreensaverOpen,
    isEyeStrainActive,
    activeHazard,
    settings.offWorkTime,
    settings.sedentaryLimitMinutes,
    settings.hydrationIntervalMinutes,
    lastHydrationTime,
    handleSedentaryLock,
    handleSedentaryUnlock,
    handleOvertimeDeduction,
    takeCandidWebcamSnapshot,
    handleTriggerHydrationAlert,
    logEvent,
  ]);

  // Auto-trigger BIO_CHARISMA initial face evaluation once onboarding is complete and face is first detected
  useEffect(() => {
    if (
      !isOnboardingOpen &&
      !faceScoreData &&
      !isScanningFace &&
      !hasAutoScannedRef.current &&
      isModelLoaded &&
      isCameraActive &&
      telemetry.isFacePresent
    ) {
      // Allow 1.2 seconds for camera exposure & face landmarks to stabilize before auto-computing initial charisma
      const timer = setTimeout(() => {
        if (!faceScoreData && !isScanningFace && telemetry.isFacePresent) {
          hasAutoScannedRef.current = true;
          handleScanFaceCharisma(true);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [
    isOnboardingOpen,
    faceScoreData,
    isScanningFace,
    isModelLoaded,
    isCameraActive,
    telemetry.isFacePresent,
    handleScanFaceCharisma,
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
    if (activeHazardRef.current?.type === 'slack') {
      detectionRef.current.consecutiveAwaySecs = 0;
      detectionRef.current.hasTriggeredSlackAlert = false;
    }

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
    detectionRef.current.deskSessionStartTime = Date.now();
    logEvent('已手動覆蓋久坐鎖定：站立辦公中', 0, 'info', '🧍');
  }, [logEvent]);

  const handleDismissEyeStrain = useCallback(() => {
    setIsEyeStrainActive(false);
  }, []);

  const lastStretchCompleteTimeRef = useRef<number>(0);
  const handleStretchComplete = useCallback(() => {
    const now = Date.now();
    // Guard against duplicate invocations within 4 seconds
    if (now - lastStretchCompleteTimeRef.current < 4000) {
      return;
    }
    lastStretchCompleteTimeRef.current = now;

    setIsStretchScreensaverOpen(false);
    setHealthScore((prev) => Math.min(100, prev + 15));
    setIsSedentaryLocked(false);
    detectionRef.current.consecutiveDeskSecs = 0;
    detectionRef.current.deskSessionStartTime = now;
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
    detectionRef.current.deskSessionStartTime = Date.now();
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

  const handleClockIn = useCallback(() => {
    const today = getTodayDateKey();
    const nowTs = Date.now();
    setIsClockedIn(true);
    setIsClockedOut(false);
    setIsOvertime(false);
    setOvertimeMinutes(0);
    const now = new Date();
    const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(roundedMinutes).padStart(2, '0');
    setTrendHistory([
      {
        time: `${hh}:${mm}`,
        timestamp: nowTs,
        score: healthScore,
        fatigueIndex: 1,
        stressScore: 15,
        recoveryScore: 85,
        eventDelta: 0,
        eventName: '今日打卡上班',
        eventType: 'info',
      },
    ]);
    setSessionStartTime(nowTs);
    setLastHydrationTime(nowTs);
    if (detectionRef.current) {
      detectionRef.current.deskSessionStartTime = nowTs;
      detectionRef.current.consecutiveDeskSecs = 0;
      detectionRef.current.lastFaceLeaveTimestamp = null;
      detectionRef.current.consecutiveAwaySecs = 0;
      detectionRef.current.hasTriggeredSlackAlert = false;
      detectionRef.current.overtimeTicker = 0;
    }
    try {
      localStorage.setItem('overwatch_clockin_date', today);
      localStorage.setItem('overwatch_desk_session_start', String(nowTs));
      soundSynth.playRewardJingle();
    } catch {}
    logEvent('☀️ 打卡上班：已開啟今日身心健康守護與工時倒數！', 0, 'info', '☀️');
  }, [healthScore, logEvent]);

  const handleClockInAgain = useCallback(() => {
    const today = getTodayDateKey();
    setIsClockedIn(true);
    setIsClockedOut(false);
    setIsOvertime(false);
    setOvertimeMinutes(0);
    if (detectionRef.current) {
      detectionRef.current.overtimeTicker = 0;
      detectionRef.current.deskSessionStartTime = Date.now();
    }
    setFrozenReceiptStats(null);
    setFrozenReceiptEvents(null);
    try {
      localStorage.setItem('overwatch_clockin_date', today);
    } catch {}
    logEvent('💼 已切換回「繼續上班」模式，恢復即時體徵追蹤', 0, 'info', '💼');
  }, [logEvent]);

  const handleSaveSettings = useCallback(
    (newSettings: GuardianSettings) => {
      setSettings(newSettings);
      try {
        localStorage.setItem('overwatch_settings', JSON.stringify(newSettings));
      } catch (err) {
        console.warn('Failed to save settings to localStorage:', err);
      }
      setIsSettingsOpen(false);
      logEvent(
        `守護參數已更新：久坐上限 ${newSettings.sedentaryLimitMinutes}分鐘 / 下班時間 ${newSettings.offWorkTime} / 補水提醒間隔 ${newSettings.hydrationIntervalMinutes || 60}分鐘`,
        0,
        'info',
        '⚙️'
      );
    },
    [logEvent]
  );

  const handleResetTodayData = useCallback(() => {
    const todayKey = getTodayDateKey();
    const nowTs = Date.now();
    localStorage.removeItem('overwatch_daily_state');
    localStorage.removeItem('overwatch_candid_gallery');
    localStorage.removeItem('overwatch_last_face_score');
    localStorage.removeItem('overwatch_trend_snapshot');
    localStorage.removeItem('overwatch_desk_session_start');

    setHealthScore(100);
    const now = new Date();
    const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(roundedMinutes).padStart(2, '0');
    setTrendHistory([
      {
        time: `${hh}:${mm}`,
        timestamp: nowTs,
        score: 100,
        fatigueIndex: 1,
        eventDelta: 0,
        eventName: '今日數據重置啟動',
        eventType: 'info',
      },
    ]);
    setStatsSummary({
      yawnsCaught: 0,
      frownsCaught: 0,
      sedentaryLocksCount: 0,
      slackMinutesEarned: 0,
      overtimeMinutes: 0,
    });
    setEvents([
      {
        id: `reset_${nowTs}`,
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        type: 'system',
        message: `🧹 已為您一鍵重置今日健康存摺與所有累計紀錄 (${todayKey})`,
        delta: 0,
        icon: '🧹',
      },
    ]);
    setIsClockedIn(true);
    setIsClockedOut(false);
    setFrozenReceiptStats(null);
    setFrozenReceiptEvents(null);
    setSessionStartTime(nowTs);
    setLastHydrationTime(nowTs);
    setOvertimeMinutes(0);
    setIsOvertime(false);
    const baselineCharisma = getBaselineCharismaScore();
    setFaceScoreData(baselineCharisma);
    hasAutoScannedRef.current = false;
    try {
      localStorage.setItem('overwatch_last_face_score', JSON.stringify(baselineCharisma));
      localStorage.setItem('overwatch_clockin_date', todayKey);
      localStorage.setItem('overwatch_desk_session_start', String(nowTs));
    } catch {}
    setCandidGallery([]);
    if (detectionRef.current) {
      detectionRef.current.deskSessionStartTime = nowTs;
      detectionRef.current.overtimeTicker = 0;
      detectionRef.current.consecutiveDeskSecs = 0;
      detectionRef.current.yawnConsecutiveCount = 0;
    }

    triggerToast({
      title: '🧹 今日數據已成功歸零重置！',
      desc: '已清空歷史紀錄與累積體徵，恢復 100 分滿血健康存摺起點！',
      badge: 'RESET',
      badgeColor: 'bg-emerald-500 text-slate-950',
      type: 'blink',
    });
  }, [triggerToast]);

  const handleCompleteOnboarding = useCallback(
    (newSettings: GuardianSettings) => {
      setSettings(newSettings);
      const today = getTodayDateKey();
      const nowTs = Date.now();
      try {
        localStorage.setItem('overwatch_settings', JSON.stringify(newSettings));
        localStorage.setItem('overwatch_user_initialized', 'true');
        localStorage.setItem('overwatch_clockin_date', today);
        localStorage.setItem('overwatch_desk_session_start', String(nowTs));
      } catch (err) {
        console.warn('Failed to save onboarding settings to localStorage:', err);
      }
      setIsOnboardingOpen(false);
      setIsClockedIn(true);
      setIsClockedOut(false);
      const now = new Date();
      const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(roundedMinutes).padStart(2, '0');
      setTrendHistory([
        {
          time: `${hh}:${mm}`,
          timestamp: nowTs,
          score: 100,
          fatigueIndex: 1,
          stressScore: 15,
          recoveryScore: 85,
          eventDelta: 0,
          eventName: '今日打卡上班',
          eventType: 'info',
        },
      ]);
      setSessionStartTime(nowTs);
      setLastHydrationTime(nowTs);
      if (detectionRef.current) {
        detectionRef.current.deskSessionStartTime = nowTs;
        detectionRef.current.consecutiveDeskSecs = 0;
      }
      logEvent(
        `守護者系統初次校準完成：生理年齡 ${newSettings.baseAge} 歲，今日表定下班 ${newSettings.offWorkTime}，已自動打卡上班，光學監控全線啟動！`,
        0,
        'info',
        '🛡️'
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
                OVERWHELTCH
                <span className="hidden md:inline text-cyan-400"> // WATCH BEFORE YOU OVERWHELM</span>
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
              <span className="hidden md:inline text-slate-500 truncate">趣味辦公室身心健康與高壓監視器</span>
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
            style={{ height: '28px', width: '84px' }}
            className={`flex items-center justify-center gap-1 rounded text-[10px] sm:text-[11px] font-bold border transition-all ${
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
        </div>
      </header>

      {/* Main Content Layout - Matches navbar margins with no max-w restriction */}
      <main className="flex-1 w-full px-2.5 sm:px-6 py-3 sm:py-5 flex flex-col gap-5">
        {/* Row 1: Camera Feed (Left 8 cols) & HUD + Facial Score (Right 4 cols) - 100% Equal Height */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-h-0">
          {/* Left / Center View: Camera & Controls - Matches right column height dynamically */}
          <div
            style={rightColumnHeight ? { height: `${rightColumnHeight}px` } : undefined}
            className="lg:col-span-8 flex flex-col h-full min-h-0"
          >
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
              isShutterFlashing={isShutterFlashing}
            />
          </div>

          {/* Right Column: Gamified HUD & Facial Charisma Radar */}
          <div ref={rightColumnRef} className="lg:col-span-4 flex flex-col gap-4">
            <FloatingHUD
              healthScore={healthScore}
              baseAge={settings.baseAge}
              isOvertime={isOvertime}
              offWorkTime={settings.offWorkTime}
              overtimeMinutes={overtimeMinutes}
              currentEmotion={telemetry.emotion}
              isClockedIn={isClockedIn}
              isClockedOut={isClockedOut}
              onClockIn={handleClockIn}
              onClockInAgain={handleClockInAgain}
              onClockOut={() => {
                if (!isClockedOut) {
                  const currentStats = getSummaryStats();
                  setFrozenReceiptStats(currentStats);
                  setFrozenReceiptEvents([...events]);
                  setIsClockedOut(true);
                  setIsOvertime(false);
                  try {
                    soundSynth.playRewardJingle();
                  } catch {}
                  logEvent('🏁 打卡下班完成！今日戰鬥結束，已生成結算收據', 0, 'info', '🏁');
                }
                setIsReceiptOpen(true);
              }}
              onTriggerOvertime={() => handleOvertimeDeduction(true)}
              onOpenCandidGallery={() => setIsCandidGalleryOpen(true)}
              candidCount={candidGallery.length}
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

        {/* Row 2: Health & Fatigue Trend Chart Side-by-Side with Activity Log - 100% Equal Height */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-0 lg:h-[460px]">
          <div className="lg:col-span-7 flex flex-col h-full min-h-0">
            <HealthTrendChart
              trendHistory={trendHistory}
              events={events}
              currentScore={healthScore}
              currentEmotion={telemetry.emotion}
              telemetry={telemetry}
              statsSummary={statsSummary}
              sedentaryLimitMinutes={settings.sedentaryLimitMinutes}
            />
          </div>
          <div className="lg:col-span-5 flex flex-col h-full min-h-0">
            <ActivityLogView events={events} onClear={handleClearEvents} />
          </div>
        </div>

        {/* Temporary / Dev Operator Override Bench (Moved to very bottom for easy deprecation) */}
        <div className="pt-0 pl-0 border-0 opacity-70 hover:opacity-100 transition-opacity">
          <DemoSimulationBar
            onTriggerSedentary={handleSedentaryLock}
            onTriggerProximity={handleProximityBlur}
            onTriggerYawn={handleYawnPenalty}
            onTriggerBlink={handleBlinkPenalty}
            onTriggerFrown={handleFrownPenalty}
            onTriggerSlack={handleTriggerDemoSlack}
            onTriggerOvertime={() => handleOvertimeDeduction(true)}
            onTriggerHourlyBeautyAlert={handleTriggerHydrationAlert}
          />
        </div>
      </main>

      {/* Surveillance Terminal Status Footer */}
      <footer className="py-2.5 px-2.5 sm:px-6 text-[10px] sm:text-[11px] font-mono text-slate-500 border-t border-slate-800/80 bg-[#06080e]/90 flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2 select-none tracking-wider">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="flex items-center gap-1 text-cyan-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            [LOCAL_EDGE_INFERENCE: 100%]
          </span>
          <span className="text-slate-600">//</span>
          <span className="text-slate-400">ZERO_CLOUD_UPLINK</span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-500">AIR_GAPPED_PRIVACY</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-slate-800 text-slate-300 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
            <span className="text-slate-400">OPTICAL_SURVEILLANCE:</span>
            <span className="text-emerald-400">ACTIVE</span>
          </span>
        </div>
      </footer>

      {/* Modals */}
      <InitialOnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
        defaultSettings={settings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        settings={settings}
        onSave={handleSaveSettings}
        onResetTodayData={handleResetTodayData}
      />

      <DailyReceiptModal
        isOpen={isReceiptOpen}
        onClose={handleCloseReceipt}
        stats={frozenReceiptStats || getSummaryStats()}
        events={frozenReceiptEvents || events}
        isClockedOut={isClockedOut}
        onClockInAgain={handleClockInAgain}
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
