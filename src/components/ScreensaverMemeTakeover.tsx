import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  Maximize2,
  Minimize2,
  BookOpen,
  Eye,
  CheckCircle2,
  RotateCw,
  Sparkles,
  X,
} from 'lucide-react';
import { ActiveHazardAlert, TelemetryData } from '../types';
import { soundSynth } from '../utils/audioSynth';
import { TacticalMemeImage, preloadImages } from './TacticalMemeImage';

interface ScreensaverMemeTakeoverProps {
  alert: ActiveHazardAlert | null;
  onDismiss: () => void;
  onStartStretchWorkout?: () => void;
  telemetry?: TelemetryData;
  onEscapeOvertime?: (ranAway: boolean) => void;
}

// Book of Answers Wisdom & Quirky Chicken Soup Quotes (解答之書：通用職場金句、搞怪雞湯與解惑靈籤)
const BOOK_OF_ANSWERS_QUOTES = [
  // 職場通通用金句
  '這件事交給明天的你就好，他看起來比你更有耐心。',
  '能用 PPT 解決的事情，千萬不要開會；能用 Email 解決的事情，千萬不要發訊息。',
  '今天不加班，明天會更好...個鬼！今天加了明天還是要加！',
  '老闆說的『儘快』，意思是他希望你昨天就做完。',
  '答案是：再喝一口水，萬事皆浮雲。',
  '別急著放棄，反正明天還會有新的難題。',
  '遇到困難先睡覺，醒來發現問題還在，但你精神變好了。',
  '工作就像打地鼠，剛打完一個，又冒出來三個。',
  '薪水不會因為你皺眉而變多，但皺紋會。',
  '此題無解，建議直接起身去買杯冰美式。',
  '順其自然吧，反正最壞的情況你已經想像過了。',
  '只要你肯努力，老闆明年又能換新車了。',
  '這不是你的問題，但一定是你要承擔的問題。',
  '深呼吸，想想下期的發票能不能中獎。',
  '老闆的腦袋跟簡報一樣，隨時都在重新排版。',
  '人生沒有白走的路，但上班有走不完的套路。',
  // 搞怪與趣味雞湯
  '世上無難事，只要肯放棄！放過自己，天地皆寬。',
  '生活不只有眼前的苟且，還有讀不懂的 KPI。',
  '不要問公司能為你做什麼，先問自己今天摸魚了沒。',
  '沒有什麼是一頓大餐解決不了的，如果不行，就兩頓！',
  '今天也是充滿希望的一天！加油，打工人！',
  '你不是不行，你只是還沒喝到今天的第二杯咖啡。',
  '相信自己，你的潛力跟加班時間一樣無邊無際。',
  '答案在你自己心中，但先放鬆眉頭，好運才會降臨。',
  '今天先做到這裡吧，剩下的交給宇宙自然運行。',
  '把眉頭舒展，讓好運看清你的臉。',
  '你的努力大家都看在眼裡...但薪水還是照舊。',
  '如果覺得累，就閉上眼，假裝自己在渡假。',
  '船到橋頭自然直，如果沒直，那就是船沉了。',
  '只要你不停下腳步，困難就只能在你後面追。',
];

// User-Provided Yawn Idol Image Hosting Links (用戶新增指定美顏提神圖庫 - 33款精選盛世美顏)
export const USER_PROVIDED_YAWN_IMAGES = [
  '/memes/yawn/yawn-1.jpg',
  '/memes/yawn/yawn-2.webp',
  '/memes/yawn/yawn-3.jpg',
  '/memes/yawn/yawn-4.jpg',
  '/memes/yawn/yawn-5.jpg',
  '/memes/yawn/yawn-6.jpg',
  '/memes/yawn/yawn-7.jpg',
  '/memes/yawn/yawn-8.jpg',
  '/memes/yawn/yawn-9.jpg',
  '/memes/yawn/yawn-10.jpg',
  '/memes/yawn/yawn-11.jpg',
  '/memes/yawn/yawn-12.webp',
  '/memes/yawn/yawn-13.webp',
  '/memes/yawn/yawn-14.jpg',
  '/memes/yawn/yawn-15.jpg',
  '/memes/yawn/yawn-16.jpg',
  '/memes/yawn/yawn-17.jpg',
  '/memes/yawn/yawn-18.jpg',
  '/memes/yawn/yawn-19.jpg',
  '/memes/yawn/yawn-20.webp',
  '/memes/yawn/yawn-21.webp',
  '/memes/yawn/yawn-22.jpg',
  '/memes/yawn/yawn-23.jpg',
  '/memes/yawn/yawn-24.jpg',
  '/memes/yawn/yawn-25.jpg',
  '/memes/yawn/yawn-26.jpg',
  '/memes/yawn/yawn-27.jpg',
  '/memes/yawn/yawn-28.webp',
  '/memes/yawn/yawn-29.jpg',
  '/memes/yawn/yawn-30.jpg',
  '/memes/yawn/yawn-31.jpg',
  '/memes/yawn/yawn-32.webp',
  '/memes/yawn/yawn-33.jpg',
];

// Local backup cache for instant fallback
const LOCAL_USER_YAWN_FALLBACKS = [
  '/memes/yawn/yawn-1.jpg',
  '/memes/yawn/yawn-2.webp',
  '/memes/yawn/yawn-3.jpg',
  '/memes/yawn/yawn-4.jpg',
  '/memes/yawn/yawn-5.jpg',
  '/memes/yawn/yawn-6.jpg',
  '/memes/yawn/yawn-7.jpg',
  '/memes/yawn/yawn-8.jpg',
  '/memes/yawn/yawn-9.jpg',
  '/memes/yawn/yawn-10.jpg',
  '/memes/yawn/yawn-11.jpg',
  '/memes/yawn/yawn-12.webp',
  '/memes/yawn/yawn-13.webp',
  '/memes/yawn/yawn-14.jpg',
  '/memes/yawn/yawn-15.jpg',
  '/memes/yawn/yawn-16.jpg',
  '/memes/yawn/yawn-17.jpg',
  '/memes/yawn/yawn-18.jpg',
  '/memes/yawn/yawn-19.jpg',
  '/memes/yawn/yawn-20.webp',
  '/memes/yawn/yawn-21.webp',
  '/memes/yawn/yawn-22.jpg',
  '/memes/yawn/yawn-23.jpg',
  '/memes/yawn/yawn-24.jpg',
  '/memes/yawn/yawn-25.jpg',
  '/memes/yawn/yawn-26.jpg',
  '/memes/yawn/yawn-27.jpg',
  '/memes/yawn/yawn-28.webp',
  '/memes/yawn/yawn-29.jpg',
  '/memes/yawn/yawn-30.jpg',
  '/memes/yawn/yawn-31.jpg',
  '/memes/yawn/yawn-32.webp',
  '/memes/yawn/yawn-33.jpg',
];

// Preload & pre-decode all user images in browser memory immediately for instant 0ms display
if (typeof window !== 'undefined') {
  preloadImages([
    ...USER_PROVIDED_YAWN_IMAGES,
    ...LOCAL_USER_YAWN_FALLBACKS,
    '/memes/cat-yawn.jpg',
    '/memes/dog-frown.jpg',
    '/memes/cat-chill.jpg',
    '/memes/cat-curious.jpg',
    '/memes/dog-tired.jpg',
    '/memes/idol-handsome-1.jpg',
    '/memes/idol-beauty-1.jpg',
    '/memes/idol-beauty-2.jpg',
  ]);
}

const YAWN_CAPTIONS_POOL = [
  {
    topText: '偵測到張口打哈欠',
    bottomText: '請深呼吸並喝水提神醒腦',
    caption: '大口哈欠警報，即時提神醒腦',
    title: '疲勞哈欠警報',
    subtitle: '偵測到大腦缺氧打哈欠，請補充水分並稍作放鬆。',
    badgeText: '',
  },
  {
    topText: '頻繁打哈欠代表大腦缺氧',
    bottomText: '請調整坐姿並稍微伸展肩頸',
    caption: '大腦缺氧臨界點，請適度放鬆',
    title: '缺氧疲勞提醒',
    subtitle: '連續打哈欠代表注意力下降，請起立活動 1 分鐘。',
    badgeText: '',
  },
  {
    topText: '工位疲勞積累中',
    bottomText: '請喝水放鬆，恢復專注狀態',
    caption: '工位疲勞積累，請適度休憩',
    title: '疲勞指數上升',
    subtitle: '即時監測到連續打哈欠，請補充水分維持專注。',
    badgeText: '',
  },
  {
    topText: '打哈欠打出三下巴了？',
    bottomText: '快看頂級帥哥美女的下顎線，精緻起來！',
    caption: '哈欠表情失控，神級下顎線完美範本',
    title: '下顎線失控',
    subtitle: '打哈欠表情崩壞！頂級立體神顏降臨，幫你找回精緻氣場。',
    badgeText: '',
  },
  {
    topText: '床在呼喚你，但打卡鐘說不行！',
    bottomText: '神顏強效提神，比冰美式還提神十倍！',
    caption: '瞌睡蟲大舉入侵，神顏一秒擊退',
    title: '夢想與現實對決',
    subtitle: '打卡鐘無情嘲笑你的哈欠！神仙美貌強效提神，戰勝瞌睡蟲。',
    badgeText: '',
  },
  {
    topText: '剛剛那口哈欠，把元氣都吐光了？',
    bottomText: '滿格魅力補給站，一秒充滿多巴胺！',
    caption: '哈欠吐氣放空，神顏回血滿格',
    title: '元氣漏氣警報',
    subtitle: '哈欠把今天的元氣都吐光了？神級顏值補給站，多巴胺立即滿格。',
    badgeText: '',
  },
  {
    topText: '瞌睡蟲正在進攻，哈欠淪陷中！',
    bottomText: '頂級天神顏值降臨，一拳擊碎所有睡意！',
    caption: '哈欠防線失守，神顏大招全屏秒殺睡意',
    title: '瞌睡大軍壓境',
    subtitle: '瞌睡大軍入侵打哈欠！頂級神顏大招釋放，一拳秒殺全場睡意。',
    badgeText: '',
  },
  {
    topText: '這口哈欠連螢幕都感受到了震動！',
    bottomText: '心動不如行動，看完美顏精神抖擻！',
    caption: '震級哈欠來襲，神顏心跳加速提神',
    title: '芮氏哈欠地震',
    subtitle: '大哈欠震撼螢幕！無懈可擊的神仙顏值讓你心跳加速，清醒滿分。',
    badgeText: '',
  },
  {
    topText: '連打了三個大哈欠？',
    bottomText: '系統判定：極度需要神顏喚醒靈魂！',
    caption: '三連哈欠警報，神仙顏值專屬急救',
    title: '三連哈欠警報',
    subtitle: '三連哈欠觸發警報！神仙顏值隊抵達，靈魂瞬間歸位。',
    badgeText: '',
  },
  {
    topText: '哈欠是身體在抗議：我想放假！',
    bottomText: '現實是：看張神顏美圖繼續做 PPT 吧！',
    caption: '哈欠放假幻想，神顏陪你笑著面對加班',
    title: '放假幻想破滅',
    subtitle: '哈欠是大腦想去度假！面對殘酷現實，讓神顏陪你笑著衝刺。',
    badgeText: '',
  },
  {
    topText: '打哈欠是在偷吸仙氣嗎？',
    bottomText: '這位才是真正的神仙顏值，快看！',
    caption: '哈欠偷吸仙氣，不如直接看真仙女男神',
    title: '真神仙顏值降臨',
    subtitle: '打哈欠偷吸仙氣失敗！真・仙女男神降臨，直接吸飽神仙顏值。',
    badgeText: '',
  },
  {
    topText: '哈欠的盡頭是夢鄉，但你還有 KPI！',
    bottomText: '美顏爆擊讓你瞳孔放大，瞌睡秒退！',
    caption: '哈欠對決 KPI，神顏為你注入滿格戰力',
    title: '美顏爆擊提神',
    subtitle: '哈欠想睡但 KPI 不准！美顏爆擊讓你瞳孔放大，專注力滿點。',
    badgeText: '',
  },
  {
    topText: '哈欠大到能吞下隔壁同事的螢幕！',
    bottomText: '冷靜！神顏現身，專注力重新上線！',
    caption: '巨無霸哈欠退散，神顏召喚專注力',
    title: '巨無霸哈欠',
    subtitle: '巨型哈欠吞噬螢幕！頂級顏值現身，專注力 100% 重新上線。',
    badgeText: '',
  },
  {
    topText: '已經哈欠連天到懷疑人生？',
    bottomText: '神顏一出誰與爭鋒！瞬間清醒繼續衝！',
    caption: '哈欠懷疑人生，神顏重燃熱血戰魂',
    title: '懷疑人生現場',
    subtitle: '哈欠打到懷疑人生！神顏一出誰與爭鋒，重燃熱血工作戰魂。',
    badgeText: '',
  },
  {
    topText: '這口哈欠宣告了精神餘額嚴重不足！',
    bottomText: '盛世美貌為你強制充值 100% 精神力！',
    caption: '哈欠餘額警告，神顏瞬間滿電',
    title: '精神餘額警告',
    subtitle: '精神餘額不足警告！頂級盛世美貌為你強制充值 100% 精神力。',
    badgeText: '',
  },
  {
    topText: '打完哈欠伸個懶腰吧！',
    bottomText: '欣賞完這張神顏，繼續征服今天的工作！',
    caption: '打哈欠拉伸放鬆，神顏相伴精神百倍',
    title: '打哈欠拉個筋',
    subtitle: '打完哈欠伸展一下！欣賞完極品神顏，今天的工作輕鬆征服。',
    badgeText: '',
  },
  {
    topText: '哈欠打得這麼銷魂？',
    bottomText: '醒醒！眼前這張神顏才是真正的人間絕色！',
    caption: '銷魂哈欠退場，人間絕色神顏登場',
    title: '銷魂哈欠退場',
    subtitle: '銷魂哈欠快醒醒！人間絕色神顏登場，瞬間驅散所有睏意。',
    badgeText: '',
  },
  {
    topText: '大腦正在重啟中，哈欠是加載條！',
    bottomText: '加載完畢！神顏降臨，效能瞬間拉滿！',
    caption: '哈欠重啟大腦，神顏加速運算速度',
    title: '大腦重啟加載',
    subtitle: '哈欠是大腦加載進度條！加載完畢，神顏降臨，工作效能瞬間拉滿。',
    badgeText: '',
  },
  {
    topText: '這口哈欠差點把鍵盤給吸進去！',
    bottomText: '嘴巴合上，看眼神仙容顏壓壓驚！',
    caption: '深淵哈欠現場，神級美貌即刻壓驚',
    title: '深淵巨口哈欠',
    subtitle: '深淵哈欠太驚人！嘴巴快合上，看眼神仙容顏壓壓驚繼續衝。',
    badgeText: '',
  },
  {
    topText: '哈欠聲大到連隔壁部門都聽到了！',
    bottomText: '低調！讓神顏幫你找回優雅與清醒！',
    caption: '哈欠廣播全場，優雅神顏緊急救場',
    title: '哈欠全場廣播',
    subtitle: '大哈欠全場聽見！讓優雅神顏幫你找回專注與氣質，低調清醒。',
    badgeText: '',
  },
  {
    topText: '瞌睡蟲在你耳邊唱催眠曲？',
    bottomText: '神顏重低音爆發，瞬間打破催眠節奏！',
    caption: '哈欠催眠無效，神顏炸場秒清醒',
    title: '催眠曲無效化',
    subtitle: '瞌睡催眠曲響起！神顏爆發強大氣場，瞬間打破節奏，秒速清醒。',
    badgeText: '',
  },
  {
    topText: '這口哈欠打出了靈魂出竅的節奏！',
    bottomText: '神顏引力波發射，把你的專注力抓回來！',
    caption: '哈欠引力失控，神顏鎖定專注力',
    title: '靈魂出竅節奏',
    subtitle: '哈欠引力失控！神仙顏值引力波發射，把你的專注力緊緊鎖定。',
    badgeText: '',
  },
];

