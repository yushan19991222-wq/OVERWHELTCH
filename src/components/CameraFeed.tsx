import React, { useRef, useEffect } from 'react';
import { Camera, Eye, VideoOff, Activity, ShieldAlert, Sparkles, UserCheck, UserX } from 'lucide-react';
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

  // Format desk time
  const deskMinutes = Math.floor(telemetry.consecutiveDeskSeconds / 60);
  const deskSeconds = Math.floor(telemetry.consecutiveDeskSeconds % 60);
  const deskTimeStr = `${String(deskMinutes).padStart(2, '0')}:${String(deskSeconds).padStart(2, '0')}`;

  const deskProgressPct = Math.min(
    100,
    (telemetry.consecutiveDeskSeconds / (sedentaryLimitMinutes * 60)) * 100
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Video Viewport Card with Hardware Reticle */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-[#070b12] rounded-xl overflow-hidden border border-slate-800 shadow-2xl group flex items-center justify-center hardware-reticle"
      >
        {/* Real Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
            isCameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Dynamic Canvas for Facial Mesh & Bounding Box */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100 z-10"
        />

        {/* Subtle Scanline Overlay */}
        <div className="absolute inset-0 scanline-overlay pointer-events-none z-10 opacity-30" />

        {/* Proximity / Distance Warning Border */}
        {telemetry.isTooClose && (
          <div className="absolute inset-0 border-4 border-amber-400/90 rounded-xl pointer-events-none animate-pulse z-20" />
        )}

        {/* Model Loading State */}
        {!isModelLoaded && !modelLoadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070b12]/95 backdrop-blur-md z-30 p-6 text-center font-mono">
            <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3" />
            <div className="text-xs font-bold text-cyan-300 mb-1 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>INITIALIZING_WASM_AI_CORE...</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
              正在載入本地 Face Landmarker 輕量神經網路模型 (Zero Remote Upload)。
            </p>
          </div>
        )}

        {/* Camera Permission or Init Error Fallback */}
        {(!isCameraActive || cameraError || modelLoadError) && isModelLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070b12]/95 backdrop-blur-md z-30 p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 mb-3 shadow-lg">
              <VideoOff className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-100 mb-1 font-mono uppercase tracking-wider">
              [CAMERA_INPUT_OFFLINE]
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed font-mono">
              {cameraError || modelLoadError || '請點擊允許瀏覽器存取攝影機。或使用下方「測試基準工作台 (TEST BENCH)」完整觸發所有功能！'}
            </p>
            <button
              onClick={onRetryCamera}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all transform active:scale-95 flex items-center gap-2 border border-cyan-300"
            >
              <Camera className="w-4 h-4" />
              <span>CONNECT_CAMERA</span>
            </button>
          </div>
        )}

        {/* Top-Left: Hardware Channel & Face Presence Indicator */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <div className="px-2.5 py-1 rounded bg-[#090d16]/90 border border-slate-800 flex items-center gap-2 text-xs font-mono shadow-md backdrop-blur-sm">
            <span className="text-[10px] text-slate-400 font-bold">CH-01</span>
            <span className="text-slate-600">|</span>
            {telemetry.isFacePresent ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                  <UserCheck className="w-3 h-3" />
                  FACE_LOCKED
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                  <UserX className="w-3 h-3" />
                  ABSENT (摸魚中)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Top-Right: Quick Controls */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            onClick={onToggleMesh}
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border transition-all ${
              showMesh
                ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                : 'bg-[#090d16]/90 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            MESH_LAYER: {showMesh ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Center Reticle Crosshair (subtle) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20 z-10">
          <div className="w-24 h-24 border border-dashed border-cyan-400/50 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-cyan-400/80 rounded-full" />
          </div>
        </div>

        {/* Bottom Bar: Live Alert Highlights */}
        {telemetry.isYawning && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded bg-rose-600/90 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse flex items-center gap-1.5 border border-rose-400">
            <span>🥱</span>
            <span>ALERT: YAWN_DETECTED (-5 PTS)</span>
          </div>
        )}
        {telemetry.isFrowning && !telemetry.isYawning && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded bg-amber-500 text-slate-950 text-xs font-mono font-bold shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse flex items-center gap-1.5 border border-amber-300">
            <span>😠</span>
            <span>WARN: BROW_STRESS_DETECTED (-3 PTS)</span>
          </div>
        )}
      </div>

      {/* Realtime Biometric Telemetry Gauges (Hardware Instrument Rack) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* MAR */}
        <div className="p-3 rounded-xl bg-[#0b101b] border border-slate-800/90 backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1 text-slate-300">
              <Activity className="w-3 h-3 text-emerald-400" />
              MAR_RATIO
            </span>
            <span className="font-mono text-emerald-400 font-bold text-xs">
              {telemetry.mar.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-[#06090f] h-2 rounded overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.mar > 0.48 ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
              }`}
              style={{ width: `${Math.min(100, telemetry.mar * 180)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1 flex justify-between">
            <span>LIMIT: &gt;0.48</span>
            <span className={telemetry.mar > 0.48 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {telemetry.mar > 0.48 ? 'TRIGGER' : 'NORMAL'}
            </span>
          </div>
        </div>

        {/* Frown */}
        <div className="p-3 rounded-xl bg-[#0b101b] border border-slate-800/90 backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldAlert className="w-3 h-3 text-cyan-400" />
              BROW_STRESS
            </span>
            <span className="font-mono text-cyan-400 font-bold text-xs">
              {telemetry.frown.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-[#06090f] h-2 rounded overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.frown > 0.45 ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-cyan-400 shadow-[0_0_6px_#06b6d4]'
              }`}
              style={{ width: `${Math.min(100, telemetry.frown * 180)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1 flex justify-between">
            <span>LIMIT: &gt;0.45</span>
            <span className={telemetry.frown > 0.45 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {telemetry.frown > 0.45 ? 'HIGH_TENSION' : 'CALM'}
            </span>
          </div>
        </div>

        {/* Screen Proximity */}
        <div className="p-3 rounded-xl bg-[#0b101b] border border-slate-800/90 backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1 text-slate-300">
              <Eye className="w-3 h-3 text-amber-400" />
              PROX_RATIO
            </span>
            <span className="font-mono text-amber-400 font-bold text-xs">
              {telemetry.proximity}%
            </span>
          </div>
          <div className="w-full bg-[#06090f] h-2 rounded overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.proximity > 65 ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
              }`}
              style={{ width: `${Math.min(100, telemetry.proximity)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1 flex justify-between">
            <span>LIMIT: &gt;65%</span>
            <span className={telemetry.proximity > 65 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {telemetry.proximity > 65 ? 'TOO_CLOSE' : 'SAFE'}
            </span>
          </div>
        </div>

        {/* Sedentary Timer */}
        <div className="p-3 rounded-xl bg-[#0b101b] border border-slate-800/90 backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="text-xs">🪑</span>
              SEDENTARY_CLK
            </span>
            <span className="font-mono text-rose-400 font-bold text-xs">{deskTimeStr}</span>
          </div>
          <div className="w-full bg-[#06090f] h-2 rounded overflow-hidden border border-slate-800">
            <div
              className="h-full bg-rose-500 transition-all duration-300 shadow-[0_0_6px_#f43f5e]"
              style={{ width: `${deskProgressPct}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1 flex justify-between">
            <span>WARN: {sedentaryLimitMinutes}m</span>
            <span>{Math.round(deskProgressPct)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
