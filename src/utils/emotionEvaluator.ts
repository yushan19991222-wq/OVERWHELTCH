import { EmotionData, EmotionType } from '../types';

export interface FacialMetricsInput {
  smileVal: number; // 0 ~ 1 (mouthSmileLeft/Right avg)
  frownVal: number; // 0 ~ 1 (browDown, browLowerer, eyebrow contraction)
  jawVal: number; // 0 ~ 1 (jawOpen / MAR mouth aspect ratio)
  lipCornerElevation: number; // Normalized vertical curvature: >0 upturned (上揚), <0 downturned (下撇)
  mouthFrownVal?: number; // 0 ~ 1 (mouthFrownLeft/Right avg)
  mouthPressVal?: number; // 0 ~ 1 (mouthPressLeft/Right / mouthPucker)
  cheekSquintVal?: number; // 0 ~ 1 (cheekSquintLeft/Right - Duchenne smile / laugh cheek elevation)
  eyeWideVal?: number; // 0 ~ 1 (eyeWideLeft/Right - surprise / alertness)
  blinkScore?: number; // 0 ~ 1 (eye closure)
  consecutiveDeskSecs?: number;
  isFrequentBlinking?: boolean;
}

/**
 * Intelligent Real-time Emotion & Micro-Expression Evaluator
 * 
 * Accurately analyzes:
 * 1. 嘴角上揚弧度 (Upturned lip corners) vs 嘴角下撇弧度 (Downturned lip corners)
 * 2. 嘴唇垂直與水平開合比例 (Aperture & MAR)
 * 3. 顴肌/臉頰擠壓 (Cheek Squint / Duchenne markers)
 * 4. 眉頭聚攏與挑眉 (Eyebrow furrow vs elevation)
 * 5. 清楚區分「大笑 (Laugh)」與「打哈欠 (Yawn)」
 */
