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
    <div className="flex flex-col gap-4">
      {/* Video Viewport Card */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-slate-950 rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl group flex items-center justify-center"
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
          className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
        />

        {/* Proximity / Distance Warning Border */}
        {telemetry.isTooClose && (
          <div className="absolute inset-0 border-4 border-amber-400/90 rounded-3xl pointer-events-none animate-pulse" />
        )}

        {/* Model Loading State */}
        {!isModelLoaded && !modelLoadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-20 p-6 text-center">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
            <div className="text-sm font-black text-slate-100 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>啟動 MediaPipe AI 視覺偵測引擎</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              正在載入本地 Face Landmarker 輕量神經網路模型，運算皆在用戶瀏覽器端完成，保護隱私。
            </p>
          </div>
        )}

        {/* Camera Permission or Init Error Fallback */}
        {(!isCameraActive || cameraError || modelLoadError) && isModelLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-20 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 mb-3 shadow-lg">
              <VideoOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-100 mb-1">未取得視訊鏡頭權限</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
              {cameraError || modelLoadError || '請點擊允許瀏覽器存取攝影機。若在特定框架中無法開啟，可使用下方「模擬測試列」完整體驗所有玩法！'}
            </p>
            <button
              onClick={onRetryCamera}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all transform active:scale-95 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>重試存取鏡頭</span>
            </button>
          </div>
        )}

        {/* Top-Left: Face Presence Indicator */}
        <div className="absolute top-4 left-4 z-10">
          <div className="px-3 py-1.5 rounded-full backdrop-blur-md bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs shadow-lg">
            {telemetry.isFacePresent ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  守護中・臉部鎖定
                </span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <UserX className="w-3.5 h-3.5" />
                  未偵測到人臉 (摸魚計時)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Top-Right: Quick Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={onToggleMesh}
            className={`px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-semibold border transition-all ${
              showMesh
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            骨架網格: {showMesh ? '開' : '關'}
          </button>
        </div>

        {/* Bottom Bar: Live Alert Highlights */}
        {telemetry.isYawning && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-rose-500/90 text-white text-xs font-black shadow-lg animate-bounce flex items-center gap-1.5">
            <span>🥱</span>
            <span>偵測到張大嘴哈欠中！</span>
          </div>
        )}
        {telemetry.isFrowning && !telemetry.isYawning && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-amber-500/90 text-slate-950 text-xs font-black shadow-lg animate-bounce flex items-center gap-1.5">
            <span>😠</span>
            <span>眉頭深鎖！怨念偵測！</span>
          </div>
        )}
      </div>

      {/* Realtime Biometric Telemetry Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* MAR */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              張嘴幅度 (MAR)
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {telemetry.mar.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.mar > 0.45 ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.mar * 180)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
            <span>哈欠門檻: &gt;0.48</span>
            <span>{telemetry.mar > 0.48 ? '哈欠中' : '正常'}</span>
          </div>
        </div>

        {/* Frown */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-cyan-400" />
              眉毛緊繃度
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {telemetry.frown.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.frown > 0.45 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.frown * 180)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
            <span>緊繃門檻: &gt;0.45</span>
            <span>{telemetry.frown > 0.45 ? '壓力高' : '平和'}</span>
          </div>
        </div>

        {/* Screen Proximity */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-amber-400" />
              螢幕貼近比
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {telemetry.proximity}%
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className={`h-full transition-all duration-75 ${
                telemetry.proximity > 65 ? 'bg-rose-500' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, telemetry.proximity)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
            <span>過近警示: &gt;65%</span>
            <span>{telemetry.proximity > 65 ? '太近了' : '安全距離'}</span>
          </div>
        </div>

        {/* Sedentary Timer */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1">
              <span className="text-xs">🪑</span>
              連續久坐計時
            </span>
            <span className="font-mono text-rose-400 font-bold">{deskTimeStr}</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className="h-full bg-rose-500 transition-all duration-300"
              style={{ width: `${deskProgressPct}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
            <span>警戒門檻: {sedentaryLimitMinutes} 分鐘</span>
            <span>{Math.round(deskProgressPct)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
