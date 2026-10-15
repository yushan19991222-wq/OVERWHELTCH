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
import { evaluateDailyAppraisal } from './utils/receiptEvaluator';
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
  lastClockOutTime?: number;
  lastClockOutDeskSecs?: number;
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
      localStorage.removeItem('overwatch_last_clockout');
      localStorage.removeItem('overwatch_desk_session_start');
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
  const [hazardQueue, setHazardQueue] = useState<Array<{ hazard: ActiveHazardAlert; voiceSpeechText: string }>>([]);

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
        lastClockOutTime: lastClockOutInfoRef.current?.timestamp,
        lastClockOutDeskSecs: lastClockOutInfoRef.current?.consecutiveDeskSecs,
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

  const telemetryRef = useRef<TelemetryData>(telemetry);
  telemetryRef.current = telemetry;
  const healthScoreRef = useRef<number>(healthScore);
  healthScoreRef.current = healthScore;
  const isClockedInRef = useRef<boolean>(isClockedIn);
  isClockedInRef.current = isClockedIn;
  const isClockedOutRef = useRef<boolean>(isClockedOut);
  isClockedOutRef.current = isClockedOut;
  const isStretchScreensaverOpenRef = useRef<boolean>(isStretchScreensaverOpen);
  isStretchScreensaverOpenRef.current = isStretchScreensaverOpen;
  const isSedentaryLockedRef = useRef<boolean>(isSedentaryLocked);
  isSedentaryLockedRef.current = isSedentaryLocked;
  const hasTriggeredInitialOvertimeRef = useRef<boolean>(false);

  // Track last clock-out event on the same day for resuming sedentary time if re-clocking in within 5 minutes
  const lastClockOutInfoRef = useRef<{
    timestamp: number;
    date: string;
    consecutiveDeskSecs: number;
  } | null>(null);

  if (lastClockOutInfoRef.current === null && typeof window !== 'undefined') {
    try {
      const today = getTodayDateKey();
      const raw = localStorage.getItem('overwatch_last_clockout');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === today && typeof parsed.timestamp === 'number') {
          lastClockOutInfoRef.current = parsed;
        }
      } else if (initialSession?.lastClockOutTime && initialSession.date === today) {
        lastClockOutInfoRef.current = {
          timestamp: initialSession.lastClockOutTime,
          date: today,
          consecutiveDeskSecs: initialSession.lastClockOutDeskSecs || 0,
        };
      }
    } catch {}
  }

  const recordClockOutState = useCallback(() => {
    const nowTs = Date.now();
    const today = getTodayDateKey();
    const currentDeskSecs = detectionRef.current.consecutiveDeskSecs || 0;
    const info = {
      timestamp: nowTs,
      date: today,
      consecutiveDeskSecs: currentDeskSecs,
    };
    lastClockOutInfoRef.current = info;
    try {
      localStorage.setItem('overwatch_last_clockout', JSON.stringify(info));
    } catch {}
    return info;
  }, []);

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
    lastFrownFrameTime: 0,
    frownCooldown: 0,
    proximityStartTime: 0 as number | null,
    hasTriggeredThisProximity: false,
    proximityCooldown: 0,
    consecutiveDeskSecs: 0,
    consecutiveAwaySecs: 0,
    deskSessionStartTime: (initialSession?.deskSessionStartTime || initialSession?.sessionStartTime || (typeof window !== 'undefined' && localStorage.getItem('overwatch_desk_session_start') ? Number(localStorage.getItem('overwatch_desk_session_start')) : null)) as number | null,
    lastFaceLeaveTimestamp: null as number | null,
    hasTriggeredSlackAlert: false,
    slackCooldown: 0,
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
    latestDistanceCm: 50,
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
    lastVideoTimestamp: 0,
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
          const instantFrownLoad = (telemetry.frown >= 0.15 ? 2.5 : 0);
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
            (telemetry.frown > 0.10 ? ((telemetry.frown - 0.10) / 0.15) * 30 : 0) +
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

          return [...history, newPoint].slice(-180);
        });

        return nextScore;
      });
      logEvent(reason, delta, delta < 0 ? 'penalty' : 'reward', icon);
    },
    [logEvent, telemetry, settings.sedentaryLimitMinutes]
  );

  // Helper to reliably sample & log a trend point for the current 5-minute slot
  const recordPeriodicTrendPoint = useCallback((force: boolean = false) => {
    if (!isClockedInRef.current || isClockedOutRef.current) {
      return;
    }

    const now = new Date();
    const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(roundedMinutes).padStart(2, '0');
    const timeSlot = `${hh}:${mm}`;
    const curTelemetry = telemetryRef.current;
    const curScore = healthScoreRef.current;

    setTrendHistory((history) => {
      // If not forced and slot already has a record, do nothing
      if (!force && history.length > 0 && history[history.length - 1].time === timeSlot) {
        return history;
      }

      // Composite 6-axis fatigue evaluation for idle periodic sampling
      const currentFatigueLoad = Math.min(
        10,
        Math.max(
          1,
          Math.round(
            (curTelemetry.mar > 0.45 ? 3 : 0) +
            (curTelemetry.frown >= 0.15 ? 2.5 : 0) +
            (curTelemetry.proximity > 60 ? 2 : 0) +
            (curTelemetry.isFrequentBlinking ? 2 : 0) +
            (detectionRef.current.consecutiveDeskSecs > (settings.sedentaryLimitMinutes * 50) ? 2.5 : 0) +
            (curScore < 80 ? 1 : 0)
          )
        )
      );

      const deskMins = (detectionRef.current.consecutiveDeskSecs || 0) / 60;
      const currentStress = Math.min(100, Math.max(12, Math.round(
        (deskMins / 10) * 5.5 +
        (curTelemetry.frown > 0.10 ? ((curTelemetry.frown - 0.10) / 0.15) * 30 : 0) +
        (curTelemetry.proximity > 45 ? ((curTelemetry.proximity - 45) / 25) * 20 : 0)
      )));
      const currentRecovery = Math.min(100, Math.max(15, Math.round(
        curScore * 0.60 +
        (curTelemetry.proximity > 0 && curTelemetry.proximity <= 45 ? 8 : 0) +
        ((curTelemetry.emotion?.label === '愉悅微笑' || curTelemetry.emotion?.label === '放鬆平靜') ? 10 : 0) -
        Math.max(0, (deskMins - 15) * 1.2)
      )));

      const newPoint: HealthTrendPoint = {
        time: timeSlot,
        timestamp: now.getTime(),
        score: curScore,
        fatigueIndex: currentFatigueLoad,
        stressScore: currentStress,
        recoveryScore: currentRecovery,
        eventDelta: 0,
        eventName: '六維綜合巡檢',
        eventType: 'info' as const,
        emotionLabel: curTelemetry.emotion?.label,
        emotionEmoji: curTelemetry.emotion?.emoji,
      };

      if (history.length > 0 && history[history.length - 1].time === timeSlot) {
        const copy = [...history];
        copy[copy.length - 1] = newPoint;
        return copy;
      }

      return [...history, newPoint].slice(-180);
    });
  }, [settings.sedentaryLimitMinutes]);

  // Auto record health score every 5-minute real-time interval reliably without frame interference
  useEffect(() => {
    if (!isClockedIn || isClockedOut) {
      return;
    }

    // Immediately record current slot point upon mount or active clocking-in
    recordPeriodicTrendPoint();

    // Regular steady heartbeat timer (5s check interval)
    const timer = setInterval(() => {
      recordPeriodicTrendPoint();
    }, 5000);

    // When tab becomes active or window gains focus (e.g. after lunch break or screen wake), refresh current point
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        recordPeriodicTrendPoint(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isClockedIn, isClockedOut, recordPeriodicTrendPoint]);

  const dispatchHazardAlertImmediate = useCallback(
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
      if (settings.soundEnabled && !isMeetingMode) {
        speakVoiceAlert(voiceSpeechText);
      }

      // 3. Flashing background tab title
      if (typeof document !== 'undefined' && document.hidden) {
        startTitleFlashing(hazard.title);
      }

      // 4. Cross-tab synchronization
      broadcastCrossTabEvent('hazard_alert', hazard);
    },
    [settings.desktopNotificationsEnabled, settings.soundEnabled, isMeetingMode]
  );

  const processNextInQueue = useCallback(() => {
    setHazardQueue((prevQueue) => {
      if (prevQueue.length === 0) return prevQueue;
      const [nextItem, ...remaining] = prevQueue;
      setTimeout(() => {
        dispatchHazardAlertImmediate(nextItem.hazard, nextItem.voiceSpeechText);
      }, 150);
      return remaining;
    });
  }, [dispatchHazardAlertImmediate]);

  // Cross-tab & Multi-interface Hazard Dispatcher (OS Notifications, TTS Voice, Title Flashing, PiP)
  const dispatchHazardAlert = useCallback(
    (hazard: ActiveHazardAlert, voiceSpeechText: string) => {
      // If any major mechanism (hazard, sedentary lock, eye strain, stretch screensaver) is currently active, queue it up sequentially
      if (
        activeHazardRef.current ||
        isSedentaryLockedRef.current ||
        isStretchScreensaverOpenRef.current ||
        isEyeStrainActive
      ) {
        setHazardQueue((prev) => [...prev, { hazard, voiceSpeechText }]);
        return;
      }

      dispatchHazardAlertImmediate(hazard, voiceSpeechText);
    },
    [isEyeStrainActive, dispatchHazardAlertImmediate]
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleRecordWater = useCallback(() => {
    setIsSedentaryLocked(false);
    detectionRef.current.consecutiveDeskSecs = 0;
    setLastHydrationTime(Date.now());
    modifyScore(+10, '補充水分 300ml：成功補充水分，補水週期重新起算 (+10點)', '💧');
    soundSynth.playWaterComplete();
  }, [modifyScore]);

  // Multi-tab synchronization listener
  useEffect(() => {
    const unsubscribe = subscribeCrossTabEvents((event) => {
      if (event.type === 'sedentary_lock') {
        handleSedentaryLock();
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
          ctx.fillText(`+ [OVERWHELTCH] +`, 12, 20);

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
    soundSynth.playFrownPenalty();

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
      soundSynth.playWaterTrigger();
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
    soundSynth.playProximityAlert();
    
    // Voice alert & notifications
    if (settings.soundEnabled && !isMeetingMode) {
      speakVoiceAlert('距離螢幕過近！請向後靠上椅背拉開距離！');
    }
    if (settings.desktopNotificationsEnabled && !isMeetingMode) {
      fireDesktopNotification({
        title: '距離過近警告',
        body: '頭部過度貼近螢幕（低於 30cm）！請靠上椅背保持自然姿勢視距 >35cm！',
        tag: 'ohg-proximity',
        requireInteraction: true,
      });
    }
  }, [modifyScore, settings.soundEnabled, settings.desktopNotificationsEnabled, isMeetingMode]);

  const handleProximityCalibrationSuccess = useCallback(() => {
    setIsEyeStrainActive(false);
    detectionRef.current.proximityCooldown = 4;
    detectionRef.current.hasTriggeredThisProximity = false;
    detectionRef.current.proximityStartTime = null;
    triggerToast({
      title: '自然護眼距離已鎖定',
      desc: '已維持自然姿勢視距 >35cm，視力防護就緒',
      badge: '校準成功',
      badgeColor: 'bg-emerald-500 text-slate-950',
      image: '/memes/cat-curious.jpg',
      type: 'blink',
    });
    logEvent('護眼雷達：成功維持自然姿勢視距 >35cm 並完成校準', 0, 'reward', 'CALIBRATED');
  }, [triggerToast, logEvent]);

  const handleSedentaryLock = useCallback(() => {
    // Directly launch the exquisite 30-second Stickman Calisthenics stretch screen!
    setStretchScreensaverReason('sedentary');
    setIsStretchScreensaverOpen(true);
    isStretchScreensaverOpenRef.current = true;
    modifyScore(-5, '連續久坐超過時限：啟動 30 秒站立伸展體操 (-5點)', '🪑');
    setStatsSummary((s) => ({ ...s, sedentaryLocksCount: s.sedentaryLocksCount + 1 }));
    soundSynth.playSedentaryAlarm();
    broadcastCrossTabEvent('sedentary_lock', true);

    if (typeof document !== 'undefined' && document.hidden) {
      startTitleFlashing('🚨【久坐超時】請起立伸展！');
    }

    if (settings.soundEnabled && !isMeetingMode) {
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
  }, [modifyScore, settings.soundEnabled, settings.desktopNotificationsEnabled, isMeetingMode]);

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
    if (settings.soundEnabled && !isMeetingMode) {
      speakVoiceAlert('恭喜成功起立離座活動！鎖定已解除，血液重新流動！');
    }
    processNextInQueue();
  }, [logEvent, triggerToast, settings.soundEnabled, isMeetingMode, processNextInQueue]);

  const handleClaimSlackReward = useCallback(
    (earnedPoints: number, awaySecs: number) => {
      const mins = Math.max(1, Math.floor(awaySecs / 60));
      const points = Math.max(5, earnedPoints);

      modifyScore(points, `離座摸魚大成功！離開工位 ${mins} 分鐘 (+${points}點)`, '☕');
      setStatsSummary((s) => ({ ...s, slackMinutesEarned: s.slackMinutesEarned + mins }));
      soundSynth.playRewardJingle();

      // Completely clear away state so it cannot re-trigger immediately
      detectionRef.current.lastFaceLeaveTimestamp = null;
      detectionRef.current.consecutiveAwaySecs = 0;
      detectionRef.current.hasTriggeredSlackAlert = true; // Mark as claimed for this away session
      detectionRef.current.slackCooldown = 60; // 60s protective cooldown
      detectionRef.current.deskSessionStartTime = Date.now(); // Reset desk sitting timer

      // Purge any pending slack alerts from queue
      setHazardQueue((prev) => prev.filter((item) => item.hazard.type !== 'slack'));
      setActiveHazard(null);
      activeHazardRef.current = null;
      if (activeHazardTimeoutRef.current) {
        clearTimeout(activeHazardTimeoutRef.current);
        activeHazardTimeoutRef.current = null;
      }

      triggerToast({
        title: '☕ 摸魚獎金已領取！',
        desc: `成功摸魚 ${mins} 分鐘，健康存摺進帳 +${points} BP`,
        badge: `+${points} BP`,
        badgeColor: 'bg-emerald-400 text-slate-950',
        image: '/memes/cat-chill.jpg',
        type: 'slack',
      });
    },
    [modifyScore, triggerToast]
  );

  const handleSlackReward = useCallback(
    (minutes: number) => {
      // Calculate points dynamically: 5 BP for each 5-minute block
      const fiveMinBlocks = Math.max(1, Math.floor(minutes / 5));
      const points = fiveMinBlocks * 5;

      modifyScore(points, `榮耀薪水小偷！成功離開座位摸魚 ${minutes} 分鐘 (+${points}點)`, '☕');
      setStatsSummary((s) => ({ ...s, slackMinutesEarned: s.slackMinutesEarned + minutes }));
      soundSynth.playRewardJingle();
      triggerToast({
        title: '☕ 離座摸魚獎勵',
        desc: `離座滿 ${minutes} 分鐘，每5分鐘+5BP，健康存摺自動回血`,
        badge: `+${points} BP`,
        badgeColor: 'bg-emerald-400 text-slate-950',
        image: '/memes/cat-chill.jpg',
        type: 'slack',
      });

      // Avoid duplicate popup if slack modal is already open
      if (!activeHazardRef.current || activeHazardRef.current.type !== 'slack') {
        dispatchHazardAlert(
          {
            type: 'slack',
            title: '🏆 薪水小偷 Lv.MAX！',
            message: `成功離開座位摸魚 ${minutes} 分鐘！每 5 分鐘累計 +5 BP，適度摸魚才是長壽工作的大師哲學！`,
            badge: `回血 +${points} 點`,
            severity: 'reward',
            image: '/memes/cat-chill.jpg',
            timestamp: Date.now(),
          },
          `恭喜薪水小偷離座摸魚${minutes}分鐘，健康存摺回血${points}點！`
        );
      }
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
    soundSynth.playOvertimeAlarm();
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
      recordClockOutState();
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
  }, [logEvent, recordClockOutState]);

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

  // Heartbeat tracker to detect TRUE OS-level sleep / suspension (where JS execution completely stopped)
  const lastHeartbeatTimeRef = useRef<number>(Date.now());

  // Auto handle true OS sleep / system wake up & tab visibility
  useEffect(() => {
    // Check for true system sleep/hibernation:
    // When the laptop lid closes or system sleeps, all timers and JS execution stop completely.
    // If the elapsed time between two 1-second ticks is > 25 seconds, the OS was suspended.
    const sleepCheckTimer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastHeartbeatTimeRef.current;
      if (elapsed > 25000) {
        console.log(`💻 [SYSTEM_SLEEP] Real OS suspension detected (frozen for ${(elapsed / 1000).toFixed(1)}s). Adjusting timers.`);
        if (detectionRef.current.deskSessionStartTime) {
          detectionRef.current.deskSessionStartTime += elapsed;
          try {
            localStorage.setItem('overwatch_desk_session_start', String(detectionRef.current.deskSessionStartTime));
          } catch {}
        }
        setLastHydrationTime((prev) => prev + elapsed);
        detectionRef.current.lastFaceLeaveTimestamp = null;
        detectionRef.current.hasTriggeredSlackAlert = false;
        detectionRef.current.consecutiveAwaySecs = 0;
        if (activeHazardRef.current?.type === 'slack' || activeHazardRef.current?.type === 'sedentary') {
          setActiveHazard(null);
        }
      }
      lastHeartbeatTimeRef.current = now;
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        stopTitleFlashing();
        startCamera();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(sleepCheckTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startCamera]);

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
    let animationFrameId: number | null = null;
    let bgTimeoutId: number | null = null;
    let isCancelled = false;

    async function processLoop() {
      if (isCancelled) return;

      // 0. Automatic Daily Reset check in real-time frame loop (ensures midnight / cross-day reset triggers immediately)
      const todayDateKey = getTodayDateKey();
      if (currentDayDateRef.current !== todayDateKey) {
        console.log('🌅 [MIDNIGHT_DETECTED] Date changed from', currentDayDateRef.current, 'to', todayDateKey);
        performDailyReset(todayDateKey);
        animationFrameId = requestAnimationFrame(processLoop);
        return;
      }

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
            let videoTimestamp = Math.round(performance.now());
            if (videoTimestamp <= detectionRef.current.lastVideoTimestamp) {
              videoTimestamp = detectionRef.current.lastVideoTimestamp + 1;
            }
            detectionRef.current.lastVideoTimestamp = videoTimestamp;
            const results = landmarker.detectForVideo(video, videoTimestamp);
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
              // When looking down or camera angle is low, noseRelY increases (> 0.460 indicates downward head tilt)
              const isLookingDown = noseRelY > 0.460;
              const pitchDownDev = Math.max(0, noseRelY - 0.450);
              const pitchDampener = Math.max(0.08, 1 - pitchDownDev * 6.5);

              // Eye Gaze Downward Direction (looking down with eyes, e.g. at keyboard or lower screen)
              const eyeLookDownL =
                blendshapes.find((b) => b.categoryName === 'eyeLookDownLeft')?.score || 0;
              const eyeLookDownR =
                blendshapes.find((b) => b.categoryName === 'eyeLookDownRight')?.score || 0;
              const eyeLookDownVal = (eyeLookDownL + eyeLookDownR) / 2;
              const gazeDownDampener = Math.max(0.10, 1 - eyeLookDownVal * 2.5);
              const isGazeDown = eyeLookDownVal > 0.12;
              const isHeadOrGazeDown = isLookingDown || pitchDownDev > 0 || isGazeDown;

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
                isLookingSideways = yawDev > 0.22; // Catch genuine head turns while allowing natural desk gaze angles
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
              // Corrugator supercilii contraction (AU4: Brow Lowerer)
              const browDownL =
                blendshapes.find((b) => b.categoryName === 'browDownLeft')?.score || 0;
              const browDownR =
                blendshapes.find((b) => b.categoryName === 'browDownRight')?.score || 0;
              const browInnerUpL =
                blendshapes.find((b) => b.categoryName === 'browInnerUp')?.score || 0;
              const browInnerUpR =
                blendshapes.find((b) => b.categoryName === 'browInnerUp')?.score || 0;
              const browInnerUpVal = (browInnerUpL + browInnerUpR) / 2;

              // Biological Noise Gate for browDown:
              // Resting relaxed human faces typically hover around 0.01 ~ 0.035 in FaceMesh.
              // Subtract 0.03 deadband so a neutral relaxed face cleanly reads 0.00 ~ 0.02.
              const activeBrowDownL = Math.max(0, browDownL - 0.03);
              const activeBrowDownR = Math.max(0, browDownR - 0.03);
              const activeBrowAvg = (activeBrowDownL + activeBrowDownR) / 2;
              const activeBrowMax = Math.max(activeBrowDownL, activeBrowDownR);

              // Geometric Inner Eyebrow Compression (#107 vs #336 normalized to eye span #33 vs #263)
              // Normal relaxed human ratio is ~0.28 to 0.35.
              // Contraction happens when ratio squeezes below 0.27 AND active brow muscular tension is present.
              const rightInnerBrow = landmarks[107] || landmarks[66];
              const leftInnerBrow = landmarks[336] || landmarks[296];
              const rightEyeCorner = landmarks[33];
              const leftEyeCorner = landmarks[263];

              let geomFurrow = 0;
              if (
                rightInnerBrow &&
                leftInnerBrow &&
                rightEyeCorner &&
                leftEyeCorner &&
                eyeLookDownVal < 0.50
              ) {
                const eyeSpan = Math.max(0.01, Math.hypot(leftEyeCorner.x - rightEyeCorner.x, leftEyeCorner.y - rightEyeCorner.y));
                const browSpan = Math.hypot(leftInnerBrow.x - rightInnerBrow.x, leftInnerBrow.y - rightInnerBrow.y);
                const ratio = browSpan / eyeSpan;
                if (ratio < 0.27 && (activeBrowMax > 0.02 || activeBrowAvg > 0.01)) {
                  geomFurrow = Math.min(0.12, (0.27 - ratio) * 2.2);
                }
              }

              // Active brow signal:
              // Natural, comfortable brow furrowing easily reaches 0.16~0.25 (passing 0.15 threshold)
              // without requiring exaggerated, unnatural facial contortions!
              const rawBrowSignal =
                (activeBrowMax * 0.70 + activeBrowAvg * 0.30) * 1.45 +
                geomFurrow;

              // Micro-stress hints (nose sneer / mouth frown / lip press) provide slight boost if brow is engaged
              const microStressBoost = activeBrowMax > 0.04
                ? Math.max(noseSneerVal * 0.10, mouthFrownVal * 0.10, mouthPressVal * 0.06)
                : 0;

              let baseBrowScore = rawBrowSignal + microStressBoost;

              // If user is distinctly raising inner eyebrows (surprise, relief, high arch), suppress frown
              if (browInnerUpVal > 0.22) {
                baseBrowScore *= Math.max(0, 1 - (browInnerUpVal - 0.22) * 2.5);
              }

              // Inhibit looking down false positives ONLY when user is looking down heavily at lap or phone
              if (isHeadOrGazeDown && (eyeLookDownVal > 0.55 || pitchDownDev > 0.22)) {
                const gazeSuppression = Math.max(0, (eyeLookDownVal - 0.55) * 2.0);
                const pitchSuppression = Math.max(0, (pitchDownDev - 0.22) * 4.0);
                const totalDownSuppression = Math.min(0.80, gazeSuppression + pitchSuppression);
                baseBrowScore *= (1 - totalDownSuppression);
              }

              // Inhibit smile/laughter false positives
              if (smileVal > 0.22 || lipCornerElevation > 0.04) {
                const smileDamp = Math.max((smileVal - 0.22) * 3.5, (lipCornerElevation - 0.04) * 15);
                baseBrowScore *= Math.max(0, 1 - Math.min(1, smileDamp));
              }

              // Inhibit extreme jaw opening / yawn / speech
              if (jawVal > 0.28) {
                baseBrowScore *= Math.max(0, 1 - (jawVal - 0.28) * 3.0);
              }

              // Side-angle mild dampener
              if (isLookingSideways && yawDev > 0.35) {
                baseBrowScore *= Math.max(0.3, 1 - (yawDev - 0.35) * 2.5);
              }

              const rawBrowPressure = Math.max(0, baseBrowScore);
              const prevBrow = detectionRef.current.latestBrowPressure ?? rawBrowPressure;
              // Responsive EMA: 0.70 new + 0.30 prev gives rapid responsive feedback
              const browPressure = Number((prevBrow * 0.30 + rawBrowPressure * 0.70).toFixed(2));
              detectionRef.current.latestBrowPressure = browPressure;
              const frownVal = browPressure;

              // 5. Proximity / Screen Distance (Ergonomically Calibrated Desk Posture Scale)
              // Landmark 10 (forehead) and 152 (chin) provide the primary vertical face span.
              // Anatomical ratio of vertical face span to bi-ocular width (corners 33 and 263) is ~1.45.
              const vertSpan = foreheadPt && chinPt ? Math.hypot(chinPt.x - foreheadPt.x, chinPt.y - foreheadPt.y) : faceHeight;
              const eyeSpan = leftEyeCornerPt && rightEyeCornerPt ? Math.hypot(rightEyeCornerPt.x - leftEyeCornerPt.x, rightEyeCornerPt.y - leftEyeCornerPt.y) : 0;
              // Compensate for pitch foreshortening if user tilts head down (e.g. typing or looking down)
              const pitchCompensatedVert = isLookingDown && pitchDownDev > 0 ? vertSpan / Math.max(0.85, 1 - pitchDownDev * 0.8) : vertSpan;
              // Combined anthropometric skeletal span
              const effectiveBoneSpan = eyeSpan > 0.05 ? Math.max(pitchCompensatedVert, eyeSpan * 1.45) : vertSpan;
              // Calibrated physical sitting distance in cm (optical inverse scale):
              const rawDistCm = effectiveBoneSpan > 0 ? Math.round(17.5 / effectiveBoneSpan) : 45;
              const prevDist = detectionRef.current.latestDistanceCm || rawDistCm;
              const distCm = Math.round(prevDist * 0.35 + rawDistCm * 0.65);
              detectionRef.current.latestDistanceCm = distCm;

              // Proximity percentage derived from distance for UI bars
              const rawProximity = Math.round(Math.max(10, Math.min(100, (65 - distCm) * 1.5)));
              const prevProximity = detectionRef.current.latestProximityPct || rawProximity;
              const proximityPct = Math.round(prevProximity * 0.35 + rawProximity * 0.65);
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
                ((blinkL >= (isLookingDown ? 0.74 : 0.68) && blinkR >= (isLookingDown ? 0.74 : 0.68)) ||
                 (blinkAvg >= (isLookingDown ? 0.76 : 0.70)) ||
                 (ear < (isLookingDown ? 0.11 : 0.125) && blinkAvg > 0.55));
              const isEyesClosedNow = bothEyesClosed;

              const eyeOpenVal = Math.max(0, 1 - blinkScore);
              const browRelaxVal = Math.max(0, 1 - frownVal);

              // Store latest features for AI Charisma Scanner
              detectionRef.current.latestSmile = smileVal;
              detectionRef.current.latestBrowRelaxation = browRelaxVal;
              detectionRef.current.latestEyeOpenness = eyeOpenVal;
              detectionRef.current.latestProximityPct = proximityPct;

              // Robust Blink Impulse State Machine:
              // Genuine blink duration: 90ms ~ 380ms (filters camera noise jitter <90ms & slow looks down).
              // Enforce 280ms refractory period between blinks to prevent single slow blinks or micro-twitches counting multiple times.
              if (isEyesClosedNow) {
                if (!detectionRef.current.wasBlinking) {
                  detectionRef.current.wasBlinking = true;
                  detectionRef.current.blinkClosureStartTime = now;
                }
              } else {
                if (detectionRef.current.wasBlinking) {
                  const closureDuration = now - detectionRef.current.blinkClosureStartTime;
                  if (closureDuration >= 90 && closureDuration <= 380) {
                    if (now - detectionRef.current.lastBlinkPeakTime > 280) {
                      detectionRef.current.lastBlinkPeakTime = now;
                      detectionRef.current.blinkTimestamps.push(now);
                    }
                  }
                  detectionRef.current.wasBlinking = false;
                }
              }

              // Prune old blink timestamps (> 5.0s sliding window)
              // Rapid bursts of 6+ blinks within 5.0 seconds trigger dry-eye fatigue
              detectionRef.current.blinkTimestamps = detectionRef.current.blinkTimestamps.filter(
                (t) => now - t <= 5000
              );

              // Trigger criterion: Rapid Dry-Eye Fluttering (>= 6 rapid consecutive blinks within 5.0 seconds)
              // Continuous eye closure does not trigger alerts per user request.
              const isRapidBlinking = detectionRef.current.blinkTimestamps.length >= 6;
              const isFrequentBlinkingNow = isRapidBlinking;

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
                detectionRef.current.blinkCooldown = 60; // 60s protective buffer
              }

              // Update desk / away trackers (continues seamlessly in active and background modes)
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
                  // Only dispatch if not already triggered or open
                  if (
                    awayDurationSecs <= 7200 &&
                    !detectionRef.current.hasTriggeredSlackAlert &&
                    (!activeHazardRef.current || activeHazardRef.current.type !== 'slack')
                  ) {
                    const mins = Math.min(60, Math.max(5, Math.floor(awayDurationSecs / 60)));
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
                // Only reset hasTriggeredSlackAlert if slack modal is not currently open
                if (!activeHazardRef.current || activeHazardRef.current.type !== 'slack') {
                  detectionRef.current.hasTriggeredSlackAlert = false;
                }
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
                !isStretchScreensaverOpenRef.current &&
                !isSedentaryLockedRef.current
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

              // Frown Trigger Check:
              // Natural confused or stressed frown: frownVal >= 0.15, sustained for 1.2s
              // (300ms grace window for facial landmark micro-jitter).
              // Must NOT be yawning, jaw open, blinking/closing eyes, or smiling!
              const isFrowningNow =
                frownVal >= 0.15 &&
                !isLookingSideways &&
                eyeLookDownVal < 0.55 &&
                pitchDownDev <= 0.22 &&
                !isYawningNow &&
                !isEyesClosedNow &&
                blinkAvg < 0.55 &&
                jawVal < 0.28 &&
                smileVal < 0.22;
              let currentFrownElapsedSecs = 0;
              if (isFrowningNow) {
                detectionRef.current.lastFrownFrameTime = performance.now();
                if (!detectionRef.current.frownStartTime) {
                  detectionRef.current.frownStartTime = performance.now();
                }
                const elapsedFrown =
                  (performance.now() - detectionRef.current.frownStartTime) / 1000;
                currentFrownElapsedSecs = elapsedFrown;
                if (
                  isTrackingActive &&
                  elapsedFrown >= 1.2 &&
                  !detectionRef.current.hasTriggeredThisFrown &&
                  detectionRef.current.frownCooldown <= 0 &&
                  !activeHazardRef.current
                ) {
                  handleFrownPenalty();
                  detectionRef.current.hasTriggeredThisFrown = true;
                  detectionRef.current.frownCooldown = 20; // 20s buffer to prevent alert fatigue
                }
              } else {
                // 300ms grace buffer for landmark flicker: don't instantly reset progress if face flickers for 1 frame
                if (performance.now() - (detectionRef.current.lastFrownFrameTime || 0) > 300) {
                  detectionRef.current.frownStartTime = null;
                  detectionRef.current.hasTriggeredThisFrown = false;
                }
              }

              // Proximity Trigger Check (< 30cm indicates too close)
              // Uses jitter-resilient hysteresis (keeps timing if distance stays < 33cm) and 0.6s sustained duration:
              const isTooCloseNow = distCm < 30;
              const isInCloseZone = distCm < 33;

              if (isTooCloseNow || (detectionRef.current.proximityStartTime && isInCloseZone)) {
                if (!detectionRef.current.proximityStartTime) {
                  detectionRef.current.proximityStartTime = performance.now();
                }
                const elapsedClose =
                  (performance.now() - detectionRef.current.proximityStartTime) / 1000;

                // Reset trigger lock if cooldown has finished
                if (detectionRef.current.proximityCooldown <= 0) {
                  detectionRef.current.hasTriggeredThisProximity = false;
                }

                if (
                  !isClockedOut &&
                  elapsedClose >= 0.6 &&
                  !isEyeStrainActive &&
                  detectionRef.current.proximityCooldown <= 0 &&
                  !detectionRef.current.hasTriggeredThisProximity
                ) {
                  handleProximityBlur();
                  detectionRef.current.hasTriggeredThisProximity = true;
                  detectionRef.current.proximityCooldown = 4; // 4s buffer
                  detectionRef.current.proximityStartTime = null;
                }
              } else {
                detectionRef.current.proximityStartTime = null;
                if (detectionRef.current.proximityCooldown <= 0) {
                  detectionRef.current.hasTriggeredThisProximity = false;
                }
              }

              // Decay buffer cooldowns
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
              if (detectionRef.current.slackCooldown > 0) {
                detectionRef.current.slackCooldown -= delta;
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
                distanceCm: distCm,
                blinkScore,
                ear,
                isEyesClosed: isEyesClosedNow,
                blinkCountWindow: detectionRef.current.blinkTimestamps.length,
                prolongedCloseSeconds: 0,
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

              // Away tracker (tracks absence accurately across active and background modes)

              if (!detectionRef.current.lastFaceLeaveTimestamp) {
                detectionRef.current.lastFaceLeaveTimestamp = Date.now();
              }

              const awaySecs = (Date.now() - detectionRef.current.lastFaceLeaveTimestamp) / 1000;
              const defaultSlackTargetSecs = 300; // 5 mins default
              detectionRef.current.consecutiveAwaySecs = awaySecs;

              // Only reset desk timer if continuous away time reaches >= 300 seconds (5 minutes)
              if (awaySecs >= 300) {
                detectionRef.current.consecutiveDeskSecs = 0;
              }

              // While away: decay slack cooldown if running
              if (detectionRef.current.slackCooldown > 0) {
                detectionRef.current.slackCooldown -= delta;
              }

              // While away: if away time reaches 5m (300s) and alert has not triggered
              // ONLY trigger if user is actively CLOCKED IN and NOT CLOCKED OUT!
              const isTrackingActiveNow = isClockedIn && !isClockedOut;
              if (
                isTrackingActiveNow &&
                isCameraActive &&
                awaySecs >= defaultSlackTargetSecs &&
                awaySecs <= 7200 &&
                !detectionRef.current.hasTriggeredSlackAlert &&
                detectionRef.current.slackCooldown <= 0 &&
                (!activeHazardRef.current || activeHazardRef.current.type !== 'slack')
              ) {
                detectionRef.current.hasTriggeredSlackAlert = true;
                const mins = Math.max(5, Math.floor(awaySecs / 60));
                const fiveMinBlocks = Math.floor(awaySecs / 300);
                const points = fiveMinBlocks * 5;
                dispatchHazardAlert(
                  {
                    type: 'slack',
                    title: '☕ 離座摸魚健康修復 // 薪水小偷 Lv.MAX',
                    message: `已離座滿 ${mins} 分鐘！每離座 5 分鐘累計 +5 BP，回座時點擊領取獎金！`,
                    badge: `離座 ${mins} 分鐘 (+${points} BP)`,
                    severity: 'reward',
                    image: '/memes/cat-chill.jpg',
                    timestamp: Date.now(),
                  },
                  `離座滿 ${mins} 分鐘，摸魚獎金持續累計中！`
                );
              }

              setTelemetry((prev) => ({
                ...prev,
                mar: 0,
                frown: 0,
                proximity: 0,
                distanceCm: undefined,
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

      if (isCancelled) return;
      if (typeof document !== 'undefined' && document.hidden) {
        // Tab is in background: requestAnimationFrame is suspended by browsers.
        // Use setTimeout to continue background face & desk monitoring at ~1-2 fps
        bgTimeoutId = window.setTimeout(processLoop, 500);
      } else {
        animationFrameId = requestAnimationFrame(processLoop);
      }
    }

    const handleVisibilitySwitch = () => {
      if (typeof document !== 'undefined' && !document.hidden && !isCancelled) {
        if (bgTimeoutId !== null) {
          clearTimeout(bgTimeoutId);
          bgTimeoutId = null;
        }
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(processLoop);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilitySwitch);

    if (typeof document !== 'undefined' && document.hidden) {
      bgTimeoutId = window.setTimeout(processLoop, 500);
    } else {
      animationFrameId = requestAnimationFrame(processLoop);
    }

    return () => {
      isCancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilitySwitch);
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      if (bgTimeoutId !== null) clearTimeout(bgTimeoutId);
    };
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

  // Dedicated helper to thoroughly reset all metrics, modals, queues, and trackers for a new day
  const performDailyReset = useCallback((newDayKey: string) => {
    console.log('🌅 [DAILY_RESET] Resetting daily state for:', newDayKey);
    currentDayDateRef.current = newDayKey;

    // 1. Immediately dismiss any open hazard screensaver, clear queues & locks
    setActiveHazard(null);
    activeHazardRef.current = null;
    if (activeHazardTimeoutRef.current) {
      clearTimeout(activeHazardTimeoutRef.current);
      activeHazardTimeoutRef.current = null;
    }
    setHazardQueue([]);
    setIsSedentaryLocked(false);
    setIsEyeStrainActive(false);
    setIsStretchScreensaverOpen(false);

    // 2. Reset score & statistics
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
        message: `🌅 跨日自動重置：已為您載入 ${newDayKey} 全新一日健康存摺，請點擊「上班打卡」啟動守護`,
        delta: 0,
        icon: '🌅',
      },
    ]);

    // 3. Reset clock-in status for the new day
    setIsClockedIn(false);
    setIsClockedOut(false);
    lastClockOutInfoRef.current = null;
    setSessionStartTime(Date.now());
    setLastHydrationTime(Date.now());
    setOvertimeMinutes(0);
    setIsOvertime(false);

    // 4. Reset all detection trackers
    detectionRef.current.lastFaceLeaveTimestamp = null;
    detectionRef.current.consecutiveAwaySecs = 0;
    detectionRef.current.hasTriggeredSlackAlert = false;
    detectionRef.current.slackCooldown = 0;
    detectionRef.current.consecutiveDeskSecs = 0;
    detectionRef.current.deskSessionStartTime = null;
    detectionRef.current.overtimeTicker = 0;
    hasTriggeredInitialOvertimeRef.current = false;
    detectionRef.current.blinkTimestamps = [];
    detectionRef.current.yawnStartTime = null;
    detectionRef.current.frownStartTime = null;
    detectionRef.current.lastFrownFrameTime = 0;

    // 5. Purge old localStorage data
    try {
      localStorage.removeItem('overwatch_daily_state');
      localStorage.removeItem('overwatch_clockin_date');
      localStorage.removeItem('overwatch_last_clockout');
      localStorage.removeItem('overwatch_desk_session_start');
      localStorage.removeItem('overwatch_trend_snapshot');
    } catch {}

    const baselineCharisma = getBaselineCharismaScore();
    setFaceScoreData(baselineCharisma);
    hasAutoScannedRef.current = false;
    try {
      localStorage.setItem('overwatch_last_face_score', JSON.stringify(baselineCharisma));
    } catch {}

    setCandidGallery((prev) => prev.filter((item) => new Date(item.timestamp).toLocaleDateString('en-CA') === newDayKey));
  }, []);

  /* ====================================================================
     Background Interval: Sedentary, Eye Strain & Overtime Tick
     ==================================================================== */
  useEffect(() => {
    const timer = setInterval(() => {
      // 0. Midnight Rollover Check (Automatic Daily Reset on New Day)
      const currentDayKey = getTodayDateKey();
      if (currentDayDateRef.current !== currentDayKey) {
        performDailyReset(currentDayKey);
      }

      // If user clocked out or user has NOT clocked in yet, pause background ticker
      if (isClockedOutRef.current || !isClockedInRef.current) {
        return;
      }

      // 1. Sedentary Limit Check (tracks continuous sitting session at desk)
      if (detectionRef.current.deskSessionStartTime) {
        const awaySecs = detectionRef.current.lastFaceLeaveTimestamp
          ? (Date.now() - detectionRef.current.lastFaceLeaveTimestamp) / 1000
          : 0;
        // As long as user hasn't left the desk continuously for >= 5 minutes (300s)
        if (awaySecs < 300) {
          const elapsedDeskSecs = Math.floor((Date.now() - detectionRef.current.deskSessionStartTime) / 1000);
          detectionRef.current.consecutiveDeskSecs = Math.max(0, elapsedDeskSecs);
          setTelemetry((prev) => ({
            ...prev,
            consecutiveDeskSeconds: detectionRef.current.consecutiveDeskSecs,
          }));
        }
      }

      const deskLimitSecs = (settings.sedentaryLimitMinutes || 45) * 60;
      if (
        detectionRef.current.consecutiveDeskSecs >= deskLimitSecs &&
        !isStretchScreensaverOpenRef.current &&
        !isSedentaryLockedRef.current
      ) {
        handleSedentaryLock();
      }

      // If Sedentary is Locked, countdown ONLY advances if user is ABSENT!
      if (isSedentaryLockedRef.current) {
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
        // Prompt immediate overtime alarm & screensaver modal the moment scheduled off-work time arrives
        if (!hasTriggeredInitialOvertimeRef.current) {
          hasTriggeredInitialOvertimeRef.current = true;
          handleOvertimeDeduction();
        }

        if (detectionRef.current.isFaceCurrentlyPresent) {
          detectionRef.current.overtimeTicker += 1;
          setOvertimeMinutes(Math.floor(detectionRef.current.overtimeTicker / 60));

          // Deduct 15 points every 10 minutes (600s) of continued overtime
          if (detectionRef.current.overtimeTicker % 600 === 0 && detectionRef.current.overtimeTicker > 0) {
            handleOvertimeDeduction();
          }
        }
      } else {
        setIsOvertime(false);
        hasTriggeredInitialOvertimeRef.current = false;
        detectionRef.current.overtimeTicker = 0;
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
    isClockedIn,
    isClockedOut,
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
    const appraisal = evaluateDailyAppraisal({
      healthScore,
      yawnsCaught: statsSummary.yawnsCaught,
      frownsCaught: statsSummary.frownsCaught,
      sedentaryLocksCount: statsSummary.sedentaryLocksCount,
      slackMinutesEarned: statsSummary.slackMinutesEarned,
      overtimeMinutes: statsSummary.overtimeMinutes,
    });

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
      title: appraisal.title,
      quote: appraisal.quote,
    };
  };

  // Memoized handlers to ensure stable references across 60fps renders
  const handleDismissHazard = useCallback(() => {
    if (activeHazardRef.current?.type === 'slack') {
      detectionRef.current.lastFaceLeaveTimestamp = null;
      detectionRef.current.consecutiveAwaySecs = 0;
      detectionRef.current.hasTriggeredSlackAlert = true;
      detectionRef.current.slackCooldown = 60;
      setHazardQueue((prev) => prev.filter((item) => item.hazard.type !== 'slack'));
    }
    if (activeHazardRef.current?.type === 'blink') {
      detectionRef.current.blinkCooldown = 60;
      detectionRef.current.blinkTimestamps = [];
    }

    setActiveHazard(null);
    activeHazardRef.current = null;
    if (activeHazardTimeoutRef.current) {
      clearTimeout(activeHazardTimeoutRef.current);
      activeHazardTimeoutRef.current = null;
    }
    processNextInQueue();
  }, [processNextInQueue]);

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
    detectionRef.current.proximityCooldown = 4;
    detectionRef.current.hasTriggeredThisProximity = false;
    detectionRef.current.proximityStartTime = null;
    processNextInQueue();
  }, [processNextInQueue]);

  const lastStretchCompleteTimeRef = useRef<number>(0);
  const handleStretchComplete = useCallback(() => {
    const now = Date.now();
    // Guard against duplicate invocations within 1.5 seconds
    if (now - lastStretchCompleteTimeRef.current < 1500) {
      return;
    }
    lastStretchCompleteTimeRef.current = now;

    setIsStretchScreensaverOpen(false);
    isStretchScreensaverOpenRef.current = false;
    setActiveHazard(null);
    if (activeHazardTimeoutRef.current) {
      clearTimeout(activeHazardTimeoutRef.current);
      activeHazardTimeoutRef.current = null;
    }
    setHealthScore((prev) => Math.min(100, prev + 15));
    setIsSedentaryLocked(false);
    isSedentaryLockedRef.current = false;
    stopTitleFlashing();
    detectionRef.current.consecutiveDeskSecs = 0;
    detectionRef.current.deskSessionStartTime = now;

    if (settings.desktopNotificationsEnabled && !isMeetingMode && typeof document !== 'undefined' && document.hidden) {
      fireDesktopNotification({
        title: '🎉 30 秒動態體操完成！',
        body: '脊椎有效減壓，健康存摺 +15 點，久坐計時已重置！',
        tag: 'ohg-stretch-complete',
        requireInteraction: false,
      });
    }

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
    processNextInQueue();
  }, [triggerToast, logEvent, settings.desktopNotificationsEnabled, isMeetingMode, processNextInQueue]);

  const handleStretchDismiss = useCallback(() => {
    setIsStretchScreensaverOpen(false);
    isStretchScreensaverOpenRef.current = false;
    setIsSedentaryLocked(false);
    isSedentaryLockedRef.current = false;
    stopTitleFlashing();
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

  const handleClockOut = useCallback(() => {
    recordClockOutState();
    if (!isClockedOut || !frozenReceiptStats) {
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
  }, [isClockedOut, frozenReceiptStats, events, getSummaryStats, logEvent, recordClockOutState]);

  const handleClockIn = useCallback(() => {
    const today = getTodayDateKey();
    const nowTs = Date.now();
    setIsClockedIn(true);
    setIsClockedOut(false);
    setIsOvertime(false);
    setOvertimeMinutes(0);
    hasTriggeredInitialOvertimeRef.current = false;

    const lastClockOut = lastClockOutInfoRef.current;
    let shouldResumeSedentary = false;
    let resumedDeskSecs = 0;

    if (lastClockOut && lastClockOut.date === today && typeof lastClockOut.timestamp === 'number') {
      const intervalSecs = (nowTs - lastClockOut.timestamp) / 1000;
      // 同一日下班後重新上班，若間隔未超過5分鐘 (<= 300秒)
      if (intervalSecs >= 0 && intervalSecs <= 300) {
        shouldResumeSedentary = true;
        resumedDeskSecs = Math.max(0, lastClockOut.consecutiveDeskSecs || 0);
      }
    }

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
        eventName: shouldResumeSedentary ? '恢復打卡上班' : '今日打卡上班',
        eventType: 'info',
      },
    ]);
    setSessionStartTime(nowTs);
    setLastHydrationTime(nowTs);
    if (detectionRef.current) {
      if (shouldResumeSedentary && resumedDeskSecs > 0) {
        detectionRef.current.deskSessionStartTime = nowTs - (resumedDeskSecs * 1000);
        detectionRef.current.consecutiveDeskSecs = resumedDeskSecs;
      } else {
        detectionRef.current.deskSessionStartTime = nowTs;
        detectionRef.current.consecutiveDeskSecs = 0;
      }
      detectionRef.current.lastFaceLeaveTimestamp = null;
      detectionRef.current.consecutiveAwaySecs = 0;
      detectionRef.current.hasTriggeredSlackAlert = false;
      detectionRef.current.overtimeTicker = 0;
    }

    setTelemetry((prev) => ({
      ...prev,
      consecutiveDeskSeconds: shouldResumeSedentary ? resumedDeskSecs : 0,
    }));

    try {
      localStorage.setItem('overwatch_clockin_date', today);
      if (detectionRef.current?.deskSessionStartTime) {
        localStorage.setItem('overwatch_desk_session_start', String(detectionRef.current.deskSessionStartTime));
      }
      soundSynth.playRewardJingle();
    } catch {}

    if (shouldResumeSedentary && resumedDeskSecs > 0) {
      const mins = Math.floor(resumedDeskSecs / 60);
      const secs = Math.round(resumedDeskSecs % 60);
      const timeStr = mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
      logEvent(`☀️ 打卡上班：下班間隔未滿 5 分鐘，久坐時間接續計算（已累積 ${timeStr}）`, 0, 'info', '☀️');
      triggerToast({
        title: '☀️ 重新打卡・久坐接續計算',
        desc: `下班間隔未滿 5 分鐘，久坐時間不歸零並繼續累計（已累積 ${timeStr}）`,
        badge: '久坐接續',
        badgeColor: 'bg-cyan-500 text-slate-950 font-bold',
        type: 'general',
      });
    } else {
      logEvent('☀️ 打卡上班：已開啟今日身心健康守護與工時倒數！', 0, 'info', '☀️');
    }
  }, [healthScore, logEvent, triggerToast]);

  const handleClockInAgain = useCallback(() => {
    const today = getTodayDateKey();
    const nowTs = Date.now();
    setIsClockedIn(true);
    setIsClockedOut(false);
    setIsOvertime(false);
    setOvertimeMinutes(0);

    const lastClockOut = lastClockOutInfoRef.current;
    let shouldResumeSedentary = false;
    let resumedDeskSecs = 0;

    if (lastClockOut && lastClockOut.date === today && typeof lastClockOut.timestamp === 'number') {
      const intervalSecs = (nowTs - lastClockOut.timestamp) / 1000;
      // 同一日下班後重新上班，若間隔未超過5分鐘 (<= 300秒)
      if (intervalSecs >= 0 && intervalSecs <= 300) {
        shouldResumeSedentary = true;
        resumedDeskSecs = Math.max(0, lastClockOut.consecutiveDeskSecs || 0);
      }
    }

    if (detectionRef.current) {
      detectionRef.current.overtimeTicker = 0;
      detectionRef.current.lastFaceLeaveTimestamp = null;
      detectionRef.current.consecutiveAwaySecs = 0;
      detectionRef.current.hasTriggeredSlackAlert = false;

      if (shouldResumeSedentary && resumedDeskSecs > 0) {
        // 久坐時間繼續計算，不從零開始
        detectionRef.current.deskSessionStartTime = nowTs - (resumedDeskSecs * 1000);
        detectionRef.current.consecutiveDeskSecs = resumedDeskSecs;
      } else {
        // 超過 5 分鐘或無紀錄：重新從 0 開始
        detectionRef.current.deskSessionStartTime = nowTs;
        detectionRef.current.consecutiveDeskSecs = 0;
      }
      try {
        localStorage.setItem(
          'overwatch_desk_session_start',
          String(detectionRef.current.deskSessionStartTime)
        );
      } catch {}
    }

    setTelemetry((prev) => ({
      ...prev,
      consecutiveDeskSeconds: shouldResumeSedentary ? resumedDeskSecs : 0,
    }));

    setFrozenReceiptStats(null);
    setFrozenReceiptEvents(null);
    try {
      localStorage.setItem('overwatch_clockin_date', today);
    } catch {}

    // Record an active trend point for the current time slot immediately
    const now = new Date();
    const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(roundedMinutes).padStart(2, '0');
    const timeSlot = `${hh}:${mm}`;

    setTrendHistory((history) => {
      const curHealth = healthScoreRef.current || 100;
      const resumePoint: HealthTrendPoint = {
        time: timeSlot,
        timestamp: nowTs,
        score: curHealth,
        fatigueIndex: 1,
        stressScore: 18,
        recoveryScore: Math.min(100, Math.max(15, Math.round(curHealth * 0.65))),
        eventDelta: 0,
        eventName: '恢復打卡追蹤',
        eventType: 'info',
      };
      if (history.length > 0 && history[history.length - 1].time === timeSlot) {
        const copy = [...history];
        copy[copy.length - 1] = resumePoint;
        return copy;
      }
      return [...history, resumePoint].slice(-180);
    });

    if (shouldResumeSedentary && resumedDeskSecs > 0) {
      const mins = Math.floor(resumedDeskSecs / 60);
      const secs = Math.round(resumedDeskSecs % 60);
      const timeStr = mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
      logEvent(`💼 重新上班：下班間隔未滿 5 分鐘，久坐時間接續計算（已累積 ${timeStr}）`, 0, 'info', '💼');
      triggerToast({
        title: '💼 重新上班・久坐接續計算',
        desc: `下班間隔未滿 5 分鐘，久坐時間不歸零並繼續累計（已累積 ${timeStr}）`,
        badge: '久坐接續',
        badgeColor: 'bg-cyan-500 text-slate-950 font-bold',
        type: 'general',
      });
    } else {
      logEvent('💼 已切換回「繼續上班」模式，恢復即時體徵追蹤（久坐計時重新起算）', 0, 'info', '💼');
    }
  }, [logEvent, triggerToast]);

  const handleSaveSettings = useCallback(
    (newSettings: GuardianSettings) => {
      if (newSettings.offWorkTime !== settings.offWorkTime) {
        hasTriggeredInitialOvertimeRef.current = false;
        detectionRef.current.overtimeTicker = 0;
      }
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
    [logEvent, settings.offWorkTime]
  );

  const handleResetTodayData = useCallback(() => {
    const todayKey = getTodayDateKey();
    const nowTs = Date.now();
    localStorage.removeItem('overwatch_daily_state');
    localStorage.removeItem('overwatch_candid_gallery');
    localStorage.removeItem('overwatch_last_face_score');
    localStorage.removeItem('overwatch_trend_snapshot');
    localStorage.removeItem('overwatch_desk_session_start');
    localStorage.removeItem('overwatch_last_clockout');
    lastClockOutInfoRef.current = null;

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

      <EyeStrainBlurOverlay
        isOpen={isEyeStrainActive}
        proximityPct={telemetry.proximity}
        distanceCm={telemetry.distanceCm}
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
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 truncate font-medium">智慧身心健視器</span>
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
              onTriggerFrown={handleFrownPenalty}
              onTriggerBlink={handleBlinkPenalty}
              onTriggerProximity={handleProximityBlur}
              isClockedIn={isClockedIn}
              onClockIn={handleClockIn}
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
              onClockOut={handleClockOut}
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
          <span className="text-slate-400">© 2026 Yushan Huang. All Rights Reserved</span>
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
          onClaimSlack={handleClaimSlackReward}
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
