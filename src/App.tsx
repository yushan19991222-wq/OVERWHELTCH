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
  MemeToastItem,
  GuardianSettings,
  TelemetryData,
  DailySummaryStats,
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
import { DemoSimulationBar } from './components/DemoSimulationBar';

export default function App() {
  // Application State
  const [healthScore, setHealthScore] = useState<number>(100);
  const [settings, setSettings] = useState<GuardianSettings>({
    baseAge: 25,
    offWorkTime: '18:30',
    sedentaryLimitMinutes: 45,
    soundEnabled: true,
  });

  const [isMeetingMode, setIsMeetingMode] = useState<boolean>(false);
  const [showMesh, setShowMesh] = useState<boolean>(true);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isSedentaryLocked, setIsSedentaryLocked] = useState<boolean>(false);
  const [sedentaryRemainingSeconds, setSedentaryRemainingSeconds] = useState<number>(15);

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
  });

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
      }, 4500);
    },
    [isMeetingMode]
  );

  // Score modifier helper
  const modifyScore = useCallback(
    (delta: number, reason: string, icon: string = '⚡') => {
      setHealthScore((prev) => Math.max(0, Math.min(120, prev + delta)));
      logEvent(reason, delta, delta < 0 ? 'penalty' : 'reward', icon);
    },
    [logEvent]
  );

  /* ====================================================================
     Detection Triggers (Both real-time AI & demo triggers)
     ==================================================================== */
  const handleYawnPenalty = useCallback(() => {
    modifyScore(-5, '大哈欠抓包：嘴巴大開 > 1.5s (-5點)', '🥱');
    setStatsSummary((s) => ({ ...s, yawnsCaught: s.yawnsCaught + 1 }));
    soundSynth.playYawnAlert();
    triggerToast({
      title: '老闆正在你背後看著你！👀',
      desc: '偵測到嘴部張開超過 1.5 秒，打哈欠會傳染！快喝口水提神！',
      badge: '扣 5 點',
      badgeColor: 'bg-rose-500 text-white',
      image:
        'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&auto=format&fit=crop&q=80',
      type: 'yawn',
    });
  }, [modifyScore, triggerToast]);

  const handleFrownPenalty = useCallback(() => {
    modifyScore(-3, '長期緊皺眉頭：怨念氣場爆棚 (-3點)', '😠');
    setStatsSummary((s) => ({ ...s, frownsCaught: s.frownsCaught + 1 }));
    soundSynth.playWarningBuzz();
    triggerToast({
      title: '這點薪水不值得你皺眉！🐕',
      desc: '偵測到怨氣沖天眉頭深鎖！可愛柴犬為你療癒，深呼吸放鬆額頭！',
      badge: '扣 3 點',
      badgeColor: 'bg-amber-500 text-slate-950',
      image:
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&auto=format&fit=crop&q=80',
      type: 'frown',
    });
  }, [modifyScore, triggerToast]);

  const handleProximityBlur = useCallback(() => {
    setIsEyeStrainActive(true);
    setEyeStrainProgress(0);
    setEyeStrainRemaining(5);
    modifyScore(-5, '眼球過近 / 眨眼頻率過低：畫面模糊護眼 (-5點)', '👀');
    soundSynth.playWarningBuzz();
  }, [modifyScore]);

  const handleSedentaryLock = useCallback(() => {
    setIsSedentaryLocked(true);
    setSedentaryRemainingSeconds(15);
    modifyScore(-10, '嚴重連續久坐超過時限：觸發全螢幕迷因貓鎖定 (-10點)', '🪑');
    setStatsSummary((s) => ({ ...s, sedentaryLocksCount: s.sedentaryLocksCount + 1 }));
    soundSynth.playWarningBuzz();
  }, [modifyScore]);

  const handleSedentaryUnlock = useCallback(() => {
    setIsSedentaryLocked(false);
    detectionRef.current.consecutiveDeskSecs = 0;
    soundSynth.playRewardJingle();
    logEvent('恭喜起立活動！屁股與椅子成功分離，血液恢復流動', 0, 'info', '🎉');
    triggerToast({
      title: '🎉 恭喜離開座位活動！',
      desc: '屁股成功與椅子分離，血液重新流動，椎間盤向你深深致謝！',
      badge: '久坐解除',
      badgeColor: 'bg-emerald-500 text-slate-950',
      image:
        'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=200&auto=format&fit=crop&q=80',
      type: 'sedentary',
    });
  }, [logEvent, triggerToast]);

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
        image:
          'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=200&auto=format&fit=crop&q=80',
        type: 'slack',
      });
    },
    [modifyScore, triggerToast]
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
      image:
        'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&auto=format&fit=crop&q=80',
      type: 'overtime',
    });
  }, [modifyScore, triggerToast]);

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

              // 4. Blinking
              const blinkL =
                blendshapes.find((b) => b.categoryName === 'eyeBlinkLeft')?.score || 0;
              const blinkR =
                blendshapes.find((b) => b.categoryName === 'eyeBlinkRight')?.score || 0;
              const blinkScore = Math.max(blinkL, blinkR);

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
              handleSedentaryUnlock();
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
          const pct = ((5 - next) / 5) * 100;
          setEyeStrainProgress(pct);
          if (next <= 0) {
            setIsEyeStrainActive(false);
            logEvent('眼部放鬆完成，畫面模糊已解除', 0, 'info', '👀');
            return 0;
          }
          return next;
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
    }, 1000);

    return () => clearInterval(timer);
  }, [
    settings,
    isSedentaryLocked,
    isEyeStrainActive,
    handleSedentaryLock,
    handleSedentaryUnlock,
    handleOvertimeDeduction,
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Full-Screen Overlays */}
      <SedentaryLockModal
        isOpen={isSedentaryLocked}
        remainingSeconds={sedentaryRemainingSeconds}
        isFacePresent={telemetry.isFacePresent}
        onEmergencyOverride={() => {
          setIsSedentaryLocked(false);
          detectionRef.current.consecutiveDeskSecs = 0;
          logEvent('已手動覆蓋久坐鎖定：站立辦公中', 0, 'info', '🧍');
        }}
      />

      <EyeStrainBlurOverlay
        isOpen={isEyeStrainActive}
        progressPct={eyeStrainProgress}
        remainingSeconds={eyeStrainRemaining}
        onDismiss={() => {
          setIsEyeStrainActive(false);
          logEvent('已手動解除眼肌放鬆模糊', 0, 'info', '👀');
        }}
      />

      {/* Meme Floating Toasts */}
      <MemeToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Main Header */}
      <header className="sticky top-0 z-30 px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                Office Health Guardian
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hidden sm:inline-block">
                v2.5 Local AI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden md:block">
              辦公室健康存摺 & 身體年齡惡搞監視器
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              isMeetingMode
                ? 'bg-amber-950/70 border-amber-500/80 text-amber-300 shadow-md shadow-amber-900/20'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
            title="開啟會議模式：靜音所有彈窗與警報，但仍默默記錄健康分數"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isMeetingMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{isMeetingMode ? '會議中 (靜音監控)' : '會議模式: 關'}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
            title="守護者設定"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Clock-Out Summary Card Button */}
          <button
            onClick={() => setIsReceiptOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black px-4 py-1.5 rounded-full text-xs shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>下班結算收據</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center View: Camera & Telemetry */}
        <div className="lg:col-span-8 flex flex-col gap-4">
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
          />

          {/* Instant Simulation Bar */}
          <DemoSimulationBar
            onTriggerYawn={handleYawnPenalty}
            onTriggerFrown={handleFrownPenalty}
            onTriggerSedentary={handleSedentaryLock}
            onTriggerSlack={() => handleSlackReward(5)}
            onTriggerProximity={handleProximityBlur}
            onTriggerOvertime={handleOvertimeDeduction}
          />
        </div>

        {/* Right Column: Gamified HUD & Activity Log */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <FloatingHUD
            healthScore={healthScore}
            baseAge={settings.baseAge}
            isOvertime={isOvertime}
            offWorkTime={settings.offWorkTime}
            overtimeMinutes={overtimeMinutes}
          />

          <ActivityLogView events={events} onClear={() => setEvents([])} />
        </div>
      </main>

      {/* Footer info */}
      <footer className="py-3 px-6 text-center text-[11px] text-slate-500 border-t border-slate-900 flex flex-wrap justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span>Office Health Guardian</span>
          <span>•</span>
          <span>100% 瀏覽器本機 WebAssembly 運算，鏡頭影像絕不上傳伺服器</span>
        </div>
        <div className="flex items-center gap-3">
          <span>按時喝水</span>
          <span>•</span>
          <span>適度伸展</span>
          <span>•</span>
          <span>平安下班</span>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          logEvent(
            `守護參數已更新：基礎年齡 ${newSettings.baseAge}歲 / 下班時間 ${newSettings.offWorkTime}`,
            0,
            'info',
            '⚙️'
          );
        }}
      />

      <DailyReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        stats={getSummaryStats()}
        events={events}
      />
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
