import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let landmarkerInstance: FaceLandmarker | null = null;
let isLoadingInstance = false;

export async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (landmarkerInstance) return landmarkerInstance;
  if (isLoadingInstance) {
    // Wait for in-progress initialization
    while (isLoadingInstance) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (landmarkerInstance) return landmarkerInstance;
  }

  isLoadingInstance = true;
  try {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );

    try {
      // First attempt with GPU delegate for hardware acceleration
      landmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    } catch {
      // Gracefully fall back to CPU delegate
      landmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    }

    return landmarkerInstance;
  } finally {
    isLoadingInstance = false;
  }
}

/**
 * Draws stylized futuristic biometric tracking points and facial contours
 */
export function drawFacialLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number; z?: number }>,
  width: number,
  height: number,
  accentColor: string = '#06b6d4'
) {
  // Key feature landmark indices:
  // Lip outer/inner: 61, 291, 13, 14, 78, 308, 0, 17
  // Eyes: Left (33, 133, 159, 145), Right (362, 263, 386, 374)
  // Eyebrows: Left (70, 63, 105, 66, 107), Right (336, 296, 334, 293, 300)
  // Jaw & Chin: 10, 152, 234, 454

  ctx.save();

  // Draw cyber connecting lines between eyebrows to visualize tension
  const leftBrow = [70, 63, 105, 66, 107];
  const rightBrow = [336, 296, 334, 293, 300];

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
  ctx.lineWidth = 1.5;

  // Left eyebrow path
  ctx.beginPath();
  leftBrow.forEach((idx, i) => {
    const pt = landmarks[idx];
    if (pt) {
      const x = pt.x * width;
      const y = pt.y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Right eyebrow path
  ctx.beginPath();
  rightBrow.forEach((idx, i) => {
    const pt = landmarks[idx];
    if (pt) {
      const x = pt.x * width;
      const y = pt.y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw mouth aperture contour (MAR)
  const mouthIndices = [78, 81, 13, 311, 308, 402, 14, 178];
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  mouthIndices.forEach((idx, i) => {
    const pt = landmarks[idx];
    if (pt) {
      const x = pt.x * width;
      const y = pt.y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
  ctx.stroke();

  // Draw key node points
  const keyIndices = [
    10, 152, 234, 454, // Contour perimeter
    1, 4, 19, // Nose ridge
    33, 133, 362, 263, // Eye corners
    70, 300, // Brow ends
    13, 14, 78, 308 // Mouth landmarks
  ];

  ctx.fillStyle = accentColor;
  for (const idx of keyIndices) {
    const pt = landmarks[idx];
    if (pt) {
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw subtle face bounding box
  const xs = landmarks.map((p) => p.x * width);
  const ys = landmarks.map((p) => p.y * height);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(minX - 10, minY - 10, maxX - minX + 20, maxY - minY + 20);
  ctx.setLineDash([]);

  // Corner brackets for bounding box
  const boxX = minX - 10;
  const boxY = minY - 10;
  const boxW = maxX - minX + 20;
  const boxH = maxY - minY + 20;
  const cornerLen = 12;

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(boxX, boxY + cornerLen);
  ctx.lineTo(boxX, boxY);
  ctx.lineTo(boxX + cornerLen, boxY);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(boxX + boxW - cornerLen, boxY);
  ctx.lineTo(boxX + boxW, boxY);
  ctx.lineTo(boxX + boxW, boxY + cornerLen);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(boxX, boxY + boxH - cornerLen);
  ctx.lineTo(boxX, boxY + boxH);
  ctx.lineTo(boxX + cornerLen, boxY + boxH);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH);
  ctx.lineTo(boxX + boxW, boxY + boxH);
  ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
  ctx.stroke();

  ctx.restore();
}
