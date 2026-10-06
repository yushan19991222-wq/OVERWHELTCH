export interface HealthEvent {
  id: string;
  timestamp: string;
  type: 'penalty' | 'reward' | 'info' | 'system';
  message: string;
  delta: number;
  icon: string;
}

export type EmotionType =
  | 'laugh'
  | 'smile'
  | 'subtle_smile'
  | 'pout'
  | 'gasp'
  | 'yawn'
  | 'frown'
  | 'pressed'
  | 'blank'
  | 'focused'
  | 'neutral';

export interface EmotionData {
  type: EmotionType;
  label: string;
  emoji: string;
  score: number;
  colorClass: string;
}

export interface HealthTrendPoint {
  time: string;
  timestamp: number;
  score: number;
  fatigueIndex: number;
  emotionLabel?: string;
  emotionEmoji?: string;
  eventDelta: number;
  eventName?: string;
  eventType?: 'penalty' | 'reward' | 'info';
}

export interface MemeToastItem {
  id: string;
  title: string;
  desc: string;
  badge: string;
  badgeColor: string;
  image?: string;
  type: 'yawn' | 'frown' | 'slack' | 'overtime' | 'sedentary' | 'blink' | 'general';
}

export interface GuardianSettings {
  baseAge: number;
  offWorkTime: string;
  sedentaryLimitMinutes: number;
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  voiceAlertsEnabled: boolean;
}

export interface ActiveHazardAlert {
  type: 'yawn' | 'frown' | 'sedentary' | 'proximity' | 'overtime' | 'slack' | 'blink' | 'beauty_score';
  title: string;
  message: string;
  badge: string;
  severity: 'critical' | 'warning' | 'reward';
  image?: string;
  faceCenter?: { x: number; y: number };
  eyePositions?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    eyeDistance: number;
    rotationDeg: number;
  };
  timestamp: number;
}

export interface FaceCharismaScore {
  score: number; // e.g. 96
  title: string; // e.g. "韓團 C 位級神仙神顏"
  rank: 'SSS' | 'SS' | 'S' | 'A+' | 'A' | 'B' | 'C' | 'D';
  comment: string;
  metrics: {
    radiance: number; // 氣場高光
    sparkle: number; // 眼神電力
    smilePower: number; // 笑容治癒力
    symmetry: number; // 黃金比例
    charisma: number; // 總裁氣場
  };
  timestamp: number;
  highlightTag: string;
  source?: string;
}

export interface TelemetryData {
  mar: number;
  frown: number;
  proximity: number;
  blinkScore: number;
  ear?: number;
  isEyesClosed?: boolean;
  blinkCountWindow?: number;
  prolongedCloseSeconds?: number;
  blinkRatePerMin?: number;
  smileScore?: number;
  emotion?: EmotionData;
  isFacePresent: boolean;
  consecutiveDeskSeconds: number;
  consecutiveAwaySeconds: number;
  isYawning: boolean;
  isFrowning: boolean;
  isTooClose: boolean;
  isFrequentBlinking?: boolean;
}

export interface DailySummaryStats {
  date: string;
  baseAge: number;
  finalBodyAge: number;
  finalHealthScore: number;
  yawnsCaught: number;
  frownsCaught: number;
  sedentaryLocksCount: number;
  slackMinutesEarned: number;
  overtimeMinutes: number;
  title: string;
  quote: string;
}

export interface CandidSnapshotItem {
  id: string;
  image: string;
  tag: string;
  type: 'yawn' | 'frown' | 'blink' | 'candid' | 'scan';
  time: string;
  timestamp: number;
  faceCenter?: { x: number; y: number };
  eyePositions?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    eyeDistance: number;
    rotationDeg: number;
  };
}

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
      window: Window | null;
    };
  }
}
