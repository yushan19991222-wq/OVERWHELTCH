import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  Coffee,
  Heart,
  Droplets,
  Wind,
  Flame,
  Ghost,
  Footprints,
  Maximize2,
  Minimize2,
  X,
  RefreshCw,
  Image as ImageIcon,
  Activity,
  Smile,
} from 'lucide-react';
import { ActiveHazardAlert } from '../types';
import { soundSynth } from '../utils/audioSynth';
import { TacticalMemeImage } from './TacticalMemeImage';

interface ScreensaverMemeTakeoverProps {
  alert: ActiveHazardAlert | null;
  onDismiss: () => void;
  onStartStretchWorkout?: () => void;
}

interface GeminiMemeResult {
  keyword: string;
  punchline: string;
  advice: string;
  imagePrompt: string;
  gifUrl: string;
  gifTitle: string;
  source: string;
}

export const ScreensaverMemeTakeover: React.FC<ScreensaverMemeTakeoverProps> = ({
  alert,
  onDismiss,
  onStartStretchWorkout,
}) => {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const onStartStretchWorkoutRef = useRef(onStartStretchWorkout);
  onStartStretchWorkoutRef.current = onStartStretchWorkout;

  const lastFetchedFrownTimestampRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(16);
  const [initialCountdown, setInitialCountdown] = useState<number>(16);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [actionTriggered, setActionTriggered] = useState<boolean>(false);

  // Gemini + Giphy dynamic meme states for FROWN
  const [geminiMeme, setGeminiMeme] = useState<GeminiMemeResult | null>(null);
  const [isGeneratingMeme, setIsGeneratingMeme] = useState<boolean>(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState<boolean>(false);
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState<string | null>(null);

  // Breathing circle phase for Frown mode (0: inhale, 1: hold, 2: exhale)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');

  // Floating bouncing DVD mascot position
  const [bouncingPos, setBouncingPos] = useState({ x: 15, y: 25 });
  const animFrameRef = useRef<number | null>(null);

  // Canvas ref for Confetti / Coin shower
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time digital clock
  useEffect(() => {
    if (!alert) return;
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [alert?.type, alert?.timestamp]);

  // Fetch dynamic Gemini + Giphy meme when FROWN alert occurs
  const fetchGeminiFrownMeme = async () => {
    setIsGeneratingMeme(true);
    setAiGeneratedImageUrl(null);
    try {
      const res = await fetch('/api/gemini/frown-meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stressLevel: 'high' }),
      });
      if (res.ok) {
        const data: GeminiMemeResult = await res.json();
        setGeminiMeme(data);
      }
    } catch (err) {
      console.warn('Failed to fetch Gemini frown meme:', err);
    } finally {
      setIsGeneratingMeme(false);
    }
  };

  // Generate an AI image using Gemini model if requested
  const handleGenerateAiImage = async () => {
    if (isGeneratingAiImage) return;
    setIsGeneratingAiImage(true);
    try {
      const prompt =
        geminiMeme?.imagePrompt ||
        'Funny stressed office worker or grumpy cat having a dramatic reaction to work';
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setAiGeneratedImageUrl(data.imageUrl);
        }
      }
    } catch (err) {
      console.warn('Failed to generate AI image:', err);
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  // Trigger Gemini API call automatically on Frown
  useEffect(() => {
    if (alert?.type === 'frown') {
      const alertTs = alert.timestamp || Date.now();
      if (lastFetchedFrownTimestampRef.current !== alertTs) {
        lastFetchedFrownTimestampRef.current = alertTs;
        fetchGeminiFrownMeme();
      }
    } else {
      setGeminiMeme(null);
      setAiGeneratedImageUrl(null);
      lastFetchedFrownTimestampRef.current = null;
    }
  }, [alert?.type, alert?.timestamp]);

  // Reset countdown whenever a new alert arrives
  useEffect(() => {
    if (!alert || alert.type === 'sedentary' || alert.type === 'proximity') return;
    
    // Generous durations (15s ~ 20s) so users have sufficient time to read and enjoy
    const targetDuration =
      alert.type === 'frown'
        ? 20
        : alert.type === 'beauty_score'
        ? 18
        : alert.type === 'blink'
        ? 16
        : alert.type === 'slack'
        ? 16
        : alert.type === 'overtime'
        ? 16
        : 15;

    setCountdown(targetDuration);
    setInitialCountdown(targetDuration);
    setActionTriggered(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            onDismissRef.current();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alert?.type, alert?.timestamp]);

  // Breathing cycle animation for frown mode
  useEffect(() => {
    if (!alert || alert.type !== 'frown') return;
    const breathTimer = setInterval(() => {
      setBreathPhase((prev) => (prev === 'inhale' ? 'exhale' : 'inhale'));
    }, 3500);
    return () => clearInterval(breathTimer);
  }, [alert?.type]);

  // Floating screensaver meme badge drifting across screen
  useEffect(() => {
    if (!alert || alert.type === 'sedentary' || alert.type === 'proximity') return;

    let posX = Math.random() * 40 + 10;
    let posY = Math.random() * 30 + 15;
    let vx = 0.09;
    let vy = 0.07;

    const step = () => {
      posX += vx;
      posY += vy;

      if (posX <= 3 || posX >= 72) vx = -vx;
      if (posY <= 8 || posY >= 65) vy = -vy;

      setBouncingPos({ x: posX, y: posY });
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [alert]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcut listener (Space or Enter triggers interactive remedy)
  useEffect(() => {
    if (!alert || alert.type === 'sedentary' || alert.type === 'proximity') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismissRef.current();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleInteractiveAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alert?.type, alert?.timestamp]);

  // Particle shower canvas animation (for Slack celebration or Yawn water splashes)
  useEffect(() => {
    if (!alert || alert.type === 'sedentary' || alert.type === 'proximity') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const isSlack = alert.type === 'slack';
    const isYawn = alert.type === 'yawn';
    const isOvertime = alert.type === 'overtime';
    const isBeauty = alert.type === 'beauty_score';

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      rotation: number;
      rotSpeed: number;
      char: string;
      color: string;
      opacity: number;
    }> = [];

    const symbols = isSlack
      ? ['🪙', '💵', '☕', '🌴', '✨', '🏆', '🎉']
      : isBeauty
      ? ['💧', '✨', '🥤', '💎', '🌊', '🌸', '🧴']
      : isYawn
      ? ['💧', '🌊', '⚡', '☕', '🥤', '🧊']
      : isOvertime
      ? ['👻', '🦇', '💀', '🩸', '⚠️']
      : ['🌸', '🍃', '✨', '💖', '🧘'];

    const numParticles = isSlack || isBeauty ? 45 : 30;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: isOvertime ? canvas.height + Math.random() * 200 : Math.random() * -canvas.height,
        size: Math.random() * 12 + 18,
        speedY: isOvertime ? -(Math.random() * 2.5 + 1.2) : Math.random() * 3 + 1.8,
        speedX: (Math.random() - 0.5) * 1.5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        char: symbols[Math.floor(Math.random() * symbols.length)],
        color: isSlack
          ? '#fbbf24'
          : isBeauty
          ? '#06b6d4'
          : isYawn
          ? '#38bdf8'
          : isOvertime
          ? '#f43f5e'
          : '#a78bfa',
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        if (isOvertime) {
          if (p.y < -50) {
            p.y = canvas.height + 50;
            p.x = Math.random() * canvas.width;
          }
        } else {
          if (p.y > canvas.height + 50) {
            p.y = -50;
            p.x = Math.random() * canvas.width;
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [alert]);

  if (!alert) return null;

  // Handle interactive action per mode
  const handleInteractiveAction = () => {
    setActionTriggered(true);
    if (alert.type === 'sedentary') {
      soundSynth.playWaterDrink();
    } else if (alert.type === 'slack') {
      soundSynth.playCoinShower();
    } else if (alert.type === 'overtime') {
      soundSynth.playEscapeRun();
    } else if (alert.type === 'yawn') {
      soundSynth.playBlinkChime();
    } else {
      soundSynth.playBlinkChime();
    }

    setTimeout(() => {
      onDismissRef.current();
    }, 1100);
  };

  // Preset Meme Media & Theming per Hazard - Overwatch HUD Specifications
  const getThemeConfig = () => {
    // Random selector based on alert timestamp or seed
    const seed = Math.abs((alert.timestamp || Date.now()) * 31 + (alert.title?.length || 0) + Math.floor(Math.random() * 97)) % 100;

    switch (alert.type) {
      case 'yawn': {
        const isCandidWebcam = alert.image?.startsWith('data:image');
        const YAWN_CANDID_PUNCHLINES = [
          { top: '📷 崩壞抓包：巨口大開！', bottom: '打算把螢幕吞下去嗎？！😱🥱' },
          { top: '📷 野生抓拍：靈魂出竅！', bottom: '打哈欠會傳染！快閉嘴喝水去！👻💧' },
          { top: '📷 工位崩壞表情包！', bottom: '嘴巴張太大了！老闆在背後凝視！👀💥' },
          { top: '📷 瞬間捕捉：下巴脫臼！', bottom: '大腦嚴重缺氧！快補充水分！🥤🔥' },
        ];
        const candidYawn = YAWN_CANDID_PUNCHLINES[seed % YAWN_CANDID_PUNCHLINES.length];

        const YAWN_PRESETS = [
          // Spooky & Monsters (Jumpscare wake up)
          {
            image: '/memes/spooky-scream.jpg',
            category: 'scary' as const,
            topText: '大哈欠抓包！',
            bottomText: '看著我的眼睛！還敢睡？！😱👻',
            caption: '> TARGET_LOG: [尖叫惡靈] 猛烈驚嚇電擊！大腦瞬間清醒度 100%',
            title: '大腦嚴重缺氧 // 驚悚惡靈瞬間電擊喚醒',
            subtitle: '嘴部開度超過閾值 1.5 秒！突發高能驚嚇防護罩啟動，腎上腺素強力爆發！',
            badgeText: '> SEVERITY: ELEVATED // SCARE_FACTOR: 99%',
          },
          {
            image: '/memes/spooky-monster.jpg',
            category: 'scary' as const,
            topText: '嘴巴張這麼大',
            bottomText: '深淵怪物準備鑽進去啦！👾💀',
            caption: '> TARGET_LOG: [異界魔物] 偵測到哈欠孔洞，警告：立即閉嘴清醒！',
            title: '大腦嚴重缺氧 // 深淵魔物現身',
            subtitle: '深淵巨口偵測！不要讓異界怪物趁你打哈欠吸取你的大腦養分！',
            badgeText: '> SEVERITY: CRITICAL // MONSTER_ALERT',
          },
          {
            image: '/memes/spooky-ghost.jpg',
            category: 'scary' as const,
            topText: '靈魂正在飄出',
            bottomText: '紅衣怨靈已鎖定你的工位！👻🔥',
            caption: '> TARGET_LOG: [幽暗鬼影] 伏案嗜睡者將被拖入加班輪迴地獄！',
            title: '大腦嚴重缺氧 // 幽靈伏案抓交替',
            subtitle: '靈魂出竅警報！紅衣怨靈正在你螢幕上方凝視，請立刻振作精神！',
            badgeText: '> SEVERITY: ELEVATED // GHOST_LOCK: TRUE',
          },
          {
            image: '/memes/spooky-demon.jpg',
            category: 'scary' as const,
            topText: '打哈欠會傳染？',
            bottomText: '惡魔直接在螢幕前盯著你！😈⚡',
            caption: '> TARGET_LOG: [地獄凝視] 驚嚇係數極限超標，強行擊碎睡意！',
            title: '大腦嚴重缺氧 // 地獄惡魔凝視',
            subtitle: '偵測到張大嘴連環哈欠！召喚地獄惡魔進行靈魂震盪除睡療程！',
            badgeText: '> SEVERITY: ELEVATED // DEMON_EYE',
          },
          // Meme Cats
          {
            image: '/memes/cat-yawn.jpg',
            category: 'cat' as const,
            topText: '嘴巴張這麼大',
            bottomText: '準備把整間辦公室吞了嗎？！🐱🥱',
            caption: '> TARGET_LOG: [大嘴橘貓] 喵嗚！打哈欠會傳染，全公司被你催眠啦',
            title: '大腦嚴重缺氧 // 大嘴橘貓同款哈欠',
            subtitle: '嘴部開度超過閾值 1.5 秒！橘貓總裁命令你立即眨眼提神！',
            badgeText: '> SEVERITY: ELEVATED // HEALTH_SCORE: -5',
          },
          {
            image: '/memes/cat-shocked.jpg',
            category: 'cat' as const,
            topText: '老闆突然走過來',
            bottomText: '看到你哈欠連天眼神呆滯！🙀👀',
            caption: '> TARGET_LOG: [驚恐貓咪] 喵命關天！老闆正在轉角處凝視你的下巴',
            title: '大腦嚴重缺氧 // 老闆走近驚悚瞬間',
            subtitle: '偵測到無神哈欠！貓貓為你偵測到長官腳步聲正在接近！',
            badgeText: '> SEVERITY: ELEVATED // BOSS_PROXIMITY: HIGH',
          },
          {
            image: '/memes/cat-judge.jpg',
            category: 'cat' as const,
            topText: '這就是資本主義',
            bottomText: '貓貓投以最鄙視的審判凝視！🐱💼',
            caption: '> TARGET_LOG: [審判總裁貓] 喵：連打三個哈欠？扣三罐罐頭！',
            title: '大腦嚴重缺氧 // 總裁貓嚴厲審判',
            subtitle: '貓界高層正在考核你的工作活力！請立刻坐正深呼吸！',
            badgeText: '> SEVERITY: ELEVATED // JUDGEMENT_PASS',
          },
          {
            image: '/memes/cat-cool.jpg',
            category: 'cat' as const,
            topText: '清醒一點！打工人',
            bottomText: '戴上墨鏡維持最後的尊嚴！😎🐾',
            caption: '> TARGET_LOG: [酷炫墨鏡貓] 喵：就算靈魂被抽乾，氣場不能輸',
            title: '大腦嚴重缺氧 // 墨鏡貓氣場注入',
            subtitle: '就算想睡覺也要維持打工人的霸道氣場！立刻坐正提神！',
            badgeText: '> SEVERITY: ELEVATED // COOL_BOOST',
          },
        ];

        const preset = YAWN_PRESETS[seed % YAWN_PRESETS.length];

        return {
          title: preset.title,
          subtitle: preset.subtitle,
          badgeText: isCandidWebcam ? '> SURVEILLANCE: YAWN_CANDID_SNAPSHOT' : preset.badgeText,
          badgeClass:
            preset.category === 'scary'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
          accentColor: preset.category === 'scary' ? '#f43f5e' : '#f59e0b',
          category: preset.category,
          memeImage: isCandidWebcam ? alert.image : preset.image,
          fallbackImages: [
            '/memes/cat-yawn.jpg',
            '/memes/spooky-scream.jpg',
            'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&auto=format&fit=crop&q=80',
          ],
          topText: isCandidWebcam ? candidYawn.top : preset.topText,
          bottomText: isCandidWebcam ? candidYawn.bottom : preset.bottomText,
          memeCaption: isCandidWebcam
            ? '> SURVEILLANCE_CANDID_LOG: [打哈欠崩壞抓拍] 巨口開度超標，大腦嚴重缺氧中！'
            : preset.caption,
          floatingIcon: preset.category === 'scary' ? '👻' : '🥱',
          actionText: '⚡ 瞬間嚇醒！恢復作戰專注 (WAKE_UP)',
          actionClass:
            'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black border border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]',
          glowGradient:
            preset.category === 'scary'
              ? 'radial-gradient(circle at center, rgba(244,63,94,0.18) 0%, rgba(9,10,15,0.98) 75%)'
              : 'radial-gradient(circle at center, rgba(245,158,11,0.15) 0%, rgba(9,10,15,0.98) 75%)',
        };
      }
      case 'blink': {
        const isCandidWebcam = alert.image?.startsWith('data:image');
        const BLINK_CANDID_PUNCHLINES = [
          { top: '📷 呆滯抓拍：雙眼茫然！', bottom: '眼皮重如千斤！快站起來灌水！😴💧' },
          { top: '📷 崩壞瞬間：眼睛半閉！', bottom: '靈魂離線中… 系統強制電擊！⚡👀' },
          { top: '📷 野生捕獲：失神發呆！', bottom: '視網膜乾涸！神顏 SPA 補水預備！✨💎' },
        ];
        const candidBlink = BLINK_CANDID_PUNCHLINES[seed % BLINK_CANDID_PUNCHLINES.length];

        const BLINK_PRESETS = [
          // Handsome Stars
          {
            image: '/memes/idol-handsome-1.jpg',
            category: 'idol' as const,
            topText: '視覺神經疲勞',
            bottomText: '神仙顏值 100% 爆擊洗眼！✨😍',
            caption: '> TARGET_LOG: [K-POP 頂流男神] 視網膜頂級 SPA：多巴胺激增 +300%',
            title: '視覺神經疲勞 // 頂級男神神顏洗眼 SPA',
            subtitle: '偵測到眨眼頻率異常！立即奉上韓團歐美神仙顏值，為視網膜注入頂級抗疲勞多巴胺！',
            badgeText: '> SPA_PROTOCOL // DOPAMINE: +300%',
          },
          {
            image: '/memes/idol-handsome-2.jpg',
            category: 'idol' as const,
            topText: '頻繁眨眼偵測',
            bottomText: '這張臉夠不夠讓你眼球回血？！💖🔥',
            caption: '> TARGET_LOG: [韓劇漫撕男星] 專注凝視 5 秒，睫狀肌完全放鬆！',
            title: '視覺神經疲勞 // 漫撕男主角深情凝視',
            subtitle: '眼球乾澀過勞！偶像級深邃眼神為你進行 1 對 1 視網膜能量療癒！',
            badgeText: '> RECOVERY: EYE_SPA // HEALING: 100%',
          },
          {
            image: '/memes/idol-handsome-3.jpg',
            category: 'idol' as const,
            topText: '雙眼乾澀酸痛？',
            bottomText: '歐美頂級歌手為你深情凝視！💫🎤',
            caption: '> TARGET_LOG: [歐美巨星男神] 視覺神經光學修復中，心跳同頻加速',
            title: '視覺神經疲勞 // 歐美男神巨星洗眼',
            subtitle: '螢幕藍光超標！凝視世界頂級雕塑般五官，讓緊繃的眼周肌肉瞬間放鬆！',
            badgeText: '> STATUS: EYE_REFRESH // CHARISMA_MAX',
          },
          {
            image: '/memes/idol-handsome-4.jpg',
            category: 'idol' as const,
            topText: '視線模糊？',
            bottomText: '極致下顎線與深邃眼眸在此！⚡🌟',
            caption: '> TARGET_LOG: [頂級時尚男模] 眼神交流中，視覺疲勞指針全數歸零',
            title: '視覺神經疲勞 // 頂級超模神級視覺饗宴',
            subtitle: '奉上無懈可擊的下顎線與高光神顏，視力瞬間重回 2.0！',
            badgeText: '> TELEMETRY: RETINA_BOOST // 2.0_VISION',
          },
          // Beautiful Idol Goddesses
          {
            image: '/memes/idol-beauty-1.jpg',
            category: 'idol' as const,
            topText: '眼睛累了嗎？',
            bottomText: '女團 C 位神仙美貌為你洗眼！🌸💖',
            caption: '> TARGET_LOG: [K-POP 仙女偶像] 頂級美貌能量注入，雙眼晶瑩剔透！',
            title: '視覺神經疲勞 // K-POP 仙女偶像治癒 SPA',
            subtitle: '女團門面神級美貌降臨！為過勞的雙眼注入清新晨露般的視覺滋養！',
            badgeText: '> PROTOCOL: FAIRY_SPA // BEAUTY_OVERLOAD',
          },
          {
            image: '/memes/idol-beauty-2.jpg',
            category: 'idol' as const,
            topText: '頻繁眨眼放電中？',
            bottomText: '絕美女神燦爛微笑為你應援！✨🥰',
            caption: '> TARGET_LOG: [國民初戀女神] 視力瞬間恢復 2.0，元氣瞬間充飽！',
            title: '視覺神經疲勞 // 國民初戀元氣微笑',
            subtitle: '被螢幕折磨的靈魂之窗！讓治癒滿分的微笑化解眼眶周邊所有疲倦！',
            badgeText: '> HEALTH_SCORE: +3 // ENERGY_FULL',
          },
          {
            image: '/memes/idol-beauty-3.jpg',
            category: 'idol' as const,
            topText: '視網膜乾涸？',
            bottomText: '歐美頂流天后霸氣美顏降臨！👑🔥',
            caption: '> TARGET_LOG: [歐美天后巨星] 視網膜超清潤澤，氣場全開！',
            title: '視覺神經疲勞 // 歐美天后霸氣神顏',
            subtitle: '頂級天后氣場爆棚！高畫質美貌刺激視覺皮層，驅散所有沉悶睡意！',
            badgeText: '> RECOVERY: QUEEN_DIVA // GLAMOUR_MAX',
          },
          {
            image: '/memes/idol-beauty-4.jpg',
            category: 'idol' as const,
            topText: '眨眼次數超標',
            bottomText: '絕美精靈神顏守護你的視力！🧚‍♀️💫',
            caption: '> TARGET_LOG: [精靈系仙氣神顏] 視覺多巴胺充滿，疲勞完全蒸發！',
            title: '視覺神經疲勞 // 精靈系神顏視力保護',
            subtitle: '雙眼需要休息！跟隨精靈女神深呼吸，感受視網膜被清泉洗滌的舒爽！',
            badgeText: '> EYE_REFRESH: COMPLETE // SPA_VERIFIED',
          },
        ];

        const preset = BLINK_PRESETS[seed % BLINK_PRESETS.length];

        return {
          title: preset.title,
          subtitle: preset.subtitle,
          badgeText: isCandidWebcam ? '> SURVEILLANCE: EYE_STRAIN_CANDID' : preset.badgeText,
          badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/60 shadow-[0_0_12px_rgba(236,72,153,0.3)]',
          accentColor: '#ec4899',
          category: preset.category,
          memeImage: isCandidWebcam ? alert.image : preset.image,
          fallbackImages: [
            '/memes/idol-handsome-1.jpg',
            '/memes/idol-beauty-1.jpg',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
          ],
          topText: isCandidWebcam ? candidBlink.top : preset.topText,
          bottomText: isCandidWebcam ? candidBlink.bottom : preset.bottomText,
          memeCaption: isCandidWebcam
            ? '> SURVEILLANCE_CANDID_LOG: [眼神呆滯半閉抓拍] 雙眼過勞乾澀，急需補充多巴胺！'
            : preset.caption,
          floatingIcon: '✨',
          actionText: '💖 顏值爆擊！視力恢復 2.0 (EYE_SPA_CONFIRM)',
          actionClass:
            'bg-pink-500 hover:bg-pink-400 text-slate-950 font-black border border-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.4)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(236,72,153,0.18) 0%, rgba(9,10,15,0.98) 75%)',
        };
      }
      case 'beauty_score': {
        const isCandidWebcam = alert.image?.startsWith('data:image');

        // Concise, hilarious, punchy candid meme punchlines
        const CANDID_MEME_PUNCHLINES = [
          {
            top: '📷 工位野生抓拍！',
            bottom: '滿滿班味？快喝水去去味！🌸💧',
          },
          {
            top: '📷 突擊顏值存證！',
            bottom: '這張臉缺水，速速乾杯！🥤✨',
          },
          {
            top: '📷 抓到你了打工人！',
            bottom: '大口灌水，顏值狂飆 +10！🔥💧',
          },
          {
            top: '📷 鏡頭突襲掃描！',
            bottom: '細胞乾涸中！快喝杯水回血 🧊💦',
          },
          {
            top: '📷 今日工位神態',
            bottom: '喝口水，秒變水光神顏！💎✨',
          },
          {
            top: '📷 水光肌警報！',
            bottom: '不喝水，神仙顏值會枯萎喔！🐱💧',
          },
        ];

        const candidPreset = CANDID_MEME_PUNCHLINES[seed % CANDID_MEME_PUNCHLINES.length];

        const BEAUTY_PRESETS = [
          {
            image: '/memes/idol-handsome-1.jpg',
            category: 'idol' as const,
            topText: '整點 AI 顏值雷達',
            bottomText: '快去乾杯！顏值狂飆 +10 💧✨',
            caption: '> TARGET_LOG: [水光神顏] 細胞補水度上升 85%，自帶仙氣高光濾鏡！',
            title: '整點 AI 顏值評測 // 喝水水光肌保養',
            subtitle: 'AI 監測到連續伏案一小時！立即飲用 300ml 溫水，為肌膚注入水分，讓顏值指數直線飆升！',
            badgeText: '> HOURLY_BIO_RADAR: BEAUTY_SCORE // WATER_GLOW',
          },
          {
            image: '/memes/idol-beauty-1.jpg',
            category: 'idol' as const,
            topText: '顏值秘密武器：喝水！',
            bottomText: '喝足水，自帶神仙光環 🌸💧',
            caption: '> TARGET_LOG: [仙女肌膚防禦] 水分充足可提升代謝與眼球晶亮感！',
            title: '整點 AI 顏值評測 // 仙女補水能量站',
            subtitle: '一小時到了！喝杯水讓細胞充盈水光感，眼周不乾澀、氣色紅潤，顏值評分再創高峰！',
            badgeText: '> HEALTH_BOOST: +5 PTS // RADIANCE_MAX',
          },
          {
            image: '/memes/cat-judge.jpg',
            category: 'cat' as const,
            topText: '本喵親自提醒你',
            bottomText: '不喝水？本喵扣你罐頭！🐱💧',
            caption: '> TARGET_LOG: [貓咪督導] 監督官已就位，水分充盈才是神顏最高準則！',
            title: '整點 AI 顏值評測 // 貓咪督導喝水特令',
            subtitle: '伏案一小時未喝水！肌膚水分正在悄悄蒸發，快站起來裝杯水，喝完顏值立刻回血！',
            badgeText: '> PROTOCOL: CAT_HYDRATION // WATER_NOW',
          },
          {
            image: '/memes/idol-handsome-2.jpg',
            category: 'idol' as const,
            topText: '水光肌頂級男神在此',
            bottomText: '大口喝水，膠原蛋白拉滿！🥤🔥',
            caption: '> TARGET_LOG: [男神光澤] 頂級五官立體度取決於水潤代謝！',
            title: '整點 AI 顏值評測 // 頂級光澤水光能量',
            subtitle: 'AI 整點掃描已完成！喝水是零成本提升氣色與顏值的終極秘訣，趕緊大口喝水！',
            badgeText: '> BIO_STATUS: HYDRATED // CHARISMA_PEAK',
          },
        ];

        const preset = BEAUTY_PRESETS[seed % BEAUTY_PRESETS.length];

        const finalTopText = isCandidWebcam
          ? candidPreset.top
          : preset.topText;
        const finalBottomText = isCandidWebcam
          ? candidPreset.bottom
          : preset.bottomText;
        const finalCaption = isCandidWebcam
          ? '> SURVEILLANCE_CANDID_LOG: [工位即時抓拍存證] 系統不定時抓拍工作姿態，補充水分驅散倦容！'
          : preset.caption;
        const finalBadge = isCandidWebcam
          ? '> SURVEILLANCE: CANDID_WEBCAM_CAPTURE // HOURLY_HYDRATION'
          : alert.badge ? `> ${alert.badge}` : preset.badgeText;

        return {
          title: alert.title || preset.title,
          subtitle: alert.message || preset.subtitle,
          badgeText: finalBadge,
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
          accentColor: '#06b6d4',
          category: isCandidWebcam ? ('general' as const) : preset.category,
          memeImage: alert.image || preset.image,
          fallbackImages: [
            '/memes/idol-handsome-1.jpg',
            '/memes/idol-beauty-1.jpg',
            '/memes/cat-judge.jpg',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
          ],
          topText: finalTopText,
          bottomText: finalBottomText,
          memeCaption: finalCaption,
          floatingIcon: '💧',
          actionText: '💧 乾杯喝水！顏值拉滿 (WATER_BOOST)',
          actionClass:
            'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black border border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(6,182,212,0.22) 0%, rgba(9,10,15,0.98) 75%)',
        };
      }
      case 'frown':
        return {
          title: geminiMeme?.punchline
            ? `壓力過載 // ${geminiMeme.punchline}`
            : '眉頭深鎖 // 怨念過載警報',
          subtitle:
            geminiMeme?.advice ||
            '偵測到面部肌群長期緊繃！跟隨同心光環進行深層腹式呼吸，放鬆眼眶與額頭神經！',
          badgeText: `> SEVERITY: STRESS // ${geminiMeme ? `GIPHY: #${geminiMeme.keyword}` : 'HEALTH_SCORE: -3'}`,
          badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
          accentColor: '#f59e0b',
          category: 'dog' as const,
          memeImage:
            aiGeneratedImageUrl ||
            geminiMeme?.gifUrl ||
            '/memes/dog-frown.jpg',
          fallbackImages: [
            '/memes/dog-tired.jpg',
            'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80',
          ],
          topText: '這點微薄薪水',
          bottomText: '不值得你把眉頭鎖這麼緊！🐕😠',
          memeCaption: geminiMeme
            ? `> GIPHY_TELEMETRY: #${geminiMeme.keyword} // ${geminiMeme.gifTitle}`
            : '> TARGET_LOG: [柴犬] 人生苦短，薪水微薄，眉頭放鬆世界才會美好',
          floatingIcon: '🐕',
          actionText: '🧘‍♂️ 怨念釋放！我已深呼吸放鬆',
          actionClass:
            'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(245,158,11,0.12) 0%, rgba(9,10,15,0.98) 75%)',
        };
      case 'slack':
        return {
          title: '離座摸魚 // 榮耀充能大捷',
          subtitle: '光學感測無人臉！適度離座走動、喝咖啡放鬆，乃打工人延續職業壽命的最佳戰略！',
          badgeText: '> STATUS: RECOVERY // HEALTH_SCORE: +10',
          badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(56,189,248,0.2)]',
          accentColor: '#38bdf8',
          category: 'sloth' as const,
          memeImage: '/memes/cat-chill.jpg',
          fallbackImages: [
            '/memes/cat-curious.jpg',
            'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&auto=format&fit=crop&q=80',
          ],
          topText: '離座摸魚 30 分鐘',
          bottomText: '薪水小偷大獲全勝！🎉☕',
          memeCaption: '> TARGET_LOG: [樹懶] 於資本結構夾縫中，悠閒伸展才是真贏家',
          floatingIcon: '🦥',
          actionText: '☕ 乾杯！繼續維持高雅摸魚',
          actionClass:
            'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border border-cyan-400/80 shadow-[0_0_8px_rgba(56,189,248,0.25)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(56,189,248,0.12) 0%, rgba(9,10,15,0.98) 75%)',
        };
      case 'overtime':
        return {
          title: '生命力流失 // 超時加班警報',
          subtitle: '表定下班時間已超過！資本無情汲取精力，立即停止非必要任務，整裝下班！',
          badgeText: '> CRITICAL: VAMPIRE_DRAIN // HEALTH_SCORE: -15',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.25)]',
          accentColor: '#f43f5e',
          category: 'ghost' as const,
          memeImage: '/memes/dog-tired.jpg',
          fallbackImages: [
            '/memes/dog-frown.jpg',
            'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&auto=format&fit=crop&q=80',
          ],
          topText: '表定下班時間已過',
          bottomText: '還在位子上準備修道升天？👻💼',
          memeCaption: '> TARGET_LOG: [小狗] 主人快撤！靈魂指標正在以 0.8x 光速流逝！',
          floatingIcon: '👻',
          actionText: '🏃‍♂️ 打卡下班！立刻收拾書包逃跑',
          actionClass:
            'bg-rose-600 hover:bg-rose-500 text-white font-bold border border-rose-400/80 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(244,63,94,0.15) 0%, rgba(9,10,15,0.98) 75%)',
        };
      case 'sedentary':
        return {
          title: '久坐超時 // 椎間盤求救警報',
          subtitle: '連續坐在椅子上超過安全時限！血液循環受阻，請立刻起立活動或補充水分！',
          badgeText: '> ALERT: SEDENTARY_LOCK // HEALTH_SCORE: -10',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.25)]',
          accentColor: '#f43f5e',
          category: 'cat' as const,
          memeImage: '/memes/cat-curious.jpg',
          fallbackImages: [
            '/memes/cat-chill.jpg',
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
          ],
          topText: '連續久坐時限已到',
          bottomText: '屁股已經跟椅子黏成一體啦！🪑💥',
          memeCaption: '> TARGET_LOG: [健康守衛] 椎間盤在哭泣！請起立活動或補充水分！',
          floatingIcon: '🪑',
          actionText: '🥤 補充水分 300ml (RECORD_WATER)',
          actionClass:
            'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border border-cyan-400/80 shadow-[0_0_8px_rgba(56,189,248,0.25)]',
          glowGradient:
            'radial-gradient(circle at center, rgba(6,182,212,0.15) 0%, rgba(9,10,15,0.98) 75%)',
        };
      default:
        return {
          title: alert.title,
          subtitle: alert.message,
          badgeText: `> ALERT: ${alert.badge}`,
          badgeClass: 'bg-[#00d8ff]/15 text-[#00d8ff] border-[#00d8ff]/60 shadow-[0_0_15px_rgba(0,216,255,0.25)]',
          accentColor: '#00d8ff',
          category: 'general' as const,
          memeImage:
            alert.image ||
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
          fallbackImages: [
            'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&auto=format&fit=crop&q=80',
          ],
          topText: '生理狀態異常偵測',
          bottomText: '請維持高度警覺，守護生理資產！🛡️',
          memeCaption: '> TARGET_LOG: [HEALTH_GUARDIAN] 保持高度警覺，守護生理資產',
          floatingIcon: '🛡️',
          actionText: '確認並調整 (EXEC_CONFIRM)',
          actionClass: 'bg-[#00d8ff] hover:bg-[#38bdf8] text-black font-black',
          glowGradient:
            'radial-gradient(circle at center, rgba(0,216,255,0.18) 0%, rgba(9,10,15,0.98) 75%)',
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <div
      id="screensaver-meme-takeover"
      className="fixed inset-0 z-[999990] bg-[#090a0f] text-slate-100 flex flex-col justify-between p-2 sm:p-3 md:p-4 select-none overflow-hidden font-mono cursor-default animate-in fade-in duration-300 cctv-vignette h-[100dvh] max-h-[100dvh] w-full"
      style={{ backgroundImage: theme.glowGradient }}
    >
      {/* Tactical HUD Corner Crosshairs */}
      <div className="pointer-events-none absolute top-2 left-2 text-slate-600 text-[9px] sm:text-xs z-20 select-none hidden xs:block">
        + [HUD:OVERWATCH_SYS]
      </div>
      <div className="pointer-events-none absolute top-2 right-2 text-slate-600 text-[9px] sm:text-xs z-20 select-none hidden xs:block">
        [SYS_LATENCY: 12ms] +
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 text-slate-600 text-[9px] sm:text-xs z-20 select-none hidden xs:block">
        + [SECURITY_CLEARANCE: LVL_4]
      </div>
      <div className="pointer-events-none absolute bottom-2 right-2 text-slate-600 text-[9px] sm:text-xs z-20 select-none hidden xs:block">
        [OVERRIDE_ENABLED] +
      </div>

      {/* Background Particle Shower / Confetti Rain Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
      />

      {/* Retro CRT Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-70 z-0" />

      {/* TOP HEADER STATUS BAR - Overwatch Command Strip */}
      <header className="relative z-10 w-full flex items-center justify-between pb-1.5 sm:pb-2 border-b border-white/10 text-xs shrink-0 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Tactical Badge */}
          <div
            className={`flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded border text-[10px] sm:text-[11px] font-bold tracking-wider truncate ${theme.badgeClass}`}
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor] shrink-0" />
            <span className="truncate">
              {alert.type === 'frown'
                ? '> OVERWATCH // STRESS_INTERCEPT'
                : '> OVERWATCH // SURVEILLANCE_ALERT'}
            </span>
          </div>
          <span className="hidden md:inline text-slate-400 text-[10px] sm:text-[11px] tracking-wide truncate">
            {theme.badgeText}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Remaining Countdown Badge */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] sm:text-xs font-mono font-bold shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span>{countdown}s 停留倒數</span>
          </div>

          {/* Digital Clock */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0a0c10]/90 border border-white/10 text-slate-300 text-[10px] sm:text-xs shadow-inner">
            <Clock className="w-3 h-3 text-[#00d8ff] shrink-0" />
            <span className="font-bold tracking-widest">{currentTime}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1 sm:p-1.5 rounded bg-[#10141c] border border-white/10 hover:border-[#00d8ff]/70 text-slate-400 hover:text-white transition"
            title="切換全螢幕"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          </button>

          {/* Dismiss Button with explicit visual styling */}
          <button
            onClick={onDismiss}
            className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded bg-rose-950/80 border border-rose-500/70 hover:border-rose-400 text-rose-200 hover:text-white transition shadow-[0_0_10px_rgba(244,63,94,0.3)] group cursor-pointer"
            title="關閉彈窗 (ESC)"
          >
            <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] sm:text-[11px] font-bold font-mono">關閉退出 [ESC]</span>
          </button>
        </div>
      </header>

      {/* FLOATING BOUNCING TACTICAL PROBE DRONE (Overwatch HUD Telemetry Mascot) */}
      <div
        className="absolute z-10 pointer-events-none transition-transform duration-75 hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#0a0c10]/90 border border-[#00d8ff]/40 shadow-[0_0_20px_rgba(0,216,255,0.25)] backdrop-blur-md"
        style={{
          left: `${bouncingPos.x}%`,
          top: `${bouncingPos.y}%`,
        }}
      >
        <div className="text-lg animate-bounce">{theme.floatingIcon}</div>
        <div>
          <div className="text-[9px] font-bold text-slate-200 tracking-wider">
            &gt; PROBE_01 // BIO_RADAR
          </div>
          <div className="text-[8px] text-[#00d8ff] font-mono">
            {alert.type === 'frown' ? '[GEMINI_3.8_ACTIVE]' : '[SURVEILLANCE_LOCKED]'}
          </div>
        </div>
      </div>

      {/* CENTERPIECE: OVERWATCH COMMAND HUD MODAL CARD - 100% VIEWPORT EXPANDED HERO */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center text-center px-1 sm:px-2 max-w-5xl lg:max-w-6xl mx-auto my-auto py-1 w-full overflow-hidden">
        <div className="relative w-full h-full max-h-full flex flex-col justify-between rounded-lg bg-[#0a0c10]/95 border border-white/10 shadow-[0_8px_36px_0_rgba(0,0,0,0.85)] backdrop-blur-xl p-2 sm:p-3 overflow-hidden cctv-brackets">
          {/* Card Top Telemetry Stripe */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1 text-[9px] sm:text-[10px] text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse shrink-0" />
              <span className="font-bold tracking-widest text-slate-300 uppercase truncate">
                &gt; INTERRUPT_SEQ: ACTIVE // {theme.badgeText}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="tracking-widest uppercase text-slate-500 font-mono truncate text-[8px] sm:text-[9px] hidden xs:inline">
                OVERWATCH_MAX_VIEWPORT
              </span>
              <button
                onClick={onDismiss}
                className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/70 hover:border-rose-400 text-rose-200 hover:text-white text-[9px] font-mono font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>按 [ESC] 退出</span>
              </button>
            </div>
          </div>

          {/* Meme Visual Display Box - MAXIMIZED FULL VIEW (NO OVERFLOW / MAXIMUM IMMERSION) */}
          <div className="relative group mx-auto w-full flex-1 min-h-[300px] max-h-[74vh] sm:max-h-[78vh] md:max-h-[82vh] flex flex-col my-1 shrink overflow-hidden">
            <div className="relative rounded-lg overflow-hidden border-2 border-cyan-500/50 shadow-2xl bg-black/95 w-full h-full flex items-center justify-center">
              {isGeneratingMeme || isGeneratingAiImage ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#090c12] text-[#00d8ff] p-4">
                  <Sparkles className="w-8 h-8 animate-spin mb-2 text-[#ffaa00]" />
                  <span className="text-xs sm:text-sm font-bold font-mono tracking-wider animate-pulse text-center">
                    {isGeneratingAiImage
                      ? '> GEMINI_AI: 正在即時渲染高畫質光學迷因圖像...'
                      : '> GEMINI_3.8: 正在分析生物遙測數據並檢索 GIPHY...'}
                  </span>
                </div>
              ) : (
                <div className="relative w-full h-full overflow-hidden bg-black/95 flex items-center justify-center p-0.5">
                  <TacticalMemeImage
                    src={theme.memeImage || '/memes/cat-yawn.jpg'}
                    fallbackUrls={theme.fallbackImages}
                    category={theme.category}
                    alt={theme.memeCaption}
                    className="w-full h-full max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-102"
                  />

                  {/* Classic Meme Top Text (Impact style text with high-contrast black stroke) */}
                  <div className="absolute top-3 inset-x-2 text-center pointer-events-none z-10 px-3">
                    <span
                      className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white font-sans drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]"
                      style={{
                        textShadow:
                          '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 8px rgba(0,0,0,0.95)',
                      }}
                    >
                      {theme.topText || '生理狀態異常偵測'}
                    </span>
                  </div>

                  {/* Classic Meme Bottom Text (Impact punchline) */}
                  <div className="absolute bottom-9 sm:bottom-11 inset-x-2 text-center pointer-events-none z-10 px-3">
                    <span
                      className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wider text-yellow-300 font-sans drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]"
                      style={{
                        textShadow:
                          '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 8px rgba(0,0,0,0.95)',
                      }}
                    >
                      {theme.bottomText || '請保持高度警覺，守護生理資產！🛡️'}
                    </span>
                  </div>

                  {/* Caption Strip */}
                  <div className="absolute bottom-0 inset-x-0 bg-[#0a0c10]/95 backdrop-blur-md py-1 px-3 border-t border-white/10 text-[11px] sm:text-xs text-amber-300 font-bold tracking-wide text-left flex items-center justify-between z-10">
                    <span className="truncate">{theme.memeCaption}</span>
                    <span className="text-[10px] text-cyan-400 font-mono shrink-0 ml-2 hidden xs:inline">
                      按 [ESC] 退出
                    </span>
                  </div>
                </div>
              )}

              {/* Glowing Corner Badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md text-[9px] sm:text-[10px] text-[#00d8ff] border border-[#00d8ff]/50 font-mono flex items-center gap-1 shadow-md z-20 font-bold">
                <Sparkles className="w-2.5 h-2.5 text-[#00d8ff]" />
                <span>
                  {aiGeneratedImageUrl
                    ? 'AI_OPTICAL_RENDER'
                    : alert.type === 'frown'
                    ? 'GEMINI_INTERCEPT'
                    : alert.type === 'blink'
                    ? 'IDOL_EYE_SPA'
                    : alert.type === 'yawn'
                    ? 'SCARE_WAKE_FEED'
                    : 'TACTICAL_MEME'}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Monospace Title & Clean ESC Bottom Indicator */}
          <div className="shrink-0 pt-0.5 flex items-center justify-between border-t border-white/10 mt-1 px-1">
            <div className="text-left min-w-0 flex-1 mr-2">
              <h1 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-100 truncate">
                &gt; {theme.title}
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono text-[9px] sm:text-[10px] text-slate-400">
              <span className="text-[#00d8ff] font-bold">倒數: {countdown}s</span>
              <span>|</span>
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-[9px]">ESC</kbd> 退出
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM PROGRESS COUNTDOWN LINE - Overwatch Console Footer */}
      <footer className="relative z-10 w-full pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[#00d8ff] font-bold">[OVERWATCH // BIOSURVEILLANCE]</span>
          <span className="hidden md:inline">系統常駐監測中・維護生理機能乃最高作戰準則</span>
        </div>

        {/* Mini Segmented Progress Bar */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400 text-[9px] sm:text-[10px]">T-MINUS</span>
          <div className="w-24 sm:w-32 bg-black/60 rounded-sm h-1.5 overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#00d8ff] to-[#00ff87] transition-all duration-1000 shadow-[0_0_8px_#00d8ff]"
              style={{ width: `${(countdown / (alert.type === 'frown' ? 12 : 8)) * 100}%` }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

function actionClassResolved(baseClass: string, isTriggered: boolean): string {
  if (isTriggered) {
    return 'bg-[#00ff87] text-slate-950 font-black shadow-[0_0_25px_rgba(0,255,135,0.6)] scale-105';
  }
  return baseClass;
}
