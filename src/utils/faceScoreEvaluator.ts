import { FaceCharismaScore } from '../types';

export interface FaceEvaluationRawInputs {
  smile: number; // 0 ~ 1 (嘴型弧度 / 嘴角上揚程度)
  browRelaxation: number; // 0 ~ 1 (1 = 眉頭舒展, 0 = 緊鎖眉頭)
  eyeOpenness: number; // 0 ~ 1 (1 = 雙眼晶亮睜大, 0 = 睜眼弧度低/眼皮沉重)
  isFacePresent: boolean;
  proximityPct: number;
  // Fatigue & Behavioral Statistics
  yawnsCount?: number; // 累積打哈欠次數
  frownsCount?: number; // 累積眉頭深鎖次數
  blinksCount?: number; // 視覺疲勞/頻繁眨眼次數
  consecutiveDeskMinutes?: number; // 工位久坐分鐘數
  healthScore?: number; // 目前健康分數 (0~120)
}

const TITLES_AND_COMMENTS = [
  {
    minScore: 88,
    rank: 'SSS' as const,
    title: 'K-POP 滿血社畜神顏 🌸',
    tag: 'MAX_DOPAMINE_CENTER',
    comments: [
      '嘴角弧度完美上揚、雙眼晶亮透澈！零班味且能量滿載，如同韓團 C 位！',
      '無懈可擊的元氣光彩！眉頭舒展且神采飛揚，整個辦公室都因你而放晴！',
      '活力爆擊！嘴角微笑弧度極佳，完全是工位上的靈魂發光體！',
    ],
  },
  {
    minScore: 75,
    rank: 'SS' as const,
    title: '高智感元氣職場高光 ✨',
    tag: 'METAVERSE_MODEL',
    comments: [
      '嘴型帶有些許微笑弧度，雙眼炯炯有神！沉穩自信中帶有強烈感染力！',
      '專注度與神采完美平衡，眼神電力足夠，散發幹練菁英氣場！',
      '光彩煥發！即便在寫程式改簡報，依然維持極佳的社畜氣色！',
    ],
  },
  {
    minScore: 58,
    rank: 'S' as const,
    title: '標準工位專注姿態 💼',
    tag: 'STABLE_WORKER',
    comments: [
      '狀態平穩專注，表情略為平淡無笑意，雖有殘存班味但展現可靠態度！',
      '面部表情略顯嚴肅，建議嘴角上揚並多喝口水，顏值將即刻飆升！',
      '沉穩專注於螢幕前，深呼吸放鬆眉頭能讓你氣場大幅提振！',
    ],
  },
  {
    minScore: 42,
    rank: 'B' as const,
    title: '班味重度超載 // 靈魂輕度飄離 😮‍💨',
    tag: 'FATIGUE_OVERLOAD',
    comments: [
      '嘴型下垂平淡、雙眼睜眼弧度不足！累積打哈欠與久坐，班味明顯超標！',
      '眼神露出疲態，雙眼半閉，急需離座喝水補充水分與做伸展操！',
      '久坐與疲勞累積中，表情僵硬缺乏生氣，靈魂開始微幅飄離！',
    ],
  },
  {
    minScore: 25,
    rank: 'C' as const,
    title: '眼神呆滯 // 靈魂抽離失神態 🧟',
    tag: 'SOUL_DISCONNECTED',
    comments: [
      '警報！雙眼睜眼弧度極低、嘴唇呆滯無表情且抓包打哈欠！靈魂已抽離！',
      '眼神失去焦點、嘴唇微張呆滯，面部疲憊感極度濃厚，喪失生气！',
      '偵測到嚴重過勞與失神！這不是外貌問題，而是你的靈魂已經飄走了！',
    ],
  },
  {
    minScore: 15,
    rank: 'D' as const,
    title: '重度過勞 // 靈魂徹底出竅崩壞態 💀',
    tag: 'BURNOUT_CRITICAL',
    comments: [
      '緊急危險！雙眼極度沉重半閉、頻繁打哈欠與久坐，靈魂已脫離肉體！',
      '喪失感與過勞感爆表！請立即站起來喝水、走動，挽救飄走的靈魂！',
      '系統檢測到重度班味與失神崩壞！肉體雖然在鍵盤前，靈魂早已下班！',
    ],
  },
];

