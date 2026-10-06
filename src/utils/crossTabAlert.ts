/**
 * Cross-Tab & Cross-Interface Interceptor Service
 * Handles:
 * 1. OS-Level Native System Desktop Notifications (with requireInteraction: true)
 * 2. Web Speech Synthesis Voice Alerts (zh-TW natural voice broadcast)
 * 3. Document Title flashing for background tab alerting
 * 4. Cross-tab BroadcastChannel state synchronization
 */

let titleFlashInterval: number | null = null;
let originalDocumentTitle = typeof document !== 'undefined' ? document.title : 'Office Health Guardian';

// Broadcast channel for multi-tab sync
let alertBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    alertBroadcastChannel = new BroadcastChannel('ohg_health_interceptor_sync');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported:', e);
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return 'denied';
  }
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export interface DesktopAlertOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Fires a native OS-level desktop notification that floats over ALL windows and tabs
 */
export function fireDesktopNotification(options: DesktopAlertOptions): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notif = new Notification(options.title, {
      body: options.body,
      icon:
        options.icon ||
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=128&auto=format&fit=crop&q=80',
      badge: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=64&auto=format&fit=crop&q=80',
      tag: options.tag || 'ohg-alert',
      requireInteraction: options.requireInteraction !== false, // Default to true so it doesn't auto-dismiss!
    });

    notif.onclick = () => {
      try {
        window.focus();
      } catch {
        // focus fallback
      }
      notif.close();
    };

    return notif;
  } catch (err) {
    console.warn('Failed to fire desktop notification:', err);
    return null;
  }
}

/**
 * Web Speech Synthesis voice warning to interrupt the user even when tab is backgrounded
 */
export function speakVoiceAlert(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // cancel pending speech to prevent queuing lag
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 1.08;
    utterance.pitch = 1.0;

    // Pick a Chinese voice if available
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find((v) => v.lang === 'zh-TW' || v.lang === 'zh-HK' || v.lang.startsWith('zh'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Flashes the document tab title vigorously to catch attention across tabs
 */
export function startTitleFlashing(alertText: string) {
  if (typeof document === 'undefined') return;
  stopTitleFlashing();

  originalDocumentTitle = document.title || 'Office Health Guardian';
  let isAlert = true;

  titleFlashInterval = window.setInterval(() => {
    document.title = isAlert ? `🚨 ${alertText}` : `⚠️ [OHG 阻擋中]`;
    isAlert = !isAlert;
  }, 600);

  const onFocus = () => {
    stopTitleFlashing();
    window.removeEventListener('focus', onFocus);
  };
  window.addEventListener('focus', onFocus);
}

export function stopTitleFlashing() {
  if (titleFlashInterval !== null) {
    clearInterval(titleFlashInterval);
    titleFlashInterval = null;
    if (typeof document !== 'undefined') {
      document.title = originalDocumentTitle;
    }
  }
}

const tabInstanceId = Math.random().toString(36).substring(2, 9);

/**
 * Broadcast event across multiple browser tabs
 */
export function broadcastCrossTabEvent(type: string, payload: unknown) {
  if (alertBroadcastChannel) {
    try {
      alertBroadcastChannel.postMessage({ type, payload, senderId: tabInstanceId, timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
}

export function subscribeCrossTabEvents(handler: (event: { type: string; payload: unknown }) => void): () => void {
  if (!alertBroadcastChannel) return () => {};

  const listener = (event: MessageEvent) => {
    if (event.data && event.data.senderId !== tabInstanceId) {
      handler(event.data);
    }
  };

  alertBroadcastChannel.addEventListener('message', listener);
  return () => {
    alertBroadcastChannel?.removeEventListener('message', listener);
  };
}
