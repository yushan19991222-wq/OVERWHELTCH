import { GestureRecognizer } from '@mediapipe/tasks-vision';
import { getSharedVisionFilesetResolver } from './sharedVisionResolver';

let gestureRecognizerInstance: GestureRecognizer | null = null;
let isLoadingRecognizer = false;

/**
 * Initializes and returns a singleton instance of MediaPipe GestureRecognizer
 * Pre-trained on gestures including 'Victory' (✌️ Peace Sign), 'Open_Palm', 'Pointing_Up', etc.
 */
export async function getGestureRecognizer(): Promise<GestureRecognizer | null> {
  if (gestureRecognizerInstance) return gestureRecognizerInstance;
  if (isLoadingRecognizer) {
    while (isLoadingRecognizer) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return gestureRecognizerInstance;
  }

  isLoadingRecognizer = true;
  try {
    const filesetResolver = await getSharedVisionFilesetResolver();

    try {
      gestureRecognizerInstance = await GestureRecognizer.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (gpuErr) {
      console.warn('GestureRecognizer GPU delegate failed, falling back to CPU:', gpuErr);
      gestureRecognizerInstance = await GestureRecognizer.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'CPU',
        },
        runningMode: 'IMAGE',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    return gestureRecognizerInstance;
  } catch (err) {
    console.warn('Failed to initialize GestureRecognizer:', err);
    return null;
  } finally {
    isLoadingRecognizer = false;
  }
}

/**
 * Helper to compute 2D Euclidean distance between two landmarks
 */
function get2DDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Checks if hand landmarks resemble a deliberate Peace / Victory sign (✌️):
 * 1. Index (5-8) and Middle (9-12) fingers are straightly extended (high chord-to-arc linearity).
 * 2. Ring (13-16) and Pinky (17-20) fingers are tightly folded towards palm.
 * 3. Index and Middle fingertips diverge into a clear 'V' shape (angle 12°~55°, tip spread > base spread).
 * 4. Prevents false triggers from curled fingers (e.g. eye scratching, resting chin, adjusting glasses).
 */
export function isPeaceSignLandmarks(landmarks: Array<{ x: number; y: number; z?: number }>): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];

  // Index finger landmarks (5: MCP, 6: PIP, 7: DIP, 8: TIP)
  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexDip = landmarks[7];
  const indexTip = landmarks[8];

  // Middle finger landmarks (9: MCP, 10: PIP, 11: DIP, 12: TIP)
  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleDip = landmarks[11];
  const middleTip = landmarks[12];

  // Ring finger landmarks (13: MCP, 14: PIP, 15: DIP, 16: TIP)
  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringTip = landmarks[16];

  // Pinky finger landmarks (17: MCP, 18: PIP, 19: DIP, 20: TIP)
  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyTip = landmarks[20];

  // 1. Index Finger Straight Extension Check (Chord length vs Total segment length)
  const indexSegmentsLen =
    get2DDistance(indexMcp, indexPip) +
    get2DDistance(indexPip, indexDip) +
    get2DDistance(indexDip, indexTip);
  const indexDirectLen = get2DDistance(indexMcp, indexTip);
  const isIndexStraight = indexSegmentsLen > 0 && indexDirectLen / indexSegmentsLen >= 0.82;
  const isIndexExtendedFromWrist = get2DDistance(wrist, indexTip) > get2DDistance(wrist, indexPip) * 1.12;

  if (!isIndexStraight || !isIndexExtendedFromWrist) return false;

  // 2. Middle Finger Straight Extension Check
  const middleSegmentsLen =
    get2DDistance(middleMcp, middlePip) +
    get2DDistance(middlePip, middleDip) +
    get2DDistance(middleDip, middleTip);
  const middleDirectLen = get2DDistance(middleMcp, middleTip);
  const isMiddleStraight = middleSegmentsLen > 0 && middleDirectLen / middleSegmentsLen >= 0.82;
  const isMiddleExtendedFromWrist = get2DDistance(wrist, middleTip) > get2DDistance(wrist, middlePip) * 1.12;

  if (!isMiddleStraight || !isMiddleExtendedFromWrist) return false;

  // 3. Ring and Pinky Folded Checks (Tips should be curled in, closer to wrist than extended tips)
  const indexWristDist = get2DDistance(wrist, indexTip);
  const middleWristDist = get2DDistance(wrist, middleTip);
  const maxExtendedDist = Math.max(indexWristDist, middleWristDist);

  const ringWristDist = get2DDistance(wrist, ringTip);
  const pinkyWristDist = get2DDistance(wrist, pinkyTip);

  const isRingFolded =
    ringWristDist < maxExtendedDist * 0.85 ||
    get2DDistance(wrist, ringTip) <= get2DDistance(wrist, ringPip) * 1.12;
  const isPinkyFolded =
    pinkyWristDist < maxExtendedDist * 0.85 ||
    get2DDistance(wrist, pinkyTip) <= get2DDistance(wrist, pinkyPip) * 1.12;

  if (!isRingFolded || !isPinkyFolded) return false;

  // 4. 'V' Shape Separation and Angle Check between Index and Middle Fingers
  const knuckleDist = get2DDistance(indexMcp, middleMcp);
  const tipDist = get2DDistance(indexTip, middleTip);

  // Tip spread must be noticeably wider than knuckle spread to form a 'V'
  if (tipDist < knuckleDist * 1.15 || tipDist < 0.03) return false;

  // Vector angle calculation
  const vIndex = { x: indexTip.x - indexMcp.x, y: indexTip.y - indexMcp.y };
  const vMiddle = { x: middleTip.x - middleMcp.x, y: middleTip.y - middleMcp.y };
  const magIndex = Math.hypot(vIndex.x, vIndex.y);
  const magMiddle = Math.hypot(vMiddle.x, vMiddle.y);

  if (magIndex === 0 || magMiddle === 0) return false;

  const dot = vIndex.x * vMiddle.x + vIndex.y * vMiddle.y;
  const cosAngle = dot / (magIndex * magMiddle);

  // Angle between 8 degrees and 65 degrees: cos(8°) ≈ 0.99, cos(65°) ≈ 0.42
  const isAngleV = cosAngle <= 0.99 && cosAngle >= 0.42;

  return isAngleV;
}
