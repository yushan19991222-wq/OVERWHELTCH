import React, { useRef, useState, useEffect } from 'react';
import { Camera, Eye, VideoOff, Activity, ShieldAlert, Sparkles, UserCheck, UserX, Sliders, Zap, Smile, Coffee, Navigation, Clock } from 'lucide-react';
import { TelemetryData, FaceCharismaScore } from '../types';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isModelLoaded: boolean;
  modelLoadError: string | null;
  isCameraActive: boolean;
  cameraError: string | null;
  onRetryCamera: () => void;
  showMesh: boolean;
  onToggleMesh: () => void;
  telemetry: TelemetryData;
  sedentaryLimitMinutes: number;
  onTriggerYawn?: () => void;
  faceScoreData?: FaceCharismaScore | null;
  isScanningFace?: boolean;
  onTriggerFaceScan?: () => void;
  onOpenCandidGallery?: () => void;
  candidCount?: number;
  isShutterFlashing?: boolean;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  videoRef,
  canvasRef,
  isModelLoaded,
  modelLoadError,
  isCameraActive,
  cameraError,
  onRetryCamera,
  showMesh,
  onToggleMesh,
  telemetry,
  sedentaryLimitMinutes,
  onTriggerYawn,
  faceScoreData,
  isScanningFace,
  onTriggerFaceScan,
  onOpenCandidGallery,
  candidCount = 0,
  isShutterFlashing = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filterMode, setFilterMode] = useState<'normal' | 'nightvision' | 'mono'>('normal');
  const [timecode, setTimecode] = useState<string>('00:00:00:00');

  // CCTV Running Timecode generator
  useEffect(() => {
    const updateTimecode = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const f = String(Math.floor(now.getMilliseconds() / 16.6)).padStart(2, '0');
      setTimecode(`${h}:${m}:${s}:${f}`);
    };
    const timer = setInterval(updateTimecode, 33);
    return () => clearInterval(timer);
  }, []);

  // Format desk time
  const deskMinutes = Math.floor(telemetry.consecutiveDeskSeconds / 60);
  const deskSeconds = Math.floor(telemetry.consecutiveDeskSeconds % 60);
  const deskTimeStr = `${String(deskMinutes).padStart(2, '0')}:${String(deskSeconds).padStart(2, '0')}`;

  const deskProgressPct = Math.min(
    100,
    (telemetry.consecutiveDeskSeconds / (Math.max(1, sedentaryLimitMinutes) * 60)) * 100
  );

  // Video filter style class
  const filterClass =
    filterMode === 'nightvision'
      ? 'cctv-filter-nightvision'
      : filterMode === 'mono'
      ? 'cctv-filter-mono'
      : '';

  return (
    <div className="flex flex-col gap-2.5 w-full h-full min-h-0 justify-between">
      {/* CCTV Viewport Container - Flex-1 dynamically adapts height to match right block */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 min-h-0 bg-[#04060a] rounded-md overflow-hidden border border-slate-800 shadow-2xl group flex items-center justify-center cctv-brackets"
      >
        {/* Real Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${filterClass} ${
            isCameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Dynamic Canvas for Facial Mesh & Bounding Box */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100 z-10"
        />

        {/* Shutter Flash Animation for Candid Snapshot / Peace Sign Easter Egg */}
        {isShutterFlashing && (
          <div className="absolute inset-0 bg-white/70 pointer-events-none z-30 animate-pulse transition-opacity duration-150" />
        )}

        {/* Authentic CCTV Scanline & Vignette Overlay */}
        <div className="absolute inset-0 scanline-overlay pointer-events-none z-10 opacity-40" />
        <div className="absolute inset-0 cctv-vignette pointer-events-none z-10" />

        {/* CCTV Top Banner: Channel ID & Live REC Timecode */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
          {/* Left: REC Status & Camera ID */}
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-black/80 border border-slate-700/80 flex items-center gap-1.5 text-[11px] font-mono shadow backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-cctv-blink shadow-[0_0_8px_#f43f5e]" />
              <span className="text-rose-400 font-black tracking-widest">REC</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-mono font-bold tracking-wider">CAM-01</span>
            </div>
            <div className="hidden sm:flex items-center px-2 py-0.5 rounded bg-black/60 border border-slate-800 text-[10px] font-mono text-cyan-400">
              OVERWATCH_DESK // 60FPS
            </div>
          </div>

          {/* Right: Real-time Frame Timecode */}
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 rounded bg-black/80 border border-slate-700/80 text-[11px] font-mono text-emerald-400 font-bold tracking-widest shadow backdrop-blur-sm">
              TC {timecode}
            </div>
          </div>
        </div>

        {/* CCTV Bottom Left: Filter Mode Switcher & Mesh Toggle Toolbar (Replaces '監控中', height unified with Target Lock) */}
        <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5">
          {/* Filter Mode Switcher */}
          <div className="flex items-center bg-black/85 rounded p-0.5 border border-slate-800 text-[10px] font-mono h-6 box-border shadow backdrop-blur-sm">
            <button
              onClick={() => setFilterMode('normal')}
              className={`h-full px-1.5 rounded flex items-center justify-center transition font-bold ${
                filterMode === 'normal'
                  ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="正常彩色"
            >
              RGB
            </button>
            <button
              onClick={() => setFilterMode('nightvision')}
              className={`h-full px-1.5 rounded flex items-center justify-center transition font-bold ${
                filterMode === 'nightvision'
                  ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="夜視監控模式"
            >
              NVG
            </button>
            <button
              onClick={() => setFilterMode('mono')}
              className={`h-full px-1.5 rounded flex items-center justify-center transition font-bold ${
                filterMode === 'mono'
                  ? 'bg-slate-700 text-white border border-slate-500'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="黑白安防監視"
            >
              BW
            </button>
          </div>

          {/* Wireframe Mesh Toggle */}
          <button
            onClick={onToggleMesh}
            className={`h-6 px-2 rounded text-[10px] font-mono font-bold border transition-all flex items-center justify-center box-border shadow backdrop-blur-sm ${
              showMesh
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.25)]'
                : 'bg-black/85 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            MESH: {showMesh ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* CCTV Center Viewfinder Reticle */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 z-10">
          <div className="w-28 h-28 border border-dashed border-cyan-400/40 rounded-sm flex items-center justify-center relative">
            <div className="w-2.5 h-0.5 bg-cyan-400/80" />
            <div className="h-2.5 w-0.5 bg-cyan-400/80 absolute" />
          </div>
        </div>

        {/* Target Lock Status Chip (Bottom Right of Feed - Height Unified with Controls) */}
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5">
          <div className="h-6 px-2 rounded bg-black/85 border border-slate-800 flex items-center gap-1.5 text-[10px] font-mono shadow backdrop-blur-sm box-border">
            {telemetry.isFacePresent ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(56,189,248,0.5)] shrink-0" />
                <span className="text-cyan-400 font-bold">TARGET: ACQUIRED [99.8%]</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-amber-400 font-bold">TARGET: SEARCHING (ABSENT)</span>
              </>
            )}
          </div>
        </div>

        {/* Live Proximity / Danger Intercept Warning Frame */}
        {telemetry.isTooClose && (
          <div className="absolute inset-0 border-2 border-amber-400/90 pointer-events-none animate-pulse z-20" />
        )}

        {/* Model Loading State */}
        {!isModelLoaded && !modelLoadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#06080e]/95 backdrop-blur-md z-30 p-6 text-center font-mono">
            <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3" />
            <div className="text-xs font-bold text-cyan-300 mb-1 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>INITIALIZING_OVERWATCH_AI_CORE...</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
              正在啟動本地神經網路監控節點 (100% Client-Side WASM)。
            </p>
          </div>
        )}

        {/* Camera Permission or Init Error Fallback -> Overwatch Tactical Standby */}
        {(!isCameraActive || cameraError || modelLoadError) && isModelLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#06080e]/95 backdrop-blur-md z-30 p-4 text-center font-mono">
            <div className="max-w-md w-full bg-[#030508]/90 border border-slate-700/80 rounded-lg p-5 shadow-2xl relative overflow-hidden cctv-brackets flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <Camera className="w-5 h-5 animate-pulse" />
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>[OPTICAL_FEED_STANDBY]</span>
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                CCTV 智慧身心健視器待命中
              </h3>

              <p className="text-[10px] sm:text-[11px] text-slate-400 max-w-sm leading-relaxed">
                {cameraError || modelLoadError || '正在連線鏡頭。請點擊下方按鈕允許授權開啟鏡頭。'}
              </p>

              <button
                type="button"
                onClick={onRetryCamera}
                className="mt-1 px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>允許授權開啟鏡頭</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Alert Overlays */}
        {telemetry.isYawning && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded bg-rose-600/90 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(244,63,94,0.8)] animate-cctv-glitch flex items-center gap-1.5 border border-rose-400">
            <span>🚨</span>
            <span>ALERT: YAWN_FATIGUE_INTERCEPT (-5 PTS)</span>
          </div>
        )}
      </div>

      {/* Streamlined Surveillance Telemetry Rack (Clean 3x2 Grid - Health & Fatigue Detection Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2 text-xs font-mono shrink-0">
        {/* 1. Drowsiness / Yawn Check */}
        <div className="p-2.5 rounded bg-[#070a10] border border-slate-800 flex flex-col justify-between" title="【大腦缺氧哈欠監測】嘴部持續張幅超過 0.48 達 1.0 秒將判定為大腦缺氧打哈欠並觸發醒腦提醒">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold truncate">
              <span className="material-symbols-outlined text-[15px] text-cyan-400 shrink-0">bedtime</span>
              <span>DROWSINESS ALERT</span>
            </span>
            <span className="font-bold text-cyan-400 shrink-0">{telemetry.mar.toFixed(2)}</span>
          </div>
          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.mar > 0.48 ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.mar * 180)}%` }}
            />
          </div>
          <div className="text-[9px] text-slate-400 mt-1 flex justify-end items-center">
            <span className={telemetry.mar > 0.48 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {telemetry.mar > 0.48 ? '缺氧超標' : '警戒線:0.48'}
            </span>
          </div>
        </div>

        {/* 2. Stress Level */}
        <div className="p-2.5 rounded bg-[#070a10] border border-slate-800 flex flex-col justify-between" title="【精神緊繃壓力監測】眉心張力大於 0.07 且持續 5.0 秒將判定為壓力緊繃並觸發心靈排解提醒">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold truncate">
              <span className="material-symbols-outlined text-[15px] text-cyan-400 shrink-0">psychology</span>
              <span>STRESS LEVEL</span>
            </span>
            <span className={`font-bold shrink-0 tabular-nums ${telemetry.frown > 0.07 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {telemetry.frown.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.frown > 0.07 ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, (telemetry.frown / 0.12) * 100)}%` }}
            />
          </div>
          <div className="text-[9px] text-slate-400 mt-1 flex justify-between items-center">
            <span className="text-slate-500">門檻 &gt; 0.07</span>
            <span className={telemetry.frown > 0.07 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {telemetry.frown > 0.07
                ? (telemetry.frownDurationSeconds && telemetry.frownDurationSeconds > 0.2
                    ? `緊繃蓄力 ${telemetry.frownDurationSeconds.toFixed(1)}s / 5.0s`
                    : '緊繃蓄力中 (>0.07)')
                : '放鬆舒適'}
            </span>
          </div>
        </div>

        {/* 3. Eye Strain / Blink Rate (Dry Eye Index) */}
        <div className="p-2.5 rounded bg-[#070a10] border border-slate-800 flex flex-col justify-between" title="【乾眼頻繁眨眼監測】4 秒內連續急促眨眼達 5 次或沉重閉眼達 3.0 秒，判定乾眼過勞並啟動護眼提醒">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold truncate">
              <span className="material-symbols-outlined text-[15px] text-cyan-400 shrink-0">visibility</span>
              <span>DRY EYE INDEX</span>
            </span>
            <span className={`font-bold shrink-0 ${telemetry.isFrequentBlinking ? 'text-rose-400' : 'text-cyan-400'}`}>
              {telemetry.isFrequentBlinking
                ? '乾眼過勞'
                : telemetry.isEyesClosed && telemetry.prolongedCloseSeconds && telemetry.prolongedCloseSeconds > 0.5
                ? `閉眼 ${telemetry.prolongedCloseSeconds}s`
                : (telemetry.blinkCountWindow || 0) >= 3
                ? `頻繁眨眼 ${telemetry.blinkCountWindow}/5`
                : '雙眼放鬆'}
            </span>
          </div>
          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.isFrequentBlinking ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-cyan-400'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    ((telemetry.blinkCountWindow || 0) / 5) * 100,
                    ((telemetry.prolongedCloseSeconds || 0) / 3.0) * 100
                  )
                )}%`,
              }}
            />
          </div>
          <div className="text-[9px] text-slate-400 mt-1 flex justify-end items-center">
            <span className={telemetry.isFrequentBlinking ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {telemetry.isFrequentBlinking ? '乾眼過勞 (≥5次)' : `${telemetry.blinkCountWindow || 0} / 5 次`}
            </span>
          </div>
        </div>

        {/* 4. Screen Distance / Posture */}
        <div className="p-2.5 rounded bg-[#070a10] border border-slate-800 flex flex-col justify-between" title="【近距駝背風險】≥35cm 為最佳姿勢視距，30-35cm 為過渡區，<30cm 判定為近距駝背風險">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold truncate">
              <span className="material-symbols-outlined text-[15px] text-cyan-400 shrink-0">straighten</span>
              <span>SCREEN DISTANCE</span>
            </span>
            <span className="font-bold text-cyan-400 shrink-0">{telemetry.proximity}%</span>
          </div>
          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.proximity > 64
                  ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                  : telemetry.proximity > 55
                  ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.proximity)}%` }}
            />
          </div>
          <div className="text-[9px] text-slate-400 mt-1 flex justify-end items-center">
            <span className={
              telemetry.proximity > 64
                ? 'text-rose-400 font-bold'
                : telemetry.proximity > 55
                ? 'text-amber-400 font-bold'
                : 'text-slate-400'
            }>
              {telemetry.proximity > 64 ? '駝背太近 (<30cm)' : telemetry.proximity > 55 ? '過渡區 (30-35)' : '[健康視距 ≥35cm]'}
            </span>
          </div>
        </div>

        {/* 5. Desk Time */}
        <div
          className="p-2.5 rounded bg-[#070a10] border border-slate-800 flex flex-col justify-between"
          title={`【久坐脊椎負擔】本輪伏案累積時長。連續久坐達設定上限（${sedentaryLimitMinutes}分鐘）將準時啟動 30 秒站立伸展體操！`}
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold truncate">
              <span className={`material-symbols-outlined text-[15px] shrink-0 ${telemetry.isFacePresent ? 'text-cyan-400' : 'text-amber-400'}`}>
                {telemetry.isFacePresent ? 'timer' : 'pause_circle'}
              </span>
              <span>{telemetry.isFacePresent ? 'DESK TIME' : 'DESK PAUSED'}</span>
            </span>
            <span className={`font-bold shrink-0 ${telemetry.isFacePresent ? (deskProgressPct > 85 ? 'text-rose-400' : 'text-cyan-400') : 'text-amber-400'}`}>
              {deskTimeStr}
            </span>
          </div>
          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                deskProgressPct > 85
                  ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                  : telemetry.isFacePresent
                  ? 'bg-cyan-400'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${deskProgressPct}%` }}
            />
          </div>
          <div className="text-[9px] text-slate-400 mt-1 flex justify-end items-center">
            <span className={deskProgressPct > 85 ? 'text-rose-400 font-bold' : telemetry.isFacePresent ? 'text-slate-400' : 'text-amber-400'}>
              {telemetry.isFacePresent
                ? `${Math.round(deskProgressPct)}% / ${sedentaryLimitMinutes}m`
                : `離座暫停中 (${Math.round(deskProgressPct)}% / ${sedentaryLimitMinutes}m)`}
            </span>
          </div>
        </div>

        {/* 6. Mood & Vitality */}
        <div className="p-2.5 rounded bg-[#070a10] border border-slate-800 flex flex-col justify-between" title="【職場心理活力】依 468 點面部微表情、嘴角上揚與眼神光彩即時評估精神活力">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold truncate">
              <span className="material-symbols-outlined text-[15px] text-cyan-400 shrink-0">sentiment_satisfied</span>
              <span>MOOD & VITALITY</span>
            </span>
            <span className="font-bold text-cyan-400 truncate max-w-[85px] text-right shrink-0">
              {telemetry.isFacePresent && telemetry.emotion
                ? `${telemetry.emotion.emoji} ${telemetry.emotion.label}`
                : '分析中'}
            </span>
          </div>
          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.emotion?.type === 'laugh' || telemetry.emotion?.type === 'smile' || telemetry.emotion?.type === 'subtle_smile'
                  ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                  : telemetry.emotion?.type === 'frown' || telemetry.emotion?.type === 'pout'
                  ? 'bg-rose-400 shadow-[0_0_6px_#fb7185]'
                  : telemetry.emotion?.type === 'yawn'
                  ? 'bg-pink-400 shadow-[0_0_6px_#f472b6]'
                  : telemetry.emotion?.type === 'gasp'
                  ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8]'
                  : 'bg-cyan-400'
              }`}
              style={{
                width: `${
                  telemetry.isFacePresent && telemetry.emotion ? telemetry.emotion.score : 0
                }%`,
              }}
            />
          </div>
          <div className="text-[9px] text-slate-400 mt-1 flex justify-end items-center">
            <span className="text-cyan-400 font-bold">
              {telemetry.isFacePresent && telemetry.emotion
                ? `${telemetry.emotion.score}%`
                : '[STANDBY]'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