export function computeLocalFaceScore(inputs: FaceEvaluationRawInputs): FaceCharismaScore {
  const {
    smile = 0,
    browRelaxation = 1,
    eyeOpenness = 0.8,
    yawnsCount = 0,
    frownsCount = 0,
    consecutiveDeskMinutes = 0,
    healthScore = 100,
  } = inputs;

  // STRICT BASELINE SCORING:
  // Baseline for a standard expressionless/flat office face is ~48 - 52 PTS.
  let score = 48;

  // 1. Mouth Curvature (Smile Arc) Impact
  if (smile >= 0.5) {
    // Big active smile: +30 ~ +40
    score += Math.round(30 + (smile - 0.5) * 20);
  } else if (smile >= 0.2) {
    // Gentle smile arc: +12 ~ +25
    score += Math.round(12 + (smile - 0.2) * 43);
  } else if (smile < 0.08) {
    // Unsmiling / flat mouth / drooping corners: -8 PTS penalty
    score -= 8;
  }

  // 2. Eye Openness Arc Impact
  if (eyeOpenness >= 0.8) {
    // Bright, fully open alert eyes: +10 ~ +15
    score += Math.round(10 + (eyeOpenness - 0.8) * 25);
  } else if (eyeOpenness < 0.55) {
    // Drooping eyelids / sleepy / narrow eye opening arc: -15 ~ -25
    score -= Math.round((0.55 - eyeOpenness) * 45);
  }

  // 3. Eyebrow Relaxation Impact
  if (browRelaxation >= 0.85) {
    score += 5; // Relaxed brow
  } else if (browRelaxation < 0.5) {
    // Frowning / furrowed brow: -12 ~ -20
    score -= Math.round((0.5 - browRelaxation) * 35);
  }

  // 4. Fatigue History & Physical Penalties
  let totalPenalty = 0;

  // Yawns penalty (-10 per yawn)
  totalPenalty += yawnsCount * 10;

  // Frowns penalty (-6 per frown)
  totalPenalty += frownsCount * 6;

  // Prolonged Sitting / Desk Time penalty (-3 per 10 mins after 20m)
  if (consecutiveDeskMinutes > 20) {
    const extraMins = consecutiveDeskMinutes - 20;
    totalPenalty += Math.min(22, Math.floor(extraMins / 10) * 4);
  }

  // Health Reserve Sync Penalty
  if (healthScore < 70) {
    totalPenalty += Math.round((70 - healthScore) * 0.3);
  }

  // Calculate final score bounded strictly between 15 and 98
  const finalScore = Math.min(98, Math.max(15, Math.round(score - totalPenalty)));

  // Match title template
  const matched =
    TITLES_AND_COMMENTS.find((t) => finalScore >= t.minScore) ||
    TITLES_AND_COMMENTS[TITLES_AND_COMMENTS.length - 1];
  const randomComment = matched.comments[Math.floor(Math.random() * matched.comments.length)];

  // 5-Axis Metrics calculated strictly from real biometric inputs
  const radiance = Math.min(99, Math.max(10, Math.round(finalScore * 0.75 + smile * 25)));
  const sparkle = Math.min(
    99,
    Math.max(10, Math.round(eyeOpenness * 85 - yawnsCount * 8 + (healthScore > 80 ? 10 : 0)))
  );
  const smilePower = Math.min(99, Math.max(10, Math.round(smile * 92 + 8)));
  const symmetry = Math.min(99, Math.max(10, Math.round(browRelaxation * 75 + 20)));
  const charisma = Math.min(99, Math.max(10, Math.round(finalScore * 0.85 - frownsCount * 6)));

  return {
    score: finalScore,
    title: matched.title,
    rank: matched.rank,
    comment: randomComment,
    metrics: {
      radiance,
      sparkle,
      smilePower,
      symmetry,
      charisma,
    },
    timestamp: Date.now(),
    highlightTag: matched.tag,
    source: 'local_neural',
  };
}

/**
 * Attempt to call backend Gemini face score API, falling back to strict local computation
 */
export async function evaluateFaceScoreWithGemini(
  inputs: FaceEvaluationRawInputs
): Promise<FaceCharismaScore> {
  try {
    const res = await fetch('/api/gemini/face-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputs),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.score) {
        return {
          ...data,
          timestamp: Date.now(),
          source: 'gemini_ai',
        };
      }
    }
  } catch (err) {
    console.warn('Gemini face-score API failed, falling back to local strict calculation:', err);
  }

  return computeLocalFaceScore(inputs);
}