// Generate all presets dynamically from the 33 images pool
const IDOL_YAWN_PRESETS = USER_PROVIDED_YAWN_IMAGES.map((imgUrl, index) => {
  const captionData = YAWN_CAPTIONS_POOL[index % YAWN_CAPTIONS_POOL.length];
  return {
    image: imgUrl,
    topText: captionData.topText,
    bottomText: captionData.bottomText,
    caption: captionData.caption,
    title: captionData.title,
    subtitle: captionData.subtitle,
    badgeText: captionData.badgeText,
    faceCenter: { x: 50, y: 30 },
  };
});

// Proactively Pre-cache all 33 Yawn Images in browser memory on module load
if (typeof window !== 'undefined') {
  const preloadAllYawnImages = () => {
    USER_PROVIDED_YAWN_IMAGES.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  };
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(preloadAllYawnImages);
  } else {
    setTimeout(preloadAllYawnImages, 500);
  }
}

// Delicate Vector Sparkle Icons for Japanese Purikura Bling-Bling
const SparkleVector: React.FC<{ className?: string; size?: number; color?: string; style?: React.CSSProperties }> = ({
  className = '',
  size = 20,
  color = '#ffffff',
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`pointer-events-none ${className}`}
    style={style}
  >
    <path
      d="M12 0C12 7.5 14 9.5 24 12C14 14.5 12 16.5 12 24C12 16.5 10 14.5 0 12C10 9.5 12 7.5 12 0Z"
      fill={color}
    />
    <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
  </svg>
);

