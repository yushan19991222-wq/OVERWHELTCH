import React, { useRef, useState, useEffect } from 'react';
import { Camera, Eye, VideoOff, Activity, ShieldAlert, Sparkles, UserCheck, UserX, Sliders } from 'lucide-react';
import { TelemetryData } from '../types';

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
    (telemetry.consecutiveDeskSeconds / (sedentaryLimitMinutes * 60)) * 100
  );

  // Video filter style class
  const filterClass =
    filterMode === 'nightvision'
      ? 'cctv-filter-nightvision'
      : filterMode === 'mono'
      ? 'cctv-filter-mono'
      : '';

  return (
    <div className="flex flex-col gap-2.5">
      {/* CCTV Viewport Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-[#04060a] rounded-lg overflow-hidden border border-slate-800 shadow-2xl group flex items-center justify-center cctv-brackets"
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

        {/* CCTV Corner Coordinates & Lens Diagnostics */}
        <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none hidden sm:flex flex-col text-[9px] font-mono text-slate-500">
          <span>LAT: 25.0330° N / LON: 121.5654° E</span>
          <span>IRIS: AUTO / EXP: 1/120s / SENSOR: WASM_AI</span>
        </div>

        {/* CCTV Center Viewfinder Reticle */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 z-10">
          <div className="w-28 h-28 border border-dashed border-cyan-400/40 rounded-sm flex items-center justify-center relative">
            <div className="w-2.5 h-0.5 bg-cyan-400/80" />
            <div className="h-2.5 w-0.5 bg-cyan-400/80 absolute" />
          </div>
        </div>

        {/* Top-Right Interactive Toolbar: Lens Mode & Mesh Toggle */}
        <div className="absolute top-10 right-2.5 z-20 flex items-center gap-1.5">
          {/* Filter Mode Switcher */}
          <div className="flex items-center bg-black/80 rounded p-0.5 border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => setFilterMode('normal')}
              className={`px-1.5 py-0.5 rounded transition ${
                filterMode === 'normal'
                  ? 'bg-cyan-900/90 text-cyan-200 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="正常彩色"
            >
              RGB
            </button>
            <button
              onClick={() => setFilterMode('nightvision')}
              className={`px-1.5 py-0.5 rounded transition ${
                filterMode === 'nightvision'
                  ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="夜視綠光監控"
            >
              NVG
            </button>
            <button
              onClick={() => setFilterMode('mono')}
              className={`px-1.5 py-0.5 rounded transition ${
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
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
              showMesh
                ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-black/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            MESH: {showMesh ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Target Lock Status Chip (Center Bottom of Feed) */}
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5">
          <div className="px-2 py-0.5 rounded bg-black/85 border border-slate-800 flex items-center gap-1.5 text-[10px] font-mono">
            {telemetry.isFacePresent ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
                <span className="text-emerald-400 font-bold">TARGET: ACQUIRED [99.8%]</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
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

        {/* Camera Permission or Init Error Fallback */}
        {(!isCameraActive || cameraError || modelLoadError) && isModelLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#06080e]/95 backdrop-blur-md z-30 p-6 text-center">
            <div className="w-10 h-10 rounded bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 mb-2.5">
              <VideoOff className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-100 mb-1 font-mono uppercase tracking-wider">
              [CCTV_FEED_DISCONNECTED]
            </h3>
            <p className="text-[11px] text-slate-400 max-w-sm mb-3 leading-relaxed font-mono">
              {cameraError || modelLoadError || '請點擊允許攝影機，或透過下方模擬器測試各項監控攔截功能。'}
            </p>
            <button
              onClick={onRetryCamera}
              className="px-3.5 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>ENGAGE_CAMERA</span>
            </button>
          </div>
        )}

        {/* Live Alert Overlays */}
        {telemetry.isYawning && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded bg-rose-600/90 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(244,63,94,0.8)] animate-cctv-glitch flex items-center gap-1.5 border border-rose-400">
            <span>🚨</span>
            <span>ALERT: YAWN_FATIGUE_INTERCEPT (-5 PTS)</span>
          </div>
        )}
        {telemetry.isFrowning && !telemetry.isYawning && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded bg-amber-500 text-slate-950 text-xs font-mono font-bold shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-cctv-glitch flex items-center gap-1.5 border border-amber-300">
            <span>😠</span>
            <span>WARN: BROW_STRESS_TENSION (-3 PTS)</span>
          </div>
        )}
      </div>

      {/* Streamlined Surveillance Telemetry Rack (Clean Data Rows) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        {/* MAR Ratio */}
        <div className="p-2.5 rounded bg-[#070a10] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-slate-300 font-bold">
              <Activity className="w-3 h-3 text-cyan-400" />
              MAR (嘴部張幅)
            </span>
            <span className="font-bold text-cyan-400">{telemetry.mar.toFixed(2)}</span>
          </div>
          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.mar > 0.48 ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.mar * 180)}%` }}
            />
          </div>
          <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
            <span>THRESHOLD: 0.48</span>
            <span className={telemetry.mar > 0.48 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {telemetry.mar > 0.48 ? '[CRITICAL]' : '[NORM]'}
            </span>
          </div>
        </div>

        {/* Frown Stress */}
        <div className="p-2.5 rounded bg-[#070a10] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-slate-300 font-bold">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              BROW (眉頭壓力)
            </span>
            <span className="font-bold text-amber-400">{telemetry.frown.toFixed(2)}</span>
          </div>
          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.frown > 0.45 ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-teal-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.frown * 180)}%` }}
            />
          </div>
          <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
            <span>THRESHOLD: 0.45</span>
            <span className={telemetry.frown > 0.45 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {telemetry.frown > 0.45 ? '[ELEVATED]' : '[CALM]'}
            </span>
          </div>
        </div>

        {/* Proximity */}
        <div className="p-2.5 rounded bg-[#070a10] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-slate-300 font-bold">
              <Eye className="w-3 h-3 text-cyan-400" />
              PROX (螢幕距離)
            </span>
            <span className="font-bold text-cyan-400">{telemetry.proximity}%</span>
          </div>
          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.proximity > 65 ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.proximity)}%` }}
            />
          </div>
          <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
            <span>LIMIT: &gt;65%</span>
            <span className={telemetry.proximity > 65 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {telemetry.proximity > 65 ? '[TOO_CLOSE]' : '[SAFE]'}
            </span>
          </div>
        </div>

        {/* Sedentary Clock */}
        <div className="p-2.5 rounded bg-[#070a10] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-slate-300 font-bold">
              <span className="text-xs">⏱️</span>
              SEDENTARY (久坐)
            </span>
            <span className="font-bold text-rose-400">{deskTimeStr}</span>
          </div>
          <div className="w-full bg-[#030508] h-1.5 rounded-sm overflow-hidden border border-slate-800">
            <div
              className="h-full bg-rose-500 transition-all duration-300 shadow-[0_0_6px_#f43f5e]"
              style={{ width: `${deskProgressPct}%` }}
            />
          </div>
          <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
            <span>LOCK: {sedentaryLimitMinutes}m</span>
            <span>{Math.round(deskProgressPct)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
