import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface TacticalMemeImageProps {
  src: string;
  fallbackUrls?: string[];
  alt?: string;
  className?: string;
  category?: 'cat' | 'dog' | 'sloth' | 'ghost' | 'idol' | 'scary' | 'general';
  faceCenter?: { x: number; y: number };
  eyePositions?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    eyeDistance?: number;
    rotationDeg?: number;
  };
  showAnimeEyes?: boolean;
  style?: React.CSSProperties;
  onImageReady?: () => void;
}

/* 🌸 Classic Black & White Manga Anime Sparkling Cartoon Eye Vector Component (經典黑白日漫大眼) */
export const AnimeCartoonEye: React.FC<{
  side: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}> = ({ side, className = '', style }) => {
  const isRight = side === 'right';

  return (
    <div
      className={`relative select-none pointer-events-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] ${className}`}
      style={style}
    >
      <svg
        viewBox="0 0 100 115"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Classic Manga Ink Screentone & Grayscale Gradient */}
          <linearGradient id={`mangaIrisGrad-${side}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="40%" stopColor="#1a1a1a" />
            <stop offset="70%" stopColor="#3f3f46" />
            <stop offset="88%" stopColor="#71717a" />
            <stop offset="100%" stopColor="#d4d4d8" />
          </linearGradient>
        </defs>

        {/* Double eyelid crease line (經典雙眼皮線) */}
        <path
          d={isRight ? 'M20 20 Q50 9 80 17' : 'M20 17 Q50 9 80 20'}
          stroke="#000000"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Sclera (Pure White with subtle upper shadow) */}
        <ellipse cx="50" cy="62" rx="39" ry="33" fill="#ffffff" stroke="#000000" strokeWidth="1.2" />
        <path
          d="M12 45 Q50 54 88 45 C78 37 22 37 12 45 Z"
          fill="#000000"
          opacity="0.14"
        />

        {/* Big Dreamy Manga Iris in Black & White */}
        <ellipse cx="50" cy="64" rx="29" ry="32" fill={`url(#mangaIrisGrad-${side})`} />
        <ellipse cx="50" cy="64" rx="29" ry="32" stroke="#000000" strokeWidth="2.5" />

        {/* Vertical Manga Screentone Hatching in lower iris */}
        <g stroke="#ffffff" strokeWidth="1.2" opacity="0.75" strokeLinecap="round">
          <line x1="33" y1="76" x2="33" y2="85" />
          <line x1="39" y1="79" x2="39" y2="88" />
          <line x1="45" y1="81" x2="45" y2="90" />
          <line x1="51" y1="81" x2="51" y2="90" />
          <line x1="57" y1="79" x2="57" y2="88" />
          <line x1="63" y1="76" x2="63" y2="85" />
          <line x1="69" y1="72" x2="69" y2="80" />
        </g>

        {/* Deep Solid Black Center Pupil */}
        <ellipse cx="50" cy="60" rx="16" ry="19" fill="#000000" />

        {/* Bottom Radiant Crescent White Watery Arc (水光月牙高光) */}
        <path
          d="M27 75 Q50 93 73 75 Q50 82 27 75 Z"
          fill="#ffffff"
          opacity="0.95"
        />

        {/* Sparkle Constellation White Dots in lower iris */}
        <circle cx="36" cy="80" r="2.2" fill="#ffffff" />
        <circle cx="64" cy="80" r="2.2" fill="#ffffff" />
        <circle cx="50" cy="85" r="1.6" fill="#ffffff" />

        {/* SIGNATURE MANGA LIGHT REFLECTIONS (SPARKLES) */}
        {/* 1. Big Top-Left Primary Gloss Highlight */}
        <ellipse
          cx="37"
          cy="48"
          rx="10.5"
          ry="12.5"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="0.8"
        />

        {/* 2. Shimmering Four-Point White Star in Pupil */}
        <path
          d="M60 62 Q63 62 63 58 Q63 62 67 62 Q63 62 63 66 Q63 62 60 62 Z"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="0.6"
          className="animate-pulse"
        />

        {/* 3. Bottom-Right Secondary Round Highlight */}
        <circle cx="66" cy="74" r="5.2" fill="#ffffff" />

        {/* 4. Mini Cute Sparkle Dot */}
        <circle cx="44" cy="70" r="2.4" fill="#ffffff" />

        {/* Iconic Manga Upper Eyelash (Thick black ink with winged flick) */}
        {isRight ? (
          <path
            d="M10 40 Q25 24 55 22 Q84 22 94 32 Q82 29 55 28 Q25 30 10 40 Z"
            fill="#000000"
          />
        ) : (
          <path
            d="M6 32 Q16 22 45 22 Q75 24 90 40 Q75 30 45 28 Q18 29 6 32 Z"
            fill="#000000"
          />
        )}

        {/* Flutter Lashes (飛揚睫毛) */}
        {isRight ? (
          <>
            <path d="M85 27 Q96 19 98 13" stroke="#000000" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M72 23 Q81 16 85 11" stroke="#000000" strokeWidth="2.4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M15 27 Q4 19 2 13" stroke="#000000" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M28 23 Q19 16 15 11" stroke="#000000" strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}

        {/* Delicate Lower Eyelash */}
        <path
          d="M25 93 Q50 99 75 93"
          stroke="#000000"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        {isRight ? (
          <path d="M74 93 Q82 98 84 102" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
        ) : (
          <path d="M26 93 Q18 98 16 102" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
        )}

        {/* Classic Black Manga Ink Diagonal Blush Hatching (///) */}
        <g stroke="#000000" strokeWidth="2.4" strokeLinecap="round" opacity="0.8">
          <line x1="28" y1="104" x2="33" y2="113" />
          <line x1="39" y1="104" x2="44" y2="113" />
          <line x1="50" y1="104" x2="55" y2="113" />
        </g>
      </svg>

      {/* Floating Sparkle Star in Monochrome */}
      <div className={`absolute -top-2 ${isRight ? '-right-2.5' : '-left-2.5'} text-[13px] text-white drop-shadow-[0_0_4px_#000] font-black select-none pointer-events-none`}>
        ✦
      </div>
    </div>
  );
};

// Global in-memory cache tracker for preloaded images
const preloadedImageCache = new Set<string>();

export const TacticalMemeImage: React.FC<TacticalMemeImageProps> = ({
  src,
  fallbackUrls = [],
  alt = 'Tactical Meme Feed',
  className = '',
  category = 'cat',
  faceCenter,
  eyePositions,
  showAnimeEyes = false,
  style = {},
  onImageReady,
}) => {
  const [currentSrcIndex, setCurrentSrcIndex] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);
  
  // Combine primary src with fallbacks, removing duplicates
  const allUrls = React.useMemo(() => {
    const list = [src, ...fallbackUrls].filter(Boolean);
    return Array.from(new Set(list));
  }, [src, fallbackUrls]);

  const currentUrl = allUrls[currentSrcIndex] || src;

  // If already in browser memory/cache, avoid loading spinner
  const [isLoading, setIsLoading] = useState<boolean>(() => !preloadedImageCache.has(currentUrl));
  const [detectedFace, setDetectedFace] = useState<{ x: number; y: number }>(
    faceCenter || { x: 50, y: 26 }
  );
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [detectedEyes, setDetectedEyes] = useState<{
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    rotationDeg?: number;
  } | null>(null);

  // Position state for dynamic Anime Cartoon Eyes
  const [eyeRenderState, setEyeRenderState] = useState<{
    leftPos: { x: number; y: number };
    rightPos: { x: number; y: number };
    eyeW: number;
    eyeH: number;
    rotation: number;
  }>({
    leftPos: { x: 42, y: 36 },
    rightPos: { x: 58, y: 36 },
    eyeW: 46,
    eyeH: 54,
    rotation: 0,
  });

  // Reset src index when incoming src changes
  useEffect(() => {
    setCurrentSrcIndex(0);
    setHasError(false);
  }, [src]);

  // Sync with prop when faceCenter changes
  useEffect(() => {
    if (faceCenter) {
      setDetectedFace(faceCenter);
    }
  }, [faceCenter?.x, faceCenter?.y]);

  // Check cache and image completion when URL changes
  useEffect(() => {
    setHasError(false);
    if (preloadedImageCache.has(currentUrl)) {
      setIsLoading(false);
      onImageReady?.();
    } else if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      preloadedImageCache.add(currentUrl);
      setIsLoading(false);
      onImageReady?.();
    } else {
      setIsLoading(true);
    }

    // Only fallback if the current image actually fails or errors out
    const timer = setTimeout(() => {
      if (!imgRef.current || !imgRef.current.complete || imgRef.current.naturalWidth === 0) {
        if (currentSrcIndex < allUrls.length - 1) {
          setCurrentSrcIndex((prev) => prev + 1);
        } else {
          setIsLoading(false);
          onImageReady?.();
        }
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [currentUrl, currentSrcIndex, allUrls.length, onImageReady]);

  // Smart Face & Eye Detection algorithm to ensure accurate eye and face alignment
  const autoDetectFaceCentering = (img: HTMLImageElement) => {
    const isPortrait = (img.naturalHeight || img.height) > (img.naturalWidth || img.width);
    const imgW = img.naturalWidth || img.width || 480;
    const imgH = img.naturalHeight || img.height || 600;

    // 1. Try native Chromium FaceDetector API with landmark detection
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        const detector = new (window as any).FaceDetector({ fastMode: false, maxDetectedFaces: 1 });
        detector.detect(img).then((faces: any[]) => {
          if (faces && faces.length > 0) {
            const face = faces[0];
            const box = face.boundingBox;
            const cx = Math.round(((box.x + box.width / 2) / imgW) * 100);
            const cy = Math.round(((box.y + box.height / 2) / imgH) * 100);
            const targetY = isPortrait ? Math.max(16, Math.min(28, cy - 4)) : Math.max(15, Math.min(60, cy - 2));
            if (!faceCenter) {
              setDetectedFace({ x: Math.max(15, Math.min(85, cx)), y: targetY });
            }

            // Extract eye landmarks if available
            const eyeLandmarks = face.landmarks?.filter((l: any) => l.type === 'eye') || [];
            if (eyeLandmarks.length >= 2) {
              const p1 = eyeLandmarks[0].locations?.[0] || eyeLandmarks[0].location || eyeLandmarks[0];
              const p2 = eyeLandmarks[1].locations?.[0] || eyeLandmarks[1].location || eyeLandmarks[1];
              if (p1 && p2) {
                const e1 = { x: (p1.x / imgW) * 100, y: (p1.y / imgH) * 100 };
                const e2 = { x: (p2.x / imgW) * 100, y: (p2.y / imgH) * 100 };
                const leftE = e1.x < e2.x ? e1 : e2;
                const rightE = e1.x < e2.x ? e2 : e1;
                const rot = Math.atan2(rightE.y - leftE.y, rightE.x - leftE.x) * (180 / Math.PI);
                setDetectedEyes({ leftEye: leftE, rightEye: rightE, rotationDeg: rot });
              }
            } else if (box) {
              // Standard biometric eye placement relative to face bounding box
              const eyeBoxY = ((box.y + box.height * 0.38) / imgH) * 100;
              const leftBoxX = ((box.x + box.width * 0.30) / imgW) * 100;
              const rightBoxX = ((box.x + box.width * 0.70) / imgW) * 100;
              setDetectedEyes({
                leftEye: { x: leftBoxX, y: eyeBoxY },
                rightEye: { x: rightBoxX, y: eyeBoxY },
                rotationDeg: 0,
              });
            }
          } else {
            runSkinCentroidDetection(img);
          }
        }).catch(() => {
          runSkinCentroidDetection(img);
        });
        return;
      } catch {
        // Fall back to skin-tone centroid
      }
    }

    // 2. Ultra-fast canvas skin-tone centroid locator
    runSkinCentroidDetection(img);
  };

  const runSkinCentroidDetection = (img: HTMLImageElement) => {
    try {
      const offCanvas = document.createElement('canvas');
      const w = 48;
      const h = 48;
      offCanvas.width = w;
      offCanvas.height = h;
      const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      let sumX = 0;
      let sumY = 0;
      let skinCount = 0;

      const isPortrait = (img.naturalHeight || img.height) > (img.naturalWidth || img.width);
      const maxScanY = isPortrait ? h * 0.40 : h * 0.55;

      for (let y = 2; y < maxScanY; y++) {
        for (let x = 3; x < w - 3; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const isSkin =
            r > 80 &&
            g > 40 &&
            b > 20 &&
            r > g &&
            r > b &&
            Math.abs(r - g) > 10 &&
            r - b > 10;
          if (isSkin) {
            sumX += x;
            sumY += y;
            skinCount++;
          }
        }
      }

      if (skinCount > 10) {
        const avgX = (sumX / skinCount / w) * 100;
        const avgY = (sumY / skinCount / h) * 100;
        const targetY = isPortrait
          ? Math.round(Math.max(18, Math.min(27, avgY - 2)))
          : Math.round(Math.max(15, Math.min(65, avgY)));
        const finalX = Math.round(Math.max(15, Math.min(85, avgX)));
        if (!faceCenter) {
          setDetectedFace({
            x: finalX,
            y: targetY,
          });
        }
        setDetectedEyes({
          leftEye: { x: finalX - 8.5, y: targetY + 2 },
          rightEye: { x: finalX + 8.5, y: targetY + 2 },
          rotationDeg: 0,
        });
      } else if (isPortrait) {
        if (!faceCenter) setDetectedFace({ x: 50, y: 25 });
        setDetectedEyes({
          leftEye: { x: 41.5, y: 27 },
          rightEye: { x: 58.5, y: 27 },
          rotationDeg: 0,
        });
      }
    } catch {
      if (!faceCenter) setDetectedFace({ x: 50, y: 25 });
      setDetectedEyes({
        leftEye: { x: 41.5, y: 27 },
        rightEye: { x: 58.5, y: 27 },
        rotationDeg: 0,
      });
    }
  };

  const handleImageError = () => {
    if (currentSrcIndex < allUrls.length - 1) {
      setCurrentSrcIndex((prev) => prev + 1);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
      onImageReady?.();
    }
  };

  const handleImageLoad = () => {
    preloadedImageCache.add(currentUrl);
    setIsLoading(false);
    setHasError(false);
    if (imgRef.current) {
      autoDetectFaceCentering(imgRef.current);
      updateAnimeEyePositions();
    }
    onImageReady?.();
  };

  // Update Anime Cartoon Eyes overlay positions with exact viewport & aspect-ratio mapping
  const updateAnimeEyePositions = React.useCallback(() => {
    if (!showAnimeEyes) return;
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    if (containerRect.width === 0 || containerRect.height === 0) return;

    const iw = img.naturalWidth || imgRect.width || 480;
    const ih = img.naturalHeight || imgRect.height || 600;

    // Calibrated eye coordinate presets for known idol meme images
    let defaultLeft = detectedEyes?.leftEye || {
      x: Math.max(15, detectedFace.x - 8.5),
      y: Math.max(15, detectedFace.y + 1.5),
    };
    let defaultRight = detectedEyes?.rightEye || {
      x: Math.min(85, detectedFace.x + 8.5),
      y: Math.max(15, detectedFace.y + 1.5),
    };
    let defaultRot = detectedEyes?.rotationDeg || 0;

    if (currentUrl.includes('idol-handsome-1')) {
      defaultLeft = { x: 41.2, y: 28.0 };
      defaultRight = { x: 59.8, y: 27.2 };
      defaultRot = -2.3;
    } else if (currentUrl.includes('idol-beauty-1')) {
      defaultLeft = { x: 42.5, y: 25.0 };
      defaultRight = { x: 67.8, y: 22.8 };
      defaultRot = -5.0;
    }

    const rawLeft = eyePositions?.leftEye || defaultLeft;
    const rawRight = eyePositions?.rightEye || defaultRight;

    // Compute exact rendered image content-box based on object-fit
    const computedStyle = window.getComputedStyle(img);
    const objectFit = computedStyle.objectFit || 'cover';

    let scale: number;
    let renderLeft: number;
    let renderTop: number;

    if (objectFit === 'contain') {
      scale = Math.min(imgRect.width / iw, imgRect.height / ih);
      const rw = iw * scale;
      const rh = ih * scale;
      renderLeft = (imgRect.left - containerRect.left) + (imgRect.width - rw) / 2;
      renderTop = (imgRect.top - containerRect.top) + (imgRect.height - rh) / 2;
    } else {
      // 'cover' or fill
      scale = Math.max(imgRect.width / iw, imgRect.height / ih);
      const rw = iw * scale;
      const rh = ih * scale;
      renderLeft = (imgRect.left - containerRect.left) + (imgRect.width - rw) / 2;
      renderTop = (imgRect.top - containerRect.top) + (imgRect.height - rh) / 2;
    }

    const toContainer = (pt: { x: number; y: number }) => {
      const pixelX = renderLeft + (pt.x / 100) * iw * scale;
      const pixelY = renderTop + (pt.y / 100) * ih * scale;
      return {
        x: (pixelX / containerRect.width) * 100,
        y: (pixelY / containerRect.height) * 100,
      };
    };

    const leftC = toContainer(rawLeft);
    const rightC = toContainer(rawRight);

    // Calculate eye width based on inter-pupillary distance on screen
    const interEyeDistPx = Math.hypot(
      ((rightC.x - leftC.x) / 100) * containerRect.width,
      ((rightC.y - leftC.y) / 100) * containerRect.height
    );

    const screenRotDeg = Math.atan2(
      ((rightC.y - leftC.y) / 100) * containerRect.height,
      ((rightC.x - leftC.x) / 100) * containerRect.width
    ) * (180 / Math.PI);

    const rot = eyePositions?.rotationDeg !== undefined ? eyePositions.rotationDeg : (defaultRot || screenRotDeg);

    // Standard anime aesthetic proportion: ~58-62% of inter-pupillary distance
    const baseEyeW = interEyeDistPx > 12
      ? Math.max(22, Math.min(96, interEyeDistPx * 0.60))
      : Math.max(24, Math.min(80, iw * scale * 0.08));
    const baseEyeH = baseEyeW * 1.15;

    setEyeRenderState({
      leftPos: leftC,
      rightPos: rightC,
      eyeW: baseEyeW,
      eyeH: baseEyeH,
      rotation: rot,
    });
  }, [showAnimeEyes, detectedFace, eyePositions, detectedEyes, currentUrl]);

  useEffect(() => {
    updateAnimeEyePositions();
    window.addEventListener('resize', updateAnimeEyePositions);
    return () => window.removeEventListener('resize', updateAnimeEyePositions);
  }, [updateAnimeEyePositions]);

  if (hasError) {
    // 100% Offline / Non-blocked fallback illustration for Cat Yawn
    if (category === 'cat') {
      return (
        <div className={`relative flex flex-col items-center justify-center bg-gradient-to-b from-[#0f141d] to-[#07090e] p-4 select-none ${className}`}>
          {/* Tactical Grid Background */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,216,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,216,255,0.04)_1px,transparent_1px)] bg-[size:16px_16px]" />

          {/* Stylized Vector Yawning Cat */}
          <div className="relative z-10 flex flex-col items-center">
            <svg
              className="w-24 h-24 sm:w-28 sm:h-28 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-pulse"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Cat Ears */}
              <polygon points="18,32 30,10 40,28" fill="#d97706" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" />
              <polygon points="22,30 30,16 36,28" fill="#f43f5e" opacity="0.6" />
              <polygon points="82,32 70,10 60,28" fill="#d97706" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" />
              <polygon points="78,30 70,16 64,28" fill="#f43f5e" opacity="0.6" />

              {/* Cat Head */}
              <circle cx="50" cy="52" r="34" fill="#b45309" stroke="#fbbf24" strokeWidth="2.5" />

              {/* Closed Sleepy Eyes (Squinting) */}
              <path d="M 30 44 Q 38 41 44 47" stroke="#090a0f" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 70 44 Q 62 41 56 47" stroke="#090a0f" strokeWidth="3" strokeLinecap="round" fill="none" />

              {/* Cute Cat Whiskers */}
              <line x1="10" y1="52" x2="30" y2="55" stroke="#fef3c7" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="60" x2="32" y2="60" stroke="#fef3c7" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="90" y1="52" x2="70" y2="55" stroke="#fef3c7" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="88" y1="60" x2="68" y2="60" stroke="#fef3c7" strokeWidth="1.8" strokeLinecap="round" />

              {/* Nose */}
              <polygon points="46,55 54,55 50,60" fill="#f43f5e" />

              {/* GIANT OPEN YAWNING MOUTH */}
              <ellipse cx="50" cy="69" rx="16" ry="12" fill="#18181b" stroke="#f43f5e" strokeWidth="2" />
              {/* Tongue inside mouth */}
              <path d="M 42 75 Q 50 82 58 75 Z" fill="#fb7185" />
              {/* Little cute fangs */}
              <polygon points="43,62 45,67 47,62" fill="#ffffff" />
              <polygon points="53,62 55,67 57,62" fill="#ffffff" />
            </svg>

            <div className="mt-1 text-center font-mono">
              <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wider">
                🐱 喵～～～（大哈欠中）
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                [光學備份感測] 嘴已張大至極限，請速補水提神！
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Default vector fallback for other categories
    return (
      <div className={`relative flex flex-col items-center justify-center bg-gradient-to-b from-[#0f141d] to-[#07090e] p-4 select-none ${className}`}>
        <div className="text-4xl sm:text-5xl animate-bounce mb-2">
          {category === 'dog' ? '🐕' : category === 'sloth' ? '🦥' : category === 'ghost' ? '👻' : '🛡️'}
        </div>
        <div className="text-xs sm:text-sm font-bold text-[#00d8ff] font-mono tracking-wide text-center">
          &gt; OPTICAL_TELEMETRY // 備援感測啟動
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black/95"
    >
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0c10] text-[#00d8ff] p-4">
          <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mb-1.5 text-[#00d8ff]" />
          <span className="text-[10px] sm:text-xs font-mono text-slate-400 tracking-wider">
            &gt; 正在載入光學影像...
          </span>
        </div>
      )}

      {/* Real Image with No-Referrer and Error handling */}
      <img
        ref={imgRef}
        src={currentUrl}
        alt={alt}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`${className} transition-opacity duration-150 ${isLoading ? 'opacity-30' : 'opacity-100'}`}
        style={{
          objectPosition: 'center center',
          maxHeight: '100%',
          maxWidth: '100%',
          ...style,
        }}
      />

      {/* Dynamic Anime Cartoon Eyes Filter Overlay */}
      {showAnimeEyes && !isLoading && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {/* Left Eye */}
          <div
            className="absolute transition-all duration-150 pointer-events-none"
            style={{
              left: `${eyeRenderState.leftPos.x}%`,
              top: `${eyeRenderState.leftPos.y}%`,
              width: `${eyeRenderState.eyeW}px`,
              height: `${eyeRenderState.eyeH}px`,
              transform: `translate(-50%, -52.17%) rotate(${eyeRenderState.rotation}deg)`,
            }}
          >
            <AnimeCartoonEye side="left" />
          </div>

          {/* Right Eye */}
          <div
            className="absolute transition-all duration-150 pointer-events-none"
            style={{
              left: `${eyeRenderState.rightPos.x}%`,
              top: `${eyeRenderState.rightPos.y}%`,
              width: `${eyeRenderState.eyeW}px`,
              height: `${eyeRenderState.eyeH}px`,
              transform: `translate(-50%, -52.17%) rotate(${eyeRenderState.rotation}deg)`,
            }}
          >
            <AnimeCartoonEye side="right" />
          </div>
        </div>
      )}
    </div>
  );
};
