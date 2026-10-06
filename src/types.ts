export interface HealthEvent {
  id: string;
  timestamp: string;
  type: 'penalty' | 'reward' | 'info' | 'system';
  message: string;
  delta: number;
  icon: string;
}

export interface MemeToastItem {
  id: string;
  title: string;
  desc: string;
  badge: string;
  badgeColor: string;
  image: string;
  type: 'yawn' | 'frown' | 'slack' | 'overtime' | 'sedentary' | 'general';
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
  type: 'yawn' | 'frown' | 'sedentary' | 'proximity' | 'overtime' | 'slack';
  title: string;
  message: string;
  badge: string;
  severity: 'critical' | 'warning' | 'reward';
  image?: string;
  timestamp: number;
}

export interface TelemetryData {
  mar: number;
  frown: number;
  proximity: number;
  blinkScore: number;
  isFacePresent: boolean;
  consecutiveDeskSeconds: number;
  consecutiveAwaySeconds: number;
  isYawning: boolean;
  isFrowning: boolean;
  isTooClose: boolean;
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

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
      window: Window | null;
    };
  }
}
