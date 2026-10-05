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
 * Checks if hand landmarks resemble a Peace / Victory sign (✌️):
 * Index (5-8) and Middle (9-12) extended upward, Ring (13-16) and Pinky (17-20) folded.
 */
export function isPeaceSignLandmarks(landmarks: Array<{ x: number; y: number; z?: number }>): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexTip = landmarks[8];

  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleTip = landmarks[12];

  const ringPip = landmarks[14];
  const ringTip = landmarks[16];

  const pinkyPip = landmarks[18];
  const pinkyTip = landmarks[20];

  // Index finger extended (tip is clearly above PIP and MCP in y coordinate)
  const isIndexExtended = indexTip.y < indexPip.y && indexPip.y < indexMcp.y;

  // Middle finger extended
  const isMiddleExtended = middleTip.y < middlePip.y && middlePip.y < middleMcp.y;

  // Ring finger folded (tip is below or close to PIP)
  const isRingFolded = ringTip.y > ringPip.y - 0.04;

  // Pinky finger folded
  const isPinkyFolded = pinkyTip.y > pinkyPip.y - 0.04;

  // Separation between index tip and middle tip (forming a 'V')
  const tipDistance = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y);
  const isVSpread = tipDistance > 0.035;

  return isIndexExtended && isMiddleExtended && isRingFolded && isPinkyFolded && isVSpread;
}