const StarburstVector: React.FC<{ className?: string; size?: number; color?: string; style?: React.CSSProperties }> = ({
  className = '',
  size = 24,
  color = '#ffffff',
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    className={`pointer-events-none ${className}`}
    style={style}
  >
    <path
      d="M16 0C16 9.5 19 12.5 32 16C19 19.5 16 22.5 16 32C16 22.5 13 19.5 0 16C13 12.5 16 9.5 16 0Z"
      fill={color}
    />
    <path
      d="M16 4C16 11 18 13 28 16C18 19 16 21 16 28C16 21 14 19 4 16C14 13 16 11 16 4Z"
      fill="#ffffff"
      opacity="0.85"
      transform="rotate(45 16 16)"
    />
    <circle cx="16" cy="16" r="3" fill="#ffffff" />
  </svg>
);

// Vegas Slot-Machine Integrated Jackpot Cabinet (Stopwatch & Points Tally merged)
interface IntegratedJackpotCabinetProps {
  awaySeconds: number;
  earnedPoints: number;
  nextBlockProgress: number;
  isFacePresent: boolean;
  onClaim: () => void;
}

const IntegratedJackpotCabinet: React.FC<IntegratedJackpotCabinetProps> = ({
  awaySeconds,
  earnedPoints,
  nextBlockProgress,
  isFacePresent,
  onClaim,
}) => {
  const [displayPoints, setDisplayPoints] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [showGoldFlash, setShowGoldFlash] = useState(false);
  const prevPointsRef = useRef(0);

  // Roll points whenever earnedPoints changes
  useEffect(() => {
    const startVal = prevPointsRef.current;
    const endVal = earnedPoints;
    if (endVal === startVal) {
      if (displayPoints !== endVal) {
        setDisplayPoints(endVal);
      }
      return;
    }

    setIsRolling(true);
    let current = startVal;
    const intervalTime = Math.max(50, 400 / Math.max(1, endVal - startVal));
    const timer = setInterval(() => {
      if (current < endVal) {
        current += 1;
        setDisplayPoints(current);
        try {
          soundSynth.playBlinkChime();
        } catch {}
      } else {
        clearInterval(timer);
        setIsRolling(false);
        prevPointsRef.current = endVal;
        setShowGoldFlash(true);
        setTimeout(() => setShowGoldFlash(false), 800);
        try {
          soundSynth.playRewardJingle();
        } catch {}
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [earnedPoints]);

  // Alternating neon marquee lights
  const [lightsAlt, setLightsAlt] = useState(false);
  useEffect(() => {
    const lightTimer = setInterval(() => {
      setLightsAlt(prev => !prev);
    }, 200);
    return () => clearInterval(lightTimer);
  }, []);

  const hrs = Math.floor(awaySeconds / 3600);
  const mins = Math.floor((awaySeconds % 3600) / 60);
  const secs = awaySeconds % 60;
  const stopwatchStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className={`w-full max-w-lg bg-gradient-to-b from-[#081f0f] via-zinc-950 to-black border-4 rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all duration-500 shadow-[0_0_60px_rgba(16,185,129,0.3)] ${
      showGoldFlash ? 'border-yellow-400 ring-4 ring-yellow-400/50 scale-[1.01] shadow-[0_0_80px_rgba(234,179,8,0.7)]' : 'border-emerald-500/80'
    }`}>
      {/* Vegas Casino Header Marquee Board */}
      <div className="absolute inset-x-0 top-0 h-3 pointer-events-none z-10 flex justify-between px-6 bg-emerald-950/90 border-b border-emerald-500/30">
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
          <span key={i} className={`w-1 h-1 rounded-full self-center transition-colors duration-150 ${
            (i % 2 === 0 ? lightsAlt : !lightsAlt) ? 'bg-yellow-400 shadow-[0_0_6px_#facc15]' : 'bg-yellow-900/40'
          }`} />
        ))}
      </div>

      {/* Slots Sides Marquee */}
      <div className="absolute inset-y-0 left-0 w-2 pointer-events-none z-10 flex flex-col justify-between py-6">
        {[1,2,3,4,5,6,7,8].map(i => (
          <span key={i} className={`w-1 h-1 rounded-full self-center transition-colors duration-150 ${
            (i % 2 === (lightsAlt ? 1 : 0)) ? 'bg-yellow-400 shadow-[0_0_6px_#facc15]' : 'bg-yellow-900/40'
          }`} />
        ))}
      </div>
      <div className="absolute inset-y-0 right-0 w-2 pointer-events-none z-10 flex flex-col justify-between py-6">
        {[1,2,3,4,5,6,7,8].map(i => (
          <span key={i} className={`w-1 h-1 rounded-full self-center transition-colors duration-150 ${
            (i % 2 === (lightsAlt ? 0 : 1)) ? 'bg-yellow-400 shadow-[0_0_6px_#facc15]' : 'bg-yellow-900/40'
          }`} />
        ))}
      </div>

      {/* Vegas Casino Sign Banner */}
      <div className="text-center mt-1 sm:mt-1.5 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#0a2313] border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
          <span className="text-sm">🎰</span>
          <span className="text-[10px] font-black font-mono text-yellow-300 uppercase tracking-[0.25em]">
            SLACK_POT // 摸魚至尊獎池
          </span>
          <span className="text-sm">🎰</span>
        </div>
      </div>

      {/* Combined Casino Screen Row */}
      <div className="flex flex-col gap-2.5 bg-zinc-950/90 border-2 border-emerald-500/50 rounded-2xl p-3 sm:p-4 shadow-inner relative">
        {/* Slot Screen Scanline Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none rounded-2xl" />

        {/* Dual Compartment Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative z-10">
          {/* LEFT COMPARTMENT: stopwatch display */}
          <div className="flex flex-col items-center justify-between p-2.5 bg-gradient-to-b from-[#05140b] to-black border border-emerald-500/30 rounded-xl shadow-md">
            <div className="text-[9px] font-mono font-bold text-emerald-400 tracking-wider uppercase mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>離座時數</span>
            </div>

            {/* Odometer Stopwatch Display */}
            <div className="bg-black border border-emerald-500/40 rounded-lg px-2 sm:px-3 h-9 sm:h-10 font-mono text-center flex items-center justify-center shadow-inner relative w-full">
              <span className="text-xl sm:text-2xl font-black text-emerald-300 tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] leading-none">
                {stopwatchStr}
              </span>
            </div>
          </div>

          {/* RIGHT COMPARTMENT: odometer points display */}
          <div className="flex flex-col items-center justify-between p-2.5 bg-gradient-to-b from-[#181303] to-black border border-yellow-500/30 rounded-xl shadow-md">
            <div className="text-[9px] font-mono font-bold text-yellow-400 tracking-wider uppercase mb-1 flex items-center gap-1">
              <span>🏆</span>
              <span>累計健康彩金</span>
            </div>

            {/* Points Roller */}
            <div className="bg-black border border-yellow-500/40 rounded-lg px-2 sm:px-3 h-9 sm:h-10 font-mono text-center flex items-center justify-center gap-1.5 shadow-inner relative w-full">
              <div className="flex gap-1 items-center">
                {String(displayPoints).padStart(2, '0').split('').map((char, index) => (
                  <div key={index} className="relative w-6 sm:w-7 h-7 sm:h-8 bg-gradient-to-b from-zinc-850 via-zinc-950 to-zinc-850 border border-zinc-800 rounded flex items-center justify-center overflow-hidden">
                    <span className={`text-xl sm:text-2xl font-black text-yellow-400 select-none leading-none ${isRolling ? 'animate-pulse text-yellow-300' : ''}`} style={{ textShadow: '0 0 8px rgba(234,179,8,0.7)' }}>
                      {char}
                    </span>
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-black/50" />
                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-black/50" />
                  </div>
                ))}
              </div>
              <span className="text-xs sm:text-sm font-black text-yellow-300 font-mono">BP</span>
            </div>
          </div>
        </div>

        {/* Unified Progress Bar inside Casino Screen (Flat, no separate frame/bg) */}
        <div className="mt-1 px-1 relative z-10 text-center">
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>每 5 分鐘 +5 BP</span>
            </span>
            <span className="text-yellow-400 font-bold">
              還差 <span className="font-mono text-xs text-white">{300 - (awaySeconds % 300)}</span> 秒
            </span>
          </div>

          {/* Next reward countdown bar with neon bubble tip */}
          <div className="w-full bg-zinc-950 rounded-full h-2 border border-emerald-500/20 overflow-hidden relative p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_8px_#10b981] relative"
              style={{ width: `${Math.max(2, nextBlockProgress)}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full animate-pulse shadow-[0_0_6px_#ffffff]" />
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC ACTION TRIGGER: claim button when user returns */}
      <div className="mt-3.5 flex flex-col items-center">
        {isFacePresent ? (
          <>
            <div className="text-center mb-2.5 text-xs font-mono text-yellow-400 font-bold select-none">
              ✨ 偵測到已回座！請領取摸魚點數
            </div>
            <button
              onClick={onClaim}
              className="group w-full max-w-sm relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm border border-emerald-300/60 shadow-[0_0_15px_rgba(52,211,153,0.35)] transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 select-none tracking-wide"
            >
              <span>領取摸魚獎金 💰</span>
            </button>
          </>
        ) : (
          <div className="w-full text-center px-4 py-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 animate-pulse flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>離座中計時累計中... 回座後即可領取摸魚彩金</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ScreensaverMemeTakeover: React.FC<ScreensaverMemeTakeoverProps> = ({
  alert,
  onDismiss,
  telemetry,
  onEscapeOvertime,
}) => {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const onEscapeOvertimeRef = useRef(onEscapeOvertime);
  onEscapeOvertimeRef.current = onEscapeOvertime;

  // Fresh telemetry ref for real-time camera tracking
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  // Random seed for per-instance randomness
  const randomSeedRef = useRef<number>(Math.floor(Math.random() * 10000));
  const currentAlertTypeRef = useRef<string>('');

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const CAR_LIST = [
    { name: 'BMW 3-Series 寶馬 3系列 🚗', price: 50000, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.45)' },
    { name: 'Mercedes-Benz E-Class 賓士 E-Class 🏎️', price: 80000, color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.4)' },
    { name: 'Porsche 911 Carrera 保時捷 911 🚀', price: 150000, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)' },
    { name: 'Ferrari SF90 Spider 法拉利頂配 💎', price: 500000, color: '#dc2626', glow: 'rgba(220, 38, 38, 0.55)' },
  ];

  // Overtime Wooden Fish / Supercar Lineup States
  const [woodenFishClicks, setWoodenFishClicks] = useState<number>(0);
  const [currentCarIndex, setCurrentCarIndex] = useState<number>(() => {
    const val = localStorage.getItem('ow_current_car_index_v3');
    return val ? parseInt(val, 10) : 0;
  });
  const [currentCarFunded, setCurrentCarFunded] = useState<number>(() => {
    const val = localStorage.getItem('ow_current_car_funded_v3');
    return val ? parseInt(val, 10) : 0;
  });
  const [sessionFundAdded, setSessionFundAdded] = useState<number>(0);
  const [isWaiverChecked, setIsWaiverChecked] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; left: number; top: number }[]>([]);
  const [isUpgradingCar, setIsUpgradingCar] = useState<boolean>(false);
  const [upgradedCarName, setUpgradedCarName] = useState<string>('');
  const [isCompletingFund, setIsCompletingFund] = useState<boolean>(false);
  const [isEscapingWithToyota, setIsEscapingWithToyota] = useState<boolean>(false);

  // Cleanup for floating texts
  useEffect(() => {
    if (floatingTexts.length === 0) return;
    const timer = setTimeout(() => {
      setFloatingTexts((prev) => prev.slice(1));
    }, 1200);
    return () => clearTimeout(timer);
  }, [floatingTexts]);

  // Book of Answers States
  const [bookStep, setBookStep] = useState<1 | 2 | 3>(1); // 1: 默想, 2: 翻頁中, 3: 解答
  const [bookAnswer, setBookAnswer] = useState<string>('');

  // Hourly Water Alert States
  const [waterStep, setWaterStep] = useState<'initial' | 'drinking' | 'completed'>('initial');
  const [waterProgress, setWaterProgress] = useState<number>(0);
  const [hydrationEyeStyle, setHydrationEyeStyle] = useState<'anime' | 'sunglasses'>('sunglasses');

  // Yawn Mode States: Unified 7s countdown, only displaying remaining seconds
  const [yawnRemainingSeconds, setYawnRemainingSeconds] = useState<number>(7);
  const [yawnElapsedSeconds, setYawnElapsedSeconds] = useState<number>(0);

  // Blink Mode States: Real camera closed-eye detection for 10 seconds
  const [closedEyeSeconds, setClosedEyeSeconds] = useState<number>(0);
  const [isEyesCurrentlyClosed, setIsEyesCurrentlyClosed] = useState<boolean>(false);
  const [isRestComplete, setIsRestComplete] = useState<boolean>(false);
  const [restCountdown, setRestCountdown] = useState<number>(3);
  const closedEyeMsRef = useRef<number>(0);
  const isRestCompleteRef = useRef<boolean>(false);

  // Floating bouncing mascot position
  const [bouncingPos, setBouncingPos] = useState({ x: 15, y: 25 });
  const animFrameRef = useRef<number | null>(null);

  // Canvas ref for Confetti / Particle shower
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Slack / Away Mode: Stopwatch state
  const [awaySeconds, setAwaySeconds] = useState<number>(300);

  // Real-time digital clock
  useEffect(() => {
    if (!alert) return;
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [alert?.type]);

  // Hidden ESC Key dismiss mechanism (Pressing ESC closes screensaver immediately without any prompt)
  useEffect(() => {
    if (!alert) return;

    const handleKeyDownCapture = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onDismissRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDownCapture, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDownCapture, { capture: true });
    };
  }, [alert]);

  // Reset states ONLY when alert type actually transitions (prevents wiping user interaction)
  useEffect(() => {
    if (!alert) return;
    if (currentAlertTypeRef.current !== alert.type) {
      currentAlertTypeRef.current = alert.type;
      randomSeedRef.current = Math.floor(Math.random() * 10000);
      const seed = randomSeedRef.current;
      setBookStep(1);
      setBookAnswer(BOOK_OF_ANSWERS_QUOTES[seed % BOOK_OF_ANSWERS_QUOTES.length]);
      closedEyeMsRef.current = 0;
      isRestCompleteRef.current = false;
      setClosedEyeSeconds(0);
      setIsRestComplete(false);
      setYawnRemainingSeconds(7);
      setYawnElapsedSeconds(0);
      setWaterStep('initial');
      setWaterProgress(0);
      setAwaySeconds(300);
      setWoodenFishClicks(0);
      setIsCompletingFund(false);
      setIsWaiverChecked(false);
      setFloatingTexts([]);
    }
  }, [alert?.type]);

  // Yawn Mode Timer: Unified 7 seconds countdown, auto-dismisses after 7s
  useEffect(() => {
    if (!alert || alert.type !== 'yawn') return;

    setYawnElapsedSeconds(0);
    setYawnRemainingSeconds(7);

    const startTs = Date.now();
    const TOTAL_DURATION_MS = 7000; // 7 seconds total

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startTs;
      const elapsedSec = Math.min(7, elapsedMs / 1000);
      const remainingSec = Math.max(0, Math.ceil((TOTAL_DURATION_MS - elapsedMs) / 1000));

      setYawnElapsedSeconds(elapsedSec);
      setYawnRemainingSeconds(remainingSec);

      if (elapsedMs >= TOTAL_DURATION_MS) {
        clearInterval(interval);
        onDismissRef.current();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [alert?.type, alert?.timestamp]);

  // Stopwatch for Slack/Away mode that increments actual seconds
  useEffect(() => {
    if (!alert || alert.type !== 'slack') return;

    // Initialize with the current away seconds from telemetry
    const initialSecs = Math.max(300, Math.floor(telemetry?.consecutiveAwaySeconds || 300));
    setAwaySeconds(initialSecs);

    const timer = setInterval(() => {
      const isFacePresent = !!telemetryRef.current?.isFacePresent;
      if (!isFacePresent) {
        setAwaySeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [alert?.type]);

  // High-frequency 100ms real camera closed-eye tracking loop
  useEffect(() => {
    if (!alert || alert.type !== 'blink') return;

    const intervalId = setInterval(() => {
      if (isRestCompleteRef.current) return;

      const t = telemetryRef.current;
      // Real camera eye closure detection:
      // 1. isEyesClosed computed from MediaPipe landmarks & blendshapes
      // 2. blinkScore > 0.35
      // 3. ear < 0.20
      const eyesClosed =
        !!t &&
        (t.isEyesClosed === true ||
          t.blinkScore > 0.35 ||
          (t.ear !== undefined && t.ear < 0.20));

      setIsEyesCurrentlyClosed(eyesClosed);

      if (eyesClosed) {
        closedEyeMsRef.current += 100;
        const totalSecs = Math.min(10, Math.floor(closedEyeMsRef.current / 1000));
        setClosedEyeSeconds(totalSecs);

        if (closedEyeMsRef.current >= 10000) {
          isRestCompleteRef.current = true;
          setIsRestComplete(true);
          try {
            soundSynth.playEyeRestCompleteFanfare();
          } catch {
            soundSynth.playBlinkChime();
          }
        }
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [alert?.type]);

  // 3-second auto-close countdown when 10s eye rest is completed
  useEffect(() => {
    if (!isRestComplete || alert?.type !== 'blink') return;

    setRestCountdown(3);
    const countdownInterval = setInterval(() => {
      setRestCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            onDismissRef.current();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isRestComplete, alert?.type]);

  // Bouncing mascot animation
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

  // Keyboard shortcut listener (ESC is secret hidden mechanism)
  useEffect(() => {
    if (!alert) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismissRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alert?.type, alert?.timestamp]);

  // Particle shower canvas animation
  useEffect(() => {
    if (!alert) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const isYawn = alert.type === 'yawn';
    const isBlink = alert.type === 'blink';

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

    const symbols = isYawn
      ? ['✨', '💖', '🌟', '💓', '👑', '🌸', '💫']
      : isBlink
      ? ['👁️', '✨', '💎', '🌸', '💧', '💤']
      : ['📖', '✨', '🧘', '🍵', '💫', '🌸'];

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        size: Math.random() * 12 + 18,
        speedY: Math.random() * 2.5 + 1.2,
        speedX: (Math.random() - 0.5) * 1.5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        char: symbols[Math.floor(Math.random() * symbols.length)],
        color: isYawn ? '#ec4899' : isBlink ? '#38bdf8' : '#f59e0b',
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        if (p.y > canvas.height + 50) {
          p.y = -50;
          p.x = Math.random() * canvas.width;
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

  // Trigger Book of Answers Page Flip
  const handleOpenBookOfAnswers = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      soundSynth.playMysticBookFlip();
    } catch {
      soundSynth.playBlinkChime();
    }
    setBookStep(2); // Page flip loading state
    setTimeout(() => {
      const seed = Math.floor(Math.random() * BOOK_OF_ANSWERS_QUOTES.length);
      setBookAnswer(BOOK_OF_ANSWERS_QUOTES[seed]);
      setBookStep(3); // Land on answer
      try {
        soundSynth.playOracleReveal();
      } catch {}
    }, 850);
  };

  // Trigger Water Hydration Drinking Sequence & SVG Animation
  const handleStartDrinking = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setWaterStep('drinking');
    setWaterProgress(0);
    try {
      soundSynth.playWaterDrink();
    } catch {}

    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += 1.5; // Slower, realistic liquid gulping (~6.6 seconds total)
      if (Math.floor(currentProg) % 22 === 0 && currentProg > 0) {
        try {
          soundSynth.playWaterDrink();
        } catch {}
      }
      setWaterProgress(Math.min(100, Math.round(currentProg * 10) / 10));

      if (currentProg >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setWaterStep('completed');
          try {
            soundSynth.playRewardJingle();
          } catch {}
        }, 400);
      }
    }, 100);
  };

  // Preset Meme Media & Theming per Hazard
  const getThemeConfig = () => {
    const seed = Math.abs((alert.timestamp || 1) * 31 + (alert.title?.length || 0) + randomSeedRef.current) % 100;

    switch (alert.type) {
      case 'yawn': {
        // Compute high-entropy independent random indexes for image and text
        const baseSeed = Math.abs((alert.timestamp || 1) * 31 + (alert.title?.length || 0) + (randomSeedRef.current || 1));
        const imgIndex = Math.floor(Math.abs(Math.sin(baseSeed * 9301 + 49297) * 100000)) % USER_PROVIDED_YAWN_IMAGES.length;
        const captionIndex = Math.floor(Math.abs(Math.cos(baseSeed * 49297 + 9301 + 1337) * 100000)) % YAWN_CAPTIONS_POOL.length;

        const selectedImage = USER_PROVIDED_YAWN_IMAGES[imgIndex];
        const selectedCaption = YAWN_CAPTIONS_POOL[captionIndex];
        const localFallback = LOCAL_USER_YAWN_FALLBACKS[imgIndex];
        const nextFallback = USER_PROVIDED_YAWN_IMAGES[(imgIndex + 1) % USER_PROVIDED_YAWN_IMAGES.length];
        const nextLocalFallback = LOCAL_USER_YAWN_FALLBACKS[(imgIndex + 1) % USER_PROVIDED_YAWN_IMAGES.length];

        return {
          title: selectedCaption.title,
          subtitle: selectedCaption.subtitle,
          badgeText: selectedCaption.badgeText,
          badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/60 shadow-[0_0_12px_rgba(236,72,153,0.3)]',
          accentColor: '#ec4899',
          category: 'idol' as const,
          memeImage: selectedImage,
          fallbackImages: [], // Single static image, never rotate during the 10s
          topText: selectedCaption.topText,
          bottomText: selectedCaption.bottomText,
          memeCaption: selectedCaption.caption,
          floatingIcon: '👑',
          glowGradient:
            'radial-gradient(circle at center, rgba(236,72,153,0.18) 0%, rgba(9,10,15,0.98) 75%)',
        };
      }
      case 'blink': {
        return {
          title: '雙眼乾澀修復',
          subtitle: '眼球乾澀度偏高，請閉上雙眼進行 10 秒光學保濕。',
          badgeText: '',
          badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/60 shadow-[0_0_12px_rgba(59,130,246,0.35)]',
          accentColor: '#3b82f6',
          category: 'general' as const,
          memeImage: '/memes/idol-beauty-2.jpg',
          fallbackImages: [
            '/memes/idol-handsome-1.jpg',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
          ],
          topText: '請閉眼休息 10 秒',
          bottomText: '讓緊繃的眼球肌肉徹底放鬆',
          memeCaption: '系統監測雙眼閉合累計 10 秒即自動關閉',
          floatingIcon: '',
          glowGradient:
            'radial-gradient(circle at center, rgba(59,130,246,0.22) 0%, rgba(9,10,15,0.98) 75%)',
        };
      }
      case 'slack': {
        return {
          title: '摸魚獎池',
          subtitle: '離座超過 5 分鐘，摸魚獎金累積中。',
          badgeText: '',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_12px_rgba(52,211,153,0.35)]',
          accentColor: '#10b981',
          category: 'general' as const,
          memeImage: '/memes/cat-chill.jpg',
          fallbackImages: ['/memes/dog-tired.jpg'],
          topText: '遠離螢幕，專注休息',
          bottomText: '離座每 5 分鐘自動累積獎金',
          memeCaption: '適度離開工位，重獲心靈安寧',
          floatingIcon: '',
          glowGradient:
            'radial-gradient(circle at center, rgba(16,185,129,0.2) 0%, rgba(9,10,15,0.98) 75%)',
        };
      }
      case 'frown': {
        return {
          title: '解答之書',
          subtitle: '心中有疑惑？讓解答之書為你指點迷津，開解職場困惑。',
          badgeText: '',
          badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.25)]',
          accentColor: '#6366f1',
          category: 'general' as const,
          memeImage: '/memes/dog-frown.jpg',
          fallbackImages: [
            '/memes/dog-tired.jpg',
            'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80',
          ],
          topText: '是什麼事讓你眉頭深鎖？',
          bottomText: '讓解答之書為你指點迷津',
          memeCaption: '翻開典籍，解鎖職場金句與宇宙解答',
          floatingIcon: '',
          glowGradient:
            'radial-gradient(circle at center, rgba(99,102,241,0.18) 0%, rgba(9,10,15,0.98) 75%)',
        };
      }
      case 'hydration':
      case 'beauty_score': {
        return {
          title: '定時補充水分',
          subtitle: '大口補充水分，讓細胞充盈水光，維持良好專注狀態。',
          badgeText: '久坐補水',
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
          accentColor: '#06b6d4',
          category: 'general' as const,
          memeImage: alert.image || '/memes/idol-handsome-1.jpg',
          fallbackImages: [
            '/memes/idol-beauty-1.jpg',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
          ],
          topText: '定時補水，喝口溫水',
          bottomText: '補充體內水分，專注力與活力全面升級',
          memeCaption: `${alert.badge || '工位補水存證'}`,
          floatingIcon: '💧',
          glowGradient:
            'radial-gradient(circle at center, rgba(6,182,212,0.2) 0%, rgba(9,10,15,0.98) 75%)',
        };
      }
      default:
        return {
          title: alert.title ? alert.title.replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').replace(/\/\/.*/g, '').trim() : '提醒',
          subtitle: alert.message ? alert.message.replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() : '請注意適度休息。',
          badgeText: '',
          badgeClass: 'bg-[#00d8ff]/15 text-[#00d8ff] border-[#00d8ff]/60 shadow-[0_0_15px_rgba(0,216,255,0.25)]',
          accentColor: '#00d8ff',
          category: 'general' as const,
          memeImage: alert.image || '/memes/cat-chill.jpg',
          fallbackImages: [],
          topText: '狀態提醒',
          bottomText: '請維持適度警覺，保護健康狀況',
          memeCaption: '保持適度警覺，守護專注力',
          floatingIcon: '',
          glowGradient:
            'radial-gradient(circle at center, rgba(0,216,255,0.18) 0%, rgba(9,10,15,0.98) 75%)',
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <div
      id="screensaver-meme-takeover"
      className="fixed inset-0 z-[999990] bg-[#090a0f] text-slate-100 flex flex-col justify-between p-2 sm:p-3 md:p-4 select-none overflow-hidden font-mono cursor-default animate-in fade-in duration-300 pointer-events-auto h-[100dvh] max-h-[100dvh] w-full"
      style={{ backgroundImage: theme.glowGradient }}
    >
      <style>{`
        @keyframes owBlingTwinkle {
          0%, 100% {
            transform: scale(0.65) rotate(0deg);
            opacity: 0.35;
            filter: drop-shadow(0 0 2px rgba(255,255,255,0.4));
          }
          50% {
            transform: scale(1.25) rotate(45deg);
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(56,189,248,0.95)) drop-shadow(0 0 16px rgba(244,114,182,0.85));
          }
        }
        @keyframes owBubbleFloat {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          30% { opacity: 0.85; }
          80% { opacity: 0.85; }
          100% { transform: translateY(-75px) scale(1.25); opacity: 0; }
        }
        @keyframes owGulpThroat {
          0%, 100% { transform: scaleY(1); opacity: 0.3; }
          50% { transform: scaleY(1.4); opacity: 0.9; }
        }
        @keyframes owAuraPulse {
          0%, 100% { transform: scale(0.95); opacity: 0.35; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        .animate-bling-twinkle {
          animation: owBlingTwinkle 2.2s infinite ease-in-out;
        }
        .animate-bubble-float {
          animation: owBubbleFloat 1.8s infinite linear;
        }
        .animate-gulp-throat {
          animation: owGulpThroat 0.8s infinite ease-in-out;
        }
        .animate-aura-pulse {
          animation: owAuraPulse 2s infinite ease-in-out;
        }
      `}</style>

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
          <div
            className={`flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded border text-[10px] sm:text-[11px] font-bold tracking-wider truncate ${theme.badgeClass}`}
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor] shrink-0" />
            <span className="truncate">&gt; OVERWATCH // INTERCEPT</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0a0c10]/90 border border-white/10 text-slate-300 text-[10px] sm:text-xs shadow-inner">
            <Clock className="w-3 h-3 text-[#00d8ff] shrink-0" />
            <span className="font-bold tracking-widest">{currentTime}</span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1 sm:p-1.5 rounded bg-[#10141c] border border-white/10 hover:border-[#00d8ff]/70 text-slate-400 hover:text-white transition cursor-pointer"
            title="切換全螢幕"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* FLOATING BOUNCING TACTICAL DRONE */}
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
            &gt; OVERWATCH_INTERCEPT
          </div>
          <div className="text-[8px] text-[#00d8ff] font-mono">[ACTIVE_LOCK]</div>
        </div>
      </div>

      {/* MAIN HERO CARD */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center text-center px-2 sm:px-4 max-w-5xl lg:max-w-6xl mx-auto py-2 w-full overflow-hidden">
        <div className="relative w-full h-full max-h-full flex flex-col items-center justify-center rounded-lg bg-[#0a0c10]/95 border border-white/10 shadow-[0_8px_36px_0_rgba(0,0,0,0.85)] backdrop-blur-xl p-3 sm:p-4 overflow-hidden cctv-brackets">

          {/* DYNAMIC CONTENT PER HAZARD TYPE */}
          <div className={`relative group mx-auto w-full flex-1 min-h-[320px] max-h-[74vh] flex flex-col shrink overflow-hidden rounded-lg border shadow-2xl bg-black/95 transition-all duration-300 ${
            alert.type === 'overtime' ? 'border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'border-white/10'
          }`}>
            
            {/* 1. BLINK MODE: 雙眼閉合修復 (碼表倒數與 completion 分離) */}
            {alert.type === 'blink' ? (
              <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-gradient-to-b from-[#090d16] via-[#05070a] to-[#090d16] pointer-events-auto relative overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />

                {!isRestComplete ? (
                  /* ─── 碼表倒數進行中 (STOPWATCH COUNTDOWN CARD) ─── */
                  <div className="flex flex-col items-center justify-center max-w-md w-full z-10 animate-in fade-in duration-300">
                    {/* Trigger Cause & Fun Witty Heading */}
                    <div className="flex flex-col items-center text-center mb-2">
                      <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-normal mb-1">
                        雙眼乾澀度爆表！請閉眼 10 秒保濕
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-300/90 font-mono max-w-sm leading-snug">
                        請閉上雙眼進行光學保濕，感應到閉眼後將自動開始倒數。
                      </p>
                    </div>

                    {/* Cybernetic Holographic Eye Scanner Widget */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-2 flex items-center justify-center">
                      {/* Rotating Cyber Outer Ring */}
                      <svg className="absolute inset-0 w-full h-full animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" stroke="rgba(6,182,212,0.15)" strokeWidth="1" fill="none" />
                        <circle cx="50" cy="50" r="45" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="15 30 10 15" fill="none" className="opacity-70" />
                      </svg>
                      
                      {/* Inner Counter-Rotating Ring */}
                      <svg className="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite_reverse]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" stroke="rgba(16,185,129,0.1)" strokeWidth="1" fill="none" />
                        <circle cx="50" cy="50" r="38" stroke={isEyesCurrentlyClosed ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeDasharray="5 15 25 10" fill="none" className="opacity-80 transition-colors duration-300" />
                      </svg>

                      {/* Radar sweep light overlay */}
                      <div className={`absolute inset-1 rounded-full border border-dashed transition-colors duration-300 ${
                        isEyesCurrentlyClosed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                      }`}>
                        {/* Pulse overlay */}
                        <div className={`absolute inset-0 rounded-full animate-ping opacity-15 ${
                          isEyesCurrentlyClosed ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                      </div>

                      {/* Eye State Icon */}
                      <div className="relative z-10 transition-transform duration-300 hover:scale-110">
                        {isEyesCurrentlyClosed ? (
                          /* CLOSED EYE HOLOGRAPH: Green/Emerald high-tech sleepy curve with eyelashes */
                          <svg className="w-13 h-13 sm:w-15 sm:h-15 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10c2.5 4 6.5 6 9 6s6.5-2 9-6" />
                            <path strokeLinecap="round" d="M6 13l-1.5 2.5M10 15l-.5 3M14 15l.5 3M18 13l1.5 2.5" />
                          </svg>
                        ) : (
                          /* OPEN EYE TARGET: Red warning blinking open eye with circular crosshair */
                          <div className="relative flex items-center justify-center">
                            <svg className="w-13 h-13 sm:w-15 sm:h-15 text-red-500 animate-pulse drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Small floating tracking text */}
                      <div className={`absolute -bottom-1 text-[7px] font-mono tracking-widest px-1 py-0.2 rounded border bg-black/90 transition-colors duration-300 scale-90 ${
                        isEyesCurrentlyClosed ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30'
                      }`}>
                        {isEyesCurrentlyClosed ? 'STABLE' : 'WARN_DRY'}
                      </div>
                    </div>

                    {/* Camera Closed Eye Detection Status Pill */}
                    <div className="mb-2">
                      {isEyesCurrentlyClosed ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/90 text-emerald-300 text-[10px] font-black animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.35)] font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                          <span>🟢【鏡頭感應】雙眼已閉合！碼表倒數進行中...</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-300 text-[10px] font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)] font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                          <span>🟡【鏡頭感應】請閉上雙眼！即可啟動碼表倒數</span>
                        </div>
                      )}
                    </div>

                    {/* CYBERNETIC DIGITAL STOPWATCH DISPLAY (精簡戰術碼錶) */}
                    <div className="relative w-full max-w-sm bg-[#04070e] border border-cyan-500/70 rounded-xl p-3 sm:p-4 shadow-[0_0_25px_rgba(6,182,212,0.25)] flex flex-col items-center justify-center">
                      {/* Top Chrono Badge */}
                      <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400 border-b border-cyan-500/30 pb-1 mb-2">
                        <span className="text-cyan-400 font-bold tracking-wider">&gt; CHRONO_TIMER // 10s</span>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-[9px]">
                          {isEyesCurrentlyClosed ? 'RUNNING' : 'PAUSED'}
                        </span>
                      </div>

                      {/* Main Big Digital Clock Readout */}
                      <div className="my-0.5 font-mono">
                        <span className="text-3xl sm:text-4xl font-black text-white tracking-wider drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
                          00:{String(Math.max(0, 10 - closedEyeSeconds)).padStart(2, '0')}
                          <span className="text-xl text-cyan-400 font-bold">
                            .{Math.floor((10000 - Math.min(10000, closedEyeMsRef.current)) % 1000 / 100)}
                          </span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 ml-1.5">SEC</span>
                      </div>

                      {/* Progress Bar under Stopwatch */}
                      <div className="w-full bg-slate-900/90 rounded-full h-2.5 border border-cyan-500/40 overflow-hidden relative mt-2 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-300 transition-all duration-100 shadow-[0_0_10px_#06b6d4]"
                          style={{ width: `${(closedEyeSeconds / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ─── 碼表完成後：碼錶消失，顯示準備回到監控頁的提示 ─── */
                  <div className="flex flex-col items-center justify-center max-w-md w-full z-10 animate-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/90 border border-emerald-400 flex items-center justify-center mb-2.5 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.4)] animate-bounce shrink-0">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>

                    <div className="bg-[#040b08] border border-emerald-400/80 rounded-xl p-4 sm:p-5 shadow-[0_0_30px_rgba(52,211,153,0.25)] w-full flex flex-col items-center text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>10 SEC_REST_COMPLETE // 修復達成</span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-black text-white mb-3 font-mono">
                        ✅ 雙眼 10 秒閉眼修復達成！
                      </h3>

                      {/* Prompt Preparing to Return to Monitoring Page */}
                      <div className="w-full bg-emerald-950/80 border border-emerald-500/50 rounded-lg p-3 mb-4 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 font-mono">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                          <span>準備返回 OVERWATCH 監控頁面...</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono">
                          將於 <span className="text-sm font-black text-emerald-400 font-mono px-0.5">{restCountdown}</span> 秒後自動返回
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={onDismiss}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] border border-emerald-300/60 shadow-[0_0_15px_rgba(52,211,153,0.35)] transition hover:scale-105 active:scale-95 cursor-pointer font-mono tracking-wider"
                      >
                        【 立即返回 OVERWATCH 監控頁 】
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : alert.type === 'frown' ? (
              /* 2. FROWN MODE: 解答之書 (深邃星空紫/靛藍典籍質感，徹底移除黃色) */
              <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 text-center bg-gradient-to-b from-[#0e101f] via-[#070913] to-[#030408] relative overflow-hidden pointer-events-auto">
                
                {/* Subtle Indigo Glow Background */}
                <div className="absolute w-[420px] h-[420px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.08)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-60" />

                {/* Book Card Container */}
                <div className="relative w-full max-w-xl max-h-[92%] bg-gradient-to-b from-[#11142a]/95 via-[#0c0e1e]/98 to-[#060710]/95 border-2 border-indigo-500/60 rounded-2xl p-4 sm:p-6 shadow-[0_0_35px_rgba(99,102,241,0.25),inset_0_1px_1px_rgba(165,180,252,0.3)] flex flex-col items-center justify-between z-30 pointer-events-auto backdrop-blur-xl">
                  
                  {/* Ornate Indigo / Silver Filigree Corners */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400/80 rounded-tl-md pointer-events-none" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400/80 rounded-tr-md pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400/80 rounded-bl-md pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400/80 rounded-br-md pointer-events-none" />
                  <div className="absolute inset-2 rounded-xl border border-indigo-400/20 pointer-events-none" />

                  {/* Top Emblem & Header */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-indigo-950 to-slate-950 border-2 border-indigo-400/80 flex items-center justify-center text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.4)] mb-2">
                      <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.7)]" />
                    </div>

                    {bookStep !== 3 && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/40 text-[10px] sm:text-xs font-bold font-mono text-indigo-300 tracking-[0.2em] uppercase mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>&gt; THE_BOOK_OF_ANSWERS // 命運解答之書</span>
                      </div>
                    )}
                  </div>

                  {/* Step 1: Contemplation */}
                  {bookStep === 1 && (
                    <div className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in duration-300 z-40 pointer-events-auto py-2">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-100 mb-2 tracking-wide drop-shadow-[0_2px_10px_rgba(99,102,241,0.3)]">
                        是什麼事讓你眉頭深鎖？🤔
                      </h2>
                      <p className="text-xs sm:text-sm text-indigo-200/90 max-w-md mb-3 leading-relaxed">
                        讓【命運解答之書】為你指點迷津，開解人生難題與職場困惑。
                      </p>

                      <div className="text-xs text-indigo-300/85 font-mono bg-indigo-950/60 border border-indigo-500/30 rounded-lg px-4 py-2 mb-5 shadow-inner">
                        💭 請在心中默想你的問題，平息雜念後輕觸翻開解答...
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleOpenBookOfAnswers(e)}
                        className="group relative pointer-events-auto px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm border-2 border-indigo-300/80 shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 select-none"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-white" />
                        <span className="tracking-wide">翻開解答之書 ➔</span>
                      </button>
                    </div>
                  )}

                  {/* Step 2: Turning Pages */}
                  {bookStep === 2 && (
                    <div className="w-full flex-1 flex flex-col items-center justify-center py-4 animate-in fade-in duration-200 pointer-events-auto">
                      <div className="w-12 h-12 mb-3 flex items-center justify-center">
                        <RotateCw className="w-8 h-8 text-indigo-400 animate-spin" />
                      </div>
                      <div className="text-base font-bold text-indigo-300 font-mono tracking-wider">
                        解答之書翻頁中...
                      </div>
                      <div className="text-xs text-indigo-300/70 mt-1 font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>正在從宇宙宿命中翻閱專屬解惑靈籤...</span>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Answer Revealed */}
                  {bookStep === 3 && (
                    <div className="w-full flex-1 flex flex-col items-center justify-center animate-answer-reveal z-40 pointer-events-auto py-2">
                      <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-indigo-300 font-mono mb-3 uppercase tracking-widest bg-indigo-950/60 px-3.5 py-1 rounded-full border border-indigo-400/30">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                        <span>&gt; ANSWER_REVEALED // 解毒聖諭</span>
                      </div>

                      {/* Oracle Mystic Scroll Plate */}
                      <div className="relative w-full max-w-lg mb-4 flex-1 min-h-0 flex flex-col justify-center">
                        <div className="relative w-full max-h-[42vh] bg-[#060814]/95 p-4 sm:p-5 rounded-xl border-2 border-indigo-400/80 shadow-[0_0_25px_rgba(99,102,241,0.25)] flex flex-col overflow-hidden">
                          <div className="text-indigo-400/30 text-2xl font-serif absolute top-1.5 left-2 select-none pointer-events-none leading-none">“</div>
                          <div className="relative z-10 px-2 py-1 overflow-y-auto max-h-[34vh] overscroll-contain pr-2 scrollbar-thin">
                            {(() => {
                              const len = bookAnswer.length;
                              // Dynamic font sizing based on string length to ensure it never overflows
                              const sizeClass =
                                len > 40
                                  ? 'text-xs sm:text-sm font-semibold leading-relaxed'
                                  : len > 26
                                  ? 'text-sm sm:text-base font-bold leading-relaxed'
                                  : len > 18
                                  ? 'text-base sm:text-lg font-extrabold leading-relaxed'
                                  : 'text-lg sm:text-xl font-black leading-relaxed';

                              return (
                                <p className={`${sizeClass} text-slate-100 tracking-wide text-center my-auto`}>
                                  {bookAnswer}
                                </p>
                              );
                            })()}
                          </div>
                          <div className="text-indigo-400/30 text-2xl font-serif absolute bottom-1.5 right-2 select-none pointer-events-none leading-none">”</div>
                        </div>
                      </div>

                      {/* Accept Fate Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDismissRef.current();
                        }}
                        className="group relative pointer-events-auto px-7 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 hover:from-indigo-500 hover:via-violet-500 hover:to-indigo-400 text-white font-bold text-xs sm:text-sm border-2 border-indigo-300 shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-transform hover:scale-105 active:scale-95 cursor-pointer z-50 select-none text-center"
                      >
                        <span className="tracking-wide">這就是命啊 🚬</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (alert.type === 'slack') ? (
              /* 3. AWAY / SLACK MODE: 離座 5 分鐘計時器 + 每 5 分鐘健康點數進帳動態特效 */
              <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 text-center bg-gradient-to-b from-[#04120a] via-[#020a05] to-[#06180d] relative overflow-hidden pointer-events-auto">
                {/* Ambient Glow */}
                <div className="absolute w-[450px] h-[450px] rounded-full bg-emerald-500/15 blur-[100px] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(rgba(16,185,129,0.08)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

                <div className="relative z-30 pointer-events-auto my-auto w-full max-w-lg">
                  {/* Main Dynamic Stopwatch & Health Points - INTEGRATED VEGAS JACKPOT CABINET */}
                  {(() => {
                    const fiveMinBlocks = Math.max(1, Math.floor(awaySeconds / 300));
                    const earnedPoints = fiveMinBlocks * 5;
                    const currentBlockSecs = Math.floor(awaySeconds % 300);
                    const nextBlockProgress = Math.min(100, Math.max(0, (currentBlockSecs / 300) * 100));
                    const isFacePresent = !!telemetry?.isFacePresent;

                    return (
                      <IntegratedJackpotCabinet
                        awaySeconds={awaySeconds}
                        earnedPoints={earnedPoints}
                        nextBlockProgress={nextBlockProgress}
                        isFacePresent={isFacePresent}
                        onClaim={() => {
                          try {
                            soundSynth.playRewardJingle();
                          } catch {}
                          onDismiss();
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            ) : (alert.type === 'hydration' || alert.type === 'beauty_score') ? (
              /* 3. HOURLY WATER HYDRATION ALERT WITH CANDID PHOTO & ANIMATED SVG DRINKING & BEAUTY TRANSFORMATION */
              waterStep === 'initial' ? (
                /* STEP 1: PHOTO FILLS THE UPPER FRAME, BUTTON PLACED COMPLETELY OUTSIDE THE PHOTO */
                <div className="w-full h-full flex flex-col justify-between p-2 sm:p-3 pointer-events-auto select-none overflow-hidden gap-2 bg-gradient-to-b from-[#06101a] via-[#040810] to-[#081524]">
                  {/* Photo Display Card - Occupies full available area, no button inside! */}
                  <div className="relative w-full max-w-2xl mx-auto flex-1 min-h-0 rounded-xl overflow-hidden border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.2)] bg-black flex flex-col justify-between">
                    {/* Background Full Frame Photo with Auto Face Centering */}
                    <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center">
                      <TacticalMemeImage
                        src={alert.image || '/memes/idol-handsome-1.jpg'}
                        fallbackUrls={['/memes/idol-beauty-1.jpg']}
                        category="general"
                        faceCenter={alert.faceCenter}
                        alt="工位突擊抓拍醜照"
                        className="w-full h-full object-contain sm:object-cover"
                      />
                      {/* Retro CCTV Scanlines & Ambient Edge Vignette */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_50%,rgba(0,0,0,0.22)_50%)] bg-[length:100%_4px] pointer-events-none opacity-60" />
                      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.65)] pointer-events-none" />
                    </div>

                    {/* Overwatch Corner Brackets on the photo corners */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none z-20" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none z-20" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none z-20" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none z-20" />

                    {/* Top Text Overlay (維持現狀 - 浮於照片頂端，完整露出臉部) */}
                    <div className="relative z-20 w-full pt-2.5 pb-7 px-4 bg-gradient-to-b from-black/95 via-black/75 to-transparent flex flex-col items-center gap-1 pointer-events-none">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/85 border border-cyan-400/80 text-cyan-300 text-xs font-mono font-black shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>📸 工位突擊抓拍存證 // 整點補水督導</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-white font-mono tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] text-center">
                        💧 連續久坐！細胞水分正悄悄蒸發，肌膚乾癟警報發布中
                      </div>
                    </div>

                    {/* Middle & Bottom of photo are 100% unobstructed */}
                    <div className="flex-1 min-h-0 pointer-events-none" />
                  </div>

                  {/* BOTTOM ACTION BAR - LOCATED COMPLETELY OUTSIDE THE PHOTO */}
                  <div className="relative z-20 w-full shrink-0 flex flex-col items-center pt-0.5 pb-0.5">
                    <button
                      type="button"
                      onClick={handleStartDrinking}
                      className="group relative px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 hover:from-cyan-300 hover:via-sky-200 hover:to-blue-400 text-slate-950 font-bold text-xs sm:text-sm border-2 border-white shadow-[0_0_25px_rgba(56,189,248,0.85)] transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 select-none shrink-0"
                    >
                      <span className="text-lg animate-bounce">💧</span>
                      <span className="tracking-wide">立馬大口喝水搶救顏值 ➔</span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-950 animate-spin" />
                    </button>
                  </div>
                </div>
              ) : (
                /* STEP 2 & STEP 3: HYDRATION DRINKING ANIMATION & JAPANESE PURIKURA TRANSFORMATION */
                <div className="w-full h-full flex flex-col items-center justify-between p-3 sm:p-5 text-center bg-gradient-to-b from-[#06101a] via-[#040810] to-[#081524] relative overflow-hidden pointer-events-auto">
                  {/* Cyan / Water Ambient Glow */}
                  <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[100px] pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(6,182,212,0.08)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

                  {/* Corner Brackets */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-md pointer-events-none" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-md pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-md pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-md pointer-events-none" />

                  {/* STEP 2: REFINED SMART WATER FLASK (ONLY BOTTLE, NO EXTRA PERSON) */}
                  {waterStep === 'drinking' && (
                    <div className="w-full h-full flex-1 flex flex-col items-center justify-between animate-in fade-in duration-300 py-1 my-auto">
                      {/* Top Step Badge */}
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>💧 補水充填進行中 // HYDRATION_RECHARGE</span>
                      </div>

                      {/* Main Stage: High-Tech Smart Motivational Hydration Bottle Centered */}
                      <div className="flex items-center justify-center my-auto w-full">
                        <div className="relative w-44 h-60 sm:w-52 sm:h-72 flex items-center justify-center select-none shrink-0">
                          <svg className="w-full h-full drop-shadow-[0_0_35px_rgba(56,189,248,0.75)]" viewBox="0 0 120 160" fill="none">
                            {/* Bottle Cap with silicone loop handle */}
                            <path d="M48 6 C48 2 72 2 72 6 L72 16 L48 16 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                            <path d="M54 2 Q60 -3 66 2" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                            
                            {/* Spout Cap Collar */}
                            <rect x="42" y="16" width="36" height="10" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                            <rect x="56" y="18" width="8" height="6" rx="1.5" fill="#38bdf8" />

                            {/* Flask Main Outer Body (Sleek Frosted Gradient Contour) */}
                            <rect x="22" y="26" width="76" height="126" rx="18" fill="url(#flaskOuterGrad)" stroke="#38bdf8" strokeWidth="2.5" />

                            {/* Central Clear Measurement Gauge Window */}
                            <g clipPath="url(#flaskGaugeClip)">
                              {/* Background empty gauge */}
                              <rect x="34" y="32" width="52" height="114" rx="8" fill="#030712" />

                              {/* Liquid Fill Level (drains down as waterProgress goes from 0 to 100) */}
                              {(() => {
                                const drainY = 32 + (114 * waterProgress) / 100;
                                const liquidHeight = 114 - (114 * waterProgress) / 100;
                                return (
                                  <>
                                    {/* Main Liquid Column */}
                                    <rect
                                      x="34"
                                      y={drainY}
                                      width="52"
                                      height={liquidHeight}
                                      fill="url(#flaskLiquidGrad)"
                                      className="transition-all duration-150 ease-out"
                                    />

                                    {/* Wave Crest on top of liquid */}
                                    {waterProgress < 98 && (
                                      <path
                                        d={`M 34 ${drainY} Q 47 ${drainY - 4} 60 ${drainY} T 86 ${drainY} L 86 ${drainY + 6} L 34 ${drainY + 6} Z`}
                                        fill="#bae6fd"
                                        opacity="0.9"
                                      />
                                    )}

                                    {/* Rising Effervescent Micro Bubbles */}
                                    <circle cx="46" cy={drainY + 25} r="2" fill="#ffffff" opacity="0.85" className="animate-bubble-float" />
                                    <circle cx="68" cy={drainY + 45} r="1.8" fill="#ffffff" opacity="0.7" className="animate-bubble-float" style={{ animationDelay: '500ms' }} />
                                    <circle cx="56" cy={drainY + 65} r="2.4" fill="#ffffff" opacity="0.8" className="animate-bubble-float" style={{ animationDelay: '1000ms' }} />

                                    {/* Floating Ice Cubes */}
                                    <rect
                                      x="44"
                                      y={Math.max(34, drainY + 12)}
                                      width="14"
                                      height="14"
                                      rx="3"
                                      fill="rgba(255,255,255,0.75)"
                                      stroke="#bae6fd"
                                      strokeWidth="1"
                                      transform={`rotate(${20 + waterProgress * 0.4} 51 ${drainY + 19})`}
                                    />
                                    <rect
                                      x="62"
                                      y={Math.max(38, drainY + 28)}
                                      width="12"
                                      height="12"
                                      rx="2.5"
                                      fill="rgba(255,255,255,0.65)"
                                      stroke="#bae6fd"
                                      strokeWidth="1"
                                      transform={`rotate(${-15 - waterProgress * 0.3} 68 ${drainY + 34})`}
                                    />
                                  </>
                                );
                              })()}

                              {/* Measurement Ticks */}
                              <line x1="34" y1="48" x2="42" y2="48" stroke="#38bdf8" strokeWidth="1.5" />
                              <line x1="34" y1="72" x2="40" y2="72" stroke="#38bdf8" strokeWidth="1" opacity="0.8" />
                              <line x1="34" y1="96" x2="42" y2="96" stroke="#38bdf8" strokeWidth="1.5" />
                              <line x1="34" y1="120" x2="40" y2="120" stroke="#38bdf8" strokeWidth="1" opacity="0.8" />
                            </g>

                            {/* Flask Gauge Inner Border */}
                            <rect x="34" y="32" width="52" height="114" rx="8" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />

                            {/* Specular Curved Reflection on flask edge */}
                            <path d="M26 40 L26 138" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.25" />

                            {/* Clip Path Definition */}
                            <clipPath id="flaskGaugeClip">
                              <rect x="34" y="32" width="52" height="114" rx="8" />
                            </clipPath>

                            {/* Gradients */}
                            <defs>
                              <linearGradient id="flaskOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0c1a2e" />
                                <stop offset="50%" stopColor="#091424" />
                                <stop offset="100%" stopColor="#050a12" />
                              </linearGradient>
                              <linearGradient id="flaskLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="40%" stopColor="#0284c7" />
                                <stop offset="100%" stopColor="#0369a1" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>

                      {/* Bottom Real-time Telemetry Progress Bar */}
                      <div className="w-full max-w-md flex flex-col items-center gap-1.5 px-2 shrink-0">
                        <div className="w-full flex justify-between items-center text-xs font-mono">
                          <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            <span>細胞注水進度</span>
                          </span>
                          <span className="text-cyan-200 font-black text-sm">
                            {Math.round(waterProgress)}%
                          </span>
                        </div>

                        {/* Progress Bar with glowing tip */}
                        <div className="w-full bg-slate-900 rounded-full h-3 sm:h-3.5 border border-cyan-400/60 overflow-hidden relative shadow-inner p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 rounded-full transition-all duration-150 ease-linear shadow-[0_0_12px_#38bdf8]"
                            style={{ width: `${waterProgress}%` }}
                          />
                        </div>

                        <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 text-center">
                          ⚡ 溫水灌注細胞中... 血液濃稠度急降，深層喚醒水光好氣色
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: JAPANESE PURIKURA BEAUTY TRANSFORMATION & WITTY CARRY BUTTON */}
                  {waterStep === 'completed' && (
                    <div className="w-full h-full flex-1 flex flex-col items-center justify-between animate-in zoom-in-95 duration-500 gap-2 py-1 my-auto">
                      {/* Top Banner with Celebratory Text */}
                      <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-cyan-950/90 border border-cyan-300 text-cyan-200 text-xs sm:text-sm font-mono font-black shadow-[0_0_20px_rgba(56,189,248,0.5)] shrink-0">
                        <Sparkles className="w-4 h-4 text-cyan-300 animate-spin shrink-0" />
                        <span>✨ 補水完成！細胞水分充盈，專注力全面復甦！✨</span>
                      </div>

                      {/* 🌸 Transformed Japanese Purikura Beauty Photo Frame with Refined Cool-Toned Bling Bling & Anime Eyes */}
                      <div className="relative w-full max-w-lg aspect-[4/3] max-h-[46vh] rounded-2xl overflow-hidden border-2 border-cyan-300 shadow-[0_0_45px_rgba(56,189,248,0.85)] bg-black group my-auto">
                        {/* Japanese Purikura Filter Photo with Cold-Tone Porcelain Grade & Rosy Complexion */}
                        <TacticalMemeImage
                          src={alert.image || '/memes/idol-handsome-1.jpg'}
                          fallbackUrls={['/memes/idol-beauty-1.jpg']}
                          category="general"
                          faceCenter={alert.faceCenter || { x: 50, y: 35 }}
                          eyePositions={alert.eyePositions}
                          showAnimeEyes={true}
                          eyeFilterMode="auto"
                          alt="日系冷調水光拍貼"
                          className="w-full h-full object-cover transition-all duration-700 filter brightness-112 contrast-102 saturate-108 drop-shadow-[0_0_35px_rgba(56,189,248,0.75)]"
                        />

                        {/* Cool Porcelain Glow & Complexion Preservation Overlays (清冷透亮水光層，保留紅潤好氣色) */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/14 via-sky-300/8 to-indigo-400/12 pointer-events-none z-10 mix-blend-soft-light" />

                        {/* REFINED BLING-BLING SYSTEM: PRECISION SVG SPARKLES & CONSTELLATIONS (COOL ICE PALETTE) */}
                        {/* 1. Left Cheekbone Sparkle (蘋果肌水光高光) */}
                        <div className="absolute top-[46%] left-[26%] pointer-events-none z-30">
                          <SparkleVector size={24} color="#e0f2fe" className="animate-bling-twinkle" />
                        </div>

                        {/* 2. Right Cheekbone Sparkle (蘋果肌水光高光) */}
                        <div className="absolute top-[46%] right-[26%] pointer-events-none z-30">
                          <SparkleVector size={24} color="#bae6fd" className="animate-bling-twinkle" style={{ animationDelay: '600ms' }} />
                        </div>

                        {/* 3. T-Zone / Forehead Starburst (立體高光) */}
                        <div className="absolute top-[22%] left-[48%] -translate-x-1/2 pointer-events-none z-30">
                          <StarburstVector size={26} color="#ffffff" className="animate-bling-twinkle" style={{ animationDelay: '1200ms' }} />
                        </div>

                        {/* 4. Top-Right Constellation of Mini Stars */}
                        <div className="absolute top-4 right-4 pointer-events-none z-30 flex items-center gap-1.5">
                          <span className="text-xs text-cyan-300 animate-pulse">💎</span>
                          <SparkleVector size={12} color="#ffffff" className="animate-bling-twinkle" style={{ animationDelay: '700ms' }} />
                          <SparkleVector size={18} color="#38bdf8" className="animate-bling-twinkle" style={{ animationDelay: '1400ms' }} />
                        </div>
                      </div>

                      {/* Return to Workspace Button */}
                      <button
                        type="button"
                        onClick={() => onDismissRef.current()}
                        className="group relative px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 hover:from-cyan-300 hover:via-sky-200 hover:to-emerald-300 text-slate-950 font-bold text-xs sm:text-sm border-2 border-white shadow-[0_0_30px_rgba(56,189,248,0.75)] transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 select-none shrink-0"
                      >
                        <span className="text-lg">💧</span>
                        <span className="tracking-wide">水分補給完成！帶着滿滿能量回工位 ➔</span>
                        <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
                      </button>

                      {/* Status Line - smaller and positioned below button */}
                      <div className="text-center font-mono shrink-0 mt-1">
                        <p className="text-[10px] sm:text-[11px] text-emerald-300/90 font-normal tracking-wide">
                          ⚡ 水分充填 100%！修復活力全面灌注，健康資產 +5 BP 摸魚紅利已入帳
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : alert.type === 'overtime' ? (
              /* ─── OVERTIME TAKEOVER: BOSS'S SUPERCAR CROWDFUNDING ─── */
              <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 text-center bg-gradient-to-b from-[#1a0505] via-[#090202] to-[#120303] relative overflow-hidden pointer-events-auto">
                <style>{`
                  @keyframes owCarVibrate {
                    0%, 100% { transform: translateY(0) scale(1); }
                    10% { transform: translateY(-3.5px) scale(1.03) rotate(-0.8deg); }
                    30% { transform: translateY(1.5px) scale(0.98) rotate(0.8deg); }
                    50% { transform: translateY(-1.5px) scale(1.015) rotate(-0.4deg); }
                    70% { transform: translateY(2.5px) scale(0.995) rotate(0.4deg); }
                    90% { transform: translateY(-0.5px) scale(1.005) rotate(-0.1deg); }
                  }
                  @keyframes owMoneyFlyToCar {
                    0% { 
                      transform: translate(0, 40px) scale(0.1) rotate(-45deg); 
                      opacity: 0; 
                      filter: brightness(1.5) drop-shadow(0 0 0px transparent);
                    }
                    15% { 
                      transform: translate(calc(var(--tx) * 0.15), calc(var(--ty) * 0.25 - 15px)) scale(1.35) rotate(15deg); 
                      opacity: 1; 
                      filter: brightness(1.2) drop-shadow(0 0 12px rgba(251,191,36,0.95));
                    }
                    45% { 
                      transform: translate(calc(var(--tx) * 0.55), calc(var(--ty) * 0.65 - 8px)) scale(1.15) rotate(-15deg); 
                      opacity: 1; 
                      filter: brightness(1.1) drop-shadow(0 0 16px rgba(52,211,153,0.95));
                    }
                    100% { 
                      transform: translate(var(--tx), var(--ty)) scale(0.4) rotate(var(--rot)); 
                      opacity: 0; 
                      filter: brightness(0.8) drop-shadow(0 0 0px transparent);
                    }
                  }
                  @keyframes owUpgradeFlash {
                    0% { transform: scale(0.7); opacity: 0; filter: blur(15px); }
                    15% { transform: scale(1); opacity: 1; filter: blur(0); }
                    100% { transform: scale(1); opacity: 1; filter: blur(0); }
                  }
                  @keyframes owConfettiBlast {
                    0% { transform: translate(-50%, -50%) scale(0.1) rotate(0deg); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(2.2) rotate(360deg); opacity: 0; }
                  }
                  @keyframes owSpinArrival {
                    0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                    60% { transform: scale(1.2) rotate(15deg); opacity: 0.95; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                  }
                  .animate-car-shake {
                    animation: owCarVibrate 0.32s cubic-bezier(0.25, 1, 0.5, 1);
                  }
                  .animate-upgrade-banner {
                    animation: owUpgradeFlash 1.8s cubic-bezier(0.19, 1, 0.22, 1) both;
                  }
                  .animate-confetti-blast {
                    animation: owConfettiBlast 1.8s cubic-bezier(0.1, 0.8, 0.3, 1) both;
                  }
                  .animate-spin-arrival {
                    animation: owSpinArrival 1.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
                  }
                  @keyframes toyotaDriveAway {
                    0% {
                      transform: translateX(-350px);
                    }
                    20% {
                      transform: translateX(0px);
                    }
                    60% {
                      transform: translateX(0px);
                    }
                    100% {
                      transform: translateX(650px);
                    }
                  }
                  @keyframes toyotaIdleShake {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-2px); }
                  }
                  .animate-toyota-drive {
                    animation: toyotaDriveAway 2.5s cubic-bezier(0.45, 0, 0.55, 1) forwards;
                  }
                  .animate-toyota-shake {
                    animation: toyotaIdleShake 0.08s infinite;
                  }
                `}</style>
                
                {/* Subtle cyber grid and red ambient aura */}
                <div className="absolute w-[450px] h-[450px] rounded-full bg-red-600/10 blur-[100px] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(rgba(239,68,68,0.05)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-50" />

                {/* Dashboard Main Box */}
                <div className="relative w-full max-w-lg bg-[#0d0404]/95 border-0 rounded-2xl p-3 sm:p-4 flex flex-col items-center z-30 pointer-events-auto backdrop-blur-xl my-auto">
                  
                  {/* Dynamic Active Car Calculation */}
                  {(() => {
                    const activeCar = CAR_LIST[currentCarIndex] || CAR_LIST[0];
                    const currentFund = Math.min(activeCar.price, currentCarFunded + sessionFundAdded);
                    const progressPercent = (currentFund / activeCar.price) * 100;

                    return (
                      <>
                        <h2 className="text-base sm:text-lg font-black text-white font-mono tracking-wide mb-0.5">
                          老闆的 999+ 屆跑車圓夢計畫 🏎️
                        </h2>
                        <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono max-w-sm mb-2.5 leading-snug">
                          當前目標：{activeCar.name}
                        </p>

                        {/* CENTRAL CONTAINER: Interactive Supercar Visual & Live Progress */}
                        <div className="w-full bg-transparent p-3 mb-2.5 flex flex-col items-center justify-center relative overflow-hidden">
                          
                          {/* Live Progress Header */}
                          <div className="w-full flex justify-between items-baseline mb-1 font-mono">
                            <span className="text-[9px] text-zinc-400 font-bold tracking-wider">
                              💰 累計資金: ${Math.floor(currentFund).toLocaleString()} / ${activeCar.price.toLocaleString()} USD
                            </span>
                            <span className="text-base sm:text-lg font-black tracking-wider" style={{ color: activeCar.color }}>
                              {progressPercent.toFixed(1)}%
                            </span>
                          </div>

                          {/* Crowdfunding progress bar */}
                          <div className="w-full bg-zinc-950 rounded-full h-2 border border-zinc-800 overflow-hidden p-0.5 mb-2.5 shadow-inner">
                            <div
                              className="h-full rounded-full transition-all duration-300 ease-out"
                              style={{ 
                                width: `${progressPercent}%`,
                                backgroundColor: activeCar.color,
                                boxShadow: `0 0 8px ${activeCar.glow}`
                              }}
                            />
                          </div>

                          {/* VEHICLE VISUAL WITH SPINNING WHEELS & GLOWS */}
                          <div className="relative w-full h-36 flex items-center justify-center my-0.5 select-none">
                            {/* Neon Underglow Bar */}
                            <div 
                              className="absolute w-64 h-2.5 rounded-full blur-[8px] opacity-80 animate-pulse" 
                              style={{ 
                                backgroundColor: activeCar.color, 
                                bottom: '16px',
                                boxShadow: `0 0 15px ${activeCar.glow}` 
                              }} 
                            />

                            {/* UPGRADE CELEBRATION FLASH OVERLAY */}
                            {isUpgradingCar && (
                              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
                                {/* Radial Burst backdrop */}
                                <div className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-yellow-400 via-amber-500 to-red-500 opacity-25 blur-xl animate-pulse animate-in fade-in" />
                                {/* Rotating Confetti Blast Ring */}
                                <div className="absolute top-1/2 left-1/2 w-96 h-96 border-2 border-dashed border-yellow-400/30 rounded-full animate-confetti-blast" />
                                <div className="absolute top-1/2 left-1/2 w-64 h-64 border border-dotted border-amber-300/40 rounded-full animate-confetti-blast" style={{ animationDelay: '200ms' }} />
                                
                                {/* Sparkling Emoji Rain */}
                                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4 text-3xl animate-bounce">
                                  <span>🎉</span>
                                  <span>🏎️</span>
                                  <span>👑</span>
                                  <span>🔥</span>
                                  <span>✨</span>
                                </div>

                                {/* Floating Banner Content */}
                                <div className="animate-upgrade-banner bg-black/95 border-2 border-yellow-400 rounded-xl px-4 py-2 text-center shadow-[0_0_40px_rgba(245,158,11,0.85)] z-50 max-w-[90%] transform -translate-y-4">
                                  <div className="text-[10px] font-bold font-mono tracking-widest text-yellow-400 uppercase mb-0.5 animate-pulse">
                                    🌟 SUPERCAR UNLOCKED! // 圓夢升級 🌟
                                  </div>
                                  <div className="text-sm font-black text-white font-mono drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] truncate">
                                    {upgradedCarName}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Exquisite TOYOTA Vector SVG Transformation Scene */}
                            {isEscapingWithToyota && (
                              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-3 bg-[#02050b]/98 rounded-2xl border-2 border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.95)] animate-fade-in font-mono">
                                <svg
                                  className="w-full h-56 sm:h-64 select-none"
                                  viewBox="0 0 320 180"
                                  fill="none"
                                >
                                  <defs>
                                    <linearGradient id="toyotaBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#e2e8f0" />
                                      <stop offset="50%" stopColor="#94a3b8" />
                                      <stop offset="100%" stopColor="#475569" />
                                    </linearGradient>
                                    <linearGradient id="toyotaGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.3" />
                                    </linearGradient>
                                    <radialGradient id="toyotaGlow" cx="50%" cy="50%" r="50%">
                                      <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.6" />
                                      <stop offset="100%" stopColor="#64748b" stopOpacity="0" />
                                    </radialGradient>
                                  </defs>

                                  {/* Ambient Emerald Ground Light & Shadow */}
                                  <ellipse cx="160" cy="150" rx="120" ry="12" fill="url(#toyotaGlow)" />
                                  <ellipse cx="160" cy="152" rx="100" ry="6" fill="rgba(0,0,0,0.8)" />

                                  {/* Comic Poof Cloud Particles behind Transformation */}
                                  <g className="animate-ping" opacity="0.3">
                                    <circle cx="80" cy="110" r="18" fill="#94a3b8" />
                                    <circle cx="240" cy="105" r="22" fill="#cbd5e1" />
                                    <circle cx="160" cy="70" r="26" fill="#e2e8f0" />
                                  </g>

                                  {/* Indestructible 神車 TOYOTA Vehicle SVG Structure with Left-to-Right Drive & Shake */}
                                  <g className="animate-toyota-drive" style={{ transformOrigin: '160px 115px' }}>
                                    <g className="animate-toyota-shake">
                                      {/* TOYOTA Main Metallic Sedan Body */}
                                      <path
                                        d="M 30,132 L 45,100 L 105,75 Q 160,70 215,85 L 285,105 L 295,132 Z"
                                        fill="url(#toyotaBodyGrad)"
                                        stroke="#94a3b8"
                                        strokeWidth="1.5"
                                      />

                                      {/* Mismatched Primer-Colored Fender Panel */}
                                      <path
                                        d="M 32,132 L 45,100 L 68,96 L 62,132 Z"
                                        fill="#334155"
                                        stroke="#475569"
                                        strokeWidth="0.8"
                                        opacity="0.85"
                                      />

                                      {/* Cabin Windshield & Windows */}
                                      <path
                                        d="M 100,78 L 145,62 Q 185,62 210,75 L 200,95 L 90,95 Z"
                                        fill="url(#toyotaGlassGrad)"
                                        stroke="#cbd5e1"
                                        strokeWidth="1"
                                      />

                                      {/* Cracked Glass Line on Windshield */}
                                      <path
                                        d="M 115,74 L 125,82 L 120,86 L 128,91"
                                        stroke="#f1f5f9"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        opacity="0.9"
                                      />

                                      {/* DoorSeams & Chrome Handle */}
                                      <path d="M 150,85 L 150,132" stroke="#475569" strokeWidth="1.5" />
                                      <rect x="160" y="98" width="12" height="3" rx="1" fill="#f8fafc" />

                                      {/* Beaten-Up Rust Spots */}
                                      <ellipse cx="90" cy="120" rx="4" ry="2" fill="#7c2d12" opacity="0.8" />
                                      <ellipse cx="145" cy="126" rx="5" ry="1.5" fill="#7c2d12" opacity="0.8" />
                                      <ellipse cx="210" cy="122" rx="3" ry="1" fill="#9a3412" opacity="0.9" />

                                      {/* X-Shaped Yellow Duct Tape Patch on Rear Door */}
                                      <g stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
                                        <line x1="175" y1="102" x2="195" y2="118" />
                                        <line x1="195" y1="102" x2="175" y2="118" />
                                      </g>

                                      {/* TOYOTA Front Grille & Oval Badge */}
                                      <path d="M 270,110 L 293,112 L 292,126 L 268,124 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                                      <ellipse cx="282" cy="117" rx="5" ry="3.5" fill="#f8fafc" stroke="#0284c7" strokeWidth="0.8" />
                                      <ellipse cx="282" cy="117" rx="3" ry="2" fill="none" stroke="#0f172a" strokeWidth="0.6" />

                                      {/* Bright LED Headlight & Light Beam Overlay (Slightly Dimmer Yellow for Old Bulb) */}
                                      <polygon points="280,105 318,95 320,135 282,122" fill="#fef08a" opacity="0.25" />
                                      <path d="M 275,106 L 292,107 L 290,116 L 273,114 Z" fill="#fef08a" stroke="#fde047" strokeWidth="1" />

                                      {/* High-Mileage Beater Exhaust Smoke Puffs (Slightly darker blue-grey oil smoke) */}
                                      <g className="animate-pulse">
                                        <circle cx="15" cy="130" r="7" fill="rgba(148,163,184,0.6)" />
                                        <circle cx="7" cy="125" r="10" fill="rgba(100,116,139,0.4)" />
                                        <circle cx="0" cy="118" r="13" fill="rgba(71,85,105,0.2)" />
                                      </g>

                                      {/* Spinning Alloy Wheels (Rear & Front) */}
                                      <g transform="translate(75, 132)">
                                        <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                                        <circle cx="0" cy="0" r="12" fill="#94a3b8" />
                                        <g className="animate-spin" style={{ animationDuration: '0.4s' }}>
                                          <line x1="-10" y1="0" x2="10" y2="0" stroke="#f8fafc" strokeWidth="2" />
                                          <line x1="0" y1="-10" x2="0" y2="10" stroke="#f8fafc" strokeWidth="2" />
                                        </g>
                                        <circle cx="0" cy="0" r="4" fill="#0f172a" />
                                      </g>

                                      <g transform="translate(235, 132)">
                                        <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                                        <circle cx="0" cy="0" r="12" fill="#94a3b8" />
                                        <g className="animate-spin" style={{ animationDuration: '0.4s' }}>
                                          <line x1="-10" y1="0" x2="10" y2="0" stroke="#f8fafc" strokeWidth="2" />
                                          <line x1="0" y1="-10" x2="0" y2="10" stroke="#f8fafc" strokeWidth="2" strokeOpacity="0.8" />
                                        </g>
                                        <circle cx="0" cy="0" r="4" fill="#0f172a" />
                                      </g>
                                    </g>
                                  </g>

                                  {/* Static Flying Text Overlay inside SVG Canvas */}
                                  <text
                                    x="160"
                                    y="38"
                                    textAnchor="middle"
                                    fill="#fef08a"
                                    fontSize="18"
                                    fontWeight="900"
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))' }}
                                  >
                                    🚗 抱歉了老闆 我先開我的TOYOTA走了
                                  </text>
                                </svg>
                              </div>
                            )}

                            {/* Render Boss Supercar ONLY when not escaping with TOYOTA */}
                            {!isEscapingWithToyota && (
                              <svg
                                key={`${woodenFishClicks}-${isUpgradingCar}`}
                                className={`w-64 h-32 select-none pointer-events-none ${
                                  isUpgradingCar ? 'animate-spin-arrival' : woodenFishClicks > 0 ? 'animate-car-shake' : ''
                                }`}
                                style={{ filter: `drop-shadow(0 0 20px ${activeCar.glow})` }}
                                viewBox="0 0 200 100"
                                fill="none"
                              >
                              {/* Soft Shadow underneath car */}
                              <ellipse cx="100" cy="85" rx="78" ry="5.5" fill="rgba(0,0,0,0.65)" />

                              {/* Carbon Fiber Wing / Rear Spoiler */}
                              <g>
                                {/* Wing supports */}
                                <line x1="20" y1="46" x2="16" y2="35" stroke="#1e293b" strokeWidth="2" />
                                <line x1="28" y1="45" x2="26" y2="35" stroke="#1e293b" strokeWidth="2" />
                                {/* Main wing blade */}
                                <path d="M10 35 L42 35 L38 31 L6 31 Z" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                                {/* Endplates */}
                                <path d="M5 36 L11 36 L11 29 L5 29 Z" fill="#dc2626" />
                              </g>

                              {/* Sleek Car Body Structure - Layered Metallic Finish */}
                              <path
                                d="M15 70 L25 46 Q50 32 95 32 Q142 32 172 48 L190 68 L190 80 L15 80 Z"
                                fill={activeCar.color}
                                stroke="#ffffff"
                                strokeWidth="0.5"
                                strokeOpacity="0.25"
                              />

                              {/* Metallic Reflection Curves & Body Seams (Side scoop & door line) */}
                              <path d="M25 46 L75 42 L80 34 L32 40 Z" fill="#1e293b" opacity="0.35" />
                              <path d="M120 34 L172 48 L140 50 Z" fill="#1e293b" opacity="0.35" />
                              
                              {/* Aerodynamic Door Line Seam */}
                              <path d="M85 40 L85 75" stroke="#000000" strokeWidth="1" opacity="0.45" />
                              <path d="M85 40 L125 44" stroke="#000000" strokeWidth="1" opacity="0.45" />
                              
                              {/* Side Air Intake Scoop */}
                              <path d="M62 60 Q72 60 76 66 L60 66 Z" fill="#090d16" stroke="#475569" strokeWidth="0.8" opacity="0.9" />

                              {/* Cabin Glass Windshield (Gradient look) */}
                              <path d="M55 40 L98 40 L125 48 L55 48 Z" fill="#0f172a" opacity="0.95" />
                              <path d="M60 41 L92 41 L108 46 L60 46 Z" fill="#38bdf8" opacity="0.25" />
                              
                              {/* Bright Xenon Headlight Lens & LED DRL strip */}
                              <polygon points="185,58 200,52 200,68 185,62" fill="url(#headlightGlowGrad)" opacity={woodenFishClicks > 0 ? "0.9" : "0.45"} />
                              <path d="M180 58 Q188 56 188 64 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
                              <circle cx="185" cy="59" r="2.5" fill="#fef08a" className="animate-pulse" />

                              {/* Exhaust Twin Pipe Flames/Sparks (Fires dynamically on clicks) */}
                              {woodenFishClicks > 0 && (
                                <g className="animate-pulse">
                                  <path d="M15 74 L2 71 L10 75 L1 76 L8 78 Z" fill="url(#exhaustFlameGrad)" />
                                  <circle cx="1" cy="75" r="1.5" fill="#fbbf24" />
                                  <circle cx="4" cy="72" r="1" fill="#ef4444" />
                                </g>
                              )}

                              {/* Wheels with High-Fidelity Alloy Spokes & Red Calipers */}
                              <g>
                                {/* REAR WHEEL */}
                                <circle cx="50" cy="76" r="14" fill="#090d16" stroke="#475569" strokeWidth="2.5" />
                                <circle cx="50" cy="76" r="11" fill="#1e293b" />
                                
                                {/* Red Brake Caliper */}
                                <path d="M39 69 A11 11 0 0 1 48 66 L48 72 Z" fill="#ef4444" opacity="0.95" />
                                
                                {/* Alloy spokes spinning */}
                                <g className="animate-spin" style={{ transformOrigin: '50px 76px', animationDuration: '0.6s' }}>
                                  <line x1="50" y1="76" x2="50" y2="62" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
                                  <line x1="50" y1="76" x2="62" y2="83" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                                  <line x1="50" y1="76" x2="38" y2="83" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                                  <line x1="50" y1="76" x2="41" y2="69" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
                                  <line x1="50" y1="76" x2="59" y2="69" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
                                </g>
                                <circle cx="50" cy="76" r="4.5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />

                                {/* FRONT WHEEL */}
                                <circle cx="145" cy="76" r="14" fill="#090d16" stroke="#475569" strokeWidth="2.5" />
                                <circle cx="145" cy="76" r="11" fill="#1e293b" />
                                
                                {/* Red Brake Caliper */}
                                <path d="M134 69 A11 11 0 0 1 143 66 L143 72 Z" fill="#ef4444" opacity="0.95" />
                                
                                {/* Alloy spokes spinning */}
                                <g className="animate-spin" style={{ transformOrigin: '145px 76px', animationDuration: '0.6s' }}>
                                  <line x1="145" y1="76" x2="145" y2="62" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
                                  <line x1="145" y1="76" x2="157" y2="83" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                                  <line x1="145" y1="76" x2="133" y2="83" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                                  <line x1="145" y1="76" x2="136" y2="69" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
                                  <line x1="145" y1="76" x2="154" y2="69" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
                                </g>
                                <circle cx="145" cy="76" r="4.5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                              </g>

                              {/* SVG Gradient Defs */}
                              <defs>
                                <linearGradient id="headlightGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                                  <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="exhaustFlameGrad" x1="100%" y1="50%" x2="0%" y2="50%">
                                  <stop offset="0%" stopColor="#ef4444" />
                                  <stop offset="50%" stopColor="#f97316" />
                                  <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                            </svg>
                          )}

                            {/* Flying Coins / Money Container Overlay */}
                            {floatingTexts.map((part) => (
                              <div
                                key={part.id}
                                className="absolute pointer-events-none text-xs sm:text-sm font-black z-30 font-mono whitespace-nowrap text-amber-300 bg-gradient-to-r from-yellow-500/90 via-amber-600/95 to-emerald-600/90 border border-yellow-300/40 px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.7)]"
                                style={{
                                  left: '50%',
                                  bottom: '10px',
                                  '--tx': `${part.left}px`,
                                  '--ty': `${part.top}px`,
                                  '--rot': `${(Math.random() - 0.5) * 40}deg`,
                                  animation: 'owMoneyFlyToCar 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                                } as React.CSSProperties}
                              >
                                <span className="text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">{part.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* CONDITIONAL ACTION BUTTONS */}
                        {!isEscapingWithToyota && (
                          <div className={`w-full mt-4 ${woodenFishClicks > 0 ? 'flex justify-center w-full' : 'grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'}`}>
                            {/* OPTION A: Escape to freedom (+20 HP!) */}
                            {!isCompletingFund && woodenFishClicks === 0 && (
                              <button
                                type="button"
                                disabled={isEscapingWithToyota || isCompletingFund}
                                onClick={() => {
                                  if (isEscapingWithToyota) return;
                                  setIsEscapingWithToyota(true);

                                  try {
                                    soundSynth.playRewardJingle();
                                    soundSynth.playOracleReveal();
                                  } catch {}

                                  setFloatingTexts((prev) => [
                                    ...prev,
                                    { id: Date.now() + 1, text: '💥 老闆超跑不見了！', left: -50, top: -110 },
                                    { id: Date.now() + 2, text: '🚗 已為您換購神車 TOYOTA！', left: 40, top: -130 },
                                    { id: Date.now() + 3, text: '🎉 健康存摺 +20 BP！', left: 0, top: -150 },
                                  ]);

                                  setTimeout(() => {
                                    const finalFund = currentCarFunded + sessionFundAdded;
                                    localStorage.setItem('ow_current_car_funded_v3', String(finalFund));
                                    setWoodenFishClicks(0);
                                    setSessionFundAdded(0);
                                    setIsEscapingWithToyota(false);

                                    if (onEscapeOvertimeRef.current) {
                                      onEscapeOvertimeRef.current(true); // ranAway = true (adds +20 HP!)
                                    }
                                    onDismissRef.current();
                                  }, 2500);
                                }}
                                className="group relative w-full px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 select-none disabled:opacity-50"
                              >
                                <span className="text-xs">🚗</span>
                                <span className="tracking-wide">🚗 打卡下班</span>
                              </button>
                            )}

                            {/* OPTION B: Submit to capitalism (Tap to fund, lingers briefly on 10th tap before dismiss) */}
                            <button
                              type="button"
                              disabled={isCompletingFund}
                              onClick={() => {
                                if (isCompletingFund) return;
                                const nextClicks = woodenFishClicks + 1;
                                
                                // Variable funding percentage per click: between 1.5% and 3.5%
                                const pct = 1.5 + Math.random() * 2.0;
                                const deltaAmount = Math.max(100, Math.floor((pct / 100) * activeCar.price));
                                const totalFund = currentCarFunded + sessionFundAdded + deltaAmount;
                                
                                let isUpgraded = false;
                                let updatedSessionFundAdded = sessionFundAdded + deltaAmount;

                                if (totalFund >= activeCar.price) {
                                  // Instantly upgrade to next car!
                                  isUpgraded = true;
                                  const nextCarIdx = (currentCarIndex + 1) % CAR_LIST.length;
                                  const overflow = totalFund - activeCar.price;
                                  localStorage.setItem('ow_current_car_index_v3', String(nextCarIdx));
                                  localStorage.setItem('ow_current_car_funded_v3', String(overflow));
                                  setCurrentCarIndex(nextCarIdx);
                                  setCurrentCarFunded(overflow);
                                  setSessionFundAdded(0);
                                  updatedSessionFundAdded = 0;

                                  // Trigger spectacular upgrade effects
                                  setIsUpgradingCar(true);
                                  setUpgradedCarName(CAR_LIST[nextCarIdx].name);
                                  try {
                                    soundSynth.playRewardJingle();
                                    soundSynth.playOracleReveal();
                                  } catch {}
                                  
                                  // Reset upgrading flag after 1.8 seconds
                                  setTimeout(() => {
                                    setIsUpgradingCar(false);
                                  }, 1800);
                                } else {
                                  setSessionFundAdded(updatedSessionFundAdded);
                                }

                                // Generate flying coins coordinates up to the car
                                const distanceX = (Math.random() - 0.5) * 160;
                                const distanceY = -90 - Math.random() * 50;
                                const currencyEmojis = ['🪙', '💵', '💸', '🏎️', '🔥', '✨'];
                                const selectedEmoji = currencyEmojis[Math.floor(Math.random() * currencyEmojis.length)];
                                const text = `+$${deltaAmount.toLocaleString()} ${selectedEmoji}`;
                                
                                const newPart = {
                                  id: Date.now() + Math.random(),
                                  text,
                                  left: distanceX,
                                  top: distanceY,
                                };
                                setFloatingTexts((prev) => [...prev, newPart]);

                                if (nextClicks >= 10) {
                                  setWoodenFishClicks(10);
                                  setIsCompletingFund(true);

                                  try {
                                    soundSynth.playRewardJingle();
                                  } catch {}

                                  // Spawn extra celebration bursts
                                  setTimeout(() => {
                                    setFloatingTexts((prev) => [
                                      ...prev,
                                      { id: Date.now() + 1, text: '🎉 感謝奉獻！', left: -40, top: -110 },
                                      { id: Date.now() + 2, text: '🏎️ 圓夢基金 +1', left: 40, top: -120 },
                                    ]);
                                  }, 300);

                                  // Linger for 5.0 seconds if upgraded (so user sees gold card), or 1.8 seconds normally
                                  setTimeout(() => {
                                    if (!isUpgraded) {
                                      const finalFund = currentCarFunded + updatedSessionFundAdded;
                                      localStorage.setItem('ow_current_car_funded_v3', String(finalFund));
                                      setCurrentCarFunded(finalFund);
                                    }
                                    setWoodenFishClicks(0);
                                    setSessionFundAdded(0);
                                    setIsCompletingFund(false);

                                    if (onEscapeOvertimeRef.current) {
                                      onEscapeOvertimeRef.current(false); // ranAway = false (unpaid overtime continues)
                                    }
                                    onDismissRef.current();
                                  }, 1800);
                                } else {
                                  setWoodenFishClicks(nextClicks);
                                  try {
                                    soundSynth.playBlinkChime();
                                  } catch {}
                                }
                              }}
                              className={`group relative w-full px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs transition flex items-center justify-center gap-1 select-none border border-red-500/40 ${
                                isCompletingFund
                                  ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(234,179,8,0.7)] animate-pulse'
                                  : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(239,68,68,0.35)]'
                              }`}
                            >
                              <span>{isCompletingFund ? '🏎️' : '🙇‍♂️'}</span>
                              <span>
                                {isCompletingFund
                                  ? '老闆感謝你的肝！🎉'
                                  : `灌注跑車基金 (${woodenFishClicks}/10)`}
                              </span>
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}

                </div>
              </div>
            ) : (
              /* 3. DEFAULT MEME DISPLAY (e.g. Yawn Idol Eye Purification Photos) */
              <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center p-1">
                <TacticalMemeImage
                  src={theme.memeImage || USER_PROVIDED_YAWN_IMAGES[0]}
                  fallbackUrls={theme.fallbackImages}
                  category={theme.category}
                  alt={theme.memeCaption}
                  className="w-full h-full max-w-full max-h-full object-contain object-center"
                />

                {/* Meme Top Text */}
                <div className="absolute top-3 sm:top-4 inset-x-2 text-center pointer-events-none z-10 px-2 sm:px-4">
                  <span
                    className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black leading-snug tracking-wide text-white block max-w-3xl mx-auto drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]"
                    style={{
                      textShadow:
                        '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 8px rgba(0,0,0,0.95)',
                    }}
                  >
                    {theme.topText}
                  </span>
                </div>

                {/* Meme Bottom Text */}
                <div className="absolute bottom-10 sm:bottom-12 md:bottom-14 inset-x-2 text-center pointer-events-none z-10 px-2 sm:px-4">
                  <span
                    className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-wide text-yellow-300 block max-w-3xl mx-auto drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]"
                    style={{
                      textShadow:
                        '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 8px rgba(0,0,0,0.95)',
                    }}
                  >
                    {theme.bottomText}
                  </span>
                </div>

                {/* Progress Bar Strip: Unified 7 seconds, single row with seconds on the right */}
                <div className="absolute bottom-0 inset-x-0 bg-[#0a0c10]/90 backdrop-blur-md px-3.5 py-2 border-t border-white/10 z-10">
                  <div className="flex items-center gap-3 w-full">
                    {/* Visual Progress Bar Track */}
                    <div className="flex-1 h-1.5 sm:h-2 bg-slate-900/90 rounded-full overflow-hidden p-[1px] border border-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-amber-300 shadow-[0_0_10px_rgba(244,114,182,0.4)] transition-all duration-75 ease-linear"
                        style={{
                          width: `${Math.min(100, Math.max(0, (yawnElapsedSeconds / 7) * 100))}%`,
                        }}
                      />
                    </div>

                    {/* Seconds text on the right, subtle & inline */}
                    <span className="text-zinc-400 font-mono text-xs tabular-nums select-none shrink-0">
                      {yawnRemainingSeconds}s
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[#00d8ff] font-bold">[OVERWATCH // BIOSURVEILLANCE]</span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400 text-[9px] sm:text-[10px]">MONITORING</span>
        </div>
      </footer>
    </div>
  );
};
