import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface TacticalMemeImageProps {
  src: string;
  fallbackUrls?: string[];
  alt?: string;
  className?: string;
  category?: 'cat' | 'dog' | 'sloth' | 'ghost' | 'idol' | 'scary' | 'general';
}

export const TacticalMemeImage: React.FC<TacticalMemeImageProps> = ({
  src,
  fallbackUrls = [],
  alt = 'Tactical Meme Feed',
  className = '',
  category = 'cat',
}) => {
  const [currentSrcIndex, setCurrentSrcIndex] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Combine primary src with fallbacks, removing duplicates
  const allUrls = React.useMemo(() => {
    const list = [src, ...fallbackUrls].filter(Boolean);
    return Array.from(new Set(list));
  }, [src, fallbackUrls]);

  const currentUrl = allUrls[currentSrcIndex] || src;

  // Reset when initial src changes or index changes
  useEffect(() => {
    setHasError(false);
    // Check if the image element is already completed from cache
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [currentUrl]);

  const handleImageError = () => {
    if (currentSrcIndex < allUrls.length - 1) {
      // Try next fallback url
      setCurrentSrcIndex((prev) => prev + 1);
      setIsLoading(true);
    } else {
      // All URLs exhausted -> switch to vector illustration
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

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
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black/95">
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
        referrerPolicy="no-referrer"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`${className} transition-opacity duration-200 ${isLoading ? 'opacity-40' : 'opacity-100'}`}
        style={{ maxHeight: '100%', maxWidth: '100%' }}
      />
    </div>
  );
};
