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
    minScore: 92,
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
    minScore: 84,
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
    minScore: 75,
    rank: 'S' as const,
    title: '頂級專注職場菁英態 💼',
    tag: 'ELITE_PROFESSIONAL',
    comments: [
      '專注自律，神采奕奕！眉頭舒展且散發從容自信的職場氣場！',
      '神情沉穩自信，雙眼明亮有力，充分展現頂級專注力與工作魅力！',
      '眼神聚焦且氣定神閒，狀態保持極佳，兼具專業度與親和光彩！',
    ],
  },
  {
    minScore: 68,
    rank: 'A' as const,
    title: '穩健工位標準姿態 👔',
    tag: 'STABLE_WORKER',
    comments: [
      '狀態平穩專注，表情略為平靜，雖有正常辦公節奏但展現可靠態度！',
      '面部表情略顯嚴肅，建議嘴角適度放鬆並喝口溫水，顏值將即刻飆升！',
      '沉穩專注於螢幕前，深呼吸放鬆眉頭能讓你氣場大幅提振！',
    ],
  },
  {
    minScore: 52,
    rank: 'B' as const,
    title: '微帶班味 // 輕微疲態現形 ☕',
    tag: 'MILD_FATIGUE',
    comments: [
      '嘴角趨於平淡、眼神稍顯疲累，50幾分展現真實社畜打拼痕跡！',
      '班味開始浮現，雙眼微感乾澀，建議立即大口喝水補水提提神！',
      '平淡辦公表情，略帶疲態，起來走動喝杯水可讓肌膚氣場重回高光！',
    ],
  },
  {
    minScore: 36,
    rank: 'C' as const,
    title: '班味超載 // 靈魂輕度飄離 😮‍💨',
    tag: 'FATIGUE_OVERLOAD',
    comments: [
      '嘴型下垂平淡、雙眼睜眼弧度不足！累積打哈欠與久坐，班味明顯超標！',
      '眼神露出明顯疲態，急需離座喝水補充水分與做伸展操！',
      '久坐與疲勞累積中，表情僵硬缺乏生氣，靈魂開始微幅飄離！',
    ],
  },
  {
    minScore: 15,
    rank: 'D' as const,
    title: '重度過勞 // 靈魂徹底出竅 💀',
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

  // 5-Axis Wellness & Facial State Metrics (身心健康、疲勞度與表情管理)
  // 1. mentalEnergy (身心元氣精力): Based on health reserve & overall vitality
  const mentalEnergy = Math.min(
    99,
    Math.max(
      10,
      Math.round(healthScore * 0.65 + browRelaxation * 20 + (1 - Math.min(1, yawnsCount / 2)) * 15)
    )
  );

  // 2. eyeAlertness (眼神清醒專注度): High eye openness, penalized by yawning & sleepiness
  const eyeAlertness = Math.min(
    99,
    Math.max(10, Math.round(eyeOpenness * 90 - yawnsCount * 12 + (consecutiveDeskMinutes > 40 ? -10 : 5)))
  );

  // 3. smileHealing (治癒微表情管理): Smile arc & upward facial composure
  const smileHealing = Math.min(99, Math.max(10, Math.round(smile * 88 + browRelaxation * 12)));

  // 4. browRelaxationScore (舒展減壓抗焦慮): Brow relaxation, no knotting/tension
  const browRelaxationScore = Math.min(
    99,
    Math.max(10, Math.round(browRelaxation * 80 + 15 - Math.min(25, frownsCount * 8)))
  );

  // 5. deskVitality (抗疲勞持久力): Inversely impacted by sedentary desk time & consecutive minutes
  const deskVitality = Math.min(
    99,
    Math.max(
      10,
      Math.round(
        Math.max(15, 100 - (consecutiveDeskMinutes > 15 ? (consecutiveDeskMinutes - 15) * 1.8 : 0) - yawnsCount * 6)
      )
    )
  );

  return {
    score: finalScore,
    title: matched.title,
    rank: matched.rank,
    comment: randomComment,
    metrics: {
      radiance: mentalEnergy, // 面色氣色紅潤
      sparkle: eyeAlertness, // 眼神聚焦清澈
      smilePower: smileHealing, // 嘴角自然舒展
      symmetry: browRelaxationScore, // 眉心舒展放鬆
      charisma: deskVitality, // 神態清爽無倦
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