export function evaluateRealtimeEmotion(
  metricsOrSmile: FacialMetricsInput | number,
  legacyFrown?: number,
  legacyJaw?: number,
  legacyBlink?: number,
  legacyDeskSecs?: number,
  legacyFrequentBlinking?: boolean
): EmotionData {
  let smileVal: number;
  let frownVal: number;
  let jawVal: number;
  let lipCornerElevation: number;
  let mouthFrownVal: number;
  let mouthPressVal: number;
  let cheekSquintVal: number;
  let eyeWideVal: number;
  let blinkScore: number;
  let consecutiveDeskSecs: number;
  let isFrequentBlinking: boolean;

  if (typeof metricsOrSmile === 'object') {
    smileVal = metricsOrSmile.smileVal || 0;
    frownVal = metricsOrSmile.frownVal || 0;
    jawVal = metricsOrSmile.jawVal || 0;
    lipCornerElevation = metricsOrSmile.lipCornerElevation || 0;
    mouthFrownVal = metricsOrSmile.mouthFrownVal || 0;
    mouthPressVal = metricsOrSmile.mouthPressVal || 0;
    cheekSquintVal = metricsOrSmile.cheekSquintVal || 0;
    eyeWideVal = metricsOrSmile.eyeWideVal || 0;
    blinkScore = metricsOrSmile.blinkScore || 0;
    consecutiveDeskSecs = metricsOrSmile.consecutiveDeskSecs || 0;
    isFrequentBlinking = !!metricsOrSmile.isFrequentBlinking;
  } else {
    smileVal = metricsOrSmile || 0;
    frownVal = legacyFrown || 0;
    jawVal = legacyJaw || 0;
    lipCornerElevation = smileVal > 0.1 ? 0.05 : 0;
    mouthFrownVal = frownVal > 0.3 ? 0.2 : 0;
    mouthPressVal = 0;
    cheekSquintVal = smileVal > 0.25 ? 0.2 : 0;
    eyeWideVal = 0;
    blinkScore = legacyBlink || 0;
    consecutiveDeskSecs = legacyDeskSecs || 0;
    isFrequentBlinking = !!legacyFrequentBlinking;
  }

  // 1. 【開懷大笑】 (Laugh): 嘴巴開張 + 嘴角大幅向兩側上方拉揚 + 臉頰擠壓 (Duchenne markers)
  // 關鍵區別：大笑時 smileVal 與 cheekSquintVal 明顯偏高，嘴角高於嘴唇中線
  if (jawVal > 0.18 && (smileVal > 0.24 || (smileVal > 0.16 && cheekSquintVal > 0.18) || lipCornerElevation > 0.035)) {
    const intensity = Math.min(100, Math.round(jawVal * 50 + smileVal * 70 + cheekSquintVal * 30));
    return {
      type: 'laugh',
      label: '開懷大笑',
      emoji: '😆',
      score: Math.max(75, intensity),
      colorClass: 'text-amber-300 border-amber-500/60 bg-amber-950/60',
    };
  }

  // 2. 【打哈欠】 (Yawning): 嘴巴大開 (垂直拉長) + 嘴角「無」上揚 (放鬆或微沉) + 無臉頰擠壓
  // 關鍵區別：jawVal 超高但 smileVal 與 cheekSquintVal 極低，嘴型呈縱向長橢圓
  if (jawVal > 0.42 && smileVal < 0.18 && cheekSquintVal < 0.14 && lipCornerElevation <= 0.015) {
    const intensity = Math.min(100, Math.round(jawVal * 120));
    return {
      type: 'yawn',
      label: '大口哈欠',
      emoji: '🥱',
      score: Math.max(70, intensity),
      colorClass: 'text-pink-300 border-pink-500/60 bg-pink-950/60',
    };
  }

  // 3. 【張嘴驚訝 / 抽氣】 (Surprise / Gasp): 嘴巴輕度至中度開張 + 眉毛挑起或雙眼睜大 + 非微笑
  if (jawVal > 0.20 && smileVal < 0.15 && (eyeWideVal > 0.18 || frownVal < 0.15)) {
    const intensity = Math.min(100, Math.round(jawVal * 100 + eyeWideVal * 60));
    return {
      type: 'gasp',
      label: '張嘴驚訝',
      emoji: '😮',
      score: Math.max(65, intensity),
      colorClass: 'text-sky-300 border-sky-500/60 bg-sky-950/60',
    };
  }

  // 4. 【燦爛微笑】 (Smile / Joy): 嘴角顯著上揚，眉目舒展
  if (smileVal > 0.18 || lipCornerElevation > 0.03) {
    const intensity = Math.min(100, Math.round(smileVal * 150 + lipCornerElevation * 300));
    return {
      type: 'smile',
      label: '燦爛微笑',
      emoji: '😊',
      score: Math.max(65, intensity),
      colorClass: 'text-emerald-300 border-emerald-500/60 bg-emerald-950/60',
    };
  }

  // 5. 【微揚淺笑】 (Subtle Smile): 嘴角細微上揚 (捕捉 0.06 ~ 0.18 的微表情，告別面無表情！)
  if (smileVal >= 0.06 || lipCornerElevation >= 0.012) {
    const intensity = Math.min(90, Math.round(55 + smileVal * 160 + lipCornerElevation * 200));
    return {
      type: 'subtle_smile',
      label: '微揚淺笑',
      emoji: '😌',
      score: Math.max(58, intensity),
      colorClass: 'text-teal-300 border-teal-500/60 bg-teal-950/60',
    };
  }

  // 6. 【緊繃皺眉】 (Frown / Stressed): 眉頭深鎖、眉心向內聚攏
  if (frownVal > 0.26) {
    const intensity = Math.min(100, Math.round(frownVal * 140));
    return {
      type: 'frown',
      label: '緊繃皺眉',
      emoji: '😠',
      score: Math.max(65, intensity),
      colorClass: 'text-rose-300 border-rose-500/60 bg-rose-950/60',
    };
  }

  // 7. 【嘴角下撇 / 癟嘴不悅】 (Mouth Pout / Downward lip corners / Displeased)
  // 嘴角弧度下墜 (lipCornerElevation < -0.01) 或 mouthFrown 升高
  if (mouthFrownVal > 0.12 || lipCornerElevation < -0.012) {
    const intensity = Math.min(95, Math.round(50 + mouthFrownVal * 180 + Math.abs(lipCornerElevation) * 300));
    return {
      type: 'pout',
      label: '嘴角下撇',
      emoji: '🙁',
      score: Math.max(60, intensity),
      colorClass: 'text-orange-300 border-orange-500/60 bg-orange-950/60',
    };
  }

  // 8. 【嚴肅抿嘴 / 緊繃】 (Pressed Lips / Intense Concentration)
  if (mouthPressVal > 0.20 || (jawVal < 0.03 && frownVal > 0.15)) {
    return {
      type: 'pressed',
      label: '嚴肅抿嘴',
      emoji: '😐',
      score: 58,
      colorClass: 'text-slate-300 border-slate-600/60 bg-slate-900/60',
    };
  }

  // 9. 【呆滯放空】 (Blank / Dazed): 長期無表情運動 + 頻繁眨眼或長久定焦
  if (
    isFrequentBlinking ||
    blinkScore > 0.42 ||
    (consecutiveDeskSecs > 180 && smileVal < 0.05 && frownVal < 0.15 && jawVal < 0.08)
  ) {
    return {
      type: 'blank',
      label: '呆滯放空',
      emoji: '😶‍🌫️',
      score: 72,
      colorClass: 'text-purple-300 border-purple-500/60 bg-purple-950/60',
    };
  }

  // 10. 【專注凝神】 (Focused / Sharp): 眼神清亮有神、頭部姿態沉穩
  if (blinkScore < 0.30 && frownVal < 0.25) {
    return {
      type: 'focused',
      label: '專注凝神',
      emoji: '🎯',
      score: 62,
      colorClass: 'text-cyan-300 border-cyan-500/60 bg-cyan-950/60',
    };
  }

  // 11. 【放鬆平靜】 (Neutral / Calm)
  return {
    type: 'neutral',
    label: '放鬆平靜',
    emoji: '😌',
    score: 50,
    colorClass: 'text-slate-300 border-slate-700 bg-[#030508]',
  };
}
